import { useState } from "react";
import { Search, AlertCircle, CheckCircle, AlertTriangle, ArrowRight, MessageCircle, ShieldX, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { checkViability, type ViabilityResult } from "@/lib/api/viability";

type ViabilityLevel = "high" | "medium" | "low" | "blocked" | null;

const ViabilitySearchSection = () => {
  const [brandName, setBrandName] = useState("");
  const [businessArea, setBusinessArea] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<ViabilityResult | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brandName.trim() || !businessArea.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome da marca e o ramo de atividade.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    try {
      const viabilityResult = await checkViability(brandName.trim(), businessArea.trim());
      setResult(viabilityResult);
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

  const resetSearch = () => {
    setResult(null);
    setBrandName("");
    setBusinessArea("");
    setCopied(false);
  };

  const copyLaudo = () => {
    if (result?.laudo) {
      navigator.clipboard.writeText(result.laudo);
      setCopied(true);
      toast({
        title: "Laudo copiado!",
        description: "O laudo foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleRegisterClick = () => {
    // Store viability data for the registration form
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

  return (
    <section id="consultar" className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-gradient opacity-30" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="badge-premium mb-4 inline-flex">Busca Gratuita</span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Consulte a viabilidade da sua{" "}
            <span className="gradient-text">marca</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Verifique gratuitamente se sua marca pode ser registrada no INPI.
          </p>
        </div>

        {/* Search Form / Result */}
        <div className="max-w-2xl mx-auto">
          {!result ? (
            <form onSubmit={handleSearch} className="glass-card p-8">
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
                    disabled={isSearching}
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
                    disabled={isSearching}
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Consultando INPI...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Consultar Viabilidade
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="glass-card p-8">
              {/* Result Header */}
              {(() => {
                const styles = getResultStyles(result.level);
                const Icon = styles.icon;

                return (
                  <div className={`rounded-xl border p-6 mb-6 ${styles.bgClass}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className={`w-6 h-6 ${styles.iconClass}`} />
                      <h3 className={`font-display text-xl font-bold ${styles.textClass}`}>
                        {result.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground">{result.description}</p>
                  </div>
                );
              })()}

              {/* Laudo Completo */}
              {result.laudo && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-display font-semibold text-lg">Laudo Técnico de Viabilidade</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyLaudo}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar
                        </>
                      )}
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
          )}
        </div>
      </div>
    </section>
  );
};

export default ViabilitySearchSection;
