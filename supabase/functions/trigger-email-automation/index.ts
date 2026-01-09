import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TriggerRequest {
  trigger_event: string;
  lead_id?: string;
  create_lead?: boolean; // If true, create or update the lead
  data: {
    nome: string;
    email: string;
    marca?: string;
    phone?: string;
    data_assinatura?: string;
    hash_contrato?: string;
    ip_assinatura?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trigger_event, lead_id, create_lead, data }: TriggerRequest = await req.json();
    
    console.log(`Processing email automation for trigger: ${trigger_event}`);
    console.log('Data received:', data);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let actualLeadId = lead_id;

    // If create_lead is true and this is form_started, create/update the lead
    if (create_lead && trigger_event === 'form_started' && data.email) {
      // Check if lead exists
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', data.email)
        .single();

      if (existingLead) {
        actualLeadId = existingLead.id;
        // Update form_started_at if not set
        await supabase
          .from('leads')
          .update({ 
            form_started_at: new Date().toISOString(),
            full_name: data.nome,
            phone: data.phone || null,
          })
          .eq('id', existingLead.id)
          .is('form_started_at', null);
      } else {
        // Create new lead
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            full_name: data.nome,
            email: data.email,
            phone: data.phone || null,
            form_started_at: new Date().toISOString(),
            status: 'novo',
            origin: 'site',
            company_name: data.marca || null,
          })
          .select('id')
          .single();

        if (leadError) {
          console.error('Error creating lead:', leadError);
        } else {
          actualLeadId = newLead?.id;
          console.log('Created lead:', actualLeadId);
        }
      }
    }

    // Buscar template ativo para o evento
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('trigger_event', trigger_event)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.log(`No active template found for trigger: ${trigger_event}`);
      return new Response(
        JSON.stringify({ success: false, message: 'No active template found for this trigger' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found template: ${template.name}`);

    // Buscar conta de email padrão
    const { data: emailAccount, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('is_default', true)
      .single();

    if (accountError || !emailAccount) {
      console.error('No default email account configured');
      return new Response(
        JSON.stringify({ error: 'No default email account configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Substituir variáveis no template
    let subject = template.subject;
    let body = template.body;

    const replacements: Record<string, string> = {
      '{{nome}}': data.nome || '',
      '{{email}}': data.email || '',
      '{{marca}}': data.marca || 'Sua Marca',
      '{{data_assinatura}}': data.data_assinatura || new Date().toLocaleDateString('pt-BR'),
      '{{hash_contrato}}': data.hash_contrato || '',
      '{{ip_assinatura}}': data.ip_assinatura || '',
    };

    for (const [key, value] of Object.entries(replacements)) {
      subject = subject.replace(new RegExp(key, 'g'), value);
      body = body.replace(new RegExp(key, 'g'), value);
    }

    // Configurar cliente SMTP
    const client = new SMTPClient({
      connection: {
        hostname: emailAccount.smtp_host,
        port: emailAccount.smtp_port,
        tls: emailAccount.smtp_port === 465,
        auth: {
          username: emailAccount.smtp_user,
          password: emailAccount.smtp_password,
        },
      },
    });

    // Enviar email
    await client.send({
      from: emailAccount.display_name 
        ? `${emailAccount.display_name} <${emailAccount.email_address}>`
        : emailAccount.email_address,
      to: data.email,
      subject: subject,
      html: body,
    });

    await client.close();

    console.log(`Email sent successfully to ${data.email}`);

    // Registrar no email_logs
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        from_email: emailAccount.email_address,
        to_email: data.email,
        subject: subject,
        body: body.replace(/<[^>]*>/g, '').substring(0, 500), // Texto simples para log
        html_body: body,
        status: 'sent',
        trigger_type: trigger_event,
        template_id: template.id,
        related_lead_id: actualLeadId || null,
      });

    if (logError) {
      console.error('Error logging email:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        template: template.name,
        to: data.email
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in trigger-email-automation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
