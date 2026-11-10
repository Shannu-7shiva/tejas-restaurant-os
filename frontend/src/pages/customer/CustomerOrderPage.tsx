import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingBag, Plus, Minus, Info, Check, 
  MapPin, Clock, AlertTriangle, Sparkles, ChefHat, ShieldCheck,
  Bot, Bell, Droplets, CreditCard, ChevronRight, X, Utensils, Star, Flame
} from 'lucide-react';
import { api } from '../../services/api';
import { Restaurant, RestaurantTable, MenuCategory, MenuItem, MenuItemVariant, MenuAddon } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { VegBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { AICustomerBot } from '../../components/customer/AICustomerBot';
import { PaymentModal } from '../../components/customer/PaymentModal';

export const CustomerOrderPage: React.FC = () => {
  const { slug = 'tejas', token } = useParams<{ slug?: string; token?: string }>();
  const navigate = useNavigate();
  const { cart, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal } = useCart();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [pinRequired, setPinRequired] = useState(false);
  const [categories, setCategories] = useState<MenuCategory[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');

  // Customization Modal State
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<MenuAddon[]>([]);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  // Cart Checkout Modal State
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tablePin, setTablePin] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [payOnlineImmediately, setPayOnlineImmediately] = useState(true);

  // AI Bot & Waiter Call Modal State
  const [aiBotOpen, setAiBotOpen] = useState(false);
  const [waiterToast, setWaiterToast] = useState<string | null>(null);

  // Dynamic Time Greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const fetchTableAndMenu = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const targetSlug = slug || 'tejas';

        // Load restaurant data
        const pubRes = await api.getPublicRestaurant(targetSlug);
        setRestaurant(pubRes);
        setCategories(pubRes.categories || []);
        if (pubRes.categories?.length > 0) {
          setActiveCategoryId(pubRes.categories[0].id);
        }

        // Load table data
        if (token) {
          const valRes = await api.validateTable(targetSlug, token);
          if (valRes.valid) {
            setTable(valRes.table);
            setPinRequired(valRes.pin_required);
          }
        }

        // Fetch tables for quick table selector
        try {
          const tablesList = await api.getPublicTables(targetSlug);
          setAvailableTables(tablesList);
          // If no table set from token, default to Table 1
          if (!token && tablesList.length > 0) {
            setTable(tablesList[0]);
            setPinRequired(tablesList[0].pin_required || false);
          }
        } catch {
          // fallback table
          if (!table) {
            setTable({
              id: 't-1',
              restaurant_id: pubRes.id,
              table_number: 'Table 1',
              capacity: 4,
              status: 'AVAILABLE' as any,
              qr_token: 'default-token',
              is_session_active: true,
              updated_at: new Date().toISOString()
            });
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load restaurant menu.');
      } finally {
        setLoading(false);
      }
    };

    fetchTableAndMenu();
  }, [slug, token]);

  const handleSelectTable = (tbl: any) => {
    setTable(tbl);
    setPinRequired(tbl.pin_required || false);
    setShowTablePicker(false);
    setWaiterToast(`Connected to ${tbl.table_number}!`);
    setTimeout(() => setWaiterToast(null), 3000);
  };

  const openCustomizeModal = (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedVariant(item.variants?.length > 0 ? item.variants[0] : null);
    setSelectedAddons([]);
    setItemQuantity(1);
    setItemNotes('');
    setModalOpen(true);
  };

  const handleQuickAdd = (item: MenuItem) => {
    if ((item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0)) {
      openCustomizeModal(item);
    } else {
      addItem({
        menu_item_id: item.id,
        name: item.name,
        base_price: item.price,
        unit_price: item.price,
        quantity: 1,
        addons: [],
        image_url: item.image_url,
      });
      setWaiterToast(`Added ${item.name} to cart`);
      setTimeout(() => setWaiterToast(null), 2500);
    }
  };

  const handleConfirmAddCustomized = () => {
    if (!selectedItem) return;

    let effectivePrice = selectedItem.price;
    if (selectedVariant) {
      effectivePrice += selectedVariant.price_modifier;
    }
    const addonPrice = selectedAddons.reduce((acc, a) => acc + a.price, 0);
    effectivePrice += addonPrice;

    addItem({
      menu_item_id: selectedItem.id,
      name: selectedItem.name,
      base_price: selectedItem.price,
      unit_price: effectivePrice,
      quantity: itemQuantity,
      variant_name: selectedVariant ? selectedVariant.name : undefined,
      addons: selectedAddons.map(a => ({ addon_id: a.id || '', name: a.name, unit_price: a.price })),
      notes: itemNotes.trim() ? itemNotes.trim() : undefined,
      image_url: selectedItem.image_url,
    });

    setModalOpen(false);
    setWaiterToast(`Added customized ${selectedItem.name}`);
    setTimeout(() => setWaiterToast(null), 2500);
  };

  const toggleAddon = (addon: MenuAddon) => {
    if (selectedAddons.some(a => a.name === addon.name)) {
      setSelectedAddons(prev => prev.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddons(prev => [...prev, addon]);
    }
  };

  // Submit Order to backend
  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    const effectiveQrToken = table?.qr_token || token || '2eLHtPAlFUQRIHF2RN0YkzjKd97m5cAb';
    const effectiveSlug = restaurant?.slug || slug || 'tejas';

    setIsSubmittingOrder(true);
    setOrderError(null);

    try {
      const orderPayload = {
        restaurant_slug: effectiveSlug,
        qr_token: effectiveQrToken,
        session_pin: pinRequired ? tablePin : undefined,
        customer_name: customerName.trim() || 'Guest Patron',
        customer_phone: customerPhone.trim() || undefined,
        special_notes: orderNotes.trim() || undefined,
        items: cart.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          variant_name: item.variant_name,
          notes: item.notes,
          addons: item.addons,
        })),
        idempotency_key: `order-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };

      const result = await api.placeOrder(orderPayload);
      clearCart();
      setCartModalOpen(false);
      navigate(`/order/status/${result.id}`);
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleCallWaiterQuick = async (requestType = 'ASSISTANCE') => {
    try {
      const effectiveSlug = restaurant?.slug || slug || 'tejas';
      const tblNum = table?.table_number || 'Table 1';
      await api.callWaiter(effectiveSlug, {
        table_number: tblNum,
        request_type: requestType,
        notes: 'Mobile one-tap assistance request',
      });
      setWaiterToast(`🔔 Server alerted for ${tblNum}! A waiter is arriving shortly.`);
      setTimeout(() => setWaiterToast(null), 4000);
    } catch {
      setWaiterToast('Staff alerted!');
      setTimeout(() => setWaiterToast(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center font-serif text-3xl font-bold animate-pulse shadow-glow-gold mb-4">
          T
        </div>
        <h2 className="font-serif text-xl font-bold tracking-wide text-amber-200">Tejas Fine Dining</h2>
        <p className="text-slate-400 text-xs mt-1">Preparing your culinary gateway & fresh menu...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-16 h-16 rounded-full bg-rose-900/40 border border-rose-500/50 text-rose-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-white mb-2">Welcome to Tejas</h2>
        <p className="text-slate-300 max-w-md text-sm mb-6">{errorMsg}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-500 transition-colors shadow-soft"
        >
          Reload Menu
        </button>
      </div>
    );
  }

  const taxPercent = restaurant?.settings?.tax_rate_percent ?? 5.0;
  const serviceChargePercent = restaurant?.settings?.service_charge_percent ?? 0.0;
  const estimatedTax = (subtotal * taxPercent) / 100;
  const estimatedService = (subtotal * serviceChargePercent) / 100;
  const estimatedTotal = subtotal + estimatedTax + estimatedService;

  // Filter items
  const filteredCategories = categories.map(cat => {
    const items = cat.items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDiet = 
        dietaryFilter === 'ALL' ? true :
        dietaryFilter === 'VEG' ? item.is_veg : !item.is_veg;
      return matchesSearch && matchesDiet && item.is_available;
    });
    return { ...cat, items };
  }).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-32 font-sans selection:bg-amber-500 selection:text-black">
      {/* Toast Notification */}
      {waiterToast && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center justify-between text-xs font-semibold animate-slide-down border border-amber-400/30">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-200" />
            {waiterToast}
          </span>
          <button onClick={() => setWaiterToast(null)} className="p-1 hover:bg-white/20 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hero Header with Brand Greeting */}
      <div className="relative h-64 sm:h-76 w-full overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
        <img
          src={restaurant?.cover_image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=80'}
          alt="Tejas Restaurant Ambiance"
          className="w-full h-full object-cover opacity-35 scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

        {/* Top Badges Bar: Table Picker & Assistance */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => setShowTablePicker(true)}
            className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/30 text-amber-300 text-xs font-bold shadow-soft hover:bg-slate-800 transition-all active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{table?.table_number || 'Table 1'}</span>
            <span className="text-slate-400 text-[10px]">• Switch</span>
          </button>

          <button
            onClick={() => handleCallWaiterQuick('ASSISTANCE')}
            className="flex items-center space-x-1.5 bg-amber-500/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-400/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 active:scale-95 transition-all"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Call Waiter</span>
          </button>
        </div>

        {/* Brand Greeting Card */}
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6">
          <div className="flex items-end space-x-3.5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-glow-gold flex-shrink-0 bg-slate-900">
              <div className="w-full h-full bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-600 flex items-center justify-center font-serif text-3xl font-extrabold text-white">
                T
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                  {getTimeGreeting()} ✨
                </span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span>4.9 (1.2k+ reviews)</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white drop-shadow-md mt-1">
                Tejas
              </h1>
              <p className="text-xs text-amber-200/90 line-clamp-1">
                Luxury Indian & Contemporary Fine Dining • Charcoal Sigri Mastery
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-300">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>{restaurant?.address || 'Fine Dining Pavilion'}</span>
                </span>
                <span className="flex items-center space-x-1 text-emerald-400">
                  <Flame className="w-3 h-3" />
                  <span className="font-semibold">Kitchen Fire Active</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Search and Filter Controls */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 shadow-2xl">
        <div className="max-w-4xl mx-auto space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search succulent kebabs, biryanis, desserts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm text-white placeholder:text-slate-400 shadow-inner transition-all"
            />
          </div>

          {/* Dietary Filter Buttons & AI Trigger */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDietaryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  dietaryFilter === 'ALL'
                    ? 'bg-amber-600 text-white shadow-soft ring-1 ring-amber-400/50'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                All Menu
              </button>
              <button
                onClick={() => setDietaryFilter('VEG')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                  dietaryFilter === 'VEG'
                    ? 'bg-emerald-600 text-white shadow-soft ring-1 ring-emerald-400/50'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-emerald-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Pure Veg</span>
              </button>
              <button
                onClick={() => setDietaryFilter('NON_VEG')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                  dietaryFilter === 'NON_VEG'
                    ? 'bg-rose-700 text-white shadow-soft ring-1 ring-rose-400/50'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-rose-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span>Non-Veg</span>
              </button>
            </div>

            {/* AI Concierge Trigger Button */}
            <button
              onClick={() => setAiBotOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600/30 to-yellow-600/30 border border-amber-500/40 text-amber-300 font-bold hover:bg-amber-600/40 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ask AI Bot</span>
            </button>
          </div>

          {/* Category Horizontal Scroll Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`#cat-${cat.id}`}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                  activeCategoryId === cat.id
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-glow-gold'
                    : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {cat.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Categories List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-10">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80">
            <ChefHat className="w-12 h-12 text-amber-400/50 mx-auto mb-3" />
            <p className="text-white font-serif text-lg font-bold">No dishes match your criteria</p>
            <p className="text-slate-400 text-xs mt-1">Try resetting dietary filters or ask our AI Help Desk.</p>
            <button
              onClick={() => {
                setDietaryFilter('ALL');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-36">
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight flex items-center space-x-2">
                  <span>{cat.name}</span>
                  <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/20 font-bold">
                    {cat.items.length} dishes
                  </span>
                </h2>
                {cat.description && (
                  <p className="text-xs text-slate-400 mt-1">{cat.description}</p>
                )}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cat.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800/90 hover:border-amber-500/30 shadow-soft hover:shadow-glow-gold transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="flex space-x-3.5">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <VegBadge isVeg={item.is_veg} />
                          <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                            {item.name}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                        {item.allergens && item.allergens.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.allergens.map((alg) => (
                              <span key={alg} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/20">
                                {alg}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 flex items-baseline space-x-2">
                          <span className="text-base font-bold text-amber-400 font-sans">
                            ₹{item.price.toFixed(0)}
                          </span>
                          {(item.variants?.length > 0 || item.addons?.length > 0) && (
                            <span className="text-[10px] text-slate-400">Customizable</span>
                          )}
                        </div>
                      </div>

                      {/* Image Thumbnail & Add Button */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/80 shadow-md">
                          <img
                            src={item.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80'}
                            alt={item.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <button
                          onClick={() => handleQuickAdd(item)}
                          className="mt-2 w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white text-xs font-bold uppercase tracking-wider shadow active:scale-95 transition-all flex items-center justify-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}

        {/* Discreet Staff Portal Link */}
        <div className="pt-8 pb-4 text-center text-xs border-t border-slate-900/80">
          <p className="font-serif text-slate-400 font-semibold">Tejas Fine Dining</p>
          <a
            href="/login"
            className="inline-flex items-center gap-1.5 mt-2.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-400/80 hover:text-amber-300 border border-slate-800 text-[11px] transition-colors"
          >
            <span>👨‍🍳 Staff Login (Kitchen KDS & Manager Portal)</span>
            <span>→</span>
          </a>
        </div>
      </div>

      {/* Floating Bottom Navigation Bar for Mobile */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-amber-500/20 px-4 py-2.5 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Quick AI Concierge Launch */}
          <button
            onClick={() => setAiBotOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-amber-500/30 text-amber-300 font-bold text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-soft"
          >
            <Bot className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">AI Help Desk</span>
            <span className="sm:hidden">AI Bot</span>
          </button>

          {/* Quick Water Request */}
          <button
            onClick={() => handleCallWaiterQuick('WATER')}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-sky-400 font-bold text-xs hover:bg-slate-800 transition-all active:scale-95"
          >
            <Droplets className="w-4 h-4" />
            <span>Water</span>
          </button>

          {/* Cart Floating Drawer Button */}
          <button
            onClick={() => setCartModalOpen(true)}
            disabled={itemCount === 0}
            className={`flex-1 flex items-center justify-between px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm tracking-wide shadow-glow-gold transition-all active:scale-98 ${
              itemCount > 0
                ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white'
                : 'bg-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{itemCount > 0 ? `${itemCount} Items` : 'Cart Empty'}</span>
            </div>
            <span>₹{subtotal.toFixed(0)}</span>
          </button>
        </div>
      </div>

      {/* Table Switcher Modal */}
      {showTablePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-amber-500/30 p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-white">Select Your Table</h3>
                <p className="text-xs text-slate-400">Choose your current dine-in table at Tejas</p>
              </div>
              <button onClick={() => setShowTablePicker(false)} className="p-1 rounded-full bg-slate-800 text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto no-scrollbar">
              {availableTables.map((tbl) => (
                <button
                  key={tbl.id}
                  onClick={() => handleSelectTable(tbl)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    table?.id === tbl.id
                      ? 'bg-amber-600 border-amber-400 text-white shadow-glow-gold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs">{tbl.table_number}</p>
                  <p className="text-[10px] text-amber-200/80 mt-0.5">Cap: {tbl.capacity} Guests</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customization Modal */}
      {modalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="w-full sm:max-w-md bg-slate-900 text-white rounded-t-3xl sm:rounded-3xl border border-amber-500/20 p-5 max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <VegBadge isVeg={selectedItem.is_veg} />
                  <h3 className="font-serif font-bold text-lg">{selectedItem.name}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedItem.description}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-full bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Variants */}
            {selectedItem.variants && selectedItem.variants.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Select Portion / Style
                </label>
                <div className="space-y-2">
                  {selectedItem.variants.map((v) => (
                    <button
                      key={v.id || v.name}
                      onClick={() => setSelectedVariant(v)}
                      className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                        selectedVariant?.name === v.name
                          ? 'bg-amber-600/30 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                          : 'bg-slate-800/70 border-slate-700 text-slate-300'
                      }`}
                    >
                      <span>{v.name}</span>
                      <span>{v.price_modifier > 0 ? `+₹${v.price_modifier}` : 'Included'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Addons */}
            {selectedItem.addons && selectedItem.addons.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Chef Accompaniments & Addons
                </label>
                <div className="space-y-2">
                  {selectedItem.addons.map((a) => {
                    const isSelected = selectedAddons.some(x => x.name === a.name);
                    return (
                      <button
                        key={a.id || a.name}
                        onClick={() => toggleAddon(a)}
                        className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                          isSelected
                            ? 'bg-amber-600/30 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                            : 'bg-slate-800/70 border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${isSelected ? 'bg-amber-600 border-amber-400 text-white' : 'border-slate-600'}`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <span>{a.name}</span>
                        </div>
                        <span>+₹{a.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special Preparation Notes */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Spice Level & Notes for Chef
              </label>
              <input
                type="text"
                placeholder="e.g. Mild spice, no onions, extra crispy"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Confirm Add */}
            <div className="mt-5 flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-slate-800 px-3 py-2 rounded-xl">
                <button
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  className="text-slate-400 hover:text-white"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold w-5 text-center">{itemQuantity}</span>
                <button
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                  className="text-slate-400 hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleConfirmAddCustomized}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold text-xs uppercase tracking-wider shadow-glow-gold active:scale-95 transition-all"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart & Checkout Modal */}
      {cartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-lg bg-slate-900 text-white rounded-t-3xl sm:rounded-3xl border border-amber-500/20 p-5 max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Your Dining Table Order</h3>
                <p className="text-xs text-amber-400">{table?.table_number || 'Table 1'} • Dine-in Experience</p>
              </div>
              <button onClick={() => setCartModalOpen(false)} className="p-1 rounded-full bg-slate-800 text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            {orderError && (
              <div className="mt-3 p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs">
                {orderError}
              </div>
            )}

            {/* Cart Items */}
            <div className="divide-y divide-slate-800/80 my-3 flex-1 overflow-y-auto max-h-60 no-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex-1 pr-3">
                    <p className="font-bold text-xs sm:text-sm text-white">{item.name}</p>
                    {item.variant_name && (
                      <p className="text-[11px] text-amber-300">{item.variant_name}</p>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <p className="text-[10px] text-slate-400">+ {item.addons.map(a => a.name).join(', ')}</p>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-amber-400 italic">"{item.notes}"</p>
                    )}
                    <p className="text-xs font-semibold text-slate-300 mt-0.5">₹{item.unit_price} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2 bg-slate-800 px-2.5 py-1 rounded-lg">
                      <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400 hover:text-white">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400 hover:text-white">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-amber-400 w-14 text-right">
                      ₹{(item.unit_price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Guest Details */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Guest Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Vikram"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl bg-slate-800 text-white border border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl bg-slate-800 text-white border border-slate-700"
                  />
                </div>
              </div>

              {pinRequired && (
                <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl">
                  <label className="block text-xs font-bold text-amber-300 mb-1">Table Presence PIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="4-digit PIN"
                    value={tablePin}
                    onChange={(e) => setTablePin(e.target.value)}
                    className="w-32 text-center font-mono tracking-widest text-sm p-1.5 rounded-lg bg-slate-900 border border-amber-400/50 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Chef Order Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Serve starters first, anniversary dinner"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-slate-800 text-white border border-slate-700"
                />
              </div>

              {/* Price Calculation */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST ({taxPercent}%)</span>
                  <span className="font-semibold text-white">₹{estimatedTax.toFixed(2)}</span>
                </div>
                {serviceChargePercent > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Service Charge ({serviceChargePercent}%)</span>
                    <span className="font-semibold text-white">₹{estimatedService.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-white pt-1.5 border-t border-slate-800">
                  <span>Total Payable</span>
                  <span className="text-amber-400">₹{estimatedTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit & Send to Kitchen */}
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmittingOrder || cart.length === 0}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-glow-gold flex items-center justify-center space-x-2 transition-all mt-2"
              >
                {isSubmittingOrder ? (
                  <span>Sending Order to Kitchen...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-200" />
                    <span>Send Order to Kitchen • ₹{estimatedTotal.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tejas AI Dining Concierge Help Desk Bot */}
      <AICustomerBot
        restaurantSlug={restaurant?.slug || slug || 'tejas'}
        tableNumber={table?.table_number || 'Table 1'}
        isOpen={aiBotOpen}
        onClose={() => setAiBotOpen(false)}
      />
    </div>
  );
};
