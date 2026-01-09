import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY not configured');
    }

    const { personalData, brandData, paymentMethod, paymentValue }: PaymentRequest = await req.json();

    console.log('Creating Asaas payment for:', personalData.fullName);

    // 1. Create or find customer in Asaas
    const cpfCnpj = brandData.hasCNPJ && brandData.cnpj 
      ? brandData.cnpj.replace(/\D/g, '') 
      : personalData.cpf.replace(/\D/g, '');

    // Check if customer already exists
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
    const existingCustomerData = await existingCustomerResponse.json();

    if (existingCustomerData.data && existingCustomerData.data.length > 0) {
      customerId = existingCustomerData.data[0].id;
      console.log('Found existing customer:', customerId);
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
      console.log('Created new customer:', customerId);
    }

    // 2. Calculate due date (3 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateString = dueDate.toISOString().split('T')[0];

    // 3. Determine billing type based on payment method
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

    // 4. Create payment/charge
    const paymentPayload: Record<string, unknown> = {
      customer: customerId,
      billingType: billingType,
      value: paymentValue,
      dueDate: dueDateString,
      description: `Registro de marca: ${brandData.brandName}`,
      externalReference: `marca_${brandData.brandName.replace(/\s+/g, '_')}_${Date.now()}`,
    };

    // Add installment info for credit card or boleto parcels
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

    // 5. Get PIX QR Code if payment method is PIX
    let pixQrCode = null;
    if (billingType === 'PIX') {
      // Wait a moment for the PIX to be generated
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

    // 6. Return response
    const response = {
      success: true,
      customerId,
      paymentId,
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
