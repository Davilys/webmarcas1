import { useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettings } from '@/components/admin/settings/GeneralSettings';
import { IntegrationSettings } from '@/components/admin/settings/IntegrationSettings';
import { APIWebhooksSettings } from '@/components/admin/settings/APIWebhooksSettings';
import { EmailSettings } from '@/components/admin/email/EmailSettings';
import { WhatsAppSettings } from '@/components/admin/settings/WhatsAppSettings';
import { NotificationSettings } from '@/components/admin/settings/NotificationSettings';
import { SecuritySettings } from '@/components/admin/settings/SecuritySettings';
import { AppearanceSettings } from '@/components/admin/settings/AppearanceSettings';
import { ContractSettings } from '@/components/admin/settings/ContractSettings';
import { ProcessSettings } from '@/components/admin/settings/ProcessSettings';
import { FinancialSettings } from '@/components/admin/settings/FinancialSettings';
import { BackupSettings } from '@/components/admin/settings/BackupSettings';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Settings, Database, Webhook, Mail, MessageCircle, Bell, Shield, 
  Palette, FileSignature, GitBranch, Wallet, HardDrive 
} from 'lucide-react';

const tabs = [
  { value: 'geral', label: 'Geral', icon: Settings },
  { value: 'integracoes', label: 'Integrações', icon: Database },
  { value: 'api', label: 'API e Webhooks', icon: Webhook, badge: 'Novo' },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'notificacoes', label: 'Notificações', icon: Bell },
  { value: 'seguranca', label: 'Segurança', icon: Shield },
  { value: 'aparencia', label: 'Aparência', icon: Palette },
  { value: 'contratos', label: 'Contratos', icon: FileSignature },
  { value: 'processos', label: 'Processos', icon: GitBranch },
  { value: 'financeiro', label: 'Financeiro', icon: Wallet },
  { value: 'backup', label: 'Backup', icon: HardDrive },
];

export default function AdminConfiguracoes() {
  const [activeTab, setActiveTab] = useState('geral');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with gradient */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 rounded-2xl blur-3xl -z-10" />
          <div className="relative">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Configurações
            </h1>
            <p className="text-muted-foreground">Central de configurações do CRM</p>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Modern Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TabsList className="flex flex-wrap gap-2 h-auto bg-muted/30 p-2 rounded-2xl backdrop-blur-sm border border-border/50">
              {tabs.map((tab, index) => (
                <motion.div
                  key={tab.value}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <TabsTrigger 
                    value={tab.value}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300",
                      "data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80",
                      "data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25",
                      "hover:bg-muted/50"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm">{tab.label}</span>
                    {tab.badge && (
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-accent text-accent-foreground">
                        {tab.badge}
                      </Badge>
                    )}
                  </TabsTrigger>
                </motion.div>
              ))}
            </TabsList>
          </motion.div>

          {/* Tab Contents with Animation */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TabsContent value="geral" className="mt-0"><GeneralSettings /></TabsContent>
            <TabsContent value="integracoes" className="mt-0"><IntegrationSettings /></TabsContent>
            <TabsContent value="api" className="mt-0"><APIWebhooksSettings /></TabsContent>
            <TabsContent value="email" className="mt-0"><EmailSettings /></TabsContent>
            <TabsContent value="whatsapp" className="mt-0"><WhatsAppSettings /></TabsContent>
            <TabsContent value="notificacoes" className="mt-0"><NotificationSettings /></TabsContent>
            <TabsContent value="seguranca" className="mt-0"><SecuritySettings /></TabsContent>
            <TabsContent value="aparencia" className="mt-0"><AppearanceSettings /></TabsContent>
            <TabsContent value="contratos" className="mt-0"><ContractSettings /></TabsContent>
            <TabsContent value="processos" className="mt-0"><ProcessSettings /></TabsContent>
            <TabsContent value="financeiro" className="mt-0"><FinancialSettings /></TabsContent>
            <TabsContent value="backup" className="mt-0"><BackupSettings /></TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
