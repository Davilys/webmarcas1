import { ArrowRight, Shield, Clock, CheckCircle, Award, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getNextFridayFormatted } from "@/lib/dateUtils";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { t } = useLanguage();
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [phraseIndex, setPhraseIndex] = useState(0);

  const phrases = [t("hero.phrase1"), t("hero.phrase2"), t("hero.phrase3")];

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    
    if (isTyping) {
      if (displayedText.length < currentPhrase.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));
        }, 100);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setIsTyping(false);
          setDisplayedText("");
        }, 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      const timeout = setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
        setIsTyping(true);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [displayedText, isTyping, phraseIndex, phrases]);

  const trustBadges = [
    { icon: Shield, label: t("hero.trust.inpi") },
    { icon: Clock, label: t("hero.trust.protocol") },
    { icon: CheckCircle, label: t("hero.trust.guarantee") },
    { icon: Award, label: t("hero.trust.online") },
  ];

  const stats = [
    { value: "10.000+", label: t("hero.stats.brands") },
    { value: "98%", label: t("hero.stats.success") },
    { value: "48h", label: t("hero.stats.time") },
    { value: "15+", label: t("hero.stats.experience") },
  ];

  return (
    <section id="home" className="relative min-h-screen flex items-center hero-glow overflow-hidden">
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
            <span className="gradient-text">
              {displayedText}
              <span className="animate-pulse">|</span>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            {trustBadges.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-secondary/50 backdrop-blur-sm"
              >
                <item.icon className="w-9 h-9 text-primary" />
                <span className="text-xs md:text-sm text-muted-foreground text-center">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
