

## Plan: Add "Troca de Procurador" and "Nomeação de Procurador" Resource Types

### Overview
Add two new resource types to the INPI Resources page: **Troca de Procurador** (Change of Attorney) and **Nomeação de Procurador** (Appointment of Attorney). These follow a data-entry form flow similar to the existing Notificação Extrajudicial — select client, fill in brand/process details, provide old/new attorney data, then let the AI agent generate the document.

### Changes

**1. Frontend — `src/pages/admin/RecursosINPI.tsx`**

- Add new entries to `RESOURCE_TYPE_LABELS` and `RESOURCE_TYPE_CONFIG` for `troca_procurador` and `nomeacao_procurador` (with distinct icons/colors — e.g. `UserMinus` / `UserPlus` or `RefreshCw` / `UserCheck`)
- Add new `Step` type value: `'procurador-data'`
- Add state for procurador-specific form data:
  - `procuradorData`: `{ marca, processo_inpi, ncl_class, procurador_antigo, cpf_procurador_antigo, procurador_novo, cpf_procurador_novo, motivo }`
  - Also `procuradorSubType`: `'troca' | 'nomeacao'` to distinguish the two
- Update `getVisibleSteps()` to show `procurador-data` step (instead of `upload`) for these two types
- Update the routing in `select-agent` step: when `resourceType` is `troca_procurador` or `nomeacao_procurador`, navigate to `'procurador-data'` step
- Build a new form section (`step === 'procurador-data'`) with:
  - Client search autocomplete (reuse existing logic)
  - Brand name, Process number, NCL class fields
  - Old attorney name + CPF (for troca only)
  - New attorney name + CPF
  - Reason/instructions textarea
  - Optional file attachments (reuse multipleFiles logic)
- Update `processDocument()` to route these types to a `processProcurador()` function that calls the edge function with `resourceType: 'troca_procurador'` or `'nomeacao_procurador'` and the form data
- Update `resetFlow()` to clear procurador state
- Update `dispatchStats` and dashboard cards to include the new types (expand grid to 6 columns or use 2 rows of 3)

**2. Backend — `supabase/functions/process-inpi-resource/index.ts`**

- Add labels to `RESOURCE_TYPE_LABELS`: `troca_procurador: 'PETIÇÃO DE TROCA DE PROCURADOR'`, `nomeacao_procurador: 'PETIÇÃO DE NOMEAÇÃO DE PROCURADOR'`
- Add a new `buildProcuradorPrompt()` function that generates a specialized AI prompt for creating the attorney change/appointment petition, including:
  - WebMarcas institutional identity
  - The specific INPI form requirements (Formulário de Petição)
  - Legal basis (LPI art. 216, art. 217)
  - Structure: header, qualification of parties, old/new attorney data, powers granted, signature block
  - Distinction between "troca" (revoke old + appoint new) vs "nomeação" (appoint new only)
- In the main handler, add a condition for `resourceType === 'troca_procurador' || resourceType === 'nomeacao_procurador'` that extracts `procuradorData` from the body and calls `buildProcuradorPrompt()`

**3. No database changes needed** — the existing `inpi_resources` table structure supports this (uses `resource_type` text field, `holder` for client, `examiner_or_opponent` can store new attorney name, etc.)

### Technical Details
- The grid for resource type selection changes from `md:grid-cols-4` to `md:grid-cols-3` (2 rows of 3) to accommodate 6 types
- The dispatch stats section also expands to show the two new types
- The form for procurador data is simpler than notificação extrajudicial (no "notificado/infrator" section, but has attorney-specific fields instead)

