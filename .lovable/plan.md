
# Corrigir Papel Timbrado do PDF do Laudo — Idêntico ao Contrato

## Problema Identificado

O PDF atual tem:
- Faixa navy (azul escuro) no topo de 6mm + linha dourada
- Logo pequeno à esquerda + texto "WEBMARCAS" + informações da empresa à direita
- Header das páginas 2+ com fundo navy escuro completo (`addPageStrip`)

A imagem de referência (image-284.png) mostra o cabeçalho **exato dos contratos**:
- Fundo **branco puro** (sem nenhuma faixa escura)
- Logo circular WebMarcas (`webmarcas-logo-circular.png`) no canto **esquerdo**
- Texto **`www.webmarcas.net`** em azul (`#0284c7`) no canto **direito**
- Barra gradiente **laranja → amarelo** (`#f97316 → #fbbf24`) abaixo, igual ao contrato

## Arquivo a Modificar

**`src/hooks/useViabilityPdf.ts`** — 3 alterações cirúrgicas:

---

## Alteração 1 — Função `loadLogo` (buscar logo circular)

Atualizar as URLs para usar `webmarcas-logo-circular.png` (que é o logo redondo exibido no contrato):

```ts
const urls = [
  window.location.origin + '/favicon.png',
  'https://webmarcas1.lovable.app/favicon.png',
];
```

O logo `webmarcas-logo-circular.png` está em `src/assets/`. Como ele é importado via ES6, precisa ser convertido para base64 no contexto do canvas. A solução mais robusta é usar a URL do favicon (que já é o logo circular no `public/`) como já está, mas garantir que o canvas renderize corretamente.

---

## Alteração 2 — Cabeçalho Página 1 (linhas 232–283)

**Substituir** o cabeçalho atual (navy + gold) pelo estilo exato do contrato:

```
[Fundo branco — sem nenhuma faixa colorida no topo]
[Logo circular WebMarcas — esquerda, ~20mm altura]
[www.webmarcas.net — direita, bold, azul #0284c7]
[Barra gradiente laranja→amarelo — largura total, ~3mm altura]
[Espaço]
[Badge título centralizado — navy, texto branco]
[Protocolo | Data — cinza, centralizado]
```

Código novo para o cabeçalho:
```ts
// Fundo branco (sem barra navy)
let y = M;

// Logo à esquerda (circular)
if (logoData) {
  try { doc.addImage(logoData, 'PNG', M, y, 20, 20); } catch { /* skip */ }
}

// www.webmarcas.net à direita em azul
setFont(doc, 'bold', 11, [2, 132, 199]); // #0284c7
doc.text('www.webmarcas.net', pw - M, y + 13, { align: 'right' });

y += 24;

// Barra gradiente laranja→amarelo (simulada com degradê via retângulos)
// jsPDF não suporta gradiente nativo, simular com 3 retângulos interpolados:
filledRect(doc, 0, y, pw * 0.33, 2.5, [249, 115, 22]);  // #f97316
filledRect(doc, pw * 0.33, y, pw * 0.33, 2.5, [251, 146, 60]); // intermediário
filledRect(doc, pw * 0.66, y, pw * 0.34, 2.5, [251, 191, 36]); // #fbbf24

y += 8;

// Badge título
const badgeText = 'LAUDO TECNICO DE VIABILIDADE DE MARCA';
setFont(doc, 'bold', 10, C.white);
const badgeW = doc.getTextWidth(badgeText) + 16;
const badgeX = (pw - badgeW) / 2;
filledRect(doc, badgeX, y, badgeW, 9, C.navy, 1);
doc.text(badgeText, pw / 2, y + 6, { align: 'center' });
y += 13;

// Protocolo + data
setFont(doc, 'normal', 6.5, [140, 140, 140]);
doc.text(`Protocolo: ${protocol}   |   ${dateStr}`, pw / 2, y, { align: 'center' });
y += 8;
```

---

## Alteração 3 — Cabeçalho Páginas 2+ (`addPageStrip`, linha 164–170)

A função `addPageStrip` atualmente coloca uma faixa navy escura no topo de cada página subsequente. Substituir pelo mesmo estilo limpo:

```ts
function addPageStrip(doc: jsPDF, pw: number, _ph: number) {
  // Logo circular pequeno à esquerda
  // (sem logo para evitar complexidade — apenas texto e gradiente)
  
  // www.webmarcas.net à direita, azul
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(2, 132, 199); // #0284c7
  doc.text('www.webmarcas.net', pw - 16, 10, { align: 'right' });
  
  // Barra laranja→amarelo
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 13, pw * 0.33, 1.5, 'F');
  doc.setFillColor(251, 146, 60);
  doc.rect(pw * 0.33, 13, pw * 0.33, 1.5, 'F');
  doc.setFillColor(251, 191, 36);
  doc.rect(pw * 0.66, 13, pw * 0.34, 1.5, 'F');
}
```

E ajustar `y = 22` para `y = 19` no `addPage()` para compensar o cabeçalho menor.

---

## Alteração 4 — Rodapé (footer) já está branco/limpo ✅

O último diff já corrigiu o rodapé para fundo branco com linha dourada fina. Nenhuma mudança necessária aqui.

---

## O que NÃO muda

- Score de viabilidade
- Todas as 10 seções do laudo
- Tabelas, cores de cabeçalho de seção, lógica de paginação
- `cleanLaudo()` já corrigida
- Texto da assinatura "Dr. Alexandre Moreira" já removido no último diff

## Arquivo único modificado

**`src/hooks/useViabilityPdf.ts`** — alterações nas linhas:
- `164–170` → `addPageStrip` (cabeçalho páginas 2+)
- `232–283` → bloco do cabeçalho página 1
