import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, CheckCircle2, XCircle, Loader2, Save, RefreshCw } from 'lucide-react';

interface AsaasSettings {
  environment: 'sandbox' | 'production';
  enabled: boolean;
}

export function IntegrationSettings() {
  const queryClient = useQueryClient();

  const { data: asaasData, isLoading: loadingAsaas } = useQuery({
    queryKey: ['system-settings', 'asaas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'asaas')
        .single();
      
      if (error) throw error;
      return data?.value as unknown as AsaasSettings;
    },
  });

  const [asaas, setAsaas] = useState<AsaasSettings>({
    environment: 'sandbox',
    enabled: false,
  });

  const [testingAsaas, setTestingAsaas] = useState(false);
  const [asaasStatus, setAsaasStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (asaasData) setAsaas(asaasData);
  }, [asaasData]);

  const saveAsaasMutation = useMutation({
    mutationFn: async (data: AsaasSettings) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.parse(JSON.stringify(data)), updated_at: new Date().toISOString() })
        .eq('key', 'asaas');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings', 'asaas'] });
      toast.success('Configurações do Asaas salvas!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    },
  });

  const testAsaasConnection = async () => {
    setTestingAsaas(true);
    setAsaasStatus('idle');
    
    try {
      // Try to invoke the create-asaas-payment function with minimal data to test connection
      const { error } = await supabase.functions.invoke('create-asaas-payment', {
        body: { test: true }
      });
      
      // If we get a validation error (not API key error), connection works
      if (error?.message?.includes('API')) {
        setAsaasStatus('error');
        toast.error('API Key do Asaas não configurada ou inválida');
      } else {
        setAsaasStatus('success');
        toast.success('Conexão com Asaas funcionando!');
      }
    } catch {
      setAsaasStatus('error');
      toast.error('Erro ao testar conexão com Asaas');
    } finally {
      setTestingAsaas(false);
    }
  };

  if (loadingAsaas) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Asaas Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              <CardTitle>Asaas - Gateway de Pagamentos</CardTitle>
            </div>
            <Badge variant={asaas.enabled ? 'default' : 'secondary'}>
              {asaas.enabled ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <CardDescription>
            Configure a integração com o gateway Asaas para processar pagamentos PIX, Boleto e Cartão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Integração</Label>
              <p className="text-sm text-muted-foreground">Habilitar processamento de pagamentos via Asaas</p>
            </div>
            <Switch
              checked={asaas.enabled}
              onCheckedChange={(checked) => setAsaas({ ...asaas, enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Ambiente</Label>
            <Select
              value={asaas.environment}
              onValueChange={(value: 'sandbox' | 'production') => setAsaas({ ...asaas, environment: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                <SelectItem value="production">Produção</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Use Sandbox para testes. A API Key deve ser configurada nas variáveis de ambiente.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={testAsaasConnection}
              disabled={testingAsaas}
            >
              {testingAsaas ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Testar Conexão
            </Button>

            {asaasStatus === 'success' && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Conectado</span>
              </div>
            )}
            {asaasStatus === 'error' && (
              <div className="flex items-center gap-1 text-destructive">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">Falha na conexão</span>
              </div>
            )}
          </div>

          <Button 
            onClick={() => saveAsaasMutation.mutate(asaas)}
            disabled={saveAsaasMutation.isPending}
          >
            {saveAsaasMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
