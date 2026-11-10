import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, ShoppingBag, ChefHat, CheckCircle2, 
  IndianRupee, ArrowUpRight, Clock, Users, UtensilsCrossed, Table
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { AnalyticsSummary } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';

export const DashboardOverview: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Revenue (Paid)',
      value: `₹${(analytics?.total_revenue_today ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      subtitle: `From ${analytics?.completed_today_count ?? 0} settled orders`,
      icon: IndianRupee,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      title: 'Active In Kitchen',
      value: analytics?.active_preparing_count ?? 0,
      subtitle: 'Currently being prepared',
      icon: ChefHat,
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      title: 'Orders Today',
      value: analytics?.orders_today_count ?? 0,
      subtitle: `Total Gross: ₹${(analytics?.placed_orders_value_today ?? 0).toFixed(0)}`,
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      title: 'Average Order Value',
      value: `₹${(analytics?.avg_order_value ?? 0).toFixed(2)}`,
      subtitle: 'Average per dine-in table',
      icon: TrendingUp,
      color: 'bg-teal-50 text-teal-700 border-teal-200'
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{s.title}</span>
                <div className={`p-2 rounded-xl border ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl lg:text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
                  {s.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{s.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Row: Top Dishes & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular Dishes */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-base text-slate-900">Bestselling Menu Items</h3>
              <UtensilsCrossed className="w-4 h-4 text-teal-600" />
            </div>

            {analytics?.popular_items && analytics.popular_items.length > 0 ? (
              <div className="space-y-4">
                {analytics.popular_items.map((item, idx) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">
                        {idx + 1}. {item.name}
                      </span>
                      <span className="text-teal-700">{item.total_sold} ordered</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, item.total_sold * 25)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">No order history recorded yet today.</p>
            )}
          </div>

          <Link
            to="/dashboard/menu"
            className="mt-6 text-xs text-teal-700 font-semibold flex items-center justify-end space-x-1 hover:underline"
          >
            <span>Manage Menu Catalog</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-base text-slate-900">Recent Live Orders</h3>
              <Link
                to="/dashboard/orders"
                className="text-xs text-teal-700 font-semibold hover:underline flex items-center space-x-1"
              >
                <span>View All Orders</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {analytics?.recent_orders && analytics.recent_orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="pb-3 font-semibold">Order</th>
                      <th className="pb-3 font-semibold">Table</th>
                      <th className="pb-3 font-semibold">Guest</th>
                      <th className="pb-3 font-semibold">Total</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.recent_orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-900">#{o.order_number}</td>
                        <td className="py-3 text-slate-700">{o.table_number || 'Takeaway'}</td>
                        <td className="py-3 text-slate-600">{o.customer_name}</td>
                        <td className="py-3 font-bold text-slate-900">₹{o.total_amount.toFixed(2)}</td>
                        <td className="py-3">
                          <StatusBadge status={o.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">No orders placed today.</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">Fast Actions:</span>
            <div className="flex space-x-2">
              <Link
                to="/kitchen"
                className="px-3 py-1.5 rounded-lg bg-charcoal-900 hover:bg-charcoal-850 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Launch KDS Display
              </Link>
              <Link
                to="/dashboard/tables"
                className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Print Table QR Codes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
