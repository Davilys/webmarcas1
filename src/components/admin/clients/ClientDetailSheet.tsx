import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  User, Phone, Mail, Building2, DollarSign, Clock, Star,
  FileText, CreditCard, MessageSquare, Calendar as CalendarIcon, Paperclip,
  Upload, Loader2, ExternalLink, Plus, Edit, X, Check, 
  MessageCircle, ArrowUpRight, Tag, Zap, AlertTriangle,
  CheckCircle, XCircle, TrendingUp, Users, Receipt
} from 'lucide-react';
import type { ClientWithProcess } from './ClientKanbanBoard';
import { PIPELINE_STAGES } from './ClientKanbanBoard';
import { usePricing } from '@/hooks/usePricing';

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

interface ClientAppointment {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  completed: boolean;
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

// Hook-based dynamic pricing options
const useServicePricingOptions = () => {
  const { pricing } = usePricing();
  
  return useMemo(() => [
    { 
      id: 'registro_avista', 
      label: 'Registro de Marca - À Vista', 
      value: Math.round(pricing.avista.value), 
      description: 'Pagamento único',
      details: `R$ ${pricing.avista.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} à vista`
    },
    { 
      id: 'registro_boleto', 
      label: 'Registro de Marca - Boleto', 
      value: pricing.boleto.value, 
      description: `${pricing.boleto.installments}x de R$ ${pricing.boleto.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      details: `${pricing.boleto.installments}x R$ ${pricing.boleto.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (boleto)`
    },
    { 
      id: 'registro_cartao', 
      label: 'Registro de Marca - Cartão', 
      value: pricing.cartao.value, 
      description: `${pricing.cartao.installments}x de R$ ${pricing.cartao.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      details: `${pricing.cartao.installments}x R$ ${pricing.cartao.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (cartão)`
    },
    { 
      id: 'exigencia_avista', 
      label: 'Exigência/Publicação - À Vista', 
      value: 1412, 
      description: '1 Salário Mínimo',
      details: 'R$ 1.412,00 à vista (1 SM)'
    },
    { 
      id: 'exigencia_parcelado', 
      label: 'Exigência/Publicação - Parcelado', 
      value: 2388, 
      description: '6x de R$ 398,00',
      details: '6x R$ 398,00 (boleto ou cartão)'
    },
    { 
      id: 'personalizado', 
      label: 'Valor Personalizado', 
      value: 0, 
      description: 'Definir valor manualmente',
      details: 'Informe o valor e motivo'
    },
  ], [pricing]);
};

const SERVICE_TYPES = [
  { id: 'pedido_registro', label: 'Pedido de Registro', description: 'Solicitação inicial de registro de marca junto ao INPI' },
  { id: 'cumprimento_exigencia', label: 'Cumprimento de Exigência', description: 'Resposta a exigência formal do INPI' },
  { id: 'oposicao', label: 'Manifestação de Oposição', description: 'Defesa contra oposição de terceiros' },
  { id: 'recurso', label: 'Recurso Administrativo', description: 'Recurso contra indeferimento do INPI' },
  { id: 'renovacao', label: 'Renovação de Marca', description: 'Renovação do registro decenal' },
  { id: 'notificacao', label: 'Notificação Extrajudicial', description: 'Cessação de uso indevido por terceiros' },
];

const QUICK_ACTIONS = [
  { id: 'chat', label: 'Chats', icon: MessageCircle, color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
  { id: 'move', label: 'Mover', icon: ArrowUpRight, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { id: 'chance', label: 'Marcar Chance', icon: Star, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
  { id: 'lost', label: 'Perdido', icon: AlertTriangle, color: 'bg-red-100 text-red-700 hover:bg-red-200' },
  { id: 'won', label: 'Ganho', icon: CheckCircle, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  { id: 'convert', label: 'Converter', icon: Users, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
];

export function ClientDetailSheet({ client, open, onOpenChange, onUpdate }: ClientDetailSheetProps) {
  const SERVICE_PRICING_OPTIONS = useServicePricingOptions();
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    description: '',
    date: new Date(),
    time: '10:00'
  });
  const [selectedPricing, setSelectedPricing] = useState<string>('');
  const [customValue, setCustomValue] = useState<number>(0);
  const [customValueReason, setCustomValueReason] = useState<string>('');
  const [showPricingDialog, setShowPricingDialog] = useState(false);
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
      // Try to match existing value with a pricing option
      const matchedOption = SERVICE_PRICING_OPTIONS.find(opt => opt.value === client.contract_value);
      if (matchedOption) {
        setSelectedPricing(matchedOption.id);
      } else if (client.contract_value && client.contract_value > 0) {
        setSelectedPricing('personalizado');
        setCustomValue(client.contract_value);
      }
    }
  }, [client, open]);

  const fetchClientData = async () => {
    if (!client) return;
    setLoading(true);

    try {
      const [notesRes, appointmentsRes, docsRes, invoicesRes] = await Promise.all([
        supabase.from('client_notes').select('*').eq('user_id', client.id).order('created_at', { ascending: false }),
        supabase.from('client_appointments').select('*').eq('user_id', client.id).order('scheduled_at', { ascending: true }),
        supabase.from('documents').select('*').eq('user_id', client.id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('user_id', client.id).order('due_date', { ascending: false })
      ]);

      setNotes(notesRes.data || []);
      setAppointments(appointmentsRes.data || []);
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

  const handleCreateAppointment = async () => {
    if (!newAppointment.title.trim() || !client) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const scheduledAt = new Date(newAppointment.date);
      const [hours, minutes] = newAppointment.time.split(':');
      scheduledAt.setHours(parseInt(hours), parseInt(minutes));

      const { error } = await supabase.from('client_appointments').insert({
        user_id: client.id,
        admin_id: user?.id,
        title: newAppointment.title,
        description: newAppointment.description,
        scheduled_at: scheduledAt.toISOString()
      });

      if (error) throw error;
      toast.success('Agendamento criado!');
      setShowNewAppointment(false);
      setNewAppointment({ title: '', description: '', date: new Date(), time: '10:00' });
      fetchClientData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar agendamento');
    }
  };

  const handleToggleAppointment = async (appointment: ClientAppointment) => {
    try {
      const { error } = await supabase
        .from('client_appointments')
        .update({ completed: !appointment.completed })
        .eq('id', appointment.id);

      if (error) throw error;
      toast.success(appointment.completed ? 'Agendamento reaberto' : 'Agendamento concluído!');
      fetchClientData();
    } catch (error) {
      toast.error('Erro ao atualizar agendamento');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !client) return;

    // Sem limite de tamanho de arquivo
    setUploading(true);
    try {
      const fileName = `clients/${client.id}/${Date.now()}_${file.name}`;
      console.log('Uploading file:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        if (uploadError.message.includes('row-level security')) {
          toast.error('Erro de permissão. Verifique as configurações de storage.');
        } else if (uploadError.message.includes('Bucket not found')) {
          toast.error('Bucket de documentos não configurado.');
        } else {
          toast.error(`Erro no upload: ${uploadError.message}`);
        }
        return;
      }

      console.log('Upload successful:', uploadData);

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('documents').insert({
        user_id: client.id,
        name: file.name,
        file_url: urlData.publicUrl,
        document_type: 'anexo',
        uploaded_by: 'admin',
        file_size: file.size,
        mime_type: file.type
      });

      if (dbError) {
        console.error('Database insert error:', dbError);
        toast.error(`Erro ao salvar documento: ${dbError.message}`);
        return;
      }

      toast.success('Documento anexado com sucesso!');
      fetchClientData();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Erro inesperado: ${error?.message || 'Tente novamente'}`);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleSaveChanges = async () => {
    if (!client) return;

    try {
      await supabase.from('profiles').update({
        priority: editData.priority,
        origin: editData.origin,
        contract_value: editData.contract_value
      }).eq('id', client.id);

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

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'chat':
        if (client?.phone) {
          const cleanPhone = client.phone.replace(/\D/g, '');
          window.open(`https://wa.me/55${cleanPhone}`, '_blank');
        } else {
          toast.error('Cliente sem telefone');
        }
        break;
      case 'won':
        toast.success('Cliente marcado como GANHO! 🎉');
        break;
      case 'lost':
        toast.info('Cliente marcado como PERDIDO');
        break;
      case 'chance':
        toast.success('Marcado como alta chance!');
        break;
      default:
        toast.info(`Ação: ${actionId}`);
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

  const currentStage = PIPELINE_STAGES.find(s => s.id === (client.pipeline_stage || 'protocolado'));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        {/* Header with Gradient */}
        <div className={cn(
          "p-6 bg-gradient-to-r text-white",
          currentStage?.color || "from-blue-500 to-blue-600"
        )}>
          <SheetHeader>
            <div className="flex items-start gap-4">
              <motion.div 
                className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {client.full_name?.charAt(0) || 'C'}
              </motion.div>
              <div className="flex-1">
                <SheetTitle className="text-white flex items-center gap-2 text-xl">
                  {client.full_name || 'Sem nome'}
                  <Badge className={cn(
                    "ml-2",
                    client.priority === 'high' ? 'bg-red-500' : 
                    client.priority === 'low' ? 'bg-green-500' : 'bg-yellow-500'
                  )}>
                    {client.priority === 'high' ? 'Alta' : client.priority === 'low' ? 'Baixa' : 'Média'}
                  </Badge>
                </SheetTitle>
                <p className="text-sm text-white/70 mt-1">ID: {client.id.slice(0, 8)}...</p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {client.origin === 'whatsapp' ? '💬 WhatsApp' : '🌐 Site'}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    📍 {currentStage?.label}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
                {editMode && (
                  <Button 
                    size="sm" 
                    className="bg-white text-primary hover:bg-white/90"
                    onClick={handleSaveChanges}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs text-white/60 mb-2 flex items-center gap-1">
              <Zap className="h-3 w-3" /> Ações Rápidas
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
                      action.color
                    )}
                    onClick={() => handleQuickAction(action.id)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {action.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="p-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-6 w-full mb-4">
              <TabsTrigger value="overview" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="contacts" className="text-xs">
                <Phone className="h-3 w-3 mr-1" />
                Contatos
              </TabsTrigger>
              <TabsTrigger value="services" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Serviços
              </TabsTrigger>
              <TabsTrigger value="appointments" className="text-xs">
                <CalendarIcon className="h-3 w-3 mr-1" />
                Agendamentos
              </TabsTrigger>
              <TabsTrigger value="attachments" className="text-xs">
                <Paperclip className="h-3 w-3 mr-1" />
                Anexos
              </TabsTrigger>
              <TabsTrigger value="financial" className="text-xs">
                <CreditCard className="h-3 w-3 mr-1" />
                Financeiro
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-0">
              <Card className="border-0 shadow-md">
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Status do Lead
                    <Badge variant="outline" className="ml-auto">● Aberto</Badge>
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <motion.div 
                      className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      onClick={() => editMode && setShowPricingDialog(true)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs text-muted-foreground">Valor</p>
                        {editMode && <Edit className="h-3 w-3 text-muted-foreground ml-auto" />}
                      </div>
                      <p className="font-bold text-lg text-emerald-600">R$ {(editData.contract_value || 0).toLocaleString('pt-BR')}</p>
                      {selectedPricing && selectedPricing !== 'personalizado' && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {SERVICE_PRICING_OPTIONS.find(o => o.id === selectedPricing)?.details}
                        </p>
                      )}
                      {selectedPricing === 'personalizado' && customValueReason && (
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                          {customValueReason}
                        </p>
                      )}
                    </motion.div>
                    <motion.div 
                      className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 rounded-xl"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-slate-600" />
                        <p className="text-xs text-muted-foreground">Último Contato</p>
                      </div>
                      <p className="font-medium">Nunca</p>
                    </motion.div>
                    <motion.div 
                      className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="h-4 w-4 text-orange-600" />
                        <p className="text-xs text-muted-foreground">Prioridade</p>
                      </div>
                      {editMode ? (
                        <Select value={editData.priority} onValueChange={(v) => setEditData({ ...editData, priority: v })}>
                          <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="font-medium capitalize">{client.priority || 'Média'}</p>
                      )}
                    </motion.div>
                  </div>

                  {/* Tags Section */}
                  <div className="mt-6 p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Tags</span>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Gerenciar
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Nenhuma tag atribuída. Clique em "Gerenciar" para adicionar tags.
                    </p>
                  </div>

                  {/* Notes Section */}
                  <div className="mt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Notas Internas
                    </h4>
                    <div className="space-y-2 mb-3">
                      <Textarea
                        placeholder="Adicionar uma nota interna..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                      <Button onClick={handleAddNote} disabled={!newNote.trim()} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Nota
                      </Button>
                    </div>
                    {notes.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {notes.slice(0, 3).map(note => (
                          <div key={note.id} className="p-3 bg-muted rounded-lg text-sm">
                            <p>{note.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="space-y-4 mt-0">
              <Card className="border-0 shadow-md">
                <CardContent className="pt-4 space-y-4">
                  <motion.div 
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl"
                    whileHover={{ x: 5 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-bold">
                      {client.full_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">NOME COMPLETO</p>
                      <p className="font-semibold">{client.full_name || 'Contato'}</p>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                      className="flex items-center gap-3 p-4 border rounded-xl"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">EMAIL</p>
                        <p className="font-medium text-sm">{client.email || 'N/A'}</p>
                      </div>
                    </motion.div>
                    <motion.div 
                      className="flex items-center gap-3 p-4 border rounded-xl"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Building2 className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">EMPRESA</p>
                        <p className="font-medium text-sm">{client.company_name || 'N/A'}</p>
                      </div>
                    </motion.div>
                  </div>

                  <motion.div 
                    className="flex items-center gap-3 p-4 border rounded-xl"
                    whileHover={{ scale: 1.01 }}
                  >
                    <Phone className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">TELEFONE</p>
                      <p className="font-medium">{client.phone || 'N/A'}</p>
                    </div>
                    {client.phone && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        onClick={() => {
                          const cleanPhone = client.phone!.replace(/\D/g, '');
                          window.open(`https://wa.me/55${cleanPhone}`, '_blank');
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                    )}
                  </motion.div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-4 mt-0">
              <Card className="border-0 shadow-md">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Serviços Contratados
                    </h4>
                    {editMode && (
                      <Select 
                        value={editData.pipeline_stage} 
                        onValueChange={async (v) => {
                          setEditData({ ...editData, pipeline_stage: v });
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
                            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {client.brand_name ? (
                    <div className="space-y-4">
                      <motion.div 
                        className="p-4 border rounded-xl bg-gradient-to-br from-primary/5 to-primary/10"
                        whileHover={{ scale: 1.01 }}
                      >
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

                        <div className={cn(
                          "p-3 rounded-lg border",
                          currentStage?.bgColor,
                          currentStage?.borderColor
                        )}>
                          <p className="text-xs text-muted-foreground mb-1">Fase Atual</p>
                          <p className={cn("font-semibold", currentStage?.textColor)}>
                            {currentStage?.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {currentStage?.description}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-emerald-600 font-medium">
                            <DollarSign className="h-4 w-4 inline" />
                            R$ {(client.contract_value || 0).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </motion.div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Tipo de Serviço</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {SERVICE_TYPES.map(service => (
                            <motion.div
                              key={service.id}
                              whileHover={{ scale: 1.02 }}
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer transition-all",
                                service.id === 'pedido_registro' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                              )}
                            >
                              <p className="font-medium text-sm">{service.label}</p>
                              <p className="text-xs text-muted-foreground">{service.description}</p>
                            </motion.div>
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

            {/* Appointments Tab - NEW */}
            <TabsContent value="appointments" className="space-y-4 mt-0">
              <Card className="border-0 shadow-md">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Agendamentos do Lead
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Gerencie todos os compromissos e reuniões relacionados a este lead
                      </p>
                    </div>
                    <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Agendamento
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Criar Agendamento</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Título</Label>
                            <Input 
                              placeholder="Ex: Reunião de apresentação"
                              value={newAppointment.title}
                              onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Descrição</Label>
                            <Textarea 
                              placeholder="Detalhes do agendamento..."
                              value={newAppointment.description}
                              onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Data</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(newAppointment.date, "dd/MM/yyyy")}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={newAppointment.date}
                                    onSelect={(date) => date && setNewAppointment({ ...newAppointment, date })}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div>
                              <Label>Horário</Label>
                              <Input 
                                type="time"
                                value={newAppointment.time}
                                onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowNewAppointment(false)}>Cancelar</Button>
                          <Button onClick={handleCreateAppointment}>Criar Agendamento</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                  ) : appointments.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12"
                    >
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                        <CalendarIcon className="h-10 w-10 text-blue-500" />
                      </div>
                      <p className="font-medium text-lg mb-1">Nenhum agendamento encontrado</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Este lead ainda não possui agendamentos vinculados.
                      </p>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => setShowNewAppointment(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeiro Agendamento
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {appointments.map((apt, index) => (
                          <motion.div
                            key={apt.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "flex items-center gap-4 p-4 border rounded-xl transition-all",
                              apt.completed 
                                ? "bg-green-50 border-green-200 dark:bg-green-900/20" 
                                : "bg-white dark:bg-slate-900 hover:shadow-md"
                            )}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-8 w-8 rounded-full",
                                apt.completed ? "bg-green-500 text-white" : "border-2"
                              )}
                              onClick={() => handleToggleAppointment(apt)}
                            >
                              {apt.completed && <Check className="h-4 w-4" />}
                            </Button>
                            <div className="flex-1">
                              <p className={cn(
                                "font-medium",
                                apt.completed && "line-through text-muted-foreground"
                              )}>
                                {apt.title}
                              </p>
                              {apt.description && (
                                <p className="text-sm text-muted-foreground">{apt.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">
                                {format(new Date(apt.scheduled_at), "dd/MM/yyyy")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(apt.scheduled_at), "HH:mm")}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attachments Tab */}
            <TabsContent value="attachments" className="space-y-4 mt-0">
              <Card className="border-0 shadow-md">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Anexos do Lead
                    </h4>
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
                        <motion.div 
                          key={doc.id} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          whileHover={{ x: 5 }}
                        >
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
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-4 mt-0">
              <Card className="border-0 shadow-md">
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
                        <motion.div 
                          key={inv.id} 
                          className="flex items-center justify-between p-3 border rounded-lg"
                          whileHover={{ scale: 1.01 }}
                        >
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
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 bg-background border-t flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Aberto
            </span>
            <span>$ R$ {(client.contract_value || 0).toLocaleString('pt-BR')}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Nunca
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver Completo
            </Button>
            <Button onClick={() => setEditMode(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </SheetContent>

      {/* Pricing Selection Dialog */}
      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Selecionar Valor do Serviço
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <RadioGroup 
              value={selectedPricing} 
              onValueChange={(value) => {
                setSelectedPricing(value);
                const option = SERVICE_PRICING_OPTIONS.find(o => o.id === value);
                if (option && value !== 'personalizado') {
                  setEditData({ ...editData, contract_value: option.value });
                }
              }}
            >
              {SERVICE_PRICING_OPTIONS.map((option) => (
                <motion.div
                  key={option.id}
                  whileHover={{ scale: 1.01 }}
                  className={cn(
                    "flex items-start space-x-3 p-4 rounded-xl border transition-all cursor-pointer",
                    selectedPricing === option.id 
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
                      : "border-border hover:border-emerald-300"
                  )}
                  onClick={() => {
                    setSelectedPricing(option.id);
                    const opt = SERVICE_PRICING_OPTIONS.find(o => o.id === option.id);
                    if (opt && option.id !== 'personalizado') {
                      setEditData({ ...editData, contract_value: opt.value });
                    }
                  }}
                >
                  <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                  <div className="flex-1">
                    <label htmlFor={option.id} className="font-medium cursor-pointer">
                      {option.label}
                    </label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                    {option.id !== 'personalizado' && (
                      <p className="text-sm font-semibold text-emerald-600 mt-1">
                        R$ {option.value.toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </RadioGroup>

            {/* Custom Value Fields */}
            <AnimatePresence>
              {selectedPricing === 'personalizado' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-2"
                >
                  <div>
                    <Label>Valor Personalizado (R$)</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={customValue || ''}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setCustomValue(value);
                        setEditData({ ...editData, contract_value: value });
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Motivo / Observação</Label>
                    <Textarea
                      placeholder="Descreva o motivo deste valor personalizado..."
                      value={customValueReason}
                      onChange={(e) => setCustomValueReason(e.target.value)}
                      rows={2}
                      className="mt-1 resize-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPricingDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                setShowPricingDialog(false);
                toast.success(`Valor definido: R$ ${editData.contract_value.toLocaleString('pt-BR')}`);
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmar Valor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
