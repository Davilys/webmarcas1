import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SettingsCard } from './SettingsCard';
import { Palette, Sun, Moon, Monitor, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AppearanceData {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
  customCss: string;
  portalLogo: string | null;
}

const themeOptions = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
] as const;

export function AppearanceSettings() {
  const queryClient = useQueryClient();
  const [appearance, setAppearance] = useState<AppearanceData>({
    theme: 'system',
    primaryColor: '#0066CC',
    accentColor: '#00D4FF',
    customCss: '',
    portalLogo: null,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['settings-appearance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'appearance')
        .single();
      
      if (error) throw error;
      return data?.value as unknown as AppearanceData;
    },
  });

  useEffect(() => {
    if (data) {
      setAppearance(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newAppearance: AppearanceData) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.parse(JSON.stringify(newAppearance)), updated_at: new Date().toISOString() })
        .eq('key', 'appearance');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-appearance'] });
      toast.success('Configurações de aparência salvas!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    },
  });

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
        icon={Palette}
        title="Tema do CRM"
        description="Escolha a aparência visual do painel"
        glowColor="purple"
      >
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = appearance.theme === option.value;
            
            return (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAppearance({ ...appearance, theme: option.value })}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{option.label}</span>
              </motion.button>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Palette}
        title="Cores Personalizadas"
        description="Defina as cores principais do sistema"
        glowColor="cyan"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cor Primária</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={appearance.primaryColor}
                onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={appearance.primaryColor}
                onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                placeholder="#0066CC"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Cor de Destaque</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={appearance.accentColor}
                onChange={(e) => setAppearance({ ...appearance, accentColor: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={appearance.accentColor}
                onChange={(e) => setAppearance({ ...appearance, accentColor: e.target.value })}
                placeholder="#00D4FF"
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <div 
            className="w-full h-12 rounded-lg flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: appearance.primaryColor }}
          >
            Cor Primária
          </div>
          <div 
            className="w-full h-12 rounded-lg flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: appearance.accentColor }}
          >
            Cor de Destaque
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Palette}
        title="CSS Personalizado"
        description="Adicione estilos CSS customizados ao sistema"
        glowColor="green"
      >
        <Textarea
          value={appearance.customCss}
          onChange={(e) => setAppearance({ ...appearance, customCss: e.target.value })}
          placeholder={`/* Exemplo */\n.custom-class {\n  color: #ff0000;\n}`}
          className="font-mono text-sm min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground">
          ⚠️ CSS avançado: use com cuidado para não quebrar o layout
        </p>
      </SettingsCard>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button 
          onClick={() => saveMutation.mutate(appearance)}
          disabled={saveMutation.isPending}
          className="w-full h-12"
          size="lg"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Salvar Configurações de Aparência
        </Button>
      </motion.div>
    </motion.div>
  );
}
