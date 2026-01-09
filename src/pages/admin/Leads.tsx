import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, RefreshCw, UserPlus, MoreHorizontal, UserCheck, FileSignature, Trash2, Edit, Eye, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  cpf_cnpj: string | null;
  status: string;
  origin: string | null;
  estimated_value: number | null;
  notes: string | null;
  created_at: string;
  converted_at: string | null;
}

const STATUS_OPTIONS = [
  { value: 'novo', label: 'Novo', color: 'bg-blue-500' },
  { value: 'contato', label: 'Em Contato', color: 'bg-yellow-500' },
  { value: 'qualificado', label: 'Qualificado', color: 'bg-green-500' },
  { value: 'proposta', label: 'Proposta Enviada', color: 'bg-purple-500' },
  { value: 'negociacao', label: 'Em Negociação', color: 'bg-orange-500' },
  { value: 'perdido', label: 'Perdido', color: 'bg-red-500' },
  { value: 'convertido', label: 'Convertido', color: 'bg-emerald-600' },
];

const ORIGIN_OPTIONS = [
  { value: 'site', label: 'Site' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'import', label: 'Importação' },
  { value: 'outro', label: 'Outro' },
];

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    cpf_cnpj: '',
    status: 'novo',
    origin: 'site',
    estimated_value: '',
    notes: '',
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const leadData = {
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        company_name: formData.company_name || null,
        cpf_cnpj: formData.cpf_cnpj || null,
        status: formData.status,
        origin: formData.origin,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        notes: formData.notes || null,
      };

      if (editingLead) {
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', editingLead.id);
        if (error) throw error;
        toast.success('Lead atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('leads')
          .insert(leadData);
        if (error) throw error;
        toast.success('Lead criado com sucesso');
      }

      setDialogOpen(false);
      resetForm();
      fetchLeads();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error('Erro ao salvar lead');
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      company_name: '',
      cpf_cnpj: '',
      status: 'novo',
      origin: 'site',
      estimated_value: '',
      notes: '',
    });
    setEditingLead(null);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      full_name: lead.full_name,
      email: lead.email || '',
      phone: lead.phone || '',
      company_name: lead.company_name || '',
      cpf_cnpj: lead.cpf_cnpj || '',
      status: lead.status,
      origin: lead.origin || 'site',
      estimated_value: lead.estimated_value?.toString() || '',
      notes: lead.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      toast.success('Lead excluído');
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao excluir lead');
    }
  };

  const handleConvertToClient = async (lead: Lead) => {
    try {
      // Create profile for the client
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          email: lead.email || `lead_${lead.id}@temp.com`,
          full_name: lead.full_name,
          phone: lead.phone,
          company_name: lead.company_name,
          cpf_cnpj: lead.cpf_cnpj,
          origin: lead.origin,
          contract_value: lead.estimated_value,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Update lead as converted
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: 'convertido',
          converted_at: new Date().toISOString(),
          converted_to_client_id: profile.id,
        })
        .eq('id', lead.id);

      if (leadError) throw leadError;

      toast.success('Lead convertido em cliente com sucesso!');
      fetchLeads();
    } catch (error) {
      console.error('Error converting lead:', error);
      toast.error('Erro ao converter lead');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <Badge className={`${statusOption?.color || 'bg-gray-500'} text-white`}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase()) ||
      lead.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search);
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Leads</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie seus leads e converta em clientes
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchLeads}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingLead ? 'Editar Lead' : 'Novo Lead'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nome Completo *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Empresa</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                      <Input
                        id="cpf_cnpj"
                        value={formData.cpf_cnpj}
                        onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimated_value">Valor Estimado</Label>
                      <Input
                        id="estimated_value"
                        type="number"
                        step="0.01"
                        value={formData.estimated_value}
                        onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="origin">Origem</Label>
                      <Select
                        value={formData.origin}
                        onValueChange={(value) => setFormData({ ...formData, origin: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORIGIN_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingLead ? 'Salvar' : 'Criar Lead'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Valor Estimado</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum lead encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.full_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {lead.email && <div>{lead.email}</div>}
                        {lead.phone && <div className="text-muted-foreground">{lead.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{lead.company_name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ORIGIN_OPTIONS.find(o => o.value === lead.origin)?.label || lead.origin}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.estimated_value
                        ? `R$ ${lead.estimated_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(lead.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(lead)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {lead.status !== 'convertido' && (
                            <DropdownMenuItem onClick={() => handleConvertToClient(lead)}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Converter em Cliente
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDelete(lead.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total de Leads</p>
            <p className="text-2xl font-bold">{leads.length}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Novos</p>
            <p className="text-2xl font-bold text-blue-600">
              {leads.filter(l => l.status === 'novo').length}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Em Negociação</p>
            <p className="text-2xl font-bold text-orange-600">
              {leads.filter(l => l.status === 'negociacao').length}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Convertidos</p>
            <p className="text-2xl font-bold text-emerald-600">
              {leads.filter(l => l.status === 'convertido').length}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
