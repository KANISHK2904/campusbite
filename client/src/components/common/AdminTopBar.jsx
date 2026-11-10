import { useAdminAuth } from '../../contexts/AdminAuthContext';

export default function AdminTopBar({ title, subtitle }) {
  const { admin } = useAdminAuth();

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 px-space-md flex items-center justify-between">
        {/* Left: title block + Live pill */}
        <div className="flex items-center gap-space-sm">
          <div className="flex flex-col">
            <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
              CampusBite Admin
            </span>
            <span className="text-title-md text-on-surface leading-tight">{title}</span>
          </div>
          <div className="flex items-center gap-space-2xs px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-label-sm">Live</span>
          </div>
        </div>

        {/* Right: icons */}
        <div className="flex items-center gap-space-xs">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
          {admin?.username && (
            <span className="text-label-md text-on-surface-variant hidden sm:block">
              {admin.username}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
