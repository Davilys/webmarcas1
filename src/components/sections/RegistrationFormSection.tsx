import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, User, Building2, FileSignature, Download, Printer, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  validateCPF,
  validateCNPJ,
  fetchAddressByCEP,
  formatCPF,
  formatCNPJ,
  formatCEP,
  formatPhone,
} from "@/lib/validators";
import { useContractTemplate, replaceContractVariables } from "@/hooks/useContractTemplate";
import { ContractRenderer, generateContractPrintHTML } from "@/components/contracts/ContractRenderer";
// Form schemas with real validation
const personalDataSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  email: z.string().email("E-mail inválido").max(255),
  phone: z.string().min(14, "Telefone inválido"),
  cpf: z.string().refine((val) => validateCPF(val), "CPF inválido. Verifique os dados."),
  cep: z.string().regex(/^\d{5}-\d{3}$/, "CEP inválido"),
  address: z.string().min(5, "Endereço obrigatório").max(200),
  neighborhood: z.string().min(2, "Bairro obrigatório").max(100),
  city: z.string().min(2, "Cidade obrigatória").max(100),
  state: z.string().length(2, "UF obrigatória"),
});

const brandDataSchema = z.object({
  brandName: z.string().min(2, "Nome da marca obrigatório").max(100),
  businessArea: z.string().min(3, "Ramo de atividade obrigatório").max(200),
  hasCNPJ: z.boolean(),
  cnpj: z.string().optional(),
  companyName: z.string().optional(),
}).refine((data) => {
  if (data.hasCNPJ) {
    if (!data.cnpj || !validateCNPJ(data.cnpj)) return false;
    if (!data.companyName || data.companyName.length < 3) return false;
  }
  return true;
}, {
  message: "CNPJ ou Razão Social inválidos",
  path: ["cnpj"],
});

const RegistrationFormSection = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Load contract template from database
  const { template: contractTemplate, isLoading: isLoadingTemplate } = useContractTemplate('Registro de Marca');

  // Form data
  const [personalData, setPersonalData] = useState({
    fullName: "",
    email: "",
    phone: "",
    cpf: "",
    cep: "",
    address: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [brandData, setBrandData] = useState({
    brandName: "",
    businessArea: "",
    hasCNPJ: false,
    cnpj: "",
    companyName: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<string>("");

  // Load viability data from session storage if available
  useEffect(() => {
    const viabilityData = sessionStorage.getItem('viabilityData');
    console.log('Loading viability data:', viabilityData);
    if (viabilityData) {
      try {
        const parsed = JSON.parse(viabilityData);
        console.log('Parsed viability data:', parsed);
        if (parsed.brandName || parsed.businessArea) {
          setBrandData(prev => ({
            ...prev,
            brandName: parsed.brandName || prev.brandName,
            businessArea: parsed.businessArea || prev.businessArea,
          }));
        }
      } catch (e) {
        console.error('Error parsing viability data:', e);
      }
    }
  }, []);

  // CEP auto-fill
  const handleCEPChange = useCallback(async (cep: string) => {
    const formattedCEP = formatCEP(cep);
    setPersonalData(prev => ({ ...prev, cep: formattedCEP }));
    
    const cleanCEP = formattedCEP.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setIsLoadingCEP(true);
      const addressData = await fetchAddressByCEP(cleanCEP);
      setIsLoadingCEP(false);
      
      if (addressData) {
        setPersonalData(prev => ({
          ...prev,
          address: addressData.logradouro || prev.address,
          neighborhood: addressData.bairro || prev.neighborhood,
          city: addressData.localidade || prev.city,
          state: addressData.uf || prev.state,
        }));
        setErrors(prev => ({ ...prev, cep: "" }));
      } else {
        setErrors(prev => ({ ...prev, cep: "CEP não encontrado." }));
      }
    }
  }, []);

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

    if (stepNumber === 3) {
      if (!paymentMethod) {
        setErrors({ paymentMethod: "Selecione uma forma de pagamento" });
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
      // Scroll to top of form
      document.getElementById('registro')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    document.getElementById('registro')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


  const handleSubmit = async () => {
    if (!contractAccepted) {
      toast({
        title: "Assinatura obrigatória",
        description: "Por favor, leia e aceite o contrato para continuar.",
        variant: "destructive",
      });
      return;
    }

    const paymentValue = paymentMethod === 'avista' ? 698.97 : paymentMethod === 'cartao6x' ? 1194 : 1197;

    setIsSubmitting(true);

    try {
      // Generate contract HTML for storage
      const contractHtml = generateContractHTML();

      // Call Asaas edge function to create payment and lead
      const { data, error } = await supabase.functions.invoke('create-asaas-payment', {
        body: {
          personalData,
          brandData,
          paymentMethod,
          paymentValue,
          contractHtml,
        },
      });

      if (error) {
        console.error('Asaas payment error:', error);
        throw new Error(error.message || 'Erro ao processar pagamento');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar cobrança');
      }

      console.log('Asaas payment created:', data);

      // Save order data with Asaas response for payment page
      const orderData = {
        personalData,
        brandData,
        paymentMethod,
        paymentValue,
        contractHtml,
        acceptedAt: new Date().toISOString(),
        leadId: data.leadId,
        contractId: data.contractId,
        contractNumber: data.contractNumber,
        asaas: {
          customerId: data.customerId,
          asaasCustomerId: data.asaasCustomerId,
          paymentId: data.paymentId,
          status: data.status,
          billingType: data.billingType,
          dueDate: data.dueDate,
          invoiceUrl: data.invoiceUrl,
          bankSlipUrl: data.bankSlipUrl,
          pixQrCode: data.pixQrCode,
        },
      };

      // Clear viability data now that form is submitted
      sessionStorage.removeItem('viabilityData');
      sessionStorage.setItem("orderData", JSON.stringify(orderData));
      
      toast({
        title: "Cobrança criada com sucesso!",
        description: "Você será redirecionado para a página de pagamento.",
      });

      navigate("/status-pedido");
    } catch (err) {
      console.error('Submit error:', err);
      toast({
        title: "Erro ao processar",
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the processed contract content
  const getProcessedContract = useCallback(() => {
    if (!contractTemplate) return '';
    return replaceContractVariables(contractTemplate.content, {
      personalData,
      brandData,
      paymentMethod
    });
  }, [contractTemplate, personalData, brandData, paymentMethod]);

  const printContract = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir a janela de impressão.",
        variant: "destructive",
      });
      return;
    }

    const contractContent = getProcessedContract();
    const contractHTML = generateContractPrintHTML(
      contractContent,
      brandData.brandName,
      personalData.fullName,
      personalData.cpf
    );
    printWindow.document.write(contractHTML);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const downloadContract = () => {
    const contractContent = getProcessedContract();
    const contractHTML = generateContractPrintHTML(
      contractContent,
      brandData.brandName,
      personalData.fullName,
      personalData.cpf
    );
    const blob = new Blob([contractHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contrato_WebMarcas_${brandData.brandName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateContractHTML = () => {
    const contractContent = getProcessedContract();
    return generateContractPrintHTML(
      contractContent,
      brandData.brandName,
      personalData.fullName,
      personalData.cpf
    );
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
              <div className="space-y-6 animate-fade-in-up">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone *</label>
                    <input
                      type="text"
                      value={personalData.phone}
                      onChange={(e) => setPersonalData({ ...personalData, phone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className="input-styled"
                    />
                    {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone}</p>}
                  </div>
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
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">CEP *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={personalData.cep}
                      onChange={(e) => handleCEPChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      className="input-styled"
                    />
                    {isLoadingCEP && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {errors.cep && <p className="text-destructive text-sm mt-1">{errors.cep}</p>}
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bairro *</label>
                    <input
                      type="text"
                      value={personalData.neighborhood}
                      onChange={(e) => setPersonalData({ ...personalData, neighborhood: e.target.value })}
                      placeholder="Bairro"
                      className="input-styled"
                    />
                    {errors.neighborhood && <p className="text-destructive text-sm mt-1">{errors.neighborhood}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Cidade *</label>
                    <input
                      type="text"
                      value={personalData.city}
                      onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
                      placeholder="Cidade"
                      className="input-styled"
                    />
                    {errors.city && <p className="text-destructive text-sm mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">UF *</label>
                    <input
                      type="text"
                      value={personalData.state}
                      onChange={(e) => setPersonalData({ ...personalData, state: e.target.value.toUpperCase() })}
                      placeholder="SP"
                      maxLength={2}
                      className="input-styled"
                    />
                    {errors.state && <p className="text-destructive text-sm mt-1">{errors.state}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Brand Data */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in-up">
                <h3 className="font-display text-xl font-semibold mb-6">Dados da Marca</h3>

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

                {/* CNPJ Toggle */}
                <div className="p-4 rounded-xl border border-border bg-secondary/30">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        brandData.hasCNPJ
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                      onClick={() => setBrandData({ ...brandData, hasCNPJ: !brandData.hasCNPJ })}
                    >
                      {brandData.hasCNPJ && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm">Minha marca será registrada em nome de CNPJ</span>
                  </label>
                </div>

                {brandData.hasCNPJ && (
                  <div className="space-y-4 animate-fade-in-up">
                    <div>
                      <label className="block text-sm font-medium mb-2">CNPJ *</label>
                      <input
                        type="text"
                        value={brandData.cnpj}
                        onChange={(e) => setBrandData({ ...brandData, cnpj: formatCNPJ(e.target.value) })}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        className="input-styled"
                      />
                      {errors.cnpj && <p className="text-destructive text-sm mt-1">{errors.cnpj}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Razão Social *</label>
                      <input
                        type="text"
                        value={brandData.companyName}
                        onChange={(e) => setBrandData({ ...brandData, companyName: e.target.value })}
                        placeholder="Nome da empresa"
                        className="input-styled"
                      />
                      {errors.companyName && <p className="text-destructive text-sm mt-1">{errors.companyName}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in-up">
                <h3 className="font-display text-xl font-semibold mb-6">Forma de Pagamento</h3>

                <div className="space-y-4">
                  {/* À Vista */}
                  <label
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'avista'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setPaymentMethod('avista')}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentMethod === 'avista'
                            ? 'border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {paymentMethod === 'avista' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">À Vista</p>
                        <p className="text-sm text-muted-foreground">Pagamento único via PIX ou boleto</p>
                      </div>
                    </div>
                    <p className="font-bold text-primary text-lg">R$699,00</p>
                  </label>

                  {/* Cartão 6x */}
                  <label
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'cartao6x'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setPaymentMethod('cartao6x')}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentMethod === 'cartao6x'
                            ? 'border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {paymentMethod === 'cartao6x' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">Cartão 6x</p>
                        <p className="text-sm text-muted-foreground">Sem juros no cartão de crédito</p>
                      </div>
                    </div>
                    <p className="font-bold text-primary text-lg">6x de R$199,00</p>
                  </label>

                  {/* Boleto 3x */}
                  <label
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'boleto3x'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setPaymentMethod('boleto3x')}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentMethod === 'boleto3x'
                            ? 'border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {paymentMethod === 'boleto3x' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">Boleto 3x</p>
                        <p className="text-sm text-muted-foreground">Boleto bancário parcelado</p>
                      </div>
                    </div>
                    <p className="font-bold text-primary text-lg">3x de R$399,00</p>
                  </label>
                </div>

                {errors.paymentMethod && (
                  <p className="text-destructive text-sm">{errors.paymentMethod}</p>
                )}

                <p className="text-sm text-muted-foreground">
                  * Taxas do INPI (GRU) são cobradas à parte pelo órgão.
                </p>
              </div>
            )}

            {/* Step 4: Contract */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-xl font-semibold">Contrato Digital</h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={downloadContract}>
                      <Download className="w-4 h-4 mr-1" />
                      Baixar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={printContract}>
                      <Printer className="w-4 h-4 mr-1" />
                      Imprimir
                    </Button>
                  </div>
                </div>

                {/* Highlight Box */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-xs">
                  <p>
                    Os termos deste instrumento aplicam-se apenas a contratações com negociações personalizadas, 
                    tratadas diretamente com a equipe comercial da Web Marcas e Patentes Eireli.
                  </p>
                  <p className="mt-2">
                    Os termos aqui celebrados são adicionais ao "Contrato de Prestação de Serviços e Gestão de 
                    Pagamentos e Outras Avenças" com aceite integral no momento do envio da Proposta.
                  </p>
                </div>

                {/* Contract Preview - Dynamic from database */}
                <div className="bg-white rounded-xl p-6 max-h-[500px] overflow-y-auto text-sm border border-border shadow-inner">
                  {isLoadingTemplate ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Carregando contrato...</span>
                    </div>
                  ) : (
                    <ContractRenderer 
                      content={getProcessedContract()} 
                      showLetterhead={true}
                      showCertificationSection={true}
                      className="text-foreground"
                    />
                  )}
                </div>

                {/* Accept checkbox */}
                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
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
                    Estou ciente de que esta assinatura digital tem validade jurídica e será registrada 
                    em blockchain com rastreio de IP, data/hora e hash criptográfico.
                  </span>
                </label>
              </div>
            )}

            {/* Navigation - Back left, Continue right */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              {step > 1 ? (
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button variant="hero" onClick={nextStep} className="group ml-auto">
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <Button
                  variant="accent"
                  onClick={handleSubmit}
                  disabled={!contractAccepted || isSubmitting}
                  className="group ml-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Aceitar e Continuar
                    </>
                  )}
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
