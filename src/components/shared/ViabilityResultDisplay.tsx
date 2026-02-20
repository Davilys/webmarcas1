import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, AlertTriangle, AlertCircle, ShieldX, Download,
  ArrowRight, Sparkles, Shield, TrendingUp, Globe, Building2,
  Search, Linkedin, MapPin, ExternalLink, RefreshCw, Clock,
  FileText, ChevronDown, ChevronUp, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type ViabilityResult } from "@/lib/api/viability";
import { generateViabilityPDF } from "@/hooks/useViabilityPdf";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ViabilityResultDisplayProps {
  result: ViabilityResult;
  brandName: string;
  businessArea: string;
  onReset: () => void;
  onNext?: (brandName: string, businessArea: string, result: ViabilityResult) => void;
  showNextButton?: boolean;
}

interface UrgencyGaugeProps {
  score: number;
}

function UrgencyGauge({ score }: UrgencyGaugeProps) {
  const colorClass = score > 70 ? 'text-destructive' : score > 40 ? 'text-yellow-500' : 'text-emerald-500';
  const color = score > 70 ? 'hsl(0 84.2% 60.2%)' : score > 40 ? 'hsl(45 93.4% 47.5%)' : 'hsl(142.1 76.2% 36.3%)';
  const label = score > 70 ? 'URGENTE' : score > 40 ? 'MODERADO' : 'TRANQUILO';
  const rotation = -90 + (score / 100) * 180;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-12 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Track */}
          <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" strokeLinecap="round" />
          {/* Fill */}
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 141.37} 141.37`}
          />
          {/* Needle */}
          <motion.line
            x1="50" y1="50" x2="50" y2="10"
            stroke={color} strokeWidth="2" strokeLinecap="round"
            initial={{ rotate: -90 }}
            animate={{ rotate: rotation }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ transformOrigin: '50px 50px' }}
          />
          <circle cx="50" cy="50" r="3" fill={color} />
        </svg>
      </div>
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold"
          style={{ color }}
        >
          {score}
        </motion.div>
        <div className="text-xs font-semibold" style={{ color }}>{label}</div>
        <div className="text-xs text-muted-foreground">Score de Urgência</div>
      </div>
    </div>
  );
}

function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-0.5 bg-primary/60 z-10"
      animate={{ top: ['0%', '100%', '0%'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    />
  );
}

interface LoadingStepProps {
  label: string;
  status: 'pending' | 'running' | 'done';
  delay: number;
}

function LoadingStep({ label, status, delay }: LoadingStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3"
    >
      <div className="relative w-6 h-6 shrink-0">
        {status === 'running' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
        {status === 'done' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
          >
            <CheckCircle className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        )}
        {status === 'pending' && (
          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
        )}
      </div>
      <span className={cn(
        "text-sm",
        status === 'done' ? 'text-emerald-500 font-medium' :
        status === 'running' ? 'text-foreground font-medium' :
        'text-muted-foreground'
      )}>
        {label}
      </span>
      {status === 'running' && (
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xs text-primary ml-auto"
        >
          analisando...
        </motion.span>
      )}
      {status === 'done' && <span className="text-xs text-emerald-500 ml-auto">✓</span>}
    </motion.div>
  );
}

interface CinematicLoaderProps {
  brandName: string;
}

export function CinematicLoader({ brandName }: CinematicLoaderProps) {
  const steps = [
    { label: '🔍 Consultando base do INPI / WIPO', status: 'done' as const, delay: 0 },
    { label: '🏢 Verificando empresas na Receita Federal', status: 'done' as const, delay: 0.3 },
    { label: '🌐 Analisando presença web e mercado', status: 'running' as const, delay: 0.6 },
    { label: '🤖 Gerando laudo técnico com IA', status: 'pending' as const, delay: 0.9 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Scan visual */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-muted/20 p-8">
        <ScanLine />
        <div className="relative z-20 flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary flex items-center justify-center"
          >
            <Search className="w-7 h-7 text-primary" />
          </motion.div>
          <div className="text-center">
            <div className="font-bold text-lg">Analisando "{brandName}"</div>
            <div className="text-sm text-muted-foreground">Consulta em múltiplas fontes simultâneas</div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-muted/30 rounded-2xl border border-border/50 p-5 space-y-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Módulos de Análise
        </div>
        {steps.map((step, i) => (
          <LoadingStep key={i} {...step} />
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Análise completa com IA • Aguarde ~30 segundos para resultado preciso
      </p>
    </motion.div>
  );
}

export function ViabilityResultDisplay({
  result, brandName, businessArea, onReset, onNext, showNextButton = false
}: ViabilityResultDisplayProps) {
  const [showFullLaudo, setShowFullLaudo] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateViabilityPDF(brandName, businessArea, result);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF. Tente novamente.');
      console.error(error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const levelConfig = {
    high: {
      icon: CheckCircle,
      gradient: 'from-emerald-500/10 to-emerald-600/5',
      border: 'border-emerald-500/30',
      iconColor: 'text-emerald-500',
      badgeBg: 'bg-emerald-500/10',
      badgeText: 'text-emerald-600 dark:text-emerald-400',
      badgeLabel: 'ALTA VIABILIDADE',
    },
    medium: {
      icon: AlertTriangle,
      gradient: 'from-amber-500/10 to-amber-600/5',
      border: 'border-amber-500/30',
      iconColor: 'text-amber-500',
      badgeBg: 'bg-amber-500/10',
      badgeText: 'text-amber-600 dark:text-amber-400',
      badgeLabel: 'VIABILIDADE MÉDIA',
    },
    low: {
      icon: AlertCircle,
      gradient: 'from-red-500/10 to-red-600/5',
      border: 'border-red-500/30',
      iconColor: 'text-red-500',
      badgeBg: 'bg-red-500/10',
      badgeText: 'text-red-600 dark:text-red-400',
      badgeLabel: 'BAIXA VIABILIDADE',
    },
    blocked: {
      icon: ShieldX,
      gradient: 'from-red-800/15 to-red-900/10',
      border: 'border-red-700/40',
      iconColor: 'text-red-700',
      badgeBg: 'bg-red-700/10',
      badgeText: 'text-red-800 dark:text-red-300',
      badgeLabel: 'MARCA BLOQUEADA',
    },
  };

  const config = levelConfig[result.level] || levelConfig.medium;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Badge + Urgency Row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider border",
            config.badgeBg, config.badgeText, config.border
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          {config.badgeLabel}
        </motion.span>
        {result.urgencyScore !== undefined && (
          <UrgencyGauge score={result.urgencyScore} />
        )}
      </div>

      {/* Main Result Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border p-5 bg-gradient-to-br shadow-lg",
          config.gradient, config.border
        )}
      >
        <div className="flex items-start gap-4">
          <div className={cn("p-2.5 rounded-xl bg-background/80 shadow-sm border", config.border)}>
            <Icon className={cn("w-7 h-7", config.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold mb-1">{result.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{result.description}</p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-border/30 grid grid-cols-2 gap-3">
          <div className="text-xs"><span className="text-muted-foreground block">Marca</span><span className="font-semibold">{brandName}</span></div>
          <div className="text-xs"><span className="text-muted-foreground block">Ramo</span><span className="font-semibold">{businessArea}</span></div>
        </div>
      </motion.div>

      {/* ── INPI Results ── */}
      {result.inpiResults && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border/50 overflow-hidden"
        >
          <div className="bg-muted/40 px-4 py-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Base do INPI</span>
            <Badge variant={result.inpiResults.found ? "destructive" : "secondary"} className="ml-auto text-xs">
              {result.inpiResults.found ? `${result.inpiResults.totalResults} colidência(s)` : 'Sem colidências'}
            </Badge>
          </div>
          {result.inpiResults.conflicts.length > 0 ? (
            <div className="p-3 space-y-2">
              {result.inpiResults.conflicts.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{c.marca}</div>
                    <div className="text-muted-foreground">{c.situacao} • {c.titular || 'Titular não informado'} • {c.pais}</div>
                    {c.classe && <div className="text-muted-foreground">Classe: {c.classe}</div>}
                  </div>
                  {c.processo && <div className="font-mono text-muted-foreground shrink-0">{c.processo}</div>}
                </div>
              ))}
              <div className="text-xs text-muted-foreground text-center pt-1">
                Fonte: {result.inpiResults.source}
              </div>
            </div>
          ) : (
            <div className="p-4 flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              Nenhuma colidência encontrada. Fonte: {result.inpiResults.source}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Empresas BR ── */}
      {result.companiesResult && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border/50 overflow-hidden"
        >
          <div className="bg-muted/40 px-4 py-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Empresas na Receita Federal</span>
            <Badge variant={result.companiesResult.found ? "destructive" : "secondary"} className="ml-auto text-xs">
              {result.companiesResult.found ? `${result.companiesResult.total} empresa(s)` : 'Nenhuma encontrada'}
            </Badge>
          </div>
          {result.companiesResult.companies.length > 0 ? (
            <div className="p-3 space-y-2">
              {result.companiesResult.companies.slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs">
                  <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.name}</div>
                    <div className="text-muted-foreground">{c.cnpj} • {c.status} • {c.city}/{c.state}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              Nenhuma empresa com nome idêntico encontrada.
            </div>
          )}
        </motion.div>
      )}

      {/* ── Web Analysis ── */}
      {result.webAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-border/50 overflow-hidden"
        >
          <div className="bg-muted/40 px-4 py-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Presença Web e Mercado</span>
            <Badge variant="outline" className="ml-auto text-xs">
              {result.webAnalysis.webMentions} menções
            </Badge>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className={cn(
                "flex items-center gap-2 p-2.5 rounded-lg text-xs border",
                result.webAnalysis.googleMeuNegocio
                  ? "bg-red-500/5 border-red-500/20 text-red-600"
                  : "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
              )}>
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <div className="font-semibold">Google Maps</div>
                  <div>{result.webAnalysis.googleMeuNegocio ? 'Detectado' : 'Não detectado'}</div>
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-2 p-2.5 rounded-lg text-xs border",
                result.webAnalysis.linkedin
                  ? "bg-red-500/5 border-red-500/20 text-red-600"
                  : "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
              )}>
                <Linkedin className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <div className="font-semibold">LinkedIn</div>
                  <div>{result.webAnalysis.linkedin ? 'Detectado' : 'Não detectado'}</div>
                </div>
              </div>
            </div>
            {result.webAnalysis.summary && (
              <p className="text-xs text-muted-foreground leading-relaxed">{result.webAnalysis.summary}</p>
            )}
            {result.webAnalysis.sources.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Fontes encontradas:</div>
                {result.webAnalysis.sources.slice(0, 3).map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    {s.title || s.url}
                  </a>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Laudo Técnico ── */}
      {result.laudo && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-border/50 overflow-hidden"
        >
          <button
            onClick={() => setShowFullLaudo(!showFullLaudo)}
            className="w-full bg-muted/40 px-4 py-3 flex items-center gap-2 hover:bg-muted/60 transition-colors"
          >
            <FileText className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Laudo Técnico Completo</span>
            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
              {showFullLaudo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showFullLaudo ? 'Recolher' : 'Expandir'}
            </span>
          </button>
          <AnimatePresence>
            {showFullLaudo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 max-h-72 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-sans leading-relaxed">
                    {result.laudo}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!showFullLaudo && (
            <div className="px-4 pb-3">
              <p className="text-xs text-muted-foreground line-clamp-2">{result.laudo.substring(0, 180)}...</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Urgency Warning ── */}
      {result.level !== 'blocked' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20"
        >
          <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">⚠️ Aja rápido!</strong> O dono da marca é quem registra primeiro (Lei 9.279/96, art. 129).
            {(result.inpiResults?.found || result.companiesResult?.found || result.webAnalysis?.webMentions && result.webAnalysis.webMentions > 0) &&
              ' Foram detectadas referências desta marca — o risco de alguém protocolar antes é real.'}
          </p>
        </motion.div>
      )}

      {/* ── Actions ── */}
      <div className="space-y-3">
        <Button
          className="w-full h-12 font-semibold rounded-xl gap-2"
          variant="outline"
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <RefreshCw className="w-4 h-4" />
            </motion.div>
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isGeneratingPdf ? 'Gerando PDF...' : 'Baixar Laudo em PDF (Profissional)'}
        </Button>

        {showNextButton && onNext && result.level !== 'blocked' && (
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

        <Button variant="ghost" className="w-full h-10 rounded-xl text-muted-foreground" onClick={onReset}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Nova consulta
        </Button>
      </div>
    </motion.div>
  );
}
