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
    "footer.rights": "Todos os direitos reservados.",
    
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
    "footer.rights": "All rights reserved.",
    
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
    "footer.rights": "Todos los derechos reservados.",
    
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
