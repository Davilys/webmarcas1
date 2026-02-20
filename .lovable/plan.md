
# Problema: Busca de Clientes no Modo Processual Mostrando Apenas 50 Registros

## Diagnóstico

No arquivo `src/components/admin/email/EmailCompose.tsx`, linha 176-205, a query que busca clientes para o Modo Processual tem um limite fixo de `.limit(50)`:

```typescript
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, full_name, email, phone')
  .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
  .limit(50);  // ← PROBLEMA: só busca 50 registros
```

Com mais de 2.300 clientes na base, a maioria fica invisível. A lista exibida é apenas uma amostra aleatória dos primeiros 50 registros do banco.

**Problema adicional:** Quando `searchQuery` está vazio (campo de busca em branco), a query retorna os primeiros 50 clientes sem critério de ordenação útil. O cliente que o usuário precisa pode nunca aparecer.

## Solução

Aplicar a estratégia `fetchAllRows` com paginação via `.range()` — já documentada nas memórias do projeto (`memory/technical/large-dataset-fetching-logic`).

### Lógica de Busca Corrigida

**Quando há texto digitado na busca** (`searchQuery` preenchido):
- Buscar em toda a base usando paginação de 1.000 em 1.000
- Filtrar por `full_name`, `email` e também por `brand_name` na tabela `brand_processes`
- Retornar todos os resultados que correspondam

**Quando não há texto** (`searchQuery` vazio):
- Carregar os 200 clientes mais recentes (ordenados por `created_at DESC`) para ter uma lista inicial útil
- Ao digitar, expandir para busca completa paginada

### Implementação — Apenas `EmailCompose.tsx`

Substituir a função `queryFn` na query `clients-with-processes`:

```typescript
queryFn: async () => {
  // Busca paginada: carrega todos os perfis que correspondem ao filtro
  const allProfiles: ProfileRow[] = [];
  let offset = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .range(offset, offset + batchSize - 1);

    if (searchQuery.trim()) {
      query = query.or(
        `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
      );
    } else {
      // Sem busca: carrega os 200 mais recentes para lista inicial
      query = query.order('created_at', { ascending: false }).limit(200);
      hasMore = false; // sem paginação no caso padrão
    }

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      allProfiles.push(...data);
      offset += batchSize;
      if (!searchQuery.trim() || data.length < batchSize) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  // Busca os processos dos perfis encontrados em lotes
  const profileIds = allProfiles.map(p => p.id);
  let allProcesses: ProcessRow[] = [];
  
  // Buscar processos em lotes de 100 IDs (limite do PostgREST para IN)
  for (let i = 0; i < profileIds.length; i += 100) {
    const batch = profileIds.slice(i, i + 100);
    const { data: processBatch } = await supabase
      .from('brand_processes')
      .select('user_id, brand_name, process_number')
      .in('user_id', batch);
    if (processBatch) allProcesses.push(...processBatch);
  }

  // Monta mapa final
  const clientsMap = new Map<string, ClientWithProcess>();
  allProfiles.forEach(profile => {
    const process = allProcesses.find(p => p.user_id === profile.id);
    clientsMap.set(profile.id, {
      id: profile.id,
      full_name: profile.full_name || '',
      email: profile.email,
      brand_name: process?.brand_name || undefined,
      process_number: process?.process_number || undefined,
    });
  });
  return Array.from(clientsMap.values());
},
```

### Debounce na busca

Adicionar debounce de 400ms para evitar disparar uma query a cada letra digitada:

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
  return () => clearTimeout(timer);
}, [searchQuery]);

// Usar debouncedSearch na queryKey e queryFn
const { data: clients = [], isLoading: isLoadingClients } = useQuery({
  queryKey: ['clients-with-processes', debouncedSearch],
  queryFn: async () => { /* ... usa debouncedSearch ... */ },
  enabled: isProcessualMode,
});
```

### Indicador de loading na lista

Mostrar um spinner enquanto a busca está em andamento:

```tsx
{isLoadingClients ? (
  <div className="flex items-center justify-center py-4">
    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    <span className="ml-2 text-sm text-muted-foreground">Buscando clientes...</span>
  </div>
) : clients.length === 0 ? (
  <p className="text-sm text-muted-foreground text-center py-4">Nenhum cliente encontrado</p>
) : (
  /* lista de clientes */
)}
```

## Arquivo a Modificar

| Arquivo | Mudança |
|---|---|
| `src/components/admin/email/EmailCompose.tsx` | Substituir queryFn da query `clients-with-processes` com paginação completa + debounce + loading indicator |

## Impacto

- Nenhuma alteração em layout, design, PDF, CRM ou outras páginas
- A busca passará a retornar TODOS os clientes da base (2.300+)
- Com debounce de 400ms, a performance é mantida
- O indicador de loading melhora a experiência durante a busca
