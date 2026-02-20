
# Fix PDF Report: Letterhead + Remove %%% Garbage

## Two Problems to Fix

### Problem 1: %%% garbage in Section 10

Looking at the screenshot, the AI-generated laudo contains:
```
% % % % % % % % % % % % % % % % % % %
LAUDO TÉCNICO DE VIABILIDADE DE MARCA — WEBMARCAS
Protocolo: WM-MLUCZDQ4
% % % % % % % % % % % % % % % % % % %
```

The current `cleanLaudo()` uses `replace(/[%]{3,}/g, '')` — this regex only matches `%%%` without spaces. The AI output contains `% % % % %` (with spaces between), which does NOT match. So the garbage passes through.

Additionally, the laudo appears to contain a self-generated header block (`LAUDO TÉCNICO DE VIABILIDADE...`, `Protocolo:`, `Data:`) that duplicates the PDF's own header. This entire block must be stripped.

**Fix in `cleanLaudo()`:**
```ts
function cleanLaudo(raw: string): string {
  return raw
    // Remove lines that are ONLY % characters (with or without spaces)
    .replace(/^[\s%]+$/gm, '')
    // Remove the AI-generated header block that duplicates the PDF header
    .replace(/^LAUDO T[ÉE]CNICO DE VIABILIDADE.*$/gim, '')
    .replace(/^Protocolo:\s*WM-.*$/gim, '')
    .replace(/^Data:\s*\d.*$/gim, '')
    // Remove existing artifact patterns
    .replace(/[%]{3,}/g, '')
    .replace(/={5,}/g, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*{2,}/g, '')
    // Collapse multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
```

### Problem 2: Letterhead needs to match the contract/INPI Resource style

The user's reference image (the attached image) shows the INPI Resource PDF letterhead from `INPIResourcePDFPreview.tsx`:
- Clean white background (no navy fill across the full header)
- Thin navy top border bar (8px)
- Thin gold accent line below
- Logo on the left (small, ~18x18mm)
- "WEBMARCAS" large bold text next to logo
- Tagline below
- Company info (CNPJ, address, email) on the RIGHT side in small text
- Double separator: thick navy line + thin gold line
- Then document title badge centered

**Current letterhead** is a full navy fill (`filledRect(doc, 0, 0, pw, 54, C.navy)`) with decorative circles — it looks "dark and heavy". The user wants it **clean, simple, like the contract/INPI resource style**.

**New letterhead for the viability PDF** (matching INPIResourcePDFPreview style):
```
[Thin navy bar top 6mm]
[Thin gold line 2mm]
[White space with logo left + company info right, ~28mm tall]
[Double separator: navy line + gold line]
[Document title section]
```

## File to Modify

**`src/hooks/useViabilityPdf.ts`** — two targeted changes only:
1. Replace the `CABEÇALHO PREMIUM` block (lines 222-263) with the clean letterhead
2. Replace the `cleanLaudo()` function (lines 85-93) with the enhanced version

## Technical Details

### New Letterhead Code (replaces lines 222-263)

```ts
// ── Top bar (navy thin strip)
filledRect(doc, 0, 0, pw, 6, C.navy);
filledRect(doc, 0, 6, pw, 1.5, C.gold);
let y = 12;

// ── Letterhead: Logo + Company on white background
if (logoData) {
  try { doc.addImage(logoData, 'PNG', M, y, 18, 18); } catch { /* skip */ }
}
const textX = M + 22;
setFont(doc, 'bold', 18, C.navy);
doc.text('WEBMARCAS', textX, y + 8);
setFont(doc, 'normal', 7.5, [120, 130, 150]);
doc.text('Propriedade Intelectual e Registro de Marcas no INPI', textX, y + 14);

// Right side company info
setFont(doc, 'bold', 7, C.navy);
doc.text('CNPJ: 39.528.012/0001-29', pw - M, y + 4, { align: 'right' });
setFont(doc, 'normal', 6.5, [150, 150, 150]);
doc.text('Av. Brigadeiro Luiz Antonio, 2696', pw - M, y + 9, { align: 'right' });
doc.text('Centro — Sao Paulo/SP', pw - M, y + 13, { align: 'right' });
doc.text('www.webmarcas.net', pw - M, y + 17, { align: 'right' });

// ── Double separator
y += 22;
doc.setDrawColor(...C.navy); doc.setLineWidth(0.8);
doc.line(M, y, pw - M, y);
doc.setDrawColor(...C.gold); doc.setLineWidth(0.3);
doc.line(M, y + 1.5, pw - M, y + 1.5);
y += 8;

// ── Document title badge centered
const badgeText = 'LAUDO TECNICO DE VIABILIDADE DE MARCA';
setFont(doc, 'bold', 10, C.white);
const badgeW = doc.getTextWidth(badgeText) + 16;
const badgeX = (pw - badgeW) / 2;
filledRect(doc, badgeX, y, badgeW, 9, C.navy, 1);
doc.text(badgeText, pw / 2, y + 6, { align: 'center' });
y += 13;

// Protocol + date beneath badge
setFont(doc, 'normal', 6.5, [140, 140, 140]);
doc.text(`Protocolo: ${protocol}   |   ${dateStr}`, pw / 2, y, { align: 'center' });
y += 8;
```

The rest of the document (sections 1-10, footer) stays completely unchanged.

## What Does NOT Change

- Score logic
- All 10 sections structure and order
- Colors of section headers
- Table layouts
- Footer
- Page guard logic
- Any other file

## Summary of Changes

| Location | Change |
|---|---|
| `cleanLaudo()` function (~line 85) | Enhanced to strip `% % %` with spaces, duplicate header block |
| Header block (~lines 222-263) | Replace heavy navy fill with clean letterhead matching INPI Resource style |

Only `src/hooks/useViabilityPdf.ts` is modified.
