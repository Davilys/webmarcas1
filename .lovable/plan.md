
# Busca Real no INPI: Integração com Firecrawl + GPT-5.2

## O que o PDF pede vs. o que é tecnicamente viável

O PDF descreve usar Playwright/Puppeteer para automatizar o navegador no portal `servicos.busca.inpi.gov.br`. Isso **não é compatível** com Edge Functions (Deno), que são ambientes serverless sem suporte a browser headless.

**Solução equivalente e superior:** usar o **Firecrawl** (já configurado no projeto como `FIRECRAWL_API_KEY`) para fazer scraping real do portal INPI via API e depois analisar os resultados com GPT-5.2 — exatamente o que o PDF quer, mas viável na arquitetura atual.

## Arquitetura da Solução

```text
Cliente (navegador)
        │
        ▼
  [inpi-viability-check]  ← Edge Function (Deno)
        │
        ├── 1. Verifica marcas famosas (lista local)
        │
        ├── 2. Firecrawl → scraping real do INPI
        │        URL: servicos.busca.inpi.gov.br/marcas
        │        Parâmetro: ?search={{nome_marca}}
        │        Extrai: tabela de resultados (processo, marca, situação, classe, titular)
        │
        ├── 3. GPT-5.2 (via Lovable AI Gateway) → análise inteligente
        │        Prompt especialista em PI/INPI
        │        Gera: viabilidade_geral, laudo estruturado, riscos
        │
        ├── 4. IA de Classes NCL (mantida como está)
        │
        └── 5. Retorna ViabilityResult completo
```

## O que NÃO muda

- Todo o frontend permanece igual: `ViabilityStep.tsx`, `ViabilitySearchSection.tsx`, `src/lib/api/viability.ts`
- O layout do laudo no PDF permanece igual (gerado pelo frontend)
- Os campos retornados (`level`, `title`, `description`, `laudo`, `classes`, `classDescriptions`, `searchDate`) permanecem idênticos
- A interface da área do cliente e do site não muda em nada

## O que muda

Apenas `supabase/functions/inpi-viability-check/index.ts` — substituindo a busca no WIPO pela busca real no INPI via Firecrawl + análise por GPT-5.2.

## Implementação Detalhada

### Etapa 1: Nova função `searchINPIviaFirecrawl()`

Substitui a atual `searchWIPO()`. Usa o Firecrawl para fazer scraping da URL:
```
https://servicos.busca.inpi.gov.br/marcas?search=NOME_DA_MARCA&tipo=M
```

O Firecrawl retorna o HTML/Markdown da página. Extraímos a tabela de resultados com os campos:
- Número do processo
- Nome da Marca
- Situação (Registro concedido, Pedido em exame, Arquivado, etc.)
- Classe NCL
- Titular
- Data do depósito

### Etapa 2: Nova função `analyzeWithGPT52()`

Substitui a análise por padrões simples. Envia os dados brutos extraídos pelo Firecrawl para o GPT-5.2 via Lovable AI Gateway com o prompt do PDF:

```
"Você é um especialista em propriedade intelectual do INPI Brasil.
Analise os seguintes resultados da busca no INPI para a marca '{{nome_marca}}'..."
```

O GPT-5.2 retorna um JSON com:
- `viabilidade_geral`: "Viabilidade Técnica Favorável" | "RISCO ALTO" | "RISCO MODERADO"
- `laudo_viabilidade`: texto completo do laudo
- `processos_encontrados`: lista estruturada com todos os detalhes
- `resultado_encontrado`: true/false

### Etapa 3: Lógica de fallback segura

Se o Firecrawl falhar (INPI fora do ar, bloqueio, etc.):
1. Tenta a busca WIPO como fallback (código atual mantido como backup)
2. Se WIPO também falhar, usa análise de padrões (já existente)
3. **Nunca retorna erro para o usuário** — sempre entrega um resultado

### Etapa 4: Teste antes de publicar

Após a implementação, testar chamando a edge function diretamente com marcas conhecidas (ex: "WebMarcas", "Nike", "TechFlow") e verificar:
- Se o Firecrawl consegue scraping do portal INPI
- Se o GPT-5.2 analisa corretamente os resultados
- Se o laudo gerado está coerente

**Se o Firecrawl não conseguir acessar o INPI** (bloqueio anti-bot), o fallback garante que o sistema continua funcionando sem degradação para o usuário.

## Arquivo Modificado

| Arquivo | Mudança |
|---|---|
| `supabase/functions/inpi-viability-check/index.ts` | Substitui `searchWIPO()` por `searchINPIviaFirecrawl()` + nova função `analyzeWithGPT52()`. Mantém fallback para WIPO e análise de padrões. |

## Segurança e Isolamento

- Nenhuma outra função ou página é modificada
- O contrato de retorno da API permanece idêntico
- Fallbacks garantem zero regressão
- A publicação só ocorre após validação dos logs da edge function

## Limitação Honesta

O portal INPI pode ter proteções anti-bot. O Firecrawl é especializado em contornar isso, mas se o INPI bloquear completamente, o sistema mantém o comportamento atual via WIPO. O usuário final nunca verá degradação — apenas a qualidade dos dados melhora quando o Firecrawl funciona.
