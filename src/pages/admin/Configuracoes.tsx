import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SettingsNavigation } from '@/components/admin/settings/SettingsNavigation';
import { GeneralSettings } from '@/components/admin/settings/GeneralSettings';
import { AppearanceSettings } from '@/components/admin/settings/AppearanceSettings';
import { IntegrationSettings } from '@/components/admin/settings/IntegrationSettings';
import { EmailSettings } from '@/components/admin/email/EmailSettings';
import { WhatsAppSettings } from '@/components/admin/settings/WhatsAppSettings';
import { NotificationSettings } from '@/components/admin/settings/NotificationSettings';
import { ContractSettings } from '@/components/admin/settings/ContractSettings';
import { ProcessSettings } from '@/components/admin/settings/ProcessSettings';
import { FinancialSettings } from '@/components/admin/settings/FinancialSettings';
import { INPISettings } from '@/components/admin/settings/INPISettings';
import { SecuritySettings } from '@/components/admin/settings/SecuritySettings';
import { BackupSettings } from '@/components/admin/settings/BackupSettings';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminConfiguracoes() {
  const [activeTab, setActiveTab] = useState('geral');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'geral': return <GeneralSettings />;
      case 'aparencia': return <AppearanceSettings />;
      case 'integracoes': return <IntegrationSettings />;
      case 'email': return <EmailSettings />;
      case 'whatsapp': return <WhatsAppSettings />;
      case 'notificacoes': return <NotificationSettings />;
      case 'contratos': return <ContractSettings />;
      case 'processos': return <ProcessSettings />;
      case 'financeiro': return <FinancialSettings />;
      case 'inpi': return <INPISettings />;
      case 'seguranca': return <SecuritySettings />;
      case 'backup': return <BackupSettings />;
      default: return <GeneralSettings />;
    }
  };

  return (
    <AdminLayout>
      <div className="relative min-h-[calc(100vh-4rem)]">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 shrink-0 hidden lg:block">
            <SettingsNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          </aside>
          
          {/* Mobile Navigation */}
          <div className="lg:hidden w-full mb-4">
            <select 
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full p-3 rounded-xl border border-border bg-card text-foreground"
            >
              <option value="geral">Geral</option>
              <option value="aparencia">Aparência</option>
              <option value="integracoes">Integrações</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="notificacoes">Notificações</option>
              <option value="contratos">Contratos</option>
              <option value="processos">Processos</option>
              <option value="financeiro">Financeiro</option>
              <option value="inpi">INPI</option>
              <option value="seguranca">Segurança</option>
              <option value="backup">Backup</option>
            </select>
          </div>
          
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </AdminLayout>
  );
}
