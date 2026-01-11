import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { FileText, ChevronRight } from 'lucide-react';

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
  { id: 'em_andamento', label: 'Em Andamento', color: 'bg-blue-500' },
  { id: 'publicado_rpi', label: 'Publicado RPI', color: 'bg-purple-500' },
  { id: 'em_exame', label: 'Em Exame', color: 'bg-amber-500' },
  { id: 'deferido', label: 'Deferido', color: 'bg-emerald-500' },
  { id: 'concedido', label: 'Concedido', color: 'bg-green-600' },
  { id: 'indeferido', label: 'Indeferido', color: 'bg-red-500' },
  { id: 'arquivado', label: 'Arquivado', color: 'bg-gray-500' },
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

  const getProcessesByStatus = (status: string) => {
    return processes.filter(p => p.status === status);
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-[280px] h-64 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (processes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum processo encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-4 pb-4">
        {kanbanColumns.map((column) => {
          const columnProcesses = getProcessesByStatus(column.id);
          
          return (
            <div key={column.id} className="min-w-[300px] max-w-[300px]">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${column.color}`} />
                      {column.label}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {columnProcesses.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {columnProcesses.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Nenhum processo
                    </p>
                  ) : (
                    columnProcesses.map((process) => (
                      <Link
                        key={process.id}
                        to={`/cliente/processos/${process.id}`}
                        className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {process.brand_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
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
