import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  BarChart3, Plus, Users, Send, Eye, MousePointer,
  TrendingUp, Play, Pause, Edit, Trash2, Calendar,
  Search, Rocket, Clock, X, CheckCircle, Loader2,
  Mail, Target, Zap, Globe
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  preview: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  audience: string;
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  createdAt: Date;
  scheduledAt?: Date;
  content: string;
}

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: '1', name: 'Newsletter Julho 2025', subject: 'Novidades no registro de marcas!',
    preview: 'Confira as últimas atualizações do INPI...',
    status: 'sent', audience: 'Todos os clientes', recipients: 340, sent: 340, opened: 231, clicked: 89,
    createdAt: new Date('2025-07-01'), scheduledAt: new Date('2025-07-05'),
    content: 'Olá {{nome_cliente}},\n\nConfira as últimas novidades sobre seu processo de registro...',
  },
  {
    id: '2', name: 'Promoção Renovação de Marcas', subject: 'Renove sua marca com 15% de desconto',
    preview: 'Oferta válida por tempo limitado...',
    status: 'scheduled', audience: 'Clientes com renovação próxima', recipients: 128, sent: 0, opened: 0, clicked: 0,
    createdAt: new Date('2025-07-10'), scheduledAt: new Date('2025-07-20'),
    content: 'Prezado(a) {{nome_cliente}},\n\nSua marca {{nome_marca}} está próxima do prazo de renovação...',
  },
  {
    id: '3', name: 'Alerta: Prazo INPI Vencendo', subject: 'Ação urgente necessária no seu processo',
    preview: 'Seu processo requer atenção imediata...',
    status: 'sending', audience: 'Processos com prazo vencendo', recipients: 56, sent: 34, opened: 28, clicked: 12,
    createdAt: new Date('2025-07-12'),
    content: 'Atenção {{nome_cliente}},\n\nSeu processo {{numero_processo}} requer ação urgente...',
  },
  {
    id: '4', name: 'Campanha Black Friday 2025', subject: 'Registre sua marca com desconto especial',
    preview: 'Aproveite nossa maior promoção do ano...',
    status: 'draft', audience: 'Leads', recipients: 0, sent: 0, opened: 0, clicked: 0,
    createdAt: new Date('2025-07-14'),
    content: 'Olá,\n\nAproveite nossa maior promoção do ano para registrar sua marca...',
  },
];

const STATUS_CONFIG = {
  draft:     { label: 'Rascunho',  variant: 'secondary' as const, icon: Edit,    color: 'text-muted-foreground' },
  scheduled: { label: 'Agendado', variant: 'outline' as const,   icon: Calendar, color: 'text-blue-500' },
  sending:   { label: 'Enviando', variant: 'default' as const,   icon: Loader2,  color: 'text-primary' },
  sent:      { label: 'Enviado',  variant: 'default' as const,   icon: CheckCircle, color: 'text-emerald-500' },
  paused:    { label: 'Pausado',  variant: 'secondary' as const, icon: Pause,    color: 'text-yellow-500' },
};

const AUDIENCE_OPTIONS = [
  'Todos os clientes',
  'Clientes ativos',
  'Leads',
  'Clientes com renovação próxima',
  'Processos com prazo vencendo',
  'Novos clientes (últimos 30 dias)',
  'Clientes sem resposta há 30 dias',
];

const DYNAMIC_VARS = ['{{nome_cliente}}', '{{nome_marca}}', '{{numero_processo}}', '{{status_processo}}', '{{admin_responsavel}}', '{{link_pagamento}}'];

interface EmailCampaignsProps {
  onCompose?: () => void;
}

export function EmailCampaigns({ onCompose }: EmailCampaignsProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '', subject: '', preview: '', audience: '', content: '', scheduledAt: '',
  });

  const resetForm = () => setForm({ name: '', subject: '', preview: '', audience: '', content: '', scheduledAt: '' });

  const openCreate = () => {
    resetForm();
    setEditCampaign(null);
    setCreateOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setForm({
      name: c.name,
      subject: c.subject,
      preview: c.preview,
      audience: c.audience,
      content: c.content,
      scheduledAt: c.scheduledAt ? format(c.scheduledAt, "yyyy-MM-dd'T'HH:mm") : '',
    });
    setEditCampaign(c);
    setCreateOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.audience || !form.content.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 900));

    if (editCampaign) {
      setCampaigns(prev => prev.map(c => c.id === editCampaign.id ? {
        ...c,
        name: form.name,
        subject: form.subject,
        preview: form.preview,
        audience: form.audience,
        content: form.content,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt) : undefined,
        status: form.scheduledAt ? 'scheduled' : 'draft',
      } : c));
      toast.success('Campanha atualizada com sucesso!');
    } else {
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        name: form.name,
        subject: form.subject,
        preview: form.preview,
        audience: form.audience,
        content: form.content,
        status: form.scheduledAt ? 'scheduled' : 'draft',
        recipients: 0,
        sent: 0,
        opened: 0,
        clicked: 0,
        createdAt: new Date(),
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt) : undefined,
      };
      setCampaigns(prev => [newCampaign, ...prev]);
      toast.success('Campanha criada com sucesso!');
    }

    setIsSaving(false);
    setCreateOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    toast.success('Campanha removida.');
    setDeleteId(null);
  };

  const handleLaunch = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'sending' } : c));
    toast.success('Campanha iniciada! Os emails estão sendo enviados.');
  };

  const handlePause = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? {
      ...c, status: c.status === 'paused' ? 'sending' : 'paused'
    } : c));
  };

  const insertVar = (v: string) => {
    setForm(f => ({ ...f, content: f.content + v }));
  };

  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase())
  );

  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0);
  const totalOpened = campaigns.reduce((s, c) => s + c.opened, 0);
  const totalClicked = campaigns.reduce((s, c) => s + c.clicked, 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Campanhas de Email
          </h2>
          <p className="text-sm text-muted-foreground">Envio em massa com rastreamento avançado</p>
        </div>
        <Button className="gap-2 shadow-md" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        {[
          { label: 'Total Enviados', value: totalSent, icon: Send, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Abertos', value: totalOpened, icon: Eye, color: 'text-foreground', bg: 'bg-muted' },
          { label: 'Cliques', value: totalClicked, icon: MousePointer, color: 'text-foreground', bg: 'bg-muted' },
          { label: 'Taxa de Abertura', value: `${avgOpenRate}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar campanhas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Campaign List */}
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-1">
          <AnimatePresence>
            {filtered.map((campaign, i) => {
              const statusConf = STATUS_CONFIG[campaign.status];
              const StatusIcon = statusConf.icon;
              const openRate = campaign.sent > 0 ? Math.round((campaign.opened / campaign.sent) * 100) : 0;
              const clickRate = campaign.sent > 0 ? Math.round((campaign.clicked / campaign.sent) * 100) : 0;
              const progress = campaign.recipients > 0 ? Math.round((campaign.sent / campaign.recipients) * 100) : 0;

              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card className="border-border/50 hover:shadow-md transition-all duration-200 hover:border-primary/20">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Title row */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-sm">{campaign.name}</h3>
                            <Badge variant={statusConf.variant} className="gap-1 text-[10px]">
                              <StatusIcon className={`h-3 w-3 ${campaign.status === 'sending' ? 'animate-spin' : ''}`} />
                              {statusConf.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{campaign.subject}</p>

                          {/* Audience */}
                          <div className="flex items-center gap-1 mt-1.5">
                            <Target className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground">{campaign.audience}</span>
                          </div>

                          {/* Progress for sending */}
                          {campaign.status === 'sending' && (
                            <div className="mt-3 space-y-1">
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Progresso de envio</span>
                                <span>{campaign.sent}/{campaign.recipients}</span>
                              </div>
                              <Progress value={progress} className="h-1.5" />
                            </div>
                          )}

                          {/* Stats for sent */}
                          {campaign.status === 'sent' && (
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium">{campaign.recipients}</span>
                                <span className="text-[10px] text-muted-foreground">destinatários</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Eye className="h-3.5 w-3.5 text-primary" />
                                <span className="text-xs font-medium text-primary">{openRate}%</span>
                                <span className="text-[10px] text-muted-foreground">abertura</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MousePointer className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium">{clickRate}%</span>
                                <span className="text-[10px] text-muted-foreground">clique</span>
                              </div>
                            </div>
                          )}

                          {/* Scheduled date */}
                          {campaign.scheduledAt && campaign.status === 'scheduled' && (
                            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Agendado para {format(campaign.scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}

                          {/* Created date */}
                          <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                            Criado em {format(campaign.createdAt, 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {campaign.status === 'draft' && (
                            <Button size="sm" className="gap-1.5 h-8" onClick={() => handleLaunch(campaign.id)}>
                              <Rocket className="h-3.5 w-3.5" />
                              Enviar
                            </Button>
                          )}
                          {campaign.status === 'sending' && (
                            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => handlePause(campaign.id)}>
                              <Pause className="h-3.5 w-3.5" />
                              Pausar
                            </Button>
                          )}
                          {campaign.status === 'paused' && (
                            <Button size="sm" className="gap-1.5 h-8" onClick={() => handlePause(campaign.id)}>
                              <Play className="h-3.5 w-3.5" />
                              Retomar
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(campaign)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(campaign.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Nenhuma campanha encontrada</p>
              <p className="text-sm mt-1">Crie sua primeira campanha clicando em "Nova Campanha"</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create / Edit Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {editCampaign ? 'Editar Campanha' : 'Nova Campanha de Email'}
            </DialogTitle>
            <DialogDescription>
              {editCampaign ? 'Edite os detalhes desta campanha.' : 'Configure e crie uma nova campanha de email em massa.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="camp-name">Nome da Campanha <span className="text-destructive">*</span></Label>
              <Input
                id="camp-name"
                placeholder="Ex: Newsletter Agosto 2025"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label htmlFor="camp-subject">Assunto do Email <span className="text-destructive">*</span></Label>
              <Input
                id="camp-subject"
                placeholder="Ex: Novidades no registro de marcas!"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              />
            </div>

            {/* Preview text */}
            <div className="space-y-1.5">
              <Label htmlFor="camp-preview">Texto de Pré-visualização</Label>
              <Input
                id="camp-preview"
                placeholder="Breve descrição que aparece antes de abrir o email..."
                value={form.preview}
                onChange={e => setForm(f => ({ ...f, preview: e.target.value }))}
              />
            </div>

            {/* Audience */}
            <div className="space-y-1.5">
              <Label>Público-alvo <span className="text-destructive">*</span></Label>
              <Select value={form.audience} onValueChange={v => setForm(f => ({ ...f, audience: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o público..." />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schedule */}
            <div className="space-y-1.5">
              <Label htmlFor="camp-schedule">Agendar Envio (opcional)</Label>
              <Input
                id="camp-schedule"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              />
              <p className="text-[11px] text-muted-foreground">Deixe em branco para salvar como rascunho</p>
            </div>

            {/* Dynamic Variables */}
            <div className="space-y-2">
              <Label>Variáveis Dinâmicas</Label>
              <div className="flex flex-wrap gap-2">
                {DYNAMIC_VARS.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVar(v)}
                    className="text-[11px] bg-primary/10 text-primary border border-primary/20 rounded-md px-2 py-0.5 hover:bg-primary/20 transition-colors font-mono"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <Label htmlFor="camp-content">Conteúdo do Email <span className="text-destructive">*</span></Label>
              <Textarea
                id="camp-content"
                placeholder="Escreva o corpo do email aqui... Use as variáveis dinâmicas acima para personalização."
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                className="min-h-[180px] font-mono text-sm resize-none"
              />
            </div>

            {/* Info */}
            <div className="bg-muted/50 border border-border/50 rounded-lg p-3 flex items-start gap-2">
              <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                As variáveis dinâmicas como <code className="bg-primary/10 px-1 rounded">{'{{nome_cliente}}'}</code> serão automaticamente substituídas pelos dados reais de cada destinatário no momento do envio.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isSaving}>
              <X className="h-4 w-4 mr-1.5" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
              {isSaving ? 'Salvando...' : editCampaign ? 'Salvar Alterações' : 'Criar Campanha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A campanha será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
