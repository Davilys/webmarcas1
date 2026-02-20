
# Correção: Nome do Consultor e Conversa Atribuída no Chat Suporte do Cliente

## Diagnóstico do Problema

### Problema 1 — RLS bloqueia a leitura do perfil do admin atribuído
A política de segurança da tabela `profiles` permite que clientes visualizem **apenas o próprio perfil** (`auth.uid() = id`). Quando o `ChatSuporte.tsx` tenta buscar o nome do admin com:

```typescript
const { data: admin } = await supabase
  .from('profiles')
  .select('id, full_name')
  .eq('id', adminId)  // ← adminId é o ID do admin, não do cliente
  .single();
```

A query retorna `null` porque o RLS bloqueia o acesso ao perfil de outro usuário. Por isso `assignedAdmin` fica `null` e o card mostra **"Seu Consultor"** com inicial **"C"** genérica.

### Problema 2 — Ao clicar, não inicia conversa com o admin correto
Quando `assignedAdmin` é `null`, a função `startHumanChat` não consegue chamar `chat.openDirectConversation(assignedAdmin.id)` e retorna erro silencioso ou mensagem "Nenhum consultor atribuído".

## Solução

### Correção 1 — Nova RLS policy: clientes podem ver perfis dos admins atribuídos a eles
Adicionar uma política de leitura que permita ao cliente visualizar o perfil do usuário cujo `id` está registrado como `assigned_to` ou `created_by` no perfil do próprio cliente:

```sql
CREATE POLICY "Clients can view their assigned admin profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Permite que clientes vejam o perfil do admin atribuído a eles
  id IN (
    SELECT assigned_to FROM profiles WHERE id = auth.uid() AND assigned_to IS NOT NULL
    UNION
    SELECT created_by FROM profiles WHERE id = auth.uid() AND created_by IS NOT NULL
  )
);
```

Esta política é segura: o cliente só consegue ler o perfil do **seu próprio consultor**, não de qualquer outro usuário.

### Correção 2 — Buscar nome do admin direto na query do perfil do cliente (fallback eficiente)
Como a query de perfil do cliente já retorna `assigned_to` (o UUID do admin), podemos fazer um join via Supabase para buscar o nome do admin em uma única query, tornando a busca mais robusta:

No `ChatSuporte.tsx`, modificar a query do perfil para incluir o nome do admin via select aninhado:

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('full_name, assigned_to, created_by')
  .eq('id', session.user.id)
  .single();

// Com a nova policy RLS, isso vai funcionar:
const adminId = profile?.assigned_to || profile?.created_by;
if (adminId) {
  const { data: admin } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', adminId)
    .single();
  if (admin) setAssignedAdmin(admin);
}
```

### Correção 3 — Exibir nome correto no card e iniciar conversa automaticamente ao clicar
Com o `assignedAdmin` populado corretamente, o card já exibe o nome real (linha 539: `{assignedAdmin?.full_name || 'Seu Consultor'}`). Confirmar que `startHumanChat` abre corretamente a conversa com o admin atribuído.

Adicionar feedback visual de loading no card do consultor enquanto os dados carregam, e uma mensagem de fallback mais clara quando o cliente realmente não tem nenhum consultor atribuído.

## Arquivos a Modificar

### 1. Migration SQL (nova RLS policy)
Criar migration adicionando a policy `Clients can view their assigned admin profile` na tabela `profiles`.

### 2. `src/pages/cliente/ChatSuporte.tsx`
- Adicionar estado `loadingAdmin` para exibir skeleton no card do consultor enquanto carrega
- Melhorar fallback quando não há consultor atribuído (mensagem explicativa em vez de "Seu Consultor" com inicial "C" genérica)
- Garantir que ao clicar no card, a conversa com o admin correto é iniciada imediatamente

## Resultado Esperado
- Card **"Seu Consultor"** exibe o nome real do consultor atribuído (ex: "Caroline Martins")
- As iniciais no avatar verde refletem o nome real (ex: "CM")
- Ao clicar no card, abre o chat diretamente com o consultor atribuído
- A conversa é persistida no banco e visível para o admin no painel administrativo
