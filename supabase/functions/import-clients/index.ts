import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClientToImport {
  email: string;
  full_name?: string;
  phone?: string;
  company_name?: string;
  cpf_cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  origin?: string;
  priority?: string;
  contract_value?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify the calling user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service role client — bypasses RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Regular client to verify the caller's role
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { clients, updateExisting = false }: { clients: ClientToImport[], updateExisting: boolean } = await req.json();

    if (!clients || !Array.isArray(clients)) {
      return new Response(JSON.stringify({ error: 'Invalid payload: clients array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const client of clients) {
      const email = client.email?.toLowerCase().trim();
      if (!email) {
        skipped++;
        continue;
      }

      // Check if a profile with this email already exists
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        if (updateExisting) {
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({
              full_name: client.full_name || null,
              phone: client.phone || null,
              company_name: client.company_name || null,
              cpf_cnpj: client.cpf_cnpj || null,
              address: client.address || null,
              city: client.city || null,
              state: client.state || null,
              zip_code: client.zip_code || null,
              origin: client.origin || null,
              priority: client.priority || null,
              contract_value: client.contract_value || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (error) {
            errors++;
            errorDetails.push(`Erro ao atualizar ${email}: ${error.message}`);
          } else {
            updated++;
          }
        } else {
          skipped++;
        }
        continue;
      }

      // Insert new profile using service role (bypasses RLS)
      const profileId = crypto.randomUUID();
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: profileId,
          email,
          full_name: client.full_name || null,
          phone: client.phone || null,
          company_name: client.company_name || null,
          cpf_cnpj: client.cpf_cnpj || null,
          address: client.address || null,
          city: client.city || null,
          state: client.state || null,
          zip_code: client.zip_code || null,
          origin: client.origin || 'import',
          priority: client.priority || 'medium',
          contract_value: client.contract_value || null,
          client_funnel_type: 'juridico',
        });

      if (insertError) {
        errors++;
        errorDetails.push(`Erro ao inserir ${email}: ${insertError.message}`);
        continue;
      }

      // Create brand_process entry → Jurídico > Protocolado
      const { error: processError } = await supabaseAdmin
        .from('brand_processes')
        .insert({
          user_id: profileId,
          brand_name: client.company_name || client.full_name || email,
          status: 'em_andamento',
          pipeline_stage: 'protocolado',
        });

      if (processError) {
        // Non-fatal: profile was created, just log the process error
        errorDetails.push(`Aviso: processo não criado para ${email}: ${processError.message}`);
      }

      imported++;
    }

    return new Response(
      JSON.stringify({ imported, updated, skipped, errors, errorDetails }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('import-clients error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
