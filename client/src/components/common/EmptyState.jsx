export default function EmptyState({ icon = 'restaurant', title, message, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="material-symbols-outlined mb-3 text-6xl text-outline-variant">{icon}</span>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {message && <p className="mt-1 max-w-xs text-sm text-gray-500">{message}</p>}
      {action}
    </div>
  );
}
