
# Atribuição Automática de Responsável ao Assinar Contrato

## O que será feito

O objetivo é garantir que, em qualquer fluxo onde um admin crie um contrato ou um cliente novo, esse admin fique automaticamente salvo como `assigned_to` no perfil do cliente. Isso inclui:

1. Admin cria contrato para cliente existente → admin fica como responsável
2. Admin cria contrato com novo cliente → admin fica como responsável
3. Cliente assina contrato enviado pelo admin → admin criador é preservado como responsável

---

## Diagnóstico Completo

### O que já funciona
- `CreateClientDialog` → ao criar cliente manualmente, o admin logado já é salvo em `created_by` e `assigned_to` no perfil. Correto.

### O que está faltando

**Problema 1: Tabela `contracts` não tem coluna `created_by`**
- Quando um admin cria um contrato (via `CreateContractDialog`), não há como saber qual admin o criou
- Sem essa informação, a Edge Function de assinatura não consegue saber quem deve ser o `assigned_to`

**Problema 2: `CreateContractDialog` não salva o admin como responsável**
- Ao inserir o contrato no banco, o admin logado (`auth.uid()`) não é salvo em lugar nenhum
- O perfil do cliente (`profiles`) não recebe `assigned_to` durante a criação do contrato

**Problema 3: Edge Function `sign-contract-blockchain` não atribui responsável**
- Quando o cliente assina, a função cria/atualiza o perfil mas não seta `assigned_to`
- Para contratos vindos do site (sem admin), o `assigned_to` ficaria nulo — aceitável
- Para contratos criados pelo admin, o `assigned_to` deveria ser o admin que criou o contrato

---

## Solução em 3 Camadas

### Camada 1 — Banco de Dados (Migração)
Adicionar coluna `created_by` na tabela `contracts` para registrar qual admin criou cada contrato.

```sql
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
```

### Camada 2 — Frontend: `CreateContractDialog.tsx`
No momento da inserção do contrato (linha ~729), adicionar o `user_id` do admin logado como `created_by`:

```typescript
// Antes de chamar supabase.from('contracts').insert(...)
const { data: { user: adminUser } } = await supabase.auth.getUser();

// No objeto de inserção:
created_by: adminUser?.id || null,
```

E logo após criar o contrato com sucesso, atualizar o perfil do cliente para definir o admin como responsável (se ainda não tiver um):

```typescript
if (adminUser?.id && userId) {
  await supabase
    .from('profiles')
    .update({ assigned_to: adminUser.id })
    .eq('id', userId)
    .is('assigned_to', null); // Só atribui se ainda não tiver responsável
}
```

### Camada 3 — Edge Function: `sign-contract-blockchain`
Após a assinatura do contrato, buscar o `created_by` do contrato e atribuí-lo como `assigned_to` no perfil do cliente:

```typescript
// Após identificar o userId do cliente
const { data: contractWithAdmin } = await supabase
  .from('contracts')
  .select('created_by')
  .eq('id', contractId)
  .single();

// Se o contrato tem um admin criador, atribuir como responsável
if (contractWithAdmin?.created_by && userId) {
  await supabase
    .from('profiles')
    .update({ 
      assigned_to: contractWithAdmin.created_by,
      created_by: contractWithAdmin.created_by // se ainda não tiver
    })
    .eq('id', userId)
    .is('assigned_to', null); // Só atribui se ainda não tiver responsável
}
```

---

## Fluxos cobertos após a implementação

| Fluxo | Comportamento esperado |
|---|---|
| Admin cria cliente manualmente (Novo Cliente) | Admin → `created_by` + `assigned_to` do perfil (já funciona) |
| Admin cria contrato para cliente existente | Admin → `created_by` do contrato + `assigned_to` do perfil (novo) |
| Admin cria contrato para novo cliente | Admin → `created_by` do contrato + `assigned_to` do perfil (novo) |
| Cliente assina via link enviado pelo admin | Admin (via `contracts.created_by`) → `assigned_to` do perfil (novo) |
| Cliente assina via formulário do site (sem admin) | `assigned_to` permanece nulo — sem admin para atribuir |

---

## Arquivos que serão modificados

1. **Migração SQL** — adicionar `created_by` na tabela `contracts`
2. **`src/components/admin/contracts/CreateContractDialog.tsx`** — salvar admin logado no contrato e no perfil
3. **`supabase/functions/sign-contract-blockchain/index.ts`** — buscar `created_by` do contrato e atribuir ao perfil no momento da assinatura

---

## Observações importantes

- A lógica usa `.is('assigned_to', null)` para não sobrescrever um responsável já atribuído manualmente
- Para contratos do site (sem admin), o campo `created_by` ficará nulo — comportamento esperado
- A coluna `created_by` na tabela `contracts` usa `ON DELETE SET NULL` para manter integridade referencial caso o admin seja removido
