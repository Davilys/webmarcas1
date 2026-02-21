import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, Mail, Server, Check, Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface EmailAccount {
  id: string;
  email_address: string;
  display_name: string | null;
  provider: string;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_password: string | null;
  imap_host: string | null;
  imap_port: number | null;
  is_default: boolean;
}

export function EmailSettings() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null); // null | 'form' | account_id
  const [form, setForm] = useState({
    email_address: '',
    display_name: '',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    imap_host: 'imap.gmail.com',
    imap_port: 993,
  });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['email-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmailAccount[];
    },
  });

  const addAccount = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('email_accounts').insert({
        user_id: user.id,
        email_address: form.email_address,
        display_name: form.display_name || null,
        provider: 'smtp',
        smtp_host: form.smtp_host,
        smtp_port: form.smtp_port,
        smtp_user: form.smtp_user,
        smtp_password: form.smtp_password,
        imap_host: form.imap_host || null,
        imap_port: form.imap_port || 993,
        is_default: !accounts || accounts.length === 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Conta de email adicionada!');
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      setIsAdding(false);
      setForm({
        email_address: '',
        display_name: '',
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: '',
        smtp_password: '',
        imap_host: 'imap.gmail.com',
        imap_port: 993,
      });
    },
    onError: () => {
      toast.error('Erro ao adicionar conta');
    },
  });

  const setDefault = useMutation({
    mutationFn: async (accountId: string) => {
      // First, set all accounts to non-default
      await supabase
        .from('email_accounts')
        .update({ is_default: false })
        .neq('id', accountId);

      // Then set the selected account as default
      const { error } = await supabase
        .from('email_accounts')
        .update({ is_default: true })
        .eq('id', accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Conta padrão atualizada!');
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
    },
    onError: () => {
      toast.error('Erro ao definir conta padrão');
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Conta removida!');
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
    },
    onError: () => {
      toast.error('Erro ao remover conta');
    },
  });

  const testConnection = async (config: { smtp_host: string; smtp_port: number; smtp_user: string; smtp_password: string; imap_host?: string | null; imap_port?: number | null; email_address: string }, id: string) => {
    setTestingConnection(id);
    try {
      // Test by sending an email to the configured address via the send-email edge function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: [config.email_address],
          subject: '✅ Teste de Conexão - WebMarcas',
          body: `<p>Este é um e-mail de teste para verificar a conexão SMTP.</p><p>Se você recebeu esta mensagem, a configuração está correta!</p><p><small>Enviado em ${new Date().toLocaleString('pt-BR')}</small></p>`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Conexão testada com sucesso! Um e-mail de teste foi enviado.');
    } catch (err: any) {
      toast.error('Falha no teste: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setTestingConnection(null);
    }
  };

  const testFormConnection = () => {
    if (!form.smtp_host || !form.smtp_user || !form.email_address) {
      toast.error('Preencha os campos de SMTP e email antes de testar');
      return;
    }
    testConnection(form, 'form');
  };

  const testAccountConnection = (account: EmailAccount) => {
    testConnection({
      smtp_host: account.smtp_host || '',
      smtp_port: account.smtp_port || 587,
      smtp_user: account.smtp_user || '',
      smtp_password: account.smtp_password || '',
      imap_host: account.imap_host,
      imap_port: account.imap_port,
      email_address: account.email_address,
    }, account.id);
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-1">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Email
            </CardTitle>
            <CardDescription>
              Configure suas contas de email para envio e recebimento
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Importante</p>
                <p className="text-muted-foreground">
                  Para usar o Gmail, você precisa criar uma "Senha de App" nas configurações de segurança da sua conta Google.
                  Para Outlook/Microsoft, use suas credenciais normais com autenticação SMTP habilitada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Contas Configuradas</CardTitle>
              <Button 
                variant={isAdding ? "secondary" : "default"}
                size="sm" 
                onClick={() => setIsAdding(!isAdding)}
              >
                {isAdding ? 'Cancelar' : 'Adicionar Conta'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdding && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={form.email_address}
                      onChange={(e) => setForm(f => ({ ...f, email_address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome de Exibição</Label>
                    <Input
                      placeholder="WebMarcas"
                      value={form.display_name}
                      onChange={(e) => setForm(f => ({ ...f, display_name: e.target.value }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Servidor SMTP</Label>
                    <Input
                      placeholder="smtp.gmail.com"
                      value={form.smtp_host}
                      onChange={(e) => setForm(f => ({ ...f, smtp_host: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Porta SMTP</Label>
                    <Input
                      type="number"
                      placeholder="587"
                      value={form.smtp_port}
                      onChange={(e) => setForm(f => ({ ...f, smtp_port: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Usuário SMTP</Label>
                    <Input
                      placeholder="seu@email.com"
                      value={form.smtp_user}
                      onChange={(e) => setForm(f => ({ ...f, smtp_user: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha / App Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={form.smtp_password}
                      onChange={(e) => setForm(f => ({ ...f, smtp_password: e.target.value }))}
                    />
                  </div>
                </div>

                <Separator />
                
                <p className="text-sm font-medium text-muted-foreground">Configurações IMAP (Recebimento)</p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Servidor IMAP</Label>
                    <Input
                      placeholder="imap.gmail.com"
                      value={form.imap_host}
                      onChange={(e) => setForm(f => ({ ...f, imap_host: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Porta IMAP</Label>
                    <Input
                      type="number"
                      placeholder="993"
                      value={form.imap_port}
                      onChange={(e) => setForm(f => ({ ...f, imap_port: parseInt(e.target.value) || 993 }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={testFormConnection}
                    disabled={testingConnection === 'form'}
                  >
                    {testingConnection === 'form' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Wifi className="h-4 w-4 mr-2" />
                    )}
                    Testar Conexão
                  </Button>
                  <Button onClick={() => addAccount.mutate()} disabled={addAccount.isPending}>
                    {addAccount.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Salvar Conta
                  </Button>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando contas...
              </div>
            ) : accounts && accounts.length > 0 ? (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{account.email_address}</p>
                          {account.is_default && (
                            <Badge variant="secondary">Padrão</Badge>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Server className="h-3 w-3" />
                            SMTP: {account.smtp_host}:{account.smtp_port}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            IMAP: {account.imap_host ? `${account.imap_host}:${account.imap_port}` : <span className="text-destructive">Não configurado</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testAccountConnection(account)}
                        disabled={testingConnection === account.id}
                      >
                        {testingConnection === account.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Wifi className="h-4 w-4 mr-1" />
                        )}
                        Testar
                      </Button>
                      {!account.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefault.mutate(account.id)}
                        >
                          Definir Padrão
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAccount.mutate(account.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conta configurada</p>
                <p className="text-sm">Adicione uma conta para começar a enviar emails</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Automation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Automação de Emails</CardTitle>
            <CardDescription>
              Configure quando os emails automáticos serão enviados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email de boas-vindas</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar email quando um lead preencher o formulário
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email de follow-up</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar lembrete após 24h se formulário não for concluído
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Confirmação de contrato</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar email após assinatura de contrato
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
