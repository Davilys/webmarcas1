

## Plano: Simplificar Marketing Intelligence — Remover Google Ads e Consolidar Abas

### Situação Atual
20 abas no painel, incluindo componentes Google Ads que serão removidos. Muitas abas com funcionalidades que podem ser agrupadas.

### Estrutura Proposta: 20 abas → 7 abas

```text
ANTES (20 abas):
Dashboard | Campanhas | Conversões | Funil | Atribuição | Eventos | Histórico
Lead Score | Keywords | Orçamento | Heatmap | Públicos | Público IA | Previsão
Gerador IA | Teste A/B | Agente IA | Alertas | Meta | Google

DEPOIS (7 abas):
Dashboard | Campanhas | Análise | Leads | Públicos | Agente IA | Config
```

### Mapeamento de consolidação

| Nova Aba | Conteúdo embutido |
|----------|-------------------|
| **Dashboard** | MarketingOverview + BudgetControl (resumo orçamento) + MarketingAlerts (alertas inline) |
| **Campanhas** | CampaignTable + AdPerformanceHistory (histórico como sub-seção) |
| **Análise** | ConversionsTracker + ConversionFunnelModule + AttributionPanel + PixelEventTracking (4 módulos em sub-tabs internas) |
| **Leads** | LeadScoringModule + HeatmapModule (score + melhores horários juntos) |
| **Públicos** | AudienceExport + AudienceSuggester (exportação + sugestão IA juntos) |
| **Agente IA** | OptimizationAgent + AdCopyGenerator + ABTestManager + CampaignPrediction (hub completo do agente) |
| **Config** | MetaAdsConfig apenas (sem Google) |

### O que será REMOVIDO

1. **Arquivo deletado**: `src/components/admin/marketing/GoogleAdsConfig.tsx`
2. **Arquivo deletado**: `src/components/admin/marketing/KeywordAnalysis.tsx` (focado em Google Ads)
3. **Referências a Google Ads** removidas dos textos de: `AdCopyGenerator.tsx` (remover opção "Google Ads" do select de plataforma), `PixelEventTracking.tsx` (remover menções a Google Ads Conversion API), `marketing-ai-agent` edge function (remover referências a Google Ads nos prompts)
4. **Referência `gclid`** removida do `useUTMCapture.ts` (manter apenas `fbclid`)

### O que será MODIFICADO

1. **`MarketingIntelligence.tsx`** — Reescrever com 7 abas consolidadas, cada uma renderizando múltiplos componentes agrupados com sub-tabs internas ou seções empilhadas
2. **`AdCopyGenerator.tsx`** — Remover opção Google do select de plataforma
3. **`PixelEventTracking.tsx`** — Remover texto sobre Google Ads Conversion API
4. **`useUTMCapture.ts`** — Remover captura de `gclid`
5. **`marketing-ai-agent/index.ts`** — Remover referências Google Ads dos prompts, focar apenas Meta Ads

### O que NÃO será alterado
- Nenhuma tabela do banco de dados (colunas google_ads ficam no schema mas não são usadas)
- Nenhum módulo do CRM (leads, clientes, contratos, financeiro)
- Nenhuma edge function existente além do `marketing-ai-agent`

### Resultado Visual
Interface limpa com 7 abas em uma única linha, visual profissional, todas funcionalidades essenciais preservadas e agrupadas logicamente. O Agente IA centraliza toda a inteligência (geração, testes, previsão, otimização).

