
## Correção de Bug: Clientes do Funil Comercial não aparecem no Kanban

### Problema Identificado

Clientes criados via **Novo Contrato → Criar novo cliente** não aparecem no Kanban "CLIENTES COMERCIAL" na etapa "ASSINOU CONTRATO", mesmo após assinatura do contrato.

### Causa Raiz

Na Edge Function `create-client-user/index.ts`, quando um processo `brand_processes` é criado, o campo `pipeline_stage` é **sempre** definido como `'protocolado'` (linhas 139 e 240).

**Porém:**
- `'protocolado'` é um estágio do funil **JURÍDICO**
- O funil **COMERCIAL** tem os estágios: `assinou_contrato`, `pagamento_ok`, `pagou_taxa`
- Quando o Kanban filtra por `client_funnel_type = 'comercial'`, procura por esses estágios
- Como o processo tem `pipeline_stage = 'protocolado'`, ele não aparece em nenhuma coluna

### Solução Proposta

#### Arquivo: `supabase/functions/create-client-user/index.ts`

**Linha 139 - Para clientes existentes:**
```typescript
// ANTES:
pipeline_stage: 'protocolado',

// DEPOIS:
pipeline_stage: client_funnel_type === 'comercial' ? 'assinou_contrato' : 'protocolado',
```

**Linha 240 - Para novos clientes:**
```typescript
// ANTES:
pipeline_stage: 'protocolado',

// DEPOIS:
pipeline_stage: client_funnel_type === 'comercial' ? 'assinou_contrato' : 'protocolado',
```

---

### Análise de Impacto

| Risco | Mitigação |
|-------|-----------|
| Clientes antigos | Sem impacto - apenas novos clientes criados |
| Funil jurídico | Sem alteração - continua usando `'protocolado'` como padrão |
| APIs existentes | Sem quebra - lógica é aditiva |
| Contratos existentes | Sem alteração |

---

### Correção de Dados Existentes (Opcional)

Se desejar corrigir o cliente "Yasmin" que já foi criado com o bug, executar no banco:

```sql
UPDATE brand_processes 
SET pipeline_stage = 'assinou_contrato'
WHERE user_id IN (
  SELECT id FROM profiles WHERE client_funnel_type = 'comercial'
) 
AND pipeline_stage = 'protocolado';
```

---

### Teste Esperado

1. **Novo Contrato → Criar novo cliente** 
2. Cliente assina contrato
3. Ir em **Clientes** → **Comercial**
4. Cliente deve aparecer na coluna **"ASSINOU CONTRATO"**
