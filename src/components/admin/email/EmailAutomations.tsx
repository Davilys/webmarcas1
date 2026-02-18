import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Zap, Plus, Play, Edit, Clock, Mail, GitBranch,
  FileText, DollarSign, UserCheck, AlertTriangle,
  ArrowDown, CheckCircle2, ChevronRight, Copy, Settings, Eye, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'delay' | 'condition';
  label: string;
  detail: string;
  icon: React.ElementType;
  color: string;
}

interface Automation {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  triggerCount: number;
  successRate: number;
  category: string;
  steps: WorkflowStep[];
  lastTriggered?: string;
}

const MOCK_AUTOMATIONS: Automation[] = [
  {
    id: '1', name: 'Onboarding Automático',
    description: 'Sequência completa de boas-vindas após assinatura de contrato',
    isActive: true, triggerCount: 48, successRate: 94, category: 'onboarding',
    lastTriggered: '2 horas atrás',
    steps: [
      { id: 's1', type: 'trigger', label: 'Gatilho: Contrato Assinado', detail: 'Evento: contract_signed', icon: FileText, color: 'text-emerald-500' },
      { id: 's2', type: 'action', label: 'Email: Boas-vindas', detail: 'Template: Bem-vindo à WebMarcas', icon: Mail, color: 'text-primary' },
      { id: 's3', type: 'delay', label: 'Aguardar 2 dias', detail: 'Pausa inteligente', icon: Clock, color: 'text-amber-500' },
      { id: 's4', type: 'action', label: 'Email: Tutorial Portal', detail: 'Template: Como acompanhar', icon: Mail, color: 'text-primary' },
    ],
  },
  {
    id: '2', name: 'Recuperação de Leads',
    description: 'Reengajar leads que não converteram após 24h do formulário',
    isActive: true, triggerCount: 124, successRate: 38, category: 'leads',
    lastTriggered: '45 min atrás',
    steps: [
      { id: 's1', type: 'trigger', label: 'Gatilho: Form Abandonado', detail: 'Evento: form_abandoned (24h)', icon: AlertTriangle, color: 'text-amber-500' },
      { id: 's2', type: 'condition', label: 'SE: email_opt_out = false', detail: 'Verificar consentimento LGPD', icon: GitBranch, color: 'text-purple-500' },
      { id: 's3', type: 'action', label: 'Email: Follow-up Personalizado', detail: 'Template: Seguimento Lead', icon: Mail, color: 'text-primary' },
    ],
  },
  {
    id: '3', name: 'Alerta Exigência INPI',
    description: 'Notificar cliente automaticamente quando INPI publica exigência',
    isActive: true, triggerCount: 31, successRate: 97, category: 'juridico',
    lastTriggered: '1 dia atrás',
    steps: [
      { id: 's1', type: 'trigger', label: 'Gatilho: Status INPI Alterado', detail: 'Evento: inpi_status_change', icon: Zap, color: 'text-red-500' },
      { id: 's2', type: 'condition', label: 'SE: Status = Exigência', detail: 'Verificar tipo publicação RPI', icon: GitBranch, color: 'text-purple-500' },
      { id: 's3', type: 'action', label: 'Email: Exigência de Mérito', detail: 'Template: Processual', icon: Mail, color: 'text-primary' },
      { id: 's4', type: 'action', label: 'Notificar Admin', detail: 'Push + Email interno', icon: UserCheck, color: 'text-emerald-500' },
    ],
  },
  {
    id: '4', name: 'Cobrança Automática',
    description: 'Lembrete de cobrança para faturas próximas do vencimento',
    isActive: false, triggerCount: 89, successRate: 71, category: 'financeiro',
    lastTriggered: '3 dias atrás',
    steps: [
      { id: 's1', type: 'trigger', label: 'Gatilho: Fatura Vencendo (3 dias)', detail: 'Evento: invoice_due_soon', icon: DollarSign, color: 'text-amber-500' },
      { id: 's2', type: 'action', label: 'Email: Lembrete de Pagamento', detail: 'Template: Cobrança Amigável', icon: Mail, color: 'text-primary' },
      { id: 's3', type: 'condition', label: 'SE: Não pago após vencimento', detail: 'Verificar status invoice', icon: GitBranch, color: 'text-purple-500' },
      { id: 's4', type: 'action', label: 'Email: Notificação de Débito', detail: 'Template: Débito em Aberto', icon: Mail, color: 'text-red-500' },
    ],
  },
];

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  onboarding: { label: 'Onboarding', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  leads: { label: 'Leads', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  juridico: { label: 'Jurídico', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  financeiro: { label: 'Financeiro', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
};

const STEP_BADGE: Record<string, string> = {
  trigger: 'bg-emerald-500', action: 'bg-primary', delay: 'bg-amber-500', condition: 'bg-purple-500',
};
const STEP_BG: Record<string, string> = {
  trigger: 'bg-emerald-500/10 border-emerald-500/30',
  action: 'bg-primary/10 border-primary/30',
  delay: 'bg-amber-500/10 border-amber-500/30',
  condition: 'bg-purple-500/10 border-purple-500/30',
};
const STEP_LABEL: Record<string, string> = {
  trigger: 'Gatilho', action: 'Ação', delay: 'Pausa', condition: 'Condição',
};

export function EmailAutomations() {
  const [automations, setAutomations] = useState<Automation[]>(MOCK_AUTOMATIONS);
  const [expandedId, setExpandedId] = useState<string | null>('1');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const toggleAutomation = (id: string) => {
    const auto = automations.find(a => a.id === id);
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    toast.success(auto?.isActive ? '⏸️ Automação pausada' : '▶️ Automação ativada');
  };

  const filtered = filterCategory === 'all' ? automations : automations.filter(a => a.category === filterCategory);
  const totalActive = automations.filter(a => a.isActive).length;
  const totalTriggers = automations.reduce((s, a) => s + a.triggerCount, 0);
  const avgSuccess = Math.round(automations.reduce((s, a) => s + a.successRate, 0) / automations.length);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Automações de Email
          </h2>
          <p className="text-sm text-muted-foreground">Workflows inteligentes com triggers e condições visuais</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => toast.info('Builder visual em breve!')}>
          <Plus className="h-4 w-4" />Nova Automação
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        {[
          { label: 'Ativas', value: totalActive, icon: Play, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Total Disparos', value: totalTriggers, icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Taxa Sucesso', value: `${avgSuccess}%`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {[{ key: 'all', label: 'Todas' }, ...Object.entries(CATEGORY_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map(f => (
          <button key={f.key} onClick={() => setFilterCategory(f.key)}
            className={cn("text-xs px-3 py-1.5 rounded-full border transition-all font-medium",
              filterCategory === f.key ? "bg-primary/10 border-primary/30 text-primary" : "border-border/50 text-muted-foreground hover:bg-muted/50")}>
            {f.label}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-1">
          {filtered.map((auto, i) => {
            const catConf = CATEGORY_CONFIG[auto.category];
            const isExpanded = expandedId === auto.id;
            return (
              <motion.div key={auto.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Card className={cn("border-border/50 hover:shadow-md transition-all duration-200", isExpanded && "border-primary/20 shadow-md")}>
                  <CardContent className="p-0">
                    <button onClick={() => setExpandedId(isExpanded ? null : auto.id)}
                      className="w-full text-left p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors rounded-t-xl">
                      <div className={cn("h-10 w-10 rounded-xl border flex items-center justify-center flex-shrink-0", catConf?.bg)}>
                        <Zap className={`h-5 w-5 ${catConf?.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{auto.name}</h3>
                          <Badge variant={auto.isActive ? 'default' : 'secondary'} className="text-[9px]">
                            {auto.isActive ? '● Ativa' : '○ Pausada'}
                          </Badge>
                          <Badge variant="outline" className="text-[9px]">{auto.steps.length} passos</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{auto.description}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right hidden md:block">
                          <p className="text-sm font-semibold">{auto.triggerCount}</p>
                          <p className="text-[10px] text-muted-foreground">disparos</p>
                        </div>
                        <Switch checked={auto.isActive} onCheckedChange={() => toggleAutomation(auto.id)} onClick={e => e.stopPropagation()} />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); toast.info('Em breve!'); }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border/50 p-4">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fluxo Visual</p>
                              <div className="space-y-1">
                                {auto.steps.map((step, si) => {
                                  const StepIcon = step.icon;
                                  return (
                                    <div key={step.id}>
                                      <div className={cn("flex items-center gap-3 p-3 rounded-xl border", STEP_BG[step.type])}>
                                        <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-primary-foreground text-[10px] font-bold flex-shrink-0", STEP_BADGE[step.type])}>
                                          {si + 1}
                                        </div>
                                        <StepIcon className={`h-4 w-4 flex-shrink-0 ${step.color}`} />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-semibold truncate">{step.label}</p>
                                          <p className="text-[10px] text-muted-foreground truncate">{step.detail}</p>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] flex-shrink-0">{STEP_LABEL[step.type]}</Badge>
                                      </div>
                                      {si < auto.steps.length - 1 && (
                                        <div className="flex justify-center py-0.5">
                                          <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { label: 'Disparos', value: auto.triggerCount, color: 'text-primary' },
                                  { label: 'Taxa Sucesso', value: `${auto.successRate}%`, color: auto.successRate >= 80 ? 'text-emerald-500' : 'text-amber-500' },
                                  { label: 'Último', value: auto.lastTriggered || 'Nunca', color: 'text-muted-foreground' },
                                  { label: 'Passos', value: auto.steps.length, color: 'text-foreground' },
                                ].map((m, mi) => (
                                  <div key={mi} className="bg-muted/40 rounded-lg p-2.5">
                                    <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
                                <p className="text-xs text-muted-foreground flex items-start gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                                  <span><strong className="text-foreground">Pausa inteligente:</strong> Pausada automaticamente se o cliente responder.</span>
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => toast.info('Em breve!')}>
                                  <Eye className="h-3.5 w-3.5 mr-1" />Histórico
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => toast.info('Em breve!')}>
                                  <Settings className="h-3.5 w-3.5 mr-1" />Editar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}


interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  delay: string;
  isActive: boolean;
  sentCount: number;
  openRate: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const DEFAULT_AUTOMATIONS: Automation[] = [
  {
    id: '1', name: 'Boas-vindas ao Lead', trigger: 'Formulário preenchido', action: 'Enviar email de boas-vindas',
    delay: 'Imediato', isActive: true, sentCount: 142, openRate: 68,
    icon: UserPlus, color: 'from-primary/20 to-primary/5'
  },
  {
    id: '2', name: 'Follow-up 24h', trigger: 'Formulário abandonado', action: 'Enviar lembrete de retorno',
    delay: '24 horas', isActive: true, sentCount: 89, openRate: 42,
    icon: Clock, color: 'from-muted to-muted/50'
  },
  {
    id: '3', name: 'Confirmação de Contrato', trigger: 'Contrato assinado', action: 'Enviar confirmação + boas-vindas',
    delay: 'Imediato', isActive: true, sentCount: 67, openRate: 91,
    icon: FileSignature, color: 'from-primary/15 to-primary/5'
  },
  {
    id: '4', name: 'Confirmação de Pagamento', trigger: 'Pagamento confirmado', action: 'Enviar recibo digital',
    delay: 'Imediato', isActive: true, sentCount: 54, openRate: 88,
    icon: DollarSign, color: 'from-accent to-accent/50'
  },
  {
    id: '5', name: 'Atualização de Processo INPI', trigger: 'Status do processo alterado', action: 'Notificar cliente por email',
    delay: 'Imediato', isActive: false, sentCount: 23, openRate: 79,
    icon: RefreshCw, color: 'from-secondary to-secondary/50'
  },
];

const WORKFLOW_STEPS = [
  { icon: AlertCircle, label: 'Gatilho', desc: 'Evento que inicia o fluxo', color: 'bg-amber-500' },
  { icon: Clock, label: 'Aguardar', desc: 'Tempo de espera configurável', color: 'bg-blue-500' },
  { icon: Mail, label: 'Enviar Email', desc: 'Template personalizado', color: 'bg-emerald-500' },
  { icon: CheckCircle2, label: 'Concluído', desc: 'Automação finalizada', color: 'bg-primary' },
];

export function EmailAutomations() {
  const [automations, setAutomations] = useState<Automation[]>(DEFAULT_AUTOMATIONS);
  const [activeView, setActiveView] = useState<'list' | 'builder'>('list');

  const toggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    toast.success('Automação atualizada!');
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Automações de Email
          </h2>
          <p className="text-sm text-muted-foreground">Configure fluxos automáticos de comunicação</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-1 gap-1">
            {['list', 'builder'].map(v => (
              <button
                key={v}
                onClick={() => setActiveView(v as 'list' | 'builder')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeView === v ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {v === 'list' ? 'Minhas Automações' : 'Construtor Visual'}
              </button>
            ))}
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Automação
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <AnimatePresence mode="wait">
          {activeView === 'list' ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Automações Ativas', value: automations.filter(a => a.isActive).length, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Total Disparados', value: automations.reduce((s, a) => s + a.sentCount, 0), color: 'text-primary' },
                  { label: 'Taxa Média de Abertura', value: `${Math.round(automations.reduce((s, a) => s + a.openRate, 0) / automations.length)}%`, color: 'text-amber-600 dark:text-amber-400' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="bg-card border border-border/50 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {automations.map((auto, i) => {
                const Icon = auto.icon;
                return (
                  <motion.div
                    key={auto.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <Card className={`border-border/50 bg-gradient-to-r ${auto.color} hover:shadow-md transition-shadow`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-background/80 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm truncate">{auto.name}</h3>
                              <Badge variant={auto.isActive ? 'default' : 'secondary'} className="text-[10px]">
                                {auto.isActive ? 'Ativo' : 'Pausado'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {auto.trigger}
                              </span>
                              <ChevronRight className="h-3 w-3" />
                              <span>{auto.delay}</span>
                              <ChevronRight className="h-3 w-3" />
                              <span className="truncate">{auto.action}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-semibold">{auto.sentCount}</p>
                              <p className="text-[10px] text-muted-foreground">disparos</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-primary">{auto.openRate}%</p>
                              <p className="text-[10px] text-muted-foreground">abertura</p>
                            </div>
                            <Switch checked={auto.isActive} onCheckedChange={() => toggleAutomation(auto.id)} />
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key="builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Visual Workflow Builder */}
              <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <Zap className="h-12 w-12 text-primary/50 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold">Construtor Visual de Automações</h3>
                    <p className="text-sm text-muted-foreground">Arraste e solte blocos para criar seu fluxo</p>
                  </div>

                  {/* Workflow Preview */}
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {WORKFLOW_STEPS.map((step, i) => {
                      const Icon = step.icon;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center gap-2 cursor-pointer"
                          >
                    <div className={`h-14 w-14 rounded-2xl ${step.color} flex items-center justify-center shadow-lg`}>
                              <Icon className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <p className="text-xs font-semibold">{step.label}</p>
                            <p className="text-[10px] text-muted-foreground text-center max-w-20">{step.desc}</p>
                          </motion.div>
                          {i < WORKFLOW_STEPS.length - 1 && (
                            <ArrowRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-center mt-8">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Criar Novo Fluxo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
