import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, FileText, CreditCard, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  cpf_cnpj: string | null;
  city: string | null;
  state: string | null;
  created_at: string | null;
}

export default function AdminClientes() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientProcesses, setClientProcesses] = useState<any[]>([]);
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar clientes');
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const fetchClientDetails = async (client: Client) => {
    setSelectedClient(client);
    
    const [processesRes, invoicesRes] = await Promise.all([
      supabase.from('brand_processes').select('*').eq('user_id', client.id),
      supabase.from('invoices').select('*').eq('user_id', client.id),
    ]);

    setClientProcesses(processesRes.data || []);
    setClientInvoices(invoicesRes.data || []);
  };

  const filteredClients = clients.filter(client =>
    client.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    client.email.toLowerCase().includes(search.toLowerCase()) ||
    client.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    client.cpf_cnpj?.includes(search)
  );

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      em_andamento: { label: 'Em Andamento', className: 'bg-orange-100 text-orange-700' },
      registrada: { label: 'Registrada', className: 'bg-green-100 text-green-700' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
      paid: { label: 'Paga', className: 'bg-green-100 text-green-700' },
    };
    const s = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.className}`}>{s.label}</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">Gerencie todos os clientes cadastrados</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Empresa</TableHead>
                  <TableHead className="hidden lg:table-cell">Cidade/UF</TableHead>
                  <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                        Carregando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.full_name || 'Sem nome'}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{client.company_name || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {client.city && client.state ? `${client.city}/${client.state}` : '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => fetchClientDetails(client)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Cliente</DialogTitle>
                            </DialogHeader>
                            {selectedClient && (
                              <div className="space-y-6">
                                {/* Client Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Nome</p>
                                    <p className="font-medium">{selectedClient.full_name || 'Sem nome'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Empresa</p>
                                    <p className="font-medium">{selectedClient.company_name || '-'}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <p>{selectedClient.email}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <p>{selectedClient.phone || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                                    <p className="font-medium">{selectedClient.cpf_cnpj || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Localização</p>
                                    <p className="font-medium">
                                      {selectedClient.city && selectedClient.state 
                                        ? `${selectedClient.city}/${selectedClient.state}` 
                                        : '-'}
                                    </p>
                                  </div>
                                </div>

                                {/* Processes */}
                                <div>
                                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                                    <FileText className="h-4 w-4" />
                                    Processos ({clientProcesses.length})
                                  </h4>
                                  {clientProcesses.length > 0 ? (
                                    <div className="space-y-2">
                                      {clientProcesses.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                          <div>
                                            <p className="font-medium">{p.brand_name}</p>
                                            <p className="text-sm text-muted-foreground">{p.process_number || 'Sem número'}</p>
                                          </div>
                                          {getStatusBadge(p.status)}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">Nenhum processo</p>
                                  )}
                                </div>

                                {/* Invoices */}
                                <div>
                                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                                    <CreditCard className="h-4 w-4" />
                                    Faturas ({clientInvoices.length})
                                  </h4>
                                  {clientInvoices.length > 0 ? (
                                    <div className="space-y-2">
                                      {clientInvoices.map((i) => (
                                        <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                          <div>
                                            <p className="font-medium">{i.description}</p>
                                            <p className="text-sm text-muted-foreground">
                                              Vence: {new Date(i.due_date).toLocaleDateString('pt-BR')}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-medium">R$ {Number(i.amount).toLocaleString('pt-BR')}</p>
                                            {getStatusBadge(i.status)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">Nenhuma fatura</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
