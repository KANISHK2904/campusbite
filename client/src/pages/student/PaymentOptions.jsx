import { useRef, useState } from 'react';                          // ← FIX (added useRef)
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../../hooks/studentApi';
import useRazorpay from '../../hooks/useRazorpay';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import TopBar from '../../components/common/TopBar';

export default function PaymentOptions() {
  const navigate = useNavigate();
  const openCheckout = useRazorpay();
  const { user } = useAuth();
  const { lines, placeId, placeName, count, subtotal, clearCart } = useCart();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unconfirmed, setUnconfirmed] = useState(null); // payment succeeded but we could not confirm it yet
  const [demoOrder, setDemoOrder] = useState(null);     // PAYMENT_MODE=demo: shows the fake pay panel
  const completed = useRef(false);                       // ← FIX: true once the order is confirmed

  if (completed.current) return null;                    // ← FIX: don't bounce to /cart after the cart is cleared
  if (lines.length === 0 && !unconfirmed) return <Navigate to="/cart" replace />;

  // Ask the server to confirm the payment and create the order
  const confirm = async (response) => {
    setBusy(true);
    setError('');
    try {
      const res = await api('/api/orders/verify-payment', {
        method: 'POST',
        body: {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        },
      });
      completed.current = true;                          // ← FIX
      setUnconfirmed(null);
      setDemoOrder(null);
      clearCart();
      navigate(`/order-success/${res.order.id}`, { replace: true });
    } catch (err) {
      if ([400, 404, 409].includes(err.status)) {
        // Definite answer from the server (e.g. sold out, refund started): no point retrying
        setUnconfirmed(null);
        setDemoOrder(null);
        setError(err.message);
      } else {
        // Network or server hiccup AFTER paying: keep the receipt so the student can retry safely
        setUnconfirmed(response);
        setError("We couldn't confirm your payment yet. Please don't pay again, tap Retry below.");
      }
      setBusy(false);
    }
  };

  const pay = async () => {
    setBusy(true);
    setError('');
    try {
      const order = await api('/api/orders/create-razorpay', {
        method: 'POST',
        body: { placeId, items: lines.map((l) => ({ itemId: l.id, quantity: l.quantity })) },
      });

      // Demo mode: no Razorpay popup, show our own fake pay panel instead
      if (order.mode === 'demo') {
        setDemoOrder(order);
        setBusy(false);
        return;
      }

      const response = await openCheckout({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'CampusBite',
        description: order.placeName,
        order_id: order.razorpayOrderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#FF6B35' },
      });
      await confirm(response);
    } catch (err) {
      if (!err.cancelled) setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-10">
      <TopBar title="Payment" back />
      <main className="mx-auto max-w-md px-4">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
          <p className="text-sm text-gray-500">Order from</p>
          <h2 className="text-lg font-extrabold text-gray-900">{placeName}</h2>

          <ul className="mt-3 divide-y divide-outline-variant text-sm">
            {lines.map((l) => (
              <li key={l.id} className="flex justify-between py-2">
                <span className="text-gray-700">{l.quantity} × {l.name}</span>
                <span className="font-semibold">₹{((Math.round(l.price * 100) * l.quantity) / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex justify-between border-t border-outline-variant pt-3 text-lg font-extrabold text-gray-900">
            <span>Total ({count} {count === 1 ? 'item' : 'items'})</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {unconfirmed ? (
          <button
            onClick={() => confirm(unconfirmed)}
            disabled={busy}
            className="mt-6 w-full rounded-full bg-secondary px-6 py-3 font-bold text-white disabled:opacity-60"
          >
            {busy ? 'Confirming…' : 'Retry confirmation'}
          </button>
        ) : demoOrder ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-primary-container bg-primary-container/5 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Demo payment · no real money</p>
            <p className="mt-1 text-sm text-gray-600">This replaces the Razorpay popup while you build and test.</p>
            <button
              onClick={() => confirm({ razorpay_order_id: demoOrder.razorpayOrderId })}
              disabled={busy}
              className="mt-4 w-full rounded-full bg-secondary px-6 py-3 font-bold text-white disabled:opacity-60"
            >
              {busy ? 'Confirming…' : `Pay ₹${(demoOrder.amount / 100).toFixed(2)} (demo)`}
            </button>
            <button
              onClick={() => setDemoOrder(null)}
              disabled={busy}
              className="mt-2 w-full rounded-full border border-outline-variant px-6 py-2.5 text-sm font-semibold text-gray-600"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={pay}
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary-container px-6 py-3 font-bold text-white disabled:opacity-60"
          >
            <span className="material-symbols-outlined">lock</span>
            {busy ? 'Please wait…' : `Pay ₹${subtotal.toFixed(2)}`}
          </button>
        )}
        <p className="mt-3 text-center text-xs text-gray-400">Secure payment by Razorpay · UPI, cards, net banking</p>
      </main>
    </div>
  );
}