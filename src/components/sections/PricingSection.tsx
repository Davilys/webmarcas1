import { Check, Star, ArrowRight, Flame, Loader2, CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNextFridayFormatted } from "@/lib/dateUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePricing } from "@/hooks/usePricing";

const PricingSection = () => {
  const { t } = useLanguage();
  const { pricing, isLoading, getCartaoParcelaText, getBoletoParcelaText } = usePricing();

  const features = [
    t("pricing.feature1"),
    t("pricing.feature2"),
    t("pricing.feature3"),
    t("pricing.feature4"),
    t("pricing.feature5"),
    t("pricing.feature6"),
    t("pricing.feature7"),
    t("pricing.feature8"),
    t("pricing.feature9"),
  ];

  const scrollToForm = () => {
    document.getElementById("consultar")?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <section id="precos" className="section-padding bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
        <div className="container mx-auto px-4 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section id="precos" className="section-padding bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="badge-premium mb-4 inline-flex">{t("pricing.badge")}</span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t("pricing.title")}{" "}
            <span className="gradient-text">{t("pricing.titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("pricing.subtitle")}
          </p>
        </div>

        {/* Pricing Card - App Style */}
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden relative">
            {/* Most Popular Badge */}
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-r from-primary to-blue-500 text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-bl-2xl flex items-center gap-1.5 shadow-lg">
                <Star className="w-3.5 h-3.5 fill-current" />
                {t("pricing.recommended")}
              </div>
            </div>

            <div className="p-8 pt-12">
              {/* Plan Title */}
              <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                {t("pricing.planName")}
              </h3>
              <p className="text-muted-foreground mb-8">
                {t("pricing.planDesc")}
              </p>

              {/* Main Price - Centered & Prominent */}
              <div className="text-center mb-8">
                <div className="text-6xl md:text-7xl font-display font-bold bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent mb-2">
                  R$699,00
                </div>
                <span className="text-muted-foreground text-lg">{t("pricing.priceLabel")}</span>
              </div>

              {/* Payment Options Cards */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-muted/50 rounded-xl p-4 text-center border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">{getCartaoParcelaText()}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">no cartão</span>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">{getBoletoParcelaText()}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">no boleto</span>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-foreground font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                variant="hero"
                size="xl"
                className="w-full group text-lg py-6 rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all"
                onClick={scrollToForm}
              >
                Registrar por R$699
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              {/* Urgency Banner */}
              <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-center justify-center gap-2">
                <Flame className="w-5 h-5 text-destructive animate-pulse" />
                <p className="text-sm font-semibold text-destructive">
                  Oferta válida até <span className="font-bold">{getNextFridayFormatted()}</span>
                </p>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground text-center mt-4">
                {t("pricing.disclaimer")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
