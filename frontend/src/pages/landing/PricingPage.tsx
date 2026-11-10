import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Zap, Building2, Shield, CreditCard, Sparkles } from 'lucide-react';

const STATIC_PLANS = [
  {
    name: 'Starter', tier: 'STARTER', price_monthly: 999, price_annual: 9990,
    max_branches: 1, max_staff: 5, max_tables: 20, max_menu_items: 50, trial_days: 14,
    highlight: false,
    badgeColor: 'text-[#94A3B8] bg-[#151F31] border-[#273449]',
    features: ['1 Single Location', 'Up to 20 Tables', '5 Staff Accounts', 'QR Table Ordering', 'Kitchen Display System (KDS)', 'Daily Sales Analytics', 'Standard Support'],
  },
  {
    name: 'Professional', tier: 'PROFESSIONAL', price_monthly: 2499, price_annual: 24990,
    max_branches: 3, max_staff: 20, max_tables: 60, max_menu_items: 200, trial_days: 14,
    highlight: true,
    badgeColor: 'text-[#38BDF8] bg-[#0A1222] border-[#38BDF8]/40',
    features: ['3 Branch Outlets', 'Up to 60 Tables', '20 Staff Accounts', 'Advanced Financial Intelligence', 'Inventory & Ingredient Depletion', 'Customer Loyalty & CRM', 'Priority Support'],
  },
  {
    name: 'Premium', tier: 'PREMIUM', price_monthly: 4999, price_annual: 49990,
    max_branches: 10, max_staff: 100, max_tables: 200, max_menu_items: 500, trial_days: 14,
    highlight: false,
    badgeColor: 'text-[#F5B544] bg-[#0A1222] border-[#F5B544]/40',
    features: ['10 Branch Outlets', 'Up to 200 Tables', '100 Staff Accounts', 'AI Restaurant Assistant', 'WhatsApp Dispatch Alerts', 'Custom Domain Branding', 'Dedicated Phone Support'],
  },
  {
    name: 'Enterprise', tier: 'ENTERPRISE', price_monthly: 9999, price_annual: 99990,
    max_branches: -1, max_staff: -1, max_tables: -1, max_menu_items: -1, trial_days: 30,
    highlight: false,
    badgeColor: 'text-[#FFFFFF] bg-[#151F31] border-[#273449]',
    features: ['Unlimited Branches', 'Unlimited Tables', 'Unlimited Staff', 'Everything in Premium', '99.99% Enterprise SLA', 'Dedicated Account Architect', 'Custom Integrations & API Access'],
  },
];

export const PricingPage: React.FC = () => {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#050914] text-[#CBD5E1]">
      {/* Enterprise Header */}
      <nav className="border-b border-[#273449] bg-[#050914]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/tejas-logo.jpg" 
              alt="TEJAS Technologies" 
              className="h-10 w-auto object-contain tejas-logo-merged" 
            />
          </Link>
          <div className="flex items-center space-x-6">
            <Link to="/features" className="text-[#94A3B8] hover:text-[#FFFFFF] text-sm font-medium transition-colors">Features</Link>
            <Link to="/login" className="text-[#94A3B8] hover:text-[#FFFFFF] text-sm font-medium transition-colors">Sign In</Link>
            <Link 
              to="/register" 
              className="px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] text-white text-sm font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-[#38BDF8]/40"
            >
              Start 14-Day Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-12 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-[#101827] border border-[#273449] text-xs font-semibold px-4 py-1.5 rounded-full text-[#38BDF8] mb-6">
          <Sparkles className="w-4 h-4 text-[#F5B544]" />
          <span>Predictable Enterprise Subscription</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-[#FFFFFF] mb-5 tracking-tight">
          Commercial SaaS Pricing
        </h1>
        <p className="text-[#94A3B8] text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          Scale effortlessly from a single outlet to multi-city restaurant networks. All plans include 14 days free trial.
        </p>

        {/* Billing Selector */}
        <div className="inline-flex items-center bg-[#0A1222] border border-[#273449] rounded-2xl p-1.5 shadow-inner">
          <button 
            onClick={() => setAnnual(false)} 
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${!annual ? 'bg-[#2563EB] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'}`}
          >
            Monthly Billing
          </button>
          <button 
            onClick={() => setAnnual(true)} 
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${annual ? 'bg-[#2563EB] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'}`}
          >
            <span>Annual Billing</span>
            <span className="text-xs bg-[#F5B544] text-[#050914] px-2 py-0.5 rounded-md font-black">SAVE 17%</span>
          </button>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="pb-28 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATIC_PLANS.map(p => {
            const price = annual ? Math.round(p.price_annual / 12) : p.price_monthly;
            return (
              <div 
                key={p.name} 
                className={`bg-[#101827] border rounded-2xl p-7 flex flex-col justify-between transition-all relative ${
                  p.highlight 
                    ? 'border-[#38BDF8] bg-[#151F31] shadow-[0_0_35px_rgba(56,189,248,0.25)] scale-105 z-10' 
                    : 'border-[#273449] hover:border-[#38BDF8]/40'
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white text-xs font-black uppercase tracking-wider rounded-full shadow-lg">
                    Recommended
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-xl">{p.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${p.badgeColor}`}>
                      {p.tier}
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-1 mb-2">
                    <span className="text-4xl font-black text-white">₹{price.toLocaleString('en-IN')}</span>
                    <span className="text-[#94A3B8] text-sm">/mo</span>
                  </div>

                  {annual ? (
                    <p className="text-[#38BDF8] text-xs font-semibold mb-4">
                      ₹{p.price_annual.toLocaleString('en-IN')}/yr (Save ₹{((p.price_monthly * 12) - p.price_annual).toLocaleString('en-IN')})
                    </p>
                  ) : (
                    <p className="text-[#94A3B8] text-xs mb-4">Billed monthly · Cancel anytime</p>
                  )}

                  <div className="text-xs text-[#F5B544] font-semibold mb-6 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F5B544]" />
                    <span>{p.trial_days}-Day Full Free Trial</span>
                  </div>

                  <div className="h-px bg-[#273449] mb-6" />

                  <ul className="space-y-3 mb-8">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start space-x-2.5 text-xs text-[#CBD5E1]">
                        <CheckCircle className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link 
                  to="/register" 
                  className={`block w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${
                    p.highlight 
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8] hover:from-[#38BDF8] hover:to-[#2563EB] text-white shadow-lg shadow-blue-900/40' 
                      : 'bg-[#151F31] hover:bg-[#2563EB] text-white border border-[#273449] hover:border-transparent'
                  }`}
                >
                  Start 14-Day Trial
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
