import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, CheckCircle, AlertTriangle, AlertCircle, ShieldX,
  ArrowRight, ArrowLeft, Check, User, Building2, FileSignature, 
  Download, Printer, CreditCard, Loader2, MessageCircle, Shield,
  Instagram, Mail, Phone
} from "lucide-react";
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
import { checkViability, type ViabilityResult } from "@/lib/api/viability";
import webmarcasLogo from "@/assets/webmarcas-logo-new.png";
import webmarcasIcon from "@/assets/webmarcas-icon.png";

// Validation schemas
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

type ViabilityLevel = "high" | "medium" | "low" | "blocked" | null;

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Steps: 1=viability, 2=result, 3=personal, 4=brand, 5=payment, 6=contract
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Viability state
  const [brandNameSearch, setBrandNameSearch] = useState("");
  const [businessAreaSearch, setBusinessAreaSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [viabilityResult, setViabilityResult] = useState<ViabilityResult | null>(null);
  
  // Load contract template
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
  const [formStartedTriggered, setFormStartedTriggered] = useState(false);

  // Viability search handler
  const handleViabilitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!brandNameSearch.trim() || !businessAreaSearch.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome da marca e o ramo de atividade.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    try {
      const result = await checkViability(brandNameSearch.trim(), businessAreaSearch.trim());
      setViabilityResult(result);
      
      // Pre-fill brand data
      setBrandData(prev => ({
        ...prev,
        brandName: brandNameSearch.trim(),
        businessArea: businessAreaSearch.trim(),
      }));
      
      setStep(2);
    } catch (error) {
      console.error('Error checking viability:', error);
      toast({
        title: "Erro na consulta",
        description: "Não foi possível realizar a consulta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Print laudo
  const printLaudo = () => {
    const currentDate = new Date().toLocaleString('pt-BR');
    const viabilityText = getViabilityText(viabilityResult?.level || null);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir a janela de impressão.",
        variant: "destructive",
      });
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Laudo Técnico de Viabilidade - WebMarcas</title>
        <style>
          @page { size: A4; margin: 20mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a2e; background: white; padding: 40px; }
          .header { display: flex; align-items: center; gap: 20px; border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { width: 80px; height: 80px; }
          .company-info h1 { font-size: 28px; color: #0ea5e9; margin-bottom: 5px; }
          .company-info p { color: #64748b; font-size: 14px; }
          .title { text-align: center; font-size: 24px; color: #1a1a2e; margin-bottom: 30px; padding: 15px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; }
          .info-section { margin-bottom: 25px; }
          .info-section h3 { font-size: 16px; color: #0ea5e9; margin-bottom: 10px; text-transform: uppercase; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { background: #f8fafc; padding: 12px 16px; border-radius: 6px; border-left: 3px solid #0ea5e9; }
          .info-item label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
          .info-item span { font-size: 16px; font-weight: 600; color: #1a1a2e; }
          .result-box { padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center; font-size: 20px; font-weight: bold; }
          .result-high { background: #dcfce7; color: #166534; border: 2px solid #22c55e; }
          .result-medium { background: #fef9c3; color: #854d0e; border: 2px solid #eab308; }
          .result-low, .result-blocked { background: #fee2e2; color: #991b1b; border: 2px solid #ef4444; }
          .laudo-content { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 25px; white-space: pre-wrap; font-size: 14px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${webmarcasIcon}" alt="WebMarcas" class="logo" />
          <div class="company-info">
            <h1>WebMarcas</h1>
            <p>Registro de Marcas</p>
          </div>
        </div>
        <div class="title">📋 Laudo Técnico de Viabilidade de Marca</div>
        <div class="info-section">
          <h3>Dados da Consulta</h3>
          <div class="info-grid">
            <div class="info-item"><label>Nome da Marca</label><span>${brandNameSearch}</span></div>
            <div class="info-item"><label>Ramo de Atividade</label><span>${businessAreaSearch}</span></div>
          </div>
        </div>
        <div class="info-section">
          <h3>Resultado da Análise</h3>
          <div class="result-box result-${viabilityResult?.level || 'low'}">${viabilityText}</div>
        </div>
        <div class="info-section">
          <h3>Parecer Técnico Completo</h3>
          <div class="laudo-content">${viabilityResult?.laudo || viabilityResult?.description || 'Análise não disponível'}</div>
        </div>
        <div class="footer">
          <p>Documento gerado automaticamente pelo sistema WebMarcas</p>
          <p>www.webmarcas.net</p>
          <p>Data e hora da geração: ${currentDate}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const getViabilityText = (level: ViabilityLevel) => {
    switch (level) {
      case "high": return "✅ Viável";
      case "medium": return "⚠️ Baixa viabilidade";
      case "low": return "❌ Alto risco de colidência";
      case "blocked": return "❌ Marca bloqueada";
      default: return "";
    }
  };

  const getResultStyles = (level: ViabilityLevel) => {
    switch (level) {
      case "high":
        return {
          icon: CheckCircle,
          bgClass: "bg-green-500/10 border-green-500/30",
          iconClass: "text-green-500",
          textClass: "text-green-500",
        };
      case "medium":
        return {
          icon: AlertTriangle,
          bgClass: "bg-yellow-500/10 border-yellow-500/30",
          iconClass: "text-yellow-500",
          textClass: "text-yellow-500",
        };
      case "low":
        return {
          icon: AlertCircle,
          bgClass: "bg-red-500/10 border-red-500/30",
          iconClass: "text-red-500",
          textClass: "text-red-500",
        };
      case "blocked":
        return {
          icon: ShieldX,
          bgClass: "bg-red-500/20 border-red-500/50",
          iconClass: "text-red-500",
          textClass: "text-red-500",
        };
      default:
        return {
          icon: Search,
          bgClass: "",
          iconClass: "",
          textClass: "",
        };
    }
  };

  // Trigger form_started email
  const triggerFormStarted = useCallback(async () => {
    if (formStartedTriggered) return;
    if (!personalData.fullName || !personalData.email) return;
    if (!personalData.email.includes('@')) return;
    
    setFormStartedTriggered(true);
    
    try {
      await supabase.functions.invoke('trigger-email-automation', {
        body: {
          trigger_event: 'form_started',
          create_lead: true,
          data: {
            nome: personalData.fullName,
            email: personalData.email,
            phone: personalData.phone || null,
            marca: brandData.brandName || 'Sua Marca',
            base_url: window.location.origin,
          },
        },
      });
    } catch (error) {
      console.error('Error triggering form_started:', error);
    }
  }, [formStartedTriggered, personalData, brandData.brandName]);

  useEffect(() => {
    if (step === 4 && !formStartedTriggered) {
      triggerFormStarted();
    }
  }, [step, formStartedTriggered, triggerFormStarted]);

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

    if (stepNumber === 3) {
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

    if (stepNumber === 4) {
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

    if (stepNumber === 5) {
      if (!paymentMethod) {
        setErrors({ paymentMethod: "Selecione uma forma de pagamento" });
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 6));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      const contractHtml = generateContractHTML();

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
        throw new Error(error.message || 'Erro ao processar pagamento');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar cobrança');
      }

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
    if (!printWindow) return;

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

  const resetSearch = () => {
    setViabilityResult(null);
    setBrandNameSearch("");
    setBusinessAreaSearch("");
    setStep(1);
  };

  // Step titles for display
  const getStepTitle = () => {
    switch (step) {
      case 1: return "Consulte a viabilidade da sua marca";
      case 2: return "Resultado da Análise";
      case 3: return "Dados Pessoais";
      case 4: return "Dados da Marca";
      case 5: return "Forma de Pagamento";
      case 6: return "Contrato Digital";
      default: return "";
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return "Pesquisa automática na base oficial do INPI em tempo real.";
      case 2: return "Veja o resultado da pesquisa real no INPI.";
      case 3: return "Preencha seus dados pessoais para continuar.";
      case 4: return "Informe os dados da marca que deseja registrar.";
      case 5: return "Escolha a melhor forma de pagamento para você.";
      case 6: return "Revise e aceite o contrato para finalizar.";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 flex justify-center border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        <img src={webmarcasLogo} alt="WebMarcas" className="h-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Step Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Shield className="w-4 h-4" />
            {step === 1 || step === 2 ? 'Busca Gratuita' : `Etapa ${step - 2} de 4`}
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-8 max-w-lg">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {getStepTitle().split(' ').map((word, i) => 
              word === 'marca' || word === 'viabilidade' 
                ? <span key={i} className="text-primary">{word} </span> 
                : word + ' '
            )}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {getStepSubtitle()}
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          
          {/* Step 1: Viability Search */}
          {step === 1 && (
            <form onSubmit={handleViabilitySearch} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nome da Marca
                </label>
                <input
                  type="text"
                  value={brandNameSearch}
                  onChange={(e) => setBrandNameSearch(e.target.value)}
                  placeholder="Ex: WebMarcas"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  disabled={isSearching}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Ramo de Atividade
                </label>
                <input
                  type="text"
                  value={businessAreaSearch}
                  onChange={(e) => setBusinessAreaSearch(e.target.value)}
                  placeholder="Ex: Serviços Jurídicos"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  disabled={isSearching}
                />
              </div>

              <Button
                type="submit"
                className="w-full py-6 text-lg font-semibold bg-primary hover:bg-primary/90"
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Consultando INPI...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Gerar Laudo Técnico
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Step 2: Viability Result */}
          {step === 2 && viabilityResult && (
            <div className="space-y-6">
              {/* Result Header */}
              {(() => {
                const styles = getResultStyles(viabilityResult.level);
                const Icon = styles.icon;

                return (
                  <div className={`rounded-xl border p-4 ${styles.bgClass}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-6 h-6 ${styles.iconClass}`} />
                      <h3 className={`font-semibold text-lg ${styles.textClass}`}>
                        {viabilityResult.title}
                      </h3>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">{viabilityResult.description}</p>
                  </div>
                );
              })()}

              {/* Laudo */}
              {viabilityResult.laudo && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Laudo Técnico</h4>
                    <Button variant="ghost" size="sm" onClick={printLaudo}>
                      <Printer className="w-4 h-4 mr-1" />
                      Imprimir
                    </Button>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 max-h-60 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-400 font-sans">
                      {viabilityResult.laudo}
                    </pre>
                  </div>
                </div>
              )}

              {/* Warning */}
              {viabilityResult.level !== 'blocked' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>⚠️ Importante:</strong> O dono da marca é quem registra primeiro. A situação pode mudar a qualquer momento.
                  </p>
                </div>
              )}

              {/* CTAs */}
              <div className="space-y-3">
                {viabilityResult.level !== 'blocked' && (
                  <Button
                    className="w-full py-6 text-lg font-semibold bg-primary hover:bg-primary/90"
                    onClick={() => setStep(3)}
                  >
                    🚀 Registrar minha marca
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <a
                    href={`https://wa.me/5511999999999?text=${encodeURIComponent(`Olá! Acabei de consultar a viabilidade da marca "${brandNameSearch}" e gostaria de falar com um especialista.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Falar com especialista
                  </a>
                </Button>
                <button
                  onClick={resetSearch}
                  className="w-full text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-2"
                >
                  Fazer nova consulta
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Personal Data */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome Completo *</label>
                <input
                  type="text"
                  value={personalData.fullName}
                  onChange={(e) => setPersonalData({ ...personalData, fullName: e.target.value })}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">E-mail *</label>
                <input
                  type="email"
                  value={personalData.email}
                  onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Telefone *</label>
                  <input
                    type="text"
                    value={personalData.phone}
                    onChange={(e) => setPersonalData({ ...personalData, phone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">CPF *</label>
                  <input
                    type="text"
                    value={personalData.cpf}
                    onChange={(e) => setPersonalData({ ...personalData, cpf: formatCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">CEP *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={personalData.cep}
                    onChange={(e) => handleCEPChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {isLoadingCEP && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Endereço *</label>
                <input
                  type="text"
                  value={personalData.address}
                  onChange={(e) => setPersonalData({ ...personalData, address: e.target.value })}
                  placeholder="Rua, número, complemento"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bairro *</label>
                  <input
                    type="text"
                    value={personalData.neighborhood}
                    onChange={(e) => setPersonalData({ ...personalData, neighborhood: e.target.value })}
                    placeholder="Bairro"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.neighborhood && <p className="text-red-500 text-xs mt-1">{errors.neighborhood}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cidade *</label>
                  <input
                    type="text"
                    value={personalData.city}
                    onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
                    placeholder="Cidade"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">UF *</label>
                  <input
                    type="text"
                    value={personalData.state}
                    onChange={(e) => setPersonalData({ ...personalData, state: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={nextStep}>
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Brand Data */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome da Marca *</label>
                <input
                  type="text"
                  value={brandData.brandName}
                  onChange={(e) => setBrandData({ ...brandData, brandName: e.target.value })}
                  placeholder="A marca que deseja registrar"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ramo de Atividade *</label>
                <input
                  type="text"
                  value={brandData.businessArea}
                  onChange={(e) => setBrandData({ ...brandData, businessArea: e.target.value })}
                  placeholder="Ex: Alimentação, Tecnologia, Moda..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.businessArea && <p className="text-red-500 text-xs mt-1">{errors.businessArea}</p>}
              </div>

              {/* CNPJ Toggle */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      brandData.hasCNPJ
                        ? "border-primary bg-primary"
                        : "border-slate-400"
                    }`}
                    onClick={() => setBrandData({ ...brandData, hasCNPJ: !brandData.hasCNPJ })}
                  >
                    {brandData.hasCNPJ && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Minha marca será registrada em nome de CNPJ</span>
                </label>
              </div>

              {brandData.hasCNPJ && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">CNPJ *</label>
                    <input
                      type="text"
                      value={brandData.cnpj}
                      onChange={(e) => setBrandData({ ...brandData, cnpj: formatCNPJ(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    {errors.cnpj && <p className="text-red-500 text-xs mt-1">{errors.cnpj}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Razão Social *</label>
                    <input
                      type="text"
                      value={brandData.companyName}
                      onChange={(e) => setBrandData({ ...brandData, companyName: e.target.value })}
                      placeholder="Nome da empresa"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={nextStep}>
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Payment */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="space-y-3">
                {/* À Vista */}
                <label
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'avista'
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentMethod('avista')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'avista' ? 'border-primary' : 'border-slate-400'
                    }`}>
                      {paymentMethod === 'avista' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">À Vista</p>
                      <p className="text-xs text-slate-500">PIX ou boleto</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary text-lg">R$699</p>
                </label>

                {/* Cartão 6x */}
                <label
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cartao6x'
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentMethod('cartao6x')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'cartao6x' ? 'border-primary' : 'border-slate-400'
                    }`}>
                      {paymentMethod === 'cartao6x' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Cartão 6x</p>
                      <p className="text-xs text-slate-500">Sem juros</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary text-lg">6x R$199</p>
                </label>

                {/* Boleto 3x */}
                <label
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'boleto3x'
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentMethod('boleto3x')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'boleto3x' ? 'border-primary' : 'border-slate-400'
                    }`}>
                      {paymentMethod === 'boleto3x' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Boleto 3x</p>
                      <p className="text-xs text-slate-500">Boleto parcelado</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary text-lg">3x R$399</p>
                </label>
              </div>

              {errors.paymentMethod && (
                <p className="text-red-500 text-sm">{errors.paymentMethod}</p>
              )}

              <p className="text-xs text-slate-500 text-center">
                * Taxas do INPI (GRU) são cobradas à parte pelo órgão.
              </p>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={nextStep}>
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: Contract */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">Contrato de Serviços</h3>
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

              {/* Contract Preview */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700">
                {isLoadingTemplate ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-slate-500">Carregando contrato...</span>
                  </div>
                ) : (
                  <ContractRenderer 
                    content={getProcessedContract()} 
                    showLetterhead={true}
                    showCertificationSection={true}
                    className="text-slate-900 dark:text-slate-100"
                  />
                )}
              </div>

              {/* Accept checkbox */}
              <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    contractAccepted
                      ? "border-primary bg-primary"
                      : "border-slate-400"
                  }`}
                  onClick={() => setContractAccepted(!contractAccepted)}
                >
                  {contractAccepted && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Li e aceito os termos do contrato. Estou ciente de que esta assinatura digital tem validade jurídica e será registrada em blockchain.
                </span>
              </label>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleSubmit}
                  disabled={!contractAccepted || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Aceitar e Finalizar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-6">
            <a 
              href="https://instagram.com/webmarcasoficial" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-primary transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="https://wa.me/5511999999999" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-green-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <a 
              href="mailto:contato@webmarcas.net"
              className="text-slate-500 hover:text-primary transition-colors"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a 
              href="tel:+5511999999999"
              className="text-slate-500 hover:text-primary transition-colors"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} WebMarcas. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Checkout;
