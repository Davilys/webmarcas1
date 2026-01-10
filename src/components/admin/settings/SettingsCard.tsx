import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'purple' | 'green' | 'orange';
}

const glowColors = {
  cyan: 'from-cyan-500/20 to-cyan-500/5',
  purple: 'from-purple-500/20 to-purple-500/5',
  green: 'from-emerald-500/20 to-emerald-500/5',
  orange: 'from-orange-500/20 to-orange-500/5',
};

const borderGlowColors = {
  cyan: 'hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(0,212,255,0.15)]',
  purple: 'hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(157,78,221,0.15)]',
  green: 'hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
  orange: 'hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]',
};

const iconBgColors = {
  cyan: 'bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 text-cyan-400',
  purple: 'bg-gradient-to-br from-purple-500/20 to-purple-500/5 text-purple-400',
  green: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400',
  orange: 'bg-gradient-to-br from-orange-500/20 to-orange-500/5 text-orange-400',
};

export function SettingsCard({ 
  icon: Icon, 
  title, 
  description, 
  children, 
  className,
  glowColor = 'cyan' 
}: SettingsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "border border-border/50 dark:border-white/10",
        "bg-card/80 dark:bg-gradient-to-br dark:from-white/5 dark:to-white/0",
        "backdrop-blur-xl shadow-lg",
        "transition-all duration-300",
        borderGlowColors[glowColor],
        className
      )}
    >
      {/* Gradient overlay on hover */}
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        "bg-gradient-to-r from-transparent via-white/5 to-transparent"
      )} />
      
      <div className="relative p-6">
        <div className="flex items-start gap-4 mb-6">
          <motion.div 
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
            className={cn(
              "p-3 rounded-xl",
              iconBgColors[glowColor]
            )}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
