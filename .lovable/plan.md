

# Upgrade Completo da Aba Publicacoes

## Diagnostico Atual

O componente `PublicacaoTab.tsx` possui **2.450 linhas** em um unico arquivo monolitico. Ele ja inclui: Kanban, Lista, KPIs, Charts, Timeline, Auto-link, Bulk Actions, Filtros, Exportacao PDF/CSV, Realtime, e sincronizacao RPI. Porem ha lacunas significativas em **usabilidade, inteligencia e performance**.

---

## Upgrades Propostos (por prioridade)

### 1. Refatoracao em Componentes Modulares

O arquivo de 2.450 linhas e dificil de manter. Dividir em subcomponentes:

- `PublicacaoDetailPanel.tsx` -- painel lateral de detalhes (linhas 1600-2090)
- `PublicacaoListTable.tsx` -- tabela com paginacao e sort (linhas 1520-1600)
- `PublicacaoToolbar.tsx` -- barra de busca, filtros, toggle view (linhas 1434-1520)
- `PublicacaoCreateDialog.tsx` -- dialog de criacao (linhas 2092-2150)
- `PublicacaoEditDialog.tsx` -- dialog de edicao (linhas 2152-2380)

Isso reduz o arquivo principal para ~800 linhas, mantendo a mesma funcionalidade.

---

### 2. Dashboard de Inteligencia com Metricas Avancadas

Adicionar novos KPIs interativos:

- **Taxa de Sucesso**: % de publicacoes que passaram de `depositada` para `deferida`/`certificada`
- **Tempo Medio por Etapa**: media de dias entre cada status (deposito -> publicacao -> decisao)
- **Publicacoes sem Acao**: processos parados ha mais de 30 dias sem mudanca de status
- **Proximos Vencimentos (7/15/30d)**: mini-calendario visual com marcacoes de prazo

---

### 3. Filtro Inteligente "Sem Cliente" e "Dados Incompletos"

Adicionar filtros rapidos no toolbar:

- **"Orfas"**: publicacoes sem `client_id`
- **"Dados Incompletos"**: sem `brand_name_rpi`, sem `process_number_rpi`, ou sem `ncl_class`
- **"Sem Prazo"**: publicacoes sem `proximo_prazo_critico` definido

Isso facilita a gestao de qualidade dos dados importados da RPI.

---

### 4. Auto-vinculacao Fuzzy (Similaridade de Texto)

Atualmente o match por nome da marca exige correspondencia exata (apos normalizacao). Implementar:

- Algoritmo de similaridade (Levenshtein ou comparacao por tokens) para detectar marcas com grafias ligeiramente diferentes
- Ex: "BRITTO STUDIO" vs "BRITO STUDIO" (1 caractere de diferenca)
- Threshold configuravel (ex: 85% de similaridade)
- Apresentar matches fuzzy como sugestoes para aprovacao manual (nao vincular automaticamente)

---

### 5. Painel de Acoes em Lote Aprimorado

Expandir as acoes em massa:

- **Atribuir admin responsavel** em lote
- **Definir prazo critico** em lote (util para publicacoes da mesma edicao da RPI)
- **Mover para status** com confirmacao e notificacao automatica ao cliente
- **Excluir em massa** publicacoes orfas sem dados relevantes

---

### 6. Notificacoes Automaticas Recorrentes

Implementar sistema de alertas agendados:

- Ao definir um prazo critico, criar automaticamente lembretes para 30, 15, 7 e 1 dia antes
- Enviar notificacao ao admin E ao cliente (se vinculado)
- Registrar no `notification_logs` para rastreabilidade
- Badge no KPI mostrando "alertas disparados hoje"

---

### 7. Historico de Vinculacao e Auditoria

Expandir o log de alteracoes:

- Mostrar quem vinculou/desvinculou cada cliente, quando e por qual metodo (manual, auto-link por processo, auto-link por marca)
- Adicionar campo `linking_method` na tabela `publicacoes_marcas` (manual | auto_process | auto_brand | fuzzy)
- Exibir badge no card do Kanban indicando o metodo de vinculacao

---

### 8. Exportacao Avancada e Relatorios

Melhorar as opcoes de exportacao:

- **Excel (XLSX)** alem de CSV e PDF
- **Filtrar exportacao** pelos mesmos filtros ativos
- **Relatorio Gerencial**: PDF formatado com graficos, metricas e resumo executivo
- **Exportar por cliente**: gerar relatorio individual para enviar ao cliente

---

### 9. Indicadores Visuais no Kanban

Aprimorar os cards do Kanban:

- **Indicador de vinculacao**: icone verde (vinculado) / vermelho (orfao)
- **Progresso na timeline**: barra de progresso mostrando quantas etapas foram concluidas
- **Prioridade visual**: borda colorida baseada na urgencia do prazo
- **Tooltip rico**: ao hover, mostrar resumo completo sem precisar abrir o detalhe

---

### 10. Busca Global com Destaque de Resultados

Melhorar a busca existente:

- Buscar tambem por `descricao_prazo`, `comentarios_internos`, `rpi_number`
- Manter o highlight amarelo ja implementado (`HighlightText`)
- Adicionar contador de resultados por categoria (clientes, marcas, processos)
- Persistir ultima busca ao alternar entre Kanban e Lista

---

## Detalhes Tecnicos

### Alteracoes no banco de dados:
- Nova coluna `linking_method TEXT DEFAULT 'manual'` em `publicacoes_marcas`
- Nova coluna `stale_since TIMESTAMPTZ` para detectar processos parados

### Arquivos a criar:
- `src/components/admin/publicacao/PublicacaoDetailPanel.tsx`
- `src/components/admin/publicacao/PublicacaoListTable.tsx`
- `src/components/admin/publicacao/PublicacaoToolbar.tsx`
- `src/components/admin/publicacao/PublicacaoCreateDialog.tsx`
- `src/components/admin/publicacao/PublicacaoEditDialog.tsx`
- `src/components/admin/publicacao/PublicacaoIntelligenceDashboard.tsx`

### Arquivo principal refatorado:
- `src/components/admin/PublicacaoTab.tsx` (reduzido de 2450 para ~800 linhas)

### Nenhuma dependencia nova necessaria
Todas as funcionalidades utilizam as bibliotecas ja instaladas (date-fns, recharts, framer-motion, jspdf, xlsx).

---

## Ordem de Implementacao Sugerida

1. Refatoracao modular (base para tudo)
2. Filtros inteligentes (rapido, alto impacto)
3. Dashboard de inteligencia (metricas avancadas)
4. Indicadores visuais no Kanban
5. Acoes em lote aprimoradas
6. Auto-vinculacao fuzzy
7. Notificacoes recorrentes
8. Historico de vinculacao
9. Exportacao avancada
10. Busca global aprimorada

