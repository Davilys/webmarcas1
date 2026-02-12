import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, LayoutGrid, List, RefreshCw, Users, Filter, X, Upload, Briefcase, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { ClientKanbanBoard, type ClientWithProcess, type KanbanFilters, type FunnelType } from '@/components/admin/clients/ClientKanbanBoard';
import { ClientListView } from '@/components/admin/clients/ClientListView';
import { ClientDetailSheet } from '@/components/admin/clients/ClientDetailSheet';
import { ClientImportExportDialog } from '@/components/admin/clients/ClientImportExportDialog';
import { DuplicateClientsDialog } from '@/components/admin/clients/DuplicateClientsDialog';
import { CreateClientDialog } from '@/components/admin/clients/CreateClientDialog';
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewOwnOnly, setViewOwnOnly] = useState(false);
  const [adminUsers, setAdminUsers] = useState<{ id: string; full_name: string | null; email: string }[]>([]);
  
  // NEW: Funnel type toggle - default to commercial
  const [funnelType, setFunnelType] = useState<FunnelType>('comercial');

  useEffect(() => {
    fetchCurrentUserAndPermissions();
    fetchClients();
    fetchAdminUsers();
  }, []);

  const fetchCurrentUserAndPermissions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      // Check if user has clients_own_only permission
      const { data: perms } = await supabase
        .from('admin_permissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('permission_key', 'clients_own_only');
      
      if (perms && perms.length > 0 && perms[0].can_view) {
        setViewOwnOnly(true);
      }
    }
  };

  const fetchAdminUsers = async () => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');
    
    if (roles && roles.length > 0) {
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      if (profiles) {
        setAdminUsers(profiles);
      }
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Fetch profiles with their processes
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*, client_funnel_type, created_by, assigned_to')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all processes
      const { data: processes, error: processesError } = await supabase
        .from('brand_processes')
        .select('*');

      if (processesError) throw processesError;

      // Fetch contract values to sync
      const { data: contracts } = await supabase
        .from('contracts')
        .select('user_id, contract_value, payment_method')
        .order('created_at', { ascending: false });

      // Fetch admin profiles for name resolution
      const adminIds = new Set<string>();
      for (const p of profiles || []) {
        if ((p as any).created_by) adminIds.add((p as any).created_by);
        if ((p as any).assigned_to) adminIds.add((p as any).assigned_to);
      }
      
      let adminNameMap: Record<string, string> = {};
      if (adminIds.size > 0) {
        const { data: adminProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', Array.from(adminIds));
        
        if (adminProfiles) {
          adminProfiles.forEach(a => {
            adminNameMap[a.id] = a.full_name || a.email;
          });
        }
      }

      // Build contract value map (latest contract per user)
      const contractValueMap: Record<string, { value: number; method: string | null }> = {};
      for (const c of contracts || []) {
        if (c.user_id && !contractValueMap[c.user_id] && c.contract_value) {
          contractValueMap[c.user_id] = { value: Number(c.contract_value), method: c.payment_method };
        }
      }

      // Combine profiles with their processes
      const clientsWithProcesses: ClientWithProcess[] = [];

      for (const profile of profiles || []) {
        const userProcesses = (processes || []).filter(p => p.user_id === profile.id);
        const createdByName = (profile as any).created_by ? adminNameMap[(profile as any).created_by] || null : null;
        const assignedToName = (profile as any).assigned_to ? adminNameMap[(profile as any).assigned_to] || null : null;
        // Use contract value from contracts table if available, otherwise from profile
        const contractVal = contractValueMap[profile.id]?.value || profile.contract_value;
        
        if (userProcesses.length === 0) {
          clientsWithProcesses.push({
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            company_name: profile.company_name,
            priority: profile.priority,
            origin: profile.origin,
            contract_value: contractVal,
            process_id: null,
            brand_name: null,
            business_area: null,
            pipeline_stage: (profile as any).client_funnel_type === 'comercial' ? 'assinou_contrato' : 'protocolado',
            process_status: null,
            created_at: profile.created_at || undefined,
            cpf_cnpj: profile.cpf_cnpj || undefined,
            client_funnel_type: (profile as any).client_funnel_type || 'juridico',
            created_by: (profile as any).created_by || null,
            assigned_to: (profile as any).assigned_to || null,
            created_by_name: createdByName,
            assigned_to_name: assignedToName,
          });
        } else {
          for (const process of userProcesses) {
            clientsWithProcesses.push({
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              phone: profile.phone,
              company_name: profile.company_name,
              priority: profile.priority,
              origin: profile.origin,
              contract_value: contractVal,
              process_id: process.id,
              brand_name: process.brand_name,
              business_area: process.business_area || null,
              pipeline_stage: process.pipeline_stage || ((profile as any).client_funnel_type === 'comercial' ? 'assinou_contrato' : 'protocolado'),
              process_status: process.status,
              created_at: profile.created_at || undefined,
              cpf_cnpj: profile.cpf_cnpj || undefined,
              process_number: process.process_number || undefined,
              client_funnel_type: (profile as any).client_funnel_type || 'juridico',
              created_by: (profile as any).created_by || null,
              assigned_to: (profile as any).assigned_to || null,
              created_by_name: createdByName,
              assigned_to_name: assignedToName,
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

  // Filter by own clients if restricted
  const ownFilteredClients = useMemo(() => {
    if (!viewOwnOnly || !currentUserId) return dateFilteredClients;
    return dateFilteredClients.filter(client => 
      client.created_by === currentUserId || client.assigned_to === currentUserId
    );
  }, [dateFilteredClients, viewOwnOnly, currentUserId]);

  // Filter by funnel type
  const funnelFilteredClients = useMemo(() => {
    return ownFilteredClients.filter(client => 
      (client.client_funnel_type || 'juridico') === funnelType
    );
  }, [ownFilteredClients, funnelType]);

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
        <div className="space-y-4">
          {/* Top Row: Title + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                {funnelType === 'comercial' ? (
                  <Briefcase className="h-5 w-5 text-primary" />
                ) : (
                  <Scale className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  {funnelType === 'comercial' ? 'Clientes Comercial' : 'Clientes Jurídico'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {funnelType === 'comercial' 
                    ? 'Pipeline de vendas: assinatura, pagamento e taxa' 
                    : 'Pipeline jurídico: processos INPI'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <CreateClientDialog onClientCreated={fetchClients} />
              <DuplicateClientsDialog 
                onMergeComplete={fetchClients}
                trigger={
                  <Button variant="outline" size="sm" className="h-9">
                    <Users className="h-4 w-4 mr-1.5" />
                    Duplicados
                  </Button>
                }
              />
              <Button variant="outline" size="sm" className="h-9" onClick={() => setImportExportOpen(true)}>
                <Upload className="h-4 w-4 mr-1.5" />
                Importar / Exportar
              </Button>
            </div>
          </div>

          {/* Controls Row: Funnel Toggle + Search + Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Funnel Toggle */}
            <ToggleGroup 
              type="single" 
              value={funnelType} 
              onValueChange={(v) => v && setFunnelType(v as FunnelType)}
              className="border rounded-lg p-0.5 bg-muted/40 shrink-0"
            >
              <ToggleGroupItem value="comercial" aria-label="Funil Comercial" className="text-xs px-3 h-8 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                Comercial
              </ToggleGroupItem>
              <ToggleGroupItem value="juridico" aria-label="Funil Jurídico" className="text-xs px-3 h-8 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                <Scale className="h-3.5 w-3.5 mr-1.5" />
                Jurídico
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, CPF/CNPJ, marca ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Toolbar Icons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={fetchClients} title="Atualizar">
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className={`h-9 w-9 ${(filters.priority.length > 0 || filters.origin.length > 0) ? "text-primary bg-primary/10" : ""}`}
                    title="Filtros"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Filtros</h4>
                      {(filters.priority.length > 0 || filters.origin.length > 0) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setFilters({ priority: [], origin: [] })}
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prioridade</Label>
                      <div className="space-y-1.5">
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
                              className="flex items-center gap-2 cursor-pointer text-sm"
                            >
                              <span className={`w-2 h-2 rounded-full ${option.color}`} />
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Origem</Label>
                      <div className="space-y-1.5">
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
                              className="cursor-pointer text-sm"
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

              {/* View Toggle */}
              <div className="border-l pl-1.5 ml-0.5">
                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)} className="gap-0">
                  <ToggleGroupItem value="kanban" aria-label="Kanban" className="h-9 w-9 p-0">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="Lista" className="h-9 w-9 p-0">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>

          {/* Active Filters + Date Period */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DatePeriodFilter
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
            
            {(dateFilter !== 'all' || filters.priority.length > 0 || filters.origin.length > 0) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {dateFilter !== 'all' && (
                  <Badge 
                    variant="secondary"
                    className="cursor-pointer text-xs h-6"
                    onClick={() => setDateFilter('all')}
                  >
                    {dateFilter === 'today' ? 'Hoje' : 
                     dateFilter === 'week' ? 'Semana' : 
                     format(selectedMonth, "MMM/yyyy", { locale: ptBR })}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                {filters.priority.map(p => (
                  <Badge 
                    key={p} 
                    variant="secondary"
                    className="cursor-pointer text-xs h-6"
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
                    className="cursor-pointer text-xs h-6"
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      origin: prev.origin.filter(x => x !== o) 
                    }))}
                  >
                    {ORIGIN_OPTIONS.find(opt => opt.value === o)?.label}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
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
            adminUsers={adminUsers}
            canAssign={!viewOwnOnly}
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
