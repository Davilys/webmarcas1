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

// Análise de viabilidade baseada em padrões do nome da marca
function analyzeBrandViability(brandName: string): {
  level: 'high' | 'medium' | 'low';
  observations: string[];
} {
  const normalized = normalizeString(brandName);
  const observations: string[] = [];
  let riskScore = 0;
  
  // Verificar se contém palavras genéricas
  const genericWords = ['brasil', 'brazil', 'nacional', 'nacional', 'global', 'world', 'universal', 'premium', 'gold', 'plus', 'pro', 'max', 'super', 'mega', 'ultra', 'express', 'fast', 'quick', 'smart', 'tech', 'digital', 'online', 'web', 'net', 'app', 'solution', 'solucao', 'service', 'servico'];
  
  for (const word of genericWords) {
    if (normalized.includes(word)) {
      riskScore += 1;
      observations.push(`Contém termo genérico "${word}" que pode ter muitas marcas similares`);
    }
  }
  
  // Verificar se é muito curto (marcas curtas são mais difíceis de registrar)
  if (brandName.length <= 3) {
    riskScore += 2;
    observations.push('Nome muito curto - maior probabilidade de conflitos');
  } else if (brandName.length <= 5) {
    riskScore += 1;
    observations.push('Nome curto - pode haver marcas similares');
  }
  
  // Verificar se contém apenas números
  if (/^\d+$/.test(brandName)) {
    riskScore += 2;
    observations.push('Contém apenas números - difícil de registrar');
  }
  
  // Nome muito comum ou descritivo
  const descriptiveWords = ['loja', 'store', 'shop', 'casa', 'center', 'centro', 'grupo', 'group', 'cia', 'company', 'empresa', 'industria', 'comercio', 'fabrica'];
  
  for (const word of descriptiveWords) {
    if (normalized.includes(word)) {
      riskScore += 1;
      observations.push(`Termo descritivo "${word}" pode reduzir distintividade`);
    }
  }
  
  // Se não encontrou problemas, é positivo
  if (observations.length === 0) {
    observations.push('Nome distintivo e original');
    observations.push('Boa formação de marca');
  }
  
  // Determinar nível baseado no score
  let level: 'high' | 'medium' | 'low';
  if (riskScore >= 3) {
    level = 'low';
  } else if (riskScore >= 1) {
    level = 'medium';
  } else {
    level = 'high';
  }
  
  return { level, observations };
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

    // Análise de viabilidade baseada no nome da marca
    console.log(`[INPI] Analisando marca: ${brandName}`);
    const analysis = analyzeBrandViability(brandName);
    
    // O site do INPI não possui API pública e bloqueia requisições automatizadas
    // Fornecemos análise baseada em padrões do nome + link para consulta manual
    const inpiSearchUrl = `https://busca.inpi.gov.br/pePI/`;
    
    // Gerar texto da análise
    let analysisText = `📊 *ANÁLISE DO NOME DA MARCA*\n\n`;
    analysis.observations.forEach(obs => {
      analysisText += `• ${obs}\n`;
    });
    
    analysisText += `\n🔗 *CONSULTA MANUAL RECOMENDADA*\n\n`;
    analysisText += `Para verificar marcas registradas no INPI, acesse:\n${inpiSearchUrl}\n\n`;
    analysisText += `Passos:\n`;
    analysisText += `1. Clique em "Continuar"\n`;
    analysisText += `2. Clique em "Marca" no menu superior\n`;
    analysisText += `3. Selecione "Exata" no tipo de busca\n`;
    analysisText += `4. Digite "${brandName.toUpperCase()}" e clique em Pesquisar`;

    // Get classes for the business area
    const { classes, descriptions } = getClassesForBusinessArea(businessArea);
    const classesText = descriptions.map((desc) => `${desc}`).join('\n');

    // Build the laudo
    const laudo = `*LAUDO TÉCNICO DE VIABILIDADE DE MARCA*
*Análise Preliminar*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *DADOS DA CONSULTA*

Marca Pesquisada: ${brandName.toUpperCase()}
Ramo de Atividade: ${businessArea}
Data/Hora: ${brazilTime}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${analysisText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚖️ *CONCLUSÃO PRELIMINAR*

${analysis.level === 'high' ? 
'A marca apresenta boas características para registro. Nome distintivo e bem formado.' :
analysis.level === 'medium' ?
'A marca apresenta algumas características que podem dificultar o registro. Recomendamos consulta especializada.' :
'A marca possui elementos genéricos ou descritivos que podem dificultar o registro. Considere alterações no nome.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏷️ *CLASSES RECOMENDADAS PARA REGISTRO*

${classesText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚖️ *ORIENTAÇÃO JURÍDICA*

O ideal é registrar nas 3 classes para máxima proteção.
Se a questão for financeira, orientamos registrar urgente na classe principal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ *IMPORTANTE*

Esta é uma análise preliminar. Para garantir a disponibilidade da marca,
realize a consulta direta no site do INPI usando o link acima.

O DONO DA MARCA É QUEM REGISTRA PRIMEIRO!
Não perca tempo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WebMarcas - Registro de Marcas
www.webmarcas.net`;

    return new Response(
      JSON.stringify({
        success: true,
        isFamousBrand: false,
        level: analysis.level,
        title: analysis.level === 'high' ? 'Alta Viabilidade' : 
               analysis.level === 'medium' ? 'Média Viabilidade' : 'Baixa Viabilidade',
        description: analysis.level === 'high' 
          ? 'Sua marca apresenta boas características para registro!'
          : analysis.level === 'medium'
          ? 'Recomendamos consulta especializada antes de prosseguir.'
          : 'A marca possui elementos que podem dificultar o registro.',
        laudo,
        classes,
        classDescriptions: descriptions,
        searchDate: brazilTime,
        inpiSearchUrl,
        observations: analysis.observations
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
