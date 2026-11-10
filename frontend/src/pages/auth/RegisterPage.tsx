import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../services/api';
import {
  UtensilsCrossed,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

const CATEGORIES = [
  'Fine Dining',
  'Casual Dining',
  'Cafe',
  'Fast Food',
  'Food Court',
  'Cloud Kitchen',
  'Bakery',
  'Bar & Grill',
  'Hotel Restaurant',
  'Dhaba',
  'Other',
];

interface FormData {
  restaurant_name: string;
  owner_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  category: string;
  country: string;
  state: string;
  city: string;
  area: string;
  address: string;
  postal_code: string;
  gstin: string;
  num_branches: number;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormData>({
    restaurant_name: '',
    owner_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    category: 'Casual Dining',
    country: 'India',
    state: '',
    city: '',
    area: '',
    address: '',
    postal_code: '',
    gstin: '',
    num_branches: 1,
  });

  const update = (field: keyof FormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validateStep1 = (): string | null => {
    if (!form.restaurant_name.trim()) return 'Restaurant name is required.';
    if (!form.owner_name.trim()) return 'Owner name is required.';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      return 'Valid email is required.';
    if (!form.phone.match(/^[\d\s+\-]{10,15}$/))
      return 'Valid phone number is required.';
    if (form.password.length < 8)
      return 'Password must be at least 8 characters.';
    if (form.password !== form.confirm_password) return 'Passwords do not match.';
    return null;
  };

  const handleNext = () => {
    const err = step === 1 ? validateStep1() : null;
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/register/restaurant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_name: form.restaurant_name,
          owner_name: form.owner_name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          category: form.category,
          country: form.country,
          state: form.state,
          city: form.city,
          area: form.area,
          address: form.address,
          postal_code: form.postal_code,
          gstin: form.gstin,
          num_branches: form.num_branches,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Registration failed.');
      setStep(4); // success
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-[#0A1222] border border-[#273449] rounded-xl text-white placeholder-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent text-sm transition-colors';
  const labelClass =
    'block text-xs font-bold text-[#CBD5E1] mb-1.5 uppercase tracking-wider';

  return (
    <div className="min-h-screen bg-[#050914] text-[#CBD5E1] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#273449] bg-[#0A1222]/80 backdrop-blur-md">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/tejas-logo.jpg" alt="TEJAS Technologies" className="h-9 w-auto object-contain tejas-logo-merged" />
        </Link>
        <span className="text-[#94A3B8] text-sm">
          Already registered?{' '}
          <Link to="/login" className="text-[#38BDF8] hover:text-[#7DD3FC] font-semibold transition-colors">
            Log in to Dashboard
          </Link>
        </span>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {step < 4 && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Register Your Restaurant
                </h1>
                <p className="text-slate-400 text-sm">
                  Start your 14-day free trial. No credit card required.
                </p>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-center space-x-2 mb-8">
                {[1, 2, 3].map((s) => (
                  <React.Fragment key={s}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        step >= s
                          ? 'bg-[#2563EB] text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                          : 'bg-[#151F31] text-[#94A3B8] border border-[#273449]'
                      }`}
                    >
                      {s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`h-0.5 w-8 transition-colors ${
                          step > s ? 'bg-[#2563EB]' : 'bg-[#273449]'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {error && (
                <div className="mb-5 p-3 bg-red-950/60 border border-red-800 rounded-xl flex items-center space-x-2 text-red-300 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}

          {/* Step 1: Account Details */}
          {step === 1 && (
            <div className="bg-[#101827] rounded-2xl border border-[#273449] p-7 space-y-4 shadow-xl">
              <h2 className="text-white font-semibold mb-4">
                Account & Restaurant Info
              </h2>
              <div>
                <label className={labelClass}>Restaurant Name *</label>
                <input
                  className={inputClass}
                  placeholder="e.g. The Royal Spice"
                  value={form.restaurant_name}
                  onChange={(e) => update('restaurant_name', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Owner Full Name *</label>
                <input
                  className={inputClass}
                  placeholder="Your full name"
                  value={form.owner_name}
                  onChange={(e) => update('owner_name', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Email Address *</label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="owner@restaurant.com"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Phone Number *</label>
                <input
                  className={inputClass}
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={inputClass}
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Confirm Password *</label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="Repeat your password"
                  value={form.confirm_password}
                  onChange={(e) => update('confirm_password', e.target.value)}
                />
              </div>
              <button
                onClick={handleNext}
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition-colors"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Restaurant Details */}
          {step === 2 && (
            <div className="bg-[#101827] rounded-2xl border border-[#273449] p-7 space-y-4 shadow-xl">
              <h2 className="text-white font-semibold mb-4">Restaurant Details</h2>
              <div>
                <label className={labelClass}>Restaurant Category *</label>
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>State</label>
                  <input
                    className={inputClass}
                    placeholder="Tamil Nadu"
                    value={form.state}
                    onChange={(e) => update('state', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    className={inputClass}
                    placeholder="Chennai"
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Area / Locality</label>
                <input
                  className={inputClass}
                  placeholder="Anna Nagar"
                  value={form.area}
                  onChange={(e) => update('area', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Full Address</label>
                <input
                  className={inputClass}
                  placeholder="Door No, Street, Area..."
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Postal Code</label>
                  <input
                    className={inputClass}
                    placeholder="600001"
                    value={form.postal_code}
                    onChange={(e) => update('postal_code', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Number of Branches</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className={inputClass}
                    value={form.num_branches}
                    onChange={(e) =>
                      update('num_branches', parseInt(e.target.value) || 1)
                    }
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>GSTIN (Optional)</label>
                <input
                  className={inputClass}
                  placeholder="29ABCDE1234F1Z5"
                  value={form.gstin}
                  onChange={(e) => update('gstin', e.target.value)}
                />
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-[#151F31] hover:bg-[#1f2d47] text-white font-semibold rounded-xl flex items-center justify-center space-x-2 border border-[#273449] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-[#38BDF8]/40"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <form
              onSubmit={handleSubmit}
              className="bg-[#101827] rounded-2xl border border-[#273449] p-7 shadow-xl"
            >
              <h2 className="text-white font-semibold mb-5">Confirm & Register</h2>
              <div className="space-y-3 mb-6">
                {[
                  { label: 'Restaurant', value: form.restaurant_name },
                  { label: 'Owner', value: form.owner_name },
                  { label: 'Email', value: form.email },
                  { label: 'Phone', value: form.phone },
                  { label: 'Category', value: form.category },
                  { label: 'City', value: `${form.city}, ${form.state}` },
                  { label: 'Branches', value: form.num_branches.toString() },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex justify-between text-sm py-2 border-b border-[#273449]"
                  >
                    <span className="text-[#94A3B8]">{r.label}</span>
                    <span className="text-white font-medium">{r.value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#0A1222] border border-[#273449] rounded-xl p-4 mb-5 text-xs text-[#38BDF8] space-y-1">
                <p>✓ 14-day full free trial — no credit card required</p>
                <p>✓ Complete tenant data privacy with PostgreSQL RLS</p>
                <p>✓ Instant activation & cancel anytime</p>
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-950/60 border border-red-800 rounded-xl flex items-center space-x-2 text-red-300 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-[#151F31] hover:bg-[#1f2d47] text-white font-semibold rounded-xl flex items-center justify-center space-x-2 border border-[#273449] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-[#38BDF8]/40"
                >
                  {loading ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="bg-[#101827] rounded-2xl border border-[#273449] p-8 text-center shadow-2xl">
              <div className="w-16 h-16 bg-green-950/80 border border-green-800 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                You're all set! 🎉
              </h2>
              <p className="text-[#94A3B8] mb-6 text-sm">
                <strong className="text-white">{form.restaurant_name}</strong> has been
                registered successfully. Your 14-day free trial has started.
              </p>
              <div className="bg-[#0A1222] border border-[#273449] rounded-xl p-4 mb-6 text-left text-sm">
                <div className="text-[#94A3B8] mb-1">Login with:</div>
                <div className="text-white font-mono">{form.email}</div>
              </div>
              <Link
                to="/login"
                className="block w-full py-3.5 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-[#38BDF8]/40"
              >
                Go to Login →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
