import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';             // ← NEW (Step 4)

// Admin pages
import AdminLogin  from './pages/admin/AdminLogin';
import AdminSignup from './pages/admin/AdminSignup';
import Dashboard   from './pages/admin/Dashboard';
import Inventory   from './pages/admin/Inventory';
import AdminOrders from './pages/admin/AdminOrders';
import Scanner     from './pages/admin/Scanner';
import Revenue     from './pages/admin/Revenue';            // ← NEW
import Account     from './pages/admin/Account';            // ← NEW
import AdminRoutes from './router/AdminRoutes';

// Student pages
import StudentRoutes from './router/StudentRoutes';

export default function App() {
  return (
    <AdminAuthProvider>
      <AuthProvider>
        <CartProvider>                                             {/* ← NEW (Step 4) */}
          <BrowserRouter>
            <Routes>
              {/* Public admin auth pages */}
              <Route path="/admin/login"  element={<AdminLogin />} />
              <Route path="/admin/signup" element={<AdminSignup />} />

              {/* Protected admin pages */}
              <Route element={<AdminRoutes />}>
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/inventory" element={<Inventory />} />
                <Route path="/admin/orders"    element={<AdminOrders />} />
                <Route path="/admin/scan"      element={<Scanner />} />
                <Route path="/admin/revenue"   element={<Revenue />} />   {/* ← NEW */}
                <Route path="/admin/account"   element={<Account />} />   {/* ← NEW */}
              </Route>

              {/* Student app */}
              <Route path="/*" element={<StudentRoutes />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </AdminAuthProvider>
  );
}
