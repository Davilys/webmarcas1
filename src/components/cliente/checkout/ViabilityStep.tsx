import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle, AlertTriangle, AlertCircle, ShieldX, Printer, ArrowRight, Sparkles, Shield, TrendingUp, Zap, Database, Cpu, Globe, Lock, FileSearch, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkViability, type ViabilityResult } from "@/lib/api/viability";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import webmarcasIcon from "@/assets/webmarcas-icon.png";
import { cn } from "@/lib/utils";

interface ViabilityStepProps {
  onNext: (brandName: string, businessArea: string, result: ViabilityResult) => void;
}

// Futuristic Search Animation Component
function INPISearchAnimation({ brandName }: { brandName: string }) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  const phases = [
    { label: "Conectando ao INPI", icon: Globe, detail: "Estabelecendo conexão segura..." },
    { label: "Varrendo base de marcas", icon: Database, detail: "Consultando registros oficiais..." },
    { label: "Analisando similaridades", icon: ScanLine, detail: "Verificando conflitos e colisões..." },
    { label: "Processando com IA jurídica", icon: Cpu, detail: "Gerando laudo especializado..." },
    { label: "Finalizando laudo técnico", icon: FileSearch, detail: "Compilando resultado final..." },
  ];

  useEffect(() => {
    const totalDuration = 3000;
    const phaseInterval = totalDuration / phases.length;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += 60;
      const p = Math.min((elapsed / totalDuration) * 100, 98);
      setProgress(p);
      setCurrentPhase(Math.min(Math.floor(elapsed / phaseInterval), phases.length - 1));
      if (elapsed >= totalDuration) clearInterval(timer);
    }, 60);

    return () => clearInterval(timer);
  }, []);

  const CurrentIcon = phases[currentPhase].icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="py-6 space-y-8"
    >
      {/* Central HUD Ring */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center w-36 h-36">
          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          {/* Middle ring */}
          <motion.div
            className="absolute inset-3 rounded-full border border-primary/50"
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          {/* SVG Progress Arc */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 144 144">
            <circle cx="72" cy="72" r="64" fill="none" stroke="hsl(var(--primary)/0.1)" strokeWidth="4" />
            <motion.circle
              cx="72" cy="72" r="64"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 64}`}
              style={{
                strokeDashoffset: `${2 * Math.PI * 64 * (1 - progress / 100)}`,
                filter: "drop-shadow(0 0 6px hsl(var(--primary)/0.8))"
              }}
            />
          </svg>
          {/* Inner glow pulse */}
          <motion.div
            className="absolute inset-6 rounded-full bg-primary/5"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Center icon */}
          <div className="relative z-10 flex flex-col items-center gap-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhase}
                initial={{ scale: 0.5, opacity: 0, y: 5 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <CurrentIcon className="w-8 h-8 text-primary" />
              </motion.div>
            </AnimatePresence>
            <span className="text-xs font-bold text-primary tabular-nums">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Brand name being searched */}
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Consultando</p>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-sm font-bold text-primary tracking-wider">{brandName.toUpperCase()}</span>
            <Lock className="w-3 h-3 text-primary/60" />
          </div>
        </div>
      </div>

      {/* Phase steps */}
      <div className="space-y-2">
        {phases.map((phase, i) => {
          const PhaseIcon = phase.icon;
          const isDone = i < currentPhase;
          const isActive = i === currentPhase;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: i <= currentPhase ? 1 : 0.3, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-500",
                isActive
                  ? "bg-primary/10 border-primary/30"
                  : isDone
                  ? "bg-muted/30 border-border/30"
                  : "bg-muted/10 border-border/10"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-7 h-7 rounded-lg shrink-0",
                isActive ? "bg-primary/20" : isDone ? "bg-muted/50" : "bg-muted/20"
              )}>
                {isDone ? (
                  <CheckCircle className="w-4 h-4 text-primary" />
                ) : (
                  <PhaseIcon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground/40")} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-xs font-semibold",
                  isActive ? "text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/40"
                )}>
                  {phase.label}
                </p>
                {isActive && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] text-muted-foreground mt-0.5"
                  >
                    {phase.detail}
                  </motion.p>
                )}
              </div>
              {isActive && (
                <motion.div
                  className="flex gap-0.5 shrink-0"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  {[0, 1, 2].map(j => (
                    <motion.div
                      key={j}
                      className="w-1 h-1 rounded-full bg-primary"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: j * 0.15 }}
                    />
                  ))}
                </motion.div>
              )}
              {isDone && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 shrink-0">
                  <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Bottom security badge */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <Lock className="w-3 h-3 text-muted-foreground/50" />
        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
          Conexão criptografada • Base oficial INPI
        </p>
      </div>
    </motion.div>
  );
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
      await supabase.from('viability_searches').insert({
        brand_name: brandName.trim(),
        business_area: businessArea.trim(),
        result_level: viabilityResult.level
      });
    } catch (error) {
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

  const getResultConfig = (level: string) => {
    switch (level) {
      case "high":
        return {
          icon: CheckCircle,
          gradient: "from-emerald-500/10 to-emerald-600/5",
          border: "border-emerald-500/30",
          iconColor: "text-emerald-500",
          badgeBg: "bg-emerald-500/10",
          badgeText: "text-emerald-600 dark:text-emerald-400",
          badgeLabel: "ALTA VIABILIDADE",
          glow: "shadow-emerald-500/10",
        };
      case "medium":
        return {
          icon: AlertTriangle,
          gradient: "from-amber-500/10 to-amber-600/5",
          border: "border-amber-500/30",
          iconColor: "text-amber-500",
          badgeBg: "bg-amber-500/10",
          badgeText: "text-amber-600 dark:text-amber-400",
          badgeLabel: "VIABILIDADE MÉDIA",
          glow: "shadow-amber-500/10",
        };
      case "low":
        return {
          icon: AlertCircle,
          gradient: "from-red-500/10 to-red-600/5",
          border: "border-red-500/30",
          iconColor: "text-red-500",
          badgeBg: "bg-red-500/10",
          badgeText: "text-red-600 dark:text-red-400",
          badgeLabel: "BAIXA VIABILIDADE",
          glow: "shadow-red-500/10",
        };
      case "blocked":
        return {
          icon: ShieldX,
          gradient: "from-red-600/15 to-red-700/10",
          border: "border-red-600/40",
          iconColor: "text-red-600",
          badgeBg: "bg-red-600/10",
          badgeText: "text-red-700 dark:text-red-300",
          badgeLabel: "MARCA BLOQUEADA",
          glow: "shadow-red-600/10",
        };
      default:
        return { icon: Search, gradient: "", border: "", iconColor: "", badgeBg: "", badgeText: "", badgeLabel: "", glow: "" };
    }
  };

  const printLaudo = () => {
    const currentDate = new Date().toLocaleString('pt-BR');
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error("Não foi possível abrir a janela de impressão."); return; }
    printWindow.document.write(`
      <!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Laudo Técnico de Viabilidade - WebMarcas</title>
      <style>@page{size:A4;margin:20mm}body{font-family:'Segoe UI',sans-serif;line-height:1.6;color:#1a1a2e;padding:40px}.header{display:flex;align-items:center;gap:20px;border-bottom:3px solid #0ea5e9;padding-bottom:20px;margin-bottom:30px}.logo{width:80px;height:80px}.company-info h1{font-size:28px;color:#0ea5e9;margin:0}.title{text-align:center;font-size:24px;margin-bottom:30px;padding:15px;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border-radius:8px}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:25px}.info-item{background:#f8fafc;padding:12px 16px;border-radius:6px;border-left:3px solid #0ea5e9}.info-item label{display:block;font-size:12px;color:#64748b;margin-bottom:4px}.info-item span{font-size:16px;font-weight:600}.result-box{padding:20px;border-radius:8px;margin-bottom:25px;text-align:center;font-size:20px;font-weight:bold}.result-high{background:#dcfce7;color:#166534;border:2px solid #22c55e}.result-medium{background:#fef9c3;color:#854d0e;border:2px solid #eab308}.result-low,.result-blocked{background:#fee2e2;color:#991b1b;border:2px solid #ef4444}.laudo-content{background:#f8fafc;padding:20px;border-radius:8px;border:1px solid #e2e8f0;white-space:pre-wrap}.footer{margin-top:40px;text-align:center;color:#64748b;font-size:12px}</style>
      </head><body>
      <div class="header"><img src="${webmarcasIcon}" alt="WebMarcas" class="logo"><div class="company-info"><h1>WebMarcas</h1><p>Registro de Marcas</p></div></div>
      <div class="title">📋 Laudo Técnico de Viabilidade de Marca</div>
      <div class="info-grid"><div class="info-item"><label>Nome da Marca</label><span>${brandName}</span></div><div class="info-item"><label>Ramo de Atividade</label><span>${businessArea}</span></div></div>
      <div class="result-box result-${result?.level}">${result?.title}</div>
      <div class="laudo-content">${result?.laudo || result?.description}</div>
      <div class="footer"><p>Documento gerado em: ${currentDate}</p><p>www.webmarcas.net</p></div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
  };

  if (!result) {
    return (
      <AnimatePresence mode="wait">
        {isSearching ? (
          <INPISearchAnimation key="searching" brandName={brandName} />
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSearch} className="space-y-8">
              {/* Header */}
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Consulta Real no INPI
                </motion.div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Verifique a Viabilidade
                </h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Consultamos a base do INPI em tempo real para verificar se sua marca pode ser registrada.
                </p>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Shield, label: "100% Seguro", sub: "Dados protegidos" },
                  { icon: Zap, label: "Tempo Real", sub: "Base oficial INPI" },
                  { icon: TrendingUp, label: "Laudo Técnico", sub: "IA especializada" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 border border-border/50 text-center"
                  >
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="text-xs font-semibold">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground">{item.sub}</span>
                  </motion.div>
                ))}
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brandName" className="text-sm font-semibold">
                    Nome da Marca <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="brandName"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Ex: WebMarcas, TechFlow, BioVida..."
                    disabled={isSearching}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessArea" className="text-sm font-semibold">
                    Ramo de Atividade <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="businessArea"
                    value={businessArea}
                    onChange={(e) => setBusinessArea(e.target.value)}
                    placeholder="Ex: Serviços Jurídicos, Alimentação, Tecnologia..."
                    disabled={isSearching}
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold rounded-xl shadow-[var(--shadow-button)]"
                disabled={isSearching}
                size="lg"
              >
                <Search className="w-5 h-5 mr-2" />
                Gerar Laudo Técnico Gratuito
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Consulta gratuita • Sem compromisso • Resultado em segundos
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }


  const config = getResultConfig(result.level);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Result Badge */}
      <div className="text-center">
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider border", config.badgeBg, config.badgeText, config.border)}
        >
          <Icon className="w-3.5 h-3.5" />
          {config.badgeLabel}
        </motion.span>
      </div>

      {/* Main Result Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border p-6 bg-gradient-to-br shadow-lg",
          config.gradient,
          config.border,
          config.glow
        )}
      >
        <div className="flex items-start gap-4">
          <div className={cn("p-3 rounded-xl bg-background/80 shadow-sm", config.border, "border")}>
            <Icon className={cn("w-8 h-8", config.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold mb-2">{result.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{result.description}</p>
          </div>
        </div>

        {/* Brand info */}
        <div className="mt-4 pt-4 border-t border-border/30 grid grid-cols-2 gap-3">
          <div className="text-xs">
            <span className="text-muted-foreground block">Marca consultada</span>
            <span className="font-semibold">{brandName}</span>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground block">Ramo de atividade</span>
            <span className="font-semibold">{businessArea}</span>
          </div>
        </div>
      </motion.div>

      {/* Laudo Técnico */}
      {result.laudo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Laudo Técnico Completo
            </h4>
            <Button variant="ghost" size="sm" onClick={printLaudo} className="h-8 text-xs">
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Imprimir
            </Button>
          </div>
          <div className="bg-muted/40 border border-border rounded-xl p-4 max-h-52 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-sans leading-relaxed">{result.laudo}</pre>
          </div>
        </motion.div>
      )}

      {/* Warning */}
      {result.level !== 'blocked' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20"
        >
          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Aja rápido!</strong> O dono da marca é quem registra primeiro.
            A situação pode mudar se outra pessoa protocolar antes de você.
          </p>
        </motion.div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {result.level !== 'blocked' && (
          <Button
            className="w-full h-14 text-base font-semibold rounded-xl shadow-[var(--shadow-button)]"
            size="lg"
            onClick={() => onNext(brandName, businessArea, result)}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Continuar com o Registro
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
        <Button variant="outline" className="w-full h-11 rounded-xl" onClick={resetSearch}>
          Fazer nova consulta
        </Button>
      </div>
    </motion.div>
  );
}
