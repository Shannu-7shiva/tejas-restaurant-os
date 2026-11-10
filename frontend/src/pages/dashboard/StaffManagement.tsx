import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Mail, Phone, 
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { User, UserRole } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';

export const StaffManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('SERVICE_STAFF');
  const [password, setPassword] = useState('');

  const fetchStaff = async () => {
    try {
      const data = await api.getStaff();
      setStaff(data);
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !fullName.trim()) return;

    try {
      const created = await api.addStaff({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        role,
      });
      setStaff(prev => [...prev, created]);
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create staff member.');
    }
  };

  const handleToggleActive = async (member: User) => {
    if (member.id === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }
    try {
      const updated = await api.updateStaff(member.id, {
        is_active: !member.is_active
      });
      setStaff(prev => prev.map(m => m.id === member.id ? updated : m));
    } catch (err: any) {
      alert(err.message || 'Failed to update staff status.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">Staff Team & Permissions</h1>
          <p className="text-xs text-slate-500 mt-0.5">Role-based access control for kitchen chefs, floor waiters, and managers.</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Employee</span>
        </button>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <div
              key={member.id}
              className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft-sm flex flex-col justify-between ${
                !member.is_active ? 'opacity-60 bg-slate-50' : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{member.full_name}</h3>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                      {member.role.replace('_', ' ')}
                    </span>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${member.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className={`text-[11px] font-medium ${member.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {member.is_active ? 'Active Employee' : 'Deactivated'}
                </span>

                {member.id !== currentUser?.id && (
                  <button
                    onClick={() => handleToggleActive(member)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      member.is_active 
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' 
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {member.is_active ? 'Suspend' : 'Reactivate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Invite Restaurant Employee"
      >
        <form onSubmit={handleInviteStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Chandra"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="staff@royalsaffron.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="+91 98765 00000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role & Privilege Scope</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="SERVICE_STAFF">Service Staff / Waiter (Table delivery & turnover)</option>
              <option value="KITCHEN_STAFF">Kitchen Staff / Chef (KDS display & ticket workflow)</option>
              <option value="RESTAURANT_MANAGER">Restaurant Manager (Orders, menu, tables & reports)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Initial Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              Create Account & Issue Credentials
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
