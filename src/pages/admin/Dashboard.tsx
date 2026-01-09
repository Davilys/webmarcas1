import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/dashboard/StatsCard';
import { RevenueChart } from '@/components/admin/dashboard/RevenueChart';
import { GeographicChart } from '@/components/admin/dashboard/GeographicChart';
import { BusinessSectorChart } from '@/components/admin/dashboard/BusinessSectorChart';
import { ConversionFunnel } from '@/components/admin/dashboard/ConversionFunnel';
import { LeadSourceChart } from '@/components/admin/dashboard/LeadSourceChart';
import { RecentActivity } from '@/components/admin/dashboard/RecentActivity';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Target,
  CreditCard,
  CheckCircle
} from 'lucide-react';

interface Stats {
  totalClients: number;
  totalLeads: number;
  activeProcesses: number;
  pendingInvoices: number;
  totalRevenue: number;
  completedProcesses: number;
  // Trends
  clientsTrend: number;
  leadsTrend: number;
  revenueTrend: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalLeads: 0,
    activeProcesses: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
    completedProcesses: 0,
    clientsTrend: 0,
    leadsTrend: 0,
    revenueTrend: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      clientsRes, 
      leadsRes, 
      processesRes, 
      invoicesRes,
      lastMonthClients,
      lastMonthLeads,
      lastMonthRevenue
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('leads').select('id', { count: 'exact' }),
      supabase.from('brand_processes').select('id, status'),
      supabase.from('invoices').select('id, status, amount, created_at'),
      supabase.from('profiles').select('id', { count: 'exact' })
        .gte('created_at', lastMonth.toISOString())
        .lt('created_at', thisMonth.toISOString()),
      supabase.from('leads').select('id', { count: 'exact' })
        .gte('created_at', lastMonth.toISOString())
        .lt('created_at', thisMonth.toISOString()),
      supabase.from('invoices').select('amount')
        .eq('status', 'paid')
        .gte('created_at', lastMonth.toISOString())
        .lt('created_at', thisMonth.toISOString()),
    ]);

    const processes = processesRes.data || [];
    const invoices = invoicesRes.data || [];
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
    
    // Calculate this month's stats for trend
    const thisMonthClients = (clientsRes.count || 0) - (lastMonthClients.count || 0);
    const thisMonthLeads = (leadsRes.count || 0) - (lastMonthLeads.count || 0);
    const lastMonthRevenueTotal = lastMonthRevenue.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
    
    // Calculate trends (percentage change)
    const clientsTrend = lastMonthClients.count 
      ? ((thisMonthClients - (lastMonthClients.count || 0)) / (lastMonthClients.count || 1)) * 100 
      : 0;
    const leadsTrend = lastMonthLeads.count 
      ? ((thisMonthLeads - (lastMonthLeads.count || 0)) / (lastMonthLeads.count || 1)) * 100 
      : 0;
    const revenueTrend = lastMonthRevenueTotal 
      ? ((totalRevenue - lastMonthRevenueTotal) / lastMonthRevenueTotal) * 100 
      : 0;

    setStats({
      totalClients: clientsRes.count || 0,
      totalLeads: leadsRes.count || 0,
      activeProcesses: processes.filter(p => p.status === 'em_andamento').length,
      pendingInvoices: invoices.filter(i => i.status === 'pending').length,
      totalRevenue,
      completedProcesses: processes.filter(p => p.status === 'registrada').length,
      clientsTrend: Math.round(clientsTrend),
      leadsTrend: Math.round(leadsTrend),
      revenueTrend: Math.round(revenueTrend),
    });
  };

  const statCards = [
    { 
      title: 'Total de Clientes', 
      value: stats.totalClients, 
      icon: Users, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      trend: stats.clientsTrend,
      trendLabel: 'vs mês anterior'
    },
    { 
      title: 'Total de Leads', 
      value: stats.totalLeads, 
      icon: Target, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      trend: stats.leadsTrend,
      trendLabel: 'vs mês anterior'
    },
    { 
      title: 'Processos Ativos', 
      value: stats.activeProcesses, 
      icon: FileText, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    },
    { 
      title: 'Processos Concluídos', 
      value: stats.completedProcesses, 
      icon: CheckCircle, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
    },
    { 
      title: 'Faturas Pendentes', 
      value: stats.pendingInvoices, 
      icon: CreditCard, 
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
    { 
      title: 'Receita Total', 
      value: stats.totalRevenue, 
      prefix: 'R$ ',
      icon: TrendingUp, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      trend: stats.revenueTrend,
      trendLabel: 'vs mês anterior'
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão geral do sistema WebMarcas
            </p>
          </div>
          <motion.div 
            className="text-right"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((stat, index) => (
            <StatsCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              prefix={stat.prefix}
              icon={stat.icon}
              color={stat.color}
              bgColor={stat.bgColor}
              trend={stat.trend}
              trendLabel={stat.trendLabel}
              index={index}
            />
          ))}
        </div>

        {/* Revenue Chart - Full Width */}
        <RevenueChart />

        {/* Charts Grid - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GeographicChart />
          <BusinessSectorChart />
          <LeadSourceChart />
        </div>

        {/* Bottom Grid - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversionFunnel />
          <RecentActivity />
        </div>
      </div>
    </AdminLayout>
  );
}
