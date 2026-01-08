import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Map dispatch codes to pipeline stages
function mapDispatchToStage(dispatchCode: string, dispatchText: string): string {
  const code = dispatchCode?.toUpperCase() || "";
  const text = (dispatchText || "").toLowerCase();
  
  if (code.startsWith("IPAS") || text.includes("deferido") || text.includes("deferimento")) {
    return "deferimento";
  }
  if (code.startsWith("INPI") && text.includes("indeferido") || text.includes("indeferimento")) {
    return "indeferimento";
  }
  if (text.includes("exigência") || text.includes("exigencia") || code.includes("IPAS103")) {
    return "003";
  }
  if (text.includes("oposição") || text.includes("oposicao")) {
    return "oposicao";
  }
  if (text.includes("certificado") || text.includes("concessão") || text.includes("registro")) {
    return "certificados";
  }
  if (text.includes("notificação") || text.includes("notificacao")) {
    return "notificacao_extrajudicial";
  }
  if (text.includes("renovação") || text.includes("renovacao") || text.includes("prorrogação")) {
    return "renovacao";
  }
  return "protocolado";
}

// Convert ArrayBuffer to base64 in chunks to avoid memory issues
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 32768;
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const rpiUploadId = formData.get("rpiUploadId") as string;
    const fileUrl = formData.get("fileUrl") as string;
    
    if (!rpiUploadId) {
      return new Response(
        JSON.stringify({ error: "rpiUploadId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update status to processing
    await supabase
      .from("rpi_uploads")
      .update({ status: "processing" })
      .eq("id", rpiUploadId);

    let base64: string;

    // If file URL is provided, download from storage
    if (fileUrl) {
      console.log("Downloading PDF from storage URL...");
      
      const pdfResponse = await fetch(fileUrl);
      if (!pdfResponse.ok) {
        throw new Error("Failed to download PDF from storage");
      }
      
      const pdfBuffer = await pdfResponse.arrayBuffer();
      
      if (pdfBuffer.byteLength > MAX_FILE_SIZE) {
        await supabase
          .from("rpi_uploads")
          .update({ status: "error", summary: `Arquivo muito grande (${Math.round(pdfBuffer.byteLength / 1024 / 1024)}MB). Máximo: 5MB` })
          .eq("id", rpiUploadId);
        
        return new Response(
          JSON.stringify({ error: "File too large. Maximum size is 5MB" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      base64 = arrayBufferToBase64(pdfBuffer);
    } else if (file) {
      console.log("Processing uploaded file...");
      
      if (file.size > MAX_FILE_SIZE) {
        await supabase
          .from("rpi_uploads")
          .update({ status: "error", summary: `Arquivo muito grande (${Math.round(file.size / 1024 / 1024)}MB). Máximo: 5MB` })
          .eq("id", rpiUploadId);
        
        return new Response(
          JSON.stringify({ error: "File too large. Maximum size is 5MB" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const arrayBuffer = await file.arrayBuffer();
      base64 = arrayBufferToBase64(arrayBuffer);
    } else {
      return new Response(
        JSON.stringify({ error: "Either file or fileUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending PDF to AI for analysis...");

    // Call Lovable AI to extract data from RPI PDF
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em análise de Revistas da Propriedade Industrial (RPI) do INPI brasileiro. 
Extraia TODOS os processos de MARCAS onde o procurador seja "${ATTORNEY_NAME}" ou variações próximas.

IMPORTANTE:
- Extraia APENAS processos de MARCAS
- Procure variações do nome: Davilys Danques Oliveira Cunha, Davilys Danques de Oliveira Cunha, etc.

Para cada processo, extraia:
1. Número do processo
2. Nome da marca
3. Classe(s) NCL
4. Código do despacho
5. Tipo/descrição do despacho
6. Nome do titular
7. Data da publicação

Retorne JSON estruturado.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analise este PDF da RPI e extraia processos de MARCAS do procurador "${ATTORNEY_NAME}".

Retorne APENAS JSON válido:
{
  "rpi_number": "número da RPI",
  "rpi_date": "YYYY-MM-DD",
  "total_brand_processes": número,
  "attorney_processes": [
    {
      "process_number": "número",
      "brand_name": "marca",
      "ncl_classes": ["35"],
      "dispatch_code": "código",
      "dispatch_type": "tipo",
      "dispatch_text": "texto",
      "holder_name": "titular",
      "publication_date": "YYYY-MM-DD"
    }
  ],
  "summary": "resumo"
}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 8000,
      }),
    });

    // Free memory
    base64 = "";

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      
      await supabase
        .from("rpi_uploads")
        .update({ status: "error", summary: "Erro ao processar PDF com IA" })
        .eq("id", rpiUploadId);
      
      return new Response(
        JSON.stringify({ error: "Failed to analyze PDF" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || "";
    
    console.log("AI Response received, parsing...");

    // Extract JSON from response
    let extractedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      
      await supabase
        .from("rpi_uploads")
        .update({ status: "error", summary: "Erro ao interpretar resposta da IA" })
        .eq("id", rpiUploadId);
      
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", details: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const attorneyProcesses = extractedData.attorney_processes || [];
    
    // Fetch existing clients and processes for matching
    const { data: existingProcesses } = await supabase
      .from("brand_processes")
      .select("id, process_number, brand_name, user_id, status, pipeline_stage");

    // Match entries with existing clients
    const matchedEntries = attorneyProcesses.map((entry: any) => {
      let matchedClientId = null;
      let matchedProcessId = null;
      
      if (entry.process_number && existingProcesses) {
        const processMatch = existingProcesses.find(
          p => p.process_number === entry.process_number?.replace(/\D/g, '')
        );
        if (processMatch) {
          matchedProcessId = processMatch.id;
          matchedClientId = processMatch.user_id;
        }
      }
      
      if (!matchedClientId && entry.brand_name && existingProcesses) {
        const brandMatch = existingProcesses.find(
          p => normalizeString(p.brand_name) === normalizeString(entry.brand_name)
        );
        if (brandMatch) {
          matchedProcessId = brandMatch.id;
          matchedClientId = brandMatch.user_id;
        }
      }

      return {
        rpi_upload_id: rpiUploadId,
        process_number: entry.process_number?.replace(/\D/g, '') || "",
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

    // Insert entries
    if (matchedEntries.length > 0) {
      const { error: insertError } = await supabase
        .from("rpi_entries")
        .insert(matchedEntries);
      
      if (insertError) {
        console.error("Insert error:", insertError);
      }
    }

    const matchedCount = matchedEntries.filter((e: any) => e.matched_client_id).length;

    // Update RPI upload with results
    await supabase
      .from("rpi_uploads")
      .update({
        status: "completed",
        rpi_number: extractedData.rpi_number || null,
        rpi_date: extractedData.rpi_date || null,
        total_processes_found: attorneyProcesses.length,
        total_clients_matched: matchedCount,
        summary: extractedData.summary || `Encontrados ${attorneyProcesses.length} processos do procurador ${ATTORNEY_NAME}, ${matchedCount} correspondem a clientes WebMarcas.`,
        processed_at: new Date().toISOString(),
      })
      .eq("id", rpiUploadId);

    return new Response(
      JSON.stringify({
        success: true,
        rpi_number: extractedData.rpi_number,
        rpi_date: extractedData.rpi_date,
        total_processes: attorneyProcesses.length,
        matched_clients: matchedCount,
        summary: extractedData.summary,
        entries: matchedEntries,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Process RPI error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
