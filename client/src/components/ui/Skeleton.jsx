import React from 'react';

export default function Skeleton({
  variant = 'text', // 'text' | 'rect' | 'circle' | 'kpi' | 'table-row'
  className = '',
  rows = 1,
  width,
  height,
}) {
  if (variant === 'kpi') {
    return (
      <div className={`glass-2 rounded-xl p-5 space-y-4 skeleton-shimmer ${className}`}>
        <div className="flex justify-between items-center">
          <div className="h-3 w-24 bg-white/5 rounded" />
          <div className="h-6 w-6 bg-white/5 rounded-lg" />
        </div>
        <div className="h-8 w-32 bg-white/10 rounded" />
        <div className="h-3 w-16 bg-white/5 rounded" />
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="border-b border-white/5 skeleton-shimmer">
            <td className="p-3">
              <div className="h-4 w-4 bg-white/5 rounded" />
            </td>
            <td className="p-3">
              <div className="h-4 w-28 bg-white/10 rounded" />
            </td>
            <td className="p-3">
              <div className="h-4 w-36 bg-white/5 rounded" />
            </td>
            <td className="p-3">
              <div className="h-4 w-20 bg-white/5 rounded" />
            </td>
            <td className="p-3">
              <div className="h-5 w-16 bg-white/5 rounded-full" />
            </td>
            <td className="p-3 text-right">
              <div className="h-4 w-12 bg-white/5 rounded ml-auto" />
            </td>
          </tr>
        ))}
      </>
    );
  }

  const baseStyle = {
    width: width || (variant === 'circle' ? '40px' : '100%'),
    height: height || (variant === 'circle' ? '40px' : variant === 'text' ? '14px' : '80px'),
  };

  return (
    <div
      style={baseStyle}
      className={`skeleton-shimmer bg-white/5 ${
        variant === 'circle' ? 'rounded-full' : 'rounded-md'
      } ${className}`}
    />
  );
}
