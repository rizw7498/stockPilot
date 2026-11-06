import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-md', // 'max-w-md' (480px), 'max-w-2xl' (672px), 'max-w-3xl' (768px), 'max-w-4xl' (896px)
  className = '',
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Scrim */}
      <div
        className="fixed inset-0 glass-scrim transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={`w-screen ${width} glass-overlay border-l border-slate-200/80 dark:border-white/10 shadow-2xl flex flex-col h-full transform transition ease-out duration-200 animate-in slide-in-from-right ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/80 dark:border-white/10 shrink-0">
            <div>
              <h2 className="text-[16px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h2>
              {subtitle && <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg glass-3 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 dark:text-slate-200">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-slate-900/40 shrink-0 flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

