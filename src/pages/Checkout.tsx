import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CheckoutLayout from '@/components/checkout/CheckoutLayout';
import StepProgress from '@/components/checkout/StepProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { checkViability, ViabilityResult } from '@/lib/api/viability';
import { 
  Search, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Shield,
  Loader2,
  Printer,
  FileText,
  CreditCard,
  Banknote,
  Receipt,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CheckoutStep = 'viability' | 'result' | 'personal' | 'brand' | 'payment' | 'contract';

interface FormData {
  // Viability
  brandName: string;
  businessArea: string;
  viabilityResult: ViabilityResult | null;
  
  // Personal
  fullName: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  zipCode: string;
  address: string;
  city: string;
  state: string;
  
  // Brand
  brandDescription: string;
  companyName: string;
  companyCnpj: string;
  
  // Payment
  paymentMethod: 'pix' | 'card' | 'boleto' | null;
  
  // Contract
  acceptedTerms: boolean;
}

const initialFormData: FormData = {
  brandName: '',
  businessArea: '',
  viabilityResult: null,
  fullName: '',
  email: '',
  phone: '',
  cpfCnpj: '',
  zipCode: '',
  address: '',
  city: '',
  state: '',
  brandDescription: '',
  companyName: '',
  companyCnpj: '',
  paymentMethod: null,
  acceptedTerms: false,
};

const stepLabels = ['Busca', 'Resultado', 'Dados', 'Marca', 'Pagamento', 'Contrato'];

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('viability');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);

  // Recuperar dados do sessionStorage (se veio do site)
  useEffect(() => {
    const savedBrandName = sessionStorage.getItem('viabilityBrandName');
    const savedBusinessArea = sessionStorage.getItem('viabilityBusinessArea');
    
    if (savedBrandName || savedBusinessArea) {
      setFormData(prev => ({
        ...prev,
        brandName: savedBrandName || '',
        businessArea: savedBusinessArea || '',
      }));
    }
  }, []);

  const getStepNumber = (step: CheckoutStep): number => {
    const steps: CheckoutStep[] = ['viability', 'result', 'personal', 'brand', 'payment', 'contract'];
    return steps.indexOf(step) + 1;
  };

  const handleViabilitySearch = async () => {
    if (!formData.brandName.trim() || !formData.businessArea.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      const result = await checkViability(formData.brandName, formData.businessArea);
      setFormData(prev => ({ ...prev, viabilityResult: result }));
      setCurrentStep('result');
    } catch (error) {
      toast.error('Erro ao consultar viabilidade');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintLaudo = () => {
    if (!formData.viabilityResult) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laudo de Viabilidade - ${formData.brandName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #f97316; padding-bottom: 20px; }
          .header h1 { color: #1e293b; margin: 0; }
          .content { line-height: 1.8; }
          .result-box { padding: 20px; border-radius: 8px; margin: 20px 0; }
          .high { background: #dcfce7; border: 2px solid #22c55e; }
          .medium { background: #fef3c7; border: 2px solid #f59e0b; }
          .low { background: #fee2e2; border: 2px solid #ef4444; }
          .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>WebMarcas Brasil</h1>
          <p>Laudo Técnico de Viabilidade de Registro de Marca</p>
        </div>
        <div class="content">
          <p><strong>Marca Consultada:</strong> ${formData.brandName}</p>
          <p><strong>Ramo de Atividade:</strong> ${formData.businessArea}</p>
          <p><strong>Data da Consulta:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
          
          <div class="result-box ${formData.viabilityResult.level}">
            <h3>${formData.viabilityResult.title}</h3>
            <p>${formData.viabilityResult.description}</p>
          </div>
          
          ${formData.viabilityResult.laudo ? `<div style="margin-top: 20px;">${formData.viabilityResult.laudo}</div>` : ''}
        </div>
        <div class="footer">
          <p>WebMarcas Brasil - Especialistas em Registro de Marcas</p>
          <p>Este laudo tem caráter informativo e não substitui consulta jurídica especializada.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getResultIcon = () => {
    if (!formData.viabilityResult) return null;
    switch (formData.viabilityResult.level) {
      case 'high':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'medium':
        return <AlertTriangle className="w-16 h-16 text-amber-500" />;
      case 'low':
      case 'blocked':
        return <XCircle className="w-16 h-16 text-red-500" />;
    }
  };

  const getResultStyles = () => {
    if (!formData.viabilityResult) return '';
    switch (formData.viabilityResult.level) {
      case 'high':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'medium':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'low':
      case 'blocked':
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const handleContinueToRegistration = () => {
    // Salvar dados para o registro
    sessionStorage.setItem('checkoutFormData', JSON.stringify(formData));
    setCurrentStep('personal');
  };

  const handleFinish = () => {
    // Salvar dados e redirecionar para status
    sessionStorage.setItem('checkoutFormData', JSON.stringify(formData));
    navigate('/status-pedido');
  };

  // Renderização condicional baseada no step atual
  const renderStep = () => {
    switch (currentStep) {
      case 'viability':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Consulta de Viabilidade</h2>
              <p className="text-slate-500 text-sm mt-1">Verifique se sua marca pode ser registrada</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="brandName" className="text-slate-700 font-medium">
                  Nome da Marca *
                </Label>
                <Input
                  id="brandName"
                  placeholder="Ex: WebMarcas"
                  value={formData.brandName}
                  onChange={(e) => updateField('brandName', e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="businessArea" className="text-slate-700 font-medium">
                  Ramo de Atividade *
                </Label>
                <Input
                  id="businessArea"
                  placeholder="Ex: Serviços Jurídicos"
                  value={formData.businessArea}
                  onChange={(e) => updateField('businessArea', e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleViabilitySearch}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Consultando INPI...
                </>
              ) : (
                <>
                  Gerar Laudo Técnico
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-slate-400">
              Busca gratuita no banco de dados do INPI
            </p>
          </div>
        );

      case 'result':
        return (
          <div className="space-y-6">
            {/* Resultado */}
            <div className={cn(
              "p-6 rounded-xl border-2 text-center",
              getResultStyles()
            )}>
              <div className="flex justify-center mb-4">
                {getResultIcon()}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {formData.viabilityResult?.title}
              </h3>
              <p className="text-sm opacity-90">
                {formData.viabilityResult?.description}
              </p>
            </div>

            {/* Detalhes do laudo */}
            {formData.viabilityResult?.laudo && (
              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 max-h-48 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: formData.viabilityResult.laudo.replace(/\n/g, '<br/>') }} />
              </div>
            )}

            {/* Aviso */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Importante:</strong> O dono da marca é quem registra primeiro. 
                Mesmo com alta viabilidade, a situação pode mudar se outra pessoa protocolar antes.
              </p>
            </div>

            {/* Ações */}
            <div className="space-y-3">
              {formData.viabilityResult?.level !== 'blocked' && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleContinueToRegistration}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Registrar minha marca agora
                </Button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrintLaudo}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Laudo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, viabilityResult: null }));
                    setCurrentStep('viability');
                  }}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Nova Consulta
                </Button>
              </div>
            </div>
          </div>
        );

      case 'personal':
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Seus Dados</h2>
              <p className="text-slate-500 text-sm">Informações do titular do registro</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  placeholder="Seu nome completo"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cpfCnpj">CPF ou CNPJ *</Label>
                <Input
                  id="cpfCnpj"
                  placeholder="000.000.000-00"
                  value={formData.cpfCnpj}
                  onChange={(e) => updateField('cpfCnpj', e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    placeholder="00000-000"
                    value={formData.zipCode}
                    onChange={(e) => updateField('zipCode', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Sua cidade"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, complemento"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('result')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={() => setCurrentStep('brand')}
                disabled={!formData.fullName || !formData.email || !formData.cpfCnpj}
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'brand':
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Dados da Marca</h2>
              <p className="text-slate-500 text-sm">Informações adicionais sobre a marca</p>
            </div>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-slate-600">
                <strong>Marca a registrar:</strong> {formData.brandName}
              </p>
              <p className="text-sm text-slate-600">
                <strong>Ramo:</strong> {formData.businessArea}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="brandDescription">Descrição da marca (opcional)</Label>
                <Input
                  id="brandDescription"
                  placeholder="Descreva brevemente sua marca"
                  value={formData.brandDescription}
                  onChange={(e) => updateField('brandDescription', e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="companyName">Razão Social (se empresa)</Label>
                <Input
                  id="companyName"
                  placeholder="Nome da empresa"
                  value={formData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="companyCnpj">CNPJ da empresa (se diferente)</Label>
                <Input
                  id="companyCnpj"
                  placeholder="00.000.000/0001-00"
                  value={formData.companyCnpj}
                  onChange={(e) => updateField('companyCnpj', e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('personal')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={() => setCurrentStep('payment')}
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Forma de Pagamento</h2>
              <p className="text-slate-500 text-sm">Escolha como deseja pagar</p>
            </div>

            <div className="space-y-3">
              {/* PIX */}
              <button
                type="button"
                onClick={() => updateField('paymentMethod', 'pix')}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  formData.paymentMethod === 'pix'
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    formData.paymentMethod === 'pix' ? "bg-primary/20" : "bg-slate-100"
                  )}>
                    <Banknote className={cn(
                      "w-6 h-6",
                      formData.paymentMethod === 'pix' ? "text-primary" : "text-slate-500"
                    )} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">PIX à Vista</p>
                    <p className="text-sm text-slate-500">Desconto especial</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">R$ 699</p>
                    <p className="text-xs text-green-600">5% de desconto</p>
                  </div>
                </div>
              </button>

              {/* Cartão */}
              <button
                type="button"
                onClick={() => updateField('paymentMethod', 'card')}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  formData.paymentMethod === 'card'
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    formData.paymentMethod === 'card' ? "bg-primary/20" : "bg-slate-100"
                  )}>
                    <CreditCard className={cn(
                      "w-6 h-6",
                      formData.paymentMethod === 'card' ? "text-primary" : "text-slate-500"
                    )} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">Cartão de Crédito</p>
                    <p className="text-sm text-slate-500">Parcelado sem juros</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-800">6x R$ 199</p>
                    <p className="text-xs text-slate-500">Total: R$ 1.194</p>
                  </div>
                </div>
              </button>

              {/* Boleto */}
              <button
                type="button"
                onClick={() => updateField('paymentMethod', 'boleto')}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  formData.paymentMethod === 'boleto'
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    formData.paymentMethod === 'boleto' ? "bg-primary/20" : "bg-slate-100"
                  )}>
                    <Receipt className={cn(
                      "w-6 h-6",
                      formData.paymentMethod === 'boleto' ? "text-primary" : "text-slate-500"
                    )} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">Boleto Parcelado</p>
                    <p className="text-sm text-slate-500">3 boletos mensais</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-800">3x R$ 399</p>
                    <p className="text-xs text-slate-500">Total: R$ 1.197</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('brand')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={() => setCurrentStep('contract')}
                disabled={!formData.paymentMethod}
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'contract':
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Contrato Digital</h2>
              <p className="text-slate-500 text-sm">Revise e aceite os termos</p>
            </div>

            {/* Resumo */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Marca:</span>
                <span className="font-medium">{formData.brandName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Titular:</span>
                <span className="font-medium">{formData.fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Pagamento:</span>
                <span className="font-medium">
                  {formData.paymentMethod === 'pix' && 'PIX à Vista - R$ 699'}
                  {formData.paymentMethod === 'card' && 'Cartão 6x R$ 199'}
                  {formData.paymentMethod === 'boleto' && 'Boleto 3x R$ 399'}
                </span>
              </div>
            </div>

            {/* Termos */}
            <div className="max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg p-4 text-xs text-slate-600">
              <h4 className="font-semibold mb-2">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h4>
              <p className="mb-2">
                Pelo presente instrumento particular, as partes acima qualificadas têm entre si, justo e contratado, 
                o que segue: A CONTRATADA compromete-se a prestar os serviços de registro de marca junto ao 
                Instituto Nacional da Propriedade Industrial (INPI), incluindo busca prévia de viabilidade, 
                preparo da documentação, protocolo do pedido e acompanhamento do processo até decisão final.
              </p>
              <p className="mb-2">
                O CONTRATANTE compromete-se a fornecer todas as informações e documentos necessários, bem como 
                efetuar o pagamento nas condições acordadas. As taxas oficiais do INPI (GRU) serão cobradas à 
                parte conforme tabela vigente do órgão.
              </p>
              <p>
                Este contrato é regido pelas leis brasileiras e tem validade jurídica conforme Lei 14.063/2020.
              </p>
            </div>

            {/* Aceite */}
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
              <Checkbox
                id="terms"
                checked={formData.acceptedTerms}
                onCheckedChange={(checked) => updateField('acceptedTerms', !!checked)}
              />
              <label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer">
                Li e aceito os termos do contrato de prestação de serviços e a política de privacidade da WebMarcas Brasil.
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('payment')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={handleFinish}
                disabled={!formData.acceptedTerms}
              >
                <FileText className="w-4 h-4 mr-2" />
                Finalizar e Pagar
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch (currentStep) {
      case 'viability':
      case 'result':
        return 'Consulte a viabilidade da sua marca';
      case 'personal':
      case 'brand':
      case 'payment':
      case 'contract':
        return 'Registro de Marca';
      default:
        return '';
    }
  };

  return (
    <CheckoutLayout
      badge={currentStep === 'viability' ? '✓ Busca Gratuita' : undefined}
      title={getPageTitle()}
      subtitle={currentStep === 'viability' ? 'Verifique se sua marca pode ser registrada no INPI' : undefined}
    >
      {currentStep !== 'viability' && currentStep !== 'result' && (
        <StepProgress
          currentStep={getStepNumber(currentStep)}
          totalSteps={6}
          labels={stepLabels}
        />
      )}
      
      {renderStep()}
    </CheckoutLayout>
  );
};

export default Checkout;
