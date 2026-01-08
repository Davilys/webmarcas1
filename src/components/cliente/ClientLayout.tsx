import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  Bell,
  ChevronRight,
} from 'lucide-react';
import logo from '@/assets/webmarcas-logo.png';
import { cn } from '@/lib/utils';

interface ClientLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/cliente/dashboard' },
  { icon: FileText, label: 'Meus Processos', href: '/cliente/processos' },
  { icon: FolderOpen, label: 'Documentos', href: '/cliente/documentos' },
  { icon: CreditCard, label: 'Financeiro', href: '/cliente/financeiro' },
  { icon: MessageSquare, label: 'Suporte IA', href: '/cliente/suporte' },
  { icon: Settings, label: 'Configurações', href: '/cliente/configuracoes' },
];

export function ClientLayout({ children }: ClientLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso');
    navigate('/cliente/login');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Link to="/">
          <img src={logo} alt="WebMarcas" className="h-10" />
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r bg-card">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 flex items-center justify-between h-16 px-4 border-b bg-card">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <NavContent />
          </SheetContent>
        </Sheet>

        <Link to="/">
          <img src={logo} alt="WebMarcas" className="h-8" />
        </Link>

        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
