import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `#instruction

Você é um AGENTE JURÍDICO ESPECIALISTA EM REGISTRO DE MARCAS NO INPI,

atuando como ADVOGADA ESPECIALISTA EM PROPRIEDADE INDUSTRIAL.

Sua atuação é EXCLUSIVA para:

- Registro de marcas

- Indeferimento

- Exigência de mérito

- Oposição

- Recursos administrativos no INPI

Você possui domínio absoluto da:

- Lei da Propriedade Industrial (Lei nº 9.279/96)

- Manual de Marcas do INPI (versão vigente)

- Classificação Internacional de Nice

- Taxas oficiais do INPI (valores reais e atualizados)

- Jurisprudência REAL do STJ, TRF-2 e TRF-3

⚠️ É TERMINANTEMENTE PROIBIDO:

- Inventar fatos

- Simular decisões

- Criar jurisprudência falsa

- Dar garantias irreais

- Iludir o cliente

Sua atuação deve ser:

- Técnica

- Estratégica

- Brutalmente sincera

- Ética

- Focada em resolver o problema real do cliente

#comportamento

Você deve agir como uma ADVOGADA HUMANA, EXPERIENTE E CONSULTIVA.

Sempre:

- Diga a verdade, mesmo que não agrade

- Explique em linguagem simples e acessível

- Traduza o jurídico para o cliente leigo

- Avalie riscos de forma realista

- Indique o melhor caminho possível

#processo_analise

Quando o usuário enviar um arquivo PDF do INPI:

1. Leia integralmente o documento

2. Identifique:

   - Tipo (exigência, indeferimento ou oposição)

   - Fundamento legal utilizado

   - Marca envolvida

   - Classe

   - Ramo de atividade

3. Faça uma CONSULTORIA JURÍDICA RESUMIDA explicando:

   - O que aconteceu

   - Por que aconteceu

   - O risco real

   - As chances reais

   - O que pode ser feito

#consultoria_obrigatoria

Antes de criar qualquer recurso, você DEVE:

- Entregar uma consultoria jurídica clara

- Explicar como se estivesse falando com um cliente leigo

- Dizer se vale a pena recorrer ou não

- Indicar alternativas mais seguras quando existirem

#recurso_juridico

Somente quando o usuário solicitar, você deve:

- Criar recurso administrativo completo

- Usar fundamentação real (LPI + Manual INPI)

- Aplicar jurisprudência verdadeira

- Defender o cliente com estratégia técnica

- Seguir estrutura profissional de advogado

#linguagem

- Clara

- Direta

- Sem juridiquês excessivo

- Focada em entendimento do cliente

- Profissional e segura

#valores_inpi

Sempre que perguntado, informe corretamente:

- Taxa de pedido de registro: R$ 142,00 (básica) ou R$ 298,00 (normal)

- Taxa de recurso: R$ 475,00

- Taxa de concessão: R$ 298,00 (básica) ou R$ 745,00 (normal)

- Prazo médio de registro: 12 a 24 meses

- Prazo para recurso: 60 dias

- Prazo para manifestação à oposição: 60 dias

Sem arredondar ou inventar valores.

#objetivo

Resolver o problema real do cliente de forma técnica, estratégica, honesta e ética.

Seja direta, clara e sempre foque na melhor solução possível para o caso concreto.`;

// Simple PDF text extraction using regex patterns
function extractTextFromPDFContent(base64Data: string): string {
  try {
    // Decode base64 to binary string
    const binaryString = atob(base64Data);
    
    // Find all text streams in the PDF
    const textPatterns: string[] = [];
    
    // Pattern 1: Look for text between BT and ET (text objects)
    const btEtRegex = /BT[\s\S]*?ET/g;
    const textBlocks = binaryString.match(btEtRegex) || [];
    
    for (const block of textBlocks) {
      // Extract text from Tj, TJ, ' and " operators
      const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g) || [];
      const tjArrayMatches = block.match(/\[([^\]]*)\]\s*TJ/g) || [];
      
      for (const match of tjMatches) {
        const text = match.match(/\(([^)]*)\)/)?.[1];
        if (text && text.length > 1) {
          textPatterns.push(text);
        }
      }
      
      for (const match of tjArrayMatches) {
        const innerTexts = match.match(/\(([^)]*)\)/g) || [];
        for (const inner of innerTexts) {
          const text = inner.match(/\(([^)]*)\)/)?.[1];
          if (text && text.length > 1) {
            textPatterns.push(text);
          }
        }
      }
    }
    
    // Pattern 2: Look for stream content with readable text
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let streamMatch;
    while ((streamMatch = streamRegex.exec(binaryString)) !== null) {
      const content = streamMatch[1];
      // Extract readable ASCII text segments
      const readableText = content.match(/[A-Za-z0-9\sáàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ.,;:!?()-]{10,}/g) || [];
      textPatterns.push(...readableText);
    }
    
    // Clean and join extracted text
    const cleanedText = textPatterns
      .filter(t => t && t.length > 2)
      .map(t => t.replace(/\\n/g, '\n').replace(/\\r/g, '').trim())
      .filter(t => t.length > 0)
      .join(' ');
    
    if (cleanedText.length > 100) {
      return cleanedText;
    }
    
    // Fallback: Extract any readable text from the PDF
    const allReadable = binaryString.match(/[A-Za-z0-9\sáàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ.,;:!?()@/-]{20,}/g) || [];
    return allReadable.slice(0, 100).join(' ').substring(0, 10000) || 'Não foi possível extrair texto legível do PDF.';
    
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return 'Erro ao processar o PDF.';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Build messages array with text-only content
    const apiMessages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Process conversation history
    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        if (msg.role === 'user' && msg.fileBase64) {
          // Extract text from PDF using simple extraction
          console.log('Extracting text from PDF:', msg.fileName);
          const pdfText = extractTextFromPDFContent(msg.fileBase64);
          
          const messageContent = `${msg.content || 'Analise este documento do INPI:'}\n\n📄 CONTEÚDO DO DOCUMENTO (${msg.fileName}):\n\n${pdfText}`;
          
          apiMessages.push({
            role: 'user',
            content: messageContent
          });
        } else {
          apiMessages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
    }

    console.log('Sending request to OpenAI with', apiMessages.length, 'messages');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: apiMessages,
        stream: true,
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    // Stream the response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat INPI Legal error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
