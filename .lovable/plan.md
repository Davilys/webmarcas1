
# Adicionar Dashboard na Aba Notificacoes das Configuracoes

## O que sera feito

Adicionar um dashboard de analytics na aba "Notificacoes" das Configuracoes, igual ao que ja existe na aba "E-mails Automaticos". A aba passara a ter duas sub-abas internas: **Dashboard** e **Templates** (conteudo atual).

## Dados Disponveis

A tabela `notifications` possui 42 registros com os campos: `id`, `user_id`, `title`, `message`, `type` (info/success/error/warning), `read`, `link`, `created_at`, `channels` (jsonb).

Distribuicao atual: 21 info, 20 success, 1 error.

## Layout

### Sub-aba Dashboard

**4 Cards de Metricas** (animados com framer-motion):
- Total de Notificacoes enviadas
- Lidas (read = true)
- Nao Lidas (read = false) 
- Taxa de Leitura (%)

**2 Graficos** (Recharts):
- BarChart: notificacoes por tipo (info, success, warning, error) com cores correspondentes
- AreaChart: volume diario nos ultimos 30 dias

**Tabela de Historico**:
- Ultimas 50 notificacoes
- Colunas: Data/Hora, Destinatario (via profiles.full_name), Titulo, Tipo (badge colorido), Status (lida/nao lida)

### Sub-aba Templates
Conteudo atual do NotificationSettings (sem alteracoes)

## Detalhes Tecnicos

### Arquivo criado
- `src/components/admin/settings/NotificationAnalyticsDashboard.tsx` - Dashboard reutilizavel para notificacoes CRM

### Arquivo modificado
- `src/components/admin/settings/NotificationSettings.tsx` - Adicionar Tabs internas (Dashboard | Templates), wrapping o conteudo atual na aba Templates

### Mapeamento de tipos
- `info` -> "Informacao" (azul)
- `success` -> "Sucesso" (verde)
- `warning` -> "Aviso" (amber)
- `error` -> "Urgente" (vermelho)

### Dependencias (todas ja instaladas)
- Recharts, framer-motion, shadcn (Tabs, Card, Badge, Table, ScrollArea, Progress, Tooltip)

### Nenhuma alteracao em banco de dados
- A tabela `notifications` ja possui todos os dados necessarios
