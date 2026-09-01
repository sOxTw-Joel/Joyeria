import { Outlet, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSettings, getCategories } from '../../lib/db';
import { StoreSettings, Category } from '../../types';

export default function CatalogLayout() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getSettings().then(setSettings);
    getCategories().then(setCategories);
  }, []);

  const visibleCats = categories.filter(c => settings?.visibleCategories?.includes(c.id));

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-white selection:bg-[#C5A059]/30">
      <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end h-24 pb-6">
            <Link to="/" className="flex items-center gap-3">
              {settings?.logo ? (
                <img src={settings.logo} alt="Logo" className="h-12 w-auto object-contain" />
              ) : (
                <div className="flex flex-col">
                  <span className="text-4xl tracking-tight font-serif font-light text-[#F2F2F2]">{settings?.title || 'AURUM & CO.'}</span>
                  <span className="text-[#C5A059] text-[9px] tracking-[0.3em] uppercase mt-1">Catálogo de Alta Joyería</span>
                </div>
              )}
            </Link>
            <nav className="hidden md:flex space-x-8">
              {visibleCats.map(cat => (
                <a key={cat.id} href={`#cat-${cat.id}`} className="text-[11px] tracking-[0.2em] uppercase text-neutral-400 hover:text-white transition-colors">
                  {cat.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Outlet />
      </main>
      <footer className="border-t border-[#222] py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-neutral-600 text-[10px] uppercase tracking-widest gap-4">
          <span>&copy; {new Date().getFullYear()} {settings?.title || 'AURUM & CO.'}. Todos los derechos reservados.</span>
          <span>Powered by Firebase DB (Base64 Ready)</span>
        </div>
      </footer>
    </div>
  );
}
