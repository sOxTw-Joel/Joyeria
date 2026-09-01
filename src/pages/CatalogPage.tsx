import { useEffect, useState, useMemo } from 'react';
import { getProducts, getCategories } from '../lib/db';
import { Product, Category } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { Search, SlidersHorizontal, Info, X } from 'lucide-react';

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
      <div className="flex justify-center py-20 text-stone-500 font-serif">
        Cargando colecciones...
      </div>
    );
  }

  return (
    <div>
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
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
        
        <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center gap-2 text-[11px] tracking-widest uppercase">
            <SlidersHorizontal className="w-4 h-4 text-neutral-500" />
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none text-neutral-400 font-medium cursor-pointer focus:ring-0 uppercase tracking-widest"
            >
              <option value="all">Todas</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <label className="flex items-center gap-2 text-[11px] tracking-widest uppercase cursor-pointer whitespace-nowrap border-l border-[#333] pl-4">
            <input 
              type="checkbox" 
              checked={showInStockOnly}
              onChange={e => setShowInStockOnly(e.target.checked)}
              className="rounded border-[#333] bg-[#0a0a0a] text-[#C5A059] focus:ring-[#C5A059] w-3 h-3"
            />
            <span className="text-neutral-500 hover:text-white transition-colors">Solo en stock</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="group cursor-pointer flex flex-col"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="aspect-[4/5] bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center relative overflow-hidden mb-4">
                {product.images[0] ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  />
                ) : (
                  <div className="text-neutral-700 font-serif italic text-4xl opacity-20">IMAGE</div>
                )}
                
                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {(!product.inStock || product.stock === 0) ? (
                    <span className="bg-black/60 text-white border border-white px-3 py-1 text-[10px] tracking-widest uppercase">
                      Agotado
                    </span>
                  ) : (
                    <span className="bg-[#C5A059] text-black text-[9px] font-bold px-2 py-1 rounded-sm">
                      STOCKED: {product.stock}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-lg text-neutral-100">{product.title}</h3>
                  <p className="text-[11px] text-neutral-500 mt-1 max-w-[180px] line-clamp-2">{product.description}</p>
                </div>
                <span className={cn("font-medium", !product.inStock || product.stock === 0 ? "text-neutral-500 line-through" : "text-[#C5A059]")}>
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
              className="absolute top-4 right-4 z-10 bg-[#161616]/80 border border-[#333] backdrop-blur rounded-full p-2 text-neutral-400 hover:text-white hover:border-[#C5A059] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Image Gallery */}
            <div className="w-full md:w-1/2 h-64 md:h-auto bg-[#050505] relative border-r border-[#222]">
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
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#161616]/90 border border-[#333] backdrop-blur px-3 py-1 text-[10px] tracking-widest uppercase text-white">
                  {selectedProduct.images.length} Vistas
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto bg-[#0F0F0F]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059]">
                {categories.find(c => c.id === selectedProduct.categoryId)?.name}
              </span>
              <h2 className="text-4xl font-serif font-light text-[#F2F2F2] mt-2 mb-2">{selectedProduct.title}</h2>
              <p className="text-2xl text-[#C5A059] mb-8">{formatPrice(selectedProduct.price)}</p>
              
              <div className="prose prose-invert prose-sm mb-8 text-neutral-400">
                <p className="whitespace-pre-wrap leading-relaxed">{selectedProduct.description}</p>
              </div>

              <div className="border-t border-[#222] pt-8 space-y-4">
                <div className="flex justify-between items-center text-[11px] tracking-widest uppercase text-neutral-500">
                  <span>Disponibilidad</span>
                  {selectedProduct.inStock && selectedProduct.stock > 0 ? (
                    <span className="font-bold text-[#C5A059]">{selectedProduct.stock} en stock</span>
                  ) : (
                    <span className="font-bold text-red-500">Agotado</span>
                  )}
                </div>
                
                <div className="bg-[#161616] border border-[#222] p-4 rounded flex items-start gap-3 mt-6 text-[11px] uppercase tracking-widest text-neutral-400 leading-relaxed">
                  <Info className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                  <p>Este catálogo es únicamente de exhibición. Para consultas o compras, por favor contacte a la tienda directamente.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
