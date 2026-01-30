import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Search, LayoutGrid, List, Settings, RefreshCw, Users, Filter, X, Upload, Briefcase, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { ClientKanbanBoard, type ClientWithProcess, type KanbanFilters, type FunnelType } from '@/components/admin/clients/ClientKanbanBoard';
import { ClientListView } from '@/components/admin/clients/ClientListView';
import { ClientDetailSheet } from '@/components/admin/clients/ClientDetailSheet';
import { ClientImportExportDialog } from '@/components/admin/clients/ClientImportExportDialog';
import { DuplicateClientsDialog } from '@/components/admin/clients/DuplicateClientsDialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DatePeriodFilter, type DateFilterType } from '@/components/admin/clients/DatePeriodFilter';
import { startOfDay, startOfWeek, startOfMonth, endOfMonth, endOfDay, isWithinInterval, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ViewMode = 'kanban' | 'list';

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'Alta', color: 'bg-red-500' },
  { value: 'medium', label: 'Média', color: 'bg-yellow-500' },
  { value: 'low', label: 'Baixa', color: 'bg-green-500' },
];

const ORIGIN_OPTIONS = [
  { value: 'site', label: 'Site', color: 'border-blue-500 text-blue-600' },
  { value: 'whatsapp', label: 'WhatsApp', color: 'border-green-500 text-green-600' },
];

export default function AdminClientes() {
  const [clients, setClients] = useState<ClientWithProcess[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedClient, setSelectedClient] = useState<ClientWithProcess | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filters, setFilters] = useState<KanbanFilters>({ priority: [], origin: [] });
  const [filterOpen, setFilterOpen] = useState(false);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  // NEW: Funnel type toggle - default to commercial
  const [funnelType, setFunnelType] = useState<FunnelType>('comercial');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Fetch profiles with their processes (including client_funnel_type)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*, client_funnel_type')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all processes
      const { data: processes, error: processesError } = await supabase
        .from('brand_processes')
        .select('*');

      if (processesError) throw processesError;

      // Combine profiles with their processes
      const clientsWithProcesses: ClientWithProcess[] = [];

      for (const profile of profiles || []) {
        const userProcesses = (processes || []).filter(p => p.user_id === profile.id);
        
        if (userProcesses.length === 0) {
          // Client without process
          clientsWithProcesses.push({
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            company_name: profile.company_name,
            priority: profile.priority,
            origin: profile.origin,
            contract_value: profile.contract_value,
            process_id: null,
            brand_name: null,
            business_area: null,
            pipeline_stage: (profile as any).client_funnel_type === 'comercial' ? 'assinou_contrato' : 'protocolado',
            process_status: null,
            created_at: profile.created_at || undefined,
            cpf_cnpj: profile.cpf_cnpj || undefined,
            client_funnel_type: (profile as any).client_funnel_type || 'juridico'
          });
        } else {
          // One entry per process
          for (const process of userProcesses) {
            clientsWithProcesses.push({
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              phone: profile.phone,
              company_name: profile.company_name,
              priority: profile.priority,
              origin: profile.origin,
              contract_value: profile.contract_value,
              process_id: process.id,
              brand_name: process.brand_name,
              business_area: process.business_area || null,
              pipeline_stage: process.pipeline_stage || ((profile as any).client_funnel_type === 'comercial' ? 'assinou_contrato' : 'protocolado'),
              process_status: process.status,
              created_at: profile.created_at || undefined,
              cpf_cnpj: profile.cpf_cnpj || undefined,
              process_number: process.process_number || undefined,
              client_funnel_type: (profile as any).client_funnel_type || 'juridico'
            });
          }
        }
      }

      setClients(clientsWithProcesses);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleClientClick = (client: ClientWithProcess) => {
    setSelectedClient(client);
    setDetailOpen(true);
  };

  // Filter by date period
  const dateFilteredClients = useMemo(() => {
    if (dateFilter === 'all') return clients;
    
    const now = new Date();
    
    return clients.filter(client => {
      if (!client.created_at) return true;
      
      const createdAt = parseISO(client.created_at);
      
      switch (dateFilter) {
        case 'today':
          return isWithinInterval(createdAt, {
            start: startOfDay(now),
            end: endOfDay(now)
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
  }, [clients, dateFilter, selectedMonth]);

  // Filter by funnel type
  const funnelFilteredClients = useMemo(() => {
    return dateFilteredClients.filter(client => 
      (client.client_funnel_type || 'juridico') === funnelType
    );
  }, [dateFilteredClients, funnelType]);

  // Filter by search (name, email, cpf/cnpj, phone, brand, company)
  const filteredClients = funnelFilteredClients.filter(client =>
    client.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    client.email.toLowerCase().includes(search.toLowerCase()) ||
    client.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    client.brand_name?.toLowerCase().includes(search.toLowerCase()) ||
    client.phone?.includes(search) ||
    client.cpf_cnpj?.includes(search)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {funnelType === 'comercial' ? (
                  <Briefcase className="h-6 w-6 text-primary" />
                ) : (
                  <Scale className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">
                    {funnelType === 'comercial' ? 'CLIENTES COMERCIAL' : 'CLIENTES JURÍDICO'}
                  </h1>
                  {/* Funnel Toggle */}
                  <ToggleGroup 
                    type="single" 
                    value={funnelType} 
                    onValueChange={(v) => v && setFunnelType(v as FunnelType)}
                    className="border rounded-lg p-1"
                  >
                    <ToggleGroupItem value="comercial" aria-label="Funil Comercial" className="text-xs px-3">
                      <Briefcase className="h-3 w-3 mr-1" />
                      Comercial
                    </ToggleGroupItem>
                    <ToggleGroupItem value="juridico" aria-label="Funil Jurídico" className="text-xs px-3">
                      <Scale className="h-3 w-3 mr-1" />
                      Jurídico
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <p className="text-sm text-muted-foreground">
                  {funnelType === 'comercial' 
                    ? 'Pipeline de vendas: assinatura, pagamento e taxa' 
                    : 'Pipeline jurídico: processos INPI'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DuplicateClientsDialog 
                onMergeComplete={fetchClients}
                trigger={
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Duplicados
                  </Button>
                }
              />
              <Button variant="outline" onClick={() => setImportExportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar / Exportar
              </Button>
              <Button variant="outline" size="icon" onClick={fetchClients}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {/* Filter Popover */}
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className={(filters.priority.length > 0 || filters.origin.length > 0) ? "border-primary text-primary" : ""}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Filtros</h4>
                      {(filters.priority.length > 0 || filters.origin.length > 0) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setFilters({ priority: [], origin: [] })}
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                    
                    {/* Priority Filters */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Prioridade</Label>
                      <div className="space-y-2">
                        {PRIORITY_OPTIONS.map((option) => (
                          <div key={option.value} className="flex items-center gap-2">
                            <Checkbox
                              id={`priority-${option.value}`}
                              checked={filters.priority.includes(option.value)}
                              onCheckedChange={(checked) => {
                                setFilters(prev => ({
                                  ...prev,
                                  priority: checked
                                    ? [...prev.priority, option.value]
                                    : prev.priority.filter(p => p !== option.value)
                                }));
                              }}
                            />
                            <Label 
                              htmlFor={`priority-${option.value}`}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <span className={`w-2 h-2 rounded-full ${option.color}`} />
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Origin Filters */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Origem</Label>
                      <div className="space-y-2">
                        {ORIGIN_OPTIONS.map((option) => (
                          <div key={option.value} className="flex items-center gap-2">
                            <Checkbox
                              id={`origin-${option.value}`}
                              checked={filters.origin.includes(option.value)}
                              onCheckedChange={(checked) => {
                                setFilters(prev => ({
                                  ...prev,
                                  origin: checked
                                    ? [...prev.origin, option.value]
                                    : prev.origin.filter(o => o !== option.value)
                                }));
                              }}
                            />
                            <Label 
                              htmlFor={`origin-${option.value}`}
                              className="cursor-pointer"
                            >
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, empresa, email, CPF/CNPJ, marca ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Period Filters + Active Filters + View Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <DatePeriodFilter
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Active Date Filter Badge */}
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
              
              {/* Active Priority/Origin Filters */}
              {filters.priority.map(p => (
                <Badge 
                  key={p} 
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    priority: prev.priority.filter(x => x !== p) 
                  }))}
                >
                  {PRIORITY_OPTIONS.find(o => o.value === p)?.label}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {filters.origin.map(o => (
                <Badge 
                  key={o} 
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    origin: prev.origin.filter(x => x !== o) 
                  }))}
                >
                  {ORIGIN_OPTIONS.find(opt => opt.value === o)?.label}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}

              {/* View Toggle */}
              <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
                <ToggleGroupItem value="kanban" aria-label="Visualização Kanban">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Kanban
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="Visualização Lista">
                  <List className="h-4 w-4 mr-2" />
                  Lista
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'kanban' ? (
          <ClientKanbanBoard
            clients={filteredClients}
            onClientClick={handleClientClick}
            onRefresh={fetchClients}
            filters={filters}
            funnelType={funnelType}
          />
        ) : (
          <ClientListView
            clients={filteredClients}
            loading={loading}
            onClientClick={handleClientClick}
          />
        )}

        {/* Client Detail Sheet */}
        <ClientDetailSheet
          client={selectedClient}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onUpdate={fetchClients}
        />

        {/* Import/Export Dialog */}
        <ClientImportExportDialog
          open={importExportOpen}
          onOpenChange={setImportExportOpen}
          clients={clients.map(c => ({
            id: c.id,
            full_name: c.full_name,
            email: c.email,
            phone: c.phone,
            company_name: c.company_name,
            origin: c.origin,
            priority: c.priority,
            contract_value: c.contract_value,
          }))}
          onImportComplete={fetchClients}
        />
      </div>
    </AdminLayout>
  );
}
