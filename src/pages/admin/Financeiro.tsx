import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, CreditCard, TrendingUp, Clock, CheckCircle, Wallet, QrCode, FileText, Loader2, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  invoice_url: string | null;
  pix_code: string | null;
  payment_method: string | null;
  profiles?: { full_name: string | null; email: string } | null;
  brand_processes?: { brand_name: string } | null;
}

interface Client {
  id: string;
  full_name: string | null;
  email: string;
  cpf_cnpj: string | null;
}

interface Process {
  id: string;
  brand_name: string;
  user_id: string | null;
}

type PaymentMethod = 'pix' | 'boleto' | 'cartao';
type PaymentType = 'avista' | 'parcelado';

const PAYMENT_OPTIONS = {
  pix: {
    label: 'PIX',
    icon: QrCode,
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
    description: 'Pagamento instantâneo',
  },
  boleto: {
    label: 'Boleto',
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Vencimento em 3 dias úteis',
  },
  cartao: {
    label: 'Cartão de Crédito',
    icon: CreditCard,
    color: 'text-purple-600',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'Parcelamento disponível',
  },
};

const INSTALLMENT_OPTIONS = {
  boleto: [1, 2, 3, 4, 5, 6],
  cartao: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

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
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: '',
    user_id: '',
    process_id: '',
    observation: '',
  });
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [paymentType, setPaymentType] = useState<PaymentType>('avista');
  const [installments, setInstallments] = useState(1);

  // Result state for showing PIX/Boleto info
  const [invoiceResult, setInvoiceResult] = useState<{
    success: boolean;
    invoice_url?: string;
    pix_code?: string;
    pix_qr_code?: string;
  } | null>(null);

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
    const { data } = await supabase.from('profiles').select('id, full_name, email, cpf_cnpj');
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

    const selectedClient = clients.find(c => c.id === formData.user_id);
    if (!selectedClient?.cpf_cnpj) {
      toast.error('Cliente selecionado não possui CPF/CNPJ cadastrado');
      return;
    }

    setSubmitting(true);

    try {
      const response = await supabase.functions.invoke('create-admin-invoice', {
        body: {
          user_id: formData.user_id,
          process_id: formData.process_id || null,
          description: formData.description + (formData.observation ? ` - ${formData.observation}` : ''),
          payment_method: paymentMethod,
          payment_type: paymentType,
          installments: paymentType === 'parcelado' ? installments : 1,
          total_value: parseFloat(formData.amount),
          due_date: formData.due_date,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;

      if (data.success) {
        toast.success('Fatura criada com sucesso no Asaas!');
        setInvoiceResult({
          success: true,
          invoice_url: data.invoice_url,
          pix_code: data.pix_code,
          pix_qr_code: data.pix_qr_code,
        });
        fetchInvoices();
      } else {
        throw new Error(data.error || 'Erro ao criar fatura');
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.message || 'Erro ao criar fatura');
    } finally {
      setSubmitting(false);
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
      user_id: '',
      process_id: '',
      observation: '',
    });
    setPaymentMethod('pix');
    setPaymentType('avista');
    setInstallments(1);
    setInvoiceResult(null);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Código copiado!');
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
    { title: 'Total Faturado', value: stats.total, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { title: 'Pendente', value: stats.pending, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
    { title: 'Recebido', value: stats.paid, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
    { title: 'Vencido', value: stats.overdue, icon: Wallet, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
  ];

  const getInstallmentValue = () => {
    if (!formData.amount) return 0;
    const total = parseFloat(formData.amount);
    if (paymentType === 'avista' || installments <= 1) return total;
    return Math.ceil((total / installments) * 100) / 100;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground">Gerencie faturas e pagamentos integrados ao Asaas</p>
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
            <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary/80">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Fatura
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Nova Fatura - Integração Asaas
                  </DialogTitle>
                </DialogHeader>

                <AnimatePresence mode="wait">
                  {invoiceResult?.success ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <div className="text-center p-6 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <h3 className="font-bold text-lg text-green-700 dark:text-green-300">
                          Fatura criada com sucesso!
                        </h3>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          A cobrança foi gerada no Asaas
                        </p>
                      </div>

                      {invoiceResult.pix_code && (
                        <div className="space-y-3">
                          <Label>Código PIX Copia e Cola</Label>
                          <div className="flex gap-2">
                            <Input 
                              value={invoiceResult.pix_code} 
                              readOnly 
                              className="text-xs font-mono"
                            />
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => copyToClipboard(invoiceResult.pix_code!)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {invoiceResult.pix_qr_code && (
                        <div className="flex justify-center">
                          <img 
                            src={`data:image/png;base64,${invoiceResult.pix_qr_code}`} 
                            alt="QR Code PIX"
                            className="w-48 h-48 border rounded-lg"
                          />
                        </div>
                      )}

                      {invoiceResult.invoice_url && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => window.open(invoiceResult.invoice_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir Fatura no Asaas
                        </Button>
                      )}

                      <Button 
                        className="w-full" 
                        onClick={() => handleDialogClose(false)}
                      >
                        Fechar
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      onSubmit={handleSubmit}
                      className="space-y-5"
                    >
                      {/* Client Selection */}
                      <div>
                        <Label className="text-sm font-medium">Cliente *</Label>
                        <Select 
                          value={formData.user_id} 
                          onValueChange={(v) => setFormData({ ...formData, user_id: v, process_id: '' })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                <div className="flex items-center gap-2">
                                  <span>{c.full_name || c.email}</span>
                                  {!c.cpf_cnpj && (
                                    <Badge variant="destructive" className="text-[10px]">Sem CPF</Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Process Selection */}
                      {formData.user_id && clientProcesses.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Processo (opcional)</Label>
                          <Select 
                            value={formData.process_id} 
                            onValueChange={(v) => setFormData({ ...formData, process_id: v })}
                          >
                            <SelectTrigger className="mt-1">
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

                      {/* Description */}
                      <div>
                        <Label className="text-sm font-medium">Descrição *</Label>
                        <Input
                          className="mt-1"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Ex: Honorários de Registro de Marca"
                        />
                      </div>

                      {/* Value and Due Date */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Valor Total (R$) *</Label>
                          <Input
                            className="mt-1"
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="699.00"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Vencimento *</Label>
                          <Input
                            className="mt-1"
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Payment Method Selection */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Forma de Pagamento *</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {(Object.keys(PAYMENT_OPTIONS) as PaymentMethod[]).map((method) => {
                            const config = PAYMENT_OPTIONS[method];
                            const Icon = config.icon;
                            const isSelected = paymentMethod === method;

                            return (
                              <motion.button
                                key={method}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setPaymentMethod(method);
                                  if (method === 'pix') {
                                    setPaymentType('avista');
                                    setInstallments(1);
                                  }
                                }}
                                className={cn(
                                  "p-4 rounded-xl border-2 transition-all text-left",
                                  isSelected
                                    ? `${config.bg} border-current ${config.color} shadow-md`
                                    : "border-muted bg-muted/30 hover:bg-muted/50"
                                )}
                              >
                                <Icon className={cn("h-6 w-6 mb-2", isSelected ? config.color : "text-muted-foreground")} />
                                <p className={cn("font-medium text-sm", isSelected ? config.color : "text-foreground")}>
                                  {config.label}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {config.description}
                                </p>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Payment Type (À Vista / Parcelado) */}
                      {paymentMethod !== 'pix' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <Label className="text-sm font-medium mb-3 block">Tipo de Pagamento</Label>
                          <RadioGroup
                            value={paymentType}
                            onValueChange={(v) => {
                              setPaymentType(v as PaymentType);
                              if (v === 'avista') setInstallments(1);
                              else setInstallments(2);
                            }}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="avista" id="avista" />
                              <Label htmlFor="avista" className="cursor-pointer">À Vista</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="parcelado" id="parcelado" />
                              <Label htmlFor="parcelado" className="cursor-pointer">Parcelado</Label>
                            </div>
                          </RadioGroup>
                        </motion.div>
                      )}

                      {/* Installments Selection */}
                      {paymentMethod !== 'pix' && paymentType === 'parcelado' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <Label className="text-sm font-medium mb-2 block">Número de Parcelas</Label>
                          <Select
                            value={installments.toString()}
                            onValueChange={(v) => setInstallments(parseInt(v))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INSTALLMENT_OPTIONS[paymentMethod].map((n) => (
                                <SelectItem key={n} value={n.toString()}>
                                  {n}x de R$ {getInstallmentValue().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  {n === 1 && ' (À Vista)'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </motion.div>
                      )}

                      {/* Summary */}
                      {formData.amount && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-4 bg-muted/50 rounded-xl border space-y-2"
                        >
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Método:</span>
                            <span className="font-medium">{PAYMENT_OPTIONS[paymentMethod].label}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Parcelas:</span>
                            <span className="font-medium">
                              {paymentMethod === 'pix' ? '1x (À Vista)' : `${installments}x`}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm border-t pt-2">
                            <span className="text-muted-foreground">Valor por parcela:</span>
                            <span className="font-bold text-lg">
                              R$ {getInstallmentValue().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {/* Observation */}
                      <div>
                        <Label className="text-sm font-medium">Observação (opcional)</Label>
                        <Textarea
                          className="mt-1"
                          value={formData.observation}
                          onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                          placeholder="Observações adicionais sobre a cobrança..."
                          rows={2}
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => handleDialogClose(false)}
                          disabled={submitting}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={submitting}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Criando no Asaas...
                            </>
                          ) : (
                            <>
                              <Wallet className="h-4 w-4 mr-2" />
                              Criar Fatura
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn("transition-all hover:shadow-md", stat.bg)}>
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
            </motion.div>
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
                  <TableHead className="hidden md:table-cell">Forma Pgto</TableHead>
                  <TableHead className="hidden lg:table-cell">Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                        Carregando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {invoice.payment_method || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {invoice.invoice_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.invoice_url!, '_blank')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        {invoice.pix_code && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(invoice.pix_code!)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => updateStatus(invoice.id, 'paid')}
                            className="text-green-600 hover:text-green-700"
                          >
                            Pago
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
