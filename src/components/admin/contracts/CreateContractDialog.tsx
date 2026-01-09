import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  leadId?: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

interface ContractType {
  id: string;
  name: string;
}

export function CreateContractDialog({ open, onOpenChange, onSuccess, leadId }: CreateContractDialogProps) {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  
  const [formData, setFormData] = useState({
    user_id: '',
    subject: '',
    contract_value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    contract_type_id: '',
    description: '',
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    const [profilesRes, typesRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').order('full_name'),
      supabase.from('contract_types').select('*'),
    ]);

    setProfiles(profilesRes.data || []);
    setContractTypes(typesRes.data || []);
  };

  const generateContractNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${year}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_id || !formData.subject || !formData.start_date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('contracts').insert({
        user_id: formData.user_id,
        contract_number: generateContractNumber(),
        subject: formData.subject,
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        contract_type_id: formData.contract_type_id || null,
        description: formData.description || null,
        signature_status: 'not_signed',
        visible_to_client: true,
        lead_id: leadId || null,
      });

      if (error) throw error;

      toast.success('Contrato criado com sucesso');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Erro ao criar contrato');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      subject: '',
      contract_value: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      contract_type_id: '',
      description: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Contrato</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Cliente *</Label>
              <Select 
                value={formData.user_id}
                onValueChange={(value) => setFormData({ ...formData, user_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name || profile.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Assunto *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Ex: CONTRATO REGISTRO DE MARCA 699,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Valor do Contrato</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.contract_value}
                onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Contrato</Label>
              <Select 
                value={formData.contract_type_id}
                onValueChange={(value) => setFormData({ ...formData, contract_type_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Detalhes do contrato..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Contrato
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
