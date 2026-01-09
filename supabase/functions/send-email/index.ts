import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  html?: string;
  from?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, cc, bcc, subject, body, html }: EmailRequest = await req.json();

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch default email account from database
    const { data: emailAccount, error: accountError } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("is_default", true)
      .single();

    if (accountError || !emailAccount) {
      console.error("Error fetching email account:", accountError);
      return new Response(
        JSON.stringify({ error: "No default email account configured" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Using email account:", emailAccount.email_address);
    console.log("SMTP Host:", emailAccount.smtp_host);
    console.log("SMTP Port:", emailAccount.smtp_port);

    // Configure SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: emailAccount.smtp_host,
        port: emailAccount.smtp_port,
        tls: emailAccount.smtp_port === 465, // SSL for port 465
        auth: {
          username: emailAccount.smtp_user,
          password: emailAccount.smtp_password,
        },
      },
    });

    // Prepare email content
    const fromAddress = emailAccount.display_name 
      ? `${emailAccount.display_name} <${emailAccount.email_address}>`
      : emailAccount.email_address;

    const htmlContent = html || `<div style="font-family: Arial, sans-serif;">${body}</div>`;

    // Send email via SMTP
    await client.send({
      from: fromAddress,
      to: to,
      cc: cc,
      bcc: bcc,
      subject: subject,
      content: body,
      html: htmlContent,
    });

    await client.close();

    console.log("Email sent successfully via SMTP");

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
