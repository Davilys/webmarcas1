

# Dashboard de Analytics + Historico de E-mails Automaticos

## O que sera adicionado

Duas sub-abas internas na secao "E-mails Automaticos": **Dashboard** e **Templates** (conteudo atual). Nada do que existe sera alterado.

## Layout do Dashboard

### Linha 1 - 4 Cards de Metricas (animados com framer-motion)
- **Total Enviados** (icone Mail) - total geral de emails
- **Entregues** (icone CheckCircle2, verde) - status = "sent"
- **Com Erro** (icone AlertCircle, vermelho) - status = "error"/"failed"
- **Taxa de Sucesso** (icone TrendingUp, azul) - percentual com barra de progresso

### Linha 2 - 2 Graficos (Recharts, ja instalado)
- **Coluna 1**: BarChart - Envios por tipo de notificacao (contract_signed, form_started, user_created, payment_received, signature_request, manual, etc.) com cores do triggerConfig
- **Coluna 2**: AreaChart - Volume diario nos ultimos 30 dias (tendencia)

### Linha 3 - Tabela de Historico
- Ultimos 50 emails em tabela premium com ScrollArea
- Colunas: Data/Hora, Destinatario, Assunto, Tipo (Badge colorido por trigger_type), Status (Badge verde/vermelho)
- Tooltip no icone de erro mostrando a mensagem de erro
- Cada tipo de notificacao tem badge com label e cor do triggerConfig

## Detalhes Tecnicos

### Arquivo modificado
`src/components/admin/settings/AutomatedEmailSettings.tsx`

### Dados utilizados
- Tabela `email_logs` (ja existe com 71+ registros): campos `status`, `trigger_type`, `to_email`, `subject`, `sent_at`, `error_message`
- Nova query `useQuery(['email-logs-analytics'])` buscando todos os logs ordenados por `sent_at DESC`

### Dependencias (todas ja instaladas)
- `Recharts` (BarChart, AreaChart, ResponsiveContainer)
- `framer-motion` (animacao dos cards)
- Shadcn: Tabs, Card, Badge, Table, ScrollArea, Progress, Tooltip

### Estrutura interna
```
AutomatedEmailSettings
  |-- Tabs (Dashboard | Templates)
       |-- Dashboard tab
       |    |-- MetricCards (4 cards)
       |    |-- Charts (BarChart + AreaChart)
       |    |-- HistoryTable (ultimos 50 emails)
       |-- Templates tab
            |-- (conteudo atual sem alteracoes)
```

### Mapeamento de tipos na tabela
Todos os `trigger_type` existentes serao exibidos com label e cor:
- `contract_signed` -> "Contrato Assinado" (verde)
- `form_started` -> "Boas-Vindas" (azul)
- `user_created` -> "Credenciais" (roxo)
- `payment_received` -> "Pagamento" (sky)
- `signature_request` -> "Link Assinatura" (indigo)
- `manual` -> "Manual" (cinza)
- `processual` -> "Processual" (amber)
- Qualquer outro -> label capitalizado com cor neutra

### Nenhuma alteracao em banco de dados
- Tabela `email_logs` ja possui todos os dados necessarios
- Nenhuma migracao necessaria

