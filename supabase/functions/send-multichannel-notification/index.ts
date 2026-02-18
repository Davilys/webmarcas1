import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationPayload {
  event_type: string;
  channels?: Array<'crm' | 'sms' | 'whatsapp'>;
  recipient: {
    nome?: string;
    email?: string;
    phone?: string;
    user_id?: string;
  };
  data: {
    link?: string;
    valor?: string;
    marca?: string;
    mensagem_custom?: string;
    titulo?: string;
  };
}

interface ChannelResult {
  success: boolean;
  response?: string;
  error?: string;
  attempts: number;
  skipped?: boolean;
  skip_reason?: string;
}

// ─── Message Builder ──────────────────────────────────────────────────────────

function buildMessage(event_type: string, data: NotificationPayload['data'], nome: string): string {
  if (data.mensagem_custom) return data.mensagem_custom;

  const marca = data.marca || 'sua marca';
  const link  = data.link  || '';
  const valor = data.valor ? `R$ ${data.valor}` : '';

  const map: Record<string, string> = {
    formulario_preenchido : `WebMarcas: Olá ${nome}, recebemos seu formulário para o registro de ${marca}. Em breve entraremos em contato!`,
    link_assinatura_gerado: `WebMarcas: Olá ${nome}, seu contrato para ${marca} está pronto para assinatura. Acesse: ${link}`,
    contrato_assinado     : `WebMarcas: Parabéns ${nome}! Seu contrato para ${marca} foi assinado com sucesso.`,
    cobranca_gerada       : `WebMarcas: Olá ${nome}, nova cobrança de ${valor} gerada para ${marca}. Acesse: ${link}`,
    fatura_vencida        : `WebMarcas: Atenção ${nome}! Sua fatura de ${valor} para ${marca} está vencida. Regularize em: ${link || 'webmarcas.net'}`,
    pagamento_confirmado  : `WebMarcas: Olá ${nome}, confirmamos o pagamento de ${valor} para ${marca}. Obrigado!`,
    manual                : `WebMarcas: ${data.mensagem_custom || 'Você tem uma nova notificação.'}`,
  };

  return map[event_type] ?? `WebMarcas: Olá ${nome}, você tem uma nova notificação.`;
}

function getTitulo(event_type: string): string {
  const map: Record<string, string> = {
    formulario_preenchido : 'Formulário recebido',
    link_assinatura_gerado: 'Contrato pronto para assinatura',
    contrato_assinado     : 'Contrato assinado com sucesso',
    cobranca_gerada       : 'Nova cobrança gerada',
    fatura_vencida        : 'Fatura vencida',
    pagamento_confirmado  : 'Pagamento confirmado',
    manual                : 'Nova notificação',
  };
  return map[event_type] ?? 'Nova notificação';
}

function getNotifType(event_type: string): string {
  const map: Record<string, string> = {
    formulario_preenchido : 'info',
    link_assinatura_gerado: 'info',
    contrato_assinado     : 'success',
    cobranca_gerada       : 'warning',
    fatura_vencida        : 'error',
    pagamento_confirmado  : 'success',
    manual                : 'info',
  };
  return map[event_type] ?? 'info';
}

// ─── Retry Wrapper ─────────────────────────────────────────────────────────────

async function withRetry(
  fn: () => Promise<{ success: boolean; response?: string; error?: string }>,
  maxAttempts = 3
): Promise<ChannelResult> {
  let last: { success: boolean; response?: string; error?: string } = { success: false, error: 'No attempts' };
  for (let i = 1; i <= maxAttempts; i++) {
    last = await fn();
    if (last.success) return { ...last, attempts: i };
    if (i < maxAttempts) await new Promise(r => setTimeout(r, 1000 * i));
  }
  return { ...last, attempts: maxAttempts };
}

// ─── SMS via Zenvia ───────────────────────────────────────────────────────────

async function sendSMS(
  settings: Record<string, unknown>,
  phone: string,
  message: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  if (!settings.enabled) return { success: false, error: 'SMS desativado' };
  
  const apiKey = (settings.api_key as string) || '';
  if (!apiKey) return { success: false, error: 'API Key Zenvia não configurada' };
  if (!phone)  return { success: false, error: 'Telefone não informado' };

  const normalized = phone.replace(/\D/g, '').replace(/^0/, '');
  const finalPhone  = normalized.startsWith('55') ? normalized : `55${normalized}`;

  const body = {
    from: { type: 'CHANNEL', number: (settings.sender_name as string) || 'WebMarcas' },
    to:   { type: 'SMS',     number: finalPhone },
    contents: [{ type: 'text', text: message.substring(0, 160) }],
  };

  try {
    const res = await fetch('https://api.zenvia.com/v2/channels/sms/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-TOKEN': apiKey },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    return res.ok
      ? { success: true, response: text }
      : { success: false, error: `Zenvia HTTP ${res.status}: ${text}` };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message ?? 'Erro ao enviar SMS' };
  }
}

// ─── WhatsApp via BotConversa ─────────────────────────────────────────────────

async function sendWhatsApp(
  settings: Record<string, unknown>,
  phone: string,
  nome: string,
  message: string,
  extraData: Record<string, string>
): Promise<{ success: boolean; response?: string; error?: string }> {
  if (!settings.enabled) return { success: false, error: 'WhatsApp desativado' };

  const webhookUrl = (settings.webhook_url as string) || '';
  if (!webhookUrl) return { success: false, error: 'URL do Webhook BotConversa não configurada' };
  if (!phone)      return { success: false, error: 'Telefone não informado' };

  const normalized = phone.replace(/\D/g, '').replace(/^0/, '');
  const finalPhone  = normalized.startsWith('55') ? normalized : `55${normalized}`;

  const payload = { telefone: finalPhone, nome: nome || 'Cliente', mensagem: message, ...extraData };
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const authToken = (settings.auth_token as string) || '';
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  try {
    const res = await fetch(webhookUrl, { method: 'POST', headers, body: JSON.stringify(payload) });
    const text = await res.text();
    return res.ok
      ? { success: true, response: text }
      : { success: false, error: `BotConversa HTTP ${res.status}: ${text}` };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message ?? 'Erro ao enviar WhatsApp' };
  }
}

// ─── Log Dispatch ─────────────────────────────────────────────────────────────

async function logDispatch(
  supabase: ReturnType<typeof createClient>,
  event_type: string,
  channel: string,
  status: 'sent' | 'failed',
  payload: Record<string, unknown>,
  recipient_phone?: string,
  recipient_email?: string,
  recipient_user_id?: string,
  error_message?: string,
  response_body?: string,
  attempts = 1,
) {
  try {
    await supabase.from('notification_dispatch_logs').insert({
      event_type, channel, status, payload,
      recipient_phone:   recipient_phone   || null,
      recipient_email:   recipient_email   || null,
      recipient_user_id: recipient_user_id || null,
      error_message:     error_message     || null,
      response_body:     response_body     || null,
      attempts,
    });
  } catch (e) {
    console.error('[log-dispatch] Error logging:', e);
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const payload: NotificationPayload = await req.json();
    const { event_type, channels = ['crm', 'sms', 'whatsapp'], recipient, data } = payload;

    if (!event_type) {
      return new Response(JSON.stringify({ error: 'event_type é obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl        = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase           = createClient(supabaseUrl, supabaseServiceKey);

    // ── Load channel settings ──────────────────────────────────────────────────
    const [smsRow, botRow] = await Promise.all([
      supabase.from('system_settings').select('value').eq('key', 'sms_provider').maybeSingle(),
      supabase.from('system_settings').select('value').eq('key', 'botconversa').maybeSingle(),
    ]);

    const smsSettings = (smsRow.data?.value as Record<string, unknown>) ?? { enabled: false };
    const botSettings = (botRow.data?.value as Record<string, unknown>) ?? { enabled: false };

    // ── If user_id provided but phone/nome missing, resolve from profiles ─────
    const nome  = recipient.nome  || 'Cliente';
    let   phone = recipient.phone || '';

    if (recipient.user_id && !phone) {
      const { data: profile } = await supabase
        .from('profiles').select('phone, full_name').eq('id', recipient.user_id).maybeSingle();
      if (profile?.phone) phone = profile.phone;
    }

    const message = buildMessage(event_type, data, nome);
    const results: Record<string, ChannelResult> = {};
    const rawPayload = payload as unknown as Record<string, unknown>;

    // ── CRM ───────────────────────────────────────────────────────────────────
    if (channels.includes('crm')) {
      if (recipient.user_id) {
        try {
          const titulo = data.titulo || getTitulo(event_type);
          const { error } = await supabase.from('notifications').insert({
            user_id: recipient.user_id,
            title: titulo,
            message,
            type: getNotifType(event_type),
            read: false,
            link: data.link || null,
          });
          const status = error ? 'failed' : 'sent';
          results.crm = { success: !error, error: error?.message, attempts: 1 };
          await logDispatch(supabase, event_type, 'crm', status, rawPayload,
            undefined, recipient.email, recipient.user_id, error?.message);
        } catch (e: unknown) {
          results.crm = { success: false, error: (e as Error).message, attempts: 1 };
          await logDispatch(supabase, event_type, 'crm', 'failed', rawPayload,
            undefined, recipient.email, recipient.user_id, (e as Error).message);
        }
      } else {
        results.crm = { success: false, error: 'user_id não fornecido', attempts: 0, skipped: true, skip_reason: 'sem user_id' };
      }
    }

    // ── SMS ───────────────────────────────────────────────────────────────────
    if (channels.includes('sms')) {
      if (!phone) {
        results.sms = { success: false, error: 'Telefone não informado', attempts: 0, skipped: true, skip_reason: 'sem phone' };
        await logDispatch(supabase, event_type, 'sms', 'failed', rawPayload,
          undefined, recipient.email, recipient.user_id, 'Telefone não informado', undefined, 0);
      } else {
        const smsResult = await withRetry(() => sendSMS(smsSettings, phone, message));
        results.sms = smsResult;
        await logDispatch(supabase, event_type, 'sms',
          smsResult.success ? 'sent' : 'failed', rawPayload,
          phone, recipient.email, recipient.user_id,
          smsResult.error, smsResult.response, smsResult.attempts);
      }
    }

    // ── WhatsApp (BotConversa) ────────────────────────────────────────────────
    if (channels.includes('whatsapp')) {
      if (!phone) {
        results.whatsapp = { success: false, error: 'Telefone não informado', attempts: 0, skipped: true, skip_reason: 'sem phone' };
        await logDispatch(supabase, event_type, 'whatsapp', 'failed', rawPayload,
          undefined, recipient.email, recipient.user_id, 'Telefone não informado', undefined, 0);
      } else {
        const extra: Record<string, string> = {
          tipo_notificacao: event_type,
          ...(data.link  ? { link:  data.link  } : {}),
          ...(data.marca ? { marca: data.marca  } : {}),
          ...(data.valor ? { valor: data.valor  } : {}),
        };
        const waResult = await withRetry(() => sendWhatsApp(botSettings, phone, nome, message, extra));
        results.whatsapp = waResult;
        await logDispatch(supabase, event_type, 'whatsapp',
          waResult.success ? 'sent' : 'failed', rawPayload,
          phone, recipient.email, recipient.user_id,
          waResult.error, waResult.response, waResult.attempts);
      }
    }

    console.log(`[multichannel] event=${event_type} phone=${phone || 'N/A'}`, JSON.stringify(results));

    return new Response(JSON.stringify({ success: true, event_type, results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    console.error('[multichannel] Fatal error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
