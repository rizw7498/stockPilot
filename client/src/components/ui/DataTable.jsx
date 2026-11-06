import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';

export default function DataTable({
  columns = [], // Array of { key, header, render, align = 'left', sortable = false, width }
  data = [],
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search query or filters to find what you are looking for.',
  onRowClick,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  bulkActions,
  pageSize = 10,
  currentPage = 1,
  totalItems,
  onPageChange,
  sortColumn,
  sortDirection, // 'asc' | 'desc'
  onSort,
  className = '',
}) {
  const isSelectable = Boolean(onSelectRow);
  const allSelected =
    data.length > 0 && selectedRows.length === data.length;
  const someSelected =
    selectedRows.length > 0 && selectedRows.length < data.length;

  const totalPages = Math.ceil((totalItems || data.length) / pageSize) || 1;
  const paginatedData = totalItems ? data : data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className={`relative flex flex-col flex-1 min-h-[380px] lg:max-h-[calc(100vh-215px)] glass-3 rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs ${className}`}>
      {/* Table Scrollable Container */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/95 dark:bg-slate-900/80 backdrop-blur-md">
              {isSelectable && (
                <th className="w-12 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => el && (el.indeterminate = someSelected)}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                    className="rounded border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 text-blue-600 focus:ring-1 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                  />
                </th>
              )}

              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';

                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => col.sortable && onSort && onSort(col.key)}
                    className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 select-none ${alignClass} ${
                      col.sortable ? 'cursor-pointer hover:text-slate-900 dark:hover:text-slate-200' : ''
                    }`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-500">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[13px]">
            {loading ? (
              <Skeleton variant="table-row" rows={pageSize > 8 ? 8 : pageSize} />
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (isSelectable ? 1 : 0)}
                  className="py-16 px-4 text-center"
                >
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => {
                const isSelected = selectedRows.includes(row.id || row._id || rowIdx);

                return (
                  <tr
                    key={row.id || row._id || rowIdx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`h-10 transition-colors duration-100 group ${
                      isSelected ? 'bg-blue-50/70 dark:bg-blue-500/10' : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.03]'
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {isSelectable && (
                      <td
                        className="w-12 px-4 py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            onSelectRow && onSelectRow(row.id || row._id || rowIdx, e.target.checked)
                          }
                          className="rounded border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 text-blue-600 focus:ring-1 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                        />
                      </td>
                    )}

                    {columns.map((col) => {
                      const alignClass =
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left';

                      const cellValue = row[col.key];

                      return (
                        <td
                          key={col.key}
                          className={`px-4 py-2 text-slate-700 dark:text-slate-200 ${alignClass} ${
                            col.tabular ? 'tabular-nums font-mono' : ''
                          }`}
                        >
                          {col.render ? col.render(cellValue, row) : cellValue ?? '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: Pagination & Item Count */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-slate-900/40 text-xs text-slate-500 dark:text-slate-400">
        <div>
          <span>Showing </span>
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {paginatedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>
          <span> to </span>
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {Math.min(currentPage * pageSize, totalItems || data.length)}
          </span>
          <span> of </span>
          <span className="font-medium text-slate-800 dark:text-slate-200">{totalItems || data.length}</span>
          <span> entries</span>
        </div>

        {onPageChange && totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              icon={ChevronLeft}
            >
              Prev
            </Button>
            <span className="px-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Floating Glass Bulk Action Bar */}
      {selectedRows.length > 0 && bulkActions && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-overlay rounded-xl px-4 py-2.5 border border-blue-500/30 flex items-center gap-4 shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {selectedRows.length} item{selectedRows.length > 1 ? 's' : ''} selected
          </span>
          <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
          <div className="flex items-center gap-2">{bulkActions}</div>
        </div>
      )}
    </div>
  );
}

