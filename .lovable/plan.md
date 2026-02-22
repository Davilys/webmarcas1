

# Buscas REAIS via DuckDuckGo (sem chave API)

## Problema

As 3 funcoes de busca (INPI, CNPJ, Internet) perguntam ao GPT-5.2 "voce conhece essa marca?" -- a IA nao tem acesso em tempo real, entao sempre responde "nao encontrei". Tudo aparece como "viavel".

## Solucao

Usar DuckDuckGo HTML Search -- gratuito, sem cadastro, sem chave API. Fazemos fetch da pagina de resultados e parseamos o HTML para extrair titulos, URLs e descricoes reais.

## Como funciona

```text
fetch("https://html.duckduckgo.com/html/?q=webmarcas+INPI+registro+marca")
  -> HTML com resultados reais
  -> Parsear com regex: titulo, URL, snippet
  -> Enviar dados reais ao GPT-5.2 para estruturar
```

## Mudancas no arquivo `supabase/functions/inpi-viability-check/index.ts`

### Nova funcao utilitaria: `searchDuckDuckGo(query)`
- Faz fetch em `https://html.duckduckgo.com/html/?q=...`
- Parseia o HTML com regex para extrair resultados (classe `result`, tags `a.result__a`, `a.result__snippet`)
- Retorna array de `{title, url, description}`
- Timeout de 8 segundos, retorna array vazio se falhar

### searchINPI (linhas 131-198) -- REESCRITA COMPLETA
Substitui chamada IA pura por:
1. DuckDuckGo: `"webmarcas" site:busca.inpi.gov.br`
2. DuckDuckGo: `"webmarcas" INPI registro marca classe 45`
3. Envia resultados reais ao GPT-5.2 para estruturar em JSON (processo, marca, situacao, classe, titular)

### searchCNPJ (linhas 201-253) -- REESCRITA COMPLETA
Substitui chamada IA pura por:
1. DuckDuckGo: `"webmarcas" CNPJ empresa razao social`
2. DuckDuckGo: `"webmarcas" cnpj.info OR cnpja.com OR casadosdados.com`
3. Envia resultados reais ao GPT-5.2 para extrair dados empresariais

### searchInternet (linhas 257-348) -- REESCRITA COMPLETA
Substitui chamada IA pura por:
1. DuckDuckGo: `"webmarcas" site:instagram.com`
2. DuckDuckGo: `"webmarcas" site:facebook.com`
3. DuckDuckGo: `"webmarcas" site:linkedin.com`
4. DuckDuckGo: `"webmarcas"` (busca geral)
5. Parseia diretamente os resultados para verificar presenca real (sem IA nesta etapa)

### Demais funcoes -- SEM ALTERACAO
- `suggestClassesWithAI` (mapeamento NCL): mantida
- `generateFinalAnalysis` (laudo final): mantida (agora recebe dados reais)
- `buildFallbackAnalysis`: mantida
- Handler principal: mantido

## Total de buscas DuckDuckGo por consulta: ~8
- 2 para INPI
- 2 para CNPJ
- 4 para Internet (3 redes sociais + geral)

Todas executadas em paralelo dentro de cada etapa.

## Impacto
- Apenas a edge function `inpi-viability-check` sera alterada
- Nenhuma tabela, frontend ou secret necessario
- Zero custo, zero cadastro
- Resultados passam a ser REAIS (dados da internet) em vez de simulacao

