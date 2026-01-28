import { useState, useEffect, useCallback } from 'react';
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
import { Loader2, FileText, Send, Copy, Link, UserPlus, Search } from 'lucide-react';
import { generateDocumentContent } from '@/lib/documentTemplates';
import { replaceContractVariables } from '@/hooks/useContractTemplate';
import { 
  validateCPF, 
  validateCNPJ, 
  formatCPF, 
  formatCNPJ, 
  formatCEP, 
  formatPhone,
  fetchAddressByCEP 
} from '@/lib/validators';
import { z } from 'zod';

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

// Validation schemas matching public form
const personalDataSchema = z.object({
  fullName: z.string().min(3, "Nome completo obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(14, "Telefone obrigatório"),
  cpf: z.string().refine(validateCPF, "CPF inválido"),
  cep: z.string().min(9, "CEP obrigatório"),
  address: z.string().min(5, "Endereço obrigatório"),
  neighborhood: z.string().min(2, "Bairro obrigatório"),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().length(2, "UF obrigatório"),
});

const brandDataSchema = z.object({
  brandName: z.string().min(2, "Nome da marca obrigatório"),
  businessArea: z.string().min(3, "Ramo de atividade obrigatório"),
  hasCNPJ: z.boolean(),
  cnpj: z.string().optional(),
  companyName: z.string().optional(),
}).refine((data) => {
  if (data.hasCNPJ) {
    if (!data.cnpj || !validateCNPJ(data.cnpj)) return false;
    if (!data.companyName || data.companyName.length < 3) return false;
  }
  return true;
}, {
  message: "CNPJ ou Razão Social inválidos",
  path: ["cnpj"],
});

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
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentTab, setCurrentTab] = useState('personal');
  
  // New client personal data - matching public form exactly
  const [personalData, setPersonalData] = useState({
    fullName: '',
    email: '',
    phone: '',
    cpf: '',
    cep: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  // Brand data - matching public form exactly
  const [brandData, setBrandData] = useState({
    brandName: '',
    businessArea: '',
    hasCNPJ: false,
    cnpj: '',
    companyName: '',
  });

  // Payment method - matching public form
  const [paymentMethod, setPaymentMethod] = useState<'avista' | 'cartao6x' | 'boleto3x'>('avista');

  // Legacy form data for existing client flows
  const [formData, setFormData] = useState({
    user_id: '',
    subject: '',
    contract_value: '699',
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

    // Auto-select the standard contract template for new clients
    const standardTemplate = templatesRes.data?.find(t => 
      t.name.toLowerCase().includes('registro de marca') || 
      t.name.toLowerCase().includes('padrão')
    );
    if (standardTemplate) {
      setSelectedTemplate(standardTemplate);
      setFormData(prev => ({ ...prev, template_id: standardTemplate.id }));
    }
  };

  const generateContractNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${year}${random}`;
  };

  // CEP auto-fill - same as public form
  const handleCEPChange = useCallback(async (value: string) => {
    const formatted = formatCEP(value);
    setPersonalData(prev => ({ ...prev, cep: formatted }));

    const cleanCEP = formatted.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setIsLoadingCEP(true);
      const addressData = await fetchAddressByCEP(cleanCEP);
      if (addressData) {
        setPersonalData(prev => ({
          ...prev,
          address: addressData.logradouro || prev.address,
          neighborhood: addressData.bairro || prev.neighborhood,
          city: addressData.localidade || prev.city,
          state: addressData.uf || prev.state,
        }));
      }
      setIsLoadingCEP(false);
    }
  }, []);

  // Generate contract HTML using standard template - EXACTLY like public form
  const generateNewClientContractHtml = () => {
    const template = selectedTemplate?.content || '';
    
    return replaceContractVariables(template, {
      personalData: {
        fullName: personalData.fullName,
        email: personalData.email,
        phone: personalData.phone,
        cpf: personalData.cpf,
        cep: personalData.cep,
        address: personalData.address,
        neighborhood: personalData.neighborhood,
        city: personalData.city,
        state: personalData.state,
      },
      brandData: {
        brandName: brandData.brandName,
        businessArea: brandData.businessArea,
        hasCNPJ: brandData.hasCNPJ,
        cnpj: brandData.cnpj,
        companyName: brandData.companyName,
      },
      paymentMethod: paymentMethod,
    });
  };

  // Get contract value based on payment method
  const getContractValue = () => {
    switch (paymentMethod) {
      case 'avista': return 699;
      case 'cartao6x': return 1194;
      case 'boleto3x': return 1197;
      default: return 699;
    }
  };

  // Get payment description for display
  const getPaymentDescription = () => {
    switch (paymentMethod) {
      case 'avista': return 'PIX à vista - R$ 699,00';
      case 'cartao6x': return 'Cartão 6x de R$ 199,00 = R$ 1.194,00';
      case 'boleto3x': return 'Boleto 3x de R$ 399,00 = R$ 1.197,00';
      default: return 'PIX à vista - R$ 699,00';
    }
  };

  const generateDocumentHtml = () => {
    // For new clients, use the standard contract template with replaced variables
    if (isNewClient) {
      return generateNewClientContractHtml();
    }

    // Extract brand name from subject if brand_name is empty
    // Subject format is usually "CONTRATO REGISTRO DE MARCA - BRAND NAME" or "Procuração INPI - Brand Name"
    const extractBrandFromSubject = (subject: string): string => {
      if (!subject) return '';
      // Try to extract after " - " separator
      const parts = subject.split(' - ');
      if (parts.length > 1) {
        return parts.slice(1).join(' - ').trim();
      }
      // Otherwise return the full subject as brand name
      return subject;
    };

    const effectiveBrandName = formData.brand_name || extractBrandFromSubject(formData.subject) || '';

    // Derive the document type from the selected template to avoid race conditions
    // (e.g., user changes template and immediately clicks "Gerar link" before setFormData applies).
    const effectiveDocumentType: DocumentType = selectedTemplate
      ? getDocumentTypeFromTemplateName(selectedTemplate.name)
      : formData.document_type;

    // Parse address to extract neighborhood if available
    const parseAddressForNeighborhood = (address: string): { mainAddress: string; neighborhood: string } => {
      if (!address) return { mainAddress: '', neighborhood: '' };
      const parts = address.split(',').map(s => s.trim());
      return {
        mainAddress: parts[0] || '',
        neighborhood: parts[1] || '',
      };
    };

    const addressParts = parseAddressForNeighborhood(selectedProfile?.address || formData.company_address || '');

    // For existing clients with a selected template - use the template content with profile data
    if (selectedTemplate && selectedProfile) {
      // Check if it's a standard contract template (Registro de Marca INPI)
      const isStandardContract = selectedTemplate.name.toLowerCase().includes('registro de marca') ||
                                  selectedTemplate.name.toLowerCase().includes('padrão');
      
      if (isStandardContract) {
        // Use replaceContractVariables with profile data
        return replaceContractVariables(selectedTemplate.content, {
          personalData: {
            fullName: selectedProfile.full_name || formData.signatory_name || '',
            email: selectedProfile.email || '',
            phone: selectedProfile.phone || '',
            cpf: selectedProfile.cpf_cnpj?.replace(/[^\d]/g, '').length === 11 
              ? selectedProfile.cpf_cnpj : formData.signatory_cpf || '',
            cep: selectedProfile.zip_code || formData.company_cep || '',
            address: addressParts.mainAddress || selectedProfile.address || formData.company_address || '',
            neighborhood: addressParts.neighborhood,
            city: selectedProfile.city || formData.company_city || '',
            state: selectedProfile.state || formData.company_state || '',
          },
          brandData: {
            brandName: effectiveBrandName,
            businessArea: '', // Use default or get from form
            hasCNPJ: (selectedProfile.cpf_cnpj?.replace(/[^\d]/g, '').length === 14) || !!formData.signatory_cnpj,
            cnpj: selectedProfile.cpf_cnpj?.replace(/[^\d]/g, '').length === 14 
              ? selectedProfile.cpf_cnpj : formData.signatory_cnpj || '',
            companyName: selectedProfile.company_name || '',
          },
          paymentMethod: paymentMethod, // Use selected payment method
        });
      }
    }

    // Legacy flow for contracts - use description if provided, or empty template
    if (effectiveDocumentType === 'contract') {
      // If we have a template selected, use its content as fallback
      if (selectedTemplate?.content && !formData.description) {
        return selectedTemplate.content;
      }
      return formData.description || '';
    }

    // For other document types (procuracao, distrato) using database templates
    // Priority: Use selectedTemplate?.content from database and replace variables directly
    if (selectedTemplate?.content) {
      const currentDate = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      
      const fullAddress = `${addressParts.mainAddress}${addressParts.neighborhood ? ', ' + addressParts.neighborhood : ''}`;
      
      // Replace all template variables with client data
      let result = selectedTemplate.content
        // Company/Personal data
        .replace(/\{\{nome_empresa\}\}/g, selectedProfile?.company_name || formData.signatory_name || selectedProfile?.full_name || '')
        .replace(/\{\{endereco_empresa\}\}/g, fullAddress)
        .replace(/\{\{endereco\}\}/g, fullAddress)
        .replace(/\{\{cidade\}\}/g, selectedProfile?.city || formData.company_city || '')
        .replace(/\{\{estado\}\}/g, selectedProfile?.state || formData.company_state || '')
        .replace(/\{\{cep\}\}/g, selectedProfile?.zip_code || formData.company_cep || '')
        .replace(/\{\{cnpj\}\}/g, formData.signatory_cnpj || (selectedProfile?.cpf_cnpj?.replace(/[^\d]/g, '').length === 14 ? selectedProfile.cpf_cnpj : '') || '')
        // Representative data
        .replace(/\{\{nome_representante\}\}/g, formData.signatory_name || selectedProfile?.full_name || '')
        .replace(/\{\{cpf_representante\}\}/g, formData.signatory_cpf || (selectedProfile?.cpf_cnpj?.replace(/[^\d]/g, '').length === 11 ? selectedProfile.cpf_cnpj : '') || '')
        // Contact info
        .replace(/\{\{email\}\}/g, selectedProfile?.email || '')
        .replace(/\{\{telefone\}\}/g, selectedProfile?.phone || '')
        // Brand and distrato specifics
        .replace(/\{\{marca\}\}/g, effectiveBrandName)
        .replace(/\{\{data_procuracao\}\}/g, currentDate)
        .replace(/\{\{data_distrato\}\}/g, currentDate)
        .replace(/\{\{valor_multa\}\}/g, formData.penalty_value || '0,00')
        .replace(/\{\{numero_parcelas\}\}/g, formData.penalty_installments || '1');
      
      return result;
    }

    // Fallback to generateDocumentContent only if no template selected
    const vars = {
      nome_empresa: selectedProfile?.company_name || formData.signatory_name || selectedProfile?.full_name || '',
      cnpj: formData.signatory_cnpj || (selectedProfile?.cpf_cnpj?.replace(/[^\d]/g, '').length === 14 ? selectedProfile.cpf_cnpj : '') || '',
      endereco: addressParts.mainAddress || selectedProfile?.address || formData.company_address || '',
      cidade: selectedProfile?.city || formData.company_city || '',
      estado: selectedProfile?.state || formData.company_state || '',
      cep: selectedProfile?.zip_code || formData.company_cep || '',
      nome_representante: formData.signatory_name || selectedProfile?.full_name || '',
      cpf_representante: formData.signatory_cpf || (selectedProfile?.cpf_cnpj?.replace(/[^\d]/g, '').length === 11 ? selectedProfile.cpf_cnpj : '') || '',
      email: selectedProfile?.email || '',
      telefone: selectedProfile?.phone || '',
      marca: effectiveBrandName,
      valor_multa: formData.penalty_value || '',
      numero_parcela: formData.penalty_installments || '1',
    };

    // At this point, effectiveDocumentType is guaranteed NOT to be 'contract'
    const nonContractType = effectiveDocumentType as Exclude<DocumentType, 'contract'>;
    return generateDocumentContent(nonContractType, vars);
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
            email: personalData.email,
            full_name: personalData.fullName,
            phone: personalData.phone,
            cpf_cnpj: brandData.hasCNPJ ? brandData.cnpj : personalData.cpf,
            company_name: brandData.hasCNPJ ? brandData.companyName : null,
            address: `${personalData.address}, ${personalData.neighborhood}`,
            city: personalData.city,
            state: personalData.state,
            zip_code: personalData.cep,
            brand_name: brandData.brandName,
            business_area: brandData.businessArea,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Erro ao criar cliente');
      }

      if (result.isExisting) {
        toast.info('Cliente já existente - contrato será vinculado');
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

  const validateNewClientData = (): boolean => {
    setValidationErrors({});
    const errors: Record<string, string> = {};

    // Validate personal data
    const personalResult = personalDataSchema.safeParse(personalData);
    if (!personalResult.success) {
      personalResult.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[`personal_${err.path[0]}`] = err.message;
        }
      });
    }

    // Validate brand data
    const brandResult = brandDataSchema.safeParse(brandData);
    if (!brandResult.success) {
      brandResult.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[`brand_${err.path[0]}`] = err.message;
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Switch to tab with first error
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey.startsWith('personal_')) {
        setCurrentTab('personal');
      } else if (firstErrorKey.startsWith('brand_')) {
        setCurrentTab('brand');
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent, sendLink = false) => {
    e.preventDefault();
    
    // Validate based on new client or existing
    if (isNewClient) {
      if (!validateNewClientData()) {
        toast.error('Preencha todos os campos obrigatórios corretamente');
        return;
      }
    } else if (!formData.user_id) {
      toast.error('Selecione um cliente');
      return;
    }

    setLoading(true);
    try {
      let userId = formData.user_id;
      let contractSubject = formData.subject;

      // If new client, create first
      if (isNewClient) {
        const newUserId = await createNewClient();
        if (!newUserId) {
          setLoading(false);
          return;
        }
        userId = newUserId;
        // Auto-generate subject for new clients
        contractSubject = `CONTRATO REGISTRO DE MARCA - ${brandData.brandName.toUpperCase()}`;
      }

      const contractHtml = generateDocumentHtml();

      // Check if it's a standard contract template (for existing client payment method)
      const isStandardTemplate = selectedTemplate?.name.toLowerCase().includes('registro de marca') ||
                                  selectedTemplate?.name.toLowerCase().includes('padrão');

      // Calculate contract value: for new clients OR existing clients with standard template, use calculated value
      const contractValue = isNewClient 
        ? getContractValue() 
        : (isStandardTemplate ? getContractValue() : (formData.contract_value ? parseFloat(formData.contract_value) : null));

      const { data: contract, error } = await supabase.from('contracts').insert({
        user_id: userId,
        contract_number: generateContractNumber(),
        subject: contractSubject,
        contract_value: contractValue,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        template_id: selectedTemplate?.id || null,
        description: isNewClient ? null : (formData.description || null),
        contract_html: contractHtml,
        document_type: selectedTemplate ? getDocumentTypeFromTemplateName(selectedTemplate.name) : 'contract',
        signatory_name: isNewClient ? personalData.fullName : (formData.signatory_name || null),
        signatory_cpf: isNewClient ? personalData.cpf : (formData.signatory_cpf || null),
        signatory_cnpj: isNewClient && brandData.hasCNPJ ? brandData.cnpj : (formData.signatory_cnpj || null),
        penalty_value: formData.penalty_value ? parseFloat(formData.penalty_value) : null,
        payment_method: (isNewClient || isStandardTemplate) ? paymentMethod : null,
        signature_status: 'not_signed',
        visible_to_client: true,
        lead_id: leadId || null,
      }).select().single();

      if (error) throw error;

      setCreatedContractId(contract.id);
      toast.success('Contrato criado com sucesso');

      // Check if it's a standard contract template that needs automatic link generation
      const isStandardContractTemplate = selectedTemplate?.name.toLowerCase().includes('registro de marca') ||
                                          selectedTemplate?.name.toLowerCase().includes('padrão');

      if (sendLink) {
        // Pass new client contact info for sending
        await generateAndSendLink(contract.id, isNewClient ? {
          email: personalData.email,
          phone: personalData.phone,
          name: personalData.fullName,
        } : undefined);
      } else if (isStandardContractTemplate) {
        // Auto-generate signature link for standard contracts (without sending)
        await generateSignatureLinkOnly(contract.id);
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        onSuccess();
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Erro ao criar contrato');
    } finally {
      setLoading(false);
    }
  };

  // Generate signature link without sending notifications
  const generateSignatureLinkOnly = async (contractId: string) => {
    try {
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
        console.error('Error generating signature link:', linkResult.error);
        toast.warning('Contrato criado, mas houve erro ao gerar link de assinatura');
        return;
      }

      console.log('Signature link generated automatically:', linkResult.data.url);
      toast.success('Link de assinatura gerado automaticamente');
    } catch (error: any) {
      console.error('Error generating signature link:', error);
      toast.warning('Contrato criado, mas houve erro ao gerar link de assinatura');
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
        toast.warning('Contrato criado, mas houve erro ao enviar notificações');
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
    setPersonalData({
      fullName: '',
      email: '',
      phone: '',
      cpf: '',
      cep: '',
      address: '',
      neighborhood: '',
      city: '',
      state: '',
    });
    setBrandData({
      brandName: '',
      businessArea: '',
      hasCNPJ: false,
      cnpj: '',
      companyName: '',
    });
    setFormData({
      user_id: '',
      subject: '',
      contract_value: '699',
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
    });
    setSelectedProfile(null);
    setGeneratedLink(null);
    setCreatedContractId(null);
    setIsNewClient(false);
    setValidationErrors({});
    setCurrentTab('personal');
    setPaymentMethod('avista');
  };

  const handleProfileChange = async (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    setSelectedProfile(profile || null);
    
    // Auto-populate form fields with profile data for document generation
    if (profile) {
      const cpfCnpj = profile.cpf_cnpj?.replace(/[^\d]/g, '') || '';
      const isCNPJ = cpfCnpj.length === 14;
      
      // Parse address to extract neighborhood if format is "address, neighborhood"
      const addressParts = (profile.address || '').split(',').map(s => s.trim());
      const mainAddress = addressParts[0] || '';
      
      // Try to fetch brand name from client's processes
      let brandName = '';
      try {
        const { data: processes } = await supabase
          .from('brand_processes')
          .select('brand_name')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();
        
        if (processes?.brand_name) {
          brandName = processes.brand_name;
        }
      } catch (error) {
        console.log('Could not fetch brand name:', error);
      }
      
      setFormData(prev => ({ 
        ...prev, 
        user_id: userId,
        signatory_name: profile.full_name || '',
        signatory_cpf: !isCNPJ ? (profile.cpf_cnpj || '') : '',
        signatory_cnpj: isCNPJ ? (profile.cpf_cnpj || '') : '',
        company_address: mainAddress,
        company_city: profile.city || '',
        company_state: profile.state || '',
        company_cep: profile.zip_code || '',
        brand_name: brandName || prev.brand_name || '',
        // Auto-generate subject if empty
        subject: prev.subject || `Documento - ${profile.full_name || profile.email}`,
      }));
    } else {
      setFormData(prev => ({ ...prev, user_id: userId }));
    }
  };

  const handleNewClientToggle = (checked: boolean) => {
    setIsNewClient(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, user_id: '' }));
      setSelectedProfile(null);
      // Force standard template for new clients
      const standardTemplate = templates.find(t => 
        t.name.toLowerCase().includes('registro de marca') || 
        t.name.toLowerCase().includes('padrão')
      );
      if (standardTemplate) {
        setSelectedTemplate(standardTemplate);
      }
    }
  };

  const isSpecialDocument = formData.document_type !== 'contract';
  const isDistrato = formData.document_type === 'distrato_multa' || formData.document_type === 'distrato_sem_multa';
  
  // Show "Criar e Enviar Link" button for special documents OR standard contract templates
  const isStandardContractTemplate = selectedTemplate?.name.toLowerCase().includes('registro de marca') ||
                                      selectedTemplate?.name.toLowerCase().includes('padrão');
  const showSendLinkButton = isSpecialDocument || isStandardContractTemplate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isNewClient ? 'Criar Novo Cliente + Contrato' : 'Novo Documento'}
          </DialogTitle>
        </DialogHeader>

        {generatedLink ? (
          /* Success state with link */
          <div className="py-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Link className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800">Contrato Criado!</h3>
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
            {/* Toggle between existing and new client */}
            <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
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
                Criar novo cliente (formulário completo)
              </label>
            </div>

            {isNewClient ? (
              /* NEW CLIENT FORM - Matching public form exactly */
              <>
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                  <strong>Contrato:</strong> Contrato Padrão - Registro de Marca INPI
                  <br />
                  <span className="text-xs">O mesmo contrato do formulário público será utilizado.</span>
                </div>

                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                    <TabsTrigger value="brand">Dados da Marca</TabsTrigger>
                    <TabsTrigger value="payment">Pagamento</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Preencha os dados do cliente exatamente como no formulário público.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="fullName">Nome Completo *</Label>
                        <Input
                          id="fullName"
                          value={personalData.fullName}
                          onChange={(e) => setPersonalData({ ...personalData, fullName: e.target.value })}
                          placeholder="Seu nome completo"
                        />
                        {validationErrors.personal_fullName && (
                          <p className="text-destructive text-xs">{validationErrors.personal_fullName}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={personalData.email}
                          onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                          placeholder="seu@email.com"
                        />
                        {validationErrors.personal_email && (
                          <p className="text-destructive text-xs">{validationErrors.personal_email}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone *</Label>
                        <Input
                          id="phone"
                          value={personalData.phone}
                          onChange={(e) => setPersonalData({ ...personalData, phone: formatPhone(e.target.value) })}
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                        />
                        {validationErrors.personal_phone && (
                          <p className="text-destructive text-xs">{validationErrors.personal_phone}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          value={personalData.cpf}
                          onChange={(e) => setPersonalData({ ...personalData, cpf: formatCPF(e.target.value) })}
                          placeholder="000.000.000-00"
                          maxLength={14}
                        />
                        {validationErrors.personal_cpf && (
                          <p className="text-destructive text-xs">{validationErrors.personal_cpf}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP *</Label>
                        <div className="relative">
                          <Input
                            id="cep"
                            value={personalData.cep}
                            onChange={(e) => handleCEPChange(e.target.value)}
                            placeholder="00000-000"
                            maxLength={9}
                          />
                          {isLoadingCEP && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        {validationErrors.personal_cep && (
                          <p className="text-destructive text-xs">{validationErrors.personal_cep}</p>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Endereço *</Label>
                        <Input
                          id="address"
                          value={personalData.address}
                          onChange={(e) => setPersonalData({ ...personalData, address: e.target.value })}
                          placeholder="Rua, número, complemento"
                        />
                        {validationErrors.personal_address && (
                          <p className="text-destructive text-xs">{validationErrors.personal_address}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="neighborhood">Bairro *</Label>
                        <Input
                          id="neighborhood"
                          value={personalData.neighborhood}
                          onChange={(e) => setPersonalData({ ...personalData, neighborhood: e.target.value })}
                          placeholder="Bairro"
                        />
                        {validationErrors.personal_neighborhood && (
                          <p className="text-destructive text-xs">{validationErrors.personal_neighborhood}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade *</Label>
                        <Input
                          id="city"
                          value={personalData.city}
                          onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
                          placeholder="Cidade"
                        />
                        {validationErrors.personal_city && (
                          <p className="text-destructive text-xs">{validationErrors.personal_city}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">UF *</Label>
                        <Input
                          id="state"
                          value={personalData.state}
                          onChange={(e) => setPersonalData({ ...personalData, state: e.target.value.toUpperCase() })}
                          placeholder="UF"
                          maxLength={2}
                        />
                        {validationErrors.personal_state && (
                          <p className="text-destructive text-xs">{validationErrors.personal_state}</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="brand" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Informe os dados da marca que será registrada.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="brandName">Nome da Marca *</Label>
                        <Input
                          id="brandName"
                          value={brandData.brandName}
                          onChange={(e) => setBrandData({ ...brandData, brandName: e.target.value })}
                          placeholder="Nome que será registrado"
                        />
                        {validationErrors.brand_brandName && (
                          <p className="text-destructive text-xs">{validationErrors.brand_brandName}</p>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="businessArea">Ramo de Atividade *</Label>
                        <Input
                          id="businessArea"
                          value={brandData.businessArea}
                          onChange={(e) => setBrandData({ ...brandData, businessArea: e.target.value })}
                          placeholder="Ex: Serviços Jurídicos, Alimentação, etc."
                        />
                        {validationErrors.brand_businessArea && (
                          <p className="text-destructive text-xs">{validationErrors.brand_businessArea}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex items-center space-x-2 py-2">
                          <Checkbox
                            id="hasCNPJ"
                            checked={brandData.hasCNPJ}
                            onCheckedChange={(checked) => setBrandData({ ...brandData, hasCNPJ: !!checked })}
                          />
                          <Label htmlFor="hasCNPJ" className="text-sm font-normal cursor-pointer">
                            Tenho CNPJ e quero vincular à marca
                          </Label>
                        </div>
                      </div>

                      {brandData.hasCNPJ && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="cnpj">CNPJ *</Label>
                            <Input
                              id="cnpj"
                              value={brandData.cnpj}
                              onChange={(e) => setBrandData({ ...brandData, cnpj: formatCNPJ(e.target.value) })}
                              placeholder="00.000.000/0000-00"
                              maxLength={18}
                            />
                            {validationErrors.brand_cnpj && (
                              <p className="text-destructive text-xs">{validationErrors.brand_cnpj}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="companyName">Razão Social *</Label>
                            <Input
                              id="companyName"
                              value={brandData.companyName}
                              onChange={(e) => setBrandData({ ...brandData, companyName: e.target.value })}
                              placeholder="Nome da empresa"
                            />
                            {validationErrors.brand_companyName && (
                              <p className="text-destructive text-xs">{validationErrors.brand_companyName}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="payment" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Selecione a forma de pagamento do cliente.
                    </p>

                    <div className="space-y-3">
                      {/* PIX à vista */}
                      <div
                        onClick={() => setPaymentMethod('avista')}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          paymentMethod === 'avista'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              paymentMethod === 'avista' 
                                ? 'border-primary bg-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {paymentMethod === 'avista' && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">PIX à Vista</p>
                              <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">R$ 699,00</p>
                            <p className="text-xs text-green-600 font-medium">43% OFF</p>
                          </div>
                        </div>
                      </div>

                      {/* Cartão 6x */}
                      <div
                        onClick={() => setPaymentMethod('cartao6x')}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          paymentMethod === 'cartao6x'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              paymentMethod === 'cartao6x' 
                                ? 'border-primary bg-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {paymentMethod === 'cartao6x' && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">Cartão de Crédito</p>
                              <p className="text-sm text-muted-foreground">Parcelamento sem juros</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">6x de R$ 199,00</p>
                            <p className="text-xs text-muted-foreground">Total: R$ 1.194,00</p>
                          </div>
                        </div>
                      </div>

                      {/* Boleto 3x */}
                      <div
                        onClick={() => setPaymentMethod('boleto3x')}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          paymentMethod === 'boleto3x'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              paymentMethod === 'boleto3x' 
                                ? 'border-primary bg-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {paymentMethod === 'boleto3x' && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">Boleto Bancário</p>
                              <p className="text-sm text-muted-foreground">Parcelamento em 3x</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">3x de R$ 399,00</p>
                            <p className="text-xs text-muted-foreground">Total: R$ 1.197,00</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <strong>Forma selecionada:</strong> {getPaymentDescription()}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              /* EXISTING CLIENT FORM - Legacy flow */
              <>
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

                      {(isDistrato || isSpecialDocument) && (
                        <div className="space-y-2 col-span-2">
                          <Label>Nome da Marca {isSpecialDocument && '*'}</Label>
                          <Input
                            value={formData.brand_name}
                            onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                            placeholder={isDistrato ? "Nome da marca relacionada ao distrato" : "Nome da marca para o documento"}
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
                      {isSpecialDocument 
                        ? 'Preencha os dados do representante legal que irá assinar o documento.'
                        : 'Dados opcionais do signatário.'}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label>Nome do Representante Legal {isSpecialDocument && '*'}</Label>
                        <Input
                          value={formData.signatory_name}
                          onChange={(e) => setFormData({ ...formData, signatory_name: e.target.value })}
                          placeholder="Nome completo"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>CPF do Representante</Label>
                        <Input
                          value={formData.signatory_cpf}
                          onChange={(e) => setFormData({ ...formData, signatory_cpf: formatCPF(e.target.value) })}
                          placeholder="000.000.000-00"
                          maxLength={14}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>CNPJ da Empresa</Label>
                        <Input
                          value={formData.signatory_cnpj}
                          onChange={(e) => setFormData({ ...formData, signatory_cnpj: formatCNPJ(e.target.value) })}
                          placeholder="00.000.000/0001-00"
                          maxLength={18}
                        />
                      </div>

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
                          onChange={(e) => setFormData({ ...formData, company_state: e.target.value.toUpperCase() })}
                          placeholder="SP"
                          maxLength={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>CEP</Label>
                        <Input
                          value={formData.company_cep}
                          onChange={(e) => setFormData({ ...formData, company_cep: formatCEP(e.target.value) })}
                          placeholder="00000-000"
                          maxLength={9}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Payment selection for standard contracts with existing clients */}
                {isStandardContractTemplate && (
                  <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg border">
                    <div>
                      <Label className="font-medium">Forma de Pagamento *</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Selecione a forma de pagamento para este contrato.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {/* PIX à vista */}
                      <div
                        onClick={() => setPaymentMethod('avista')}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          paymentMethod === 'avista'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              paymentMethod === 'avista' 
                                ? 'border-primary bg-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {paymentMethod === 'avista' && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">PIX à Vista</p>
                              <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">R$ 699,00</p>
                            <p className="text-xs text-green-600 font-medium">43% OFF</p>
                          </div>
                        </div>
                      </div>

                      {/* Cartão 6x */}
                      <div
                        onClick={() => setPaymentMethod('cartao6x')}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          paymentMethod === 'cartao6x'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              paymentMethod === 'cartao6x' 
                                ? 'border-primary bg-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {paymentMethod === 'cartao6x' && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">Cartão de Crédito</p>
                              <p className="text-sm text-muted-foreground">Parcelamento sem juros</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">6x de R$ 199,00</p>
                            <p className="text-xs text-muted-foreground">Total: R$ 1.194,00</p>
                          </div>
                        </div>
                      </div>

                      {/* Boleto 3x */}
                      <div
                        onClick={() => setPaymentMethod('boleto3x')}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          paymentMethod === 'boleto3x'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              paymentMethod === 'boleto3x' 
                                ? 'border-primary bg-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {paymentMethod === 'boleto3x' && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">Boleto Bancário</p>
                              <p className="text-sm text-muted-foreground">Parcelamento em 3x</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">3x de R$ 399,00</p>
                            <p className="text-xs text-muted-foreground">Total: R$ 1.197,00</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <strong>Forma selecionada:</strong> {getPaymentDescription()}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        O valor do contrato será atualizado automaticamente.
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              {isNewClient ? (
                <>
                  <Button type="submit" disabled={loading || creatingClient}>
                    {(loading || creatingClient) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Contrato
                  </Button>
                  <Button 
                    type="button" 
                    variant="default"
                    onClick={(e) => handleSubmit(e as any, true)}
                    disabled={loading || sendingLink || creatingClient}
                    className="bg-primary"
                  >
                    {(sendingLink || creatingClient) ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Criar Cliente e Enviar
                  </Button>
                </>
              ) : (
                <>
                  <Button type="submit" disabled={loading || sendingLink}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Documento
                  </Button>
                  {showSendLinkButton && (
                    <Button 
                      type="button" 
                      variant="default"
                      onClick={(e) => handleSubmit(e as any, true)}
                      disabled={loading || sendingLink}
                    >
                      {sendingLink ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Criar e Enviar Link
                    </Button>
                  )}
                </>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
