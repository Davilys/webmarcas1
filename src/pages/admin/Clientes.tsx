import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Search, LayoutGrid, List, Settings, RefreshCw, Users, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { ClientKanbanBoard, type ClientWithProcess, type KanbanFilters } from '@/components/admin/clients/ClientKanbanBoard';
import { ClientListView } from '@/components/admin/clients/ClientListView';
import { ClientDetailSheet } from '@/components/admin/clients/ClientDetailSheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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

  useEffect(() => {
    fetchClients();
  }, []);

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
      </div>
    </AdminLayout>
  );
}
