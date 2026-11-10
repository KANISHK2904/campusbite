import { createContext, useContext, useState, useCallback } from 'react';

const AdminAuthContext = createContext(null);

const STORAGE_KEY_TOKEN = 'cb_admin_token';
const STORAGE_KEY_ADMIN = 'cb_admin';

function loadFromStorage() {
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const admin = JSON.parse(localStorage.getItem(STORAGE_KEY_ADMIN) || 'null');
    return { token, admin };
  } catch {
    return { token: null, admin: null };
  }
}

export function AdminAuthProvider({ children }) {
  const initial = loadFromStorage();
  const [token, setToken] = useState(initial.token);
  const [admin, setAdmin] = useState(initial.admin);

  const login = useCallback((newToken, newAdmin) => {
    localStorage.setItem(STORAGE_KEY_TOKEN, newToken);
    localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(newAdmin));
    setToken(newToken);
    setAdmin(newAdmin);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_ADMIN);
    setToken(null);
    setAdmin(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ token, admin, login, logout, isAuthenticated: !!token }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
