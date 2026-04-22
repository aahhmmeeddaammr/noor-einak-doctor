import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-4xl shadow-sm ${className}`}>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl transform scale-150 animate-pulse" />
        <div className="relative h-24 w-24 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
          <Icon className="h-10 w-10 text-primary-500" />
        </div>
      </div>
      
      <div className="max-w-md space-y-2">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {title}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          {description}
        </p>
      </div>

      {action && (
        <Button
          onClick={action.onClick}
          className="mt-8 bg-primary text-white hover:bg-primary/90 px-8 py-6 rounded-2xl font-black shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          {action.icon && <action.icon size={18} />}
          {action.label}
        </Button>
      )}
    </div>
  );
};
