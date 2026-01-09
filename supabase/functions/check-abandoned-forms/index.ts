import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Checking for abandoned forms...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar leads abandonados há mais de 24 horas
    // - form_started_at existe e é maior que 24 horas
    // - status não é 'convertido' ou 'perdido'
    // - não enviou lembrete nas últimas 48 horas
    // - email_opt_out é false
    const { data: abandonedLeads, error: queryError } = await supabase
      .from('leads')
      .select('*')
      .not('form_started_at', 'is', null)
      .not('status', 'in', '("convertido","perdido")')
      .eq('email_opt_out', false)
      .not('email', 'is', null);

    if (queryError) {
      console.error('Error querying leads:', queryError);
      throw queryError;
    }

    console.log(`Found ${abandonedLeads?.length || 0} total leads to check`);

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Filtrar leads que realmente atendem aos critérios
    const leadsToNotify = (abandonedLeads || []).filter(lead => {
      const formStarted = new Date(lead.form_started_at);
      const lastReminder = lead.last_reminder_sent_at ? new Date(lead.last_reminder_sent_at) : null;

      // Formulário iniciado há mais de 24 horas
      const abandonedMoreThan24h = formStarted < twentyFourHoursAgo;
      
      // Não enviou lembrete ou enviou há mais de 48 horas
      const canSendReminder = !lastReminder || lastReminder < fortyEightHoursAgo;

      return abandonedMoreThan24h && canSendReminder;
    });

    console.log(`${leadsToNotify.length} leads qualify for abandoned form reminder`);

    let emailsSent = 0;
    const errors: string[] = [];

    for (const lead of leadsToNotify) {
      try {
        // Chamar a função de automação de email
        const response = await fetch(`${supabaseUrl}/functions/v1/trigger-email-automation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            trigger_event: 'form_abandoned',
            lead_id: lead.id,
            data: {
              nome: lead.full_name,
              email: lead.email,
              marca: lead.company_name || 'Sua Marca',
            },
          }),
        });

        const result = await response.json();

        if (result.success) {
          emailsSent++;
          
          // Atualizar last_reminder_sent_at
          await supabase
            .from('leads')
            .update({ last_reminder_sent_at: now.toISOString() })
            .eq('id', lead.id);

          console.log(`Reminder sent to ${lead.email}`);
        } else {
          errors.push(`Failed to send to ${lead.email}: ${result.message || result.error}`);
        }
      } catch (err: any) {
        errors.push(`Error processing ${lead.email}: ${err.message}`);
        console.error(`Error processing lead ${lead.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_checked: abandonedLeads?.length || 0,
        qualified: leadsToNotify.length,
        emails_sent: emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in check-abandoned-forms:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
