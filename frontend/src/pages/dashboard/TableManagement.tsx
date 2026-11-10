import React, { useState, useEffect } from 'react';
import { 
  Table as TableIcon, Plus, QrCode, RefreshCw, 
  Download, Printer, Trash2, CheckCircle2, AlertTriangle, ShieldAlert
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../../services/api';
import { RestaurantTable, TableStatus } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';

export const TableManagement: React.FC = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Table Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableCap, setNewTableCap] = useState(4);

  // QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const fetchTables = async () => {
    try {
      const data = await api.getTables();
      setTables(data);
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleOpenQR = async (table: RestaurantTable) => {
    setSelectedTable(table);
    const orderUrl = `${window.location.origin}/order/${user?.restaurant?.slug || 'royal-saffron'}/${table.qr_token}`;
    try {
      const dataUrl = await QRCode.toDataURL(orderUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0B0F17',
          light: '#FAF7F2',
        },
      });
      setQrDataUrl(dataUrl);
      setQrModalOpen(true);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  const handleRegenerateQR = async (tableId: string) => {
    if (!confirm('Regenerating this QR code will revoke and deactivate the existing code immediately. Continue?')) {
      return;
    }
    try {
      const updated = await api.regenerateTableQR(tableId);
      setTables(prev => prev.map(t => t.id === tableId ? updated : t));
      if (selectedTable?.id === tableId) {
        handleOpenQR(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate QR token.');
    }
  };

  const handleToggleSession = async (table: RestaurantTable) => {
    try {
      const updated = await api.updateTable(table.id, {
        is_session_active: !table.is_session_active
      });
      setTables(prev => prev.map(t => t.id === table.id ? updated : t));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle table session.');
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum.trim()) return;

    try {
      const created = await api.createTable({
        table_number: newTableNum.trim(),
        capacity: newTableCap
      });
      setTables(prev => [...prev, created]);
      setNewTableNum('');
      setNewTableCap(4);
      setCreateModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create table.');
    }
  };

  const handlePrintTent = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">Table & QR Code Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage floor layout, cryptographic ordering tokens, and printable cards.</p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Dining Table</span>
        </button>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-slate-900">{table.table_number}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Capacity: {table.capacity} guests</p>
                  </div>
                  <StatusBadge status={table.status} />
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block">QR Ordering Session</span>
                    <span className={`text-[10px] ${table.is_session_active ? 'text-emerald-700 font-semibold' : 'text-rose-600'}`}>
                      {table.is_session_active ? '✓ Accepting Customer Orders' : '✕ Ordering Suspended'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleSession(table)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      table.is_session_active ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {table.is_session_active ? 'Close' : 'Open'}
                  </button>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenQR(table)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-charcoal-900 hover:bg-charcoal-850 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-teal-400" />
                  <span>View QR Code</span>
                </button>

                <button
                  onClick={() => handleRegenerateQR(table.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                  title="Revoke and Regenerate Token"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Preview & Printable Table Tent Modal */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title={`Table QR Card • ${selectedTable?.table_number}`}
        maxWidth="max-w-md"
      >
        {selectedTable && (
          <div className="space-y-6 text-center">
            {/* Printable Display Tent Sheet */}
            <div id="printable-table-tent" className="p-6 bg-ivory-100 rounded-2xl border-2 border-ivory-300 shadow-soft-sm mx-auto">
              <div className="w-10 h-10 rounded-xl bg-charcoal-900 mx-auto flex items-center justify-center font-serif text-white font-bold text-lg mb-2 shadow-glow-teal">
                A
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900">{user?.restaurant?.name || 'Aurelia Restaurant'}</h3>
              <p className="text-[11px] text-teal-800 font-bold uppercase tracking-widest mt-0.5">Digital Menu & Table Ordering</p>

              {/* QR Image */}
              <div className="my-5 p-3 bg-white rounded-2xl shadow-soft border border-ivory-200 inline-block">
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="Table QR" className="w-56 h-56 object-contain" />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xl font-serif font-black text-slate-900">{selectedTable.table_number}</p>
                <p className="text-xs text-slate-600">Scan with your smartphone camera to browse our menu and place orders.</p>
              </div>

              {selectedTable.session_pin && (
                <div className="mt-3 py-1 px-3 bg-white/80 rounded-lg border border-ivory-300 text-[11px] text-slate-700 inline-block">
                  Table PIN: <span className="font-mono font-bold tracking-wider">{selectedTable.session_pin}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-2">
              <a
                href={qrDataUrl}
                download={`qr-${selectedTable.table_number.replace(/\s+/g, '-').toLowerCase()}.png`}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </a>

              <button
                onClick={handlePrintTent}
                className="flex-1 py-2.5 px-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Table Card</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Table Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Dining Table"
      >
        <form onSubmit={handleCreateTable} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Table Name or Number</label>
            <input
              type="text"
              required
              placeholder="e.g. Table 7, Booth A, Terrace-02"
              value={newTableNum}
              onChange={(e) => setNewTableNum(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Seating Capacity</label>
            <input
              type="number"
              min={1}
              max={50}
              value={newTableCap}
              onChange={(e) => setNewTableCap(parseInt(e.target.value) || 2)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              Generate Cryptographic QR & Save Table
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
