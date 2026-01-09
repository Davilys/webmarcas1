import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientLayout } from '@/components/cliente/ClientLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CreditCard, 
  Receipt, 
  AlertCircle, 
  CheckCircle,
  ExternalLink,
  Copy,
  QrCode,
  FileText,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { User } from '@supabase/supabase-js';

interface Invoice {
  id: string;
  description: string;
  amount: number;
  status: string;
  due_date: string;
  payment_date: string | null;
  invoice_url: string | null;
  boleto_code: string | null;
  pix_code: string | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
  pending: { label: 'Pendente', variant: 'secondary', icon: Clock },
  confirmed: { label: 'Confirmado', variant: 'default', icon: CheckCircle },
  paid: { label: 'Pago', variant: 'default', icon: CheckCircle },
  received: { label: 'Pago', variant: 'default', icon: CheckCircle },
  overdue: { label: 'Vencido', variant: 'destructive', icon: AlertCircle },
  refunded: { label: 'Reembolsado', variant: 'outline', icon: AlertCircle },
  canceled: { label: 'Cancelado', variant: 'outline', icon: AlertCircle },
};

export default function Financeiro() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate('/cliente/login');
        } else {
          setUser(session.user);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/cliente/login');
      } else {
        setUser(session.user);
        fetchInvoices(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchInvoices = async (userId: string) => {
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: false });

    setInvoices((data as Invoice[]) || []);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado para a área de transferência`);
  };

  const pendingInvoices = invoices.filter(i => ['pending', 'overdue'].includes(i.status));
  const paidInvoices = invoices.filter(i => ['received', 'confirmed', 'paid'].includes(i.status));

  const totalPending = pendingInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaid = paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);

  const InvoiceCard = ({ invoice }: { invoice: Invoice }) => {
    const config = statusConfig[invoice.status] || statusConfig.pending;
    const StatusIcon = config.icon;
    const isPending = ['pending', 'overdue'].includes(invoice.status);

    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
            {/* Info Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{invoice.description}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Vencimento: {formatDate(invoice.due_date)}
                    {invoice.payment_date && ` • Pago em: ${formatDate(invoice.payment_date)}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount & Status */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-right">
                <p className="font-semibold text-lg">{formatCurrency(Number(invoice.amount))}</p>
                <Badge variant={config.variant} className="mt-1">
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions Section for Pending Invoices */}
          {isPending && (
            <div className="border-t bg-muted/30 p-3 flex flex-wrap gap-2">
              {/* Botão principal - Ver Fatura / Pagar */}
              {invoice.invoice_url && (
                <Button size="sm" asChild className="flex-1 sm:flex-none">
                  <a href={invoice.invoice_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver Fatura / Pagar
                  </a>
                </Button>
              )}

              {/* Botão PIX */}
              {invoice.pix_code && (
                <Dialog open={pixDialogOpen && selectedInvoice?.id === invoice.id} onOpenChange={(open) => {
                  setPixDialogOpen(open);
                  if (open) setSelectedInvoice(invoice);
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                      <QrCode className="mr-2 h-4 w-4" />
                      Pagar com PIX
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Pagamento via PIX</DialogTitle>
                      <DialogDescription>
                        Copie o código PIX abaixo e cole no aplicativo do seu banco
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-xs font-mono break-all">{invoice.pix_code}</p>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => copyToClipboard(invoice.pix_code!, 'Código PIX')}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Código PIX
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Botão Boleto */}
              {invoice.boleto_code && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  asChild
                >
                  <a href={invoice.boleto_code} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Boleto
                  </a>
                </Button>
              )}

              {/* Fallback - se não tiver nenhuma opção de pagamento */}
              {!invoice.invoice_url && !invoice.pix_code && !invoice.boleto_code && (
                <p className="text-xs text-muted-foreground w-full">
                  Entre em contato com o suporte para obter o link de pagamento.
                </p>
              )}
            </div>
          )}

          {/* Paid Invoice - Show payment date */}
          {!isPending && invoice.payment_date && (
            <div className="border-t bg-green-50 dark:bg-green-900/10 p-3">
              <p className="text-xs text-green-700 dark:text-green-400 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Pago em {formatDate(invoice.payment_date)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie suas faturas e pagamentos
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Total Pendente
              </CardDescription>
              <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">
                {formatCurrency(totalPending)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {pendingInvoices.length} fatura(s) pendente(s)
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Total Pago
              </CardDescription>
              <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalPaid)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {paidInvoices.length} fatura(s) paga(s)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pendentes
              {pendingInvoices.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingInvoices.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="paid" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Pagas
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Todas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {loading ? (
              <LoadingSkeleton />
            ) : pendingInvoices.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
                  <h3 className="font-medium text-lg">Tudo em dia!</h3>
                  <p className="text-muted-foreground text-center">
                    Você não possui faturas pendentes no momento.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingInvoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} />
              ))
            )}
          </TabsContent>

          <TabsContent value="paid" className="space-y-4">
            {loading ? (
              <LoadingSkeleton />
            ) : paidInvoices.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">Nenhuma fatura paga</h3>
                  <p className="text-muted-foreground text-center">
                    Suas faturas pagas aparecerão aqui.
                  </p>
                </CardContent>
              </Card>
            ) : (
              paidInvoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <LoadingSkeleton />
            ) : invoices.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">Nenhuma fatura encontrada</h3>
                  <p className="text-muted-foreground text-center">
                    Suas faturas aparecerão aqui quando disponíveis.
                  </p>
                </CardContent>
              </Card>
            ) : (
              invoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
}
