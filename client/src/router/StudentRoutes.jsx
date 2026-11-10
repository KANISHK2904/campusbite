import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SplashLogin from '../pages/student/SplashLogin';
import AuthCallback from '../pages/student/AuthCallback';
import Home from '../pages/student/Home';
import PlaceMenu from '../pages/student/PlaceMenu';
import Cart from '../pages/student/Cart';
import PaymentOptions from '../pages/student/PaymentOptions';
import OrderSuccess from '../pages/student/OrderSuccess';
import Orders from '../pages/student/Orders';
import Profile from '../pages/student/Profile';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner full />;
  return user ? children : <Navigate to="/login" replace />;
}

export default function StudentRoutes() {
  return (
    <Routes>
      <Route path="login" element={<SplashLogin />} />
      <Route path="auth/callback" element={<AuthCallback />} />
      <Route index element={<Protected><Home /></Protected>} />
      <Route path="place/:id" element={<Protected><PlaceMenu /></Protected>} />
      <Route path="cart" element={<Protected><Cart /></Protected>} />
      <Route path="payment" element={<Protected><PaymentOptions /></Protected>} />
      <Route path="order-success/:id" element={<Protected><OrderSuccess /></Protected>} />
      <Route path="orders" element={<Protected><Orders /></Protected>} />
      <Route path="profile" element={<Protected><Profile /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
