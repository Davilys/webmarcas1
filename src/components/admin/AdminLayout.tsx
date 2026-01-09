import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Menu,
  Shield,
  ChevronRight,
  Scale,
  BookOpen,
  UserPlus,
  FileSignature,
  FileStack,
  Database,
  MessageCircle,
  Mail,
} from 'lucide-react';
import logo from '@/assets/webmarcas-logo.png';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: UserPlus, label: 'Leads', href: '/admin/leads' },
  { icon: Users, label: 'Clientes', href: '/admin/clientes' },
  { icon: FileSignature, label: 'Contratos', href: '/admin/contratos' },
  { icon: FileStack, label: 'Modelos de Contrato', href: '/admin/modelos-contrato' },
  { icon: FolderOpen, label: 'Documentos', href: '/admin/documentos' },
  { icon: CreditCard, label: 'Financeiro', href: '/admin/financeiro' },
  { icon: Mail, label: 'Emails', href: '/admin/emails' },
  { icon: MessageCircle, label: 'Chat ao Vivo', href: '/admin/chat-ao-vivo' },
  { icon: Bell, label: 'Notificações', href: '/admin/notificacoes' },
  { icon: BookOpen, label: 'Revista INPI', href: '/admin/revista-inpi' },
  { icon: Scale, label: 'Recursos INPI', href: '/admin/recursos-inpi' },
  { icon: Database, label: 'Integração Perfex', href: '/admin/integracao-perfex' },
  { icon: Settings, label: 'Configurações', href: '/admin/configuracoes' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/cliente/login');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roles) {
        toast.error('Acesso negado. Você não tem permissão de administrador.');
        navigate('/cliente/dashboard');
        return;
      }

      setIsAdmin(true);
    };

    checkAdmin();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso');
    navigate('/cliente/login');
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="WebMarcas" className="h-10" />
        </Link>
        <div className="mt-2 flex items-center gap-2 text-xs text-primary">
          <Shield className="h-4 w-4" />
          <span className="font-medium">Painel Administrativo</span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1'
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <IconComponent className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                {item.label}
                {isActive && <ChevronRight className="ml-auto h-4 w-4 animate-pulse" />}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t space-y-1">
        <Link
          to="/cliente/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Users className="h-5 w-5" />
          Área do Cliente
        </Link>
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
        {navContent}
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
            {navContent}
          </SheetContent>
        </Sheet>

        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="WebMarcas" className="h-8" />
          <Shield className="h-4 w-4 text-primary" />
        </Link>

        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/notificacoes')}>
          <Bell className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8 animate-page-enter">{children}</div>
      </main>
    </div>
  );
}
