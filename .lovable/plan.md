

# Separacao clara: E-mail (ADMs) vs E-mails Automaticos (Resend/Notificacoes)

## Resumo

Duas mudancas simples para deixar cada aba com seu proposito correto:

## Mudanca 1: Aba "E-mail" (EmailSettings.tsx) -- Contas dos ADMs

**Remover** a secao "Automacao de Emails" (linhas 422-461) que esta duplicada/fora de lugar neste componente. Essa aba deve ser **exclusivamente** para contas SMTP/IMAP dos administradores (enviar e receber emails de trabalho).

Atualizar o titulo e descricao do header para deixar claro:
- Titulo: "Contas de E-mail dos Administradores"
- Descricao: "Configure contas SMTP/IMAP para cada administrador enviar e receber e-mails de trabalho"

## Mudanca 2: Aba "E-mails Automaticos" (AutomatedEmailSettings.tsx) -- Resend/noreply

Adicionar um card informativo no topo explicando que:
- Os e-mails automaticos usam o servico Resend configurado na aba **Integracoes**
- O remetente e sempre `noreply@webmarcas.net` (dominio verificado no Resend)
- Para alterar a chave API do Resend, acessar Configuracoes > Integracoes

Isso deixa claro que a aba de e-mails automaticos nao depende das contas SMTP dos admins, e sim da integracao com Resend.

## Arquivos modificados

| Arquivo | Alteracao |
|---|---|
| `src/components/admin/email/EmailSettings.tsx` | Remover secao "Automacao de Emails" (linhas 422-461). Atualizar titulo do header. |
| `src/components/admin/settings/AutomatedEmailSettings.tsx` | Adicionar card informativo sobre Resend e remetente `noreply@webmarcas.net`. |

## O que NAO muda

- Nenhuma Edge Function e alterada
- Nenhuma logica de envio muda
- A aba Integracoes com o card do Resend permanece igual
- Os templates de e-mail automatico continuam funcionando normalmente

