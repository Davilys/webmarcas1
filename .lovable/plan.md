

# Correcao de Notificacoes de Contrato + Template de Link de Assinatura

## Problemas Identificados

### 1. Notificacao nao envia ao criar contrato / clicar "Enviar para Cliente"
O botao "Enviar para Cliente" (azul) e o icone de email (canto superior direito) chamam a Edge Function `send-signature-request`, que verifica se existe uma conta SMTP padrao na tabela `email_accounts`. Como nao ha conta cadastrada, o envio falha com "Conta de email nao configurada" -- mesmo que o Resend esteja funcionando perfeitamente.

### 2. Template "Link de Assinatura" ausente nos E-mails Automaticos
A aba de E-mails Automaticos nao possui o template `signature_request`, impedindo que o admin personalize o conteudo do email enviado com o link de assinatura.

---

## Solucao

### Etapa 1 - Migracao de Banco
Inserir um registro na tabela `email_templates` com:
- `trigger_event`: `signature_request`
- `name`: "Link de Assinatura"
- `subject` e `body` com variaveis como `{{nome}}`, `{{link_assinatura}}`, `{{data_expiracao}}`, `{{marca}}`

### Etapa 2 - Edge Function `send-signature-request`
Refatorar o bloco de envio de email:
- **Remover** a consulta a `email_accounts` (causa do bug)
- **Buscar** o template `signature_request` da tabela `email_templates`
- **Substituir** as variaveis do template com os dados do contrato
- **Chamar** `send-email` diretamente (Resend), sem condicional
- Manter fallback com texto padrao caso o template esteja desativado
- Corrigir campo `to` para array (`[recipientEmail]`)

### Etapa 3 - Frontend: `AutomatedEmailSettings.tsx`
Adicionar no `triggerConfig`:
```
signature_request: {
  label: 'Link de Assinatura',
  description: 'Enviado quando o link de assinatura e gerado para o cliente',
  icon: FileSignature,
  color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
}
```
Adicionar variaveis `{{link_assinatura}}` e `{{data_expiracao}}` na lista `availableVariables`.

### Impacto nos botoes do ContractDetailSheet
Nenhuma alteracao no frontend do ContractDetailSheet e necessaria. Ambos os botoes (azul "Enviar para Cliente" e icone de email) ja chamam `send-signature-request` corretamente -- o problema e exclusivamente na Edge Function que falha antes de enviar.

Apos a correcao:
- Botao "Enviar para Cliente" -> envia email + WhatsApp com o link
- Icone de email (topo) -> envia email com o link (para contratos pendentes) ou email de confirmacao (para contratos assinados, usando template `contract_signed`)

### Arquivos modificados
- `supabase/functions/send-signature-request/index.ts`
- `src/components/admin/settings/AutomatedEmailSettings.tsx`
- Nova migracao SQL (insert template)

### Nenhuma outra alteracao
- Edge Function `send-email` ja funciona com Resend (testado)
- Edge Function `trigger-email-automation` ja mapeia `signature_request`
- Nenhuma alteracao no `ContractDetailSheet.tsx`

