import { ArrowRight, Shield, Clock, CheckCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const phrases = ["proteja seu negócio", "seja exclusivo!", "torne ela única!"];

const HeroSection = () => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [phraseIndex, setPhraseIndex] = useState(0);

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
  }, [displayedText, isTyping, phraseIndex]);

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
            <span>Líder em Registro de Marcas no Brasil</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-slide-up">
            Registre sua marca e{" "}
            <span className="gradient-text">
              {displayedText}
              <span className="animate-pulse">|</span>
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Processo 100% online, protocolo em até 48h e garantia de registro. 
            Dono da marca é quem registra primeiro. Proteja-se agora.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild>
              <a href="#consultar" className="group">
                Consultar viabilidade
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <a href="#precos">
                Registrar por R$699
              </a>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            {[
              { icon: Shield, label: "Registro Nacional INPI" },
              { icon: Clock, label: "Protocolo em 48h" },
              { icon: CheckCircle, label: "Garantia de Registro" },
              { icon: Award, label: "Processo 100% Online" },
            ].map((item, index) => (
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
          {[
            { value: "10.000+", label: "Marcas Registradas" },
            { value: "98%", label: "Taxa de Sucesso" },
            { value: "48h", label: "Tempo de Protocolo" },
            { value: "15+", label: "Anos de Experiência" },
          ].map((stat, index) => (
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
