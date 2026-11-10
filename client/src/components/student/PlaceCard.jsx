import { Link } from 'react-router-dom';

export default function PlaceCard({ place }) {
  return (
    <Link
      to={`/place/${place.id}`}
      className="block overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-[0_2px_8px_-2px_rgba(26,26,26,0.04)] active:scale-[0.99]"
    >
      {place.image_url ? (
        <img src={place.image_url} alt="" className="h-36 w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-36 items-center justify-center bg-primary-container/10">
          <span className="material-symbols-outlined text-5xl text-primary-container">storefront</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="text-base font-bold text-gray-900">{place.name}</h3>
        {place.description && <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{place.description}</p>}
        {place.categories?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {place.categories.slice(0, 3).map((c) => (
              <span key={c} className="rounded-full border border-outline-variant bg-surface px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
