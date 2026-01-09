import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerfexCustomer {
  userid: string;
  company: string;
  vat: string; // CPF/CNPJ
  phonenumber: string;
  city: string;
  state: string;
  zip: string;
  address: string;
  email: string;
  default_language: string;
  active: number;
  datecreated: string;
}

interface PerfexLead {
  id: string;
  name: string;
  company: string;
  email: string;
  phonenumber: string;
  city: string;
  state: string;
  zip: string;
  address: string;
  status: number;
  source: number;
  dateadded: string;
  lastcontact: string;
  description: string;
}

interface PerfexContract {
  id: string;
  subject: string;
  description: string;
  client: string;
  datestart: string;
  dateend: string;
  contract_value: string;
  content: string;
  signed: number;
  not_visible_to_client: number;
}

// Map Perfex lead status to our system
function mapPerfexLeadStatus(perfexStatus: number): string {
  const statusMap: Record<number, string> = {
    1: 'novo',
    2: 'contatado',
    3: 'qualificado',
    4: 'negociacao',
    5: 'convertido',
    6: 'perdido',
  };
  return statusMap[perfexStatus] || 'novo';
}

// Map our lead status to Perfex
function mapToPerfexLeadStatus(status: string): number {
  const statusMap: Record<string, number> = {
    'novo': 1,
    'contatado': 2,
    'qualificado': 3,
    'negociacao': 4,
    'convertido': 5,
    'perdido': 6,
  };
  return statusMap[status] || 1;
}

// Make Perfex API request
async function perfexRequest(
  apiUrl: string,
  apiToken: string,
  endpoint: string,
  method: string = 'GET',
  body?: Record<string, unknown>
): Promise<unknown> {
  const url = `${apiUrl.replace(/\/$/, '')}/api/${endpoint}`;
  
  const headers: Record<string, string> = {
    'authtoken': apiToken,
    'Content-Type': 'application/json',
  };
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perfex API error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    
    const perfexApiUrl = Deno.env.get('PERFEX_API_URL');
    const perfexApiToken = Deno.env.get('PERFEX_API_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!perfexApiUrl || !perfexApiToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'PERFEX_NOT_CONFIGURED',
          message: 'Credenciais do Perfex não configuradas. Configure PERFEX_API_URL e PERFEX_API_TOKEN.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection
    if (action === 'test_connection') {
      try {
        const result = await perfexRequest(perfexApiUrl, perfexApiToken, 'customers');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Conexão com Perfex estabelecida com sucesso!',
            customersCount: Array.isArray(result) ? result.length : 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'CONNECTION_FAILED',
            message: `Falha na conexão: ${errorMessage}` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }
    
    // Import customers from Perfex to our system
    if (action === 'import_customers') {
      const customers = await perfexRequest(perfexApiUrl, perfexApiToken, 'customers') as PerfexCustomer[];
      
      let imported = 0;
      let updated = 0;
      let errors = 0;
      
      for (const customer of customers) {
        try {
          // Check if customer already exists by perfex_customer_id
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('perfex_customer_id', customer.userid)
            .single();
          
          if (existing) {
            // Update existing
            await supabase
              .from('profiles')
              .update({
                company_name: customer.company || null,
                cpf_cnpj: customer.vat || null,
                phone: customer.phonenumber || null,
                city: customer.city || null,
                state: customer.state || null,
                zip_code: customer.zip || null,
                address: customer.address || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);
            updated++;
          } else {
            // Check by email
            const { data: existingByEmail } = await supabase
              .from('profiles')
              .select('id, perfex_customer_id')
              .eq('email', customer.email)
              .single();
            
            if (existingByEmail && !existingByEmail.perfex_customer_id) {
              // Link existing profile to Perfex
              await supabase
                .from('profiles')
                .update({
                  perfex_customer_id: customer.userid,
                  company_name: customer.company || null,
                  cpf_cnpj: customer.vat || null,
                  phone: customer.phonenumber || null,
                  city: customer.city || null,
                  state: customer.state || null,
                  zip_code: customer.zip || null,
                  address: customer.address || null,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingByEmail.id);
              updated++;
            }
            // Note: We can't create new profiles without auth.users entry
          }
        } catch (err) {
          console.error(`Error processing customer ${customer.userid}:`, err);
          errors++;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Importação concluída: ${updated} atualizados, ${errors} erros`,
          stats: { total: customers.length, updated, errors }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Export customers to Perfex
    if (action === 'export_customers') {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .is('perfex_customer_id', null);
      
      let exported = 0;
      let errors = 0;
      
      for (const profile of profiles || []) {
        try {
          const customerData = {
            company: profile.company_name || profile.full_name || 'Cliente',
            vat: profile.cpf_cnpj || '',
            phonenumber: profile.phone || '',
            email: profile.email,
            city: profile.city || '',
            state: profile.state || '',
            zip: profile.zip_code || '',
            address: profile.address || '',
          };
          
          const result = await perfexRequest(
            perfexApiUrl, 
            perfexApiToken, 
            'customers', 
            'POST', 
            customerData
          ) as { userid?: string };
          
          if (result.userid) {
            await supabase
              .from('profiles')
              .update({ perfex_customer_id: result.userid })
              .eq('id', profile.id);
            exported++;
          }
        } catch (err) {
          console.error(`Error exporting profile ${profile.id}:`, err);
          errors++;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Exportação concluída: ${exported} enviados, ${errors} erros`,
          stats: { total: profiles?.length || 0, exported, errors }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Import leads from Perfex
    if (action === 'import_leads') {
      const leads = await perfexRequest(perfexApiUrl, perfexApiToken, 'leads') as PerfexLead[];
      
      let imported = 0;
      let updated = 0;
      let errors = 0;
      
      for (const lead of leads) {
        try {
          // Check if lead exists by email
          const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('email', lead.email)
            .single();
          
          const leadData = {
            full_name: lead.name,
            company_name: lead.company || null,
            email: lead.email || null,
            phone: lead.phonenumber || null,
            city: lead.city || null,
            state: lead.state || null,
            zip_code: lead.zip || null,
            address: lead.address || null,
            status: mapPerfexLeadStatus(lead.status),
            origin: 'perfex',
            notes: lead.description || null,
            updated_at: new Date().toISOString(),
          };
          
          if (existing) {
            await supabase
              .from('leads')
              .update(leadData)
              .eq('id', existing.id);
            updated++;
          } else {
            await supabase
              .from('leads')
              .insert(leadData);
            imported++;
          }
        } catch (err) {
          console.error(`Error processing lead ${lead.id}:`, err);
          errors++;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Leads importados: ${imported} novos, ${updated} atualizados, ${errors} erros`,
          stats: { total: leads.length, imported, updated, errors }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Export leads to Perfex
    if (action === 'export_leads') {
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .neq('origin', 'perfex');
      
      let exported = 0;
      let errors = 0;
      
      for (const lead of leads || []) {
        try {
          const leadData = {
            name: lead.full_name,
            company: lead.company_name || '',
            email: lead.email || '',
            phonenumber: lead.phone || '',
            city: lead.city || '',
            state: lead.state || '',
            zip: lead.zip_code || '',
            address: lead.address || '',
            status: mapToPerfexLeadStatus(lead.status),
            description: lead.notes || '',
          };
          
          await perfexRequest(perfexApiUrl, perfexApiToken, 'leads', 'POST', leadData);
          exported++;
        } catch (err) {
          console.error(`Error exporting lead ${lead.id}:`, err);
          errors++;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Exportação de leads concluída: ${exported} enviados, ${errors} erros`,
          stats: { total: leads?.length || 0, exported, errors }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Import contracts from Perfex
    if (action === 'import_contracts') {
      const contracts = await perfexRequest(perfexApiUrl, perfexApiToken, 'contracts') as PerfexContract[];
      
      let imported = 0;
      let updated = 0;
      let errors = 0;
      
      for (const contract of contracts) {
        try {
          // Check if contract exists by perfex_contract_id
          const { data: existing } = await supabase
            .from('contracts')
            .select('id')
            .eq('perfex_contract_id', contract.id)
            .single();
          
          // Find client by perfex_customer_id
          const { data: client } = await supabase
            .from('profiles')
            .select('id')
            .eq('perfex_customer_id', contract.client)
            .single();
          
          const contractData = {
            perfex_contract_id: contract.id,
            subject: contract.subject,
            description: contract.description || null,
            start_date: contract.datestart || null,
            end_date: contract.dateend || null,
            contract_value: parseFloat(contract.contract_value) || null,
            contract_html: contract.content || null,
            signature_status: contract.signed === 1 ? 'signed' : 'not_signed',
            visible_to_client: contract.not_visible_to_client !== 1,
            user_id: client?.id || null,
          };
          
          if (existing) {
            await supabase
              .from('contracts')
              .update(contractData)
              .eq('id', existing.id);
            updated++;
          } else {
            await supabase
              .from('contracts')
              .insert(contractData);
            imported++;
          }
        } catch (err) {
          console.error(`Error processing contract ${contract.id}:`, err);
          errors++;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Contratos importados: ${imported} novos, ${updated} atualizados, ${errors} erros`,
          stats: { total: contracts.length, imported, updated, errors }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Export contracts to Perfex
    if (action === 'export_contracts') {
      const { data: contracts } = await supabase
        .from('contracts')
        .select('*, profiles!contracts_user_id_fkey(perfex_customer_id)')
        .is('perfex_contract_id', null);
      
      let exported = 0;
      let errors = 0;
      
      for (const contract of contracts || []) {
        try {
          const perfexClientId = (contract.profiles as { perfex_customer_id?: string })?.perfex_customer_id;
          
          if (!perfexClientId) {
            console.log(`Skipping contract ${contract.id}: client not synced to Perfex`);
            continue;
          }
          
          const contractData = {
            subject: contract.subject || 'Contrato',
            description: contract.description || '',
            client: perfexClientId,
            datestart: contract.start_date || new Date().toISOString().split('T')[0],
            dateend: contract.end_date || '',
            contract_value: contract.contract_value?.toString() || '0',
            content: contract.contract_html || '',
          };
          
          const result = await perfexRequest(
            perfexApiUrl, 
            perfexApiToken, 
            'contracts', 
            'POST', 
            contractData
          ) as { id?: string };
          
          if (result.id) {
            await supabase
              .from('contracts')
              .update({ perfex_contract_id: result.id })
              .eq('id', contract.id);
            exported++;
          }
        } catch (err) {
          console.error(`Error exporting contract ${contract.id}:`, err);
          errors++;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Exportação de contratos: ${exported} enviados, ${errors} erros`,
          stats: { total: contracts?.length || 0, exported, errors }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Full bidirectional sync
    if (action === 'full_sync') {
      const results = {
        customers_import: null as unknown,
        customers_export: null as unknown,
        leads_import: null as unknown,
        leads_export: null as unknown,
        contracts_import: null as unknown,
        contracts_export: null as unknown,
      };
      
      // Import from Perfex first
      try {
        const customersResp = await perfexRequest(perfexApiUrl, perfexApiToken, 'customers');
        results.customers_import = { success: true, count: (customersResp as unknown[]).length };
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Erro desconhecido';
        results.customers_import = { success: false, error: errorMessage };
      }
      
      try {
        const leadsResp = await perfexRequest(perfexApiUrl, perfexApiToken, 'leads');
        results.leads_import = { success: true, count: (leadsResp as unknown[]).length };
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Erro desconhecido';
        results.leads_import = { success: false, error: errorMessage };
      }
      
      try {
        const contractsResp = await perfexRequest(perfexApiUrl, perfexApiToken, 'contracts');
        results.contracts_import = { success: true, count: (contractsResp as unknown[]).length };
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Erro desconhecido';
        results.contracts_import = { success: false, error: errorMessage };
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Sincronização completa executada',
          results 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, error: 'INVALID_ACTION', message: 'Ação não reconhecida' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
    
  } catch (error) {
    console.error('Sync Perfex error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: 'UNKNOWN_ERROR', message: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
