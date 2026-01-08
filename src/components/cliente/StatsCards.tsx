import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface StatsCardsProps {
  userId?: string;
}

export function StatsCards({ userId }: StatsCardsProps) {
  const [stats, setStats] = useState({
    totalProcesses: 0,
    inProgress: 0,
    completed: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      // Buscar processos
      const { data: processes } = await supabase
        .from('brand_processes')
        .select('status')
        .eq('user_id', userId);

      // Buscar faturas pendentes
      const { data: invoices } = await supabase
        .from('invoices')
        .select('status')
        .eq('user_id', userId)
        .in('status', ['pending', 'overdue']);

      if (processes) {
        const inProgress = processes.filter(p => 
          ['em_andamento', 'publicado_rpi', 'em_exame'].includes(p.status || '')
        ).length;
        const completed = processes.filter(p => 
          ['deferido', 'concedido'].includes(p.status || '')
        ).length;

        setStats({
          totalProcesses: processes.length,
          inProgress,
          completed,
          pendingPayments: invoices?.length || 0,
        });
      }
    };

    fetchStats();
  }, [userId]);

  const cards = [
    {
      title: 'Total de Processos',
      value: stats.totalProcesses,
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Em Andamento',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Concluídos',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Pagamentos Pendentes',
      value: stats.pendingPayments,
      icon: AlertCircle,
      color: stats.pendingPayments > 0 ? 'text-red-500' : 'text-muted-foreground',
      bgColor: stats.pendingPayments > 0 ? 'bg-red-500/10' : 'bg-muted',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
