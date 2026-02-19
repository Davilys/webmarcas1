import { ArrowRight, Shield, Clock, CheckCircle, Award, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getNextFridayFormatted } from "@/lib/dateUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "@/components/admin/dashboard/AnimatedCounter";

const HeroSection = () => {
  const { t } = useLanguage();
  const [phraseIndex, setPhraseIndex] = useState(0);

  const phrases = [t("hero.phrase1"), t("hero.phrase2"), t("hero.phrase3")];

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [phrases.length]);

  const trustBadges = [
    { 
      icon: Shield, 
      label: t("hero.trust.inpi"),
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      gradientFrom: "from-blue-500",
      gradientTo: "to-cyan-500"
    },
    { 
      icon: Clock, 
      label: t("hero.trust.protocol"),
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      gradientFrom: "from-emerald-500",
      gradientTo: "to-green-500"
    },
    { 
      icon: CheckCircle, 
      label: t("hero.trust.guarantee"),
      color: "text-violet-600",
      bgColor: "bg-violet-500/10",
      gradientFrom: "from-violet-500",
      gradientTo: "to-purple-500"
    },
    { 
      icon: Award, 
      label: t("hero.trust.online"),
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      gradientFrom: "from-amber-500",
      gradientTo: "to-orange-500"
    },
  ];

  const stats = [
    { value: 11000, suffix: "+", label: t("hero.stats.brands") },
    { value: 98, suffix: "%", label: t("hero.stats.success") },
    { value: 48, suffix: "h", label: t("hero.stats.time") },
    { value: 15, suffix: "+", label: t("hero.stats.experience") },
  ];

  return (
    <section id="home" className="relative min-h-[85vh] flex items-center hero-glow overflow-hidden pt-14 md:pt-0">
      {/* Background elements */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 badge-premium mb-8 animate-fade-in">
            <Award className="w-4 h-4" />
            <span>{t("hero.badge")}</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-slide-up">
            {t("hero.title")}{" "}
            <span className="inline-block overflow-hidden h-[1.2em] align-bottom relative">
              <AnimatePresence mode="wait">
                <motion.span
                  key={phraseIndex}
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="inline-block gradient-text"
                >
                  {phrases[phraseIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            {t("hero.subtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild>
              <a href="#consultar" className="group">
                {t("hero.cta.check")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <a href="#precos">
                {t("hero.cta.register")}
              </a>
            </Button>
          </div>

          {/* Urgency Banner */}
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 max-w-md mx-auto mb-16 animate-slide-up" style={{ animationDelay: "0.25s" }}>
            <Flame className="w-5 h-5 text-destructive" />
            <p className="text-sm font-medium text-foreground">
              {t("hero.urgency")} <span className="font-bold text-destructive">{getNextFridayFormatted()}</span>
            </p>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto">
            {trustBadges.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.3 + index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  y: -8, 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                className="relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-card/80 backdrop-blur-md border border-border/50 overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
              >
                {/* Gradiente de fundo sutil */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br ${item.gradientFrom} ${item.gradientTo}`} />
                
                {/* Circulo decorativo */}
                <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${item.gradientFrom} ${item.gradientTo}`} />
                
                {/* Container do icone com animacao */}
                <motion.div 
                  className={`p-4 rounded-2xl ${item.bgColor} relative`}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <item.icon className={`w-8 h-8 ${item.color}`} />
                  
                  {/* Brilho animado no icone */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
                
                {/* Texto */}
                <span className="text-sm font-medium text-foreground text-center relative z-10">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div 
              key={index} 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
            >
              <div className="font-display text-4xl sm:text-5xl md:text-6xl font-bold gradient-text mb-2 whitespace-nowrap">
                <AnimatedCounter 
                  value={stat.value} 
                  suffix={stat.suffix}
                  duration={2.5}
                />
              </div>
              <div className="text-sm md:text-base text-muted-foreground font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
