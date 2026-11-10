import { useCallback } from 'react';

const SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let loading = null;

function loadScript() {
  if (window.Razorpay) return Promise.resolve(true);
  if (!loading) {
    loading = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = SRC;
      s.onload = () => resolve(true);
      s.onerror = () => { loading = null; resolve(false); };
      document.body.appendChild(s);
    });
  }
  return loading;
}

// Returns openCheckout(options) -> resolves with { razorpay_payment_id, razorpay_order_id, razorpay_signature }
// Rejects with err.cancelled = true if the student just closes the popup.
export default function useRazorpay() {
  return useCallback(async (options) => {
    const ok = await loadScript();
    if (!ok) throw new Error('Could not load Razorpay. Check your internet connection.');

    return new Promise((resolve, reject) => {
      let lastFailure = null;
      const rzp = new window.Razorpay({
        ...options,
        handler: resolve,
        modal: {
          ondismiss: () => {
            // Razorpay lets people retry inside the popup, so only give up when it is closed
            if (lastFailure) reject(new Error(lastFailure));
            else reject(Object.assign(new Error('Payment cancelled'), { cancelled: true }));
          },
        },
      });
      rzp.on('payment.failed', (r) => {
        lastFailure = r?.error?.description || 'Payment failed';
      });
      rzp.open();
    });
  }, []);
}
