import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../app/ToastContext';
import { History, Shield } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';

export default function Audit() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs');
      if (res.success) setLogs(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (date) => (
        <span className="text-xs text-slate-400 font-mono">
          {new Date(date).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actorId',
      header: 'Actor',
      render: (actor) => (
        <span className="font-semibold text-slate-100">
          {actor?.name || 'Automated Engine'}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action Taken',
      render: (action) => (
        <span className="mono-chip text-blue-400 font-bold">{action}</span>
      ),
    },
    {
      key: 'entityType',
      header: 'Domain Entity',
      render: (entity) => (
        <span className="mono-chip text-slate-300 font-mono text-[10px]">
          {entity}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Payload Details',
      render: (details) => (
        <span className="text-xs text-slate-400 font-mono truncate max-w-sm block">
          {JSON.stringify(details || {})}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-100">
              System Audit Trail
            </h1>
            <span className="mono-chip text-[11px] text-emerald-400">
              Immutable
            </span>
          </div>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Cryptographically sealed and immutable audit trail for compliance, security, and traceability.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        emptyTitle="No audit logs recorded"
        emptyDescription="System security, user role alterations, and transaction events will automatically log here."
      />
    </div>
  );
}
