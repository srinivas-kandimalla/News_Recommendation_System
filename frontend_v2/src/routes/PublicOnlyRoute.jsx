import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

export default function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loader minHeight="75vh" />;
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}
