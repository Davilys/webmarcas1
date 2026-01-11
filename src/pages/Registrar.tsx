import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { CheckoutProgress } from "@/components/cliente/checkout/CheckoutProgress";
import { ViabilityStep } from "@/components/cliente/checkout/ViabilityStep";
import { PersonalDataStep, type PersonalData } from "@/components/cliente/checkout/PersonalDataStep";
import { BrandDataStep, type BrandData } from "@/components/cliente/checkout/BrandDataStep";
import { PaymentStep } from "@/components/cliente/checkout/PaymentStep";
import { ContractStep } from "@/components/cliente/checkout/ContractStep";
import { toast } from "sonner";
import type { ViabilityResult } from "@/lib/api/viability";
import logo from "@/assets/webmarcas-logo.png";

export default function Registrar() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [viabilityData, setViabilityData] = useState<{
    brandName: string;
    businessArea: string;
    result: ViabilityResult;
  } | null>(null);
  
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentValue, setPaymentValue] = useState<number>(0);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header with logo */}
      <header className="w-full py-4 px-6 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-center">
          <img src={logo} alt="WebMarcas" className="h-10" />
        </div>
      </header>

      {/* Main content */}
      <main className="w-full max-w-2xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Registrar Nova Marca
          </h1>
          <p className="text-muted-foreground">
            Complete as etapas abaixo para registrar sua marca no INPI.
          </p>
        </div>

        {/* Progress bar */}
        <CheckoutProgress currentStep={step} />

        {/* Form card */}
        <Card className="shadow-xl border-0 bg-white">
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
          <a href="/termos" className="underline hover:text-primary">Termos de Uso</a>
          {" "}e{" "}
          <a href="/privacidade" className="underline hover:text-primary">Política de Privacidade</a>.
        </p>
      </main>
    </div>
  );
}
