import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as pdfjsLib from "https://esm.sh/pdfjs-dist@4.0.379/legacy/build/pdf.mjs";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ATTORNEY_NAME = "Davilys Danques Oliveira Cunha";
const ATTORNEY_VARIATIONS = [
  "davilys danques oliveira cunha",
  "davilys danques de oliveira cunha",
  "davilys d. oliveira cunha",
  "davilys d oliveira cunha",
];

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function guessExtFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const pathname = u.pathname;
    const last = pathname.split("/").pop() || "";
    const ext = last.includes(".") ? last.split(".").pop() : null;
    return ext?.toLowerCase() || null;
  } catch {
    return null;
  }
}

function splitIntoChunks(text: string, maxChars: number): string[] {
  if (!text) return [];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) chunks.push(text.slice(i, i + maxChars));
  return chunks;
}

async function extractTextFromPdf(pdfBytes: Uint8Array): Promise<string> {
  // Using legacy build + disable worker (Edge environment)
  const loadingTask = (pdfjsLib as any).getDocument({ data: pdfBytes, disableWorker: true } as any);
  const pdf = await loadingTask.promise;

  let out = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items
      .map((it: any) => (typeof it.str === "string" ? it.str : ""))
      .filter(Boolean);
    out += `\n\n--- PÁGINA ${pageNum} ---\n` + strings.join(" ");
  }

  return out;
}

async function extractTextFromXml(bytes: Uint8Array): Promise<string> {
  return new TextDecoder().decode(bytes);
}

async function extractTextFromExcel(bytes: Uint8Array): Promise<string> {
  const wb = XLSX.read(bytes, { type: "array" });
  const parts: string[] = [];

  for (const sheetName of wb.SheetNames.slice(0, 5)) {
    const ws = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(ws);
    parts.push(`\n\n--- PLANILHA: ${sheetName} ---\n${csv}`);
  }

  return parts.join("\n");
}

type AttorneyProcess = {
  process_number: string;
  brand_name?: string;
  ncl_classes?: string[];
  dispatch_code?: string;
  dispatch_type?: string;
  dispatch_text?: string;
  holder_name?: string;
  publication_date?: string;
};

async function aiExtractFromChunk(args: {
  apiKey: string;
  chunk: string;
}): Promise<AttorneyProcess[]> {
  const { apiKey, chunk } = args;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Você é um especialista em RPI do INPI (MARCAS). Extraia processos onde o procurador seja "${ATTORNEY_NAME}" (incluindo variações próximas) e retorne somente JSON válido.`,
        },
        {
          role: "user",
          content: `Texto (parte do documento) abaixo. Encontre processos de MARCAS cujo procurador seja ${ATTORNEY_NAME} ou variações.

Retorne APENAS JSON no formato:
{"attorney_processes":[{"process_number":"...","brand_name":"...","ncl_classes":["35"],"dispatch_code":"...","dispatch_type":"...","dispatch_text":"...","holder_name":"...","publication_date":"YYYY-MM-DD"}]}

TEXTO:\n${chunk}`,
        },
      ],
      max_tokens: 4000,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    const err = new Error(`AI error ${resp.status}: ${t}`);
    // @ts-ignore
    err.status = resp.status;
    throw err;
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const arr = parsed.attorney_processes;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { rpiUploadId, fileUrl } = await req.json();

    if (!rpiUploadId || !fileUrl) {
      return new Response(JSON.stringify({ error: "rpiUploadId and fileUrl are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("rpi_uploads").update({ status: "processing" }).eq("id", rpiUploadId);

    // Download file bytes from signed URL
    const fileResp = await fetch(fileUrl);
    if (!fileResp.ok) {
      await supabase
        .from("rpi_uploads")
        .update({ status: "error", summary: "Não foi possível baixar o arquivo do storage." })
        .eq("id", rpiUploadId);

      return new Response(JSON.stringify({ error: "Failed to download file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bytes = new Uint8Array(await fileResp.arrayBuffer());
    const ext = guessExtFromUrl(fileUrl);

    let fullText = "";
    if (ext === "pdf") {
      console.log("Extracting text from PDF...");
      fullText = await extractTextFromPdf(bytes);
    } else if (ext === "xml") {
      console.log("Reading XML...");
      fullText = await extractTextFromXml(bytes);
    } else if (ext === "xlsx" || ext === "xls") {
      console.log("Reading Excel...");
      fullText = await extractTextFromExcel(bytes);
    } else {
      await supabase
        .from("rpi_uploads")
        .update({ status: "error", summary: "Formato não suportado. Envie PDF, XML, XLSX ou XLS." })
        .eq("id", rpiUploadId);

      return new Response(JSON.stringify({ error: "Unsupported file format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Chunk text to avoid huge single AI requests
    const chunks = splitIntoChunks(fullText, 80_000);
    console.log(`Text extracted. Chunks: ${chunks.length}`);

    const collected: AttorneyProcess[] = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`AI chunk ${i + 1}/${chunks.length}`);
      try {
        const found = await aiExtractFromChunk({ apiKey: LOVABLE_API_KEY, chunk: chunks[i] });
        collected.push(...found);
      } catch (e) {
        const status = (e as any)?.status;
        if (status === 429) {
          await supabase
            .from("rpi_uploads")
            .update({ status: "error", summary: "Limite de requisições excedido. Tente novamente em alguns minutos." })
            .eq("id", rpiUploadId);
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.error("AI chunk error:", e);
        // continue processing other chunks
      }
    }

    // Deduplicate by process_number
    const byProcess = new Map<string, AttorneyProcess>();
    for (const p of collected) {
      const clean = (p.process_number || "").toString().replace(/\D/g, "");
      if (!clean) continue;
      if (!byProcess.has(clean)) byProcess.set(clean, { ...p, process_number: clean });
    }

    const attorneyProcesses = Array.from(byProcess.values());

    // Match with existing processes
    const { data: existingProcesses } = await supabase
      .from("brand_processes")
      .select("id, process_number, brand_name, user_id");

    const matchedEntries = attorneyProcesses.map((entry) => {
      let matchedClientId: string | null = null;
      let matchedProcessId: string | null = null;

      const cleanProcessNumber = entry.process_number?.toString().replace(/\D/g, "");

      if (cleanProcessNumber && existingProcesses) {
        const processMatch = existingProcesses.find((p) => p.process_number === cleanProcessNumber);
        if (processMatch) {
          matchedProcessId = processMatch.id;
          matchedClientId = processMatch.user_id;
        }
      }

      if (!matchedClientId && entry.brand_name && existingProcesses) {
        const brandMatch = existingProcesses.find(
          (p) => normalizeString(p.brand_name) === normalizeString(entry.brand_name || "")
        );
        if (brandMatch) {
          matchedProcessId = brandMatch.id;
          matchedClientId = brandMatch.user_id;
        }
      }

      return {
        rpi_upload_id: rpiUploadId,
        process_number: cleanProcessNumber || "",
        brand_name: entry.brand_name || "",
        ncl_classes: entry.ncl_classes || [],
        dispatch_type: entry.dispatch_type || "",
        dispatch_code: entry.dispatch_code || "",
        dispatch_text: entry.dispatch_text || "",
        publication_date: entry.publication_date || null,
        holder_name: entry.holder_name || "",
        attorney_name: ATTORNEY_NAME,
        matched_client_id: matchedClientId,
        matched_process_id: matchedProcessId,
        update_status: "pending",
      };
    });

    if (matchedEntries.length > 0) {
      const { error: insertError } = await supabase.from("rpi_entries").insert(matchedEntries);
      if (insertError) console.error("Insert error:", insertError);
    }

    const matchedCount = matchedEntries.filter((e: any) => e.matched_client_id).length;

    await supabase
      .from("rpi_uploads")
      .update({
        status: "completed",
        total_processes_found: matchedEntries.length,
        total_clients_matched: matchedCount,
        summary:
          matchedEntries.length === 0
            ? `Nenhum processo do procurador ${ATTORNEY_NAME} foi encontrado neste arquivo.`
            : `Encontrados ${matchedEntries.length} processos do procurador ${ATTORNEY_NAME}, ${matchedCount} correspondem a clientes.`,
        processed_at: new Date().toISOString(),
      })
      .eq("id", rpiUploadId);

    return new Response(
      JSON.stringify({
        success: true,
        total_processes: matchedEntries.length,
        matched_clients: matchedCount,
        summary:
          matchedEntries.length === 0
            ? `Nenhum processo do procurador ${ATTORNEY_NAME} foi encontrado neste arquivo.`
            : `Encontrados ${matchedEntries.length} processos do procurador ${ATTORNEY_NAME}, ${matchedCount} correspondem a clientes.`,
        entries: matchedEntries,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process RPI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
