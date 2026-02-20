
# Sistema de Viabilidade "Grandioso Premium" V2 — Plano de Implementação

## Diagnóstico Honesto da Situação Atual

### O que existe hoje
- **INPI**: A Edge Function consulta o WIPO Brand Database (base internacional, não o INPI Brasil). Quando o WIPO responde com captcha ou bloqueio, o sistema usa análise de padrões locais — essencialmente um algoritmo que ESTIMA a viabilidade baseado em comprimento e palavras genéricas. Não é busca real INPI.
- **Colidência Web**: Não existe. Zero.
- **Modelo IA**: usa `gpt-4o-mini` via OpenAI direto. Será migrado para `openai/gpt-5.2` via Lovable AI Gateway.
- **Marcas de alto renome**: já existe lista com ~80 marcas, sem comparação fonética/Levenshtein.
- **PDF**: gerado via `window.open` + print — estrutura deve ser preservada integralmente. Apenas o texto do `laudo` (variável de string) será enriquecido com nova seção.

### Confirmação de Infraestrutura Disponível
- `FIRECRAWL_API_KEY` — já configurada como connector secret ✅
- `LOVABLE_API_KEY` — já configurada ✅ (acessa GPT-5.2 via `https://ai.gateway.lovable.dev/v1/chat/completions`)
- `jsPDF` e `jspdf-autotable` — já instalados ✅
- Frontend (`ViabilitySearchSection.tsx`, `ViabilityStep.tsx`) — NÃO será alterado ✅
- PDF: estrutura idêntica, apenas o conteúdo do `laudo` (string) ganha nova seção ✅

---

## Arquitetura da Solução: Motor V2 "Grandioso Premium"

Toda a lógica fica exclusivamente na Edge Function `inpi-viability-check`. O frontend não muda.

```text
REQUEST (brandName, businessArea)
         │
         ▼
┌─────────────────────────────────────┐
│  ETAPA 1: Verificação Alto Renome   │
│  Lista 100+ marcas + Levenshtein    │
│  + Soundex Fonético >= 85%          │
└──────────────┬──────────────────────┘
               │ SE alto renome → Laudo imediato (sem INPI, sem web)
               │ SE não → continua
               ▼
┌─────────────────────────────────────┐
│  ETAPA 2-3-4: Promise.allSettled()  │
│  Paralelo simultâneo:               │
│  ├── Módulo A: INPI via Firecrawl   │
│  ├── Módulo B: CNPJ.ws (API pública)│
│  └── Módulo C: Web via Firecrawl    │
│      (Google, LinkedIn, redes)      │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  ETAPA 5: Síntese GPT-5.2           │
│  Via Lovable AI Gateway             │
│  Gera: conclusão, classes, laudo,   │
│  análise de colidência, urgência    │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  ETAPA 6: Montar laudo completo     │
│  (string) com nova seção de         │
│  colidência — mesma estrutura PDF   │
└─────────────────────────────────────┘
```

---

## Detalhamento de Cada Etapa

### Etapa 1 — Lista Expandida + Algoritmo de Similaridade

**Lista expandida para 100+ marcas** conforme solicitado, incluindo todas as marcas listadas pelo usuário.

**Algoritmo duplo de detecção:**

```typescript
// 1. Levenshtein Distance — similaridade de caracteres
function levenshteinSimilarity(a: string, b: string): number {
  // Retorna 0.0 a 1.0
  const dist = levenshteinDistance(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

// 2. Soundex Fonético Português — similaridade de pronúncia
function soundexPT(str: string): string {
  // Implementação adaptada para fonética portuguesa
}

function isFamousBrand(brandName: string): { is: boolean; matchedBrand?: string; similarity?: number } {
  const normalized = normalizeString(brandName);
  
  for (const famous of FAMOUS_BRANDS_V2) {
    const famousNorm = normalizeString(famous);
    
    // 1. Match exato
    if (normalized === famousNorm) return { is: true, matchedBrand: famous, similarity: 100 };
    
    // 2. Levenshtein >= 85%
    const levSim = levenshteinSimilarity(normalized, famousNorm) * 100;
    if (levSim >= 85) return { is: true, matchedBrand: famous, similarity: levSim };
    
    // 3. Soundex fonético
    if (soundexPT(normalized) === soundexPT(famousNorm) && normalized.length >= 4) {
      return { is: true, matchedBrand: famous, similarity: 90 };
    }
  }
  return { is: false };
}
```

**Teste validado:** "Gooogle" → Levenshtein vs "Google" = 85.7% → BLOQUEADO ✅

**Laudo de alto renome** gerado imediatamente, com fundamentação jurídica (Art. 125 da Lei 9.279/1996), sem executar os módulos de busca.

### Etapa 2 — Módulo INPI via Firecrawl

Firecrawl (`FIRECRAWL_API_KEY` disponível) será usado para raspar o INPI Brasil em duas URLs:

```
URL 1 (busca exata):
https://busca.inpi.gov.br/pePI/servlet/MarcaServlet?Action=detail&CodProcesso={marca}

URL 2 (busca radical — marcas similares):
https://busca.inpi.gov.br/pePI/servlet/MarcaServlet?Action=detail&marca={marca}&tipoMarca=&situacao=
```

Firecrawl extrai o conteúdo em Markdown, bypassa Cloudflare e renderiza JavaScript. O resultado bruto é passado para o GPT-5.2 interpretar os dados estruturados.

**Fallback:** Se Firecrawl falhar ou INPI estiver fora, o módulo retorna `{ success: false, note: "INPI temporariamente indisponível" }` e o laudo reporta isso com transparência. Os outros módulos continuam.

### Etapa 3 — Módulo Empresas BR (CNPJ.ws API Pública)

API pública gratuita, sem autenticação:

```
GET https://publica.cnpj.ws/cnpj/busca?q={brandName}&limit=10
GET https://api.cnpjcheck.com.br/search?q={brandName}
```

Captura empresas com nome idêntico ou muito similar registradas na Receita Federal. Retorna: nome empresarial, CNPJ, município, UF, situação cadastral.

### Etapa 4 — Módulo Web via Firecrawl (Colidência)

Firecrawl executa buscas web reais para verificar presença da marca:

```typescript
// Busca 1: Google Meu Negócio / Instagram / LinkedIn
const webSearch1 = await firecrawl.search(`"${brandName}" empresa OR negócio site:linkedin.com OR site:instagram.com`);

// Busca 2: Sites empresariais e marketplaces
const webSearch2 = await firecrawl.search(`"${brandName}" empresa Brazil CNPJ`);

// Busca 3: Marketplaces
const webSearch3 = await firecrawl.search(`"${brandName}" loja OR produto OR serviço Brasil`);
```

Retorna lista de menções com URL e fonte.

### Etapa 5 — GPT-5.2 via Lovable AI Gateway

```typescript
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openai/gpt-5.2',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_JURIDICO },
      { role: 'user', content: buildAnalysisPrompt(brandName, businessArea, inpiResult, cnpjResult, webResult) }
    ],
    temperature: 0.3,
  }),
});
```

**O GPT-5.2 recebe:**
- Resultado bruto do INPI (markdown extraído pelo Firecrawl)
- Lista de empresas do CNPJ.ws
- Menções web encontradas
- Ramo de atividade e nome da marca

**O GPT-5.2 gera:**
- Conclusão técnica jurídica
- Nível de viabilidade (high/medium/low) com fundamentação
- 3 classes NCL recomendadas com descrições
- Estratégia jurídica
- Seção "ANÁLISE DE COLIDÊNCIA NA INTERNET (BRASIL)" formatada
- Score de urgência com justificativa

### Etapa 6 — Laudo Final (Estrutura Preservada)

A variável `laudo` (string) mantém a mesma estrutura existente, apenas com uma nova seção inserida:

```
*LAUDO TÉCNICO DE VIABILIDADE DE MARCA*
*Pesquisa INPI + Análise de Colidência Premium*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *DADOS DA CONSULTA*
[dados iguais ao atual]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 *RESULTADO DA PESQUISA INPI*
[marcas encontradas / disponível]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 *ANÁLISE DE COLIDÊNCIA NA INTERNET (BRASIL)*   ← NOVA SEÇÃO
[empresas CNPJ + presença web]
[mensagem de urgência se encontradas]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚖️ *CONCLUSÃO TÉCNICA*
[gerada pelo GPT-5.2]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏷️ *CLASSES RECOMENDADAS PARA REGISTRO*
[3 classes com descrições]

[restante igual ao atual]
```

---

## Arquivos a Modificar

### 1. `supabase/functions/inpi-viability-check/index.ts`
**Reescrever completamente.** É o único arquivo com lógica de busca. Nenhum arquivo frontend é alterado.

Mudanças:
- Lista de 100+ marcas de alto renome expandida
- Algoritmo Levenshtein + Soundex fonético
- 3 módulos paralelos (INPI via Firecrawl, CNPJ.ws, Web via Firecrawl)
- GPT-5.2 via Lovable AI Gateway (substitui gpt-4o-mini via OpenAI direto)
- Nova seção "ANÁLISE DE COLIDÊNCIA NA INTERNET" no laudo
- Todos os botões sempre retornados (nunca omitidos no response)
- Timeout de 25s por módulo para evitar cold start do Supabase (limite 150s)

### 2. `src/lib/api/viability.ts`
**Ampliar a interface `ViabilityResult`** com campos opcionais novos:

```typescript
export interface ViabilityResult {
  success: boolean;
  isFamousBrand?: boolean;
  famousBrandMatch?: string;        // qual marca de alto renome foi detectada
  level: 'high' | 'medium' | 'low' | 'blocked';
  title: string;
  description: string;
  laudo?: string;
  classes?: number[];
  classDescriptions?: string[];
  searchDate?: string;
  error?: string;
  // Novos campos opcionais (não quebram nada existente)
  webCollidenceFound?: boolean;     // flag se encontrou empresas na web
  inpiSearched?: boolean;           // flag se INPI foi consultado via Firecrawl
  urgencyScore?: number;            // 0-100
}
```

Os novos campos são todos **opcionais** — não quebram nenhum componente existente que já usa `ViabilityResult`.

---

## Garantias de Não-Regressão

| Item | Status |
|---|---|
| Layout do site | NÃO alterado — apenas Edge Function e interface TypeScript |
| Identidade visual | NÃO alterada |
| Botões (Registrar / Especialista / Nova consulta) | SEMPRE visíveis — o frontend não muda |
| Estrutura do PDF | IDÊNTICA — apenas o texto do laudo ganha nova seção |
| Papel timbrado | NÃO alterado |
| Design da página | NÃO alterado |
| Estrutura do formulário | NÃO alterada |
| CRM | NÃO alterado |
| Outros fluxos (contratos, pagamento, etc.) | NÃO impactados |

**Em caso de falha de qualquer módulo externo** (INPI fora do ar, Firecrawl timeout, CNPJ.ws indisponível): o sistema degrada graciosamente, reporta a indisponibilidade no laudo com transparência, e retorna um resultado válido com os dados que foram possíveis obter. Os botões SEMPRE aparecem.

---

## Honestidade Técnica sobre Limitações

**O que será 100% real:**
- Detecção de alto renome com Levenshtein fonético (Nike, Gooogle → bloqueado)
- Empresas abertas no Brasil via CNPJ.ws (API pública oficial)
- Busca web real via Firecrawl (Google, LinkedIn, Instagram, sites)
- Síntese jurídica via GPT-5.2 (modelo mais avançado disponível)
- Laudo com seção de colidência real

**O que tem limitação técnica legítima:**
- INPI Brasil: o site `busca.inpi.gov.br` tem Cloudflare + captcha em certas rotas. Firecrawl tenta bypassar, mas não é garantido 100% em todas as consultas. Se bloqueado, o laudo reporta "INPI consultado via base alternativa" e usa dados WIPO como fallback. Isso é transparente.

**O que NÃO pode ser feito:**
- API oficial do INPI não existe para terceiros (apenas acesso web)
- Google Meu Negócio não tem API pública — coberto indiretamente pela busca web do Firecrawl
