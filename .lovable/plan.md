
# Correcao Urgente: Permissoes Nao Funcionando + Dashboard Acessivel

## Problemas Identificados

1. **Login sempre redireciona para `/admin/dashboard`** - mesmo que o usuario nao tenha permissao de dashboard
2. **Logo e header sempre linkam para `/admin/dashboard`** - ao clicar na logo, todos vao para o dashboard
3. **Nao existe guarda centralizada de permissoes** - cada pagina precisaria ter seu proprio check, mas apenas Dashboard.tsx tem um (e com bug de timing)
4. **Race condition no carregamento** - enquanto as permissoes carregam, o conteudo aparece brevemente antes de ser bloqueado

## Dados do Banco (confirmados)

- **Camila** e **Caroline**: NAO possuem `dashboard` na tabela `admin_permissions`, logo nao deveriam ver o Dashboard
- Porem, ambas conseguem acessar `/admin/dashboard` porque o login redireciona para la e nao ha guarda efetiva

## Solucao: Guarda Centralizada no AdminLayout

Em vez de adicionar checks em cada pagina individualmente, a solucao sera implementar uma **guarda centralizada** no `AdminLayoutInner` que:

1. Apos carregar as permissoes do usuario, verifica se ele tem acesso a rota atual
2. Se NAO tiver, redireciona automaticamente para a **primeira secao permitida**
3. Se nao tiver permissao para NENHUMA secao, mostra tela de acesso restrito

### Mudancas nos Arquivos

**1. `src/components/admin/AdminLayout.tsx`**

- Importar `useAdminPermissions` no `AdminLayoutInner` (ja esta no sidebar)
- Apos confirmar que e admin E permissoes carregaram:
  - Verificar se a rota atual esta permitida via `canAccessPath(location.pathname)`
  - Se nao estiver, calcular a primeira rota permitida e redirecionar via `navigate()`
- Alterar os 2 links da logo (sidebar header linha 284 e header linha 449) para navegar para a primeira rota permitida em vez de `/admin/dashboard` hardcoded
- O master admin continua com acesso total (FULL_ACCESS_MAP ja resolve isso)

**2. `src/pages/admin/Login.tsx`**

- Apos confirmar que o usuario e admin, buscar as permissoes antes de redirecionar
- Navegar para a primeira secao que o usuario tem `can_view: true`
- Fallback: se nao tiver nenhuma permissao, navegar para `/admin/configuracoes` (ou mostrar erro)

**3. `src/pages/admin/Dashboard.tsx`**

- Remover o check de permissao local (sera tratado pelo AdminLayout centralizado)
- Manter apenas a restricao de valores financeiros para nao-master

### Logica da Guarda Centralizada

```text
AdminLayoutInner:
  1. checkAdmin() -> confirma role admin
  2. useAdminPermissions() -> carrega permissoes
  3. Se ambos carregados:
     a. Obter permissionKey da rota atual
     b. Se permissionKey existe E can_view === false:
        - Encontrar primeira rota com can_view === true
        - navigate(primeiraRotaPermitida)
     c. Se nenhuma rota permitida -> mostrar "Acesso Restrito"
  4. Enquanto carrega -> mostrar spinner (ja existe)
```

### Logica do Link da Logo

```text
Logo onClick:
  1. Encontrar primeiro item do menu que o usuario tem can_view
  2. Navegar para esse href
  3. Fallback: /admin/configuracoes
```

### Resultado Esperado

- Ao logar, Camila sera redirecionada para `/admin/leads` (primeira secao com permissao)
- Ao clicar na logo, ira para `/admin/leads` tambem
- Se digitar `/admin/dashboard` na URL, sera redirecionada automaticamente
- Todas as restricoes de permissoes definidas na tela de Seguranca passam a funcionar em TODAS as paginas automaticamente
- Master admin continua com acesso total e irrestrito
