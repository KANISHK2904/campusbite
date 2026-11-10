import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function TopBar({ title, back = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-surface/90 px-4 py-3 backdrop-blur-xl">
      {back && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      )}
      <h1 className="flex-1 truncate text-xl font-extrabold text-gray-900">{title}</h1>
      {user?.avatar_url && (
        <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full" />
      )}
    </header>
  );
}
