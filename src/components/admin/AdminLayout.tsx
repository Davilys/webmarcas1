import { ReactNode, useState, useEffect, useMemo } from 'react';
import { AdminChatWidget } from '@/components/admin/AdminChatWidget';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePresence } from '@/hooks/usePresence';
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
  MessageCircle,
  Mail,
  ChevronRight,
  Trophy,
  Moon,
  Sun,
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
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAdminPermissions, type PermissionKey } from '@/hooks/useAdminPermissions';

interface AdminLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  subtitle: string;
  href: string;
  iconColor: string;
  iconBg: string;
  permissionKey: PermissionKey;
}

const menuItems: MenuItem[] = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    subtitle: 'Métricas e relatórios',
    href: '/admin/dashboard',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    permissionKey: 'dashboard'
  },
  { 
    icon: UserPlus, 
    label: 'Leads', 
    subtitle: 'Gestão de leads',
    href: '/admin/leads',
    iconColor: 'text-green-500',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    permissionKey: 'leads'
  },
  { 
    icon: Users, 
    label: 'Clientes', 
    subtitle: 'Base de clientes',
    href: '/admin/clientes',
    iconColor: 'text-indigo-500',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    permissionKey: 'clients'
  },
  { 
    icon: FileSignature, 
    label: 'Contratos', 
    subtitle: 'Gestão de contratos',
    href: '/admin/contratos',
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    permissionKey: 'contracts'
  },
  { 
    icon: FileStack, 
    label: 'Modelos de Contrato', 
    subtitle: 'Templates e modelos',
    href: '/admin/modelos-contrato',
    iconColor: 'text-pink-500',
    iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    permissionKey: 'contract_templates'
  },
  { 
    icon: FolderOpen, 
    label: 'Documentos', 
    subtitle: 'Arquivos e anexos',
    href: '/admin/documentos',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    permissionKey: 'documents'
  },
  { 
    icon: CreditCard, 
    label: 'Financeiro', 
    subtitle: 'Pagamentos e faturas',
    href: '/admin/financeiro',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    permissionKey: 'financial'
  },
  { 
    icon: Mail, 
    label: 'Emails', 
    subtitle: 'Comunicação e templates',
    href: '/admin/emails',
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    permissionKey: 'emails'
  },
  { 
    icon: MessageCircle, 
    label: 'Chat ao Vivo', 
    subtitle: 'Atendimento em tempo real',
    href: '/admin/chat-ao-vivo',
    iconColor: 'text-teal-500',
    iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    permissionKey: 'live_chat'
  },
  { 
    icon: Bell, 
    label: 'Notificações', 
    subtitle: 'Alertas e avisos',
    href: '/admin/notificacoes',
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    permissionKey: 'notifications'
  },
  { 
    icon: BookOpen, 
    label: 'Revista INPI', 
    subtitle: 'Publicações oficiais',
    href: '/admin/revista-inpi',
    iconColor: 'text-cyan-500',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    permissionKey: 'inpi_magazine'
  },
  { 
    icon: Scale, 
    label: 'Recursos INPI', 
    subtitle: 'Recursos e petições',
    href: '/admin/recursos-inpi',
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    permissionKey: 'inpi_resources'
  },
  { 
    icon: Trophy, 
    label: 'Premiação', 
    subtitle: 'Metas e bonificações',
    href: '/admin/premiacao',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    permissionKey: 'awards'
  },
  { 
    icon: Settings, 
    label: 'Configurações', 
    subtitle: 'Preferências do sistema',
    href: '/admin/configuracoes',
    iconColor: 'text-zinc-500',
    iconBg: 'bg-zinc-100 dark:bg-zinc-900/30',
    permissionKey: 'settings'
  },
];

function SidebarMenuItemCustom({ item, isActive, isCollapsed }: { 
  item: MenuItem; 
  isActive: boolean;
  isCollapsed: boolean;
}) {
  const IconComponent = item.icon;
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={isCollapsed ? `${item.label} - ${item.subtitle}` : undefined}
        className={cn(
          "group/item h-auto py-2.5 px-3 transition-all duration-200",
          "hover:bg-accent/60 hover:shadow-sm",
          isActive && "bg-accent shadow-md"
        )}
      >
        <Link to={item.href} className="flex items-center gap-3">
          {/* Icon Container */}
          <div className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
            item.iconBg,
            "group-hover/item:scale-110 group-hover/item:shadow-sm",
            isActive && "scale-105 shadow-md"
          )}>
            <IconComponent className={cn(
              "w-5 h-5 transition-transform duration-200",
              item.iconColor
            )} />
          </div>
          
          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-medium text-sm leading-tight",
              isActive ? "text-foreground" : "text-foreground/80"
            )}>
              {item.label}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {item.subtitle}
            </p>
          </div>
          
          {/* Active Indicator */}
          {isActive && (
            <ChevronRight className="w-4 h-4 text-primary animate-fade-in" />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { permissions, isLoading: loadingPermissions } = useAdminPermissions();

  // Filter menu items based on user permissions
  const filteredMenuItems = useMemo(() => {
    if (!permissions) return menuItems; // Show all while loading
    return menuItems.filter(item => permissions[item.permissionKey]?.can_view !== false);
  }, [permissions]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso');
    navigate('/cliente/login');
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="border-b border-border/50 p-4">
        <Link to="/admin/dashboard" className="flex items-center gap-2 group">
          {isCollapsed ? (
            <img 
              src={logoIcon} 
              alt="WebMarcas" 
              className="h-8 w-8 transition-transform duration-200 group-hover:scale-110" 
            />
          ) : (
            <img 
              src={logo} 
              alt="WebMarcas" 
              className="h-10 transition-transform duration-200 group-hover:scale-105" 
            />
          )}
        </Link>
        {!isCollapsed && (
          <div className="mt-3 flex items-center gap-2 text-xs animate-fade-in">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
              <Shield className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-medium text-muted-foreground">CRM WebMarcas</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMenuItems.map((item) => (
                <SidebarMenuItemCustom
                  key={item.href}
                  item={item}
                  isActive={location.pathname === item.href}
                  isCollapsed={isCollapsed}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-2">
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              tooltip={isCollapsed ? "Área do Cliente" : undefined}
              className="h-auto py-2.5 px-3 hover:bg-accent/60 transition-all duration-200"
            >
              <Link to="/cliente/dashboard" className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 transition-transform duration-200 hover:scale-110">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Área do Cliente</p>
                    <p className="text-xs text-muted-foreground">Acessar portal</p>
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip={isCollapsed ? "Sair do sistema" : undefined}
              className="h-auto py-2.5 px-3 hover:bg-destructive/10 transition-all duration-200 group/logout"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 transition-transform duration-200 group-hover/logout:scale-110">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-muted-foreground group-hover/logout:text-destructive transition-colors">Sair</p>
                  <p className="text-xs text-muted-foreground">Encerrar sessão</p>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  // Broadcast admin presence
  usePresence(adminUserId);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/cliente/login');
        return;
      }

      // Usar RPC has_role para verificação server-side segura
      const { data: isAdminRole, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error || !isAdminRole) {
        toast.error('Acesso negado. Você não tem permissão de administrador.');
        navigate('/cliente/dashboard');
        return;
      }

      setIsAdmin(true);
      setAdminUserId(user.id);
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
      <div className="min-h-screen flex w-full bg-background safe-area-top safe-area-bottom">
        <AdminSidebar />
        
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-50 flex items-center gap-2 md:gap-4 h-12 md:h-14 px-3 md:px-4 border-b border-border/50 bg-card/80 backdrop-blur-sm">
            <SidebarTrigger className="-ml-1 hover:bg-accent/60 transition-colors touch-target" />
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-md bg-primary/10">
                <Shield className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" />
              </div>
              <span className="font-medium hidden sm:inline">CRM WebMarcas</span>
            </div>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg hover:bg-accent/60 transition-all duration-300"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-500" />
              )}
            </Button>
          </header>
          
          <main className="p-4 sm:p-6 lg:p-8 animate-page-enter">
            {children}
          </main>
        </SidebarInset>
        <AdminChatWidget />
      </div>
    </SidebarProvider>
  );
}
