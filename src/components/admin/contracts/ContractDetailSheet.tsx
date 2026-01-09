import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  Eye, Send, Mail, MoreVertical, Trash2, EyeOff,
  FileText, Paperclip, MessageSquare, History, CheckSquare, StickyNote, FileStack, Save
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Contract {
  id: string;
  contract_number: string | null;
  subject: string | null;
  contract_value: number | null;
  start_date: string | null;
  end_date: string | null;
  signature_status: string | null;
  signed_at: string | null;
  visible_to_client: boolean | null;
  user_id: string | null;
  contract_html?: string | null;
  description?: string | null;
  contract_type_id: string | null;
}

interface ContractType {
  id: string;
  name: string;
}

interface ContractDetailSheetProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function ContractDetailSheet({ contract, open, onOpenChange, onUpdate }: ContractDetailSheetProps) {
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [formData, setFormData] = useState({
    subject: '',
    contract_value: '',
    start_date: '',
    end_date: '',
    description: '',
    contract_type_id: '',
    visible_to_client: true,
  });
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [renewalHistory, setRenewalHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchContractTypes();
  }, []);

  useEffect(() => {
    if (contract) {
      setFormData({
        subject: contract.subject || '',
        contract_value: contract.contract_value?.toString() || '',
        start_date: contract.start_date || '',
        end_date: contract.end_date || '',
        description: contract.description || '',
        contract_type_id: contract.contract_type_id || '',
        visible_to_client: contract.visible_to_client ?? true,
      });
      fetchContractData(contract.id);
    }
  }, [contract]);

  const fetchContractTypes = async () => {
    const { data } = await supabase.from('contract_types').select('*');
    setContractTypes(data || []);
  };

  const fetchContractData = async (contractId: string) => {
    const [commentsRes, notesRes, tasksRes, attachmentsRes, renewalRes] = await Promise.all([
      supabase.from('contract_comments').select('*').eq('contract_id', contractId).order('created_at', { ascending: false }),
      supabase.from('contract_notes').select('*').eq('contract_id', contractId).order('created_at', { ascending: false }),
      supabase.from('contract_tasks').select('*').eq('contract_id', contractId).order('due_date', { ascending: true }),
      supabase.from('contract_attachments').select('*').eq('contract_id', contractId).order('created_at', { ascending: false }),
      supabase.from('contract_renewal_history').select('*').eq('contract_id', contractId).order('renewed_at', { ascending: false }),
    ]);

    setComments(commentsRes.data || []);
    setNotes(notesRes.data || []);
    setTasks(tasksRes.data || []);
    setAttachments(attachmentsRes.data || []);
    setRenewalHistory(renewalRes.data || []);
  };

  const handleSave = async () => {
    if (!contract) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          subject: formData.subject,
          contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          description: formData.description || null,
          contract_type_id: formData.contract_type_id || null,
          visible_to_client: formData.visible_to_client,
        })
        .eq('id', contract.id);

      if (error) throw error;
      toast.success('Contrato atualizado');
      onUpdate();
    } catch (error) {
      console.error('Error updating contract:', error);
      toast.error('Erro ao atualizar contrato');
    } finally {
      setSaving(false);
    }
  };

  if (!contract) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">
                {contract.subject || `Contrato #${contract.contract_number}`}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={contract.signature_status === 'signed' ? 'default' : 'destructive'}>
                  {contract.signature_status === 'signed' ? 'Assinado' : 'Não assinado'}
                </Badge>
                {contract.signed_at && (
                  <span className="text-xs text-muted-foreground">
                    Assinado em {format(new Date(contract.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Visualizar contrato
              </Button>
              <Button variant="outline" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="info" className="mt-6">
          <TabsList className="grid grid-cols-8 w-full">
            <TabsTrigger value="info" className="text-xs">Contract Info</TabsTrigger>
            <TabsTrigger value="contract" className="text-xs">Contrato</TabsTrigger>
            <TabsTrigger value="attachments" className="text-xs">Anexos</TabsTrigger>
            <TabsTrigger value="comments" className="text-xs">Comentários</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">Tarefas</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notas</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs">Modelos</TabsTrigger>
          </TabsList>

          {/* Contract Information Tab */}
          <TabsContent value="info" className="space-y-6 mt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="trash" />
                <Label htmlFor="trash" className="text-sm flex items-center gap-1">
                  <Trash2 className="h-4 w-4" /> Lixeira
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="hide" 
                  checked={!formData.visible_to_client}
                  onCheckedChange={(checked) => setFormData({ ...formData, visible_to_client: !checked })}
                />
                <Label htmlFor="hide" className="text-sm flex items-center gap-1">
                  <EyeOff className="h-4 w-4" /> Ocultar do cliente
                </Label>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Input disabled value="Cliente vinculado" />
              </div>

              <div className="space-y-2">
                <Label>Assunto *</Label>
                <Input 
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Assunto do contrato"
                />
              </div>

              <div className="space-y-2">
                <Label>Valor do Contrato</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.contract_value}
                    onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de contrato</Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.contract_type_id}
                    onValueChange={(value) => setFormData({ ...formData, contract_type_id: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {contractTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">+</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início *</Label>
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
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </TabsContent>

          {/* Contract Content Tab */}
          <TabsContent value="contract" className="mt-6">
            <div className="border rounded-lg p-4 min-h-[400px] bg-muted/30">
              {contract.contract_html ? (
                <div dangerouslySetInnerHTML={{ __html: contract.contract_html }} />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum conteúdo de contrato definido
                </p>
              )}
            </div>
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments" className="mt-6">
            <div className="space-y-4">
              <Button variant="outline">
                <Paperclip className="h-4 w-4 mr-2" />
                Adicionar Anexo
              </Button>
              {attachments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum anexo</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span>{attachment.name}</span>
                      <Button variant="ghost" size="sm">Download</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="mt-6">
            <div className="space-y-4">
              <Textarea placeholder="Adicionar comentário..." rows={3} />
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Comentar
              </Button>
              {comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum comentário</p>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-3 border rounded-lg">
                      <p>{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Renewal History Tab */}
          <TabsContent value="history" className="mt-6">
            {renewalHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum histórico de renovação</p>
            ) : (
              <div className="space-y-3">
                {renewalHistory.map((history) => (
                  <div key={history.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between">
                      <span>Renovação</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(history.renewed_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    {history.notes && <p className="text-sm mt-2">{history.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <div className="space-y-4">
              <Button variant="outline">
                <CheckSquare className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma tarefa</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Checkbox checked={task.completed} />
                      <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-6">
            <div className="space-y-4">
              <Textarea placeholder="Adicionar nota..." rows={3} />
              <Button>
                <StickyNote className="h-4 w-4 mr-2" />
                Salvar Nota
              </Button>
              {notes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma nota</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3 border rounded-lg">
                      <p>{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-6">
            <p className="text-muted-foreground text-center py-8">
              Modelos de contrato disponíveis aparecerão aqui
            </p>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
