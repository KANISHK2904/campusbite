import { NavLink } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

// All four tabs are live.
const TABS = [
  { to: '/', icon: 'home', label: 'Home', ready: true },
  { to: '/cart', icon: 'shopping_cart', label: 'Cart', ready: true },
  { to: '/orders', icon: 'receipt_long', label: 'Orders', ready: true },
  { to: '/profile', icon: 'person', label: 'Profile', ready: true },
];

export default function BottomNav() {
  const { count } = useCart();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant bg-surface/90 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-md justify-around py-2">
        {TABS.map((t) => (
          <li key={t.label}>
            {t.ready ? (
              <NavLink
                to={t.to}
                end
                className={({ isActive }) =>
                  `relative flex flex-col items-center px-4 py-1 text-xs font-semibold ${isActive ? 'text-primary' : 'text-gray-500'}`
                }
              >
                <span className="material-symbols-outlined">{t.icon}</span>
                {t.label}
                {t.label === 'Cart' && count > 0 && (
                  <span className="absolute right-2 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-container px-1 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </NavLink>
            ) : (
              <span className="flex flex-col items-center px-4 py-1 text-xs font-semibold text-gray-300" title="Coming soon">
                <span className="material-symbols-outlined">{t.icon}</span>
                {t.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
