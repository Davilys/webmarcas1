import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, AlertTriangle, ArrowRight, MessageCircle, ShieldX, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import webmarcasLogo from "@/assets/webmarcas-logo.png";
import webmarcasIcon from "@/assets/webmarcas-icon.png";

type ViabilityLevel = "high" | "medium" | "low" | "blocked" | null;

interface ViabilityData {
  brandName: string;
  businessArea: string;
  level: ViabilityLevel;
  title: string;
  description: string;
  laudo: string;
}

const ResultadoViabilidade = () => {
  const [data, setData] = useState<ViabilityData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedData = sessionStorage.getItem('viabilityResult');
    if (storedData) {
      setData(JSON.parse(storedData));
    }
  }, []);

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
    if (!data) return;
    
    const currentDate = new Date().toLocaleString('pt-BR');
    const viabilityText = getViabilityText(data.level);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

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
          .footer .disclaimer { margin-top: 15px; padding: 10px; background: #fef3c7; border-radius: 6px; color: #92400e; font-style: italic; }
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
        <div class="title">📋 Laudo Técnico de Viabilidade de Marca</div>
        <div class="info-section">
          <h3>Dados da Consulta</h3>
          <div class="info-grid">
            <div class="info-item"><label>Nome da Marca</label><span>${data.brandName}</span></div>
            <div class="info-item"><label>Ramo de Atividade</label><span>${data.businessArea}</span></div>
          </div>
        </div>
        <div class="info-section">
          <h3>Resultado da Análise</h3>
          <div class="result-box result-${data.level || 'low'}">${viabilityText}</div>
        </div>
        <div class="info-section">
          <h3>Parecer Técnico Completo</h3>
          <div class="laudo-content">${data.laudo || data.description || 'Análise não disponível'}</div>
        </div>
        <div class="footer">
          <p>Documento gerado automaticamente pelo sistema WebMarcas</p>
          <p class="site">www.webmarcas.net</p>
          <p>Data e hora da geração: ${currentDate}</p>
          <div class="disclaimer">⚠️ Este laudo tem caráter técnico-informativo e não substitui análise jurídica completa.</div>
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
    if (!data) return;
    sessionStorage.setItem('viabilityData', JSON.stringify({
      brandName: data.brandName,
      businessArea: data.businessArea,
      level: data.level,
    }));
    navigate('/registro');
  };

  const handleNewSearch = () => {
    window.close();
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

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Nenhum resultado encontrado.</p>
          <Button variant="hero" onClick={() => window.close()}>Fechar</Button>
        </div>
      </div>
    );
  }

  const styles = getResultStyles(data.level);
  const Icon = styles.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" target="_blank" className="flex items-center gap-2">
            <img src={webmarcasLogo} alt="WebMarcas" className="h-10" />
          </a>
          <span className="badge-premium">Busca Gratuita</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
            Consulte a viabilidade da sua <span className="gradient-text">marca</span>
          </h1>
          <p className="text-muted-foreground">
            Verifique gratuitamente se sua marca pode ser registrada no INPI.
          </p>
        </div>

        <div className="glass-card p-6 md:p-8">
          {/* Result Header */}
          <div className={`rounded-xl border p-6 mb-6 ${styles.bgClass}`}>
            <div className="flex items-center gap-3 mb-3">
              <Icon className={`w-6 h-6 ${styles.iconClass}`} />
              <h3 className={`font-display text-xl font-bold ${styles.textClass}`}>
                {data.title}
              </h3>
            </div>
            <p className="text-muted-foreground">{data.description}</p>
          </div>

          {/* Laudo Completo */}
          {data.laudo && (
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
                  {data.laudo}
                </pre>
              </div>
            </div>
          )}

          {/* Warning */}
          {data.level !== 'blocked' && (
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
            {data.level !== 'blocked' && (
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
                href={`https://wa.me/5511999999999?text=${encodeURIComponent(`Olá! Acabei de consultar a viabilidade da marca "${data.brandName}" no ramo de "${data.businessArea}" e gostaria de falar com um especialista.`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-5 h-5" />
                Falar com especialista
              </a>
            </Button>
            <button
              onClick={handleNewSearch}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Fazer nova consulta
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResultadoViabilidade;
