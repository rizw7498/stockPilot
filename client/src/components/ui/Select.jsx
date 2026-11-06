import React, { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    required = false,
    options = [],
    children,
    className = '',
    containerClassName = '',
    disabled = false,
    icon: Icon,
    ...props
  },
  ref
) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-[12px] font-medium text-slate-300 flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-rose-400 ml-1 font-semibold">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <select
          ref={ref}
          disabled={disabled}
          className={`w-full h-9 appearance-none px-3 pr-8 text-[13px] rounded-lg glass-3 text-slate-100
            border transition-all duration-150 outline-none cursor-pointer
            ${Icon ? 'pl-9' : ''}
            ${
              error
                ? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30'
                : 'border-white/10 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/40'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            [&>option]:bg-slate-900 [&>option]:text-slate-100
            ${className}`}
          {...props}
        >
          {children ||
            options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
        </select>

        <div className="absolute right-3 pointer-events-none text-slate-400">
          {error ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {error ? (
        <p className="text-[11px] text-rose-400 flex items-center gap-1 font-medium mt-0.5">
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Select;
