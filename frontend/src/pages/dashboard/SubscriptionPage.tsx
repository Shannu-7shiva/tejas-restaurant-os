import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../services/api';
import {
  CreditCard, CheckCircle, Clock, AlertTriangle, Zap,
  ArrowUpRight, Star, Building2, Users, LayoutGrid, Package, Sparkles
} from 'lucide-react';

interface Subscription {
  status: string;
  plan_name: string;
  plan_tier: string;
  expires_at: string | null;
  days_remaining: number;
  trial_ends_at: string | null;
}

interface Plan {
  id: string;
  name: string;
  tier: string;
  price_monthly: number;
  price_annual: number;
  max_branches: number;
  max_staff: number;
  max_tables: number;
  max_menu_items: number;
  trial_days: number;
  features_json: string;
}

const TIER_ORDER = ['STARTER', 'PROFESSIONAL', 'PREMIUM', 'ENTERPRISE'];

const TIER_COLORS: Record<string, { badge: string; border: string; btn: string; ring: string }> = {
  STARTER: {
    badge: 'text-[#94A3B8] bg-[#0A1222] border-[#273449]',
    border: 'border-[#273449]',
    btn: 'bg-[#151F31] hover:bg-[#1f2d47] text-white border border-[#273449]',
    ring: '',
  },
  PROFESSIONAL: {
    badge: 'text-[#38BDF8] bg-[#0A1222] border-[#38BDF8]/40',
    border: 'border-[#38BDF8]',
    btn: 'bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]',
    ring: 'ring-1 ring-[#38BDF8]/50',
  },
  PREMIUM: {
    badge: 'text-[#F5B544] bg-[#0A1222] border-[#F5B544]/40',
    border: 'border-[#F5B544]',
    btn: 'bg-gradient-to-r from-[#F5B544] to-[#D97706] hover:from-[#F59E0B] hover:to-[#B45309] text-slate-950 font-black shadow-[0_0_20px_rgba(245,181,68,0.35)]',
    ring: 'ring-1 ring-[#F5B544]/50',
  },
  ENTERPRISE: {
    badge: 'text-[#FFFFFF] bg-[#151F31] border-[#273449]',
    border: 'border-[#7DD3FC]',
    btn: 'bg-gradient-to-r from-[#1D4ED8] to-[#0284C7] hover:from-[#2563EB] hover:to-[#38BDF8] text-white shadow-lg',
    ring: 'ring-1 ring-[#7DD3FC]/50',
  },
};

const featureLabel = (val: number, unit: string) =>
  val === -1 ? `Unlimited ${unit}` : `${val} ${unit}`;

const getFeatures = (plan: Plan): string[] => {
  const feats: string[] = [];
  feats.push(featureLabel(plan.max_branches, plan.max_branches === 1 ? 'Branch' : 'Branches'));
  feats.push(featureLabel(plan.max_tables, 'Tables'));
  feats.push(featureLabel(plan.max_staff, 'Staff Members'));
  feats.push(featureLabel(plan.max_menu_items, 'Menu Items'));
  if (plan.tier === 'PROFESSIONAL' || plan.tier === 'PREMIUM' || plan.tier === 'ENTERPRISE') {
    feats.push('Advanced Analytics');
    feats.push('Inventory Depletion');
  }
  if (plan.tier === 'PREMIUM' || plan.tier === 'ENTERPRISE') {
    feats.push('AI Assistant Module');
    feats.push('WhatsApp Confirmations');
    feats.push('Custom Domain Support');
  }
  if (plan.tier === 'ENTERPRISE') {
    feats.push('Dedicated Account Architect');
    feats.push('Full White-Labeling');
    feats.push('REST API Access');
    feats.push('24/7 Priority SLA');
  }
  feats.push(`${plan.trial_days}-Day Full Free Trial`);
  return feats;
};

export const SubscriptionPage: React.FC = () => {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [error, setError] = useState('');

  const getToken = () =>
    localStorage.getItem('tejas_token') || localStorage.getItem('aurelia_token') || '';

  useEffect(() => {
    const token = getToken();
    Promise.all([
      fetch(`${API_BASE}/subscription/my`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`${API_BASE}/subscription/plans`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ])
      .then(([s, p]) => {
        setSub(s);
        const rawPlans: Plan[] = Array.isArray(p) ? p : [];
        rawPlans.sort(
          (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)
        );
        setPlans(rawPlans);
      })
      .catch(() => setError('Failed to load subscription data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] text-sm">Loading subscription telemetry...</p>
        </div>
      </div>
    );
  }

  const daysRemaining = sub?.days_remaining ?? 0;
  const isExpiring = daysRemaining <= 7 && daysRemaining > 0;
  const isTrial = sub?.status === 'TRIAL';

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8 bg-[#050914] text-[#CBD5E1]">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#F5B544] uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tenant Billing & Licensing</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Commercial SaaS Subscription</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Manage your active tier, limits, and multi-branch licenses</p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-[#101827] border border-[#273449] rounded-2xl p-7 shadow-xl">
        <h2 className="text-white font-bold mb-4 flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-[#38BDF8]" />
          <span>Active Restaurant Plan</span>
        </h2>

        {sub && sub.status !== 'none' ? (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl sm:text-3xl font-black text-white">{sub.plan_name}</span>
                <span className={`px-3 py-1 text-xs rounded-full font-bold border ${
                  TIER_COLORS[sub.plan_tier]?.badge || 'text-[#94A3B8] bg-[#0A1222] border-[#273449]'
                }`}>
                  {sub.plan_tier}
                </span>
              </div>
              {isTrial && (
                <div className="flex items-center space-x-2.5 px-4 py-2 bg-[#0A1222] border border-[#273449] rounded-xl shadow-inner">
                  <Clock className="w-4 h-4 text-[#F5B544] flex-shrink-0" />
                  <div>
                    <div className="text-white text-sm font-bold">{daysRemaining} days remaining</div>
                    <div className="text-[#94A3B8] text-xs">Full-Access Free Trial</div>
                  </div>
                </div>
              )}
            </div>

            {isExpiring && (
              <div className="p-4 bg-amber-950/40 border border-[#F5B544]/50 rounded-xl flex items-start space-x-3">
                <AlertTriangle className="w-4 h-4 text-[#F5B544] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[#F5B544] text-sm font-bold">Trial Expiring Soon</div>
                  <div className="text-[#CBD5E1] text-xs mt-0.5">
                    Your trial expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. Upgrade now to keep operations running without interruption.
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { icon: Building2, label: 'Subscription Status', value: sub.status },
                { icon: Star, label: 'Licensed Tier', value: sub.plan_name },
                { icon: Clock, label: 'Renews / Expiry', value: sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Continuous' },
                { icon: Zap, label: 'Days Remaining', value: daysRemaining > 0 ? `${daysRemaining} days` : 'Active' },
              ].map((item) => (
                <div key={item.label} className="bg-[#0A1222] border border-[#273449] rounded-xl p-3.5">
                  <div className="text-[#94A3B8] text-xs mb-1 flex items-center space-x-1.5 font-medium">
                    <item.icon className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>{item.label}</span>
                  </div>
                  <div className="text-white text-sm font-bold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-[#94A3B8]/40 mx-auto mb-3" />
            <div className="text-[#CBD5E1] font-semibold">No active subscription found.</div>
            <div className="text-[#94A3B8] text-sm mt-1">Select a tier below to activate your restaurant.</div>
          </div>
        )}
      </div>

      {/* Available Plans */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-white font-bold text-xl">Available Commercial Plans</h2>
          <div className="flex items-center bg-[#0A1222] border border-[#273449] rounded-xl p-1 self-start">
            {(['monthly', 'annual'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setBilling(opt)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  billing === opt
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {opt === 'monthly' ? 'Monthly' : 'Annual Billing'}
                {opt === 'annual' && (
                  <span className="ml-1.5 text-xs text-[#F5B544] font-black">-17%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const styles = TIER_COLORS[plan.tier] || TIER_COLORS.STARTER;
            const price = billing === 'annual' ? plan.price_annual / 12 : plan.price_monthly;
            const isCurrent = sub?.plan_tier === plan.tier;
            const isPopular = plan.tier === 'PROFESSIONAL';
            const features = getFeatures(plan);

            return (
              <div
                key={plan.id}
                className={`relative bg-[#101827] border ${styles.border} ${styles.ring} rounded-2xl p-6 flex flex-col justify-between transition-all ${
                  isPopular ? 'bg-[#151F31] shadow-[0_0_30px_rgba(56,189,248,0.2)]' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-lg">
                    Recommended
                  </div>
                )}

                <div>
                  <div className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border mb-4 ${styles.badge}`}>
                    <span>{plan.tier}</span>
                  </div>

                  <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>

                  <div className="mb-1">
                    <span className="text-3xl font-black text-white">
                      ₹{Math.round(price).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[#94A3B8] text-xs">/mo</span>
                  </div>
                  {billing === 'annual' && (
                    <div className="text-[#38BDF8] text-xs font-semibold mb-2">
                      ₹{plan.price_annual.toLocaleString('en-IN')}/yr (Save ₹{((plan.price_monthly * 12) - plan.price_annual).toLocaleString('en-IN')})
                    </div>
                  )}
                  <div className="text-[#94A3B8] text-xs mb-5">{plan.trial_days}-day free trial included</div>

                  <div className="h-px bg-[#273449] mb-5" />

                  <ul className="space-y-2 mb-6">
                    {features.map((feat) => (
                      <li key={feat} className="flex items-start space-x-2 text-xs text-[#CBD5E1]">
                        <CheckCircle className="w-3.5 h-3.5 text-[#38BDF8] flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  disabled={isCurrent}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    isCurrent
                      ? 'bg-[#0A1222] text-[#94A3B8] cursor-not-allowed border border-[#273449]'
                      : styles.btn
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Current Active Plan</span>
                    </>
                  ) : (
                    <>
                      <span>{isTrial ? 'Upgrade Plan' : 'Select Plan'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment Gateway Notice */}
        <div className="mt-8 p-5 bg-[#0A1222] border border-[#273449] rounded-2xl text-center">
          <p className="text-[#94A3B8] text-xs leading-relaxed">
            💳 Automated UPI & credit card payment gateway integration is active in sandbox mode. For manual invoices, wire transfers, or custom Enterprise limits, contact{' '}
            <a href="mailto:support@tejastechnologies.in" className="text-[#38BDF8] hover:text-[#7DD3FC] underline font-semibold">
              support@tejastechnologies.in
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};
