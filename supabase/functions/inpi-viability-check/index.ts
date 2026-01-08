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

// Função para buscar no WIPO Global Brand Database (API gratuita)
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
    console.log(`[WIPO] ========== INICIANDO BUSCA ==========`);
    console.log(`[WIPO] Marca: "${brandName}"`);
    
    // WIPO Brand Database select API endpoint
    // Query: similar name search with Brazil filter
    const query = encodeURIComponent(`brandName:(${brandName})`);
    const wipoApiUrl = `https://branddb.wipo.int/branddb/select?q=${query}&rows=30&wt=json&sort=score+desc`;
    
    console.log(`[WIPO] API URL: ${wipoApiUrl}`);

    const response = await fetch(wipoApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    console.log(`[WIPO] Response status: ${response.status}`);
    
    const contentType = response.headers.get('content-type');
    console.log(`[WIPO] Content-Type: ${contentType}`);
    
    if (!response.ok) {
      throw new Error(`WIPO retornou status ${response.status}`);
    }

    // Try to parse as JSON
    const text = await response.text();
    console.log(`[WIPO] Response length: ${text.length}, Preview: ${text.substring(0, 200)}`);
    
    // Check if response is JSON
    if (text.startsWith('{') || text.startsWith('[')) {
      const data = JSON.parse(text);
      
      const docs = data.response?.docs || data.docs || [];
      const numFound = data.response?.numFound || data.numFound || docs.length;

      console.log(`[WIPO] Total encontrado: ${numFound}, Docs: ${docs.length}`);

      const brands = docs.map((doc: any) => ({
        processo: doc.AN || doc.RN || doc.ID || '',
        marca: doc.BN || doc.brandName || '',
        situacao: doc.ST || doc.status || 'Registrado',
        classe: Array.isArray(doc.NC) ? doc.NC.join(', ') : (doc.NC || ''),
        titular: doc.HOL || doc.holder || '',
        pais: doc.OO || doc.origin || ''
      }));

      // Filtrar para mostrar prioritariamente marcas do Brasil
      const brazilBrands = brands.filter((b: any) => b.pais === 'BR');
      const otherBrands = brands.filter((b: any) => b.pais !== 'BR');
      const sortedBrands = [...brazilBrands, ...otherBrands];

      console.log(`[WIPO] Total: ${numFound}, Marcas BR: ${brazilBrands.length}`);

      return {
        success: true,
        totalResults: numFound,
        brands: sortedBrands.slice(0, 15)
      };
    }
    
    // Check if it's a captcha/verification page
    if (text.includes('altcha') || text.includes('challenge') || text.includes('verify') || text.length < 2000) {
      console.log('[WIPO] Página de verificação detectada - busca automática bloqueada');
      return {
        success: false,
        totalResults: 0,
        brands: [],
        error: 'Busca automática temporariamente indisponível. Base de dados protegida.'
      };
    }
    
    // If HTML with actual content, try to extract data
    console.log('[WIPO] Resposta HTML recebida, tentando extrair dados...');
    
    // Look for trademark entries in HTML
    const brandNamePattern = new RegExp(brandName, 'gi');
    const found = text.match(brandNamePattern);
    
    if (found && found.length > 0) {
      console.log(`[WIPO] Encontradas ${found.length} menções da marca no HTML`);
      
      // Try to extract structured data from various possible formats
      const jsonDataMatch = text.match(/var\s+(?:searchResults|data|results)\s*=\s*(\{[\s\S]*?\});/);
      if (jsonDataMatch) {
        try {
          const searchData = JSON.parse(jsonDataMatch[1]);
          if (searchData.docs) {
            return {
              success: true,
              totalResults: searchData.docs.length,
              brands: searchData.docs.slice(0, 15).map((doc: any) => ({
                processo: doc.AN || doc.RN || '',
                marca: doc.BN || brandName,
                situacao: doc.ST || 'Encontrado',
                classe: doc.NC || '',
                titular: doc.HOL || '',
                pais: doc.OO || ''
              }))
            };
          }
        } catch (e) {
          console.log('[WIPO] Não foi possível extrair JSON do HTML');
        }
      }
      
      return {
        success: true,
        totalResults: found.length,
        brands: [{
          processo: '',
          marca: brandName.toUpperCase(),
          situacao: 'Encontrado na base WIPO',
          classe: '',
          titular: '',
          pais: ''
        }]
      };
    }

    return {
      success: true,
      totalResults: 0,
      brands: []
    };

  } catch (error) {
    console.error('[WIPO] ERRO:', error);
    return {
      success: false,
      totalResults: 0,
      brands: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Função combinada para buscar em múltiplas fontes
async function searchBrazilTrademarks(brandName: string): Promise<{
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
  // Usar WIPO como fonte principal
  const wipoResult = await searchWIPO(brandName);
  
  return {
    success: wipoResult.success,
    totalResults: wipoResult.totalResults,
    brands: wipoResult.brands.map(b => ({
      processo: b.processo,
      marca: b.marca,
      situacao: b.situacao,
      classe: b.classe,
      titular: b.titular
    })),
    error: wipoResult.error
  };
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

    // BUSCA NO WIPO GLOBAL BRAND DATABASE (inclui marcas do Brasil/INPI)
    const wipoResult = await searchBrazilTrademarks(brandName);
    
    // Get classes for the business area
    const { classes, descriptions } = getClassesForBusinessArea(businessArea);
    const classesText = descriptions.map((desc: string) => `${desc}`).join('\n');
    
    // Determinar nível de viabilidade
    let viabilityLevel: 'high' | 'medium' | 'low' = 'high';
    let resultText = '';
    
    if (wipoResult.success) {
      if (wipoResult.totalResults === 0) {
        viabilityLevel = 'high';
        resultText = `✅ Nenhum resultado encontrado para "${brandName.toUpperCase()}" na base de dados global.
✅ Não foram encontradas marcas idênticas ou similares registradas.
✅ Sua marca apresenta ALTA viabilidade de registro.`;
      } else {
        // Verificar situações das marcas encontradas
        const hasActiveRegistration = wipoResult.brands.some((b: { situacao: string }) => 
          b.situacao.toLowerCase().includes('regist') || 
          b.situacao.toLowerCase().includes('active') ||
          b.situacao.toLowerCase().includes('ativo')
        );
        
        if (hasActiveRegistration) {
          viabilityLevel = 'low';
        } else {
          viabilityLevel = 'medium';
        }
        
        resultText = `Foram encontradas ${wipoResult.totalResults} marca(s) na base global WIPO:\n\n`;
        wipoResult.brands.slice(0, 10).forEach((b: { marca: string; processo: string; situacao: string; classe: string; titular?: string }, i: number) => {
          resultText += `${i + 1}. ${b.marca}\n`;
          resultText += `   Processo: ${b.processo}\n`;
          if (b.situacao) resultText += `   Situação: ${b.situacao}\n`;
          if (b.classe) resultText += `   Classe NCL: ${b.classe}\n`;
          if (b.titular) resultText += `   Titular: ${b.titular}\n`;
          resultText += '\n';
        });
      }
    } else {
      // Busca falhou - informar no laudo
      viabilityLevel = 'medium';
      resultText = `⚠️ Não foi possível realizar a busca automática.
${wipoResult.error || 'O serviço pode estar temporariamente indisponível.'}

Para garantir a precisão, recomendamos que um especialista realize a consulta manual.`;
    }

    // Build the laudo
    const laudo = `*LAUDO TÉCNICO DE VIABILIDADE DE MARCA*
*Pesquisa na Base Global WIPO + INPI*

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
        wipoResult: {
          totalResults: wipoResult.totalResults,
          brands: wipoResult.brands.slice(0, 10)
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
