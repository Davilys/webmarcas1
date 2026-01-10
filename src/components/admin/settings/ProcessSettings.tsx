import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, Reorder } from 'framer-motion';
import { SettingsCard } from './SettingsCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GitBranch, GripVertical, Plus, Trash2, Save, Loader2 } from 'lucide-react';

interface PipelineStage {
  id: string;
  name: string;
  color: string;
}

interface ProcessSettingsData {
  stages: PipelineStage[];
}

const defaultColors = [
  '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#06B6D4', 
  '#EC4899', '#F97316', '#84CC16', '#6366F1'
];

export function ProcessSettings() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStage, setNewStage] = useState({ name: '', color: '#3B82F6' });

  const { data, isLoading } = useQuery({
    queryKey: ['system-settings', 'processes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'processes')
        .single();
      if (error) throw error;
      return data?.value as unknown as ProcessSettingsData;
    },
  });

  const [settings, setSettings] = useState<ProcessSettingsData>({
    stages: [],
  });

  useEffect(() => {
    if (data) setSettings(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProcessSettingsData) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.parse(JSON.stringify(data)), updated_at: new Date().toISOString() })
        .eq('key', 'processes');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings', 'processes'] });
      toast.success('Configurações de processos salvas!');
    },
    onError: () => toast.error('Erro ao salvar configurações'),
  });

  const addStage = () => {
    if (!newStage.name) return;
    const id = newStage.name.toLowerCase().replace(/\s+/g, '_');
    const updated = {
      ...settings,
      stages: [...settings.stages, { id, name: newStage.name, color: newStage.color }],
    };
    setSettings(updated);
    saveMutation.mutate(updated);
    setNewStage({ name: '', color: defaultColors[settings.stages.length % defaultColors.length] });
    setIsDialogOpen(false);
  };

  const removeStage = (id: string) => {
    const updated = {
      ...settings,
      stages: settings.stages.filter(s => s.id !== id),
    };
    setSettings(updated);
    saveMutation.mutate(updated);
  };

  const updateStageColor = (id: string, color: string) => {
    const updated = {
      ...settings,
      stages: settings.stages.map(s => s.id === id ? { ...s, color } : s),
    };
    setSettings(updated);
  };

  const reorderStages = (newOrder: PipelineStage[]) => {
    setSettings({ ...settings, stages: newOrder });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
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
      {/* Pipeline Stages */}
      <SettingsCard
        icon={GitBranch}
        iconColor="text-cyan-500"
        title="Etapas do Pipeline"
        description="Configure as etapas do funil de processos (arraste para reordenar)"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-dashed mb-4">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Etapa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Etapa</DialogTitle>
              <DialogDescription>Adicione uma nova etapa ao pipeline de processos</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Etapa</Label>
                <Input
                  value={newStage.name}
                  onChange={(e) => setNewStage({ ...newStage, name: e.target.value })}
                  placeholder="Ex: Em Análise"
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-2">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewStage({ ...newStage, color })}
                      className={`w-8 h-8 rounded-full border-2 ${newStage.color === color ? 'border-foreground ring-2 ring-offset-2' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={addStage} disabled={!newStage.name}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Reorder.Group axis="y" values={settings.stages} onReorder={reorderStages} className="space-y-2">
          {settings.stages.map((stage) => (
            <Reorder.Item
              key={stage.id}
              value={stage}
              className="flex items-center gap-3 p-3 rounded-xl border bg-card cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span className="flex-1 font-medium text-sm">{stage.name}</span>
              <input
                type="color"
                value={stage.color}
                onChange={(e) => updateStageColor(stage.id, e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeStage(stage.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {settings.stages.length === 0 && (
          <p className="text-center py-4 text-muted-foreground">
            Nenhuma etapa configurada. Adicione etapas para o pipeline.
          </p>
        )}
      </SettingsCard>

      {/* Save Button */}
      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Button 
          onClick={() => saveMutation.mutate(settings)} 
          disabled={saveMutation.isPending}
          className="w-full"
          size="lg"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configurações de Processos
        </Button>
      </motion.div>
    </motion.div>
  );
}
