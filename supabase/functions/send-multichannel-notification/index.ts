import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  event_type: string;
  channels: Array<'crm' | 'sms' | 'whatsapp'>;
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

interface ChannelSettings {
  enabled: boolean;
  webhook_url?: string;
  auth_token?: string;
  api_key?: string;
  sender_name?: string;
  from_email?: string;
}

// ── SMS via Zenvia ──────────────────────────────────────────
async function sendSMS(
  settings: ChannelSettings,
  phone: string,
  message: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  if (!settings.enabled) return { success: false, error: 'SMS desativado nas configurações' };
  if (!settings.api_key) return { success: false, error: 'API Key Zenvia não configurada' };
  if (!phone) return { success: false, error: 'Telefone do destinatário não informado' };

  // Normalize phone: keep only digits, add country code if needed
  const normalized = phone.replace(/\D/g, '').replace(/^0/, '');
  const finalPhone = normalized.startsWith('55') ? normalized : `55${normalized}`;

  const body = {
    from: { type: 'CHANNEL', number: settings.sender_name || 'WebMarcas' },
    to: { type: 'SMS', number: finalPhone },
    contents: [{ type: 'text', text: message.substring(0, 160) }],
  };

  try {
    const res = await fetch('https://api.zenvia.com/v2/channels/sms/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-TOKEN': settings.api_key,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (res.ok) {
      return { success: true, response: text };
    } else {
      return { success: false, error: `Zenvia HTTP ${res.status}: ${text}` };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro desconhecido ao enviar SMS' };
  }
}

// ── WhatsApp via BotConversa Webhook ───────────────────────
async function sendWhatsApp(
  settings: ChannelSettings,
  phone: string,
  nome: string,
  message: string,
  extraData: Record<string, string>
): Promise<{ success: boolean; response?: string; error?: string }> {
  if (!settings.enabled) return { success: false, error: 'WhatsApp/BotConversa desativado nas configurações' };
  if (!settings.webhook_url) return { success: false, error: 'URL do Webhook BotConversa não configurada' };
  if (!phone) return { success: false, error: 'Telefone do destinatário não informado' };

  const normalized = phone.replace(/\D/g, '').replace(/^0/, '');
  const finalPhone = normalized.startsWith('55') ? normalized : `55${normalized}`;

  const payload = {
    telefone: finalPhone,
    nome: nome || 'Cliente',
    mensagem: message,
    ...extraData,
  };

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.auth_token) headers['Authorization'] = `Bearer ${settings.auth_token}`;

  try {
    const res = await fetch(settings.webhook_url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (res.ok) {
      return { success: true, response: text };
    } else {
      return { success: false, error: `BotConversa HTTP ${res.status}: ${text}` };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro desconhecido ao enviar WhatsApp' };
  }
}

// ── Mount message from event ────────────────────────────────
function buildMessage(event_type: string, data: NotificationPayload['data'], nome: string): string {
  const marca = data.marca || 'sua marca';
  const link = data.link || '';
  const valor = data.valor ? `R$ ${data.valor}` : '';

  if (data.mensagem_custom) return data.mensagem_custom;

  const messages: Record<string, string> = {
    formulario_preenchido: `WebMarcas: Olá ${nome}, recebemos seu formulário para o registro de ${marca}. Em breve entraremos em contato!`,
    link_assinatura_gerado: `WebMarcas: Olá ${nome}, seu contrato para ${marca} está pronto para assinatura. Acesse: ${link}`,
    contrato_assinado: `WebMarcas: Parabéns ${nome}! Seu contrato para ${marca} foi assinado com sucesso.`,
    cobranca_gerada: `WebMarcas: Olá ${nome}, uma nova cobrança de ${valor} foi gerada para ${marca}. Acesse: ${link}`,
    fatura_vencida: `WebMarcas: Atenção ${nome}! Sua fatura de ${valor} para ${marca} está vencida. Regularize em: ${link || 'webmarcas.net'}`,
    pagamento_confirmado: `WebMarcas: Olá ${nome}, confirmamos o recebimento do pagamento de ${valor} para ${marca}. Obrigado!`,
    manual: `WebMarcas: ${data.mensagem_custom || 'Você tem uma nova notificação.'}`,
  };

  return messages[event_type] || `WebMarcas: Olá ${nome}, você tem uma nova notificação.`;
}

// ── Log dispatch ────────────────────────────────────────────
async function logDispatch(
  supabase: any,
  event_type: string,
  channel: string,
  status: 'sent' | 'failed',
  payload: Record<string, unknown>,
  recipient_phone?: string,
  recipient_email?: string,
  recipient_user_id?: string,
  error_message?: string,
  response_body?: string,
  attempts = 1
) {
  try {
    await supabase.from('notification_dispatch_logs').insert({
      event_type,
      channel,
      status,
      payload,
      recipient_phone,
      recipient_email,
      recipient_user_id,
      error_message,
      response_body,
      attempts,
    });
  } catch (e) {
    console.error('Error logging dispatch:', e);
  }
}

// ── Retry wrapper ────────────────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<{ success: boolean; response?: string; error?: string }>,
  maxAttempts = 3
): Promise<{ success: boolean; response?: string; error?: string; attempts: number }> {
  let lastResult = { success: false, error: 'No attempts made' } as any;
  for (let i = 1; i <= maxAttempts; i++) {
    lastResult = await fn();
    if (lastResult.success) return { ...lastResult, attempts: i };
    if (i < maxAttempts) await new Promise(r => setTimeout(r, 1000 * i));
  }
  return { ...lastResult, attempts: maxAttempts };
}

// ── Main handler ─────────────────────────────────────────────
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load channel settings from system_settings
    const [smsRow, botconversaRow] = await Promise.all([
      supabase.from('system_settings').select('value').eq('key', 'sms_provider').single(),
      supabase.from('system_settings').select('value').eq('key', 'botconversa').single(),
    ]);

    const smsSettings: ChannelSettings = (smsRow.data?.value as any) || { enabled: false };
    const botconversaSettings: ChannelSettings = (botconversaRow.data?.value as any) || { enabled: false };

    const nome = recipient.nome || 'Cliente';
    const phone = recipient.phone || '';
    const message = buildMessage(event_type, data, nome);

    const results: Record<string, any> = {};

    // ── CRM notification ────────────────────────────────────
    if (channels.includes('crm') && recipient.user_id) {
      try {
        const titulo = data.titulo || getTitulo(event_type);
        const { error } = await supabase.from('notifications').insert({
          user_id: recipient.user_id,
          title: titulo,
          message: message,
          type: getNotifType(event_type),
          read: false,
          link: data.link || null,
        });
        const status = error ? 'failed' : 'sent';
        results.crm = { success: !error, error: error?.message };
        await logDispatch(supabase, event_type, 'crm', status, payload as any,
          undefined, recipient.email, recipient.user_id, error?.message);
      } catch (e: any) {
        results.crm = { success: false, error: e.message };
        await logDispatch(supabase, event_type, 'crm', 'failed', payload as any,
          undefined, recipient.email, recipient.user_id, e.message);
      }
    }

    // ── SMS ─────────────────────────────────────────────────
    if (channels.includes('sms')) {
      const smsResult = await withRetry(() => sendSMS(smsSettings, phone, message));
      results.sms = smsResult;
      await logDispatch(supabase, event_type, 'sms',
        smsResult.success ? 'sent' : 'failed', payload as any,
        phone, recipient.email, recipient.user_id,
        smsResult.error, smsResult.response, smsResult.attempts);
    }

    // ── WhatsApp (BotConversa) ───────────────────────────────
    if (channels.includes('whatsapp')) {
      const extraData: Record<string, string> = {
        tipo_notificacao: event_type,
        ...(data.link ? { link: data.link } : {}),
        ...(data.marca ? { marca: data.marca } : {}),
        ...(data.valor ? { valor: data.valor } : {}),
      };
      const waResult = await withRetry(() => sendWhatsApp(botconversaSettings, phone, nome, message, extraData));
      results.whatsapp = waResult;
      await logDispatch(supabase, event_type, 'whatsapp',
        waResult.success ? 'sent' : 'failed', payload as any,
        phone, recipient.email, recipient.user_id,
        waResult.error, waResult.response, waResult.attempts);
    }

    console.log(`[send-multichannel-notification] event=${event_type}`, JSON.stringify(results));

    return new Response(JSON.stringify({ success: true, event_type, results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[send-multichannel-notification] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

function getTitulo(event_type: string): string {
  const map: Record<string, string> = {
    formulario_preenchido: 'Formulário recebido',
    link_assinatura_gerado: 'Contrato pronto para assinatura',
    contrato_assinado: 'Contrato assinado com sucesso',
    cobranca_gerada: 'Nova cobrança gerada',
    fatura_vencida: 'Fatura vencida',
    pagamento_confirmado: 'Pagamento confirmado',
    manual: 'Nova notificação',
  };
  return map[event_type] || 'Nova notificação';
}

function getNotifType(event_type: string): string {
  const map: Record<string, string> = {
    formulario_preenchido: 'info',
    link_assinatura_gerado: 'info',
    contrato_assinado: 'success',
    cobranca_gerada: 'warning',
    fatura_vencida: 'error',
    pagamento_confirmado: 'success',
    manual: 'info',
  };
  return map[event_type] || 'info';
}

serve(handler);
