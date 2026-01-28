
# Plano: Filtros de Período na Aba Clientes (Admin)

## Objetivo

Adicionar filtros de período (Hoje, Semana, Mês) e navegação por mês/ano na área de busca de clientes do admin, conforme a referência visual fornecida. Isso permitirá localizar rapidamente clientes adicionados em períodos específicos, facilitando a gestão quando houver milhares de registros.

---

## Estrutura Visual Proposta

```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  🔍 Buscar clientes por nome, empresa, email, CPF/CNPJ, marca ou telefone...         │
└──────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│  📅 Hoje   📅 Semana   📅 Mês  │  <  📅 Jan de 2026  >  │   [Kanban] [Lista]        │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Comportamento dos Filtros

| Filtro | Descrição |
|--------|-----------|
| **Hoje** | Mostra clientes criados hoje (data atual) |
| **Semana** | Mostra clientes criados nos últimos 7 dias |
| **Mês** | Mostra clientes do mês selecionado no navegador |
| **Navegador de Mês** | Setas `<` e `>` para navegar entre meses. Exibe "Jan de 2026", "Fev de 2026", etc. |

---

## Implementação Técnica

### Etapa 1: Adicionar Estados para Filtro de Período

**Arquivo:** `src/pages/admin/Clientes.tsx`

```tsx
// Novos estados
type DateFilterType = 'all' | 'today' | 'week' | 'month';

const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
```

### Etapa 2: Incluir `created_at` nos Dados

O campo `created_at` já existe na tabela `profiles` e já está sendo buscado. Precisamos apenas garantir que seja passado para o `ClientWithProcess`:

```tsx
// No fetchClients - já existe, apenas confirmar que created_at está sendo capturado
clientsWithProcesses.push({
  ...
  created_at: profile.created_at, // ← Garantir que está sendo passado
  ...
});
```

### Etapa 3: Criar Componente de Filtro de Período

Criar um novo componente reutilizável para os filtros de período:

**Arquivo:** `src/components/admin/clients/DatePeriodFilter.tsx`

```tsx
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type DateFilterType = 'all' | 'today' | 'week' | 'month';

interface DatePeriodFilterProps {
  dateFilter: DateFilterType;
  onDateFilterChange: (filter: DateFilterType) => void;
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function DatePeriodFilter({
  dateFilter,
  onDateFilterChange,
  selectedMonth,
  onMonthChange
}: DatePeriodFilterProps) {
  const monthLabel = format(selectedMonth, "MMM 'de' yyyy", { locale: ptBR });
  
  return (
    <div className="flex items-center gap-2">
      {/* Filtros rápidos */}
      <div className="flex items-center border rounded-lg bg-background">
        <Button
          variant={dateFilter === 'today' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onDateFilterChange(dateFilter === 'today' ? 'all' : 'today')}
        >
          <Calendar className="h-4 w-4 mr-1" />
          Hoje
        </Button>
        <Button
          variant={dateFilter === 'week' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onDateFilterChange(dateFilter === 'week' ? 'all' : 'week')}
        >
          <Calendar className="h-4 w-4 mr-1" />
          Semana
        </Button>
        <Button
          variant={dateFilter === 'month' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onDateFilterChange(dateFilter === 'month' ? 'all' : 'month')}
        >
          <Calendar className="h-4 w-4 mr-1" />
          Mês
        </Button>
      </div>
      
      {/* Navegador de mês */}
      <div className="flex items-center border rounded-lg bg-background">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(subMonths(selectedMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-3 text-sm font-medium capitalize">
          <Calendar className="h-4 w-4 inline mr-1" />
          {monthLabel}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(addMonths(selectedMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### Etapa 4: Lógica de Filtragem por Data

**Arquivo:** `src/pages/admin/Clientes.tsx`

```tsx
import { startOfDay, startOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

// Função para filtrar por período
const filterByDate = (clients: ClientWithProcess[]) => {
  if (dateFilter === 'all') return clients;
  
  const now = new Date();
  
  return clients.filter(client => {
    if (!client.created_at) return true; // Sem data = não filtra
    
    const createdAt = parseISO(client.created_at);
    
    switch (dateFilter) {
      case 'today':
        return isWithinInterval(createdAt, {
          start: startOfDay(now),
          end: now
        });
      case 'week':
        return isWithinInterval(createdAt, {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: now
        });
      case 'month':
        return isWithinInterval(createdAt, {
          start: startOfMonth(selectedMonth),
          end: endOfMonth(selectedMonth)
        });
      default:
        return true;
    }
  });
};

// Aplicar filtro de data ANTES do filtro de busca
const dateFilteredClients = filterByDate(clients);

const filteredClients = dateFilteredClients.filter(client =>
  client.full_name?.toLowerCase().includes(search.toLowerCase()) ||
  client.email.toLowerCase().includes(search.toLowerCase()) ||
  client.company_name?.toLowerCase().includes(search.toLowerCase()) ||
  client.brand_name?.toLowerCase().includes(search.toLowerCase()) ||
  client.phone?.includes(search) ||
  client.cpf_cnpj?.includes(search) // ← Adicionar busca por CPF/CNPJ
);
```

### Etapa 5: Atualizar Interface do Usuário

**Arquivo:** `src/pages/admin/Clientes.tsx`

Reorganizar a área de busca para incluir os filtros de período:

```tsx
{/* Search and Filters Row */}
<div className="flex flex-col gap-4">
  {/* Search Input - Full Width */}
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Buscar clientes por nome, empresa, email, CPF/CNPJ, marca ou telefone..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="pl-10"
    />
  </div>
  
  {/* Period Filters + View Toggle */}
  <div className="flex flex-wrap items-center justify-between gap-4">
    <DatePeriodFilter
      dateFilter={dateFilter}
      onDateFilterChange={setDateFilter}
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
    />
    
    <div className="flex items-center gap-2">
      {/* Badges de filtros ativos */}
      {dateFilter !== 'all' && (
        <Badge 
          variant="secondary"
          className="cursor-pointer"
          onClick={() => setDateFilter('all')}
        >
          {dateFilter === 'today' ? 'Hoje' : 
           dateFilter === 'week' ? 'Semana' : 
           format(selectedMonth, "MMM/yyyy", { locale: ptBR })}
          <X className="h-3 w-3 ml-1" />
        </Badge>
      )}
      
      {/* Toggle Kanban/Lista */}
      <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
        <ToggleGroupItem value="kanban">
          <LayoutGrid className="h-4 w-4 mr-2" />
          Kanban
        </ToggleGroupItem>
        <ToggleGroupItem value="list">
          <List className="h-4 w-4 mr-2" />
          Lista
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  </div>
</div>
```

### Etapa 6: Atualizar Interface `ClientWithProcess`

**Arquivo:** `src/components/admin/clients/ClientKanbanBoard.tsx`

Garantir que o campo `cpf_cnpj` está na interface para permitir busca:

```tsx
export interface ClientWithProcess {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  priority: string | null;
  origin: string | null;
  contract_value: number | null;
  process_id: string | null;
  brand_name: string | null;
  pipeline_stage: string | null;
  process_status: string | null;
  created_at?: string;    // ← Já existe
  last_contact?: string;
  cpf_cnpj?: string;      // ← Adicionar para busca
}
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/admin/Clientes.tsx` | Adicionar estados, lógica de filtro por data, atualizar UI |
| `src/components/admin/clients/ClientKanbanBoard.tsx` | Adicionar `cpf_cnpj` na interface |
| **Novo** `src/components/admin/clients/DatePeriodFilter.tsx` | Componente de filtro de período |

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Buscar clientes de hoje | Não possível | Clique em "Hoje" |
| Buscar clientes da semana | Não possível | Clique em "Semana" |
| Buscar clientes de Jan/2026 | Não possível | Clique em "Mês" + navegar |
| Buscar por CPF/CNPJ | Não possível | Digitar no campo de busca |
| Milhares de clientes | Lista completa sempre | Filtrado por período |

---

## Considerações

1. **Performance**: O filtro é aplicado client-side sobre os dados já carregados. Para bases muito grandes (10k+), considerar filtro server-side.

2. **Persistência**: Os filtros são resetados ao recarregar a página. Pode-se adicionar `localStorage` para persistir preferências.

3. **UX**: O filtro "Mês" trabalha em conjunto com o navegador de mês. Ao clicar em "Mês", usa o mês selecionado no navegador.

4. **Busca expandida**: Adicionado suporte para buscar por CPF/CNPJ além dos campos existentes.
