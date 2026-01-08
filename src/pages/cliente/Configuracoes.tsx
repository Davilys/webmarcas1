import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientLayout } from '@/components/cliente/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, Lock, Bell, Shield, Loader2 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Profile {
  full_name: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  company_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

export default function Configuracoes() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    phone: '',
    cpf_cnpj: '',
    company_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

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
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile({
        full_name: data.full_name || '',
        phone: data.phone || '',
        cpf_cnpj: data.cpf_cnpj || '',
        company_name: data.company_name || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip_code: data.zip_code || '',
      });
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user.id);

    if (error) {
      toast.error('Erro ao salvar perfil');
    } else {
      toast.success('Perfil atualizado com sucesso!');
    }
    setSaving(false);
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

        {/* Profile Section */}
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
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="cpf_cnpj"
                  value={profile.cpf_cnpj || ''}
                  onChange={(e) => setProfile({ ...profile, cpf_cnpj: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">Empresa</Label>
                <Input
                  id="company_name"
                  value={profile.company_name || ''}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={profile.address || ''}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={profile.city || ''}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={profile.state || ''}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
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
                'Salvar Alterações'
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
