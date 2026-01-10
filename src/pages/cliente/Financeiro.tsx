import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientLayout } from '@/components/cliente/ClientLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  CreditCard, 
  Receipt, 
  AlertCircle, 
  CheckCircle,
  ExternalLink,
  Copy,
  QrCode,
  FileText,
  Clock,
  Calendar,
  Download,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';

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
  payment_method: string | null;
  created_at: string | null;
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
      <Card 
        className="overflow-hidden hover:shadow-md transition-all cursor-pointer border-l-4"
        style={{ borderLeftColor: isPending ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}
        onClick={() => setSelectedInvoice(invoice)}
      >
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
              <Eye className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
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

  // Invoice Detail Sheet Content
  const InvoiceDetailSheet = () => {
    if (!selectedInvoice) return null;
    
    const config = statusConfig[selectedInvoice.status] || statusConfig.pending;
    const StatusIcon = config.icon;
    const isPending = ['pending', 'overdue'].includes(selectedInvoice.status);
    const isPaid = ['received', 'confirmed', 'paid'].includes(selectedInvoice.status);

    return (
      <Sheet open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Detalhes da Fatura
            </SheetTitle>
            <SheetDescription>
              {selectedInvoice.description}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <Badge variant={config.variant} className="text-sm px-3 py-1">
                <StatusIcon className="h-4 w-4 mr-2" />
                {config.label}
              </Badge>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(Number(selectedInvoice.amount))}
              </span>
            </div>

            <Separator />

            {/* Invoice Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Vencimento
                  </p>
                  <p className="font-medium">{formatDate(selectedInvoice.due_date)}</p>
                </div>
                
                {selectedInvoice.payment_date && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Data do Pagamento
                    </p>
                    <p className="font-medium">{formatDate(selectedInvoice.payment_date)}</p>
                  </div>
                )}

                {selectedInvoice.created_at && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Criada em</p>
                    <p className="font-medium">{formatDate(selectedInvoice.created_at)}</p>
                  </div>
                )}

                {selectedInvoice.payment_method && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Método</p>
                    <p className="font-medium capitalize">{selectedInvoice.payment_method}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Payment Options for Pending */}
            {isPending && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Opções de Pagamento</h4>
                
                {/* PIX Section */}
                {selectedInvoice.pix_code && (
                  <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <QrCode className="h-5 w-5" />
                        <span className="font-semibold">Pagar com PIX</span>
                      </div>
                      
                      {/* QR Code */}
                      <div className="flex justify-center bg-white p-4 rounded-lg">
                        <QRCodeSVG 
                          value={selectedInvoice.pix_code} 
                          size={180}
                          level="H"
                          includeMargin
                        />
                      </div>

                      {/* Pix Code */}
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Código PIX (Copia e Cola)</p>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs font-mono break-all line-clamp-3">
                            {selectedInvoice.pix_code}
                          </p>
                        </div>
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => copyToClipboard(selectedInvoice.pix_code!, 'Código PIX')}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar Código PIX
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Boleto Button */}
                {selectedInvoice.boleto_code && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    asChild
                  >
                    <a href={selectedInvoice.boleto_code} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      Visualizar Boleto
                    </a>
                  </Button>
                )}

                {/* Main Payment Link */}
                {selectedInvoice.invoice_url && (
                  <Button className="w-full" asChild>
                    <a href={selectedInvoice.invoice_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver Fatura Completa / Pagar
                    </a>
                  </Button>
                )}

                {/* Fallback */}
                {!selectedInvoice.invoice_url && !selectedInvoice.pix_code && !selectedInvoice.boleto_code && (
                  <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardContent className="p-4">
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Entre em contato com o suporte para obter o link de pagamento.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Paid Invoice Info */}
            {isPaid && (
              <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Pagamento Confirmado</span>
                  </div>
                  {selectedInvoice.payment_date && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-500">
                      Pagamento realizado em {formatDate(selectedInvoice.payment_date)}
                    </p>
                  )}
                  
                  {/* Download/View Receipt */}
                  {selectedInvoice.invoice_url && (
                    <Button className="w-full" variant="outline" asChild>
                      <a href={selectedInvoice.invoice_url} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Ver Comprovante
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie suas faturas e pagamentos. Clique em uma fatura para ver detalhes.
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

        {/* Invoice Detail Sheet */}
        <InvoiceDetailSheet />
      </div>
    </ClientLayout>
  );
}
