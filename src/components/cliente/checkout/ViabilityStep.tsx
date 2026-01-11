import { useState } from "react";
import { Search, CheckCircle, AlertTriangle, AlertCircle, ShieldX, Printer, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkViability, type ViabilityResult } from "@/lib/api/viability";
import { toast } from "sonner";

interface ViabilityStepProps {
  onNext: (brandName: string, businessArea: string, result: ViabilityResult) => void;
}

export function ViabilityStep({ onNext }: ViabilityStepProps) {
  const [brandName, setBrandName] = useState("");
  const [businessArea, setBusinessArea] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<ViabilityResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brandName.trim() || !businessArea.trim()) {
      toast.error("Por favor, preencha o nome da marca e o ramo de atividade.");
      return;
    }

    setIsSearching(true);

    try {
      const viabilityResult = await checkViability(brandName.trim(), businessArea.trim());
      setResult(viabilityResult);
    } catch (error) {
      console.error('Error checking viability:', error);
      toast.error("Não foi possível realizar a consulta. Tente novamente.");
    } finally {
      setIsSearching(false);
    }
  };

  const resetSearch = () => {
    setResult(null);
    setBrandName("");
    setBusinessArea("");
  };

  const getResultStyles = (level: string | null) => {
    switch (level) {
      case "high":
        return {
          icon: CheckCircle,
          bgClass: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
          iconClass: "text-emerald-500",
          textClass: "text-emerald-700 dark:text-emerald-400",
          label: "Viável"
        };
      case "medium":
        return {
          icon: AlertTriangle,
          bgClass: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
          iconClass: "text-amber-500",
          textClass: "text-amber-700 dark:text-amber-400",
          label: "Viável com ressalvas"
        };
      case "low":
        return {
          icon: AlertCircle,
          bgClass: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
          iconClass: "text-red-500",
          textClass: "text-red-700 dark:text-red-400",
          label: "Baixa viabilidade"
        };
      case "blocked":
        return {
          icon: ShieldX,
          bgClass: "bg-red-100 dark:bg-red-950/50 border-red-300 dark:border-red-700",
          iconClass: "text-red-600",
          textClass: "text-red-800 dark:text-red-300",
          label: "Inviável"
        };
      default:
        return {
          icon: Search,
          bgClass: "",
          iconClass: "",
          textClass: "",
          label: ""
        };
    }
  };

  const printLaudo = () => {
    if (!result) return;

    const isBlocked = result.level === 'blocked';
    const styles = getResultStyles(result.level);
    const resultBgColor = isBlocked ? '#fef2f2' : '#dcfce7';
    const resultBorderColor = isBlocked ? '#fecaca' : '#bbf7d0';
    const resultTextColor = isBlocked ? '#dc2626' : '#16a34a';
    const resultIcon = isBlocked ? '❌' : '✅';

    // Formatar o laudo para exibição HTML
    const laudoFormatted = result.laudo
      ?.replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/✅/g, '<span style="color: #16a34a;">✅</span>')
      .replace(/❌/g, '<span style="color: #dc2626;">❌</span>')
      .replace(/⚠️/g, '<span style="color: #f59e0b;">⚠️</span>')
      .replace(/\n/g, '<br>') || '';

    const printContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Laudo Técnico de Viabilidade - WebMarcas</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page {
            size: A4;
            margin: 15mm;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1f2937;
            background: white;
          }
          
          .page {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
          }
          
          .logo {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          
          .header-text {
            display: flex;
            flex-direction: column;
          }
          
          .header-title {
            font-size: 20px;
            font-weight: bold;
            color: #0ea5e9;
          }
          
          .header-subtitle {
            font-size: 12px;
            color: #64748b;
          }
          
          .header-line {
            height: 3px;
            background: linear-gradient(to right, #0ea5e9, #38bdf8);
            margin: 12px 0 20px 0;
            border-radius: 2px;
          }
          
          .title-box {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 14px 20px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .title-box-icon {
            font-size: 20px;
          }
          
          .title-box-text {
            font-size: 16px;
            font-weight: 600;
            color: #0369a1;
          }
          
          .section-title {
            font-size: 13px;
            font-weight: 700;
            color: #0ea5e9;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            margin-top: 24px;
          }
          
          .section-title:first-of-type {
            margin-top: 0;
          }
          
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          
          .data-table th {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px 14px;
            text-align: left;
            font-weight: 600;
            color: #475569;
            font-size: 11px;
          }
          
          .data-table td {
            border: 1px solid #e2e8f0;
            padding: 12px 14px;
            font-size: 13px;
            font-weight: 500;
          }
          
          .data-table tr td:first-child {
            border-left: 4px solid #0ea5e9;
          }
          
          .result-box {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            margin-bottom: 8px;
          }
          
          .laudo-content {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-top: 12px;
            line-height: 1.7;
          }
          
          .laudo-content strong {
            color: #1e40af;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
          }
          
          .footer-text {
            font-size: 10px;
            color: #64748b;
            margin-bottom: 4px;
          }
          
          .footer-link {
            font-size: 11px;
            color: #0ea5e9;
            font-weight: 600;
          }
          
          .footer-warning {
            background: #fef9c3;
            border: 1px solid #fde047;
            border-radius: 6px;
            padding: 10px 16px;
            margin-top: 16px;
            font-size: 10px;
            color: #854d0e;
            font-style: italic;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .page {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header -->
          <div class="header">
            <div class="logo">WM</div>
            <div class="header-text">
              <span class="header-title">WebMarcas</span>
              <span class="header-subtitle">Registro de Marcas</span>
            </div>
          </div>
          <div class="header-line"></div>
          
          <!-- Title Box -->
          <div class="title-box">
            <span class="title-box-icon">📋</span>
            <span class="title-box-text">Laudo Técnico de Viabilidade de Marca</span>
          </div>
          
          <!-- Dados da Consulta -->
          <div class="section-title">Dados da Consulta</div>
          <table class="data-table">
            <tr>
              <th>Nome da Marca</th>
              <th>Ramo de Atividade</th>
            </tr>
            <tr>
              <td>${result.brandName || brandName.toUpperCase()}</td>
              <td>${result.businessArea || businessArea}</td>
            </tr>
          </table>
          
          <!-- Resultado -->
          <div class="section-title">Resultado da Análise</div>
          <div class="result-box" style="background: ${resultBgColor}; border: 1px solid ${resultBorderColor}; color: ${resultTextColor};">
            <span>${resultIcon}</span>
            <span>${styles.label}</span>
          </div>
          
          <!-- Parecer Técnico -->
          <div class="section-title">Parecer Técnico Completo</div>
          <div class="laudo-content">
            ${laudoFormatted}
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div class="footer-text">Documento gerado automaticamente pelo sistema WebMarcas</div>
            <div class="footer-link">www.webmarcas.net</div>
            <div class="footer-text">Data e hora da geração: ${result.searchDate || new Date().toLocaleString('pt-BR')}</div>
            
            <div class="footer-warning">
              <span>⚠️</span>
              <span>Este laudo tem caráter técnico-informativo e não substitui análise jurídica completa.</span>
            </div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      toast.error("Não foi possível abrir a janela de impressão.");
    }
  };

  if (!result) {
    return (
      <form onSubmit={handleSearch} className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Consulta de Viabilidade</h2>
          <p className="text-muted-foreground">
            Verifique se sua marca pode ser registrada antes de prosseguir.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brandName">Nome da Marca *</Label>
            <Input
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Ex: WebMarcas"
              disabled={isSearching}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessArea">Ramo de Atividade *</Label>
            <Input
              id="businessArea"
              value={businessArea}
              onChange={(e) => setBusinessArea(e.target.value)}
              placeholder="Ex: Músico, Restaurante, Tecnologia..."
              disabled={isSearching}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSearching}>
          {isSearching ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
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
    );
  }

  const styles = getResultStyles(result.level);
  const Icon = styles.icon;

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
          📋 Resultado da análise de viabilidade
        </span>
      </div>

      {/* Result Card */}
      <Card className={`border ${styles.bgClass}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Icon className={`w-6 h-6 ${styles.iconClass}`} />
            <div>
              <h3 className={`text-lg font-bold ${styles.textClass}`}>
                {styles.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                Marca: {result.brandName || brandName.toUpperCase()}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground">{result.description}</p>
        </CardContent>
      </Card>

      {/* Classes Recomendadas */}
      {result.classes && result.classes.length > 0 && result.level !== 'blocked' && (
        <div>
          <h4 className="font-semibold mb-3">Classes Recomendadas</h4>
          <div className="space-y-2">
            {result.classes.map((classDesc, index) => (
              <div key={index} className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {classDesc}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Laudo Completo */}
      {result.laudo && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Laudo Técnico de Viabilidade</h4>
            <Button variant="ghost" size="sm" onClick={printLaudo}>
              <Printer className="w-4 h-4 mr-1" />
              Imprimir
            </Button>
          </div>
          <div className="bg-muted rounded-xl p-4 max-h-60 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed">
              {result.laudo}
            </pre>
          </div>
        </div>
      )}

      {/* Warning */}
      {result.level !== 'blocked' && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>⚠️ Importante:</strong> O dono da marca é quem registra primeiro.
              A situação pode mudar se outra pessoa protocolar antes de você.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {result.level !== 'blocked' && (
          <Button
            className="w-full"
            size="lg"
            onClick={() => onNext(brandName, businessArea, result)}
          >
            🚀 Continuar Registro
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
        
        <Button variant="outline" className="w-full" onClick={printLaudo}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimir Laudo Completo
        </Button>
        
        <Button variant="ghost" className="w-full" onClick={resetSearch}>
          Fazer nova consulta
        </Button>
      </div>

      {result.level === 'blocked' && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <p className="text-sm text-red-700 dark:text-red-400">
              <strong>⛔ Atenção:</strong> Esta marca não pode ser registrada pois corresponde a uma marca de alto renome já protegida. 
              Por favor, escolha outro nome para sua marca.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
