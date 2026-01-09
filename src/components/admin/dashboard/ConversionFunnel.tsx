import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, FileCheck, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FunnelStep {
  name: string;
  value: number;
  percentage: number;
  icon: typeof Target;
  color: string;
  bgColor: string;
}

export function ConversionFunnel() {
  const [steps, setSteps] = useState<FunnelStep[]>([]);
  const [conversionRate, setConversionRate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [leadsRes, clientsRes, contractsRes, processesRes] = await Promise.all([
      supabase.from('leads').select('id, status', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('contracts').select('id, signature_status'),
      supabase.from('brand_processes').select('id, status')
    ]);

    const totalLeads = leadsRes.count || 0;
    const totalClients = clientsRes.count || 0;
    const signedContracts = contractsRes.data?.filter(c => c.signature_status === 'signed').length || 0;
    const completedProcesses = processesRes.data?.filter(p => p.status === 'registrada').length || 0;

    const maxValue = Math.max(totalLeads, 1);

    const funnelSteps: FunnelStep[] = [
      {
        name: 'Leads',
        value: totalLeads,
        percentage: 100,
        icon: Target,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30'
      },
      {
        name: 'Clientes',
        value: totalClients,
        percentage: totalLeads > 0 ? (totalClients / totalLeads) * 100 : 0,
        icon: Users,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30'
      },
      {
        name: 'Contratos Assinados',
        value: signedContracts,
        percentage: totalLeads > 0 ? (signedContracts / totalLeads) * 100 : 0,
        icon: FileCheck,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30'
      },
      {
        name: 'Processos Concluídos',
        value: completedProcesses,
        percentage: totalLeads > 0 ? (completedProcesses / totalLeads) * 100 : 0,
        icon: CheckCircle,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
      }
    ];

    setSteps(funnelSteps);
    setConversionRate(totalLeads > 0 ? (totalClients / totalLeads) * 100 : 0);
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="border-0 shadow-lg h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Funil de Conversão</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Taxa de conversão de leads
                </p>
              </div>
            </div>
            <motion.div 
              className="text-right"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
            >
              <p className="text-3xl font-bold text-emerald-600">
                {conversionRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Taxa de conversão</p>
            </motion.div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const widthPercentage = Math.max(step.percentage, 10);
              
              return (
                <motion.div
                  key={step.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${step.bgColor}`}>
                        <Icon className={`h-4 w-4 ${step.color}`} />
                      </div>
                      <span className="text-sm font-medium">{step.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{step.value}</span>
                      <span className="text-xs text-muted-foreground">
                        ({step.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                    <motion.div
                      className={`absolute inset-y-0 left-0 rounded-lg ${step.bgColor.replace('/30', '')}`}
                      style={{ backgroundColor: step.color.replace('text-', '').replace('-600', '') }}
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercentage}%` }}
                      transition={{ 
                        duration: 1, 
                        delay: 0.5 + index * 0.15,
                        ease: "easeOut"
                      }}
                    >
                      <div 
                        className="absolute inset-0 opacity-30"
                        style={{
                          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                          animation: 'shimmer 2s infinite'
                        }}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Conversion insights */}
          <motion.div 
            className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <p className="text-sm font-medium mb-2">💡 Insights</p>
            <p className="text-xs text-muted-foreground">
              {conversionRate >= 30 
                ? "Excelente taxa de conversão! Continue com a estratégia atual."
                : conversionRate >= 15
                ? "Boa taxa de conversão. Considere otimizar o follow-up de leads."
                : "Há espaço para melhorar a conversão. Foque no acompanhamento de leads."}
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
