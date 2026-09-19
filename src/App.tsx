import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CatalogLayout from './components/layouts/CatalogLayout';
import AdminLayout from './components/layouts/AdminLayout';
import CatalogPage from './pages/CatalogPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminSettings from './pages/admin/AdminSettings';
import AdminLogin from './pages/admin/AdminLogin';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white bg-[#050505] font-serif text-sm tracking-widest uppercase">Cargando...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public Catalog */}
        <Route path="/" element={<CatalogLayout />}>
          <Route index element={<CatalogPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={user ? <Navigate to="/admin" /> : <AdminLogin />} />
        
        <Route path="/admin" element={user ? <AdminLayout /> : <Navigate to="/admin/login" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
