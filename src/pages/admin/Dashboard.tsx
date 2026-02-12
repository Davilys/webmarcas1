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
  CheckCircle,
  Sparkles
} from 'lucide-react';

interface Stats {
  totalClients: number;
  totalLeads: number;
  activeProcesses: number;
  pendingInvoices: number;
  totalRevenue: number;
  completedProcesses: number;
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
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    fetchStats();
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  const fetchStats = async () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      clientsRes, leadsRes, processesRes, invoicesRes,
      lastMonthClients, lastMonthLeads, lastMonthRevenue
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('leads').select('id', { count: 'exact' }),
      supabase.from('brand_processes').select('id, status'),
      supabase.from('invoices').select('id, status, amount, created_at'),
      supabase.from('profiles').select('id', { count: 'exact' })
        .gte('created_at', lastMonth.toISOString()).lt('created_at', thisMonth.toISOString()),
      supabase.from('leads').select('id', { count: 'exact' })
        .gte('created_at', lastMonth.toISOString()).lt('created_at', thisMonth.toISOString()),
      supabase.from('invoices').select('amount').eq('status', 'paid')
        .gte('created_at', lastMonth.toISOString()).lt('created_at', thisMonth.toISOString()),
    ]);

    const processes = processesRes.data || [];
    const invoices = invoicesRes.data || [];
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
    const thisMonthClients = (clientsRes.count || 0) - (lastMonthClients.count || 0);
    const thisMonthLeads = (leadsRes.count || 0) - (lastMonthLeads.count || 0);
    const lastMonthRevenueTotal = lastMonthRevenue.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
    
    const clientsTrend = lastMonthClients.count ? ((thisMonthClients - (lastMonthClients.count || 0)) / (lastMonthClients.count || 1)) * 100 : 0;
    const leadsTrend = lastMonthLeads.count ? ((thisMonthLeads - (lastMonthLeads.count || 0)) / (lastMonthLeads.count || 1)) * 100 : 0;
    const revenueTrend = lastMonthRevenueTotal ? ((totalRevenue - lastMonthRevenueTotal) / lastMonthRevenueTotal) * 100 : 0;

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
    { title: 'Clientes', value: stats.totalClients, icon: Users, gradient: 'from-blue-500 to-cyan-400', trend: stats.clientsTrend, trendLabel: 'vs mês anterior' },
    { title: 'Leads', value: stats.totalLeads, icon: Target, gradient: 'from-violet-500 to-purple-400', trend: stats.leadsTrend, trendLabel: 'vs mês anterior' },
    { title: 'Processos Ativos', value: stats.activeProcesses, icon: FileText, gradient: 'from-amber-500 to-orange-400' },
    { title: 'Concluídos', value: stats.completedProcesses, icon: CheckCircle, gradient: 'from-emerald-500 to-green-400' },
    { title: 'Faturas Pendentes', value: stats.pendingInvoices, icon: CreditCard, gradient: 'from-rose-500 to-pink-400' },
    { title: 'Receita Total', value: stats.totalRevenue, prefix: 'R$ ', icon: TrendingUp, gradient: 'from-emerald-600 to-teal-400', trend: stats.revenueTrend, trendLabel: 'vs mês anterior' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-6 md:p-8"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <motion.div 
                className="flex items-center gap-2 mb-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Dashboard</span>
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {greeting} 👋
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm md:text-base">
                Aqui está um resumo do que está acontecendo no WebMarcas.
              </p>
            </div>
            <motion.div 
              className="text-left md:text-right shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm font-medium text-foreground/70">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric',
                  month: 'long', 
                  year: 'numeric'
                })}
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((stat, index) => (
            <StatsCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              prefix={stat.prefix}
              icon={stat.icon}
              gradient={stat.gradient}
              trend={stat.trend}
              trendLabel={stat.trendLabel}
              index={index}
            />
          ))}
        </div>

        {/* Revenue Chart */}
        <RevenueChart />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GeographicChart />
          <BusinessSectorChart />
          <LeadSourceChart />
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversionFunnel />
          <RecentActivity />
        </div>
      </div>
    </AdminLayout>
  );
}
