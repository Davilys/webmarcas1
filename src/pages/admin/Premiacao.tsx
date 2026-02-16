import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Trophy, Plus, Users, TrendingUp, Target, DollarSign, FileText, Megaphone,
  CreditCard, ChevronLeft, ChevronRight, Pencil, Trash2, BarChart3, Award
} from 'lucide-react';

// ---- Types ----
interface AwardEntry {
  id: string;
  entry_type: 'registro_marca' | 'publicacao' | 'cobranca';
  client_name: string;
  brand_name: string | null;
  responsible_user_id: string;
  entry_date: string;
  observations: string | null;
  brand_quantity: number | null;
  payment_type: string | null;
  publication_type: string | null;
  pub_quantity: number | null;
  installments_paid: number | null;
  total_resolved_value: number | null;
  payment_date: string | null;
  payment_form: string | null;
  created_at: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
}

// ---- Calculation helpers ----
function calcRegistroMarcaPremium(entries: AwardEntry[]): number {
  const totalBrands = entries.reduce((s, e) => s + (e.brand_quantity || 1), 0);
  const metaAtingida = totalBrands >= 30;
  let total = 0;

  // Sort by date to apply meta sequentially
  const sorted = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  let accumulated = 0;

  for (const entry of sorted) {
    const qty = entry.brand_quantity || 1;
    for (let i = 0; i < qty; i++) {
      accumulated++;
      if (accumulated <= 30) {
        total += 50;
      } else {
        total += entry.payment_type === 'avista' ? 100 : 50;
      }
    }
  }
  return total;
}

function calcPublicacaoPremium(entries: AwardEntry[]): number {
  const totalPubs = entries.reduce((s, e) => s + (e.pub_quantity || 1), 0);
  const rate = totalPubs >= 50 ? 100 : 50;
  return totalPubs * rate;
}

function calcCobrancaPremium(entries: AwardEntry[]): number {
  let total = 0;
  for (const entry of entries) {
    if (!entry.total_resolved_value || !entry.installments_paid || entry.installments_paid === 0) continue;
    const perInstallment = entry.total_resolved_value / entry.installments_paid;
    let rate = 0;
    if (perInstallment >= 199 && perInstallment <= 397) rate = 10;
    else if (perInstallment >= 398 && perInstallment <= 597) rate = 25;
    else if (perInstallment >= 598 && perInstallment <= 999) rate = 50;
    else if (perInstallment >= 1000 && perInstallment <= 1500) rate = 75;
    else if (perInstallment > 1518) rate = 100;
    total += rate * entry.installments_paid;
  }
  return total;
}

// ---- Main Component ----
export default function Premiacao() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filterUser, setFilterUser] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AwardEntry | null>(null);

  // Form state
  const [formType, setFormType] = useState<'registro_marca' | 'publicacao' | 'cobranca'>('registro_marca');
  const [formClientName, setFormClientName] = useState('');
  const [formBrandName, setFormBrandName] = useState('');
  const [formBrandQty, setFormBrandQty] = useState(1);
  const [formPaymentType, setFormPaymentType] = useState('avista');
  const [formPubType, setFormPubType] = useState('deferimento');
  const [formPubQty, setFormPubQty] = useState(1);
  const [formInstallments, setFormInstallments] = useState(1);
  const [formResolvedValue, setFormResolvedValue] = useState('');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formObs, setFormObs] = useState('');
  const [formResponsible, setFormResponsible] = useState('');

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Fetch team members (admins)
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['award-team-members'],
    queryFn: async () => {
      const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
      if (!roles || roles.length === 0) return [];
      const ids = roles.map(r => r.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', ids);
      return (profiles || []) as TeamMember[];
    },
  });

  // Fetch entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['award-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('award_entries')
        .select('*')
        .order('entry_date', { ascending: false });
      if (error) throw error;
      return data as AwardEntry[];
    },
  });

  // Filter entries by month and user
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const d = new Date(e.entry_date);
      const inMonth = isWithinInterval(d, { start: monthStart, end: monthEnd });
      const matchUser = filterUser === 'all' || e.responsible_user_id === filterUser;
      return inMonth && matchUser;
    });
  }, [entries, monthStart, monthEnd, filterUser]);

  const registroEntries = filteredEntries.filter(e => e.entry_type === 'registro_marca');
  const publicacaoEntries = filteredEntries.filter(e => e.entry_type === 'publicacao');
  const cobrancaEntries = filteredEntries.filter(e => e.entry_type === 'cobranca');

  const totalRegistroPremium = calcRegistroMarcaPremium(registroEntries);
  const totalPublicacaoPremium = calcPublicacaoPremium(publicacaoEntries);
  const totalCobrancaPremium = calcCobrancaPremium(cobrancaEntries);
  const totalPremium = totalRegistroPremium + totalPublicacaoPremium + totalCobrancaPremium;
  const totalBrands = registroEntries.reduce((s, e) => s + (e.brand_quantity || 1), 0);
  const totalPubs = publicacaoEntries.reduce((s, e) => s + (e.pub_quantity || 1), 0);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingEntry) {
        const { error } = await supabase.from('award_entries').update(data as any).eq('id', editingEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('award_entries').insert(data as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['award-entries'] });
      toast.success(editingEntry ? 'Registro atualizado!' : 'Registro criado!');
      resetForm();
      setDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('award_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['award-entries'] });
      toast.success('Registro excluído!');
    },
  });

  function resetForm() {
    setFormClientName('');
    setFormBrandName('');
    setFormBrandQty(1);
    setFormPaymentType('avista');
    setFormPubType('deferimento');
    setFormPubQty(1);
    setFormInstallments(1);
    setFormResolvedValue('');
    setFormDate(format(new Date(), 'yyyy-MM-dd'));
    setFormObs('');
    setFormResponsible('');
    setEditingEntry(null);
  }

  function openEdit(entry: AwardEntry) {
    setEditingEntry(entry);
    setFormType(entry.entry_type);
    setFormClientName(entry.client_name);
    setFormBrandName(entry.brand_name || '');
    setFormBrandQty(entry.brand_quantity || 1);
    setFormPaymentType(entry.payment_type || 'avista');
    setFormPubType(entry.publication_type || 'deferimento');
    setFormPubQty(entry.pub_quantity || 1);
    setFormInstallments(entry.installments_paid || 1);
    setFormResolvedValue(String(entry.total_resolved_value || ''));
    setFormDate(entry.entry_date);
    setFormObs(entry.observations || '');
    setFormResponsible(entry.responsible_user_id);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formClientName.trim()) return toast.error('Nome do cliente é obrigatório');
    
    const { data: { user } } = await supabase.auth.getUser();
    const responsibleId = formResponsible || user?.id;
    if (!responsibleId) return toast.error('Usuário não encontrado');

    const base: Record<string, unknown> = {
      entry_type: formType,
      client_name: formClientName.trim(),
      brand_name: formBrandName.trim() || null,
      responsible_user_id: responsibleId,
      entry_date: formDate,
      observations: formObs.trim() || null,
      created_by: user?.id,
    };

    if (formType === 'registro_marca') {
      base.brand_quantity = formBrandQty;
      base.payment_type = formPaymentType;
    } else if (formType === 'publicacao') {
      base.publication_type = formPubType;
      base.pub_quantity = formPubQty;
    } else {
      base.installments_paid = formInstallments;
      base.total_resolved_value = parseFloat(formResolvedValue) || 0;
    }

    saveMutation.mutate(base);
  }

  function getUserName(userId: string) {
    return teamMembers.find(m => m.id === userId)?.full_name || 'Desconhecido';
  }

  // Per-user stats for Equipe tab
  const perUserStats = useMemo(() => {
    const map = new Map<string, { registro: number; publicacao: number; cobranca: number; premium: number }>();
    for (const member of teamMembers) {
      const userEntries = filteredEntries.filter(e => e.responsible_user_id === member.id);
      const reg = userEntries.filter(e => e.entry_type === 'registro_marca');
      const pub = userEntries.filter(e => e.entry_type === 'publicacao');
      const cob = userEntries.filter(e => e.entry_type === 'cobranca');
      map.set(member.id, {
        registro: reg.reduce((s, e) => s + (e.brand_quantity || 1), 0),
        publicacao: pub.reduce((s, e) => s + (e.pub_quantity || 1), 0),
        cobranca: cob.length,
        premium: calcRegistroMarcaPremium(reg) + calcPublicacaoPremium(pub) + calcCobrancaPremium(cob),
      });
    }
    return map;
  }, [teamMembers, filteredEntries]);

  // Month navigation
  const MonthNav = () => (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="font-medium text-sm min-w-[140px] text-center">
        {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
      </span>
      <Button variant="outline" size="icon" onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  // Entry form dialog
  const EntryFormDialog = () => (
    <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingEntry ? 'Editar Registro' : 'Novo Cadastro'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tipo</Label>
            <Select value={formType} onValueChange={(v) => setFormType(v as typeof formType)} disabled={!!editingEntry}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="registro_marca">Registro de Marca</SelectItem>
                <SelectItem value="publicacao">Publicação</SelectItem>
                <SelectItem value="cobranca">Cobrança / Devedores</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nome do Cliente *</Label>
            <Input value={formClientName} onChange={e => setFormClientName(e.target.value)} placeholder="Nome do cliente" />
          </div>

          <div>
            <Label>Responsável</Label>
            <Select value={formResponsible} onValueChange={setFormResponsible}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {teamMembers.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data</Label>
            <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
          </div>

          {formType === 'registro_marca' && (
            <>
              <div>
                <Label>Nome da Marca</Label>
                <Input value={formBrandName} onChange={e => setFormBrandName(e.target.value)} />
              </div>
              <div>
                <Label>Qtd. Marcas/Classes</Label>
                <Input type="number" min={1} value={formBrandQty} onChange={e => setFormBrandQty(Number(e.target.value))} />
              </div>
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={formPaymentType} onValueChange={setFormPaymentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avista">À Vista</SelectItem>
                    <SelectItem value="parcelado">Parcelado</SelectItem>
                    <SelectItem value="promocao">Promoção / Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {formType === 'publicacao' && (
            <>
              <div>
                <Label>Nome da Marca</Label>
                <Input value={formBrandName} onChange={e => setFormBrandName(e.target.value)} />
              </div>
              <div>
                <Label>Tipo de Publicação</Label>
                <Select value={formPubType} onValueChange={setFormPubType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exigencia_merito">Exigência de Mérito</SelectItem>
                    <SelectItem value="recurso">Recurso</SelectItem>
                    <SelectItem value="notificacao_extrajudicial">Notificação Extrajudicial</SelectItem>
                    <SelectItem value="oposicao">Oposição</SelectItem>
                    <SelectItem value="deferimento">Deferimento</SelectItem>
                    <SelectItem value="indeferimento">Indeferimento</SelectItem>
                    <SelectItem value="codigo_003">Código 003</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input type="number" min={1} value={formPubQty} onChange={e => setFormPubQty(Number(e.target.value))} />
              </div>
            </>
          )}

          {formType === 'cobranca' && (
            <>
              <div>
                <Label>Parcelas Pagas</Label>
                <Input type="number" min={1} value={formInstallments} onChange={e => setFormInstallments(Number(e.target.value))} />
              </div>
              <div>
                <Label>Valor Total Resolvido (R$)</Label>
                <Input type="number" step="0.01" value={formResolvedValue} onChange={e => setFormResolvedValue(e.target.value)} placeholder="0.00" />
              </div>
            </>
          )}

          <div>
            <Label>Observações</Label>
            <Textarea value={formObs} onChange={e => setFormObs(e.target.value)} />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Salvando...' : editingEntry ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Table for entries
  const EntriesTable = ({ type, data }: { type: string; data: AwardEntry[] }) => (
    <div className="rounded-lg border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            {type !== 'cobranca' && <TableHead>Marca</TableHead>}
            {type === 'registro_marca' && <TableHead>Qtd</TableHead>}
            {type === 'registro_marca' && <TableHead>Pagamento</TableHead>}
            {type === 'publicacao' && <TableHead>Tipo</TableHead>}
            {type === 'publicacao' && <TableHead>Qtd</TableHead>}
            {type === 'cobranca' && <TableHead>Parcelas</TableHead>}
            {type === 'cobranca' && <TableHead>Valor</TableHead>}
            <TableHead>Responsável</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum registro</TableCell></TableRow>
          ) : data.map(entry => (
            <TableRow key={entry.id}>
              <TableCell>{format(new Date(entry.entry_date), 'dd/MM/yyyy')}</TableCell>
              <TableCell className="font-medium">{entry.client_name}</TableCell>
              {type !== 'cobranca' && <TableCell>{entry.brand_name || '-'}</TableCell>}
              {type === 'registro_marca' && <TableCell>{entry.brand_quantity}</TableCell>}
              {type === 'registro_marca' && (
                <TableCell>
                  <Badge variant={entry.payment_type === 'avista' ? 'default' : 'secondary'}>
                    {entry.payment_type === 'avista' ? 'À Vista' : entry.payment_type === 'parcelado' ? 'Parcelado' : 'Promoção'}
                  </Badge>
                </TableCell>
              )}
              {type === 'publicacao' && (
                <TableCell className="capitalize">{(entry.publication_type || '').replace(/_/g, ' ')}</TableCell>
              )}
              {type === 'publicacao' && <TableCell>{entry.pub_quantity}</TableCell>}
              {type === 'cobranca' && <TableCell>{entry.installments_paid}</TableCell>}
              {type === 'cobranca' && (
                <TableCell>R$ {(entry.total_resolved_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
              )}
              <TableCell className="text-xs">{getUserName(entry.responsible_user_id)}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(entry)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                    if (confirm('Excluir registro?')) deleteMutation.mutate(entry.id);
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-7 w-7 text-amber-500" />
              Premiação
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Sistema de premiação e metas da equipe</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <MonthNav />
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os usuários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {teamMembers.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Novo Cadastro
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Dashboard</TabsTrigger>
            <TabsTrigger value="registro" className="gap-1.5"><FileText className="h-4 w-4" /> Registro de Marca</TabsTrigger>
            <TabsTrigger value="publicacao" className="gap-1.5"><Megaphone className="h-4 w-4" /> Publicação</TabsTrigger>
            <TabsTrigger value="cobranca" className="gap-1.5"><CreditCard className="h-4 w-4" /> Cobrança</TabsTrigger>
            <TabsTrigger value="equipe" className="gap-1.5"><Users className="h-4 w-4" /> Equipe</TabsTrigger>
          </TabsList>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-500" /> Premiação Total</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-emerald-600">R$ {totalPremium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500" /> Marcas Registradas</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalBrands}</p>
                  <p className="text-xs text-muted-foreground">Meta: 30 | {totalBrands >= 30 ? '✅ Atingida' : `Faltam ${30 - totalBrands}`}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Megaphone className="h-4 w-4 text-purple-500" /> Publicações</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalPubs}</p>
                  <p className="text-xs text-muted-foreground">Meta: 50 | {totalPubs >= 50 ? '✅ Atingida' : `Faltam ${50 - totalPubs}`}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><CreditCard className="h-4 w-4 text-orange-500" /> Cobranças</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{cobrancaEntries.length}</p>
                  <p className="text-xs text-muted-foreground">Prêmio: R$ {totalCobrancaPremium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Premiação Registro de Marca</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-blue-600">R$ {totalRegistroPremium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <p>Antes da meta (30): R$ 50/marca</p>
                    <p>Após meta à vista: R$ 100/marca</p>
                    <p>Parcelado: sempre R$ 50/marca</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Premiação Publicação</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-purple-600">R$ {totalPublicacaoPremium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <p>Até 49: R$ 50 cada</p>
                    <p>50 ou mais: R$ 100 cada</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Premiação Cobrança</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-orange-600">R$ {totalCobrancaPremium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <p>R$199-397/parcela: R$10</p>
                    <p>R$398-597: R$25 | R$598-999: R$50</p>
                    <p>R$1000-1500: R$75 | +R$1518: R$100</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* REGISTRO DE MARCA TAB */}
          <TabsContent value="registro" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Registro de Marca</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{totalBrands} marcas</Badge>
                <Badge variant={totalBrands >= 30 ? 'default' : 'secondary'}>
                  {totalBrands >= 30 ? 'Meta atingida ✅' : `${totalBrands}/30`}
                </Badge>
              </div>
            </div>
            <EntriesTable type="registro_marca" data={registroEntries} />
          </TabsContent>

          {/* PUBLICAÇÃO TAB */}
          <TabsContent value="publicacao" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Publicações</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{totalPubs} publicações</Badge>
                <Badge variant={totalPubs >= 50 ? 'default' : 'secondary'}>
                  {totalPubs >= 50 ? 'Meta atingida ✅' : `${totalPubs}/50`}
                </Badge>
              </div>
            </div>
            <EntriesTable type="publicacao" data={publicacaoEntries} />
          </TabsContent>

          {/* COBRANÇA TAB */}
          <TabsContent value="cobranca" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Cobrança / Devedores</h2>
              <Badge variant="outline">{cobrancaEntries.length} registros</Badge>
            </div>
            <EntriesTable type="cobranca" data={cobrancaEntries} />
          </TabsContent>

          {/* EQUIPE TAB */}
          <TabsContent value="equipe" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Desempenho da Equipe</h2>
              <Badge variant="outline">{teamMembers.length} colaboradores</Badge>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Premiação Geral</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-emerald-600">R$ {totalPremium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Produção Total</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{totalBrands + totalPubs + cobrancaEntries.length} registros</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Colaboradores Ativos</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{teamMembers.length}</p></CardContent>
              </Card>
            </div>

            {/* Team kanban-style cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map(member => {
                const stats = perUserStats.get(member.id);
                if (!stats) return null;
                return (
                  <Card key={member.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setFilterUser(member.id); setActiveTab('dashboard'); }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{member.full_name || member.email}</CardTitle>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold text-blue-600">{stats.registro}</p>
                          <p className="text-[10px] text-muted-foreground">Marcas</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-purple-600">{stats.publicacao}</p>
                          <p className="text-[10px] text-muted-foreground">Publicações</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-orange-600">{stats.cobranca}</p>
                          <p className="text-[10px] text-muted-foreground">Cobranças</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-sm font-semibold text-emerald-600">
                          Prêmio: R$ {stats.premium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <EntryFormDialog />
    </AdminLayout>
  );
}
