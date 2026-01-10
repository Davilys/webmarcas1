import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractId, expiresInDays = 7, baseUrl: clientBaseUrl } = await req.json();
    
    if (!contractId) {
      return new Response(
        JSON.stringify({ error: 'contractId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine base URL: priority is clientBaseUrl, then SITE_URL secret
    const baseUrl = clientBaseUrl || Deno.env.get('SITE_URL');
    if (!baseUrl) {
      console.error('No baseUrl provided and SITE_URL secret not configured');
      return new Response(
        JSON.stringify({ error: 'SITE_URL not configured. Please set the SITE_URL secret or provide baseUrl.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('Using base URL:', baseUrl);

    // Generate unique token
    const token = crypto.randomUUID();
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Update contract with signature token
    const { data: contract, error } = await supabase
      .from('contracts')
      .update({
        signature_token: token,
        signature_expires_at: expiresAt.toISOString(),
      })
      .eq('id', contractId)
      .select('id, subject, user_id')
      .single();

    if (error) {
      console.error('Error updating contract:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar link de assinatura', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log event
    await supabase
      .from('signature_audit_log')
      .insert({
        contract_id: contractId,
        event_type: 'link_generated',
        event_data: {
          expires_at: expiresAt.toISOString(),
          expires_in_days: expiresInDays,
        },
      });

    // Build public URL
    const signatureUrl = `${baseUrl}/assinar/${token}`;

    console.log('Signature link generated:', { contractId, token: token.substring(0, 8) + '...', expiresAt });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          token,
          url: signatureUrl,
          expiresAt: expiresAt.toISOString(),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in generate-signature-link:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
