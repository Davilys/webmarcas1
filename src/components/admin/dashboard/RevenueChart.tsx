import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Period = 'mensal' | 'semestral' | 'anual';

interface RevenueData {
  period: string;
  receita: number;
  leads: number;
  clientes: number;
}

export function RevenueChart() {
  const [period, setPeriod] = useState<Period>('mensal');
  const [data, setData] = useState<RevenueData[]>([]);
  const [totals, setTotals] = useState({ receita: 0, leads: 0, clientes: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setIsLoading(true);
    const now = new Date();
    let startDate: Date;
    let groupBy: string;
    
    switch (period) {
      case 'mensal':
        startDate = subMonths(now, 12);
        groupBy = 'month';
        break;
      case 'semestral':
        startDate = subYears(now, 2);
        groupBy = 'semester';
        break;
      case 'anual':
        startDate = subYears(now, 5);
        groupBy = 'year';
        break;
    }

    // Fetch invoices for revenue
    const { data: invoices } = await supabase
      .from('invoices')
      .select('amount, status, created_at')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'paid');

    // Fetch leads
    const { data: leads } = await supabase
      .from('leads')
      .select('created_at, status')
      .gte('created_at', startDate.toISOString());

    // Fetch clients
    const { data: clients } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    // Group data by period
    const groupedData: Record<string, RevenueData> = {};
    
    const getPeriodKey = (date: Date) => {
      switch (period) {
        case 'mensal':
          return format(date, 'MMM/yy', { locale: ptBR });
        case 'semestral':
          const semester = date.getMonth() < 6 ? '1º Sem' : '2º Sem';
          return `${semester}/${format(date, 'yy')}`;
        case 'anual':
          return format(date, 'yyyy');
      }
    };

    // Initialize periods
    const periods: string[] = [];
    for (let i = period === 'anual' ? 5 : period === 'semestral' ? 4 : 12; i >= 0; i--) {
      let date: Date;
      switch (period) {
        case 'mensal':
          date = subMonths(now, i);
          break;
        case 'semestral':
          date = subMonths(now, i * 6);
          break;
        case 'anual':
          date = subYears(now, i);
          break;
      }
      const key = getPeriodKey(date);
      if (!periods.includes(key)) {
        periods.push(key);
        groupedData[key] = { period: key, receita: 0, leads: 0, clientes: 0 };
      }
    }

    // Aggregate invoices
    invoices?.forEach(invoice => {
      const key = getPeriodKey(new Date(invoice.created_at));
      if (groupedData[key]) {
        groupedData[key].receita += Number(invoice.amount);
      }
    });

    // Aggregate leads
    leads?.forEach(lead => {
      const key = getPeriodKey(new Date(lead.created_at));
      if (groupedData[key]) {
        groupedData[key].leads += 1;
      }
    });

    // Aggregate clients
    clients?.forEach(client => {
      const key = getPeriodKey(new Date(client.created_at));
      if (groupedData[key]) {
        groupedData[key].clientes += 1;
      }
    });

    const chartData = periods.map(p => groupedData[p]);
    setData(chartData);
    
    setTotals({
      receita: chartData.reduce((sum, d) => sum + d.receita, 0),
      leads: chartData.reduce((sum, d) => sum + d.leads, 0),
      clientes: chartData.reduce((sum, d) => sum + d.clientes, 0),
    });
    
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Evolução da Receita</CardTitle>
              <p className="text-sm text-muted-foreground">
                Comparativo {period === 'mensal' ? 'mês a mês' : period === 'semestral' ? 'semestral' : 'anual'}
              </p>
            </div>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="grid grid-cols-3 w-[280px]">
              <TabsTrigger value="mensal">Mensal</TabsTrigger>
              <TabsTrigger value="semestral">Semestral</TabsTrigger>
              <TabsTrigger value="anual">Anual</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <motion.div 
              className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-muted-foreground">Receita Total</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                R$ {totals.receita.toLocaleString('pt-BR')}
              </p>
            </motion.div>
            <motion.div 
              className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground">Total Leads</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{totals.leads}</p>
            </motion.div>
            <motion.div 
              className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground">Novos Clientes</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{totals.clientes}</p>
            </motion.div>
          </div>

          {/* Chart */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'receita') return [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita'];
                    return [value, name === 'leads' ? 'Leads' : 'Clientes'];
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="receita" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorReceita)" 
                  name="receita"
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                  name="leads"
                  animationDuration={1500}
                  animationBegin={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
