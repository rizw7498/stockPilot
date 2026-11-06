import React from 'react';

export default function Tabs({
  tabs = [], // Array of { id, label, count, icon: Icon }
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div className={`flex items-center gap-1 border-b border-white/10 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-[13px] font-medium transition-all relative border-b-2 -mb-px cursor-pointer select-none ${
              isActive
                ? 'text-blue-400 border-blue-500 font-semibold'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-white/20'
            }`}
          >
            {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 text-[11px] px-1.5 py-0.5 rounded-full font-mono tabular-nums ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-white/5 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
