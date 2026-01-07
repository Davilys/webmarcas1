import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Check, User, Building2, CreditCard, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Form schemas
const personalDataSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido"),
  email: z.string().email("E-mail inválido").max(255),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres").max(200),
  neighborhood: z.string().min(2, "Bairro obrigatório").max(100),
  cep: z.string().regex(/^\d{5}-\d{3}$/, "CEP inválido"),
});

const brandDataSchema = z.object({
  companyName: z.string().min(3, "Razão social deve ter pelo menos 3 caracteres").max(200),
  cnpj: z.string().optional(),
  brandName: z.string().min(2, "Nome da marca obrigatório").max(100),
  businessArea: z.string().min(3, "Ramo de atividade obrigatório").max(200),
});

type PaymentOption = "vista" | "cartao6x" | "boleto3x";

const paymentOptions = [
  {
    id: "vista" as PaymentOption,
    label: "À Vista",
    value: "R$699,00",
    description: "Pagamento único via PIX ou boleto",
  },
  {
    id: "cartao6x" as PaymentOption,
    label: "Cartão 6x",
    value: "6x de R$199,00",
    description: "Sem juros no cartão de crédito",
  },
  {
    id: "boleto3x" as PaymentOption,
    label: "Boleto 3x",
    value: "3x de R$399,00",
    description: "Boleto bancário parcelado",
  },
];

const RegistrationFormSection = () => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Form data
  const [personalData, setPersonalData] = useState({
    fullName: "",
    cpf: "",
    email: "",
    address: "",
    neighborhood: "",
    cep: "",
  });

  const [brandData, setBrandData] = useState({
    companyName: "",
    cnpj: "",
    brandName: "",
    businessArea: "",
  });

  const [paymentOption, setPaymentOption] = useState<PaymentOption | null>(null);
  const [contractAccepted, setContractAccepted] = useState(false);

  // Load viability data from session storage if available
  useEffect(() => {
    const viabilityData = sessionStorage.getItem('viabilityData');
    if (viabilityData) {
      try {
        const parsed = JSON.parse(viabilityData);
        setBrandData(prev => ({
          ...prev,
          brandName: parsed.brandName || "",
          businessArea: parsed.businessArea || "",
        }));
        // Clear the data after loading
        sessionStorage.removeItem('viabilityData');
      } catch (e) {
        console.error('Error parsing viability data:', e);
      }
    }
  }, []);

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const validateStep = (stepNumber: number): boolean => {
    setErrors({});

    if (stepNumber === 1) {
      const result = personalDataSchema.safeParse(personalData);
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return false;
      }
    }

    if (stepNumber === 2) {
      const result = brandDataSchema.safeParse(brandData);
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return false;
      }
    }

    if (stepNumber === 3 && !paymentOption) {
      toast({
        title: "Selecione uma opção",
        description: "Por favor, escolha uma forma de pagamento.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (!contractAccepted) {
      toast({
        title: "Contrato obrigatório",
        description: "Por favor, leia e aceite o contrato para continuar.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Registro iniciado! 🎉",
      description: "Em breve você receberá um e-mail com os próximos passos.",
    });

    // Here you would integrate with your backend
  };

  const steps = [
    { number: 1, label: "Dados Pessoais", icon: User },
    { number: 2, label: "Dados da Marca", icon: Building2 },
    { number: 3, label: "Pagamento", icon: CreditCard },
    { number: 4, label: "Contrato", icon: FileSignature },
  ];

  return (
    <section id="registro" className="section-padding bg-card relative overflow-hidden">
      {/* Background */}
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="badge-premium mb-4 inline-flex">Formulário de Registro</span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Registre sua{" "}
            <span className="gradient-text">marca agora</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Preencha o formulário abaixo para iniciar o processo de registro.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      step >= s.number
                        ? "bg-gradient-to-br from-primary to-blue-500 text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {step > s.number ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <s.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs mt-2 text-muted-foreground hidden sm:block">
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-all ${
                      step > s.number ? "bg-primary" : "bg-secondary"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="max-w-xl mx-auto">
          <div className="glass-card p-8">
            {/* Step 1: Personal Data */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-display text-xl font-semibold mb-6">Dados Pessoais</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    value={personalData.fullName}
                    onChange={(e) => setPersonalData({ ...personalData, fullName: e.target.value })}
                    placeholder="Seu nome completo"
                    className="input-styled"
                  />
                  {errors.fullName && <p className="text-destructive text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">CPF *</label>
                    <input
                      type="text"
                      value={personalData.cpf}
                      onChange={(e) => setPersonalData({ ...personalData, cpf: formatCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="input-styled"
                    />
                    {errors.cpf && <p className="text-destructive text-sm mt-1">{errors.cpf}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">CEP *</label>
                    <input
                      type="text"
                      value={personalData.cep}
                      onChange={(e) => setPersonalData({ ...personalData, cep: formatCEP(e.target.value) })}
                      placeholder="00000-000"
                      maxLength={9}
                      className="input-styled"
                    />
                    {errors.cep && <p className="text-destructive text-sm mt-1">{errors.cep}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">E-mail *</label>
                  <input
                    type="email"
                    value={personalData.email}
                    onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="input-styled"
                  />
                  {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Endereço *</label>
                  <input
                    type="text"
                    value={personalData.address}
                    onChange={(e) => setPersonalData({ ...personalData, address: e.target.value })}
                    placeholder="Rua, número, complemento"
                    className="input-styled"
                  />
                  {errors.address && <p className="text-destructive text-sm mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bairro *</label>
                  <input
                    type="text"
                    value={personalData.neighborhood}
                    onChange={(e) => setPersonalData({ ...personalData, neighborhood: e.target.value })}
                    placeholder="Seu bairro"
                    className="input-styled"
                  />
                  {errors.neighborhood && <p className="text-destructive text-sm mt-1">{errors.neighborhood}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Brand Data */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="font-display text-xl font-semibold mb-6">Dados da Marca</h3>

                <div>
                  <label className="block text-sm font-medium mb-2">Razão Social *</label>
                  <input
                    type="text"
                    value={brandData.companyName}
                    onChange={(e) => setBrandData({ ...brandData, companyName: e.target.value })}
                    placeholder="Nome da empresa ou seu nome"
                    className="input-styled"
                  />
                  {errors.companyName && <p className="text-destructive text-sm mt-1">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">CNPJ (opcional)</label>
                  <input
                    type="text"
                    value={brandData.cnpj}
                    onChange={(e) => setBrandData({ ...brandData, cnpj: formatCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="input-styled"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nome da Marca *</label>
                  <input
                    type="text"
                    value={brandData.brandName}
                    onChange={(e) => setBrandData({ ...brandData, brandName: e.target.value })}
                    placeholder="A marca que deseja registrar"
                    className="input-styled"
                  />
                  {errors.brandName && <p className="text-destructive text-sm mt-1">{errors.brandName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Ramo de Atividade *</label>
                  <input
                    type="text"
                    value={brandData.businessArea}
                    onChange={(e) => setBrandData({ ...brandData, businessArea: e.target.value })}
                    placeholder="Ex: Alimentação, Tecnologia, Moda..."
                    className="input-styled"
                  />
                  {errors.businessArea && <p className="text-destructive text-sm mt-1">{errors.businessArea}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="font-display text-xl font-semibold mb-6">Forma de Pagamento</h3>

                <div className="space-y-4">
                  {paymentOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`radio-card ${paymentOption === option.id ? "selected" : ""}`}
                      onClick={() => setPaymentOption(option.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              paymentOption === option.id
                                ? "border-primary bg-primary"
                                : "border-muted-foreground"
                            }`}
                          >
                            {paymentOption === option.id && (
                              <Check className="w-3 h-3 text-primary-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </div>
                        <div className="font-display font-bold text-lg gradient-text">
                          {option.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">
                  * Taxas do INPI (GRU) são cobradas à parte pelo órgão.
                </p>
              </div>
            )}

            {/* Step 4: Contract */}
            {step === 4 && (
              <div className="space-y-6">
                <h3 className="font-display text-xl font-semibold mb-6">Contrato Digital</h3>

                {/* Contract Preview */}
                <div className="bg-secondary/50 rounded-xl p-4 h-64 overflow-y-auto text-sm">
                  <h4 className="font-bold mb-4">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE REGISTRO DE MARCA</h4>
                  
                  <p className="mb-4">
                    <strong>CONTRATANTE:</strong> {personalData.fullName}, CPF {personalData.cpf}, 
                    residente em {personalData.address}, {personalData.neighborhood}, CEP {personalData.cep}.
                  </p>

                  <p className="mb-4">
                    <strong>CONTRATADA:</strong> WebMarcas Serviços de Propriedade Intelectual LTDA.
                  </p>

                  <p className="mb-4">
                    <strong>OBJETO:</strong> Preparo, protocolo e acompanhamento do pedido de registro 
                    da marca "{brandData.brandName}" junto ao INPI, no ramo de {brandData.businessArea}.
                  </p>

                  <p className="mb-4">
                    <strong>VALOR:</strong> {paymentOptions.find(p => p.id === paymentOption)?.value || "N/A"} 
                    - {paymentOptions.find(p => p.id === paymentOption)?.description}
                  </p>

                  <p className="mb-4">
                    <strong>TAXAS DO INPI:</strong> As taxas federais (GRU) serão cobradas à parte 
                    diretamente pelo órgão.
                  </p>

                  <p className="mb-4">
                    <strong>GARANTIA:</strong> Em caso de indeferimento por motivos não identificados 
                    na análise de viabilidade, a CONTRATADA realizará nova tentativa sem custo adicional.
                  </p>

                  <p className="mb-4">
                    <strong>VIGÊNCIA:</strong> O registro de marca tem validade de 10 anos, renovável 
                    por períodos iguais e sucessivos.
                  </p>

                  <p className="mb-4">
                    <strong>FORO:</strong> Fica eleito o Foro da Comarca de São Paulo - SP para dirimir 
                    quaisquer questões oriundas deste contrato.
                  </p>
                </div>

                {/* Accept checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      contractAccepted
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                    onClick={() => setContractAccepted(!contractAccepted)}
                  >
                    {contractAccepted && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Li e aceito os termos do contrato de prestação de serviços. 
                    Estou ciente de que esta assinatura tem validade jurídica.
                  </span>
                </label>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              {step > 1 ? (
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button variant="hero" onClick={nextStep} className="group">
                  Continuar
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <Button
                  variant="accent"
                  onClick={handleSubmit}
                  disabled={!contractAccepted}
                  className="group"
                >
                  <FileSignature className="w-4 h-4" />
                  Assinar e Finalizar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegistrationFormSection;
