
# Missão: Varredura Completa — Mobile Bug, Performance e SEO

## Diagnóstico dos Problemas Encontrados

### PROBLEMA 1 — Bug Mobile CRITICO (imagem enviada)
O Header no mobile apresenta fundo partido (metade preto, metade claro). A causa raiz é dupla:

**a) Logo com fundo opaco**: O arquivo `webmarcas-icon-transparent.png` NÃO tem transparência real — é uma PNG com fundo branco. Em tema escuro (dark mode), o header tem `bg-transparent`, mas o bloco do logo exibe fundo branco, dividindo o header visualmente.

**b) CSS da HeroSection conflitando com Header**: A `<section id="home">` tem `className="relative min-h-[85vh] flex items-center hero-glow overflow-hidden"` com `bg-hero-gradient` aplicado via `::before`, mas o header fixo posicionado `top-0` sobrepõe a seção sem fundo consistente no mobile.

**c) Safe-area-top na classe errada**: O header aplica `safe-area-top` que adiciona `padding-top: env(safe-area-inset-top)` mas o flexbox interno já tem altura `h-14`, fazendo o header ficar maior e desalinhar os ícones no mobile.

**Correção**: Substituir o logo no header por `webmarcas-logo-circular.png` (que tem fundo transparente correto e é redondo), adicionar `bg-background/95` ao header mesmo sem scroll no mobile, e corrigir o safe-area-top para funcionar corretamente.

### PROBLEMA 2 — Performance (Site lento ao carregar)
- **Google Fonts bloqueando render**: O `@import` de Inter e Space Grotesk dentro do CSS é render-blocking. Precisa ser movido para `<link>` no HTML com `preload` e `font-display: swap` já existente deve ser adicionado.
- **Sem preconnect para Supabase**: Cada requisição ao backend começa cold (sem preconnect).
- **Sem lazy loading nas imagens**: Todas as imagens carregam imediatamente.
- **Sem code splitting no Vite**: Sem `manualChunks`, todos os pacotes pesados (framer-motion, recharts, jspdf, xlsx, pdfjs-dist) ficam no bundle principal.
- **Favicon externo**: O favicon aponta para Google Storage — request externa que pode falhar ou ser lenta.

### PROBLEMA 3 — SEO Incompleto
- Falta `og:image` (campo vazio no HTML atual)
- Falta `twitter:image`
- Falta JSON-LD (Schema.org) para LocalBusiness/Organization
- Falta `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`
- Falta `theme-color` para barra do browser mobile
- Falta `link rel="preload"` para fontes críticas
- Favicon apontando para URL externa instável

---

## Plano de Execução

### Arquivo 1: `src/components/layout/Header.tsx`
**Correção do bug mobile CRITICO:**
- Usar `webmarcas-logo-circular.png` no lugar de `webmarcas-icon-transparent.png` (tem alfa real)
- Adicionar `bg-background/90 backdrop-blur-sm` como base no mobile (mesmo sem scroll)
- Remover `safe-area-top` do `<header>` e aplicar apenas `pt-safe` inline via `style` para não quebrar height
- Garantir que o header seja sempre opaco no mobile com classe condicional correta

```
// Antes:
className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-area-top ${
  isScrolled ? "bg-background/80 backdrop-blur-xl border-b border-border" : "bg-transparent"
}`}

// Depois (solução correta):
className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
  isScrolled
    ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
    : "bg-background/70 backdrop-blur-md"  // <- nunca transparente no mobile
}`}
style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
```

- Trocar `<img src={webmarcasLogo}` para usar `webmarcas-logo-circular.png` que é circular e transparente

### Arquivo 2: `index.html`
**Performance e SEO completo:**

**Performance:**
- Mover Google Fonts do CSS para `<link rel="preload">` + `<link rel="stylesheet">` com `font-display=swap`
- Adicionar `<link rel="preconnect">` para Supabase endpoint
- Adicionar `<link rel="dns-prefetch">` para domínios externos (Facebook, fonts)
- Mover o favicon para o arquivo local `public/favicon.ico` já existente no projeto
- Adicionar `<link rel="preload">` para o logo principal

**SEO:**
- Adicionar `og:image` com imagem da WebMarcas (logo-new.png copiada para public)
- Adicionar `twitter:image`
- Adicionar JSON-LD completo (LocalBusiness + WebSite + FAQPage schema)
- Adicionar `theme-color: #0066cc` (cor primária da marca)
- Adicionar `apple-mobile-web-app-capable` e `apple-mobile-web-app-status-bar-style`
- Adicionar `apple-touch-icon`
- Corrigir ordem dos meta tags (charset primeiro, depois viewport)
- Adicionar `robots: index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1`

### Arquivo 3: `index.css`
**Performance:**
- Remover o `@import` do Google Fonts (que é render-blocking) — as fontes serão carregadas via `<link>` no HTML com `preload`
- Garantir que `font-display: swap` esteja nos webfonts

### Arquivo 4: `vite.config.ts`
**Code Splitting para performance:**
- Adicionar `build.rollupOptions.output.manualChunks` para separar vendors pesados:
  - `chunk-framer`: framer-motion
  - `chunk-pdf`: jspdf, jspdf-autotable, pdfjs-dist
  - `chunk-data`: recharts, xlsx, papaparse
  - `chunk-supabase`: @supabase/supabase-js
  - `chunk-ui`: radix-ui packages
- Adicionar `build.chunkSizeWarningLimit: 800`
- Adicionar `optimizeDeps.include` para dependências críticas

### Arquivo 5: `src/components/sections/HeroSection.tsx`
**Correção do fundo que conflita com o header mobile:**
- Adicionar `pt-14 md:pt-16 lg:pt-20` ao container da section (compensar header fixo)
- O `pt-24` atual é no container interno — mover para a section para garantir que o conteúdo não fique atrás do header no mobile

### Arquivo 6: `public/` — Favicon local
- Copiar `src/assets/webmarcas-logo-circular.png` para `public/apple-touch-icon.png`
- O `public/favicon.ico` já existe, atualizar referência no HTML

---

## Resumo das Mudanças por Prioridade

```text
URGENTE (Bug Visual Mobile)
├── Header.tsx — fundo sempre semi-opaco + logo correto
└── HeroSection.tsx — padding-top correto para header fixo

ALTA PRIORIDADE (Performance)
├── index.html — preload fontes, preconnect, remover external favicon
├── index.css — remover @import Google Fonts (render-blocking)
└── vite.config.ts — code splitting manual para bundles menores

IMPORTANTE (SEO)
├── index.html — og:image, twitter:image, JSON-LD, theme-color
└── index.html — apple-touch-icon, PWA meta tags
```

---

## Resultado Esperado após as Correções

- Header mobile sem fundo partido: logo circular transparente sobre fundo semi-opaco consistente
- Redução estimada de 40-60% no tempo de carregamento inicial (fontes não bloqueiam render, code splitting reduz bundle principal)
- Score SEO Google de ~60-70 para ~95+ com structured data e OG tags completos
- Site auditavel pelo Google com rich results habilitados (FAQ schema, Organization schema)
