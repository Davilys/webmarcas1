import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Plus, Send, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  full_name: string | null;
  email: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  created_at: string | null;
  user_id: string | null;
  read: boolean | null;
  profiles?: { full_name: string | null; email: string } | null;
}

const notificationTypes = [
  { value: 'info', label: 'Informação', color: 'bg-blue-100 text-blue-700' },
  { value: 'success', label: 'Sucesso', color: 'bg-green-100 text-green-700' },
  { value: 'warning', label: 'Aviso', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'error', label: 'Urgente', color: 'bg-red-100 text-red-700' },
];

export default function AdminNotificacoes() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendToAll, setSendToAll] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    user_id: '',
    link: '',
  });

  useEffect(() => {
    fetchNotifications();
    fetchClients();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      toast.error('Erro ao carregar notificações');
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, email');
    setClients(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      toast.error('Preencha título e mensagem');
      return;
    }

    if (!sendToAll && !formData.user_id) {
      toast.error('Selecione um cliente ou marque "Enviar para todos"');
      return;
    }

    const notificationBase = {
      title: formData.title,
      message: formData.message,
      type: formData.type,
      link: formData.link || null,
      read: false,
    };

    if (sendToAll) {
      const notifications = clients.map((c) => ({
        ...notificationBase,
        user_id: c.id,
      }));

      const { error } = await supabase.from('notifications').insert(notifications);

      if (error) {
        toast.error('Erro ao enviar notificações');
      } else {
        toast.success(`Notificação enviada para ${clients.length} clientes`);
        fetchNotifications();
        setDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from('notifications').insert({
        ...notificationBase,
        user_id: formData.user_id,
      });

      if (error) {
        toast.error('Erro ao enviar notificação');
      } else {
        toast.success('Notificação enviada com sucesso');
        fetchNotifications();
        setDialogOpen(false);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormData({ title: '', message: '', type: 'info', user_id: '', link: '' });
    setSendToAll(false);
  };

  const getTypeBadge = (type: string | null) => {
    const t = notificationTypes.find((n) => n.value === type) || notificationTypes[0];
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.color}`}>{t.label}</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Notificações</h1>
            <p className="text-muted-foreground">Envie notificações para os clientes</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Notificação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Enviar Notificação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Atualização do seu processo"
                  />
                </div>
                <div>
                  <Label>Mensagem *</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Conteúdo da notificação..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {notificationTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Link (opcional)</Label>
                    <Input
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="/cliente/processos"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sendToAll"
                      checked={sendToAll}
                      onChange={(e) => setSendToAll(e.target.checked)}
                      className="rounded border-input"
                    />
                    <Label htmlFor="sendToAll" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4" />
                      Enviar para todos os clientes ({clients.length})
                    </Label>
                  </div>

                  {!sendToAll && (
                    <div>
                      <Label>Cliente</Label>
                      <Select value={formData.user_id} onValueChange={(v) => setFormData({ ...formData, user_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.full_name || c.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Histórico de Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                Carregando...
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma notificação enviada</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start justify-between p-4 rounded-lg bg-muted/50 border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{n.title}</h4>
                        {getTypeBadge(n.type)}
                        {n.read && (
                          <span className="text-xs text-muted-foreground">(lida)</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Para: {(n.profiles as any)?.full_name || (n.profiles as any)?.email || 'Desconhecido'} • 
                        {n.created_at ? new Date(n.created_at).toLocaleString('pt-BR') : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
