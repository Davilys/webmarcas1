import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Maria Silva",
    role: "CEO, Doce Arte Confeitaria",
    content: "Processo super simples e rápido! Em menos de uma semana minha marca já estava protocolada. Recomendo demais a WebMarcas.",
    rating: 5,
  },
  {
    name: "João Santos",
    role: "Fundador, Tech Solutions",
    content: "Excelente atendimento e muito profissionais. O acompanhamento pelo painel do cliente é muito prático. Nota 10!",
    rating: 5,
  },
  {
    name: "Ana Costa",
    role: "Proprietária, Bella Moda",
    content: "Tinha medo do processo ser complicado, mas a equipe explicou tudo direitinho. Minha marca foi aprovada sem problemas!",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="section-padding bg-card relative overflow-hidden">
      {/* Background */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="badge-premium mb-4 inline-flex">Depoimentos</span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            O que nossos clientes{" "}
            <span className="gradient-text">dizem</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Milhares de marcas protegidas e clientes satisfeitos em todo o Brasil.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="glass-card p-6 relative">
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-primary/30 absolute top-6 right-6" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Content */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-primary-foreground font-bold">
                  {testimonial.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
