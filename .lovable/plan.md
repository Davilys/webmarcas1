

# Corrigir Motor de Viabilidade - 2 Bugs + Melhoria de Seguranca

## Problema Diagnosticado

Os logs revelam dois erros que fazem TODAS as consultas cairem no fallback (simulacao):

### Bug 1: Parametro `max_tokens` invalido para GPT-5.2
O modelo `openai/gpt-5.2` exige `max_completion_tokens`, nao `max_tokens`. Isso causa erro 400 em:
- Linha 100: mapeamento de classes NCL
- Linha 477: geracao do laudo final

### Bug 2: Firecrawl sem creditos (HTTP 402)
Todas as buscas (INPI, CNPJ, Internet) retornam 0 resultados. O sistema conclui "Alta Viabilidade" para qualquer marca, inclusive marcas ja registradas.

### Acao do usuario necessaria
Recarregar creditos do Firecrawl em https://firecrawl.dev/pricing. Sem creditos, as buscas reais continuarao vazias.

## Correcoes no Codigo

### Arquivo: `supabase/functions/inpi-viability-check/index.ts`

1. **Linha 100**: `max_tokens: 600` -> `max_completion_tokens: 600`
2. **Linha 477**: `max_tokens: 3000` -> `max_completion_tokens: 3000`
3. **Funcao `buildFallbackAnalysis`** (linha 513+): Quando `inpiData.error` existir (busca falhou por erro de API, nao por resultado zero real):
   - Marcar `level` como `medium` (nao `high`)
   - Marcar `viabilidade` como `POSSIVEL_COM_ALERTA`
   - Adicionar aviso no laudo: "A consulta ao banco do INPI nao pode ser completada. Os resultados sao parciais."
   - Alterar `description` para indicar pesquisa incompleta

### Impacto
- Apenas a edge function `inpi-viability-check` sera alterada
- Nenhuma tabela, API ou integracao externa modificada
- Compatibilidade total com frontend mantida

