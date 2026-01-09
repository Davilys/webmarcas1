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

// Fetch the RPI portal page to get available RPI numbers
async function fetchAvailableRpis(): Promise<{ latest: number; available: number[] }> {
  try {
    const response = await fetch('https://revistas.inpi.gov.br/rpi/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch INPI page: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract RPI numbers from the page - looking for patterns like RM2870.zip
    const rpiPattern = /RM(\d{4})\.zip/g;
    const matches = [...html.matchAll(rpiPattern)];
    
    const rpiNumbers = [...new Set(matches.map(m => parseInt(m[1])))].sort((a, b) => b - a);
    
    if (rpiNumbers.length === 0) {
      // Fallback: try to extract from PDF links like Marcas2870.pdf
      const pdfPattern = /Marcas(\d{4})\.pdf/g;
      const pdfMatches = [...html.matchAll(pdfPattern)];
      const pdfNumbers = [...new Set(pdfMatches.map(m => parseInt(m[1])))].sort((a, b) => b - a);
      
      if (pdfNumbers.length > 0) {
        return { latest: pdfNumbers[0], available: pdfNumbers.slice(0, 15) };
      }
      
      // Last resort fallback
      return { latest: 2870, available: [2870, 2869, 2868, 2867, 2866, 2865] };
    }
    
    return { latest: rpiNumbers[0], available: rpiNumbers.slice(0, 15) };
  } catch (error) {
    console.error('Error fetching available RPIs:', error);
    // Fallback to known recent RPIs
    return { latest: 2870, available: [2870, 2869, 2868, 2867, 2866, 2865] };
  }
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
  
  // Extract value from XML tag
  const extractTag = (xml: string, tagName: string): string | null => {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  };
  
  // The INPI XML structure uses <processo> or <despacho> blocks
  // Try multiple patterns to find process blocks
  const blockPatterns = [
    /<processo[^>]*>([\s\S]*?)<\/processo>/gi,
    /<despacho[^>]*>([\s\S]*?)<\/despacho>/gi,
    /<marca[^>]*>([\s\S]*?)<\/marca>/gi,
    /<registro[^>]*>([\s\S]*?)<\/registro>/gi,
  ];
  
  let allBlocks: string[] = [];
  
  for (const pattern of blockPatterns) {
    const matches = xmlContent.match(pattern) || [];
    allBlocks = allBlocks.concat(matches);
  }
  
  // If no structured blocks found, try to split by process number patterns
  if (allBlocks.length === 0) {
    // Look for blocks that contain attorney name
    const lines = xmlContent.split(/\n/);
    let currentBlock = '';
    
    for (const line of lines) {
      currentBlock += line + '\n';
      
      // Check if we have a complete block (contains process number and attorney)
      const hasProcessNumber = /\d{9,12}/.test(currentBlock);
      const hasAttorney = containsAttorney(currentBlock);
      
      if (hasProcessNumber && hasAttorney) {
        allBlocks.push(currentBlock);
        currentBlock = '';
      } else if (currentBlock.length > 5000) {
        // Reset if block gets too large
        currentBlock = '';
      }
    }
  }
  
  // Process each block
  for (const block of allBlocks) {
    // Check if this block belongs to our attorney
    if (!containsAttorney(block)) continue;
    
    // Try to extract process number
    const processNumberMatch = block.match(/(?:numero|processo|pedido)[^>]*>?\s*(\d{9,12})/i) ||
                               block.match(/(\d{9,12})/);
    
    if (!processNumberMatch) continue;
    
    const processNumber = processNumberMatch[1].replace(/\D/g, '');
    
    // Avoid duplicates
    if (processes.some(p => p.processNumber === processNumber)) continue;
    
    processes.push({
      processNumber,
      brandName: extractTag(block, 'nome') || extractTag(block, 'marca') || extractTag(block, 'denominacao'),
      holderName: extractTag(block, 'titular') || extractTag(block, 'requerente') || extractTag(block, 'depositante'),
      attorneyName: extractTag(block, 'procurador') || extractTag(block, 'representante') || ATTORNEY_NAME,
      nclClasses: (extractTag(block, 'classe') || extractTag(block, 'ncl') || '').split(/[,\s]+/).filter(Boolean),
      dispatchCode: extractTag(block, 'codigo') || extractTag(block, 'cod_despacho') || extractTag(block, 'despacho'),
      dispatchText: extractTag(block, 'texto') || extractTag(block, 'descricao') || extractTag(block, 'complemento'),
      dispatchType: extractTag(block, 'tipo') || extractTag(block, 'natureza'),
      publicationDate: extractTag(block, 'data') || extractTag(block, 'publicacao'),
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
    
    // Fetch available RPIs from the portal
    const { latest, available } = await fetchAvailableRpis();
    
    console.log(`Latest RPI available: ${latest}, requested: ${rpiNumber || 'latest'}`);
    
    // Get list of recent RPIs if mode is 'list'
    if (mode === 'list') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          latestRpi: latest,
          recentRpis: available,
          message: `Última RPI disponível: ${latest}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Determine which RPI to fetch
    const targetRpi = rpiNumber || latest;
    
    // Check if the requested RPI is available
    if (!available.includes(targetRpi) && targetRpi > latest) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'XML_NOT_AVAILABLE',
          message: `A RPI ${targetRpi} ainda não foi publicada. A última disponível é a RPI ${latest}.`,
          rpiNumber: targetRpi,
          latestAvailable: latest,
          suggestedUrl: 'https://revistas.inpi.gov.br/',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    console.log(`Fetching RPI ${targetRpi}...`);
    
    // Download the XML ZIP file
    const xmlUrl = `https://revistas.inpi.gov.br/txt/RM${targetRpi}.zip`;
    
    console.log(`Downloading from: ${xmlUrl}`);
    
    let xmlContent: string | null = null;
    
    try {
      const response = await fetch(xmlUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/zip, application/octet-stream, */*',
        },
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        
        // Check if we got a ZIP file
        if (contentType.includes('zip') || contentType.includes('octet-stream')) {
          const zipData = await response.arrayBuffer();
          
          // Verify it's actually a ZIP by checking magic bytes
          const bytes = new Uint8Array(zipData);
          if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
            const zip = await JSZip.loadAsync(zipData);
            
            // Find the XML file inside the ZIP
            const xmlFiles = Object.keys(zip.files).filter(name => 
              name.endsWith('.xml') || name.endsWith('.XML')
            );
            
            if (xmlFiles.length > 0) {
              xmlContent = await zip.files[xmlFiles[0]].async('string');
              console.log(`XML extracted from ${xmlFiles[0]}, size: ${xmlContent.length} bytes`);
            }
          } else {
            console.log('Response is not a valid ZIP file (magic bytes check failed)');
          }
        } else {
          console.log(`Unexpected content type: ${contentType}`);
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
          message: `Não foi possível baixar o XML da RPI ${targetRpi}. O arquivo pode não estar disponível ou o formato mudou. Por favor, faça upload manual.`,
          rpiNumber: targetRpi,
          latestAvailable: latest,
          suggestedUrl: 'https://revistas.inpi.gov.br/',
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
          summary: `Nenhum processo do procurador ${ATTORNEY_NAME} encontrado nesta edição da RPI.`,
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
          message: `RPI ${targetRpi} processada. Nenhum processo do procurador encontrado nesta edição.`,
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
