import { useEffect, useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import {
  Bell, Plus, Send, Users, FileText, Trash2, Edit, Copy,
  CheckCircle2, AlertTriangle, Info, Zap, Sparkles, Radio,
  Clock, Filter, Search, TrendingUp, Activity, Shield,
  ChevronRight, RefreshCw, Eye, EyeOff, LayoutGrid, List,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/* ─────────────────────────────────────────────────────── */
/* Types                                                    */
/* ─────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────── */
/* Config                                                   */
/* ─────────────────────────────────────────────────────── */
const notificationTypes = [
  { value: 'info',    label: 'Informação', icon: Info,          colorClass: 'text-sky-400',    bgClass: 'bg-sky-500/10',    borderClass: 'border-sky-500/20',    glow: 'rgba(14,165,233,0.25)' },
  { value: 'success', label: 'Sucesso',    icon: CheckCircle2,  colorClass: 'text-emerald-400',bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20', glow: 'rgba(16,185,129,0.25)' },
  { value: 'warning', label: 'Aviso',      icon: AlertTriangle, colorClass: 'text-amber-400',  bgClass: 'bg-amber-500/10',  borderClass: 'border-amber-500/20',  glow: 'rgba(245,158,11,0.25)' },
  { value: 'error',   label: 'Urgente',    icon: Zap,           colorClass: 'text-red-400',    bgClass: 'bg-red-500/10',    borderClass: 'border-red-500/20',    glow: 'rgba(239,68,68,0.25)' },
];

const templateCategories = [
  { value: 'geral',    label: 'Geral' },
  { value: 'cobranca', label: 'Cobrança Extrajudicial' },
  { value: 'inpi',     label: 'Exigências INPI' },
];

/* ─────────────────────────────────────────────────────── */
/* Sub-components                                           */
/* ─────────────────────────────────────────────────────── */

/** Ambient scanline that sweeps the header */
function ScanLine() {
  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
      style={{ background: 'linear-gradient(90deg,transparent,rgba(168,85,247,0.5),transparent)' }}
      animate={{ x: ['-100%', '100%'] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
    />
  );
}

/** Floating particle field */
function ParticleField({ n = 18, color = '168,85,247' }: { n?: number; color?: string }) {
  const pts = useRef(
    Array.from({ length: n }).map(() => ({
      x: Math.random() * 100, y: Math.random() * 100,
      s: 1.5 + Math.random() * 2,
      d: 8 + Math.random() * 12,
      delay: Math.random() * 6,
      op: 0.06 + Math.random() * 0.12,
    }))
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pts.current.map((p, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s,
            background: `radial-gradient(circle,rgba(${color},${p.op}) 0%,transparent 70%)` }}
          animate={{ y: [0, -22, 0], opacity: [p.op, p.op * 2.5, p.op] }}
          transition={{ duration: p.d, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/** HUD metric chip */
function MetricChip({ icon: Icon, value, label, color }: { icon: React.ElementType; value: number | string; label: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-sm"
      style={{ background: `${color}10`, borderColor: `${color}30` }}
    >
      <Icon className="h-3.5 w-3.5" style={{ color }} />
      <div>
        <p className="text-[11px] font-bold leading-none" style={{ color }}>{value}</p>
        <p className="text-[9px] text-muted-foreground mt-0.5 leading-none">{label}</p>
      </div>
    </motion.div>
  );
}

/** Type badge with glow */
function TypeBadge({ type }: { type: string | null }) {
  const t = notificationTypes.find(n => n.value === type) || notificationTypes[0];
  const Icon = t.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', t.bgClass, t.borderClass, t.colorClass)}>
      <Icon className="h-2.5 w-2.5" />
      {t.label}
    </span>
  );
}

/** Single notification card with premium reveal animation */
function NotificationCard({ n, index }: { n: Notification; index: number }) {
  const t = notificationTypes.find(x => x.value === n.type) || notificationTypes[0];
  const Icon = t.icon;
  const recipientName = (n.profiles as any)?.full_name || (n.profiles as any)?.email || 'Desconhecido';
  const timeAgo = n.created_at
    ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, x: -16, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 26 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl border backdrop-blur-sm overflow-hidden cursor-default"
      style={{
        background: `linear-gradient(135deg,hsl(var(--card)/0.6) 0%,${t.glow.replace('0.25','0.04')} 100%)`,
        borderColor: `${t.glow.replace('0.25','0.18')}`,
        boxShadow: n.read ? 'none' : `0 0 20px -8px ${t.glow}`,
      }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{ background: `linear-gradient(180deg,transparent,${t.glow.replace('0.25','0.9')},transparent)` }} />

      {/* Glow on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(600px circle at 50% 50%,${t.glow.replace('0.25','0.06')},transparent 70%)` }}
        transition={{ duration: 0.3 }}
      />

      <div className="flex items-start gap-3 p-4 pl-5">
        {/* Icon orb */}
        <div className={cn('flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border', t.bgClass, t.borderClass)}>
          <Icon className={cn('h-4 w-4', t.colorClass)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm text-foreground leading-tight">{n.title}</h4>
              <TypeBadge type={n.type} />
              {!n.read && (
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5" />
              {timeAgo}
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">{n.message}</p>

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-3 w-3 text-primary" />
            </div>
            <span className="text-[11px] text-muted-foreground">{recipientName}</span>
            {n.read && (
              <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground/60">
                <Eye className="h-2.5 w-2.5" />
                Lida
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Single template card */
function TemplateCard({
  template, index, onEdit, onDelete,
}: {
  template: NotificationTemplate;
  index: number;
  onEdit: (t: NotificationTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const t = notificationTypes.find(x => x.value === template.type) || notificationTypes[0];
  const Icon = t.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 280, damping: 24 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl border backdrop-blur-sm overflow-hidden"
      style={{
        background: 'hsl(var(--card)/0.5)',
        borderColor: 'hsl(var(--border)/0.6)',
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{ background: `linear-gradient(180deg,transparent,${t.glow.replace('0.25','0.8')},transparent)` }} />

      <div className="flex items-start gap-3 p-4 pl-5">
        <div className={cn('flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border', t.bgClass, t.borderClass)}>
          <Icon className={cn('h-4 w-4', t.colorClass)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{template.name}</h4>
            <TypeBadge type={template.type} />
          </div>
          <p className="text-xs font-medium text-foreground/80 mb-1">{template.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{template.message}</p>
        </div>
        <div className="flex flex-col gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
            onClick={() => onEdit(template)}
            className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
          >
            <Edit className="h-3 w-3" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
            onClick={() => onDelete(template.id)}
            className="w-7 h-7 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Page                                                     */
/* ─────────────────────────────────────────────────────── */
export default function AdminNotificacoes() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'templates'>('history');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '', type: 'info', user_id: '', link: '' });
  const [templateForm, setTemplateForm] = useState({ name: '', title: '', message: '', type: 'info', category: 'geral' });

  useEffect(() => { fetchNotifications(); fetchClients(); fetchTemplates(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications').select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false }).limit(100);
    if (error) toast.error('Erro ao carregar notificações');
    else setNotifications(data || []);
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, email');
    setClients(data || []);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase.from('notification_templates')
      .select('*').eq('is_active', true).order('category');
    setTemplates(data || []);
  };

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplate(id);
    const t = templates.find(x => x.id === id);
    if (t) setFormData({ ...formData, title: t.title, message: t.message, type: t.type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) { toast.error('Preencha título e mensagem'); return; }
    if (!sendToAll && !formData.user_id) { toast.error('Selecione um cliente ou "Enviar para todos"'); return; }
    setSending(true);
    const base = { title: formData.title, message: formData.message, type: formData.type, link: formData.link || null, read: false };
    if (sendToAll) {
      const rows = clients.map(c => ({ ...base, user_id: c.id }));
      const { error } = await supabase.from('notifications').insert(rows);
      if (error) toast.error('Erro ao enviar');
      else { toast.success(`Enviado para ${clients.length} clientes`); fetchNotifications(); setDialogOpen(false); resetForm(); }
    } else {
      const { error } = await supabase.from('notifications').insert({ ...base, user_id: formData.user_id });
      if (error) toast.error('Erro ao enviar');
      else { toast.success('Notificação enviada!'); fetchNotifications(); setDialogOpen(false); resetForm(); }
    }
    setSending(false);
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.name || !templateForm.title || !templateForm.message) { toast.error('Preencha todos os campos'); return; }
    if (editingTemplate) {
      const { error } = await supabase.from('notification_templates').update(templateForm).eq('id', editingTemplate.id);
      if (error) toast.error('Erro ao atualizar'); else { toast.success('Template atualizado'); fetchTemplates(); setTemplateDialogOpen(false); resetTemplateForm(); }
    } else {
      const { error } = await supabase.from('notification_templates').insert(templateForm);
      if (error) toast.error('Erro ao criar'); else { toast.success('Template criado'); fetchTemplates(); setTemplateDialogOpen(false); resetTemplateForm(); }
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Excluir este template?')) return;
    const { error } = await supabase.from('notification_templates').update({ is_active: false }).eq('id', id);
    if (error) toast.error('Erro ao excluir'); else { toast.success('Template excluído'); fetchTemplates(); }
  };

  const handleEditTemplate = (t: NotificationTemplate) => {
    setEditingTemplate(t);
    setTemplateForm({ name: t.name, title: t.title, message: t.message, type: t.type, category: t.category });
    setTemplateDialogOpen(true);
  };

  const resetForm = () => { setFormData({ title: '', message: '', type: 'info', user_id: '', link: '' }); setSendToAll(false); setSelectedTemplate(''); };
  const resetTemplateForm = () => { setTemplateForm({ name: '', title: '', message: '', type: 'info', category: 'geral' }); setEditingTemplate(null); };

  const getCategoryLabel = (cat: string) => templateCategories.find(c => c.value === cat)?.label || cat;

  const groupedTemplates = templates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, NotificationTemplate[]>);

  const filteredNotifications = notifications.filter(n => {
    const matchType = filterType === 'all' || n.type === filterType;
    const matchSearch = !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase()) ||
      (n.profiles as any)?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      (n.profiles as any)?.email?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    urgent: notifications.filter(n => n.type === 'error').length,
    today: notifications.filter(n => n.created_at && new Date(n.created_at).toDateString() === new Date().toDateString()).length,
  };

  /* ── Dialog shared input style ── */
  const inputStyle = "bg-card/60 border-border/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl transition-all";

  return (
    <AdminLayout>
      <div className="space-y-5 pb-24 md:pb-8">

        {/* ── HEADER ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative rounded-2xl overflow-hidden border"
          style={{
            background: 'linear-gradient(135deg,hsl(var(--card)) 0%,hsl(var(--card)/0.6) 100%)',
            borderColor: 'hsl(var(--border)/0.5)',
            boxShadow: '0 0 40px -12px rgba(168,85,247,0.15)',
          }}
        >
          <ParticleField />
          <ScanLine />

          <div className="relative p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Title block */}
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center relative overflow-hidden flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,rgba(168,85,247,0.2),rgba(139,92,246,0.1))', border: '1px solid rgba(168,85,247,0.3)' }}
                  animate={{ boxShadow: ['0 0 0px rgba(168,85,247,0)', '0 0 20px rgba(168,85,247,0.4)', '0 0 0px rgba(168,85,247,0)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Bell className="h-5 w-5 text-violet-400" />
                  <motion.div className="absolute inset-0 rounded-2xl" style={{ background: 'conic-gradient(from 0deg,transparent,rgba(168,85,247,0.15),transparent)' }}
                    animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} />
                </motion.div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Central de Notificações</h1>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Radio className="h-3 w-3 text-violet-400" />
                    Comunicação em tempo real com seus clientes
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                  onClick={() => fetchNotifications()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border text-muted-foreground hover:text-foreground transition-colors"
                  style={{ background: 'hsl(var(--card)/0.6)', borderColor: 'hsl(var(--border)/0.5)' }}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Atualizar
                </motion.button>

                {/* New Template button */}
                <Dialog open={templateDialogOpen} onOpenChange={o => { setTemplateDialogOpen(o); if (!o) resetTemplateForm(); }}>
                  <DialogTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
                      style={{ background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.25)', color: 'rgb(196,148,255)' }}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Novo Template
                    </motion.button>
                  </DialogTrigger>

                  {/* Template dialog */}
                  <DialogContent className="max-w-lg border-border/50 backdrop-blur-xl rounded-2xl"
                    style={{ background: 'hsl(var(--card)/0.95)' }}>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-violet-400" />
                        {editingTemplate ? 'Editar Template' : 'Novo Template'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleTemplateSubmit} className="space-y-4 mt-2">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Nome do Template *</Label>
                        <Input className={inputStyle} value={templateForm.name}
                          onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                          placeholder="Ex: Cobrança — 1ª Notificação" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Categoria</Label>
                          <Select value={templateForm.category} onValueChange={v => setTemplateForm({ ...templateForm, category: v })}>
                            <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                            <SelectContent>{templateCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Tipo</Label>
                          <Select value={templateForm.type} onValueChange={v => setTemplateForm({ ...templateForm, type: v })}>
                            <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                            <SelectContent>{notificationTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Título *</Label>
                        <Input className={inputStyle} value={templateForm.title}
                          onChange={e => setTemplateForm({ ...templateForm, title: e.target.value })}
                          placeholder="Ex: Fatura Vencida — Ação Necessária" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Mensagem *</Label>
                        <Textarea className={inputStyle} value={templateForm.message}
                          onChange={e => setTemplateForm({ ...templateForm, message: e.target.value })}
                          placeholder="Conteúdo da notificação..." rows={4} />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setTemplateDialogOpen(false)} className="rounded-xl">Cancelar</Button>
                        <motion.button whileTap={{ scale: 0.96 }} type="submit"
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>
                          {editingTemplate ? <><Edit className="h-3.5 w-3.5" /> Salvar</> : <><Plus className="h-3.5 w-3.5" /> Criar</>}
                        </motion.button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* New Notification button */}
                <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
                  <DialogTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white relative overflow-hidden"
                      style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#8b5cf6 50%,#a855f7 100%)', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}
                    >
                      <motion.div className="absolute inset-0" style={{ background: 'conic-gradient(from 0deg,transparent,rgba(255,255,255,0.1),transparent)' }}
                        animate={{ rotate: 360 }} transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }} />
                      <Plus className="h-4 w-4 relative z-10" />
                      <span className="relative z-10">Nova Notificação</span>
                    </motion.button>
                  </DialogTrigger>

                  {/* Send notification dialog */}
                  <DialogContent className="max-w-lg border-border/50 backdrop-blur-xl rounded-2xl"
                    style={{ background: 'hsl(var(--card)/0.95)' }}>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-violet-400" />
                        Enviar Notificação
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                      {templates.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Usar Template (opcional)</Label>
                          <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                            <SelectTrigger className={inputStyle}><SelectValue placeholder="Selecione um template..." /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(groupedTemplates).map(([cat, tpls]) => (
                                <div key={cat}>
                                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50">{getCategoryLabel(cat)}</div>
                                  {tpls.map(t => (
                                    <SelectItem key={t.id} value={t.id}>
                                      <div className="flex items-center gap-2"><Copy className="h-3 w-3 text-muted-foreground" />{t.name}</div>
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Título *</Label>
                        <Input className={inputStyle} value={formData.title}
                          onChange={e => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Ex: Atualização do seu processo" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Mensagem *</Label>
                        <Textarea className={inputStyle} value={formData.message}
                          onChange={e => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Conteúdo da notificação..." rows={3} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Tipo</Label>
                          <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                            <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
                            <SelectContent>{notificationTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Link (opcional)</Label>
                          <Input className={inputStyle} value={formData.link}
                            onChange={e => setFormData({ ...formData, link: e.target.value })}
                            placeholder="/cliente/processos" />
                        </div>
                      </div>

                      {/* Recipient */}
                      <div className="space-y-3 p-3 rounded-xl border" style={{ background: 'hsl(var(--muted)/0.3)', borderColor: 'hsl(var(--border)/0.4)' }}>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div onClick={() => setSendToAll(!sendToAll)}
                            className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all', sendToAll ? 'bg-violet-500 border-violet-500' : 'border-border bg-card')}>
                            {sendToAll && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                          <span className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            Enviar para todos os clientes
                            <span className="text-xs text-muted-foreground">({clients.length})</span>
                          </span>
                        </label>

                        <AnimatePresence>
                          {!sendToAll && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                              <Select value={formData.user_id} onValueChange={v => setFormData({ ...formData, user_id: v })}>
                                <SelectTrigger className={inputStyle}><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>)}</SelectContent>
                              </Select>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancelar</Button>
                        <motion.button whileTap={{ scale: 0.96 }} type="submit" disabled={sending}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', boxShadow: '0 4px 16px rgba(139,92,246,0.4)' }}>
                          {sending ? <motion.div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white" animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
                            : <Send className="h-3.5 w-3.5" />}
                          {sending ? 'Enviando...' : 'Enviar'}
                        </motion.button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* HUD metrics */}
            <div className="flex flex-wrap gap-2 mt-5">
              <MetricChip icon={Activity}     value={stats.total}  label="Total enviado" color="#a855f7" />
              <MetricChip icon={Bell}          value={stats.unread} label="Não lidas"      color="#3b82f6" />
              <MetricChip icon={Zap}           value={stats.urgent} label="Urgentes"       color="#ef4444" />
              <MetricChip icon={TrendingUp}    value={stats.today}  label="Hoje"           color="#10b981" />
              <MetricChip icon={FileText}      value={templates.length} label="Templates"  color="#f59e0b" />
            </div>
          </div>
        </motion.div>

        {/* ── TABS ─────────────────────────────────────────── */}
        <div className="flex gap-2 p-1 rounded-2xl border backdrop-blur-sm"
          style={{ background: 'hsl(var(--card)/0.5)', borderColor: 'hsl(var(--border)/0.4)' }}>
          {([
            { key: 'history',   label: 'Histórico', icon: Bell,     count: notifications.length },
            { key: 'templates', label: 'Templates',  icon: FileText, count: templates.length },
          ] as const).map(tab => (
            <motion.button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all relative overflow-hidden',
                activeTab === tab.key ? 'text-white' : 'text-muted-foreground hover:text-foreground')}
              style={activeTab === tab.key ? { background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', boxShadow: '0 4px 16px rgba(139,92,246,0.3)' } : {}}
            >
              {activeTab === tab.key && (
                <motion.div layoutId="tab-glow" className="absolute inset-0"
                  style={{ background: 'conic-gradient(from 0deg,transparent,rgba(255,255,255,0.06),transparent)' }}
                  animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
              )}
              <tab.icon className="h-4 w-4 relative z-10" />
              <span className="relative z-10 hidden xs:inline">{tab.label}</span>
              <span className={cn('relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center',
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground')}>
                {tab.count}
              </span>
            </motion.button>
          ))}
        </div>

        {/* ── HISTORY TAB ──────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="space-y-4">
              {/* Search + filter bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    className="pl-9 rounded-xl border-border/50 bg-card/50 backdrop-blur-sm placeholder:text-muted-foreground/40 focus:border-primary/50"
                    placeholder="Buscar notificações..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {[{ value: 'all', label: 'Todos' }, ...notificationTypes.map(t => ({ value: t.value, label: t.label }))].map(f => (
                    <motion.button key={f.value} whileTap={{ scale: 0.94 }}
                      onClick={() => setFilterType(f.value)}
                      className={cn('px-3 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap',
                        filterType === f.value
                          ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                          : 'bg-card/50 border-border/40 text-muted-foreground hover:text-foreground')}>
                      {f.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* List */}
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.07 }}
                      className="h-20 rounded-2xl border border-border/40 overflow-hidden relative">
                      <motion.div className="absolute inset-0"
                        style={{ background: 'linear-gradient(90deg,transparent,hsl(var(--muted)/0.4),transparent)' }}
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear', delay: i * 0.1 }} />
                      <div className="h-full bg-card/30" />
                    </motion.div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 gap-4">
                  <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', boxShadow: '0 0 30px rgba(168,85,247,0.1)' }}
                    animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                    <Bell className="h-7 w-7 text-violet-400" />
                  </motion.div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground/70">{search || filterType !== 'all' ? 'Nenhuma notificação encontrada' : 'Sem notificações enviadas'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {search || filterType !== 'all' ? 'Tente ajustar os filtros' : 'Clique em "Nova Notificação" para começar'}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((n, i) => <NotificationCard key={n.id} n={n} index={i} />)}
                </div>
              )}
            </motion.div>
          )}

          {/* ── TEMPLATES TAB ──────────────────────────────── */}
          {activeTab === 'templates' && (
            <motion.div key="templates" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="space-y-6">
              {templates.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 gap-4">
                  <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}
                    animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                    <FileText className="h-7 w-7 text-violet-400" />
                  </motion.div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground/70">Nenhum template cadastrado</p>
                    <p className="text-xs text-muted-foreground mt-1">Crie templates para agilizar o envio de notificações</p>
                  </div>
                </motion.div>
              ) : (
                Object.entries(groupedTemplates).map(([cat, tpls]) => (
                  <div key={cat}>
                    {/* Category header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
                        style={{ background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.2)' }}>
                        <Sparkles className="h-3 w-3 text-violet-400" />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400">{getCategoryLabel(cat)}</span>
                      </div>
                      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,rgba(168,85,247,0.2),transparent)' }} />
                      <span className="text-xs text-muted-foreground">{tpls.length} template{tpls.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-3">
                      {tpls.map((t, i) => (
                        <TemplateCard key={t.id} template={t} index={i} onEdit={handleEditTemplate} onDelete={handleDeleteTemplate} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
