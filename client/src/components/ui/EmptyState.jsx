import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'No operational records have been created or matched the active filter criteria.',
  actionLabel,
  onAction,
  actionIcon,
  children,
  className = '',
}) {
  return (
    <div
      className={`glass-2 rounded-xl p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto my-6 border border-white/5 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl glass-3 border border-white/10 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>

      <h3 className="text-sm font-semibold text-slate-100 tracking-tight mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <Button variant="primary" size="md" icon={actionIcon} onClick={onAction}>
          {actionLabel}
        </Button>
      )}

      {children}
    </div>
  );
}

