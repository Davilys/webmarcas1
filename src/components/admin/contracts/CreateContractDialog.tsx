import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, FileText, Send, Copy, Link, UserPlus } from 'lucide-react';
import { generateDocumentContent } from '@/lib/documentTemplates';

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
  phone: string | null;
  company_name: string | null;
  cpf_cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

interface ContractTemplate {
  id: string;
  name: string;
  content: string;
  variables: any;
}

type DocumentType = 'contract' | 'procuracao' | 'distrato_multa' | 'distrato_sem_multa';

// Mapeamento de nomes de templates para document_type
const getDocumentTypeFromTemplateName = (name: string): DocumentType => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('procuração') || lowerName.includes('procuracao')) return 'procuracao';
  if (lowerName.includes('distrato') && lowerName.includes('multa') && !lowerName.includes('sem')) return 'distrato_multa';
  if (lowerName.includes('distrato') && lowerName.includes('sem')) return 'distrato_sem_multa';
  return 'contract';
};

export function CreateContractDialog({ open, onOpenChange, onSuccess, leadId }: CreateContractDialogProps) {
  const [loading, setLoading] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [createdContractId, setCreatedContractId] = useState<string | null>(null);
  const [isNewClient, setIsNewClient] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  
  const [formData, setFormData] = useState({
    user_id: '',
    subject: '',
    contract_value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    template_id: '',
    description: '',
    document_type: 'contract' as DocumentType,
    // Document-specific fields
    signatory_name: '',
    signatory_cpf: '',
    signatory_cnpj: '',
    company_address: '',
    company_city: '',
    company_state: '',
    company_cep: '',
    brand_name: '',
    penalty_value: '',
    penalty_installments: '1',
    // New client fields
    signatory_email: '',
    signatory_phone: '',
    signatory_company: '',
    business_area: '',
  });

  useEffect(() => {
    if (open) {
      fetchData();
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    // Auto-fill fields when profile is selected
    if (selectedProfile) {
      setFormData(prev => ({
        ...prev,
        signatory_name: selectedProfile.full_name || '',
        signatory_cpf: selectedProfile.cpf_cnpj?.replace(/[^\d]/g, '').length === 11 
          ? selectedProfile.cpf_cnpj : '',
        signatory_cnpj: selectedProfile.cpf_cnpj?.replace(/[^\d]/g, '').length === 14 
          ? selectedProfile.cpf_cnpj : '',
        company_address: selectedProfile.address || '',
        company_city: selectedProfile.city || '',
        company_state: selectedProfile.state || '',
        company_cep: selectedProfile.zip_code || '',
      }));
    }
  }, [selectedProfile]);

  const fetchData = async () => {
    const [profilesRes, templatesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('contract_templates')
        .select('id, name, content, variables')
        .eq('is_active', true)
        .order('name'),
    ]);

    setProfiles(profilesRes.data || []);
    setTemplates(templatesRes.data || []);
  };

  const generateContractNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${year}${random}`;
  };

  const generateDocumentHtml = () => {
    if (formData.document_type === 'contract') {
      return formData.description || '';
    }

    const vars = {
      nome_empresa: selectedProfile?.company_name || formData.signatory_name || '',
      cnpj: formData.signatory_cnpj || '',
      endereco: formData.company_address || '',
      cidade: formData.company_city || '',
      estado: formData.company_state || '',
      cep: formData.company_cep || '',
      nome_representante: formData.signatory_name || '',
      cpf_representante: formData.signatory_cpf || '',
      email: selectedProfile?.email || '',
      telefone: selectedProfile?.phone || '',
      marca: formData.brand_name || '',
      valor_multa: formData.penalty_value || '',
      numero_parcela: formData.penalty_installments || '1',
    };

    return generateDocumentContent(formData.document_type, vars);
  };

  const createNewClient = async (): Promise<string | null> => {
    setCreatingClient(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-client-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            email: formData.signatory_email,
            full_name: formData.signatory_name,
            phone: formData.signatory_phone,
            company_name: formData.signatory_company || null,
            cpf_cnpj: formData.signatory_cnpj || formData.signatory_cpf || null,
            address: formData.company_address || null,
            city: formData.company_city || null,
            state: formData.company_state || null,
            zip_code: formData.company_cep || null,
            brand_name: formData.brand_name || null,
            business_area: formData.business_area || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Erro ao criar cliente');
      }

      if (result.isExisting) {
        toast.info('Cliente já existente - documento será vinculado');
      } else {
        toast.success('Novo cliente criado com sucesso');
      }

      return result.userId;
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast.error(error.message || 'Erro ao criar cliente');
      return null;
    } finally {
      setCreatingClient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, sendLink = false) => {
    e.preventDefault();
    
    // Validate based on new client or existing
    if (isNewClient) {
      if (!formData.signatory_email || !formData.signatory_name) {
        toast.error('Preencha Email e Nome do cliente');
        return;
      }
    } else if (!formData.user_id) {
      toast.error('Selecione um cliente');
      return;
    }
    
    if (!formData.subject) {
      toast.error('Preencha o assunto do documento');
      return;
    }

    setLoading(true);
    try {
      let userId = formData.user_id;

      // If new client, create first
      if (isNewClient) {
        const newUserId = await createNewClient();
        if (!newUserId) {
          setLoading(false);
          return;
        }
        userId = newUserId;
      }

      const contractHtml = generateDocumentHtml();

      const { data: contract, error } = await supabase.from('contracts').insert({
        user_id: userId,
        contract_number: generateContractNumber(),
        subject: formData.subject,
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        template_id: formData.template_id || null,
        description: formData.description || null,
        contract_html: contractHtml,
        document_type: formData.document_type,
        signatory_name: formData.signatory_name || null,
        signatory_cpf: formData.signatory_cpf || null,
        signatory_cnpj: formData.signatory_cnpj || null,
        penalty_value: formData.penalty_value ? parseFloat(formData.penalty_value) : null,
        signature_status: 'not_signed',
        visible_to_client: true,
        lead_id: leadId || null,
      }).select().single();

      if (error) throw error;

      setCreatedContractId(contract.id);
      toast.success('Documento criado com sucesso');

      if (sendLink) {
        // Pass new client contact info for sending
        await generateAndSendLink(contract.id, isNewClient ? {
          email: formData.signatory_email,
          phone: formData.signatory_phone,
          name: formData.signatory_name,
        } : undefined);
      } else {
        onSuccess();
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Erro ao criar documento');
    } finally {
      setLoading(false);
    }
  };

  const generateAndSendLink = async (contractId: string, newClientContact?: { email: string; phone: string; name: string }) => {
    setSendingLink(true);
    try {
      // Generate signature link
      const linkResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-signature-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ contractId, expiresInDays: 7, baseUrl: window.location.origin }),
        }
      );

      const linkResult = await linkResponse.json();
      
      if (!linkResponse.ok || linkResult.error) {
        throw new Error(linkResult.error || 'Erro ao gerar link');
      }

      setGeneratedLink(linkResult.data.url);

      // Send signature request with optional override contact
      const sendResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-signature-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ 
            contractId, 
            channels: ['email', 'whatsapp'], 
            baseUrl: window.location.origin,
            // Override contact info for new clients
            overrideContact: newClientContact,
          }),
        }
      );

      const sendResult = await sendResponse.json();
      
      if (sendResponse.ok && sendResult.success) {
        toast.success('Link de assinatura enviado!');
      } else {
        toast.warning('Documento criado, mas houve erro ao enviar notificações');
      }
    } catch (error: any) {
      console.error('Error generating/sending link:', error);
      toast.error(error.message || 'Erro ao gerar/enviar link');
    } finally {
      setSendingLink(false);
    }
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success('Link copiado!');
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      subject: '',
      contract_value: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      template_id: '',
      description: '',
      document_type: 'contract',
      signatory_name: '',
      signatory_cpf: '',
      signatory_cnpj: '',
      company_address: '',
      company_city: '',
      company_state: '',
      company_cep: '',
      brand_name: '',
      penalty_value: '',
      penalty_installments: '1',
      signatory_email: '',
      signatory_phone: '',
      signatory_company: '',
      business_area: '',
    });
    setSelectedProfile(null);
    setSelectedTemplate(null);
    setGeneratedLink(null);
    setCreatedContractId(null);
    setIsNewClient(false);
  };

  const handleProfileChange = (userId: string) => {
    setFormData({ ...formData, user_id: userId });
    const profile = profiles.find(p => p.id === userId);
    setSelectedProfile(profile || null);
  };

  const handleNewClientToggle = (checked: boolean) => {
    setIsNewClient(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, user_id: '' }));
      setSelectedProfile(null);
    }
  };

  const isSpecialDocument = formData.document_type !== 'contract';
  const isDistrato = formData.document_type === 'distrato_multa' || formData.document_type === 'distrato_sem_multa';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Novo Documento
          </DialogTitle>
        </DialogHeader>

        {generatedLink ? (
          /* Success state with link */
          <div className="py-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Link className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800">Documento Criado!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                O link de assinatura foi gerado e enviado ao cliente.
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <Label className="text-xs text-muted-foreground">Link de Assinatura:</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input value={generatedLink} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Válido por 7 dias. O cliente pode assinar acessando este link.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                onSuccess();
                onOpenChange(false);
                resetForm();
              }}>
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Modelo de Documento *</Label>
              <Select 
                value={selectedTemplate?.id || ''}
                onValueChange={(value) => {
                  const template = templates.find(t => t.id === value);
                  setSelectedTemplate(template || null);
                  if (template) {
                    const docType = getDocumentTypeFromTemplateName(template.name);
                    setFormData(prev => ({ 
                      ...prev, 
                      document_type: docType,
                      template_id: template.id
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="details">Dados do Signatário</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Toggle between existing and new client */}
                  <div className="col-span-2 flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                    <Checkbox 
                      id="newClient" 
                      checked={isNewClient}
                      onCheckedChange={handleNewClientToggle}
                    />
                    <label 
                      htmlFor="newClient" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="h-4 w-4" />
                      Criar novo cliente
                    </label>
                  </div>

                  {!isNewClient ? (
                    <div className="space-y-2 col-span-2">
                      <Label>Cliente *</Label>
                      <Select 
                        value={formData.user_id}
                        onValueChange={handleProfileChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.map(profile => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.full_name || profile.email}
                              {profile.company_name && ` - ${profile.company_name}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <>
                      {/* New Client Form Fields */}
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={formData.signatory_email}
                          onChange={(e) => setFormData({ ...formData, signatory_email: e.target.value })}
                          placeholder="cliente@email.com"
                          required={isNewClient}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone (WhatsApp)</Label>
                        <Input
                          value={formData.signatory_phone}
                          onChange={(e) => setFormData({ ...formData, signatory_phone: e.target.value })}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2 col-span-2">
                    <Label>Assunto *</Label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder={isSpecialDocument 
                        ? `Ex: ${formData.document_type === 'procuracao' ? 'Procuração INPI - Marca XYZ' : 'Distrato - Marca XYZ'}` 
                        : 'Ex: CONTRATO REGISTRO DE MARCA 699,00'
                      }
                      required
                    />
                  </div>

                  {isDistrato && (
                    <div className="space-y-2 col-span-2">
                      <Label>Nome da Marca</Label>
                      <Input
                        value={formData.brand_name}
                        onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                        placeholder="Nome da marca relacionada ao distrato"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Valor do Documento</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.contract_value}
                      onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  {formData.document_type === 'distrato_multa' && (
                    <>
                      <div className="space-y-2">
                        <Label>Valor da Multa (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.penalty_value}
                          onChange={(e) => setFormData({ ...formData, penalty_value: e.target.value })}
                          placeholder="398.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nº de Parcelas da Multa</Label>
                        <Input
                          type="number"
                          value={formData.penalty_installments}
                          onChange={(e) => setFormData({ ...formData, penalty_installments: e.target.value })}
                          placeholder="1"
                        />
                      </div>
                    </>
                  )}


                  <div className="space-y-2">
                    <Label>Data de Início</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
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

                  {!isSpecialDocument && (
                    <div className="space-y-2 col-span-2">
                      <Label>Descrição / Conteúdo</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        placeholder="Detalhes do contrato..."
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  {isNewClient 
                    ? 'Preencha os dados completos do novo cliente e representante legal.'
                    : isSpecialDocument 
                      ? 'Preencha os dados do representante legal que irá assinar o documento.'
                      : 'Dados opcionais do signatário.'}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Nome do Representante Legal {(isSpecialDocument || isNewClient) && '*'}</Label>
                    <Input
                      value={formData.signatory_name}
                      onChange={(e) => setFormData({ ...formData, signatory_name: e.target.value })}
                      placeholder="Nome completo"
                      required={isNewClient}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CPF do Representante</Label>
                    <Input
                      value={formData.signatory_cpf}
                      onChange={(e) => setFormData({ ...formData, signatory_cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CNPJ da Empresa {isNewClient && '(opcional)'}</Label>
                    <Input
                      value={formData.signatory_cnpj}
                      onChange={(e) => setFormData({ ...formData, signatory_cnpj: e.target.value })}
                      placeholder="00.000.000/0001-00"
                    />
                  </div>

                  {isNewClient && (
                    <>
                      <div className="space-y-2 col-span-2">
                        <Label>Razão Social (opcional)</Label>
                        <Input
                          value={formData.signatory_company}
                          onChange={(e) => setFormData({ ...formData, signatory_company: e.target.value })}
                          placeholder="Nome da empresa"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Nome da Marca</Label>
                        <Input
                          value={formData.brand_name}
                          onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                          placeholder="Nome da marca"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Ramo de Atividade</Label>
                        <Input
                          value={formData.business_area}
                          onChange={(e) => setFormData({ ...formData, business_area: e.target.value })}
                          placeholder="Ex: Alimentação, Vestuário..."
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2 col-span-2">
                    <Label>Endereço</Label>
                    <Input
                      value={formData.company_address}
                      onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                      placeholder="Rua, número, bairro"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={formData.company_city}
                      onChange={(e) => setFormData({ ...formData, company_city: e.target.value })}
                      placeholder="São Paulo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input
                      value={formData.company_state}
                      onChange={(e) => setFormData({ ...formData, company_state: e.target.value })}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input
                      value={formData.company_cep}
                      onChange={(e) => setFormData({ ...formData, company_cep: e.target.value })}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || sendingLink || creatingClient}>
                {(loading || creatingClient) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Documento
              </Button>
              {(isSpecialDocument || isNewClient) && (
                <Button 
                  type="button" 
                  variant="default"
                  onClick={(e) => handleSubmit(e as any, true)}
                  disabled={loading || sendingLink || creatingClient}
                >
                  {(sendingLink || creatingClient) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {isNewClient ? 'Criar Cliente e Enviar' : 'Criar e Enviar Link'}
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
