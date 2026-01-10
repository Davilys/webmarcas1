import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/cliente/ClientLayout";
import { Card, CardContent } from "@/components/ui/card";
import { CheckoutProgress } from "@/components/cliente/checkout/CheckoutProgress";
import { ViabilityStep } from "@/components/cliente/checkout/ViabilityStep";
import { PersonalDataStep, type PersonalData } from "@/components/cliente/checkout/PersonalDataStep";
import { BrandDataStep, type BrandData } from "@/components/cliente/checkout/BrandDataStep";
import { PaymentStep } from "@/components/cliente/checkout/PaymentStep";
import { ContractStep } from "@/components/cliente/checkout/ContractStep";
import { toast } from "sonner";
import type { ViabilityResult } from "@/lib/api/viability";

export default function RegistrarMarca() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viabilityResult, setViabilityResult] = useState<ViabilityResult | null>(null);
  const [personalData, setPersonalData] = useState<PersonalData>({
    fullName: "", email: "", phone: "", cpf: "",
    cep: "", address: "", neighborhood: "", city: "", state: "",
  });
  const [brandData, setBrandData] = useState<BrandData>({
    brandName: "", businessArea: "", hasCNPJ: false, cnpj: "", companyName: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentValue, setPaymentValue] = useState(0);

  // Pre-fill user data if logged in
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setPersonalData(prev => ({
            ...prev,
            fullName: profile.full_name || prev.fullName,
            email: profile.email || prev.email,
            phone: profile.phone || prev.phone,
            cpf: profile.cpf_cnpj || prev.cpf,
            cep: profile.zip_code || prev.cep,
            address: profile.address || prev.address,
            city: profile.city || prev.city,
            state: profile.state || prev.state,
          }));
        }
      }
    });
  }, []);

  const handleViabilityNext = (brand: string, area: string, result: ViabilityResult) => {
    setBrandData(prev => ({ ...prev, brandName: brand, businessArea: area }));
    setViabilityResult(result);
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
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-asaas-payment', {
        body: {
          personalData,
          brandData,
          paymentMethod,
          paymentValue,
          contractHtml: '',
        },
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'Erro ao criar cobrança');

      const orderData = {
        personalData, brandData, paymentMethod, paymentValue,
        acceptedAt: new Date().toISOString(),
        leadId: data.leadId,
        contractId: data.contractId,
        asaas: {
          paymentId: data.paymentId,
          invoiceUrl: data.invoiceUrl,
          pixQrCode: data.pixQrCode,
        },
      };

      sessionStorage.setItem("orderData", JSON.stringify(orderData));
      toast.success("Cobrança criada com sucesso!");
      navigate("/status-pedido");
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err instanceof Error ? err.message : "Erro ao processar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ClientLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Registrar Nova Marca</h1>
          <p className="text-muted-foreground">
            Complete as etapas abaixo para registrar sua marca.
          </p>
        </div>

        <CheckoutProgress currentStep={step} />

        <Card>
          <CardContent className="p-6 sm:p-8">
            {step === 1 && <ViabilityStep onNext={handleViabilityNext} />}
            {step === 2 && (
              <PersonalDataStep
                initialData={personalData}
                onNext={handlePersonalDataNext}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <BrandDataStep
                initialData={brandData}
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
            {step === 5 && (
              <ContractStep
                personalData={personalData}
                brandData={brandData}
                paymentMethod={paymentMethod}
                paymentValue={paymentValue}
                onSubmit={handleSubmit}
                onBack={() => setStep(4)}
                isSubmitting={isSubmitting}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
