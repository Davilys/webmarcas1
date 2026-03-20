

## Problem Analysis

Comparing the **correct PDF** (image 2) with the **current output** (image 1), the issues are:

1. **"---INÍCIO DO RECURSO---"** marker is being rendered literally in both web preview and PDF — should be stripped
2. **Duplicated headers**: The AI now outputs "RECURSO ADMINISTRATIVO – MANIFESTAÇÃO À OPOSIÇÃO" and "MARCA: ASTROELETIVA" inside the content body, but the PDF template already renders these in the header badge area — causing redundancy
3. **Process metadata block** (Processo, Marca, Classe, Titular, Oponente, Procurador) renders as a single justified paragraph with wide word gaps instead of clean line-by-line listing
4. **Text justification on short lines** causes ugly word spacing in the web preview — "EXCELENTÍSSIMO SENHOR..." line is stretched across full width

## Root Cause

The `process-inpi-resource` edge function was updated to instruct the AI to prefix content with structured markers (`---INÍCIO DO RECURSO---`, resource type heading, brand name heading). These markers were not previously generated, and the `INPIResourcePDFPreview` component doesn't strip them.

Additionally, the AI now outputs process metadata as a single block paragraph instead of separate lines, breaking the layout.

## Plan

### 1. Update content cleaning in `INPIResourcePDFPreview.tsx`

Modify `stripClosingFromContent` (or add a new `stripOpeningMarkers` function) to remove:
- `---INÍCIO DO RECURSO---` line
- `RECURSO ADMINISTRATIVO – [TYPE]` line (already shown in badge)
- `MARCA: [NAME]` line (already shown in header)
- Any `---FIM DO RECURSO---` markers

### 2. Fix process metadata block rendering

Update `renderContent()` to detect the process metadata block (lines starting with `Processo INPI`, `Marca:`, `Classe NCL`, `Titular/Requerente:`, `Oponente:`, `Procurador:`) and render them as individual non-justified lines instead of a single justified paragraph.

### 3. Fix PDF generator metadata block

Apply the same metadata block detection in `handleDownloadPDF()` so the jsPDF output also renders these fields as separate left-aligned lines without justification stretching.

### 4. Fix web preview justify on short content

Add CSS to prevent `text-align: justify` from stretching single-line or very short paragraphs — use `text-align-last: left` or detect short paragraphs and skip justification.

### Technical Details

**File modified**: `src/components/admin/INPIResourcePDFPreview.tsx`

- In `stripClosingFromContent`: Add regex patterns to strip opening markers:
  ```
  /^-{2,}INÍCIO DO RECURSO-{2,}$/gm
  /^RECURSO ADMINISTRATIVO\s*[–—-]\s*.+$/gm  (first occurrence only)
  /^MARCA:\s*.+$/gm  (first occurrence only, since header already shows it)
  ```

- In `renderContent()`: Add detection for metadata block lines (Processo/Marca/Classe/Titular/Oponente/Procurador) → render as `<p>` with no indent, no justify, line-height compact

- In `handleDownloadPDF()`: Same detection → use `pdf.text()` left-aligned with tighter line spacing for metadata lines

- Add `text-align-last: left` to justified paragraphs to prevent last-line stretching

