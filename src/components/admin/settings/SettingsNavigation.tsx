import { motion } from 'framer-motion';
import { 
  Settings, Database, Mail, MessageCircle, Bell, Shield,
  Palette, FileText, GitBranch, DollarSign, Search, Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

const tabs: Tab[] = [
  { value: 'geral', label: 'Geral', icon: Settings, description: 'Dados da empresa', color: 'text-cyan-400' },
  { value: 'aparencia', label: 'Aparência', icon: Palette, description: 'Tema e cores', color: 'text-purple-400' },
  { value: 'integracoes', label: 'Integrações', icon: Database, description: 'APIs externas', color: 'text-blue-400' },
  { value: 'email', label: 'Email', icon: Mail, description: 'SMTP e templates', color: 'text-orange-400' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, description: 'Mensagens', color: 'text-green-400' },
  { value: 'notificacoes', label: 'Notificações', icon: Bell, description: 'Alertas', color: 'text-yellow-400' },
  { value: 'contratos', label: 'Contratos', icon: FileText, description: 'Assinatura digital', color: 'text-indigo-400' },
  { value: 'processos', label: 'Processos', icon: GitBranch, description: 'Pipeline e status', color: 'text-pink-400' },
  { value: 'financeiro', label: 'Financeiro', icon: DollarSign, description: 'Taxas e valores', color: 'text-emerald-400' },
  { value: 'inpi', label: 'INPI', icon: Search, description: 'Automação revista', color: 'text-rose-400' },
  { value: 'seguranca', label: 'Segurança', icon: Shield, description: 'Usuários e logs', color: 'text-red-400' },
  { value: 'backup', label: 'Backup', icon: Archive, description: 'Exportar dados', color: 'text-slate-400' },
];

interface SettingsNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SettingsNavigation({ activeTab, onTabChange }: SettingsNavigationProps) {
  return (
    <div className="sticky top-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Configurações</h2>
        <p className="text-sm text-muted-foreground">Gerencie todo o CRM</p>
      </div>
      
      <nav className="space-y-1">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          
          return (
            <motion.button
              key={tab.value}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                "text-left group relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-primary/20 to-primary/5 text-foreground border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {/* Active indicator line */}
              {isActive && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
                />
              )}
              
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive ? "bg-primary/20" : "bg-transparent group-hover:bg-muted"
              )}>
                <Icon className={cn(
                  "h-4 w-4 transition-colors",
                  isActive ? tab.color : "text-muted-foreground group-hover:text-foreground"
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "block font-medium text-sm truncate",
                  isActive && "text-foreground"
                )}>
                  {tab.label}
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  {tab.description}
                </span>
              </div>
              
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 rounded-full bg-primary"
                />
              )}
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}
