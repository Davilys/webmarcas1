import { ReactNode } from 'react';
import webmarcasLogo from '@/assets/webmarcas-logo-new.png';
import { Instagram, MessageCircle, Mail, Phone } from 'lucide-react';

interface CheckoutLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  badge?: string;
}

const CheckoutLayout = ({ children, title, subtitle, badge }: CheckoutLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header com logo */}
      <header className="py-6 px-4">
        <div className="flex justify-center">
          <img 
            src={webmarcasLogo} 
            alt="WebMarcas" 
            className="h-10 md:h-12 object-contain"
          />
        </div>
      </header>

      {/* Título da página */}
      {(badge || title) && (
        <div className="text-center px-4 mb-8">
          {badge && (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              {badge}
            </span>
          )}
          {title && (
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="max-w-lg mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8">
          {children}
        </div>
      </main>

      {/* Footer mínimo */}
      <footer className="py-8 px-4 border-t border-slate-100 bg-white/50">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-6 mb-4">
            <a 
              href="https://instagram.com/webmarcasbrasil" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"
            >
              <Instagram className="w-5 h-5" />
              <span className="text-sm hidden sm:inline">Instagram</span>
            </a>
            <a 
              href="https://wa.me/5511999999999" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-500 hover:text-green-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm hidden sm:inline">WhatsApp</span>
            </a>
            <a 
              href="mailto:contato@webmarcas.com.br"
              className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span className="text-sm hidden sm:inline">Email</span>
            </a>
            <a 
              href="tel:+551140028922"
              className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span className="text-sm hidden sm:inline">Telefone</span>
            </a>
          </div>
          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} WebMarcas Brasil. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CheckoutLayout;
