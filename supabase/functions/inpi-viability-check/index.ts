import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lista expandida de marcas de alto renome que devem ser bloqueadas
const FAMOUS_BRANDS = [
  // Tecnologia
  'apple', 'google', 'microsoft', 'amazon', 'facebook', 'meta', 'netflix', 'spotify',
  'samsung', 'sony', 'lg', 'intel', 'amd', 'nvidia', 'ibm', 'oracle', 'adobe', 'cisco',
  'dell', 'hp', 'lenovo', 'asus', 'tiktok', 'twitter', 'x', 'instagram', 'whatsapp',
  'telegram', 'uber', 'lyft', 'airbnb', 'paypal', 'stripe', 'shopify', 'salesforce',
  'zoom', 'slack', 'dropbox', 'openai', 'chatgpt', 'linkedin', 'pinterest', 'snapchat',
  
  // Automóveis
  'toyota', 'honda', 'ford', 'chevrolet', 'volkswagen', 'bmw', 'mercedes', 'audi',
  'porsche', 'ferrari', 'lamborghini', 'tesla', 'nissan', 'hyundai', 'kia', 'fiat',
  'jeep', 'volvo', 'mazda', 'subaru', 'lexus', 'jaguar', 'land rover', 'range rover',
  
  // Alimentação e Bebidas
  'coca-cola', 'coca cola', 'cocacola', 'pepsi', 'nestle', 'mcdonalds', 'burger king', 
  'subway', 'starbucks', 'kfc', 'pizza hut', 'dominos', 'heineken', 'budweiser', 
  'red bull', 'monster', 'nescafe', 'nespresso', 'kitkat', 'oreo', 'nutella', 'ferrero',
  'brahma', 'skol', 'antarctica', 'antartica', 'ambev', 'ifood', 'rappi',
  
  // Moda e Luxo
  'nike', 'adidas', 'puma', 'reebok', 'new balance', 'converse', 'vans', 'gucci',
  'louis vuitton', 'chanel', 'prada', 'hermes', 'dior', 'versace', 'armani', 'burberry',
  'ralph lauren', 'calvin klein', 'tommy hilfiger', 'lacoste', 'zara', 'h&m',
  'uniqlo', 'gap', 'levis', 'rolex', 'omega', 'cartier', 'tiffany', 'swarovski',
  'oakley', 'ray-ban', 'rayban', 'asics', 'mizuno', 'havaianas',
  
  // Cosméticos e Higiene
  'loreal', 'nivea', 'dove', 'gillette', 'oral-b', 'colgate', 'pantene', 
  'maybelline', 'mac', 'estee lauder', 'clinique', 'lancome', 'olay', 'neutrogena',
  'avon', 'natura', 'boticario', 'o boticario', 'eudora', 'mary kay', 'revlon',
  
  // Bancos e Finanças Brasil
  'itau', 'itaú', 'bradesco', 'santander', 'banco do brasil', 'caixa', 'nubank', 'inter',
  'c6 bank', 'btg', 'xp', 'visa', 'mastercard', 'american express', 'amex', 'elo',
  'picpay', 'stone', 'pagseguro', 'cielo', 'rede', 'getnet', 'hipercard',
  
  // Varejo Brasil
  'magazine luiza', 'magalu', 'casas bahia', 'americanas', 'mercado livre', 'mercadolivre',
  'shopee', 'aliexpress', 'carrefour', 'extra', 'pao de acucar', 'atacadao',
  'renner', 'riachuelo', 'cea', 'marisa', 'hering', 'arezzo',
  
  // Telecomunicações
  'vivo', 'claro', 'tim', 'oi', 'sky', 'net', 'at&t', 'verizon', 't-mobile',
  
  // Entretenimento
  'disney', 'warner', 'paramount', 'universal', 'hbo', 'fox', 'globo', 'sbt',
  'record', 'band', 'marvel', 'dc comics', 'pixar', 'dreamworks', 'nintendo',
  'playstation', 'xbox', 'steam', 'epic games', 'riot games', 'ea sports',
  'youtube',
  
  // Outros
  'ikea', '3m', 'philips', 'bosch', 'electrolux', 'brastemp', 'consul', 'tramontina',
  'gerdau', 'vale', 'petrobras', 'shell', 'esso', 'ipiranga', 'br', 'fedex', 'dhl', 'ups',
  'panasonic', 'jbl', 'bose', 'beats', 'acer', '99',
  "mcdonald's", "habib's", "habibs", 'outback', 'madero', 'giraffas', "bob's", 'bobs'
];

// Mapeamento de áreas de negócio para classes NCL
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
  'agronegocio': {
    classes: [31, 1, 44],
    descriptions: [
      'Classe 31 – Produtos agrícolas, hortícolas, sementes, animais vivos',
      'Classe 01 – Produtos químicos para agricultura, fertilizantes',
      'Classe 44 – Serviços de agricultura, horticultura, silvicultura'
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
  return FAMOUS_BRANDS.some(famous => {
    const normalizedFamous = normalizeString(famous);
    return normalized === normalizedFamous || 
           normalized.includes(normalizedFamous) || 
           normalizedFamous.includes(normalized);
  });
}

function getClassesForBusinessArea(businessArea: string): { classes: number[], descriptions: string[] } {
  const normalized = normalizeString(businessArea);
  
  for (const [key, value] of Object.entries(BUSINESS_AREA_CLASSES)) {
    if (key !== 'default' && normalized.includes(key)) {
      return value;
    }
  }
  
  // Extended matching
  if (normalized.includes('software') || normalized.includes('app') || normalized.includes('sistema') || normalized.includes('ti')) {
    return BUSINESS_AREA_CLASSES.tecnologia;
  }
  if (normalized.includes('restaurante') || normalized.includes('comida') || normalized.includes('gastronomia') || normalized.includes('lanchonete')) {
    return BUSINESS_AREA_CLASSES.alimentacao;
  }
  if (normalized.includes('roupa') || normalized.includes('vestuario') || normalized.includes('boutique')) {
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
  if (normalized.includes('obra') || normalized.includes('engenharia') || normalized.includes('arquitetura') || normalized.includes('constru')) {
    return BUSINESS_AREA_CLASSES.construcao;
  }
  if (normalized.includes('banco') || normalized.includes('investimento') || normalized.includes('credito') || normalized.includes('financeira')) {
    return BUSINESS_AREA_CLASSES.financeiro;
  }
  if (normalized.includes('advogado') || normalized.includes('juridico') || normalized.includes('direito')) {
    return BUSINESS_AREA_CLASSES.advocacia;
  }
  if (normalized.includes('carro') || normalized.includes('moto') || normalized.includes('oficina') || normalized.includes('mecanica')) {
    return BUSINESS_AREA_CLASSES.automotivo;
  }
  if (normalized.includes('agro') || normalized.includes('fazenda') || normalized.includes('rural') || normalized.includes('agricola')) {
    return BUSINESS_AREA_CLASSES.agronegocio;
  }
  
  return BUSINESS_AREA_CLASSES.default;
}

// Análise inteligente usando Lovable AI
async function analyzeWithAI(brandName: string, businessArea: string): Promise<{
  level: 'high' | 'medium' | 'low';
  analysis: string;
  distinctiveness: number;
  observations: string[];
  risks: string[];
  recommendations: string[];
  potentialConflicts: string[];
}> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.log('LOVABLE_API_KEY not available, using fallback analysis');
    return fallbackAnalysis(brandName, businessArea);
  }

  try {
    console.log(`[AI] Iniciando análise inteligente para: "${brandName}" - ${businessArea}`);
    
    const systemPrompt = `Você é um especialista em propriedade intelectual e registro de marcas no INPI Brasil com mais de 20 anos de experiência.

Sua tarefa é analisar a viabilidade de registro de uma marca, considerando:

1. **Distintividade** (critério mais importante):
   - Marcas INVENTADAS (ex: Kodak, Xerox, Häagen-Dazs) = distintividade máxima (90-100)
   - Marcas ARBITRÁRIAS (ex: Apple para computadores) = distintividade alta (75-89)
   - Marcas SUGESTIVAS (ex: Netflix sugere internet+flicks) = distintividade média (50-74)
   - Marcas DESCRITIVAS = distintividade baixa (25-49)
   - Marcas GENÉRICAS = não registrável (0-24)

2. **Conflitos potenciais**:
   - Considere se existem marcas famosas ou conhecidas com nomes similares
   - Avalie se o nome é comum em outros segmentos do mercado brasileiro
   - Lembre-se de marcas brasileiras e internacionais que atuam no Brasil

3. **Aspectos linguísticos**:
   - Facilidade de pronúncia em português
   - Memorização
   - Possíveis significados indesejados ou duplo sentido
   - Possibilidade de confusão fonética com outras marcas

4. **Lei brasileira (Lei 9.279/96 - LPI)**:
   - Art. 122: Sinais distintivos visualmente perceptíveis
   - Art. 124: Sinais não registráveis (genéricos, descritivos, etc.)
   - Art. 125: Marcas de alto renome
   - Art. 126: Marcas notoriamente conhecidas

Responda SEMPRE em formato JSON válido com esta estrutura exata:
{
  "level": "high" | "medium" | "low",
  "distinctiveness_score": 0-100,
  "analysis_summary": "resumo técnico em uma frase",
  "observations": ["observação técnica 1", "observação técnica 2"],
  "risks": ["risco identificado 1", "risco identificado 2"],
  "recommendations": ["recomendação 1", "recomendação 2"],
  "potential_conflicts": ["nome de marca/empresa similar 1", "nome de marca/empresa similar 2"]
}

IMPORTANTE:
- Se a marca parece inventada e única, dê score alto (80+)
- Se contém palavras genéricas do segmento, reduza o score
- Considere homofonias (palavras que soam parecido)
- Seja realista nos conflitos potenciais`;

    const userPrompt = `Analise a viabilidade de registro da marca "${brandName}" para o ramo de ${businessArea} no Brasil.

Considere:
1. Se o nome é distintivo ou genérico para o segmento
2. Se existe possibilidade de confusão com marcas conhecidas
3. Se atende aos requisitos da Lei 9.279/96

Forneça uma análise técnica completa.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      console.error('[AI] API error:', response.status);
      return fallbackAnalysis(brandName, businessArea);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.log('[AI] Empty response from AI');
      return fallbackAnalysis(brandName, businessArea);
    }

    console.log('[AI] Response received, parsing JSON...');

    // Extrair JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('[AI] Could not extract JSON from response');
      return fallbackAnalysis(brandName, businessArea);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    console.log('[AI] Analysis complete - Level:', parsed.level, 'Score:', parsed.distinctiveness_score);
    
    return {
      level: parsed.level || 'medium',
      analysis: parsed.analysis_summary || 'Análise concluída com sucesso',
      distinctiveness: parsed.distinctiveness_score || 50,
      observations: parsed.observations || [],
      risks: parsed.risks || [],
      recommendations: parsed.recommendations || [],
      potentialConflicts: parsed.potential_conflicts || []
    };

  } catch (error) {
    console.error('[AI] Error in analysis:', error);
    return fallbackAnalysis(brandName, businessArea);
  }
}

// Análise de fallback sem IA
function fallbackAnalysis(brandName: string, businessArea: string): {
  level: 'high' | 'medium' | 'low';
  analysis: string;
  distinctiveness: number;
  observations: string[];
  risks: string[];
  recommendations: string[];
  potentialConflicts: string[];
} {
  const normalized = normalizeString(brandName);
  const words = normalized.split(/\s+/);
  
  // Palavras genéricas comuns
  const genericWords = [
    'brasil', 'brazil', 'nacional', 'global', 'world', 'tech', 'digital', 'online',
    'express', 'plus', 'pro', 'max', 'super', 'mega', 'ultra', 'prime', 'elite',
    'premium', 'gold', 'platinum', 'solutions', 'services', 'group', 'corp',
    'company', 'enterprise', 'business', 'comercio', 'servicos', 'consultoria',
    'loja', 'store', 'shop', 'casa', 'lar', 'vida', 'sol', 'mar', 'terra'
  ];
  
  let score = 70;
  const observations: string[] = [];
  const risks: string[] = [];
  const recommendations: string[] = [];
  
  // Verificar comprimento
  if (normalized.length < 4) {
    score -= 25;
    observations.push('Nome muito curto pode ter distintividade reduzida');
    risks.push('Marcas de até 3 caracteres enfrentam maior escrutínio no INPI');
  } else if (normalized.length > 20) {
    score -= 10;
    observations.push('Nome longo pode dificultar memorização');
  } else {
    observations.push('Comprimento adequado para registro');
  }
  
  // Verificar palavras genéricas
  const foundGeneric = words.filter(w => genericWords.includes(w));
  if (foundGeneric.length > 0) {
    score -= foundGeneric.length * 12;
    observations.push(`Contém termos genéricos: ${foundGeneric.join(', ')}`);
    risks.push('Termos genéricos podem reduzir a proteção ou dificultar registro');
  }
  
  // Verificar se é palavra inventada
  const hasInventedPattern = /[bcdfghjklmnpqrstvwxyz]{3,}/.test(normalized) ||
                            !normalized.match(/[aeiou]/);
  if (hasInventedPattern && normalized.length > 4) {
    score += 15;
    observations.push('Padrão sugere nome inventado (fantasia), o que aumenta distintividade');
  }
  
  // Verificar se é nome próprio comum
  const commonNames = ['maria', 'joao', 'jose', 'ana', 'carlos', 'paulo', 'pedro', 'lucas', 'gabriel'];
  if (commonNames.some(name => normalized.includes(name))) {
    score -= 15;
    observations.push('Contém nome próprio comum, pode haver homonímias');
    risks.push('Nomes próprios comuns podem ter proteção limitada');
  }
  
  // Verificar números
  if (/\d/.test(brandName)) {
    score -= 5;
    observations.push('Contém números');
  }
  
  // Marca composta tem mais distintividade
  if (words.length >= 2 && words.length <= 4) {
    score += 10;
    observations.push('Marca composta por múltiplas palavras pode ter boa distintividade');
  }
  
  // Limitar score
  score = Math.max(20, Math.min(95, score));
  
  // Determinar nível
  let level: 'high' | 'medium' | 'low';
  if (score >= 70) {
    level = 'high';
    recommendations.push('Recomendamos prosseguir com pedido de registro');
    recommendations.push('Considerar registro em classes adicionais para proteção ampliada');
  } else if (score >= 45) {
    level = 'medium';
    recommendations.push('Considerar variações do nome para aumentar distintividade');
    recommendations.push('Avaliar combinação com elemento figurativo (logo)');
  } else {
    level = 'low';
    recommendations.push('Recomendamos consulta com especialista antes de prosseguir');
    recommendations.push('Considerar criação de marca inventada para maior proteção');
  }
  
  return {
    level,
    analysis: `Análise de distintividade com score ${score}/100`,
    distinctiveness: score,
    observations,
    risks,
    recommendations,
    potentialConflicts: []
  };
}

// Gerar laudo para marca bloqueada (famosa)
function generateBlockedLaudo(brandName: string, matchedBrand: string): string {
  const now = new Date();
  const date = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const time = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    LAUDO TÉCNICO DE VIABILIDADE
                         REGISTRO DE MARCA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Data da Análise: ${date} às ${time}
🏷️ Marca Analisada: ${brandName.toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                       ⛔ REGISTRO BLOQUEADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 CONFLITO IDENTIFICADO: MARCA DE ALTO RENOME

A marca "${brandName}" é idêntica ou confusamente similar à marca 
de alto renome "${matchedBrand.toUpperCase()}".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     FUNDAMENTAÇÃO LEGAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📜 Lei 9.279/96 (Lei da Propriedade Industrial):

Art. 125 - À marca registrada no Brasil considerada de alto 
renome será assegurada proteção especial, em todos os ramos 
de atividade.

Art. 126 - A marca notoriamente conhecida em seu ramo de 
atividade nos termos do art. 6º bis (I), da Convenção da 
União de Paris para Proteção da Propriedade Industrial, goza 
de proteção especial, independentemente de estar previamente 
depositada ou registrada no Brasil.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        CONSEQUÊNCIAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Riscos ao tentar registrar esta marca:

1. INDEFERIMENTO AUTOMÁTICO pelo INPI
2. Possível AÇÃO JUDICIAL por violação de marca
3. RESPONSABILIDADE CIVIL por danos à marca de terceiro
4. RESPONSABILIDADE CRIMINAL (Art. 189, LPI) - pena de 
   detenção de 3 meses a 1 ano, ou multa

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                       RECOMENDAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Sugerimos criar um nome de marca ORIGINAL e DISTINTIVO, 
   sem qualquer semelhança com marcas conhecidas.

💡 Dicas para criar uma marca forte:
   • Use palavras inventadas (neologismos)
   • Combine sílabas de forma criativa
   • Evite termos genéricos ou descritivos
   • Verifique disponibilidade antes de usar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                      WEBMARCAS ®
        Especialistas em Registro de Marcas no INPI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

// Gerar laudo técnico completo
function generateTechnicalLaudo(
  brandName: string, 
  businessArea: string, 
  analysis: {
    level: 'high' | 'medium' | 'low';
    analysis: string;
    distinctiveness: number;
    observations: string[];
    risks: string[];
    recommendations: string[];
    potentialConflicts: string[];
  },
  classes: number[],
  classDescriptions: string[]
): string {
  const now = new Date();
  const date = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const time = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  
  const levelEmoji = analysis.level === 'high' ? '🟢' : analysis.level === 'medium' ? '🟡' : '🔴';
  const levelText = analysis.level === 'high' ? 'ALTA VIABILIDADE' : 
                   analysis.level === 'medium' ? 'VIABILIDADE MODERADA' : 'BAIXA VIABILIDADE';

  const observationsText = analysis.observations.length > 0 
    ? analysis.observations.map((o, i) => `   ${i + 1}. ${o}`).join('\n')
    : '   Nenhuma observação adicional';

  const risksText = analysis.risks.length > 0
    ? analysis.risks.map(r => `   ⚠️ ${r}`).join('\n')
    : '   ✅ Nenhum risco significativo identificado';

  const recommendationsText = analysis.recommendations.length > 0
    ? analysis.recommendations.map(r => `   ✓ ${r}`).join('\n')
    : '   ✓ Prosseguir com o registro';

  const conflictsText = analysis.potentialConflicts.length > 0
    ? analysis.potentialConflicts.map(c => `   • ${c}`).join('\n')
    : '   Nenhum conflito direto identificado';

  const classesText = classDescriptions.map(d => `   • ${d}`).join('\n');

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    LAUDO TÉCNICO DE VIABILIDADE
                         REGISTRO DE MARCA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Data da Análise: ${date} às ${time}
🏷️ Marca Analisada: ${brandName.toUpperCase()}
🏢 Ramo de Atividade: ${businessArea}
🔬 Tipo de Análise: Inteligência Artificial + Análise Técnica

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     ${levelEmoji} ${levelText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SCORE DE DISTINTIVIDADE: ${analysis.distinctiveness}/100

${analysis.analysis}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    ANÁLISE DETALHADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 OBSERVAÇÕES TÉCNICAS:
${observationsText}

⚠️ RISCOS IDENTIFICADOS:
${risksText}

🔍 POSSÍVEIS CONFLITOS:
${conflictsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  CLASSES NCL RECOMENDADAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${classesText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                      RECOMENDAÇÕES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${recommendationsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    ⚠️ AVISO IMPORTANTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este laudo representa uma ANÁLISE PRELIMINAR baseada em 
inteligência artificial e análise de padrões linguísticos.

Para confirmação definitiva de disponibilidade, recomendamos:
   1. Pesquisa direta no portal do INPI (busca.inpi.gov.br)
   2. Consulta na base TMView (tmview.org)
   3. Assessoria de profissional especializado

⚖️ ORIENTAÇÃO JURÍDICA:
O ideal é registrar nas 3 classes recomendadas para máxima 
proteção. O DONO DA MARCA É QUEM REGISTRA PRIMEIRO!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                       WEBMARCAS ®
         Especialistas em Registro de Marcas no INPI
                    www.webmarcas.net
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandName, businessArea } = await req.json();

    if (!brandName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome da marca é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Viability] Analyzing brand: "${brandName}" for: "${businessArea}"`);

    // 1. Verificar marcas famosas
    if (isFamousBrand(brandName)) {
      const matchedBrand = FAMOUS_BRANDS.find(famous => {
        const normalizedFamous = normalizeString(famous);
        const normalized = normalizeString(brandName);
        return normalized === normalizedFamous || 
               normalized.includes(normalizedFamous) || 
               normalizedFamous.includes(normalized);
      });

      console.log(`[Viability] Famous brand detected: ${matchedBrand}`);

      return new Response(
        JSON.stringify({
          success: true,
          isFamousBrand: true,
          level: 'blocked',
          title: 'Marca de Alto Renome Detectada',
          description: `A marca "${brandName}" é idêntica ou muito similar à marca famosa "${matchedBrand?.toUpperCase()}". Marcas de alto renome possuem proteção especial em todas as classes (Art. 125, LPI). O registro não é viável.`,
          laudo: generateBlockedLaudo(brandName, matchedBrand || brandName),
          searchDate: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Obter classes NCL para o ramo
    const { classes, descriptions } = getClassesForBusinessArea(businessArea || 'serviços em geral');

    // 3. Análise inteligente com IA
    const aiAnalysis = await analyzeWithAI(brandName, businessArea || 'serviços em geral');

    // 4. Gerar laudo técnico
    const laudo = generateTechnicalLaudo(brandName, businessArea || 'Não especificado', aiAnalysis, classes, descriptions);

    // 5. Determinar título e descrição
    let title: string;
    let description: string;

    switch (aiAnalysis.level) {
      case 'high':
        title = 'Alta Viabilidade de Registro';
        description = `A marca "${brandName}" apresenta boa distintividade e características favoráveis para registro no INPI. ${aiAnalysis.analysis}`;
        break;
      case 'medium':
        title = 'Viabilidade Moderada';
        description = `A marca "${brandName}" pode ser registrada, mas há pontos de atenção a considerar. ${aiAnalysis.analysis}`;
        break;
      case 'low':
        title = 'Baixa Viabilidade';
        description = `A marca "${brandName}" apresenta desafios significativos para registro. ${aiAnalysis.analysis}`;
        break;
    }

    console.log(`[Viability] Analysis complete - Level: ${aiAnalysis.level}, Score: ${aiAnalysis.distinctiveness}`);

    return new Response(
      JSON.stringify({
        success: true,
        isFamousBrand: false,
        level: aiAnalysis.level,
        title,
        description,
        laudo,
        classes,
        classDescriptions: descriptions,
        searchDate: new Date().toISOString(),
        analysisDetails: {
          distinctiveness: aiAnalysis.distinctiveness,
          observations: aiAnalysis.observations,
          risks: aiAnalysis.risks,
          recommendations: aiAnalysis.recommendations,
          potentialConflicts: aiAnalysis.potentialConflicts
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Viability] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno na análise' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
