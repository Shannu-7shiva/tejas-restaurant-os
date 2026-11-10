import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, Clock, ChefHat, Bell, Sparkles, 
  Utensils, ArrowLeft, RefreshCw, AlertCircle, CreditCard, ShieldCheck, Bot
} from 'lucide-react';
import { api } from '../../services/api';
import { Order, OrderStatus } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { PaymentModal } from '../../components/customer/PaymentModal';
import { AICustomerBot } from '../../components/customer/AICustomerBot';

export const OrderStatusTrackerPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [aiBotOpen, setAiBotOpen] = useState(false);
  const [waiterToast, setWaiterToast] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const data = await api.getCustomerOrder(orderId);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    if (!orderId) return;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/order/${orderId}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if ((payload.event === 'ORDER_STATUS_UPDATED' || payload.event === 'ORDER_PAYMENT_UPDATED') && payload.order) {
            setOrder(payload.order);
          }
        } catch (err) {
          console.warn('Failed parsing WS message:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWs, 3000);
      };
    };

    connectWs();
    const pollInterval = setInterval(fetchOrder, 6000);

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
    };
  }, [orderId]);

  const handleCallWaiter = async () => {
    if (!order) return;
    try {
      await api.callWaiter('tejas', {
        table_number: order.table_number || 'Dine-In Table',
        request_type: 'ASSISTANCE',
        notes: `Order #${order.order_number} status assistance`,
      });
      setWaiterToast('Floor server notified for your table!');
      setTimeout(() => setWaiterToast(null), 3500);
    } catch {
      setWaiterToast('Server alerted.');
      setTimeout(() => setWaiterToast(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center font-serif text-2xl font-bold animate-pulse shadow-glow-gold mb-4">
          T
        </div>
        <p className="text-amber-200 font-medium text-sm">Tracking order in Tejas live kitchen...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-serif font-bold text-white">Order Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">{error || 'Could not locate this order.'}</p>
        <Link to="/" className="mt-4 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs">
          Return to Tejas Menu
        </Link>
      </div>
    );
  }

  const steps: { key: OrderStatus; label: string; desc: string; icon: any }[] = [
    { key: 'NEW', label: 'Order Sent', desc: 'Received in kitchen queue', icon: Bell },
    { key: 'ACCEPTED', label: 'Accepted', desc: 'Approved by executive chef', icon: CheckCircle2 },
    { key: 'PREPARING', label: 'Cooking', desc: 'Crafting on tandoor & flame', icon: ChefHat },
    { key: 'READY', label: 'Plated & Ready', desc: 'Ready for table service', icon: Sparkles },
    { key: 'SERVED', label: 'Served', desc: 'Enjoy your meal!', icon: Utensils },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'NEW': return 0;
      case 'ACCEPTED': return 1;
      case 'PREPARING': return 2;
      case 'READY': return 3;
      case 'SERVED': return 4;
      default: return -1;
    }
  };

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const isPaid = order.payment_status === 'PAID';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans">
      {waiterToast && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto bg-amber-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold animate-slide-down border border-amber-400/30">
          🔔 {waiterToast}
        </div>
      )}

      {/* Top Header */}
      <div className="bg-slate-900 border-b border-amber-500/15 px-4 sm:px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-amber-400 border border-slate-700">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Tejas Live Tracking</p>
              <h1 className="text-base font-serif font-bold text-white">{order.table_number || 'Dine-In Table'}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[11px] text-slate-300 font-medium">{wsConnected ? 'Live Sync' : 'Syncing'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Order Hero Status Card */}
        <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Order Number</span>
              <h2 className="text-2xl font-bold font-mono text-amber-400 tracking-tight mt-0.5">#{order.order_number}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Guest: {order.customer_name}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Stepper Progression */}
          {!isCancelled ? (
            <div className="mt-6 relative">
              <div className="space-y-5">
                {steps.map((st, idx) => {
                  const Icon = st.icon;
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;

                  return (
                    <div key={st.key} className="flex items-start space-x-3.5 relative">
                      {idx < steps.length - 1 && (
                        <div className={`absolute left-5 top-10 w-0.5 h-7 -ml-[1px] ${currentStepIdx > idx ? 'bg-amber-500' : 'bg-slate-800'}`} />
                      )}

                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                        isCurrent 
                          ? 'bg-gradient-to-tr from-amber-500 to-yellow-600 text-white shadow-glow-gold ring-4 ring-amber-500/20 animate-pulse' 
                          : isDone 
                            ? 'bg-amber-600 text-white' 
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-bold ${isCurrent ? 'text-amber-300' : isDone ? 'text-white' : 'text-slate-500'}`}>
                            {st.label}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{st.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-rose-300 mt-5">
              <p className="font-bold text-sm">Order Cancelled</p>
              <p className="text-xs text-rose-400 mt-1">This order was cancelled by the restaurant management.</p>
            </div>
          )}
        </div>

        {/* Payment Banner Action Card */}
        <div className="bg-gradient-to-r from-amber-900/30 via-slate-900 to-yellow-900/20 rounded-3xl p-5 border border-amber-500/30 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Payment Status</span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className={`text-sm font-bold ${isPaid ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {isPaid ? '✓ Paid & Verified' : 'Pending Payment'}
                </span>
                {isPaid && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {order.payment_method}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Amount</span>
              <p className="text-xl font-bold font-sans text-amber-400">₹{order.total_amount.toFixed(2)}</p>
            </div>
          </div>

          {!isPaid ? (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider shadow-glow-gold flex items-center justify-center space-x-2 transition-all"
            >
              <CreditCard className="w-4 h-4 text-amber-200" />
              <span>Pay Bill Online (UPI, QR, Cards)</span>
            </button>
          ) : (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Thank you! Your payment has been confirmed by Tejas billing desk.</span>
            </div>
          )}
        </div>

        {/* Ordered Dishes Summary */}
        <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-soft">
          <h3 className="text-xs font-serif font-bold text-amber-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-800">
            Items in this Order ({order.items.length})
          </h3>
          <div className="divide-y divide-slate-800/80">
            {order.items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-start justify-between text-xs sm:text-sm">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-amber-400">{item.quantity}x</span>
                    <span className="font-semibold text-white">{item.item_name}</span>
                  </div>
                  {item.variant_name && (
                    <p className="text-[11px] text-amber-300 ml-6">{item.variant_name}</p>
                  )}
                  {item.addons.length > 0 && (
                    <p className="text-[10px] text-slate-400 ml-6">+ {item.addons.map(a => a.addon_name).join(', ')}</p>
                  )}
                  {item.notes && (
                    <p className="text-[10px] text-amber-400 italic ml-6">"{item.notes}"</p>
                  )}
                </div>
                <span className="font-bold text-slate-200">₹{item.subtotal.toFixed(0)}</span>
              </div>
            ))}
          </div>

          {/* Breakdown */}
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-1 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-slate-200">₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST & Taxes</span>
              <span className="text-slate-200">₹{order.tax_amount.toFixed(2)}</span>
            </div>
            {order.service_charge > 0 && (
              <div className="flex justify-between">
                <span>Service Charge</span>
                <span className="text-slate-200">₹{order.service_charge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-slate-800">
              <span>Total</span>
              <span className="text-amber-400">₹{order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setAiBotOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-soft"
          >
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>Ask AI Concierge</span>
          </button>
          <button
            onClick={handleCallWaiter}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-soft"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Call Waiter</span>
          </button>
          <button
            onClick={fetchOrder}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-soft"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {order && (
        <PaymentModal
          orderId={order.id}
          orderNumber={order.order_number}
          totalAmount={order.total_amount}
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onPaymentSuccess={() => {
            setPaymentModalOpen(false);
            fetchOrder();
          }}
        />
      )}

      {/* AI Bot */}
      <AICustomerBot
        restaurantSlug="tejas"
        tableNumber={order.table_number || 'Dine-In Table'}
        orderId={order.id}
        isOpen={aiBotOpen}
        onClose={() => setAiBotOpen(false)}
      />
    </div>
  );
};
