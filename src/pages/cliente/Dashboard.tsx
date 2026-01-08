import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientLayout } from '@/components/cliente/ClientLayout';
import { StatsCards } from '@/components/cliente/StatsCards';
import { ProcessList } from '@/components/cliente/ProcessList';
import { RecentNotifications } from '@/components/cliente/RecentNotifications';
import { FinancialSummary } from '@/components/cliente/FinancialSummary';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@supabase/supabase-js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate('/cliente/login');
        } else {
          setUser(session.user);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/cliente/login');
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <ClientLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta! Acompanhe seus processos e documentos.
          </p>
        </div>

        <StatsCards userId={user?.id} />

        <div className="grid gap-6 lg:grid-cols-2">
          <ProcessList userId={user?.id} limit={5} />
          <div className="space-y-6">
            <RecentNotifications userId={user?.id} />
            <FinancialSummary userId={user?.id} />
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
