
# IA de Resumo Automático para SMS — Plano Técnico

## Entendimento do Problema

O sistema atual envia a **mesma mensagem** para todos os canais. O SMS tem limitação de **160 caracteres** e atualmente apenas corta o texto com `.substring(0, 160)`, o que quebra o conteúdo de forma abrupta e pode cortar links importantes.

**Regra de negócio:**
- CRM (in-app), WhatsApp, Email → mensagem completa, sem alteração
- **SMS apenas** → IA resume automaticamente, preservando todos os links intactos

## Arquitetura da Solução

A modificação será feita **exclusivamente** na Edge Function `send-multichannel-notification/index.ts`, que é o ponto central por onde passa todo o fluxo. Nenhuma alteração no frontend é necessária — a IA atua de forma invisível, automática e silenciosa.

```text
Payload chega na Edge Function
         │
         ├─── CRM  ──→ mensagem ORIGINAL enviada
         ├─── WhatsApp ──→ mensagem ORIGINAL enviada  
         ├─── Email ──→ mensagem ORIGINAL enviada
         │
         └─── SMS ──→ [IA Resumidora] ──→ mensagem RESUMIDA enviada
                              │
                              ├── extrai links do texto
                              ├── envia texto para IA resumir (sem os links)
                              ├── IA retorna texto curto (≤120 chars)
                              └── reinsere links no final do resumo
```

## Lógica de Preservação de Links

A IA não pode resumir links pois eles são funcionais e podem mudar se truncados. A estratégia é:

1. **Extrair** todos os links do texto original com regex antes de enviar para a IA
2. **Resumir** apenas o texto sem os links (a IA recebe texto limpo)
3. **Reinserir** os links extraídos no final do texto resumido

```typescript
// Regex para extrair qualquer URL do texto
const URL_REGEX = /https?:\/\/[^\s]+/g;

function extractLinks(text: string): { cleanText: string; links: string[] } {
  const links = text.match(URL_REGEX) || [];
  const cleanText = text.replace(URL_REGEX, '').replace(/\s+/g, ' ').trim();
  return { cleanText, links };
}
```

## O que vai ser criado/modificado

### Arquivo modificado: `supabase/functions/send-multichannel-notification/index.ts`

**Nova função: `summarizeForSMS(message, link_data)`**

Essa função será inserida antes do bloco de envio de SMS. Ela:

1. Verifica se a mensagem já cabe em 160 caracteres — se sim, **não chama a IA** (economiza recursos)
2. Extrai links do texto com regex
3. Chama a Lovable AI (`LOVABLE_API_KEY`) via `https://ai.gateway.lovable.dev/v1/chat/completions`
4. Usa o modelo `google/gemini-2.5-flash-lite` (mais rápido e barato para tarefas simples)
5. Prompt específico instrui a IA a:
   - Resumir em no máximo **100 caracteres** (reserva espaço para links)
   - Manter o prefixo `WebMarcas:` 
   - Manter o nome do destinatário
   - Preservar informações de valor (R$) e nome da marca
   - Não adicionar pontuação desnecessária
6. Reinsere os links no final: `resumo + " " + links.join(" ")`
7. Aplica fallback: se a IA falhar, usa o `.substring(0, 160)` original (sem quebrar o sistema)

**Novo sistema de retry com fallback:**
```typescript
async function summarizeForSMS(message: string): Promise<string> {
  // Se já é curto, não precisa de IA
  if (message.length <= 160) return message;
  
  // Extrai links para preservar
  const { cleanText, links } = extractLinks(message);
  
  // Calcula espaço disponível para resumo
  const linkSpace = links.reduce((acc, l) => acc + l.length + 1, 0);
  const targetLen = Math.max(60, 155 - linkSpace);
  
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('sem chave');
    
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `Você é um compressor de SMS profissional. 
Resuma a mensagem em no máximo ${targetLen} caracteres.
REGRAS OBRIGATÓRIAS:
- Mantenha sempre "WebMarcas:" no início
- Preserve o nome do destinatário
- Preserve valores monetários (R$)
- Preserve nomes de marcas/produtos
- Não use abreviações que dificultem entendimento
- Não adicione comentários, apenas o texto resumido
- Responda SOMENTE o texto resumido, sem aspas`
          },
          { role: 'user', content: cleanText }
        ],
        max_tokens: 80,
        temperature: 0.2,
      }),
    });
    
    if (!res.ok) throw new Error(`AI error ${res.status}`);
    
    const json = await res.json();
    const summary = json.choices?.[0]?.message?.content?.trim() || '';
    
    if (!summary) throw new Error('resposta vazia');
    
    // Reinsere links preservados
    const final = links.length > 0
      ? `${summary} ${links.join(' ')}`
      : summary;
    
    // Garante limite máximo do SMS
    return final.substring(0, 160);
    
  } catch (err) {
    console.warn('[sms-ai] Resumo falhou, usando fallback:', err);
    // Fallback: preserva links manualmente no truncamento
    if (links.length > 0) {
      const link = links[0];
      const spaceForLink = 160 - link.length - 1;
      return `${cleanText.substring(0, spaceForLink)} ${link}`;
    }
    return message.substring(0, 160);
  }
}
```

**Modificação no bloco SMS (linha ~278):**
```typescript
// ANTES:
const smsResult = await withRetry(() => sendSMS(smsSettings, phone, message));

// DEPOIS:
const smsMessage = await summarizeForSMS(message); // ← IA resume aqui
const smsResult = await withRetry(() => sendSMS(smsSettings, phone, smsMessage));
```

O log de dispatch também registrará `sms_message_summarized: true` quando o resumo for aplicado, para rastreabilidade.

## Comportamento Esperado por Cenário

| Mensagem original | Tamanho | O que a IA faz |
|---|---|---|
| Texto curto (≤160 chars) | OK | Não chama IA, envia original |
| Texto longo sem link | >160 | Resume para ≤155 chars |
| Texto longo + link | >160 | Resume texto, preserva link no final |
| IA falha (timeout, erro) | — | Fallback: trunca preservando link |

## Arquivos a serem editados

- `supabase/functions/send-multichannel-notification/index.ts` — único arquivo a modificar

Nenhuma mudança em banco de dados, sem migrações, sem alteração de frontend. A feature é 100% aditiva e isolada no backend.
