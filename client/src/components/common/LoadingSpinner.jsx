export default function LoadingSpinner({ full = false }) {
  return (
    <div className={`flex items-center justify-center ${full ? 'min-h-screen bg-surface' : 'py-16'}`}>
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-outline-variant border-t-primary" />
    </div>
  );
}
