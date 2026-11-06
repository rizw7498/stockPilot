import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { Lock, Mail, ArrowRight, ShieldCheck, Boxes, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Signed in successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-center relative overflow-hidden app-atmosphere">
      {/* SVG Grain Overlay */}
      <div className="app-grain" />

      <div className="relative z-10 max-w-5xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Branding Panel (7 cols on desktop) */}
        <div className="md:col-span-7 space-y-6">
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
              High-Definition Multi-Tenant Inventory Control
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
              Engineered with an append-only stock ledger, dynamic custom permissions, and multi-facility order orchestration.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Append-Only Movement Ledger</div>
                <div className="text-[11px] text-slate-400">Tamper-evident transactional balance audit trail</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Dynamic RBAC Permission Matrix</div>
                <div className="text-[11px] text-slate-400">Custom granular capability assignments per organization</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Strict Tenant Isolation</div>
                <div className="text-[11px] text-slate-400">Zero data leakage across multi-tenant workspaces</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Glass Card Form (5 cols on desktop) */}
        <div className="md:col-span-5">
          <div className="glass-overlay rounded-2xl border border-white/10 p-8 shadow-2xl space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-100 tracking-tight">Sign In</h2>
              <p className="text-xs text-slate-400 mt-0.5">Enter your operational credentials</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Email Address"
                type="email"
                required
                icon={Mail}
                placeholder="admin@stockpilot.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Password"
                type="password"
                required
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                Sign In to Workspace <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>

            <div className="pt-4 border-t border-white/5 text-center text-xs text-slate-400">
              Need a new workspace?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold">
                Register Organization
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
