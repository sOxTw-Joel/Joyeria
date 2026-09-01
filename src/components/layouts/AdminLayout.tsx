import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, Settings, LogOut } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../../lib/utils';

export default function AdminLayout() {
  const location = useLocation();

  const handleLogout = () => {
    signOut(auth);
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Productos', path: '/admin/products', icon: Package },
    { name: 'Categorías', path: '/admin/categories', icon: Tags },
    { name: 'Configuración', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex font-sans text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F0F0F] border-r border-[#222] flex-shrink-0 flex flex-col p-6">
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] mb-2">Admin Panel</div>
          <h1 className="text-xl font-serif italic text-white">Management Console</h1>
        </div>
        <nav className="flex-1 mt-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-md text-[11px] uppercase tracking-widest font-medium transition-colors",
                  isActive ? "bg-[#161616] text-[#C5A059] border-l-2 border-[#C5A059]" : "text-neutral-500 hover:bg-[#161616] hover:text-neutral-300 border-l-2 border-transparent"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="pt-4 border-t border-[#222] mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 w-full rounded-md text-[11px] uppercase tracking-widest font-medium text-red-500 hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050505]">
        <header className="h-16 border-b border-[#222] flex items-center justify-between px-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest">
              {navItems.find(i => i.path === location.pathname)?.name || 'Panel'}
            </h2>
          </div>
          <div>
            <Link to="/" target="_blank" className="text-[11px] uppercase tracking-widest text-[#C5A059] hover:text-white transition-colors">Ver Tienda &rarr;</Link>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-10">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
