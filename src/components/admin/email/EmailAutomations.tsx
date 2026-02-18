import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Zap, Plus, Play, Pause, Edit, Trash2, Clock, Mail,
  FileSignature, DollarSign, RefreshCw, UserPlus, AlertCircle,
  ArrowRight, CheckCircle2, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

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
