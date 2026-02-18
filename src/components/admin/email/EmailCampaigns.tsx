import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  BarChart3, Plus, Users, Send, Eye, MousePointer,
  TrendingUp, Play, Pause, Edit, Trash2, Calendar,
  Search, Filter, Rocket, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  createdAt: Date;
  scheduledAt?: Date;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1', name: 'Newsletter Julho 2025', subject: 'Novidades no registro de marcas!',
    status: 'sent', recipients: 340, sent: 340, opened: 231, clicked: 89,
    createdAt: new Date('2025-07-01'), scheduledAt: new Date('2025-07-05'),
  },
  {
    id: '2', name: 'Promoção Renovação de Marcas', subject: 'Renove sua marca com 15% de desconto',
    status: 'scheduled', recipients: 128, sent: 0, opened: 0, clicked: 0,
    createdAt: new Date('2025-07-10'), scheduledAt: new Date('2025-07-20'),
  },
  {
    id: '3', name: 'Alerta: Prazo INPI Vencendo', subject: 'Ação urgente necessária no seu processo',
    status: 'sending', recipients: 56, sent: 34, opened: 28, clicked: 12,
    createdAt: new Date('2025-07-12'),
  },
  {
    id: '4', name: 'Campanha Black Friday 2025', subject: 'Registre sua marca com desconto especial',
    status: 'draft', recipients: 0, sent: 0, opened: 0, clicked: 0,
    createdAt: new Date('2025-07-14'),
  },
];

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: 'secondary', icon: Edit },
  scheduled: { label: 'Agendado', color: 'outline' as const, icon: Calendar },
  sending: { label: 'Enviando', color: 'default' as const, icon: Send },
  sent: { label: 'Enviado', color: 'default' as const, icon: Send },
  paused: { label: 'Pausado', color: 'secondary' as const, icon: Pause },
};

interface EmailCampaignsProps {
  onCompose?: () => void;
}

export function EmailCampaigns({ onCompose }: EmailCampaignsProps) {
  const [campaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [search, setSearch] = useState('');

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
        <Button className="gap-2" onClick={() => { toast.info('Nova campanha em breve!'); }}>
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
        <div className="space-y-3">
          {filtered.map((campaign, i) => {
            const statusConf = STATUS_CONFIG[campaign.status];
            const StatusIcon = statusConf.icon;
            const openRate = campaign.sent > 0 ? Math.round((campaign.opened / campaign.sent) * 100) : 0;
            const clickRate = campaign.sent > 0 ? Math.round((campaign.clicked / campaign.sent) * 100) : 0;
            const progress = campaign.recipients > 0 ? Math.round((campaign.sent / campaign.recipients) * 100) : 0;

            return (
              <motion.div key={campaign.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Card className="border-border/50 hover:shadow-md transition-all duration-200 hover:border-primary/20">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{campaign.name}</h3>
                          <Badge variant={statusConf.color as 'default' | 'secondary' | 'outline'} className="gap-1 text-[10px]">
                            <StatusIcon className="h-3 w-3" />
                            {statusConf.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{campaign.subject}</p>

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

                        {/* Stats */}
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

                        {campaign.scheduledAt && campaign.status === 'scheduled' && (
                          <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Agendado para {format(campaign.scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {campaign.status === 'draft' && (
                          <Button size="sm" className="gap-1.5 h-8" onClick={() => toast.info('Envio de campanha em breve!')}>
                            <Rocket className="h-3.5 w-3.5" />
                            Enviar
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
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
