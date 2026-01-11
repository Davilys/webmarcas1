import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, FileText } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface ClientProcessKanbanProps {
  userId?: string;
}

interface BrandProcess {
  id: string;
  brand_name: string;
  status: string;
  process_number: string | null;
  updated_at: string;
}

const kanbanColumns = [
  { key: 'em_andamento', label: 'Em Andamento', color: 'bg-yellow-500' },
  { key: 'publicado_rpi', label: 'Publicado RPI', color: 'bg-blue-500' },
  { key: 'em_exame', label: 'Em Exame', color: 'bg-purple-500' },
  { key: 'deferido', label: 'Deferido', color: 'bg-green-500' },
  { key: 'concedido', label: 'Concedido', color: 'bg-emerald-600' },
  { key: 'indeferido', label: 'Indeferido', color: 'bg-red-500' },
  { key: 'arquivado', label: 'Arquivado', color: 'bg-gray-500' },
];

export function ClientProcessKanban({ userId }: ClientProcessKanbanProps) {
  const [processes, setProcesses] = useState<BrandProcess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchProcesses = async () => {
      const { data } = await supabase
        .from('brand_processes')
        .select('id, brand_name, status, process_number, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      setProcesses(data || []);
      setLoading(false);
    };

    fetchProcesses();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {kanbanColumns.slice(0, 4).map((col) => (
          <div key={col.key} className="flex-shrink-0 w-72">
            <Card className="h-96 animate-pulse bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  const getProcessesByStatus = (status: string) => {
    return processes.filter(p => p.status === status);
  };

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-4 pb-4">
        {kanbanColumns.map((column) => {
          const columnProcesses = getProcessesByStatus(column.key);
          
          return (
            <div key={column.key} className="flex-shrink-0 w-72">
              <Card className="h-full min-h-[400px]">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <CardTitle className="text-sm font-medium">
                      {column.label}
                    </CardTitle>
                    <Badge variant="secondary" className="ml-auto">
                      {columnProcesses.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {columnProcesses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum processo</p>
                    </div>
                  ) : (
                    columnProcesses.map((process) => (
                      <Link
                        key={process.id}
                        to={`/cliente/processos/${process.id}`}
                        className="block p-3 rounded-lg border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {process.brand_name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {process.process_number || 'Aguardando protocolo'}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}