
# Plano: Central de Integrações Unificada — API, Webhooks, SMS e BotConversa

## Diagnóstico Honesto do Estado Atual

Após análise completa do projeto, o estado real é:

**O que já existe e funciona:**
- `system_settings` tabela com chaves: `api_keys`, `webhooks`, `asaas`, `whatsapp`, `inpi` etc.
- Secrets já configurados no backend: `ASAAS_API_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `SITE_URL`
- Página Configurações > Integrações (Asaas) e API e Webhooks (chave do sistema + Zapier/n8n/Make/OpenAI)
- Edge functions: `trigger-email-automation`, `asaas-webhook`, `generate-signature-link`, `sign-contract-blockchain`
- Central de Notificações (CRM) funcionando com templates e envio manual

**O problema central identificado:**
A UI de configurações NÃO centraliza todas as credenciais necessárias para o projeto funcionar. O admin não tem onde configurar ASAAS_API_KEY, BOTCONVERSA_WEBHOOK, ZENVIA_API_KEY etc. Cada uma está "escondida" ou inexistente na interface.

**Resposta sincera:** Sim, é 100% realizável e ficará funcionando corretamente, pois a base está sólida.

---

## O Que Será Criado (Modo 100% Aditivo)

### BLOCO 1 — Melhorar a aba "Integrações" (IntegrationSettings.tsx)

Atualmente só mostra Asaas. Será expandida com cards para cada integração principal:

**Card 1 — Asaas (já existe, só melhora)**
- Adicionar campo de API Key (salva em `system_settings` chave `asaas`, campo `api_key`)
- Botão "Testar Conexão" já funciona
- Toggle Sandbox/Produção já funciona

**Card 2 — Resend (E-mail Transacional)**
- Campo: API Key do Resend (salva em `system_settings` > `email_provider`)
- Campo: E-mail remetente padrão
- Botão: Testar conexão (envia e-mail de teste)
- Status: Configurado / Não configurado

**Card 3 — BotConversa (WhatsApp)**
- Campo: URL do Webhook de saída do BotConversa
- Campo: Token de autenticação (opcional, para verificação)
- Toggle: Ativar/desativar envio via BotConversa
- Botão: Testar webhook (envia payload de teste)
- Status: Configurado / Não configurado

**Card 4 — SMS via Zenvia**
- Campo: API Key Zenvia
- Campo: Nome do remetente (SenderName)
- Toggle: Ativar/desativar envio SMS
- Botão: Testar (envia SMS de teste para número configurado)
- Status: Configurado / Não configurado

**Card 5 — OpenAI**
- Campo: API Key (já existe em api_keys > openai_key, migrar para cá)
- Toggle: Ativar para chat de suporte / respostas automáticas
- Status

**Card 6 — INPI (monitoramento)**
- Usuário e senha INPI (já existe como secret, exibir status)
- Toggle: Sincronização automática
- Informação de última sincronização

---

### BLOCO 2 — Melhorar a aba "API e Webhooks" (APIWebhooksSettings.tsx)

Expandir o que já existe com melhorias:

**Seção 1 — Chave de API WebMarcas** (já existe, mantém)

**Seção 2 — Webhooks de Saída** (já existe, mantém)
- Expandir lista de eventos: adicionar `sms.sent`, `whatsapp.sent`, `notification.sent`

**Seção 3 — Webhook de Entrada Asaas** (NOVO)
- Exibe a URL do webhook para o admin copiar e colar no painel Asaas
- URL: `https://afuqrzecokubogopgfgt.supabase.co/functions/v1/asaas-webhook`
- Instrução de configuração com botão "Copiar URL"

**Seção 4 — Integrações de Automação** (Zapier/n8n/Make — já existem, mantém)

---

### BLOCO 3 — Nova Edge Function: `send-multichannel-notification`

Motor central de notificações multicanal. Recebe um payload e dispara simultaneamente para os canais configurados.

**Entrada:**
```json
{
  "event_type": "formulario_preenchido | link_assinatura_gerado | contrato_assinado | cobranca_gerada | fatura_vencida | pagamento_confirmado | manual",
  "channels": ["crm", "sms", "whatsapp"],
  "recipient": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "phone": "5511999999999",
    "user_id": "uuid-opcional"
  },
  "data": {
    "link": "https://webmarcas.net/assinar/token",
    "valor": "1500.00",
    "marca": "MINHA MARCA",
    "mensagem_custom": "Texto personalizado"
  }
}
```

**Lógica interna:**
1. Lê `system_settings` para verificar quais canais estão ativos e suas credenciais
2. Executa os canais em paralelo (`Promise.allSettled`)
3. **CRM:** insere em `notifications` (se `user_id` fornecido)
4. **SMS (Zenvia):** POST para `https://api.zenvia.com/v2/channels/sms/messages`
5. **WhatsApp (BotConversa):** POST para o webhook configurado
6. Registra resultado de cada canal em `notification_dispatch_logs`
7. Retry automático (até 3 tentativas) em caso de falha temporária
8. Nunca cancela um canal por falha de outro (isolamento de erros)

---

### BLOCO 4 — Nova Tabela: `notification_dispatch_logs`

Migration para registrar todos os disparos:

```sql
CREATE TABLE notification_dispatch_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  channel text NOT NULL,          -- 'crm', 'email', 'sms', 'whatsapp'
  recipient_phone text,
  recipient_email text,
  recipient_user_id uuid,
  status text NOT NULL,           -- 'sent', 'failed', 'retry'
  payload jsonb,
  response_body text,
  error_message text,
  attempts integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- RLS: apenas admins leem
ALTER TABLE notification_dispatch_logs ENABLE ROW LEVEL SECURITY;
```

---

### BLOCO 5 — Disparos Automáticos (Hooks em funções existentes)

**Regra absoluta: apenas ADICIONAR chamadas ao final das funções, sem alterar a lógica existente.**

**5a. `trigger-email-automation`** — após enviar e-mail com sucesso:
- Chama `send-multichannel-notification` com `channels: ["crm", "sms", "whatsapp"]`
- Não duplica e-mail (e-mail já foi enviado pela função original)
- Condicional: só dispara se os canais estiverem ativos no `system_settings`

**5b. `asaas-webhook`** — nos eventos `OVERDUE` e `RECEIVED/CONFIRMED`:
- `OVERDUE`: chama motor com `event_type: "fatura_vencida"` + `channels: ["crm", "sms", "whatsapp"]`
- `CONFIRMED`: chama motor com `event_type: "pagamento_confirmado"` + mesmos canais

**5c. `generate-signature-link`** — após gerar o link:
- Chama motor com `event_type: "link_assinatura_gerado"` + `channels: ["crm", "sms", "whatsapp"]`
- Passa `data.link = signatureUrl`

**5d. `sign-contract-blockchain`** — após assinar:
- Chama motor com `event_type: "contrato_assinado"` + todos os canais

---

### BLOCO 6 — Melhorar o Dialog "Nova Notificação" em Notificacoes.tsx

Adicionar seção de canais multicanal **abaixo** do campo de destinatário atual (sem alterar o que já existe):

```
── Canais de Envio ──────────────────────
[ ✓ ] CRM (in-app)
[ ✓ ] SMS (Zenvia)      → mostra "inativo" se não configurado
[ ✓ ] WhatsApp          → mostra "inativo" se não configurado
─────────────────────────────────────────
```

Ao submeter, se houver canais extras além do CRM, chama `send-multichannel-notification` além de inserir na tabela `notifications`.

---

## Sequência de Implementação

```
FASE 1 — Backend
  1. Migration: criar tabela notification_dispatch_logs
  2. Criar edge function: send-multichannel-notification
  3. Adicionar system_settings para botconversa e sms (upsert)

FASE 2 — UI de Configurações
  4. Reescrever IntegrationSettings.tsx com todos os cards
  5. Melhorar APIWebhooksSettings.tsx (URL de entrada Asaas + eventos SMS/WhatsApp)

FASE 3 — Automatizar disparos
  6. Hook em trigger-email-automation
  7. Hook em asaas-webhook (OVERDUE + CONFIRMED)
  8. Hook em generate-signature-link
  9. Hook em sign-contract-blockchain (se existir)

FASE 4 — UI de Notificações
  10. Adicionar checkboxes de canais no dialog Nova Notificação
  11. Mostrar status dos canais (ativo/inativo) baseado no system_settings

FASE 5 — Credenciais
  12. Solicitar ZENVIA_API_KEY e BOTCONVERSA_WEBHOOK_URL via secrets
```

---

## O Que NÃO Será Alterado

- Tabela `notifications` (continua igual)
- Tabela `notification_templates` (continua igual)
- Lógica de contratos, funil, pagamentos, INPI
- Visual da Central de Notificações (só acrescenta checkboxes no dialog)
- Qualquer permissão ou política RLS existente
- Edge functions existentes (apenas recebem um hook ao final)

---

## Credenciais que Você Precisará

Para o SMS e BotConversa funcionar após implementação:

**Zenvia (SMS):**
1. Acesse `zenvia.com` → Crie conta gratuita
2. Vá em API → Tokens → Gere um token
3. Cole o token na tela Configurações > Integrações > SMS

**BotConversa (WhatsApp):**
1. Acesse seu painel BotConversa
2. Crie um novo fluxo com gatilho "Webhook externo"
3. Copie a URL do webhook gerada
4. Cole em Configurações > Integrações > BotConversa

Não precisa me passar nada agora. Após implementar, a tela de configurações vai pedir essas informações diretamente.

---

## Resultado Final

Ao aprovar este plano, o admin terá uma **Central de Integrações** unificada em Configurações onde pode:

- Configurar e testar Asaas, Resend, BotConversa, Zenvia, OpenAI, INPI em uma tela só
- Ver o status de cada integração (Ativo/Inativo/Não configurado)
- Copiar a URL do webhook Asaas para colar no painel Asaas
- Ao enviar uma "Nova Notificação", escolher quais canais usar (CRM + SMS + WhatsApp)
- Tudo disparando automaticamente nos eventos do sistema
