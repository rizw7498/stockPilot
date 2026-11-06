import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  icon: Icon,
  type = 'button',
  onClick,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-[#070B14] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variants = {
    primary:
      'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-xs shadow-blue-500/25 border border-blue-500/40',
    secondary:
      'glass-3 text-slate-200 hover:text-white hover:bg-white/10 active:bg-white/5 border border-white/10',
    danger:
      'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 active:bg-rose-500/30',
    ghost:
      'text-slate-400 hover:text-slate-200 hover:bg-white/5 active:bg-white/10 border border-transparent',
  };

  const sizes = {
    sm: 'h-7 px-2.5 text-[11px] rounded-md gap-1.5',
    md: 'h-9 px-3.5 text-xs rounded-lg gap-2',
    lg: 'h-10 px-4 text-sm rounded-lg gap-2',
    icon: 'h-8 w-8 p-0 rounded-lg justify-center',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${
        sizes[size] || sizes.md
      } ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
