import React, { useState, useEffect, useRef } from 'react';
import { 
  ChefHat, Volume2, VolumeX, Clock, CheckCircle2, 
  AlertCircle, RefreshCw, Filter, Sparkles, Utensils
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Order, OrderStatus } from '../../types';
import { playKitchenChime } from '../../utils/audio';

export const KitchenDisplayPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'NEW' | 'PREPARING' | 'READY'>('ALL');
  const [wsConnected, setWsConnected] = useState(false);
  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  const fetchKitchenOrders = async () => {
    try {
      const data = await api.getKitchenOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();

    if (!user?.restaurant_id) return;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const token = localStorage.getItem('aurelia_auth_token');
      const wsUrl = `${protocol}//${window.location.host}/ws/restaurant/${user.restaurant_id}?token=${token || ''}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'NEW_ORDER') {
            if (soundRef.current) playKitchenChime();
            setOrders(prev => [payload.order, ...prev.filter(o => o.id !== payload.order.id)]);
          } else if (payload.event === 'ORDER_STATUS_UPDATED') {
            const updated = payload.order as Order;
            if (updated.status === 'SERVED' || updated.status === 'CANCELLED') {
              setOrders(prev => prev.filter(o => o.id !== updated.id));
            } else {
              setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
            }
          }
        } catch (err) {
          console.warn('WS message parse error:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWs, 3000);
      };
    };

    connectWs();
    const pollInterval = setInterval(fetchKitchenOrders, 6000);

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
    };
  }, [user?.restaurant_id]);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const updated = await api.updateKitchenOrderStatus(orderId, nextStatus);
      if (nextStatus === 'SERVED' || nextStatus === 'CANCELLED') {
        setOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      }
    } catch (err: any) {
      alert(err.message || 'Status transition failed.');
    }
  };

  const getElapsedMinutes = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    return diff < 1 ? 'Just now' : `${diff}m ago`;
  };

  const filteredOrders = orders.filter(o => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'NEW') return o.status === 'NEW' || o.status === 'ACCEPTED';
    return o.status === activeFilter;
  });

  return (
    <div className="min-h-screen bg-charcoal-950 text-slate-100 flex flex-col font-sans">
      {/* Top KDS Header */}
      <header className="h-16 bg-charcoal-900 border-b border-charcoal-850 px-6 flex items-center justify-between sticky top-0 z-30 shadow-soft">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center font-bold text-white shadow-glow-teal">
              <ChefHat className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wider">KITCHEN DISPLAY SYSTEM</h1>
              <p className="text-[10px] text-teal-400 font-mono uppercase tracking-widest">{user?.restaurant?.name || 'Live Kitchen'}</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-2 pl-6 border-l border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-400">{wsConnected ? 'WebSocket Live Stream' : 'Connecting Stream...'}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              soundEnabled ? 'bg-teal-900/60 text-teal-300 border-teal-600/50' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime Active' : 'Muted'}</span>
          </button>

          <button
            onClick={fetchKitchenOrders}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <a
            href="/dashboard"
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Exit KDS
          </a>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="bg-charcoal-900/90 border-b border-charcoal-850 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs">
          {(['ALL', 'NEW', 'PREPARING', 'READY'] as const).map((tab) => {
            const count = tab === 'ALL' ? orders.length : orders.filter(o => tab === 'NEW' ? (o.status === 'NEW' || o.status === 'ACCEPTED') : o.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3.5 py-1.5 rounded-lg font-bold tracking-wider uppercase transition-all flex items-center space-x-1.5 ${
                  activeFilter === tab 
                    ? 'bg-teal-700 text-white shadow-sm' 
                    : 'bg-charcoal-850 text-slate-400 hover:text-white'
                }`}
              >
                <span>{tab}</span>
                <span className="px-1.5 py-0.2 bg-black/40 rounded-full text-[10px] font-mono">{count}</span>
              </button>
            );
          })}
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {orders.length} Active Tickets
        </span>
      </div>

      {/* Orders Grid */}
      <div className="p-6 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500/30 mb-3" />
            <h3 className="text-lg font-bold text-slate-300">All Kitchen Orders Cleared</h3>
            <p className="text-xs text-slate-500 mt-1">New incoming tickets will chime and appear instantly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredOrders.map((order) => {
              const isNew = order.status === 'NEW';
              const isAccepted = order.status === 'ACCEPTED';
              const isCooking = order.status === 'PREPARING';
              const isReady = order.status === 'READY';

              let borderColor = 'border-slate-800';
              let badgeBg = 'bg-slate-800 text-slate-300';
              if (isNew) {
                borderColor = 'border-amber-500/80 shadow-glow-gold';
                badgeBg = 'bg-amber-500/20 text-amber-300 animate-pulse border border-amber-500/40';
              } else if (isCooking) {
                borderColor = 'border-purple-500/60';
                badgeBg = 'bg-purple-500/20 text-purple-300 border border-purple-500/40';
              } else if (isReady) {
                borderColor = 'border-emerald-500/80 shadow-glow-teal';
                badgeBg = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
              }

              return (
                <div
                  key={order.id}
                  className={`bg-charcoal-900 rounded-2xl border ${borderColor} flex flex-col justify-between overflow-hidden transition-all duration-200`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-charcoal-850 flex items-start justify-between bg-charcoal-850/60">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-black text-white font-serif">{order.table_number || 'Takeaway'}</span>
                        <span className="text-xs font-mono font-bold text-teal-400">#{order.order_number}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Guest: {order.customer_name}</p>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider block ${badgeBg}`}>
                        {order.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 flex items-center justify-end space-x-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{getElapsedMinutes(order.created_at)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Items */}
                  <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-72">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-md bg-charcoal-850 text-teal-300 font-black flex items-center justify-center text-xs font-mono">
                              {item.quantity}
                            </span>
                            <span className="font-semibold text-slate-100">{item.item_name}</span>
                          </div>
                        </div>
                        {item.variant_name && (
                          <p className="text-xs text-teal-400 ml-8 font-medium">↳ {item.variant_name}</p>
                        )}
                        {item.addons.length > 0 && (
                          <p className="text-xs text-slate-400 ml-8">+ {item.addons.map(a => a.addon_name).join(', ')}</p>
                        )}
                        {item.notes && (
                          <div className="ml-8 mt-1 p-1.5 rounded bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs italic">
                            ⚠️ Note: "{item.notes}"
                          </div>
                        )}
                      </div>
                    ))}

                    {order.special_notes && (
                      <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-200 text-xs">
                        <span className="font-bold uppercase tracking-wider text-[10px] block text-amber-300">Order Note:</span>
                        {order.special_notes}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-3 bg-charcoal-950/80 border-t border-charcoal-850 flex items-center space-x-2">
                    {isNew && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider uppercase transition-colors"
                      >
                        Accept Order
                      </button>
                    )}
                    {isAccepted && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wider uppercase transition-colors"
                      >
                        Start Cooking
                      </button>
                    )}
                    {isCooking && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'READY')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider uppercase transition-colors shadow-glow-teal"
                      >
                        Mark Ready to Serve
                      </button>
                    )}
                    {isReady && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'SERVED')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs tracking-wider uppercase transition-colors"
                      >
                        Mark Served at Table
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
