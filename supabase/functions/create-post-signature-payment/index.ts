import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_API_URL = "https://api.asaas.com/v3";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractId } = await req.json();

    if (!contractId) {
      return new Response(
        JSON.stringify({ error: 'contractId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Asaas API key
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
    if (!ASAAS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ASAAS_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch contract with user profile
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email,
          phone,
          cpf_cnpj,
          address,
          city,
          state,
          zip_code
        )
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      console.error('Contract fetch error:', contractError);
      return new Response(
        JSON.stringify({ error: 'Contrato não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profile = contract.profiles;
    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Perfil do cliente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentMethod = contract.payment_method || 'avista';
    
    // Determine payment configuration based on method
    let billingType: string;
    let totalValue: number;
    let installmentCount: number | undefined;
    let installmentValue: number | undefined;

    switch (paymentMethod) {
      case 'cartao6x':
        // For credit card, we don't create Asaas payment here
        // The CreditCardForm will create it via process-credit-card-payment
        billingType = 'CREDIT_CARD';
        totalValue = 1194;
        installmentCount = 6;
        installmentValue = 199;
        break;
      case 'boleto3x':
        billingType = 'BOLETO';
        totalValue = 1197;
        installmentCount = 3;
        installmentValue = 399;
        break;
      case 'avista':
      default:
        billingType = 'PIX';
        totalValue = 699;
        break;
    }

    console.log(`Creating payment for contract ${contractId}, method: ${paymentMethod}, type: ${billingType}`);

    // For credit card, return the data needed for the frontend form
    if (paymentMethod === 'cartao6x') {
      // Check if customer already exists in Asaas
      let customerId = null;
      
      // Search for existing customer by CPF/CNPJ
      const cpfCnpj = profile.cpf_cnpj?.replace(/\D/g, '') || '';
      if (cpfCnpj) {
        const searchResponse = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${cpfCnpj}`, {
          headers: {
            'access_token': ASAAS_API_KEY,
            'Content-Type': 'application/json',
          },
        });
        const searchData = await searchResponse.json();
        if (searchData.data && searchData.data.length > 0) {
          customerId = searchData.data[0].id;
          console.log('Found existing Asaas customer:', customerId);
        }
      }

      // Create customer if not exists
      if (!customerId) {
        const customerPayload = {
          name: profile.full_name || 'Cliente',
          email: profile.email,
          phone: profile.phone?.replace(/\D/g, '') || '',
          cpfCnpj: cpfCnpj,
          postalCode: profile.zip_code?.replace(/\D/g, '') || '',
          address: profile.address || '',
          addressNumber: 'S/N',
          province: profile.city || '',
          notificationDisabled: false,
        };

        const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
          method: 'POST',
          headers: {
            'access_token': ASAAS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customerPayload),
        });

        const customerData = await customerResponse.json();
        
        if (!customerResponse.ok) {
          console.error('Asaas customer error:', customerData);
          return new Response(
            JSON.stringify({ error: 'Erro ao criar cliente no Asaas', details: customerData }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        customerId = customerData.id;
        console.log('Created Asaas customer:', customerId);
      }

      // Create internal invoice record for credit card
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: profile.id,
          contract_id: contractId,
          amount: totalValue,
          status: 'pending',
          due_date: dueDate.toISOString().split('T')[0],
          description: `Registro de Marca - ${contract.subject || 'Contrato'}`,
          asaas_customer_id: customerId,
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('Invoice creation error:', invoiceError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar fatura interna', details: invoiceError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          paymentMethod: 'cartao6x',
          requiresCreditCardForm: true,
          data: {
            customerId,
            invoiceId: invoice.id,
            contractId,
            value: totalValue,
            installmentCount,
            installmentValue,
            dueDate: dueDate.toISOString().split('T')[0],
            holderName: profile.full_name || '',
            holderEmail: profile.email || '',
            holderCpfCnpj: cpfCnpj,
            holderPostalCode: profile.zip_code?.replace(/\D/g, '') || '',
            holderPhone: profile.phone?.replace(/\D/g, '') || '',
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For PIX and Boleto, create Asaas payment directly
    // First, create or find customer
    let customerId = null;
    const cpfCnpj = profile.cpf_cnpj?.replace(/\D/g, '') || '';
    
    if (cpfCnpj) {
      const searchResponse = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${cpfCnpj}`, {
        headers: {
          'access_token': ASAAS_API_KEY,
          'Content-Type': 'application/json',
        },
      });
      const searchData = await searchResponse.json();
      if (searchData.data && searchData.data.length > 0) {
        customerId = searchData.data[0].id;
      }
    }

    if (!customerId) {
      const customerPayload = {
        name: profile.full_name || 'Cliente',
        email: profile.email,
        phone: profile.phone?.replace(/\D/g, '') || '',
        cpfCnpj: cpfCnpj,
        postalCode: profile.zip_code?.replace(/\D/g, '') || '',
        address: profile.address || '',
        addressNumber: 'S/N',
        province: profile.city || '',
        notificationDisabled: false,
      };

      const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: {
          'access_token': ASAAS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerPayload),
      });

      const customerData = await customerResponse.json();
      if (!customerResponse.ok) {
        console.error('Asaas customer error:', customerData);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar cliente no Asaas', details: customerData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      customerId = customerData.id;
    }

    // Create payment in Asaas
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const paymentPayload: Record<string, any> = {
      customer: customerId,
      billingType,
      value: paymentMethod === 'boleto3x' ? installmentValue : totalValue,
      dueDate: dueDate.toISOString().split('T')[0],
      description: `Registro de Marca - ${contract.subject || 'Contrato'}`,
      externalReference: contractId,
    };

    // For boleto installments
    if (paymentMethod === 'boleto3x') {
      paymentPayload.installmentCount = installmentCount;
      paymentPayload.installmentValue = installmentValue;
    }

    const paymentResponse = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      console.error('Asaas payment error:', paymentData);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar cobrança no Asaas', details: paymentData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Asaas payment created:', paymentData.id);

    // Fetch PIX QR code if applicable
    let pixQrCode = null;
    let pixPayload = null;
    if (billingType === 'PIX') {
      try {
        const pixResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentData.id}/pixQrCode`, {
          headers: {
            'access_token': ASAAS_API_KEY,
            'Content-Type': 'application/json',
          },
        });
        const pixData = await pixResponse.json();
        if (pixResponse.ok) {
          pixQrCode = pixData.encodedImage;
          pixPayload = pixData.payload;
        }
      } catch (e) {
        console.error('Error fetching PIX QR code:', e);
      }
    }

    // Create internal invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: profile.id,
        contract_id: contractId,
        amount: totalValue,
        status: 'pending',
        due_date: dueDate.toISOString().split('T')[0],
        description: `Registro de Marca - ${contract.subject || 'Contrato'}`,
        asaas_payment_id: paymentData.id,
        asaas_customer_id: customerId,
        payment_link: paymentData.invoiceUrl,
        pix_qr_code: pixQrCode,
        pix_payload: pixPayload,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Invoice creation error:', invoiceError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentMethod,
        requiresCreditCardForm: false,
        data: {
          paymentId: paymentData.id,
          invoiceId: invoice?.id,
          invoiceUrl: paymentData.invoiceUrl,
          bankSlipUrl: paymentData.bankSlipUrl,
          pixQrCode,
          pixPayload,
          value: totalValue,
          dueDate: dueDate.toISOString().split('T')[0],
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in create-post-signature-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
