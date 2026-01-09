import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, User, Building2, FileSignature, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  validateCPF,
  validateCNPJ,
  fetchAddressByCEP,
  formatCPF,
  formatCNPJ,
  formatCEP,
  formatPhone,
} from "@/lib/validators";

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
  const { toast } = useToast();

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

    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 3));
      // Scroll to top of form
      document.getElementById('registro')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    document.getElementById('registro')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleSubmit = () => {
    if (!contractAccepted) {
      toast({
        title: "Assinatura obrigatória",
        description: "Por favor, leia e aceite o contrato para continuar.",
        variant: "destructive",
      });
      return;
    }

    // Save order data for payment page
    const orderData = {
      personalData,
      brandData,
      paymentValue: 698.97,
      acceptedAt: new Date().toISOString(),
    };

    // Clear viability data now that form is submitted
    sessionStorage.removeItem('viabilityData');
    sessionStorage.setItem("orderData", JSON.stringify(orderData));
    navigate("/status-pedido");
  };

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

    const contractHTML = generateContractHTML();
    printWindow.document.write(contractHTML);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const downloadContract = () => {
    const contractHTML = generateContractHTML();
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
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato WebMarcas - ${brandData.brandName}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #1a1a2e; background: white; padding: 40px; font-size: 12px; }
    .header { display: flex; align-items: center; gap: 20px; border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 20px; }
    .company-info h1 { font-size: 24px; color: #0ea5e9; margin-bottom: 5px; }
    .company-info p { color: #64748b; font-size: 12px; }
    .title { text-align: center; font-size: 16px; font-weight: bold; color: #1a1a2e; margin: 20px 0; padding: 10px; background: #f0f9ff; border-left: 4px solid #0ea5e9; }
    .highlight { background: #fef3c7; padding: 10px; border-radius: 4px; margin: 15px 0; border: 1px solid #f59e0b; font-size: 11px; }
    .clause { margin-bottom: 15px; }
    .clause h3 { font-size: 13px; color: #0ea5e9; margin-bottom: 5px; }
    .clause p, .clause ul { margin-bottom: 10px; }
    .clause ul { padding-left: 20px; }
    .signature-section { margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px; }
    .signature-line { border-bottom: 1px solid #000; width: 300px; margin: 40px auto 5px; }
    .signature-name { text-align: center; font-size: 11px; }
    .footer { margin-top: 30px; text-align: center; color: #64748b; font-size: 10px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>WebMarcas</h1>
      <p>Registro de Marcas e Patentes</p>
      <p>www.webmarcas.net</p>
    </div>
  </div>
  
  <div class="title">Acordo do Contrato - Anexo I<br/>CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS DE ASSESSORAMENTO PARA REGISTRO DE MARCA JUNTO AO INPI</div>
  
  <div class="highlight">
    Os termos deste instrumento aplicam-se apenas a contratações com negociações personalizadas, tratadas diretamente com a equipe comercial da Web Marcas e Patentes Eireli.<br/><br/>
    Os termos aqui celebrados são adicionais ao "Contrato de Prestação de Serviços e Gestão de Pagamentos e Outras Avenças" com aceite integral no momento do envio da Proposta.
  </div>
  
  <p>Por este instrumento particular de prestação de serviços, que fazem, de um lado:</p>
  
  <div class="clause">
    <p><strong>I) WEB MARCAS PATENTES EIRELI</strong>, com sede na cidade de SÃO PAULO, Estado de SP, na AVENIDA BRIGADEIRO LUIS ANTONIO, Nº: 2696, CEP: 01402-000, inscrita no CNPJ/MF sob o Nº: 39.528.012/0001-29, neste ato representada por seu titular, senhor Davilys Danques de Oliveira Cunha, brasileiro, casado, regularmente inscrito no RG sob o Nº 50.688.779-0 e CPF sob o Nº 393.239.118-79, a seguir denominada <strong>CONTRATADA</strong>.</p>
  </div>
  
  <div class="clause">
    <p><strong>II) ${brandData.hasCNPJ ? brandData.companyName : personalData.fullName}</strong>${brandData.hasCNPJ ? `, inscrita no CNPJ sob nº ${brandData.cnpj}` : ''}, com sede na ${personalData.address}, ${personalData.neighborhood}, na cidade de ${personalData.city}, estado de ${personalData.state}, CEP ${personalData.cep}, neste ato representada por <strong>${personalData.fullName}</strong>, CPF sob o nº ${personalData.cpf}, com endereço de e-mail para faturamento ${personalData.email} e Tel: ${personalData.phone}, ("Contratante").</p>
  </div>
  
  <p>As partes celebram o presente Acordo de Tarifas, que se regerá pelas cláusulas e condições abaixo:</p>
  
  <div class="clause">
    <h3>1. CLÁUSULA PRIMEIRA – DO OBJETO</h3>
    <p>1.1 A CONTRATADA prestará os serviços de preparo, protocolo e acompanhamento do pedido de registro da marca "<strong>${brandData.brandName}</strong>" junto ao INPI até a conclusão do processo, no ramo de atividade: ${brandData.businessArea}.</p>
  </div>
  
  <div class="clause">
    <h3>2. CLÁUSULA SEGUNDA – DA RESPONSABILIDADE SOBRE OS SERVIÇOS CONTRATADOS</h3>
    <p>2.1 Executar os serviços com responsabilidade e qualidade, fornecer cópia digital dos atos praticados junto ao INPI, comunicar à CONTRATANTE eventuais impedimentos ou exigências.</p>
    <p>2.2 Acompanhar semanalmente o processo no INPI e informar colidências, exigências ou publicações, garantir o investimento da CONTRATANTE com nova tentativa sem custos adicionais de honorários caso o registro seja negado.</p>
  </div>
  
  <div class="clause">
    <h3>3. CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES GERAIS DA CONTRATADA</h3>
    <p>3.1 Enviar cópias digitais por e-mail e relatório anual do processo, executar os serviços conforme o contrato e a legislação e cumprir prazos e exigências do INPI.</p>
    <p>3.2 Comunicar impedimentos imediatamente, afim de cumprir as normas do INPI para garantir o registro.</p>
  </div>
  
  <div class="clause">
    <h3>4. CLÁUSULA QUARTA – DAS OBRIGAÇÕES GERAIS DA CONTRATANTE</h3>
    <p>4.1 A CONTRATANTE obriga-se a efetuar os pagamentos na forma, prazos e condições estabelecidas neste instrumento.</p>
    <p>4.2 A CONTRATANTE compromete-se a fornecer à CONTRATADA todas as informações, documentos e materiais solicitados, de forma completa e dentro dos prazos estipulados.</p>
    <p>4.3 A CONTRATANTE poderá solicitar ajustes ou correções nos serviços prestados somente quando houver divergência comprovada com o objeto deste contrato.</p>
    <p>4.4 A CONTRATANTE reconhece que a CONTRATADA atua como assessoria técnica e jurídica especializada.</p>
  </div>
  
  <div class="clause">
    <h3>5. CLÁUSULA QUINTA – DAS CONDIÇÕES DE PAGAMENTO</h3>
    <p>5.1 Os pagamentos à CONTRATADA serão efetuados conforme a opção escolhida: <strong>PIX 1x de R$ 698,97</strong> (à vista, com 43% de desconto).</p>
    <p>5.2 Taxas do INPI: As taxas federais obrigatórias serão de responsabilidade exclusiva do CONTRATANTE.</p>
    <p>5.3 O cadastro do CONTRATANTE junto ao INPI é realizado pela CONTRATADA previamente ao pagamento.</p>
  </div>
  
  <div class="clause">
    <h3>6. CLÁUSULA SEXTA – DO PRAZO DE VIGÊNCIA</h3>
    <p>6.1 O presente contrato terá vigência a partir da assinatura e perdurará até o final do decênio de registro de marca junto ao INPI.</p>
  </div>
  
  <div class="clause">
    <h3>7. CLÁUSULA SÉTIMA – DA INADIMPLÊNCIA</h3>
    <p>7.1 No caso de inadimplência, a CONTRATANTE estará sujeita a: a) Multa de 10% sobre o valor devido; b) Juros de mora de 10% ao mês; c) Suspensão imediata dos serviços.</p>
  </div>
  
  <div class="clause">
    <h3>8. CLÁUSULA OITAVA – DA CONFIDENCIALIDADE</h3>
    <p>8.1 As partes se comprometem a manter em sigilo todas as informações confidenciais trocadas durante a execução do contrato.</p>
  </div>
  
  <div class="clause">
    <h3>9. CLÁUSULA NONA – DA RESCISÃO</h3>
    <p>9.1 Este contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 15 dias.</p>
    <p>9.2 A CONTRATANTE somente poderá cancelar o contrato se não houver débitos pendentes.</p>
  </div>
  
  <div class="clause">
    <h3>10. CLÁUSULA DÉCIMA – DAS CONDIÇÕES GERAIS</h3>
    <p>10.1 Fica pactuada entre as partes a prestação dos serviços de acompanhamento e vigilância do(s) processo(s) referentes às marcas ${brandData.brandName}.</p>
    <p>10.2 Durante a tramitação do processo junto ao INPI, poderão surgir situações que exijam a apresentação de documentos adicionais.</p>
  </div>
  
  <div class="clause">
    <h3>12. CLÁUSULA DÉCIMA SEGUNDA – DO FORO</h3>
    <p>12.1 Para dirimir quaisquer dúvidas relativas ao presente contrato, as partes elegem o Foro da Comarca de São Paulo – SP.</p>
  </div>
  
  <p style="margin-top: 30px;">Por estarem justas e contratadas, as partes assinam o presente em 02 (duas) vias de igual teor e forma.</p>
  
  <p style="margin-top: 15px;"><strong>São Paulo, ${getCurrentDate()}.</strong></p>
  
  <div class="signature-section">
    <p><strong>Assinatura autorizada:</strong></p>
    
    <div class="signature-line"></div>
    <p class="signature-name">WebMarcas Patentes - CNPJ/MF sob o nº 39.528.012/0001-29</p>
    
    <div class="signature-line"></div>
    <p class="signature-name">${personalData.fullName} - CPF sob o nº ${personalData.cpf}</p>
  </div>
  
  <div class="footer">
    <p>Contrato gerado automaticamente pelo sistema WebMarcas</p>
    <p>www.webmarcas.net</p>
    <p>Data e hora da geração: ${new Date().toLocaleString('pt-BR')}</p>
  </div>
</body>
</html>`;
  };

  const steps = [
    { number: 1, label: "Dados Pessoais", icon: User },
    { number: 2, label: "Dados da Marca", icon: Building2 },
    { number: 3, label: "Contrato", icon: FileSignature },
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

            {/* Step 3: Contract */}
            {step === 3 && (
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

                {/* Contract Preview */}
                <div className="bg-white rounded-xl p-6 max-h-[500px] overflow-y-auto text-sm border border-border shadow-inner">
                  {/* Contract Header */}
                  <div className="text-center border-b-2 border-primary pb-4 mb-6">
                    <h4 className="text-primary font-bold text-lg">WebMarcas</h4>
                    <p className="text-muted-foreground text-xs">Registro de Marcas e Patentes</p>
                  </div>

                  <div className="text-center mb-6">
                    <h4 className="font-bold text-base mb-2">Acordo do Contrato - Anexo I</h4>
                    <p className="text-sm font-semibold text-foreground">
                      CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS DE ASSESSORAMENTO PARA REGISTRO DE MARCA JUNTO AO INPI
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-amber-800 text-xs">
                    <p>
                      Os termos deste instrumento aplicam-se apenas a contratações com negociações personalizadas, 
                      tratadas diretamente com a equipe comercial da Web Marcas e Patentes Eireli.
                    </p>
                    <p className="mt-2">
                      Os termos aqui celebrados são adicionais ao "Contrato de Prestação de Serviços e Gestão de 
                      Pagamentos e Outras Avenças" com aceite integral no momento do envio da Proposta.
                    </p>
                  </div>
                  
                  <p className="mb-4 text-foreground">Por este instrumento particular de prestação de serviços, que fazem, de um lado:</p>
                  
                  <p className="mb-4 text-foreground">
                    <strong>I) WEB MARCAS PATENTES EIRELI</strong>, com sede na cidade de SÃO PAULO, Estado de SP, 
                    na AVENIDA BRIGADEIRO LUIS ANTONIO, Nº: 2696, CEP: 01402-000, inscrita no CNPJ/MF sob o 
                    Nº: 39.528.012/0001-29, neste ato representada por seu titular, senhor Davilys Danques de Oliveira Cunha, 
                    brasileiro, casado, regularmente inscrito no RG sob o Nº 50.688.779-0 e CPF sob o Nº 393.239.118-79, 
                    a seguir denominada <strong>CONTRATADA</strong>.
                  </p>

                  <p className="mb-4 text-foreground">
                    <strong>II) {brandData.hasCNPJ ? brandData.companyName : personalData.fullName}</strong>
                    {brandData.hasCNPJ && `, inscrita no CNPJ sob nº ${brandData.cnpj}`}, com sede na {personalData.address}, 
                    {personalData.neighborhood}, na cidade de {personalData.city}, estado de {personalData.state}, 
                    CEP {personalData.cep}, neste ato representada por <strong>{personalData.fullName}</strong>, 
                    CPF sob o nº {personalData.cpf}, com endereço de e-mail para faturamento {personalData.email} 
                    e Tel: {personalData.phone}, ("Contratante").
                  </p>

                  <p className="mb-4 text-foreground">As partes celebram o presente Acordo de Tarifas, que se regerá pelas cláusulas e condições abaixo:</p>

                  <div className="space-y-4 text-foreground">
                    <div>
                      <p className="font-bold text-primary">1. CLÁUSULA PRIMEIRA – DO OBJETO</p>
                      <p>1.1 A CONTRATADA prestará os serviços de preparo, protocolo e acompanhamento do pedido de registro da marca "<span className="text-primary font-semibold">{brandData.brandName}</span>" junto ao INPI até a conclusão do processo.</p>
                    </div>

                    <div>
                      <p className="font-bold text-primary">2. CLÁUSULA SEGUNDA – DA RESPONSABILIDADE SOBRE OS SERVIÇOS CONTRATADOS</p>
                      <p>2.1 Executar os serviços com responsabilidade e qualidade, fornecer cópia digital dos atos praticados junto ao INPI, comunicar à CONTRATANTE eventuais impedimentos ou exigências.</p>
                      <p className="mt-2">2.2 Acompanhar semanalmente o processo no INPI e informar colidências, exigências ou publicações, garantir o investimento da CONTRATANTE com nova tentativa sem custos adicionais de honorários caso o registro seja negado.</p>
                    </div>

                    <div>
                      <p className="font-bold text-primary">3. CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES GERAIS DA CONTRATADA</p>
                      <p>3.1 Enviar cópias digitais por e-mail e relatório anual do processo, executar os serviços conforme o contrato e a legislação e cumprir prazos e exigências do INPI.</p>
                      <p className="mt-2">3.2 Comunicar impedimentos imediatamente, afim de cumprir as normas do INPI para garantir o registro.</p>
                    </div>

                    <div>
                      <p className="font-bold text-primary">4. CLÁUSULA QUARTA – DAS OBRIGAÇÕES GERAIS DA CONTRATANTE</p>
                      <p>4.1 A CONTRATANTE obriga-se a efetuar os pagamentos na forma, prazos e condições estabelecidas neste instrumento.</p>
                      <p className="mt-2">4.2 A CONTRATANTE compromete-se a fornecer à CONTRATADA todas as informações, documentos e materiais solicitados.</p>
                    </div>

                    <div>
                      <p className="font-bold text-primary">5. CLÁUSULA QUINTA – DAS CONDIÇÕES DE PAGAMENTO</p>
                      <p>5.1 Os pagamentos à CONTRATADA serão efetuados conforme a opção escolhida: <strong>PIX 1x de R$ 698,97</strong> (à vista, com 43% de desconto).</p>
                      <p className="mt-2">5.2 Taxas do INPI: As taxas federais obrigatórias serão de responsabilidade exclusiva do CONTRATANTE.</p>
                    </div>

                    <div>
                      <p className="font-bold text-primary">6. CLÁUSULA SEXTA – DO PRAZO DE VIGÊNCIA</p>
                      <p>6.1 O presente contrato terá vigência a partir da assinatura e perdurará até o final do decênio de registro de marca junto ao INPI.</p>
                    </div>

                    <div>
                      <p className="font-bold text-primary">7. CLÁUSULA SÉTIMA – DA INADIMPLÊNCIA</p>
                      <p>7.1 No caso de inadimplência, a CONTRATANTE estará sujeita a multa de 10% sobre o valor devido, juros de mora de 10% ao mês e suspensão imediata dos serviços.</p>
                    </div>

                    <div>
                      <p className="font-bold text-primary">8. CLÁUSULA OITAVA – DA CONFIDENCIALIDADE</p>
                      <p>8.1 As partes se comprometem a manter em sigilo todas as informações confidenciais trocadas durante a execução do contrato.</p>
                    </div>

                    <div>
                      <p className="font-bold text-primary">9. CLÁUSULA NONA – DA RESCISÃO</p>
                      <p>9.1 Este contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 15 dias.</p>
                    </div>

                    <div>
                      <p className="font-bold text-primary">12. CLÁUSULA DÉCIMA SEGUNDA – DO FORO</p>
                      <p>12.1 Para dirimir quaisquer dúvidas relativas ao presente contrato, as partes elegem o Foro da Comarca de São Paulo – SP.</p>
                    </div>
                  </div>

                  <p className="mt-6 text-muted-foreground text-xs">
                    São Paulo, {getCurrentDate()}.
                  </p>
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
                    Estou ciente de que esta assinatura digital tem validade jurídica.
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

              {step < 3 ? (
                <Button variant="hero" onClick={nextStep} className="group ml-auto">
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <Button
                  variant="accent"
                  onClick={handleSubmit}
                  disabled={!contractAccepted}
                  className="group ml-auto"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Aceitar e Continuar
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
