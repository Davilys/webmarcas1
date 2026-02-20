
# Correção: Links Quebrados nos E-mails Automáticos

## Diagnóstico Preciso

A URL no screenshot é: `webmarcas.net/admin/%7B%7Bapp_url%7D%7D/status-pedido`

`%7B%7B` = `{{` e `%7D%7D` = `}}` em URL encoding. Isso significa que a variável `{{app_url}}` **não foi substituída** no corpo do e-mail antes do envio. O cliente recebeu o placeholder literal no HTML, e ao clicar, o browser URL-encodou as chaves.

### Causa Raiz

No arquivo `supabase/functions/trigger-email-automation/index.ts`, linhas 68-80:

```typescript
const appUrl = data.base_url || Deno.env.get('SITE_URL');
if (!appUrl) {
  console.error('No base_url provided and SITE_URL secret not configured');
  return new Response(
    JSON.stringify({ error: 'SITE_URL not configured...' }),
    { status: 500, ... }
  );
}
```

A função exige `data.base_url` ou a secret `SITE_URL`. O problema: **a secret `SITE_URL` está configurada como `https://webmarcas.net`**, mas os callers internos (edge functions como `sign-contract-blockchain`, `asaas-webhook`, `create-asaas-payment`, `check-abandoned-forms`) **NÃO passam `base_url` no payload**. 

Verificando os callers:
- `sign-contract-blockchain` → chama `trigger-email-automation` com `data: { nome, email, ... }` **sem `base_url`**
- `asaas-webhook` → idem, sem `base_url`
- `create-asaas-payment` → idem
- `check-abandoned-forms` → idem
- `confirm-payment` → idem

Portanto, a função depende 100% da secret `SITE_URL`. Se a secret estiver vazia ou incorreta, `appUrl` fica `undefined`, a substituição `{{app_url}} → valor` não funciona, e o placeholder vai literalmente no e-mail.

**Solução definitiva**: Remover a dependência da secret `SITE_URL` e hardcodar o domínio de produção `https://webmarcas.net` diretamente na função `trigger-email-automation`, assim como já é feito nas funções `send-signature-request` e `generate-signature-link` (que têm `const PRODUCTION_DOMAIN = 'https://webmarcas.net'`).

## Arquivos a Modificar

### 1. `supabase/functions/trigger-email-automation/index.ts`

**Mudança**: Substituir a lógica frágil de `appUrl` por uma constante hardcoded com fallback robusto:

```typescript
// ANTES (frágil - depende de SITE_URL):
const appUrl = data.base_url || Deno.env.get('SITE_URL');
if (!appUrl) {
  return new Response({ error: 'SITE_URL not configured' }, { status: 500 });
}

// DEPOIS (robusto - domínio de produção fixo como nas outras funções):
const PRODUCTION_DOMAIN = 'https://webmarcas.net';
const rawSiteUrl = Deno.env.get('SITE_URL') || '';
const isPreviewUrl = (url: string) =>
  url.includes('lovable.app') || url.includes('localhost') || !url;
const appUrl = data.base_url || 
  (rawSiteUrl && !isPreviewUrl(rawSiteUrl) ? rawSiteUrl : PRODUCTION_DOMAIN);
// Nunca retorna erro 500 — sempre tem um fallback válido
```

### 2. Todos os callers internos que invocam `trigger-email-automation`

Adicionar `base_url: 'https://webmarcas.net'` explicitamente nos payloads de cada caller, garantindo que mesmo que a lógica da secret falhe, o domínio correto seja passado:

**Arquivos afetados:**
- `supabase/functions/sign-contract-blockchain/index.ts` — invocações de `user_created` e `contract_signed`
- `supabase/functions/asaas-webhook/index.ts` — invocações de `payment_received`
- `supabase/functions/create-asaas-payment/index.ts` — invocação de `form_completed`
- `supabase/functions/confirm-payment/index.ts` — invocações de `contract_signed` e `payment_received`
- `supabase/functions/check-abandoned-forms/index.ts` — invocação de `form_abandoned`
- `src/components/sections/RegistrationFormSection.tsx` — invocação de `form_started` (frontend)

## Plano de Implementação

### Etapa 1: Corrigir `trigger-email-automation/index.ts`
- Hardcodar `PRODUCTION_DOMAIN = 'https://webmarcas.net'`
- Remover o bloqueio de `return 500` quando `SITE_URL` está ausente
- Garantir que `appUrl` **sempre** tenha um valor válido

### Etapa 2: Atualizar todos os callers
- Adicionar `base_url: 'https://webmarcas.net'` no campo `data` de cada invocação a `trigger-email-automation`
- Isso garante redundância dupla: o caller passa a URL correta E a função tem o fallback correto

### Etapa 3: Deploy automático
- As edge functions serão implantadas automaticamente após a edição

## Impacto

- Links de todos os e-mails automáticos voltarão a funcionar corretamente
- "Continuar Registro", "Ver Status do Pedido", "Acessar Área do Cliente", links de assinatura — todos apontarão para `https://webmarcas.net/...`
- Sem alterações no banco de dados, sem migração necessária
- Zero impacto em layout, CRM ou demais funcionalidades

## Arquivos a Modificar (resumo técnico)

| Arquivo | Mudança |
|---|---|
| `supabase/functions/trigger-email-automation/index.ts` | Hardcodar PRODUCTION_DOMAIN, remover erro 500 por SITE_URL ausente |
| `supabase/functions/sign-contract-blockchain/index.ts` | Adicionar `base_url` nos 2 payloads |
| `supabase/functions/asaas-webhook/index.ts` | Adicionar `base_url` nos payloads |
| `supabase/functions/create-asaas-payment/index.ts` | Adicionar `base_url` no payload |
| `supabase/functions/confirm-payment/index.ts` | Adicionar `base_url` nos payloads |
| `supabase/functions/check-abandoned-forms/index.ts` | Adicionar `base_url` no payload |
| `src/components/sections/RegistrationFormSection.tsx` | Adicionar `base_url: window.location.origin` que a lógica já usa |
