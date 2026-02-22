import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getAIConfig } from "../_shared/ai-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { messages = [], systemPrompt, action } = body;

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages deve ser um array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiConfig = await getAIConfig();
    if (!aiConfig.apiKey) {
      return new Response(JSON.stringify({ error: "Nenhuma chave de IA configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseSystemPrompt = systemPrompt || `Você é uma assistente de IA especializada em comunicação profissional da WebMarcas, escritório de propriedade intelectual e registro de marcas no INPI (Brasil).

MISSÃO: Gerar respostas de email profissionais, contextualmente relevantes e prontas para uso.`;

    const qualityRules = `

REGRAS DE QUALIDADE OBRIGATÓRIAS:
1. Escreva em português brasileiro PERFEITO — sem erros de ortografia, gramática, acentuação ou concordância.
2. Revise mentalmente o texto antes de responder. Nunca envie texto com erros.
3. Use vocabulário profissional adequado ao contexto.
4. NÃO inclua assinatura, rodapé, dados de contato (www, WhatsApp, telefone) nem "Equipe WebMarcas" no final — o sistema adiciona automaticamente.
5. NÃO inclua "---" nem separadores no final do texto.
6. Termine a resposta no último parágrafo de conteúdo, antes de qualquer assinatura.
7. Não invente dados de processos, valores ou prazos. Use [DADO_NECESSÁRIO] quando precisar de informação específica.
8. Responda SOMENTE em português brasileiro.
9. Máximo 300 palavras para respostas normais, 3 linhas para tom curto.
10. A resposta deve ser imediatamente utilizável pelo administrador.
11. NÃO duplique saudações nem despedidas. Use UMA saudação no início e UMA despedida no final.
12. Use "Atenciosamente," como despedida padrão (sem nada depois).`;

    const allMessages = [
      { role: "system", content: baseSystemPrompt + qualityRules },
      ...messages,
    ];

    console.log(`[email-ai-assistant] provider=${aiConfig.provider}, model=${aiConfig.model}, action=${action}, messages=${messages.length}`);

    const response = await fetch(aiConfig.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: allMessages,
        stream: false,
        max_tokens: 800,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde e tente novamente." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao processar com IA." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    if (!content) {
      return new Response(JSON.stringify({ error: "Resposta vazia da IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanedContent = removeAIFooter(content);
    console.log("email-ai-assistant: success, chars=", cleanedContent.length);

    return new Response(JSON.stringify({ content: cleanedContent, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("email-ai-assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function removeAIFooter(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(/\n*Equipe WebMarcas\s*[\|·\-]\s*Propriedade Intelectual\.?\s*$/gi, '');
  cleaned = cleaned.replace(/\n*---\n*🌐?\s*www\.webmarcas\.net.*$/gis, '');
  cleaned = cleaned.replace(/\n*www\.webmarcas\.net.*$/gis, '');
  cleaned = cleaned.replace(/\n*📱?\s*WhatsApp:?\s*\(?\d+\)?\s*[\d\-]+.*$/gi, '');
  cleaned = cleaned.replace(/\n*-{3,}\s*$/g, '');
  
  const atenciosamentePattern = /Atenciosamente,?\s*/gi;
  const matches = cleaned.match(atenciosamentePattern);
  if (matches && matches.length > 1) {
    let count = 0;
    cleaned = cleaned.replace(atenciosamentePattern, (match) => {
      count++;
      return count < matches.length ? '' : match;
    });
  }
  
  return cleaned.trim();
}
