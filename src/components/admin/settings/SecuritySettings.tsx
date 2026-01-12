import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, UserPlus, Trash2, Loader2, Clock, User, Monitor, Settings2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreateAdminDialog } from './CreateAdminDialog';
import { EditPermissionsDialog } from './EditPermissionsDialog';

export function SecuritySettings() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: string; email: string; fullName: string } | null>(null);

  // Fetch admin users with permissions info
  const { data: adminUsers, isLoading: loadingAdmins } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .eq('role', 'admin');
      
      if (error) throw error;

      // Fetch profiles for each admin
      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      // Fetch permissions count for each admin
      const { data: permissions } = await supabase
        .from('admin_permissions')
        .select('user_id')
        .in('user_id', userIds);

      const permissionsByUser = permissions?.reduce((acc, p) => {
        acc[p.user_id] = (acc[p.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return data.map(role => ({
        ...role,
        profile: profiles?.find(p => p.id === role.user_id),
        hasCustomPermissions: (permissionsByUser[role.user_id] || 0) > 0,
      }));
    },
  });

  // Fetch login history
  const { data: loginHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['login-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_history')
        .select(`
          id,
          user_id,
          ip_address,
          user_agent,
          login_at
        `)
        .order('login_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;

      // Fetch profiles
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      return data.map(log => ({
        ...log,
        profile: profiles?.find(p => p.id === log.user_id),
      }));
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: async ({ roleId, userId }: { roleId: string; userId: string }) => {
      // Delete permissions first
      await supabase
        .from('admin_permissions')
        .delete()
        .eq('user_id', userId);

      // Delete role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Acesso de administrador removido!');
    },
    onError: () => {
      toast.error('Erro ao remover administrador');
    },
  });

  const formatUserAgent = (ua: string | null) => {
    if (!ua) return 'Desconhecido';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Navegador';
  };

  return (
    <div className="space-y-6">
      {/* Create Admin Dialog */}
      <CreateAdminDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      
      {/* Edit Permissions Dialog */}
      <EditPermissionsDialog 
        open={!!editingUser} 
        onOpenChange={(open) => !open && setEditingUser(null)}
        user={editingUser}
      />

      {/* Admin Users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-violet-500" />
              <CardTitle>Usuários Administradores</CardTitle>
            </div>
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Novo Admin
            </Button>
          </div>
          <CardDescription>
            Crie e gerencie usuários com acesso ao CRM. Defina permissões granulares por seção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAdmins ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : adminUsers && adminUsers.length > 0 ? (
            <div className="space-y-3">
              {adminUsers.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{admin.profile?.full_name || 'Sem nome'}</p>
                      <p className="text-sm text-muted-foreground">{admin.profile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {admin.hasCustomPermissions ? (
                      <Badge variant="secondary">Permissões Personalizadas</Badge>
                    ) : (
                      <Badge>Acesso Total</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingUser({
                        id: admin.user_id,
                        email: admin.profile?.email || '',
                        fullName: admin.profile?.full_name || '',
                      })}
                      title="Editar Permissões"
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Remover acesso de administrador deste usuário? As permissões também serão removidas.')) {
                          removeAdminMutation.mutate({ roleId: admin.id, userId: admin.user_id });
                        }
                      }}
                      disabled={removeAdminMutation.isPending}
                      title="Remover Admin"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum administrador cadastrado</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Primeiro Admin
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <CardTitle>Histórico de Logins</CardTitle>
          </div>
          <CardDescription>
            Últimos acessos ao sistema para monitoramento de segurança
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : loginHistory && loginHistory.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Navegador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{log.profile?.full_name || 'Usuário'}</p>
                          <p className="text-xs text-muted-foreground">{log.profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.login_at ? format(new Date(log.login_at), "dd/MM/yy HH:mm", { locale: ptBR }) : '-'}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {log.ip_address || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Monitor className="h-3 w-3" />
                          {formatUserAgent(log.user_agent)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum registro de login encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
