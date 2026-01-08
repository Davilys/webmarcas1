import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { checkViability } from "@/lib/api/viability";

const ViabilitySearchSection = () => {
  const [brandName, setBrandName] = useState("");
  const [businessArea, setBusinessArea] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

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
      
      // Store result in sessionStorage and open new tab
      sessionStorage.setItem('viabilityResult', JSON.stringify({
        brandName: brandName.trim(),
        businessArea: businessArea.trim(),
        level: viabilityResult.level,
        title: viabilityResult.title,
        description: viabilityResult.description,
        laudo: viabilityResult.laudo,
      }));
      
      // Open result in new tab
      window.open('/resultado-viabilidade', '_blank');
      
      // Reset form
      setBrandName("");
      setBusinessArea("");
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

        {/* Search Form */}
        <div className="max-w-2xl mx-auto">
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
        </div>
      </div>
    </section>
  );
};

export default ViabilitySearchSection;
