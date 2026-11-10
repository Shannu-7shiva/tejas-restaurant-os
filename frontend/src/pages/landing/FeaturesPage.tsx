import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, QrCode, ChefHat, BarChart3, Users, CreditCard, Globe, Shield, Bell, Package, Sparkles } from 'lucide-react';

const ALL_FEATURES = [
  { category: 'Customer QR Ordering', icon: QrCode, color: 'text-[#38BDF8]', items: ['Frictionless QR ordering (zero mobile app download)', 'Interactive menu with high-res food images and prices', 'Smart dietary filters (Pure Veg, Non-Veg, Halal, Jain)', 'Item customization with variants and nested add-ons', 'Cart notes for special chef allergen instructions', 'Live sub-second order status progress tracker', 'Guest checkout with zero mandatory registrations'] },
  { category: 'Kitchen Display (KDS)', icon: ChefHat, color: 'text-[#F5B544]', items: ['High-throughput tablet and touchscreen workstation support', 'Multi-station routing (Tandoor, Grill, Bar, Dessert)', 'Acoustic chime notifications for incoming orders', 'Precise elapsed ticket timers with color escalation', 'Atomic status state machine (New → Accepted → Preparing → Ready)', 'Real-time WebSocket connection heartbeat monitor', 'Multi-language preparation notes for kitchen staff'] },
  { category: 'Executive Intelligence', icon: BarChart3, color: 'text-[#7DD3FC]', items: ['Real-time GMV, average order value (AOV), and net margins', 'Hourly traffic heatmaps and top-selling product velocity', 'Cross-branch consolidated executive dashboard', 'Instant menu item activation / stockout toggling', 'Table layout manager with custom floor plan pins', 'Multi-tier staff permissions and shift logs', 'Automated GST tax and service charge compliance'] },
  { category: 'Enterprise Access Control', icon: Users, color: 'text-[#38BDF8]', items: ['Cryptographically verified multi-role RBAC hierarchy', 'Platform Super Admin, Restaurant Owner, Branch Manager', 'Restricted kitchen chef, cashier, and waiter portals', 'Station-scoped order viewing and status permissions', 'Immutable system audit logging for sensitive actions', 'Instant staff offboarding and session revocation'] },
  { category: 'Billing & Autonomous POS', icon: CreditCard, color: 'text-[#F5B544]', items: ['Instant split bills, itemized discounts, and coupons', 'Dynamic UPI QR codes directly on bills for instant scan', 'Thermal printer ESC/POS support and digital PDF invoices', 'Consolidated end-of-day Z-report reconciliations', 'Cash drawer reconciliation with audit notes', 'Refund authorization workflows with manager approval'] },
  { category: 'Multi-Branch Distributed Cloud', icon: Globe, color: 'text-[#7DD3FC]', items: ['Manage single boutique bistros to 100+ cloud kitchens', 'Centralized master menu with branch-level price overrides', 'Decentralized branch inventory and local supplier ledgers', 'Cross-outlet staff transfers and localized permissions', 'Consolidated corporate profit/loss statement analytics'] },
  { category: 'PostgreSQL Tenant Privacy', icon: Shield, color: 'text-[#38BDF8]', items: ['100% tenant data isolation at database layer', 'Row Level Security (RLS) policies on all tenant tables', 'Authoritative server-side price recalculation (anti-tamper)', 'Encrypted JWT tokens with short TTL and rotation', 'Zero cross-tenant data leakage guaranteed'] },
  { category: 'Real-Time Telemetry', icon: Bell, color: 'text-[#F5B544]', items: ['Sub-second duplex WebSockets for live status updates', 'Audio-visual alert queue for pending kitchen tickets', 'Automated SMS / WhatsApp order confirmations', 'Subscription renewal and usage threshold alerts', 'Waiter call chime directly from customer table smartphone'] },
  { category: 'Precision Inventory Tracking', icon: Package, color: 'text-[#7DD3FC]', items: ['Raw material inventory tracking down to grams/milliliters', 'Recipe-to-ingredient automated stock depletion', 'Low stock threshold triggers with reorder warnings', 'Supplier contact directory with purchase order generation', 'Kitchen wastage logging and variance analysis reports'] },
];

export const FeaturesPage: React.FC = () => {
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
            <Link to="/pricing" className="text-[#94A3B8] hover:text-[#FFFFFF] text-sm font-medium transition-colors">Pricing</Link>
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
          <span>Full Specification Architecture</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-[#FFFFFF] mb-5 tracking-tight">
          Enterprise Features
        </h1>
        <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto leading-relaxed">
          Engineered for mission-critical restaurant workloads. High availability, sub-second latency, and complete tenant isolation.
        </p>
      </section>

      {/* Feature Grid */}
      <section className="pb-28 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ALL_FEATURES.map(cat => (
            <div 
              key={cat.category} 
              className="bg-[#101827] border border-[#273449] rounded-2xl p-7 hover:border-[#38BDF8]/50 transition-all hover:-translate-y-1"
            >
              <div className="flex items-center space-x-3.5 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#151F31] border border-[#273449] flex items-center justify-center">
                  <cat.icon className={`w-5 h-5 ${cat.color}`} />
                </div>
                <h3 className="text-white font-bold text-lg">{cat.category}</h3>
              </div>
              <ul className="space-y-3">
                {cat.items.map(item => (
                  <li key={item} className="flex items-start space-x-2.5 text-xs sm:text-sm text-[#94A3B8]">
                    <CheckCircle className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
