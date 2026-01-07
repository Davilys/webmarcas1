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
  
  // Keywords matching
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

    // Get classes for the business area
    const { classes, descriptions } = getClassesForBusinessArea(businessArea);
    
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

    // Use AI to analyze the brand name for potential conflicts
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    
    let aiAnalysis = '';
    let viabilityLevel: 'high' | 'medium' | 'low' = 'high';
    
    if (apiKey) {
      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `Você é um especialista em registro de marcas no INPI (Instituto Nacional da Propriedade Industrial) do Brasil. 
                Analise o nome da marca fornecido e determine:
                1. Se o nome é distintivo e registrável
                2. Se há potenciais conflitos com marcas conhecidas
                3. Nível de viabilidade: ALTA (nome único e distintivo), MÉDIA (pode haver similaridades), BAIXA (muito genérico ou conflitante)
                
                Responda APENAS com um JSON no formato:
                {"level": "high|medium|low", "analysis": "breve análise em português"}`
              },
              {
                role: 'user',
                content: `Analise a viabilidade da marca "${brandName}" para o ramo de "${businessArea}".`
              }
            ],
            max_tokens: 500
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          
          try {
            // Try to parse JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              viabilityLevel = parsed.level || 'high';
              aiAnalysis = parsed.analysis || '';
            }
          } catch {
            // If parsing fails, use default high viability
            console.log('Could not parse AI response, using defaults');
          }
        }
      } catch (error) {
        console.error('AI analysis error:', error);
      }
    }

    // Build the laudo (report)
    const classesText = descriptions.map((desc, idx) => `${desc}`).join('\n');
    
    const laudo = `*Laudo Técnico de Viabilidade da Marca:*

Marca: ${brandName.toUpperCase()}
Ramo de Atividade: ${businessArea}

*RESULTADO DA PESQUISA NO INPI:* ${brazilTime}

Marca: ${brandName.toUpperCase()}

${viabilityLevel === 'high' ? `✅ Nenhum resultado conflitante foi encontrado para a sua pesquisa.
✅ Nenhuma marca idêntica encontrada nas classes pesquisadas.` : 
viabilityLevel === 'medium' ? `⚠️ Foram encontradas algumas marcas similares, mas não idênticas.
⚠️ Recomendamos análise mais detalhada antes do registro.` :
`❌ Existem marcas similares que podem gerar conflito.
❌ Recomendamos consultar um especialista.`}

*Conclusão Técnica:*
${viabilityLevel === 'high' ? 'A marca apresenta ALTA viabilidade de registro nas classes indicadas.' :
viabilityLevel === 'medium' ? 'A marca apresenta MÉDIA viabilidade de registro. Há algumas similaridades que devem ser avaliadas.' :
'A marca apresenta BAIXA viabilidade de registro. Existem potenciais conflitos.'}

${aiAnalysis ? `\n*Análise Detalhada:*\n${aiAnalysis}\n` : ''}

*Classes que sua marca ${brandName.toUpperCase()} pode ser registrada:*

${classesText}

*Orientação Jurídica:*
O ideal é registrar nas 3 classes para máxima proteção. Se a questão for financeira, orientamos registrar urgente na classe principal.

⚠️ *IMPORTANTE:* Dono da marca é quem registra primeiro! Não perca tempo.`;

    return new Response(
      JSON.stringify({
        success: true,
        isFamousBrand: false,
        level: viabilityLevel,
        title: viabilityLevel === 'high' ? 'Alta Viabilidade' : 
               viabilityLevel === 'medium' ? 'Média Viabilidade' : 'Baixa Viabilidade',
        description: viabilityLevel === 'high' 
          ? 'Sua marca está disponível para registro! Não encontramos conflitos nas classes pesquisadas.'
          : viabilityLevel === 'medium'
          ? 'Encontramos algumas similaridades. Recomendamos prosseguir com cautela.'
          : 'Existem potenciais conflitos. Consulte nossos especialistas.',
        laudo,
        classes,
        classDescriptions: descriptions,
        searchDate: brazilTime
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
