

## Plano: Corrigir Contador de Estatísticas no Hero

### Resumo

Corrigir o valor de "10.000" para "11.000" (11 mil) e garantir que o número não seja cortado visualmente.

---

### Problemas Identificados

| Problema | Localização | Solução |
|----------|-------------|---------|
| Valor errado (10000 → 11000) | `HeroSection.tsx` linha 59 | Alterar `value: 10000` para `value: 11000` |
| Número cortado visualmente | CSS do container | Adicionar `whitespace-nowrap` para evitar quebra |

---

### Alterações Necessárias

| Arquivo | Ação |
|---------|------|
| `src/components/sections/HeroSection.tsx` | Modificar - Corrigir valor e ajustar estilo |

---

### Detalhes da Correção

**1. Corrigir o valor de 10000 para 11000:**
```typescript
// ANTES (linha 59)
{ value: 10000, suffix: "+", label: t("hero.stats.brands") },

// DEPOIS
{ value: 11000, suffix: "+", label: t("hero.stats.brands") },
```

**2. Evitar corte do número adicionando whitespace-nowrap:**
```tsx
// ANTES (linha 184)
<div className="font-display text-4xl sm:text-5xl md:text-6xl font-bold gradient-text mb-2">

// DEPOIS
<div className="font-display text-4xl sm:text-5xl md:text-6xl font-bold gradient-text mb-2 whitespace-nowrap">
```

---

### Animação Existente

O componente `AnimatedCounter` já possui a animação de contagem que você deseja. Ele:
- Inicia em 0
- Conta rapidamente até o valor final
- Usa easing `easeOutQuart` para uma animação suave
- Duração configurada: 2.5 segundos

A animação já está funcionando - ao carregar a página, os números contam de 0 até o valor final.

---

### Resultado Visual

```text
ANTES:                          DEPOIS:
┌────────────────────┐          ┌────────────────────┐
│  10.00[cortado]    │          │     11.000+        │
│  Marcas Registradas│          │  Marcas Registradas│
└────────────────────┘          └────────────────────┘
```

---

### Seção Técnica

**Arquivo modificado:**
- `src/components/sections/HeroSection.tsx`
  - Linha 59: `value: 10000` → `value: 11000`
  - Linha 184: adicionar `whitespace-nowrap` ao className

