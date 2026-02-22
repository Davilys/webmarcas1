

# Implementar Buscas REAIS com Brave Search API

## Problema Atual

O motor de viabilidade pede ao GPT-5.2 "voce conhece essa marca?" -- a IA nao tem acesso em tempo real ao INPI, entao sempre responde "nao encontrei nada". Resultado: tudo aparece como "viavel" mesmo para marcas ja registradas.

## Solucao

Usar Brave Search API para fazer buscas reais na internet, incluindo no site do INPI, bases de CNPJ e redes sociais.

## Etapas

### 1. Configurar BRAVE_API_KEY como secret

Armazenar a chave API do Brave Search como secret do projeto para uso na edge function.

### 2. Reescrever a edge function `inpi-viability-check/index.ts`

Substituir as 3 funcoes de busca que hoje usam IA por buscas reais via Brave Search:

**searchINPI (Etapa 3) -- BUSCA REAL:**
```
Brave Search: "webmarcas" site:busca.inpi.gov.br
Brave Search: "webmarcas" INPI registro marca
```
- Parsear os resultados para encontrar processos, situacoes, classes
- Enviar os resultados reais ao GPT-5.2 para estruturar em JSON

**searchCNPJ (Etapa 4) -- BUSCA REAL:**
```
Brave Search: "webmarcas" CNPJ empresa
Brave Search: "webmarcas" cnpj.info OR cnpja.com OR casadosdados.com
```
- Extrair nomes de empresas, CNPJs e situacoes dos resultados

**searchInternet (Etapa 5) -- BUSCA REAL:**
```
Brave Search: "webmarcas" site:instagram.com
Brave Search: "webmarcas" site:facebook.com
Brave Search: "webmarcas" site:linkedin.com
Brave Search: "webmarcas" (busca geral)
```
- Verificar presenca real em cada rede social e web

### 3. Fluxo completo

1. Verificacao de marca famosa (manter existente)
2. Mapeamento NCL via IA (manter existente, ja funciona)
3. **3 buscas reais via Brave Search em PARALELO**
4. Enviar resultados reais ao GPT-5.2 para analise e geracao do laudo
5. Retornar dados estruturados + laudo

### 4. Como funciona o Brave Search API

```typescript
const response = await fetch(
  `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`,
  {
    headers: { 
      'X-Subscription-Token': BRAVE_API_KEY,
      'Accept': 'application/json'
    }
  }
);
const data = await response.json();
// data.web.results[] -> titulo, url, description de cada resultado
```

Cada resultado tem: `title`, `url`, `description` -- dados reais da internet, nao simulacao.

## Detalhes Tecnicos

### Arquivo: `supabase/functions/inpi-viability-check/index.ts`

- **searchINPI**: substituir chamada IA por 2 buscas Brave (`site:busca.inpi.gov.br` + `INPI registro marca`) + IA para estruturar resultados
- **searchCNPJ**: substituir chamada IA por 2 buscas Brave (`CNPJ empresa` + sites de CNPJ) + IA para extrair dados
- **searchInternet**: substituir chamada IA por 4 buscas Brave (Instagram, Facebook, LinkedIn, geral)
- **generateFinalAnalysis**: manter igual (recebe dados reais agora)
- Total de chamadas Brave por consulta: ~8 (bem dentro do limite gratuito de 2000/mes)

### Secret necessario

- `BRAVE_API_KEY`: chave API do Brave Search (gratuita em brave.com/search/api)

### Impacto

- Apenas a edge function `inpi-viability-check` sera alterada
- Nenhuma tabela, API ou frontend modificado
- Compatibilidade total mantida
- Resultados passam a ser REAIS em vez de simulacao

