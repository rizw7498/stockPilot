import React from 'react';

export default function GlassCard({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  bodyClassName = '',
  padding = 'p-5',
  ...props
}) {
  return (
    <div
      className={`glass-2 rounded-xl text-slate-900 dark:text-slate-100 flex flex-col relative overflow-hidden ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-white/5">
          <div className="space-y-0.5">
            {title && (
              <h3 className="text-[14px] font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-[12px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}

      <div className={`flex-1 ${padding} ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className="px-5 py-3 border-t border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
}

