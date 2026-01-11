import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      throw new Error("ASAAS_API_KEY não configurada");
    }

    const {
      paymentId,
      customerId,
      value,
      installmentCount,
      installmentValue,
      creditCard,
      creditCardHolderInfo,
      dueDate,
    } = await req.json();

    console.log("Processing credit card payment:", { paymentId, customerId, value, installmentCount });

    // Get client IP for fraud prevention
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    // Create payment with credit card data
    const paymentPayload: any = {
      customer: customerId,
      billingType: "CREDIT_CARD",
      value: value,
      dueDate: dueDate || new Date().toISOString().split("T")[0],
      description: "Registro de Marca - WebMarcas",
      creditCard: {
        holderName: creditCard.holderName,
        number: creditCard.number.replace(/\s/g, ""),
        expiryMonth: creditCard.expiryMonth,
        expiryYear: creditCard.expiryYear,
        ccv: creditCard.ccv,
      },
      creditCardHolderInfo: {
        name: creditCardHolderInfo.name,
        email: creditCardHolderInfo.email,
        cpfCnpj: creditCardHolderInfo.cpfCnpj.replace(/\D/g, ""),
        postalCode: creditCardHolderInfo.postalCode.replace(/\D/g, ""),
        addressNumber: creditCardHolderInfo.addressNumber || "S/N",
        phone: creditCardHolderInfo.phone?.replace(/\D/g, "") || "",
      },
      remoteIp: clientIp,
    };

    // Add installment info if applicable
    if (installmentCount && installmentCount > 1) {
      paymentPayload.installmentCount = installmentCount;
      paymentPayload.installmentValue = installmentValue;
    }

    console.log("Sending payment to Asaas:", JSON.stringify(paymentPayload, null, 2));

    const paymentResponse = await fetch("https://api.asaas.com/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentData = await paymentResponse.json();
    console.log("Asaas payment response:", JSON.stringify(paymentData, null, 2));

    if (!paymentResponse.ok) {
      console.error("Asaas payment error:", paymentData);
      
      // Map Asaas error messages to user-friendly messages
      let errorMessage = "Erro ao processar pagamento";
      
      if (paymentData.errors && paymentData.errors.length > 0) {
        const error = paymentData.errors[0];
        if (error.code === "invalid_creditCard") {
          errorMessage = "Dados do cartão inválidos. Verifique o número, validade e CVV.";
        } else if (error.code === "invalid_creditCardHolderInfo") {
          errorMessage = "Dados do titular inválidos. Verifique CPF e CEP.";
        } else if (error.description) {
          errorMessage = error.description;
        }
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          details: paymentData.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check if payment was authorized
    const isAuthorized = paymentData.status === "CONFIRMED" || 
                         paymentData.status === "RECEIVED" ||
                         paymentData.status === "PENDING";

    if (!isAuthorized && paymentData.status === "REFUSED") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Pagamento recusado pela operadora do cartão. Tente outro cartão.",
          status: paymentData.status
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Update invoice in database
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update invoice with payment ID
    if (paymentData.id) {
      await supabase
        .from("invoices")
        .update({
          asaas_invoice_id: paymentData.id,
          status: paymentData.status === "CONFIRMED" || paymentData.status === "RECEIVED" 
            ? "paid" 
            : "pending",
          payment_date: paymentData.status === "CONFIRMED" || paymentData.status === "RECEIVED" 
            ? new Date().toISOString() 
            : null,
        })
        .eq("asaas_invoice_id", paymentId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paymentData.id,
        status: paymentData.status,
        invoiceUrl: paymentData.invoiceUrl,
        transactionReceiptUrl: paymentData.transactionReceiptUrl,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error processing credit card payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno ao processar pagamento";
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
