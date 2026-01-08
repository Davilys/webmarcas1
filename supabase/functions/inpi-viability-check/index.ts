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
function extractAllCookies(headers: Headers, existingCookies: string = ''): string {
  const cookieMap = new Map<string, string>();
  
  // Parse existing cookies
  if (existingCookies) {
    existingCookies.split(';').forEach(c => {
      const parts = c.trim().split('=');
      if (parts.length >= 2) {
        cookieMap.set(parts[0], parts.slice(1).join('='));
      }
    });
  }
  
  // Try getSetCookie (Deno method for multiple Set-Cookie headers)
  try {
    const setCookies = headers.getSetCookie?.() || [];
    for (const cookie of setCookies) {
      const mainPart = cookie.split(';')[0];
      const parts = mainPart.split('=');
      if (parts.length >= 2) {
        cookieMap.set(parts[0].trim(), parts.slice(1).join('=').trim());
      }
    }
  } catch {
    // Fallback: try to get from raw header
    const rawCookie = headers.get('set-cookie');
    if (rawCookie) {
      // Split by comma but be careful with date values
      const cookieParts = rawCookie.split(/,(?=\s*[A-Za-z_-]+=)/);
      for (const cookie of cookieParts) {
        const mainPart = cookie.split(';')[0];
        const parts = mainPart.split('=');
        if (parts.length >= 2) {
          cookieMap.set(parts[0].trim(), parts.slice(1).join('=').trim());
        }
      }
    }
  }
  
  return Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}

// Função para fazer scraping real do INPI
async function searchINPI(brandName: string): Promise<{
  success: boolean;
  totalResults: number;
  brands: Array<{
    processo: string;
    marca: string;
    situacao: string;
    classe: string;
    titular: string;
  }>;
  error?: string;
}> {
  try {
    console.log(`[INPI] ========== INICIANDO BUSCA ==========`);
    console.log(`[INPI] Marca: "${brandName}"`);
    
    const baseHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    };

    // STEP 1: Página inicial
    console.log('[INPI] Step 1: Página inicial...');
    const step1 = await fetch('https://busca.inpi.gov.br/pePI/', {
      method: 'GET',
      headers: baseHeaders,
      redirect: 'follow',
    });
    let allCookies = extractAllCookies(step1.headers, '');
    console.log(`[INPI] Step 1: Status ${step1.status}, Cookies: ${allCookies.substring(0, 100)}`);

    // STEP 2: Continuar sem login
    console.log('[INPI] Step 2: Continuar sem login...');
    const step2 = await fetch('https://busca.inpi.gov.br/pePI/servlet/LoginController?action=login', {
      method: 'GET',
      headers: { 
        ...baseHeaders, 
        'Cookie': allCookies,
        'Referer': 'https://busca.inpi.gov.br/pePI/'
      },
      redirect: 'follow',
    });
    allCookies = extractAllCookies(step2.headers, allCookies);
    const step2Html = await step2.text();
    console.log(`[INPI] Step 2: Status ${step2.status}, HTML: ${step2Html.length} bytes, Cookies: ${allCookies.substring(0, 100)}`);

    // STEP 3: Acessar busca de marcas
    console.log('[INPI] Step 3: Acessando busca de marcas...');
    const step3 = await fetch('https://busca.inpi.gov.br/pePI/servlet/MarcasServletController?Action=iniciaBasica', {
      method: 'GET',
      headers: { 
        ...baseHeaders, 
        'Cookie': allCookies,
        'Referer': 'https://busca.inpi.gov.br/pePI/servlet/LoginController?action=login'
      },
      redirect: 'follow',
    });
    allCookies = extractAllCookies(step3.headers, allCookies);
    const step3Html = await step3.text();
    console.log(`[INPI] Step 3: Status ${step3.status}, HTML: ${step3Html.length} bytes`);
    
    // Log conteúdo para debug
    if (step3Html.length > 0) {
      console.log(`[INPI] Step 3 HTML: ${step3Html.substring(0, 300).replace(/\n/g, ' ')}`);
    }

    // STEP 4: Executar busca
    console.log('[INPI] Step 4: Executando busca EXATA...');
    
    const formParams = new URLSearchParams();
    formParams.append('Action', 'SearchMarcas');
    formParams.append('Marca', brandName.toUpperCase());
    formParams.append('tipoMarca', 'Exata');
    formParams.append('NCL', '');
    formParams.append('Titular', '');
    formParams.append('Situacao', '');
    formParams.append('Natureza', '');
    formParams.append('Apresentacao', '');
    formParams.append('ProcurarMarca', 'Pesquisar');

    const searchResponse = await fetch('https://busca.inpi.gov.br/pePI/servlet/MarcasServletController', {
      method: 'POST',
      headers: {
        ...baseHeaders,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': allCookies,
        'Referer': 'https://busca.inpi.gov.br/pePI/servlet/MarcasServletController?Action=iniciaBasica',
        'Origin': 'https://busca.inpi.gov.br',
      },
      body: formParams.toString(),
      redirect: 'follow',
    });

    const html = await searchResponse.text();
    console.log(`[INPI] Step 4: Status ${searchResponse.status}, HTML: ${html.length} bytes`);
    
    // Log preview do HTML para debug
    if (html.length > 0) {
      console.log(`[INPI] HTML Preview: ${html.substring(0, 500).replace(/\n/g, ' ')}`);
    }

    // Se HTML muito pequeno, falhou
    if (html.length < 500) {
      console.log('[INPI] Resposta muito curta - busca falhou');
      return {
        success: false,
        totalResults: 0,
        brands: [],
        error: 'O site do INPI não retornou resultados. O site pode estar bloqueando requisições automatizadas.'
      };
    }

    // Verificar se não encontrou resultados
    if (html.includes('Nenhum resultado') || 
        html.includes('nenhum resultado') ||
        html.includes('Não foram encontrados') ||
        html.includes('não foram encontrados') ||
        html.includes('0 registro')) {
      console.log('[INPI] Nenhum resultado encontrado');
      return {
        success: true,
        totalResults: 0,
        brands: []
      };
    }

    // Extrair resultados
    const brands: Array<{
      processo: string;
      marca: string;
      situacao: string;
      classe: string;
      titular: string;
    }> = [];

    // Procurar por números de processo (9 dígitos começando com 9)
    const processoRegex = /9\d{8}/g;
    const processos = new Set<string>();
    let match;
    while ((match = processoRegex.exec(html)) !== null) {
      processos.add(match[0]);
    }

    // Extrair dados das linhas da tabela
    const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
    const rows = html.match(rowRegex) || [];
    
    for (const row of rows) {
      // Verificar se a linha contém um processo
      const procMatch = row.match(/9\d{8}/);
      if (procMatch) {
        // Extrair células
        const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        const cells: string[] = [];
        let cellMatch;
        while ((cellMatch = cellRegex.exec(row)) !== null) {
          const content = cellMatch[1]
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (content) cells.push(content);
        }

        if (cells.length >= 3) {
          brands.push({
            processo: procMatch[0],
            marca: cells.find(c => c.toLowerCase().includes(brandName.toLowerCase())) || cells[2] || brandName,
            situacao: cells.find(c => c.includes('Registro') || c.includes('Pedido') || c.includes('Arquivado')) || cells[3] || '',
            classe: cells.find(c => /^NCL\s*\d+|^\d{2}$/.test(c)) || '',
            titular: cells.find(c => c.length > 20 && !c.includes('Registro') && !c.includes('Pedido')) || ''
          });
        }
      }
    }

    // Se não encontrou via tabela, tentar via processos simples
    if (brands.length === 0 && processos.size > 0) {
      processos.forEach(proc => {
        brands.push({
          processo: proc,
          marca: brandName.toUpperCase(),
          situacao: 'Encontrado no INPI',
          classe: '',
          titular: ''
        });
      });
    }

    // Extrair total de resultados
    const totalMatch = html.match(/(\d+)\s*(?:registro|resultado|marca|processo)/i);
    const total = totalMatch ? parseInt(totalMatch[1]) : brands.length;

    console.log(`[INPI] ========== RESULTADO ==========`);
    console.log(`[INPI] Total: ${total}, Marcas extraídas: ${brands.length}`);
    brands.forEach((b, i) => console.log(`[INPI] ${i+1}. ${b.processo} - ${b.marca} - ${b.situacao}`));

    return {
      success: true,
      totalResults: Math.max(total, brands.length),
      brands
    };

  } catch (error) {
    console.error('[INPI] ERRO:', error);
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
    const inpiResult = await searchINPI(brandName);
    
    // Get classes for the business area
    const { classes, descriptions } = getClassesForBusinessArea(businessArea);
    const classesText = descriptions.map((desc) => `${desc}`).join('\n');
    
    // Determinar nível de viabilidade
    let viabilityLevel: 'high' | 'medium' | 'low' = 'high';
    let resultText = '';
    
    if (inpiResult.success) {
      if (inpiResult.totalResults === 0) {
        viabilityLevel = 'high';
        resultText = `✅ Nenhum resultado encontrado para "${brandName.toUpperCase()}" na base do INPI.
✅ Não foram encontradas marcas idênticas registradas.
✅ Sua marca apresenta ALTA viabilidade de registro.`;
      } else {
        // Verificar situações das marcas encontradas
        const hasActiveRegistration = inpiResult.brands.some(b => 
          b.situacao.toLowerCase().includes('registro') && 
          b.situacao.toLowerCase().includes('vigor')
        );
        
        if (hasActiveRegistration) {
          viabilityLevel = 'low';
        } else {
          viabilityLevel = 'medium';
        }
        
        resultText = `Foram encontradas ${inpiResult.totalResults} marca(s) na base do INPI:\n\n`;
        inpiResult.brands.slice(0, 10).forEach((b, i) => {
          resultText += `${i + 1}. ${b.marca}\n`;
          resultText += `   Processo: ${b.processo}\n`;
          if (b.situacao) resultText += `   Situação: ${b.situacao}\n`;
          if (b.classe) resultText += `   Classe: ${b.classe}\n`;
          resultText += '\n';
        });
      }
    } else {
      // Busca falhou - informar no laudo
      viabilityLevel = 'medium';
      resultText = `⚠️ Não foi possível realizar a busca automática no INPI.
${inpiResult.error || 'O site pode estar temporariamente indisponível.'}

Para garantir a precisão, recomendamos que um especialista realize a consulta manual.`;
    }

    // Build the laudo
    const laudo = `*LAUDO TÉCNICO DE VIABILIDADE DE MARCA*
*Pesquisa na Base do INPI*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *DADOS DA CONSULTA*

Marca Pesquisada: ${brandName.toUpperCase()}
Ramo de Atividade: ${businessArea}
Tipo de Pesquisa: EXATA
Data/Hora: ${brazilTime}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *RESULTADO DA PESQUISA*

${resultText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚖️ *CONCLUSÃO TÉCNICA*

${viabilityLevel === 'high' ? 
'A marca apresenta ALTA VIABILIDADE de registro. Não foram encontradas marcas idênticas nas bases do INPI que possam impedir o registro.' :
viabilityLevel === 'medium' ?
'A marca apresenta VIABILIDADE MÉDIA. Podem existir marcas similares. Recomendamos consultar um especialista antes de prosseguir.' :
'A marca apresenta BAIXA VIABILIDADE. Existem marcas conflitantes registradas que provavelmente impedirão o registro. Sugerimos alteração do nome ou consulta especializada.'}

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
          ? 'Recomendamos consulta especializada antes de prosseguir.'
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
