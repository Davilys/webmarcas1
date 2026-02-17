import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, FileCheck, CheckCircle, ArrowRight, Blocks, Globe, Fingerprint, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

const RegistroBlockchain = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const features = [
    {
      icon: Lock,
      title: "Imutabilidade Total",
      description: "Uma vez registrado, o hash do documento não pode ser alterado ou falsificado por ninguém.",
    },
    {
      icon: Fingerprint,
      title: "Prova de Autenticidade",
      description: "Cada documento recebe um hash SHA-256 único, vinculado ao conteúdo e à assinatura.",
    },
    {
      icon: Globe,
      title: "Verificação Pública",
      description: "Qualquer pessoa pode verificar a autenticidade do documento a qualquer momento via QR Code.",
    },
    {
      icon: FileCheck,
      title: "Validade Jurídica",
      description: "Registro conforme Lei 14.063/2020, com carimbo de tempo OpenTimestamps na rede Bitcoin.",
    },
  ];

  const steps = [
    { number: "01", title: "Envie seu documento", description: "Faça upload do contrato, procuração ou qualquer documento que deseja registrar." },
    { number: "02", title: "Geração do Hash", description: "Nosso sistema gera automaticamente um hash SHA-256 único do conteúdo." },
    { number: "03", title: "Registro em Blockchain", description: "O hash é registrado na rede Bitcoin via OpenTimestamps com prova criptográfica." },
    { number: "04", title: "Certificado emitido", description: "Você recebe o certificado com QR Code de verificação e arquivo .ots de prova." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                  <Blocks className="w-4 h-4" />
                  Tecnologia Blockchain
                </span>

                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Registro de Documentos em{" "}
                  <span className="gradient-text">Blockchain</span>
                </h1>

                <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                  Garanta a autenticidade e integridade dos seus documentos com registro imutável na rede Bitcoin. Prova de existência com validade jurídica.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="https://registro.webmarcas.net"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-8">
                      Registrar Agora
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                  <Button size="lg" variant="outline" className="gap-2 text-base" asChild>
                    <a href="#como-funciona">
                      Como Funciona
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </motion.div>

              {/* Pricing highlight */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-12"
              >
                <Card className="max-w-md mx-auto border-primary/20 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-primary uppercase tracking-wider">Oferta Especial</span>
                    </div>
                    <p className="text-3xl font-bold mb-1">
                      1º Registro <span className="gradient-text">Grátis</span>
                    </p>
                    <p className="text-muted-foreground text-sm mb-3">
                      A partir do 2º registro apenas
                    </p>
                    <p className="text-4xl font-bold text-foreground">
                      R$ 49<span className="text-lg text-muted-foreground">,00</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">por documento registrado</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Por que usar <span className="gradient-text">Blockchain</span>?
              </h2>
              <p className="text-muted-foreground text-lg">
                A tecnologia que garante segurança absoluta para seus documentos mais importantes.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Como <span className="gradient-text">Funciona</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Processo simples e rápido em 4 etapas.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-5xl font-bold text-primary/20 mb-4">{step.number}</div>
                  <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Proteja seus documentos <span className="gradient-text">agora</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Comece gratuitamente. Seu primeiro registro em blockchain é por nossa conta.
              </p>
              <a
                href="https://registro.webmarcas.net"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="gap-2 text-base px-8">
                  Acessar Plataforma de Registro
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default RegistroBlockchain;
