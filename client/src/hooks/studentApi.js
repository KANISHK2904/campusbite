const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const TOKEN_KEY = 'campusbite_student_token';

// Fetch wrapper that attaches the student JWT.
export async function api(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const hasBody = options.body !== undefined && typeof options.body !== 'string';
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    body: hasBody ? JSON.stringify(options.body) : options.body,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event('campusbite:unauthorized'));
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error(data?.error || 'Request failed'), { status: res.status });
  return data;
}