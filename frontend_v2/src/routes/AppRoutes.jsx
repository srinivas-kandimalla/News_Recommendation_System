import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Loader from '../components/common/Loader';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';

const MainLayout = lazy(() => import('../layouts/MainLayout'));
const AuthLayout = lazy(() => import('../layouts/AuthLayout'));
const Home = lazy(() => import('../pages/Home'));
const Trending = lazy(() => import('../pages/Trending'));
const NewsDetails = lazy(() => import('../pages/NewsDetails'));
const Recommendations = lazy(() => import('../pages/Recommendations'));
const Bookmarks = lazy(() => import('../pages/Bookmarks'));
const Analytics = lazy(() => import('../pages/Analytics'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const Profile = lazy(() => import('../pages/Profile'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const NotFound = lazy(() => import('../pages/NotFound'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loader minHeight="100vh" />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="trending" element={<Trending />} />
          <Route path="news/:newsId" element={<NewsDetails />} />
          <Route element={<ProtectedRoute />}>
            <Route path="recommendations" element={<Recommendations />} />
            <Route path="bookmarks" element={<Bookmarks />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
