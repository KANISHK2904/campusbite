import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { API_BASE, imgSrc } from '../../utils/imageUrl';

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Bottom-sheet modal for adding/editing items.
 *
 * Props:
 *   open       – boolean
 *   onClose    – function
 *   onSave     – function(itemData) — async, should throw on error
 *   initial    – null | item object (for edit mode)
 */
export default function ItemFormModal({ open, onClose, onSave, initial }) {
  const { token } = useAdminAuth();
  const [form, setForm] = useState({
    name: '', price: '', quantity: '', category: '', is_available: true,
  });
  const [imageUrl, setImageUrl] = useState('');   // "/uploads/items/xxx.jpg" or ''
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        price: initial.price?.toString() || '',
        quantity: initial.quantity?.toString() || '',
        category: initial.category || '',
        is_available: initial.is_available !== 0,
      });
      setImageUrl(initial.image_url || '');
    } else {
      setForm({ name: '', price: '', quantity: '', category: '', is_available: true });
      setImageUrl('');
    }
    setError('');
    setUploading(false);
  }, [initial, open]);

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // Upload the chosen photo right away; the server returns its address
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets you pick the same file again later
    if (!file) return;
    if (!ALLOWED.includes(file.type)) return setError('Please choose a JPG, PNG or WebP image');
    if (file.size > MAX_BYTES) return setError('Image is too large. Max 2 MB');

    setError('');
    setUploading(true);
    try {
      const body = new FormData();
      body.append('image', file);
      const res = await fetch(`${API_BASE}/api/admin/upload/item-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // no Content-Type: the browser sets it for files
        body,
      });
      const data = await res.json().catch(() => null);
      if (res.status === 401) throw new Error('Your session expired. Please log in again.');
      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      setImageUrl(data.image_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (uploading) return setError('Please wait for the photo to finish uploading');
    if (!form.name.trim()) return setError('Item name is required');
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) return setError('Valid price is required');

    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity) || 0,
        category: form.category || null,
        image_url: imageUrl || null,
        is_available: form.is_available,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    // z-[100] puts the form ABOVE the bottom navigation bar, so Cancel / Save are never hidden
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end bg-inverse-surface/40 backdrop-blur-sm transition-opacity duration-300"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-h-[90vh] overflow-y-auto bg-surface-container-lowest rounded-t-2xl p-space-lg shadow-card-lg flex flex-col gap-space-md">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">fastfood</span>
            </div>
            <h2 className="text-headline-sm text-on-surface">
              {initial ? 'Edit Item' : 'Add New Item'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container text-label-md px-space-md py-space-sm rounded-xl">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
          {/* Photo */}
          <div className="flex flex-col gap-space-2xs">
            <span className="text-label-md text-on-surface-variant">Photo (optional)</span>
            <div className="flex items-center gap-space-md">
              <div className="w-20 h-20 rounded-xl bg-surface-container-low flex items-center justify-center overflow-hidden shrink-0">
                {uploading ? (
                  <span className="material-symbols-outlined animate-spin text-primary-container">progress_activity</span>
                ) : imageUrl ? (
                  <img src={imgSrc(imageUrl)} alt="Item preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[32px] text-outline">add_photo_alternate</span>
                )}
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="inline-flex items-center justify-center px-space-md py-2 rounded-full bg-surface-container text-on-surface text-label-md cursor-pointer active:scale-95 transition-transform">
                  {imageUrl ? 'Change photo' : 'Choose photo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFile}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {imageUrl && !uploading && (
                  <button type="button" onClick={() => setImageUrl('')} className="text-label-sm text-error text-left">
                    Remove photo
                  </button>
                )}
                <span className="text-body-sm text-on-surface-variant">JPG, PNG or WebP, up to 2 MB</span>
              </div>
            </div>
          </div>

          {/* Item Name */}
          <div className="flex flex-col gap-space-2xs">
            <label className="text-label-md text-on-surface-variant" htmlFor="item-name">
              Item name
            </label>
            <input
              id="item-name"
              type="text"
              placeholder="Enter item name (e.g. Veg Sandwich)"
              value={form.name}
              onChange={handleChange('name')}
              className="w-full bg-surface-container-low rounded-lg px-space-md py-3 text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-inner"
            />
          </div>

          {/* Price & Quantity */}
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-space-2xs">
              <label className="text-label-md text-on-surface-variant" htmlFor="item-price">
                Price (₹)
              </label>
              <input
                id="item-price"
                type="text"
                inputMode="decimal"
                placeholder="₹0.00"
                value={form.price}
                onChange={handleChange('price')}
                className="w-full bg-surface-container-low rounded-lg px-space-md py-3 text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-inner"
              />
            </div>
            <div className="flex flex-col gap-space-2xs">
              <label className="text-label-md text-on-surface-variant" htmlFor="item-qty">
                Available Quantity
              </label>
              <input
                id="item-qty"
                type="number"
                placeholder="e.g. 50"
                value={form.quantity}
                onChange={handleChange('quantity')}
                className="w-full bg-surface-container-low rounded-lg px-space-md py-3 text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-inner"
              />
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-space-2xs">
            <label className="text-label-md text-on-surface-variant" htmlFor="item-category">
              Category
            </label>
            <div className="relative flex items-center">
              <select
                id="item-category"
                value={form.category}
                onChange={handleChange('category')}
                className="w-full bg-surface-container-low rounded-lg px-space-md py-3 text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest appearance-none shadow-inner"
              >
                <option value="">Select category</option>
                <option value="Snacks">Snacks</option>
                <option value="Meals">Meals</option>
                <option value="Beverages">Beverages</option>
                <option value="Quick Bites">Quick Bites</option>
                <option value="Desserts">Desserts</option>
              </select>
              <span className="material-symbols-outlined text-[20px] text-outline absolute right-3 pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* In Stock Toggle */}
          <div className="flex flex-col gap-space-sm p-space-sm rounded-xl bg-surface-container-low">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-label-md text-on-surface">In Stock (Available now)</span>
                <span className="text-body-sm text-on-surface-variant">Students can purchase this item</span>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
                className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors shadow-inner
                  ${form.is_available ? 'bg-primary-container justify-end' : 'bg-surface-container-highest justify-start'}`}
              >
                <div className="w-5 h-5 bg-surface-container-lowest rounded-full shadow-md" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-space-sm pt-space-xs pb-space-sm">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-full bg-surface-container text-on-surface text-label-lg active:scale-95 transition-transform text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 py-3.5 rounded-full bg-primary-container text-on-primary text-label-lg shadow-card-md active:scale-95 transition-transform text-center disabled:opacity-50"
            >
              {saving ? 'Saving…' : uploading ? 'Uploading photo…' : (initial ? 'Update Item' : 'Save Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
