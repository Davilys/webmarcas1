import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, MessageCircle, FileText, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

interface RegistrationData {
  personalData: {
    fullName: string;
    cpf: string;
    email: string;
    address: string;
    neighborhood: string;
    cep: string;
  };
  brandData: {
    companyName: string;
    cnpj: string;
    brandName: string;
    businessArea: string;
  };
  paymentOption: string;
  paymentLabel: string;
  paymentValue: string;
  acceptedAt: string;
}

const Obrigado = () => {
  const navigate = useNavigate();
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("registrationComplete");
    if (data) {
      try {
        setRegistrationData(JSON.parse(data));
      } catch (e) {
        console.error("Error parsing registration data:", e);
        navigate("/registro");
      }
    } else {
      navigate("/registro");
    }
  }, [navigate]);

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Acabei de finalizar meu pedido de registro da marca "${registrationData?.brandData.brandName}". Gostaria de falar com um especialista.`
    );
    window.open(`https://wa.me/5511999999999?text=${message}`, "_blank");
  };

  if (!registrationData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="section-padding relative overflow-hidden">
          {/* Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            {/* Success Icon */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-6 animate-pulse">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              
              <span className="badge-premium mb-4 inline-flex">Registro Confirmado</span>
              
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                🎉 Parabéns! Agora sua marca está em{" "}
                <span className="gradient-text">boas mãos.</span>
              </h1>
              
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Seu pedido de registro foi recebido com sucesso. A partir de agora, nosso time jurídico 
                iniciará imediatamente o processo de registro da sua marca junto ao INPI.
              </p>
            </div>

            {/* Registration Details Card */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="glass-card p-8">
                <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Resumo do Pedido
                </h2>

                <div className="space-y-4">
                  <div className="flex items-start justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="font-medium text-right">{registrationData.personalData.fullName}</span>
                  </div>
                  
                  <div className="flex items-start justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">CPF</span>
                    <span className="font-medium">{registrationData.personalData.cpf}</span>
                  </div>
                  
                  <div className="flex items-start justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Marca</span>
                    <span className="font-medium text-primary">{registrationData.brandData.brandName}</span>
                  </div>
                  
                  <div className="flex items-start justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Ramo de Atividade</span>
                    <span className="font-medium text-right">{registrationData.brandData.businessArea}</span>
                  </div>
                  
                  <div className="flex items-start justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Forma de Pagamento</span>
                    <span className="font-medium text-right">
                      {registrationData.paymentLabel} - {registrationData.paymentValue}
                    </span>
                  </div>
                  
                  <div className="flex items-start justify-between py-3">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Status
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      Processo em análise jurídica
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-2xl mx-auto text-center">
              <div className="glass-card p-8 mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold">Próximos Passos</h3>
                </div>
                
                <p className="text-muted-foreground mb-6">
                  Em breve, você receberá o protocolo oficial do seu pedido e um de nossos 
                  especialistas entrará em contato para acompanhamento. Todo o acompanhamento 
                  será feito de forma online e você será avisado sempre que houver movimentação 
                  oficial no processo.
                </p>

                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleWhatsApp}
                  className="group w-full sm:w-auto"
                >
                  <MessageCircle className="w-5 h-5" />
                  Falar com especialista no WhatsApp
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Contrato aceito em: {new Date(registrationData.acceptedAt).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Obrigado;
