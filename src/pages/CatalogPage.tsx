import { useEffect, useState, useMemo } from 'react';
import { getProducts, getCategories } from '../lib/db';
import { Product, Category } from '../types';
import { formatPrice, cn, getProductDisplayId } from '../lib/utils';
import { 
  Search, 
  SlidersHorizontal, 
  Info, 
  X, 
  ShoppingBag, 
  DollarSign, 
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
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

  // Price Range Filter State
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [activePricePreset, setActivePricePreset] = useState<string | null>(null);

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

  // Quick price preset handler
  const handlePricePreset = (presetKey: string, min: string, max: string) => {
    if (activePricePreset === presetKey) {
      // Toggle off
      setActivePricePreset(null);
      setMinPrice('');
      setMaxPrice('');
    } else {
      setActivePricePreset(presetKey);
      setMinPrice(min);
      setMaxPrice(max);
    }
  };

  const handleCustomPriceChange = (type: 'min' | 'max', val: string) => {
    setActivePricePreset(null);
    if (type === 'min') setMinPrice(val);
    else setMaxPrice(val);
  };

  const resetAllFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setShowInStockOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setActivePricePreset(null);
  };

  const isAnyFilterActive = 
    search.trim() !== '' || 
    selectedCategory !== 'all' || 
    showInStockOnly || 
    minPrice !== '' || 
    maxPrice !== '';

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const numMin = minPrice !== '' ? parseFloat(minPrice) : null;
    const numMax = maxPrice !== '' ? parseFloat(maxPrice) : null;

    return products.filter(p => {
      // Category filter
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;

      // Stock filter
      if (showInStockOnly && (!p.inStock || p.stock === 0)) return false;

      // Price filter
      if (numMin !== null && !isNaN(numMin) && p.price < numMin) return false;
      if (numMax !== null && !isNaN(numMax) && p.price > numMax) return false;

      // Search query
      if (search.trim()) {
        const query = search.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(query);
        const inDesc = p.description.toLowerCase().includes(query);
        const inSku = p.sku?.toLowerCase().includes(query);
        const inId = String(p.displayId || '').includes(query);
        if (!inTitle && !inDesc && !inSku && !inId) return false;
      }

      return true;
    });
  }, [products, search, selectedCategory, showInStockOnly, minPrice, maxPrice]);

  // Group filtered products by Category
  const groupedCategories = useMemo(() => {
    const map: { [catId: string]: Product[] } = {};
    const uncategorized: Product[] = [];

    categories.forEach(c => {
      map[c.id] = [];
    });

    filteredProducts.forEach(p => {
      if (p.categoryId && map[p.categoryId]) {
        map[p.categoryId].push(p);
      } else {
        uncategorized.push(p);
      }
    });

    // Categories that match selection
    const result: { category: Category; items: Product[] }[] = [];
    categories.forEach(c => {
      if (selectedCategory === 'all' || selectedCategory === c.id) {
        if (map[c.id]?.length > 0) {
          result.push({ category: c, items: map[c.id] });
        }
      }
    });

    return {
      categorySections: result,
      uncategorized: (selectedCategory === 'all' && uncategorized.length > 0) ? uncategorized : []
    };
  }, [categories, filteredProducts, selectedCategory]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-pulse py-8">
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
    <div className="space-y-8 pb-16">
      
      {/* Search & Main Filter Controls Header */}
      <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Buscar por joya, gema, código o descripción..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#050505] border border-[#333] rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters Toggle */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-[11px] tracking-widest uppercase cursor-pointer select-none bg-[#141414] px-3 py-2 rounded border border-[#2b2b2b] hover:border-neutral-500 transition-colors">
              <input 
                type="checkbox" 
                checked={showInStockOnly}
                onChange={e => setShowInStockOnly(e.target.checked)}
                className="rounded border-[#333] bg-[#050505] text-[#C5A059] focus:ring-[#C5A059] w-3.5 h-3.5"
              />
              <span className="text-neutral-300">Solo en Stock</span>
            </label>

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#C5A059] hover:text-[#d4b373] bg-[#161616] border border-[#C5A059]/30 px-3 py-2 rounded transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. SELECTOR DE CATEGORÍAS */}
        <div className="space-y-2 pt-2 border-t border-[#1c1c1c]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
              Categorías
            </span>
            <span className="text-[10px] uppercase tracking-wider text-neutral-500">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'pieza encontrada' : 'piezas encontradas'}
            </span>
          </div>

          {/* Categories Pill Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider whitespace-nowrap transition-all border flex items-center gap-1.5 flex-shrink-0",
                selectedCategory === 'all'
                  ? "bg-[#C5A059] text-black border-[#C5A059] font-bold shadow-sm"
                  : "bg-[#0f0f0f] text-neutral-400 border-[#2a2a2a] hover:border-neutral-500 hover:text-white"
              )}
            >
              <span>Todas las Piezas</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full",
                selectedCategory === 'all' ? "bg-black/20 text-black" : "bg-[#1c1c1c] text-neutral-400"
              )}>
                {products.length}
              </span>
            </button>

            {categories.map(cat => {
              const countInCat = products.filter(p => p.categoryId === cat.id).length;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider whitespace-nowrap transition-all border flex items-center gap-1.5 flex-shrink-0",
                    isSelected
                      ? "bg-[#C5A059] text-black border-[#C5A059] font-bold shadow-sm"
                      : "bg-[#0f0f0f] text-neutral-400 border-[#2a2a2a] hover:border-neutral-500 hover:text-white"
                  )}
                >
                  <span>{cat.name}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    isSelected ? "bg-black/20 text-black" : "bg-[#1c1c1c] text-neutral-400"
                  )}>
                    {countInCat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. SELECTOR DE RANGO DE PRECIOS */}
        <div className="space-y-3 pt-2 border-t border-[#1c1c1c]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-medium flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#C5A059]" />
              Rango de Precios
            </span>

            {/* Numerical Min/Max inputs */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#050505] border border-[#333] rounded px-2 py-1">
                <span className="text-[10px] text-neutral-500">$</span>
                <input 
                  type="number"
                  placeholder="Mín"
                  min="0"
                  value={minPrice}
                  onChange={e => handleCustomPriceChange('min', e.target.value)}
                  className="w-20 bg-transparent text-xs text-white placeholder:text-neutral-600 focus:outline-none"
                />
              </div>

              <span className="text-neutral-600 text-xs">—</span>

              <div className="flex items-center gap-1 bg-[#050505] border border-[#333] rounded px-2 py-1">
                <span className="text-[10px] text-neutral-500">$</span>
                <input 
                  type="number"
                  placeholder="Máx"
                  min="0"
                  value={maxPrice}
                  onChange={e => handleCustomPriceChange('max', e.target.value)}
                  className="w-20 bg-transparent text-xs text-white placeholder:text-neutral-600 focus:outline-none"
                />
              </div>

              {(minPrice || maxPrice) && (
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice('');
                    setMaxPrice('');
                    setActivePricePreset(null);
                  }}
                  className="p-1 text-neutral-500 hover:text-white"
                  title="Borrar filtro de precio"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs">
            <button
              type="button"
              onClick={() => handlePricePreset('p1', '', '50000')}
              className={cn(
                "px-2.5 py-1 rounded text-[11px] uppercase tracking-wider whitespace-nowrap transition-colors border",
                activePricePreset === 'p1' 
                  ? "bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]" 
                  : "bg-[#050505] text-neutral-400 border-[#2b2b2b] hover:border-neutral-500"
              )}
            >
              Hasta $50.000
            </button>

            <button
              type="button"
              onClick={() => handlePricePreset('p2', '50000', '150000')}
              className={cn(
                "px-2.5 py-1 rounded text-[11px] uppercase tracking-wider whitespace-nowrap transition-colors border",
                activePricePreset === 'p2' 
                  ? "bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]" 
                  : "bg-[#050505] text-neutral-400 border-[#2b2b2b] hover:border-neutral-500"
              )}
            >
              $50.000 — $150.000
            </button>

            <button
              type="button"
              onClick={() => handlePricePreset('p3', '150000', '350000')}
              className={cn(
                "px-2.5 py-1 rounded text-[11px] uppercase tracking-wider whitespace-nowrap transition-colors border",
                activePricePreset === 'p3' 
                  ? "bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]" 
                  : "bg-[#050505] text-neutral-400 border-[#2b2b2b] hover:border-neutral-500"
              )}
            >
              $150.000 — $350.000
            </button>

            <button
              type="button"
              onClick={() => handlePricePreset('p4', '350000', '')}
              className={cn(
                "px-2.5 py-1 rounded text-[11px] uppercase tracking-wider whitespace-nowrap transition-colors border",
                activePricePreset === 'p4' 
                  ? "bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]" 
                  : "bg-[#050505] text-neutral-400 border-[#2b2b2b] hover:border-neutral-500"
              )}
            >
              Más de $350.000
            </button>
          </div>
        </div>

      </div>

      {/* 3. CATÁLOGO SEPARADO POR CATEGORÍAS (CON SU TÍTULO Y CANTIDAD DE PRODUCTOS) */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-[#0c0c0c] border border-[#222] rounded-lg p-8">
          <Info className="w-10 h-10 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-xl font-serif italic text-white mb-2">No se encontraron piezas</h3>
          <p className="text-neutral-400 text-xs uppercase tracking-widest max-w-md mx-auto mb-6">
            No hay joyas disponibles que coincidan con la categoría o el rango de precio seleccionado.
          </p>
          <Button variant="primary" onClick={resetAllFilters}>
            Restablecer Filtros
          </Button>
        </div>
      ) : (
        <div className="space-y-16">
          {groupedCategories.categorySections.map(({ category, items }) => (
            <section 
              key={category.id} 
              id={`cat-${category.id}`} 
              className="scroll-mt-28 space-y-6"
            >
              {/* Encabezado elegante de la categoría con título y cantidad de productos */}
              <div className="flex items-end justify-between border-b border-[#242424] pb-4">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-2xl sm:text-3xl font-serif text-[#F2F2F2] italic tracking-wide">
                    {category.name}
                  </h2>
                  <span className="text-xs uppercase tracking-widest text-[#C5A059] font-medium">
                    ({items.length} {items.length === 1 ? 'pieza' : 'piezas'})
                  </span>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-neutral-500">
                  <Sparkles className="w-3 h-3 text-[#C5A059]" />
                  Colección Exclusiva
                </span>
              </div>

              {/* Grid de productos de esta categoría */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {items.map(product => (
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
                        <div className="text-neutral-700 font-serif italic text-xl md:text-4xl opacity-20">JOYERÍA</div>
                      )}
                      
                      {/* Status Badges */}
                      <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-2">
                        {(!product.inStock || product.stock === 0) ? (
                          <span className="bg-black/70 text-white border border-white/60 px-2 py-0.5 md:px-2.5 md:py-1 text-[8px] md:text-[9px] tracking-widest uppercase">
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
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] font-mono text-[#C5A059] tracking-wider opacity-90">
                          ID: {getProductDisplayId(product)}
                        </span>
                      </div>
                      <h3 className="font-serif text-sm md:text-base text-neutral-100 line-clamp-1 group-hover:text-[#C5A059] transition-colors">
                        {product.title}
                      </h3>
                      <span className={cn(
                        "font-medium text-xs md:text-sm mt-1", 
                        !product.inStock || product.stock === 0 ? "text-neutral-500 line-through" : "text-[#C5A059]"
                      )}>
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Uncategorized products section if any */}
          {groupedCategories.uncategorized.length > 0 && (
            <section className="scroll-mt-28 space-y-6">
              <div className="flex items-end justify-between border-b border-[#242424] pb-4">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-2xl sm:text-3xl font-serif text-[#F2F2F2] italic tracking-wide">
                    Otras Creaciones
                  </h2>
                  <span className="text-xs uppercase tracking-widest text-[#C5A059] font-medium">
                    ({groupedCategories.uncategorized.length} {groupedCategories.uncategorized.length === 1 ? 'pieza' : 'piezas'})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {groupedCategories.uncategorized.map(product => (
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
                        <div className="text-neutral-700 font-serif italic text-xl md:text-4xl opacity-20">JOYERÍA</div>
                      )}
                      
                      <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-2">
                        {(!product.inStock || product.stock === 0) ? (
                          <span className="bg-black/70 text-white border border-white/60 px-2 py-0.5 md:px-2.5 md:py-1 text-[8px] md:text-[9px] tracking-widest uppercase">
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
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] font-mono text-[#C5A059] tracking-wider opacity-90">
                          ID: {getProductDisplayId(product)}
                        </span>
                      </div>
                      <h3 className="font-serif text-sm md:text-base text-neutral-100 line-clamp-1 group-hover:text-[#C5A059] transition-colors">
                        {product.title}
                      </h3>
                      <span className={cn(
                        "font-medium text-xs md:text-sm mt-1", 
                        !product.inStock || product.stock === 0 ? "text-neutral-500 line-through" : "text-[#C5A059]"
                      )}>
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
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
                  JOYERÍA
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
                  {categories.find(c => c.id === selectedProduct.categoryId)?.name || 'Colección Exclusiva'}
                </span>
                <span className="text-[9px] md:text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-[#161616] text-[#C5A059] border border-[#333]">
                  ID: {getProductDisplayId(selectedProduct)}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-light text-[#F2F2F2] mt-1 md:mt-2 mb-2">{selectedProduct.title}</h2>
              <p className="text-xl md:text-2xl text-[#C5A059] mb-6 md:mb-8 font-medium">{formatPrice(selectedProduct.price)}</p>
              
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
