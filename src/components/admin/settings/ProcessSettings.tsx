import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SettingsCard } from './SettingsCard';
import { GitBranch, Plus, Trash2, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProcessData {
  stages: string[];
  stageColors: Record<string, string>;
  autoTransitions: Array<{ from: string; to: string; daysAfter: number }>;
}

const defaultColors = [
  '#FFA500', '#3B82F6', '#EF4444', '#8B5CF6', '#10B981', 
  '#EC4899', '#F59E0B', '#6366F1', '#14B8A6', '#F43F5E'
];

export function ProcessSettings() {
  const queryClient = useQueryClient();
  const [processes, setProcesses] = useState<ProcessData>({
    stages: ['analise', 'enviado', 'exigencia', 'publicado', 'registrado'],
    stageColors: {},
    autoTransitions: [],
  });
  const [newStage, setNewStage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['settings-processes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'processes')
        .single();
      
      if (error) throw error;
      return data?.value as unknown as ProcessData;
    },
  });

  useEffect(() => {
    if (data) {
      setProcesses(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newProcesses: ProcessData) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.parse(JSON.stringify(newProcesses)), updated_at: new Date().toISOString() })
        .eq('key', 'processes');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-processes'] });
      toast.success('Configurações de processos salvas!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    },
  });

  const addStage = () => {
    if (!newStage.trim()) return;
    const slug = newStage.toLowerCase().replace(/\s+/g, '_');
    if (processes.stages.includes(slug)) {
      toast.error('Esta etapa já existe');
      return;
    }
    const colorIndex = processes.stages.length % defaultColors.length;
    setProcesses({
      ...processes,
      stages: [...processes.stages, slug],
      stageColors: { ...processes.stageColors, [slug]: defaultColors[colorIndex] },
    });
    setNewStage('');
  };

  const removeStage = (stage: string) => {
    const newColors = { ...processes.stageColors };
    delete newColors[stage];
    setProcesses({
      ...processes,
      stages: processes.stages.filter(s => s !== stage),
      stageColors: newColors,
    });
  };

  const updateStageColor = (stage: string, color: string) => {
    setProcesses({
      ...processes,
      stageColors: { ...processes.stageColors, [stage]: color },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <SettingsCard
        icon={GitBranch}
        title="Etapas do Pipeline"
        description="Configure as etapas do fluxo de processos"
        glowColor="purple"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
              placeholder="Nome da nova etapa"
              onKeyDown={(e) => e.key === 'Enter' && addStage()}
            />
            <Button onClick={addStage} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {processes.stages.map((stage, index) => (
                <motion.div
                  key={stage}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: processes.stageColors[stage] || defaultColors[index % defaultColors.length] }}
                  />
                  
                  <span className="flex-1 font-medium capitalize">
                    {stage.replace(/_/g, ' ')}
                  </span>
                  
                  <Input
                    type="color"
                    value={processes.stageColors[stage] || defaultColors[index % defaultColors.length]}
                    onChange={(e) => updateStageColor(stage, e.target.value)}
                    className="w-10 h-8 p-1 cursor-pointer"
                  />
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStage(stage)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={GitBranch}
        title="Visualização do Pipeline"
        description="Preview das etapas configuradas"
        glowColor="cyan"
      >
        <div className="flex flex-wrap gap-2">
          {processes.stages.map((stage, index) => (
            <motion.div
              key={stage}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium text-white",
                "shadow-lg"
              )}
              style={{ 
                backgroundColor: processes.stageColors[stage] || defaultColors[index % defaultColors.length],
                boxShadow: `0 4px 14px ${processes.stageColors[stage] || defaultColors[index % defaultColors.length]}40`
              }}
            >
              {stage.replace(/_/g, ' ')}
            </motion.div>
          ))}
        </div>
      </SettingsCard>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button 
          onClick={() => saveMutation.mutate(processes)}
          disabled={saveMutation.isPending}
          className="w-full h-12"
          size="lg"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Salvar Configurações de Processos
        </Button>
      </motion.div>
    </motion.div>
  );
}
