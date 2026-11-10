import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import AdminTopBar from '../../components/common/AdminTopBar';
import AdminBottomNav from '../../components/common/AdminBottomNav';
import ScanOverlay from '../../components/admin/ScanOverlay';
import { useAdminApi } from '../../hooks/useApi';

const READER_ID = 'qr-reader';

export default function Scanner() {
  const apiFetch = useAdminApi();
  const apiRef = useRef(apiFetch);
  apiRef.current = apiFetch;

  const scannerRef = useRef(null);
  const busyRef = useRef(false);               // true while a result is on screen
  const lastRef = useRef({ text: '', at: 0 }); // ignore the same code seen again within 3s

  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState('');
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [manual, setManual] = useState('');

  const verify = useCallback(async (raw) => {
    const token = String(raw || '').trim();
    if (!token || busyRef.current) return;
    const now = Date.now();
    if (lastRef.current.text === token && now - lastRef.current.at < 3000) return;
    lastRef.current = { text: token, at: now };

    busyRef.current = true;
    setChecking(true);
    try {
      const data = await apiRef.current('/api/scanner/scan', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      setResult(data);
    } catch (err) {
      setResult({ state: 'error', message: err.message });
    } finally {
      setChecking(false);
    }
  }, []);

  const dismiss = () => {
    lastRef.current.at = Date.now();
    busyRef.current = false;
    setResult(null);
  };

  const startCamera = async () => {
    setCamError('');
    try {
      const scanner = new Html5Qrcode(READER_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => verify(text),
        () => {} // "no QR in this frame" is normal, ignore
      );
      setScanning(true);
    } catch (err) {
      scannerRef.current = null;
      const msg = String(err?.message || err);
      setCamError(
        /denied|NotAllowed|Permission/i.test(msg)
          ? 'Camera permission was blocked. Click the camera icon in the address bar, allow it, then try again. You can also use the manual box below.'
          : /NotFound|no camera/i.test(msg)
            ? 'No camera found on this device. Use the manual box below.'
            : `Could not start the camera. ${msg}`
      );
    }
  };

  const stopCamera = async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (s) {
      try { await s.stop(); s.clear(); } catch { /* already stopped */ }
    }
  };

  // Switch the camera off when leaving this page
  useEffect(() => () => {
    const s = scannerRef.current;
    if (s) s.stop().then(() => s.clear()).catch(() => {});
  }, []);

  const submitManual = (e) => {
    e.preventDefault();
    verify(manual);
    setManual('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <AdminTopBar title="Scan pickup QR" />
      <main className="mx-auto w-full max-w-md px-4 pb-28 pt-20">
        <p className="mb-4 text-sm text-gray-500">
          Ask the student to show their order QR code, then point the camera at it.
        </p>

        <div className="relative overflow-hidden rounded-2xl bg-black">
          <div id={READER_ID} className="w-full" />
          {!scanning && (
            <div className="flex h-64 flex-col items-center justify-center gap-3 px-6 text-center text-white">
              <span className="material-symbols-outlined text-6xl text-white/70">qr_code_scanner</span>
              <p className="text-sm text-white/80">Camera is off</p>
            </div>
          )}
          {checking && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">Checking…</div>
          )}
        </div>

        {camError && (
          <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {camError}
          </p>
        )}

        <button
          onClick={scanning ? stopCamera : startCamera}
          className={`mt-4 w-full rounded-full px-6 py-3 font-bold text-white ${scanning ? 'bg-gray-700' : 'bg-primary-container'}`}
        >
          {scanning ? 'Stop camera' : 'Start camera'}
        </button>

        <form onSubmit={submitManual} className="mt-8 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
          <label htmlFor="manual-code" className="text-sm font-bold text-gray-900">Camera not working? Enter the code</label>
          <input
            id="manual-code"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Paste the QR code text"
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!manual.trim() || checking}
            className="mt-3 w-full rounded-full border border-primary-container px-6 py-2.5 font-bold text-primary disabled:opacity-40"
          >
            Check code
          </button>
        </form>
      </main>

      <ScanOverlay result={result} onDismiss={dismiss} />
      <AdminBottomNav />
    </div>
  );
}