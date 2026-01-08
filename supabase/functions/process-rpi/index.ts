import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ATTORNEY_NAME = "Davilys Danques Oliveira Cunha";
const ATTORNEY_VARIATIONS = [
  "davilys danques oliveira cunha",
  "davilys danques de oliveira cunha",
  "d. d. oliveira cunha",
  "d d oliveira cunha",
  "cunha, davilys danques de oliveira",
  "cunha, davilys danques oliveira",
  "davilys d. oliveira cunha",
  "davilys d oliveira cunha",
];

function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\n+/g, " ")
    .trim();
}

function containsAttorney(text: string): boolean {
  const normalized = normalizeText(text);
  return ATTORNEY_VARIATIONS.some(variation => normalized.includes(normalizeText(variation)));
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

async function extractTextFromXml(bytes: Uint8Array): Promise<string> {
  return new TextDecoder().decode(bytes);
}

async function extractTextFromExcel(bytes: Uint8Array): Promise<string> {
  const wb = XLSX.read(bytes, { type: "array" });
  const parts: string[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(ws);
    parts.push(`\n\n--- PLANILHA: ${sheetName} ---\n${csv}`);
  }

  return parts.join("\n");
}

function extractAttorneyBlocks(text: string): string[] {
  const blocks: string[] = [];
  const normalized = normalizeText(text);
  
  for (const variation of ATTORNEY_VARIATIONS) {
    const normalizedVar = normalizeText(variation);
    let idx = 0;
    
    while ((idx = normalized.indexOf(normalizedVar, idx)) !== -1) {
      // Capturar contexto amplo ao redor do nome (5000 chars antes e depois)
      const start = Math.max(0, idx - 5000);
      const end = Math.min(text.length, idx + normalizedVar.length + 5000);
      const block = text.slice(start, end);
      
      if (!blocks.some(b => b.includes(block.slice(100, 200)))) {
        blocks.push(block);
      }
      idx += normalizedVar.length;
    }
  }
  
  return blocks;
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

async function aiExtractFromBlocks(args: {
  apiKey: string;
  blocks: string[];
}): Promise<AttorneyProcess[]> {
  const { apiKey, blocks } = args;
  
  if (blocks.length === 0) return [];
  
  const combinedText = blocks.join("\n\n---BLOCO---\n\n");

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
          content: `Você é um especialista em análise da Revista da Propriedade Industrial (RPI) do INPI.
Sua tarefa é extrair APENAS processos de MARCAS onde o procurador seja "${ATTORNEY_NAME}" ou variações próximas.

REGRAS IMPORTANTES:
1. APENAS processos de MARCAS (ignorar patentes, desenhos industriais, indicações geográficas)
2. O procurador deve ser EXATAMENTE "${ATTORNEY_NAME}" ou variação direta do nome
3. Extraia TODOS os dados disponíveis de cada processo
4. Retorne APENAS JSON válido, sem markdown`,
        },
        {
          role: "user",
          content: `Analise os blocos de texto abaixo que contêm menções ao procurador.
Para cada processo de MARCA encontrado, extraia:
- Número do processo (apenas dígitos)
- Nome da marca
- Classes NCL
- Código do despacho
- Tipo do despacho
- Texto do despacho (resumido)
- Nome do titular
- Data da publicação

Retorne APENAS JSON no formato:
{"attorney_processes":[{"process_number":"...","brand_name":"...","ncl_classes":["35"],"dispatch_code":"...","dispatch_type":"...","dispatch_text":"...","holder_name":"...","publication_date":"YYYY-MM-DD"}]}

Se não encontrar processos de MARCA válidos, retorne: {"attorney_processes":[]}

BLOCOS DE TEXTO:\n${combinedText}`,
        },
      ],
      max_tokens: 8000,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    console.error("AI blocks error:", resp.status, t);
    throw new Error(`AI error ${resp.status}`);
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

async function aiExtractFromPdf(args: {
  apiKey: string;
  pdfUrl: string;
}): Promise<{ processes: AttorneyProcess[]; ocrUsed: boolean; searchable: boolean; error?: string }> {
  const { apiKey, pdfUrl } = args;

  // Primeira chamada: Análise completa do PDF com OCR se necessário
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro", // Usar Pro para melhor OCR e análise de PDFs grandes
      messages: [
        {
          role: "system",
          content: `Você é um especialista em análise da Revista da Propriedade Industrial (RPI) do INPI.

MISSÃO CRÍTICA:
1. Analisar o documento PDF completo (pode ser texto ou imagem/escaneado)
2. Se o PDF for imagem, aplicar OCR automaticamente
3. Procurar TODAS as ocorrências do procurador "${ATTORNEY_NAME}" (e variações: "Davilys Danques de Oliveira Cunha", "D. D. Oliveira Cunha")
4. Extrair APENAS processos de MARCAS (ignorar patentes, desenhos, indicações geográficas)
5. Para cada processo encontrado, extrair dados completos

VARIAÇÕES DO NOME A BUSCAR:
- Davilys Danques Oliveira Cunha
- Davilys Danques de Oliveira Cunha  
- D. D. Oliveira Cunha
- Cunha, Davilys Danques de Oliveira

IMPORTANTE: Faça varredura página por página. Não falhe silenciosamente.`,
        },
        {
          role: "user",
          content: [
            {
              type: "file",
              file: { url: pdfUrl },
            },
            {
              type: "text",
              text: `Analise COMPLETAMENTE este documento da Revista da Propriedade Industrial (RPI).

INSTRUÇÕES OBRIGATÓRIAS:
1. Se o PDF não tiver texto selecionável, aplique OCR em cada página
2. Varra TODAS as páginas procurando o procurador "${ATTORNEY_NAME}"
3. Considere variações do nome (com/sem "de", abreviações)
4. Extraia APENAS processos de MARCAS
5. Ignore patentes, desenhos industriais, indicações geográficas

Para cada processo de MARCA encontrado com este procurador, retorne:
- process_number: apenas números
- brand_name: nome da marca
- ncl_classes: array de classes (ex: ["35", "42"])
- dispatch_code: código do despacho (ex: "IPAS027")
- dispatch_type: tipo (ex: "Deferimento", "Indeferimento", "Exigência")
- dispatch_text: texto resumido do despacho
- holder_name: nome do titular
- publication_date: data no formato YYYY-MM-DD

RESPONDA EXATAMENTE NESTE FORMATO JSON:
{
  "metadata": {
    "ocr_used": true/false,
    "searchable_pdf": true/false,
    "total_pages_analyzed": número,
    "attorney_mentions_found": número
  },
  "attorney_processes": [
    {
      "process_number": "...",
      "brand_name": "...",
      "ncl_classes": ["..."],
      "dispatch_code": "...",
      "dispatch_type": "...",
      "dispatch_text": "...",
      "holder_name": "...",
      "publication_date": "..."
    }
  ]
}

Se NÃO encontrar nenhum processo, retorne:
{
  "metadata": {
    "ocr_used": true/false,
    "searchable_pdf": true/false,
    "total_pages_analyzed": número,
    "attorney_mentions_found": 0
  },
  "attorney_processes": [],
  "message": "Nenhum processo de MARCA do procurador ${ATTORNEY_NAME} foi encontrado nesta edição."
}`,
            },
          ],
        },
      ],
      max_tokens: 16000,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    console.error("AI PDF error:", resp.status, t);
    
    if (resp.status === 429) {
      return { processes: [], ocrUsed: false, searchable: false, error: "rate_limit" };
    }
    if (resp.status === 402) {
      return { processes: [], ocrUsed: false, searchable: false, error: "payment_required" };
    }
    
    return { processes: [], ocrUsed: false, searchable: false, error: `ai_error_${resp.status}` };
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "";
  console.log("AI PDF response length:", content.length);
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.log("No JSON found in response");
    return { processes: [], ocrUsed: false, searchable: false };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const meta = parsed.metadata || {};
    const arr = parsed.attorney_processes;
    
    return {
      processes: Array.isArray(arr) ? arr : [],
      ocrUsed: meta.ocr_used || false,
      searchable: meta.searchable_pdf || false,
    };
  } catch (e) {
    console.error("JSON parse error:", e);
    return { processes: [], ocrUsed: false, searchable: false };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { rpiUploadId, fileUrl } = await req.json();

    if (!rpiUploadId || !fileUrl) {
      return new Response(JSON.stringify({ error: "rpiUploadId and fileUrl são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("rpi_uploads").update({ status: "processing" }).eq("id", rpiUploadId);

    const ext = guessExtFromUrl(fileUrl);
    let collected: AttorneyProcess[] = [];
    let processingDetails = {
      format: ext || "unknown",
      ocrUsed: false,
      searchablePdf: true,
      blocksFound: 0,
    };

    console.log(`Processing file with extension: ${ext}`);

    if (ext === "pdf") {
      // ==========================================
      // PROCESSAMENTO DE PDF (COM OCR SE NECESSÁRIO)
      // ==========================================
      console.log("Starting PDF analysis with AI (OCR if needed)...");
      
      const result = await aiExtractFromPdf({ apiKey: LOVABLE_API_KEY, pdfUrl: fileUrl });
      
      if (result.error === "rate_limit") {
        await supabase.from("rpi_uploads").update({
          status: "error",
          summary: "Limite de requisições excedido. Aguarde alguns minutos e tente novamente.",
        }).eq("id", rpiUploadId);
        
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (result.error === "payment_required") {
        await supabase.from("rpi_uploads").update({
          status: "error", 
          summary: "Créditos de IA esgotados. Adicione créditos para continuar.",
        }).eq("id", rpiUploadId);
        
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      collected = result.processes;
      processingDetails.ocrUsed = result.ocrUsed;
      processingDetails.searchablePdf = result.searchable;
      
      console.log(`PDF analysis complete. Found ${collected.length} processes. OCR: ${result.ocrUsed}`);
      
    } else {
      // ==========================================
      // PROCESSAMENTO DE XML / EXCEL
      // ==========================================
      const fileResp = await fetch(fileUrl);
      if (!fileResp.ok) {
        await supabase.from("rpi_uploads").update({
          status: "error",
          summary: "Erro ao baixar o arquivo. Verifique se o upload foi concluído corretamente.",
        }).eq("id", rpiUploadId);

        return new Response(JSON.stringify({ error: "Failed to download file" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const bytes = new Uint8Array(await fileResp.arrayBuffer());
      let fullText = "";

      if (ext === "xml") {
        console.log("Processing XML file...");
        fullText = await extractTextFromXml(bytes);
        processingDetails.format = "xml";
      } else if (ext === "xlsx" || ext === "xls") {
        console.log("Processing Excel file...");
        fullText = await extractTextFromExcel(bytes);
        processingDetails.format = "excel";
      } else {
        await supabase.from("rpi_uploads").update({
          status: "error",
          summary: `Formato não suportado: ${ext || "desconhecido"}. Envie PDF, XML, XLSX ou XLS.`,
        }).eq("id", rpiUploadId);

        return new Response(JSON.stringify({ error: "Unsupported file format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Text extracted: ${fullText.length} characters`);

      // Verificar se contém o nome do procurador
      if (!containsAttorney(fullText)) {
        console.log("Attorney name not found in document");
        
        await supabase.from("rpi_uploads").update({
          status: "completed",
          total_processes_found: 0,
          total_clients_matched: 0,
          summary: `Nenhum processo do procurador ${ATTORNEY_NAME} foi localizado nesta edição da Revista do INPI. O documento foi lido com sucesso (${processingDetails.format.toUpperCase()}, ${fullText.length.toLocaleString()} caracteres), mas não há publicações para este procurador.`,
          processed_at: new Date().toISOString(),
        }).eq("id", rpiUploadId);

        return new Response(JSON.stringify({
          success: true,
          total_processes: 0,
          matched_clients: 0,
          processing_details: processingDetails,
          summary: `Nenhum processo do procurador ${ATTORNEY_NAME} foi localizado nesta edição da Revista do INPI.`,
          entries: [],
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Extrair blocos que contêm o nome do procurador
      const blocks = extractAttorneyBlocks(fullText);
      processingDetails.blocksFound = blocks.length;
      console.log(`Found ${blocks.length} blocks containing attorney name`);

      if (blocks.length > 0) {
        // Processar em lotes de 10 blocos
        const batchSize = 10;
        for (let i = 0; i < blocks.length; i += batchSize) {
          const batch = blocks.slice(i, i + batchSize);
          console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(blocks.length/batchSize)}`);
          
          try {
            const found = await aiExtractFromBlocks({ apiKey: LOVABLE_API_KEY, blocks: batch });
            collected.push(...found);
          } catch (e) {
            console.error("Batch processing error:", e);
          }
        }
      }
    }

    // ==========================================
    // DEDUPLICAÇÃO E MATCH COM CLIENTES
    // ==========================================
    const byProcess = new Map<string, AttorneyProcess>();
    for (const p of collected) {
      const clean = (p.process_number || "").toString().replace(/\D/g, "");
      if (!clean) continue;
      if (!byProcess.has(clean)) {
        byProcess.set(clean, { ...p, process_number: clean });
      }
    }

    const attorneyProcesses = Array.from(byProcess.values());
    console.log(`Unique processes found: ${attorneyProcesses.length}`);

    // Match com processos existentes
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
          (p) => normalizeText(p.brand_name) === normalizeText(entry.brand_name || "")
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

    // Inserir no banco
    if (matchedEntries.length > 0) {
      const { error: insertError } = await supabase.from("rpi_entries").insert(matchedEntries);
      if (insertError) console.error("Insert error:", insertError);
    }

    const matchedCount = matchedEntries.filter((e) => e.matched_client_id).length;

    // Gerar summary detalhado
    let summary = "";
    if (matchedEntries.length === 0) {
      summary = `Nenhum processo do procurador ${ATTORNEY_NAME} foi localizado nesta edição da Revista do INPI. `;
      summary += `Formato: ${processingDetails.format.toUpperCase()}. `;
      if (processingDetails.ocrUsed) {
        summary += "OCR foi aplicado para leitura do documento. ";
      }
    } else {
      summary = `Encontrados ${matchedEntries.length} processo(s) do procurador ${ATTORNEY_NAME}. `;
      summary += `${matchedCount} correspondem a clientes cadastrados. `;
      summary += `Formato: ${processingDetails.format.toUpperCase()}. `;
      if (processingDetails.ocrUsed) {
        summary += "OCR foi utilizado para leitura. ";
      }
    }

    await supabase.from("rpi_uploads").update({
      status: "completed",
      total_processes_found: matchedEntries.length,
      total_clients_matched: matchedCount,
      summary,
      processed_at: new Date().toISOString(),
    }).eq("id", rpiUploadId);

    return new Response(JSON.stringify({
      success: true,
      total_processes: matchedEntries.length,
      matched_clients: matchedCount,
      processing_details: processingDetails,
      summary,
      entries: matchedEntries,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Process RPI error:", error);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Tentar atualizar o status de erro
    try {
      const body = await new Response(req.clone().body).json().catch(() => ({}));
      if (body.rpiUploadId) {
        await supabase.from("rpi_uploads").update({
          status: "error",
          summary: `Erro durante o processamento: ${error instanceof Error ? error.message : "Erro desconhecido"}. Verifique se o arquivo está corrompido ou se o formato está correto.`,
        }).eq("id", body.rpiUploadId);
      }
    } catch {}
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido",
      details: "O arquivo foi recebido, mas não foi possível processá-lo. Verifique se o formato está correto (PDF, XML, XLSX ou XLS)."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
