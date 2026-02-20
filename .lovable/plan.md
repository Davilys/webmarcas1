
# Reescrever o PDF do Laudo de Viabilidade — Visual Premium + Lógica Correta

## Problemas Identificados no PDF Atual

### 1. Lógica de Cor/Resultado Errada
A função `getLevelColor` e `getLevelLabel` no PDF ainda usa `urgencyScore <= 50` como critério, enquanto o frontend foi corrigido para usar dados reais (INPI, CNPJ, Web). Resultado: marca "FORT NEW" sem nenhuma colidência aparecia como **RISCO / BAIXA VIABILIDADE** (vermelho).

### 2. Card de Resultado Mal Formatado
- O texto `✗  RISCO` aparece como `' R I S C O` com espaços estranhos — causado por caracteres especiais (✗/✓) incompatíveis com a fonte `helvetica` do jsPDF
- O score `85` aparece deslocado e desproporcional
- O painel branco à direita tem código duplicado (`filledRect` chamado duas vezes para o mesmo elemento)

### 3. Seção "Parecer Técnico-Jurídico" com Lixo Visual
O laudo IA gerado às vezes contém caracteres `%%%` ou delimitadores que são renderizados literalmente no PDF

### 4. Cabeçalho sem Logo (Logo Quebrado)
O logo carrega via `/favicon.png` com `crossOrigin`, que pode falhar no contexto de geração de PDF (CORS). O resultado é o cabeçalho sem imagem.

### 5. Falta Sincronização de Cores com Frontend
O PDF deve usar a **mesma lógica** do frontend:
- Sem conflito INPI + sem conflito CNPJ + web ≤ 2 → **VERDE / ALTA VIABILIDADE**
- Só web → **ÂMBAR / VIABILIDADE MÉDIA**  
- Conflito INPI ou CNPJ → **VERMELHO / BAIXA VIABILIDADE**

---

## O que Será Corrigido em `src/hooks/useViabilityPdf.ts`

### Correção 1 — Lógica de Viabilidade (sincronizar com frontend)
Substituir as funções `getLevelColor` e `getLevelLabel` por uma função derivada dos dados reais:

```ts
function computePdfLevel(result: ViabilityResult): 'high' | 'medium' | 'low' | 'blocked' {
  if (result.level === 'blocked') return 'blocked';
  const hasINPI  = result.inpiResults?.found === true && (result.inpiResults?.totalResults ?? 0) > 0;
  const hasCNPJ  = result.companiesResult?.found === true && (result.companiesResult?.total ?? 0) > 0;
  const hasWeb   = (result.webAnalysis?.webMentions ?? 0) > 2;
  if (!hasINPI && !hasCNPJ && !hasWeb) return 'high';
  if (!hasINPI && !hasCNPJ) return 'medium';
  return 'low';
}
```

### Correção 2 — Ícones de Texto Simples (sem caracteres Unicode problemáticos)
Substituir `✓` e `✗` por texto ASCII puro compatível com helvetica:
- `✓  VIAVEL` → usar apenas `VIAVEL` com background verde
- `✗  RISCO` → usar `RISCO` sem o caractere especial

### Correção 3 — Card de Resultado Redesenhado
O card principal (seção 2) será redesenhado:

**Layout novo do card:**
```
┌──────────────────────────────────────────────────────────┐
│  [VERDE/VERMELHO]        │  Título do resultado          │
│                          │  Descrição resumida           │
│  ALTA VIABILIDADE        │                               │
│  ou BAIXA VIABILIDADE    │  Urgência: TRANQUILO          │
└──────────────────────────────────────────────────────────┘
```
- Remover o score numérico do lado esquerdo (não agrega valor visual)
- Usar retângulo arredondado limpo com fundo de cor sólida
- Texto grande e legível no lado esquerdo: apenas o label de viabilidade
- Texto da descrição no lado direito com boa quebra de linha

### Correção 4 — Logo via Import ES6
Usar o logo da WebMarcas importado diretamente (não via URL que pode falhar por CORS):
- O hook receberá o `logoBase64` como parâmetro opcional, ou
- Usar `toBase64FromUrl` com a URL completa absoluta do site em produção como fallback
- Adicionar tratamento robusto de erro para não quebrar o PDF se o logo falhar

### Correção 5 — Limpar Seção de Parecer Técnico-Jurídico
Antes de renderizar `result.laudo` no PDF, limpar o texto:
```ts
const cleanLaudo = (result.laudo || '')
  .replace(/[%]{3,}/g, '')   // remove %%% 
  .replace(/={5,}/g, '---')  // substitui ===== por linha
  .trim();
```

### Correção 6 — Gauge de Urgência Ajustado
O label de urgência no PDF também será derivado do nível real:
```ts
const urgencyLabel = 
  pdfLevel === 'high' ? 'TRANQUILO' :
  pdfLevel === 'medium' ? 'MODERADO' : 'URGENTE';
```

---

## Arquivo a Modificar
- **`src/hooks/useViabilityPdf.ts`** — apenas correções de lógica e layout, sem mudanças de banco

## Resultado Esperado

| Cenário | Cor do Card | Label Principal | Label Urgência |
|---|---|---|---|
| Sem conflitos (INPI, CNPJ, Web limpos) | Verde | ALTA VIABILIDADE | TRANQUILO |
| Só presença web | Âmbar | VIABILIDADE MÉDIA | MODERADO |
| Conflito INPI ou CNPJ | Vermelho | BAIXA VIABILIDADE | URGENTE |

O PDF ficará idêntico ao visual do site: limpo, com identidade navy/gold da WebMarcas, logo discreto, textos organizados e resultado correto refletindo os dados reais da pesquisa.
