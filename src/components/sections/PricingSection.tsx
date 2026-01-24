import { Check, Star, ArrowRight, Flame, Loader2, CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNextFridayFormatted } from "@/lib/dateUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePricing } from "@/hooks/usePricing";
import { motion } from "framer-motion";

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  } as const;

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const featureVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
      },
    },
  };

  const priceVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 10,
        delay: 0.3,
      },
    },
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
        <div className="absolute top-20 left-10 w-48 md:w-72 h-48 md:h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 md:w-96 h-64 md:h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        className="container mx-auto px-4 relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-8 md:mb-12"
          variants={cardVariants}
        >
          <span className="badge-premium mb-4 inline-flex">{t("pricing.badge")}</span>
          <h2 className="text-display mb-4">
            {t("pricing.title")}{" "}
            <span className="gradient-text">{t("pricing.titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            {t("pricing.subtitle")}
          </p>
        </motion.div>

        {/* Pricing Card - App Style */}
        <div className="max-w-md mx-auto">
          <motion.div 
            className="bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden relative"
            variants={cardVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            {/* Most Popular Badge */}
            <motion.div 
              className="absolute top-0 right-0"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <div className="bg-gradient-to-r from-primary to-blue-500 text-primary-foreground text-xs font-bold px-4 py-2 md:px-5 md:py-2.5 rounded-bl-2xl flex items-center gap-1.5 shadow-lg">
                <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" />
                <span className="hidden sm:inline">{t("pricing.recommended")}</span>
                <span className="sm:hidden">TOP</span>
              </div>
            </motion.div>

            <div className="p-6 pt-10 md:p-8 md:pt-12">
              {/* Plan Title */}
              <h3 className="font-display text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-2">
                {t("pricing.planName")}
              </h3>
              <p className="text-muted-foreground text-sm md:text-base mb-6 md:mb-8">
                {t("pricing.planDesc")}
              </p>

              {/* Main Price - Centered & Prominent */}
              <motion.div 
                className="text-center mb-6 md:mb-8"
                variants={priceVariants}
              >
                <div className="text-5xl sm:text-6xl md:text-7xl font-display font-bold bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent mb-2">
                  R$699,00
                </div>
                <span className="text-muted-foreground text-base md:text-lg">{t("pricing.priceLabel")}</span>
              </motion.div>

              {/* Payment Options Cards */}
              <div className="grid grid-cols-2 gap-2 md:gap-3 mb-6 md:mb-8">
                <motion.div 
                  className="bg-muted/50 rounded-xl p-3 md:p-4 text-center border border-border/50 hover:border-primary/30 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center gap-1 md:gap-1.5 mb-1">
                    <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                    <span className="font-semibold text-foreground text-sm md:text-base">{getCartaoParcelaText()}</span>
                  </div>
                  <span className="text-xs md:text-sm text-muted-foreground">no cartão</span>
                </motion.div>
                <motion.div 
                  className="bg-muted/50 rounded-xl p-3 md:p-4 text-center border border-border/50 hover:border-primary/30 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center gap-1 md:gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                    <span className="font-semibold text-foreground text-sm md:text-base">{getBoletoParcelaText()}</span>
                  </div>
                  <span className="text-xs md:text-sm text-muted-foreground">no boleto</span>
                </motion.div>
              </div>

              {/* Features List */}
              <motion.ul 
                className="space-y-3 md:space-y-4 mb-6 md:mb-8"
                variants={containerVariants}
              >
                {features.map((feature, index) => (
                  <motion.li 
                    key={index} 
                    className="flex items-center gap-2 md:gap-3"
                    variants={featureVariants}
                    custom={index}
                  >
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-accent" />
                    </div>
                    <span className="text-foreground font-medium text-sm md:text-base">{feature}</span>
                  </motion.li>
                ))}
              </motion.ul>

              {/* CTA Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full group text-base md:text-lg py-5 md:py-6 rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all touch-target"
                  onClick={scrollToForm}
                >
                  Registrar por R$699
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>

              {/* Urgency Banner */}
              <motion.div 
                className="mt-4 bg-destructive/10 border border-destructive/20 rounded-xl p-2.5 md:p-3 flex items-center justify-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Flame className="w-4 h-4 md:w-5 md:h-5 text-destructive animate-pulse" />
                <p className="text-xs md:text-sm font-semibold text-destructive">
                  Oferta válida até <span className="font-bold">{getNextFridayFormatted()}</span>
                </p>
              </motion.div>

              {/* Disclaimer */}
              <p className="text-[10px] md:text-xs text-muted-foreground text-center mt-3 md:mt-4">
                {t("pricing.disclaimer")}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default PricingSection;