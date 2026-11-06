import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', title = null) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const defaultTitle =
      type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notification';

    setToasts((prev) => [...prev, { id, message, type, title: title || defaultTitle }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{
        success: (msg, title) => addToast(msg, 'success', title),
        error: (msg, title) => addToast(msg, 'error', title),
        info: (msg, title) => addToast(msg, 'info', title),
      }}
    >
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const borderEdge =
            toast.type === 'success'
              ? 'border-l-4 border-l-emerald-500'
              : toast.type === 'error'
              ? 'border-l-4 border-l-rose-500'
              : 'border-l-4 border-l-blue-500';

          const iconColor =
            toast.type === 'success'
              ? 'text-emerald-400'
              : toast.type === 'error'
              ? 'text-rose-400'
              : 'text-blue-400';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto glass-overlay rounded-xl p-4 shadow-2xl border border-white/10 ${borderEdge} flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-150 relative overflow-hidden`}
            >
              {toast.type === 'success' && (
                <CheckCircle2 className={`w-4 h-4 ${iconColor} shrink-0 mt-0.5`} />
              )}
              {toast.type === 'error' && (
                <AlertCircle className={`w-4 h-4 ${iconColor} shrink-0 mt-0.5`} />
              )}
              {toast.type === 'info' && (
                <Info className={`w-4 h-4 ${iconColor} shrink-0 mt-0.5`} />
              )}

              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-slate-100">
                  {toast.title}
                </div>
                <div className="text-[12px] text-slate-300 leading-snug mt-0.5">
                  {toast.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-500 hover:text-slate-300 p-0.5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Dismiss progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
                <div
                  className={`h-full ${
                    toast.type === 'success'
                      ? 'bg-emerald-500'
                      : toast.type === 'error'
                      ? 'bg-rose-500'
                      : 'bg-blue-500'
                  }`}
                  style={{
                    animation: 'toastProgress 4.5s linear forwards',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
