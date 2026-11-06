import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../app/ToastContext';
import { Warehouse as WarehouseIcon, Plus, MapPin, Phone, Mail, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import GlassCard from '../../components/ui/GlassCard';
import StatusPill from '../../components/ui/StatusPill';

export default function Warehouses() {
  const toast = useToast();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    street: '',
    city: '',
    state: '',
    country: '',
    contactPhone: '',
    contactEmail: '',
    isDefault: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/warehouses');
      if (res.success) setWarehouses(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Code and Name are required');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/warehouses', {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country,
        },
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        isDefault: formData.isDefault,
      });
      toast.success(`Warehouse "${formData.name}" added successfully!`);
      setModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      toast.error(err.message || 'Failed to add warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-100">
              Warehouses & Depots
            </h1>
            <span className="mono-chip text-[11px] text-blue-400">
              {warehouses.length} Locations
            </span>
          </div>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Manage multi-site storage facilities, fulfillment depots, and default dispatch hubs.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => {
            setFormData({
              code: '',
              name: '',
              street: '',
              city: '',
              state: '',
              country: '',
              contactPhone: '',
              contactEmail: '',
              isDefault: warehouses.length === 0,
            });
            setModalOpen(true);
          }}
        >
          Add Warehouse
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((w) => (
          <GlassCard
            key={w._id}
            title={
              <div className="flex items-center gap-2">
                <span className="mono-chip text-blue-400 font-bold">{w.code}</span>
                <span>{w.name}</span>
              </div>
            }
            subtitle={w.address?.city ? `${w.address.city}, ${w.address?.country || ''}` : 'Operational Hub'}
            headerAction={
              w.isDefault ? (
                <span className="mono-chip text-[10px] text-emerald-400 font-bold">
                  Primary Default
                </span>
              ) : (
                <StatusPill status="ACTIVE" label="Active" />
              )
            }
          >
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-start gap-2.5 text-slate-300">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  {w.address?.street
                    ? `${w.address.street}, ${w.address.city || ''} ${w.address.state || ''}`
                    : 'Physical location address not registered'}
                </span>
              </div>

              {w.contactPhone && (
                <div className="flex items-center gap-2.5 text-slate-400">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-mono">{w.contactPhone}</span>
                </div>
              )}

              {w.contactEmail && (
                <div className="flex items-center gap-2.5 text-slate-400">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-mono">{w.contactEmail}</span>
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Add Warehouse Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-lg"
        title="Add Storage Facility"
        subtitle="Define site code, dispatch priority, and logistics contact info"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateWarehouse}
              loading={submitting}
            >
              Create Warehouse
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateWarehouse} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Location Code"
              required
              placeholder="e.g. WH-MAIN"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />

            <Input
              label="Facility Name"
              required
              placeholder="e.g. Central Distribution Hub"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <Input
            label="Street Address"
            placeholder="e.g. 100 Logistics Blvd"
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="City"
              placeholder="e.g. Seattle"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="State / Province"
              placeholder="e.g. WA"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <Input
              label="Country"
              placeholder="e.g. USA"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              placeholder="+1 (555) 000-0000"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            />
            <Input
              label="Contact Email"
              type="email"
              placeholder="dock@facility.com"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="rounded border-white/20 bg-slate-900 text-blue-500 focus:ring-0 cursor-pointer h-4 w-4"
            />
            <label htmlFor="isDefault" className="text-xs text-slate-300 font-medium cursor-pointer">
              Set as primary default warehouse for automated order reservations
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
