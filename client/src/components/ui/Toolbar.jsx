import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import Button from './Button';

export default function Toolbar({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search records... (Press / to focus)',
  filters = [], // Array of { id, label, value, options, onChange }
  activeFilters = [], // Array of { id, label, value, onRemove }
  onClearAllFilters,
  actions,
  className = '',
}) {
  const searchInputRef = useRef(null);

  // Global '/' shortcut to focus search input
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        e.key === '/' &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        document.activeElement.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Search & Filter Dropdowns */}
        <div className="flex items-center flex-1 gap-2.5 flex-wrap">
          {onSearchChange && (
            <div className="relative min-w-[220px] max-w-sm flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-9 pl-8 pr-12 text-[12px] rounded-lg glass-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200/80 dark:border-white/10 input-theme-focus outline-none transition-all"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded">
                    /
                  </kbd>
                )}
              </div>
            </div>
          )}

          {/* Filter Selects */}
          {filters.map((filter) => (
            <select
              key={filter.id}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="h-9 px-3 text-[12px] rounded-lg glass-3 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 focus:border-blue-500/60 outline-none cursor-pointer [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>

        {/* Right: Actions */}
        {actions && <div className="flex items-center gap-2 self-end sm:self-auto">{actions}</div>}
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Active filters:</span>
          {activeFilters.map((af) => (
            <span
              key={af.id}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium glass-3 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200"
            >
              <span className="text-slate-400">{af.label}:</span>
              <span>{af.value}</span>
              <button
                type="button"
                onClick={af.onRemove}
                className="text-slate-400 hover:text-rose-400 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {onClearAllFilters && (
            <button
              type="button"
              onClick={onClearAllFilters}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium ml-1 cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

