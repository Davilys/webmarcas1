import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O que é o registro de marca e por que é importante?",
    answer: "O registro de marca é o processo legal que garante a propriedade exclusiva do uso de um nome, logo ou símbolo para identificar produtos ou serviços. É importante porque impede que terceiros usem sua marca sem autorização, protegendo seu investimento e reputação no mercado.",
  },
  {
    question: "Quanto tempo leva o processo de registro?",
    answer: "O protocolo no INPI é feito em até 48 horas após a aprovação do pagamento. O processo completo de análise pelo INPI pode levar de 12 a 24 meses, dependendo da complexidade do caso. Durante todo esse período, você já tem a proteção da data de depósito.",
  },
  {
    question: "O que está incluído no valor de R$699?",
    answer: "O valor inclui: busca de viabilidade, laudo técnico, preparo do pedido, protocolo no INPI, acompanhamento completo do processo, resposta a eventuais exigências, acesso à área do cliente e suporte via WhatsApp. As taxas do INPI (GRU) são cobradas à parte pelo órgão.",
  },
  {
    question: "O que é a garantia de registro?",
    answer: "Se sua marca for indeferida por motivos que não foram identificados na nossa análise de viabilidade, fazemos uma nova tentativa de registro sem custo adicional. Isso demonstra nossa confiança na qualidade do nosso trabalho.",
  },
  {
    question: "Quais são as taxas do INPI?",
    answer: "As taxas do INPI variam conforme o porte da empresa. Para microempresas e MEIs, há descontos de até 60%. As principais taxas são: pedido de registro (cerca de R$142 a R$355) e concessão (cerca de R$298 a R$745). Orientamos sobre todos os valores durante o processo.",
  },
  {
    question: "Preciso ter CNPJ para registrar uma marca?",
    answer: "Não é obrigatório. Pessoas físicas também podem registrar marcas. No entanto, a marca deve ter relação com as atividades exercidas pelo titular. Orientamos cada caso para garantir a melhor estratégia de proteção.",
  },
  {
    question: "Como funciona a busca de viabilidade?",
    answer: "Realizamos uma pesquisa completa no banco de dados do INPI para identificar marcas similares ou idênticas que possam impedir seu registro. Você recebe um laudo com a análise de risco e nossa recomendação técnica.",
  },
  {
    question: "A marca vale em todo o Brasil?",
    answer: "Sim. O registro no INPI garante proteção em todo o território nacional. Se você precisar de proteção internacional, também podemos orientar sobre os procedimentos necessários.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="badge-premium mb-4 inline-flex">Dúvidas Frequentes</span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Perguntas{" "}
            <span className="gradient-text">frequentes</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Tire suas dúvidas sobre o processo de registro de marca.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass-card px-6 border-none"
              >
                <AccordionTrigger className="text-left font-display font-semibold hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
