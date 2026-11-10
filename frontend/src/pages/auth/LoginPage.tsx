import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      const stored = localStorage.getItem('tejas_user') || localStorage.getItem('aurelia_user');
      const user = stored ? JSON.parse(stored) : null;
      if (user?.role === 'PLATFORM_ADMIN') navigate('/super-admin');
      else if (
        user?.role === 'KITCHEN_STAFF' ||
        user?.role === 'KITCHEN_MANAGER'
      )
        navigate('/kitchen');
      else if (user?.role === 'WAITER' || user?.role === 'SERVICE_STAFF')
        navigate('/service');
      else navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (
    demoEmail: string,
    demoPass: string,
    route: string
  ) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setError(null);
    try {
      await login(demoEmail, demoPass);
      navigate(route);
    } catch {
      setError('Quick login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050914] text-[#CBD5E1] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#273449] bg-[#0A1222]/80 backdrop-blur-md">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/tejas-logo.jpg" alt="TEJAS Technologies" className="h-9 w-auto object-contain tejas-logo-merged" />
        </Link>
        <span className="text-[#94A3B8] text-sm">
          New restaurant?{' '}
          <Link to="/register" className="text-[#38BDF8] hover:text-[#7DD3FC] font-semibold transition-colors">
            Register 14-day free trial
          </Link>
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo Showcase with Ambient Glow */}
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#F5B544]/20 via-[#2563EB]/20 to-[#38BDF8]/20 rounded-2xl blur-xl opacity-70 pointer-events-none" />
              <img
                src="/tejas-logo.jpg"
                alt="TEJAS Technologies"
                className="relative h-14 sm:h-16 w-auto object-contain tejas-logo-merged"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Enterprise Sign In</h1>
            <p className="text-[#94A3B8] text-sm">
              Access your restaurant tenant management dashboard
            </p>
          </div>

          <div className="bg-[#101827] rounded-2xl border border-[#273449] p-7 shadow-2xl">
            {error && (
              <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800 rounded-xl flex items-center space-x-2.5 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign-in Placeholder */}
            <button
              type="button"
              className="w-full flex items-center justify-center space-x-3 py-3 bg-[#151F31] hover:bg-[#1f2d47] border border-[#273449] rounded-xl text-white text-sm font-semibold transition-all mb-5 hover:border-[#38BDF8]/50"
              onClick={() =>
                setError(
                  'Google OAuth sign-in is ready for production credentials. Please use email & password below.'
                )
              }
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center space-x-3 my-4">
              <div className="flex-1 h-px bg-[#273449]" />
              <span className="text-[#94A3B8] text-xs uppercase tracking-wider font-semibold">or email</span>
              <div className="flex-1 h-px bg-[#273449]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#0A1222] border border-[#273449] rounded-xl text-white placeholder-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent text-sm"
                    placeholder="owner@restaurant.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-[#0A1222] border border-[#273449] rounded-xl text-white placeholder-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-[#38BDF8]/40"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>

          {/* Quick Access Demo */}
          <div className="mt-6 bg-[#0A1222] rounded-2xl border border-[#273449] p-5 shadow-xl">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#F5B544]" />
              <p className="text-xs font-bold text-[#CBD5E1] uppercase tracking-wider text-center">
                Instant Demo Access
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  label: '👑 Restaurant Owner',
                  email: 'owner@royalsaffron.com',
                  pass: 'shiva123',
                  route: '/dashboard',
                  tag: 'shiva123',
                },
                {
                  label: '👨‍🍳 Kitchen Station',
                  email: 'chef@royalsaffron.com',
                  pass: 'AureliaPass123!',
                  route: '/kitchen',
                  tag: 'Live KDS',
                },
                {
                  label: '🛎️ Waiter / Service',
                  email: 'service@royalsaffron.com',
                  pass: 'AureliaPass123!',
                  route: '/service',
                  tag: 'Tables POS',
                },
                {
                  label: '⚙️ Super Admin',
                  email: 'admin@tejastechnologies.in',
                  pass: 'TejasAdmin2026!',
                  route: '/super-admin',
                  tag: 'Platform Master',
                },
              ].map((d) => (
                <button
                  key={d.label}
                  onClick={() => quickLogin(d.email, d.pass, d.route)}
                  disabled={loading}
                  className="p-3 bg-[#101827] hover:bg-[#151F31] border border-[#273449] hover:border-[#38BDF8]/50 rounded-xl text-left transition-all group disabled:opacity-50"
                >
                  <div className="text-white text-xs font-bold group-hover:text-[#38BDF8] flex items-center justify-between">
                    <span>{d.label}</span>
                  </div>
                  <div className="text-[#94A3B8] text-[10px] mt-1 truncate">
                    {d.email}
                  </div>
                  <div className="text-[#F5B544] text-[9px] font-mono mt-0.5">
                    {d.tag}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
