import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, Plus, RefreshCw, FileSignature, MoreHorizontal, 
  Eye, Trash2, Download, Send, Filter, CheckCircle, XCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContractDetailSheet } from '@/components/admin/contracts/ContractDetailSheet';
import { CreateContractDialog } from '@/components/admin/contracts/CreateContractDialog';

interface Contract {
  id: string;
  contract_number: string | null;
  subject: string | null;
  contract_value: number | null;
  start_date: string | null;
  end_date: string | null;
  signature_status: string | null;
  signed_at: string | null;
  visible_to_client: boolean | null;
  user_id: string | null;
  created_at: string | null;
  contract_type_id: string | null;
  contract_html?: string | null;
  description?: string | null;
  contract_type?: { name: string } | null;
  profile?: { full_name: string | null; phone: string | null } | null;
}

export default function AdminContratos() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [signatureFilter, setSignatureFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          contract_type:contract_types(name),
          profile:profiles(full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return;
    
    try {
      // Delete related data first (cascade should handle most, but ensure clean deletion)
      await supabase.from('contract_attachments').delete().eq('contract_id', id);
      await supabase.from('contract_comments').delete().eq('contract_id', id);
      await supabase.from('contract_notes').delete().eq('contract_id', id);
      await supabase.from('contract_tasks').delete().eq('contract_id', id);
      await supabase.from('contract_renewal_history').delete().eq('contract_id', id);
      await supabase.from('signature_audit_log').delete().eq('contract_id', id);
      await supabase.from('documents').delete().eq('contract_id', id);

      // Now delete the contract and verify it was deleted
      const { data, error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id)
        .select('id');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error('Não foi possível excluir o contrato. Verifique suas permissões.');
        return;
      }
      
      toast.success('Contrato excluído com sucesso');
      fetchContracts();
    } catch (error: any) {
      console.error('Error deleting contract:', error);
      toast.error(error.message || 'Erro ao excluir contrato');
    }
  };

  const getSignatureBadge = (status: string | null) => {
    if (status === 'signed') {
      return <Badge className="bg-emerald-600 text-white">Assinado</Badge>;
    }
    return <Badge variant="destructive">Não assinado</Badge>;
  };

  const filteredContracts = contracts.filter(contract => {
    const clientName = contract.profile?.full_name || '';
    const matchesSearch = 
      contract.contract_number?.toLowerCase().includes(search.toLowerCase()) ||
      contract.subject?.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase());
    
    const matchesSignature = 
      signatureFilter === 'all' ||
      (signatureFilter === 'signed' && contract.signature_status === 'signed') ||
      (signatureFilter === 'not_signed' && contract.signature_status !== 'signed');
    
    return matchesSearch && matchesSignature;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileSignature className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Contratos</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie contratos e assinaturas
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchContracts}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, assunto ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={signatureFilter} onValueChange={setSignatureFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar assinatura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="signed">Assinados</SelectItem>
              <SelectItem value="not_signed">Não assinados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{contracts.length}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <p className="text-sm text-muted-foreground">Assinados</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {contracts.filter(c => c.signature_status === 'signed').length}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-muted-foreground">Não assinados</p>
            </div>
            <p className="text-2xl font-bold text-destructive">
              {contracts.filter(c => c.signature_status !== 'signed').length}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-bold">
              R$ {contracts.reduce((sum, c) => sum + (c.contract_value || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo de Contrato</TableHead>
                <TableHead>Valor do Contrato</TableHead>
                <TableHead>Data de Início</TableHead>
                <TableHead>Data Final</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Nenhum contrato encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract) => (
                  <TableRow key={contract.id} className="group">
                    <TableCell className="font-medium">
                      {contract.contract_number || '-'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contract.subject || 'Sem assunto'}</p>
                        <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="hover:underline mr-2"
                            onClick={() => {
                              setSelectedContract(contract);
                              setDetailOpen(true);
                            }}
                          >
                            Ver
                          </button>
                          <button className="hover:underline mr-2">Editar</button>
                          <button 
                            className="hover:underline text-destructive"
                            onClick={() => handleDelete(contract.id)}
                          >
                            Deletar
                          </button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{contract.profile?.full_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {contract.contract_type?.name || 'Não definido'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contract.contract_value
                        ? `R$ ${contract.contract_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {contract.start_date
                        ? format(new Date(contract.start_date), 'dd-MM-yyyy', { locale: ptBR })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {contract.end_date
                        ? format(new Date(contract.end_date), 'dd-MM-yyyy', { locale: ptBR })
                        : '-'}
                    </TableCell>
                    <TableCell>{contract.profile?.phone || '-'}</TableCell>
                    <TableCell>{getSignatureBadge(contract.signature_status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedContract(contract);
                            setDetailOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar Contrato
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar para Assinatura
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(contract.id)}
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
      </div>

      {/* Contract Detail Sheet */}
      <ContractDetailSheet
        contract={selectedContract}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={fetchContracts}
      />

      {/* Create Contract Dialog */}
      <CreateContractDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchContracts}
      />
    </AdminLayout>
  );
}
