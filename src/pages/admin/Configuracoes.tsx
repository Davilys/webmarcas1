import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettings } from '@/components/admin/settings/GeneralSettings';
import { IntegrationSettings } from '@/components/admin/settings/IntegrationSettings';
import { EmailSettings } from '@/components/admin/email/EmailSettings';
import { WhatsAppSettings } from '@/components/admin/settings/WhatsAppSettings';
import { NotificationSettings } from '@/components/admin/settings/NotificationSettings';
import { SecuritySettings } from '@/components/admin/settings/SecuritySettings';
import { Settings, Database, Mail, MessageCircle, Bell, Shield } from 'lucide-react';

export default function AdminConfiguracoes() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie todas as configurações do CRM</p>
        </div>

        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto gap-2 bg-transparent p-0">
            <TabsTrigger 
              value="geral" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger 
              value="integracoes"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Integrações</span>
            </TabsTrigger>
            <TabsTrigger 
              value="email"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger 
              value="whatsapp"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notificacoes"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger 
              value="seguranca"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="mt-6">
            <GeneralSettings />
          </TabsContent>

          <TabsContent value="integracoes" className="mt-6">
            <IntegrationSettings />
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            <EmailSettings />
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-6">
            <WhatsAppSettings />
          </TabsContent>

          <TabsContent value="notificacoes" className="mt-6">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="seguranca" className="mt-6">
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
