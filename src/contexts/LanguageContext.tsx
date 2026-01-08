import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Language = "pt" | "en" | "es";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Header
    "nav.home": "Início",
    "nav.benefits": "Benefícios",
    "nav.howItWorks": "Como Funciona",
    "nav.pricing": "Preços",
    "nav.faq": "FAQ",
    "nav.clientArea": "Área do Cliente",
    "nav.checkBrand": "Consultar Marca",
    
    // Hero
    "hero.badge": "Líder em Registro de Marcas no Brasil",
    "hero.title": "Registre sua marca e",
    "hero.phrase1": "proteja seu negócio",
    "hero.phrase2": "seja exclusivo!",
    "hero.phrase3": "torne ela única!",
    "hero.subtitle": "Processo 100% online, protocolo em até 48h e garantia de registro. Dono da marca é quem registra primeiro. Proteja-se agora.",
    "hero.cta.check": "Consultar viabilidade",
    "hero.cta.register": "Registrar por R$699",
    "hero.trust.inpi": "Registro Nacional INPI",
    "hero.trust.protocol": "Protocolo em 48h",
    "hero.trust.guarantee": "Garantia de Registro",
    "hero.trust.online": "Processo 100% Online",
    "hero.stats.brands": "Marcas Registradas",
    "hero.stats.success": "Taxa de Sucesso",
    "hero.stats.time": "Tempo de Protocolo",
    "hero.stats.experience": "Anos de Experiência",
    "hero.urgency": "Oferta válida até",
    
    // Benefits Section
    "benefits.badge": "Por que a WebMarcas?",
    "benefits.title": "Por que registrar com a",
    "benefits.titleHighlight": "WebMarcas",
    "benefits.subtitle": "Combinamos experiência jurídica com tecnologia para oferecer o melhor serviço de registro de marcas do Brasil.",
    "benefits.protection.title": "Proteção Nacional",
    "benefits.protection.desc": "Sua marca protegida em todo território brasileiro, impedindo que outros usem seu nome.",
    "benefits.report.title": "Laudo de Viabilidade",
    "benefits.report.desc": "Análise prévia gratuita que avalia as chances de sucesso do seu registro.",
    "benefits.protocol.title": "Protocolo em 48h",
    "benefits.protocol.desc": "Após aprovação do pagamento, protocolamos sua marca no INPI em até 48 horas.",
    "benefits.legal.title": "Segurança Jurídica",
    "benefits.legal.desc": "Processo conduzido por especialistas em propriedade intelectual.",
    "benefits.tracking.title": "Acompanhamento Completo",
    "benefits.tracking.desc": "Monitoramos todo o processo no INPI e respondemos a todas as exigências.",
    "benefits.support.title": "Suporte Dedicado",
    "benefits.support.desc": "Atendimento humanizado via WhatsApp e área do cliente exclusiva.",
    
    // How It Works Section
    "howItWorks.badge": "Passo a Passo",
    "howItWorks.title": "Como funciona o",
    "howItWorks.titleHighlight": "registro",
    "howItWorks.subtitle": "Processo simples, rápido e 100% online. Você não precisa sair de casa.",
    "howItWorks.step": "PASSO",
    "howItWorks.step1.title": "Consulte a Viabilidade",
    "howItWorks.step1.desc": "Faça uma busca gratuita para verificar se sua marca pode ser registrada.",
    "howItWorks.step2.title": "Preencha os Dados",
    "howItWorks.step2.desc": "Informe os dados da sua empresa e da marca que deseja proteger.",
    "howItWorks.step3.title": "Escolha o Pagamento",
    "howItWorks.step3.desc": "Selecione a forma de pagamento: à vista ou parcelado em até 6x.",
    "howItWorks.step4.title": "Assine o Contrato",
    "howItWorks.step4.desc": "Contrato digital gerado automaticamente. Assinatura com um clique.",
    "howItWorks.step5.title": "Acompanhe o Processo",
    "howItWorks.step5.desc": "Acesse sua área exclusiva e acompanhe todo o andamento no INPI.",
    
    // Pricing Section
    "pricing.badge": "Investimento",
    "pricing.title": "Invista na proteção da sua",
    "pricing.titleHighlight": "marca",
    "pricing.subtitle": "Preço único e transparente. Sem taxas ocultas. Taxas do INPI cobradas à parte.",
    "pricing.recommended": "MAIS ESCOLHIDO",
    "pricing.planName": "Registro de Marca Completo",
    "pricing.planDesc": "Tudo que você precisa para proteger sua marca",
    "pricing.price": "R$699",
    "pricing.priceLabel": "à vista",
    "pricing.installments1": "ou",
    "pricing.installments2": "no cartão",
    "pricing.installments3": "no boleto",
    "pricing.feature1": "Busca de viabilidade completa",
    "pricing.feature2": "Laudo técnico detalhado",
    "pricing.feature3": "Preparo do pedido de registro",
    "pricing.feature4": "Protocolo no INPI em até 48h",
    "pricing.feature5": "Acompanhamento do processo",
    "pricing.feature6": "Área do cliente exclusiva",
    "pricing.feature7": "Suporte via WhatsApp",
    "pricing.feature8": "Garantia de nova tentativa",
    "pricing.feature9": "Vigência de 10 anos",
    "pricing.cta": "Registrar por R$699",
    "pricing.urgency": "Oferta válida até",
    "pricing.disclaimer": "* Taxas do INPI (GRU) são cobradas à parte pelo órgão.",
    
    // Testimonials Section
    "testimonials.badge": "Depoimentos",
    "testimonials.title": "O que nossos clientes",
    "testimonials.titleHighlight": "dizem",
    "testimonials.subtitle": "Milhares de marcas protegidas e clientes satisfeitos em todo o Brasil.",
    
    // FAQ Section
    "faq.badge": "Dúvidas Frequentes",
    "faq.title": "Perguntas",
    "faq.titleHighlight": "frequentes",
    "faq.subtitle": "Tire suas dúvidas sobre o processo de registro de marca.",
    "faq.q1": "O que é o registro de marca e por que é importante?",
    "faq.a1": "O registro de marca é o processo legal que garante a propriedade exclusiva do uso de um nome, logo ou símbolo para identificar produtos ou serviços. É importante porque impede que terceiros usem sua marca sem autorização, protegendo seu investimento e reputação no mercado.",
    "faq.q2": "Quanto tempo leva o processo de registro?",
    "faq.a2": "O protocolo no INPI é feito em até 48 horas após a aprovação do pagamento. O processo completo de análise pelo INPI pode levar de 12 a 24 meses, dependendo da complexidade do caso. Durante todo esse período, você já tem a proteção da data de depósito.",
    "faq.q3": "O que está incluído no valor de R$699?",
    "faq.a3": "O valor inclui: busca de viabilidade, laudo técnico, preparo do pedido, protocolo no INPI, acompanhamento completo do processo, resposta a eventuais exigências, acesso à área do cliente e suporte via WhatsApp. As taxas do INPI (GRU) são cobradas à parte pelo órgão.",
    "faq.q4": "O que é a garantia de registro?",
    "faq.a4": "Se sua marca for indeferida por motivos que não foram identificados na nossa análise de viabilidade, fazemos uma nova tentativa de registro sem custo adicional. Isso demonstra nossa confiança na qualidade do nosso trabalho.",
    "faq.q5": "Quais são as taxas do INPI?",
    "faq.a5": "As taxas do INPI variam conforme o porte da empresa. Para microempresas e MEIs, há descontos de até 60%. As principais taxas são: pedido de registro (cerca de R$142 a R$355) e concessão (cerca de R$298 a R$745). Orientamos sobre todos os valores durante o processo.",
    "faq.q6": "Preciso ter CNPJ para registrar uma marca?",
    "faq.a6": "Não é obrigatório. Pessoas físicas também podem registrar marcas. No entanto, a marca deve ter relação com as atividades exercidas pelo titular. Orientamos cada caso para garantir a melhor estratégia de proteção.",
    "faq.q7": "Como funciona a busca de viabilidade?",
    "faq.a7": "Realizamos uma pesquisa completa no banco de dados do INPI para identificar marcas similares ou idênticas que possam impedir seu registro. Você recebe um laudo com a análise de risco e nossa recomendação técnica.",
    "faq.q8": "A marca vale em todo o Brasil?",
    "faq.a8": "Sim. O registro no INPI garante proteção em todo o território nacional. Se você precisar de proteção internacional, também podemos orientar sobre os procedimentos necessários.",
    
    // CTA Section
    "cta.title": "Proteja sua marca",
    "cta.titleHighlight": "hoje mesmo",
    "cta.subtitle": "Não deixe para depois. O dono da marca é quem registra primeiro. Inicie agora e garanta a proteção do seu negócio.",
    "cta.button1": "Consultar viabilidade grátis",
    "cta.button2": "Falar com especialista",
    
    // Viability
    "viability.badge": "Busca Gratuita",
    "viability.title": "Consulte a viabilidade da sua",
    "viability.titleHighlight": "marca",
    "viability.subtitle": "Verifique gratuitamente se sua marca pode ser registrada no INPI.",
    "viability.brandName": "Nome da Marca",
    "viability.brandPlaceholder": "Ex: WebMarcas",
    "viability.businessArea": "Ramo de Atividade",
    "viability.businessPlaceholder": "Ex: Serviços Jurídicos",
    "viability.button": "Consultar Viabilidade",
    "viability.searching": "Consultando INPI...",
    "viability.required": "Campos obrigatórios",
    "viability.requiredDesc": "Por favor, preencha o nome da marca e o ramo de atividade.",
    "viability.error": "Erro na consulta",
    "viability.errorDesc": "Não foi possível realizar a consulta. Tente novamente.",
    "viability.laudoTitle": "Laudo Técnico de Viabilidade",
    "viability.print": "Imprimir / Salvar Laudo",
    "viability.warning": "O dono da marca é quem registra primeiro. Mesmo com alta viabilidade, a situação pode mudar a qualquer momento se outra pessoa protocolar antes de você.",
    "viability.registerNow": "🚀 Registrar minha marca agora",
    "viability.talkExpert": "Falar com especialista",
    "viability.newSearch": "Fazer nova consulta",
    
    // Footer
    "footer.description": "Especialistas em registro de marcas no INPI. Proteja seu negócio com segurança jurídica e processo 100% online.",
    "footer.quickLinks": "Links Rápidos",
    "footer.services": "Serviços",
    "footer.contact": "Contato",
    "footer.service1": "Registro de Marca",
    "footer.service2": "Busca de Viabilidade",
    "footer.service3": "Acompanhamento INPI",
    "footer.service4": "Consultoria Jurídica",
    "footer.service5": "Área do Cliente",
    "footer.rights": "Todos os direitos reservados.",
    "footer.privacy": "Política de Privacidade",
    "footer.terms": "Termos de Uso",
    
    // Social Proof
    "social.registered": "acabou de registrar a marca:",
    "social.consulted": "consultou a marca:",
    "social.secured": "garantiu o registro da marca:",
    "social.started": "iniciou o registro da marca:",
    "social.protected": "protegeu sua marca há 1 minuto",
    "social.stat1": "+10.000 marcas já foram registradas na WebMarcas",
    "social.stat2": "98% de taxa de sucesso em registros",
    "social.stat3": "Mais de 500 marcas registradas este mês",
    "social.now": "Agora mesmo",
    
    // Common
    "common.important": "Importante:",
  },
  en: {
    // Header
    "nav.home": "Home",
    "nav.benefits": "Benefits",
    "nav.howItWorks": "How It Works",
    "nav.pricing": "Pricing",
    "nav.faq": "FAQ",
    "nav.clientArea": "Client Area",
    "nav.checkBrand": "Check Brand",
    
    // Hero
    "hero.badge": "Leader in Trademark Registration in Brazil",
    "hero.title": "Register your brand and",
    "hero.phrase1": "protect your business",
    "hero.phrase2": "be exclusive!",
    "hero.phrase3": "make it unique!",
    "hero.subtitle": "100% online process, protocol within 48h and registration guarantee. Brand owner is who registers first. Protect yourself now.",
    "hero.cta.check": "Check viability",
    "hero.cta.register": "Register for R$699",
    "hero.trust.inpi": "National INPI Registration",
    "hero.trust.protocol": "Protocol in 48h",
    "hero.trust.guarantee": "Registration Guarantee",
    "hero.trust.online": "100% Online Process",
    "hero.stats.brands": "Registered Brands",
    "hero.stats.success": "Success Rate",
    "hero.stats.time": "Protocol Time",
    "hero.stats.experience": "Years of Experience",
    "hero.urgency": "Offer valid until",
    
    // Benefits Section
    "benefits.badge": "Why WebMarcas?",
    "benefits.title": "Why register with",
    "benefits.titleHighlight": "WebMarcas",
    "benefits.subtitle": "We combine legal expertise with technology to offer the best trademark registration service in Brazil.",
    "benefits.protection.title": "National Protection",
    "benefits.protection.desc": "Your brand protected throughout Brazilian territory, preventing others from using your name.",
    "benefits.report.title": "Viability Report",
    "benefits.report.desc": "Free preliminary analysis that evaluates the chances of success of your registration.",
    "benefits.protocol.title": "Protocol in 48h",
    "benefits.protocol.desc": "After payment approval, we file your trademark at INPI within 48 hours.",
    "benefits.legal.title": "Legal Security",
    "benefits.legal.desc": "Process conducted by intellectual property specialists.",
    "benefits.tracking.title": "Complete Monitoring",
    "benefits.tracking.desc": "We monitor the entire process at INPI and respond to all requirements.",
    "benefits.support.title": "Dedicated Support",
    "benefits.support.desc": "Humanized service via WhatsApp and exclusive client area.",
    
    // How It Works Section
    "howItWorks.badge": "Step by Step",
    "howItWorks.title": "How does the",
    "howItWorks.titleHighlight": "registration",
    "howItWorks.subtitle": "Simple, fast and 100% online process. You don't need to leave home.",
    "howItWorks.step": "STEP",
    "howItWorks.step1.title": "Check Viability",
    "howItWorks.step1.desc": "Do a free search to verify if your brand can be registered.",
    "howItWorks.step2.title": "Fill in the Data",
    "howItWorks.step2.desc": "Provide your company details and the brand you want to protect.",
    "howItWorks.step3.title": "Choose Payment",
    "howItWorks.step3.desc": "Select payment method: full payment or up to 6 installments.",
    "howItWorks.step4.title": "Sign the Contract",
    "howItWorks.step4.desc": "Automatically generated digital contract. One-click signature.",
    "howItWorks.step5.title": "Track the Process",
    "howItWorks.step5.desc": "Access your exclusive area and track all progress at INPI.",
    
    // Pricing Section
    "pricing.badge": "Investment",
    "pricing.title": "Invest in protecting your",
    "pricing.titleHighlight": "brand",
    "pricing.subtitle": "Unique and transparent pricing. No hidden fees. INPI fees charged separately.",
    "pricing.recommended": "MOST CHOSEN",
    "pricing.planName": "Complete Trademark Registration",
    "pricing.planDesc": "Everything you need to protect your brand",
    "pricing.price": "R$699",
    "pricing.priceLabel": "full payment",
    "pricing.installments1": "or",
    "pricing.installments2": "by card",
    "pricing.installments3": "by bank slip",
    "pricing.feature1": "Complete viability search",
    "pricing.feature2": "Detailed technical report",
    "pricing.feature3": "Registration request preparation",
    "pricing.feature4": "INPI protocol within 48h",
    "pricing.feature5": "Process monitoring",
    "pricing.feature6": "Exclusive client area",
    "pricing.feature7": "WhatsApp support",
    "pricing.feature8": "New attempt guarantee",
    "pricing.feature9": "10-year validity",
    "pricing.cta": "Register for R$699",
    "pricing.urgency": "Offer valid until",
    "pricing.disclaimer": "* INPI fees (GRU) are charged separately by the agency.",
    
    // Testimonials Section
    "testimonials.badge": "Testimonials",
    "testimonials.title": "What our clients",
    "testimonials.titleHighlight": "say",
    "testimonials.subtitle": "Thousands of protected brands and satisfied clients throughout Brazil.",
    
    // FAQ Section
    "faq.badge": "Frequently Asked Questions",
    "faq.title": "Frequently",
    "faq.titleHighlight": "asked questions",
    "faq.subtitle": "Clear your doubts about the trademark registration process.",
    "faq.q1": "What is trademark registration and why is it important?",
    "faq.a1": "Trademark registration is the legal process that guarantees exclusive ownership of the use of a name, logo or symbol to identify products or services. It is important because it prevents third parties from using your brand without authorization, protecting your investment and reputation in the market.",
    "faq.q2": "How long does the registration process take?",
    "faq.a2": "The protocol at INPI is done within 48 hours after payment approval. The complete analysis process by INPI can take 12 to 24 months, depending on the complexity of the case. Throughout this period, you already have protection from the filing date.",
    "faq.q3": "What is included in the R$699 price?",
    "faq.a3": "The price includes: viability search, technical report, request preparation, INPI protocol, complete process monitoring, response to any requirements, client area access and WhatsApp support. INPI fees (GRU) are charged separately by the agency.",
    "faq.q4": "What is the registration guarantee?",
    "faq.a4": "If your brand is rejected for reasons that were not identified in our viability analysis, we make a new registration attempt at no additional cost. This demonstrates our confidence in the quality of our work.",
    "faq.q5": "What are the INPI fees?",
    "faq.a5": "INPI fees vary according to company size. For micro-enterprises and MEIs, there are discounts of up to 60%. The main fees are: registration request (about R$142 to R$355) and grant (about R$298 to R$745). We guide you on all values during the process.",
    "faq.q6": "Do I need a CNPJ to register a trademark?",
    "faq.a6": "It is not mandatory. Individuals can also register trademarks. However, the brand must be related to the activities performed by the holder. We guide each case to ensure the best protection strategy.",
    "faq.q7": "How does the viability search work?",
    "faq.a7": "We conduct a complete search in the INPI database to identify similar or identical brands that may prevent your registration. You receive a report with risk analysis and our technical recommendation.",
    "faq.q8": "Is the trademark valid throughout Brazil?",
    "faq.a8": "Yes. INPI registration guarantees protection throughout the national territory. If you need international protection, we can also guide you on the necessary procedures.",
    
    // CTA Section
    "cta.title": "Protect your brand",
    "cta.titleHighlight": "today",
    "cta.subtitle": "Don't leave it for later. The brand owner is who registers first. Start now and guarantee your business protection.",
    "cta.button1": "Check viability for free",
    "cta.button2": "Talk to an expert",
    
    // Viability
    "viability.badge": "Free Search",
    "viability.title": "Check the viability of your",
    "viability.titleHighlight": "brand",
    "viability.subtitle": "Check for free if your brand can be registered at INPI.",
    "viability.brandName": "Brand Name",
    "viability.brandPlaceholder": "Ex: WebMarcas",
    "viability.businessArea": "Business Area",
    "viability.businessPlaceholder": "Ex: Legal Services",
    "viability.button": "Check Viability",
    "viability.searching": "Checking INPI...",
    "viability.required": "Required fields",
    "viability.requiredDesc": "Please fill in the brand name and business area.",
    "viability.error": "Query error",
    "viability.errorDesc": "Could not complete the query. Try again.",
    "viability.laudoTitle": "Technical Viability Report",
    "viability.print": "Print / Save Report",
    "viability.warning": "The brand owner is who registers first. Even with high viability, the situation can change at any time if someone else files before you.",
    "viability.registerNow": "🚀 Register my brand now",
    "viability.talkExpert": "Talk to an expert",
    "viability.newSearch": "New search",
    
    // Footer
    "footer.description": "Specialists in INPI trademark registration. Protect your business with legal security and 100% online process.",
    "footer.quickLinks": "Quick Links",
    "footer.services": "Services",
    "footer.contact": "Contact",
    "footer.service1": "Trademark Registration",
    "footer.service2": "Viability Search",
    "footer.service3": "INPI Monitoring",
    "footer.service4": "Legal Consulting",
    "footer.service5": "Client Area",
    "footer.rights": "All rights reserved.",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Use",
    
    // Social Proof
    "social.registered": "just registered the brand:",
    "social.consulted": "checked the brand:",
    "social.secured": "secured the registration of:",
    "social.started": "started registering the brand:",
    "social.protected": "protected their brand 1 minute ago",
    "social.stat1": "+10,000 brands already registered at WebMarcas",
    "social.stat2": "98% success rate in registrations",
    "social.stat3": "Over 500 brands registered this month",
    "social.now": "Just now",
    
    // Common
    "common.important": "Important:",
  },
  es: {
    // Header
    "nav.home": "Inicio",
    "nav.benefits": "Beneficios",
    "nav.howItWorks": "Cómo Funciona",
    "nav.pricing": "Precios",
    "nav.faq": "FAQ",
    "nav.clientArea": "Área del Cliente",
    "nav.checkBrand": "Consultar Marca",
    
    // Hero
    "hero.badge": "Líder en Registro de Marcas en Brasil",
    "hero.title": "Registra tu marca y",
    "hero.phrase1": "protege tu negocio",
    "hero.phrase2": "¡sé exclusivo!",
    "hero.phrase3": "¡hazla única!",
    "hero.subtitle": "Proceso 100% online, protocolo en hasta 48h y garantía de registro. El dueño de la marca es quien registra primero. Protégete ahora.",
    "hero.cta.check": "Consultar viabilidad",
    "hero.cta.register": "Registrar por R$699",
    "hero.trust.inpi": "Registro Nacional INPI",
    "hero.trust.protocol": "Protocolo en 48h",
    "hero.trust.guarantee": "Garantía de Registro",
    "hero.trust.online": "Proceso 100% Online",
    "hero.stats.brands": "Marcas Registradas",
    "hero.stats.success": "Tasa de Éxito",
    "hero.stats.time": "Tiempo de Protocolo",
    "hero.stats.experience": "Años de Experiencia",
    "hero.urgency": "Oferta válida hasta",
    
    // Benefits Section
    "benefits.badge": "¿Por qué WebMarcas?",
    "benefits.title": "¿Por qué registrar con",
    "benefits.titleHighlight": "WebMarcas",
    "benefits.subtitle": "Combinamos experiencia jurídica con tecnología para ofrecer el mejor servicio de registro de marcas de Brasil.",
    "benefits.protection.title": "Protección Nacional",
    "benefits.protection.desc": "Tu marca protegida en todo el territorio brasileño, impidiendo que otros usen tu nombre.",
    "benefits.report.title": "Informe de Viabilidad",
    "benefits.report.desc": "Análisis previo gratuito que evalúa las posibilidades de éxito de tu registro.",
    "benefits.protocol.title": "Protocolo en 48h",
    "benefits.protocol.desc": "Después de la aprobación del pago, protocolamos tu marca en INPI en hasta 48 horas.",
    "benefits.legal.title": "Seguridad Jurídica",
    "benefits.legal.desc": "Proceso conducido por especialistas en propiedad intelectual.",
    "benefits.tracking.title": "Seguimiento Completo",
    "benefits.tracking.desc": "Monitoreamos todo el proceso en INPI y respondemos a todas las exigencias.",
    "benefits.support.title": "Soporte Dedicado",
    "benefits.support.desc": "Atención humanizada via WhatsApp y área del cliente exclusiva.",
    
    // How It Works Section
    "howItWorks.badge": "Paso a Paso",
    "howItWorks.title": "¿Cómo funciona el",
    "howItWorks.titleHighlight": "registro",
    "howItWorks.subtitle": "Proceso simple, rápido y 100% online. No necesitas salir de casa.",
    "howItWorks.step": "PASO",
    "howItWorks.step1.title": "Consulta la Viabilidad",
    "howItWorks.step1.desc": "Haz una búsqueda gratuita para verificar si tu marca puede ser registrada.",
    "howItWorks.step2.title": "Completa los Datos",
    "howItWorks.step2.desc": "Informa los datos de tu empresa y de la marca que deseas proteger.",
    "howItWorks.step3.title": "Elige el Pago",
    "howItWorks.step3.desc": "Selecciona la forma de pago: al contado o en hasta 6 cuotas.",
    "howItWorks.step4.title": "Firma el Contrato",
    "howItWorks.step4.desc": "Contrato digital generado automáticamente. Firma con un clic.",
    "howItWorks.step5.title": "Sigue el Proceso",
    "howItWorks.step5.desc": "Accede a tu área exclusiva y sigue todo el progreso en INPI.",
    
    // Pricing Section
    "pricing.badge": "Inversión",
    "pricing.title": "Invierte en la protección de tu",
    "pricing.titleHighlight": "marca",
    "pricing.subtitle": "Precio único y transparente. Sin tarifas ocultas. Tasas de INPI cobradas aparte.",
    "pricing.recommended": "MÁS ELEGIDO",
    "pricing.planName": "Registro de Marca Completo",
    "pricing.planDesc": "Todo lo que necesitas para proteger tu marca",
    "pricing.price": "R$699",
    "pricing.priceLabel": "al contado",
    "pricing.installments1": "o",
    "pricing.installments2": "con tarjeta",
    "pricing.installments3": "con boleto",
    "pricing.feature1": "Búsqueda de viabilidad completa",
    "pricing.feature2": "Informe técnico detallado",
    "pricing.feature3": "Preparación de la solicitud de registro",
    "pricing.feature4": "Protocolo en INPI en hasta 48h",
    "pricing.feature5": "Seguimiento del proceso",
    "pricing.feature6": "Área del cliente exclusiva",
    "pricing.feature7": "Soporte via WhatsApp",
    "pricing.feature8": "Garantía de nuevo intento",
    "pricing.feature9": "Vigencia de 10 años",
    "pricing.cta": "Registrar por R$699",
    "pricing.urgency": "Oferta válida hasta",
    "pricing.disclaimer": "* Las tasas de INPI (GRU) se cobran aparte por el organismo.",
    
    // Testimonials Section
    "testimonials.badge": "Testimonios",
    "testimonials.title": "Lo que nuestros clientes",
    "testimonials.titleHighlight": "dicen",
    "testimonials.subtitle": "Miles de marcas protegidas y clientes satisfechos en todo Brasil.",
    
    // FAQ Section
    "faq.badge": "Preguntas Frecuentes",
    "faq.title": "Preguntas",
    "faq.titleHighlight": "frecuentes",
    "faq.subtitle": "Resuelve tus dudas sobre el proceso de registro de marca.",
    "faq.q1": "¿Qué es el registro de marca y por qué es importante?",
    "faq.a1": "El registro de marca es el proceso legal que garantiza la propiedad exclusiva del uso de un nombre, logo o símbolo para identificar productos o servicios. Es importante porque impide que terceros usen tu marca sin autorización, protegiendo tu inversión y reputación en el mercado.",
    "faq.q2": "¿Cuánto tiempo tarda el proceso de registro?",
    "faq.a2": "El protocolo en INPI se realiza en hasta 48 horas después de la aprobación del pago. El proceso completo de análisis por INPI puede tardar de 12 a 24 meses, dependiendo de la complejidad del caso. Durante todo ese período, ya tienes protección desde la fecha de depósito.",
    "faq.q3": "¿Qué está incluido en el valor de R$699?",
    "faq.a3": "El valor incluye: búsqueda de viabilidad, informe técnico, preparación de la solicitud, protocolo en INPI, seguimiento completo del proceso, respuesta a eventuales exigencias, acceso al área del cliente y soporte via WhatsApp. Las tasas de INPI (GRU) se cobran aparte por el organismo.",
    "faq.q4": "¿Qué es la garantía de registro?",
    "faq.a4": "Si tu marca es rechazada por motivos que no fueron identificados en nuestro análisis de viabilidad, hacemos un nuevo intento de registro sin costo adicional. Esto demuestra nuestra confianza en la calidad de nuestro trabajo.",
    "faq.q5": "¿Cuáles son las tasas de INPI?",
    "faq.a5": "Las tasas de INPI varían según el tamaño de la empresa. Para microempresas y MEIs, hay descuentos de hasta 60%. Las principales tasas son: solicitud de registro (cerca de R$142 a R$355) y concesión (cerca de R$298 a R$745). Te orientamos sobre todos los valores durante el proceso.",
    "faq.q6": "¿Necesito tener CNPJ para registrar una marca?",
    "faq.a6": "No es obligatorio. Las personas físicas también pueden registrar marcas. Sin embargo, la marca debe tener relación con las actividades realizadas por el titular. Orientamos cada caso para garantizar la mejor estrategia de protección.",
    "faq.q7": "¿Cómo funciona la búsqueda de viabilidad?",
    "faq.a7": "Realizamos una búsqueda completa en la base de datos de INPI para identificar marcas similares o idénticas que puedan impedir tu registro. Recibes un informe con el análisis de riesgo y nuestra recomendación técnica.",
    "faq.q8": "¿La marca vale en todo Brasil?",
    "faq.a8": "Sí. El registro en INPI garantiza protección en todo el territorio nacional. Si necesitas protección internacional, también podemos orientarte sobre los procedimientos necesarios.",
    
    // CTA Section
    "cta.title": "Protege tu marca",
    "cta.titleHighlight": "hoy mismo",
    "cta.subtitle": "No lo dejes para después. El dueño de la marca es quien registra primero. Comienza ahora y garantiza la protección de tu negocio.",
    "cta.button1": "Consultar viabilidad gratis",
    "cta.button2": "Hablar con especialista",
    
    // Viability
    "viability.badge": "Búsqueda Gratuita",
    "viability.title": "Consulta la viabilidad de tu",
    "viability.titleHighlight": "marca",
    "viability.subtitle": "Verifica gratis si tu marca puede ser registrada en INPI.",
    "viability.brandName": "Nombre de la Marca",
    "viability.brandPlaceholder": "Ej: WebMarcas",
    "viability.businessArea": "Ramo de Actividad",
    "viability.businessPlaceholder": "Ej: Servicios Jurídicos",
    "viability.button": "Consultar Viabilidad",
    "viability.searching": "Consultando INPI...",
    "viability.required": "Campos obligatorios",
    "viability.requiredDesc": "Por favor, complete el nombre de la marca y el ramo de actividad.",
    "viability.error": "Error en la consulta",
    "viability.errorDesc": "No fue posible realizar la consulta. Intente nuevamente.",
    "viability.laudoTitle": "Informe Técnico de Viabilidad",
    "viability.print": "Imprimir / Guardar Informe",
    "viability.warning": "El dueño de la marca es quien registra primero. Incluso con alta viabilidad, la situación puede cambiar en cualquier momento si otra persona registra antes que usted.",
    "viability.registerNow": "🚀 Registrar mi marca ahora",
    "viability.talkExpert": "Hablar con especialista",
    "viability.newSearch": "Nueva búsqueda",
    
    // Footer
    "footer.description": "Especialistas en registro de marcas en INPI. Protege tu negocio con seguridad jurídica y proceso 100% online.",
    "footer.quickLinks": "Enlaces Rápidos",
    "footer.services": "Servicios",
    "footer.contact": "Contacto",
    "footer.service1": "Registro de Marca",
    "footer.service2": "Búsqueda de Viabilidad",
    "footer.service3": "Seguimiento INPI",
    "footer.service4": "Consultoría Jurídica",
    "footer.service5": "Área del Cliente",
    "footer.rights": "Todos los derechos reservados.",
    "footer.privacy": "Política de Privacidad",
    "footer.terms": "Términos de Uso",
    
    // Social Proof
    "social.registered": "acaba de registrar la marca:",
    "social.consulted": "consultó la marca:",
    "social.secured": "aseguró el registro de la marca:",
    "social.started": "inició el registro de la marca:",
    "social.protected": "protegió su marca hace 1 minuto",
    "social.stat1": "+10.000 marcas ya registradas en WebMarcas",
    "social.stat2": "98% de tasa de éxito en registros",
    "social.stat3": "Más de 500 marcas registradas este mes",
    "social.now": "Ahora mismo",
    
    // Common
    "common.important": "Importante:",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const detectLanguage = (): Language => {
  // Check localStorage first
  const stored = localStorage.getItem("language") as Language | null;
  if (stored && ["pt", "en", "es"].includes(stored)) return stored;
  
  // Detect from browser
  const browserLang = navigator.language.split("-")[0].toLowerCase();
  
  if (browserLang === "pt") return "pt";
  if (browserLang === "es") return "es";
  if (browserLang === "en") return "en";
  
  // Default to Portuguese for Brazil site
  return "pt";
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(detectLanguage);

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
