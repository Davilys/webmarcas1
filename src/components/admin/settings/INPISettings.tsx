import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SettingsCard } from './SettingsCard';
import { Search, Bell, Webhook, Loader2, RefreshCw, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface INPIData {
  autoSync: boolean;
  syncFrequency: string;
  alertDaysBefore: number;
  alertEmails: string[];
  monitoredClasses: number[];
  webhookUrl: string | null;
}

const nclClasses = Array.from({ length: 45 }, (_, i) => i + 1);

export function INPISettings() {
  const queryClient = useQueryClient();
  const [inpi, setInpi] = useState<INPIData>({
    autoSync: true,
    syncFrequency: 'daily',
    alertDaysBefore: 15,
    alertEmails: [],
    monitoredClasses: [],
    webhookUrl: null,
  });
  const [newEmail, setNewEmail] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['settings-inpi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'inpi')
        .single();
      
      if (error) throw error;
      return data?.value as unknown as INPIData;
    },
  });

  useEffect(() => {
    if (data) {
      setInpi(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newInpi: INPIData) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.parse(JSON.stringify(newInpi)), updated_at: new Date().toISOString() })
        .eq('key', 'inpi');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-inpi'] });
      toast.success('Configurações do INPI salvas!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    },
  });

  const addEmail = () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error('Email inválido');
      return;
    }
    if (inpi.alertEmails.includes(newEmail)) {
      toast.error('Email já adicionado');
      return;
    }
    setInpi({ ...inpi, alertEmails: [...inpi.alertEmails, newEmail] });
    setNewEmail('');
  };

  const removeEmail = (email: string) => {
    setInpi({ ...inpi, alertEmails: inpi.alertEmails.filter(e => e !== email) });
  };

  const toggleClass = (classNum: number) => {
    const newClasses = inpi.monitoredClasses.includes(classNum)
      ? inpi.monitoredClasses.filter(c => c !== classNum)
      : [...inpi.monitoredClasses, classNum].sort((a, b) => a - b);
    setInpi({ ...inpi, monitoredClasses: newClasses });
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
        icon={RefreshCw}
        title="Sincronização da Revista"
        description="Configure a importação automática da RPI"
        glowColor="cyan"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Sincronização Automática</Label>
              <p className="text-sm text-muted-foreground">Buscar novas revistas automaticamente</p>
            </div>
            <Switch
              checked={inpi.autoSync}
              onCheckedChange={(checked) => setInpi({ ...inpi, autoSync: checked })}
            />
          </div>
          
          {inpi.autoSync && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <Label>Frequência</Label>
              <Select
                value={inpi.syncFrequency}
                onValueChange={(value) => setInpi({ ...inpi, syncFrequency: value })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diariamente</SelectItem>
                  <SelectItem value="weekly">Semanalmente</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Bell}
        title="Alertas de Prazo"
        description="Configure notificações de prazos processuais"
        glowColor="orange"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Dias de Antecedência</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={60}
                value={inpi.alertDaysBefore}
                onChange={(e) => setInpi({ ...inpi, alertDaysBefore: parseInt(e.target.value) || 15 })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">dias antes do vencimento</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Emails para Alertas</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@exemplo.com"
                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
              />
              <Button onClick={addEmail} size="icon" variant="outline">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
            
            {inpi.alertEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {inpi.alertEmails.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/20"
                    onClick={() => removeEmail(email)}
                  >
                    {email} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Search}
        title="Classes NCL Monitoradas"
        description="Selecione as classes de interesse para alertas"
        glowColor="purple"
      >
        <div className="grid grid-cols-9 gap-1">
          {nclClasses.map((classNum) => (
            <motion.button
              key={classNum}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleClass(classNum)}
              className={`
                w-8 h-8 rounded-lg text-xs font-medium transition-all
                ${inpi.monitoredClasses.includes(classNum)
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }
              `}
            >
              {classNum}
            </motion.button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {inpi.monitoredClasses.length} classes selecionadas
        </p>
      </SettingsCard>

      <SettingsCard
        icon={Webhook}
        title="Webhook de Publicação"
        description="Receba notificações em sistemas externos"
        glowColor="green"
      >
        <div className="space-y-2">
          <Label>URL do Webhook</Label>
          <Input
            value={inpi.webhookUrl || ''}
            onChange={(e) => setInpi({ ...inpi, webhookUrl: e.target.value || null })}
            placeholder="https://seu-sistema.com/webhook"
          />
          <p className="text-xs text-muted-foreground">
            Enviaremos um POST com os dados da publicação quando houver match com seus processos
          </p>
        </div>
      </SettingsCard>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button 
          onClick={() => saveMutation.mutate(inpi)}
          disabled={saveMutation.isPending}
          className="w-full h-12"
          size="lg"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Salvar Configurações do INPI
        </Button>
      </motion.div>
    </motion.div>
  );
}
