import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckoutProgress } from "@/components/cliente/checkout/CheckoutProgress";
import { ViabilityStep } from "@/components/cliente/checkout/ViabilityStep";
import { PersonalDataStep, type PersonalData } from "@/components/cliente/checkout/PersonalDataStep";
import { BrandDataStep, type BrandData } from "@/components/cliente/checkout/BrandDataStep";
import { PaymentStep } from "@/components/cliente/checkout/PaymentStep";
import { ContractStep } from "@/components/cliente/checkout/ContractStep";
import { toast } from "sonner";
import { Moon, Sun, Award } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SocialProofNotification from "@/components/SocialProofNotification";
import type { ViabilityResult } from "@/lib/api/viability";
import logo from "@/assets/webmarcas-logo.png";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

// Dynamic text options for typing effect
const dynamicTexts = [
  "seja exclusivo",
  "proteja seu negócio", 
  "garanta seu futuro",
  "destaque-se",
  "cresça com segurança",
];

export default function Registrar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Typing effect state
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [viabilityData, setViabilityData] = useState<{
    brandName: string;
    businessArea: string;
    result: ViabilityResult;
  } | null>(null);
  
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentValue, setPaymentValue] = useState<number>(0);

  // Typing effect logic
  useEffect(() => {
    const currentFullText = dynamicTexts[currentTextIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    const pauseTime = 2000;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayedText.length < currentFullText.length) {
          setDisplayedText(currentFullText.slice(0, displayedText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        if (displayedText.length > 0) {
          setDisplayedText(displayedText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % dynamicTexts.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentTextIndex]);

  // Pre-fill personal data if user is logged in
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setPersonalData({
            fullName: profile.full_name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            cpf: profile.cpf_cnpj || '',
            cep: profile.zip_code || '',
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            neighborhood: profile.neighborhood || '',
          });
        }
      }
    };
    fetchUserData();
  }, []);

  const handleViabilityNext = (brandName: string, businessArea: string, result: ViabilityResult) => {
    setViabilityData({ brandName, businessArea, result });
    setStep(2);
  };

  const handlePersonalDataNext = (data: PersonalData) => {
    setPersonalData(data);
    setStep(3);
  };

  const handleBrandDataNext = (data: BrandData) => {
    setBrandData(data);
    setStep(4);
  };

  const handlePaymentNext = (method: string, value: number) => {
    setPaymentMethod(method);
    setPaymentValue(value);
    setStep(5);
  };

  const handleSubmit = async () => {
    if (!personalData || !brandData || !viabilityData) {
      toast.error("Dados incompletos. Por favor, revise as etapas anteriores.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-asaas-payment', {
        body: {
          personalData: {
            ...personalData,
            neighborhood: personalData.neighborhood || '',
          },
          brandData: {
            ...brandData,
            businessArea: viabilityData.businessArea,
          },
          paymentMethod,
          paymentValue,
        },
      });

      if (error) throw error;

      if (data?.success) {
        // Store order data in sessionStorage for the status page
        sessionStorage.setItem('orderData', JSON.stringify({
          paymentId: data.payment?.id,
          invoiceUrl: data.payment?.invoiceUrl,
          pixCode: data.payment?.pixQrCode?.payload,
          pixImage: data.payment?.pixQrCode?.encodedImage,
          boletoCode: data.payment?.identificationField,
          paymentMethod,
          paymentValue,
          brandName: brandData.brandName,
          contractId: data.contract?.id,
        }));

        toast.success("Pedido realizado com sucesso!");
        navigate('/status-pedido');
      } else {
        throw new Error(data?.error || 'Erro ao processar pagamento');
      }
    } catch (error: any) {
      console.error('Error submitting order:', error);
      toast.error(error.message || "Erro ao processar o pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/3 rounded-full blur-2xl" />

      {/* Social Proof Notifications */}
      <SocialProofNotification />

      {/* Header with logo and theme toggle */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2 group">
              <img src={logo} alt="WebMarcas" className="h-10 transition-transform group-hover:scale-105" />
              <span className="font-display text-xl font-bold hidden sm:inline">
                Web<span className="gradient-text">Marcas</span>
              </span>
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg"
              aria-label="Alternar tema"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 pt-24 pb-8">
        {/* Badge - Líder em Registro de Marcas */}
        <div className="flex justify-center mb-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 badge-premium">
            <Award className="w-4 h-4" />
            <span>{t("hero.badge")}</span>
          </div>
        </div>

        {/* Dynamic Title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
            {t("hero.title")}{" "}
            <span className="gradient-text">
              {displayedText}
              <span className="animate-pulse">|</span>
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t("hero.subtitle")}
          </p>
        </div>

        {/* Progress bar */}
        <CheckoutProgress currentStep={step} />

        {/* Form card */}
        <Card className="shadow-xl border border-border bg-card/95 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8">
            {step === 1 && (
              <ViabilityStep onNext={handleViabilityNext} />
            )}

            {step === 2 && personalData !== null && (
              <PersonalDataStep
                initialData={personalData}
                onNext={handlePersonalDataNext}
                onBack={() => setStep(1)}
              />
            )}

            {step === 2 && personalData === null && (
              <PersonalDataStep
                initialData={{
                  fullName: '',
                  email: '',
                  phone: '',
                  cpf: '',
                  cep: '',
                  address: '',
                  city: '',
                  state: '',
                  neighborhood: '',
                }}
                onNext={handlePersonalDataNext}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <BrandDataStep
                initialData={{
                  brandName: viabilityData?.brandName || '',
                  businessArea: viabilityData?.businessArea || '',
                  hasCNPJ: false,
                  cnpj: '',
                  companyName: '',
                }}
                onNext={handleBrandDataNext}
                onBack={() => setStep(2)}
              />
            )}

            {step === 4 && (
              <PaymentStep
                selectedMethod={paymentMethod}
                onNext={handlePaymentNext}
                onBack={() => setStep(3)}
              />
            )}

            {step === 5 && personalData && brandData && (
              <ContractStep
                personalData={personalData}
                brandData={{
                  ...brandData,
                  businessArea: viabilityData?.businessArea || brandData.businessArea,
                }}
                paymentMethod={paymentMethod}
                paymentValue={paymentValue}
                onBack={() => setStep(4)}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao continuar, você concorda com nossos{" "}
          <a href="/termos" className="underline hover:text-primary transition-colors">Termos de Uso</a>
          {" "}e{" "}
          <a href="/privacidade" className="underline hover:text-primary transition-colors">Política de Privacidade</a>.
        </p>
      </main>

      {/* WhatsApp Floating Button */}
      <WhatsAppButton />
    </div>
  );
}
