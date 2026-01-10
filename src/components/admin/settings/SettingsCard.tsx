import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface SettingsCardProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children: React.ReactNode;
  className?: string;
}

export function SettingsCard({
  icon: Icon,
  iconColor = 'text-primary',
  title,
  description,
  badge,
  badgeVariant = 'default',
  children,
  className,
}: SettingsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.005,
        boxShadow: '0 10px 40px -10px hsl(var(--primary) / 0.15)'
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        "relative group rounded-2xl border border-border/50",
        "bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm",
        "shadow-sm hover:shadow-xl hover:border-primary/20",
        "transition-all duration-300 overflow-hidden",
        className
      )}
    >
      {/* Gradient glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Subtle top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn(
                "p-2.5 rounded-xl",
                "bg-gradient-to-br from-primary/15 to-primary/5",
                "shadow-inner"
              )}
            >
              <Icon className={cn("h-5 w-5", iconColor)} />
            </motion.div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {badge && (
            <Badge 
              variant={badgeVariant}
              className={cn(
                "transition-all",
                badgeVariant === 'default' && "bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25"
              )}
            >
              {badge}
            </Badge>
          )}
        </div>
        
        {/* Content */}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
