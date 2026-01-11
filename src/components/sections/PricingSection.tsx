import { Check, Star, ArrowRight, Flame, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNextFridayFormatted } from "@/lib/dateUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePricing } from "@/hooks/usePricing";

const PricingSection = () => {
  const { t } = useLanguage();
  const { pricing, isLoading, getCartaoParcelaText, getBoletoParcelaText, getAvistaLabel } = usePricing();

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
      <section id="precos" className="section-padding bg-card relative overflow-hidden">
        <div className="container mx-auto px-4 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section id="precos" className="section-padding bg-card relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="badge-premium mb-4 inline-flex">{t("pricing.badge")}</span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t("pricing.title")}{" "}
            <span className="gradient-text">{t("pricing.titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("pricing.subtitle")}
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <div className="glass-card p-8 md:p-10 relative overflow-hidden">
            {/* Recommended badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground text-xs font-bold px-4 py-2 rounded-bl-xl flex items-center gap-1">
              <Star className="w-3 h-3" />
              {t("pricing.recommended")}
            </div>

            {/* Plan name */}
            <h3 className="font-display text-2xl font-bold mb-2">
              {t("pricing.planName")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t("pricing.planDesc")}
            </p>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-display font-bold gradient-text">{getAvistaLabel()}</span>
                <span className="text-muted-foreground">{t("pricing.priceLabel")}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {t("pricing.installments1")} <span className="text-foreground font-medium">{getCartaoParcelaText()}</span> {t("pricing.installments2")}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("pricing.installments1")} <span className="text-foreground font-medium">{getBoletoParcelaText()}</span> {t("pricing.installments3")}
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

            {/* CTA */}
            <Button
              variant="hero"
              size="xl"
              className="w-full group"
              onClick={scrollToForm}
            >
              {t("pricing.cta")}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            {/* Urgency Below Button */}
            <div className="flex items-center justify-center gap-2 mt-4 p-2 rounded-lg bg-primary/5 border border-primary/10">
              <Flame className="w-4 h-4 text-destructive" />
              <p className="text-xs font-medium text-foreground">
                {t("pricing.urgency")} <span className="font-bold text-destructive">{getNextFridayFormatted()}</span>
              </p>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center mt-3">
              {t("pricing.disclaimer")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
