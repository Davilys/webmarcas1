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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service role — bypasses RLS, can create Auth users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify caller is an admin
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: callerUser } } = await supabaseAuth.auth.getUser();
    if (!callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const clients: ClientToImport[] = body.clients;
    const updateExisting: boolean = body.updateExisting ?? false;

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
      if (!email) { skipped++; continue; }

      // ── Deduplication: check by email ──────────────────────────────────────
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        if (updateExisting) {
          // Only update profile fields — never touch contracts/invoices
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({
              full_name: client.full_name || undefined,
              phone: client.phone || undefined,
              company_name: client.company_name || undefined,
              cpf_cnpj: client.cpf_cnpj || undefined,
              address: client.address || undefined,
              city: client.city || undefined,
              state: client.state || undefined,
              zip_code: client.zip_code || undefined,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingProfile.id);

          if (error) {
            errors++;
            errorDetails.push(`Erro ao atualizar ${email}: ${error.message}`);
          } else {
            updated++;
          }
        } else {
          // Duplicate — skip silently
          skipped++;
        }
        continue;
      }

      // ── New client: same flow as "Novo Cliente" button ────────────────────
      // 1. Create Auth user with fixed password (same as CreateClientDialog)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: '123Mudar@',
        email_confirm: true,
        user_metadata: { full_name: client.full_name || email },
      });

      if (authError || !authData?.user) {
        errors++;
        errorDetails.push(`Erro ao criar usuário auth para ${email}: ${authError?.message}`);
        continue;
      }

      const userId = authData.user.id;

      // 2. Upsert profile (trigger handle_new_user may have auto-created it)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email,
          full_name: client.full_name || null,
          phone: client.phone || null,
          company_name: client.company_name || null,
          cpf_cnpj: client.cpf_cnpj || null,
          address: client.address || null,
          city: client.city || null,
          state: client.state || null,
          zip_code: client.zip_code || null,
          origin: 'import',
          priority: client.priority || 'medium',
          client_funnel_type: 'juridico',
          created_by: callerUser.id,
          assigned_to: callerUser.id,
        });

      if (profileError) {
        // Trigger may have already inserted — try update as fallback
        await supabaseAdmin
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
            origin: 'import',
            priority: client.priority || 'medium',
            client_funnel_type: 'juridico',
            created_by: callerUser.id,
            assigned_to: callerUser.id,
          })
          .eq('id', userId);
      }

      // 3. Assign 'user' role so they can log in to the client portal
      await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: 'user' })
        .throwOnError()
        .then(() => {/* ok */})
        .catch(() => {/* ignore duplicate */});

      // 4. Create brand_process → Jurídico > Protocolado (no contract, no invoice)
      const brandName = client.company_name || client.full_name || email;
      const { error: processError } = await supabaseAdmin
        .from('brand_processes')
        .insert({
          user_id: userId,
          brand_name: brandName,
          status: 'em_andamento',
          pipeline_stage: 'protocolado',
        });

      if (processError) {
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
