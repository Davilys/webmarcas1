

# Sincronizacao de Status de Faturas Asaas -> Financeiro

## Problema Identificado

As faturas estao todas como "pending" no banco de dados, mesmo estando pagas no Asaas. A causa raiz e que **o webhook do Asaas nunca esta sendo chamado** (zero logs na edge function `asaas-webhook`). Isso significa que o Asaas nao esta configurado para enviar notificacoes de pagamento para o sistema.

Existem 2 solucoes complementares que precisam ser implementadas:

1. **Configurar o webhook no Asaas** (acao manual do usuario no painel Asaas)
2. **Criar um botao "Sincronizar com Asaas"** que consulta a API do Asaas e atualiza os status das faturas pendentes (solucao imediata + fallback permanente)

## Solucao Tecnica

### 1. Nova Edge Function: `sync-asaas-invoices`

Criar uma edge function que:
- Busca todas as faturas com status `pending` no banco de dados que possuem `asaas_invoice_id`
- Para cada uma, consulta `GET /v3/payments/{id}` na API do Asaas
- Compara o status retornado e atualiza o banco local
- Mapeia os status: `RECEIVED`/`CONFIRMED` -> `paid`, `OVERDUE` -> `overdue`, etc.
- Atualiza tambem o `payment_date` quando confirmado
- Retorna um resumo: quantas atualizadas, quantas ja estavam corretas

### 2. Botao "Sincronizar Asaas" na pagina Financeiro

Adicionar no header da pagina `src/pages/admin/Financeiro.tsx`:
- Um botao ao lado de "Atualizar" com icone de sync
- Ao clicar, invoca `sync-asaas-invoices`
- Mostra loading e toast com resultado ("5 faturas atualizadas")
- Recarrega a lista apos sincronizacao

### 3. Configuracao do Webhook (instrucao para o usuario)

O usuario precisa acessar o painel do Asaas e configurar o webhook:
- URL: `https://afuqrzecokubogopgfgt.supabase.co/functions/v1/asaas-webhook`
- Eventos: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`

Isso sera exibido como instrucao apos a sincronizacao.

## Detalhes Tecnicos

### Edge Function `sync-asaas-invoices`

```text
Fluxo:
1. SELECT * FROM invoices WHERE status = 'pending' AND asaas_invoice_id IS NOT NULL
2. Para cada fatura:
   GET https://api.asaas.com/v3/payments/{asaas_invoice_id}
3. Se status Asaas != PENDING:
   UPDATE invoices SET status = mapeado, payment_date = data
4. Retornar { synced: N, total: M }
```

Mapeamento de status:
- `RECEIVED`, `CONFIRMED`, `RECEIVED_IN_CASH` -> `received` / `confirmed`
- `OVERDUE` -> `overdue`
- `REFUNDED` -> `refunded`
- `PENDING` -> manter `pending`

### Mudancas nos arquivos:

1. **`supabase/functions/sync-asaas-invoices/index.ts`** (novo)
   - Edge function que consulta Asaas e atualiza faturas
   - Usa `ASAAS_API_KEY` (ja configurada)
   - Processamento em lote com rate limiting

2. **`supabase/config.toml`** (adicionar)
   - `[functions.sync-asaas-invoices]` com `verify_jwt = false`

3. **`src/pages/admin/Financeiro.tsx`**
   - Novo botao "Sincronizar Asaas" no header
   - Estado `syncing` para loading
   - Funcao `handleSyncAsaas` que invoca a edge function
   - Toast com resultado da sincronizacao

### Seguranca
- A edge function usa `SUPABASE_SERVICE_ROLE_KEY` para updates
- A API do Asaas e consultada com `ASAAS_API_KEY`
- Ambos secrets ja estao configurados

