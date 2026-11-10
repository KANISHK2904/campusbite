import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../hooks/studentApi';
import { useCart } from '../../contexts/CartContext';
import TopBar from '../../components/common/TopBar';
import BottomNav from '../../components/common/BottomNav';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ItemCard from '../../components/student/ItemCard';

const POLL_MS = 15000; // live stock refresh

export default function PlaceMenu() {
  const { id } = useParams();
  const { count, subtotal, addItem, increment, decrement, quantityOf, syncStock } = useCart();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [category, setCategory] = useState('All');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await api(`/api/places/${id}/items`);
        if (cancelled) return;
        setData(res);
        setStatus('ready');
        syncStock(res.place.id, res.items); // keep cart quantities within real stock
      } catch (err) {
        if (cancelled) return;
        // Keep showing the last good data if a background refresh fails.
        setStatus((s) => (s === 'ready' ? s : err.status === 404 ? 'notfound' : 'error'));
      }
    };

    load();
    const timer = setInterval(() => !document.hidden && load(), POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, [id, syncStock]);

  const categories = useMemo(
    () => ['All', ...new Set((data?.items || []).map((i) => i.category).filter(Boolean))],
    [data]
  );
  const items = (data?.items || []).filter((i) => category === 'All' || i.category === category);

  return (
    <div className={`min-h-screen bg-surface ${count > 0 ? 'pb-40' : 'pb-24'}`}>
      <TopBar title={data?.place?.name || 'Menu'} back />
      <main className="mx-auto max-w-md px-4">
        {status === 'loading' && <LoadingSpinner />}
        {status === 'notfound' && (
          <EmptyState icon="store" title="This place isn't available" message="It may be closed right now." />
        )}
        {status === 'error' && (
          <EmptyState icon="wifi_off" title="Couldn't load the menu" message="Check your connection and try again." />
        )}

        {status === 'ready' && (
          <>
            {data.place.description && <p className="mb-4 text-sm text-gray-500">{data.place.description}</p>}

            {categories.length > 1 && (
              <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`flex-none rounded-full border px-4 py-1.5 text-sm font-semibold ${
                      category === c
                        ? 'border-primary-container bg-primary-container text-white'
                        : 'border-outline-variant bg-surface-container-lowest text-gray-600'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {items.length === 0 ? (
              <EmptyState icon="restaurant_menu" title="Nothing on the menu yet" message="This place hasn't added any items." />
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    cartQty={quantityOf(item.id)}
                    onAdd={() => addItem(item, data.place)}
                    onIncrement={() => increment(item.id)}
                    onDecrement={() => decrement(item.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {count > 0 && (
        <Link
          to="/cart"
          className="fixed inset-x-4 bottom-20 z-20 mx-auto flex max-w-md items-center justify-between rounded-full bg-primary-container px-6 py-3 font-bold text-white shadow-lg"
        >
          <span>View cart · {count} {count === 1 ? 'item' : 'items'}</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </Link>
      )}
      <BottomNav />
    </div>
  );
}
