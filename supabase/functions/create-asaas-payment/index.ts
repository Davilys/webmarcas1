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
  userId?: string;
}

interface ContractTemplate {
  id: string;
  name: string;
  content: string;
  is_active: boolean;
}

// Helper function to replace template variables with actual data
function replaceContractVariables(
  template: string,
  data: {
    personalData: PersonalData;
    brandData: BrandData;
    paymentMethod: string;
  }
): string {
  const { personalData, brandData, paymentMethod } = data;

  // Format current date in Portuguese
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const now = new Date();
  const currentDate = `${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;

  // Build complete address
  const enderecoCompleto = `${personalData.address}, ${personalData.neighborhood}, ${personalData.city} - ${personalData.state}, CEP ${personalData.cep}`;

  // Razão social or name
  const razaoSocialOuNome = brandData.hasCNPJ && brandData.companyName 
    ? brandData.companyName 
    : personalData.fullName;

  // CNPJ data
  const dadosCnpj = brandData.hasCNPJ && brandData.cnpj 
    ? `inscrita no CNPJ sob nº ${brandData.cnpj}, ` 
    : '';

  // Payment method details
  const getPaymentDetails = () => {
    switch (paymentMethod) {
      case 'avista':
        return `• Pagamento à vista via PIX: R$ 699,00 (seiscentos e noventa e nove reais) - com 43% de desconto sobre o valor integral de R$ 1.230,00.`;
      case 'cartao6x':
        return `• Pagamento parcelado no Cartão de Crédito: 6x de R$ 199,00 (cento e noventa e nove reais) = Total: R$ 1.194,00 - sem juros.`;
      case 'boleto3x':
        return `• Pagamento parcelado via Boleto Bancário: 3x de R$ 399,00 (trezentos e noventa e nove reais) = Total: R$ 1.197,00.`;
      default:
        return `• Forma de pagamento a ser definida.`;
    }
  };

  // CPF or CNPJ for signature section
  const cpfCnpj = brandData.hasCNPJ && brandData.cnpj 
    ? brandData.cnpj 
    : personalData.cpf;

  // Replace all variables
  let result = template
    .replace(/\{\{nome_cliente\}\}/g, personalData.fullName)
    .replace(/\{\{cpf\}\}/g, personalData.cpf)
    .replace(/\{\{cpf_cnpj\}\}/g, cpfCnpj)
    .replace(/\{\{email\}\}/g, personalData.email)
    .replace(/\{\{telefone\}\}/g, personalData.phone)
    .replace(/\{\{marca\}\}/g, brandData.brandName)
    .replace(/\{\{ramo_atividade\}\}/g, brandData.businessArea)
    .replace(/\{\{endereco_completo\}\}/g, enderecoCompleto)
    .replace(/\{\{endereco\}\}/g, personalData.address)
    .replace(/\{\{bairro\}\}/g, personalData.neighborhood)
    .replace(/\{\{cidade\}\}/g, personalData.city)
    .replace(/\{\{estado\}\}/g, personalData.state)
    .replace(/\{\{cep\}\}/g, personalData.cep)
    .replace(/\{\{razao_social_ou_nome\}\}/g, razaoSocialOuNome)
    .replace(/\{\{dados_cnpj\}\}/g, dadosCnpj)
    .replace(/\{\{forma_pagamento_detalhada\}\}/g, getPaymentDetails())
    .replace(/\{\{data_extenso\}\}/g, currentDate)
    .replace(/\{\{data\}\}/g, now.toLocaleDateString('pt-BR'));

  return result;
}

// Generate full HTML for the contract with the standard layout
function generateContractHtml(content: string): string {
  const htmlContent = content
    .split('\n')
    .filter(line => !line.includes('CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS'))
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '<div style="height: 12px;"></div>';
      
      if (/^\d+\.\s*CLÁUSULA/.test(trimmed)) {
        return `<h2 style="font-weight: bold; font-size: 12px; color: #0284c7; margin-top: 20px; margin-bottom: 8px;">${trimmed}</h2>`;
      }
      
      if (/^\d+\.\d+\s/.test(trimmed)) {
        return `<p style="font-size: 11px; margin-bottom: 8px; padding-left: 16px;">${trimmed}</p>`;
      }
      
      if (/^[a-z]\)/.test(trimmed)) {
        return `<p style="font-size: 11px; margin-bottom: 4px; padding-left: 32px;">${trimmed}</p>`;
      }
      
      if (trimmed.startsWith('•')) {
        return `<p style="font-size: 11px; margin-bottom: 8px; padding-left: 16px;">${trimmed}</p>`;
      }
      
      if (/^I+\)/.test(trimmed)) {
        return `<p style="font-size: 11px; margin-bottom: 12px; font-weight: 500;">${trimmed}</p>`;
      }
      
      if (trimmed.match(/^_+$/)) return '';
      
      if (trimmed === 'CONTRATADA:' || trimmed === 'CONTRATANTE:') {
        return `<p style="font-size: 11px; font-weight: bold; text-align: center; margin-top: 24px; margin-bottom: 4px;">${trimmed}</p>`;
      }
      
      if (trimmed.includes('WEB MARCAS PATENTES EIRELI') || 
          trimmed.startsWith('CNPJ:') || 
          trimmed.startsWith('CPF:') ||
          trimmed.startsWith('CPF/CNPJ:')) {
        return `<p style="font-size: 10px; text-align: center; color: #6b7280; margin-bottom: 4px;">${trimmed}</p>`;
      }
      
      if (trimmed.startsWith('São Paulo,')) {
        return `<p style="font-size: 11px; margin-top: 24px; margin-bottom: 24px;">${trimmed}</p>`;
      }
      
      return `<p style="font-size: 11px; margin-bottom: 12px; line-height: 1.6;">${trimmed}</p>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato WebMarcas</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #1a1a2e; 
      background: white; 
      padding: 30px; 
      font-size: 11px; 
      max-width: 800px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px;">
    <span style="font-size: 24px; font-weight: bold; color: #0284c7;">WebMarcas</span>
    <span style="color: #0284c7; font-size: 14px;">www.webmarcas.net</span>
  </div>
  
  <div style="height: 8px; background: linear-gradient(90deg, #f97316, #fbbf24); border-radius: 2px; margin-bottom: 20px;"></div>
  
  <h1 style="text-align: center; color: #0284c7; font-size: 18px; font-weight: bold; margin-bottom: 16px;">Acordo do Contrato - Anexo I</h1>
  
  <div style="background-color: #1e3a5f; color: white; text-align: center; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px;">
    <p style="font-weight: 600; font-size: 12px;">CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS DE ASSESSORAMENTO PARA REGISTRO DE MARCA JUNTO AO INPI</p>
  </div>
  
  <div style="background: #fef3c7; padding: 16px; border-radius: 4px; margin-bottom: 24px; border: 1px solid #f59e0b; font-size: 11px;">
    <p style="margin-bottom: 8px;">Os termos deste instrumento aplicam-se apenas a contratações com negociações personalizadas, tratadas diretamente com a equipe comercial da Web Marcas e Patentes Eireli.</p>
    <p>Os termos aqui celebrados são adicionais ao "Contrato de Prestação de Serviços e Gestão de Pagamentos e Outras Avenças" com aceite integral no momento do envio da Proposta.</p>
  </div>
  
  <div>
    ${htmlContent}
  </div>
  
  <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 9px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
    <p>Contrato gerado e assinado eletronicamente pelo sistema WebMarcas</p>
    <p>www.webmarcas.net | contato@webmarcas.net</p>
  </div>
</body>
</html>`;
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

    // Capture client info for signature
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     req.headers.get('cf-connecting-ip') ||
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Create Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { personalData, brandData, paymentMethod, paymentValue, contractHtml: providedContractHtml, userId }: PaymentRequest = await req.json();

    console.log('Creating Asaas payment for:', personalData.fullName, '| Method:', paymentMethod);

    // ========================================
    // STEP 0: Fetch the contract template from database
    // This ensures we ALWAYS use the admin-defined template
    // ========================================
    let contractHtml = providedContractHtml;
    let templateId: string | null = null;

    // Always fetch the template from database to ensure we use the latest version
    const { data: templateData, error: templateError } = await supabaseAdmin
      .from('contract_templates')
      .select('id, name, content, is_active')
      .eq('is_active', true)
      .or(`name.ilike.%Contrato Padrão - Registro de Marca INPI%,name.ilike.%Registro de Marca%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (templateData && templateData.length > 0) {
      const template = templateData[0] as ContractTemplate;
      templateId = template.id;
      console.log('Using template from database:', template.name);

      // Replace variables with actual data
      const processedContent = replaceContractVariables(template.content, {
        personalData,
        brandData,
        paymentMethod,
      });

      // Generate full HTML
      contractHtml = generateContractHtml(processedContent);
      console.log('Generated contract HTML from template');
    } else {
      console.log('No template found in database, using provided HTML or generating fallback');
      if (!contractHtml) {
        // Generate basic fallback
        contractHtml = `<html><body><h1>Contrato de Registro de Marca</h1><p>Cliente: ${personalData.fullName}</p><p>Marca: ${brandData.brandName}</p></body></html>`;
      }
    }

    // ========================================
    // STEP 0.1: Normalize CPF/CNPJ and prepare unique identifier
    // ========================================
    const cpfCnpj = brandData.hasCNPJ && brandData.cnpj 
      ? brandData.cnpj.replace(/\D/g, '') 
      : personalData.cpf.replace(/\D/g, '');
    
    // Format CPF for storage (XXX.XXX.XXX-XX)
    const formattedCpf = cpfCnpj.length === 11 
      ? cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      : cpfCnpj.length === 14 
        ? cpfCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
        : cpfCnpj;

    // ========================================
    // STEP 0.1: Check for existing PROFILE by CPF (UNIQUE KEY)
    // This prevents duplicate clients in the CRM
    // ========================================
    let existingProfileId: string | null = null;
    
    // First try formatted CPF
    const { data: profileByCpf } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('cpf_cnpj', formattedCpf)
      .maybeSingle();
    
    if (profileByCpf) {
      existingProfileId = profileByCpf.id;
      console.log('Found existing profile by formatted CPF:', existingProfileId);
    } else {
      // Try with raw digits
      const { data: profileByRawCpf } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name')
        .eq('cpf_cnpj', cpfCnpj)
        .maybeSingle();
      
      if (profileByRawCpf) {
        existingProfileId = profileByRawCpf.id;
        console.log('Found existing profile by raw CPF:', existingProfileId);
      }
    }
    
    // If no profile found by CPF, try by email
    if (!existingProfileId) {
      const { data: profileByEmail } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', personalData.email)
        .maybeSingle();
      
      if (profileByEmail) {
        existingProfileId = profileByEmail.id;
        console.log('Found existing profile by email:', existingProfileId);
      }
    }
    
    // Use the found profile ID if we have a userId from session, otherwise use found profile
    const effectiveUserId = userId || existingProfileId;
    
    if (existingProfileId) {
      // Update existing profile with any new data (except CPF which is unique)
      await supabaseAdmin
        .from('profiles')
        .update({
          full_name: personalData.fullName,
          phone: personalData.phone,
          address: personalData.address,
          neighborhood: personalData.neighborhood,
          city: personalData.city,
          state: personalData.state,
          zip_code: personalData.cep,
          company_name: brandData.hasCNPJ ? brandData.companyName : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProfileId);
      console.log('Updated existing profile with new data');
    }

    // ========================================
    // STEP 1: Create/Update Lead in database
    // ========================================
    // Check if lead already exists by email or CPF/CNPJ
    const { data: existingLead } = await supabaseAdmin
      .from('leads')
      .select('id')
      .or(`email.eq.${personalData.email},cpf_cnpj.eq.${cpfCnpj}`)
      .maybeSingle();

    let leadId: string = '';

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
    // STEP 3: Create Payment in Asaas (ONLY for PIX and Boleto)
    // For Credit Card: DO NOT create payment here - it will be created
    // when user submits card data via process-credit-card-payment
    // ========================================
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateString = dueDate.toISOString().split('T')[0];

    let billingType = 'PIX';
    let installmentCount = 1;
    let installmentValue = paymentValue;
    let paymentId: string | null = null;
    let paymentData: Record<string, unknown> = {};
    let pixQrCode = null;

    // CRITICAL: For credit card, we do NOT create a payment in Asaas here
    // The payment will be created when the user submits their card data
    const isCardPayment = paymentMethod === 'cartao6x';

    if (!isCardPayment) {
      // PIX or Boleto - create payment now
      if (paymentMethod === 'boleto3x') {
        billingType = 'BOLETO';
        installmentCount = 3;
        installmentValue = Math.round((paymentValue / 3) * 100) / 100;
      }
      // else: PIX (default)

      const paymentPayload: Record<string, unknown> = {
        customer: customerId,
        billingType: billingType,
        dueDate: dueDateString,
        description: `Registro de marca: ${brandData.brandName}`,
        externalReference: `marca_${brandData.brandName.replace(/\s+/g, '_')}_${Date.now()}`,
      };

      // For installment payments, use installmentCount and installmentValue
      if (installmentCount > 1) {
        paymentPayload.installmentCount = installmentCount;
        paymentPayload.installmentValue = installmentValue;
      } else {
        paymentPayload.value = paymentValue;
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

      paymentData = await paymentResponse.json();
      console.log('Payment creation response:', JSON.stringify(paymentData));

      if (paymentData.errors) {
        throw new Error(`Error creating payment: ${JSON.stringify(paymentData.errors)}`);
      }

      paymentId = paymentData.id as string;
      console.log('Created payment:', paymentId);

      // Get PIX QR Code if applicable
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
    } else {
      // Credit card - set proper values for internal tracking
      billingType = 'CREDIT_CARD';
      installmentCount = 6;
      installmentValue = Math.round((paymentValue / 6) * 100) / 100;
      console.log('Credit card payment - will be processed when user submits card data');
    }

    // ========================================
    // STEP 4: Update Lead with payment info
    // ========================================
    if (leadId) {
      await supabaseAdmin
        .from('leads')
        .update({
          status: 'em_negociacao',
          notes: `Marca: ${brandData.brandName} | Ramo: ${brandData.businessArea} | Pagamento: ${paymentMethod}${paymentId ? ` | Asaas: ${paymentId}` : ''}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);
    }

    // ========================================
    // STEP 5: Create Contract in database (signed via checkout acceptance)
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
        signature_status: 'signed', // Marked as signed when customer accepts terms in checkout
        signed_at: new Date().toISOString(), // Electronic acceptance date
        signature_ip: clientIP,
        signature_user_agent: userAgent,
        signatory_name: personalData.fullName, // Store signatory name
        signatory_cpf: formattedCpf, // Store signatory CPF/CNPJ
        signatory_cnpj: brandData.hasCNPJ ? brandData.cnpj : null,
        template_id: templateId, // Link to the template used
        asaas_payment_id: paymentId || null, // Will be filled for card after payment
        lead_id: leadId || null,
        user_id: effectiveUserId || null, // Use effective user ID (found profile or session)
        contract_html: contractHtml || null,
        visible_to_client: true,
      })
      .select('id')
      .single();

    if (contractError) {
      console.error('Error creating contract:', contractError);
    } else {
      console.log('Created contract:', contractData?.id);

      // Create Document entry for contract (CRM sync) - ALWAYS create, even without userId
      // Link to contract_id for proper synchronization
      if (contractData?.id) {
        const { error: docError } = await supabaseAdmin
          .from('documents')
          .insert({
            name: `Contrato ${contractNumber} - ${brandData.brandName}`,
            document_type: 'contrato',
            file_url: '', // Will be updated when PDF is generated
            user_id: effectiveUserId || null, // Use effective user ID
            contract_id: contractData.id, // Critical: link to contract for sync
            uploaded_by: 'system',
          });

        if (docError) {
          console.error('Error creating document entry:', docError);
        } else {
          console.log('Created document entry for contract with contract_id:', contractData.id);
        }
      }

      // Create Brand Process entry (CRM sync) - Use effectiveUserId
      if (effectiveUserId) {
        const { data: existingProcess } = await supabaseAdmin
          .from('brand_processes')
          .select('id')
          .eq('user_id', effectiveUserId)
          .eq('brand_name', brandData.brandName)
          .maybeSingle();

        if (!existingProcess) {
          const { error: processError } = await supabaseAdmin
            .from('brand_processes')
            .insert({
              user_id: effectiveUserId, // Use effective user ID
              brand_name: brandData.brandName,
              business_area: brandData.businessArea,
              status: 'em_andamento',
              pipeline_stage: 'protocolado',
              notes: `Pagamento: ${paymentMethod} | Valor: R$ ${paymentValue}`,
            });

          if (processError) {
            console.error('Error creating brand process:', processError);
          } else {
            console.log('Created brand process for:', brandData.brandName);
          }
        } else {
          console.log('Brand process already exists:', existingProcess.id);
        }
      }

      // ========================================
      // STEP 5.1: Sign contract on blockchain - ALWAYS sign when contract is created
      // This ensures blockchain evidence is captured immediately upon checkout acceptance
      // ========================================
      if (contractData?.id) {
        try {
          // Use contractHtml if provided, otherwise create a minimal record
          const htmlToSign = contractHtml || `Contrato ${contractNumber} - Registro de Marca: ${brandData.brandName} - Cliente: ${personalData.fullName} - CPF/CNPJ: ${cpfCnpj}`;
          
          console.log('Triggering blockchain signature for contract:', contractData.id);
          
          const signResponse = await fetch(`${SUPABASE_URL}/functions/v1/sign-contract-blockchain`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              contractId: contractData.id,
              contractHtml: htmlToSign,
              deviceInfo: {
                ip_address: clientIP,
                user_agent: userAgent,
                timestamp: new Date().toISOString(),
              },
              leadId: leadId || null,
              baseUrl: 'https://webmarcas.lovable.app',
            }),
          });

          if (signResponse.ok) {
            const signData = await signResponse.json();
            console.log('Contract signed on blockchain:', signData?.data?.hash);
          } else {
            const errorText = await signResponse.text();
            console.error('Error signing contract on blockchain:', errorText);
          }
        } catch (signError) {
          console.error('Error triggering blockchain signature:', signError);
          // Don't fail the payment flow
        }
      }
    }

    // ========================================
    // STEP 6: Create Invoice in database with payment details
    // For credit card: create invoice WITHOUT asaas_invoice_id (will be set after payment)
    // ========================================
    const invoiceDescription = `Registro de marca: ${brandData.brandName}`;
    const { data: invoiceData, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        description: invoiceDescription,
        amount: paymentValue,
        due_date: dueDateString,
        status: 'pending',
        user_id: effectiveUserId || null, // Use effective user ID
        // For card payments: NO invoice_url, boleto_code, pix_code, or asaas_invoice_id yet
        invoice_url: isCardPayment ? null : (paymentData.invoiceUrl as string || null),
        pix_code: isCardPayment ? null : (pixQrCode?.payload || null),
        boleto_code: isCardPayment ? null : (paymentData.bankSlipUrl as string || null),
        asaas_invoice_id: isCardPayment ? null : paymentId,
        payment_method: billingType === 'PIX' ? 'pix' : billingType === 'BOLETO' ? 'boleto' : 'credit_card',
      })
      .select('id')
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
    } else {
      console.log('Created invoice:', invoiceData?.id);
    }

    // ========================================
    // STEP 7: Trigger form_completed email automation
    // ========================================
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/trigger-email-automation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          trigger_event: 'form_completed',
          lead_id: leadId || null,
          data: {
            nome: personalData.fullName,
            email: personalData.email,
            marca: brandData.brandName,
          },
        }),
      });
      console.log('Triggered form_completed email automation');
    } catch (emailError) {
      console.error('Error triggering form_completed email:', emailError);
    }

    // ========================================
    // STEP 8: Return response
    // ========================================
    const response = {
      success: true,
      customerId,
      asaasCustomerId,
      paymentId: paymentId || null,
      leadId: leadId || null,
      contractId: contractData?.id || null,
      invoiceId: invoiceData?.id || null,
      contractNumber,
      status: isCardPayment ? 'PENDING_CARD' : paymentData.status,
      billingType,
      value: paymentValue,
      installmentCount,
      installmentValue,
      dueDate: dueDateString,
      // For card payments: no invoiceUrl or bankSlipUrl
      invoiceUrl: isCardPayment ? null : (paymentData.invoiceUrl || null),
      bankSlipUrl: isCardPayment ? null : (paymentData.bankSlipUrl || null),
      pixQrCode: isCardPayment ? null : pixQrCode,
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
