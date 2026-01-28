import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientLayout } from '@/components/cliente/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Lock, Building2, Loader2, Check, X } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { 
  validateCPF, 
  validateCNPJ, 
  formatCPF, 
  formatCNPJ, 
  formatCEP, 
  formatPhone, 
  fetchAddressByCEP 
} from '@/lib/validators';

interface Profile {
  full_name: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  cpf: string | null;
  cnpj: string | null;
  company_name: string | null;
  address: string | null;
  address_number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

interface BrandProcess {
  brand_name: string | null;
  business_area: string | null;
}

interface ValidationState {
  cpf: boolean | null;
  cnpj: boolean | null;
}

export default function Configuracoes() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    phone: '',
    cpf_cnpj: '',
    cpf: '',
    cnpj: '',
    company_name: '',
    address: '',
    address_number: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
  });
  
  // Brand data from brand_processes
  const [brandData, setBrandData] = useState<BrandProcess>({
    brand_name: '',
    business_area: '',
  });
  const [brandProcessId, setBrandProcessId] = useState<string | null>(null);
  
  // Separate fields for CPF and CNPJ
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [savingBrand, setSavingBrand] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loadingCEP, setLoadingCEP] = useState(false);
  
  const [validation, setValidation] = useState<ValidationState>({
    cpf: null,
    cnpj: null,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate('/cliente/login');
        } else {
          setUser(session.user);
          fetchProfile(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/cliente/login');
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    // Fetch profile data
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      // Extract address number if embedded in address (e.g., "Rua X, 123")
      let addressValue = data.address || '';
      let addressNumber = '';
      
      // Try to extract number from address if it contains comma
      if (addressValue.includes(',')) {
        const parts = addressValue.split(',');
        addressValue = parts[0].trim();
        addressNumber = parts.slice(1).join(',').trim();
      }
      
      setProfile({
        full_name: data.full_name || '',
        phone: data.phone ? formatPhone(data.phone) : '',
        cpf_cnpj: data.cpf_cnpj || '',
        cpf: data.cpf || '',
        cnpj: data.cnpj || '',
        company_name: data.company_name || '',
        address: addressValue,
        address_number: addressNumber,
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || '',
        zip_code: data.zip_code ? formatCEP(data.zip_code) : '',
      });
      
      // Set CPF from specific field or fallback to cpf_cnpj
      const cpfValue = data.cpf || '';
      if (cpfValue) {
        setCpf(formatCPF(cpfValue));
        const cleanCpf = cpfValue.replace(/\D/g, '');
        if (cleanCpf.length === 11) {
          setValidation(prev => ({ ...prev, cpf: validateCPF(cleanCpf) }));
        }
      } else {
        // Fallback to cpf_cnpj if it's a CPF
        const cleanDoc = (data.cpf_cnpj || '').replace(/\D/g, '');
        if (cleanDoc.length === 11) {
          setCpf(formatCPF(cleanDoc));
          setValidation(prev => ({ ...prev, cpf: validateCPF(cleanDoc) }));
        }
      }
      
      // Set CNPJ from specific field
      const cnpjValue = data.cnpj || '';
      if (cnpjValue) {
        setCnpj(formatCNPJ(cnpjValue));
        const cleanCnpj = cnpjValue.replace(/\D/g, '');
        if (cleanCnpj.length === 14) {
          setValidation(prev => ({ ...prev, cnpj: validateCNPJ(cleanCnpj) }));
        }
      }
      
      // Set company name (razão social)
      if (data.company_name) {
        // Remove CNPJ from company name if embedded
        let companyName = data.company_name;
        if (companyName.includes('| CNPJ:')) {
          companyName = companyName.split('| CNPJ:')[0].trim();
        }
        const parts = companyName.split('|').map((s: string) => s.trim());
        setRazaoSocial(parts[0] || '');
        setNomeFantasia(parts[1] || '');
      }
    }
    
    // Fetch brand process data
    const { data: processData } = await supabase
      .from('brand_processes')
      .select('id, brand_name, business_area')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    
    if (processData) {
      setBrandProcessId(processData.id);
      setBrandData({
        brand_name: processData.brand_name || '',
        business_area: processData.business_area || '',
      });
    }
    
    setLoading(false);
  };

  const handleCEPChange = useCallback(async (value: string) => {
    const formatted = formatCEP(value);
    setProfile(prev => ({ ...prev, zip_code: formatted }));
    
    const cleanCEP = value.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setLoadingCEP(true);
      const addressData = await fetchAddressByCEP(cleanCEP);
      setLoadingCEP(false);
      
      if (addressData) {
        setProfile(prev => ({
          ...prev,
          address: addressData.logradouro,
          neighborhood: addressData.bairro,
          city: addressData.localidade,
          state: addressData.uf,
        }));
        toast.success('Endereço encontrado!');
      } else {
        toast.error('CEP não encontrado');
      }
    }
  }, []);

  const handlePhoneChange = (value: string) => {
    setProfile(prev => ({ ...prev, phone: formatPhone(value) }));
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    setCpf(formatted);
    
    const clean = value.replace(/\D/g, '');
    if (clean.length === 11) {
      const isValid = validateCPF(clean);
      setValidation(prev => ({ ...prev, cpf: isValid }));
      if (!isValid) {
        toast.error('CPF inválido');
      }
    } else {
      setValidation(prev => ({ ...prev, cpf: null }));
    }
  };

  const handleCNPJChange = (value: string) => {
    const formatted = formatCNPJ(value);
    setCnpj(formatted);
    
    const clean = value.replace(/\D/g, '');
    if (clean.length === 14) {
      const isValid = validateCNPJ(clean);
      setValidation(prev => ({ ...prev, cnpj: isValid }));
      if (!isValid) {
        toast.error('CNPJ inválido');
      }
    } else {
      setValidation(prev => ({ ...prev, cnpj: null }));
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    // Validate CPF if provided
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length > 0 && cleanCPF.length !== 11) {
      toast.error('CPF deve ter 11 dígitos');
      return;
    }
    if (cleanCPF.length === 11 && !validateCPF(cleanCPF)) {
      toast.error('CPF inválido');
      return;
    }
    
    setSaving(true);

    // Combine address with number
    const fullAddress = profile.address_number 
      ? `${profile.address}, ${profile.address_number}`
      : profile.address;

    const updateData = {
      full_name: profile.full_name,
      phone: profile.phone?.replace(/\D/g, '') || null,
      cpf: cleanCPF || null,
      cpf_cnpj: cleanCPF || null,
      address: fullAddress,
      neighborhood: profile.neighborhood,
      city: profile.city,
      state: profile.state,
      zip_code: profile.zip_code?.replace(/\D/g, '') || null,
    };

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil');
    } else {
      toast.success('Dados pessoais atualizados com sucesso!');
    }
    setSaving(false);
  };

  const handleSaveCompany = async () => {
    if (!user) return;
    
    // Validate CNPJ if provided
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length > 0 && cleanCNPJ.length !== 14) {
      toast.error('CNPJ deve ter 14 dígitos');
      return;
    }
    if (cleanCNPJ.length === 14 && !validateCNPJ(cleanCNPJ)) {
      toast.error('CNPJ inválido');
      return;
    }
    
    setSavingCompany(true);

    // Store company info - razão social and nome fantasia in company_name
    let companyName = razaoSocial;
    if (nomeFantasia) {
      companyName = `${razaoSocial} | ${nomeFantasia}`;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        company_name: companyName || null,
        cnpj: cleanCNPJ || null,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error saving company:', error);
      toast.error('Erro ao salvar dados da empresa');
    } else {
      toast.success('Dados da empresa atualizados com sucesso!');
    }
    setSavingCompany(false);
  };

  const handleSaveBrand = async () => {
    if (!user) return;
    
    setSavingBrand(true);

    try {
      if (brandProcessId) {
        // Update existing process
        const { error } = await supabase
          .from('brand_processes')
          .update({
            brand_name: brandData.brand_name || null,
            business_area: brandData.business_area || null,
          })
          .eq('id', brandProcessId);

        if (error) throw error;
      } else {
        // Create new process for this user
        const { data: newProcess, error } = await supabase
          .from('brand_processes')
          .insert({
            user_id: user.id,
            brand_name: brandData.brand_name || 'Marca não definida',
            business_area: brandData.business_area || null,
            status: 'em_andamento',
            pipeline_stage: 'protocolado',
          })
          .select('id')
          .single();

        if (error) throw error;
        if (newProcess) {
          setBrandProcessId(newProcess.id);
        }
      }
      
      toast.success('Dados da marca atualizados com sucesso!');
    } catch (error: any) {
      console.error('Error saving brand:', error);
      toast.error('Erro ao salvar dados da marca');
    }
    
    setSavingBrand(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error('Erro ao alterar senha');
    } else {
      toast.success('Senha alterada com sucesso!');
      setNewPassword('');
    }
    setChangingPassword(false);
  };

  const ValidationIcon = ({ isValid }: { isValid: boolean | null }) => {
    if (isValid === null) return null;
    return isValid ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-destructive" />
    );
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações e preferências
          </p>
        </div>

        {/* Personal Data Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados Pessoais
            </CardTitle>
            <CardDescription>
              Atualize suas informações de contato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={profile.phone || ''}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <div className="relative">
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={(e) => handleCPFChange(e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={validation.cpf === false ? 'border-destructive' : ''}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ValidationIcon isValid={validation.cpf} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    value={profile.zip_code || ''}
                    onChange={(e) => handleCEPChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {loadingCEP && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço (Rua/Avenida)</Label>
                <Input
                  id="address"
                  value={profile.address || ''}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Rua, Avenida..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_number">Número</Label>
                <Input
                  id="address_number"
                  value={profile.address_number || ''}
                  onChange={(e) => setProfile({ ...profile, address_number: e.target.value })}
                  placeholder="123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={profile.neighborhood || ''}
                  onChange={(e) => setProfile({ ...profile, neighborhood: e.target.value })}
                  placeholder="Bairro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={profile.city || ''}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={profile.state || ''}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Dados Pessoais'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Brand Data Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados da Marca
            </CardTitle>
            <CardDescription>
              Informações sobre a marca que está sendo registrada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand_name">Nome da Marca</Label>
                <Input
                  id="brand_name"
                  value={brandData.brand_name || ''}
                  onChange={(e) => setBrandData({ ...brandData, brand_name: e.target.value })}
                  placeholder="Nome da marca a ser registrada"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_area">Ramo de Atividade</Label>
                <Input
                  id="business_area"
                  value={brandData.business_area || ''}
                  onChange={(e) => setBrandData({ ...brandData, business_area: e.target.value })}
                  placeholder="Ex: Alimentação, Tecnologia..."
                />
              </div>
            </div>

            <Button onClick={handleSaveBrand} disabled={savingBrand}>
              {savingBrand ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Dados da Marca'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Company Data Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados da Empresa
              <span className="text-xs font-normal text-muted-foreground">(Opcional)</span>
            </CardTitle>
            <CardDescription>
              Preencha se for pessoa jurídica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="razao_social">Razão Social</Label>
                <Input
                  id="razao_social"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Razão Social da empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <div className="relative">
                  <Input
                    id="cnpj"
                    value={cnpj}
                    onChange={(e) => handleCNPJChange(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className={validation.cnpj === false ? 'border-destructive' : ''}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ValidationIcon isValid={validation.cnpj} />
                  </div>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                <Input
                  id="nome_fantasia"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Nome Fantasia (opcional)"
                />
              </div>
            </div>

            <Button onClick={handleSaveCompany} disabled={savingCompany}>
              {savingCompany ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Dados da Empresa'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Altere sua senha de acesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-sm space-y-2">
              <Label htmlFor="new_password">Nova Senha</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button 
              onClick={handleChangePassword} 
              disabled={changingPassword || !newPassword}
            >
              {changingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
