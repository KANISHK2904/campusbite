import { useEffect, useState, useMemo } from 'react';
import AdminTopBar from '../../components/common/AdminTopBar';
import AdminBottomNav from '../../components/common/AdminBottomNav';
import EmptyState from '../../components/common/EmptyState';
import ItemFormModal from '../../components/admin/ItemFormModal';
import { useAdminApi } from '../../hooks/useApi';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export default function Inventory() {
  const apiFetch = useAdminApi();
  const { admin } = useAdminAuth();
  const [items, setItems]             = useState([]);
  const [place, setPlace]             = useState(null);
  const [placeName, setPlaceName]     = useState('');
  const [placeNameSaving, setPNS]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [activeCategory, setActiveCat] = useState('All');
  const [modalOpen, setModalOpen]     = useState(false);
  const [editItem, setEditItem]       = useState(null);

  // ── data fetch ──
  const fetchData = async () => {
    try {
      const [placeData, itemsData] = await Promise.all([
        apiFetch('/api/admin/place'),
        apiFetch('/api/admin/items'),
      ]);
      setPlace(placeData.place);
      setPlaceName(placeData.place?.name || '');
      setItems(itemsData.items);
    } catch { /* handled */ }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  // ── derived state ──
  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [items]);

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return items;
    return items.filter(i => i.category === activeCategory);
  }, [items, activeCategory]);

  const metrics = useMemo(() => ({
    active:  items.filter(i => i.is_available).length,
    cats:    new Set(items.map(i => i.category).filter(Boolean)).size,
    outOfSt: items.filter(i => i.quantity === 0).length,
  }), [items]);

  // ── handlers ──
  const savePlaceName = async () => {
    if (!placeName.trim() || placeName === place?.name) return;
    setPNS(true);
    try {
      const data = await apiFetch('/api/admin/place', {
        method: 'PUT',
        body: JSON.stringify({ name: placeName }),
      });
      setPlace(data.place);
    } catch { /* handled */ }
    setPNS(false);
  };

  const handleSaveItem = async (itemData) => {
    if (editItem) {
      const data = await apiFetch(`/api/admin/items/${editItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(itemData),
      });
      setItems(prev => prev.map(i => i.id === editItem.id ? data.item : i));
    } else {
      const data = await apiFetch('/api/admin/items', {
        method: 'POST',
        body: JSON.stringify(itemData),
      });
      setItems(prev => [data.item, ...prev]);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    await apiFetch(`/api/admin/items/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleToggleAvail = async (item) => {
    const data = await apiFetch(`/api/admin/items/${item.id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ is_available: !item.is_available }),
    });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: data.is_available ? 1 : 0 } : i));
  };

  const openAdd = () => { setEditItem(null); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); setModalOpen(true); };

  if (loading) return (
    <div className="bg-surface min-h-screen flex items-center justify-center">
      <span className="material-symbols-outlined text-primary-container animate-spin text-[32px]">progress_activity</span>
    </div>
  );

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      <AdminTopBar title="Admin Dashboard" />
      <main className="flex flex-col relative w-full pt-16 pb-24 bg-surface min-h-screen">
        <div className="flex flex-col w-full px-margin pb-space-2xl gap-space-lg">
          {/* Header */}
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-headline-sm text-on-surface">Manage Inventory</span>
                <span className="text-body-sm text-on-surface-variant">Live campus dining catalog &amp; availability</span>
              </div>
              <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-secondary-container text-on-secondary-container shadow-sm">
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                <span className="text-label-md uppercase tracking-wider">Store Open</span>
              </div>
            </div>

            {/* Place Name */}
            <div className="flex flex-col gap-space-xs p-space-md rounded-xl bg-surface-container-lowest shadow-card">
              <div className="flex items-center justify-between">
                <label className="text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="outlet-name-input">
                  Campus Outlet / Place Name
                </label>
                <span className="material-symbols-outlined text-[18px] text-primary-container">edit_note</span>
              </div>
              <input
                id="outlet-name-input"
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                onBlur={savePlaceName}
                placeholder="Enter place or outlet name..."
                className="w-full bg-surface-container-low rounded-lg px-space-md py-2.5 text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-inner"
              />
              <p className="text-body-sm text-on-surface-variant">
                Items added below will appear under this place menu for students.
                {placeNameSaving && <span className="ml-2 text-primary">Saving…</span>}
              </p>
            </div>
          </section>

          {/* Metrics */}
          <section className="grid grid-cols-3 gap-space-xs">
            <div className="flex flex-col p-space-sm rounded-xl bg-surface-container-lowest shadow-card items-center text-center">
              <span className="text-headline-md text-on-surface">{metrics.active}</span>
              <span className="text-label-sm text-on-surface-variant">Active Items</span>
            </div>
            <div className="flex flex-col p-space-sm rounded-xl bg-surface-container-lowest shadow-card items-center text-center">
              <span className="text-headline-md text-on-surface">{metrics.cats}</span>
              <span className="text-label-sm text-on-surface-variant">Categories</span>
            </div>
            <div className="flex flex-col p-space-sm rounded-xl bg-surface-container-lowest shadow-card items-center text-center">
              <span className="text-headline-md text-error">{metrics.outOfSt}</span>
              <span className="text-label-sm text-on-surface-variant">Out of Stock</span>
            </div>
          </section>

          {/* Filter chips */}
          <section className="flex items-center gap-space-xs overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const count = cat === 'All' ? items.length : items.filter(i => i.category === cat).length;
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`flex items-center px-space-md py-1.5 rounded-full text-label-md whitespace-nowrap shadow-sm transition-colors
                    ${active ? 'bg-primary-container text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'}`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </section>

          {/* Items list or empty state */}
          {filtered.length === 0 ? (
            <EmptyState
              icon="inventory_2"
              title="No items added yet"
              body="Tap + to add your first item and start serving hungry students."
              action={{ label: 'Create First Item', onClick: openAdd }}
            />
          ) : (
            <section className="flex flex-col gap-space-sm">
              {filtered.map((item) => (
                <div key={item.id} className="p-space-md rounded-xl bg-surface-container-lowest shadow-card flex items-center justify-between gap-space-md">
                  <div className="flex items-center gap-space-md min-w-0 flex-1"
                    onClick={() => openEdit(item)} role="button" tabIndex={0}>
                    <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center text-outline shrink-0">
                      <span className="material-symbols-outlined text-[28px]">restaurant</span>
                    </div>
                    <div className="flex flex-col min-w-0 gap-0.5">
                      <span className="text-title-md text-on-surface truncate">{item.name}</span>
                      {item.category && (
                        <span className="text-label-md text-outline truncate">{item.category}</span>
                      )}
                      <span className="text-body-sm text-on-surface-variant">₹{parseFloat(item.price).toFixed(2)} · Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleAvail(item)}
                      className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors
                        ${item.is_available ? 'bg-primary-container justify-end' : 'bg-surface-container-highest justify-start'}`}
                    >
                      <div className="w-5 h-5 bg-surface-container-lowest rounded-full shadow-sm" />
                    </button>
                    <button onClick={() => handleDelete(item.id)}
                      className="text-error text-label-sm flex items-center gap-0.5 opacity-60 hover:opacity-100">
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>

      {/* FAB */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-space-lg h-14 rounded-full bg-primary-container text-on-primary text-label-lg shadow-card-lg active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[24px]">add</span>
          <span>Add Item</span>
        </button>
      </div>

      <ItemFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSave={handleSaveItem}
        initial={editItem}
      />
      <AdminBottomNav />
    </div>
  );
}
