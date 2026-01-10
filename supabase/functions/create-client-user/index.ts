import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a random temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      full_name,
      phone,
      company_name,
      cpf_cnpj,
      address,
      city,
      state,
      zip_code,
      brand_name,
      business_area,
    } = await req.json();

    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!full_name) {
      return new Response(
        JSON.stringify({ error: 'Nome é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingProfile) {
      // Return existing user ID
      return new Response(
        JSON.stringify({
          success: true,
          userId: existingProfile.id,
          isExisting: true,
          message: 'Cliente já existe no sistema'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
      }
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      return new Response(
        JSON.stringify({ error: authError?.message || 'Erro ao criar usuário' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;

    // Update/insert profile with complete data
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name,
        phone: phone || null,
        company_name: company_name || null,
        cpf_cnpj: cpf_cnpj || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip_code: zip_code || null,
        origin: 'admin_form',
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Profile might be auto-created by trigger, try update
      await supabase
        .from('profiles')
        .update({
          full_name,
          phone: phone || null,
          company_name: company_name || null,
          cpf_cnpj: cpf_cnpj || null,
          address: address || null,
          city: city || null,
          state: state || null,
          zip_code: zip_code || null,
          origin: 'admin_form',
        })
        .eq('id', userId);
    }

    // Create brand process if brand name is provided
    let processId = null;
    if (brand_name) {
      const { data: processData, error: processError } = await supabase
        .from('brand_processes')
        .insert({
          user_id: userId,
          brand_name,
          business_area: business_area || null,
          status: 'em_andamento',
          pipeline_stage: 'protocolado',
        })
        .select('id')
        .single();

      if (processError) {
        console.error('Error creating brand process:', processError);
      } else {
        processId = processData?.id;
      }
    }

    // Assign 'user' role
    await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'user',
      });

    console.log(`Created new client: ${email} (${userId})`);

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        processId,
        isExisting: false,
        tempPassword, // Only for admin reference if needed
        message: 'Cliente criado com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in create-client-user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
