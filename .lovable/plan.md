

# Correcao: Detalhes do Processo vazios no ficheiro azul para publicacoes orfas

## Problema
Quando um card "Sem cliente vinculado" e clicado no Kanban de Publicacoes, o ficheiro azul abre com "Detalhes do Processo" completamente vazio (sem timeline, sem publicacoes, sem botoes). Isso acontece porque todas as queries no `ClientDetailSheet` usam `client.id` para buscar dados, e para publicacoes orfas `client.id === ''`, retornando zero resultados.

O antigo painel branco funcionava porque usava os dados da publicacao diretamente. Precisamos replicar esse comportamento no ficheiro azul.

## Causa Raiz
Dois pontos no `ClientDetailSheet.tsx`:

1. **`fetchClientData`** (linha ~295): Queries como `.eq('user_id', client.id)` e `.eq('id', client.id)` com `client.id = ''` retornam vazio. `clientBrands` fica vazio.
2. **`handleQuickAction('processo')`** (linha ~619): `.eq('client_id', client.id)` e `.eq('user_id', client.id)` com `client.id = ''` retornam vazio. `processPublicacoes`, `processContracts`, `processEvents` ficam vazios.

## Solucao

### Arquivo: `src/components/admin/clients/ClientDetailSheet.tsx`

**1. Corrigir `fetchClientData` para orfaos:**
- Quando `client.id === ''` e `client.process_id` existe, buscar `brand_processes` por `process_id` em vez de `user_id`
- Setar `clientBrands` com o resultado (ou com `client.brands` como fallback)
- Pular queries que dependem de user_id (notes, appointments, docs, invoices, profile) — elas legitimamente nao existem para orfaos

**2. Corrigir `handleQuickAction('processo')` para orfaos:**
- Quando `client.id === ''`, buscar publicacoes por `process_id` (se existir) em vez de `client_id`
- Buscar `process_events` pelo `process_id`
- Contratos e faturas continuam vazios (correto, pois nao ha cliente vinculado)
- Garantir que `processPublicacoes` tenha a publicacao da qual o card veio

**3. Logica especifica:**

No `fetchClientData`:
```typescript
if (client.id === '') {
  // Orphan: fetch brand_process by process_id
  if (client.process_id) {
    const { data } = await supabase.from('brand_processes')
      .select('id, brand_name, business_area, process_number, pipeline_stage, status, created_at, updated_at, ncl_classes')
      .eq('id', client.process_id);
    setClientBrands(data || []);
  } else {
    setClientBrands(client.brands?.map(b => ({ ...b })) || []);
  }
  // Skip user-dependent queries
  setNotes([]); setAppointments([]); setDocuments([]); setInvoices([]);
  setProfileData(null);
  setLoading(false);
  return;
}
```

No `handleQuickAction('processo')`:
```typescript
case 'processo':
  if (client) {
    let pubsQuery, eventsQuery;
    
    if (client.id === '' && client.process_id) {
      // Orphan: fetch by process_id
      pubsQuery = supabase.from('publicacoes_marcas').select('*')
        .eq('process_id', client.process_id)
        .order('proximo_prazo_critico', { ascending: true, nullsFirst: false });
      eventsQuery = supabase.from('process_events').select('*')
        .eq('process_id', client.process_id)
        .order('event_date', { ascending: false });
    } else {
      // Normal client
      pubsQuery = supabase.from('publicacoes_marcas').select('*')
        .eq('client_id', client.id)
        .order('proximo_prazo_critico', { ascending: true, nullsFirst: false });
      eventsQuery = client.process_id
        ? supabase.from('process_events').select('*')
            .eq('process_id', client.process_id)
            .order('event_date', { ascending: false })
        : Promise.resolve({ data: [] });
    }
    
    const contractsQuery = client.id !== ''
      ? supabase.from('contracts').select('...').eq('user_id', client.id)
      : Promise.resolve({ data: [] });
    const invoicesQuery = client.id !== ''
      ? supabase.from('invoices').select('...').eq('user_id', client.id)
      : Promise.resolve({ data: [] });
    
    const [pubsRes, contractsRes, invoicesRes2, eventsRes] = await Promise.all([
      pubsQuery, contractsQuery, invoicesQuery, eventsQuery
    ]);
    // ... rest same
  }
```

## Resultado Esperado
- Ficheiro azul para publicacoes orfas mostra a timeline completa (Deposito, Publicacao RPI, Prazo Oposicao, etc.) com datas preenchidas
- Botoes de acao (Editar Datas, Agenda, Upload Doc RPI, Excluir) aparecem dentro da publicacao
- Dados da marca/processo aparecem mesmo sem cliente vinculado
- Aba Contatos continua mostrando campo de busca para vincular cliente
