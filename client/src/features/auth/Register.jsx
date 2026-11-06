import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { Building2, User, Mail, Lock, DollarSign, ArrowRight, Boxes, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    currency: 'USD',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.organizationName) {
      toast.error('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await register(formData);
      toast.success('Organization registered successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-center relative overflow-hidden app-atmosphere py-12">
      {/* SVG Grain Overlay */}
      <div className="app-grain" />

      <div className="relative z-10 max-w-5xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Branding Panel */}
        <div className="md:col-span-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-sm shadow-inner">
              <Boxes className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-slate-100">StockPilot</div>
              <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                Enterprise Inventory Engine
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-100 leading-tight">
              Launch Your Enterprise Workspace
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
              Set up your organization tenant, default warehouse depot, and dynamic role permissions in under 30 seconds.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Automated Provisioning</div>
                <div className="text-[11px] text-slate-400">Default warehouse, standard roles, and ledger initialized instantly</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Double-Entry Verification</div>
                <div className="text-[11px] text-slate-400">Strict transactional audit protection against balance drifts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Glass Card Form */}
        <div className="md:col-span-6">
          <div className="glass-overlay rounded-2xl border border-white/10 p-8 shadow-2xl space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-100 tracking-tight">Register Organization</h2>
              <p className="text-xs text-slate-400 mt-0.5">Create your tenant credentials and workspace settings</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Organization / Company Name"
                required
                icon={Building2}
                placeholder="Apex Logistics Corp"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Full Name"
                  required
                  icon={User}
                  placeholder="Alex Johnson"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <Select
                  label="Workspace Currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="PKR">PKR (₨)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="AED">AED (د.إ)</option>
                </Select>
              </div>

              <Input
                label="Work Email Address"
                type="email"
                required
                icon={Mail}
                placeholder="alex@apexcorp.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <Input
                label="Password"
                type="password"
                required
                icon={Lock}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                Create Tenant Account <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>

            <div className="pt-4 border-t border-white/5 text-center text-xs text-slate-400">
              Already have an organization account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
