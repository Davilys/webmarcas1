import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SyncRequest {
  account_id?: string;
  limit?: number;
}

// IMAP command helper
async function sendCommand(
  conn: Deno.TcpConn | Deno.TlsConn,
  tag: string,
  command: string
): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  await conn.write(encoder.encode(`${tag} ${command}\r\n`));
  
  const buffer = new Uint8Array(65536);
  let response = "";
  
  while (true) {
    const n = await conn.read(buffer);
    if (n === null) break;
    
    response += decoder.decode(buffer.subarray(0, n));
    
    // Check if response is complete (tagged response received)
    if (response.includes(`${tag} OK`) || response.includes(`${tag} NO`) || response.includes(`${tag} BAD`)) {
      break;
    }
  }
  
  return response;
}

async function readGreeting(conn: Deno.TcpConn | Deno.TlsConn): Promise<string> {
  const decoder = new TextDecoder();
  const buffer = new Uint8Array(4096);
  const n = await conn.read(buffer);
  if (n === null) return "";
  return decoder.decode(buffer.subarray(0, n));
}

function parseEmailHeaders(raw: string): { from: string; fromName: string; subject: string; date: string; messageId: string } {
  const fromMatch = raw.match(/From:\s*(?:"?([^"<]*)"?\s*)?<?([^>\r\n]+)>?/i);
  const subjectMatch = raw.match(/Subject:\s*(.+?)(?:\r\n(?![ \t])|\r?\n(?![ \t]))/is);
  const dateMatch = raw.match(/Date:\s*(.+?)(?:\r\n|\r?\n)/i);
  const messageIdMatch = raw.match(/Message-ID:\s*<?([^>\r\n]+)>?/i);
  
  return {
    fromName: fromMatch?.[1]?.trim() || "",
    from: fromMatch?.[2]?.trim() || "unknown@email.com",
    subject: subjectMatch?.[1]?.trim().replace(/\r?\n[ \t]+/g, ' ') || "(Sem assunto)",
    date: dateMatch?.[1]?.trim() || new Date().toISOString(),
    messageId: messageIdMatch?.[1]?.trim() || `${Date.now()}-${Math.random().toString(36)}`,
  };
}

function extractBody(raw: string): { text: string; html: string } {
  let text = "";
  let html = "";
  
  // Check for multipart
  const boundaryMatch = raw.match(/boundary="?([^"\r\n]+)"?/i);
  
  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = raw.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    
    for (const part of parts) {
      if (part.toLowerCase().includes("content-type: text/plain")) {
        const bodyStart = part.indexOf("\r\n\r\n");
        if (bodyStart !== -1) {
          text = part.substring(bodyStart + 4).trim();
        }
      } else if (part.toLowerCase().includes("content-type: text/html")) {
        const bodyStart = part.indexOf("\r\n\r\n");
        if (bodyStart !== -1) {
          html = part.substring(bodyStart + 4).trim();
        }
      }
    }
  } else {
    // Single part message
    const bodyStart = raw.indexOf("\r\n\r\n");
    if (bodyStart !== -1) {
      const body = raw.substring(bodyStart + 4);
      if (raw.toLowerCase().includes("content-type: text/html")) {
        html = body;
      } else {
        text = body;
      }
    }
  }
  
  return { text: text.substring(0, 50000), html: html.substring(0, 100000) };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { account_id, limit = 30 }: SyncRequest = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch email account
    let query = supabase.from("email_accounts").select("*");
    
    if (account_id) {
      query = query.eq("id", account_id);
    } else {
      query = query.eq("is_default", true);
    }

    const { data: emailAccount, error: accountError } = await query.single();

    if (accountError || !emailAccount) {
      return new Response(
        JSON.stringify({ error: "No email account configured" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!emailAccount.imap_host || !emailAccount.imap_port) {
      return new Response(
        JSON.stringify({ error: "IMAP not configured for this account" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Connecting to IMAP:", emailAccount.imap_host, emailAccount.imap_port);

    // Connect via TLS
    const conn = await Deno.connectTls({
      hostname: emailAccount.imap_host,
      port: emailAccount.imap_port,
    });

    // Read greeting
    const greeting = await readGreeting(conn);
    console.log("Server greeting received");

    // Login
    const loginResp = await sendCommand(conn, "A001", `LOGIN "${emailAccount.smtp_user}" "${emailAccount.smtp_password}"`);
    if (!loginResp.includes("A001 OK")) {
      throw new Error("IMAP login failed");
    }
    console.log("Logged in successfully");

    // Select INBOX
    const selectResp = await sendCommand(conn, "A002", "SELECT INBOX");
    const existsMatch = selectResp.match(/\* (\d+) EXISTS/);
    const totalMessages = existsMatch ? parseInt(existsMatch[1]) : 0;
    console.log(`INBOX has ${totalMessages} messages`);

    const syncedEmails: { subject: string; from: string }[] = [];
    
    if (totalMessages > 0) {
      const startSeq = Math.max(1, totalMessages - limit + 1);
      
      // Fetch messages
      const fetchResp = await sendCommand(conn, "A003", `FETCH ${startSeq}:${totalMessages} (RFC822)`);
      
      // Split by message boundaries
      const messageBlocks = fetchResp.split(/\* \d+ FETCH/);
      
      for (const block of messageBlocks) {
        if (!block.trim() || block.length < 100) continue;
        
        try {
          const headers = parseEmailHeaders(block);
          const body = extractBody(block);
          
          // Check if already exists
          const { data: existing } = await supabase
            .from("email_inbox")
            .select("id")
            .eq("message_id", headers.messageId)
            .single();

          if (!existing) {
            const emailData = {
              account_id: emailAccount.id,
              message_id: headers.messageId,
              from_email: headers.from,
              from_name: headers.fromName || null,
              to_email: emailAccount.email_address,
              subject: headers.subject,
              body_text: body.text,
              body_html: body.html,
              received_at: new Date(headers.date).toISOString(),
              is_read: false,
              is_starred: false,
              is_archived: false,
            };

            const { error: insertError } = await supabase
              .from("email_inbox")
              .insert(emailData);

            if (!insertError) {
              syncedEmails.push({
                subject: headers.subject,
                from: headers.from,
              });
            }
          }
        } catch (parseError) {
          console.error("Error parsing message:", parseError);
        }
      }
    }

    // Logout
    await sendCommand(conn, "A004", "LOGOUT");
    conn.close();

    console.log(`Synced ${syncedEmails.length} new emails`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced_count: syncedEmails.length,
        total_messages: totalMessages,
        emails: syncedEmails 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error syncing IMAP:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
