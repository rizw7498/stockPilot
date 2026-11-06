import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { RotateCcw, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import StatusPill from '../../components/ui/StatusPill';

export default function Returns() {
  const { activeOrganization } = useAuth();
  const toast = useToast();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/returns');
      if (res.success) setReturns(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleComplete = async (id) => {
    try {
      await api.post(`/returns/${id}/complete`);
      toast.success('Return completed and stock disposition applied!');
      fetchReturns();
    } catch (err) {
      toast.error(err.message || 'Completion failed');
    }
  };

  const columns = [
    {
      key: 'returnNumber',
      header: 'Return #',
      render: (num) => <span className="mono-chip font-bold text-blue-400">{num}</span>,
    },
    {
      key: 'returnType',
      header: 'Type',
      render: (type) => (
        <span className="mono-chip text-slate-300 font-bold">{type}</span>
      ),
    },
    {
      key: 'warehouseId',
      header: 'Receiving Dock',
      render: (wh) => (
        <span className="text-xs text-slate-200">{wh?.name || 'Warehouse'}</span>
      ),
    },
    {
      key: 'disposition',
      header: 'Disposition',
      render: (disp) => (
        <span className="mono-chip text-amber-300 bg-amber-500/10 font-bold">
          {disp}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (reason) => (
        <span className="text-xs text-slate-400 truncate max-w-xs">{reason}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (status) => <StatusPill status={status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (_, row) => (
        <div>
          {row.status === 'PENDING' && (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              onClick={() => handleComplete(row._id)}
            >
              Process Return
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/5 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[20px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Returns & RMAs
            </h1>
            <span className="mono-chip text-[11px] text-blue-500 dark:text-blue-400 font-bold">
              {returns.length} Records
            </span>
          </div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
            Manage customer returns, vendor RMAs, restock evaluations, and write-off dispositions.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={returns}
        loading={loading}
        emptyTitle="No return records found"
        emptyDescription="Customer and supplier returns registered in the system will display here."
        className="flex-1"
      />
    </div>
  );
}
