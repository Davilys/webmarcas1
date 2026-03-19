

# Fix: Contract PDF Signature Section Alignment

## Problem
In the PDF download (`useUnifiedContractDownload.ts`), the signatory name line (e.g., "DAVLIS DANGUES DE OLIVEIRA CUNHA") is not matched by any special formatting rule, so it renders as a left-aligned regular paragraph. On the preview it appears differently because of surrounding layout context.

The contract text structure is:
```text
CONTRATADA:
WebMarcas Intelligence PI
CNPJ: 39.528.012/0001-29

CONTRATANTE:
DAVLIS DANGUES DE OLIVEIRA CUNHA
CPF/CNPJ: 393.239.118-79
```

"CONTRATADA:", "CONTRATANTE:", "WebMarcas Intelligence PI", "CNPJ:", "CPF/CNPJ:" all have special centered rules. But the client's name has no matching rule and falls to `text-align: left`.

## Fix

### File: `src/hooks/useUnifiedContractDownload.ts` (formatContent function, ~line 93-117)

Add a detection rule for all-uppercase name lines (lines containing only uppercase letters, spaces, and accented characters, not matching any other pattern) and render them centered. This catches signatory names like "DAVLIS DANGUES DE OLIVEIRA CUNHA".

Insert before the regular paragraph fallback (line ~117):
```typescript
// Signatory names - all uppercase, letters/spaces/accented only
if (/^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]+$/.test(trimmed) && trimmed.length > 3) {
  return `<p style="font-size: 10px; text-align: center; color: #1f2937; font-weight: 600; margin-bottom: 4px;">${trimmed}</p>`;
}
```

### File: `src/components/contracts/ContractRenderer.tsx` (~line 143-148)

Apply the same fix in the on-screen renderer for consistency — add the same uppercase name detection before the regular paragraph fallback, rendering with `text-center` class.

## Scope
- Only affects the signature section formatting (CONTRATADA/CONTRATANTE area)
- No logic, data, or contract content changes
- No changes to payment, template, or blockchain systems

