import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Process {
  id: string;
  brand_name: string;
  process_number: string | null;
  status: string | null;
  user_id: string | null;
  business_area: string | null;
  deposit_date: string | null;
  next_step: string | null;
  notes: string | null;
  created_at: string | null;
  profiles?: { full_name: string | null; email: string } | null;
}

interface Client {
  id: string;
  full_name: string | null;
  email: string;
}

const statusOptions = [
  { value: 'aguardando_pagamento', label: 'Aguardando Pagamento' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'exigencia', label: 'Exigência' },
  { value: 'publicado_rpi', label: 'Publicado RPI' },
  { value: 'deferido', label: 'Deferido' },
  { value: 'registrada', label: 'Registrada' },
  { value: 'indeferida', label: 'Indeferida' },
  { value: 'arquivada', label: 'Arquivada' },
];

export default function AdminProcessos() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [formData, setFormData] = useState({
    brand_name: '',
    process_number: '',
    status: 'em_andamento',
    user_id: '',
    business_area: '',
    next_step: '',
    notes: '',
  });

  useEffect(() => {
    fetchProcesses();
    fetchClients();
  }, []);

  const fetchProcesses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('brand_processes')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar processos');
    } else {
      setProcesses(data || []);
    }
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, email');
    setClients(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.brand_name || !formData.user_id) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const processData = {
      brand_name: formData.brand_name,
      process_number: formData.process_number || null,
      status: formData.status,
      user_id: formData.user_id,
      business_area: formData.business_area || null,
      next_step: formData.next_step || null,
      notes: formData.notes || null,
    };

    if (editingProcess) {
      const { error } = await supabase
        .from('brand_processes')
        .update(processData)
        .eq('id', editingProcess.id);

      if (error) {
        toast.error('Erro ao atualizar processo');
      } else {
        toast.success('Processo atualizado com sucesso');
        fetchProcesses();
        setDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from('brand_processes').insert(processData);

      if (error) {
        toast.error('Erro ao criar processo');
      } else {
        toast.success('Processo criado com sucesso');
        fetchProcesses();
        setDialogOpen(false);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      brand_name: '',
      process_number: '',
      status: 'em_andamento',
      user_id: '',
      business_area: '',
      next_step: '',
      notes: '',
    });
    setEditingProcess(null);
  };

  const openEditDialog = (process: Process) => {
    setEditingProcess(process);
    setFormData({
      brand_name: process.brand_name,
      process_number: process.process_number || '',
      status: process.status || 'em_andamento',
      user_id: process.user_id || '',
      business_area: process.business_area || '',
      next_step: process.next_step || '',
      notes: process.notes || '',
    });
    setDialogOpen(true);
  };

  const filteredProcesses = processes.filter(p =>
    p.brand_name.toLowerCase().includes(search.toLowerCase()) ||
    p.process_number?.includes(search) ||
    (p.profiles as any)?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      aguardando_pagamento: { label: 'Aguardando Pagamento', className: 'bg-yellow-100 text-yellow-700' },
      em_andamento: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-700' },
      exigencia: { label: 'Exigência', className: 'bg-orange-100 text-orange-700' },
      publicado_rpi: { label: 'Publicado RPI', className: 'bg-purple-100 text-purple-700' },
      deferido: { label: 'Deferido', className: 'bg-emerald-100 text-emerald-700' },
      registrada: { label: 'Registrada', className: 'bg-green-100 text-green-700' },
      indeferida: { label: 'Indeferida', className: 'bg-red-100 text-red-700' },
      arquivada: { label: 'Arquivada', className: 'bg-gray-100 text-gray-700' },
    };
    const s = statusMap[status || ''] || { label: status || 'Desconhecido', className: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.className}`}>{s.label}</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Processos</h1>
            <p className="text-muted-foreground">Gerencie todos os processos de registro de marca</p>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por marca, número, cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingProcess ? 'Editar Processo' : 'Novo Processo'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Nome da Marca *</Label>
                      <Input
                        value={formData.brand_name}
                        onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                        placeholder="Ex: WebMarcas"
                      />
                    </div>
                    <div>
                      <Label>Número do Processo</Label>
                      <Input
                        value={formData.process_number}
                        onChange={(e) => setFormData({ ...formData, process_number: e.target.value })}
                        placeholder="Ex: 123456789"
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Cliente *</Label>
                      <Select value={formData.user_id} onValueChange={(v) => setFormData({ ...formData, user_id: v })}>
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
                    <div className="col-span-2">
                      <Label>Ramo de Atividade</Label>
                      <Input
                        value={formData.business_area}
                        onChange={(e) => setFormData({ ...formData, business_area: e.target.value })}
                        placeholder="Ex: Tecnologia"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Próxima Etapa</Label>
                      <Input
                        value={formData.next_step}
                        onChange={(e) => setFormData({ ...formData, next_step: e.target.value })}
                        placeholder="Ex: Aguardando publicação RPI"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Observações</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Notas internas sobre o processo..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingProcess ? 'Salvar' : 'Criar Processo'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Criado em</TableHead>
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
                ) : filteredProcesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum processo encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProcesses.map((process) => (
                    <TableRow key={process.id}>
                      <TableCell className="font-medium">{process.brand_name}</TableCell>
                      <TableCell>{process.process_number || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {(process.profiles as any)?.full_name || (process.profiles as any)?.email || '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(process.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {process.created_at ? new Date(process.created_at).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(process)}>
                          <Edit className="h-4 w-4" />
                        </Button>
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
