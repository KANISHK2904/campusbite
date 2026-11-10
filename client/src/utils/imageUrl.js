export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Item photos are saved as "/uploads/items/abc.jpg" on the server.
// This turns that into a full address the browser can load.
export function imgSrc(url) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `${API_BASE}${url}`;
}
