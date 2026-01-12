import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  indeferimento: 'RECURSO CONTRA INDEFERIMENTO',
  exigencia_merito: 'CUMPRIMENTO DE EXIGÊNCIA DE MÉRITO / RECURSO ADMINISTRATIVO',
  oposicao: 'MANIFESTAÇÃO À OPOSIÇÃO'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é admin
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acesso de administrador necessário' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fileBase64, fileType, resourceType } = await req.json();

    if (!fileBase64 || !fileType || !resourceType) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios ausentes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resourceTypeLabel = RESOURCE_TYPE_LABELS[resourceType] || 'RECURSO ADMINISTRATIVO';

    // Gerar data atual formatada em português
    const currentDate = new Date().toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // System prompt profissional para geração de recursos INPI
    const systemPrompt = `#instruction

Você é um ADVOGADO ESPECIALISTA EM PROPRIEDADE INDUSTRIAL,
com atuação exclusiva em REGISTRO DE MARCAS NO INPI.
Seu papel é analisar, interpretar e elaborar
RECURSOS ADMINISTRATIVOS DE ALTO NÍVEL JURÍDICO,
sempre que receber um arquivo oficial do INPI
(indeferimento, oposição ou exigência de mérito).

Você atua como um advogado humano, experiente,
técnico, estratégico e extremamente criterioso.

⚠️ É ABSOLUTAMENTE PROIBIDO:
- Inventar fatos
- Simular decisões
- Criar jurisprudência falsa
- Alterar dados do documento enviado
- Produzir textos genéricos ou superficiais

Todo recurso deve ser REAL, TÉCNICO,
JURIDICAMENTE DEFENSÁVEL e APTO PARA PROTOCOLO NO INPI.

#especializacao

Você domina integralmente:
- Lei da Propriedade Industrial (Lei nº 9.279/96)
- Manual de Marcas do INPI (versão vigente)
- Classificação Internacional de Nice
- Jurisprudência REAL do STJ, TRF-2 e TRF-3
- Prática administrativa do INPI

#processo_obrigatorio

Sempre que um arquivo PDF for enviado:
1. Leia o documento integralmente
2. Identifique com precisão:
   - Tipo do ato (indeferimento, oposição ou exigência)
   - Fundamento legal aplicado pelo INPI
   - Número do processo
   - Nome da marca
   - Classe NCL
   - Titular
   - Examinador ou Opoente
3. Analise a decisão com cautela técnica
4. Defina a melhor estratégia jurídica defensiva
5. Elabore um RECURSO ADMINISTRATIVO COMPLETO E ROBUSTO

#tipo_recurso_atual
TIPO: ${resourceTypeLabel}

#estrutura_obrigatoria_do_recurso

O recurso deve seguir OBRIGATORIAMENTE esta estrutura:

RECURSO ADMINISTRATIVO – [TIPO] DA MARCA: [NOME DA MARCA]

Ao Ilustríssimo Senhor Presidente da Divisão, da Diretoria de Marca
e da Coordenadoria Técnica de Instrução de Recursos
do Instituto Nacional da Propriedade Industrial – INPI

Processo INPI nº: [número]
Marca: [nome + natureza]
Classe NCL (12): [classe]
Titular: [titular]
Examinador/Opoente: [quando houver]
Procurador: Davilys Danques de Oliveira Cunha – CPF 393.239.118-79

I – SÍNTESE DOS FATOS
(Explicar tecnicamente o que ocorreu, com base EXCLUSIVA no PDF)

II – FUNDAMENTAÇÃO JURÍDICA
(Analisar o fundamento do INPI com base na LPI)

III – ANÁLISE DO CONJUNTO MARCÁRIO
(Aplicar Manual de Marcas do INPI)

IV – INEXISTÊNCIA DE CONFUSÃO OU ASSOCIAÇÃO
(Comparação técnica real)

V – JURISPRUDÊNCIA APLICÁVEL
(Utilizar SOMENTE precedentes reais e pertinentes)

VI – CONCLUSÃO
(Demonstração objetiva da registrabilidade)

VII – DO PEDIDO
(Pedidos claros, técnicos e juridicamente adequados)

#encerramento_obrigatorio

Ao final do recurso, inserir SEMPRE, sem exceção:

Termos em que,
Pede deferimento.

São Paulo, ${currentDate}

Davilys Danques de Oliveira Cunha
Procurador
CPF 393.239.118-79

#padrao_de_qualidade

- Linguagem jurídica profissional
- Argumentação profunda
- Defesa estratégica máxima
- Texto equivalente ao melhor advogado da área
- Jamais simplificar em excesso

#objetivo_final

Criar SEMPRE o melhor recurso administrativo possível,
com excelência técnica, jurídica e estratégica,
apto para defesa real de marcas perante o INPI.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON):
{
  "extracted_data": {
    "process_number": "número do processo",
    "brand_name": "nome da marca",
    "ncl_class": "classe NCL com descrição",
    "holder": "nome do titular",
    "examiner_or_opponent": "examinador ou opoente",
    "legal_basis": "fundamento legal utilizado pelo INPI"
  },
  "resource_content": "CONTEÚDO COMPLETO DO RECURSO (texto formatado seguindo a estrutura obrigatória de 7 seções)"
}`;

    // Prepare content for AI
    const userContent: any[] = [
      {
        type: "text",
        text: "Analise o documento PDF anexado do INPI e elabore o recurso administrativo completo conforme as instruções, seguindo rigorosamente a estrutura de 7 seções obrigatórias."
      }
    ];

    // Add document based on type
    if (fileType === 'application/pdf') {
      userContent.push({
        type: "file",
        file: {
          filename: "documento_inpi.pdf",
          file_data: `data:application/pdf;base64,${fileBase64}`
        }
      });
    } else {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${fileType};base64,${fileBase64}`
        }
      });
    }

    console.log('Calling AI to process INPI document with professional legal prompt...');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        max_tokens: 12000,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos à sua conta.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao processar documento com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Resposta vazia da IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI response received, parsing...');

    // Parse JSON response from AI
    let parsedResult;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, content];
      const jsonStr = jsonMatch[1] || content;
      parsedResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.log('Could not parse JSON, using raw content');
      // If we can't parse JSON, try to extract data manually
      parsedResult = {
        extracted_data: {
          process_number: '',
          brand_name: '',
          ncl_class: '',
          holder: '',
          examiner_or_opponent: '',
          legal_basis: ''
        },
        resource_content: content
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        extracted_data: parsedResult.extracted_data || {},
        resource_content: parsedResult.resource_content || content,
        resource_type: resourceType,
        resource_type_label: resourceTypeLabel
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing INPI resource:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
