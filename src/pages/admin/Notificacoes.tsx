import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Plus, Send, Users, FileText, Trash2, Edit, Copy } from 'lucide-react';
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

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

const notificationTypes = [
  { value: 'info', label: 'Informação', color: 'bg-blue-100 text-blue-700' },
  { value: 'success', label: 'Sucesso', color: 'bg-green-100 text-green-700' },
  { value: 'warning', label: 'Aviso', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'error', label: 'Urgente', color: 'bg-red-100 text-red-700' },
];

const templateCategories = [
  { value: 'geral', label: 'Geral' },
  { value: 'cobranca', label: 'Cobrança Extrajudicial' },
  { value: 'inpi', label: 'Exigências INPI' },
];

export default function AdminNotificacoes() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    user_id: '',
    link: '',
  });
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    message: '',
    type: 'info',
    category: 'geral',
  });

  useEffect(() => {
    fetchNotifications();
    fetchClients();
    fetchTemplates();
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

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) {
      console.error('Erro ao carregar templates:', error);
    } else {
      setTemplates(data || []);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        title: template.title,
        message: template.message,
        type: template.type,
      });
    }
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

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateForm.name || !templateForm.title || !templateForm.message) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (editingTemplate) {
      const { error } = await supabase
        .from('notification_templates')
        .update(templateForm)
        .eq('id', editingTemplate.id);

      if (error) {
        toast.error('Erro ao atualizar template');
      } else {
        toast.success('Template atualizado com sucesso');
        fetchTemplates();
        setTemplateDialogOpen(false);
        resetTemplateForm();
      }
    } else {
      const { error } = await supabase
        .from('notification_templates')
        .insert(templateForm);

      if (error) {
        toast.error('Erro ao criar template');
      } else {
        toast.success('Template criado com sucesso');
        fetchTemplates();
        setTemplateDialogOpen(false);
        resetTemplateForm();
      }
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    const { error } = await supabase
      .from('notification_templates')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir template');
    } else {
      toast.success('Template excluído');
      fetchTemplates();
    }
  };

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      title: template.title,
      message: template.message,
      type: template.type,
      category: template.category,
    });
    setTemplateDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ title: '', message: '', type: 'info', user_id: '', link: '' });
    setSendToAll(false);
    setSelectedTemplate('');
  };

  const resetTemplateForm = () => {
    setTemplateForm({ name: '', title: '', message: '', type: 'info', category: 'geral' });
    setEditingTemplate(null);
  };

  const getTypeBadge = (type: string | null) => {
    const t = notificationTypes.find((n) => n.value === type) || notificationTypes[0];
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.color}`}>{t.label}</span>;
  };

  const getCategoryLabel = (category: string) => {
    return templateCategories.find(c => c.value === category)?.label || category;
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, NotificationTemplate[]>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Notificações</h1>
            <p className="text-muted-foreground">Envie notificações para os clientes</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={templateDialogOpen} onOpenChange={(open) => { setTemplateDialogOpen(open); if (!open) resetTemplateForm(); }}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? 'Editar Template' : 'Novo Template'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTemplateSubmit} className="space-y-4">
                  <div>
                    <Label>Nome do Template *</Label>
                    <Input
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      placeholder="Ex: Cobrança - Primeira Notificação"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Categoria</Label>
                      <Select value={templateForm.category} onValueChange={(v) => setTemplateForm({ ...templateForm, category: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {templateCategories.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <Select value={templateForm.type} onValueChange={(v) => setTemplateForm({ ...templateForm, type: v })}>
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
                  </div>
                  <div>
                    <Label>Título da Notificação *</Label>
                    <Input
                      value={templateForm.title}
                      onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                      placeholder="Ex: Fatura Vencida - Ação Necessária"
                    />
                  </div>
                  <div>
                    <Label>Mensagem *</Label>
                    <Textarea
                      value={templateForm.message}
                      onChange={(e) => setTemplateForm({ ...templateForm, message: e.target.value })}
                      placeholder="Conteúdo da notificação..."
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingTemplate ? 'Salvar' : 'Criar Template'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

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
                  {templates.length > 0 && (
                    <div>
                      <Label>Usar Template (opcional)</Label>
                      <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                                {getCategoryLabel(category)}
                              </div>
                              {categoryTemplates.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  <div className="flex items-center gap-2">
                                    <Copy className="h-3 w-3 text-muted-foreground" />
                                    {t.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
        </div>

        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="h-4 w-4 mr-2" />
              Templates ({templates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
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
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Templates de Notificação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum template cadastrado</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                      <div key={category}>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                          {getCategoryLabel(category)}
                        </h3>
                        <div className="space-y-3">
                          {categoryTemplates.map((template) => (
                            <div key={template.id} className="flex items-start justify-between p-4 rounded-lg bg-muted/50 border">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{template.name}</h4>
                                  {getTypeBadge(template.type)}
                                </div>
                                <p className="text-sm font-medium text-foreground mb-1">{template.title}</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">{template.message}</p>
                              </div>
                              <div className="flex gap-1 ml-4">
                                <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(template)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
