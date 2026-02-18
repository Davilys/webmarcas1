import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Layers, Plus, Mail, Clock, ChevronDown, ChevronRight,
  Play, Pause, Edit, Trash2, Users, TrendingUp, CheckCircle2,
  MessageSquare, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface SequenceStep {
  day: number;
  subject: string;
  type: 'email' | 'wait' | 'condition';
  openRate?: number;
}

interface Sequence {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  enrolledCount: number;
  completedCount: number;
  steps: SequenceStep[];
}

const MOCK_SEQUENCES: Sequence[] = [
  {
    id: '1',
    name: 'Onboarding Novo Cliente',
    description: 'Sequência automática de boas-vindas para clientes que assinaram contrato',
    isActive: true,
    enrolledCount: 48,
    completedCount: 31,
    steps: [
      { day: 0, subject: 'Bem-vindo à WebMarcas! 🎉', type: 'email', openRate: 91 },
      { day: 2, subject: 'Como acompanhar seu processo no INPI', type: 'email', openRate: 74 },
      { day: 5, subject: 'Status do seu registro de marca', type: 'email', openRate: 68 },
      { day: 10, subject: 'Dúvidas frequentes sobre registro de marca', type: 'email', openRate: 55 },
    ],
  },
  {
    id: '2',
    name: 'Recuperação de Leads',
    description: 'Reengajar leads que não responderam após 48h',
    isActive: true,
    enrolledCount: 124,
    completedCount: 89,
    steps: [
      { day: 0, subject: 'Sua marca merece proteção - começe agora', type: 'email', openRate: 43 },
      { day: 3, subject: 'Última chance: registre sua marca com desconto', type: 'email', openRate: 38 },
      { day: 7, subject: 'Posso ajudar? Tire suas dúvidas', type: 'email', openRate: 29 },
    ],
  },
  {
    id: '3',
    name: 'Renovação de Marcas',
    description: 'Alerta automático quando a marca está próxima do vencimento',
    isActive: false,
    enrolledCount: 12,
    completedCount: 8,
    steps: [
      { day: 0, subject: 'Sua marca vence em 90 dias - renove agora', type: 'email', openRate: 87 },
      { day: 30, subject: 'Sua marca vence em 60 dias - ação necessária', type: 'email', openRate: 81 },
      { day: 60, subject: '⚠️ Urgente: sua marca vence em 30 dias', type: 'email', openRate: 94 },
    ],
  },
];

export function EmailSequences() {
  const [sequences, setSequences] = useState<Sequence[]>(MOCK_SEQUENCES);
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const toggleSequence = (id: string) => {
    setSequences(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
    toast.success('Sequência atualizada!');
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Sequências de Email
          </h2>
          <p className="text-sm text-muted-foreground">Fluxos multi-etapa automatizados com pausa inteligente</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('Nova sequência em breve!')}>
          <Plus className="h-4 w-4" />
          Nova Sequência
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        {[
          { label: 'Sequências Ativas', value: sequences.filter(s => s.isActive).length, icon: Play, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Total Inscritos', value: sequences.reduce((s, seq) => s + seq.enrolledCount, 0), icon: Users, color: 'text-foreground', bg: 'bg-muted' },
          { label: 'Concluídos', value: sequences.reduce((s, seq) => s + seq.completedCount, 0), icon: CheckCircle2, color: 'text-foreground', bg: 'bg-muted' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
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

      {/* Sequences List */}
      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {sequences.map((seq, i) => (
            <motion.div key={seq.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}>
              <Card className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  {/* Header */}
                  <button
                    onClick={() => setExpandedId(expandedId === seq.id ? null : seq.id)}
                    className="w-full text-left p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors rounded-t-xl"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Layers className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{seq.name}</h3>
                        <Badge variant={seq.isActive ? 'default' : 'secondary'} className="text-[10px]">
                          {seq.isActive ? 'Ativa' : 'Pausada'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {seq.steps.length} emails
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{seq.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold">{seq.enrolledCount}</p>
                        <p className="text-[10px] text-muted-foreground">inscritos</p>
                      </div>
                      <Switch checked={seq.isActive} onCheckedChange={() => toggleSequence(seq.id)} onClick={e => e.stopPropagation()} />
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => e.stopPropagation()}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {expandedId === seq.id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Steps */}
                  {expandedId === seq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/50 p-4 space-y-2"
                    >
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fluxo da Sequência</p>
                      <div className="space-y-2">
                        {seq.steps.map((step, si) => (
                          <div key={si} className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {si + 1}
                              </div>
                              {si < seq.steps.length - 1 && <div className="h-4 w-0.5 bg-border mt-1" />}
                            </div>
                            <div className="flex-1 flex items-center gap-3 bg-muted/40 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-16">
                                <Clock className="h-3 w-3" />
                                Dia {step.day}
                              </div>
                              <Mail className="h-3.5 w-3.5 text-primary" />
                              <span className="text-xs font-medium flex-1 truncate">{step.subject}</span>
                              {step.openRate && (
                                <Badge variant="secondary" className="text-[10px]">{step.openRate}% abertura</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Smart pause note */}
                      <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          <strong>Pausa inteligente:</strong> a sequência é pausada automaticamente se o cliente responder.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
