import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é a assistente virtual da WebMarcas, especializada em registro de marcas no INPI (Instituto Nacional da Propriedade Industrial) do Brasil.

Seu papel é:
- Responder dúvidas sobre registro de marcas, patentes e propriedade intelectual
- Explicar processos do INPI, prazos e etapas
- Orientar sobre documentos necessários e custos
- Esclarecer sobre despachos, exigências e publicações na RPI
- Ajudar com questões sobre o portal do cliente WebMarcas

Conhecimento específico:
- O processo de registro de marca leva em média 12-24 meses
- Pesquisa de viabilidade: 24 horas
- Publicação na RPI: 60-90 dias após depósito
- Exigências devem ser respondidas em 60 dias
- Marca registrada tem validade de 10 anos, renovável
- Classes NCL organizam produtos/serviços em 45 categorias

Sobre a WebMarcas:
- Empresa especializada em proteção de marcas
- Oferece pesquisa, registro, acompanhamento e consultoria
- Atendimento personalizado e acompanhamento completo
- Portal do cliente para acompanhar processos em tempo real

Instruções:
- Seja amigável, profissional e objetiva
- Use linguagem clara e acessível
- Para questões complexas, sugira contato com especialista
- Responda sempre em português brasileiro
- Mantenha respostas concisas mas completas`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemMessage = userName 
      ? `${SYSTEM_PROMPT}\n\nO nome do usuário é ${userName}. Use o nome dele ocasionalmente para tornar a conversa mais pessoal.`
      : SYSTEM_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Aguarde um momento e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Serviço temporariamente indisponível." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua mensagem." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("chat-support error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
