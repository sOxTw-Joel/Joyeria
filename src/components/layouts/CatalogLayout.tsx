import { Outlet, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSettings, getCategories } from '../../lib/db';
import { StoreSettings, Category } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { ShoppingBag, Menu, X, Trash2 } from 'lucide-react';
import { cn, formatPrice } from '../../lib/utils';
import { Button } from '../ui/Button';

export default function CatalogLayout() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  useEffect(() => {
    getSettings().then(setSettings);
    getCategories().then(setCategories);
  }, []);

  const visibleCats = categories.filter(c => settings?.visibleCategories?.includes(c.id));

  const handleWhatsAppCheckout = () => {
    if (!settings?.whatsappNumber) {
      alert("El número de WhatsApp no está configurado.");
      return;
    }

    let message = "Hola, me gustaría hacer un pedido:\n\n";
    cart.forEach(item => {
      message += `- ${item.product.title} (x${item.quantity}) = ${formatPrice(item.product.price * item.quantity)}\n`;
    });
    message += `\nTotal: ${formatPrice(cartTotal)}`;

    const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-white selection:bg-[#C5A059]/30 flex flex-col">
      <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 md:h-24 md:items-end md:pb-6">
            
            {/* Mobile Menu Button */}
            <div className="flex md:hidden flex-1">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-neutral-400 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Logo */}
            <Link to="/" className="flex items-center justify-center flex-1 md:flex-none">
              <img 
                src={settings?.logo || "/logo.webp"} 
                alt={settings?.title || "Logo"} 
                className="h-10 md:h-12 w-auto object-contain" 
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 ml-10 flex-1">
              {visibleCats.map(cat => (
                <a key={cat.id} href={`#cat-${cat.id}`} className="text-[11px] tracking-[0.2em] uppercase text-neutral-400 hover:text-white transition-colors">
                  {cat.name}
                </a>
              ))}
            </nav>

            {/* Cart Button */}
            <div className="flex flex-1 justify-end">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 -mr-2 text-neutral-400 hover:text-white transition-colors group"
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
            <div className="flex justify-between items-center mb-10">
              <span className="text-[#C5A059] text-[10px] tracking-[0.2em] uppercase font-bold">Menú</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col space-y-6">
              {visibleCats.map(cat => (
                <a 
                  key={cat.id} 
                  href={`#cat-${cat.id}`} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm tracking-[0.2em] uppercase text-white hover:text-[#C5A059] transition-colors"
                >
                  {cat.name}
                </a>
              ))}
            </nav>
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
                        <h4 className="text-sm font-serif text-white">{item.product.title}</h4>
                        <p className="text-[#C5A059] text-sm mt-1">{formatPrice(item.product.price)}</p>
                      </div>
                      <div className="flex justify-between items-center">
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
      
      <footer className="border-t border-[#222] py-8 md:py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-neutral-600 text-[10px] uppercase tracking-widest gap-4 text-center">
          <span>&copy; {new Date().getFullYear()} {settings?.title || 'AURUM & CO.'}. Todos los derechos reservados.</span>
          <span>Powered by Firebase DB</span>
        </div>
      </footer>
    </div>
  );
}
