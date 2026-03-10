

## Problem Analysis

When an admin edits process data (brand name, process number, etc.) in the **Revista** tab, the changes are not fully propagated to the `publicacoes_marcas` table. This causes the Kanban cards in the **Publicação** tab to show "—" instead of the brand name.

### Root Causes Found

1. **Client assignment flow (lines 664-680)**: When assigning a client to a process that already has a publication record, the update only sets `client_id`, `process_id`, `status` — but does NOT update `brand_name_rpi` or `process_number_rpi`. So if the name was edited after initial creation, the Kanban card keeps the old (or null) value.

2. **Inline edit save (lines 1198-1209)**: The sync lookup uses only `rpi_entry_id`. If the publication was created through auto-sync or the process_number path, the `rpi_entry_id` might differ, causing the lookup to miss. It needs a fallback to `process_number_rpi`.

3. **Missing NCL sync**: The `ncl_class` field is also not propagated during assignment or edit updates.

### Fix Plan

**File: `src/pages/admin/RevistaINPI.tsx`**

1. **Fix client assignment sync (existingPub + existingByProcessNumber updates ~lines 664-680)**: Add `brand_name_rpi`, `process_number_rpi`, and `ncl_class` to both update calls so the Kanban card always reflects the latest data.

2. **Fix inline edit sync (~lines 1198-1209)**: Add a fallback lookup by `process_number_rpi` when `rpi_entry_id` lookup returns null, ensuring edits always reach the correct publication record. Also sync `ncl_class`.

