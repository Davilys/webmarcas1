
# Adicionar Badge ® Animado no Hero Section

## O que será criado

Um componente de badge circular decorativo com:
- **® (R de Registrado)** no centro em azul, dentro de um círculo
- **Texto circular girando**: "REGISTRO DE MARCAS EM 24H" em volta, com animação de rotação contínua suave (igual ao Consolide)
- **Posição**: canto superior direito do Hero Section, flutuando absolutamente, exatamente onde o usuário marcou o círculo na segunda imagem

## Detalhes do design (baseado na referência)

A animação do Consolide usa **texto em arco circular que gira continuamente** (CSS `animation: spin`) com o ® fixo no centro. O visual é:

```text
    · R E G I S T R O ·
  ·                     ·
·    ┌──────────────┐    ·
·    │      ®       │    ·
·    └──────────────┘    ·
  ·                     ·
    · E M  2 4 H  · · ·
```

## Implementação técnica

O texto circular será feito com **SVG `<textPath>`** — a forma mais precisa de colocar texto seguindo um arco circular, sem dependências externas. O SVG terá:

- Um `<circle>` como path para o texto seguir
- `<textPath>` com `startOffset="0%"` para distribuir o texto ao redor
- Animação CSS `@keyframes spin` no grupo SVG do texto (rotação de 0° → 360°, `linear`, `infinite`)
- O ® central é um elemento separado, estático (não gira)
- Fundo branco com borda cinza sutil, exatamente como na referência

## Posicionamento no Hero

O badge será posicionado **absolutamente** dentro da `<section>` do Hero:
- `absolute top-[18%] right-[8%]` em desktop
- Oculto (`hidden`) em mobile pequeno, visível a partir de `md:`
- Tamanho: ~120px × 120px (mesmo da referência)

## Arquivo a modificar

### `src/components/sections/HeroSection.tsx`
- Adicionar o componente SVG do badge diretamente no arquivo, como função interna `RotatingRegisteredBadge`
- Posicionar dentro da `<section>` com `absolute`, antes do container principal
- Animação CSS inline com `style` tag ou `keyframes` via framer-motion

## Código do badge (SVG com textPath)

```tsx
const RotatingRegisteredBadge = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.8, duration: 0.6, type: "spring" }}
    className="absolute top-[18%] right-[6%] hidden md:block z-20"
  >
    <svg width="120" height="120" viewBox="0 0 120 120">
      {/* Fundo circular branco */}
      <circle cx="60" cy="60" r="58" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
      
      {/* ® central */}
      <circle cx="60" cy="60" r="20" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
      <text x="60" y="66" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#3b82f6">R</text>
      
      {/* Texto circular girando */}
      <g style={{ animation: "spin 8s linear infinite", transformOrigin: "60px 60px" }}>
        <defs>
          <path id="circle-path" d="M 60,60 m -45,0 a 45,45 0 1,1 90,0 a 45,45 0 1,1 -90,0" />
        </defs>
        <text fontSize="10" fontWeight="600" fill="#1e293b" letterSpacing="3">
          <textPath href="#circle-path">
            REGISTRO DE MARCAS EM 24H · 
          </textPath>
        </text>
      </g>
    </svg>
    
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </motion.div>
);
```

## Resultado esperado

- Badge aparece com animação de entrada (scale + fade) após 0.8s do carregamento da página
- Texto "REGISTRO DE MARCAS EM 24H" gira suavemente ao redor do ® central
- Visível apenas em desktop (md+), não atrapalha mobile
- Posicionado no canto superior direito do Hero, idêntico à referência do Consolide
- Apenas 1 arquivo modificado: `HeroSection.tsx`
