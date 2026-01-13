import { useState } from "react";
import { Search, CheckCircle, AlertTriangle, AlertCircle, ShieldX, Printer, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkViability, type ViabilityResult } from "@/lib/api/viability";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import webmarcasIcon from "@/assets/webmarcas-icon.png";

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

      // Save search to database for social proof notifications
      await supabase.from('viability_searches').insert({
        brand_name: brandName.trim(),
        business_area: businessArea.trim(),
        result_level: viabilityResult.level
      });
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
        };
      case "medium":
        return {
          icon: AlertTriangle,
          bgClass: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
          iconClass: "text-amber-500",
          textClass: "text-amber-700 dark:text-amber-400",
        };
      case "low":
        return {
          icon: AlertCircle,
          bgClass: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
          iconClass: "text-red-500",
          textClass: "text-red-700 dark:text-red-400",
        };
      case "blocked":
        return {
          icon: ShieldX,
          bgClass: "bg-red-100 dark:bg-red-950/50 border-red-300 dark:border-red-700",
          iconClass: "text-red-600",
          textClass: "text-red-800 dark:text-red-300",
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

  const printLaudo = () => {
    const currentDate = new Date().toLocaleString('pt-BR');
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão.");
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
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a2e; padding: 40px; }
          .header { display: flex; align-items: center; gap: 20px; border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { width: 80px; height: 80px; }
          .company-info h1 { font-size: 28px; color: #0ea5e9; margin-bottom: 5px; }
          .title { text-align: center; font-size: 24px; margin-bottom: 30px; padding: 15px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
          .info-item { background: #f8fafc; padding: 12px 16px; border-radius: 6px; border-left: 3px solid #0ea5e9; }
          .info-item label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
          .info-item span { font-size: 16px; font-weight: 600; }
          .result-box { padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center; font-size: 20px; font-weight: bold; }
          .result-high { background: #dcfce7; color: #166534; border: 2px solid #22c55e; }
          .result-medium { background: #fef9c3; color: #854d0e; border: 2px solid #eab308; }
          .result-low, .result-blocked { background: #fee2e2; color: #991b1b; border: 2px solid #ef4444; }
          .laudo-content { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap; }
          .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 12px; }
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
        <div class="info-grid">
          <div class="info-item"><label>Nome da Marca</label><span>${brandName}</span></div>
          <div class="info-item"><label>Ramo de Atividade</label><span>${businessArea}</span></div>
        </div>
        <div class="result-box result-${result?.level || 'low'}">${result?.title || 'Análise'}</div>
        <div class="laudo-content">${result?.laudo || result?.description || 'Análise não disponível'}</div>
        <div class="footer">
          <p>Documento gerado em: ${currentDate}</p>
          <p>www.webmarcas.net</p>
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
              placeholder="Ex: Serviços Jurídicos"
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
          📋 Resultado da pesquisa real no INPI
        </span>
      </div>

      {/* Result Card */}
      <Card className={`border ${styles.bgClass}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Icon className={`w-6 h-6 ${styles.iconClass}`} />
            <h3 className={`text-lg font-bold ${styles.textClass}`}>
              {result.title}
            </h3>
          </div>
          <p className="text-muted-foreground">{result.description}</p>
        </CardContent>
      </Card>

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
        <Button variant="outline" className="w-full" onClick={resetSearch}>
          Fazer nova consulta
        </Button>
      </div>
    </div>
  );
}
