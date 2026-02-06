

## Plano: Scheduler Semanal para Expiração de Promoção

### Resumo

Criar uma rotina automática que execute toda **sexta-feira às 23:59:59** para atualizar o valor de contratos não assinados que estão com preço promocional à vista.

---

### Mapeamento dos Dados (baseado na análise do banco)

| Campo no Banco | Valor Filtro |
|----------------|--------------|
| `contract_value` | `699.00` |
| `payment_method` | `'avista'` |
| `signature_status` | `'not_signed'` |
| `signed_at` | `NULL` |

**Novo valor após expiração:** `1194.00` (preço cheio cartão 6x)

---

### Componentes a Criar

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         ARQUITETURA                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐      ┌─────────────────────────────────┐      │
│  │   pg_cron        │ ───► │  Edge Function                  │      │
│  │   (Scheduler)    │      │  expire-promotion-price         │      │
│  │                  │      │                                 │      │
│  │  Sexta 23:59     │      │  1. Buscar contratos elegíveis  │      │
│  └──────────────────┘      │  2. Atualizar valor para 1194   │      │
│                            │  3. Registrar log de execução   │      │
│                            └─────────────────────────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/expire-promotion-price/index.ts` | **Criar** - Edge Function |
| `supabase/config.toml` | **Modificar** - Adicionar configuração da função |
| Migração SQL | **Criar** - Habilitar extensões e criar cron job |

---

### 1. Edge Function: `expire-promotion-price`

```typescript
// Lógica segura e isolada
const handler = async (req: Request): Promise<Response> => {
  // 1. Conectar com service role (acesso admin)
  const supabase = createClient(url, serviceKey);
  
  // 2. Buscar contratos elegíveis com filtro seguro
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, contract_number, contract_value, payment_method')
    .eq('contract_value', 699.00)         // Apenas valor promocional
    .eq('payment_method', 'avista')       // Apenas à vista
    .eq('signature_status', 'not_signed') // Apenas não assinados
    .is('signed_at', null)                // Dupla verificação
    .is('asaas_payment_id', null);        // Não pagos
  
  // 3. Atualizar apenas esses contratos
  for (const contract of contracts) {
    await supabase
      .from('contracts')
      .update({ contract_value: 1194.00 })
      .eq('id', contract.id);
  }
  
  // 4. Retornar relatório
  return Response.json({
    success: true,
    updated_count: contracts.length,
    contracts_updated: contracts.map(c => c.contract_number)
  });
};
```

---

### 2. Migração SQL: Habilitar Extensões e Criar Cron

```sql
-- Passo 1: Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Passo 2: Criar tabela de log (opcional mas recomendado)
CREATE TABLE IF NOT EXISTS public.promotion_expiration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at timestamptz DEFAULT now(),
  contracts_updated integer DEFAULT 0,
  contract_ids jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'success'
);

-- Passo 3: Criar cron job (sexta-feira 23:59:59 BRT = 02:59:59 UTC sábado)
SELECT cron.schedule(
  'expire-promotion-weekly',
  '59 2 * * 6',  -- Sábado 02:59 UTC = Sexta 23:59 BRT
  $$
  SELECT net.http_post(
    url := 'https://afuqrzecokubogopgfgt.supabase.co/functions/v1/expire-promotion-price',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('triggered_by', 'cron', 'timestamp', now())
  );
  $$
);
```

---

### 3. Configuração em `supabase/config.toml`

```toml
[functions.expire-promotion-price]
verify_jwt = false
```

---

### Critérios de Segurança (Todos Atendidos)

| Requisito | Implementação |
|-----------|---------------|
| NÃO alterar contratos com status "ASSINADO" | `eq('signature_status', 'not_signed')` |
| NÃO alterar contratos pagos | `is('asaas_payment_id', null)` |
| NÃO alterar parcelados | `eq('payment_method', 'avista')` |
| NÃO recalcular cobranças já emitidas | Verifica `asaas_payment_id = null` |
| NÃO alterar histórico | Apenas atualiza `contract_value` |
| NÃO modificar layout | Sem alterações de frontend |
| NÃO modificar estrutura do banco | Apenas adiciona tabela de log |
| NÃO afetar integrações | Função isolada, não interfere em outras |

---

### Query Exata de Atualização

```sql
UPDATE contracts
SET contract_value = 1194.00
WHERE contract_value = 699.00
  AND payment_method = 'avista'
  AND signature_status = 'not_signed'
  AND signed_at IS NULL
  AND asaas_payment_id IS NULL;
```

---

### Cronograma de Execução

| Parâmetro | Valor |
|-----------|-------|
| Expressão Cron | `59 2 * * 6` |
| Horário UTC | Sábado 02:59:59 |
| Horário BRT | Sexta-feira 23:59:59 |
| Frequência | Semanal |

---

### Monitoramento

A tabela `promotion_expiration_logs` permitirá:
- Verificar histórico de execuções
- Auditar quais contratos foram atualizados
- Identificar falhas se ocorrerem

---

### Teste Manual (após implementação)

```bash
# Chamar função manualmente para testar
curl -X POST \
  'https://afuqrzecokubogopgfgt.supabase.co/functions/v1/expire-promotion-price' \
  -H 'Authorization: Bearer ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"test_mode": true}'
```

---

### Retrocompatibilidade

| Item | Impacto |
|------|---------|
| Contratos existentes assinados | Não afetados |
| Contratos parcelados | Não afetados |
| Cobranças já geradas | Não afetadas |
| Frontend | Nenhuma alteração |
| Outras edge functions | Nenhuma dependência |

