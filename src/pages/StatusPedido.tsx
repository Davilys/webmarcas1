import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, FileText, Clock, CreditCard, ChevronDown, ChevronUp, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { useToast } from "@/hooks/use-toast";

interface OrderData {
  personalData: {
    fullName: string;
    cpf: string;
    email: string;
    phone: string;
    cep: string;
    address: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  brandData: {
    brandName: string;
    businessArea: string;
    hasCNPJ: boolean;
    cnpj: string;
    companyName: string;
  };
  paymentValue: number;
  acceptedAt: string;
}

const StatusPedido = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [showValueDetails, setShowValueDetails] = useState(false);

  // PIX code mock (in production, this would come from Asaas API)
  const pixCode = "00020101021226830014br.gov.bcb.pix2558pix.asaas.com/qr/v2/cobv/tr-webmarcas-registro5204000053039865802BR5925WEBMARCAS PATENTES EIREL6009SAO PAULO62140510WebMarcas6304E2C8";
  
  // Due date - 3 days from now
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3);

  useEffect(() => {
    const data = sessionStorage.getItem("orderData");
    if (data) {
      try {
        setOrderData(JSON.parse(data));
      } catch {
        navigate("/registro");
      }
    } else {
      navigate("/registro");
    }
  }, [navigate]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast({
      title: "Código copiado!",
      description: "O código PIX foi copiado para sua área de transferência.",
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePaymentConfirmed = () => {
    // Save order data for thank you page
    sessionStorage.setItem("registrationComplete", JSON.stringify({
      ...orderData,
      paymentConfirmed: true,
      confirmedAt: new Date().toISOString(),
    }));
    navigate("/obrigado");
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-12">
        <section className="py-12 md:py-20 relative overflow-hidden">
          {/* Background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            {/* Progress Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-2 flex-1 rounded-full ${
                      step <= 3 ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
                Falta pouco para você registrar sua{" "}
                <span className="gradient-text">marca</span>
              </h1>
              <p className="text-muted-foreground">
                Complete seus dados para emissão da fatura, alguns campos serão autopreenchidos ao digitar.
              </p>
            </div>

            {/* Payment Card */}
            <div className="max-w-md mx-auto">
              <div className="glass-card p-6 mb-6">
                {/* Value Display */}
                <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-primary/30 bg-primary/5 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      R$ 698,97
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="w-4 h-4" />
                      <span>Parcela 1/1</span>
                      <span className="mx-1">•</span>
                      <Clock className="w-4 h-4" />
                      <span>Vence em {dueDate.toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="w-5 h-5 text-primary" />
                    <span className="font-medium">QrCode</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Abra o app do seu banco e aponte a câmera para o QrCode abaixo
                  </p>
                  
                  {/* QR Code Placeholder - In production, use actual QR code */}
                  <div className="flex justify-center mb-6">
                    <div className="w-48 h-48 bg-white p-3 rounded-xl border border-border">
                      <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDAwIi8+PHJlY3QgeD0iMTQwIiB5PSIyMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDAwIi8+PHJlY3QgeD0iMjAiIHk9IjE0MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDAwIi8+PHJlY3QgeD0iNzAiIHk9IjcwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiMwMDAiLz48cmVjdCB4PSI4NSIgeT0iODUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')] bg-contain bg-center bg-no-repeat" />
                    </div>
                  </div>
                </div>

                {/* PIX Copy and Paste */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Pix Copia e Cola</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Você pode copiar e colar esse código no app
                  </p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixCode.substring(0, 40) + "..."}
                      className="input-styled flex-1 text-sm font-mono"
                    />
                  </div>
                  
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full mt-4"
                    onClick={handleCopyPix}
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        Código Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        COPIAR CÓDIGO
                      </>
                    )}
                  </Button>
                </div>

                {/* Collapsible Sections */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowInvoiceDetails(!showInvoiceDetails)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-sm font-medium">⊙ SOBRE A FATURA</span>
                    {showInvoiceDetails ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  
                  {showInvoiceDetails && (
                    <div className="p-4 bg-secondary/30 rounded-xl text-sm space-y-2">
                      <p><strong>Cliente:</strong> {orderData.personalData.fullName}</p>
                      <p><strong>CPF:</strong> {orderData.personalData.cpf}</p>
                      <p><strong>E-mail:</strong> {orderData.personalData.email}</p>
                      <p><strong>Marca:</strong> {orderData.brandData.brandName}</p>
                    </div>
                  )}

                  <button
                    onClick={() => setShowValueDetails(!showValueDetails)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-sm font-medium">+ DETALHAMENTO DO VALOR</span>
                    {showValueDetails ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  
                  {showValueDetails && (
                    <div className="p-4 bg-secondary/30 rounded-xl text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Honorários de preparo e registro</span>
                        <span>R$ 698,97</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Desconto à vista (43%)</span>
                        <span className="text-accent">-R$ 495,03</span>
                      </div>
                      <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-primary">R$ 698,97</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        * Taxas do INPI (GRU) cobradas à parte pelo órgão federal.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Already Paid Button */}
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handlePaymentConfirmed}
              >
                Já realizei o pagamento
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default StatusPedido;
