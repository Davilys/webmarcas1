import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, AlertTriangle, AlertCircle, ShieldX, Download,
  ArrowRight, Sparkles, Shield, Globe, Building2,
  Search, Linkedin, MapPin, ExternalLink, RefreshCw, Clock,
  FileText, ChevronDown, ChevronUp, Star, Zap, Award, TrendingUp
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

// ─── Urgency Gauge ────────────────────────────────────────────────
function UrgencyGauge({ score }: { score: number }) {
  const isUrgent = score > 70;
  const isMedium = score > 40;
  const color = isUrgent ? '#ef4444' : isMedium ? '#f59e0b' : '#10b981';
  const label = isUrgent ? 'URGENTE' : isMedium ? 'MODERADO' : 'TRANQUILO';
  const rotation = -90 + (score / 100) * 180;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-10 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" strokeLinecap="round" />
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 141.37} 141.37`}
          />
          <motion.line
            x1="50" y1="50" x2="50" y2="12"
            stroke={color} strokeWidth="2.5" strokeLinecap="round"
            initial={{ rotate: -90 }}
            animate={{ rotate: rotation }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ transformOrigin: '50px 50px' }}
          />
          <circle cx="50" cy="50" r="4" fill={color} />
        </svg>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <div className="text-xl font-black" style={{ color }}>{score}</div>
        <div className="text-[10px] font-bold tracking-widest" style={{ color }}>{label}</div>
        <div className="text-[9px] text-muted-foreground">URGÊNCIA</div>
      </motion.div>
    </div>
  );
}

// ─── Distinctive Score Bar ─────────────────────────────────────────
function DistinctiveScoreBar({ brandName }: { brandName: string }) {
  const score = Math.min(70 + (brandName.length >= 8 ? 10 : 0) + (brandName.length >= 12 ? 5 : 0) + 5, 100);
  const checks = [
    { label: `Comprimento adequado (${brandName.length} caracteres)`, ok: true },
    { label: 'Marca inventada/distintiva — maior proteção', ok: true },
    { label: 'Baixa probabilidade de conflitos', ok: true },
    { label: 'Recomendamos prosseguir com o registro', ok: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-xl border border-border/50 overflow-hidden"
    >
      <div className="bg-muted/40 px-4 py-3 flex items-center gap-2">
        <Star className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Análise de Padrões da Marca</span>
        <Badge className="ml-auto text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
          Score: {score}/100 — ALTO
        </Badge>
      </div>
      <div className="p-4 space-y-3">
        {/* Barra de progresso */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-medium">Score de Distintividade</span>
            <span className="font-bold text-emerald-600">{score}/100</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </div>
        {/* Checklist */}
        <div className="grid grid-cols-1 gap-1.5">
          {checks.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-center gap-2 text-xs"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-muted-foreground">{c.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── INPI Section ─────────────────────────────────────────────────
function INPISection({ inpiResults, delay }: { inpiResults: NonNullable<ViabilityResult['inpiResults']>; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-border/50 overflow-hidden"
    >
      <div className="bg-muted/40 px-4 py-3 flex items-center gap-2">
        <Search className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Pesquisa na Base do INPI / WIPO</span>
        <Badge
          variant={inpiResults.found ? "destructive" : "secondary"}
          className={cn("ml-auto text-xs", !inpiResults.found && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30")}
        >
          {inpiResults.found ? `${inpiResults.totalResults} colidência(s)` : '✓ Sem colidências'}
        </Badge>
      </div>
      {inpiResults.conflicts.length > 0 ? (
        <div className="p-3 space-y-2">
          {inpiResults.conflicts.slice(0, 5).map((c, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{c.marca}</div>
                <div className="text-muted-foreground">{c.situacao} · {c.titular || 'Titular não informado'} · {c.pais}</div>
                {c.classe && <div className="text-muted-foreground">Classe: {c.classe}</div>}
              </div>
              {c.processo && <div className="font-mono text-muted-foreground/70 text-[10px] shrink-0">{c.processo}</div>}
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground text-center pt-0.5">Fonte: {inpiResults.source}</p>
        </div>
      ) : (
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Nenhuma colidência encontrada na base oficial do INPI.
          </div>
          <p className="text-xs text-muted-foreground">Fonte: {inpiResults.source}</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Companies Section ─────────────────────────────────────────────
function CompaniesSection({ companiesResult, delay }: { companiesResult: NonNullable<ViabilityResult['companiesResult']>; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-border/50 overflow-hidden"
    >
      <div className="bg-muted/40 px-4 py-3 flex items-center gap-2">
        <Building2 className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Colidência Empresarial — Receita Federal (CNPJ)</span>
        <Badge
          variant={companiesResult.found ? "destructive" : "secondary"}
          className={cn("ml-auto text-xs", !companiesResult.found && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30")}
        >
          {companiesResult.found ? `${companiesResult.total} empresa(s)` : '✓ Nenhuma'}
        </Badge>
      </div>
      {companiesResult.companies.length > 0 ? (
        <div className="p-3 space-y-2">
          {companiesResult.companies.slice(0, 3).map((c, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs">
              <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{c.name}</div>
                <div className="text-muted-foreground">{c.cnpj} · {c.status} · {c.city}/{c.state}</div>
              </div>
            </div>
          ))}
          <div className="mt-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
            <strong>Nota jurídica:</strong> A colidência empresarial é avaliada por nome idêntico, não semelhante. Empresas com CNPJ ativo podem gerar oposição ao registro.
          </div>
        </div>
      ) : (
        <div className="p-4 flex items-center gap-2 text-emerald-600 text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Nenhuma empresa com nome idêntico encontrada na Receita Federal.
        </div>
      )}
    </motion.div>
  );
}

// ─── Web Analysis Section ──────────────────────────────────────────
function WebSection({ webAnalysis, delay }: { webAnalysis: NonNullable<ViabilityResult['webAnalysis']>; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-border/50 overflow-hidden"
    >
      <div className="bg-muted/40 px-4 py-3 flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Presença Web e Mercado</span>
        <Badge variant="outline" className="ml-auto text-xs">
          {webAnalysis.webMentions} menção(ões)
        </Badge>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: MapPin, label: 'Google Maps', detected: webAnalysis.googleMeuNegocio },
            { icon: Linkedin, label: 'LinkedIn', detected: webAnalysis.linkedin },
          ].map(({ icon: Icon, label, detected }) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-2 p-2.5 rounded-lg text-xs border",
                detected
                  ? "bg-red-500/5 border-red-500/20 text-red-600"
                  : "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <div>
                <div className="font-semibold">{label}</div>
                <div>{detected ? 'Detectado' : 'Não detectado'}</div>
              </div>
            </div>
          ))}
        </div>
        {webAnalysis.summary && (
          <p className="text-xs text-muted-foreground leading-relaxed">{webAnalysis.summary}</p>
        )}
        {webAnalysis.sources.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Fontes encontradas:</p>
            {webAnalysis.sources.slice(0, 3).map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate">
                <ExternalLink className="w-3 h-3 shrink-0" />
                {s.title || s.url}
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Laudo Técnico Section ─────────────────────────────────────────
function LaudoSection({ laudo, delay }: { laudo: string; delay: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-border/50 overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full bg-muted/40 px-4 py-3 flex items-center gap-2 hover:bg-muted/60 transition-colors text-left"
      >
        <FileText className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Parecer Técnico-Jurídico Completo</span>
        <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {open ? 'Recolher' : 'Expandir'}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 max-h-72 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-sans leading-relaxed">{laudo}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!open && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground line-clamp-2">{laudo.substring(0, 180)}...</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Cinematic Loader ─────────────────────────────────────────────
interface LoadingStepProps { label: string; status: 'pending' | 'running' | 'done'; delay: number; }

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
            <CheckCircle className="w-4 h-4 text-white" />
          </motion.div>
        )}
        {status === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />}
      </div>
      <span className={cn(
        "text-sm",
        status === 'done' ? 'text-emerald-500 font-medium' :
          status === 'running' ? 'text-foreground font-medium' : 'text-muted-foreground'
      )}>
        {label}
      </span>
      {status === 'running' && (
        <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xs text-primary ml-auto">analisando...</motion.span>
      )}
      {status === 'done' && <span className="text-xs text-emerald-500 ml-auto">✓</span>}
    </motion.div>
  );
}

export function CinematicLoader({ brandName }: { brandName: string }) {
  const steps = [
    { label: '🔍 Consultando base do INPI / WIPO', status: 'done' as const, delay: 0 },
    { label: '🏢 Verificando empresas na Receita Federal', status: 'done' as const, delay: 0.3 },
    { label: '🌐 Analisando presença web e mercado', status: 'running' as const, delay: 0.6 },
    { label: '🤖 Gerando laudo técnico com IA', status: 'pending' as const, delay: 0.9 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-muted/20 p-8">
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-primary/60 z-10"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
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
      <div className="bg-muted/30 rounded-2xl border border-border/50 p-5 space-y-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Módulos de Análise</div>
        {steps.map((step, i) => <LoadingStep key={i} {...step} />)}
      </div>
      <p className="text-center text-xs text-muted-foreground">Análise completa com IA • Aguarde ~30 segundos para resultado preciso</p>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export function ViabilityResultDisplay({
  result, brandName, businessArea, onReset, onNext, showNextButton = false
}: ViabilityResultDisplayProps) {
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
      icon: CheckCircle, gradient: 'from-emerald-500/10 to-emerald-600/5',
      border: 'border-emerald-500/30', iconColor: 'text-emerald-500',
      badgeBg: 'bg-emerald-500/10', badgeText: 'text-emerald-600 dark:text-emerald-400',
      badgeLabel: '✓ ALTA VIABILIDADE',
    },
    medium: {
      icon: AlertTriangle, gradient: 'from-amber-500/10 to-amber-600/5',
      border: 'border-amber-500/30', iconColor: 'text-amber-500',
      badgeBg: 'bg-amber-500/10', badgeText: 'text-amber-600 dark:text-amber-400',
      badgeLabel: '~ VIABILIDADE MÉDIA',
    },
    low: {
      icon: AlertCircle, gradient: 'from-red-500/10 to-red-600/5',
      border: 'border-red-500/30', iconColor: 'text-red-500',
      badgeBg: 'bg-red-500/10', badgeText: 'text-red-600 dark:text-red-400',
      badgeLabel: '✗ BAIXA VIABILIDADE',
    },
    blocked: {
      icon: ShieldX, gradient: 'from-red-800/15 to-red-900/10',
      border: 'border-red-700/40', iconColor: 'text-red-700',
      badgeBg: 'bg-red-700/10', badgeText: 'text-red-800 dark:text-red-300',
      badgeLabel: '✗ MARCA BLOQUEADA',
    },
  };

  const config = levelConfig[result.level] || levelConfig.medium;
  const Icon = config.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

      {/* ── Badge + Urgência ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
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
        {result.urgencyScore !== undefined && <UrgencyGauge score={result.urgencyScore} />}
      </div>

      {/* ── Card Principal ── */}
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.08 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border p-5 bg-gradient-to-br shadow-md",
          config.gradient, config.border
        )}
      >
        <div className="flex items-start gap-4">
          <div className={cn("p-2.5 rounded-xl bg-background/80 shadow-sm border shrink-0", config.border)}>
            <Icon className={cn("w-6 h-6", config.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold mb-1">{result.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{result.description}</p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-border/30 grid grid-cols-2 gap-3">
          <div className="text-xs"><span className="text-muted-foreground block mb-0.5">Marca</span><span className="font-bold">{brandName.toUpperCase()}</span></div>
          <div className="text-xs"><span className="text-muted-foreground block mb-0.5">Ramo</span><span className="font-semibold">{businessArea}</span></div>
        </div>
      </motion.div>

      {/* ── Análise de Padrões ── */}
      <DistinctiveScoreBar brandName={brandName} />

      {/* ── INPI ── */}
      {result.inpiResults && <INPISection inpiResults={result.inpiResults} delay={0.2} />}

      {/* ── Empresas ── */}
      {result.companiesResult && <CompaniesSection companiesResult={result.companiesResult} delay={0.3} />}

      {/* ── Web ── */}
      {result.webAnalysis && <WebSection webAnalysis={result.webAnalysis} delay={0.4} />}

      {/* ── Classes Recomendadas ── */}
      {result.classes && result.classes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-xl border border-border/50 overflow-hidden"
        >
          <div className="bg-muted/40 px-4 py-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Classes Recomendadas para Registro</span>
          </div>
          <div className="p-3 space-y-2">
            {result.classes.map((cls, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-xs">
                <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/40 shrink-0">
                  Classe {cls}
                </Badge>
                <span className="text-muted-foreground leading-relaxed">
                  {result.classDescriptions?.[i] || `Classe NCL ${cls} — conforme ramo informado.`}
                </span>
              </div>
            ))}
            <div className="mt-2 p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/20 text-xs text-violet-700 dark:text-violet-400">
              <strong>Orientação jurídica:</strong> O ideal é registrar em todas as classes indicadas para máxima proteção. Se necessário, registre urgente na classe principal e amplie o escopo depois.
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Laudo Técnico ── */}
      {result.laudo && <LaudoSection laudo={result.laudo} delay={0.5} />}

      {/* ── Alerta de Urgência ── */}
      {result.level !== 'blocked' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/25"
        >
          <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">⚠️ O DONO DA MARCA É QUEM REGISTRA PRIMEIRO!</strong>
            {' '}Conforme Lei 9.279/96, art. 129 — o direito de uso exclusivo é adquirido pelo registro.
            {(result.inpiResults?.found || result.companiesResult?.found || (result.webAnalysis?.webMentions ?? 0) > 0) &&
              ' Foram detectadas referências desta marca — o risco de alguém protocolar antes é real.'}
          </p>
        </motion.div>
      )}

      {/* ── Ações ── */}
      <div className="space-y-2.5 pt-1">
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
          ) : <Download className="w-4 h-4" />}
          {isGeneratingPdf ? 'Gerando PDF Premium...' : 'Baixar Laudo Profissional em PDF'}
        </Button>

        {showNextButton && onNext && result.level !== 'blocked' && (
          <Button
            className="w-full h-14 text-base font-semibold rounded-xl"
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
