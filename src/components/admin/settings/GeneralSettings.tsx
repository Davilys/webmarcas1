import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Phone, Mail, MapPin, Clock, Save, Loader2 } from 'lucide-react';

interface CompanySettings {
  name: string;
  phone: string;
  email: string;
  cnpj: string;
  address: string;
}

interface BusinessHours {
  weekdays: string;
  saturday: string;
  sunday: string;
}

export function GeneralSettings() {
  const queryClient = useQueryClient();

  const { data: companyData, isLoading: loadingCompany } = useQuery({
    queryKey: ['system-settings', 'company'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'company')
        .single();
      
      if (error) throw error;
      return data?.value as unknown as CompanySettings;
    },
  });

  const { data: hoursData, isLoading: loadingHours } = useQuery({
    queryKey: ['system-settings', 'business_hours'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'business_hours')
        .single();
      
      if (error) throw error;
      return data?.value as unknown as BusinessHours;
    },
  });

  const [company, setCompany] = useState<CompanySettings>({
    name: '',
    phone: '',
    email: '',
    cnpj: '',
    address: '',
  });

  const [hours, setHours] = useState<BusinessHours>({
    weekdays: '09:00-18:00',
    saturday: '09:00-13:00',
    sunday: 'Fechado',
  });

  // Update state when data loads
  useState(() => {
    if (companyData) setCompany(companyData);
    if (hoursData) setHours(hoursData);
  });

  const saveCompanyMutation = useMutation({
    mutationFn: async (data: CompanySettings) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.parse(JSON.stringify(data)), updated_at: new Date().toISOString() })
        .eq('key', 'company');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings', 'company'] });
      toast.success('Dados da empresa salvos com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao salvar dados da empresa');
    },
  });

  const saveHoursMutation = useMutation({
    mutationFn: async (data: BusinessHours) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: JSON.parse(JSON.stringify(data)), updated_at: new Date().toISOString() })
        .eq('key', 'business_hours');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings', 'business_hours'] });
      toast.success('Horários salvos com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao salvar horários');
    },
  });

  const isLoading = loadingCompany || loadingHours;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentCompany = company.name ? company : (companyData || company);
  const currentHours = hours.weekdays !== '09:00-18:00' || hoursData ? (hoursData || hours) : hours;

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informações da Empresa
          </CardTitle>
          <CardDescription>Configure os dados básicos da sua empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input
                id="company-name"
                value={currentCompany.name}
                onChange={(e) => setCompany({ ...currentCompany, name: e.target.value })}
                placeholder="WebMarcas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={currentCompany.cnpj}
                onChange={(e) => setCompany({ ...currentCompany, cnpj: e.target.value })}
                placeholder="00.000.000/0001-00"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={currentCompany.phone}
                onChange={(e) => setCompany({ ...currentCompany, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Principal
              </Label>
              <Input
                id="email"
                type="email"
                value={currentCompany.email}
                onChange={(e) => setCompany({ ...currentCompany, email: e.target.value })}
                placeholder="contato@webmarcas.net"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço Completo
            </Label>
            <Textarea
              id="address"
              value={currentCompany.address}
              onChange={(e) => setCompany({ ...currentCompany, address: e.target.value })}
              placeholder="Rua, Número, Bairro, Cidade - Estado, CEP"
              rows={2}
            />
          </div>

          <Button 
            onClick={() => saveCompanyMutation.mutate(company.name ? company : currentCompany)}
            disabled={saveCompanyMutation.isPending}
          >
            {saveCompanyMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Dados da Empresa
          </Button>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário de Funcionamento
          </CardTitle>
          <CardDescription>Configure os horários de atendimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="weekdays">Segunda a Sexta</Label>
              <Input
                id="weekdays"
                value={currentHours.weekdays}
                onChange={(e) => setHours({ ...currentHours, weekdays: e.target.value })}
                placeholder="09:00-18:00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saturday">Sábado</Label>
              <Input
                id="saturday"
                value={currentHours.saturday}
                onChange={(e) => setHours({ ...currentHours, saturday: e.target.value })}
                placeholder="09:00-13:00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sunday">Domingo</Label>
              <Input
                id="sunday"
                value={currentHours.sunday}
                onChange={(e) => setHours({ ...currentHours, sunday: e.target.value })}
                placeholder="Fechado"
              />
            </div>
          </div>

          <Button 
            onClick={() => saveHoursMutation.mutate(hours.weekdays !== currentHours.weekdays ? hours : currentHours)}
            disabled={saveHoursMutation.isPending}
          >
            {saveHoursMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Horários
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
