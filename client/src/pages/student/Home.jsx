import { useEffect, useMemo, useState } from 'react';
import { api } from '../../hooks/studentApi';
import TopBar from '../../components/common/TopBar';
import BottomNav from '../../components/common/BottomNav';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PlaceCard from '../../components/student/PlaceCard';

export default function Home() {
  const [places, setPlaces] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    let cancelled = false;
    api('/api/places')
      .then((data) => {
        if (cancelled) return;
        setPlaces(data);
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(
    () => ['All', ...new Set(places.flatMap((p) => p.categories))],
    [places]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places.filter(
      (p) =>
        (category === 'All' || p.categories.includes(category)) &&
        (!q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
    );
  }, [places, query, category]);

  return (
    <div className="min-h-screen bg-surface pb-24">
      <TopBar title="CampusBite" />
      <main className="mx-auto max-w-md px-4">
        <label className="relative block">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search canteens and shops"
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-3 pl-11 pr-4 outline-none focus:border-primary"
          />
        </label>

        {categories.length > 1 && (
          <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
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

        <div className="mt-5 space-y-4">
          {status === 'loading' && <LoadingSpinner />}
          {status === 'error' && (
            <EmptyState icon="wifi_off" title="Couldn't load places" message="Check your connection and refresh the page." />
          )}
          {status === 'ready' && visible.length === 0 && (
            <EmptyState
              icon="storefront"
              title={places.length ? 'No matches' : 'No places open right now'}
              message={places.length ? 'Try a different search or category.' : 'Check back soon.'}
            />
          )}
          {status === 'ready' && visible.map((p) => <PlaceCard key={p.id} place={p} />)}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
