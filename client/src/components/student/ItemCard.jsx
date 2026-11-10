import QuantityStepper from '../common/QuantityStepper';
import { imgSrc } from '../../utils/imageUrl';
import { MAX_PER_ITEM } from '../../contexts/CartContext';

// cartQty: how many are in the cart. onAdd / onIncrement / onDecrement come from CartContext.
export default function ItemCard({ item, cartQty = 0, onAdd, onIncrement, onDecrement }) {
  const soldOut = item.quantity <= 0;
  const low = !soldOut && item.quantity <= 5;

  return (
    <div
      className={`flex gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 shadow-[0_2px_8px_-2px_rgba(26,26,26,0.04)] ${soldOut ? 'opacity-60' : ''}`}
    >
      {item.image_url ? (
        <img src={imgSrc(item.image_url)} alt="" className="h-20 w-20 flex-none rounded-xl object-cover" loading="lazy" />
      ) : (
        <div className="flex h-20 w-20 flex-none items-center justify-center rounded-xl bg-primary-container/10">
          <span className="material-symbols-outlined text-3xl text-primary-container">fastfood</span>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="truncate font-bold text-gray-900">{item.name}</h3>
          {item.category && <p className="text-xs text-gray-500">{item.category}</p>}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="font-extrabold text-primary">₹{item.price.toFixed(2)}</p>
            <p className={`text-xs font-semibold ${soldOut ? 'text-red-600' : low ? 'text-primary-container' : 'text-secondary'}`}>
              {soldOut ? 'Sold out' : low ? `Only ${item.quantity} left` : `${item.quantity} in stock`}
            </p>
          </div>
          {cartQty > 0 ? (
            <QuantityStepper
              value={cartQty}
              max={Math.min(item.quantity, MAX_PER_ITEM)}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
            />
          ) : (
            <button
              disabled={soldOut}
              onClick={onAdd}
              className="rounded-full bg-primary-container px-5 py-1.5 text-sm font-bold text-white disabled:bg-gray-300"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
