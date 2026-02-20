import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Shield, Zap, Globe, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkViability, type ViabilityResult } from "@/lib/api/viability";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ViabilityResultDisplay, CinematicLoader } from "@/components/shared/ViabilityResultDisplay";

const ViabilitySearchSection = () => {
  const [brandName, setBrandName] = useState("");
  const [businessArea, setBusinessArea] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<ViabilityResult | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !businessArea.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha o nome da marca e o ramo de atividade.", variant: "destructive" });
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
      console.error('Viability error:', error);
      toast({ title: "Erro na consulta", description: "Não foi possível realizar a consulta. Tente novamente.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const resetSearch = () => {
    setResult(null);
    setBrandName("");
    setBusinessArea("");
  };

  const handleRegisterClick = (_brand: string, _area: string, _res: ViabilityResult) => {
    sessionStorage.setItem('viabilityData', JSON.stringify({ brandName, businessArea, level: result?.level }));
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate('/registro');
  };

  return (
    <section id="consultar" className="py-10 md:py-16 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-gradient opacity-30" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="badge-premium mb-4 inline-flex">Análise Real Multi-Fonte</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Consulte a viabilidade da sua{" "}
              <span className="gradient-text">marca</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Análise simultânea no INPI, Receita Federal e web para um laudo técnico-jurídico completo gerado por IA.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mt-5"
          >
            {[
              { icon: Search, label: "Base do INPI" },
              { icon: Shield, label: "Receita Federal" },
              { icon: Globe, label: "Presença Web" },
              { icon: Zap, label: "Laudo com IA" },
            ].map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/15 text-xs font-medium text-primary">
                <f.icon className="w-3 h-3" />
                {f.label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Main content */}
        <div className="max-w-2xl mx-auto">
          {isSearching ? (
            <div className="glass-card p-8">
              <CinematicLoader brandName={brandName} />
            </div>
          ) : !result ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <form onSubmit={handleSearch} className="glass-card p-8 space-y-6">
                <div>
                  <label htmlFor="landingBrandName" className="block text-sm font-semibold mb-2">
                    Nome da Marca <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="landingBrandName"
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Ex: WebMarcas, TechFlow, BioVida..."
                    className="input-styled"
                  />
                </div>

                <div>
                  <label htmlFor="landingBusinessArea" className="block text-sm font-semibold mb-2">
                    Ramo de Atividade <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="landingBusinessArea"
                    type="text"
                    value={businessArea}
                    onChange={(e) => setBusinessArea(e.target.value)}
                    placeholder="Ex: Serviços Jurídicos, Alimentação, Tecnologia..."
                    className="input-styled"
                  />
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full">
                  <Search className="w-5 h-5" />
                  Gerar Laudo Técnico Gratuito
                  <ArrowRight className="w-5 h-5" />
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Análise em 4 módulos simultâneos • Laudo técnico-jurídico com IA • ~30s
                </p>
              </form>
            </motion.div>
          ) : (
            <div className="glass-card p-6 md:p-8">
              <ViabilityResultDisplay
                result={result}
                brandName={brandName}
                businessArea={businessArea}
                onReset={resetSearch}
                onNext={handleRegisterClick}
                showNextButton={true}
              />

              {/* Extra CTA for landing page */}
              {result.level !== 'blocked' && (
                <div className="mt-4 pt-4 border-t border-border/30">
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full group"
                    onClick={() => handleRegisterClick(brandName, businessArea, result)}
                  >
                    🚀 Registrar minha marca agora
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <div className="mt-3">
                    <Button variant="hero-outline" size="lg" className="w-full" asChild>
                      <a
                        href={`https://wa.me/5511911120225?text=${encodeURIComponent('Olá, estava no site da Webmarcas, quero registrar uma marca!')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Falar com especialista
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ViabilitySearchSection;
