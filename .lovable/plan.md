
## Root Cause: Edge Function Timeout

The import fails with "Failed to fetch" because the edge function processes each client **sequentially** (one at a time), requiring 4 database operations per client. With ~200+ clients in the file, this exceeds the 60-second edge function timeout.

### Problems Found

1. **Performance bottleneck**: The `for` loop in `import-clients/index.ts` makes sequential API calls per client: create Auth user → upsert profile → assign role → create brand process. Processing 200+ clients this way takes several minutes, but the edge function times out after 60 seconds.

2. **CORS headers incomplete**: The `Access-Control-Allow-Headers` is missing `x-supabase-client-*` headers that the Supabase JS client sends in newer versions, potentially causing preflight failures.

3. **Duplicate rows inside the file itself**: The uploaded Excel has repeated emails (e.g. `daozincantor@gmail.com` appears 3 times, `davillys@gmail.com` appears twice). These must be deduplicated before sending to the edge function.

4. **Large payload sent all at once**: The frontend sends all ~200 clients in a single request body, which can be truncated or fail at the HTTP level.

### The Fix Strategy

#### Part 1 — Edge Function: Process in batches using `Promise.allSettled`
Instead of a serial `for` loop, run clients in **parallel batches of 5** (to stay within auth rate limits). This reduces 200 clients from ~8 minutes down to ~30 seconds, fitting within the timeout window.

#### Part 2 — Edge Function: Fix CORS headers
Add the missing `x-supabase-client-*` headers to `Access-Control-Allow-Headers`.

#### Part 3 — Frontend: Batch the request in chunks of 50
Split the client list into chunks of 50 before calling the edge function. This prevents HTTP payload timeouts and allows progress tracking. Each batch calls the edge function independently.

#### Part 4 — Frontend: Deduplicate inside the file before sending
Before the preview step, filter out duplicate emails that appear multiple times within the uploaded file itself (keep only the first occurrence).

### Files to Change

**`supabase/functions/import-clients/index.ts`**
- Add full CORS headers including `x-supabase-client-*`
- Replace sequential `for` loop with `Promise.allSettled` parallel batches (5 at a time)
- Extract the single-client processing into an async helper function

**`src/components/admin/clients/ClientImportExportDialog.tsx`**
- Add in-file deduplication logic before sending to edge function
- Split clients into chunks of 50 and call the edge function multiple times
- Show progress toast during multi-batch import (e.g., "Importando lote 1/4...")

### Technical Detail: Parallel Batch Processing

```text
Current (SLOW - times out):
client 1 → [createUser] → [upsertProfile] → [assignRole] → [createProcess] ──┐
client 2 →  ...wait for client 1...                                           │ ~8 min total
...                                                                            │
client 200 → ...                                                              ─┘

New (FAST - fits in timeout):
Batch 1: client 1+2+3+4+5 all in parallel ──> complete in ~3s
Batch 2: client 6+7+8+9+10 in parallel ────> complete in ~3s
... 40 batches × ~3s = ~2 minutes for 200 clients
+ Frontend sends 4 requests of 50 clients each = 4 × 30s = well within limits
```

### What Will NOT Change
- No contracts or invoices are created (same as "Novo Cliente" button)
- Duplicate detection vs. existing database records stays the same
- Password `123Mudar@`, role `user`, funnel `juridico`, stage `protocolado` remain unchanged
- No schema or RLS changes
