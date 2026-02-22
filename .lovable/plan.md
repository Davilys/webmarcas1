

# Implementar Motor de Viabilidade REAL conforme Comando PDF

## Resumo

Reescrever a edge function `inpi-viability-check` para realizar consultas reais em 3 fontes (INPI, CNPJ, Internet/Redes Sociais) usando Firecrawl + IA (Lovable AI Gateway), e atualizar o laudo exibido no site, landing page e area do cliente.

## O que muda

### 1. Edge Function `inpi-viability-check/index.ts` (reescrita completa)

**Fluxo novo em 6 etapas:**

1. **Verificacao de marca famosa** (manter lista existente)
2. **mapRamoToNice(ramoAtividade)** - Usar IA (GPT-5.2 via Lovable AI Gateway) para mapear ramo para classe principal + 2 complementares (manter fallback local existente)
3. **Consulta REAL no INPI** - Usar Firecrawl (FIRECRAWL_API_KEY ja configurado) para acessar `https://busca.inpi.gov.br/pePI/` e capturar resultados de busca exata por marca + classe
4. **Busca de CNPJ** - Usar Firecrawl para buscar `"nomeMarca" CNPJ` e extrair empresas com nome similar
5. **Busca Internet/Redes Sociais** - Usar Firecrawl search para consultar presenca em Instagram, Facebook, LinkedIn e web geral
6. **Decisao de viabilidade via IA** - Enviar todos os dados coletados para GPT-5.2 que aplica as regras do PDF:
   - `INDISPONIVEL` = registro em vigor ou pedido ativo na mesma classe
   - `VIAVEL_INICIAL` = zero resultados INPI na busca exata + classe principal
   - `POSSIVEL_COM_ALERTA` = apenas arquivado/extinto encontrado

**Saida JSON estruturada (auditavel):**
```json
{
  "nomeMarca": "...",
  "ramoAtividade": "...",
  "classePrincipal": 11,
  "classesComplementares": [37, 42],
  "inpi": { "totalResultados": 0, "resultados": [], "consultadoEm": "..." },
  "cnpj": { "total": 0, "matches": [] },
  "internet": { "socialMatches": [], "webMatches": [] },
  "viabilidade": "VIAVEL_INICIAL",
  "justificativa": "...",
  "avisos": ["Pesquisa indicativa..."]
}
```

**Mapeamento para resposta existente:** Os campos `level`, `title`, `description`, `laudo`, `classes`, `classDescriptions` continuam sendo retornados para manter compatibilidade com o frontend. O campo `analysisResult` passa a incluir dados reais de INPI, CNPJ e internet.

### 2. Interface `ViabilityResult` (`src/lib/api/viability.ts`)

Adicionar campos opcionais para os novos dados:
- `inpiData?: { totalResultados, resultados[], consultadoEm }`
- `cnpjData?: { total, matches[] }`
- `internetData?: { socialMatches[], webMatches[] }`
- `viabilidade?: string` (VIAVEL_INICIAL, INDISPONIVEL, POSSIVEL_COM_ALERTA)

### 3. Laudo no Site (`ViabilitySearchSection.tsx`)

Atualizar a exibicao do resultado para mostrar as novas secoes do laudo:
- Secao "Resultado INPI" com tabela de marcas encontradas (se houver)
- Secao "Colidencia no Mercado" com CNPJs e presenca web
- Secao "Classes Recomendadas" (ja existe, melhorar)
- Manter layout e PDF existentes, apenas enriquecer conteudo

### 4. Laudo na Area do Cliente (`ViabilityStep.tsx`)

Mesmas melhorias do item 3, adaptadas ao componente do checkout.

### 5. Laudo PDF (funcao `printLaudo` em ambos componentes)

Atualizar o HTML do PDF para incluir:
- Secao 1: Dados da Consulta
- Secao 2: Resultado (Viavel/Indisponivel/Possivel com Alerta)
- Secao 3: Resultado Real INPI (tabela)
- Secao 4: Colidencia no Mercado (CNPJ + redes + web)
- Secao 5: Classes Recomendadas
- Secao 6: Orientacao Juridica
- Secao 7: Aviso "dono da marca e quem registra primeiro"
- Manter papel timbrado navy/gold, QR codes e hashes existentes

## Detalhes Tecnicos

### Uso do Firecrawl

O Firecrawl ja esta conectado (FIRECRAWL_API_KEY disponivel). Sera usado para:

```typescript
// Scrape INPI
const inpiResult = await fetch("https://api.firecrawl.dev/v1/scrape", {
  method: "POST",
  headers: { "Authorization": `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    url: `https://busca.inpi.gov.br/pePI/servlet/MarcasServletController?...`,
    formats: ["markdown"]
  })
});

// Search web/social
const webResult = await fetch("https://api.firecrawl.dev/v1/search", {
  method: "POST",
  headers: { ... },
  body: JSON.stringify({ query: `"nomeMarca" site:instagram.com`, limit: 5 })
});
```

### Uso da IA (Lovable AI Gateway)

Modelo: `openai/gpt-5.2` via `https://ai.gateway.lovable.dev/v1/chat/completions`
- Mapeamento ramo para classes NCL (substituir chamada OpenAI direta)
- Analise final de viabilidade com todos os dados coletados
- Geracao do texto do laudo tecnico

### Regras de seguranca (do memory)

- NAO alterar tabelas existentes
- NAO alterar APIs/integracoes externas ja funcionando (Asaas, SMTP, Assinatura)
- Mudancas estritamente aditivas e isoladas
- Manter compatibilidade com campos de retorno existentes

## Arquivos a modificar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/inpi-viability-check/index.ts` | Reescrever logica principal (manter interface de retorno) |
| `src/lib/api/viability.ts` | Adicionar campos opcionais ao ViabilityResult |
| `src/components/sections/ViabilitySearchSection.tsx` | Enriquecer exibicao do resultado e PDF |
| `src/components/cliente/checkout/ViabilityStep.tsx` | Enriquecer exibicao do resultado e PDF |

## Riscos e mitigacoes

- **INPI pode bloquear scraping**: Firecrawl lida com isso; se falhar, manter fallback WIPO + analise de padroes existente
- **Tempo de execucao**: As 3 buscas (INPI, CNPJ, Internet) serao executadas em paralelo com `Promise.allSettled` para nao estourar timeout
- **Rate limit Firecrawl**: Limitar a 3-4 chamadas por consulta
- **Compatibilidade**: Todos os campos existentes (`level`, `title`, `description`, `laudo`, `classes`) continuam sendo retornados

