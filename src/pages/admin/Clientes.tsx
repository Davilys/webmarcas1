import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Search, LayoutGrid, List, Settings, RefreshCw, Users, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { ClientKanbanBoard, type ClientWithProcess } from '@/components/admin/clients/ClientKanbanBoard';
import { ClientListView } from '@/components/admin/clients/ClientListView';
import { ClientDetailSheet } from '@/components/admin/clients/ClientDetailSheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type ViewMode = 'kanban' | 'list';

export default function AdminClientes() {
  const [clients, setClients] = useState<ClientWithProcess[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedClient, setSelectedClient] = useState<ClientWithProcess | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes por nome, empresa, email ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
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
