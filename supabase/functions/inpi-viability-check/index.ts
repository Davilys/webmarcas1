const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

const BUSINESS_AREA_CLASSES: Record<string, { classes: number[], descriptions: string[] }> = {
  'tecnologia': { classes: [9, 42, 35], descriptions: ['Classe 09 – Software, hardware e equipamentos eletrônicos', 'Classe 42 – Desenvolvimento de software e serviços tecnológicos', 'Classe 35 – Publicidade e gestão de negócios digitais'] },
  'alimentacao': { classes: [43, 30, 29], descriptions: ['Classe 43 – Serviços de restaurante e alimentação', 'Classe 30 – Alimentos processados, pães, doces e condimentos', 'Classe 29 – Carnes, laticínios, frutas e legumes processados'] },
  'moda': { classes: [25, 18, 35], descriptions: ['Classe 25 – Vestuário, calçados e chapelaria', 'Classe 18 – Couro, bolsas, malas e artigos de selaria', 'Classe 35 – Comércio varejista de moda'] },
  'saude': { classes: [44, 5, 10], descriptions: ['Classe 44 – Serviços médicos e de saúde', 'Classe 05 – Produtos farmacêuticos e sanitários', 'Classe 10 – Aparelhos médicos e cirúrgicos'] },
  'educacao': { classes: [41, 16, 9], descriptions: ['Classe 41 – Educação, treinamento e entretenimento', 'Classe 16 – Material de instrução e ensino', 'Classe 09 – Plataformas educacionais e e-learning'] },
  'beleza': { classes: [44, 3, 35], descriptions: ['Classe 44 – Serviços de salão de beleza e estética', 'Classe 03 – Cosméticos, perfumaria e produtos de higiene', 'Classe 35 – Comércio de produtos de beleza'] },
  'construcao': { classes: [37, 19, 6], descriptions: ['Classe 37 – Construção civil e serviços de instalação', 'Classe 19 – Materiais de construção não metálicos', 'Classe 06 – Materiais de construção metálicos'] },
  'financeiro': { classes: [36, 35, 42], descriptions: ['Classe 36 – Seguros, finanças e serviços imobiliários', 'Classe 35 – Gestão de negócios e contabilidade', 'Classe 42 – Tecnologia financeira (fintech)'] },
  'advocacia': { classes: [45, 35, 41], descriptions: ['Classe 45 – Serviços jurídicos e advocacia', 'Classe 35 – Gestão e administração de escritórios', 'Classe 41 – Educação jurídica e treinamentos'] },
  'automotivo': { classes: [37, 12, 35], descriptions: ['Classe 37 – Reparação e manutenção de veículos', 'Classe 12 – Veículos e aparelhos de locomoção', 'Classe 35 – Comércio de veículos e peças'] },
  'default': { classes: [35, 41, 42], descriptions: ['Classe 35 – Publicidade e gestão de negócios', 'Classe 41 – Educação e entretenimento', 'Classe 42 – Serviços científicos e tecnológicos'] }
};

function normalizeString(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function isFamousBrand(brandName: string): boolean {
  const normalized = normalizeString(brandName);
  return FAMOUS_BRANDS.some(famous =>
    normalized.includes(normalizeString(famous)) || normalizeString(famous).includes(normalized)
  );
}

function getClassesForBusinessArea(businessArea: string): { classes: number[], descriptions: string[] } {
  const normalized = normalizeString(businessArea);
  for (const [key, value] of Object.entries(BUSINESS_AREA_CLASSES)) {
    if (key !== 'default' && normalized.includes(key)) return value;
  }
  if (normalized.includes('software') || normalized.includes('app') || normalized.includes('sistema') || normalized.includes('ti')) return BUSINESS_AREA_CLASSES.tecnologia;
  if (normalized.includes('restaurante') || normalized.includes('comida') || normalized.includes('gastronomia')) return BUSINESS_AREA_CLASSES.alimentacao;
  if (normalized.includes('roupa') || normalized.includes('vestuario') || normalized.includes('boutique')) return BUSINESS_AREA_CLASSES.moda;
  if (normalized.includes('clinica') || normalized.includes('hospital') || normalized.includes('medic')) return BUSINESS_AREA_CLASSES.saude;
  if (normalized.includes('escola') || normalized.includes('curso') || normalized.includes('ensino')) return BUSINESS_AREA_CLASSES.educacao;
  if (normalized.includes('salao') || normalized.includes('estetica') || normalized.includes('cosmetico')) return BUSINESS_AREA_CLASSES.beleza;
  if (normalized.includes('obra') || normalized.includes('engenharia') || normalized.includes('arquitetura')) return BUSINESS_AREA_CLASSES.construcao;
  if (normalized.includes('banco') || normalized.includes('investimento') || normalized.includes('financeira')) return BUSINESS_AREA_CLASSES.financeiro;
  if (normalized.includes('advogado') || normalized.includes('juridico') || normalized.includes('direito')) return BUSINESS_AREA_CLASSES.advocacia;
  if (normalized.includes('carro') || normalized.includes('moto') || normalized.includes('oficina')) return BUSINESS_AREA_CLASSES.automotivo;
  return BUSINESS_AREA_CLASSES.default;
}

// =====================================================================
// MÓDULO 1: Busca INPI via WIPO (com fallback Firecrawl)
// =====================================================================
async function searchINPI(brandName: string, firecrawlKey: string): Promise<{
  found: boolean;
  totalResults: number;
  conflicts: Array<{ processo: string; marca: string; situacao: string; titular: string; classe: string; pais: string }>;
  source: string;
}> {
  // Primeiro tenta WIPO JSON API
  try {
    console.log('[INPI] Tentando WIPO API...');
    const searchStructure = {
      _id: 'wm1', boolean: 'AND',
      bricks: [{ _id: 'wm2', key: 'brandName', value: brandName, strategy: 'Simple' }]
    };
    const params = new URLSearchParams({
      sort: 'score desc', rows: '20',
      asStructure: JSON.stringify(searchStructure),
      fg: '_void_', _: Date.now().toString()
    });
    const wipoUrl = `https://branddb.wipo.int/en/similarname/results?${params}`;
    const res = await fetch(wipoUrl, {
      headers: {
        'Accept': 'application/json, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://branddb.wipo.int/en/similarname',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    const text = await res.text();
    if (text.startsWith('{') || text.startsWith('[')) {
      const data = JSON.parse(text);
      const docs = data.response?.docs || data.docs || [];
      const numFound = data.response?.numFound || docs.length;
      if (numFound >= 0) {
        const conflicts = docs.map((doc: any) => ({
          processo: doc.AN || doc.RN || '',
          marca: doc.BN || brandName.toUpperCase(),
          situacao: doc.ST || 'Registrado',
          classe: Array.isArray(doc.NC) ? doc.NC.join(', ') : (doc.NC || ''),
          titular: doc.HOL || '',
          pais: doc.OO || ''
        }));
        const br = conflicts.filter((c: any) => c.pais === 'BR');
        const others = conflicts.filter((c: any) => c.pais !== 'BR');
        console.log(`[INPI] WIPO encontrou ${numFound} resultados (${br.length} BR)`);
        return { found: numFound > 0, totalResults: numFound, conflicts: [...br, ...others].slice(0, 15), source: 'WIPO Global Brand Database' };
      }
    }
    // Se resposta não é JSON (captcha/bloqueio), tentar Firecrawl
    if (text.includes('altcha') || text.includes('challenge') || text.includes('Just a moment') || !text.startsWith('{')) {
      throw new Error('WIPO bloqueado - usando Firecrawl');
    }
  } catch (wipoError) {
    console.log('[INPI] WIPO falhou, tentando Firecrawl INPI...');
  }

  // Fallback: Firecrawl para buscar no INPI Brasil
  if (firecrawlKey) {
    try {
      const inpiSearchUrl = `https://busca.inpi.gov.br/pePI/servlet/MarcaServlet?Action=detail&Tipo=M&NrProcesso=${encodeURIComponent(brandName)}`;
      // Usa Firecrawl Search para buscar sobre a marca no INPI
      const fcRes = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `marca "${brandName}" INPI Brasil registro site:busca.inpi.gov.br OR site:inpi.gov.br`,
          limit: 5,
          scrapeOptions: { formats: ['markdown'] }
        })
      });
      if (fcRes.ok) {
        const fcData = await fcRes.json();
        const results = fcData.data || [];
        const hasConflict = results.some((r: any) =>
          (r.markdown || r.content || '').toLowerCase().includes(normalizeString(brandName))
        );
        console.log(`[INPI] Firecrawl encontrou ${results.length} resultados INPI`);
        const conflicts = hasConflict ? [{
          processo: 'Ver INPI',
          marca: brandName.toUpperCase(),
          situacao: 'Encontrado via busca web',
          classe: '',
          titular: 'Consultar INPI',
          pais: 'BR'
        }] : [];
        return {
          found: hasConflict,
          totalResults: hasConflict ? 1 : 0,
          conflicts,
          source: 'Firecrawl + INPI Brasil'
        };
      }
    } catch (fcError) {
      console.error('[INPI] Firecrawl INPI também falhou:', fcError);
    }
  }

  // Sem dados disponíveis
  return { found: false, totalResults: 0, conflicts: [], source: 'Indisponível no momento' };
}

// =====================================================================
// MÓDULO 2: Empresas Abertas no Brasil (CNPJ.ws + ReceitaWS)
// =====================================================================
async function searchCompaniesBR(brandName: string): Promise<{
  found: boolean;
  companies: Array<{ name: string; cnpj: string; status: string; city: string; state: string; opened: string }>;
  total: number;
}> {
  const companiesFound: Array<{ name: string; cnpj: string; status: string; city: string; state: string; opened: string }> = [];

  try {
    console.log('[CNPJ] Buscando empresas na Receita Federal...');
    // CNPJ.ws public API
    const cnpjRes = await fetch(
      `https://publica.cnpj.ws/cnpj/busca?q=${encodeURIComponent(brandName)}&simei=false&tipo=EMP`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        }
      }
    );

    if (cnpjRes.ok) {
      const cnpjData = await cnpjRes.json();
      const items = cnpjData?.data || cnpjData?.items || cnpjData || [];
      const arr = Array.isArray(items) ? items : [];
      console.log(`[CNPJ] Encontradas ${arr.length} empresas`);
      for (const item of arr.slice(0, 10)) {
        const razao = item.razao_social || item.nome || item.name || '';
        if (normalizeString(razao).includes(normalizeString(brandName)) ||
            normalizeString(brandName).includes(normalizeString(razao).substring(0, Math.min(normalizeString(razao).length, 5)))) {
          companiesFound.push({
            name: razao,
            cnpj: item.cnpj || '',
            status: item.descricao_situacao_cadastral || item.situacao || 'Ativa',
            city: item.municipio || item.cidade || '',
            state: item.uf || item.estado || '',
            opened: item.data_inicio_atividade || item.abertura || ''
          });
        }
      }
    }
  } catch (err) {
    console.error('[CNPJ] Erro CNPJ.ws:', err);
  }

  // Fallback: BrasilAPI
  if (companiesFound.length === 0) {
    try {
      const brasilRes = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/search?company=${encodeURIComponent(brandName)}`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (brasilRes.ok) {
        const brasilData = await brasilRes.json();
        const arr = Array.isArray(brasilData) ? brasilData : [];
        for (const item of arr.slice(0, 5)) {
          companiesFound.push({
            name: item.razao_social || item.nome_fantasia || '',
            cnpj: item.cnpj || '',
            status: item.descricao_situacao_cadastral || 'Ativa',
            city: item.municipio || '',
            state: item.uf || '',
            opened: item.data_inicio_atividade || ''
          });
        }
      }
    } catch (err) {
      console.error('[CNPJ] Erro BrasilAPI:', err);
    }
  }

  return { found: companiesFound.length > 0, companies: companiesFound, total: companiesFound.length };
}

// =====================================================================
// MÓDULO 3: Análise Web via Firecrawl Search (enriquecida)
// =====================================================================
async function searchWebPresence(brandName: string, businessArea: string, firecrawlKey: string): Promise<{
  googleMeuNegocio: boolean;
  linkedin: boolean;
  instagramFound: boolean;
  webMentions: number;
  sources: Array<{ title: string; url: string; snippet: string }>;
  summary: string;
  socialProfiles: Array<{ platform: string; profileName: string; url: string; followers?: string }>;
  cnpjSources: Array<{ source: string; name: string; cnpj?: string; city?: string; state?: string; status?: string }>;
}> {
  const emptyResult = {
    googleMeuNegocio: false, linkedin: false, instagramFound: false,
    webMentions: 0, sources: [], summary: 'Análise web não disponível.',
    socialProfiles: [], cnpjSources: []
  };

  if (!firecrawlKey) return emptyResult;

  try {
    console.log('[WEB] Iniciando análise de presença web enriquecida via Firecrawl...');

    // 4 buscas em paralelo
    const [generalSearch, linkedinSearch, instagramSearch, cnpjSearch] = await Promise.allSettled([
      // Busca 1: presença geral + Google Meu Negócio
      fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `"${brandName}" empresa negócio ${businessArea} Brasil`,
          limit: 8,
          scrapeOptions: { formats: ['markdown'] }
        })
      }),
      // Busca 2: LinkedIn
      fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `"${brandName}" site:linkedin.com/company OR site:maps.google.com`,
          limit: 5,
          scrapeOptions: { formats: ['markdown'] }
        })
      }),
      // Busca 3: Instagram (nome exato)
      fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `"${brandName}" site:instagram.com`,
          limit: 3
        })
      }),
      // Busca 4: CNPJá + CNPJ.ws + Serasa
      fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `"${brandName}" site:cnpja.com OR site:cnpj.ws OR site:serasa.com.br OR site:cnpjcheck.com.br`,
          limit: 5,
          scrapeOptions: { formats: ['markdown'] }
        })
      }),
    ]);

    let allSources: Array<{ title: string; url: string; snippet: string }> = [];
    let googleFound = false;
    let linkedinFound = false;
    let instagramFound = false;
    const socialProfiles: Array<{ platform: string; profileName: string; url: string; followers?: string }> = [];
    const cnpjSources: Array<{ source: string; name: string; cnpj?: string; city?: string; state?: string; status?: string }> = [];

    // Processar busca geral
    if (generalSearch.status === 'fulfilled' && generalSearch.value.ok) {
      const data = await generalSearch.value.json();
      const results = data.data || [];
      for (const r of results) {
        const url = r.url || '';
        if (url.includes('google.com/maps') || url.includes('goo.gl/maps') || url.includes('maps.app.goo.gl')) googleFound = true;
        if (url.includes('linkedin.com')) {
          linkedinFound = true;
          const profileName = r.metadata?.title || r.title || brandName;
          if (!socialProfiles.find(p => p.platform === 'LinkedIn')) {
            socialProfiles.push({ platform: 'LinkedIn', profileName: profileName.substring(0, 40), url });
          }
        }
        allSources.push({ title: r.metadata?.title || r.title || '', url, snippet: (r.markdown || '').substring(0, 200) });
      }
    }

    // Processar busca LinkedIn dedicada
    if (linkedinSearch.status === 'fulfilled' && linkedinSearch.value.ok) {
      const data = await linkedinSearch.value.json();
      const results = data.data || [];
      for (const r of results) {
        const url = r.url || '';
        if (url.includes('linkedin.com')) {
          linkedinFound = true;
          const profileName = r.metadata?.title || r.title || brandName;
          if (!socialProfiles.find(p => p.platform === 'LinkedIn')) {
            socialProfiles.push({ platform: 'LinkedIn', profileName: profileName.substring(0, 40), url });
          }
        }
        if (url.includes('google.com/maps') || url.includes('maps.')) googleFound = true;
      }
    }

    // Processar busca Instagram
    if (instagramSearch.status === 'fulfilled' && instagramSearch.value.ok) {
      const data = await instagramSearch.value.json();
      const results = data.data || [];
      for (const r of results) {
        const url = r.url || '';
        if (url.includes('instagram.com')) {
          instagramFound = true;
          const profileName = r.metadata?.title || r.title || brandName;
          // Extrair @handle da URL se possível
          const handleMatch = url.match(/instagram\.com\/([^/?#]+)/);
          const handle = handleMatch ? `@${handleMatch[1]}` : profileName.substring(0, 40);
          if (!socialProfiles.find(p => p.platform === 'Instagram')) {
            socialProfiles.push({ platform: 'Instagram', profileName: handle, url });
          }
        }
      }
    }

    // Processar busca CNPJ sources
    if (cnpjSearch.status === 'fulfilled' && cnpjSearch.value.ok) {
      const data = await cnpjSearch.value.json();
      const results = data.data || [];
      for (const r of results) {
        const url = r.url || '';
        const title = r.metadata?.title || r.title || '';
        const snippet = r.markdown || r.description || '';

        let source = 'Web';
        if (url.includes('cnpja.com')) source = 'CNPJá';
        else if (url.includes('cnpj.ws')) source = 'CNPJ.ws';
        else if (url.includes('serasa.com.br')) source = 'Serasa Experian';
        else if (url.includes('cnpjcheck.com.br')) source = 'CNPJCheck';

        // Extrair CNPJ do snippet se presente (padrão XX.XXX.XXX/XXXX-XX)
        const cnpjMatch = snippet.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
        const cnpj = cnpjMatch ? cnpjMatch[0] : undefined;

        // Extrair nome relevante
        const nameClean = title
          .replace(/- CNPJ.*$/i, '')
          .replace(/\| .*$/i, '')
          .trim()
          .substring(0, 50);

        if (nameClean && normalizeString(nameClean).includes(normalizeString(brandName).substring(0, 4))) {
          cnpjSources.push({ source, name: nameClean, cnpj, status: 'Verificar no portal' });
        }
      }
    }

    const webMentions = allSources.length;
    console.log(`[WEB] Menções: ${webMentions} | Google: ${googleFound} | LinkedIn: ${linkedinFound} | Instagram: ${instagramFound} | CNPJ sources: ${cnpjSources.length}`);

    const summary = webMentions > 3
      ? `A marca "${brandName}" possui presença consolidada na web com ${webMentions} menções identificadas.${googleFound ? ' Detectada no Google Maps/Negócios.' : ''}${linkedinFound ? ' Detectada no LinkedIn.' : ''}${instagramFound ? ' Detectada no Instagram.' : ''}`
      : webMentions > 0
      ? `A marca "${brandName}" possui presença limitada na web com ${webMentions} menções.${instagramFound ? ' Detectada no Instagram.' : ''}`
      : `Não foram encontradas menções significativas da marca "${brandName}" na web.`;

    return {
      googleMeuNegocio: googleFound,
      linkedin: linkedinFound,
      instagramFound,
      webMentions,
      sources: allSources.slice(0, 6),
      summary,
      socialProfiles,
      cnpjSources: cnpjSources.slice(0, 5),
    };
  } catch (err) {
    console.error('[WEB] Erro análise web:', err);
    return emptyResult;
  }
}

// =====================================================================
// MÓDULO 4: Geração do Laudo via OpenAI GPT-4o
// =====================================================================
async function generateLaudo(params: {
  brandName: string;
  businessArea: string;
  classes: { classes: number[]; descriptions: string[] };
  inpiResults: { found: boolean; totalResults: number; conflicts: any[]; source: string };
  companiesResult: { found: boolean; companies: any[]; total: number };
  webResult: { googleMeuNegocio: boolean; linkedin: boolean; webMentions: number; sources: any[]; summary: string };
  openAIKey: string;
}): Promise<{
  laudo: string;
  level: 'high' | 'medium' | 'low' | 'blocked';
  title: string;
  description: string;
  urgencyScore: number;
}> {
  const { brandName, businessArea, classes, inpiResults, companiesResult, webResult, openAIKey } = params;

  const contextData = `
DADOS DA CONSULTA:
- Marca consultada: "${brandName}"
- Ramo de atividade: "${businessArea}"
- Classes NCL sugeridas: ${classes.classes.join(', ')} (${classes.descriptions.join(' | ')})

RESULTADO DA BUSCA INPI (${inpiResults.source}):
- Marcas colidentes encontradas: ${inpiResults.totalResults}
- Colidências detectadas: ${inpiResults.conflicts.length > 0 ? inpiResults.conflicts.map(c => `${c.marca} (${c.situacao}, Titular: ${c.titular}, País: ${c.pais}, Classe: ${c.classe})`).join('; ') : 'Nenhuma colidência direta encontrada'}

RESULTADO DA BUSCA DE EMPRESAS BRASILEIRAS (Receita Federal):
- Empresas com nome similar encontradas: ${companiesResult.total}
- Empresas: ${companiesResult.companies.length > 0 ? companiesResult.companies.map(c => `${c.name} (CNPJ: ${c.cnpj}, Status: ${c.status}, ${c.city}/${c.state})`).join('; ') : 'Nenhuma empresa com nome idêntico ou similar encontrada'}

ANÁLISE DE PRESENÇA WEB:
- Menções encontradas na web: ${webResult.webMentions}
- Google Meu Negócio / Maps: ${webResult.googleMeuNegocio ? 'SIM - detectado' : 'NÃO detectado'}
- LinkedIn: ${webResult.linkedin ? 'SIM - detectado' : 'NÃO detectado'}
- Resumo: ${webResult.summary}
`;

  const prompt = `Você é um especialista sênior em Propriedade Intelectual com 20 anos de experiência no INPI e em registro de marcas no Brasil. Você foi contratado para emitir um Laudo Técnico de Viabilidade de Marca. Não inclua nome de especialista, assinatura ou separadores de linha (━━) no texto do laudo.

${contextData}

Com base nos dados acima, elabore um LAUDO TÉCNICO COMPLETO e PROFISSIONAL seguindo EXATAMENTE este formato:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAUDO TÉCNICO DE VIABILIDADE DE MARCA — WEBMARCAS
Protocolo: WM-${Date.now().toString(36).toUpperCase()}
Data: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. IDENTIFICAÇÃO DA MARCA
   • Nome da marca: [nome]
   • Ramo de atividade: [ramo]
   • Classes NCL recomendadas: [classes]

2. METODOLOGIA E FONTES CONSULTADAS
   Descreva as fontes consultadas (INPI/WIPO, Receita Federal, análise web).

3. ANÁLISE DA BASE DO INPI
   Descreva detalhadamente os resultados da busca no INPI. Se encontrou colidências, liste-as com detalhes técnicos jurídicos. Se não encontrou, explique o que isso significa.

4. ANÁLISE DE COLIDÊNCIA EMPRESARIAL
   Descreva se existem empresas com nome idêntico ou similar registradas na Receita Federal do Brasil. Analise o risco de colidência empresarial.

5. ANÁLISE DE PRESENÇA WEB E MERCADO
   Descreva a presença da marca na internet, Google Meu Negócio, LinkedIn e outros meios digitais. Avalie o risco de confusão do consumidor.

6. PARECER TÉCNICO-JURÍDICO
   Emita um parecer técnico detalhado baseado nos dados reais coletados. Use linguagem jurídica adequada. Mencione artigos da Lei de Propriedade Industrial (Lei 9.279/96) relevantes.

7. NÍVEL DE RISCO E URGÊNCIA
   Classifique o risco de forma clara: BAIXO / MÉDIO / ALTO. Dê um SCORE DE URGÊNCIA de 0 a 100 onde 100 = urgência máxima de registrar.

8. RECOMENDAÇÃO FINAL
   Dê uma recomendação clara e objetiva sobre o que o cliente deve fazer. Se houver colidências, enfatize com URGÊNCIA que o dono da marca é quem registra PRIMEIRO (Lei 9.279/96, art. 129).

9. AVISO LEGAL
   Inclua aviso padrão sobre limitações da análise prévia. Não inclua assinatura, nome de especialista ou separadores de linha no final do laudo.

Após o laudo, forneça em JSON (em uma linha separada, começando com ###JSON###):
###JSON###{"level":"high|medium|low|blocked","title":"Título do resultado","description":"Descrição curta 1-2 frases","urgencyScore":0-100}`;

  try {
    console.log('[LAUDO] Gerando laudo via OpenAI GPT-4o...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAIKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Você é um especialista sênior em Propriedade Intelectual da WebMarcas. Responda de forma técnica, jurídica e profissional. Seja específico e baseie-se APENAS nos dados reais fornecidos, sem inventar informações. Não inclua assinatura, nome de especialista ou separadores de linha no final do texto.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || '';
    console.log('[LAUDO] Laudo gerado com sucesso');

    // Extrair JSON de metadados do final do laudo
    const jsonMatch = content.match(/###JSON###({.+})/s);
    let level: 'high' | 'medium' | 'low' | 'blocked' = 'medium';
    let title = 'Análise de Viabilidade Concluída';
    let description = 'Análise técnica realizada com base em dados reais.';
    let urgencyScore = 50;

    if (jsonMatch) {
      try {
        const meta = JSON.parse(jsonMatch[1]);
        level = meta.level || 'medium';
        title = meta.title || title;
        description = meta.description || description;
        urgencyScore = meta.urgencyScore || 50;
      } catch (e) { console.error('[LAUDO] Erro ao parsear JSON meta:', e); }
    }

    // Laudo sem a parte JSON
    const laudoText = content.replace(/###JSON###.+$/s, '').trim();

    return { laudo: laudoText, level, title, description, urgencyScore };
  } catch (error) {
    console.error('[LAUDO] Erro ao gerar laudo:', error);
    // Fallback sem IA
    const hasConflict = inpiResults.found || companiesResult.found;
    const level = hasConflict ? 'medium' : 'high';
    const urgencyScore = hasConflict ? 75 : 35;
    return {
      laudo: `LAUDO TÉCNICO DE VIABILIDADE — WEBMARCAS\nProtocolo: WM-${Date.now().toString(36).toUpperCase()}\nData: ${new Date().toLocaleDateString('pt-BR')}\n\n1. IDENTIFICAÇÃO\nMarca: "${brandName}" | Ramo: "${businessArea}"\n\n2. ANÁLISE INPI\n${inpiResults.found ? `Foram encontradas ${inpiResults.totalResults} marca(s) similares na base do INPI. Risco de colidência identificado.` : 'Nenhuma colidência direta encontrada na base do INPI para esta marca.'}\n\n3. ANÁLISE EMPRESARIAL\n${companiesResult.found ? `Encontradas ${companiesResult.total} empresa(s) com nome similar na Receita Federal.` : 'Nenhuma empresa com nome idêntico encontrada na Receita Federal.'}\n\n4. PRESENÇA WEB\n${webResult.summary}\n\n5. RECOMENDAÇÃO\n${hasConflict ? '⚠️ ATENÇÃO: Foram identificadas possíveis colidências. Recomenda-se consulta especializada antes do protocolo. O dono da marca é quem registra PRIMEIRO.' : '✅ A marca apresenta boa viabilidade de registro. Recomendamos protocolar o pedido o quanto antes para garantir a prioridade.'}`,
      level,
      title: hasConflict ? 'Atenção: Possíveis Colidências Detectadas' : 'Marca com Boa Viabilidade',
      description: hasConflict ? 'Foram encontradas referências similares. Análise especializada recomendada.' : 'Sua marca apresenta boa viabilidade de registro.',
      urgencyScore
    };
  }
}

// =====================================================================
// HANDLER PRINCIPAL
// =====================================================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });


  try {
    const { brandName, businessArea } = await req.json();

    if (!brandName || !businessArea) {
      return new Response(JSON.stringify({ success: false, error: 'brandName e businessArea são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[MAIN] Nova consulta: "${brandName}" | "${businessArea}"`);
    console.log(`${'='.repeat(60)}\n`);

    // Checar marca famosa
    if (isFamousBrand(brandName)) {
      console.log('[MAIN] Marca famosa detectada - bloqueando');
      return new Response(JSON.stringify({
        success: true, isFamousBrand: true,
        level: 'blocked',
        title: '🚫 Marca de Alto Renome — Registro Não Recomendado',
        description: `"${brandName}" é uma marca de alto renome internacionalmente conhecida. O registro desta marca no INPI será indeferido.`,
        laudo: `A marca "${brandName}" é reconhecida como marca de alto renome, protegida nos termos do art. 125 da Lei 9.279/96. O INPI indeferirá qualquer pedido de registro desta marca por terceiros em qualquer classe.`,
        urgencyScore: 0,
        webAnalysis: null,
        inpiResults: { found: true, totalResults: 1, conflicts: [] },
        companiesResult: { found: true, companies: [], total: 0 }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!openAIKey) {
      return new Response(JSON.stringify({ success: false, error: 'OPENAI_API_KEY não configurada' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Obter classes NCL
    const classes = getClassesForBusinessArea(businessArea);

    // Rodar os 3 módulos de busca em paralelo com timeout de 25s cada
    console.log('[MAIN] Iniciando 3 módulos de busca em paralelo...');
    const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
      Promise.race([promise, new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))]);

    const [inpiResults, companiesResult, webResult] = await Promise.all([
      withTimeout(searchINPI(brandName, firecrawlKey || ''), 20000, { found: false, totalResults: 0, conflicts: [], source: 'Timeout na consulta' }),
      withTimeout(searchCompaniesBR(brandName), 15000, { found: false, companies: [], total: 0 }),
      withTimeout(searchWebPresence(brandName, businessArea, firecrawlKey || ''), 20000, { googleMeuNegocio: false, linkedin: false, webMentions: 0, sources: [], summary: 'Análise web indisponível.' }),
    ]);


    console.log(`[MAIN] Módulos concluídos. INPI: ${inpiResults.found}, Empresas: ${companiesResult.found}, Web: ${webResult.webMentions} menções`);

    // Gerar laudo via GPT-4o
    const laudoResult = await generateLaudo({
      brandName, businessArea, classes, inpiResults, companiesResult, webResult, openAIKey
    });

    const response = {
      success: true,
      level: laudoResult.level,
      title: laudoResult.title,
      description: laudoResult.description,
      laudo: laudoResult.laudo,
      urgencyScore: laudoResult.urgencyScore,
      classes: classes.classes,
      classDescriptions: classes.descriptions,
      searchDate: new Date().toISOString(),
      inpiResults: {
        found: inpiResults.found,
        totalResults: inpiResults.totalResults,
        conflicts: inpiResults.conflicts,
        source: inpiResults.source
      },
      companiesResult: {
        found: companiesResult.found,
        companies: companiesResult.companies,
        total: companiesResult.total
      },
      webAnalysis: {
        googleMeuNegocio: webResult.googleMeuNegocio,
        linkedin: webResult.linkedin,
        instagramFound: webResult.instagramFound,
        webMentions: webResult.webMentions,
        sources: webResult.sources,
        summary: webResult.summary,
        socialProfiles: webResult.socialProfiles,
        cnpjSources: webResult.cnpjSources,
      }
    };

    console.log(`[MAIN] Resposta gerada: level=${response.level}, urgency=${response.urgencyScore}`);
    return new Response(JSON.stringify(response), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[MAIN] Erro crítico:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
