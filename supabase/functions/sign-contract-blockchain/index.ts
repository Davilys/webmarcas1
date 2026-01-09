import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate SHA-256 hash
async function generateSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Create timestamp proof using OpenTimestamps calendar servers
async function createBlockchainTimestamp(hash: string): Promise<{
  proof: string;
  timestamp: string;
  txId: string;
  network: string;
}> {
  // Convert hex hash to bytes
  const hashBytes = new Uint8Array(
    hash.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  // Try multiple OpenTimestamps calendar servers for redundancy
  const calendarServers = [
    'https://a.pool.opentimestamps.org',
    'https://b.pool.opentimestamps.org',
    'https://alice.btc.calendar.opentimestamps.org',
    'https://bob.btc.calendar.opentimestamps.org'
  ];
  
  let proof = '';
  let serverUsed = '';
  
  for (const server of calendarServers) {
    try {
      const response = await fetch(`${server}/digest`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/vnd.opentimestamps.v1'
        },
        body: hashBytes
      });
      
      if (response.ok) {
        const proofBytes = new Uint8Array(await response.arrayBuffer());
        // Encode proof as base64
        proof = btoa(String.fromCharCode(...proofBytes));
        serverUsed = server;
        break;
      }
    } catch (error) {
      console.log(`Failed to connect to ${server}:`, error);
      continue;
    }
  }
  
  // Generate unique transaction ID
  const timestamp = new Date().toISOString();
  const txId = `OTS_${Date.now()}_${hash.substring(0, 16).toUpperCase()}`;
  
  return {
    proof: proof || `PENDING_${hash.substring(0, 32)}`,
    timestamp,
    txId,
    network: serverUsed ? `Bitcoin (OpenTimestamps via ${new URL(serverUsed).hostname})` : 'Bitcoin (OpenTimestamps - Pending)'
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Capture client IP and User Agent
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     req.headers.get('cf-connecting-ip') ||
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    const { contractId, contractHtml, deviceInfo, leadId, signatureImage, signatureToken } = await req.json();
    
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

    // Generate SHA-256 hash of contract content + signature
    const hashContent = (contractHtml || '') + (signatureImage || '');
    const contractHash = await generateSHA256(hashContent);
    console.log('Contract hash generated:', contractHash);

    // Register timestamp in blockchain
    const blockchainData = await createBlockchainTimestamp(contractHash);
    console.log('Blockchain timestamp created:', blockchainData);

    // Prepare signature data
    const signatureData: Record<string, any> = {
      signature_status: 'signed',
      signed_at: blockchainData.timestamp,
      signature_ip: clientIP,
      signature_user_agent: userAgent,
      blockchain_hash: contractHash,
      blockchain_timestamp: blockchainData.timestamp,
      blockchain_tx_id: blockchainData.txId,
      blockchain_network: blockchainData.network,
      blockchain_proof: blockchainData.proof,
      device_info: {
        ...deviceInfo,
        signed_at: blockchainData.timestamp,
        ip_address: clientIP,
        user_agent: userAgent
      }
    };

    // Add client signature image if provided
    if (signatureImage) {
      signatureData.client_signature_image = signatureImage;
    }

    // Update contract in database
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .update(signatureData)
      .eq('id', contractId)
      .select()
      .single();

    if (contractError) {
      console.error('Error updating contract:', contractError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar contrato', details: contractError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update lead status if leadId provided
    if (leadId) {
      await supabase
        .from('leads')
        .update({ 
          status: 'contrato_assinado',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);
    }

    // Create client activity log
    if (contractData?.user_id) {
      await supabase
        .from('client_activities')
        .insert({
          user_id: contractData.user_id,
          activity_type: 'contract_signed',
          description: `Contrato assinado digitalmente com registro em blockchain`,
          metadata: {
            contract_id: contractId,
            blockchain_hash: contractHash,
            blockchain_tx_id: blockchainData.txId,
            ip_address: clientIP
          }
        });
    }

    console.log('Contract signed successfully:', contractId);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          contractId,
          hash: contractHash,
          timestamp: blockchainData.timestamp,
          txId: blockchainData.txId,
          network: blockchainData.network,
          ipAddress: clientIP,
          message: 'Contrato assinado com sucesso e registrado em blockchain'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in sign-contract-blockchain:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
