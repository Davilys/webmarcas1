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
  color: string;
  bgColor: string;
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
  color, 
  bgColor,
  index 
}: StatsCardProps) {
  const isPositiveTrend = trend && trend > 0;
  const isNegativeTrend = trend && trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        y: -5, 
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.15)",
        transition: { duration: 0.2 }
      }}
    >
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className={cn("absolute inset-0 opacity-10", bgColor)} />
        <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10" 
          style={{ background: `radial-gradient(circle, ${color.replace('text-', 'rgb(var(--')})` }} 
        />
        <CardContent className="pt-6 relative">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className={cn("text-3xl font-bold", color)}>
                <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
              </p>
              {trend !== undefined && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-1"
                >
                  {isPositiveTrend && (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  )}
                  {isNegativeTrend && (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    isPositiveTrend && "text-emerald-500",
                    isNegativeTrend && "text-red-500",
                    !isPositiveTrend && !isNegativeTrend && "text-muted-foreground"
                  )}>
                    {isPositiveTrend && '+'}{trend}%
                  </span>
                  {trendLabel && (
                    <span className="text-xs text-muted-foreground">{trendLabel}</span>
                  )}
                </motion.div>
              )}
            </div>
            <motion.div 
              className={cn("p-3 rounded-2xl", bgColor)}
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon className={cn("h-6 w-6", color)} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
