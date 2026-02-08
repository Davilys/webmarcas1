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
  create_lead?: boolean;
  data: {
    nome?: string;
    email?: string;
    marca?: string;
    phone?: string;
    data_assinatura?: string;
    hash_contrato?: string;
    ip_assinatura?: string;
    verification_url?: string;
    link_assinatura?: string;
    data_expiracao?: string;
    base_url?: string;
    senha?: string;
    login_url?: string;
  };
}

// Generate a unique Message-ID for email headers
function generateMessageId(domain: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `<${timestamp}.${random}@${domain}>`;
}

// Extract domain from email address
function extractDomain(email: string): string {
  const match = email.match(/@([^>]+)/);
  return match ? match[1] : 'webmarcas.net';
}

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;
      const errorMsg = (error as Error)?.message || "";
      
      // Don't retry on permanent errors
      if (errorMsg.includes("550") || errorMsg.includes("553") || errorMsg.includes("554") || errorMsg.includes("535")) {
        console.log(`Permanent error detected (attempt ${attempt + 1}): ${errorMsg}`);
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Rate limiter
const emailsSentThisMinute: { count: number; resetAt: number } = { count: 0, resetAt: Date.now() + 60000 };
const MAX_EMAILS_PER_MINUTE = 5;

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  if (now > emailsSentThisMinute.resetAt) {
    emailsSentThisMinute.count = 0;
    emailsSentThisMinute.resetAt = now + 60000;
  }
  
  if (emailsSentThisMinute.count >= MAX_EMAILS_PER_MINUTE) {
    const waitTime = emailsSentThisMinute.resetAt - now + 1000;
    console.log(`Rate limit reached, waiting ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    emailsSentThisMinute.count = 0;
    emailsSentThisMinute.resetAt = Date.now() + 60000;
  }
  
  emailsSentThisMinute.count++;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trigger_event, lead_id, create_lead, data }: TriggerRequest = await req.json();
    
    console.log(`Processing email automation for trigger: ${trigger_event}`);
    console.log('Data received:', JSON.stringify(data, null, 2));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine app_url
    const appUrl = data.base_url || Deno.env.get('SITE_URL');
    if (!appUrl) {
      console.error('No base_url provided and SITE_URL secret not configured');
      return new Response(
        JSON.stringify({ error: 'SITE_URL not configured. Please set the SITE_URL secret.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('Using app URL:', appUrl);

    let actualLeadId = lead_id;

    // Handle lead creation for form_started
    if (create_lead && trigger_event === 'form_started' && data.email) {
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', data.email)
        .single();

      if (existingLead) {
        actualLeadId = existingLead.id;
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
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            full_name: data.nome || 'Lead',
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

    // Fetch active template for the event
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

    // Fetch default email account
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

    // Replace template variables
    let subject = template.subject;
    let body = template.body;

    const replacements: Record<string, string> = {
      '{{nome}}': data.nome || '',
      '{{nome_cliente}}': data.nome || '',
      '{{email}}': data.email || '',
      '{{marca}}': data.marca || 'Sua Marca',
      '{{nome_marca}}': data.marca || 'Sua Marca',
      '{{data_assinatura}}': data.data_assinatura || new Date().toLocaleDateString('pt-BR'),
      '{{hash_contrato}}': data.hash_contrato || '',
      '{{ip_assinatura}}': data.ip_assinatura || '',
      '{{verification_url}}': data.verification_url || '',
      '{{link_assinatura}}': data.link_assinatura || '',
      '{{data_expiracao}}': data.data_expiracao || '',
      '{{app_url}}': appUrl,
      '{{link_area_cliente}}': data.login_url || `${appUrl}/cliente/login`,
      '{{login_url}}': data.login_url || `${appUrl}/cliente/login`,
      '{{senha}}': data.senha || '',
      '{{numero_processo}}': '',
    };

    for (const [key, value] of Object.entries(replacements)) {
      subject = subject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
      body = body.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    // Check recipient email
    if (!data.email) {
      console.error('No recipient email provided');
      return new Response(
        JSON.stringify({ error: 'Email do destinatário não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Wait for rate limit
    await waitForRateLimit();

    const domain = extractDomain(emailAccount.email_address);
    const messageId = generateMessageId(domain);

    // Configure SMTP client
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

    const fromAddress = emailAccount.display_name 
      ? `${emailAccount.display_name} <${emailAccount.email_address}>`
      : emailAccount.email_address;

    // Wrap body in professional HTML template
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  ${body}
</body>
</html>`;

    // Send email with retry
    await retryWithBackoff(async () => {
      await client.send({
        from: fromAddress,
        to: data.email!,
        subject: subject,
        html: htmlContent,
        headers: {
          "Message-ID": messageId,
          "X-Mailer": "WebMarcas CRM",
          "X-Priority": "3",
          "Importance": "Normal",
        },
      });
    });

    await client.close();

    console.log(`Email sent successfully to ${data.email}`);

    // Log the email
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        from_email: emailAccount.email_address,
        to_email: data.email,
        subject: subject,
        body: body.replace(/<[^>]*>/g, '').substring(0, 500),
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
        to: data.email,
        messageId
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
