
# ✅ Correcao de Notificacoes de Contrato + Template de Link de Assinatura

## Status: CONCLUÍDO

### O que foi feito:

1. **Migração de Banco** — Template `signature_request` inserido na tabela `email_templates` com HTML profissional e variáveis `{{nome}}`, `{{link_assinatura}}`, `{{data_expiracao}}`, `{{marca}}`, `{{documento_tipo}}`

2. **Edge Function `send-signature-request`** — Refatorada:
   - Removida dependência da tabela `email_accounts` (causa do bug "Conta de email não configurada")
   - Busca template `signature_request` do banco de dados
   - Substitui variáveis dinamicamente
   - Chama `send-email` (Resend) diretamente, sem condicional
   - Fallback com texto padrão se template estiver desativado
   - Campo `to` corrigido para array

3. **Frontend `AutomatedEmailSettings.tsx`** — Atualizado:
   - `signature_request` adicionado ao `triggerConfig`
   - Variáveis `{{link_assinatura}}`, `{{data_expiracao}}`, `{{documento_tipo}}` adicionadas
   - Preview com dados de exemplo atualizado

### Resultado:
- Botão "Enviar para Cliente" (azul) → envia email + WhatsApp com o link ✅
- Ícone de email (topo) → envia email com o link ✅
- Template editável na aba E-mails Automáticos ✅
