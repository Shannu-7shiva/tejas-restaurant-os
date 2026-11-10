import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2, Users, CreditCard, LogOut,
  Settings, BarChart3, Shield, ChevronLeft, Menu, X,
  Activity, Bell, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: BarChart3, href: '/super-admin' },
  { label: 'Restaurants', icon: Building2, href: '/super-admin/restaurants' },
  { label: 'Platform Users', icon: Users, href: '/super-admin' },
  { label: 'Subscription Plans', icon: CreditCard, href: '/super-admin' },
  { label: 'Cloud Health', icon: Activity, href: '/api/health' },
];

export const SuperAdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href: string) => location.pathname === href;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0A1222] text-[#CBD5E1]">
      {/* Logo */}
      <div className="p-5 border-b border-[#273449]">
        <Link to="/" className="flex items-center space-x-3 group">
          <img 
            src="/tejas-logo.jpg" 
            alt="TEJAS Technologies" 
            className="h-9 w-auto object-contain tejas-logo-merged transition-transform group-hover:scale-105" 
          />
        </Link>
        <div className="mt-3 px-3 py-1.5 rounded-xl bg-[#101827] border border-[#273449] flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-[#F5B544]" />
            <span className="text-[#F5B544] text-[11px] font-bold uppercase tracking-wider">Super Admin</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-[#38BDF8]/40'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#151F31]'
              }`}
            >
              <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-[#38BDF8]'}`} />
              <span>{item.label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
            </Link>
          );
        })}
      </nav>

      {/* Back to main app */}
      <div className="px-3 pb-2">
        <Link
          to="/dashboard"
          className="flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#151F31] text-xs transition-colors border border-transparent hover:border-[#273449]"
        >
          <ChevronLeft className="w-4 h-4 text-[#38BDF8]" />
          <span>Back to Restaurant OS</span>
        </Link>
      </div>

      {/* User + Logout */}
      <div className="p-3 border-t border-[#273449] space-y-2 bg-[#050914]/50">
        <div className="px-3 py-2 bg-[#101827] rounded-xl border border-[#273449]">
          <div className="text-white text-xs font-bold truncate">{user?.full_name || 'Super Admin'}</div>
          <div className="text-[#38BDF8] text-[10px] font-mono truncate">{user?.email}</div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-[#94A3B8] hover:text-red-400 hover:bg-red-950/20 transition-colors text-xs font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050914] text-[#CBD5E1] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0A1222] border-r border-[#273449] flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-[#0A1222] border-r border-[#273449] flex flex-col z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#050914]">
        {/* Top Bar */}
        <header className="h-16 bg-[#0A1222]/90 backdrop-blur-md border-b border-[#273449] flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-[#94A3B8] hover:text-white hover:bg-[#151F31] rounded-lg transition-colors border border-[#273449]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider hidden sm:block">
              TEJAS TECHNOLOGIES &mdash; Platform Governance Engine
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2563EB] to-[#38BDF8] rounded-xl flex items-center justify-center text-white text-xs font-black shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              {(user?.full_name || 'SA').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#050914]">
          {children}
        </main>
      </div>
    </div>
  );
};
