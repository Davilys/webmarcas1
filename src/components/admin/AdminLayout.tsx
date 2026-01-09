import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
  Shield,
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
import logoIcon from '@/assets/webmarcas-icon.png';
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso');
    navigate('/cliente/login');
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-4">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          {isCollapsed ? (
            <img src={logoIcon} alt="WebMarcas" className="h-8 w-8" />
          ) : (
            <img src={logo} alt="WebMarcas" className="h-10" />
          )}
        </Link>
        {!isCollapsed && (
          <div className="mt-2 flex items-center gap-2 text-xs text-primary">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Painel Administrativo</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.href;
                const IconComponent = item.icon;
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link to={item.href}>
                        <IconComponent className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Área do Cliente">
              <Link to="/cliente/dashboard">
                <Users className="h-5 w-5" />
                <span>Área do Cliente</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sair"
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
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

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-50 flex items-center gap-4 h-14 px-4 border-b bg-card">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">Painel Administrativo</span>
            </div>
          </header>
          
          <main className="p-6 lg:p-8 animate-page-enter">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
