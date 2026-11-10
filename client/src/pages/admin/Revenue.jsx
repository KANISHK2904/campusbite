import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminTopBar from '../../components/common/AdminTopBar';
import AdminBottomNav from '../../components/common/AdminBottomNav';
import { useAdminApi } from '../../hooks/useApi';

// ── small helpers ──
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const money = (n) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dayLabel = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
};
const monthLabel = (s) => {
  const [y, m] = s.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const PRESETS = [
  { key: 'today', label: 'Today',      range: (t) => [t, t] },
  { key: '7d',    label: '7 days',     range: (t) => [addDays(t, -6), t] },
  { key: '30d',   label: '30 days',    range: (t) => [addDays(t, -29), t] },
  { key: 'month', label: 'This month', range: (t) => [new Date(t.getFullYear(), t.getMonth(), 1), t] },
  { key: 'last',  label: 'Last month', range: (t) => [new Date(t.getFullYear(), t.getMonth() - 1, 1), new Date(t.getFullYear(), t.getMonth(), 0)] },
  { key: '90d',   label: '90 days',    range: (t) => [addDays(t, -89), t] },
  { key: '1y',    label: '1 year',     range: (t) => [addDays(t, -364), t] },
];

function startOfToday() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function Bars({ rows, value, title }) {
  const max = Math.max(1, ...rows.map(value));
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex h-40 items-end gap-1" style={{ minWidth: Math.max(rows.length * 20, 0) }}>
        {rows.map((r, i) => (
          <div key={i} className="flex h-full min-w-[14px] flex-1 flex-col justify-end" title={title(r)}>
            <div
              className="w-full rounded-t bg-primary-container"
              style={{ height: `${(value(r) / max) * 100}%`, minHeight: value(r) > 0 ? 3 : 0 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const text = '\ufeff' + rows.map((r) => r.map(esc).join(',')).join('\r\n'); // BOM so Excel reads ₹ and accents
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Revenue() {
  const apiFetch = useAdminApi();

  const [preset, setPreset] = useState('30d');
  const [from, setFrom] = useState(() => ymd(addDays(startOfToday(), -29)));
  const [to, setTo] = useState(() => ymd(startOfToday()));
  const [tab, setTab] = useState('days'); // days | months | items
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const choosePreset = (p) => {
    const [a, b] = p.range(startOfToday());
    setPreset(p.key);
    setFrom(ymd(a));
    setTo(ymd(b));
  };

  const load = useCallback(async () => {
    if (from > to) { setError('The start date must be before the end date'); return; }
    setLoading(true);
    setError('');
    try {
      setData(await apiFetch(`/api/admin/revenue?from=${from}&to=${to}`));
    } catch (err) {
      setError(err.message || 'Could not load the report');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, from, to]);

  useEffect(() => { load(); }, [load]);

  const totals = data?.totals;
  const itemsMax = useMemo(() => Math.max(1, ...(data?.by_item || []).map((i) => i.revenue)), [data]);

  const exportCsv = () => {
    if (!data) return;
    const name = `revenue-${tab}-${data.range.from}_to_${data.range.to}.csv`;
    if (tab === 'days') {
      downloadCsv(name, [['Date', 'Orders', 'Revenue (INR)'], ...data.by_day.map((r) => [r.date, r.orders, r.revenue.toFixed(2)])]);
    } else if (tab === 'months') {
      downloadCsv(name, [['Month', 'Orders', 'Revenue (INR)'], ...data.by_month.map((r) => [r.month, r.orders, r.revenue.toFixed(2)])]);
    } else {
      downloadCsv(name, [['Item', 'Quantity sold', 'Revenue (INR)'], ...data.by_item.map((r) => [r.name, r.quantity, r.revenue.toFixed(2)])]);
    }
  };

  const card = 'flex flex-col rounded-xl bg-surface-container-lowest p-space-sm shadow-card';

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      <AdminTopBar title="Admin Dashboard" />
      <main className="flex flex-col relative w-full pt-16 pb-24 bg-surface min-h-screen">
        <div className="flex flex-col w-full px-margin pb-space-2xl gap-space-lg">
          <section className="flex flex-col">
            <span className="text-headline-sm text-on-surface">Revenue history</span>
            <span className="text-body-sm text-on-surface-variant">Paid and collected orders only</span>
          </section>

          {/* Period */}
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => choosePreset(p)}
                  className={`px-space-md py-1.5 rounded-full text-label-md whitespace-nowrap shadow-sm ${
                    preset === p.key ? 'bg-primary-container text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-space-sm">
              <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
                From
                <input
                  type="date"
                  value={from}
                  max={to}
                  onChange={(e) => { setPreset('custom'); setFrom(e.target.value); }}
                  className="rounded-lg bg-surface-container-low px-space-sm py-2 text-body-md text-on-surface"
                />
              </label>
              <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
                To
                <input
                  type="date"
                  value={to}
                  min={from}
                  onChange={(e) => { setPreset('custom'); setTo(e.target.value); }}
                  className="rounded-lg bg-surface-container-low px-space-sm py-2 text-body-md text-on-surface"
                />
              </label>
            </div>
          </section>

          {error && (
            <div className="bg-error-container text-on-error-container text-label-md px-space-md py-space-sm rounded-xl">{error}</div>
          )}

          {/* Totals */}
          <section className="grid grid-cols-2 gap-space-sm">
            <div className={card}>
              <span className="text-label-sm text-on-surface-variant">Revenue</span>
              <span className="text-headline-md text-on-surface">{totals ? money(totals.revenue) : '–'}</span>
            </div>
            <div className={card}>
              <span className="text-label-sm text-on-surface-variant">Orders</span>
              <span className="text-headline-md text-on-surface">{totals ? totals.orders : '–'}</span>
            </div>
            <div className={card}>
              <span className="text-label-sm text-on-surface-variant">Items sold</span>
              <span className="text-headline-md text-on-surface">{totals ? totals.items_sold : '–'}</span>
            </div>
            <div className={card}>
              <span className="text-label-sm text-on-surface-variant">Average order</span>
              <span className="text-headline-md text-on-surface">{totals ? money(totals.avg_order) : '–'}</span>
            </div>
          </section>

          {/* Tabs */}
          <section className="flex items-center justify-between gap-space-sm">
            <div className="flex rounded-full bg-surface-container-low p-1">
              {[['days', 'Days'], ['months', 'Months'], ['items', 'Items']].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`px-space-md py-1.5 rounded-full text-label-md ${tab === k ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={exportCsv}
              disabled={!data || loading}
              className="flex items-center gap-1 rounded-full bg-surface-container px-space-md py-1.5 text-label-md text-on-surface disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">download</span> CSV
            </button>
          </section>

          {loading && !data && (
            <div className="flex justify-center py-10">
              <span className="material-symbols-outlined animate-spin text-primary-container text-[32px]">progress_activity</span>
            </div>
          )}

          {data && totals.orders === 0 && !loading && (
            <div className="rounded-xl bg-surface-container-lowest p-space-lg text-center shadow-card text-body-md text-on-surface-variant">
              No paid orders in this period.
            </div>
          )}

          {/* DAYS */}
          {data && tab === 'days' && totals.orders > 0 && (
            <section className="flex flex-col gap-space-sm">
              <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-card">
                <Bars rows={data.by_day} value={(r) => r.revenue} title={(r) => `${dayLabel(r.date)}: ${money(r.revenue)} (${r.orders} orders)`} />
                <div className="mt-1 flex justify-between text-label-sm text-on-surface-variant">
                  <span>{dayLabel(data.by_day[0].date)}</span>
                  <span>{dayLabel(data.by_day[data.by_day.length - 1].date)}</span>
                </div>
              </div>
              <div className="rounded-xl bg-surface-container-lowest shadow-card divide-y divide-outline-variant">
                {[...data.by_day].reverse().map((r) => (
                  <div key={r.date} className="flex items-center justify-between px-space-md py-space-sm">
                    <span className="text-body-md text-on-surface">{dayLabel(r.date)}</span>
                    <span className="text-right">
                      <span className="block text-title-md text-on-surface">{money(r.revenue)}</span>
                      <span className="block text-label-sm text-on-surface-variant">{r.orders} {r.orders === 1 ? 'order' : 'orders'}</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* MONTHS */}
          {data && tab === 'months' && totals.orders > 0 && (
            <section className="flex flex-col gap-space-sm">
              <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-card">
                <Bars rows={data.by_month} value={(r) => r.revenue} title={(r) => `${monthLabel(r.month)}: ${money(r.revenue)} (${r.orders} orders)`} />
              </div>
              <div className="rounded-xl bg-surface-container-lowest shadow-card divide-y divide-outline-variant">
                {[...data.by_month].reverse().map((r) => (
                  <div key={r.month} className="flex items-center justify-between px-space-md py-space-sm">
                    <span className="text-body-md text-on-surface">{monthLabel(r.month)}</span>
                    <span className="text-right">
                      <span className="block text-title-md text-on-surface">{money(r.revenue)}</span>
                      <span className="block text-label-sm text-on-surface-variant">{r.orders} {r.orders === 1 ? 'order' : 'orders'}</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ITEMS */}
          {data && tab === 'items' && totals.orders > 0 && (
            <section className="rounded-xl bg-surface-container-lowest shadow-card divide-y divide-outline-variant">
              {data.by_item.map((r, i) => (
                <div key={r.item_id} className="px-space-md py-space-sm">
                  <div className="flex items-center justify-between gap-space-sm">
                    <span className="min-w-0 truncate text-body-md text-on-surface">{i + 1}. {r.name}</span>
                    <span className="text-title-md text-on-surface">{money(r.revenue)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-label-sm text-on-surface-variant">
                    <span>{r.quantity} sold</span>
                    <span>{totals.revenue > 0 ? Math.round((r.revenue / totals.revenue) * 100) : 0}% of revenue</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-surface-container-low">
                    <div className="h-1.5 rounded-full bg-primary-container" style={{ width: `${(r.revenue / itemsMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>
      <AdminBottomNav />
    </div>
  );
}
