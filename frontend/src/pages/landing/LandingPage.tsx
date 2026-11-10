import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UtensilsCrossed, QrCode, ChefHat, BarChart3, Users, Zap, ArrowRight,
  CheckCircle, Menu, X, Smartphone, Monitor, Tablet, ChevronDown, ChevronUp,
  CreditCard, Globe, Shield, Clock, Package, Bell, Sparkles, Cpu
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

const FEATURES = [
  { icon: QrCode, title: 'AI-Powered QR Ordering', desc: 'Instant contactless ordering right from table smartphones. Zero app download, zero friction.', color: 'text-[#38BDF8]', border: 'border-[#273449]', glow: 'hover:border-[#38BDF8]/60 hover:shadow-[0_0_30px_rgba(56,189,248,0.2)]' },
  { icon: ChefHat, title: 'Next-Gen Kitchen Display', desc: 'Real-time order routing, station segregation, and sub-second acoustic alert notifications.', color: 'text-[#F5B544]', border: 'border-[#273449]', glow: 'hover:border-[#F5B544]/60 hover:shadow-[0_0_30px_rgba(245,181,68,0.2)]' },
  { icon: BarChart3, title: 'Enterprise Intelligence', desc: 'Predictive revenue algorithms, peak-hour analytics, and live profit metrics powered by high-frequency telemetry.', color: 'text-[#7DD3FC]', border: 'border-[#273449]', glow: 'hover:border-[#7DD3FC]/60 hover:shadow-[0_0_30px_rgba(125,211,252,0.2)]' },
  { icon: Users, title: 'Role-Based Access Control', desc: 'Cryptographically scoped permissions for Super Admins, Owners, Chefs, Cashiers and Waiters.', color: 'text-[#38BDF8]', border: 'border-[#273449]', glow: 'hover:border-[#38BDF8]/60 hover:shadow-[0_0_30px_rgba(56,189,248,0.2)]' },
  { icon: CreditCard, title: 'Autonomous POS & Billing', desc: 'Instant split payments, digital GST invoices, UPI QR generation, and one-click financial reconciliation.', color: 'text-[#F5B544]', border: 'border-[#273449]', glow: 'hover:border-[#F5B544]/60 hover:shadow-[0_0_30px_rgba(245,181,68,0.2)]' },
  { icon: Globe, title: 'Multi-Branch Distributed Cloud', desc: 'Manage single food trucks to 100+ nationwide cloud kitchen locations under one corporate identity.', color: 'text-[#7DD3FC]', border: 'border-[#273449]', glow: 'hover:border-[#7DD3FC]/60 hover:shadow-[0_0_30px_rgba(125,211,252,0.2)]' },
  { icon: Shield, title: 'PostgreSQL Tenant Isolation', desc: 'Strict database Row-Level Security (RLS) guaranteeing absolute privacy between restaurants.', color: 'text-[#38BDF8]', border: 'border-[#273449]', glow: 'hover:border-[#38BDF8]/60 hover:shadow-[0_0_30px_rgba(56,189,248,0.2)]' },
  { icon: Bell, title: 'Sub-Second WebSockets', desc: 'Instant real-time bi-directional pipeline keeping kitchen, front desk, and customers in sync.', color: 'text-[#F5B544]', border: 'border-[#273449]', glow: 'hover:border-[#F5B544]/60 hover:shadow-[0_0_30px_rgba(245,181,68,0.2)]' },
  { icon: Package, title: 'Automated Inventory & Recipe', desc: 'Live depletion tracking down to individual ingredient grams with automated supplier reorder alerts.', color: 'text-[#7DD3FC]', border: 'border-[#273449]', glow: 'hover:border-[#7DD3FC]/60 hover:shadow-[0_0_30px_rgba(125,211,252,0.2)]' },
];

const STEPS = [
  { step: '01', title: 'Register Your Restaurant', desc: 'Setup in 2 minutes. Get an enterprise-isolated tenant UUID, automated menu templates, and live credentials.', icon: Cpu },
  { step: '02', title: 'Deploy Table Smart QRs', desc: 'Print cryptographically signed QR codes for tables. Guests scan and order instantly with zero application download.', icon: QrCode },
  { step: '03', title: 'Automate & Scale Profits', desc: 'Kitchen automates ticket workflows, managers track live revenue, and guests enjoy effortless dining.', icon: Sparkles },
];

const FAQS = [
  { q: 'How does Tejas Restaurant OS guarantee cross-restaurant privacy?', a: 'Every restaurant is assigned an authoritative cryptographic UUID. PostgreSQL Row Level Security (RLS) and strict server-side validation guarantee restaurant A can never see, modify or query restaurant B data.' },
  { q: 'Do customers need to download an application from the Play Store or App Store?', a: 'No. Tejas OS uses high-performance mobile web architecture. Guests simply point their camera at the table QR code and the menu loads in less than 300ms directly in their browser.' },
  { q: 'Does Tejas Restaurant OS support multiple branches and franchises?', a: 'Yes. The architecture natively handles multi-branch networks, cloud kitchens, and franchise groups with central menu replication and decentralized branch billing.' },
  { q: 'How long does restaurant onboarding and menu setup take?', a: 'Most restaurants go live within 15 to 30 minutes. You can import existing items, define food variants/addons, and generate table QR tokens immediately.' },
  { q: 'What payment modes are supported for guests?', a: 'Customers can pay via UPI (Google Pay, PhonePe, Paytm), counter cash, or credit/debit card, with instant digital invoice delivery.' },
  { q: 'Is there a free trial period?', a: 'Yes. Every new restaurant registration includes a full-featured 14-day free trial on the platform. No credit card required to begin.' },
];

const STATS = [
  { label: 'Orders Processed Daily', value: '10,000+', highlight: 'text-[#38BDF8]' },
  { label: 'Restaurant Partners', value: '500+', highlight: 'text-[#F5B544]' },
  { label: 'Cities Active', value: '50+', highlight: 'text-[#7DD3FC]' },
  { label: 'Enterprise Uptime', value: '99.99%', highlight: 'text-[#FFFFFF]' },
];

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050914] text-[#CBD5E1] selection:bg-[#2563EB] selection:text-white">
      {/* Top Ambient Glow Lines */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-[#2563EB]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-20 right-1/4 w-96 h-96 bg-[#F5B544]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Enterprise Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled ? 'bg-[#050914]/90 backdrop-blur-md shadow-2xl shadow-black/60 border-b border-[#273449]' : 'bg-transparent border-b border-[#273449]/40'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo merged seamlessly */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative flex items-center">
                <img 
                  src="/tejas-logo.jpg" 
                  alt="TEJAS Technologies" 
                  className="h-10 sm:h-11 w-auto object-contain tejas-logo-merged transition-transform duration-300 group-hover:scale-105" 
                />
              </div>
            </Link>

            {/* Nav items */}
            <div className="hidden md:flex items-center space-x-8">
              {NAV_LINKS.map(l => (
                <Link 
                  key={l.label} 
                  to={l.href} 
                  className="text-sm font-medium text-[#94A3B8] hover:text-[#FFFFFF] transition-colors relative hover:after:w-full after:w-0 after:h-0.5 after:bg-[#38BDF8] after:absolute after:-bottom-1 after:left-0 after:transition-all"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/* CTAs */}
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-sm font-medium text-[#CBD5E1] hover:text-[#FFFFFF] transition-colors px-3 py-2 hover:bg-[#101827] rounded-xl border border-transparent hover:border-[#273449]"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] text-white text-sm font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-[#38BDF8]/40 hover:scale-[1.02]"
              >
                Register Restaurant
              </Link>
            </div>

            {/* Mobile toggle */}
            <button 
              className="md:hidden text-[#94A3B8] hover:text-white p-2 rounded-lg bg-[#101827] border border-[#273449]" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0A1222] border-t border-[#273449] px-5 py-5 space-y-4 shadow-2xl">
            {NAV_LINKS.map(l => (
              <Link 
                key={l.label} 
                to={l.href} 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[#CBD5E1] hover:text-[#38BDF8] py-2 text-sm font-medium"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-[#273449] space-y-2">
              <Link 
                to="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 text-[#CBD5E1] hover:text-white text-sm bg-[#101827] rounded-xl border border-[#273449]"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 bg-[#2563EB] text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-900/40"
              >
                Register Restaurant
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-36 sm:pt-44 pb-24 px-4 max-w-7xl mx-auto text-center relative">
        {/* Luminous Logo Integration Showcase */}
        <div className="relative inline-flex items-center justify-center mb-10 group">
          {/* Ambient Lighting matching original logo flares: Gold on left, Cyan on right */}
          <div className="absolute -inset-8 bg-gradient-to-r from-[#F5B544]/20 via-[#2563EB]/15 to-[#38BDF8]/25 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative px-6 py-3 rounded-2xl bg-[#0A1222]/70 backdrop-blur-md border border-[#273449] shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
            <img
              src="/tejas-logo.jpg"
              alt="TEJAS Technologies - Smart Software, Automate, Grow"
              className="h-20 sm:h-28 md:h-32 w-auto object-contain tejas-logo-merged"
            />
          </div>
        </div>

        {/* Status Pill with Gold Sunrise Accent */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-[#101827] border border-[#273449] text-[#CBD5E1] text-xs font-semibold px-4 py-2 rounded-full shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#F5B544] animate-pulse" />
            <span className="text-[#F5B544] uppercase tracking-wider text-[11px] font-bold">Commercial SaaS 2.0</span>
            <span className="text-[#94A3B8]">|</span>
            <span className="text-[#38BDF8]">14-Day Full Access Trial</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#FFFFFF] leading-[1.1] mb-6 max-w-5xl mx-auto font-sans">
          Smart Restaurant Management.<br />
          <span className="bg-gradient-to-r from-[#38BDF8] via-[#7DD3FC] to-[#F5B544] bg-clip-text text-transparent">
            Simplified.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-[#94A3B8] max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          One unified cloud platform serving single eateries, food courts, cloud kitchens, and multi-branch chains. 
          QR table ordering, real-time kitchen displays, autonomous billing, and strict database isolation.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link 
            to="/register" 
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-8 py-4 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] text-white font-bold rounded-xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-[#38BDF8]/40 hover:scale-[1.02]"
          >
            <span>Register Your Restaurant</span>
            <ArrowRight className="w-5 h-5 text-[#7DD3FC]" />
          </Link>
          <Link 
            to="/pricing" 
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 bg-[#101827] hover:bg-[#151F31] text-[#CBD5E1] hover:text-white font-semibold rounded-xl transition-all border border-[#273449] hover:border-[#38BDF8]/50"
          >
            <span>Explore Premium Plans</span>
          </Link>
        </div>

        {/* Supported Platforms */}
        <div className="flex items-center justify-center space-x-8 text-[#94A3B8] text-xs uppercase tracking-wider font-semibold">
          {[
            { icon: Monitor, label: 'Desktop POS' },
            { icon: Tablet, label: 'Kitchen Tablet' },
            { icon: Smartphone, label: 'Customer Mobile' }
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center space-x-2 text-[#CBD5E1] bg-[#0A1222] px-3.5 py-1.5 rounded-lg border border-[#273449]/70">
              <Icon className="w-4 h-4 text-[#38BDF8]" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Telemetry Stats Bar */}
      <section className="py-12 border-y border-[#273449] bg-[#0A1222]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label} className="space-y-1">
              <div className={`text-3xl sm:text-4xl font-black ${s.highlight} tracking-tight`}>{s.value}</div>
              <div className="text-xs sm:text-sm text-[#94A3B8] font-medium uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 max-w-7xl mx-auto" id="features">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-[#38BDF8] mb-3">
            <Sparkles className="w-4 h-4" />
            <span>High-End Engineering</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#FFFFFF] mb-4">Complete Operating Engine</h2>
          <p className="text-[#94A3B8] text-base sm:text-lg max-w-2xl mx-auto">
            Engineered with modern full-stack reliability, sub-second latency, and strict multi-tenant isolation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div 
              key={f.title} 
              className={`bg-[#101827] border ${f.border} rounded-2xl p-7 transition-all duration-300 group hover:-translate-y-1 ${f.glow}`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#151F31] border border-[#273449] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <f.icon className={`w-6 h-6 ${f.color}`} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2 group-hover:text-[#38BDF8] transition-colors">{f.title}</h3>
              <p className="text-[#94A3B8] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-[#0A1222] border-y border-[#273449]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-[#FFFFFF] mb-4">Launch in Under 15 Minutes</h2>
            <p className="text-[#94A3B8] text-base sm:text-lg">No hardware leases. No cumbersome setup fees. Start instantly.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(s => (
              <div key={s.step} className="bg-[#101827] border border-[#273449] rounded-2xl p-8 text-center relative group hover:border-[#38BDF8]/60 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-[#151F31] border border-[#273449] flex items-center justify-center mx-auto mb-6 text-[#38BDF8] group-hover:text-[#F5B544] transition-colors">
                  <s.icon className="w-7 h-7" />
                </div>
                <div className="text-4xl font-black text-[#273449] mb-2">{s.step}</div>
                <h3 className="text-white font-bold text-xl mb-3">{s.title}</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Showcase with Golden Sunrise Tier */}
      <section className="py-24 px-4 max-w-7xl mx-auto text-center" id="pricing">
        <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-[#F5B544] mb-3">
          <CreditCard className="w-4 h-4" />
          <span>Transparent Pricing</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Enterprise Tiers for Every Stage</h2>
        <p className="text-[#94A3B8] text-base sm:text-lg mb-14 max-w-2xl mx-auto">
          All tiers include a 14-day full free trial, QR generator, KDS, and data privacy isolation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { 
              name: 'Starter', 
              price: '₹999', 
              period: '/mo', 
              desc: 'Single restaurant or cafe ready to automate table ordering.', 
              features: ['1 Branch Location', 'Up to 20 Tables', '5 Staff Accounts', 'QR Code Ordering', 'Kitchen Display System', 'Daily Analytics'], 
              highlight: false,
              btnText: 'Start Free Trial'
            },
            { 
              name: 'Professional', 
              price: '₹2,499', 
              period: '/mo', 
              desc: 'Growing busy dining establishments and small local chains.', 
              features: ['3 Branches', 'Up to 60 Tables', '20 Staff Accounts', 'Advanced Financial Intelligence', 'Inventory & Ingredient Depletion', 'Customer Loyalty & CRM'], 
              highlight: true,
              btnText: 'Start Free Trial'
            },
            { 
              name: 'Premium', 
              price: '₹4,999', 
              period: '/mo', 
              desc: 'Multi-outlet culinary groups demanding priority cloud performance.', 
              features: ['10 Branch Outlets', 'Up to 200 Tables', '100 Staff Accounts', 'AI Restaurant Assistant', 'WhatsApp Dispatch Alerts', 'Custom Domain Branding'], 
              highlight: false,
              btnText: 'Start Free Trial'
            },
          ].map(p => (
            <div 
              key={p.name} 
              className={`rounded-2xl p-8 border text-left transition-all relative flex flex-col justify-between ${
                p.highlight 
                  ? 'bg-[#151F31] border-[#38BDF8] shadow-[0_0_40px_rgba(56,189,248,0.25)] scale-105' 
                  : 'bg-[#101827] border-[#273449] hover:border-[#CBD5E1]/30'
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white text-xs font-black uppercase tracking-wider rounded-full shadow-lg">
                  Most Popular
                </div>
              )}
              <div>
                <h3 className="text-white font-bold text-2xl mb-1">{p.name}</h3>
                <div className="flex items-baseline space-x-1 mb-4">
                  <span className="text-4xl sm:text-5xl font-black text-white">{p.price}</span>
                  <span className="text-[#94A3B8] text-sm">{p.period}</span>
                </div>
                <p className="text-[#94A3B8] text-sm mb-6 leading-relaxed">{p.desc}</p>
                <div className="h-px bg-[#273449] mb-6" />
                <ul className="space-y-3 mb-8">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center space-x-3 text-sm text-[#CBD5E1]">
                      <CheckCircle className="w-4 h-4 text-[#38BDF8] flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link 
                to="/register" 
                className={`block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all ${
                  p.highlight 
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8] hover:from-[#38BDF8] hover:to-[#2563EB] text-white shadow-lg shadow-blue-900/50' 
                    : 'bg-[#151F31] hover:bg-[#2563EB] text-white border border-[#273449] hover:border-transparent'
                }`}
              >
                {p.btnText}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Link to="/pricing" className="inline-flex items-center space-x-2 text-[#38BDF8] hover:text-[#7DD3FC] text-sm font-semibold transition-colors">
            <span>Compare full plan limits & enterprise SLA</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-24 px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-3.5">
          {FAQS.map((faq, i) => (
            <div 
              key={i} 
              className="bg-[#101827] border border-[#273449] rounded-2xl overflow-hidden hover:border-[#38BDF8]/40 transition-colors"
            >
              <button 
                className="w-full flex items-center justify-between p-5 text-left" 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-white font-semibold text-base pr-4">{faq.q}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-5 h-5 text-[#38BDF8] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#94A3B8] flex-shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-[#94A3B8] text-sm leading-relaxed border-t border-[#273449] pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Enterprise CTA Banner */}
      <section className="py-20 px-4" id="contact">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#101827] via-[#0A1222] to-[#151F31] border border-[#273449] rounded-3xl p-10 sm:p-16 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F5B544]/10 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-5">
            Automate Your Restaurant with Tejas OS
          </h2>
          <p className="text-[#94A3B8] mb-10 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Join independent restaurateurs and commercial food chains operating with modern cloud intelligence. 14 days free, instant activation.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center space-x-2.5 px-10 py-4 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] text-white font-bold rounded-xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-[#38BDF8]/40 hover:scale-105"
          >
            <span>Register Your Restaurant Free</span>
            <ArrowRight className="w-5 h-5 text-[#7DD3FC]" />
          </Link>
          <p className="text-[#94A3B8] text-xs mt-5">No credit card required · Instant setup in 15 minutes · Cancel anytime</p>
        </div>
      </section>

      {/* Footer with Merged Logo */}
      <footer className="border-t border-[#273449] py-14 px-4 bg-[#0A1222]" id="about">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1 space-y-4">
              <Link to="/" className="inline-block">
                <img 
                  src="/tejas-logo.jpg" 
                  alt="TEJAS Technologies" 
                  className="h-10 w-auto object-contain tejas-logo-merged" 
                />
              </Link>
              <p className="text-[#94A3B8] text-sm">
                Smart Restaurant Management. Simplified.
              </p>
              <div className="text-xs text-[#CBD5E1] pt-1">
                A commercial SaaS platform by <span className="font-bold text-[#FFFFFF]">TEJAS TECHNOLOGIES</span>.
              </div>
            </div>

            {[
              { 
                title: 'Architecture', 
                links: [
                  { label: 'Platform Features', href: '/features' },
                  { label: 'Pricing Plans', href: '/pricing' },
                  { label: 'Register Restaurant', href: '/register' },
                  { label: 'Staff Login', href: '/login' }
                ] 
              },
              { 
                title: 'Company', 
                links: [
                  { label: 'About Tejas Technologies', href: '#about' },
                  { label: 'Technical Contact', href: '#contact' },
                  { label: 'System Health', href: '/api/health' }
                ] 
              },
              { 
                title: 'Compliance & Security', 
                links: [
                  { label: 'Data Isolation Architecture', href: '#' },
                  { label: 'Terms of Service', href: '#' },
                  { label: 'Privacy Policy', href: '#' }
                ] 
              },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-[#FFFFFF] font-bold mb-4 text-xs uppercase tracking-widest">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l.label}>
                      <Link to={l.href} className="text-[#94A3B8] hover:text-[#38BDF8] text-sm transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-[#273449] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
            <p>© 2026 TEJAS TECHNOLOGIES. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5 text-[#CBD5E1]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Production Engine Live</span>
              </span>
              <span>·</span>
              <span className="text-[#38BDF8] font-mono">TEJAS OS v2.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
