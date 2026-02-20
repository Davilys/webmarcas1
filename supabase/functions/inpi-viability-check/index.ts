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

// Função de fallback para mapeamento fixo (usada se IA falhar)
function getClassesForBusinessAreaFallback(businessArea: string): { classes: number[], descriptions: string[] } {
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

// Função para sugerir classes NCL via IA baseado no ramo de atividade
async function suggestClassesWithAI(businessArea: string): Promise<{
  classes: number[];
  descriptions: string[];
}> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  
  // Fallback para mapeamento fixo se não tiver chave
  if (!openAIKey) {
    console.log('[CLASSES] OpenAI key não configurada, usando fallback');
    return getClassesForBusinessAreaFallback(businessArea);
  }
  
  const prompt = `Você é um especialista em registro de marcas no INPI Brasil e na Classificação Internacional de Nice (NCL).

Com base no ramo de atividade informado pelo cliente, sugira EXATAMENTE 3 classes NCL mais adequadas para proteger uma marca neste segmento de mercado.

Ramo de Atividade: "${businessArea}"

REGRAS IMPORTANTES:
- Retorne APENAS um JSON válido no formato especificado
- As classes devem ser números entre 1 e 45 (classes válidas NCL)
- As descrições devem ser claras, em português e começar com "Classe XX – "
- Priorize classes específicas e diretamente relacionadas ao ramo informado
- Evite classes genéricas como 35, 41, 42 quando existirem classes mais específicas
- Considere toda a cadeia do negócio (produtos, serviços, comercialização)

Formato de resposta (JSON puro, sem markdown, sem code blocks):
{
  "classes": [numero1, numero2, numero3],
  "descriptions": [
    "Classe XX – Descrição completa e detalhada da classe 1",
    "Classe XX – Descrição completa e detalhada da classe 2", 
    "Classe XX – Descrição completa e detalhada da classe 3"
  ]
}`;

  try {
    console.log(`[CLASSES] Consultando IA para ramo: "${businessArea}"`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em propriedade intelectual e classificação NCL do INPI Brasil. Responda sempre em JSON válido, sem markdown.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      console.error(`[CLASSES] Erro na API OpenAI: ${response.status}`);
      return getClassesForBusinessAreaFallback(businessArea);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      const parsed = JSON.parse(content);
      
      // Validar resposta
      if (Array.isArray(parsed.classes) && parsed.classes.length === 3 &&
          Array.isArray(parsed.descriptions) && parsed.descriptions.length === 3 &&
          parsed.classes.every((c: number) => c >= 1 && c <= 45)) {
        console.log(`[CLASSES] IA sugeriu para "${businessArea}":`, parsed.classes);
        return {
          classes: parsed.classes,
          descriptions: parsed.descriptions
        };
      } else {
        console.log('[CLASSES] Resposta da IA inválida, usando fallback');
      }
    }
  } catch (error) {
    console.error('[CLASSES] Erro ao consultar IA:', error);
  }
  
  // Fallback para mapeamento fixo
  console.log('[CLASSES] Usando fallback para:', businessArea);
  return getClassesForBusinessAreaFallback(businessArea);
}

// =====================================================
// NOVA FUNÇÃO: Busca real no INPI via Firecrawl
// =====================================================
async function searchINPIviaFirecrawl(brandName: string): Promise<{
  success: boolean;
  rawContent: string;
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
  // Estratégia 1: Tentar Firecrawl se tiver créditos
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (firecrawlKey) {
    const firecrawlResult = await tryFirecrawlScraping(brandName, firecrawlKey);
    if (firecrawlResult.success) return firecrawlResult;
    console.log('[INPI] Firecrawl indisponível, tentando scraping direto...');
  }

  // Estratégia 2: Scraping direto no INPI sem Firecrawl
  return await tryDirectINPIScraping(brandName);
}

// Tentativa via Firecrawl API
async function tryFirecrawlScraping(brandName: string, firecrawlKey: string): Promise<{
  success: boolean;
  rawContent: string;
  totalResults: number;
  brands: Array<{ processo: string; marca: string; situacao: string; classe: string; titular: string }>;
  error?: string;
}> {
  const urlsToTry = [
    `https://beta.busca.inpi.gov.br/marca/busca?texto=${encodeURIComponent(brandName)}&tipoBusca=PI`,
    `https://busca.inpi.gov.br/pePI/servlet/MarcasServlet?Action=SearchMandatoryFields&Tipo=1&NomeMarca=${encodeURIComponent(brandName)}`,
  ];

  for (const url of urlsToTry) {
    console.log(`[INPI-FC] Tentando Firecrawl: ${url}`);
    try {
      const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html'],
          onlyMainContent: false,
          waitFor: 3000,
        }),
      });

      if (fcResponse.status === 402) {
        console.log('[INPI-FC] Créditos Firecrawl insuficientes (402)');
        return { success: false, rawContent: '', totalResults: 0, brands: [], error: 'Créditos Firecrawl insuficientes' };
      }

      if (!fcResponse.ok) {
        const errText = await fcResponse.text();
        console.log(`[INPI-FC] Erro ${fcResponse.status}: ${errText.substring(0, 100)}`);
        continue;
      }

      const fcData = await fcResponse.json();
      const rawContent = fcData.data?.markdown || fcData.markdown || fcData.data?.html || fcData.html || '';

      console.log(`[INPI-FC] Conteúdo: ${rawContent.length} chars`);

      if (rawContent.length < 100) continue;

      const isLoginPage = rawContent.toLowerCase().includes('login') && rawContent.toLowerCase().includes('senha') && rawContent.length < 2000;
      const isCaptcha = rawContent.toLowerCase().includes('captcha') || rawContent.toLowerCase().includes('robot');
      if (isLoginPage || isCaptcha) continue;

      const brands = extractBrandsFromContent(rawContent, brandName);
      return { success: true, rawContent, totalResults: brands.length, brands };

    } catch (err) {
      console.error(`[INPI-FC] Erro:`, err);
    }
  }

  return { success: false, rawContent: '', totalResults: 0, brands: [], error: 'Firecrawl falhou' };
}

// Scraping direto no INPI sem Firecrawl (usando fetch nativo)
async function tryDirectINPIScraping(brandName: string): Promise<{
  success: boolean;
  rawContent: string;
  totalResults: number;
  brands: Array<{ processo: string; marca: string; situacao: string; classe: string; titular: string }>;
  error?: string;
}> {
  const urlsToTry = [
    // API REST do novo sistema INPI beta
    `https://api.inpi.gov.br/marca/v1/pesquisar?nome=${encodeURIComponent(brandName)}&tipo=nominativa`,
    // Sistema de busca principal INPI
    `https://busca.inpi.gov.br/pePI/servlet/MarcasServlet?Action=SearchMandatoryFields&Tipo=1&NomeMarca=${encodeURIComponent(brandName)}&Pesquisa=pesquisar`,
    // Beta do INPI
    `https://beta.busca.inpi.gov.br/marca/busca?texto=${encodeURIComponent(brandName)}&tipoBusca=PI`,
  ];

  for (const url of urlsToTry) {
    console.log(`[INPI-DIRECT] Tentando: ${url}`);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(8000),
      });

      console.log(`[INPI-DIRECT] Status: ${response.status}`);

      if (!response.ok) {
        console.log(`[INPI-DIRECT] Erro HTTP ${response.status}, tentando próximo...`);
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      console.log(`[INPI-DIRECT] Conteúdo: ${text.length} chars, tipo: ${contentType}`);

      if (text.length < 50) {
        console.log('[INPI-DIRECT] Resposta muito curta');
        continue;
      }

      // Se for JSON (API REST)
      if (contentType.includes('application/json') || text.startsWith('{') || text.startsWith('[')) {
        try {
          const jsonData = JSON.parse(text);
          console.log('[INPI-DIRECT] Resposta JSON recebida');
          const brands = extractBrandsFromJSON(jsonData, brandName);
          if (brands.length > 0 || JSON.stringify(jsonData).length > 100) {
            return { success: true, rawContent: text, totalResults: brands.length, brands };
          }
        } catch (e) {
          console.log('[INPI-DIRECT] Não é JSON válido');
        }
      }

      // Se for HTML, verificar se tem conteúdo útil
      const isLoginPage = text.toLowerCase().includes('login') && text.toLowerCase().includes('senha') && text.length < 3000;
      const isErrorPage = text.toLowerCase().includes('erro') && text.length < 1000;
      if (isLoginPage || isErrorPage) {
        console.log('[INPI-DIRECT] Página de login/erro detectada');
        continue;
      }

      // Checar se menciona a marca ou termos do INPI
      const hasBrandMention = text.toUpperCase().includes(brandName.toUpperCase());
      const hasINPIContent = text.toLowerCase().includes('marca') || text.toLowerCase().includes('processo') || text.toLowerCase().includes('inpi');

      if (hasBrandMention || hasINPIContent) {
        const brands = extractBrandsFromContent(text, brandName);
        console.log(`[INPI-DIRECT] Extraídas ${brands.length} marcas do HTML`);
        return { success: true, rawContent: text.substring(0, 5000), totalResults: brands.length, brands };
      }

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('timeout') || errMsg.includes('AbortError')) {
        console.log(`[INPI-DIRECT] Timeout em ${url}`);
      } else {
        console.error(`[INPI-DIRECT] Erro:`, errMsg);
      }
    }
  }

  console.log('[INPI-DIRECT] Todos os endpoints INPI falharam');
  return {
    success: false,
    rawContent: '',
    totalResults: 0,
    brands: [],
    error: 'Portal INPI indisponível para scraping direto'
  };
}

// Extrai marcas de resposta JSON (API REST INPI)
function extractBrandsFromJSON(data: any, brandName: string): Array<{
  processo: string; marca: string; situacao: string; classe: string; titular: string;
}> {
  const brands: Array<{ processo: string; marca: string; situacao: string; classe: string; titular: string }> = [];

  const items = Array.isArray(data) ? data : (data.items || data.results || data.marcas || data.data || []);
  
  for (const item of items.slice(0, 20)) {
    brands.push({
      processo: item.numeroProcesso || item.processo || item.number || item.id || '',
      marca: item.nomeMarca || item.marca || item.name || brandName.toUpperCase(),
      situacao: item.situacao || item.status || item.statusMarca || 'Encontrado',
      classe: item.classeNice || item.classe || item.class || '',
      titular: item.titular || item.owner || item.titularMarca || '',
    });
  }

  return brands;
}

// Extrai dados de marcas do conteúdo markdown/html do INPI
function extractBrandsFromContent(content: string, brandName: string): Array<{
  processo: string;
  marca: string;
  situacao: string;
  classe: string;
  titular: string;
}> {
  const brands: Array<{ processo: string; marca: string; situacao: string; classe: string; titular: string; }> = [];
  
  // Padrões comuns no INPI: número de processo (ex: 912345678 ou BR502021123456)
  const processoPattern = /(?:processo|nr\.?|número|pedido)[:\s]*([0-9]{7,12})/gi;
  const nclPattern = /(?:classe|ncl)[:\s]*([0-9]{1,2})/gi;
  const situacaoKeywords = ['deferido', 'indeferido', 'arquivado', 'pedido em exame', 'registrado', 'concedido', 'sobrestado', 'publicado'];
  
  // Extrair blocos de resultado (linhas que contêm informações de marcas)
  const lines = content.split('\n');
  let currentBrand: Partial<{ processo: string; marca: string; situacao: string; classe: string; titular: string }> = {};
  
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    
    // Detectar número de processo
    const processoMatch = line.match(/([0-9]{8,12})/);
    if (processoMatch && !lineLower.includes('data')) {
      if (currentBrand.processo && currentBrand.marca) {
        brands.push({
          processo: currentBrand.processo || '',
          marca: currentBrand.marca || brandName.toUpperCase(),
          situacao: currentBrand.situacao || 'Em análise',
          classe: currentBrand.classe || '',
          titular: currentBrand.titular || '',
        });
        currentBrand = {};
      }
      currentBrand.processo = processoMatch[1];
    }
    
    // Detectar nome da marca (linha que contém o nome buscado)
    if (line.toUpperCase().includes(brandName.toUpperCase()) && line.length < 200) {
      currentBrand.marca = brandName.toUpperCase();
    }
    
    // Detectar situação
    for (const kw of situacaoKeywords) {
      if (lineLower.includes(kw)) {
        currentBrand.situacao = kw.charAt(0).toUpperCase() + kw.slice(1);
        break;
      }
    }
    
    // Detectar classe NCL
    const classeMatch = line.match(/(?:classe|ncl)[:\s#]*([0-9]{1,2})/i);
    if (classeMatch) {
      currentBrand.classe = classeMatch[1];
    }
    
    // Detectar titular (linhas com CNPJ ou CPF ou razão social)
    if (lineLower.includes('titular') || lineLower.includes('depositante') || lineLower.includes('s/a') || lineLower.includes('ltda')) {
      const titularText = line.replace(/titular[:\s]*/i, '').trim();
      if (titularText.length > 3 && titularText.length < 100) {
        currentBrand.titular = titularText;
      }
    }
  }
  
  // Adicionar o último resultado se existir
  if (currentBrand.processo || currentBrand.marca) {
    brands.push({
      processo: currentBrand.processo || '',
      marca: currentBrand.marca || brandName.toUpperCase(),
      situacao: currentBrand.situacao || 'Encontrado',
      classe: currentBrand.classe || '',
      titular: currentBrand.titular || '',
    });
  }
  
  // Se não conseguiu extrair estruturado, mas tem conteúdo com menção da marca
  if (brands.length === 0 && content.toUpperCase().includes(brandName.toUpperCase())) {
    brands.push({
      processo: '',
      marca: brandName.toUpperCase(),
      situacao: 'Menção encontrada na base INPI',
      classe: '',
      titular: '',
    });
  }
  
  return brands.slice(0, 20);
}

// =====================================================
// NOVA FUNÇÃO: Análise GPT-5.2 dos dados INPI reais
// =====================================================
async function analyzeWithGPT52(
  brandName: string,
  businessArea: string,
  inpiRawContent: string,
  inpiSuccess: boolean,
  extractedBrands: Array<{ processo: string; marca: string; situacao: string; classe: string; titular: string }>,
  fallbackBrands: Array<{ processo: string; marca: string; situacao: string; classe: string; titular?: string; pais?: string }>,
  patternScore: number,
  patternObs: string[]
): Promise<{
  viabilidade_geral: string;
  laudo_viabilidade: string;
  nivel: 'high' | 'medium' | 'low';
  resultado_encontrado: boolean;
}> {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableKey) {
    console.log('[GPT52] LOVABLE_API_KEY não configurada, usando análise padrão');
    return buildFallbackAnalysis(brandName, businessArea, extractedBrands, fallbackBrands, patternScore, patternObs, inpiSuccess);
  }

  // Montar o contexto de dados para o GPT-5.2
  let dadosBusca = '';
  
  if (inpiSuccess && inpiRawContent) {
    dadosBusca = `
=== DADOS REAIS DO PORTAL INPI (via scraping) ===
Conteúdo extraído do portal de busca do INPI:
${inpiRawContent.substring(0, 3000)}

Processos estruturados extraídos: ${extractedBrands.length}
${extractedBrands.map(b => `- Processo: ${b.processo} | Marca: ${b.marca} | Situação: ${b.situacao} | Classe: ${b.classe} | Titular: ${b.titular}`).join('\n')}
`;
  } else if (fallbackBrands.length > 0) {
    dadosBusca = `
=== DADOS DA BASE WIPO (fallback - INPI indisponível) ===
Total encontrado: ${fallbackBrands.length} marcas similares
${fallbackBrands.slice(0, 10).map(b => `- Processo: ${b.processo} | Marca: ${b.marca} | Situação: ${b.situacao} | Classe: ${b.classe} | Titular: ${b.titular || ''} | País: ${b.pais || ''}`).join('\n')}
`;
  } else {
    dadosBusca = `
=== SEM RESULTADOS NA BUSCA ===
Nenhuma marca encontrada nas bases consultadas.
Score de distintividade da marca: ${patternScore}/100
Análise de padrões:
${patternObs.join('\n')}
`;
  }

  const systemPrompt = `Você é um especialista sênior em propriedade intelectual do INPI Brasil com mais de 15 anos de experiência em registro de marcas. 
Você analisa pedidos de registro e emite laudos técnicos de viabilidade baseados em dados reais do INPI.
Responda SEMPRE em JSON válido, sem markdown, sem code blocks.`;

  const userPrompt = `Analise a viabilidade de registro da seguinte marca no INPI Brasil:

MARCA: "${brandName}"
RAMO DE ATIVIDADE: "${businessArea}"

${dadosBusca}

Com base nessa análise, emita um laudo técnico detalhado.

REGRAS:
- Se encontrou marcas ativas/registradas idênticas ou muito similares → nível "low" (RISCO ALTO)
- Se encontrou marcas similares mas em situação arquivada/expirada → nível "medium" (RISCO MODERADO)  
- Se não encontrou conflitos relevantes → nível "high" (Viabilidade Favorável)
- O laudo deve mencionar explicitamente se a busca foi feita no INPI real ou em base alternativa
- Seja técnico, específico e profissional

Retorne APENAS este JSON:
{
  "viabilidade_geral": "Viabilidade Técnica Favorável" | "RISCO MODERADO" | "RISCO ALTO",
  "nivel": "high" | "medium" | "low",
  "resultado_encontrado": true | false,
  "laudo_viabilidade": "texto completo do laudo técnico em português, mínimo 3 parágrafos"
}`;

  try {
    console.log('[GPT52] Enviando análise para GPT-5.2 via Lovable AI Gateway');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_completion_tokens: 1500,
      }),
    });

    console.log(`[GPT52] Status: ${response.status}`);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[GPT52] Erro: ${errText.substring(0, 300)}`);
      return buildFallbackAnalysis(brandName, businessArea, extractedBrands, fallbackBrands, patternScore, patternObs, inpiSuccess);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('[GPT52] Resposta vazia');
      return buildFallbackAnalysis(brandName, businessArea, extractedBrands, fallbackBrands, patternScore, patternObs, inpiSuccess);
    }

    console.log(`[GPT52] Resposta: ${content.substring(0, 300)}`);

    // Limpar JSON da resposta (remover possível markdown)
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleanContent);
      
      if (parsed.viabilidade_geral && parsed.nivel && parsed.laudo_viabilidade) {
        console.log(`[GPT52] Análise concluída: ${parsed.viabilidade_geral}`);
        return {
          viabilidade_geral: parsed.viabilidade_geral,
          laudo_viabilidade: parsed.laudo_viabilidade,
          nivel: parsed.nivel as 'high' | 'medium' | 'low',
          resultado_encontrado: parsed.resultado_encontrado || false,
        };
      }
    } catch (parseErr) {
      console.error('[GPT52] Erro ao parsear JSON:', parseErr);
    }

  } catch (err) {
    console.error('[GPT52] Erro na chamada:', err);
  }

  return buildFallbackAnalysis(brandName, businessArea, extractedBrands, fallbackBrands, patternScore, patternObs, inpiSuccess);
}

// Análise de fallback quando GPT-5.2 não está disponível
function buildFallbackAnalysis(
  brandName: string,
  businessArea: string,
  inpiBrands: Array<{ processo: string; marca: string; situacao: string; classe: string; titular: string }>,
  wipoBrands: Array<{ processo: string; marca: string; situacao: string; classe: string; titular?: string; pais?: string }>,
  patternScore: number,
  patternObs: string[],
  inpiSuccess: boolean
): {
  viabilidade_geral: string;
  laudo_viabilidade: string;
  nivel: 'high' | 'medium' | 'low';
  resultado_encontrado: boolean;
} {
  const allBrands = inpiBrands.length > 0 ? inpiBrands : wipoBrands;
  const totalFound = allBrands.length;
  
  const hasActiveConflict = allBrands.some(b => 
    b.situacao.toLowerCase().includes('regist') || 
    b.situacao.toLowerCase().includes('ativo') ||
    b.situacao.toLowerCase().includes('concedido') ||
    b.situacao.toLowerCase().includes('deferido')
  );

  let nivel: 'high' | 'medium' | 'low' = 'high';
  let viabilidade_geral = 'Viabilidade Técnica Favorável';

  if (hasActiveConflict) {
    nivel = 'low';
    viabilidade_geral = 'RISCO ALTO';
  } else if (totalFound > 0) {
    nivel = 'medium';
    viabilidade_geral = 'RISCO MODERADO';
  } else if (patternScore < 50) {
    nivel = 'medium';
    viabilidade_geral = 'RISCO MODERADO';
  }

  const fonte = inpiSuccess ? 'portal oficial do INPI Brasil' : 'base global WIPO (INPI temporariamente indisponível)';
  
  const laudo_viabilidade = totalFound > 0
    ? `Foram encontradas ${totalFound} ocorrência(s) na ${fonte} para a marca "${brandName.toUpperCase()}". ${hasActiveConflict ? 'Identificamos marcas com registro ativo em situação que pode conflitar com seu pedido, indicando risco elevado de indeferimento.' : 'As marcas encontradas não apresentam registro ativo no momento, indicando risco moderado.'} Recomendamos análise especializada antes de prosseguir com o depósito.`
    : `Não foram encontradas ocorrências da marca "${brandName.toUpperCase()}" na ${fonte}. A análise de padrões indica um score de distintividade de ${patternScore}/100. ${patternObs.join(' ')} Recomendamos prosseguir com o registro.`;

  return {
    viabilidade_geral,
    laudo_viabilidade,
    nivel,
    resultado_encontrado: totalFound > 0,
  };
}

// Análise de padrões da marca para viabilidade
function analyzeBrandPattern(brandName: string): {
  score: number;
  observations: string[];
} {
  const observations: string[] = [];
  let score = 100;
  
  const normalized = normalizeString(brandName);
  
  if (normalized.length < 3) {
    score -= 30;
    observations.push('❌ Marca muito curta (menos de 3 caracteres) - difícil de registrar');
  } else if (normalized.length <= 4) {
    score -= 15;
    observations.push('⚠️ Marca curta - pode haver muitas marcas similares');
  } else {
    observations.push('✅ Comprimento adequado da marca');
  }
  
  const genericWords = ['servicos', 'comercio', 'brasil', 'solucoes', 'grupo', 'consultoria', 'digital', 'tech', 'plus', 'premium', 'express', 'master', 'pro', 'super', 'mega', 'top', 'max', 'best'];
  const hasGenericWord = genericWords.some(word => normalized.includes(word));
  if (hasGenericWord) {
    score -= 20;
    observations.push('⚠️ Contém palavra genérica - recomendamos adicionar elemento distintivo');
  }
  
  if (/\d/.test(brandName)) {
    observations.push('ℹ️ Contém números - comum em marcas modernas');
  }
  
  const commonWords = ['casa', 'loja', 'mundo', 'novo', 'vida', 'arte', 'sol', 'mar', 'terra', 'agua', 'luz', 'cor', 'flor', 'lar'];
  const isInventedWord = !commonWords.some(word => normalized.includes(word)) && normalized.length > 5;
  if (isInventedWord && !hasGenericWord) {
    score += 10;
    observations.push('✅ Aparenta ser marca inventada/distintiva - maior proteção');
  }
  
  if (/[^a-zA-Z0-9\s]/.test(brandName.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
    observations.push('ℹ️ Contém caracteres especiais');
  }
  
  const words = brandName.trim().split(/\s+/);
  if (words.length >= 2) {
    observations.push('✅ Marca composta por múltiplas palavras - boa distintividade');
  }
  
  score = Math.max(0, Math.min(100, score));
  
  return { score, observations };
}

// Função para buscar no WIPO Global Brand Database (mantida como fallback)
async function searchWIPO(brandName: string): Promise<{
  success: boolean;
  totalResults: number;
  brands: Array<{
    processo: string;
    marca: string;
    situacao: string;
    classe: string;
    titular: string;
    pais: string;
  }>;
  error?: string;
}> {
  try {
    console.log(`[WIPO] Iniciando busca fallback para: "${brandName}"`);
    
    const searchStructure = {
      _id: Math.random().toString(36).substring(2, 6),
      boolean: 'AND',
      bricks: [{
        _id: Math.random().toString(36).substring(2, 6),
        key: 'brandName',
        value: brandName,
        strategy: 'Simple'
      }]
    };
    
    const params = new URLSearchParams({
      sort: 'score desc',
      rows: '30',
      asStructure: JSON.stringify(searchStructure),
      fg: '_void_',
      _: Date.now().toString()
    });
    
    const wipoJsonUrl = `https://branddb.wipo.int/en/similarname/results?${params.toString()}`;
    
    const response = await fetch(wipoJsonUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://branddb.wipo.int/en/similarname',
        'Origin': 'https://branddb.wipo.int',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    console.log(`[WIPO] Status: ${response.status}`);
    const text = await response.text();
    
    if (text.startsWith('{') || text.startsWith('[')) {
      const data = JSON.parse(text);
      const docs = data.response?.docs || data.docs || data.results || [];
      const numFound = data.response?.numFound || data.numFound || data.total || docs.length;

      const brands = docs.map((doc: any) => ({
        processo: doc.AN || doc.applicationNumber || doc.RN || doc.registrationNumber || '',
        marca: doc.BN || doc.brandName || doc.name || '',
        situacao: doc.ST || doc.status || doc.statusDescription || 'Registrado',
        classe: Array.isArray(doc.NC) ? doc.NC.join(', ') : (doc.NC || doc.niceClasses || ''),
        titular: doc.HOL || doc.holderName || doc.holder || '',
        pais: doc.OO || doc.origin || doc.country || ''
      }));

      const brazilBrands = brands.filter((b: any) => b.pais === 'BR');
      const otherBrands = brands.filter((b: any) => b.pais !== 'BR');
      const sortedBrands = [...brazilBrands, ...otherBrands];

      console.log(`[WIPO] Encontradas: ${brands.length} marcas, BR: ${brazilBrands.length}`);

      return {
        success: true,
        totalResults: numFound,
        brands: sortedBrands.slice(0, 15)
      };
    }
    
    if (text.includes('altcha') || text.includes('challenge') || text.includes('Just a moment')) {
      return {
        success: false,
        totalResults: 0,
        brands: [],
        error: 'Verificação de segurança ativa no WIPO'
      };
    }
    
    return { success: true, totalResults: 0, brands: [] };

  } catch (error) {
    console.error('[WIPO] ERRO:', error);
    return {
      success: false,
      totalResults: 0,
      brands: [],
      error: error instanceof Error ? error.message : 'Erro na busca WIPO'
    };
  }
}

// =====================================================
// HANDLER PRINCIPAL
// =====================================================
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

    // Data/hora Brasil
    const now = new Date();
    const brazilTime = now.toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Análise de padrões (sempre funciona)
    const patternAnalysis = analyzeBrandPattern(brandName);

    // ETAPA 1: Busca real no INPI via Firecrawl (principal)
    console.log(`[MAIN] Iniciando busca INPI para: "${brandName}"`);
    const inpiResult = await searchINPIviaFirecrawl(brandName);
    
    // ETAPA 2: Fallback WIPO se INPI falhou
    let wipoBrands: Array<{ processo: string; marca: string; situacao: string; classe: string; titular: string; pais: string }> = [];
    if (!inpiResult.success) {
      console.log('[MAIN] INPI indisponível, tentando WIPO como fallback...');
      const wipoResult = await searchWIPO(brandName);
      if (wipoResult.success) {
        wipoBrands = wipoResult.brands;
        console.log(`[MAIN] WIPO retornou ${wipoBrands.length} resultados`);
      }
    }

    // ETAPA 3: Análise GPT-5.2 com todos os dados coletados
    const gptAnalysis = await analyzeWithGPT52(
      brandName,
      businessArea,
      inpiResult.rawContent,
      inpiResult.success,
      inpiResult.brands,
      wipoBrands,
      patternAnalysis.score,
      patternAnalysis.observations
    );

    // ETAPA 4: Sugestão de classes NCL (mantida como está)
    const { classes, descriptions } = await suggestClassesWithAI(businessArea);
    const classesText = descriptions.map((desc: string) => `${desc}`).join('\n');

    // Determinar fonte dos dados para o laudo
    const fonteBusca = inpiResult.success 
      ? '🏛️ Portal Oficial INPI Brasil (busca real)'
      : wipoBrands.length > 0 
        ? '🌐 Base Global WIPO (INPI temporariamente indisponível)'
        : '📊 Análise de padrões (portais indisponíveis)';

    const totalEncontrado = inpiResult.success ? inpiResult.totalResults : wipoBrands.length;
    const allBrandsForDisplay = inpiResult.success ? inpiResult.brands : wipoBrands.map(b => ({ ...b }));

    // Construir texto de resultado para o laudo
    let resultText = '';
    if (allBrandsForDisplay.length > 0) {
      resultText = `Foram encontradas ${totalEncontrado} ocorrência(s) na base consultada:\n\n`;
      allBrandsForDisplay.slice(0, 10).forEach((b, i) => {
        resultText += `${i + 1}. ${b.marca}\n`;
        if (b.processo) resultText += `   Processo: ${b.processo}\n`;
        if (b.situacao) resultText += `   Situação: ${b.situacao}\n`;
        if (b.classe) resultText += `   Classe NCL: ${b.classe}\n`;
        if (b.titular) resultText += `   Titular: ${b.titular}\n`;
        resultText += '\n';
      });
    } else {
      resultText = `Nenhuma ocorrência encontrada para "${brandName.toUpperCase()}" nas bases consultadas.\n\n`;
      resultText += patternAnalysis.observations.join('\n');
    }

    // Build o laudo final (layout mantido idêntico ao original)
    const laudo = `*LAUDO TÉCNICO DE VIABILIDADE DE MARCA*
*${inpiResult.success ? 'Pesquisa Real no Portal INPI Brasil' : 'Pesquisa na Base Global WIPO + INPI'}*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *DADOS DA CONSULTA*

Marca Pesquisada: ${brandName.toUpperCase()}
Ramo de Atividade: ${businessArea}
Tipo de Pesquisa: EXATA
Fonte: ${fonteBusca}
Data/Hora: ${brazilTime}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *RESULTADO DA PESQUISA*

${resultText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 *ANÁLISE TÉCNICA IA (GPT-5.2 Especialista em PI)*

${gptAnalysis.laudo_viabilidade}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚖️ *CONCLUSÃO TÉCNICA*

${gptAnalysis.viabilidade_geral === 'Viabilidade Técnica Favorável'
  ? 'A marca apresenta ALTA VIABILIDADE de registro. Não foram encontradas marcas idênticas ativas nas bases consultadas que possam impedir o registro.'
  : gptAnalysis.viabilidade_geral === 'RISCO MODERADO'
  ? 'A marca apresenta VIABILIDADE MÉDIA. Existem marcas similares nas bases consultadas. Recomendamos consultar um especialista antes de prosseguir.'
  : 'A marca apresenta BAIXA VIABILIDADE. Existem marcas conflitantes registradas que provavelmente impedirão o registro. Sugerimos alteração do nome ou consulta especializada.'}

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
        level: gptAnalysis.nivel,
        title: gptAnalysis.nivel === 'high' ? 'Alta Viabilidade' : 
               gptAnalysis.nivel === 'medium' ? 'Média Viabilidade' : 'Baixa Viabilidade',
        description: gptAnalysis.nivel === 'high' 
          ? 'Sua marca está disponível para registro! Não encontramos conflitos significativos na base do INPI.'
          : gptAnalysis.nivel === 'medium'
          ? 'Recomendamos consulta especializada antes de prosseguir.'
          : 'Existem marcas conflitantes na base do INPI. Consulte nossos especialistas.',
        laudo,
        classes,
        classDescriptions: descriptions,
        searchDate: brazilTime,
        analysisResult: {
          totalResults: totalEncontrado,
          brands: allBrandsForDisplay.slice(0, 10),
          patternScore: patternAnalysis.score,
          searchAttempted: inpiResult.success || wipoBrands.length > 0,
          inpiSearchSuccess: inpiResult.success,
          source: inpiResult.success ? 'inpi' : wipoBrands.length > 0 ? 'wipo' : 'pattern',
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
