import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import TopBar from '../../components/common/TopBar';
import BottomNav from '../../components/common/BottomNav';
import EmptyState from '../../components/common/EmptyState';
import CartItem from '../../components/student/CartItem';

export default function Cart() {
  const navigate = useNavigate();
  const { lines, placeName, placeId, count, subtotal, increment, decrement, clearCart } = useCart();

  return (
    <div className="min-h-screen bg-surface pb-40">
      <TopBar title="Your cart" back />
      <main className="mx-auto max-w-md px-4">
        {lines.length === 0 ? (
          <EmptyState
            icon="shopping_cart"
            title="Your cart is empty"
            message="Pick something tasty from a campus food spot."
            action={
              <Link to="/" className="mt-6 rounded-full bg-primary-container px-6 py-2.5 font-bold text-white">
                Browse places
              </Link>
            }
          />
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <Link to={`/place/${placeId}`} className="text-sm font-semibold text-primary">
                From {placeName}
              </Link>
              <button onClick={() => window.confirm('Remove everything from your cart?') && clearCart()} className="text-sm text-gray-500">
                Clear
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line) => (
                <CartItem
                  key={line.id}
                  line={line}
                  onIncrement={() => increment(line.id)}
                  onDecrement={() => decrement(line.id)}
                />
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Items ({count})</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between text-lg font-extrabold text-gray-900">
                <span>Total</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </main>

      {lines.length > 0 && (
        <div className="fixed inset-x-4 bottom-20 z-20 mx-auto max-w-md">
          <button
            onClick={() => navigate('/payment')}
            className="w-full rounded-full bg-primary-container px-6 py-3 font-bold text-white shadow-lg"
          >
            Proceed to pay · ₹{subtotal.toFixed(2)}
          </button>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
