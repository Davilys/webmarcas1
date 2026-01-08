import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientLayout } from '@/components/cliente/ClientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Receipt, 
  AlertCircle, 
  CheckCircle,
  ExternalLink,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
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

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  confirmed: { label: 'Confirmado', variant: 'default' },
  received: { label: 'Pago', variant: 'default' },
  overdue: { label: 'Vencido', variant: 'destructive' },
  refunded: { label: 'Reembolsado', variant: 'outline' },
  canceled: { label: 'Cancelado', variant: 'outline' },
};

export default function Financeiro() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

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
  const paidInvoices = invoices.filter(i => ['received', 'confirmed'].includes(i.status));

  const totalPending = pendingInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaid = paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);

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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendente
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(totalPending)}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingInvoices.length} fatura(s) pendente(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pago
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </div>
              <p className="text-xs text-muted-foreground">
                {paidInvoices.length} fatura(s) paga(s)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Faturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">
                  Pendentes ({pendingInvoices.length})
                </TabsTrigger>
                <TabsTrigger value="paid">
                  Pagas ({paidInvoices.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  Todas ({invoices.length})
                </TabsTrigger>
              </TabsList>

              {['pending', 'paid', 'all'].map((tab) => {
                const filteredInvoices = 
                  tab === 'pending' ? pendingInvoices :
                  tab === 'paid' ? paidInvoices : invoices;

                return (
                  <TabsContent key={tab} value={tab}>
                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                        ))}
                      </div>
                    ) : filteredInvoices.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma fatura encontrada</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredInvoices.map((invoice) => {
                          const status = statusConfig[invoice.status] || statusConfig.pending;
                          return (
                            <div
                              key={invoice.id}
                              className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border gap-4"
                            >
                              <div className="space-y-1">
                                <p className="font-medium">{invoice.description}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>Vencimento: {formatDate(invoice.due_date)}</span>
                                  {invoice.payment_date && (
                                    <span>• Pago em: {formatDate(invoice.payment_date)}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-lg font-bold">
                                    {formatCurrency(Number(invoice.amount))}
                                  </p>
                                  <Badge variant={status.variant}>{status.label}</Badge>
                                </div>

                                {['pending', 'overdue'].includes(invoice.status) && (
                                  <div className="flex gap-2">
                                    {invoice.invoice_url && (
                                      <Button size="sm" asChild>
                                        <a href={invoice.invoice_url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="mr-2 h-4 w-4" />
                                          Pagar
                                        </a>
                                      </Button>
                                    )}
                                    {invoice.pix_code && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(invoice.pix_code!, 'PIX')}
                                      >
                                        <Copy className="mr-2 h-4 w-4" />
                                        PIX
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
