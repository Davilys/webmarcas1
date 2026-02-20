
# Enriquecer Seção "Análise de Colidência" com Varredura Real da Internet

## Escopo Estrito (conforme regras do usuário)

Alteração SOMENTE dentro da seção de colidência. Nada muda em:
- Score de viabilidade
- Conclusão técnica baseada no INPI
- Ordem das seções
- Formatação das demais seções
- Estrutura do laudo

---

## O que existe hoje vs. o que precisa mudar

### Backend (`supabase/functions/inpi-viability-check/index.ts`)

**Módulo 3 atual** (`searchWebPresence`) faz:
- Busca geral Google via Firecrawl
- Busca LinkedIn via Firecrawl
- Retorna: `googleMeuNegocio`, `linkedin`, `webMentions`, `sources`, `summary`

**O que falta buscar:**
- Instagram (busca por nome exato)
- CNPJá (cnpja.com)
- CNPJ.ws com busca textual
- CNPJCheck
- Serasa Experian (consulta pública)

**Solução:** Enriquecer o `searchWebPresence` e `searchCompaniesBR` para retornar dados estruturados de redes sociais e fontes de CNPJ, e adicionar um novo campo `instagramFound` + `socialProfiles` + `cnpjSources` ao resultado.

A interface `WebAnalysis` em `src/lib/api/viability.ts` será estendida com:
```ts
instagramFound?: boolean;
socialProfiles?: Array<{ platform: string; profileName: string; url: string; followers?: string }>;
cnpjSources?: Array<{ source: string; name: string; cnpj?: string; city?: string; state?: string; status?: string }>;
marketNote?: string; // nota jurídica quando há empresa mas não há INPI
```

### PDF (`src/hooks/useViabilityPdf.ts`)

**Seção 5 atual** ("Colidência Empresarial — CNPJ") mostra apenas tabela simples de empresas do CNPJ.ws.

**Mudança dentro da seção 5:** Adicionar ao final da seção 5 um bloco visual com subtítulo "Pesquisa de Uso no Mercado (Internet e CNPJ)", mostrando:

1. **Empresas encontradas** (de todos os buscadores de CNPJ consultados): tabela com Nome, CNPJ, Cidade/UF, Fonte, Situação
2. **Redes Sociais encontradas**: tabela ou cards com Plataforma, Nome do Perfil, Link, Seguidores
3. Se nada encontrado: banner verde "Não foram identificadas empresas ativas ou perfis relevantes com nome idêntico na internet ou bases públicas de CNPJ."
4. **Nota Jurídica obrigatória** quando há empresa mas sem INPI: "A existência de empresas com nome idêntico no mercado não implica direito marcário, caso não haja registro válido no INPI."

---

## Arquivos a Modificar

### 1. `supabase/functions/inpi-viability-check/index.ts`

**Enriquecer `searchWebPresence`** para incluir:

```ts
// Busca Instagram por nome exato
const instagramSearch = fetch('https://api.firecrawl.dev/v1/search', {
  body: JSON.stringify({
    query: `"${brandName}" site:instagram.com`,
    limit: 3,
  })
});

// Busca CNPJá + Serasa via Firecrawl scrape
const cnpjaSearch = fetch('https://api.firecrawl.dev/v1/search', {
  body: JSON.stringify({
    query: `"${brandName}" site:cnpja.com OR site:cnpj.ws OR site:serasa.com.br`,
    limit: 5,
  })
});
```

Resultado retornado ampliado:
```ts
return {
  googleMeuNegocio: boolean,
  linkedin: boolean,
  instagramFound: boolean,
  webMentions: number,
  sources: [...],
  summary: string,
  // NOVO:
  socialProfiles: Array<{ platform, profileName, url, followers? }>,
  cnpjSources: Array<{ source, name, cnpj?, city?, state?, status? }>,
};
```

### 2. `src/lib/api/viability.ts`

Estender a interface `WebAnalysis` com os novos campos opcionais (sem quebrar nada existente):
```ts
export interface WebAnalysis {
  googleMeuNegocio: boolean;
  linkedin: boolean;
  instagramFound?: boolean;        // NOVO
  webMentions: number;
  sources: WebSource[];
  summary: string;
  socialProfiles?: Array<{         // NOVO
    platform: string;
    profileName: string;
    url: string;
    followers?: string;
  }>;
  cnpjSources?: Array<{            // NOVO
    source: string;
    name: string;
    cnpj?: string;
    city?: string;
    state?: string;
    status?: string;
  }>;
}
```

### 3. `src/hooks/useViabilityPdf.ts`

Dentro da **seção 5** existente ("Colidência Empresarial — CNPJ"), após o bloco atual de tabela de empresas, adicionar o novo bloco:

**Sub-bloco: "Pesquisa de Uso no Mercado (Internet e CNPJ)"**

```
Cabeçalho cinza claro com texto: "PESQUISA DE USO NO MERCADO (INTERNET E CNPJ)"

SE não encontrou nada:
  Banner verde: "Não foram identificadas empresas ativas ou perfis relevantes
                 com nome idêntico na internet ou bases públicas de CNPJ."

SE encontrou empresas (cnpjSources):
  Subtítulo: "Empresas encontradas:"
  Tabela: Nome Empresarial | CNPJ | Cidade/UF | Fonte | Situação

SE encontrou redes sociais (socialProfiles):
  Subtítulo: "Redes Sociais Encontradas:"
  Tabela: Plataforma | Nome do Perfil | Link | Seguidores

SEMPRE (quando há empresa mas sem conflito INPI):
  Nota jurídica:
  "A existência de empresas com nome idêntico no mercado não implica direito
   marcário, caso não haja registro válido no INPI."
```

---

## Ordem de Implementação

1. Estender interface `WebAnalysis` em `src/lib/api/viability.ts` (campos opcionais — sem quebrar nada)
2. Enriquecer `searchWebPresence` na edge function com buscas de Instagram + CNPJá/Serasa via Firecrawl
3. Atualizar resposta da edge function para incluir os novos campos no `webAnalysis`
4. Adicionar o sub-bloco visual no PDF (seção 5, após tabela de CNPJ atual)

## O que NÃO muda
- Score de urgência → inalterado
- Lógica de `computePdfLevel` → inalterada
- Seções 4, 7, 8, 9, 10 → inalteradas
- Ordem das seções → inalterada
- Conclusão técnica baseada no INPI → inalterada
- Toda a estrutura e formatação existente → inalterada
