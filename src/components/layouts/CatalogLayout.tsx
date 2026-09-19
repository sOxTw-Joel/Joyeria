import { Outlet, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSettings, getCategories, getCachedSettings } from '../../lib/db';
import { StoreSettings, Category } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingBag, Menu, X, Trash2, Lock, ShieldCheck, Gem } from 'lucide-react';
import { formatPrice, getProductDisplayId, getEffectivePrice } from '../../lib/utils';
import { Button } from '../ui/Button';
import LoadingScreen from '../ui/LoadingScreen';
import { AnimatePresence } from 'motion/react';

export default function CatalogLayout() {
  const [settings, setSettings] = useState<StoreSettings | null>(() => getCachedSettings());
  const [categories, setCategories] = useState<Category[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();

    const handleSettingsUpdate = (e: CustomEvent<StoreSettings>) => {
      if (e.detail) {
        setSettings(e.detail);
      }
    };
    window.addEventListener('store_settings_updated' as any, handleSettingsUpdate as any);

    Promise.all([
      getSettings(),
      getCategories()
    ]).then(([s, cats]) => {
      if (!isMounted) return;
      setSettings(s);
      setCategories(cats);

      // Smooth display duration to showcase the loading animation with the logo
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 850 - elapsed);
      setTimeout(() => {
        if (isMounted) setIsInitialLoading(false);
      }, remaining);
    }).catch(err => {
      console.error('Error loading store data:', err);
      if (isMounted) setIsInitialLoading(false);
    });

    return () => {
      isMounted = false;
      window.removeEventListener('store_settings_updated' as any, handleSettingsUpdate as any);
    };
  }, []);

  const visibleCats = categories.filter(c => settings?.visibleCategories?.includes(c.id));

  const handleWhatsAppCheckout = () => {
    if (!settings?.whatsappNumber) {
      alert("El número de WhatsApp no está configurado.");
      return;
    }

    let message = "Hola, quiero hacer un pedido:\n\n";
    cart.forEach(item => {
      const prodId = getProductDisplayId(item.product);
      const effectivePrice = getEffectivePrice(item.product);
      const discountNote = item.product.discountPercentage && item.product.discountPercentage > 0 
        ? ` (${item.product.discountPercentage}% OFF)` 
        : '';
      message += `- [${prodId}] ${item.product.title}${discountNote} (x${item.quantity}) = *${formatPrice(effectivePrice * item.quantity)}*\n`;
    });
    message += `\n*Total:* ${formatPrice(cartTotal)}`;

    const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-white selection:bg-[#C5A059]/30 flex flex-col">
      {/* Luxurious Loading Screen with animated Logo during Firebase fetch */}
      <AnimatePresence>
        {isInitialLoading && (
          <LoadingScreen 
            logo={settings?.logo} 
            title={settings?.title || 'Catálogo de Joyería'} 
            subtitle="Cargando colecciones exclusivas..." 
          />
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex justify-between items-center h-20 md:h-24">
            
            {/* Mobile Menu Button */}
            <div className="flex md:hidden z-10">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors"
                aria-label="Abrir menú"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Logo */}
            <Link 
              to="/" 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:static md:translate-x-0 md:translate-y-0 flex items-center justify-center flex-shrink-0"
            >
              {settings?.logo ? (
                <img 
                  src={settings.logo} 
                  alt={settings.title || "Logo"} 
                  className="h-14 md:h-16 lg:h-[68px] w-auto max-w-[200px] sm:max-w-[260px] md:max-w-none object-contain transition-all" 
                />
              ) : (
                <div className="flex items-center gap-2.5">
                  <Gem className="w-5 h-5 text-[#C5A059]" />
                  <span className="font-serif italic tracking-wider text-base sm:text-lg lg:text-xl text-white font-light">
                    {settings?.title || 'Catálogo de Joyería'}
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8 ml-8 lg:ml-12 flex-1">
              {visibleCats.map(cat => (
                <a key={cat.id} href={`#cat-${cat.id}`} className="text-[11px] tracking-[0.2em] uppercase text-neutral-400 hover:text-white transition-colors">
                  {cat.name}
                </a>
              ))}
            </nav>

            {/* Header Right Actions */}
            <div className="flex z-10 items-center gap-3 sm:gap-4 justify-end md:flex-none">
              {/* Admin Link on Header */}
              {user ? (
                <Link 
                  to="/admin" 
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161616] border border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059] hover:text-black transition-all text-[10px] uppercase tracking-widest font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Panel Admin</span>
                </Link>
              ) : (
                <Link 
                  to="/admin/login" 
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-neutral-400 hover:text-[#C5A059] transition-colors text-[10px] uppercase tracking-widest"
                  title="Acceso Administrador"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Acceso Admin</span>
                </Link>
              )}

              {/* Cart Button */}
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 -mr-2 text-neutral-400 hover:text-white transition-colors group"
                aria-label="Ver carrito"
              >
                <ShoppingBag className="w-6 h-6 group-hover:text-[#C5A059] transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#C5A059] text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/80" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-sm bg-[#0F0F0F] border-r border-[#222] flex flex-col p-6 h-full shadow-2xl z-10">
            <div className="flex justify-between items-center mb-8">
              <span className="text-[#C5A059] text-[10px] tracking-[0.2em] uppercase font-bold">Navegación</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex flex-col space-y-5 flex-1 overflow-y-auto">
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm tracking-[0.2em] uppercase text-white hover:text-[#C5A059] transition-colors"
              >
                Inicio
              </Link>
              {visibleCats.map(cat => (
                <a 
                  key={cat.id} 
                  href={`#cat-${cat.id}`} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm tracking-[0.2em] uppercase text-neutral-300 hover:text-[#C5A059] transition-colors"
                >
                  {cat.name}
                </a>
              ))}
            </nav>

            {/* Mobile Menu Admin Section */}
            <div className="pt-6 border-t border-[#222] mt-auto">
              {user ? (
                <Link 
                  to="/admin" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2.5 p-3 rounded bg-[#161616] border border-[#C5A059]/40 text-xs tracking-widest uppercase text-[#C5A059] hover:bg-[#C5A059] hover:text-black transition-all font-medium text-center"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Panel de Administración</span>
                </Link>
              ) : (
                <Link 
                  to="/admin/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 p-3 rounded bg-[#161616] border border-[#333] text-xs tracking-widest uppercase text-neutral-400 hover:text-[#C5A059] hover:border-[#C5A059] transition-colors text-center"
                >
                  <Lock className="w-4 h-4" />
                  <span>Acceso Administrador</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/80" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full sm:w-[400px] bg-[#0F0F0F] border-l border-[#222] flex flex-col h-full shadow-2xl z-10">
            
            <div className="flex justify-between items-center p-6 border-b border-[#222]">
              <span className="text-white text-lg font-serif italic">Tu Selección</span>
              <button onClick={() => setIsCartOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 space-y-4">
                  <ShoppingBag className="w-12 h-12 opacity-20" />
                  <p className="text-[11px] uppercase tracking-widest">No hay artículos</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex gap-4">
                    <div className="w-20 h-24 bg-[#050505] rounded border border-[#222] flex-shrink-0 overflow-hidden">
                      {item.product.images[0] ? (
                        <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-700 italic font-serif">IMG</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-[#161616] text-[#C5A059] border border-[#333]">
                            ID: {getProductDisplayId(item.product)}
                          </span>
                        </div>
                        <h4 className="text-sm font-serif text-white mt-1">{item.product.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[#C5A059] text-sm font-medium">
                            {formatPrice(getEffectivePrice(item.product))}
                          </span>
                          {item.product.discountPercentage && item.product.discountPercentage > 0 ? (
                            <span className="text-neutral-500 text-xs line-through">
                              {formatPrice(item.product.price)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-3 bg-[#050505] border border-[#222] rounded px-2 py-1">
                          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="text-neutral-500 hover:text-white">-</button>
                          <span className="text-xs">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="text-neutral-500 hover:text-white">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-neutral-500 hover:text-red-500 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-[#222] bg-[#161616]">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[11px] uppercase tracking-widest text-neutral-400">Total Estimado</span>
                  <span className="text-xl font-serif text-[#C5A059]">{formatPrice(cartTotal)}</span>
                </div>
                <Button variant="primary" className="w-full h-12" onClick={handleWhatsAppCheckout}>
                  ENVIAR PEDIDO POR WHATSAPP
                </Button>
                <p className="text-[9px] text-neutral-500 text-center uppercase tracking-widest mt-4">
                  Serás redirigido a WhatsApp para confirmar
                </p>
              </div>
            )}
            
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Outlet />
      </main>
      
      <footer className="border-t border-[#222] py-8 md:py-10 mt-auto bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-neutral-500 text-[11px] uppercase tracking-widest gap-4 text-center">
          <span>&copy; {new Date().getFullYear()} {settings?.title || 'AURUM & CO.'}. Todos los derechos reservados. Creado por Joel Arguello.</span>
          <div>
            {user ? (
              <Link to="/admin" className="text-[#C5A059] hover:underline flex items-center justify-center gap-1.5 transition-colors">
                <ShieldCheck className="w-3.5 h-3.5" />
                Panel de Administración
              </Link>
            ) : (
              <Link to="/admin/login" className="text-neutral-500 hover:text-[#C5A059] transition-colors flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Acceso Admin
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
