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

    // System prompt for INPI resource generation
    const systemPrompt = `Você é um AGENTE JURÍDICO ESPECIALISTA EM PROPRIEDADE INTELECTUAL DA WEBMARCAS, atuando exclusivamente na elaboração de RECURSOS ADMINISTRATIVOS DE MARCAS perante o INPI.

Você possui domínio técnico absoluto da:
- Lei da Propriedade Industrial (Lei nº 9.279/96)
- Manual de Marcas do INPI (versão vigente)
- Classificação Internacional de Nice
- Jurisprudência REAL do STJ, TRF-2 e TRF-3

⚠️ É EXPRESSAMENTE PROIBIDO:
- Inventar fatos
- Criar jurisprudência falsa
- Simular decisões inexistentes
- Alterar dados do PDF enviado
- Criar fundamentos não presentes no caso concreto

Todo recurso deve ser REAL, JURIDICAMENTE DEFENSÁVEL e APTO PARA PROTOCOLO NO INPI.

TIPO DE RECURSO: ${resourceTypeLabel}

INSTRUÇÕES DE EXTRAÇÃO:
1. Leia integralmente o documento PDF enviado
2. Extraia EXCLUSIVAMENTE do documento:
   - Número do processo
   - Nome da marca
   - Classe NCL
   - Titular
   - Examinador ou Opoente (se aplicável)
   - Fundamento legal utilizado pelo INPI
3. Interprete a decisão real do INPI
4. Defina a melhor estratégia jurídica de defesa

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
  "resource_content": "CONTEÚDO COMPLETO DO RECURSO (em texto formatado)"
}

ESTRUTURA OBRIGATÓRIA DO RECURSO:
1. TÍTULO EM CAIXA ALTA com o tipo de recurso e nome da marca
2. Cabeçalho técnico completo (Processo INPI nº, Marca, Classe NCL, Titular, Procurador: Davilys Danques de Oliveira Cunha)
3. I. DOS FATOS - Síntese baseada SOMENTE no PDF
4. II. DA MANIFESTAÇÃO E FUNDAMENTAÇÃO - Argumentos técnicos
5. III. FUNDAMENTAÇÃO JURÍDICA - LPI + Manual de Marcas + Jurisprudência REAL
6. IV. DO PEDIDO - Conclusão clara e objetiva

O recurso deve seguir o padrão jurídico profissional e ser apto para protocolo imediato no INPI.`;

    // Prepare content for AI
    const userContent: any[] = [
      {
        type: "text",
        text: "Analise o documento PDF anexado do INPI e elabore o recurso administrativo completo conforme as instruções."
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

    console.log('Calling AI to process INPI document...');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        max_tokens: 8000,
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
