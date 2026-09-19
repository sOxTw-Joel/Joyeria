import { useEffect, useState, useMemo } from 'react';
import { getProducts, getCategories } from '../lib/db';
import { Product, Category } from '../types';
import { formatPrice, cn, getProductDisplayId } from '../lib/utils';
import { Search, SlidersHorizontal, Info, X, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/Button';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  // Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Cart
  const { addToCart } = useCart();

  useEffect(() => {
    Promise.all([getProducts(), getCategories()]).then(([prods, cats]) => {
      setProducts(prods);
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
      if (showInStockOnly && (!p.inStock || p.stock === 0)) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, search, selectedCategory, showInStockOnly]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-[#0e0e0e] border border-[#222] rounded overflow-hidden">
            <div className="aspect-[4/5] bg-[#141414]" />
            <div className="p-4 space-y-2">
              <div className="h-3 bg-[#1e1e1e] rounded w-3/4" />
              <div className="h-3 bg-[#1a1a1a] rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Buscar joyas..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0a0a0a] border border-[#333] rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-shadow"
          />
        </div>
        
        <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide w-full md:w-auto">
          <div className="flex items-center gap-2 text-[11px] tracking-widest uppercase flex-shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-neutral-500" />
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none text-neutral-400 font-medium cursor-pointer focus:ring-0 uppercase tracking-widest px-0"
            >
              <option value="all">Todas</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <label className="flex items-center gap-2 text-[11px] tracking-widest uppercase cursor-pointer whitespace-nowrap border-l border-[#333] pl-4 flex-shrink-0">
            <input 
              type="checkbox" 
              checked={showInStockOnly}
              onChange={e => setShowInStockOnly(e.target.checked)}
              className="rounded border-[#333] bg-[#0a0a0a] text-[#C5A059] focus:ring-[#C5A059] w-3 h-3"
            />
            <span className="text-neutral-500 hover:text-white transition-colors">Solo stock</span>
          </label>
        </div>
      </div>

      {/* Catalog Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-[#161616] border border-[#222] rounded-lg">
          <Info className="w-8 h-8 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-serif italic text-white">No se encontraron piezas</h3>
          <p className="text-neutral-500 text-[11px] tracking-widest uppercase mt-2">Intenta ajustar tus filtros de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="group cursor-pointer flex flex-col"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="aspect-[4/5] bg-neutral-900 border border-[#222] rounded flex flex-col items-center justify-center relative overflow-hidden mb-3 md:mb-4">
                {product.images[0] ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  />
                ) : (
                  <div className="text-neutral-700 font-serif italic text-xl md:text-4xl opacity-20">IMAGE</div>
                )}
                
                {/* Status Badges */}
                <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-2">
                  {(!product.inStock || product.stock === 0) ? (
                    <span className="bg-black/60 text-white border border-white px-2 py-0.5 md:px-3 md:py-1 text-[8px] md:text-[10px] tracking-widest uppercase">
                      Agotado
                    </span>
                  ) : (
                    <span className="bg-[#C5A059] text-black text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-sm">
                      STOCK: {product.stock}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[9px] font-mono text-[#C5A059] tracking-wider opacity-90">
                    ID: {getProductDisplayId(product)}
                  </span>
                </div>
                <h3 className="font-serif text-sm md:text-lg text-neutral-100 line-clamp-1">{product.title}</h3>
                <span className={cn("font-medium text-xs md:text-sm mt-1", !product.inStock || product.stock === 0 ? "text-neutral-500 line-through" : "text-[#C5A059]")}>
                  {formatPrice(product.price)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F0F0F] border border-[#222] rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-2 right-2 md:top-4 md:right-4 z-10 bg-[#161616]/80 border border-[#333] backdrop-blur rounded-full p-2 text-neutral-400 hover:text-white hover:border-[#C5A059] transition-colors"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            
            {/* Image Gallery */}
            <div className="w-full md:w-1/2 h-56 md:h-auto bg-[#050505] relative border-b md:border-b-0 md:border-r border-[#222]">
              {selectedProduct.images[0] ? (
                <div className="w-full h-full overflow-y-auto flex flex-col snap-y snap-mandatory scrollbar-hide">
                  {selectedProduct.images.map((img, i) => (
                    <img key={i} src={img} alt={`${selectedProduct.title} - ${i + 1}`} className="w-full h-full object-cover snap-start flex-shrink-0" />
                  ))}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-700 font-serif italic text-4xl opacity-20">
                  IMAGE
                </div>
              )}
              {selectedProduct.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#161616]/90 border border-[#333] backdrop-blur px-3 py-1 text-[9px] md:text-[10px] tracking-widest uppercase text-white shadow">
                  {selectedProduct.images.length} Vistas
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="w-full md:w-1/2 p-6 md:p-12 overflow-y-auto bg-[#0F0F0F]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-[#C5A059]">
                  {categories.find(c => c.id === selectedProduct.categoryId)?.name}
                </span>
                <span className="text-[9px] md:text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-[#161616] text-[#C5A059] border border-[#333]">
                  ID: {getProductDisplayId(selectedProduct)}
                </span>
              </div>
              <h2 className="text-2xl md:text-4xl font-serif font-light text-[#F2F2F2] mt-1 md:mt-2 mb-2">{selectedProduct.title}</h2>
              <p className="text-xl md:text-2xl text-[#C5A059] mb-6 md:mb-8">{formatPrice(selectedProduct.price)}</p>
              
              <div className="prose prose-invert prose-sm mb-6 md:mb-8 text-neutral-400 text-xs md:text-sm">
                <p className="whitespace-pre-wrap leading-relaxed">{selectedProduct.description}</p>
              </div>

              <div className="border-t border-[#222] pt-6 md:pt-8 space-y-4 md:space-y-6">
                <div className="flex justify-between items-center text-[10px] md:text-[11px] tracking-widest uppercase text-neutral-500">
                  <span>Disponibilidad</span>
                  {selectedProduct.inStock && selectedProduct.stock > 0 ? (
                    <span className="font-bold text-[#C5A059]">{selectedProduct.stock} en stock</span>
                  ) : (
                    <span className="font-bold text-red-500">Agotado</span>
                  )}
                </div>
                
                {selectedProduct.inStock && selectedProduct.stock > 0 && (
                  <Button 
                    variant="primary" 
                    className="w-full h-12 flex items-center justify-center gap-2"
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    AGREGAR AL CARRITO
                  </Button>
                )}

                <div className="bg-[#161616] border border-[#222] p-3 md:p-4 rounded flex items-start gap-3 text-[10px] md:text-[11px] uppercase tracking-widest text-neutral-400 leading-relaxed">
                  <Info className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                  <p>Añade piezas a tu carrito para enviar una solicitud de cotización o compra por WhatsApp directamente a nuestra tienda.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
