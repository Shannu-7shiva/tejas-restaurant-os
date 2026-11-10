import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UtensilsCrossed, Table2, ShoppingBag,
  ChefHat, Users, Settings, LogOut, Menu as MenuIcon, X,
  ExternalLink, Bell, ConciergeBell, CreditCard,
  BarChart3, Shield, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Orders', path: '/dashboard/orders', icon: ShoppingBag, badge: undefined as string | undefined },
  { label: 'Menu Catalog', path: '/dashboard/menu', icon: UtensilsCrossed },
  { label: 'Tables & QR', path: '/dashboard/tables', icon: Table2 },
  { label: 'Staff Team', path: '/dashboard/staff', icon: Users },
  { label: 'Kitchen KDS', path: '/kitchen', icon: ChefHat, badge: 'Live' },
  { label: 'Service Staff', path: '/service', icon: ConciergeBell },
  { label: 'Subscription', path: '/dashboard/subscription', icon: CreditCard },
  { label: 'Settings', path: '/dashboard/settings', icon: Settings },
];

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  const currentLabel = NAV_ITEMS.find((i) => i.path === location.pathname)?.label || 'Dashboard';

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0A1222] text-[#CBD5E1]">
      {/* Logo / Brand */}
      <div className="p-5 border-b border-[#273449]">
        <Link to="/" className="flex items-center space-x-3 group">
          <img 
            src="/tejas-logo.jpg" 
            alt="TEJAS Technologies" 
            className="h-9 w-auto object-contain tejas-logo-merged transition-transform group-hover:scale-105" 
          />
        </Link>

        {/* Active restaurant badge */}
        {user?.restaurant && (
          <div className="mt-3.5 px-3 py-2 rounded-xl bg-[#101827] border border-[#273449] flex items-center justify-between shadow-inner">
            <span className="text-xs font-semibold text-white truncate pr-2">{user.restaurant.name}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-[#38BDF8]/40'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#151F31]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-[#38BDF8]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-1.5 py-0.5 text-[10px] uppercase font-bold rounded tracking-wider ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Super Admin link (only for PLATFORM_ADMIN) */}
        {user?.role === 'PLATFORM_ADMIN' && (
          <Link
            to="/super-admin"
            className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#F5B544] hover:text-amber-300 hover:bg-[#151F31] transition-colors mt-3 border border-[#F5B544]/30"
          >
            <Shield className="w-4 h-4 flex-shrink-0 text-[#F5B544]" />
            <span>Super Admin</span>
          </Link>
        )}
      </nav>

      {/* Customer view shortcut */}
      {user?.restaurant && (
        <div className="px-3 pb-2">
          <a
            href={`/menu/${user.restaurant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 w-full py-2 text-xs text-[#94A3B8] hover:text-[#38BDF8] hover:bg-[#151F31] rounded-xl border border-transparent hover:border-[#273449] transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Open Customer QR View</span>
          </a>
        </div>
      )}

      {/* User + Logout */}
      <div className="p-3 border-t border-[#273449] space-y-2 bg-[#050914]/50">
        <div className="px-3 py-2 bg-[#101827] rounded-xl border border-[#273449]">
          <div className="text-white text-xs font-bold truncate">{user?.full_name}</div>
          <div className="text-[#38BDF8] text-[10px] font-mono uppercase tracking-wider truncate">{user?.role?.replace(/_/g, ' ')}</div>
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
      <aside className="hidden md:flex w-64 bg-[#0A1222] border-r border-[#273449] flex-col flex-shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-[#0A1222] border-r border-[#273449] flex flex-col z-10 h-full overflow-y-auto">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#050914]">
        {/* Top Header */}
        <header className="h-16 bg-[#0A1222]/90 backdrop-blur-md border-b border-[#273449] flex items-center justify-between px-6 sticky top-0 z-20 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-[#94A3B8] hover:text-white hover:bg-[#151F31] rounded-lg transition-colors border border-[#273449]"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-white font-bold text-base">{currentLabel}</h2>
              {user?.restaurant && (
                <div className="text-[#94A3B8] text-xs">{user.restaurant.name}</div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-[#CBD5E1] bg-[#101827] px-3 py-1.5 rounded-full border border-[#273449]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">Live Telemetry</span>
            </div>

            {/* Launch Kitchen */}
            <button
              onClick={() => navigate('/kitchen')}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-[#151F31] hover:bg-[#2563EB] border border-[#273449] hover:border-transparent text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
            >
              <ChefHat className="w-3.5 h-3.5 text-[#F5B544]" />
              <span>Kitchen KDS</span>
            </button>

            {/* Avatar */}
            <div className="w-9 h-9 bg-gradient-to-br from-[#2563EB] to-[#38BDF8] rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              {(user?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto bg-[#050914] text-[#CBD5E1]">
          <div className="p-4 sm:p-6 lg:p-8 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
