import { useState, useRef } from "react";
import { Search, AlertCircle, CheckCircle, AlertTriangle, ArrowRight, MessageCircle, ShieldX, Printer, ExternalLink, Upload, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import webmarcasIcon from "@/assets/webmarcas-icon.png";
import { supabase } from "@/integrations/supabase/client";

type ViabilityLevel = "high" | "medium" | "low" | "blocked" | null;

interface ViabilityResult {
  success: boolean;
  isFamousBrand?: boolean;
  level: ViabilityLevel;
  title: string;
  description: string;
  laudo?: string;
  classes?: number[];
  classDescriptions?: string[];
  searchDate?: string;
  isOfficialDocument?: boolean;
}

type Step = 'form' | 'instructions' | 'upload' | 'processing' | 'result';

const ViabilitySearchSection = () => {
  const [brandName, setBrandName] = useState("");
  const [businessArea, setBusinessArea] = useState("");
  const [step, setStep] = useState<Step>('form');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ViabilityResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleOpenINPI = () => {
    if (!brandName.trim() || !businessArea.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome da marca e o ramo de atividade.",
        variant: "destructive",
      });
      return;
    }
    
    // Open INPI in new tab
    window.open('https://busca.inpi.gov.br/pePI/', '_blank');
    
    // Move to instructions step
    setStep('instructions');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, envie um PDF ou imagem (PNG, JPG, WEBP).",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setUploadedFile(file);
    }
  };

  const handleProcessDocument = async () => {
    if (!uploadedFile) {
      toast({
        title: "Arquivo obrigatório",
        description: "Por favor, faça upload do documento do INPI.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(uploadedFile);
      });

      // Call edge function to process document
      const { data, error } = await supabase.functions.invoke('process-inpi-document', {
        body: {
          brandName,
          businessArea,
          fileBase64: base64,
          fileType: uploadedFile.type,
          fileName: uploadedFile.name,
        },
      });

      if (error) {
        throw error;
      }

      setResult(data as ViabilityResult);
      setStep('result');
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: "Erro no processamento",
        description: "Não foi possível processar o documento. Tente novamente.",
        variant: "destructive",
      });
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetSearch = () => {
    setResult(null);
    setBrandName("");
    setBusinessArea("");
    setUploadedFile(null);
    setStep('form');
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

  const printLaudo = () => {
    const currentDate = new Date().toLocaleString('pt-BR');
    const viabilityText = getViabilityText(result?.level || null);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir a janela de impressão. Verifique se pop-ups estão habilitados.",
        variant: "destructive",
      });
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Laudo Técnico de Viabilidade - WebMarcas</title>
        <style>
          @page { size: A4; margin: 20mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a1a2e; background: white; padding: 40px; }
          .header { display: flex; align-items: center; gap: 20px; border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { width: 80px; height: 80px; }
          .company-info h1 { font-size: 28px; color: #0ea5e9; margin-bottom: 5px; }
          .company-info p { color: #64748b; font-size: 14px; }
          .official-badge { background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; margin-bottom: 20px; }
          .title { text-align: center; font-size: 24px; color: #1a1a2e; margin-bottom: 30px; padding: 15px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; border-left: 4px solid #0ea5e9; }
          .info-section { margin-bottom: 25px; }
          .info-section h3 { font-size: 16px; color: #0ea5e9; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { background: #f8fafc; padding: 12px 16px; border-radius: 6px; border-left: 3px solid #0ea5e9; }
          .info-item label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
          .info-item span { font-size: 16px; font-weight: 600; color: #1a1a2e; }
          .result-box { padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center; font-size: 20px; font-weight: bold; }
          .result-high { background: #dcfce7; color: #166534; border: 2px solid #22c55e; }
          .result-medium { background: #fef9c3; color: #854d0e; border: 2px solid #eab308; }
          .result-low, .result-blocked { background: #fee2e2; color: #991b1b; border: 2px solid #ef4444; }
          .laudo-content { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 25px; white-space: pre-wrap; font-size: 14px; line-height: 1.8; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
          .footer p { margin-bottom: 5px; }
          .footer .site { color: #0ea5e9; font-weight: 600; }
          .footer .disclaimer { margin-top: 15px; padding: 10px; background: #dcfce7; border-radius: 6px; color: #166534; font-style: italic; }
          @media print { body { padding: 0; } }
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
        <div class="official-badge">📋 LAUDO BASEADO EM DOCUMENTO OFICIAL DO INPI</div>
        <div class="title">📋 Laudo Técnico de Viabilidade de Marca</div>
        <div class="info-section">
          <h3>Dados da Consulta</h3>
          <div class="info-grid">
            <div class="info-item"><label>Nome da Marca</label><span>${brandName}</span></div>
            <div class="info-item"><label>Ramo de Atividade</label><span>${businessArea}</span></div>
          </div>
        </div>
        <div class="info-section">
          <h3>Resultado da Análise</h3>
          <div class="result-box result-${result?.level || 'low'}">${viabilityText}</div>
        </div>
        <div class="info-section">
          <h3>Parecer Técnico Completo</h3>
          <div class="laudo-content">${result?.laudo || result?.description || 'Análise não disponível'}</div>
        </div>
        <div class="footer">
          <p>Documento gerado automaticamente pelo sistema WebMarcas</p>
          <p class="site">www.webmarcas.net</p>
          <p>Data e hora da geração: ${currentDate}</p>
          <div class="disclaimer">✅ Pesquisa realizada com base em documento oficial do INPI anexado pelo cliente.</div>
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

  const handleRegisterClick = () => {
    sessionStorage.setItem('viabilityData', JSON.stringify({
      brandName,
      businessArea,
      level: result?.level,
    }));
    navigate('/registro');
  };

  const getResultStyles = (level: ViabilityLevel) => {
    switch (level) {
      case "high":
        return {
          icon: CheckCircle,
          bgClass: "bg-accent/10 border-accent/30",
          iconClass: "text-accent",
          textClass: "text-accent",
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
          bgClass: "bg-destructive/10 border-destructive/30",
          iconClass: "text-destructive",
          textClass: "text-destructive",
        };
      case "blocked":
        return {
          icon: ShieldX,
          bgClass: "bg-destructive/20 border-destructive/50",
          iconClass: "text-destructive",
          textClass: "text-destructive",
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

  // STEP 1: Initial Form
  const renderForm = () => (
    <div className="glass-card p-8">
      <div className="space-y-6">
        <div>
          <label htmlFor="brandName" className="block text-sm font-medium mb-2">
            Nome da Marca
          </label>
          <input
            id="brandName"
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Ex: WebMarcas"
            className="input-styled"
          />
        </div>

        <div>
          <label htmlFor="businessArea" className="block text-sm font-medium mb-2">
            Ramo de Atividade
          </label>
          <input
            id="businessArea"
            type="text"
            value={businessArea}
            onChange={(e) => setBusinessArea(e.target.value)}
            placeholder="Ex: Serviços Jurídicos"
            className="input-styled"
          />
        </div>

        <Button
          type="button"
          variant="hero"
          size="lg"
          className="w-full"
          onClick={handleOpenINPI}
        >
          <ExternalLink className="w-5 h-5" />
          Buscar no INPI (oficial)
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Abrirá o site oficial do INPI em nova aba
        </p>
      </div>
    </div>
  );

  // STEP 2: Instructions
  const renderInstructions = () => (
    <div className="glass-card p-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLink className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display text-xl font-bold mb-2">
          Siga os passos no site do INPI
        </h3>
        <p className="text-muted-foreground text-sm">
          O site do INPI foi aberto em outra aba. Siga as instruções abaixo:
        </p>
      </div>

      <div className="bg-secondary/50 rounded-xl p-6 mb-6">
        <ol className="space-y-4 text-sm">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>Clique em <strong>"Continuar sem login"</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span>Clique no ícone <strong>"R" – Marca</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>Selecione <strong>Pesquisa por Nome</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <span>Tipo de busca: <strong>EXATA</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">5</span>
            <span>Informe o nome: <strong className="text-primary">{brandName}</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">6</span>
            <span>Clique em <strong>Pesquisar</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">7</span>
            <span><strong>Baixe o PDF</strong> ou tire um <strong>print da tela</strong> com o resultado</span>
          </li>
        </ol>
      </div>

      <div className="space-y-3">
        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={() => setStep('upload')}
        >
          <Upload className="w-5 h-5" />
          Já tenho o resultado, fazer upload
        </Button>
        
        <Button
          variant="hero-outline"
          size="lg"
          className="w-full"
          onClick={() => window.open('https://busca.inpi.gov.br/pePI/', '_blank')}
        >
          <ExternalLink className="w-5 h-5" />
          Abrir site do INPI novamente
        </Button>

        <button
          onClick={resetSearch}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );

  // STEP 3: Upload
  const renderUpload = () => (
    <div className="glass-card p-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display text-xl font-bold mb-2">
          Upload do Resultado do INPI
        </h3>
        <p className="text-muted-foreground text-sm">
          Envie o PDF ou print da tela com o resultado da pesquisa
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
      />

      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          uploadedFile 
            ? 'border-accent bg-accent/5' 
            : 'border-muted-foreground/30 hover:border-primary hover:bg-primary/5'
        }`}
      >
        {uploadedFile ? (
          <div className="flex items-center justify-center gap-3">
            {uploadedFile.type === 'application/pdf' ? (
              <FileText className="w-10 h-10 text-accent" />
            ) : (
              <ImageIcon className="w-10 h-10 text-accent" />
            )}
            <div className="text-left">
              <p className="font-medium text-foreground">{uploadedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">Clique para selecionar</p>
            <p className="text-sm text-muted-foreground">PDF ou imagem (PNG, JPG, WEBP)</p>
          </>
        )}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-4 mb-6">
        <p className="text-sm text-muted-foreground">
          <strong className="text-primary">📋 Importante:</strong> Este documento será usado como base oficial do laudo de viabilidade.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={handleProcessDocument}
          disabled={!uploadedFile}
        >
          <Search className="w-5 h-5" />
          Gerar Laudo de Viabilidade
        </Button>

        <button
          onClick={() => setStep('instructions')}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Voltar às instruções
        </button>
      </div>
    </div>
  );

  // STEP 4: Processing
  const renderProcessing = () => (
    <div className="glass-card p-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <h3 className="font-display text-xl font-bold mb-2">
          Processando documento...
        </h3>
        <p className="text-muted-foreground mb-6">
          Estamos analisando o documento do INPI e gerando seu laudo oficial.
        </p>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>✅ Extraindo dados do documento</p>
          <p>✅ Verificando resultado da pesquisa</p>
          <p className="animate-pulse">🔍 Gerando laudo técnico...</p>
        </div>
      </div>
    </div>
  );

  // STEP 5: Result
  const renderResult = () => {
    if (!result) return null;

    const styles = getResultStyles(result.level);
    const Icon = styles.icon;

    return (
      <div className="glass-card p-8">
        {/* Official Badge */}
        <div className="flex justify-center mb-4">
          <span className="bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium">
            📋 Laudo baseado em documento oficial do INPI
          </span>
        </div>

        {/* Result Header */}
        <div className={`rounded-xl border p-6 mb-6 ${styles.bgClass}`}>
          <div className="flex items-center gap-3 mb-3">
            <Icon className={`w-6 h-6 ${styles.iconClass}`} />
            <h3 className={`font-display text-xl font-bold ${styles.textClass}`}>
              {result.title}
            </h3>
          </div>
          <p className="text-muted-foreground">{result.description}</p>
        </div>

        {/* Laudo Completo */}
        {result.laudo && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display font-semibold text-lg">Laudo Técnico de Viabilidade</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={printLaudo}
                className="text-muted-foreground hover:text-foreground"
              >
                <Printer className="w-4 h-4 mr-1" />
                Imprimir / Salvar Laudo
              </Button>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 max-h-80 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed">
                {result.laudo}
              </pre>
            </div>
          </div>
        )}

        {/* Warning */}
        {result.level !== 'blocked' && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              <strong className="text-primary">⚠️ Importante:</strong> O dono da marca é quem 
              registra primeiro. Mesmo com alta viabilidade, a situação pode mudar a qualquer 
              momento se outra pessoa protocolar antes de você.
            </p>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-3">
          {result.level !== 'blocked' && (
            <Button
              variant="hero"
              size="lg"
              className="w-full group"
              onClick={handleRegisterClick}
            >
              🚀 Registrar minha marca agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
          <Button
            variant="hero-outline"
            size="lg"
            className="w-full"
            asChild
          >
            <a
              href={`https://wa.me/5511999999999?text=${encodeURIComponent(`Olá! Acabei de consultar a viabilidade da marca "${brandName}" no ramo de "${businessArea}" e gostaria de falar com um especialista.`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-5 h-5" />
              Falar com especialista
            </a>
          </Button>
          <button
            onClick={resetSearch}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Fazer nova consulta
          </button>
        </div>
      </div>
    );
  };

  return (
    <section id="consultar" className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-gradient opacity-30" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="badge-premium mb-4 inline-flex">Pesquisa Oficial</span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Laudo de Viabilidade{" "}
            <span className="gradient-text">100% Oficial</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Gere seu laudo baseado em documento oficial do INPI. 100% legal, auditável e com credibilidade jurídica real.
          </p>
        </div>

        {/* Content based on step */}
        <div className="max-w-2xl mx-auto">
          {step === 'form' && renderForm()}
          {step === 'instructions' && renderInstructions()}
          {step === 'upload' && renderUpload()}
          {step === 'processing' && renderProcessing()}
          {step === 'result' && renderResult()}
        </div>

        {/* Benefits */}
        {step === 'form' && (
          <div className="max-w-3xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '✅', text: '100% Legal' },
              { icon: '📋', text: '100% Auditável' },
              { icon: '⚖️', text: 'Credibilidade Jurídica' },
              { icon: '🔒', text: 'Sem Risco de Bloqueio' },
            ].map((item, idx) => (
              <div key={idx} className="text-center p-4 bg-secondary/30 rounded-xl">
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ViabilitySearchSection;
