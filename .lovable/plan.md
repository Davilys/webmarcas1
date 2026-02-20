
# Sistema de Viabilidade de Marca — Análise Completa e Plano de Modernização Premium

## Diagnóstico Honesto: O que está simulado vs. o que é real

### O que REALMENTE acontece hoje (seja honesto)

**INPI:** A busca atual vai para o WIPO Global Brand Database (base internacional, não o INPI Brasil diretamente). A URL `branddb.wipo.int` frequentemente retorna captcha/verificação de segurança, travando a busca. Quando isso ocorre, o sistema cai no "modo fallback" de análise de padrões — ou seja, o sistema INVENTA o resultado baseado apenas no nome da marca. A análise de padrões que chama de "Score de Distintividade" é um algoritmo local simples, não uma consulta real.

**Busca web (Google, LinkedIn, empresas):** Não existe atualmente. Zero.

**O laudo PDF:** É um documento de texto simples em formato `<pre>`, sem análise real de colidência web.

---

## O que é tecnicamente possível fazer de forma 100% real

### Busca INPI Real
O INPI Brasil possui uma API não-oficial em `https://busca.inpi.gov.br/pePI/servlet/` que pode ser consultada via scraping. Entretanto, o INPI tem proteções anti-bot (Cloudflare + captchas em certas rotas). A alternativa confiável e legal é usar o **Firecrawl** (disponível como connector neste projeto) para raspar os resultados da pesquisa do INPI sem ser bloqueado.

**URL real do INPI para busca de marcas:**
```
https://busca.inpi.gov.br/pePI/servlet/MarcaServlet?Action=detail&CodProcesso=...
```

### Análise de Colidência Web via IA + Busca Real
Usando **Perplexity** (connector disponível) ou buscas diretas via Firecrawl, a Edge Function pode:
1. Buscar `"nome da marca" site:google.com/maps` (Google Meu Negócio)
2. Buscar `"nome da marca" site:linkedin.com/company`
3. Buscar no **CNPJ.ws** (API pública gratuita): `https://publica.cnpj.ws/cnpj/busca?q=nome_empresa`
4. Buscar `"nome da marca"` no Google via Firecrawl/Perplexity
5. Buscar `"nome da marca" INPI` para ver registros existentes

### PDF Premium
Usar `jspdf` + `jspdf-autotable` (já instalados no projeto) para gerar um PDF estilizado com logo, tabelas, QR code de verificação.

---

## Arquitetura da Solução

### Edge Function: `inpi-viability-check` — Totalmente Reescrita

A Edge Function será expandida com 4 módulos paralelos:

```text
┌─────────────────────────────────────────────────────┐
│           inpi-viability-check (nova versão)         │
├──────────────┬──────────────┬──────────────┬─────────┤
│  Módulo 1:   │  Módulo 2:   │  Módulo 3:   │ Módulo 4│
│  WIPO/INPI   │  Empresas BR │  Web Check   │  IA GPT │
│  (Firecrawl) │  (CNPJ.ws)   │  (Perplexity)│  Laudo  │
└──────────────┴──────────────┴──────────────┴─────────┘
```

**Módulo 1 — INPI via Firecrawl:**
- Raspa `https://busca.inpi.gov.br/pePI/servlet/MarcaServlet?Action=detail&...`
- Extrai marcas registradas, situação, titular, número de processo
- Firecrawl bypassa captchas e renderiza JavaScript

**Módulo 2 — Empresas Abertas BR via API pública (CNPJ.ws):**
- `GET https://publica.cnpj.ws/cnpj/busca?q={brandName}`
- API gratuita, sem autenticação, retorna empresas cadastradas na Receita Federal
- Verifica se existe empresa com nome idêntico ou muito similar

**Módulo 3 — Web Check via Perplexity:**
- Pergunta ao Perplexity: "A marca '{brandName}' está registrada no Brasil? Existe empresa, produto ou serviço com esse nome?"
- Perplexity faz busca real na web em tempo real e retorna resultado fundamentado com fontes

**Módulo 4 — Laudo via GPT-4o:**
- Consolida os dados dos 3 módulos acima
- Gera o texto do laudo em linguagem técnico-jurídica usando GPT-4o
- Inclui análise de colidência com urgência de registro

### Interface: Tela de Loading Cinematográfica

Substituir o spinner simples por uma interface premium que mostra em tempo real o progresso de cada módulo:

```text
 ╔═══════════════════════════════════════╗
 ║  🔍 Consultando base do INPI...  ✅   ║
 ║  🏢 Verificando empresas BR...   ⏳   ║
 ║  🌐 Analisando presença web...   ⏳   ║
 ║  🤖 Gerando laudo técnico...     ⏳   ║
 ╚═══════════════════════════════════════╝
```

### PDF Premium Gerado no Navegador

Usar `jspdf` + `html2canvas` (ambos já instalados) para converter o laudo visual em PDF rico com:
- Logo WebMarcas em alta resolução
- Cores da marca (azul marinho + dourado)
- Tabela de marcas colidentes com status colorido
- Tabela de análise de colidência web (Google Meu Negócio, LinkedIn, CNPJ)
- QR Code de verificação de autenticidade (usando `qrcode.react` já instalado)
- Assinatura digital do laudo com hash único

---

## Plano de Implementação

### Fase 1 — Conectar Firecrawl e Perplexity (Pré-requisito)
Os connectors Firecrawl e Perplexity já estão disponíveis no workspace. Precisam ser vinculados ao projeto para que as Edge Functions acessem as chaves.

### Fase 2 — Reescrever `inpi-viability-check`
Substituir a Edge Function atual pela nova versão com os 4 módulos paralelos. Os módulos rodam em paralelo com `Promise.allSettled()` para máxima performance (~6-10 segundos total).

### Fase 3 — Novo tipo `ViabilityResult` enriquecido
```typescript
interface ViabilityResult {
  // Dados existentes...
  
  // Novos campos:
  webAnalysis?: {
    googleMeuNegocio: boolean;
    linkedin: boolean;
    cnpjResult?: { name: string; cnpj: string; status: string }[];
    webMentions: number;
    sources: string[];
    summary: string;
  };
  inpiResults?: {
    found: boolean;
    totalProcesses: number;
    conflicts: { processo: string; marca: string; situacao: string; titular: string; classe: string }[];
  };
  urgencyScore: number; // 0-100, quanto mais alto mais urgente registrar
  laudoHtml: string;   // HTML rico para renderização e PDF
}
```

### Fase 4 — Reescrever `ViabilityStep.tsx` com UX Premium
**Estado de busca:** Timeline animada com progresso real (SSE ou polling com status na Edge Function)

**Resultado:** Cards premium para cada módulo de análise:
- Card INPI: tabela de marcas encontradas com badges coloridos por situação
- Card Web: logos de Google, LinkedIn, CNPJ com ✅/❌/⚠️
- Card Urgência: gauge animado de 0-100
- Card Laudo: preview do laudo com opção de download PDF

**PDF Download:** Botão que gera o PDF client-side usando jsPDF com todo o conteúdo rico formatado, logo da WebMarcas, QR Code e hash de verificação.

### Fase 5 — Sincronizar `ViabilitySearchSection.tsx`
Mesmo componente de resultado premium é usado na landing page e no formulário do cliente, via componente shared `ViabilityResultDisplay`.

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---|---|
| `supabase/functions/inpi-viability-check/index.ts` | Reescrever completamente com 4 módulos |
| `src/lib/api/viability.ts` | Ampliar interface `ViabilityResult` |
| `src/components/cliente/checkout/ViabilityStep.tsx` | Redesign completo premium |
| `src/components/sections/ViabilitySearchSection.tsx` | Unificar com o mesmo componente rico |
| `src/components/shared/ViabilityResultDisplay.tsx` | Novo componente compartilhado (resultado premium) |
| `src/hooks/useViabilityPdf.ts` | Hook para gerar PDF premium client-side |
| `supabase/config.toml` | Sem alteração (já tem `verify_jwt = false`) |

---

## Honestidade sobre Limitações Técnicas

**O que POSSO garantir 100% funcional:**
- Análise de empresas brasileiras via API pública CNPJ.ws (gratuita, sem autenticação)
- Análise de colidência web via Perplexity (busca real na internet com fontes)
- Geração de PDF premium rico no navegador via jsPDF
- Interface cinematográfica de loading com progresso real
- Laudo técnico-jurídico gerado por GPT-4o com dados reais

**O que PODE ter limitação:**
- INPI Brasil direto: o site tem proteções. Usarei Firecrawl para bypassar, mas se o INPI adicionar captchas novos, o fallback será o WIPO (que já existe). Será transparente no laudo qual fonte foi usada.

**O que NÃO posso fazer:**
- Google Meu Negócio não tem API pública. Usarei busca web via Perplexity que cobre essa pesquisa indiretamente.
- Garantir que o INPI sempre responda (servidor deles cai frequentemente). Haverá fallback sempre.

---

## Resultado Final Esperado

O cliente verá:
1. **Tela de busca premium** com animação de scan futurista
2. **Loading cinematográfico** com 4 etapas em tempo real
3. **Resultado rico** dividido em seções:
   - Status INPI (verde/amarelo/vermelho com marcas encontradas)
   - Análise de colidência web (empresas BR, LinkedIn, web)
   - Score de urgência com gauge animado
   - Laudo técnico completo com linguagem jurídica real
4. **Download PDF profissional** com logo, QR Code, hash, formatação premium
5. **Alerta de urgência** personalizado baseado na análise real

**Pré-requisito necessário:** Conectar Firecrawl e Perplexity como connectors do projeto (você precisará aprovar a conexão via popup). Isso é obrigatório para os módulos de busca web e INPI. Caso prefira não usar os connectors, posso usar apenas o Perplexity (que faz web search nativo) para cobrir todos os módulos externos.
