import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentContent, adjustmentInstructions } = await req.json();

    if (!currentContent || !adjustmentInstructions) {
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

    const systemPrompt = `Você é um AGENTE JURÍDICO ESPECIALISTA EM PROPRIEDADE INTELECTUAL DA WEBMARCAS.

Sua tarefa é AJUSTAR o recurso administrativo conforme as instruções do usuário.

REGRAS CRÍTICAS:
1. Modifique APENAS os trechos indicados nas instruções
2. Mantenha TODO o restante do texto INALTERADO
3. NÃO reescreva o recurso completo
4. Preserve toda a formatação e estrutura original
5. Mantenha os dados extraídos do documento original

INSTRUÇÕES DE AJUSTE DO USUÁRIO:
${adjustmentInstructions}

RECURSO ATUAL:
${currentContent}

Responda APENAS com o texto completo do recurso ajustado, sem explicações adicionais.`;

    console.log('Calling AI to adjust INPI resource...');

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
          { role: 'user', content: 'Aplique os ajustes solicitados ao recurso.' }
        ],
        max_tokens: 8000,
        temperature: 0.2,
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
        JSON.stringify({ error: 'Erro ao ajustar recurso com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const adjustedContent = aiData.choices?.[0]?.message?.content;

    if (!adjustedContent) {
      return new Response(
        JSON.stringify({ error: 'Resposta vazia da IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        adjusted_content: adjustedContent.trim()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error adjusting INPI resource:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
