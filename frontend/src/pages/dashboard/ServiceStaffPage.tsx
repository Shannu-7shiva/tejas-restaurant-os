import React, { useState, useEffect } from 'react';
import { 
  ConciergeBell, CheckCircle2, Clock, Table as TableIcon, 
  Sparkles, RefreshCw, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { Order, RestaurantTable, TableStatus } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';

export const ServiceStaffPage: React.FC = () => {
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [allOrders, allTables] = await Promise.all([
        api.getKitchenOrders(),
        api.getTables()
      ]);
      setReadyOrders(allOrders.filter((o: Order) => o.status === 'READY'));
      setTables(allTables);
    } catch (err) {
      console.error('Error fetching service data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkServed = async (orderId: string) => {
    try {
      await api.updateKitchenOrderStatus(orderId, 'SERVED');
      setReadyOrders(prev => prev.filter(o => o.id !== orderId));
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order.');
    }
  };

  const handleTableStatusChange = async (tableId: string, nextStatus: TableStatus) => {
    try {
      await api.updateTable(tableId, { status: nextStatus });
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: nextStatus } : t));
    } catch (err: any) {
      alert(err.message || 'Failed to update table status.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center space-x-2">
            <ConciergeBell className="w-6 h-6 text-teal-700" />
            <span>Floor Service & Waiter Console</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time table status and ready food delivery queue.</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Ready to Serve Urgency Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Ready for Table Pickup ({readyOrders.length})</span>
          </h2>
          {readyOrders.length > 0 && (
            <span className="text-xs text-emerald-700 font-semibold animate-pulse">Hot food awaiting server</span>
          )}
        </div>

        {readyOrders.length === 0 ? (
          <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Food Waiting for Pickup</p>
            <p className="text-xs text-slate-400 mt-0.5">When chefs mark dishes ready, tickets will alert here immediately.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-5 border-2 border-emerald-500 shadow-soft-lg flex flex-col justify-between animate-in zoom-in-95"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-2xl font-black font-serif text-slate-900">{order.table_number || 'Dine-In'}</span>
                      <p className="text-xs font-mono font-bold text-teal-700 mt-0.5">#{order.order_number}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg uppercase tracking-wider">
                      Plated & Ready
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                    {order.items.map((it) => (
                      <div key={it.id} className="text-xs flex justify-between font-medium">
                        <span className="text-slate-800">{it.quantity}x {it.item_name}</span>
                        {it.variant_name && <span className="text-teal-600 text-[11px]">{it.variant_name}</span>}
                      </div>
                    ))}
                  </div>

                  {order.special_notes && (
                    <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
                      Note: {order.special_notes}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleMarkServed(order.id)}
                  className="mt-5 w-full py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
                >
                  ✓ Confirm Delivered to Table
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floor Tables Status Section */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-2">
          <TableIcon className="w-4 h-4 text-teal-700" />
          <span>Floor Table Occupancy & Turnover</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tables.map((table) => {
            const isAvail = table.status === 'AVAILABLE';
            const isOccupied = table.status === 'OCCUPIED';
            const isCleaning = table.status === 'CLEANING';

            return (
              <div
                key={table.id}
                className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-soft-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{table.table_number}</span>
                    <span className="text-[10px] text-slate-400">{table.capacity}p</span>
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={table.status} />
                  </div>
                </div>

                {/* Quick Toggle Status */}
                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center space-x-1">
                  {isOccupied && (
                    <button
                      onClick={() => handleTableStatusChange(table.id, 'CLEANING')}
                      className="w-full py-1 text-[10px] font-bold uppercase bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
                    >
                      Clear & Clean
                    </button>
                  )}
                  {isCleaning && (
                    <button
                      onClick={() => handleTableStatusChange(table.id, 'AVAILABLE')}
                      className="w-full py-1 text-[10px] font-bold uppercase bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition-colors"
                    >
                      Mark Ready
                    </button>
                  )}
                  {isAvail && (
                    <button
                      onClick={() => handleTableStatusChange(table.id, 'OCCUPIED')}
                      className="w-full py-1 text-[10px] font-bold uppercase bg-amber-50 hover:bg-amber-100 text-amber-700 rounded transition-colors"
                    >
                      Seat Guests
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
