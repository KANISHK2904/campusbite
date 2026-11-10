// Full-screen result after a scan. state: success | already_delivered | invalid_qr | error
const THEMES = {
  success:           { bg: 'bg-emerald-600', icon: 'check_circle', title: 'Order verified',    sub: 'Hand over the order below' },
  already_delivered: { bg: 'bg-amber-500',   icon: 'history',      title: 'Already delivered', sub: 'This QR code was already used' },
  invalid_qr:        { bg: 'bg-red-600',     icon: 'cancel',       title: 'Invalid QR',        sub: "This code isn't valid for your shop" },
  error:             { bg: 'bg-gray-700',    icon: 'error',        title: 'Could not check',   sub: 'Something went wrong. Try again.' },
};

export default function ScanOverlay({ result, onDismiss }) {
  if (!result) return null;
  const t = THEMES[result.state] || THEMES.error;
  const order = result.order;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center text-white ${t.bg}`}>
      <span className="material-symbols-outlined text-8xl">{t.icon}</span>
      <h2 className="mt-3 text-3xl font-extrabold">{t.title}</h2>
      <p className="mt-1 text-white/90">{result.state === 'error' && result.message ? result.message : t.sub}</p>

      {order && (
        <div className="mt-6 w-full max-w-sm rounded-2xl bg-white/15 p-4 text-left backdrop-blur">
          <p className="text-sm text-white/80">Order #{order.id} · {order.student_name}</p>
          <ul className="mt-2 space-y-1 text-lg font-bold">
            {order.items.map((i, idx) => (
              <li key={idx}>{i.quantity} × {i.name}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-white/80">Total ₹{order.total_amount.toFixed(2)}</p>
          {result.state === 'already_delivered' && order.delivered_at && (
            <p className="mt-1 text-sm text-white/80">Delivered at {new Date(order.delivered_at).toLocaleString()}</p>
          )}
        </div>
      )}

      <button onClick={onDismiss} className="mt-8 rounded-full bg-white px-10 py-3 font-bold text-gray-900 shadow-lg">
        Scan next
      </button>
    </div>
  );
}