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
  'davilys',
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

// Calculate expected RPI number based on date (published every Tuesday)
function calculateExpectedRpiNumber(): number {
  // RPI 2870 was published on 2024-12-10 (Tuesday)
  const referenceDate = new Date('2024-12-10');
  const referenceRpi = 2870;
  const today = new Date();
  
  const diffTime = today.getTime() - referenceDate.getTime();
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
  
  return referenceRpi + diffWeeks;
}

// Fetch the RPI portal page to get available RPI numbers
async function fetchAvailableRpis(): Promise<{ latest: number; available: number[] }> {
  const expectedRpi = calculateExpectedRpiNumber();
  console.log(`Expected RPI based on date: ${expectedRpi}`);
  
  try {
    // Try to fetch the main RPI page
    const response = await fetch('https://revistas.inpi.gov.br/rpi/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch INPI page: ${response.status}`);
    }
    
    const html = await response.text();
    console.log(`Fetched INPI page, length: ${html.length}`);
    
    // Try multiple patterns to extract RPI numbers
    const patterns = [
      /RM(\d{4})\.zip/gi,
      /Marcas(\d{4})\.pdf/gi,
      /RPI\s*(\d{4})/gi,
      /rpi\/(\d{4})/gi,
      /numero[^>]*>(\d{4})</gi,
    ];
    
    const allNumbers: number[] = [];
    
    for (const pattern of patterns) {
      const matches = [...html.matchAll(pattern)];
      for (const match of matches) {
        const num = parseInt(match[1]);
        if (num >= 2800 && num <= 3000) { // Reasonable range
          allNumbers.push(num);
        }
      }
    }
    
    const uniqueNumbers = [...new Set(allNumbers)].sort((a, b) => b - a);
    console.log(`Found RPI numbers from page: ${uniqueNumbers.slice(0, 10).join(', ')}`);
    
    if (uniqueNumbers.length > 0) {
      return { latest: uniqueNumbers[0], available: uniqueNumbers.slice(0, 20) };
    }
    
    // Fallback: return expected RPI based on calculation
    const fallbackNumbers = Array.from({ length: 20 }, (_, i) => expectedRpi - i);
    return { latest: expectedRpi, available: fallbackNumbers };
    
  } catch (error) {
    console.error('Error fetching available RPIs:', error);
    // Fallback to calculated RPIs
    const fallbackNumbers = Array.from({ length: 20 }, (_, i) => expectedRpi - i);
    return { latest: expectedRpi, available: fallbackNumbers };
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

// Parse INPI XML structure - handles official format
function parseRpiXml(xmlContent: string, rpiNumber: number): ExtractedProcess[] {
  const processes: ExtractedProcess[] = [];
  console.log(`Parsing XML content, size: ${xmlContent.length} bytes`);
  
  // Check if XML contains our attorney name at all
  if (!containsAttorney(xmlContent)) {
    console.log('Attorney name not found in XML content');
    return [];
  }
  
  console.log('Attorney name found in XML! Extracting processes...');
  
  // Helper to extract text content from XML tags and clean nested tags
  const extractTagContent = (xml: string, tagName: string): string | null => {
    // Try with attributes
    const regex1 = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match1 = xml.match(regex1);
    if (match1) {
      let content = match1[1].trim();
      // Clean any nested XML tags
      content = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return content || null;
    }
    
    // Try self-closing with attribute value
    const regex2 = new RegExp(`<${tagName}[^>]*\\s+(?:nome|valor|texto)[^>]*=["']([^"']+)["']`, 'i');
    const match2 = xml.match(regex2);
    if (match2) return match2[1].trim();
    
    return null;
  };
  
  const extractAttribute = (xml: string, tagName: string, attrName: string): string | null => {
    const regex = new RegExp(`<${tagName}[^>]*\\s+${attrName}\\s*=\\s*["']([^"']+)["']`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  };
  
  // Try to find <revista> tag for date info
  const revistaMatch = xmlContent.match(/<revista[^>]*data[^>]*=["']([^"']+)["']/i);
  const publicationDate = revistaMatch ? revistaMatch[1] : null;
  
  // Find all process blocks - INPI uses <processo> tags
  const processPatterns = [
    /<processo[^>]*numero[^>]*=["'](\d+)["'][^>]*>([\s\S]*?)<\/processo>/gi,
    /<processo[^>]*>([\s\S]*?)<\/processo>/gi,
    /<despacho[^>]*>([\s\S]*?)<\/despacho>/gi,
  ];
  
  let allBlocks: Array<{ number: string | null; content: string }> = [];
  
  // Pattern 1: processo with numero attribute
  const pattern1 = /<processo[^>]*numero[^>]*=["'](\d+)["'][^>]*>([\s\S]*?)<\/processo>/gi;
  let match;
  while ((match = pattern1.exec(xmlContent)) !== null) {
    allBlocks.push({ number: match[1], content: match[0] });
  }
  
  // Pattern 2: processo without numero attribute
  if (allBlocks.length === 0) {
    const pattern2 = /<processo[^>]*>([\s\S]*?)<\/processo>/gi;
    while ((match = pattern2.exec(xmlContent)) !== null) {
      const numberMatch = match[1].match(/(\d{9,12})/);
      allBlocks.push({ number: numberMatch ? numberMatch[1] : null, content: match[0] });
    }
  }
  
  // Pattern 3: Split by process number patterns if no XML structure
  if (allBlocks.length === 0) {
    console.log('No standard XML blocks found, trying text-based extraction...');
    
    // Split by process numbers
    const parts = xmlContent.split(/(?=\d{9,12})/);
    for (const part of parts) {
      const numMatch = part.match(/^(\d{9,12})/);
      if (numMatch && containsAttorney(part)) {
        allBlocks.push({ number: numMatch[1], content: part });
      }
    }
  }
  
  console.log(`Found ${allBlocks.length} potential process blocks`);
  
  // Process each block
  for (const block of allBlocks) {
    // Check if this block belongs to our attorney
    if (!containsAttorney(block.content)) continue;
    
    // Extract or use the process number
    let processNumber = block.number;
    if (!processNumber) {
      const numMatch = block.content.match(/(\d{9,12})/);
      if (!numMatch) continue;
      processNumber = numMatch[1];
    }
    
    const cleanNumber = processNumber.replace(/\D/g, '');
    
    // Avoid duplicates
    if (processes.some(p => p.processNumber === cleanNumber)) continue;
    
    // Extract brand name - clean up XML tags from content
    let brandName = 
      extractTagContent(block.content, 'marca') ||
      extractTagContent(block.content, 'nome') ||
      extractTagContent(block.content, 'denominacao') ||
      extractAttribute(block.content, 'marca', 'nome') ||
      extractAttribute(block.content, 'marca', 'apresentacao');
    
    // Clean up any nested XML tags from brand name
    if (brandName) {
      // Remove any XML tags like <nome>...</nome> from the content
      brandName = brandName.replace(/<[^>]+>/g, '').trim();
      // Also extract from <nome> if present
      const nomeMatch = brandName.match(/<nome>([^<]+)<\/nome>/i);
      if (nomeMatch) {
        brandName = nomeMatch[1].trim();
      }
    }
    
    // Extract holder name  
    const holderName =
      extractAttribute(block.content, 'titular', 'nome-razao-social') ||
      extractTagContent(block.content, 'titular') ||
      extractTagContent(block.content, 'requerente') ||
      extractTagContent(block.content, 'depositante');
    
    // Extract dispatch info
    const dispatchCode =
      extractAttribute(block.content, 'despacho', 'codigo') ||
      extractTagContent(block.content, 'codigo') ||
      extractTagContent(block.content, 'cod-despacho');
    
    const dispatchText =
      extractTagContent(block.content, 'texto-complementar') ||
      extractTagContent(block.content, 'descricao') ||
      extractTagContent(block.content, 'texto');
    
    // Extract NCL classes
    const nclMatches = block.content.match(/<classe-nice[^>]*codigo[^>]*=["'](\d+)["']/gi) || [];
    const nclClasses = nclMatches.map(m => {
      const codeMatch = m.match(/codigo[^>]*=["'](\d+)["']/i);
      return codeMatch ? codeMatch[1] : '';
    }).filter(Boolean);
    
    // If no structured classes, try to find class numbers in text
    if (nclClasses.length === 0) {
      const classMatch = block.content.match(/classe[s]?\s*:?\s*([\d,\s]+)/i);
      if (classMatch) {
        const nums = classMatch[1].match(/\d+/g);
        if (nums) nclClasses.push(...nums);
      }
    }
    
    // Determine dispatch type
    const dispatchType = determineDispatchType(dispatchCode, dispatchText);
    
    processes.push({
      processNumber: cleanNumber,
      brandName,
      holderName,
      attorneyName: ATTORNEY_NAME,
      nclClasses,
      dispatchCode,
      dispatchText,
      dispatchType,
      publicationDate,
    });
  }
  
  console.log(`Extracted ${processes.length} processes for attorney`);
  return processes;
}

// Determine dispatch type from code/text
function determineDispatchType(code: string | null, text: string | null): string {
  const combined = normalizeText(`${code || ''} ${text || ''}`);
  
  if (combined.includes('deferimento') || combined.includes('deferido')) return 'Deferimento';
  if (combined.includes('indeferimento') || combined.includes('indeferido')) return 'Indeferimento';
  if (combined.includes('exigencia') || combined.includes('exigência')) return 'Exigência';
  if (combined.includes('oposicao') || combined.includes('oposição')) return 'Oposição';
  if (combined.includes('certificado') || combined.includes('concessao')) return 'Certificado';
  if (combined.includes('recurso')) return 'Recurso';
  if (combined.includes('arquivamento') || combined.includes('arquivado')) return 'Arquivamento';
  if (combined.includes('publicacao') || combined.includes('publicação')) return 'Publicação';
  if (combined.includes('sobrestamento') || combined.includes('sobrestado')) return 'Sobrestamento';
  if (combined.includes('anulacao') || combined.includes('anulação')) return 'Anulação';
  
  return 'Outro';
}

// Try multiple URLs to download the RPI XML
async function tryDownloadRpiXml(rpiNumber: number): Promise<string | null> {
  const urls = [
    `https://revistas.inpi.gov.br/txt/RM${rpiNumber}.zip`,
    `https://revistas.inpi.gov.br/xml/RM${rpiNumber}.zip`,
    `https://revistas.inpi.gov.br/rpi/RM${rpiNumber}.zip`,
    `https://revistas.inpi.gov.br/txt/M${rpiNumber}.zip`,
    `https://revistas.inpi.gov.br/rpi/${rpiNumber}/RM${rpiNumber}.zip`,
  ];
  
  for (const url of urls) {
    console.log(`Trying URL: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/zip, application/octet-stream, */*',
        },
      });
      
      if (!response.ok) {
        console.log(`URL ${url} returned status ${response.status}`);
        continue;
      }
      
      const contentType = response.headers.get('content-type') || '';
      console.log(`Content-Type: ${contentType}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Check for ZIP magic bytes (PK)
      if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
        console.log(`Valid ZIP file from ${url}, size: ${bytes.length} bytes`);
        
        const zip = await JSZip.loadAsync(arrayBuffer);
        const xmlFiles = Object.keys(zip.files).filter(name => 
          name.toLowerCase().endsWith('.xml')
        );
        
        if (xmlFiles.length > 0) {
          const xmlContent = await zip.files[xmlFiles[0]].async('string');
          console.log(`Extracted XML from ${xmlFiles[0]}, size: ${xmlContent.length} bytes`);
          return xmlContent;
        } else {
          console.log('No XML files found in ZIP');
        }
      } else if (bytes[0] === 0x3C) {
        // Starts with '<' - might be XML directly
        const text = new TextDecoder().decode(bytes);
        if (text.includes('<?xml') || text.includes('<revista') || text.includes('<processo')) {
          console.log('Got XML directly (not zipped)');
          return text;
        }
      } else {
        // Check if it's HTML (error page)
        const text = new TextDecoder().decode(bytes.slice(0, 500));
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          console.log('Got HTML page instead of ZIP');
        } else {
          console.log(`Unknown format, first bytes: ${bytes.slice(0, 10).join(',')}`);
        }
      }
    } catch (error) {
      console.log(`Error fetching ${url}: ${error}`);
    }
  }
  
  return null;
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
    
    console.log(`Fetching RPI ${targetRpi}...`);
    
    // Try to download the XML
    const xmlContent = await tryDownloadRpiXml(targetRpi);
    
    // If XML not available, return info about manual upload
    if (!xmlContent) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'XML_NOT_AVAILABLE',
          message: `Não foi possível baixar o XML da RPI ${targetRpi} automaticamente. O INPI pode ter alterado a estrutura. Por favor, acesse revistas.inpi.gov.br e faça upload manual do arquivo.`,
          rpiNumber: targetRpi,
          latestAvailable: latest,
          suggestedUrl: 'https://revistas.inpi.gov.br/',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Parse the XML and extract processes
    const extractedProcesses = parseRpiXml(xmlContent, targetRpi);
    
    console.log(`Found ${extractedProcesses.length} processes for attorney`);
    
    if (extractedProcesses.length === 0) {
      // Create upload record with no processes found
      const { data: rpiUpload } = await supabase
        .from('rpi_uploads')
        .insert({
          file_name: `RPI_${targetRpi}_auto.xml`,
          file_path: `remote/RPI_${targetRpi}.xml`,
          rpi_number: targetRpi.toString(),
          rpi_date: new Date().toISOString().split('T')[0],
          status: 'completed',
          total_processes_found: 0,
          total_clients_matched: 0,
          summary: `RPI ${targetRpi} analisada. Nenhum processo do procurador ${ATTORNEY_NAME} foi publicado nesta edição.`,
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
        dispatch_type: proc.dispatchType,
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
    const summary = `RPI ${targetRpi} processada. ${extractedProcesses.length} publicações do procurador encontradas, ${matchedClients} correspondem a clientes WebMarcas.`;
    
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
        processes: extractedProcesses.map(p => ({
          processNumber: p.processNumber,
          brandName: p.brandName,
          dispatchType: p.dispatchType,
          holderName: p.holderName,
        })),
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
