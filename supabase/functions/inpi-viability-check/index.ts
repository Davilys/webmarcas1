// ============================================================
// MOTOR V2 "GRANDIOSO PREMIUM" — inpi-viability-check
// Versão: 2.0.0
// Módulos: Alto Renome (Levenshtein+Soundex) | INPI via Firecrawl
//          | CNPJ.ws | Web via Firecrawl | GPT-5.2 via Lovable AI
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// ETAPA 1 — LISTA EXPANDIDA DE MARCAS DE ALTO RENOME (100+)
// ============================================================
const FAMOUS_BRANDS_V2: string[] = [
  // Esportes & Moda Esportiva
  'Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Asics', 'Mizuno', 'Under Armour',
  'Vans', 'Converse', 'Fila',
  // Bebidas & Alimentos
  'Coca-Cola', 'Pepsi', 'Red Bull', 'Heineken', 'Budweiser', 'Ambev', 'Brahma', 'Skol',
  'Antarctica', 'Nestlé', 'Danone', 'Unilever',
  // Tecnologia Global
  'Apple', 'Google', 'Microsoft', 'Amazon', 'Samsung', 'Sony', 'LG', 'Intel', 'IBM',
  'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'AMD', 'Nvidia', 'Oracle', 'Cisco', 'Qualcomm',
  // Automotivo
  'Tesla', 'Toyota', 'Honda', 'BMW', 'Mercedes-Benz', 'Mercedes', 'Audi', 'Volkswagen',
  'Ferrari', 'Lamborghini', 'Porsche', 'Ford', 'Chevrolet', 'Hyundai', 'Kia', 'Fiat',
  'Renault', 'Peugeot', 'Citroen', 'Jeep', 'Land Rover', 'Mitsubishi', 'Volvo', 'Subaru',
  // Entretenimento & Mídia
  'Netflix', 'Disney', 'Pixar', 'Marvel', 'DC', 'Warner', 'Universal', 'Paramount',
  'Spotify', 'YouTube', 'Globo', 'Record', 'SBT',
  // Redes Sociais & Apps
  'TikTok', 'Instagram', 'Facebook', 'WhatsApp', 'Telegram', 'LinkedIn', 'Twitter', 'X',
  'Snapchat', 'Pinterest', 'Uber', 'iFood', '99', 'Rappi',
  // Financeiro
  'Visa', 'Mastercard', 'American Express', 'PayPal', 'Itaú', 'Bradesco', 'Santander',
  'Banco do Brasil', 'Caixa', 'Nubank', 'XP', 'PicPay', 'Stone', 'PagSeguro', 'Cielo',
  // Fast Food & Restaurantes
  'McDonald\'s', 'McDonalds', 'Burger King', 'KFC', 'Subway', 'Starbucks', 'Pizza Hut',
  'Domino\'s', 'Dominos', 'Habib\'s', 'Habibs', 'Outback', 'Bob\'s', 'Bobs',
  // E-commerce & Varejo
  'Shopee', 'AliExpress', 'Alibaba', 'eBay', 'Walmart', 'Carrefour', 'Mercado Livre',
  'MercadoLivre', 'Magazine Luiza', 'Magalu', 'Casas Bahia', 'Amazon',
  // Luxo & Moda
  'Rolex', 'Cartier', 'Louis Vuitton', 'Gucci', 'Prada', 'Chanel', 'Dior', 'Versace',
  'Hermès', 'Hermes', 'Burberry', 'Tiffany', 'Armani', 'Zara', 'H&M',
  // Telcos Brasil
  'Claro', 'Vivo', 'TIM',
  // Beleza & Cosméticos
  'O Boticário', 'Boticário', 'Natura', 'Avon', 'L\'Oréal', 'Loreal', 'Pantene',
  // Petróleo & Energia
  'Petrobras', 'Shell', 'BP', 'Exxon',
  // Outros reconhecidos
  'Ray-Ban', 'Rayban', 'Oakley', 'JBL', 'Bose', 'Beats', 'Swarovski', 'Pandora',
  'Philips', 'Panasonic', 'Braun', 'Gillette', 'Johnson', 'Johnson & Johnson',
  'Pfizer', 'Bayer', 'Volkswagen', 'Siemens', 'Bosch', 'Caterpillar',
];

// ============================================================
// ALGORITMOS DE SIMILARIDADE — LEVENSHTEIN + SOUNDEX PT
// ============================================================

function normalizeString(str: string): string {
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function levenshteinSimilarity(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const dist = levenshteinDistance(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

function soundexPT(str: string): string {
  if (!str) return '';
  const s = normalizeString(str).replace(/\s/g, '');
  if (!s) return '';
  const first = s[0].toUpperCase();
  const MAP: Record<string, string> = {
    b: '1', f: '1', p: '1', v: '1',
    c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
    d: '3', t: '3',
    l: '4',
    m: '5', n: '5',
    r: '6',
  };
  let code = first;
  let prev = MAP[first.toLowerCase()] || '0';
  for (let i = 1; i < s.length && code.length < 4; i++) {
    const c = s[i].toLowerCase();
    if ('aeiouyhw'.includes(c)) { prev = '0'; continue; }
    const d = MAP[c] || '0';
    if (d !== '0' && d !== prev) { code += d; prev = d; }
  }
  return code.padEnd(4, '0');
}

interface FamousBrandResult {
  is: boolean;
  matchedBrand?: string;
  similarity?: number;
}

function checkFamousBrand(brandName: string): FamousBrandResult {
  const normalized = normalizeString(brandName);
  if (normalized.length < 2) return { is: false };

  for (const famous of FAMOUS_BRANDS_V2) {
    const famousNorm = normalizeString(famous);
    if (!famousNorm) continue;

    // 1. Match exato
    if (normalized === famousNorm) return { is: true, matchedBrand: famous, similarity: 100 };

    // 2. Levenshtein >= 85%
    const levSim = levenshteinSimilarity(normalized, famousNorm) * 100;
    if (levSim >= 85) return { is: true, matchedBrand: famous, similarity: Math.round(levSim) };

    // 3. Soundex fonético (apenas para marcas com >= 4 chars)
    if (normalized.length >= 4 && famousNorm.length >= 4) {
      const sA = soundexPT(normalized);
      const sB = soundexPT(famousNorm);
      if (sA === sB) return { is: true, matchedBrand: famous, similarity: 88 };
    }
  }
  return { is: false };
}

// ============================================================
// MAPEAMENTO NCL POR RAMO (fallback sem IA)
// ============================================================
const BUSINESS_AREA_CLASSES: Record<string, { classes: number[]; descriptions: string[] }> = {
  tecnologia: {
    classes: [9, 42, 35],
    descriptions: [
      'Classe 09 – Aparelhos e instrumentos científicos, software, hardware e equipamentos eletrônicos',
      'Classe 42 – Serviços científicos, tecnológicos e de design, desenvolvimento de software',
      'Classe 35 – Publicidade, gestão de negócios, administração comercial',
    ],
  },
  alimentacao: {
    classes: [43, 30, 29],
    descriptions: [
      'Classe 43 – Serviços de restaurante, alimentação e hospedagem',
      'Classe 30 – Café, chá, cacau, açúcar, arroz, massas, pães, doces e condimentos',
      'Classe 29 – Carne, peixe, aves, caça, frutas, legumes, ovos, leite e derivados',
    ],
  },
  moda: {
    classes: [25, 18, 35],
    descriptions: [
      'Classe 25 – Vestuário, calçados e chapelaria',
      'Classe 18 – Couro, bolsas, malas, guarda-chuvas e artigos de selaria',
      'Classe 35 – Publicidade, gestão de negócios, comércio varejista',
    ],
  },
  saude: {
    classes: [44, 5, 10],
    descriptions: [
      'Classe 44 – Serviços médicos, veterinários, higiênicos e de beleza',
      'Classe 05 – Produtos farmacêuticos, veterinários e sanitários',
      'Classe 10 – Aparelhos e instrumentos médicos, cirúrgicos e odontológicos',
    ],
  },
  educacao: {
    classes: [41, 16, 9],
    descriptions: [
      'Classe 41 – Educação, treinamento, entretenimento e atividades desportivas e culturais',
      'Classe 16 – Papel, produtos de papelaria, material de instrução e ensino',
      'Classe 09 – Aparelhos para gravação, transmissão ou reprodução de som ou imagem',
    ],
  },
  beleza: {
    classes: [44, 3, 35],
    descriptions: [
      'Classe 44 – Serviços de salão de beleza, estética e cabeleireiro',
      'Classe 03 – Cosméticos, perfumaria, óleos essenciais e produtos de higiene',
      'Classe 35 – Publicidade e comércio de produtos de beleza',
    ],
  },
  construcao: {
    classes: [37, 19, 6],
    descriptions: [
      'Classe 37 – Construção civil, reparação e serviços de instalação',
      'Classe 19 – Materiais de construção não metálicos (cimento, tijolo, vidro)',
      'Classe 06 – Metais comuns e suas ligas, materiais de construção metálicos',
    ],
  },
  financeiro: {
    classes: [36, 35, 42],
    descriptions: [
      'Classe 36 – Seguros, negócios financeiros, imobiliários e bancários',
      'Classe 35 – Gestão de negócios, administração comercial e contabilidade',
      'Classe 42 – Serviços científicos e tecnológicos relacionados a finanças',
    ],
  },
  advocacia: {
    classes: [45, 35, 41],
    descriptions: [
      'Classe 45 – Serviços jurídicos, advocacia e consultoria legal',
      'Classe 35 – Gestão de negócios e administração de escritórios',
      'Classe 41 – Educação jurídica, palestras e treinamentos',
    ],
  },
  automotivo: {
    classes: [37, 12, 35],
    descriptions: [
      'Classe 37 – Reparação e manutenção de veículos',
      'Classe 12 – Veículos, aparelhos de locomoção por terra, ar ou água',
      'Classe 35 – Comércio de veículos e peças automotivas',
    ],
  },
  default: {
    classes: [35, 41, 42],
    descriptions: [
      'Classe 35 – Publicidade, gestão de negócios e administração comercial',
      'Classe 41 – Educação, treinamento, entretenimento e cultura',
      'Classe 42 – Serviços científicos, tecnológicos e de pesquisa',
    ],
  },
};

function getClassesFallback(businessArea: string): { classes: number[]; descriptions: string[] } {
  const n = normalizeString(businessArea);
  if (n.includes('tecnologia') || n.includes('software') || n.includes('app') || n.includes('ti')) return BUSINESS_AREA_CLASSES.tecnologia;
  if (n.includes('alimentacao') || n.includes('restaurante') || n.includes('comida') || n.includes('gastronomia')) return BUSINESS_AREA_CLASSES.alimentacao;
  if (n.includes('moda') || n.includes('roupa') || n.includes('vestuario') || n.includes('boutique')) return BUSINESS_AREA_CLASSES.moda;
  if (n.includes('saude') || n.includes('clinica') || n.includes('hospital') || n.includes('medic')) return BUSINESS_AREA_CLASSES.saude;
  if (n.includes('educacao') || n.includes('escola') || n.includes('curso') || n.includes('ensino')) return BUSINESS_AREA_CLASSES.educacao;
  if (n.includes('beleza') || n.includes('salao') || n.includes('estetica') || n.includes('cosmetico')) return BUSINESS_AREA_CLASSES.beleza;
  if (n.includes('construcao') || n.includes('obra') || n.includes('engenharia') || n.includes('arquitetura')) return BUSINESS_AREA_CLASSES.construcao;
  if (n.includes('financeiro') || n.includes('banco') || n.includes('investimento') || n.includes('credito')) return BUSINESS_AREA_CLASSES.financeiro;
  if (n.includes('advocacia') || n.includes('advogado') || n.includes('juridico') || n.includes('direito')) return BUSINESS_AREA_CLASSES.advocacia;
  if (n.includes('automotivo') || n.includes('carro') || n.includes('oficina') || n.includes('mecanica')) return BUSINESS_AREA_CLASSES.automotivo;
  return BUSINESS_AREA_CLASSES.default;
}

// ============================================================
// MÓDULO A — INPI via Firecrawl (busca exata + radical)
// ============================================================
async function searchINPI(brandName: string, firecrawlKey: string): Promise<{
  success: boolean;
  markdown: string;
  source: string;
  note?: string;
}> {
  const timeout = 22000;
  const encodedBrand = encodeURIComponent(brandName);

  // Tentativa 1: busca exata no INPI Brasil
  const inpiUrl = `https://busca.inpi.gov.br/pePI/servlet/MarcaServlet?Action=detail&CodProcesso=${encodedBrand}`;
  // Tentativa 2: busca radical
  const inpiRadicalUrl = `https://busca.inpi.gov.br/pePI/servlet/MarcaServlet?Action=detail&marca=${encodedBrand}&tipoMarca=&situacao=`;

  const scrapeWithFirecrawl = async (url: string): Promise<string> => {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true, waitFor: 3000 }),
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) throw new Error(`Firecrawl HTTP ${res.status}`);
    const d = await res.json();
    return d.data?.markdown || d.markdown || '';
  };

  try {
    console.log('[INPI] Tentando busca exata via Firecrawl...');
    const md1 = await scrapeWithFirecrawl(inpiUrl);
    if (md1 && md1.length > 100) {
      console.log(`[INPI] Busca exata retornou ${md1.length} chars`);
      return { success: true, markdown: md1, source: 'INPI Brasil (busca exata)' };
    }
  } catch (e) {
    console.warn('[INPI] Busca exata falhou:', e);
  }

  try {
    console.log('[INPI] Tentando busca radical via Firecrawl...');
    const md2 = await scrapeWithFirecrawl(inpiRadicalUrl);
    if (md2 && md2.length > 100) {
      console.log(`[INPI] Busca radical retornou ${md2.length} chars`);
      return { success: true, markdown: md2, source: 'INPI Brasil (busca radical)' };
    }
  } catch (e) {
    console.warn('[INPI] Busca radical falhou:', e);
  }

  // Fallback: WIPO
  try {
    console.log('[INPI] Fallback para WIPO...');
    const wipoSearch = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `"${brandName}" INPI marca registrada Brasil site:branddb.wipo.int OR site:busca.inpi.gov.br`,
        limit: 5,
        lang: 'pt',
        country: 'br',
        scrapeOptions: { formats: ['markdown'] },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (wipoSearch.ok) {
      const wd = await wipoSearch.json();
      const results = wd.data || [];
      const combined = results.map((r: any) => `### ${r.title}\nURL: ${r.url}\n${r.markdown || r.description || ''}`).join('\n\n');
      if (combined.length > 50) {
        return { success: true, markdown: combined, source: 'WIPO Brand Database (fallback)', note: 'INPI Brasil temporariamente indisponível. Dados via base WIPO.' };
      }
    }
  } catch (e) {
    console.warn('[INPI] WIPO fallback falhou:', e);
  }

  return { success: false, markdown: '', source: '', note: 'INPI e base alternativa temporariamente indisponíveis.' };
}

// ============================================================
// MÓDULO B — CNPJ.ws (API pública — empresas abertas no Brasil)
// ============================================================
async function searchCNPJ(brandName: string): Promise<{
  success: boolean;
  companies: Array<{ nome: string; cnpj: string; municipio: string; uf: string; situacao: string }>;
  note?: string;
}> {
  try {
    console.log('[CNPJ] Buscando empresas...');
    const encoded = encodeURIComponent(brandName);

    const res = await fetch(`https://publica.cnpj.ws/cnpj/busca?q=${encoded}&limit=10`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'ViabilitySearch/2.0' },
      signal: AbortSignal.timeout(12000),
    });

    if (res.ok) {
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.data || data.items || data.results || []);
      const companies = items.slice(0, 8).map((c: any) => ({
        nome: c.razao_social || c.nome || c.name || '',
        cnpj: c.cnpj || '',
        municipio: c.municipio || c.cidade || c.city || '',
        uf: c.uf || c.estado || c.state || '',
        situacao: c.situacao_cadastral || c.situacao || c.status || 'Ativa',
      })).filter((c: any) => c.nome);

      console.log(`[CNPJ] Encontradas ${companies.length} empresas`);
      return { success: true, companies };
    }
  } catch (e) {
    console.warn('[CNPJ] cnpj.ws falhou:', e);
  }

  // Fallback: CNPJá search via Firecrawl (não usa API key — é busca pública)
  return { success: false, companies: [], note: 'Base CNPJ temporariamente indisponível.' };
}

// ============================================================
// MÓDULO C — Varredura Web via Firecrawl (colidência)
// ============================================================
async function searchWebPresence(brandName: string, firecrawlKey: string): Promise<{
  success: boolean;
  mentions: Array<{ title: string; url: string; source: string; snippet: string }>;
  note?: string;
}> {
  const timeout = 20000;
  const allMentions: Array<{ title: string; url: string; source: string; snippet: string }> = [];

  const doSearch = async (query: string, label: string) => {
    try {
      const res = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 5, lang: 'pt', country: 'br' }),
        signal: AbortSignal.timeout(timeout),
      });
      if (!res.ok) return;
      const d = await res.json();
      const results: any[] = d.data || [];
      results.forEach((r: any) => {
        const url: string = r.url || '';
        let source = 'Web';
        if (url.includes('linkedin.com')) source = 'LinkedIn';
        else if (url.includes('instagram.com')) source = 'Instagram';
        else if (url.includes('facebook.com')) source = 'Facebook';
        else if (url.includes('maps.google.com') || url.includes('g.page')) source = 'Google Meu Negócio';
        else if (url.includes('cnpja.com') || url.includes('cnpj.ws') || url.includes('receita.economia')) source = 'Base CNPJ';
        allMentions.push({
          title: r.title || r.name || '',
          url,
          source: `${label} / ${source}`,
          snippet: r.description || r.snippet || '',
        });
      });
      console.log(`[WEB] "${query}" → ${results.length} resultados`);
    } catch (e) {
      console.warn(`[WEB] Busca "${label}" falhou:`, e);
    }
  };

  await Promise.allSettled([
    doSearch(`"${brandName}" empresa OR negócio site:linkedin.com OR site:instagram.com OR site:facebook.com`, 'Redes Sociais'),
    doSearch(`"${brandName}" empresa CNPJ Brazil razao social abertura`, 'Empresas BR'),
    doSearch(`"${brandName}" loja OR produto OR serviço marca Brasil`, 'Mercado Brasil'),
  ]);

  // Deduplicar por URL
  const seen = new Set<string>();
  const unique = allMentions.filter(m => {
    if (seen.has(m.url)) return false;
    seen.add(m.url);
    return true;
  });

  console.log(`[WEB] Total único: ${unique.length} menções`);
  return { success: unique.length > 0, mentions: unique.slice(0, 15) };
}

// ============================================================
// MÓDULO D — GPT-5.2 via Lovable AI Gateway
// ============================================================
const SYSTEM_PROMPT_JURIDICO = `Você é um especialista sênior em Propriedade Intelectual e Registro de Marcas no Brasil (INPI), com profundo conhecimento da Lei 9.279/1996.

Sua função é analisar os dados de viabilidade de uma marca e gerar:
1. Um laudo técnico-jurídico completo e preciso
2. Avaliação do risco de conflito com marcas existentes
3. Recomendações estratégicas de classes NCL
4. Análise de colidência na internet com alerta de urgência

IMPORTANTE:
- Seja objetivo, técnico e juridicamente fundamentado
- Use linguagem acessível mas profissional
- A análise de colidência web NÃO altera o score jurídico INPI
- A colidência web gera apenas alerta de urgência de registro
- Sempre retorne JSON válido no formato especificado`;

interface GPTAnalysisResult {
  viabilityLevel: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  classes: number[];
  classDescriptions: string[];
  laudoINPI: string;
  laudoCollidencia: string;
  laudoConclusao: string;
  laudoEstrategia: string;
  urgencyScore: number;
  webCollidenceFound: boolean;
}

async function analyzeWithGPT(
  brandName: string,
  businessArea: string,
  inpiMarkdown: string,
  inpiSource: string,
  cnpjCompanies: Array<{ nome: string; cnpj: string; municipio: string; uf: string; situacao: string }>,
  webMentions: Array<{ title: string; url: string; source: string; snippet: string }>,
  lovableKey: string,
  fallbackClasses: { classes: number[]; descriptions: string[] },
): Promise<GPTAnalysisResult> {
  const cnpjText = cnpjCompanies.length > 0
    ? cnpjCompanies.map(c => `- ${c.nome} (CNPJ: ${c.cnpj || 'N/D'}, ${c.municipio}/${c.uf}, Situação: ${c.situacao})`).join('\n')
    : 'Nenhuma empresa encontrada com esse nome na base CNPJ.';

  const webText = webMentions.length > 0
    ? webMentions.slice(0, 8).map(m => `- [${m.source}] ${m.title}: ${m.url}\n  Descrição: ${m.snippet}`).join('\n')
    : 'Nenhuma menção encontrada na varredura web.';

  const userPrompt = `Analise a viabilidade de registro desta marca:

MARCA: "${brandName.toUpperCase()}"
RAMO DE ATIVIDADE: "${businessArea}"

=== RESULTADO BUSCA INPI (fonte: ${inpiSource || 'não consultado'}) ===
${inpiMarkdown ? inpiMarkdown.substring(0, 3000) : 'Busca INPI não disponível no momento.'}

=== EMPRESAS ABERTAS NO BRASIL (CNPJ.ws) ===
${cnpjText}

=== VARREDURA WEB (LinkedIn, Instagram, Google, sites) ===
${webText}

=== INSTRUÇÕES ===
Retorne APENAS JSON válido neste formato exato:
{
  "viabilityLevel": "high" | "medium" | "low",
  "title": "texto curto do resultado (ex: Alta Viabilidade de Registro)",
  "description": "descrição de 1-2 linhas para o cliente",
  "classes": [numero1, numero2, numero3],
  "classDescriptions": [
    "Classe XX – descrição completa 1",
    "Classe XX – descrição completa 2",
    "Classe XX – descrição completa 3"
  ],
  "laudoINPI": "Texto detalhado sobre o resultado da busca INPI — marcas encontradas, situação, análise de conflito",
  "laudoCollidencia": "Texto detalhado da análise de colidência web — empresas CNPJ encontradas e menções web com URL",
  "laudoConclusao": "Conclusão técnico-jurídica fundamentada com base na Lei 9.279/1996",
  "laudoEstrategia": "Estratégia jurídica recomendada — classes, urgência, próximos passos",
  "urgencyScore": numero de 0 a 100 (100 = urgentíssimo registrar),
  "webCollidenceFound": true | false
}

REGRAS:
- viabilityLevel "high" somente se ausência TOTAL de conflitos INPI e poucas menções web
- viabilityLevel "medium" se há marcas similares ou menções moderadas
- viabilityLevel "low" se há marcas idênticas ativas no INPI
- Se INPI indisponível, informe transparentemente no laudoINPI mas ainda avalie com dados web/CNPJ
- webCollidenceFound = true se encontrou empresas no CNPJ OU menções significativas na web
- Se webCollidenceFound = true, o laudoCollidencia DEVE incluir mensagem de urgência
- classes devem ser números entre 1 e 45 adequados ao ramo "${businessArea}"`;

  try {
    console.log('[GPT] Enviando para GPT-5.2 via Lovable AI Gateway...');
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.2',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_JURIDICO },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.25,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      console.error(`[GPT] Gateway retornou ${res.status}`);
      throw new Error(`GPT Gateway HTTP ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('GPT retornou resposta vazia');

    const parsed = JSON.parse(content);
    console.log('[GPT] Análise concluída. Nível:', parsed.viabilityLevel);

    // Validar campos obrigatórios
    if (!parsed.viabilityLevel || !parsed.laudoConclusao) throw new Error('Resposta GPT incompleta');

    return {
      viabilityLevel: parsed.viabilityLevel || 'medium',
      title: parsed.title || 'Análise Concluída',
      description: parsed.description || '',
      classes: Array.isArray(parsed.classes) && parsed.classes.length === 3 ? parsed.classes : fallbackClasses.classes,
      classDescriptions: Array.isArray(parsed.classDescriptions) && parsed.classDescriptions.length === 3 ? parsed.classDescriptions : fallbackClasses.descriptions,
      laudoINPI: parsed.laudoINPI || 'INPI não disponível no momento.',
      laudoCollidencia: parsed.laudoCollidencia || 'Varredura web não encontrou resultados.',
      laudoConclusao: parsed.laudoConclusao || '',
      laudoEstrategia: parsed.laudoEstrategia || '',
      urgencyScore: typeof parsed.urgencyScore === 'number' ? Math.min(100, Math.max(0, parsed.urgencyScore)) : 50,
      webCollidenceFound: !!parsed.webCollidenceFound,
    };
  } catch (e) {
    console.error('[GPT] Erro na análise:', e);
    // Fallback local sem GPT
    const hasConflict = cnpjCompanies.length > 0 || webMentions.length > 3;
    return {
      viabilityLevel: hasConflict ? 'medium' : 'high',
      title: hasConflict ? 'Análise com Alertas' : 'Alta Viabilidade (análise local)',
      description: hasConflict
        ? 'Foram encontradas empresas ou menções com nome similar. Recomendamos consulta especializada.'
        : 'Não foram encontrados conflitos significativos. Recomendamos prosseguir com o registro.',
      classes: fallbackClasses.classes,
      classDescriptions: fallbackClasses.descriptions,
      laudoINPI: inpiMarkdown ? 'Dados INPI obtidos. Análise IA temporariamente indisponível.' : 'INPI e análise IA temporariamente indisponíveis.',
      laudoCollidencia: cnpjCompanies.length > 0 ? `Foram encontradas ${cnpjCompanies.length} empresa(s) com nome similar na base CNPJ.` : 'Nenhuma empresa encontrada na base CNPJ.',
      laudoConclusao: hasConflict
        ? 'A marca apresenta viabilidade média. Recomendamos consulta especializada antes de prosseguir.'
        : 'A marca apresenta boa viabilidade. Prosseguir com o registro.',
      laudoEstrategia: 'Registre nas classes recomendadas para máxima proteção da sua marca.',
      urgencyScore: hasConflict ? 75 : 40,
      webCollidenceFound: hasConflict,
    };
  }
}

// ============================================================
// LAUDO PARA MARCAS DE ALTO RENOME
// ============================================================
function buildFamousBrandLaudo(brandName: string, matchedBrand: string, similarity: number, brazilTime: string): string {
  return `*LAUDO TÉCNICO DE VIABILIDADE DE MARCA*
*Motor Premium V2 — WebMarcas*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *DADOS DA CONSULTA*

Marca Pesquisada: ${brandName.toUpperCase()}
Data/Hora: ${brazilTime}
Sistema: Motor V2 Premium

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚫 *RESULTADO: MARCA NÃO DISPONÍVEL*

A marca "${brandName.toUpperCase()}" foi identificada como SIMILAR ou IDÊNTICA à marca de alto renome "${matchedBrand.toUpperCase()}" (similaridade: ${similarity}%).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚖️ *FUNDAMENTAÇÃO JURÍDICA*

Nos termos do Art. 125 da Lei 9.279/1996 (Lei de Propriedade Industrial), as marcas de alto renome gozam de proteção especial em TODAS as classes de produtos e serviços, independentemente do ramo de atividade.

Art. 125: "À marca registrada no Brasil considerada de alto renome será assegurada proteção especial, em todos os ramos de atividade."

A proteção se estende a:
• Marcas idênticas
• Marcas fonética ou visualmente similares
• Marcas que possam causar confusão ao consumidor

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 *RECOMENDAÇÃO*

Nossos especialistas podem ajudá-lo a desenvolver uma marca ORIGINAL e DISTINTIVA, totalmente livre de conflitos, com alto potencial de aprovação no INPI.

Entre em contato agora mesmo para receber orientação especializada gratuita.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WebMarcas - Registro de Marcas
www.webmarcas.net`;
}

// ============================================================
// LAUDO COMPLETO V2
// ============================================================
function buildFullLaudo(
  brandName: string,
  businessArea: string,
  brazilTime: string,
  inpiSource: string,
  inpiNote: string | undefined,
  analysis: GPTAnalysisResult,
): string {
  const urgencyMsg = analysis.webCollidenceFound
    ? `\n🚨 *ALERTA DE URGÊNCIA*\n\nEmbora não conste registro ativo definitivo no INPI, foram identificadas empresas e/ou menções da marca "${brandName.toUpperCase()}" em uso no mercado brasileiro.\n\nATENÇÃO: Nada impede que essas empresas solicitem o registro antes de você. No Brasil, o direito sobre a marca pertence a QUEM REGISTRA PRIMEIRO (princípio da anterioridade do registro — Art. 129 da Lei 9.279/1996).\n\nNÃO ESPERE. Registre sua marca agora.`
    : '';

  const classesText = analysis.classDescriptions.map(d => `• ${d}`).join('\n');

  return `*LAUDO TÉCNICO DE VIABILIDADE DE MARCA*
*Motor Premium V2 — Pesquisa INPI + Análise de Colidência*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *DADOS DA CONSULTA*

Marca Pesquisada: ${brandName.toUpperCase()}
Ramo de Atividade: ${businessArea}
Data/Hora: ${brazilTime}
Fonte INPI: ${inpiSource || 'Não consultado'}
${inpiNote ? `Observação: ${inpiNote}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *RESULTADO DA PESQUISA INPI*

${analysis.laudoINPI}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 *ANÁLISE DE COLIDÊNCIA NA INTERNET (BRASIL)*

${analysis.laudoCollidencia}
${urgencyMsg}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚖️ *CONCLUSÃO TÉCNICA*

${analysis.laudoConclusao}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏷️ *CLASSES RECOMENDADAS PARA REGISTRO*

${classesText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 *ESTRATÉGIA JURÍDICA*

${analysis.laudoEstrategia}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ *IMPORTANTE*

O DONO DA MARCA É QUEM REGISTRA PRIMEIRO!
Não perca tempo. Cada dia sem registro é um risco.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WebMarcas - Registro de Marcas
www.webmarcas.net`;
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const { brandName, businessArea } = await req.json();

    if (!brandName || !businessArea) {
      return respond({ success: false, level: 'low', title: 'Dados inválidos', description: 'Nome da marca e ramo de atividade são obrigatórios.', error: 'missing_fields' }, 400);
    }

    const FIRECRAWL_KEY = Deno.env.get('FIRECRAWL_API_KEY') || '';
    const LOVABLE_KEY = Deno.env.get('LOVABLE_API_KEY') || '';

    // Timestamp Brasil
    const now = new Date();
    const brazilTime = now.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    // ── ETAPA 1: Verificação de Alto Renome ──────────────────
    console.log(`[V2] ===== INÍCIO: "${brandName}" / "${businessArea}" =====`);
    const famousCheck = checkFamousBrand(brandName);
    console.log(`[V2] Alto renome: ${famousCheck.is}`, famousCheck.matchedBrand || '');

    if (famousCheck.is) {
      const laudo = buildFamousBrandLaudo(brandName, famousCheck.matchedBrand!, famousCheck.similarity || 100, brazilTime);
      return respond({
        success: true,
        isFamousBrand: true,
        famousBrandMatch: famousCheck.matchedBrand,
        level: 'blocked',
        title: 'Marca de Alto Renome — Não Disponível',
        description: `A marca "${brandName}" é similar ou idêntica a "${famousCheck.matchedBrand}", que possui proteção especial em todas as classes no Brasil (Art. 125 Lei 9.279/1996).`,
        laudo,
        classes: [],
        classDescriptions: [],
        searchDate: brazilTime,
        webCollidenceFound: false,
        inpiSearched: false,
        urgencyScore: 0,
      });
    }

    // ── ETAPAS 2-3-4: Módulos paralelos ──────────────────────
    console.log('[V2] Iniciando módulos paralelos...');
    const fallbackClasses = getClassesFallback(businessArea);

    const [inpiSettled, cnpjSettled, webSettled] = await Promise.allSettled([
      FIRECRAWL_KEY ? searchINPI(brandName, FIRECRAWL_KEY) : Promise.resolve({ success: false, markdown: '', source: '', note: 'Firecrawl não configurado.' }),
      searchCNPJ(brandName),
      FIRECRAWL_KEY ? searchWebPresence(brandName, FIRECRAWL_KEY) : Promise.resolve({ success: false, mentions: [], note: 'Firecrawl não configurado.' }),
    ]);

    const inpiResult = inpiSettled.status === 'fulfilled' ? inpiSettled.value : { success: false, markdown: '', source: '', note: 'Módulo INPI falhou.' };
    const cnpjResult = cnpjSettled.status === 'fulfilled' ? cnpjSettled.value : { success: false, companies: [], note: 'Módulo CNPJ falhou.' };
    const webResult = webSettled.status === 'fulfilled' ? webSettled.value : { success: false, mentions: [], note: 'Módulo Web falhou.' };

    console.log(`[V2] INPI: ${inpiResult.success}, CNPJ: ${cnpjResult.companies?.length || 0} empresas, Web: ${webResult.mentions?.length || 0} menções`);

    // ── ETAPA 5: GPT-5.2 ─────────────────────────────────────
    let analysis: GPTAnalysisResult;
    if (LOVABLE_KEY) {
      analysis = await analyzeWithGPT(
        brandName, businessArea,
        inpiResult.markdown, inpiResult.source,
        cnpjResult.companies || [],
        webResult.mentions || [],
        LOVABLE_KEY,
        fallbackClasses,
      );
    } else {
      console.warn('[V2] LOVABLE_API_KEY não configurada — usando análise local');
      const hasConflict = (cnpjResult.companies?.length || 0) > 0 || (webResult.mentions?.length || 0) > 3;
      analysis = {
        viabilityLevel: hasConflict ? 'medium' : 'high',
        title: hasConflict ? 'Viabilidade Média' : 'Alta Viabilidade',
        description: hasConflict ? 'Foram encontradas referências similares. Recomendamos consulta especializada.' : 'Boa viabilidade de registro identificada.',
        classes: fallbackClasses.classes,
        classDescriptions: fallbackClasses.descriptions,
        laudoINPI: inpiResult.markdown ? 'Dados INPI obtidos. Análise avançada indisponível.' : 'INPI indisponível no momento.',
        laudoCollidencia: `${cnpjResult.companies?.length || 0} empresa(s) encontrada(s) na base CNPJ. ${webResult.mentions?.length || 0} menções na web.`,
        laudoConclusao: hasConflict ? 'Viabilidade média — consulte um especialista.' : 'Alta viabilidade — prossiga com o registro.',
        laudoEstrategia: 'Registre nas classes recomendadas o quanto antes.',
        urgencyScore: hasConflict ? 70 : 35,
        webCollidenceFound: hasConflict,
      };
    }

    // ── ETAPA 6: Montar laudo ─────────────────────────────────
    const laudo = buildFullLaudo(
      brandName, businessArea, brazilTime,
      inpiResult.source, inpiResult.note,
      analysis,
    );

    console.log(`[V2] ===== FIM: level=${analysis.viabilityLevel}, urgency=${analysis.urgencyScore} =====`);

    return respond({
      success: true,
      isFamousBrand: false,
      level: analysis.viabilityLevel,
      title: analysis.title,
      description: analysis.description,
      laudo,
      classes: analysis.classes,
      classDescriptions: analysis.classDescriptions,
      searchDate: brazilTime,
      webCollidenceFound: analysis.webCollidenceFound,
      inpiSearched: inpiResult.success,
      urgencyScore: analysis.urgencyScore,
    });

  } catch (error) {
    console.error('[V2] Erro crítico:', error);
    return respond({
      success: false,
      level: 'low',
      title: 'Erro na Consulta',
      description: 'Ocorreu um erro ao processar a consulta. Tente novamente.',
      laudo: null,
      classes: [],
      classDescriptions: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      webCollidenceFound: false,
      inpiSearched: false,
      urgencyScore: 0,
    });
  }
});
