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

// Generate a unique Message-ID for email headers
function generateMessageId(domain: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `<${timestamp}.${random}@${domain}>`;
}

// Extract domain from email address
function extractDomain(email: string): string {
  const match = email.match(/@([^>]+)/);
  return match ? match[1] : 'webmarcas.net';
}

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;
      const errorMsg = (error as Error)?.message || "";
      
      // Don't retry on permanent errors
      if (errorMsg.includes("550") || errorMsg.includes("553") || errorMsg.includes("554") || errorMsg.includes("535")) {
        console.log(`Permanent error detected (attempt ${attempt + 1}): ${errorMsg}`);
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Rate limiter - simple in-memory tracking
const emailsSentThisMinute: { count: number; resetAt: number } = { count: 0, resetAt: Date.now() + 60000 };
const MAX_EMAILS_PER_MINUTE = 5;

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now > emailsSentThisMinute.resetAt) {
    emailsSentThisMinute.count = 0;
    emailsSentThisMinute.resetAt = now + 60000;
  }
  
  if (emailsSentThisMinute.count >= MAX_EMAILS_PER_MINUTE) {
    return false;
  }
  
  emailsSentThisMinute.count++;
  return true;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, cc, bcc, subject, body, html }: EmailRequest = await req.json();

    // Check rate limit
    if (!checkRateLimit()) {
      console.log("Rate limit exceeded, queueing email...");
      // Wait a bit before proceeding
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

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

    const domain = extractDomain(emailAccount.email_address);
    const messageId = generateMessageId(domain);

    // Configure SMTP client with improved settings
    const client = new SMTPClient({
      connection: {
        hostname: emailAccount.smtp_host,
        port: emailAccount.smtp_port,
        tls: emailAccount.smtp_port === 465,
        auth: {
          username: emailAccount.smtp_user,
          password: emailAccount.smtp_password,
        },
      },
    });

    // Prepare email content with professional headers
    const fromAddress = emailAccount.display_name 
      ? `${emailAccount.display_name} <${emailAccount.email_address}>`
      : emailAccount.email_address;

    // Create a more professional HTML wrapper
    const htmlContent = html || `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333;">
  ${body}
</body>
</html>`;

    // Send email via SMTP with retry
    await retryWithBackoff(async () => {
      await client.send({
        from: fromAddress,
        to: to,
        cc: cc,
        bcc: bcc,
        subject: subject,
        content: body,
        html: htmlContent,
        headers: {
          "Message-ID": messageId,
          "X-Mailer": "WebMarcas CRM",
          "X-Priority": "3",
          "Importance": "Normal",
        },
      });
    });

    await client.close();

    console.log("Email sent successfully via SMTP");

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully", messageId }),
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
