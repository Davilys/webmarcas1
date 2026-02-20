
# Corrigir Lógica de Cores da Viabilidade: Verde/Vermelho Baseado nos Dados Reais

## O Problema Atual

A lógica de `effectiveLevel` no `ViabilityResultDisplay.tsx` usa o `urgencyScore` como critério:
```ts
if (urgency <= 50) return 'high'; // verde
```

Isso é impreciso. O `urgencyScore` pode ter qualquer valor e não reflete diretamente os dados reais das três fontes. O usuário quer uma regra clara e objetiva:

**Regra do usuário:**
- INPI: sem colidências + CNPJ: sem empresas + Web: 0 menções → **VERDE / ALTA VIABILIDADE**
- Se qualquer uma dessas fontes tiver resultado positivo (conflito) → **VERMELHO / BAIXA VIABILIDADE**

## Também precisa corrigir: o Gauge de Urgência

O gauge mostra score numérico com ponteiro. Atualmente:
- Score alto (ex: 85) = vermelho = URGENTE
- Score baixo = verde = TRANQUILO

Mas quando não há conflito nenhum, o gauge pode ainda mostrar vermelho se o `urgencyScore` retornado pela API for alto. O gauge precisa refletir a mesma lógica dos dados reais.

## O que será modificado

### `src/components/shared/ViabilityResultDisplay.tsx`

**1. Nova função `computeViabilityLevel`** — substitui o bloco `effectiveLevel` atual:

```ts
const computeViabilityLevel = (result: ViabilityResult) => {
  // Marca bloqueada = sempre vermelho severo
  if (result.level === 'blocked') return 'blocked';
  
  const hasINPIConflict = result.inpiResults?.found === true && (result.inpiResults?.totalResults ?? 0) > 0;
  const hasCNPJConflict = result.companiesResult?.found === true && (result.companiesResult?.total ?? 0) > 0;
  const hasWebPresence = (result.webAnalysis?.webMentions ?? 0) > 2; // tolerância de até 2 menções
  
  // LIMPO em todas as fontes → ALTA VIABILIDADE (verde)
  if (!hasINPIConflict && !hasCNPJConflict && !hasWebPresence) return 'high';
  
  // Tem apenas presença web leve mas sem INPI/CNPJ → MÉDIA
  if (!hasINPIConflict && !hasCNPJConflict) return 'medium';
  
  // Tem colidência INPI ou CNPJ → BAIXA (vermelho)
  return 'low';
};
```

**2. Gauge de Urgência coerente** — o score visual do gauge também deve mudar:

Quando `effectiveLevel === 'high'` (dados limpos), forçar a cor do gauge para verde, independente do `urgencyScore` numérico retornado pela API. Isso será feito passando o `effectiveLevel` para o `UrgencyGauge`:

```tsx
<UrgencyGauge score={result.urgencyScore ?? 30} effectiveLevel={effectiveLevel} />
```

No componente `UrgencyGauge`, a cor será determinada pelo `effectiveLevel` e não apenas pelo score numérico:
```ts
const color = 
  effectiveLevel === 'high' ? '#10b981' :      // verde
  effectiveLevel === 'medium' ? '#f59e0b' :    // âmbar
  '#ef4444';                                    // vermelho
  
const label = 
  effectiveLevel === 'high' ? 'TRANQUILO' :
  effectiveLevel === 'medium' ? 'MODERADO' : 'URGENTE';
```

**3. Badge de resultado** — já usa `effectiveLevel`, então automaticamente ficará verde com "✓ ALTA VIABILIDADE" quando os dados forem limpos.

## Resultado Esperado

| Cenário | INPI | CNPJ | Web | Cor | Texto |
|---|---|---|---|---|---|
| Limpo | ✓ 0 | ✓ 0 | ✓ 0 | 🟢 Verde | ALTA VIABILIDADE |
| Só web | ✓ 0 | ✓ 0 | ⚠ 3+ | 🟡 Âmbar | VIABILIDADE MÉDIA |
| Com conflitos | ✗ 1+ | ✗/✓ | qualquer | 🔴 Vermelho | BAIXA VIABILIDADE |
| Bloqueada | ✗ | ✗ | ✗ | 🔴 Vermelho | MARCA BLOQUEADA |

## Arquivo a modificar
- `src/components/shared/ViabilityResultDisplay.tsx` — apenas lógica de `effectiveLevel` e `UrgencyGauge`

## Nenhuma mudança de banco de dados ou edge function necessária
A lógica é puramente frontend, baseada nos dados já retornados pela API.
