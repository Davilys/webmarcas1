import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CreditCard, CheckCircle2, XCircle, Loader2, Save, RefreshCw,
  Mail, MessageCircle, MessageSquare, Brain, Shield, Eye, EyeOff, Send,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────
interface AsaasSettings { environment: 'sandbox' | 'production'; enabled: boolean; }
interface EmailProviderSettings { enabled: boolean; provider: string; api_key: string; from_email: string; from_name: string; }
interface BotconversaSettings { enabled: boolean; webhook_url: string; auth_token: string; test_phone: string; }
interface SmsSettings { enabled: boolean; provider: string; api_key: string; sender_name: string; test_phone: string; }
interface OpenAISettings { enabled: boolean; api_key: string; }
interface INPISettings { enabled: boolean; sync_interval_hours: number; last_sync_at: string | null; }

// ── Helpers ──────────────────────────────────────────────────
function useSystemSetting<T>(key: string, fallback: T) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['system-settings', key],
    queryFn: async () => {
      const { data, error } = await supabase.from('system_settings').select('value').eq('key', key).single();
      if (error) throw error;
      return data?.value as unknown as T;
    },
  });

  const [local, setLocal] = useState<T>(fallback);
  useEffect(() => { if (data) setLocal(data); }, [data]);

  const mutation = useMutation({
    mutationFn: async (val: T) => {
      const { error } = await supabase.from('system_settings')
        .upsert({ key, value: JSON.parse(JSON.stringify(val)), updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['system-settings', key] }); toast.success('Configurações salvas!'); },
    onError: () => toast.error('Erro ao salvar configurações'),
  });

  return { local, setLocal, isLoading, save: () => mutation.mutate(local), isSaving: mutation.isPending };
}

// ── Card wrapper ─────────────────────────────────────────────
function IntegrationCard({
  icon: Icon, iconColor, title, description, badge, badgeVariant = 'secondary', children,
}: {
  icon: React.ElementType; iconColor: string; title: string; description?: string;
  badge?: string; badgeVariant?: 'default' | 'secondary' | 'outline'; children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// ── Password input ───────────────────────────────────────────
function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10 font-mono text-sm"
      />
      <Button variant="ghost" size="icon" type="button"
        className="absolute right-0 top-0 h-full px-3"
        onClick={() => setShow(s => !s)}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}

// ── STATUS BADGE ─────────────────────────────────────────────
function StatusBadge({ ok }: { ok: boolean }) {
  return ok
    ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 className="h-3.5 w-3.5" />Configurado</span>
    : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="h-3.5 w-3.5" />Não configurado</span>;
}

// ════════════════════════════════════════════════════════════
export function IntegrationSettings() {
  // ── Asaas ────────────────────────────────────────────────
  const asaas = useSystemSetting<AsaasSettings>('asaas', { environment: 'sandbox', enabled: false });
  const [testingAsaas, setTestingAsaas] = useState(false);
  const [asaasStatus, setAsaasStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const testAsaas = async () => {
    setTestingAsaas(true); setAsaasStatus('idle');
    try {
      const { error } = await supabase.functions.invoke('create-asaas-payment', { body: { test: true } });
      if (error?.message?.includes('API')) { setAsaasStatus('error'); toast.error('API Key do Asaas inválida'); }
      else { setAsaasStatus('success'); toast.success('Conexão com Asaas funcionando!'); }
    } catch { setAsaasStatus('error'); toast.error('Erro ao testar conexão com Asaas'); }
    finally { setTestingAsaas(false); }
  };

  // ── Email (Resend) ───────────────────────────────────────
  const email = useSystemSetting<EmailProviderSettings>('email_provider', {
    enabled: true, provider: 'resend', api_key: '', from_email: 'noreply@webmarcas.net', from_name: 'WebMarcas',
  });
  const [testingEmail, setTestingEmail] = useState(false);

  const testEmail = async () => {
    setTestingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('trigger-email-automation', {
        body: { trigger_event: 'test', data: { nome: 'Admin', email: email.local.from_email } },
      });
      if (error) toast.error('Falha ao testar e-mail'); else toast.success('E-mail de teste enviado!');
    } catch { toast.error('Erro ao testar e-mail'); }
    finally { setTestingEmail(false); }
  };

  // ── BotConversa ─────────────────────────────────────────
  const botconversa = useSystemSetting<BotconversaSettings>('botconversa', {
    enabled: false, webhook_url: '', auth_token: '', test_phone: '',
  });
  const [testingBot, setTestingBot] = useState(false);

  const testBotConversa = async () => {
    if (!botconversa.local.webhook_url) { toast.error('Configure a URL do webhook primeiro'); return; }
    if (!botconversa.local.test_phone) { toast.error('Informe um telefone de teste'); return; }
    setTestingBot(true);
    try {
      const { error } = await supabase.functions.invoke('send-multichannel-notification', {
        body: {
          event_type: 'manual',
          channels: ['whatsapp'],
          recipient: { nome: 'Teste WebMarcas', phone: botconversa.local.test_phone },
          data: { mensagem_custom: 'Teste de integração BotConversa — WebMarcas CRM.' },
        },
      });
      if (error) toast.error('Falha ao testar BotConversa'); else toast.success('Mensagem de teste enviada via BotConversa!');
    } catch { toast.error('Erro ao testar BotConversa'); }
    finally { setTestingBot(false); }
  };

  // ── SMS (Zenvia) ────────────────────────────────────────
  const sms = useSystemSetting<SmsSettings>('sms_provider', {
    enabled: false, provider: 'zenvia', api_key: '', sender_name: 'WebMarcas', test_phone: '',
  });
  const [testingSms, setTestingSms] = useState(false);

  const testSms = async () => {
    if (!sms.local.api_key) { toast.error('Configure a API Key primeiro'); return; }
    if (!sms.local.test_phone) { toast.error('Informe um telefone de teste'); return; }
    setTestingSms(true);
    try {
      const { error } = await supabase.functions.invoke('send-multichannel-notification', {
        body: {
          event_type: 'manual',
          channels: ['sms'],
          recipient: { nome: 'Teste WebMarcas', phone: sms.local.test_phone },
          data: { mensagem_custom: 'Teste de SMS — WebMarcas CRM.' },
        },
      });
      if (error) toast.error('Falha ao enviar SMS de teste'); else toast.success('SMS de teste enviado!');
    } catch { toast.error('Erro ao enviar SMS de teste'); }
    finally { setTestingSms(false); }
  };

  // ── OpenAI ──────────────────────────────────────────────
  const openai = useSystemSetting<OpenAISettings>('openai_config', { enabled: true, api_key: '' });

  // ── INPI ────────────────────────────────────────────────
  const inpi = useSystemSetting<INPISettings>('inpi_sync', { enabled: true, sync_interval_hours: 24, last_sync_at: null });

  if (asaas.isLoading || email.isLoading || botconversa.isLoading || sms.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Asaas ─────────────────────────────────────────── */}
      <IntegrationCard
        icon={CreditCard}
        iconColor="text-emerald-500"
        title="Asaas — Gateway de Pagamentos"
        description="Processar pagamentos PIX, Boleto e Cartão de Crédito"
        badge={asaas.local.enabled ? 'Ativo' : 'Inativo'}
        badgeVariant={asaas.local.enabled ? 'default' : 'secondary'}
      >
        <div className="flex items-center justify-between">
          <div>
            <Label>Ativar Integração</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Habilitar processamento de pagamentos</p>
          </div>
          <Switch checked={asaas.local.enabled} onCheckedChange={v => asaas.setLocal({ ...asaas.local, enabled: v })} />
        </div>
        <div className="space-y-2">
          <Label>Ambiente</Label>
          <Select value={asaas.local.environment}
            onValueChange={(v: 'sandbox' | 'production') => asaas.setLocal({ ...asaas.local, environment: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
              <SelectItem value="production">Produção</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">A API Key é configurada nos secrets do servidor (ASAAS_API_KEY).</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" onClick={testAsaas} disabled={testingAsaas}>
            {testingAsaas ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Testar Conexão
          </Button>
          {asaasStatus === 'success' && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" />Conectado</span>}
          {asaasStatus === 'error' && <span className="flex items-center gap-1 text-sm text-destructive"><XCircle className="h-4 w-4" />Falha na conexão</span>}
          <Button onClick={asaas.save} disabled={asaas.isSaving} className="ml-auto">
            {asaas.isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </IntegrationCard>

      {/* ── Resend (E-mail) ───────────────────────────────── */}
      <IntegrationCard
        icon={Mail}
        iconColor="text-sky-500"
        title="Resend — E-mail Transacional"
        description="Envio de e-mails automáticos para clientes (confirmação, contrato, cobrança)"
        badge={email.local.api_key ? 'Configurado' : 'Não configurado'}
        badgeVariant={email.local.api_key ? 'default' : 'secondary'}
      >
        <div className="flex items-center justify-between">
          <div>
            <Label>Ativar Envio de E-mails</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Habilitar notificações por e-mail</p>
          </div>
          <Switch checked={email.local.enabled} onCheckedChange={v => email.setLocal({ ...email.local, enabled: v })} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>API Key Resend</Label>
            <SecretInput value={email.local.api_key} onChange={v => email.setLocal({ ...email.local, api_key: v })} placeholder="re_xxxxxxxxxxxxxxxxxx" />
            <p className="text-xs text-muted-foreground">Obtenha em resend.com → API Keys</p>
          </div>
          <div className="space-y-1.5">
            <Label>E-mail Remetente</Label>
            <Input value={email.local.from_email} onChange={e => email.setLocal({ ...email.local, from_email: e.target.value })} placeholder="noreply@webmarcas.net" />
          </div>
          <div className="space-y-1.5">
            <Label>Nome do Remetente</Label>
            <Input value={email.local.from_name} onChange={e => email.setLocal({ ...email.local, from_name: e.target.value })} placeholder="WebMarcas" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={testEmail} disabled={testingEmail}>
            {testingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Testar E-mail
          </Button>
          <Button onClick={email.save} disabled={email.isSaving}>
            {email.isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>
        <StatusBadge ok={!!email.local.api_key} />
      </IntegrationCard>

      {/* ── BotConversa (WhatsApp) ────────────────────────── */}
      <IntegrationCard
        icon={MessageCircle}
        iconColor="text-green-500"
        title="BotConversa — WhatsApp"
        description="Enviar mensagens automáticas via WhatsApp usando webhook do BotConversa"
        badge={botconversa.local.enabled && botconversa.local.webhook_url ? 'Ativo' : 'Inativo'}
        badgeVariant={botconversa.local.enabled && botconversa.local.webhook_url ? 'default' : 'secondary'}
      >
        <div className="flex items-center justify-between">
          <div>
            <Label>Ativar WhatsApp via BotConversa</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Disparar mensagens automáticas por WhatsApp</p>
          </div>
          <Switch checked={botconversa.local.enabled} onCheckedChange={v => botconversa.setLocal({ ...botconversa.local, enabled: v })} />
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>URL do Webhook BotConversa</Label>
            <Input value={botconversa.local.webhook_url} onChange={e => botconversa.setLocal({ ...botconversa.local, webhook_url: e.target.value })}
              placeholder="https://backend.botconversa.com.br/api/v1/webhooks/..." />
            <p className="text-xs text-muted-foreground">No painel BotConversa → Fluxos → Gatilho "Webhook Externo" → copie a URL</p>
          </div>
          <div className="space-y-1.5">
            <Label>Token de Autenticação (opcional)</Label>
            <SecretInput value={botconversa.local.auth_token} onChange={v => botconversa.setLocal({ ...botconversa.local, auth_token: v })} placeholder="Bearer token se necessário" />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone para Teste (com DDD)</Label>
            <Input value={botconversa.local.test_phone} onChange={e => botconversa.setLocal({ ...botconversa.local, test_phone: e.target.value })}
              placeholder="5511999999999" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={testBotConversa} disabled={testingBot}>
            {testingBot ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
            Testar Webhook
          </Button>
          <Button onClick={botconversa.save} disabled={botconversa.isSaving}>
            {botconversa.isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>
        <StatusBadge ok={!!(botconversa.local.webhook_url)} />
      </IntegrationCard>

      {/* ── SMS (Zenvia) ──────────────────────────────────── */}
      <IntegrationCard
        icon={MessageSquare}
        iconColor="text-violet-500"
        title="Zenvia — SMS"
        description="Enviar SMS automáticos para clientes (recomendado: Zenvia, líder no Brasil)"
        badge={sms.local.enabled && sms.local.api_key ? 'Ativo' : 'Inativo'}
        badgeVariant={sms.local.enabled && sms.local.api_key ? 'default' : 'secondary'}
      >
        <div className="flex items-center justify-between">
          <div>
            <Label>Ativar Envio de SMS</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Disparar SMS automáticos para clientes</p>
          </div>
          <Switch checked={sms.local.enabled} onCheckedChange={v => sms.setLocal({ ...sms.local, enabled: v })} />
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>API Key Zenvia</Label>
            <SecretInput value={sms.local.api_key} onChange={v => sms.setLocal({ ...sms.local, api_key: v })} placeholder="Seu token da Zenvia" />
            <p className="text-xs text-muted-foreground">Obtenha em zenvia.com → Integrações → API Token. Plano gratuito disponível.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Nome do Remetente</Label>
            <Input value={sms.local.sender_name} onChange={e => sms.setLocal({ ...sms.local, sender_name: e.target.value })} placeholder="WebMarcas" maxLength={11} />
            <p className="text-xs text-muted-foreground">Máx. 11 caracteres, sem espaços (aparece como remetente do SMS)</p>
          </div>
          <div className="space-y-1.5">
            <Label>Telefone para Teste (com DDD)</Label>
            <Input value={sms.local.test_phone} onChange={e => sms.setLocal({ ...sms.local, test_phone: e.target.value })} placeholder="5511999999999" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={testSms} disabled={testingSms}>
            {testingSms ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
            Enviar SMS Teste
          </Button>
          <Button onClick={sms.save} disabled={sms.isSaving}>
            {sms.isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>
        <StatusBadge ok={!!(sms.local.api_key)} />
      </IntegrationCard>

      {/* ── OpenAI ───────────────────────────────────────── */}
      <IntegrationCard
        icon={Brain}
        iconColor="text-emerald-500"
        title="OpenAI — Inteligência Artificial"
        description="Assistente de IA para suporte ao cliente, rascunho de e-mails e análise jurídica INPI"
        badge={openai.local.enabled ? 'Ativo' : 'Inativo'}
        badgeVariant={openai.local.enabled ? 'default' : 'secondary'}
      >
        <div className="flex items-center justify-between">
          <div>
            <Label>Ativar Respostas com IA</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Usar IA para automação e respostas inteligentes</p>
          </div>
          <Switch checked={openai.local.enabled} onCheckedChange={v => openai.setLocal({ ...openai.local, enabled: v })} />
        </div>
        <div className="space-y-1.5">
          <Label>API Key OpenAI</Label>
          <SecretInput value={openai.local.api_key} onChange={v => openai.setLocal({ ...openai.local, api_key: v })} placeholder="sk-proj-..." />
          <p className="text-xs text-muted-foreground">A chave do servidor (OPENAI_API_KEY) já está configurada. Use este campo para sobrescrever.</p>
        </div>
        <Button onClick={openai.save} disabled={openai.isSaving}>
          {openai.isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
        <StatusBadge ok={openai.local.enabled} />
      </IntegrationCard>

      {/* ── INPI ─────────────────────────────────────────── */}
      <IntegrationCard
        icon={Shield}
        iconColor="text-amber-500"
        title="INPI — Monitoramento de Marcas"
        description="Sincronização com a base de dados do INPI para consultas de viabilidade e acompanhamento"
        badge={inpi.local.enabled ? 'Sincronizando' : 'Pausado'}
        badgeVariant={inpi.local.enabled ? 'default' : 'secondary'}
      >
        <div className="flex items-center justify-between">
          <div>
            <Label>Sincronização Automática</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Atualizar base INPI periodicamente</p>
          </div>
          <Switch checked={inpi.local.enabled} onCheckedChange={v => inpi.setLocal({ ...inpi.local, enabled: v })} />
        </div>
        <div className="space-y-1.5">
          <Label>Intervalo de Sincronização (horas)</Label>
          <Input
            type="number"
            min={1}
            max={168}
            value={inpi.local.sync_interval_hours}
            onChange={e => inpi.setLocal({ ...inpi.local, sync_interval_hours: Number(e.target.value) })}
          />
        </div>
        {inpi.local.last_sync_at && (
          <p className="text-xs text-muted-foreground">
            Última sincronização: {new Date(inpi.local.last_sync_at).toLocaleString('pt-BR')}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Credenciais INPI (usuário/senha) são configuradas nos secrets do servidor (INPI_USERNAME / INPI_PASSWORD).
        </p>
        <Button onClick={inpi.save} disabled={inpi.isSaving}>
          {inpi.isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
        <StatusBadge ok={inpi.local.enabled} />
      </IntegrationCard>

    </div>
  );
}
