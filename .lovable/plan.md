

# Vincular Contas de E-mail a Administradores

## Resumo

Adicionar um seletor de administrador no formulario de adicionar conta de e-mail, permitindo que o ADM Master atribua cada conta a um administrador especifico. O ADM Master ve todas as contas; os demais so veem as contas atribuidas a eles.

## Mudancas no Banco de Dados

Adicionar coluna `assigned_to` (uuid, nullable) na tabela `email_accounts` para vincular a conta a um administrador especifico. A coluna `user_id` continua registrando quem criou a conta.

```text
email_accounts
  + assigned_to (uuid, nullable) -- ID do admin que tem acesso a essa conta
```

## Mudancas no Frontend (EmailSettings.tsx)

### 1. Carregar lista de administradores

Buscar todos os usuarios com role `admin` na tabela `user_roles`, depois buscar seus nomes/emails na tabela `profiles`. Mesmo padrao ja usado em `ClientDetailSheet.tsx` e `AdminChatWidget.tsx`.

### 2. Novo campo "Administrador Vinculado" no formulario

Adicionar um `<Select>` entre os campos de Email/Nome e os campos SMTP, com a lista de administradores. Campo obrigatorio.

### 3. Filtrar contas por permissao

- ADM Master (`davillys@gmail.com`): ve todas as contas
- Outros admins: veem apenas contas onde `assigned_to` = seu proprio `user_id`

### 4. Exibir nome do admin vinculado na lista

Cada conta na lista mostra o nome do administrador atribuido com um badge (ex: "Atribuido a: Joao Silva").

## Arquivos Modificados

| Arquivo | Alteracao |
|---|---|
| Migracao SQL | Adicionar coluna `assigned_to` na tabela `email_accounts` |
| `src/components/admin/email/EmailSettings.tsx` | Adicionar seletor de admin, filtro por permissao, exibir admin vinculado na lista |

## O que NAO muda

- Nenhuma Edge Function alterada
- Logica de teste de conexao permanece igual
- Logica de envio de e-mails permanece igual
- Nenhuma outra pagina e modificada

