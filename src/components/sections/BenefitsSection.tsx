import { 
  Shield, 
  FileCheck, 
  Clock, 
  Users, 
  Scale, 
  Headphones 
} from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Proteção Nacional",
    description: "Sua marca protegida em todo território brasileiro, impedindo que outros usem seu nome.",
  },
  {
    icon: FileCheck,
    title: "Laudo de Viabilidade",
    description: "Análise prévia gratuita que avalia as chances de sucesso do seu registro.",
  },
  {
    icon: Clock,
    title: "Protocolo em 48h",
    description: "Após aprovação do pagamento, protocolamos sua marca no INPI em até 48 horas.",
  },
  {
    icon: Scale,
    title: "Segurança Jurídica",
    description: "Processo conduzido por especialistas em propriedade intelectual.",
  },
  {
    icon: Users,
    title: "Acompanhamento Completo",
    description: "Monitoramos todo o processo no INPI e respondemos a todas as exigências.",
  },
  {
    icon: Headphones,
    title: "Suporte Dedicado",
    description: "Atendimento humanizado via WhatsApp e área do cliente exclusiva.",
  },
];

const BenefitsSection = () => {
  return (
    <section id="beneficios" className="section-padding bg-card relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="badge-premium mb-4 inline-flex">Por que a WebMarcas?</span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Por que registrar com a{" "}
            <span className="gradient-text">WebMarcas</span>?
          </h2>
          <p className="text-muted-foreground text-lg">
            Combinamos experiência jurídica com tecnologia para oferecer o melhor 
            serviço de registro de marcas do Brasil.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {benefits.map((benefit, index) => (
            <div key={index} className="feature-card group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <benefit.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
