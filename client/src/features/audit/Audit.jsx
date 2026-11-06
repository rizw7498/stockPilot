import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../app/ToastContext';
import { History, Shield, Clock } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable security and business action logs for compliance and governance.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Entity Type</th>
              <th className="py-3 px-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  Loading audit events...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  No system audit logs recorded.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {log.actorId?.name || 'System / Automated'}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-xs text-blue-600">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                    {log.entityType}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                    {JSON.stringify(log.details || {})}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

