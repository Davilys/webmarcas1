import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as pdfjsLib from "https://esm.sh/pdfjs-dist@4.10.38/legacy/build/pdf.mjs";

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

// Robust PDF text extraction using pdfjs-dist
async function extractPdfText(base64Data: string): Promise<string> {
  try {
    // Decode base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Disable worker in edge runtime
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = undefined;

    const loadingTask = (pdfjsLib as any).getDocument({ data: bytes, disableWorker: true });
    const pdf = await loadingTask.promise;

    const pages: string[] = [];
    const maxPages = Math.min(pdf.numPages ?? 0, 50);

    console.log(`PDF has ${pdf.numPages} pages, processing ${maxPages}`);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = (content.items || [])
        .map((it: any) => (typeof it.str === "string" ? it.str : ""))
        .filter(Boolean);

      const pageText = strings.join(" ").replace(/\s+/g, " ").trim();
      if (pageText) pages.push(pageText);
    }

    const fullText = pages.join("\n\n").trim();
    
    console.log(`Extracted ${fullText.length} characters from PDF`);
    console.log(`Preview: ${fullText.substring(0, 300)}...`);
    
    if (fullText.length < 50) {
      return "Não foi possível extrair texto do PDF. O documento pode ser escaneado/imagem.";
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting PDF text with pdfjs:', error);
    return 'Erro ao processar o PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido');
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
          // Extract text from PDF using pdfjs-dist
          console.log('Extracting text from PDF:', msg.fileName);
          const pdfText = await extractPdfText(msg.fileBase64);
          
          console.log('PDF extraction result length:', pdfText.length);
          
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
