import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../services/api';
import {
  Building2, Users, ShoppingBag, TrendingUp, CheckCircle,
  Clock, AlertTriangle, XCircle, Search, RefreshCw, Shield,
  CreditCard, Activity, BarChart3, Eye, Ban, ArrowUpRight, Sparkles
} from 'lucide-react';

interface PlatformStats {
  total_restaurants: number;
  active: number;
  trial: number;
  pending: number;
  suspended: number;
  inactive: number;
  total_users: number;
  total_orders: number;
}

interface RestaurantRow {
  id: string;
  name: string;
  slug: string;
  email: string;
  city: string;
  category: string;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
  TRIAL: 'text-[#38BDF8] bg-[#0A1222] border-[#38BDF8]/40',
  PENDING: 'text-[#F5B544] bg-amber-950/60 border-[#F5B544]/40',
  SUSPENDED: 'text-rose-400 bg-rose-950/60 border-rose-800',
  INACTIVE: 'text-[#94A3B8] bg-[#151F31] border-[#273449]',
};

export const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const getToken = () =>
    localStorage.getItem('tejas_token') || localStorage.getItem('aurelia_token') || '';

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status_filter', statusFilter);

      const [dashRes, restsRes] = await Promise.all([
        fetch(`${API_BASE}/super-admin/dashboard`, { headers }),
        fetch(`${API_BASE}/super-admin/restaurants?${params}`, { headers }),
      ]);

      if (dashRes.ok) {
        const dash = await dashRes.json();
        setStats(dash.stats);
      }
      if (restsRes.ok) {
        const rests = await restsRes.json();
        setRestaurants(rests.restaurants || []);
      }
    } catch (e) {
      console.error('SuperAdmin fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`${API_BASE}/super-admin/restaurants/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error('Update status error:', e);
    } finally {
      setUpdating(null);
    }
  };

  const statCards = stats
    ? [
        { label: 'Total Restaurants', value: stats.total_restaurants, icon: Building2, color: 'text-[#38BDF8]', bg: 'bg-[#101827] border-[#273449]' },
        { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-[#101827] border-[#273449]' },
        { label: 'On Trial', value: stats.trial, icon: Clock, color: 'text-[#F5B544]', bg: 'bg-[#101827] border-[#273449]' },
        { label: 'Pending Review', value: stats.pending, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-[#101827] border-[#273449]' },
        { label: 'Suspended', value: stats.suspended, icon: XCircle, color: 'text-rose-400', bg: 'bg-[#101827] border-[#273449]' },
        { label: 'Inactive', value: stats.inactive, icon: Ban, color: 'text-[#94A3B8]', bg: 'bg-[#101827] border-[#273449]' },
        { label: 'Total Users', value: stats.total_users, icon: Users, color: 'text-[#7DD3FC]', bg: 'bg-[#101827] border-[#273449]' },
        { label: 'Total Orders', value: stats.total_orders, icon: ShoppingBag, color: 'text-[#F5B544]', bg: 'bg-[#101827] border-[#273449]' },
      ]
    : [];

  return (
    <div className="p-6 space-y-8 bg-[#050914] text-[#CBD5E1]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Shield className="w-5 h-5 text-[#F5B544]" />
            <span className="text-[#F5B544] text-xs font-bold tracking-widest uppercase">Platform Governance</span>
          </div>
          <h1 className="text-3xl font-black text-white">Super Admin Command Center</h1>
          <p className="text-[#94A3B8] text-sm mt-1">TEJAS TECHNOLOGIES &mdash; Central Multi-Tenant Cloud Operating System</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2.5 bg-[#151F31] hover:bg-[#1f2d47] border border-[#273449] text-[#CBD5E1] hover:text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#38BDF8]' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className={`border rounded-xl p-4 text-center transition-all hover:border-[#38BDF8]/40 ${s.bg}`}>
            <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
            <div className="text-2xl font-black text-white">{s.value ?? '—'}</div>
            <div className="text-[11px] text-[#94A3B8] mt-1 leading-tight font-medium">{s.label}</div>
          </div>
        ))}
        {!stats && loading && (
          <div className="col-span-8 text-center py-8 text-[#94A3B8]">Loading platform telemetry...</div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Activity, label: 'Cloud Infrastructure Health', desc: 'All PostgreSQL and WebSocket nodes operational', color: 'text-emerald-400', btn: 'Check Health Endpoint' },
          { icon: CreditCard, label: 'Commercial Subscription Plans', desc: 'Manage 4 SaaS tiers & pricing configuration', color: 'text-[#38BDF8]', btn: 'Manage Plans' },
          { icon: BarChart3, label: 'Platform Financial Telemetry', desc: 'Live cross-tenant aggregate revenue and velocity', color: 'text-[#F5B544]', btn: 'View Aggregate Metrics' },
        ].map((card) => (
          <div key={card.label} className="bg-[#101827] border border-[#273449] rounded-xl p-5 flex items-start space-x-4 hover:border-[#38BDF8]/40 transition-all">
            <div className={`p-2.5 bg-[#151F31] border border-[#273449] rounded-lg ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm">{card.label}</h3>
              <p className="text-[#94A3B8] text-xs mt-0.5">{card.desc}</p>
              <button className={`mt-3 flex items-center space-x-1 text-xs font-bold ${card.color} hover:opacity-80 transition-opacity`}>
                <span>{card.btn}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            className="w-full pl-10 pr-4 py-3 bg-[#0A1222] border border-[#273449] rounded-xl text-white text-sm placeholder-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent"
            placeholder="Search restaurants by brand name, slug, email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-3 bg-[#0A1222] border border-[#273449] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] min-w-[170px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Tenant Statuses</option>
          {['ACTIVE', 'TRIAL', 'PENDING', 'SUSPENDED', 'INACTIVE'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Restaurants Table */}
      <div className="bg-[#101827] border border-[#273449] rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-[#273449] flex items-center justify-between bg-[#0A1222]/50">
          <h2 className="text-white font-bold flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-[#38BDF8]" />
            <span>Registered Restaurant Tenants</span>
          </h2>
          <span className="text-[#94A3B8] text-xs font-semibold">{restaurants.length} registered restaurant{restaurants.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#273449] bg-[#0A1222]">
                {['Restaurant', 'Tenant Slug', 'Location', 'Category', 'Lifecycle Status', 'Registration Date', 'Governance Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-bold text-[#94A3B8] uppercase tracking-wider px-5 py-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#273449]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#94A3B8]">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-6 h-6 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
                      <span>Loading tenant telemetry...</span>
                    </div>
                  </td>
                </tr>
              ) : restaurants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#94A3B8]">
                    <Building2 className="w-10 h-10 text-[#273449] mx-auto mb-3" />
                    <div>No restaurants match the specified criteria</div>
                  </td>
                </tr>
              ) : (
                restaurants.map((r) => (
                  <tr key={r.id} className="hover:bg-[#151F31]/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-white font-bold text-sm">{r.name}</div>
                      <div className="text-[#94A3B8] text-xs mt-0.5">{r.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <code className="text-[#38BDF8] text-xs bg-[#0A1222] border border-[#273449] px-2 py-1 rounded font-mono">{r.slug}</code>
                    </td>
                    <td className="px-5 py-4 text-[#CBD5E1] text-sm">{r.city || '—'}</td>
                    <td className="px-5 py-4 text-[#CBD5E1] text-sm">{r.category || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${STATUS_STYLES[r.status] || 'text-[#94A3B8] bg-[#0A1222] border-[#273449]'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#94A3B8] text-xs font-mono">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {r.status !== 'ACTIVE' && (
                          <button
                            onClick={() => updateStatus(r.id, 'ACTIVE')}
                            disabled={updating === r.id}
                            className="px-3 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-800 transition-colors disabled:opacity-50"
                          >
                            Activate
                          </button>
                        )}
                        {r.status !== 'SUSPENDED' && (
                          <button
                            onClick={() => updateStatus(r.id, 'SUSPENDED')}
                            disabled={updating === r.id}
                            className="px-3 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-400 rounded-lg text-xs font-bold border border-rose-800 transition-colors disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
