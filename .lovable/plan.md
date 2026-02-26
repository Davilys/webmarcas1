
# Email Automatico para Clientes - Sistema de Remarketing

## Resumo

Replicar o sistema de remarketing de Leads para a aba Clientes. O sistema sera identico em funcionalidade (campanhas, canais email/WhatsApp, enviar agora/agendar, pausar/excluir, preview), mas enviando para clientes (tabela `profiles`) em vez de leads.

---

## 1. Banco de Dados

### Nova tabela: `client_remarketing_campaigns`
Espelho de `lead_remarketing_campaigns`, para separar campanhas de clientes das de leads:
- `id`, `name`, `type`, `subject`, `body`, `target_status` (array), `channels` (array), `status`, `total_sent`, `total_opened`, `total_queued`, `created_by`, `created_at`, `sent_at`, `scheduled_at`
- RLS: apenas admins

### Nova tabela: `client_remarketing_queue`
Espelho de `lead_remarketing_queue`, com `client_id` no lugar de `lead_id`:
- `id`, `campaign_id` (FK client_remarketing_campaigns), `client_id` (uuid), `channel`, `status`, `scheduled_for`, `sent_at`, `error_message`, `subject`, `body`, `created_at`
- RLS: admins + service role

---

## 2. Nova Edge Function: `send-client-remarketing`

Copia da `send-lead-remarketing`, adaptada:
- Em vez de buscar na tabela `leads`, busca na tabela `profiles` (campos: `id, full_name, email, phone, company_name`)
- Modo teste: envia 1 email + 1 WhatsApp para o primeiro cliente
- Modo campanha: enfileira na `client_remarketing_queue`
- Loga atividades em `client_activities` em vez de `lead_activities`
- Mesma logica de slots, limites, e resumo IA para WhatsApp

---

## 3. Atualizar Edge Function: `process-remarketing-queue`

Adicionar processamento da fila `client_remarketing_queue` alem da `lead_remarketing_queue`:
- Apos processar emails/WhatsApp de leads, processar tambem a fila de clientes
- Buscar dados do cliente em `profiles` (via join)
- Logar em `client_activities` e `email_logs`
- Atualizar contadores em `client_remarketing_campaigns`

---

## 4. Novo Componente: `ClientRemarketingPanel.tsx`

Componente em `src/components/admin/clients/ClientRemarketingPanel.tsx`, baseado no `LeadRemarketingPanel.tsx`:
- Mesma UI: nome campanha, tipo, canais, assunto, corpo, filtros, preview email/WhatsApp, enviar agora/agendar, historico, pausar/excluir
- Interface adaptada: recebe `clients` (array com `id, full_name, email, phone, company_name`) em vez de `leads`
- Filtros de audiencia: por pipeline_stage (em vez de status do lead) e prioridade (em vez de temperatura)
- Busca campanhas em `client_remarketing_campaigns`
- Invoca `send-client-remarketing` em vez de `send-lead-remarketing`
- Contadores: "X clientes com e-mail" / "X clientes com telefone"

---

## 5. Atualizar `Clientes.tsx`

- Adicionar botao "Email Automatico" ao lado da barra de busca (icone Mail, tamanho pequeno)
- Ao clicar, abre/fecha o painel `ClientRemarketingPanel` acima do kanban/lista
- Passar os `filteredClients` mapeados para o formato esperado pelo painel
- Importar icone `Mail` do lucide-react

---

## Arquivos Afetados

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar tabelas `client_remarketing_campaigns` e `client_remarketing_queue` |
| `supabase/functions/send-client-remarketing/index.ts` | Novo: versao para clientes |
| `supabase/functions/process-remarketing-queue/index.ts` | Atualizar: processar tambem fila de clientes |
| `src/components/admin/clients/ClientRemarketingPanel.tsx` | Novo: painel de remarketing para clientes |
| `src/pages/admin/Clientes.tsx` | Adicionar botao e integrar painel |
