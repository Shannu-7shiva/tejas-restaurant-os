import React, { useState, useEffect } from 'react';
import { Settings, Building, Sliders, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Restaurant } from '../../types';

export const SettingsPage: React.FC = () => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Profile Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  // Operational Form
  const [taxPercent, setTaxPercent] = useState(5.0);
  const [serviceCharge, setServiceCharge] = useState(0.0);
  const [pinRequired, setPinRequired] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        setRestaurant(data);
        setName(data.name || '');
        setDescription(data.description || '');
        setAddress(data.address || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setLogoUrl(data.logo_url || '');
        setCoverUrl(data.cover_image_url || '');

        if (data.settings) {
          setTaxPercent(data.settings.tax_rate_percent);
          setServiceCharge(data.settings.service_charge_percent);
          setPinRequired(data.settings.table_pin_required);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateProfile({
        name,
        description,
        address,
        phone,
        email,
        logo_url: logoUrl || null,
        cover_image_url: coverUrl || null,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    }
  };

  const handleSaveOperational = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateOperational({
        tax_rate_percent: Number(taxPercent),
        service_charge_percent: Number(serviceCharge),
        table_pin_required: pinRequired,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update operational settings.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-slate-900">Restaurant Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Customize your brand identity, tax compliance rates, and dine-in security.</p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configuration saved successfully.</span>
        </div>
      )}

      {/* Brand Profile Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft-sm">
        <h2 className="text-base font-serif font-bold text-slate-900 flex items-center space-x-2 mb-4">
          <Building className="w-4 h-4 text-teal-700" />
          <span>Hospitality Brand Profile</span>
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Restaurant Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tagline or Culinary Story</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Logo Image URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cover Banner URL</label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              Save Profile Details
            </button>
          </div>
        </form>
      </div>

      {/* Operational Settings Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft-sm">
        <h2 className="text-base font-serif font-bold text-slate-900 flex items-center space-x-2 mb-4">
          <Sliders className="w-4 h-4 text-teal-700" />
          <span>Taxes, Charges & Security Rules</span>
        </h2>

        <form onSubmit={handleSaveOperational} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GST / VAT Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={taxPercent}
                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Configurable tax percentage automatically calculated on all guest orders.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Optional Service Charge (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Hospitality service charge (set to 0 to disable).</p>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start space-x-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={pinRequired}
                onChange={(e) => setPinRequired(e.target.checked)}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="font-bold text-slate-800 block">Require 4-Digit Table Verification PIN</span>
                <span className="text-[11px] text-slate-500">
                  When enabled, customers scanning a table QR code must enter a short-lived PIN provided by their server to confirm physical presence.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              Update Operational Rules
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
