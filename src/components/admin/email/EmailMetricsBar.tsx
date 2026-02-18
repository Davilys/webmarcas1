import { motion } from 'framer-motion';
import { Mail, Send, Eye, TrendingUp, Inbox, Zap } from 'lucide-react';

interface EmailMetricsBarProps {
  stats?: {
    inbox: number;
    sent: number;
    unread: number;
    drafts: number;
    scheduled: number;
    automated: number;
  };
}

const metrics = [
  { key: 'inbox' as const, label: 'Na Caixa', icon: Inbox, color: 'from-blue-500/20 to-blue-500/5', textColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-500/10' },
  { key: 'unread' as const, label: 'Não Lidos', icon: Mail, color: 'from-amber-500/20 to-amber-500/5', textColor: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-500/10' },
  { key: 'sent' as const, label: 'Enviados', icon: Send, color: 'from-emerald-500/20 to-emerald-500/5', textColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-500/10' },
  { key: 'scheduled' as const, label: 'Agendados', icon: Zap, color: 'from-purple-500/20 to-purple-500/5', textColor: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-500/10' },
];

export function EmailMetricsBar({ stats }: EmailMetricsBarProps) {
  return (
    <div className="grid grid-cols-4 gap-3 mt-4">
      {metrics.map((metric, i) => {
        const Icon = metric.icon;
        const value = stats ? stats[metric.key] : 0;
        return (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -2, scale: 1.02 }}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${metric.color} border border-border/40 p-3 cursor-default`}
          >
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-lg ${metric.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-4 w-4 ${metric.textColor}`} />
              </div>
              <div>
                <motion.p
                  key={value}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-lg font-bold ${metric.textColor}`}
                >
                  {value}
                </motion.p>
                <p className="text-[10px] text-muted-foreground leading-tight">{metric.label}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
