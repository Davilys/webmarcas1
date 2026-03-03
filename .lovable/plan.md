

## Correcao com Teste Integrado: Clientes importados nao aparecem no Kanban

### Problema confirmado

- **Sonia Aparecida Morais** (sam.moraes0@gmail.com) existe no Auth (id: `931c2303-978c-4d67-b44c-5420fac12382`) mas NAO tem perfil
- O sistema tem **2.420 usuarios** no Auth, mas o `listUsers({ perPage: 1000 })` so busca os primeiros 1.000
- Resultado: a funcao nao encontra o usuario e retorna erro silencioso

### Etapas de Implementacao

#### Etapa 1: Criar funcao SQL para busca direta

Criar uma migration com a funcao `get_auth_user_id_by_email` que busca diretamente na tabela `auth.users` sem limite de paginacao:

```sql
CREATE OR REPLACE FUNCTION public.get_auth_user_id_by_email(lookup_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = lower(trim(lookup_email)) LIMIT 1;
$$;
```

#### Etapa 2: Atualizar Edge Function

No `import-clients/index.ts`, substituir o bloco `listUsers` (linhas 168-173) por chamada RPC:

```text
Antes:
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existingAuthUser = listData?.users?.find(u => u.email === email);
  if (!existingAuthUser) { return error }
  userId = existingAuthUser.id;

Depois:
  const { data: authUserId } = await supabaseAdmin.rpc('get_auth_user_id_by_email', { lookup_email: email });
  if (!authUserId) { return error }
  userId = authUserId;
```

#### Etapa 3: Deploy e Teste Automatizado

Apos o deploy da edge function:

1. **Chamar a edge function** com os dados da Sonia Aparecida Morais para testar a importacao
2. **Verificar no banco** se o perfil foi criado: `SELECT * FROM profiles WHERE email = 'sam.moraes0@gmail.com'`
3. **Verificar no banco** se o brand_process foi criado: `SELECT * FROM brand_processes WHERE user_id = '931c2303-...'`
4. **Verificar** que `client_funnel_type = 'juridico'` e `pipeline_stage = 'protocolado'`

#### Etapa 4: Publicar somente se o teste passar

- Se TODOS os testes acima confirmarem que a Sonia aparece no banco com perfil + processo juridico/protocolado: publicar a correcao
- Se QUALQUER teste falhar: investigar o erro, corrigir, e testar novamente antes de publicar

### Resultado esperado

- A funcao SQL busca diretamente em auth.users (funciona com 2.420+ usuarios)
- Sonia Aparecida Morais aparece no Kanban da aba Clientes > Juridico > Protocolado
- Todos os outros clientes orfaos do arquivo tambem sao importados corretamente
- A correcao so e publicada apos verificacao completa

