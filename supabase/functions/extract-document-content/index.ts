import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Nenhum arquivo enviado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    
    console.log(`Processing file: ${fileName}, type: ${fileType}`);

    let extractedContent = '';
    let extractedVariables: string[] = [];

    // Check file type and process accordingly
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // For PDF files, we'll use a text extraction approach
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Basic PDF text extraction - look for text between stream and endstream
      const decoder = new TextDecoder('latin1');
      const rawContent = decoder.decode(bytes);
      
      // Extract readable text from PDF
      const textMatches = rawContent.match(/BT[\s\S]*?ET/g) || [];
      const extractedTexts: string[] = [];
      
      for (const match of textMatches) {
        // Extract text from Tj and TJ operators
        const tjMatches = match.match(/\(([^)]*)\)\s*Tj/g) || [];
        const tjArrayMatches = match.match(/\[([^\]]*)\]\s*TJ/g) || [];
        
        for (const tj of tjMatches) {
          const text = tj.match(/\(([^)]*)\)/)?.[1] || '';
          if (text.trim()) extractedTexts.push(text);
        }
        
        for (const tja of tjArrayMatches) {
          const parts = tja.match(/\(([^)]*)\)/g) || [];
          for (const part of parts) {
            const text = part.replace(/[()]/g, '').trim();
            if (text) extractedTexts.push(text);
          }
        }
      }
      
      if (extractedTexts.length > 0) {
        extractedContent = extractedTexts.join(' ').replace(/\s+/g, ' ').trim();
      } else {
        // Fallback: try to extract any readable text
        const readableText = rawContent
          .replace(/[^\x20-\x7E\n\r]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        extractedContent = readableText.substring(0, 5000);
      }

    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel' ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls')
    ) {
      // For Excel files, extract basic content
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder('utf-8');
      const content = decoder.decode(bytes);
      
      // Try to extract strings from xlsx (which is a zip file with xml)
      const stringMatches = content.match(/<t[^>]*>([^<]+)<\/t>/g) || [];
      const texts = stringMatches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      
      if (texts.length > 0) {
        extractedContent = texts.join('\n');
      } else {
        extractedContent = "Conteúdo do arquivo Excel importado. Por favor, edite o modelo conforme necessário.";
      }

    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword' ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')
    ) {
      // For Word documents
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder('utf-8');
      const content = decoder.decode(bytes);
      
      // Extract text from docx (which is a zip file with xml)
      const textMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
      const texts = textMatches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      
      if (texts.length > 0) {
        extractedContent = texts.join(' ');
      }
    }

    // If we have content, try to improve it using AI
    if (extractedContent.length > 50) {
      try {
        // Use Lovable AI to process and format the content
        const aiResponse = await fetch('https://lovable.ai/api/v1/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-5-mini',
            messages: [
              {
                role: 'system',
                content: `Você é um assistente especializado em criar modelos de contrato. 
Sua tarefa é:
1. Analisar o texto extraído de um documento
2. Formatar como um modelo de contrato profissional
3. Identificar e substituir dados específicos por variáveis dinâmicas:
   - Nomes de pessoas/empresas → {{nome_cliente}}
   - CPF ou CNPJ → {{cpf_cnpj}}
   - Endereços → {{endereco}}
   - Cidades → {{cidade}}
   - Estados → {{estado}}
   - CEPs → {{cep}}
   - E-mails → {{email}}
   - Telefones → {{telefone}}
   - Valores monetários → {{valor}}
   - Datas específicas de início → {{data_inicio}}
   - Datas de término → {{data_fim}}
   - Números de contrato → {{numero_contrato}}
4. Manter a estrutura e formatação do contrato original
5. Retornar APENAS o texto do contrato formatado, sem explicações`
              },
              {
                role: 'user',
                content: `Analise e formate o seguinte texto extraído de um documento como modelo de contrato:\n\n${extractedContent.substring(0, 4000)}`
              }
            ]
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          if (aiData.choices?.[0]?.message?.content) {
            extractedContent = aiData.choices[0].message.content;
          }
        }
      } catch (aiError) {
        console.log('AI processing skipped:', aiError);
        // Continue with raw extracted content
      }
    }

    // Detect variables used in the content
    const variablePatterns = [
      '{{nome_cliente}}', '{{cpf_cnpj}}', '{{endereco}}', '{{cidade}}',
      '{{estado}}', '{{cep}}', '{{email}}', '{{telefone}}', '{{marca}}',
      '{{valor}}', '{{data}}', '{{data_inicio}}', '{{data_fim}}', '{{numero_contrato}}'
    ];
    
    extractedVariables = variablePatterns.filter(v => extractedContent.includes(v));

    // If no content was extracted, provide a template
    if (!extractedContent || extractedContent.length < 50) {
      extractedContent = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATANTE: {{nome_cliente}}
CPF/CNPJ: {{cpf_cnpj}}
Endereço: {{endereco}}, {{cidade}} - {{estado}}, CEP: {{cep}}
E-mail: {{email}}
Telefone: {{telefone}}

CONTRATADA: WebMarcas - Registro de Marcas e Patentes

OBJETO: O presente contrato tem por objeto a prestação de serviços de registro de marca junto ao INPI.

MARCA: {{marca}}

VALOR: {{valor}}

DATA DE INÍCIO: {{data_inicio}}
DATA DE TÉRMINO: {{data_fim}}

CONTRATO Nº: {{numero_contrato}}

[O conteúdo completo não pôde ser extraído automaticamente. Por favor, edite este modelo conforme necessário.]

___________________________
{{nome_cliente}}
CONTRATANTE

___________________________
WebMarcas
CONTRATADA

{{cidade}}, {{data}}`;
      
      extractedVariables = variablePatterns;
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: extractedContent,
        variables: extractedVariables,
        fileName: file.name,
        fileType: fileType,
        message: 'Documento processado com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar documento',
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
