import { Check, Star, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNextFridayFormatted } from "@/lib/dateUtils";

const features = [
  "Busca de viabilidade completa",
  "Laudo técnico detalhado",
  "Preparo do pedido de registro",
  "Protocolo no INPI em até 48h",
  "Acompanhamento do processo",
  "Área do cliente exclusiva",
  "Suporte via WhatsApp",
  "Garantia de nova tentativa",
  "Vigência de 10 anos",
];

const PricingSection = () => {
  const scrollToForm = () => {
    document.getElementById("consultar")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="precos" className="section-padding bg-card relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="badge-premium mb-4 inline-flex">Investimento</span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Invista na proteção da sua{" "}
            <span className="gradient-text">marca</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Preço único e transparente. Sem taxas ocultas. 
            Taxas do INPI cobradas à parte.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <div className="glass-card p-8 md:p-10 relative overflow-hidden">
            {/* Recommended badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground text-xs font-bold px-4 py-2 rounded-bl-xl flex items-center gap-1">
              <Star className="w-3 h-3" />
              MAIS ESCOLHIDO
            </div>

            {/* Plan name */}
            <h3 className="font-display text-2xl font-bold mb-2">
              Registro de Marca Completo
            </h3>
            <p className="text-muted-foreground mb-6">
              Tudo que você precisa para proteger sua marca
            </p>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-display font-bold gradient-text">R$699</span>
                <span className="text-muted-foreground">à vista</span>
              </div>
              <div className="text-sm text-muted-foreground">
                ou <span className="text-foreground font-medium">6x de R$199</span> no cartão
              </div>
              <div className="text-sm text-muted-foreground">
                ou <span className="text-foreground font-medium">3x de R$399</span> no boleto
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Urgency Banner */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-4">
              <Flame className="w-5 h-5 text-destructive animate-pulse" />
              <p className="text-sm font-semibold text-destructive">
                R$699 à vista somente até sexta-feira, {getNextFridayFormatted()}
              </p>
            </div>

            {/* CTA */}
            <Button
              variant="hero"
              size="xl"
              className="w-full group"
              onClick={scrollToForm}
            >
              Registrar minha marca
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              * Taxas do INPI (GRU) são cobradas à parte pelo órgão.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
