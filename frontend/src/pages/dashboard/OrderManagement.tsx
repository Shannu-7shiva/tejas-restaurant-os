import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Filter, Download, 
  Eye, CheckCircle2, XCircle, CreditCard, Clock, AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  // Cancel Dialog
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchOrders = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params['search'] = search;
      if (statusFilter) params['status_filter'] = statusFilter;
      if (paymentFilter) params['payment_filter'] = paymentFilter;

      const res = await api.getOrders(params);
      setOrders(res.orders || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setOrderModalOpen(true);
  };

  const handleMarkPayment = async (orderId: string, status: PaymentStatus, method = 'UPI') => {
    try {
      const updated = await api.updateOrderPayment(orderId, status, method);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
    } catch (err: any) {
      alert(err.message || 'Payment update failed.');
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder) return;
    try {
      const updated = await api.cancelOrder(selectedOrder.id, cancelReason || 'Cancelled by manager');
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updated : o));
      setSelectedOrder(updated);
      setCancelModalOpen(false);
      setCancelReason('');
    } catch (err: any) {
      alert(err.message || 'Order cancellation failed.');
    }
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('aurelia_auth_token');
    window.open(`/api/v1/orders/export/csv`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">Order Management & History</h1>
          <p className="text-xs text-slate-500 mt-0.5">Authoritative order records, payment settlement, and status lifecycle.</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Orders CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order # or guest name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="SERVED">Served</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="">All Payments</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No orders found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or date range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order</th>
                  <th className="py-3 px-4 font-semibold">Table</th>
                  <th className="py-3 px-4 font-semibold">Guest</th>
                  <th className="py-3 px-4 font-semibold">Items</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Payment</th>
                  <th className="py-3 px-4 font-semibold">Time</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">#{o.order_number}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{o.table_number || 'Takeaway'}</td>
                    <td className="py-3 px-4 text-slate-600">{o.customer_name}</td>
                    <td className="py-3 px-4 text-slate-500">{o.items.length} items</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{o.total_amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={o.payment_status} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetails(o)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-semibold transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <Modal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        title={`Order Details • #${selectedOrder?.order_number}`}
        maxWidth="max-w-2xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Header snapshot */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Table Reference</p>
                <p className="text-base font-bold text-slate-900 font-serif">{selectedOrder.table_number || 'Takeaway'}</p>
                <p className="text-xs text-slate-500 mt-0.5">Guest: {selectedOrder.customer_name} {selectedOrder.customer_phone && `(${selectedOrder.customer_phone})`}</p>
              </div>

              <div className="text-right space-y-1">
                <div><StatusBadge status={selectedOrder.status} /></div>
                <div><StatusBadge status={selectedOrder.payment_status} /></div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Order Line Items</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedOrder.items.map((it) => (
                  <div key={it.id} className="p-3 flex items-start justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{it.quantity}x {it.item_name}</span>
                      {it.variant_name && <p className="text-teal-700 font-medium">{it.variant_name}</p>}
                      {it.addons.length > 0 && (
                        <p className="text-slate-500">+ {it.addons.map(a => a.addon_name).join(', ')}</p>
                      )}
                      {it.notes && <p className="text-amber-700 italic">"{it.notes}"</p>}
                    </div>
                    <span className="font-bold text-slate-900">₹{it.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Calculations */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-200">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">₹{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-semibold text-slate-800">₹{selectedOrder.tax_amount.toFixed(2)}</span>
              </div>
              {selectedOrder.service_charge > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge</span>
                  <span className="font-semibold text-slate-800">₹{selectedOrder.service_charge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="text-teal-800 font-sans">₹{selectedOrder.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Status History Timeline */}
            <div>
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Audit Timeline</h4>
              <div className="space-y-2">
                {selectedOrder.status_history.map((h, i) => (
                  <div key={i} className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{h.new_status}</span>
                      {h.notes && <span className="text-slate-500 ml-2">({h.notes})</span>}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(h.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              {/* Payment Settlement */}
              {selectedOrder.payment_status === 'UNPAID' ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-600 font-medium">Record Payment:</span>
                  <button
                    onClick={() => handleMarkPayment(selectedOrder.id, 'PAID', 'CASH')}
                    className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold"
                  >
                    Cash
                  </button>
                  <button
                    onClick={() => handleMarkPayment(selectedOrder.id, 'PAID', 'UPI')}
                    className="px-2.5 py-1 rounded bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-bold"
                  >
                    UPI
                  </button>
                  <button
                    onClick={() => handleMarkPayment(selectedOrder.id, 'PAID', 'CARD')}
                    className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-bold"
                  >
                    Card
                  </button>
                </div>
              ) : (
                <div className="text-xs text-emerald-700 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Payment Settled via {selectedOrder.payment_method}</span>
                </div>
              )}

              {/* Cancel Button */}
              {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'SERVED' && (
                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
                >
                  Authorize Cancellation
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Cancellation Dialog */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Confirm Order Cancellation"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            <p className="font-bold">Cancellation Warning</p>
            <p className="mt-1">Cancelling will stop kitchen preparation and notify the customer in real time. This action is permanently logged.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Cancellation</label>
            <input
              type="text"
              required
              placeholder="e.g. Guest requested table change, ingredient shortage"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => setCancelModalOpen(false)}
              className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Go Back
            </button>
            <button
              onClick={handleConfirmCancel}
              className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
            >
              Confirm Cancel Order
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
