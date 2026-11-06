import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KpiCard({
  label,
  value,
  subvalue,
  delta,
  deltaType = 'positive', // 'positive' | 'negative' | 'neutral' | 'warning'
  icon: Icon,
  variant = 'default', // 'default' | 'warning' | 'primary'
  span = 1,
  sparklineData = null,
  onClick,
  className = '',
}) {
  const isWarning = variant === 'warning';
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`glass-2 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-150
        ${isClickable ? 'cursor-pointer hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100/60 dark:hover:bg-slate-800/40' : ''}
        ${
          isWarning
            ? 'border-t-2 border-t-amber-500 shadow-[inset_0_2px_12px_rgba(251,191,36,0.12)]'
            : ''
        }
        ${span === 2 ? 'col-span-1 md:col-span-2' : 'col-span-1'}
        ${className}`}
    >
      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
        <span className="text-[12px] font-medium tracking-wide uppercase text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {Icon && (
          <div
            className={`p-1.5 rounded-lg border ${
              isWarning
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Main value */}
      <div className="flex items-baseline justify-between gap-2 mt-auto">
        <div>
          <div className="text-[28px] md:text-[30px] font-semibold text-slate-900 dark:text-slate-100 font-mono tracking-tight tabular-nums leading-none">
            {value}
          </div>
          {subvalue && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{subvalue}</div>}
        </div>

        {/* Delta Chip */}
        {delta && (
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium tabular-nums border ${
              deltaType === 'positive'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : deltaType === 'negative'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                : deltaType === 'warning'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : 'bg-slate-500/10 text-slate-300 border-slate-500/20'
            }`}
          >
            {deltaType === 'positive' && <TrendingUp className="w-3 h-3" />}
            {deltaType === 'negative' && <TrendingDown className="w-3 h-3" />}
            <span>{delta}</span>
          </div>
        )}
      </div>

      {/* Optional Sparkline visualization */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-end gap-1 h-8">
          {sparklineData.map((val, idx) => {
            const max = Math.max(...sparklineData);
            const heightPct = Math.max(15, Math.round((val / (max || 1)) * 100));
            return (
              <div
                key={idx}
                className="flex-1 bg-blue-500/30 hover:bg-blue-400 rounded-xs transition-all"
                style={{ height: `${heightPct}%` }}
                title={`Day ${idx + 1}: ${val}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

