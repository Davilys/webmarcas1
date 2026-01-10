import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SettingsCard } from './SettingsCard';
import { DollarSign, Percent, Calendar, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

interface FinancialData {
  currency: string;
  inpiFee: number;
  defaultHonorarios: number;
  defaultDueDays: number;
  cashDiscount: number;
  maxInstallments: number;
}

export function FinancialSettings() {
  const queryClient = useQueryClient();
  const [financial, setFinancial] = useState<FinancialData>({
    currency: 'BRL',
    inpiFee: 355,
    defaultHonorarios: 1500,
    defaultDueDays: 7,
    cashDiscount: 5,
    maxInstallments: 12,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['settings-financial'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'financial')
        .single();
      
      if (error) throw error;
      return data?.value as unknown as FinancialData;
    },
  });

  useEffect(() => {
    if (data) {
      setFinancial(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newFinancial: FinancialData) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.parse(JSON.stringify(newFinancial)), updated_at: new Date().toISOString() })
        .eq('key', 'financial');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-financial'] });
      toast.success('Configurações financeiras salvas!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: financial.currency,
    }).format(value);
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
        icon={DollarSign}
        title="Moeda e Valores Padrão"
        description="Configure a moeda e taxas base do sistema"
        glowColor="green"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Moeda</Label>
            <Select
              value={financial.currency}
              onValueChange={(value) => setFinancial({ ...financial, currency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real (R$)</SelectItem>
                <SelectItem value="USD">Dólar ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Taxa INPI (GRU)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="number"
                value={financial.inpiFee}
                onChange={(e) => setFinancial({ ...financial, inpiFee: parseFloat(e.target.value) || 0 })}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Honorários Padrão</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="number"
                value={financial.defaultHonorarios}
                onChange={(e) => setFinancial({ ...financial, defaultHonorarios: parseFloat(e.target.value) || 0 })}
                className="pl-10"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">
            Valor total padrão: <span className="font-semibold text-foreground">{formatCurrency(financial.inpiFee + financial.defaultHonorarios)}</span>
          </p>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Calendar}
        title="Condições de Pagamento"
        description="Configure prazos e vencimentos padrão"
        glowColor="cyan"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Dias para Vencimento</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={60}
                value={financial.defaultDueDays}
                onChange={(e) => setFinancial({ ...financial, defaultDueDays: parseInt(e.target.value) || 7 })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">dias após emissão</span>
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={CreditCard}
        title="Parcelamento e Descontos"
        description="Configure opções de pagamento flexíveis"
        glowColor="purple"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Desconto à Vista</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={50}
                value={financial.cashDiscount}
                onChange={(e) => setFinancial({ ...financial, cashDiscount: parseInt(e.target.value) || 0 })}
                className="w-24"
              />
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Parcelas Máximas</Label>
            <Select
              value={financial.maxInstallments.toString()}
              onValueChange={(value) => setFinancial({ ...financial, maxInstallments: parseInt(value) })}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 6, 10, 12, 18, 24].map((n) => (
                  <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            💡 Com desconto à vista: <span className="font-semibold">{formatCurrency((financial.inpiFee + financial.defaultHonorarios) * (1 - financial.cashDiscount / 100))}</span>
          </p>
        </div>
      </SettingsCard>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button 
          onClick={() => saveMutation.mutate(financial)}
          disabled={saveMutation.isPending}
          className="w-full h-12"
          size="lg"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Salvar Configurações Financeiras
        </Button>
      </motion.div>
    </motion.div>
  );
}
