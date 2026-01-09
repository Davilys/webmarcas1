import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import JSZip from 'https://esm.sh/jszip@3.10.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ATTORNEY_NAME = 'Davilys Danques Oliveira Cunha';
const ATTORNEY_VARIATIONS = [
  'davilys danques oliveira cunha',
  'davilys danques',
  'davilys d. oliveira cunha',
  'davilys d oliveira cunha',
  'davilys oliveira cunha',
  'd. danques oliveira cunha',
  'davilys danques o. cunha',
];

function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function containsAttorney(text: string): boolean {
  const normalized = normalizeText(text);
  return ATTORNEY_VARIATIONS.some(variation => normalized.includes(normalizeText(variation)));
}

// Calculate the latest RPI number based on current date
// RPI is published every Tuesday. First RPI of 2024 was #2766 on Jan 2, 2024
function calculateLatestRpiNumber(): number {
  const referenceDate = new Date('2024-01-02'); // RPI 2766
  const referenceNumber = 2766;
  const today = new Date();
  
  // Calculate weeks since reference date
  const diffTime = today.getTime() - referenceDate.getTime();
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  
  return referenceNumber + diffWeeks;
}

// Get the last few RPI numbers
function getRecentRpiNumbers(count: number = 10): number[] {
  const latest = calculateLatestRpiNumber();
  return Array.from({ length: count }, (_, i) => latest - i);
}

interface ExtractedProcess {
  processNumber: string;
  brandName: string | null;
  holderName: string | null;
  attorneyName: string | null;
  nclClasses: string[];
  dispatchCode: string | null;
  dispatchText: string | null;
  dispatchType: string | null;
  publicationDate: string | null;
}

// Parse XML content to extract processes
function parseRpiXml(xmlContent: string): ExtractedProcess[] {
  const processes: ExtractedProcess[] = [];
  
  // Find all process blocks - looking for <processo> or <despacho> tags
  const processRegex = /<processo[^>]*>([\s\S]*?)<\/processo>/gi;
  const despachoRegex = /<despacho[^>]*>([\s\S]*?)<\/despacho>/gi;
  
  // Extract value from XML tag
  const extractTag = (xml: string, tagName: string): string | null => {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  };
  
  // Try to find processes in different XML structures
  let matches = xmlContent.match(processRegex) || [];
  
  // Also try alternative structures
  if (matches.length === 0) {
    // Try looking for marca tags
    const marcaRegex = /<marca[^>]*>([\s\S]*?)<\/marca>/gi;
    matches = xmlContent.match(marcaRegex) || [];
  }
  
  // If still no matches, try to parse the entire content looking for number patterns
  if (matches.length === 0) {
    // Extract blocks that contain process numbers and attorney name
    const blocks = xmlContent.split(/(?=<[^>]+numero|<processo|<pedido)/gi);
    for (const block of blocks) {
      if (containsAttorney(block)) {
        // Try to extract process number
        const numMatch = block.match(/(?:numero|processo|pedido)[^>]*>?\s*(\d{9,12})/i);
        if (numMatch) {
          processes.push({
            processNumber: numMatch[1],
            brandName: extractTag(block, 'nome') || extractTag(block, 'marca') || extractTag(block, 'denominacao'),
            holderName: extractTag(block, 'titular') || extractTag(block, 'requerente') || extractTag(block, 'depositante'),
            attorneyName: extractTag(block, 'procurador') || extractTag(block, 'representante'),
            nclClasses: (extractTag(block, 'classe') || extractTag(block, 'ncl') || '').split(/[,\s]+/).filter(Boolean),
            dispatchCode: extractTag(block, 'codigo') || extractTag(block, 'cod_despacho'),
            dispatchText: extractTag(block, 'texto') || extractTag(block, 'despacho') || extractTag(block, 'descricao'),
            dispatchType: extractTag(block, 'tipo') || extractTag(block, 'natureza'),
            publicationDate: extractTag(block, 'data') || extractTag(block, 'publicacao'),
          });
        }
      }
    }
  }
  
  // Process each match
  for (const match of matches) {
    // Check if this process belongs to our attorney
    if (!containsAttorney(match)) continue;
    
    const processNumber = extractTag(match, 'numero') || extractTag(match, 'processo') || extractTag(match, 'pedido');
    if (!processNumber) continue;
    
    processes.push({
      processNumber: processNumber.replace(/\D/g, ''),
      brandName: extractTag(match, 'nome') || extractTag(match, 'marca') || extractTag(match, 'denominacao'),
      holderName: extractTag(match, 'titular') || extractTag(match, 'requerente') || extractTag(match, 'depositante'),
      attorneyName: extractTag(match, 'procurador') || extractTag(match, 'representante'),
      nclClasses: (extractTag(match, 'classe') || extractTag(match, 'ncl') || '').split(/[,\s]+/).filter(Boolean),
      dispatchCode: extractTag(match, 'codigo') || extractTag(match, 'cod_despacho'),
      dispatchText: extractTag(match, 'texto') || extractTag(match, 'despacho') || extractTag(match, 'descricao'),
      dispatchType: extractTag(match, 'tipo') || extractTag(match, 'natureza'),
      publicationDate: extractTag(match, 'data') || extractTag(match, 'publicacao'),
    });
  }
  
  return processes;
}

// Determine dispatch type from code/text
function determineDispatchType(code: string | null, text: string | null): string {
  const combined = `${code || ''} ${text || ''}`.toLowerCase();
  
  if (combined.includes('deferimento') || combined.includes('deferido')) return 'Deferimento';
  if (combined.includes('indeferimento') || combined.includes('indeferido')) return 'Indeferimento';
  if (combined.includes('exigência') || combined.includes('exigencia')) return 'Exigência';
  if (combined.includes('oposição') || combined.includes('oposicao')) return 'Oposição';
  if (combined.includes('certificado') || combined.includes('registro')) return 'Certificado';
  if (combined.includes('recurso')) return 'Recurso';
  if (combined.includes('arquivamento') || combined.includes('arquivado')) return 'Arquivamento';
  
  return 'Outro';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rpiNumber, mode } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Determine which RPI to fetch
    const targetRpi = rpiNumber || calculateLatestRpiNumber();
    
    // Get list of recent RPIs if mode is 'list'
    if (mode === 'list') {
      const recentRpis = getRecentRpiNumbers(15);
      return new Response(
        JSON.stringify({ 
          success: true, 
          latestRpi: recentRpis[0],
          recentRpis,
          message: `Última RPI disponível: ${recentRpis[0]}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Fetching RPI ${targetRpi}...`);
    
    // Try to download the XML ZIP file
    // INPI uses format: https://revistas.inpi.gov.br/txt/RM{NUMBER}.zip for brand trademarks
    const xmlUrl = `https://revistas.inpi.gov.br/txt/RM${targetRpi}.zip`;
    
    console.log(`Downloading from: ${xmlUrl}`);
    
    let xmlContent: string | null = null;
    let fileSource = 'xml';
    
    try {
      const response = await fetch(xmlUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      if (response.ok) {
        const zipData = await response.arrayBuffer();
        const zip = await JSZip.loadAsync(zipData);
        
        // Find the XML file inside the ZIP
        const xmlFiles = Object.keys(zip.files).filter(name => name.endsWith('.xml'));
        
        if (xmlFiles.length > 0) {
          xmlContent = await zip.files[xmlFiles[0]].async('string');
          console.log(`XML extracted, size: ${xmlContent.length} bytes`);
        }
      } else {
        console.log(`XML download failed with status: ${response.status}`);
      }
    } catch (downloadError: unknown) {
      console.log(`XML download error: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`);
    }
    
    // If XML not available, return info about manual upload
    if (!xmlContent) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'XML_NOT_AVAILABLE',
          message: `A RPI ${targetRpi} não está disponível para download automático. Por favor, faça upload manual do arquivo.`,
          rpiNumber: targetRpi,
          suggestedUrl: `https://revistas.inpi.gov.br/`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Parse the XML and extract processes
    const extractedProcesses = parseRpiXml(xmlContent);
    
    console.log(`Found ${extractedProcesses.length} processes for attorney`);
    
    if (extractedProcesses.length === 0) {
      // Create upload record with no processes found
      const { data: rpiUpload, error: insertError } = await supabase
        .from('rpi_uploads')
        .insert({
          file_name: `RPI_${targetRpi}_auto.xml`,
          file_path: `remote/RPI_${targetRpi}.xml`,
          rpi_number: targetRpi.toString(),
          rpi_date: new Date().toISOString().split('T')[0],
          status: 'completed',
          total_processes_found: 0,
          total_clients_matched: 0,
          summary: `Nenhum processo do procurador ${ATTORNEY_NAME} encontrado nesta edição.`,
          processed_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          rpiNumber: targetRpi,
          totalProcesses: 0,
          matchedClients: 0,
          uploadId: rpiUpload?.id,
          message: `RPI ${targetRpi} processada. Nenhum processo do procurador encontrado.`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create RPI upload record
    const { data: rpiUpload, error: uploadError } = await supabase
      .from('rpi_uploads')
      .insert({
        file_name: `RPI_${targetRpi}_auto.xml`,
        file_path: `remote/RPI_${targetRpi}.xml`,
        rpi_number: targetRpi.toString(),
        rpi_date: new Date().toISOString().split('T')[0],
        status: 'processing',
      })
      .select()
      .single();
    
    if (uploadError) throw uploadError;
    
    // Fetch existing processes for matching
    const { data: existingProcesses } = await supabase
      .from('brand_processes')
      .select('id, process_number, user_id, brand_name');
    
    const processMap = new Map(
      (existingProcesses || []).map(p => [p.process_number?.replace(/\D/g, ''), p])
    );
    
    // Create entries for each extracted process
    let matchedClients = 0;
    const entries = extractedProcesses.map(proc => {
      const cleanNumber = proc.processNumber.replace(/\D/g, '');
      const existingProcess = processMap.get(cleanNumber);
      
      if (existingProcess?.user_id) matchedClients++;
      
      return {
        rpi_upload_id: rpiUpload.id,
        process_number: cleanNumber,
        brand_name: proc.brandName,
        holder_name: proc.holderName,
        attorney_name: proc.attorneyName || ATTORNEY_NAME,
        ncl_classes: proc.nclClasses.length > 0 ? proc.nclClasses : null,
        dispatch_code: proc.dispatchCode,
        dispatch_text: proc.dispatchText,
        dispatch_type: proc.dispatchType || determineDispatchType(proc.dispatchCode, proc.dispatchText),
        publication_date: proc.publicationDate,
        matched_client_id: existingProcess?.user_id || null,
        matched_process_id: existingProcess?.id || null,
        update_status: 'pending',
      };
    });
    
    // Insert entries
    const { error: entriesError } = await supabase
      .from('rpi_entries')
      .insert(entries);
    
    if (entriesError) throw entriesError;
    
    // Update upload with summary
    const summary = `RPI ${targetRpi} processada automaticamente. ${extractedProcesses.length} processos do procurador identificados, ${matchedClients} correspondem a clientes WebMarcas.`;
    
    await supabase
      .from('rpi_uploads')
      .update({
        status: 'completed',
        total_processes_found: extractedProcesses.length,
        total_clients_matched: matchedClients,
        summary,
        processed_at: new Date().toISOString(),
      })
      .eq('id', rpiUpload.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        rpiNumber: targetRpi,
        totalProcesses: extractedProcesses.length,
        matchedClients,
        uploadId: rpiUpload.id,
        message: summary,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Erro ao processar RPI remota.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
