import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedCounter } from './AnimatedCounter';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  gradient: string;
  index: number;
}

export function StatsCard({ 
  title, 
  value, 
  prefix = '', 
  suffix = '',
  icon: Icon, 
  trend,
  trendLabel,
  gradient,
  index 
}: StatsCardProps) {
  const isPositiveTrend = trend && trend > 0;
  const isNegativeTrend = trend && trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{ 
        y: -4, 
        transition: { duration: 0.2, ease: 'easeOut' }
      }}
      className="group"
    >
      <Card className="relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
        {/* Gradient accent line */}
        <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", gradient)} />
        
        <CardContent className="pt-5 pb-4 px-4">
          <div className="flex items-start justify-between mb-3">
            <motion.div 
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br shadow-lg",
                gradient
              )}
              whileHover={{ rotate: 8, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Icon className="h-5 w-5 text-white" />
            </motion.div>
          </div>

          <p className="text-2xl font-bold tracking-tight mb-0.5">
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
          </p>
          
          <p className="text-xs font-medium text-muted-foreground">{title}</p>

          {trend !== undefined && (
            <motion.div 
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.08 }}
              className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50"
            >
              {isPositiveTrend && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
              {isNegativeTrend && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
              <span className={cn(
                "text-xs font-semibold",
                isPositiveTrend && "text-emerald-500",
                isNegativeTrend && "text-red-500",
                !isPositiveTrend && !isNegativeTrend && "text-muted-foreground"
              )}>
                {isPositiveTrend && '+'}{trend}%
              </span>
              {trendLabel && (
                <span className="text-[10px] text-muted-foreground">{trendLabel}</span>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
