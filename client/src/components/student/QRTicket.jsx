import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// Draws the pickup QR. The QR holds ONLY the random token, nothing personal.
export default function QRTicket({ token, orderId, delivered = false }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let off = false;
    QRCode.toDataURL(token, { width: 280, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => !off && setSrc(url))
      .catch(() => {});
    return () => { off = true; };
  }, [token]);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 text-center shadow-[0_2px_8px_-2px_rgba(26,26,26,0.04)]">
      <p className="text-sm font-semibold text-gray-500">Order #{orderId}</p>

      <div className="relative mx-auto mt-3 h-[280px] w-[280px]">
        {src ? (
          <img src={src} alt="Pickup QR code" className={`h-full w-full rounded-lg ${delivered ? 'opacity-20' : ''}`} />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-surface">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary" />
          </div>
        )}
        {delivered && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-secondary">check_circle</span>
            <p className="mt-1 text-lg font-extrabold text-gray-900">Collected</p>
          </div>
        )}
      </div>

      <p className="mt-3 text-sm text-gray-600">
        {delivered ? 'This order has been handed over.' : 'Show this QR code at the counter to collect your order.'}
      </p>
    </div>
  );
}
