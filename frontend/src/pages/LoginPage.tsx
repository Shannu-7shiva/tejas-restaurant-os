import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, Mail, ArrowRight, ShieldCheck, 
  ChefHat, Users, Building, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('owner@royalsaffron.com');
  const [password, setPassword] = useState('shiva123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent, customTarget?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await login(email, password);
      if (customTarget) {
        navigate(customTarget);
      } else if (email.includes('chef')) {
        navigate('/kitchen');
      } else if (email.includes('service')) {
        navigate('/service');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLoginAndGo = async (demoEmail: string, demoPass: string, targetRoute: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(demoEmail, demoPass);
      navigate(targetRoute);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Crest */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center font-serif font-bold text-white text-2xl shadow-glow-gold mb-3">
          T
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white">
          TEJAS RESTAURANT OS
        </h2>
        <p className="mt-1 text-xs text-amber-400 font-mono tracking-widest uppercase">
          Kitchen Display, Service & Manager Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900 py-8 px-6 sm:px-8 rounded-3xl border border-slate-800 shadow-2xl">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Staff / Manager Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="name@restaurant.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-glow-gold flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Management'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick 1-Click Role Logins */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-3 text-center">
              1-Click Direct Access Profiles
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLoginAndGo('chef@royalsaffron.com', 'AureliaPass123!', '/kitchen')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-amber-500/30 text-left transition-all active:scale-95 group"
              >
                <span className="font-bold block text-white group-hover:text-amber-300">👨‍🍳 Kitchen KDS</span>
                <span className="text-[10px] text-amber-400">Live Prep Screen →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLoginAndGo('owner@royalsaffron.com', 'shiva123', '/dashboard')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-amber-500/30 text-left transition-all active:scale-95 group"
              >
                <span className="font-bold block text-white group-hover:text-amber-300">👑 Manager View</span>
                <span className="text-[10px] text-amber-400">Full Dashboard →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLoginAndGo('service@royalsaffron.com', 'AureliaPass123!', '/service')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-all active:scale-95 group"
              >
                <span className="font-bold block text-white group-hover:text-amber-300">🛎️ Floor Waiter</span>
                <span className="text-[10px] text-slate-400">Service Console →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLoginAndGo('owner@royalsaffron.com', 'shiva123', '/dashboard/orders')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-all active:scale-95 group"
              >
                <span className="font-bold block text-white group-hover:text-amber-300">📋 Orders Desk</span>
                <span className="text-[10px] text-slate-400">All Live Orders →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Back to Customer Mobile Portal */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-xs text-amber-400 hover:text-amber-300 font-medium underline underline-offset-4"
          >
            ← Back to Tejas Customer Mobile Ordering & Menu
          </a>
        </div>
      </div>
    </div>
  );
};
