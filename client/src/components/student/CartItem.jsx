import QuantityStepper from '../common/QuantityStepper';
import { imgSrc } from '../../utils/imageUrl';
import { MAX_PER_ITEM } from '../../contexts/CartContext';

export default function CartItem({ line, onIncrement, onDecrement }) {
  const lineTotal = (Math.round(line.price * 100) * line.quantity) / 100;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 shadow-[0_2px_8px_-2px_rgba(26,26,26,0.04)]">
      {line.image_url ? (
        <img src={imgSrc(line.image_url)} alt="" className="h-16 w-16 flex-none rounded-xl object-cover" />
      ) : (
        <div className="flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-primary-container/10">
          <span className="material-symbols-outlined text-2xl text-primary-container">fastfood</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold text-gray-900">{line.name}</h3>
        <p className="text-sm text-gray-500">₹{line.price.toFixed(2)} each</p>
        <p className="mt-0.5 font-extrabold text-primary">₹{lineTotal.toFixed(2)}</p>
      </div>
      <QuantityStepper
        value={line.quantity}
        max={Math.min(line.stock, MAX_PER_ITEM)}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
      />
    </div>
  );
}
