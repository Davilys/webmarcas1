
# Separar Emails por Conta (estilo Outlook)

## Problema Atual

Todos os emails recebidos e enviados aparecem misturados numa unica lista, sem separacao por conta de email. Um administrador com 2 contas atribuidas ve tudo junto. Alem disso, admins comuns veem emails de contas que nao sao deles.

## Como vai funcionar

### Comportamento por tipo de usuario

- **Admin Master (davillys@gmail.com)**: ve TODAS as contas de email no painel lateral, cada uma separada. Clica em "juridico@webmarcas.net" e ve so os emails dessa conta. Clica em "financeiro@webmarcas.net" e ve so os dessa.
- **Admin comum**: ve apenas as contas atribuidas a ele (campo `assigned_to`). Se tem 2 contas, ve 2 opcoes separadas no painel lateral.

### Interface (estilo Outlook)

No sidebar de email, ANTES das pastas (Caixa de Entrada, Enviados, etc.), aparece uma secao "Contas de Email" listando cada conta com seu endereco. O admin clica numa conta para seleciona-la, e todas as pastas (inbox, sent, etc.) filtram apenas por aquela conta.

## Mudancas Tecnicas

### 1. `src/pages/admin/Emails.tsx`
- Adicionar estado `selectedAccountId` (conta selecionada)
- Buscar contas de email do usuario atual (master ve todas, admin ve apenas `assigned_to = seu ID`)
- Passar `selectedAccountId` para `EmailList`, `EmailSidebar`, `EmailCompose`
- Passar lista de contas para `EmailSidebar`

### 2. `src/components/admin/email/EmailSidebar.tsx`
- Adicionar secao "Contas de Email" no topo (abaixo do botao "Novo Email")
- Cada conta aparece como botao clicavel com o endereco de email e nome de exibicao
- Indicador visual de conta selecionada
- Ao clicar, chama callback `onAccountChange(accountId)`

### 3. `src/components/admin/email/EmailList.tsx`
- Receber prop `accountId` (conta selecionada)
- Filtrar `email_inbox` por `account_id = accountId`
- Filtrar `email_logs` por `from_email = email da conta selecionada`
- Sincronizacao IMAP passa o `account_id` correto

### 4. `src/components/admin/email/EmailCompose.tsx`
- Receber prop `accountId` para saber de qual conta enviar
- Usar as credenciais SMTP da conta selecionada

### 5. Queries de stats (`email-stats`)
- Filtrar por `account_id` da conta selecionada para mostrar contagem correta

### 6. Sincronizacao IMAP (`sync-imap-inbox`)
- Ja funciona por `account_id` -- nenhuma alteracao necessaria na edge function

## Fluxo do Usuario

```text
Sidebar                          Conteudo
+----------------------------+   +---------------------------+
| [Novo Email]               |   |                           |
|                            |   |  Emails da conta          |
| CONTAS DE EMAIL            |   |  selecionada              |
| > juridico@webmarcas.net   |   |                           |
|   financeiro@webmarcas.net |   |  - Email 1                |
|                            |   |  - Email 2                |
| PASTAS                     |   |  - Email 3                |
|   Caixa de Entrada (3)     |   |                           |
|   Enviados (12)            |   |                           |
|   Rascunhos                |   |                           |
|   ...                      |   |                           |
+----------------------------+   +---------------------------+
```

## Impacto
- Nenhuma tabela ou schema alterado (email_inbox ja tem `account_id`)
- Nenhuma edge function alterada
- Apenas componentes de frontend: Emails.tsx, EmailSidebar.tsx, EmailList.tsx, EmailCompose.tsx
- Compatibilidade total mantida
