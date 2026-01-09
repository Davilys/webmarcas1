import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  UserPlus, 
  FileText, 
  CreditCard, 
  FileCheck,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Activity {
  id: string;
  type: 'lead' | 'client' | 'process' | 'invoice' | 'contract';
  title: string;
  description: string;
  time: Date;
  icon: typeof Clock;
  color: string;
  bgColor: string;
}

const TYPE_CONFIG = {
  lead: { icon: UserPlus, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  client: { icon: UserPlus, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  process: { icon: FileText, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  invoice: { icon: CreditCard, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  contract: { icon: FileCheck, color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
};

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setIsLoading(true);
    
    const [leadsRes, clientsRes, processesRes, invoicesRes, contractsRes] = await Promise.all([
      supabase.from('leads').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('id, full_name, email, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('brand_processes').select('id, brand_name, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('invoices').select('id, description, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('contracts').select('id, subject, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const allActivities: Activity[] = [
      ...(leadsRes.data || []).map(lead => ({
        id: `lead-${lead.id}`,
        type: 'lead' as const,
        title: 'Novo lead',
        description: lead.full_name || 'Lead sem nome',
        time: new Date(lead.created_at),
        ...TYPE_CONFIG.lead
      })),
      ...(clientsRes.data || []).map(client => ({
        id: `client-${client.id}`,
        type: 'client' as const,
        title: 'Novo cliente',
        description: client.full_name || client.email,
        time: new Date(client.created_at!),
        ...TYPE_CONFIG.client
      })),
      ...(processesRes.data || []).map(process => ({
        id: `process-${process.id}`,
        type: 'process' as const,
        title: 'Novo processo',
        description: process.brand_name,
        time: new Date(process.created_at!),
        ...TYPE_CONFIG.process
      })),
      ...(invoicesRes.data || []).map(invoice => ({
        id: `invoice-${invoice.id}`,
        type: 'invoice' as const,
        title: 'Nova fatura',
        description: invoice.description,
        time: new Date(invoice.created_at!),
        ...TYPE_CONFIG.invoice
      })),
      ...(contractsRes.data || []).map(contract => ({
        id: `contract-${contract.id}`,
        type: 'contract' as const,
        title: 'Novo contrato',
        description: contract.subject || 'Contrato',
        time: new Date(contract.created_at!),
        ...TYPE_CONFIG.contract
      })),
    ];

    // Sort by time and take top 10
    allActivities.sort((a, b) => b.time.getTime() - a.time.getTime());
    setActivities(allActivities.slice(0, 10));
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="border-0 shadow-lg h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
              <Bell className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Atividade Recente</CardTitle>
              <p className="text-sm text-muted-foreground">
                Últimas interações no sistema
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[380px] pr-4">
            <AnimatePresence>
              {activities.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-muted-foreground"
                >
                  <Clock className="h-12 w-12 mb-2 opacity-50" />
                  <p>Nenhuma atividade recente</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity, index) => {
                    const Icon = activity.icon;
                    
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <div className={`p-2 rounded-lg ${activity.bgColor} shrink-0`}>
                          <Icon className={`h-4 w-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {activity.description}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(activity.time, { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
