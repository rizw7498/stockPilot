import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { BarChart3, Boxes, DollarSign, Download, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import KpiCard from '../../components/ui/KpiCard';
import DataTable from '../../components/ui/DataTable';

export default function Reports() {
  const { activeOrganization } = useAuth();
  const toast = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchValuation = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/stock-valuation');
      if (res.success) setReport(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to generate valuation report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValuation();
  }, []);

  const formatCurrency = (minor = 0) => {
    const symbol = activeOrganization?.currency === 'EUR' ? '€' : '$';
    return `${symbol}${(minor / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const columns = [
    {
      key: 'sku',
      header: 'SKU',
      render: (sku) => <span className="mono-chip font-bold text-blue-400">{sku}</span>,
    },
    {
      key: 'productName',
      header: 'Product Name',
      render: (name) => <span className="font-semibold text-slate-100">{name}</span>,
    },
    {
      key: 'warehouse',
      header: 'Warehouse',
      render: (wh) => <span className="mono-chip text-slate-300">{wh}</span>,
    },
    {
      key: 'onHand',
      header: 'On Hand',
      align: 'right',
      tabular: true,
      render: (qty) => <span className="font-semibold text-slate-100">{qty}</span>,
    },
    {
      key: 'reserved',
      header: 'Reserved',
      align: 'right',
      tabular: true,
      render: (qty) => <span className="font-semibold text-amber-400">{qty}</span>,
    },
    {
      key: 'available',
      header: 'Available',
      align: 'right',
      tabular: true,
      render: (qty) => <span className="font-semibold text-emerald-400">{qty}</span>,
    },
    {
      key: 'unitCostMinor',
      header: 'FIFO Unit Cost',
      align: 'right',
      tabular: true,
      render: (cost) => <span className="font-mono text-slate-600 dark:text-slate-300">{formatCurrency(cost)}</span>,
    },
    {
      key: 'totalValuationMinor',
      header: 'Position Valuation',
      align: 'right',
      tabular: true,
      render: (val) => (
        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{formatCurrency(val)}</span>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/5 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[20px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Inventory Valuation Report
            </h1>
            <span className="mono-chip text-[11px] text-blue-500 dark:text-blue-400 font-bold">
              FIFO Cost Basis
            </span>
          </div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
            Detailed asset breakdown across active warehouse facilities and current stock balances.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={fetchValuation}
        >
          Recalculate
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
        <KpiCard
          label="Total Inventory Valuation"
          value={formatCurrency(report?.totalValuationMinor)}
          subvalue="Aggregate FIFO asset value across all sites"
          icon={DollarSign}
        />
        <KpiCard
          label="Total Physical Units"
          value={`${report?.totalOnHandUnits || 0} Units`}
          subvalue="Combined on-hand stock count"
          icon={Boxes}
        />
      </div>

      {/* Valuation Table */}
      <DataTable
        columns={columns}
        data={report?.positions || []}
        loading={loading}
        emptyTitle="No valuation records found"
        emptyDescription="Inventory positions with recorded cost prices will automatically aggregate here."
        className="flex-1"
      />
    </div>
  );
}
