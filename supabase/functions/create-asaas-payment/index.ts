import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_API_URL = "https://api.asaas.com/v3";

interface PersonalData {
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  cep: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface BrandData {
  brandName: string;
  businessArea: string;
  hasCNPJ: boolean;
  cnpj: string;
  companyName: string;
}

interface PaymentRequest {
  personalData: PersonalData;
  brandData: BrandData;
  paymentMethod: string;
  paymentValue: number;
  contractHtml?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { personalData, brandData, paymentMethod, paymentValue, contractHtml }: PaymentRequest = await req.json();

    console.log('Creating Asaas payment for:', personalData.fullName);

    // ========================================
    // STEP 1: Create Lead in database
    // ========================================
    const cpfCnpj = brandData.hasCNPJ && brandData.cnpj 
      ? brandData.cnpj.replace(/\D/g, '') 
      : personalData.cpf.replace(/\D/g, '');

    // Check if lead already exists by email or CPF/CNPJ
    const { data: existingLead } = await supabaseAdmin
      .from('leads')
      .select('id')
      .or(`email.eq.${personalData.email},cpf_cnpj.eq.${cpfCnpj}`)
      .limit(1)
      .single();

    let leadId: string;

    if (existingLead) {
      leadId = existingLead.id;
      // Update existing lead
      await supabaseAdmin
        .from('leads')
        .update({
          full_name: personalData.fullName,
          email: personalData.email,
          phone: personalData.phone,
          cpf_cnpj: cpfCnpj,
          company_name: brandData.hasCNPJ ? brandData.companyName : null,
          address: personalData.address,
          city: personalData.city,
          state: personalData.state,
          zip_code: personalData.cep,
          status: 'em_negociacao',
          notes: `Marca: ${brandData.brandName} | Ramo: ${brandData.businessArea} | Pagamento: ${paymentMethod}`,
          estimated_value: paymentValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);
      console.log('Updated existing lead:', leadId);
    } else {
      // Create new lead
      const { data: newLead, error: leadError } = await supabaseAdmin
        .from('leads')
        .insert({
          full_name: personalData.fullName,
          email: personalData.email,
          phone: personalData.phone,
          cpf_cnpj: cpfCnpj,
          company_name: brandData.hasCNPJ ? brandData.companyName : null,
          address: personalData.address,
          city: personalData.city,
          state: personalData.state,
          zip_code: personalData.cep,
          status: 'novo',
          origin: 'site',
          notes: `Marca: ${brandData.brandName} | Ramo: ${brandData.businessArea} | Pagamento: ${paymentMethod}`,
          estimated_value: paymentValue,
        })
        .select('id')
        .single();

      if (leadError) {
        console.error('Error creating lead:', leadError);
        // Don't fail the payment flow if lead creation fails
      } else {
        leadId = newLead?.id || '';
        console.log('Created new lead:', leadId);
      }
    }

    // ========================================
    // STEP 2: Create/Find Customer in Asaas
    // ========================================
    const existingCustomerResponse = await fetch(
      `${ASAAS_API_URL}/customers?cpfCnpj=${cpfCnpj}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY,
        },
      }
    );

    let customerId: string;
    let asaasCustomerId: string;
    const existingCustomerData = await existingCustomerResponse.json();

    if (existingCustomerData.data && existingCustomerData.data.length > 0) {
      customerId = existingCustomerData.data[0].id;
      asaasCustomerId = customerId;
      console.log('Found existing Asaas customer:', customerId);
    } else {
      // Create new customer
      const customerPayload = {
        name: brandData.hasCNPJ ? brandData.companyName : personalData.fullName,
        cpfCnpj: cpfCnpj,
        email: personalData.email,
        mobilePhone: personalData.phone.replace(/\D/g, ''),
        address: personalData.address,
        addressNumber: '',
        complement: '',
        province: personalData.neighborhood,
        postalCode: personalData.cep.replace(/\D/g, ''),
        externalReference: `webmarcas_${Date.now()}`,
        notificationDisabled: false,
      };

      console.log('Creating customer with payload:', JSON.stringify(customerPayload));

      const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY,
        },
        body: JSON.stringify(customerPayload),
      });

      const customerData = await customerResponse.json();
      console.log('Customer creation response:', JSON.stringify(customerData));

      if (customerData.errors) {
        throw new Error(`Error creating customer: ${JSON.stringify(customerData.errors)}`);
      }

      customerId = customerData.id;
      asaasCustomerId = customerId;
      console.log('Created new Asaas customer:', customerId);
    }

    // ========================================
    // STEP 3: Create Payment in Asaas
    // ========================================
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateString = dueDate.toISOString().split('T')[0];

    let billingType = 'PIX';
    let installmentCount = 1;
    let installmentValue = paymentValue;

    if (paymentMethod === 'cartao6x') {
      billingType = 'CREDIT_CARD';
      installmentCount = 6;
      installmentValue = 199;
    } else if (paymentMethod === 'boleto3x') {
      billingType = 'BOLETO';
      installmentCount = 3;
      installmentValue = 399;
    }

    const paymentPayload: Record<string, unknown> = {
      customer: customerId,
      billingType: billingType,
      value: paymentValue,
      dueDate: dueDateString,
      description: `Registro de marca: ${brandData.brandName}`,
      externalReference: `marca_${brandData.brandName.replace(/\s+/g, '_')}_${Date.now()}`,
    };

    if (installmentCount > 1 && billingType !== 'PIX') {
      paymentPayload.installmentCount = installmentCount;
      paymentPayload.installmentValue = installmentValue;
    }

    console.log('Creating payment with payload:', JSON.stringify(paymentPayload));

    const paymentResponse = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentData = await paymentResponse.json();
    console.log('Payment creation response:', JSON.stringify(paymentData));

    if (paymentData.errors) {
      throw new Error(`Error creating payment: ${JSON.stringify(paymentData.errors)}`);
    }

    const paymentId = paymentData.id;
    console.log('Created payment:', paymentId);

    // ========================================
    // STEP 4: Get PIX QR Code if applicable
    // ========================================
    let pixQrCode = null;
    if (billingType === 'PIX') {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const qrCodeResponse = await fetch(
        `${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY,
          },
        }
      );

      const qrCodeData = await qrCodeResponse.json();
      console.log('QR Code response:', JSON.stringify(qrCodeData));

      if (qrCodeData.encodedImage && qrCodeData.payload) {
        pixQrCode = {
          encodedImage: qrCodeData.encodedImage,
          payload: qrCodeData.payload,
          expirationDate: qrCodeData.expirationDate,
        };
      }
    }

    // ========================================
    // STEP 5: Update Lead with payment info
    // ========================================
    if (leadId!) {
      await supabaseAdmin
        .from('leads')
        .update({
          status: 'em_negociacao',
          notes: `Marca: ${brandData.brandName} | Ramo: ${brandData.businessArea} | Pagamento: ${paymentMethod} | Asaas: ${paymentId}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId!);
    }

    // ========================================
    // STEP 6: Create Contract in database (pending signature)
    // ========================================
    const contractNumber = `WM-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    
    const { data: contractData, error: contractError } = await supabaseAdmin
      .from('contracts')
      .insert({
        contract_number: contractNumber,
        subject: `Registro de Marca: ${brandData.brandName}`,
        description: `Contrato de registro da marca "${brandData.brandName}" no ramo de ${brandData.businessArea}`,
        contract_type: 'registro_marca',
        contract_value: paymentValue,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 years
        signature_status: 'not_signed',
        asaas_payment_id: paymentId,
        lead_id: leadId! || null,
        contract_html: contractHtml || null,
        visible_to_client: true,
      })
      .select('id')
      .single();

    if (contractError) {
      console.error('Error creating contract:', contractError);
    } else {
      console.log('Created contract:', contractData?.id);
    }

    // ========================================
    // STEP 7: Return response
    // ========================================
    const response = {
      success: true,
      customerId,
      asaasCustomerId,
      paymentId,
      leadId: leadId! || null,
      contractId: contractData?.id || null,
      contractNumber,
      status: paymentData.status,
      billingType,
      value: paymentData.value,
      netValue: paymentData.netValue,
      dueDate: paymentData.dueDate,
      invoiceUrl: paymentData.invoiceUrl,
      bankSlipUrl: paymentData.bankSlipUrl,
      pixQrCode,
    };

    console.log('Returning response:', JSON.stringify(response));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    console.error('Error in create-asaas-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
