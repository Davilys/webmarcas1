import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Search, LayoutGrid, List, Settings, RefreshCw, Users, Filter, X, Upload, Download, Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ClientKanbanBoard, type ClientWithProcess, type KanbanFilters } from '@/components/admin/clients/ClientKanbanBoard';
import { ClientListView } from '@/components/admin/clients/ClientListView';
import { ClientDetailSheet } from '@/components/admin/clients/ClientDetailSheet';
import { ClientImportExportDialog } from '@/components/admin/clients/ClientImportExportDialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type ViewMode = 'kanban' | 'list';

interface PerfexCustomer {
  id: string;
  perfex_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  cpf_cnpj: string | null;
  active: boolean;
  synced_profile_id: string | null;
  created_at: string;
}

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
  const [perfexCustomers, setPerfexCustomers] = useState<PerfexCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncingPerfex, setSyncingPerfex] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedClient, setSelectedClient] = useState<ClientWithProcess | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filters, setFilters] = useState<KanbanFilters>({ priority: [], origin: [] });
  const [filterOpen, setFilterOpen] = useState(false);
  const [importExportOpen, setImportExportOpen] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchPerfexCustomers();
  }, []);

  const fetchPerfexCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('perfex_customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPerfexCustomers(data || []);
    } catch (error) {
      console.error('Error fetching Perfex customers:', error);
    }
  };

  const syncWithPerfex = async () => {
    setSyncingPerfex(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-perfex', {
        body: { action: 'import_customers' }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || 'Clientes importados do Perfex com sucesso!');
        await Promise.all([fetchClients(), fetchPerfexCustomers()]);
      } else {
        throw new Error(data?.message || 'Erro na sincronização');
      }
    } catch (error) {
      console.error('Error syncing with Perfex:', error);
      toast.error('Erro ao sincronizar com Perfex');
    } finally {
      setSyncingPerfex(false);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Fetch profiles with their processes
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
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
            pipeline_stage: 'protocolado',
            process_status: null
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
              pipeline_stage: process.pipeline_stage || 'protocolado',
              process_status: process.status
            });
          }
        }
      }

      // Add Perfex customers that are NOT linked to a profile
      const { data: unlinkedPerfexCustomers } = await supabase
        .from('perfex_customers')
        .select('*')
        .is('synced_profile_id', null);

      for (const perfexCustomer of unlinkedPerfexCustomers || []) {
        clientsWithProcesses.push({
          id: perfexCustomer.id,
          full_name: perfexCustomer.full_name,
          email: perfexCustomer.email || '',
          phone: perfexCustomer.phone,
          company_name: perfexCustomer.company_name,
          priority: 'medium',
          origin: 'perfex',
          contract_value: 0,
          process_id: null,
          brand_name: null,
          pipeline_stage: 'protocolado',
          process_status: null,
          isPerfexOnly: true,
          perfexId: perfexCustomer.perfex_id,
        } as ClientWithProcess & { isPerfexOnly?: boolean; perfexId?: string });
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

  const filteredClients = clients.filter(client =>
    client.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    client.email.toLowerCase().includes(search.toLowerCase()) ||
    client.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    client.brand_name?.toLowerCase().includes(search.toLowerCase()) ||
    client.phone?.includes(search)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">CLIENTES JURÍDICO</h1>
                <p className="text-sm text-muted-foreground">
                  Pipeline padrão para gerenciamento do relacionamento com clientes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={syncWithPerfex}
                disabled={syncingPerfex}
              >
                {syncingPerfex ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Sync Perfex
              </Button>
              <Button variant="outline" onClick={() => setImportExportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar / Exportar
              </Button>
              <Button variant="outline" size="icon" onClick={() => { fetchClients(); fetchPerfexCustomers(); }}>
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

          {/* Search and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes por nome, empresa, email ou telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Active Filters */}
              {(filters.priority.length > 0 || filters.origin.length > 0) && (
                <div className="flex items-center gap-1 flex-wrap">
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
                </div>
              )}
            </div>

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

        {/* Content */}
        {viewMode === 'kanban' ? (
          <ClientKanbanBoard
            clients={filteredClients}
            onClientClick={handleClientClick}
            onRefresh={fetchClients}
            filters={filters}
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
