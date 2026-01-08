import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, CreditCard, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: string | null;
  payment_date: string | null;
  user_id: string | null;
  process_id: string | null;
  created_at: string | null;
  profiles?: { full_name: string | null; email: string } | null;
  brand_processes?: { brand_name: string } | null;
}

interface Client {
  id: string;
  full_name: string | null;
  email: string;
}

interface Process {
  id: string;
  brand_name: string;
  user_id: string | null;
}

const statusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Paga' },
  { value: 'overdue', label: 'Vencida' },
  { value: 'cancelled', label: 'Cancelada' },
];

export default function AdminFinanceiro() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: '',
    status: 'pending',
    user_id: '',
    process_id: '',
  });

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
  });

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchProcesses();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('*, profiles(full_name, email), brand_processes(brand_name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar faturas');
    } else {
      const inv = data || [];
      setInvoices(inv);

      setStats({
        total: inv.reduce((sum, i) => sum + Number(i.amount), 0),
        pending: inv.filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.amount), 0),
        paid: inv.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0),
        overdue: inv.filter(i => i.status === 'overdue').reduce((sum, i) => sum + Number(i.amount), 0),
      });
    }
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, email');
    setClients(data || []);
  };

  const fetchProcesses = async () => {
    const { data } = await supabase.from('brand_processes').select('id, brand_name, user_id');
    setProcesses(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.amount || !formData.due_date || !formData.user_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const { error } = await supabase.from('invoices').insert({
      description: formData.description,
      amount: parseFloat(formData.amount),
      due_date: formData.due_date,
      status: formData.status,
      user_id: formData.user_id,
      process_id: formData.process_id || null,
    });

    if (error) {
      toast.error('Erro ao criar fatura');
    } else {
      toast.success('Fatura criada com sucesso');
      fetchInvoices();
      setDialogOpen(false);
      resetForm();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const updateData: any = { status };
    if (status === 'paid') {
      updateData.payment_date = new Date().toISOString().split('T')[0];
    }

    const { error } = await supabase.from('invoices').update(updateData).eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success('Status atualizado');
      fetchInvoices();
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      due_date: '',
      status: 'pending',
      user_id: '',
      process_id: '',
    });
  };

  const filteredInvoices = invoices.filter(i =>
    i.description.toLowerCase().includes(search.toLowerCase()) ||
    (i.profiles as any)?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
      paid: { label: 'Paga', className: 'bg-green-100 text-green-700' },
      overdue: { label: 'Vencida', className: 'bg-red-100 text-red-700' },
      cancelled: { label: 'Cancelada', className: 'bg-gray-100 text-gray-700' },
    };
    const s = statusMap[status || ''] || { label: status || 'Desconhecido', className: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.className}`}>{s.label}</span>;
  };

  const clientProcesses = processes.filter(p => p.user_id === formData.user_id);

  const statCards = [
    { title: 'Total Faturado', value: stats.total, icon: TrendingUp, color: 'text-blue-500' },
    { title: 'Pendente', value: stats.pending, icon: Clock, color: 'text-yellow-500' },
    { title: 'Recebido', value: stats.paid, icon: CheckCircle, color: 'text-green-500' },
    { title: 'Vencido', value: stats.overdue, icon: CreditCard, color: 'text-red-500' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground">Gerencie faturas e pagamentos</p>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Fatura
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nova Fatura</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Cliente *</Label>
                    <Select value={formData.user_id} onValueChange={(v) => setFormData({ ...formData, user_id: v, process_id: '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.full_name || c.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.user_id && clientProcesses.length > 0 && (
                    <div>
                      <Label>Processo (opcional)</Label>
                      <Select value={formData.process_id} onValueChange={(v) => setFormData({ ...formData, process_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Vincular a um processo" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientProcesses.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.brand_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>Descrição *</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Honorários de Registro"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Valor (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="699.00"
                      />
                    </div>
                    <div>
                      <Label>Vencimento *</Label>
                      <Input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Criar Fatura</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-xl font-bold mt-1">
                      R$ {stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Valor</TableHead>
                  <TableHead className="hidden lg:table-cell">Vencimento</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma fatura encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.description}</TableCell>
                      <TableCell>{(invoice.profiles as any)?.full_name || (invoice.profiles as any)?.email || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        R$ {Number(invoice.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => updateStatus(invoice.id, 'paid')}
                            className="text-green-600 hover:text-green-700"
                          >
                            Marcar Pago
                          </Button>
                        )}
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
