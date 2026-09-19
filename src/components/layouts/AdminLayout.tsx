import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, Settings, LogOut, Menu, X, Store } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { useState } from 'react';

export default function AdminLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Gestión de Catálogo', path: '/admin/products', icon: Package },
    { name: 'Configuración', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex font-sans text-white">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0F0F0F] border-r border-[#222] flex-shrink-0 flex flex-col p-6 transition-transform duration-300 ease-in-out md:transform-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] mb-2">Admin Panel</div>
            <h1 className="text-xl font-serif italic text-white">Management Console</h1>
          </div>
          <button className="md:hidden text-neutral-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 mt-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
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
        
        <div className="pt-4 border-t border-[#222] mt-auto space-y-2">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 p-3 rounded-md text-[11px] uppercase tracking-widest font-medium text-[#C5A059] hover:bg-[#161616] transition-colors"
          >
            <Store className="w-4 h-4" />
            Ver Catálogo
          </Link>

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
        <header className="h-16 border-b border-[#222] flex items-center justify-between px-6 md:px-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-neutral-400 hover:text-white" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest">
              {navItems.find(i => i.path === location.pathname)?.name || 'Panel'}
            </h2>
          </div>
          <div>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#161616] border border-[#333] text-[11px] uppercase tracking-widest text-[#C5A059] hover:text-white hover:border-[#C5A059] transition-all"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Ver Catálogo</span>
            </Link>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-10">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
