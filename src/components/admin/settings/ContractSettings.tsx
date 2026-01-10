import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SettingsCard } from './SettingsCard';
import { FileText, Link, Shield, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';

interface ContractData {
  linkValidityDays: number;
  requireSignature: boolean;
  blockchainVerification: boolean;
  defaultTemplateId: string | null;
  requiredFields: string[];
}

const availableFields = [
  { id: 'cpf', label: 'CPF' },
  { id: 'cnpj', label: 'CNPJ' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Telefone' },
  { id: 'address', label: 'Endereço' },
  { id: 'rg', label: 'RG' },
];

export function ContractSettings() {
  const queryClient = useQueryClient();
  const [contracts, setContracts] = useState<ContractData>({
    linkValidityDays: 7,
    requireSignature: true,
    blockchainVerification: true,
    defaultTemplateId: null,
    requiredFields: ['cpf', 'email', 'phone'],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['settings-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'contracts')
        .single();
      
      if (error) throw error;
      return data?.value as unknown as ContractData;
    },
  });

  useEffect(() => {
    if (data) {
      setContracts(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newContracts: ContractData) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.parse(JSON.stringify(newContracts)), updated_at: new Date().toISOString() })
        .eq('key', 'contracts');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-contracts'] });
      toast.success('Configurações de contratos salvas!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    },
  });

  const toggleField = (fieldId: string) => {
    const newFields = contracts.requiredFields.includes(fieldId)
      ? contracts.requiredFields.filter(f => f !== fieldId)
      : [...contracts.requiredFields, fieldId];
    setContracts({ ...contracts, requiredFields: newFields });
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
        icon={Clock}
        title="Validade do Link"
        description="Tempo de expiração do link de assinatura"
        glowColor="cyan"
      >
        <div className="space-y-2">
          <Label>Dias de Validade</Label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min={1}
              max={30}
              value={contracts.linkValidityDays}
              onChange={(e) => setContracts({ ...contracts, linkValidityDays: parseInt(e.target.value) || 7 })}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">dias após o envio</span>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Shield}
        title="Segurança da Assinatura"
        description="Configurações de validação e autenticação"
        glowColor="green"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Assinatura Obrigatória</Label>
              <p className="text-sm text-muted-foreground">Exigir assinatura digital em todos os contratos</p>
            </div>
            <Switch
              checked={contracts.requireSignature}
              onCheckedChange={(checked) => setContracts({ ...contracts, requireSignature: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Verificação Blockchain</Label>
              <p className="text-sm text-muted-foreground">Registrar hash do documento em blockchain</p>
            </div>
            <Switch
              checked={contracts.blockchainVerification}
              onCheckedChange={(checked) => setContracts({ ...contracts, blockchainVerification: checked })}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={FileText}
        title="Campos Obrigatórios"
        description="Dados que devem ser coletados na assinatura"
        glowColor="purple"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availableFields.map((field) => (
            <motion.div
              key={field.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer"
              onClick={() => toggleField(field.id)}
            >
              <Checkbox
                id={field.id}
                checked={contracts.requiredFields.includes(field.id)}
                onCheckedChange={() => toggleField(field.id)}
              />
              <label
                htmlFor={field.id}
                className="text-sm font-medium cursor-pointer"
              >
                {field.label}
              </label>
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
          onClick={() => saveMutation.mutate(contracts)}
          disabled={saveMutation.isPending}
          className="w-full h-12"
          size="lg"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Salvar Configurações de Contratos
        </Button>
      </motion.div>
    </motion.div>
  );
}
