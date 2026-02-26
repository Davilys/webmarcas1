
# Remarketing Multicanal: E-mail + WhatsApp com Limites e Horario Comercial

## Visao Geral

Refatorar o sistema de remarketing para:
1. Enviar por **E-mail** (Resend) e **WhatsApp** (BotConversa webhook) - sem SMS
2. Limites diarios: **100 e-mails/dia** e **10 WhatsApp/dia** (intervalo de 10min entre WhatsApps)
3. Envios apenas em **horario comercial** (Seg-Sex, 10h-17h BRT)
4. Campanha nao envia tudo de uma vez - agenda os envios em fila
5. **Teste imediato**: enviar 1 e-mail + 1 WhatsApp para o lead "Gleison Carvalho" como validacao

---

## 1. Nova Tabela: Fila de Envios (`lead_remarketing_queue`)

Tabela para controlar envios escalonados:

- `id` (uuid)
- `campaign_id` (uuid, FK remarketing_campaigns)
- `lead_id` (uuid)
- `channel` (text: 'email' ou 'whatsapp')
- `status` (text: 'pending' / 'sent' / 'failed')
- `scheduled_for` (timestamptz) - data/hora agendada (dentro do horario comercial)
- `sent_at` (timestamptz)
- `error_message` (text)
- `created_at` (timestamptz)

RLS: apenas admins.

---

## 2. Edge Function: `send-lead-remarketing` (Reescrita)

A funcao sera refatorada para:

### Modo "teste" (`test: true` no payload)
- Recebe 1 lead_id, envia 1 e-mail + 1 WhatsApp imediatamente
- Retorna resultado de cada canal

### Modo "campanha" (padrao)
- Recebe lead_ids[], channels (email/whatsapp), campaign_id
- **Nao envia imediatamente** - insere na tabela `lead_remarketing_queue`
- Calcula horarios agendados respeitando:
  - E-mail: ate 100/dia, distribuidos no horario comercial (10h-17h BRT, Seg-Sex)
  - WhatsApp: ate 10/dia, com intervalo minimo de 10 minutos entre cada
  - Se ultrapassar o limite diario, agenda para o proximo dia util
- Retorna quantos foram enfileirados

### Envio de WhatsApp
- Usa o webhook BotConversa (ja configurado) com payload: `{ telefone, nome, mensagem }`
- Mesma logica do `send-multichannel-notification`

### Envio de E-mail
- Mantem Resend como esta

---

## 3. Nova Edge Function: `process-remarketing-queue`

Funcao chamada via cron (a cada 10 minutos) para processar a fila:

- Verifica se esta em horario comercial (10h-17h BRT, Seg-Sex)
- Se nao, sai sem fazer nada
- Busca itens `pending` com `scheduled_for <= now()`
- Processa em lotes:
  - E-mails: ate 15 por execucao (100/dia / ~7h = ~14/h)
  - WhatsApp: ate 1 por execucao (10/dia / ~7h com intervalo 10min)
- Para cada item: envia, atualiza status, loga atividade
- Atualiza contadores da campanha

---

## 4. UI: `LeadRemarketingPanel.tsx` (Atualizado)

### Novos elementos:
- **Checkboxes de canal**: E-mail e WhatsApp (ambos marcados por padrao)
- **Indicadores**: "X leads com e-mail" / "X leads com telefone"
- **Botao "Enviar Teste"**: envia 1 e-mail + 1 WhatsApp para o primeiro lead da lista filtrada
- **Info de limites**: "E-mail: 100/dia | WhatsApp: 10/dia (10min intervalo) | Horario: Seg-Sex 10h-17h"
- Ao clicar "Enviar Campanha": mostra toast informando que os envios serao distribuidos no horario comercial

### Historico de campanhas:
- Mostrar status "agendada" / "em andamento" / "concluida"
- Mostrar progresso (enviados / total)

---

## 5. Cron Job

Agendar `process-remarketing-queue` a cada 10 minutos via pg_cron + pg_net.

---

## 6. Teste Imediato

Apos implementar, enviar teste para o lead **Gleison Carvalho** (email: Gleysoncarvalhofm@gmail.com, phone: (74) 99976-4748):
- 1 e-mail de remarketing
- 1 WhatsApp via BotConversa webhook

---

## Arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar tabela `lead_remarketing_queue` |
| `supabase/functions/send-lead-remarketing/index.ts` | Reescrever: modo teste + enfileiramento com horario comercial |
| `supabase/functions/process-remarketing-queue/index.ts` | Novo: processa fila respeitando limites |
| `src/components/admin/leads/LeadRemarketingPanel.tsx` | Adicionar canais, botao teste, info de limites |
| Cron SQL | Agendar processamento a cada 10min |
