import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CatalogLayout from './components/layouts/CatalogLayout';
import AdminLayout from './components/layouts/AdminLayout';
import CatalogPage from './pages/CatalogPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminSettings from './pages/admin/AdminSettings';
import AdminLogin from './pages/admin/AdminLogin';
import { useEffect, useState } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
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

export default App;
