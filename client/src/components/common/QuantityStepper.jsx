export default function QuantityStepper({ value, max = Infinity, onIncrement, onDecrement }) {
  return (
    <div className="inline-flex items-center rounded-full border border-outline-variant bg-surface-container-lowest">
      <button
        onClick={onDecrement}
        aria-label={value <= 1 ? 'Remove item' : 'Decrease quantity'}
        className="flex h-8 w-8 items-center justify-center text-primary"
      >
        <span className="material-symbols-outlined text-xl">{value <= 1 ? 'delete' : 'remove'}</span>
      </button>
      <span className="w-6 text-center text-sm font-bold text-gray-900">{value}</span>
      <button
        onClick={onIncrement}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="flex h-8 w-8 items-center justify-center text-primary disabled:text-gray-300"
      >
        <span className="material-symbols-outlined text-xl">add</span>
      </button>
    </div>
  );
}
