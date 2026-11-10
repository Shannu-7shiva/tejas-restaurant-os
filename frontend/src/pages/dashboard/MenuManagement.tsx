import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, Plus, Edit2, Trash2, Search, 
  Check, X, Eye, EyeOff, Layers, Sparkles, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { MenuCategory, MenuItem } from '../../types';
import { VegBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export const MenuManagement: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('ALL');

  // Modal States
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Item Form State
  const [itemName, setItemName] = useState('');
  const [itemCatId, setItemCatId] = useState('');
  const [itemPrice, setItemPrice] = useState(0);
  const [itemDesc, setItemDesc] = useState('');
  const [itemImg, setItemImg] = useState('');
  const [itemIsVeg, setItemIsVeg] = useState(true);
  const [itemAllergens, setItemAllergens] = useState('');

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const fetchMenu = async () => {
    try {
      const [cats, allItems] = await Promise.all([
        api.getCategories(),
        api.getMenuItems()
      ]);
      setCategories(cats);
      setItems(allItems);
    } catch (err) {
      console.error('Failed to load menu data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const openCreateItemModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemCatId(categories[0]?.id || '');
    setItemPrice(0);
    setItemDesc('');
    setItemImg('');
    setItemIsVeg(true);
    setItemAllergens('');
    setItemModalOpen(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCatId(item.category_id);
    setItemPrice(item.price);
    setItemDesc(item.description || '');
    setItemImg(item.image_url || '');
    setItemIsVeg(item.is_veg);
    setItemAllergens(item.allergens?.join(', ') || '');
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemCatId) return;

    const allergensList = itemAllergens
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      if (editingItem) {
        const updated = await api.updateMenuItem(editingItem.id, {
          category_id: itemCatId,
          name: itemName.trim(),
          price: Number(itemPrice),
          description: itemDesc.trim() || null,
          image_url: itemImg.trim() || null,
          is_veg: itemIsVeg,
          allergens: allergensList,
        });
        setItems(prev => prev.map(i => i.id === editingItem.id ? updated : i));
      } else {
        const created = await api.createMenuItem({
          category_id: itemCatId,
          name: itemName.trim(),
          price: Number(itemPrice),
          description: itemDesc.trim() || null,
          image_url: itemImg.trim() || null,
          is_veg: itemIsVeg,
          allergens: allergensList,
          variants: [],
          addons: []
        });
        setItems(prev => [...prev, created]);
      }
      setItemModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save menu item.');
    }
  };

  const handleToggleAvailability = async (itemId: string) => {
    try {
      const res = await api.toggleItemAvailability(itemId);
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, is_available: res.is_available } : i));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle availability.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Archive this menu item? It will be safely removed from the menu while historical order records are protected.')) return;
    try {
      await api.deleteMenuItem(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err: any) {
      alert(err.message || 'Failed to archive item.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const created = await api.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim() || null,
        display_order: categories.length + 1
      });
      setCategories(prev => [...prev, created]);
      setNewCatName('');
      setNewCatDesc('');
      setCatModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create category.');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCatId === 'ALL' || item.category_id === selectedCatId;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">Menu Catalog Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Control culinary items, portions, live stock availability, and categories.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCatModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Add Category</span>
          </button>
          <button
            onClick={openCreateItemModal}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCatId('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${selectedCatId === 'ALL' ? 'bg-charcoal-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All Items ({items.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCatId(c.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${selectedCatId === c.id ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No menu items found</p>
          <p className="text-xs text-slate-400 mt-0.5">Click "Add Menu Item" above to create dishes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft-sm flex flex-col justify-between ${
                !item.is_available ? 'opacity-60 bg-slate-50' : ''
              }`}
            >
              <div>
                <div className="flex space-x-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-slate-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-300">
                      <UtensilsCrossed className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center space-x-1.5">
                      <VegBadge isVeg={item.is_veg} />
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{item.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                    <p className="text-sm font-bold text-slate-900 mt-1.5">₹{item.price}</p>
                  </div>
                </div>

                {item.allergens && item.allergens.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {item.allergens.map((alg) => (
                      <span key={alg} className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {alg}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                {/* Availability Switch */}
                <button
                  onClick={() => handleToggleAvailability(item.id)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    item.is_available 
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  {item.is_available ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{item.is_available ? 'In Stock' : 'Out of Stock'}</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditItemModal(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Edit Item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Archive Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      <Modal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItem ? 'Edit Menu Item' : 'Create New Menu Item'}
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dish Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Kashmiri Dum Aloo"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                required
                value={itemCatId}
                onChange={(e) => setItemCatId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹ INR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={itemPrice}
                onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dietary Classification</label>
            <div className="flex space-x-3 text-xs">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="veg"
                  checked={itemIsVeg === true}
                  onChange={() => setItemIsVeg(true)}
                  className="text-emerald-600"
                />
                <span>Pure Vegetarian</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="veg"
                  checked={itemIsVeg === false}
                  onChange={() => setItemIsVeg(false)}
                  className="text-rose-600"
                />
                <span>Non-Vegetarian</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Culinary background, key spices, texture..."
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL (Unsplash or CDN)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={itemImg}
              onChange={(e) => setItemImg(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Allergens (Comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Dairy, Nuts, Gluten"
              value={itemAllergens}
              onChange={(e) => setItemAllergens(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              {editingItem ? 'Update Menu Item' : 'Publish Dish to Menu'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="Add Menu Category"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Artisanal Breads, Mocktails"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              placeholder="Brief section subtitle..."
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              Save Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
