import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Users,
  FileText,
  UserPlus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Zap,
  Link,
  Database,
  Settings,
  ArrowLeftRight,
} from 'lucide-react';

interface SyncStats {
  total: number;
  imported?: number;
  updated?: number;
  exported?: number;
  errors: number;
}

interface SyncResult {
  success: boolean;
  message: string;
  stats?: SyncStats;
  error?: string;
}

export default function IntegracaoPerfex() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [syncing, setSyncing] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Record<string, SyncResult>>({});
  const [progress, setProgress] = useState(0);

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const { data, error } = await supabase.functions.invoke('sync-perfex', {
        body: { action: 'test_connection' }
      });

      if (error) throw error;

      if (data.success) {
        setConnectionStatus('connected');
        toast.success(data.message);
      } else {
        setConnectionStatus('error');
        toast.error(data.message);
      }
    } catch (error: unknown) {
      setConnectionStatus('error');
      toast.error(`Erro ao testar conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const runSync = async (action: string, label: string) => {
    setSyncing(action);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const { data, error } = await supabase.functions.invoke('sync-perfex', {
        body: { action }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      setLastSync(prev => ({ ...prev, [action]: data }));

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error: unknown) {
      clearInterval(progressInterval);
      toast.error(`Erro na sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setLastSync(prev => ({ 
        ...prev, 
        [action]: { success: false, message: 'Erro na sincronização', error: String(error) } 
      }));
    } finally {
      setSyncing(null);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const syncCards = [
    {
      id: 'customers',
      title: 'Clientes',
      description: 'Sincronizar dados de clientes entre os sistemas',
      icon: Users,
      importAction: 'import_customers',
      exportAction: 'export_customers',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'leads',
      title: 'Leads',
      description: 'Sincronizar prospects e leads de vendas',
      icon: UserPlus,
      importAction: 'import_leads',
      exportAction: 'export_leads',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      id: 'contracts',
      title: 'Contratos',
      description: 'Sincronizar contratos e propostas comerciais',
      icon: FileText,
      importAction: 'import_contracts',
      exportAction: 'export_contracts',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="h-6 w-6 text-primary" />
              </div>
              Integração Perfex CRM
            </h1>
            <p className="text-muted-foreground mt-1">
              Sincronize dados bidirecionalmente com sua instância do Perfex CRM
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={connectionStatus === 'testing'}
              className="gap-2"
            >
              {connectionStatus === 'testing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : connectionStatus === 'connected' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : connectionStatus === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Link className="h-4 w-4" />
              )}
              {connectionStatus === 'testing' ? 'Testando...' : 
               connectionStatus === 'connected' ? 'Conectado' :
               connectionStatus === 'error' ? 'Erro na Conexão' : 'Testar Conexão'}
            </Button>
            
            <Button 
              onClick={() => runSync('full_sync', 'Sincronização Completa')}
              disabled={syncing !== null}
              className="gap-2"
            >
              {syncing === 'full_sync' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Sincronização Completa
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {syncing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sincronizando...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </motion.div>
        )}

        {/* Connection Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Status da Conexão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`h-3 w-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                connectionStatus === 'error' ? 'bg-red-500' :
                connectionStatus === 'testing' ? 'bg-yellow-500 animate-pulse' :
                'bg-gray-300'
              }`} />
              <div>
                <p className="font-medium">
                  {connectionStatus === 'connected' ? 'Conexão estabelecida com o Perfex CRM' :
                   connectionStatus === 'error' ? 'Falha na conexão. Verifique as credenciais.' :
                   connectionStatus === 'testing' ? 'Testando conexão...' :
                   'Clique em "Testar Conexão" para verificar'}
                </p>
                <p className="text-sm text-muted-foreground">
                  As credenciais estão configuradas nos secrets do projeto
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {syncCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                      <CardDescription className="text-xs">{card.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runSync(card.importAction, `Importar ${card.title}`)}
                      disabled={syncing !== null}
                      className="gap-1.5"
                    >
                      {syncing === card.importAction ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                      )}
                      Importar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runSync(card.exportAction, `Exportar ${card.title}`)}
                      disabled={syncing !== null}
                      className="gap-1.5"
                    >
                      {syncing === card.exportAction ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowUpFromLine className="h-3.5 w-3.5" />
                      )}
                      Exportar
                    </Button>
                  </div>
                  
                  {/* Last sync result */}
                  {(lastSync[card.importAction] || lastSync[card.exportAction]) && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Última sincronização:</p>
                      {lastSync[card.importAction] && (
                        <div className="flex items-center gap-2 text-xs">
                          <ArrowDownToLine className="h-3 w-3" />
                          <span className={lastSync[card.importAction].success ? 'text-green-600' : 'text-red-600'}>
                            {lastSync[card.importAction].message}
                          </span>
                        </div>
                      )}
                      {lastSync[card.exportAction] && (
                        <div className="flex items-center gap-2 text-xs mt-1">
                          <ArrowUpFromLine className="h-3 w-3" />
                          <span className={lastSync[card.exportAction].success ? 'text-green-600' : 'text-red-600'}>
                            {lastSync[card.exportAction].message}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Sync Direction Legend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Direção da Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <ArrowDownToLine className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium">Importar (Perfex → Sistema)</p>
                  <p className="text-sm text-muted-foreground">
                    Traz dados do Perfex CRM para este sistema. Registros existentes são atualizados, novos são criados quando possível.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <ArrowUpFromLine className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Exportar (Sistema → Perfex)</p>
                  <p className="text-sm text-muted-foreground">
                    Envia dados deste sistema para o Perfex CRM. Apenas registros não vinculados são enviados.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Informações sobre a Sincronização
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>A sincronização de clientes vincula registros pelo email ou ID do Perfex</li>
                  <li>Leads são identificados pelo email para evitar duplicatas</li>
                  <li>Contratos são vinculados aos clientes sincronizados pelo perfex_customer_id</li>
                  <li>Novos usuários no sistema precisam ser criados manualmente (por segurança)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
