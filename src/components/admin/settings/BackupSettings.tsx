import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SettingsCard } from './SettingsCard';
import { Archive, Download, History, Trash2, Loader2, Database, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportOption {
  id: string;
  label: string;
  table: string;
  icon: React.ComponentType<{ className?: string }>;
}

const exportOptions: ExportOption[] = [
  { id: 'clients', label: 'Clientes', table: 'profiles', icon: Database },
  { id: 'leads', label: 'Leads', table: 'leads', icon: Database },
  { id: 'contracts', label: 'Contratos', table: 'contracts', icon: FileJson },
  { id: 'processes', label: 'Processos', table: 'brand_processes', icon: Database },
  { id: 'invoices', label: 'Faturas', table: 'invoices', icon: FileSpreadsheet },
];

export function BackupSettings() {
  const [exporting, setExporting] = useState<string | null>(null);

  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_history')
        .select(`
          id,
          user_id,
          ip_address,
          user_agent,
          login_at,
          profiles:user_id (email, full_name)
        `)
        .order('login_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const exportTable = async (tableName: string) => {
    switch (tableName) {
      case 'profiles': return supabase.from('profiles').select('*');
      case 'leads': return supabase.from('leads').select('*');
      case 'contracts': return supabase.from('contracts').select('*');
      case 'brand_processes': return supabase.from('brand_processes').select('*');
      case 'invoices': return supabase.from('invoices').select('*');
      default: return { data: [], error: null };
    }
  };

  const exportData = async (option: ExportOption) => {
    setExporting(option.id);
    try {
      const { data, error } = await exportTable(option.table);
      
      if (error) throw error;
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${option.table}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${option.label} exportados com sucesso!`);
    } catch (error) {
      toast.error('Erro ao exportar dados');
    } finally {
      setExporting(null);
    }
  };

  const exportAllData = async () => {
    setExporting('all');
    try {
      const allData: Record<string, unknown[]> = {};
      
      for (const option of exportOptions) {
        const { data } = await exportTable(option.table);
        allData[option.table] = data || [];
      }
      
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_completo_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Backup completo exportado!');
    } catch (error) {
      toast.error('Erro ao exportar backup');
    } finally {
      setExporting(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <SettingsCard
        icon={Download}
        title="Exportar Dados"
        description="Faça download dos dados do sistema"
        glowColor="cyan"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            return (
              <motion.button
                key={option.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => exportData(option)}
                disabled={exporting !== null}
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all disabled:opacity-50"
              >
                {exporting === option.id ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <Icon className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium text-sm">{option.label}</span>
              </motion.button>
            );
          })}
        </div>
        
        <Button 
          onClick={exportAllData}
          disabled={exporting !== null}
          className="w-full mt-4"
          variant="outline"
        >
          {exporting === 'all' ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Archive className="h-4 w-4 mr-2" />
          )}
          Exportar Backup Completo
        </Button>
      </SettingsCard>

      <SettingsCard
        icon={History}
        title="Histórico de Acessos"
        description="Últimos logins no sistema"
        glowColor="purple"
      >
        {logsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {auditLogs?.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
              >
                <div>
                  <p className="font-medium text-sm">
                    {(log.profiles as { email?: string; full_name?: string } | null)?.full_name || 
                     (log.profiles as { email?: string; full_name?: string } | null)?.email || 
                     'Usuário'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.ip_address || 'IP não registrado'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {log.login_at ? format(new Date(log.login_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {(!auditLogs || auditLogs.length === 0) && (
              <p className="text-center text-muted-foreground py-4">
                Nenhum registro de login encontrado
              </p>
            )}
          </div>
        )}
      </SettingsCard>

      <SettingsCard
        icon={Trash2}
        title="Limpeza de Cache"
        description="Limpar dados temporários do sistema"
        glowColor="orange"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A limpeza de cache pode ajudar a resolver problemas de sincronização e liberar espaço.
            Esta ação não afeta seus dados permanentes.
          </p>
          
          <Button 
            variant="outline"
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              toast.success('Cache limpo com sucesso! Recarregue a página.');
            }}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Cache Local
          </Button>
        </div>
      </SettingsCard>
    </motion.div>
  );
}
