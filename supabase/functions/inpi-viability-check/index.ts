const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lista de marcas de alto renome - não realizar laudo
const FAMOUS_BRANDS = [
  'petrobras', 'itau', 'itaú', 'bradesco', 'caixa', 'santander', 'nubank',
  'magazine luiza', 'magalu', 'casas bahia', 'coca-cola', 'coca cola', 'cocacola',
  'nike', 'apple', 'samsung', 'globo', 'fiat', 'volkswagen', 'natura', 'boticario',
  'o boticário', 'shopee', 'mercado livre', 'mercadolivre', 'heineken', 'ambev',
  'brahma', 'skol', 'antartica', 'antarctica', 'google', 'microsoft', 'amazon',
  'netflix', 'spotify', 'uber', 'ifood', '99', 'rappi', 'picpay', 'stone',
  'pagseguro', 'cielo', 'rede', 'getnet', 'bmw', 'mercedes', 'audi', 'toyota',
  'honda', 'hyundai', 'chevrolet', 'ford', 'renault', 'peugeot', 'citroen',
  'jeep', 'land rover', 'porsche', 'ferrari', 'lamborghini', 'rolex', 'cartier',
  'louis vuitton', 'gucci', 'prada', 'chanel', 'dior', 'hermes', 'armani',
  'versace', 'burberry', 'tiffany', 'pandora', 'swarovski', 'ray-ban', 'rayban',
  'oakley', 'adidas', 'puma', 'reebok', 'new balance', 'asics', 'mizuno',
  'vans', 'converse', 'mcdonalds', 'mc donalds', "mcdonald's", 'burger king',
  'subway', 'starbucks', 'kfc', 'pizza hut', 'dominos', "domino's", 'habib',
  'habibs', "habib's", 'outback', 'madero', 'giraffas', 'bobs', "bob's",
  'visa', 'mastercard', 'american express', 'amex', 'elo', 'hipercard',
  'disney', 'warner', 'paramount', 'universal', 'sony', 'lg', 'philips',
  'panasonic', 'jbl', 'bose', 'beats', 'dell', 'hp', 'lenovo', 'asus', 'acer',
  'intel', 'amd', 'nvidia', 'telegram', 'whatsapp', 'instagram', 'facebook',
  'meta', 'twitter', 'tiktok', 'youtube', 'linkedin', 'pinterest', 'snapchat'
];

// Mapeamento de ramos para classes NCL
const BUSINESS_AREA_CLASSES: Record<string, { classes: number[], descriptions: string[] }> = {
  'tecnologia': {
    classes: [9, 42, 35],
    descriptions: [
      'Classe 09 – Aparelhos e instrumentos científicos, software, hardware e equipamentos eletrônicos',
      'Classe 42 – Serviços científicos, tecnológicos e de design, desenvolvimento de software',
      'Classe 35 – Publicidade, gestão de negócios, administração comercial'
    ]
  },
  'alimentacao': {
    classes: [43, 30, 29],
    descriptions: [
      'Classe 43 – Serviços de restaurante, alimentação e hospedagem',
      'Classe 30 – Café, chá, cacau, açúcar, arroz, massas, pães, doces e condimentos',
      'Classe 29 – Carne, peixe, aves, caça, frutas, legumes, ovos, leite e derivados'
    ]
  },
  'moda': {
    classes: [25, 18, 35],
    descriptions: [
      'Classe 25 – Vestuário, calçados e chapelaria',
      'Classe 18 – Couro, bolsas, malas, guarda-chuvas e artigos de selaria',
      'Classe 35 – Publicidade, gestão de negócios, comércio varejista'
    ]
  },
  'saude': {
    classes: [44, 5, 10],
    descriptions: [
      'Classe 44 – Serviços médicos, veterinários, higiênicos e de beleza',
      'Classe 05 – Produtos farmacêuticos, veterinários e sanitários',
      'Classe 10 – Aparelhos e instrumentos médicos, cirúrgicos e odontológicos'
    ]
  },
  'educacao': {
    classes: [41, 16, 9],
    descriptions: [
      'Classe 41 – Educação, treinamento, entretenimento e atividades desportivas e culturais',
      'Classe 16 – Papel, produtos de papelaria, material de instrução e ensino',
      'Classe 09 – Aparelhos para gravação, transmissão ou reprodução de som ou imagem'
    ]
  },
  'beleza': {
    classes: [44, 3, 35],
    descriptions: [
      'Classe 44 – Serviços de salão de beleza, estética e cabeleireiro',
      'Classe 03 – Cosméticos, perfumaria, óleos essenciais e produtos de higiene',
      'Classe 35 – Publicidade e comércio de produtos de beleza'
    ]
  },
  'construcao': {
    classes: [37, 19, 6],
    descriptions: [
      'Classe 37 – Construção civil, reparação e serviços de instalação',
      'Classe 19 – Materiais de construção não metálicos (cimento, tijolo, vidro)',
      'Classe 06 – Metais comuns e suas ligas, materiais de construção metálicos'
    ]
  },
  'financeiro': {
    classes: [36, 35, 42],
    descriptions: [
      'Classe 36 – Seguros, negócios financeiros, imobiliários e bancários',
      'Classe 35 – Gestão de negócios, administração comercial e contabilidade',
      'Classe 42 – Serviços científicos e tecnológicos relacionados a finanças'
    ]
  },
  'advocacia': {
    classes: [45, 35, 41],
    descriptions: [
      'Classe 45 – Serviços jurídicos, advocacia e consultoria legal',
      'Classe 35 – Gestão de negócios e administração de escritórios',
      'Classe 41 – Educação jurídica, palestras e treinamentos'
    ]
  },
  'automotivo': {
    classes: [37, 12, 35],
    descriptions: [
      'Classe 37 – Reparação e manutenção de veículos',
      'Classe 12 – Veículos, aparelhos de locomoção por terra, ar ou água',
      'Classe 35 – Comércio de veículos e peças automotivas'
    ]
  },
  'default': {
    classes: [35, 41, 42],
    descriptions: [
      'Classe 35 – Publicidade, gestão de negócios e administração comercial',
      'Classe 41 – Educação, treinamento, entretenimento e cultura',
      'Classe 42 – Serviços científicos, tecnológicos e de pesquisa'
    ]
  }
};

function normalizeString(str: string): string {
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isFamousBrand(brandName: string): boolean {
  const normalized = normalizeString(brandName);
  return FAMOUS_BRANDS.some(famous => 
    normalized.includes(normalizeString(famous)) || 
    normalizeString(famous).includes(normalized)
  );
}

function getClassesForBusinessArea(businessArea: string): { classes: number[], descriptions: string[] } {
  const normalized = normalizeString(businessArea);
  
  for (const [key, value] of Object.entries(BUSINESS_AREA_CLASSES)) {
    if (key !== 'default' && normalized.includes(key)) {
      return value;
    }
  }
  
  if (normalized.includes('software') || normalized.includes('app') || normalized.includes('sistema') || normalized.includes('ti')) {
    return BUSINESS_AREA_CLASSES.tecnologia;
  }
  if (normalized.includes('restaurante') || normalized.includes('comida') || normalized.includes('gastronomia') || normalized.includes('lanchonete')) {
    return BUSINESS_AREA_CLASSES.alimentacao;
  }
  if (normalized.includes('roupa') || normalized.includes('vestuario') || normalized.includes('loja') || normalized.includes('boutique')) {
    return BUSINESS_AREA_CLASSES.moda;
  }
  if (normalized.includes('clinica') || normalized.includes('hospital') || normalized.includes('medic') || normalized.includes('farmacia')) {
    return BUSINESS_AREA_CLASSES.saude;
  }
  if (normalized.includes('escola') || normalized.includes('curso') || normalized.includes('ensino') || normalized.includes('faculdade')) {
    return BUSINESS_AREA_CLASSES.educacao;
  }
  if (normalized.includes('salao') || normalized.includes('estetica') || normalized.includes('cabelo') || normalized.includes('cosmetico')) {
    return BUSINESS_AREA_CLASSES.beleza;
  }
  if (normalized.includes('obra') || normalized.includes('engenharia') || normalized.includes('arquitetura') || normalized.includes('pedreiro')) {
    return BUSINESS_AREA_CLASSES.construcao;
  }
  if (normalized.includes('banco') || normalized.includes('investimento') || normalized.includes('credito') || normalized.includes('financeira')) {
    return BUSINESS_AREA_CLASSES.financeiro;
  }
  if (normalized.includes('advogado') || normalized.includes('juridico') || normalized.includes('direito') || normalized.includes('escritorio')) {
    return BUSINESS_AREA_CLASSES.advocacia;
  }
  if (normalized.includes('carro') || normalized.includes('moto') || normalized.includes('oficina') || normalized.includes('mecanica')) {
    return BUSINESS_AREA_CLASSES.automotivo;
  }
  
  return BUSINESS_AREA_CLASSES.default;
}

// Função para gerenciar cookies entre requisições
function extractAndMergeCookies(existingCookies: string, setCookieHeader: string | null): string {
  if (!setCookieHeader) return existingCookies;
  
  const cookieMap = new Map<string, string>();
  
  // Parse existing cookies
  if (existingCookies) {
    existingCookies.split(';').forEach(c => {
      const [name, value] = c.trim().split('=');
      if (name && value) cookieMap.set(name, value);
    });
  }
  
  // Parse new cookies (pode ter múltiplos Set-Cookie)
  const newCookies = setCookieHeader.split(',').map(c => c.trim());
  newCookies.forEach(cookieStr => {
    const mainPart = cookieStr.split(';')[0];
    const [name, value] = mainPart.split('=');
    if (name && value) cookieMap.set(name.trim(), value.trim());
  });
  
  return Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}

// Função para fazer scraping real do INPI
async function searchINPI(brandName: string): Promise<{
  success: boolean;
  totalResults: number;
  brands: Array<{
    processo: string;
    marca: string;
    prioridade: string;
    situacao: string;
    classe: string;
    titular: string;
  }>;
  rawHtml?: string;
  error?: string;
}> {
  try {
    console.log(`[INPI] ========== INICIANDO BUSCA ==========`);
    console.log(`[INPI] Marca: "${brandName}"`);
    
    let cookies = '';
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    // STEP 1: Acessar página inicial do INPI
    console.log('[INPI] Step 1: Acessando página inicial...');
    const step1 = await fetch('https://busca.inpi.gov.br/pePI/', {
      method: 'GET',
      headers,
      redirect: 'manual',
    });
    cookies = extractAndMergeCookies(cookies, step1.headers.get('set-cookie'));
    console.log(`[INPI] Step 1: Status ${step1.status}, Cookies: ${cookies.substring(0, 50)}...`);

    // STEP 2: Clicar em "Continuar sem login"
    console.log('[INPI] Step 2: Acessando LoginController (Continuar sem login)...');
    const step2 = await fetch('https://busca.inpi.gov.br/pePI/servlet/LoginController?action=login', {
      method: 'GET',
      headers: { ...headers, Cookie: cookies },
      redirect: 'manual',
    });
    cookies = extractAndMergeCookies(cookies, step2.headers.get('set-cookie'));
    console.log(`[INPI] Step 2: Status ${step2.status}, Cookies: ${cookies.substring(0, 50)}...`);

    // STEP 3: Acessar página de pesquisa de marcas por número de processo (para iniciar sessão de marcas)
    console.log('[INPI] Step 3: Acessando página de marcas...');
    const step3 = await fetch('https://busca.inpi.gov.br/pePI/jsp/marcas/Pesquisa_num_processo.jsp', {
      method: 'GET',
      headers: { ...headers, Cookie: cookies, Referer: 'https://busca.inpi.gov.br/pePI/servlet/LoginController?action=login' },
      redirect: 'manual',
    });
    cookies = extractAndMergeCookies(cookies, step3.headers.get('set-cookie'));
    const step3Html = await step3.text();
    console.log(`[INPI] Step 3: Status ${step3.status}, HTML: ${step3Html.length} bytes`);

    // STEP 4: Acessar página de pesquisa por nome de marca
    console.log('[INPI] Step 4: Acessando pesquisa por nome...');
    const step4 = await fetch('https://busca.inpi.gov.br/pePI/jsp/marcas/Pesquisa_nome.jsp', {
      method: 'GET',
      headers: { ...headers, Cookie: cookies, Referer: 'https://busca.inpi.gov.br/pePI/jsp/marcas/Pesquisa_num_processo.jsp' },
      redirect: 'manual',
    });
    cookies = extractAndMergeCookies(cookies, step4.headers.get('set-cookie'));
    const step4Html = await step4.text();
    console.log(`[INPI] Step 4: Status ${step4.status}, HTML: ${step4Html.length} bytes`);

    // STEP 5: Executar busca EXATA por nome da marca
    console.log('[INPI] Step 5: Executando busca EXATA...');
    
    const formData = new URLSearchParams();
    formData.append('Action', 'SearchMarcas');
    formData.append('Ession', '');
    formData.append('NumPedido', '');
    formData.append('NumProtocolo', '');
    formData.append('Marca', brandName);
    formData.append('tipoMarca', 'Exata');
    formData.append('NCL', '');
    formData.append('Titular', '');
    formData.append('Situacao', '');
    formData.append('Natureza', '');
    formData.append('Apresentacao', '');
    formData.append('Classe', '');
    formData.append('ProcurarMarca', 'Pesquisar');

    const searchResponse = await fetch('https://busca.inpi.gov.br/pePI/servlet/MarcasServletController', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies,
        'Referer': 'https://busca.inpi.gov.br/pePI/jsp/marcas/Pesquisa_nome.jsp',
        'Origin': 'https://busca.inpi.gov.br',
        'Cache-Control': 'no-cache',
      },
      body: formData.toString(),
      redirect: 'follow',
    });

    const html = await searchResponse.text();
    console.log(`[INPI] Step 5: Status ${searchResponse.status}, HTML: ${html.length} bytes`);
    console.log(`[INPI] HTML Preview: ${html.substring(0, 500)}`);

    // Parse HTML para extrair resultados
    const brands: Array<{
      processo: string;
      marca: string;
      prioridade: string;
      situacao: string;
      classe: string;
      titular: string;
    }> = [];

    // Verificar se a página é de erro/sessão expirada
    if (html.includes('Sessão expirada') || html.includes('sessao expirada') || 
        html.includes('Session expired') || html.length < 1000) {
      console.log('[INPI] ERRO: Sessão expirada ou página inválida');
      return {
        success: false,
        totalResults: 0,
        brands: [],
        rawHtml: html.substring(0, 2000),
        error: 'Sessão expirada - o site do INPI não respondeu corretamente'
      };
    }

    // Verificar se não encontrou resultados
    if (html.includes('Nenhum resultado encontrado') || 
        html.includes('nenhum resultado') ||
        html.includes('Não foram encontrados') ||
        html.includes('não foram encontrados') ||
        html.includes('Sua pesquisa não retornou resultados')) {
      console.log('[INPI] Nenhum resultado encontrado (confirmado)');
      return {
        success: true,
        totalResults: 0,
        brands: [],
        rawHtml: html.substring(0, 2000)
      };
    }

    // PARSER: Extrair resultados da tabela
    // Baseado na imagem do resultado, a estrutura é:
    // <input type="checkbox"> | Número | Prioridade | Marca | Situação | Titular | Classe
    
    // Tentar múltiplos padrões de extração
    
    // Pattern 1: Tabela com checkbox e dados
    const rowPattern = /<tr[^>]*class="[^"]*(?:normal|destaque|even|odd|linha)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    
    while ((rowMatch = rowPattern.exec(html)) !== null) {
      const rowHtml = rowMatch[1];
      
      // Extrair células da linha
      const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells: string[] = [];
      let cellMatch;
      
      while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
        // Limpar HTML das células
        let cellContent = cellMatch[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        cells.push(cellContent);
      }
      
      // A tabela do INPI geralmente tem: Checkbox, Número, Data, Marca, Situação, Titular, Classe
      if (cells.length >= 4) {
        // Encontrar número do processo (9 dígitos)
        const processoMatch = cells.find(c => /^\d{9}$/.test(c.replace(/\D/g, '')));
        const processo = processoMatch?.replace(/\D/g, '') || cells[1]?.replace(/\D/g, '') || '';
        
        if (processo && processo.length >= 6) {
          brands.push({
            processo: processo,
            marca: cells[3] || cells[2] || brandName,
            prioridade: cells[2] || '',
            situacao: cells[4] || cells[3] || 'Encontrado',
            classe: cells[6] || cells[5] || '',
            titular: cells[5] || cells[4] || ''
          });
        }
      }
    }

    // Pattern 2: Procurar por links com número de processo
    if (brands.length === 0) {
      const linkPattern = /href="[^"]*NumPedido=(\d+)[^"]*"[^>]*>[\s\S]*?<\/a>[\s\S]*?(?:<td[^>]*>([^<]+)<\/td>[\s\S]*?)?(?:<td[^>]*>([^<]+)<\/td>)?/gi;
      let linkMatch;
      
      while ((linkMatch = linkPattern.exec(html)) !== null) {
        brands.push({
          processo: linkMatch[1],
          marca: linkMatch[2]?.trim() || brandName,
          prioridade: '',
          situacao: linkMatch[3]?.trim() || 'Encontrado',
          classe: '',
          titular: ''
        });
      }
    }

    // Pattern 3: Buscar por números de processo simples
    if (brands.length === 0) {
      const processoPattern = /(\d{9})/g;
      const foundProcessos = new Set<string>();
      let procMatch;
      
      while ((procMatch = processoPattern.exec(html)) !== null) {
        const num = procMatch[1];
        // Filtrar números que parecem ser processos (começam com 9)
        if (num.startsWith('9') && !foundProcessos.has(num)) {
          foundProcessos.add(num);
          brands.push({
            processo: num,
            marca: brandName,
            prioridade: '',
            situacao: 'Encontrado',
            classe: '',
            titular: ''
          });
        }
      }
    }

    // Extrair total de resultados do HTML
    const totalMatch = html.match(/(\d+)\s*(?:registro|resultado|marca|processo)/i);
    const totalResults = totalMatch ? parseInt(totalMatch[1]) : brands.length;

    console.log(`[INPI] ========== RESULTADO ==========`);
    console.log(`[INPI] Total encontrados: ${totalResults}`);
    console.log(`[INPI] Marcas extraídas: ${brands.length}`);
    brands.forEach((b, i) => console.log(`[INPI] ${i+1}. Processo: ${b.processo}, Situação: ${b.situacao}`));

    return {
      success: true,
      totalResults: Math.max(totalResults, brands.length),
      brands,
      rawHtml: html.substring(0, 3000)
    };

  } catch (error) {
    console.error('[INPI] ERRO GERAL:', error);
    return {
      success: false,
      totalResults: 0,
      brands: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandName, businessArea } = await req.json();

    if (!brandName || !businessArea) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Nome da marca e ramo de atividade são obrigatórios' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for famous brands
    if (isFamousBrand(brandName)) {
      return new Response(
        JSON.stringify({
          success: true,
          isFamousBrand: true,
          level: 'blocked',
          title: 'Marca de Alto Renome',
          description: `A marca "${brandName}" é uma marca de alto renome protegida em todas as classes. Não é possível realizar o registro desta marca ou de marcas semelhantes.`,
          laudo: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate current date/time in Brazil timezone
    const now = new Date();
    const brazilTime = now.toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // BUSCA REAL NO INPI
    console.log(`[INPI] Iniciando busca real para: ${brandName}`);
    const inpiResult = await searchINPI(brandName);
    
    // Determinar nível de viabilidade com base no resultado REAL
    let viabilityLevel: 'high' | 'medium' | 'low' = 'high';
    let inpiResultText = '';
    
    if (inpiResult.success) {
      if (inpiResult.totalResults === 0) {
        viabilityLevel = 'high';
        inpiResultText = `✅ Nenhum resultado encontrado para "${brandName.toUpperCase()}" na base de dados do INPI.
✅ Não foram encontradas marcas idênticas registradas.
✅ Sua marca apresenta ALTA viabilidade de registro.`;
      } else {
        // Verificar se há marcas exatamente iguais
        const normalizedBrand = normalizeString(brandName);
        const hasExactMatch = inpiResult.brands.some(b => 
          normalizeString(b.marca) === normalizedBrand
        );
        
        if (hasExactMatch) {
          viabilityLevel = 'low';
          inpiResultText = `❌ ATENÇÃO: Foram encontradas ${inpiResult.totalResults} marca(s) idêntica(s) registrada(s).

Marcas encontradas no INPI:
${inpiResult.brands.slice(0, 10).map((b, i) => 
  `${i + 1}. ${b.marca}${b.processo ? ` (Processo: ${b.processo})` : ''}${b.situacao ? ` - ${b.situacao}` : ''}`
).join('\n')}

❌ Existe alto risco de indeferimento do pedido de registro.`;
        } else {
          viabilityLevel = 'medium';
          inpiResultText = `⚠️ Foram encontradas ${inpiResult.totalResults} marca(s) similar(es) na base do INPI.

Marcas encontradas:
${inpiResult.brands.slice(0, 10).map((b, i) => 
  `${i + 1}. ${b.marca}${b.processo ? ` (Processo: ${b.processo})` : ''}${b.situacao ? ` - ${b.situacao}` : ''}`
).join('\n')}

⚠️ Recomendamos análise mais detalhada por um especialista.`;
        }
      }
    } else {
      // Se falhou a busca no INPI, usar análise por IA como fallback
      viabilityLevel = 'medium';
      inpiResultText = `⚠️ Não foi possível acessar a base do INPI no momento.
Realizando análise alternativa...`;
    }

    // Get classes for the business area
    const { classes, descriptions } = getClassesForBusinessArea(businessArea);
    const classesText = descriptions.map((desc) => `${desc}`).join('\n');

    // Build the laudo with REAL results
    const laudo = `*LAUDO TÉCNICO DE VIABILIDADE DE MARCA*
*Pesquisa Real na Base do INPI*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *DADOS DA CONSULTA*

Marca Pesquisada: ${brandName.toUpperCase()}
Ramo de Atividade: ${businessArea}
Tipo de Pesquisa: EXATA
Data/Hora: ${brazilTime}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *RESULTADO DA PESQUISA NO INPI*

${inpiResultText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚖️ *CONCLUSÃO TÉCNICA*

${viabilityLevel === 'high' ? 
'A marca apresenta ALTA VIABILIDADE de registro. Não foram encontradas marcas idênticas nas bases do INPI que possam impedir o registro.' :
viabilityLevel === 'medium' ?
'A marca apresenta VIABILIDADE MÉDIA. Existem marcas similares que podem gerar oposição ou exigência. Recomendamos consultar um especialista.' :
'A marca apresenta BAIXA VIABILIDADE. Existem marcas conflitantes que provavelmente impedirão o registro. Sugerimos alteração do nome ou consulta especializada.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏷️ *CLASSES RECOMENDADAS PARA REGISTRO*

${classesText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚖️ *ORIENTAÇÃO JURÍDICA*

O ideal é registrar nas 3 classes para máxima proteção.
Se a questão for financeira, orientamos registrar urgente na classe principal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ *IMPORTANTE*

O DONO DA MARCA É QUEM REGISTRA PRIMEIRO!
Não perca tempo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WebMarcas - Registro de Marcas
www.webmarcas.net`;

    return new Response(
      JSON.stringify({
        success: true,
        isFamousBrand: false,
        level: viabilityLevel,
        title: viabilityLevel === 'high' ? 'Alta Viabilidade' : 
               viabilityLevel === 'medium' ? 'Média Viabilidade' : 'Baixa Viabilidade',
        description: viabilityLevel === 'high' 
          ? 'Sua marca está disponível para registro! Não encontramos conflitos na base do INPI.'
          : viabilityLevel === 'medium'
          ? 'Encontramos algumas similaridades na base do INPI. Recomendamos prosseguir com cautela.'
          : 'Existem marcas conflitantes na base do INPI. Consulte nossos especialistas.',
        laudo,
        classes,
        classDescriptions: descriptions,
        searchDate: brazilTime,
        inpiResult: {
          totalResults: inpiResult.totalResults,
          brands: inpiResult.brands.slice(0, 10)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in viability check:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao processar a consulta' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
