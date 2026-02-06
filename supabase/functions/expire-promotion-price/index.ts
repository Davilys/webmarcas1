import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body for optional test mode
    let testMode = false;
    try {
      const body = await req.json();
      testMode = body?.test_mode === true;
    } catch {
      // No body or invalid JSON - proceed normally
    }

    console.log(`[expire-promotion-price] Starting execution. Test mode: ${testMode}`);

    // Find all eligible contracts:
    // - contract_value = 699.00 (promotional price)
    // - payment_method = 'avista' (cash/upfront payment)
    // - signature_status = 'not_signed' (unsigned)
    // - signed_at IS NULL (double check)
    // - asaas_payment_id IS NULL (not paid)
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('id, contract_number, contract_value, payment_method, signature_status')
      .eq('contract_value', 699.00)
      .eq('payment_method', 'avista')
      .eq('signature_status', 'not_signed')
      .is('signed_at', null)
      .is('asaas_payment_id', null);

    if (fetchError) {
      console.error('[expire-promotion-price] Error fetching contracts:', fetchError);
      throw new Error(`Failed to fetch contracts: ${fetchError.message}`);
    }

    const eligibleContracts = contracts || [];
    console.log(`[expire-promotion-price] Found ${eligibleContracts.length} eligible contracts`);

    if (eligibleContracts.length === 0) {
      // Log the execution even if no contracts were updated
      await supabase.from('promotion_expiration_logs').insert({
        contracts_updated: 0,
        contract_ids: [],
        status: 'success'
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'No eligible contracts found',
          updated_count: 0,
          contracts_updated: [],
          test_mode: testMode
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const NEW_VALUE = 1194.00;
    const updatedContractIds: string[] = [];
    const updatedContractNumbers: string[] = [];
    const errors: string[] = [];

    // Update each contract individually for safety
    for (const contract of eligibleContracts) {
      if (testMode) {
        // In test mode, don't actually update - just log what would be updated
        console.log(`[expire-promotion-price] TEST MODE: Would update contract ${contract.contract_number} from ${contract.contract_value} to ${NEW_VALUE}`);
        updatedContractIds.push(contract.id);
        updatedContractNumbers.push(contract.contract_number || contract.id);
        continue;
      }

      const { error: updateError } = await supabase
        .from('contracts')
        .update({ contract_value: NEW_VALUE })
        .eq('id', contract.id)
        // Additional safety checks in the update query
        .eq('contract_value', 699.00)
        .eq('signature_status', 'not_signed')
        .is('signed_at', null);

      if (updateError) {
        console.error(`[expire-promotion-price] Error updating contract ${contract.id}:`, updateError);
        errors.push(`Contract ${contract.contract_number}: ${updateError.message}`);
      } else {
        console.log(`[expire-promotion-price] Successfully updated contract ${contract.contract_number} to ${NEW_VALUE}`);
        updatedContractIds.push(contract.id);
        updatedContractNumbers.push(contract.contract_number || contract.id);
      }
    }

    // Log the execution
    const logStatus = errors.length > 0 ? 'partial_success' : 'success';
    await supabase.from('promotion_expiration_logs').insert({
      contracts_updated: updatedContractIds.length,
      contract_ids: updatedContractIds,
      status: testMode ? 'test_run' : logStatus
    });

    const response = {
      success: true,
      message: testMode 
        ? `Test mode: ${updatedContractIds.length} contracts would be updated`
        : `Successfully updated ${updatedContractIds.length} contracts`,
      updated_count: updatedContractIds.length,
      contracts_updated: updatedContractNumbers,
      new_value: NEW_VALUE,
      test_mode: testMode,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('[expire-promotion-price] Execution completed:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[expire-promotion-price] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
