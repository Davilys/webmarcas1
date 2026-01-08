import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, CreditCard, Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface Stats {
  totalClients: number;
  totalProcesses: number;
  activeProcesses: number;
  pendingInvoices: number;
  totalRevenue: number;
  completedProcesses: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalProcesses: 0,
    activeProcesses: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
    completedProcesses: 0,
  });
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [recentProcesses, setRecentProcesses] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentData();
  }, []);

  const fetchStats = async () => {
    const [clientsRes, processesRes, invoicesRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('brand_processes').select('id, status', { count: 'exact' }),
      supabase.from('invoices').select('id, status, amount'),
    ]);

    const processes = processesRes.data || [];
    const invoices = invoicesRes.data || [];

    setStats({
      totalClients: clientsRes.count || 0,
      totalProcesses: processesRes.count || 0,
      activeProcesses: processes.filter(p => p.status === 'em_andamento').length,
      pendingInvoices: invoices.filter(i => i.status === 'pending').length,
      totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0),
      completedProcesses: processes.filter(p => p.status === 'registrada').length,
    });
  };

  const fetchRecentData = async () => {
    const [clientsRes, processesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('brand_processes').select('*, profiles(full_name, email)').order('created_at', { ascending: false }).limit(5),
    ]);

    setRecentClients(clientsRes.data || []);
    setRecentProcesses(processesRes.data || []);
  };

  const statCards = [
    { title: 'Total de Clientes', value: stats.totalClients, icon: Users, color: 'text-blue-500' },
    { title: 'Processos Ativos', value: stats.activeProcesses, icon: Clock, color: 'text-orange-500' },
    { title: 'Processos Concluídos', value: stats.completedProcesses, icon: CheckCircle, color: 'text-green-500' },
    { title: 'Faturas Pendentes', value: stats.pendingInvoices, icon: AlertCircle, color: 'text-red-500' },
    { title: 'Total de Processos', value: stats.totalProcesses, icon: FileText, color: 'text-purple-500' },
    { title: 'Receita Total', value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR')}`, icon: TrendingUp, color: 'text-emerald-500' },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      em_andamento: { label: 'Em Andamento', className: 'bg-orange-100 text-orange-700' },
      aguardando_pagamento: { label: 'Aguardando Pagamento', className: 'bg-yellow-100 text-yellow-700' },
      registrada: { label: 'Registrada', className: 'bg-green-100 text-green-700' },
      indeferida: { label: 'Indeferida', className: 'bg-red-100 text-red-700' },
    };
    const s = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.className}`}>{s.label}</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Visão geral do sistema WebMarcas</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Clients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Clientes Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{client.full_name || 'Sem nome'}</p>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(client.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
                {recentClients.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Nenhum cliente encontrado</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Processes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Processos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentProcesses.map((process) => (
                  <div key={process.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{process.brand_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(process.profiles as any)?.full_name || 'Cliente'}
                      </p>
                    </div>
                    {getStatusBadge(process.status)}
                  </div>
                ))}
                {recentProcesses.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Nenhum processo encontrado</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
