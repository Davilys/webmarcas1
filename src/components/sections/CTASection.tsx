import { ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="glass-card max-w-4xl mx-auto p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>

          {/* Content */}
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Proteja sua marca{" "}
            <span className="gradient-text">hoje mesmo</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Não deixe para depois. O dono da marca é quem registra primeiro. 
            Inicie agora e garanta a proteção do seu negócio.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <a href="#consultar" className="group">
                Consultar viabilidade grátis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <a
                href="https://wa.me/5511999999999?text=Olá! Gostaria de falar com um especialista sobre registro de marca."
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar com especialista
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
