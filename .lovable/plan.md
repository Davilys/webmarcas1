

# Abas SMS e WhatsApp com Dashboard + Templates de Notificacoes

## O que sera criado

Duas novas abas na secao "Comunicacao" das Configuracoes: **SMS Automatico** e **WhatsApp Automatico (BotConversa)**, cada uma com:
1. Dashboard de analytics (igual ao de e-mails)
2. Templates de notificacao (igual aos templates de e-mail automaticos)

## Estrutura de Navegacao

A secao "Comunicacao" ficara:
- E-mails Automaticos (existente)
- **SMS Automatico** (NOVO) - icone Smartphone, cor cyan
- **WhatsApp Automatico** (NOVO) - icone MessageCircle, cor emerald
- E-mail (existente)
- WhatsApp (existente)
- Notificacoes (existente)

## Alteracao no Banco de Dados

Sera criada uma nova tabela `channel_notification_templates` para armazenar os templates de SMS e WhatsApp, com campos:
- `id` (uuid)
- `name` (text) - nome do template
- `message` (text) - conteudo da mensagem
- `trigger_event` (text) - gatilho (contrato_assinado, link_assinatura_gerado, pagamento_confirmado, etc.)
- `channel` (text) - "sms" ou "whatsapp"
- `is_active` (boolean)
- `created_by` (uuid)
- `created_at`, `updated_at` (timestamps)

RLS: apenas admins podem gerenciar.

## Layout de Cada Aba (SMS e WhatsApp)

Cada aba tera sub-abas internas (identico ao E-mails Automaticos):

### Sub-aba "Dashboard"
Componente reutilizavel `ChannelAnalyticsDashboard` que recebe `channel` como prop:

**4 Cards de Metricas** (animados com framer-motion):
- Total Enviados
- Entregues (status = "sent")
- Com Erro (status = "failed")
- Taxa de Sucesso (%)

**2 Graficos** (Recharts):
- BarChart: envios por tipo de evento (contrato_assinado, link_assinatura_gerado, pagamento_confirmado, manual)
- AreaChart: volume diario dos ultimos 30 dias

**Tabela de Historico**:
- Ultimos 50 registros da tabela `notification_dispatch_logs` filtrados por canal
- Colunas: Data/Hora, Destinatario (telefone), Tipo (badge colorido), Tentativas, Status

### Sub-aba "Templates"
Gerenciamento completo de templates do canal:
- Lista de templates com badge de status (ativo/inativo), icone do gatilho, switch para ativar/desativar
- Botao para criar novo template
- Dialog de edicao com campos: Nome, Mensagem (com variaveis disponiveis), Gatilho, Switch ativo
- Variaveis: nome, marca, numero_processo, link_assinatura, data_expiracao

## Detalhes Tecnicos

### Arquivos criados
| Arquivo | Descricao |
|---------|-----------|
| `src/components/admin/settings/ChannelAnalyticsDashboard.tsx` | Dashboard reutilizavel (recebe channel como prop) |
| `src/components/admin/settings/AutomatedSMSSettings.tsx` | Aba SMS com tabs Dashboard + Templates |
| `src/components/admin/settings/AutomatedWhatsAppSettings.tsx` | Aba WhatsApp com tabs Dashboard + Templates |
| `src/components/admin/settings/ChannelNotificationTemplates.tsx` | Componente de templates reutilizavel (recebe channel como prop) |

### Arquivo modificado
| Arquivo | Descricao |
|---------|-----------|
| `src/pages/admin/Configuracoes.tsx` | Adicionar 2 itens no nav + imports + mapeamento |

### Dados utilizados
- **Dashboard**: tabela `notification_dispatch_logs` (ja existe com 138 registros), filtrada por `channel`
- **Templates**: nova tabela `channel_notification_templates`

### Mapeamento de tipos de evento
Os `event_type` da tabela `notification_dispatch_logs`:
- `contrato_assinado` -> "Contrato Assinado" (verde)
- `link_assinatura_gerado` -> "Link Assinatura" (indigo)
- `pagamento_confirmado` -> "Pagamento" (sky)
- `manual` -> "Manual" (cinza)
- `formulario_preenchido` -> "Formulario" (azul)
- `cobranca_gerada` -> "Cobranca" (amber)
- `fatura_vencida` -> "Fatura Vencida" (vermelho)

### Card informativo por canal
- SMS: informacao sobre o provedor Zenvia e link para aba Integracoes
- WhatsApp: informacao sobre o provedor BotConversa e link para aba Integracoes

### Dependencias
Todas ja instaladas: Recharts, framer-motion, shadcn (Tabs, Card, Badge, Table, ScrollArea, Dialog, Switch)

