import { useCallback } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, options = {}, token = null) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(data?.error || data?.message || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

// For pages that need no token (admin login / signup)
export function publicFetch(path, options = {}) {
  return request(path, options);
}

// For logged-in admin pages: attaches the admin JWT, logs out on 401
export function useAdminApi() {
  const { token, logout } = useAdminAuth();

  return useCallback(
    async (path, options = {}) => {
      try {
        return await request(path, options, token);
      } catch (err) {
        if (err.status === 401) logout();
        throw err;
      }
    },
    [token, logout]
  );
}

export default useAdminApi;