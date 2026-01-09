import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  User, Phone, Mail, Building2, MapPin, DollarSign, Clock, Star,
  FileText, CreditCard, MessageSquare, Calendar, Activity, Paperclip,
  Upload, Loader2, ExternalLink, Plus, Trash2
} from 'lucide-react';
import type { ClientWithProcess } from './ClientKanbanBoard';

interface ClientDetailSheetProps {
  client: ClientWithProcess | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

interface ClientNote {
  id: string;
  content: string;
  created_at: string;
}

interface ClientActivity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

interface ClientDocument {
  id: string;
  name: string;
  file_url: string;
  created_at: string;
}

interface ClientInvoice {
  id: string;
  description: string;
  amount: number;
  status: string;
  due_date: string;
}

import { PIPELINE_STAGES } from './ClientKanbanBoard';

const SERVICE_TYPES = [
  { id: 'pedido_registro', label: 'Pedido de Registro', description: 'Solicitação inicial de registro de marca junto ao INPI' },
  { id: 'cumprimento_exigencia', label: 'Cumprimento de Exigência', description: 'Resposta a exigência formal do INPI' },
  { id: 'oposicao', label: 'Manifestação de Oposição', description: 'Defesa contra oposição de terceiros' },
  { id: 'recurso', label: 'Recurso Administrativo', description: 'Recurso contra indeferimento do INPI' },
  { id: 'renovacao', label: 'Renovação de Marca', description: 'Renovação do registro decenal' },
  { id: 'notificacao', label: 'Notificação Extrajudicial', description: 'Cessação de uso indevido por terceiros' },
];

export function ClientDetailSheet({ client, open, onOpenChange, onUpdate }: ClientDetailSheetProps) {
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    priority: '',
    origin: '',
    contract_value: 0,
    pipeline_stage: ''
  });

  useEffect(() => {
    if (client && open) {
      fetchClientData();
      setEditData({
        priority: client.priority || 'medium',
        origin: client.origin || 'site',
        contract_value: client.contract_value || 0,
        pipeline_stage: client.pipeline_stage || 'protocolado'
      });
    }
  }, [client, open]);

  const fetchClientData = async () => {
    if (!client) return;
    setLoading(true);

    try {
      const [notesRes, activitiesRes, docsRes, invoicesRes] = await Promise.all([
        supabase.from('client_notes').select('*').eq('user_id', client.id).order('created_at', { ascending: false }),
        supabase.from('client_activities').select('*').eq('user_id', client.id).order('created_at', { ascending: false }),
        supabase.from('documents').select('*').eq('user_id', client.id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('user_id', client.id).order('due_date', { ascending: false })
      ]);

      setNotes(notesRes.data || []);
      setActivities(activitiesRes.data || []);
      setDocuments(docsRes.data || []);
      setInvoices(invoicesRes.data || []);
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !client) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('client_notes').insert({
        user_id: client.id,
        admin_id: user?.id,
        content: newNote
      });

      if (error) throw error;
      toast.success('Nota adicionada');
      setNewNote('');
      fetchClientData();
    } catch (error) {
      toast.error('Erro ao adicionar nota');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !client) return;

    setUploading(true);
    try {
      const fileName = `${client.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('documents').insert({
        user_id: client.id,
        name: file.name,
        file_url: urlData.publicUrl,
        document_type: 'anexo',
        uploaded_by: 'admin'
      });

      if (dbError) throw dbError;
      toast.success('Documento anexado');
      fetchClientData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!client) return;

    try {
      // Update profile
      await supabase.from('profiles').update({
        priority: editData.priority,
        origin: editData.origin,
        contract_value: editData.contract_value
      }).eq('id', client.id);

      // Update process stage if exists
      if (client.process_id) {
        await supabase.from('brand_processes').update({
          pipeline_stage: editData.pipeline_stage
        }).eq('id', client.process_id);
      }

      toast.success('Alterações salvas');
      setEditMode(false);
      onUpdate();
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-500">Paga</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'overdue': return <Badge className="bg-red-500">Vencida</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!client) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
              {client.full_name?.charAt(0) || 'C'}
            </div>
            <div className="flex-1">
              <SheetTitle className="flex items-center gap-2">
                {client.full_name || 'Sem nome'}
                <Badge className={client.priority === 'high' ? 'bg-red-500' : client.priority === 'low' ? 'bg-green-500' : 'bg-yellow-500'}>
                  {client.priority === 'high' ? 'Alta' : client.priority === 'low' ? 'Baixa' : 'Média'}
                </Badge>
              </SheetTitle>
              <p className="text-sm text-muted-foreground">ID: {client.id.slice(0, 8)}...</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{client.origin === 'whatsapp' ? 'WhatsApp' : 'Site'}</Badge>
                <Badge variant="outline">
                  Etapa: {PIPELINE_STAGES.find(s => s.id === (client.pipeline_stage || 'protocolado'))?.label}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                {editMode ? 'Cancelar' : 'Editar'}
              </Button>
              {editMode && (
                <Button size="sm" onClick={handleSaveChanges}>Salvar</Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="overview" className="text-xs">Geral</TabsTrigger>
            <TabsTrigger value="contacts" className="text-xs">Contatos</TabsTrigger>
            <TabsTrigger value="services" className="text-xs">Serviços</TabsTrigger>
            <TabsTrigger value="activities" className="text-xs">Atividades</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notas</TabsTrigger>
            <TabsTrigger value="attachments" className="text-xs">Anexos</TabsTrigger>
            <TabsTrigger value="financial" className="text-xs">Financeiro</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Status do Lead
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Valor</p>
                    {editMode ? (
                      <Input
                        type="number"
                        value={editData.contract_value}
                        onChange={(e) => setEditData({ ...editData, contract_value: Number(e.target.value) })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-bold text-green-600">R$ {(client.contract_value || 0).toLocaleString('pt-BR')}</p>
                    )}
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Último Contato</p>
                    <p className="font-medium">Nunca</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Prioridade</p>
                    {editMode ? (
                      <Select value={editData.priority} onValueChange={(v) => setEditData({ ...editData, priority: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium capitalize">{client.priority || 'Média'}</p>
                    )}
                  </div>
                </div>

                {editMode && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <Label>Origem</Label>
                      <Select value={editData.origin} onValueChange={(v) => setEditData({ ...editData, origin: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="site">Site</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Etapa do Funil</Label>
                      <Select value={editData.pipeline_stage} onValueChange={(v) => setEditData({ ...editData, pipeline_stage: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PIPELINE_STAGES.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{client.full_name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{client.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="font-medium">{client.company_name || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Serviços Contratados</h4>
                  {editMode && (
                    <Select 
                      value={editData.pipeline_stage} 
                      onValueChange={async (v) => {
                        setEditData({ ...editData, pipeline_stage: v });
                        // Auto-save when stage changes
                        if (client?.process_id) {
                          await supabase.from('brand_processes').update({ pipeline_stage: v }).eq('id', client.process_id);
                          toast.success(`Fase atualizada para ${PIPELINE_STAGES.find(s => s.id === v)?.label}`);
                          onUpdate();
                        }
                      }}
                    >
                      <SelectTrigger className="w-48"><SelectValue placeholder="Fase do processo" /></SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            <div>
                              <p className="font-medium">{s.label}</p>
                              <p className="text-xs text-muted-foreground">{s.description}</p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {client.brand_name ? (
                  <div className="space-y-4">
                    {/* Current Process */}
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Registro de Marca</p>
                            <p className="text-sm text-muted-foreground">{client.brand_name}</p>
                          </div>
                        </div>
                        <Badge variant={client.process_status === 'concedido' ? 'default' : 'secondary'}>
                          {client.process_status || 'Em Andamento'}
                        </Badge>
                      </div>

                      {/* Current Stage Info */}
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-xs text-muted-foreground mb-1">Fase Atual</p>
                        <p className="font-semibold text-primary">
                          {PIPELINE_STAGES.find(s => s.id === (client.pipeline_stage || 'protocolado'))?.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {PIPELINE_STAGES.find(s => s.id === (client.pipeline_stage || 'protocolado'))?.description}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-green-600 font-medium">
                          <DollarSign className="h-4 w-4 inline" />
                          R$ {(client.contract_value || 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    {/* Service Type Selection */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Tipo de Serviço</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {SERVICE_TYPES.map(service => (
                          <div
                            key={service.id}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50",
                              service.id === 'pedido_registro' ? "border-primary bg-primary/5" : "border-border"
                            )}
                          >
                            <p className="font-medium text-sm">{service.label}</p>
                            <p className="text-xs text-muted-foreground">{service.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum serviço registrado</p>
                    <p className="text-sm">Adicione um processo de marca para este cliente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Histórico de Atividades
                </h4>
                {loading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : activities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma atividade registrada</p>
                ) : (
                  <div className="space-y-3">
                    {activities.map(act => (
                      <div key={act.id} className="p-3 bg-muted rounded-lg">
                        <p className="font-medium text-sm">{act.activity_type}</p>
                        <p className="text-sm text-muted-foreground">{act.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(act.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notas Internas
                </h4>
                <div className="space-y-3 mb-4">
                  <Textarea
                    placeholder="Adicionar uma nota interna..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Nota
                  </Button>
                </div>
                {loading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : notes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma nota</p>
                ) : (
                  <div className="space-y-3">
                    {notes.map(note => (
                      <div key={note.id} className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Anexos do Lead
                  </h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchClientData}>Atualizar</Button>
                    <label>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600" disabled={uploading} asChild>
                        <span>
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                          Novo Anexo
                        </span>
                      </Button>
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                      <Paperclip className="h-8 w-8 text-orange-500" />
                    </div>
                    <p className="font-medium">Nenhum anexo ainda</p>
                    <p className="text-sm text-muted-foreground">Adicione documentos, imagens ou arquivos relacionados a este lead.</p>
                    <label>
                      <Button className="mt-4 bg-orange-500 hover:bg-orange-600" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Adicionar Primeiro Anexo
                        </span>
                      </Button>
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Faturas
                </h4>
                {loading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : invoices.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma fatura</p>
                ) : (
                  <div className="space-y-3">
                    {invoices.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{inv.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence: {format(new Date(inv.due_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">R$ {Number(inv.amount).toLocaleString('pt-BR')}</p>
                          {getStatusBadge(inv.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
