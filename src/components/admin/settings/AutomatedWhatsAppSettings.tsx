import { MessageCircle } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChannelAnalyticsDashboard } from './ChannelAnalyticsDashboard';
import { ChannelNotificationTemplates } from './ChannelNotificationTemplates';

export function AutomatedWhatsAppSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20">
          <MessageCircle className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">WhatsApp Automático</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os templates e acompanhe o desempenho das notificações via BotConversa
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <MessageCircle className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ChannelAnalyticsDashboard channel="whatsapp" />
        </TabsContent>

        <TabsContent value="templates">
          <ChannelNotificationTemplates channel="whatsapp" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
