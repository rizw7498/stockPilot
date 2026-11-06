import React from 'react';

const STATUS_CONFIGS = {
  // Neutral
  DRAFT: {
    label: 'Draft',
    bg: 'bg-slate-500/12',
    border: 'border-slate-500/25',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
  },
  ARCHIVED: {
    label: 'Archived',
    bg: 'bg-slate-500/12',
    border: 'border-slate-500/25',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
  },

  // Info
  ORDERED: {
    label: 'Ordered',
    bg: 'bg-sky-500/12',
    border: 'border-sky-500/25',
    text: 'text-sky-300',
    dot: 'bg-sky-400',
  },
  CONFIRMED: {
    label: 'Confirmed',
    bg: 'bg-sky-500/12',
    border: 'border-sky-500/25',
    text: 'text-sky-300',
    dot: 'bg-sky-400',
  },
  ISSUED: {
    label: 'Issued',
    bg: 'bg-sky-500/12',
    border: 'border-sky-500/25',
    text: 'text-sky-300',
    dot: 'bg-sky-400',
  },
  INVITED: {
    label: 'Invited',
    bg: 'bg-sky-500/12',
    border: 'border-sky-500/25',
    text: 'text-sky-300',
    dot: 'bg-sky-400',
  },
  PENDING: {
    label: 'Pending',
    bg: 'bg-sky-500/12',
    border: 'border-sky-500/25',
    text: 'text-sky-300',
    dot: 'bg-sky-400',
  },

  // Warning
  RESERVED: {
    label: 'Reserved',
    bg: 'bg-amber-500/12',
    border: 'border-amber-500/25',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
  IN_TRANSIT: {
    label: 'In Transit',
    bg: 'bg-amber-500/12',
    border: 'border-amber-500/25',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
  PARTIALLY_RECEIVED: {
    label: 'Partially Received',
    bg: 'bg-amber-500/12',
    border: 'border-amber-500/25',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
  PARTIALLY_DISPATCHED: {
    label: 'Partially Dispatched',
    bg: 'bg-amber-500/12',
    border: 'border-amber-500/25',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
  PARTIALLY_PAID: {
    label: 'Partially Paid',
    bg: 'bg-amber-500/12',
    border: 'border-amber-500/25',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
  LOW_STOCK: {
    label: 'Low Stock',
    bg: 'bg-amber-500/12',
    border: 'border-amber-500/25',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },

  // Success
  FULFILLED: {
    label: 'Fulfilled',
    bg: 'bg-emerald-500/12',
    border: 'border-emerald-500/25',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  RECEIVED: {
    label: 'Received',
    bg: 'bg-emerald-500/12',
    border: 'border-emerald-500/25',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  PAID: {
    label: 'Paid',
    bg: 'bg-emerald-500/12',
    border: 'border-emerald-500/25',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  ACTIVE: {
    label: 'Active',
    bg: 'bg-emerald-500/12',
    border: 'border-emerald-500/25',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-500/12',
    border: 'border-emerald-500/25',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  ACCEPTED: {
    label: 'Accepted',
    bg: 'bg-emerald-500/12',
    border: 'border-emerald-500/25',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },

  // Danger
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-500/12',
    border: 'border-rose-500/25',
    text: 'text-rose-300',
    dot: 'bg-rose-400',
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-rose-500/12',
    border: 'border-rose-500/25',
    text: 'text-rose-300',
    dot: 'bg-rose-400',
  },
  INACTIVE: {
    label: 'Inactive',
    bg: 'bg-rose-500/12',
    border: 'border-rose-500/25',
    text: 'text-rose-300',
    dot: 'bg-rose-400',
  },
  OUT_OF_STOCK: {
    label: 'Out of Stock',
    bg: 'bg-rose-500/12',
    border: 'border-rose-500/25',
    text: 'text-rose-300',
    dot: 'bg-rose-400',
  },
  OVERDUE: {
    label: 'Overdue',
    bg: 'bg-rose-500/12',
    border: 'border-rose-500/25',
    text: 'text-rose-300',
    dot: 'bg-rose-400',
  },
};

export default function StatusPill({ status, label, showDot = true, className = '' }) {
  const normalizedKey = (status || '').toString().toUpperCase();
  const config = STATUS_CONFIGS[normalizedKey] || {
    label: label || status || 'Unknown',
    bg: 'bg-slate-500/12',
    border: 'border-slate-500/25',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
  };

  const displayLabel = label || config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full border text-[11px] font-medium leading-none tracking-tight select-none ${config.bg} ${config.border} ${config.text} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />}
      <span>{displayLabel}</span>
    </span>
  );
}

