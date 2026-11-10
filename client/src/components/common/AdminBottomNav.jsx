import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/admin/dashboard', icon: 'dashboard',       label: 'Dashboard' },
  { to: '/admin/inventory', icon: 'restaurant_menu', label: 'Items' },
  { to: '/admin/orders',    icon: 'receipt_long',    label: 'Orders' },
  { to: '/admin/revenue',   icon: 'bar_chart',       label: 'Revenue' },
  { to: '/admin/scan',      icon: 'qr_code_scanner', label: 'Scan' },
  { to: '/admin/account',   icon: 'account_circle',  label: 'Account' },
];

export default function AdminBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant bg-surface/90 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-3xl justify-around py-2">
        {TABS.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1 text-[11px] font-semibold ${
                  isActive ? 'text-primary-container' : 'text-on-surface-variant'
                }`
              }
            >
              <span className="material-symbols-outlined text-[24px]">{t.icon}</span>
              {t.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
