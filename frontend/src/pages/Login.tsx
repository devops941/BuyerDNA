import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import { Crown, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@buyerdna.com');
  const [password, setPassword] = useState('Admin@123456');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await authApi.login({ email, password });
      login(res.data.data.token, res.data.data.user);
      toast.success(`Welcome back, ${res.data.data.user.name}!`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (roleEmail: string, pass: string) => {
    setEmail(roleEmail);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090D16] via-[#0F172A] to-[#1E1B4B] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-loyal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-royal-600 p-[1.5px] shadow-glow-royal">
            <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center text-loyal-400">
              <Crown className="w-7 h-7" />
            </div>
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-black text-white tracking-tight">
          Buyer<span className="text-loyal-400">DNA</span>
        </h2>
        <p className="mt-1 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Customer Segmentation & Retail Intelligence Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-2xl border border-white/20 rounded-3xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700">Work Email Address</label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 bg-slate-50/50"
                  placeholder="admin@buyerdna.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 bg-slate-50/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="loyal"
              className="w-full mt-2 py-2.5 text-sm font-bold shadow-glow-gold"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              Sign In to Analytics Workspace
            </Button>
          </form>

          {/* Quick-fill Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-loyal-600" />
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Instant Demo Access
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@buyerdna.com', 'Admin@123456')}
                className="text-[11px] py-1.5 px-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold transition-all shadow-sm"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('analyst@buyerdna.com', 'Analyst@123456')}
                className="text-[11px] py-1.5 px-2 rounded-xl border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-950 font-bold transition-all shadow-sm"
              >
                Analyst
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('viewer@buyerdna.com', 'Viewer@123456')}
                className="text-[11px] py-1.5 px-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold transition-all shadow-sm"
              >
                Viewer
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <span className="text-xs text-slate-500">Need a new workspace? </span>
            <Link to="/register" className="text-xs font-bold text-brand-700 hover:underline">
              Create Enterprise Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
