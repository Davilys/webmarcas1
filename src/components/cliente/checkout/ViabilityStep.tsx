import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Shield, Zap, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkViability, type ViabilityResult } from "@/lib/api/viability";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ViabilityResultDisplay, CinematicLoader } from "@/components/shared/ViabilityResultDisplay";

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
      await supabase.from('viability_searches').insert({
        brand_name: brandName.trim(),
        business_area: businessArea.trim(),
        result_level: viabilityResult.level
      });
    } catch {
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

  // Loader cinematográfico durante a busca
  if (isSearching) {
    return <CinematicLoader brandName={brandName} />;
  }

  // Resultado premium
  if (result) {
    return (
      <ViabilityResultDisplay
        result={result}
        brandName={brandName}
        businessArea={businessArea}
        onReset={resetSearch}
        onNext={onNext}
        showNextButton={true}
      />
    );
  }

  // Formulário inicial
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <form onSubmit={handleSearch} className="space-y-7">
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Análise Real Multi-Fonte
          </motion.div>
          <h2 className="text-3xl font-bold tracking-tight">
            Verifique a Viabilidade
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto text-sm">
            Consultamos INPI, Receita Federal e web em tempo real para gerar um laudo técnico completo.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Shield, label: "INPI Real", sub: "Base oficial" },
            { icon: Zap, label: "Receita Fed.", sub: "Empresas BR" },
            { icon: TrendingUp, label: "Laudo Técnico", sub: "IA jurídica" },
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
              className="h-12 text-base"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-14 text-base font-semibold rounded-xl shadow-[var(--shadow-button)]"
          size="lg"
        >
          <Search className="w-5 h-5 mr-2" />
          Gerar Laudo Técnico Gratuito
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Análise real em múltiplas fontes • Laudo técnico-jurídico com IA • ~30 segundos
        </p>
      </form>
    </motion.div>
  );
}
