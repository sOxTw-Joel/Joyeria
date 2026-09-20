import React, { useEffect, useState, useMemo } from 'react';
import { getProducts, getCategories } from '../lib/db';
import { Product, Category } from '../types';
import { formatPrice, cn, getProductDisplayId, getEffectivePrice } from '../lib/utils';
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
  Percent, 
  ZoomIn, 
  Check 
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/Button';
import { ProductZoomViewer } from '../components/ProductZoomViewer';
import { ProductFullscreenLightbox } from '../components/ProductFullscreenLightbox';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [showDiscountOnly, setShowDiscountOnly] = useState(false);

  // Price Range Filter State
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [activePricePreset, setActivePricePreset] = useState<string | null>(null);

  // Modal & Zoom State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreenZoom, setIsFullscreenZoom] = useState(false);

  // Quick Add To Cart feedback
  const [quickAddedIds, setQuickAddedIds] = useState<Record<string, boolean>>({});

  // Cart Context
  const { addToCart } = useCart();

  useEffect(() => {
    Promise.all([getProducts(), getCategories()]).then(([prods, cats]) => {
      setProducts(prods);
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product);
    setQuickAddedIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setQuickAddedIds(prev => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  const handleOpenDetailModal = (product: Product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0);
    setIsFullscreenZoom(false);
  };

  // Quick price preset handler
  const handlePricePreset = (presetKey: string, min: string, max: string) => {
    if (activePricePreset === presetKey) {
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
    setShowDiscountOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setActivePricePreset(null);
  };

  const isAnyFilterActive = 
    search.trim() !== '' || 
    selectedCategory !== 'all' || 
    showInStockOnly || 
    showDiscountOnly || 
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

      // Discount filter
      if (showDiscountOnly && (!p.discountPercentage || p.discountPercentage <= 0)) return false;

      // Effective Price filter
      const effectivePrice = getEffectivePrice(p);
      if (numMin !== null && !isNaN(numMin) && effectivePrice < numMin) return false;
      if (numMax !== null && !isNaN(numMax) && effectivePrice > numMax) return false;

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
  }, [products, search, selectedCategory, showInStockOnly, showDiscountOnly, minPrice, maxPrice]);

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
              inputMode="search"
              placeholder="Buscar por joya, gema, código o descripción..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#050505] border border-[#333] rounded-lg text-base sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters Toggle: Solo en Stock + En Descuento */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-[11px] tracking-widest uppercase cursor-pointer select-none bg-[#141414] px-3.5 py-2.5 rounded border border-[#2b2b2b] hover:border-neutral-500 transition-colors">
              <input 
                type="checkbox" 
                checked={showInStockOnly}
                onChange={e => setShowInStockOnly(e.target.checked)}
                className="rounded border-[#333] bg-[#050505] text-[#C5A059] focus:ring-[#C5A059] w-3.5 h-3.5"
              />
              <span className="text-neutral-300">Solo en Stock</span>
            </label>

            <label className="flex items-center gap-2 text-[11px] tracking-widest uppercase cursor-pointer select-none bg-[#141414] px-3.5 py-2.5 rounded border border-[#2b2b2b] hover:border-[#C5A059]/60 transition-colors">
              <input 
                type="checkbox" 
                checked={showDiscountOnly}
                onChange={e => setShowDiscountOnly(e.target.checked)}
                className="rounded border-[#333] bg-[#050505] text-[#C5A059] focus:ring-[#C5A059] w-3.5 h-3.5"
              />
              <span className="text-neutral-300 flex items-center gap-1.5">
                <Percent className="w-3 h-3 text-[#C5A059]" />
                En Descuento
              </span>
            </label>

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#C5A059] hover:text-[#d4b373] bg-[#161616] border border-[#C5A059]/30 px-3 py-2.5 rounded transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
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
        <div className="space-y-2 pt-2 border-t border-[#1c1c1c]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-medium flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#C5A059]" />
              Rango de Precio
            </span>

            {/* Custom Inputs */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500">$</span>
                <input 
                  type="number"
                  inputMode="numeric"
                  placeholder="Mínimo"
                  value={minPrice}
                  onChange={(e) => handleCustomPriceChange('min', e.target.value)}
                  className="w-24 sm:w-28 pl-6 pr-2 py-1 bg-[#050505] border border-[#333] rounded text-base sm:text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <span className="text-neutral-600 text-xs">—</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500">$</span>
                <input 
                  type="number"
                  inputMode="numeric"
                  placeholder="Máximo"
                  value={maxPrice}
                  onChange={(e) => handleCustomPriceChange('max', e.target.value)}
                  className="w-24 sm:w-28 pl-6 pr-2 py-1 bg-[#050505] border border-[#333] rounded text-base sm:text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#C5A059]"
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

      {/* 3. CATÁLOGO SEPARADO POR CATEGORÍAS */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-[#0a0a0a] border border-[#222] rounded-lg p-8">
          <SlidersHorizontal className="w-10 h-10 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-serif text-white mb-2">No se encontraron piezas</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mb-6">
            No hay joyas disponibles que coincidan con los filtros seleccionados.
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
              {/* Encabezado elegante de la categoría con título y cantidad de piezas centrados y alineados */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#242424] pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl sm:text-3xl font-serif text-[#F2F2F2] italic tracking-wide">
                    {category.name}
                  </h2>
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#161616] border border-[#C5A059]/40 text-xs tracking-wider uppercase text-[#C5A059] font-medium text-center">
                    {items.length} {items.length === 1 ? 'pieza' : 'piezas'}
                  </span>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-neutral-500">
                  <Sparkles className="w-3 h-3 text-[#C5A059]" />
                  Colección Exclusiva
                </span>
              </div>

              {/* Grid de productos de esta categoría */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {items.map(product => {
                  const effectivePrice = getEffectivePrice(product);
                  const hasDiscount = product.discountPercentage && product.discountPercentage > 0;
                  const isQuickAdded = quickAddedIds[product.id];
                  const isAvailable = product.inStock && product.stock > 0;

                  return (
                    <div 
                      key={product.id} 
                      className="group flex flex-col bg-[#0b0b0b] border border-[#1f1f1f] rounded-lg p-3 hover:border-[#C5A059]/40 transition-all cursor-pointer"
                      onClick={() => handleOpenDetailModal(product)}
                    >
                      {/* Product Image Container */}
                      <div className="aspect-[4/5] bg-neutral-900 border border-[#1a1a1a] rounded overflow-hidden relative mb-3">
                        {product.images[0] ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-700 font-serif italic text-xl md:text-3xl opacity-20">
                            JOYERÍA
                          </div>
                        )}
                        
                        {/* Status Badge: Stock (Top-Left) */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                          {!isAvailable ? (
                            <span className="bg-black/80 text-white border border-white/40 px-2 py-0.5 text-[8px] md:text-[9px] tracking-widest uppercase rounded-sm">
                              Agotado
                            </span>
                          ) : (
                            <span className="bg-[#161616]/90 border border-[#333] text-neutral-300 text-[8px] md:text-[9px] font-medium px-2 py-0.5 rounded-sm backdrop-blur-sm">
                              Stock: {product.stock}
                            </span>
                          )}
                        </div>

                        {/* Discount Badge (Top-Right) */}
                        {hasDiscount && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="bg-[#C5A059] text-black text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-md">
                              -{product.discountPercentage}% OFF
                            </span>
                          </div>
                        )}

                        {/* Hover Quick Zoom Cue */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur border border-white/20 text-[10px] text-white flex items-center gap-1.5 uppercase tracking-wider">
                            <ZoomIn className="w-3 h-3 text-[#C5A059]" />
                            Ver detalle
                          </span>
                        </div>
                      </div>
                      
                      {/* Product Info: Nombre y Precio en la MISMA LÍNEA (Sin ID en la tarjeta) */}
                      <div className="flex-1 flex flex-col justify-between space-y-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 
                            className="font-serif text-sm sm:text-base text-neutral-100 truncate group-hover:text-[#C5A059] transition-colors" 
                            title={product.title}
                          >
                            {product.title}
                          </h3>
                          <div className="flex items-baseline gap-1.5 shrink-0 text-right">
                            {hasDiscount && (
                              <span className="text-[10px] sm:text-xs text-neutral-500 line-through">
                                {formatPrice(product.price)}
                              </span>
                            )}
                            <span className={cn(
                              "font-medium text-xs sm:text-sm whitespace-nowrap", 
                              !isAvailable ? "text-neutral-500 line-through" : "text-[#C5A059]"
                            )}>
                              {formatPrice(effectivePrice)}
                            </span>
                          </div>
                        </div>

                        {/* Botón Añadir al Carrito directo desde afuera */}
                        <button
                          type="button"
                          disabled={!isAvailable}
                          onClick={(e) => handleQuickAdd(e, product)}
                          className={cn(
                            "w-full py-2 px-3 rounded text-[10px] sm:text-[11px] uppercase tracking-widest font-medium transition-all flex items-center justify-center gap-1.5 border select-none",
                            isQuickAdded
                              ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                              : !isAvailable
                                ? "bg-[#111] border-[#222] text-neutral-600 cursor-not-allowed"
                                : "bg-[#141414] border-[#333] text-neutral-300 hover:bg-[#C5A059] hover:text-black hover:border-[#C5A059] active:scale-[0.98]"
                          )}
                        >
                          {isQuickAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>¡Agregado!</span>
                            </>
                          ) : !isAvailable ? (
                            <span>Agotado</span>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Añadir al Carrito</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Uncategorized products section if any */}
          {groupedCategories.uncategorized.length > 0 && (
            <section className="scroll-mt-28 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#242424] pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl sm:text-3xl font-serif text-[#F2F2F2] italic tracking-wide">
                    Otras Creaciones
                  </h2>
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#161616] border border-[#C5A059]/40 text-xs tracking-wider uppercase text-[#C5A059] font-medium text-center">
                    {groupedCategories.uncategorized.length} {groupedCategories.uncategorized.length === 1 ? 'pieza' : 'piezas'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {groupedCategories.uncategorized.map(product => {
                  const effectivePrice = getEffectivePrice(product);
                  const hasDiscount = product.discountPercentage && product.discountPercentage > 0;
                  const isQuickAdded = quickAddedIds[product.id];
                  const isAvailable = product.inStock && product.stock > 0;

                  return (
                    <div 
                      key={product.id} 
                      className="group flex flex-col bg-[#0b0b0b] border border-[#1f1f1f] rounded-lg p-3 hover:border-[#C5A059]/40 transition-all cursor-pointer"
                      onClick={() => handleOpenDetailModal(product)}
                    >
                      <div className="aspect-[4/5] bg-neutral-900 border border-[#1a1a1a] rounded overflow-hidden relative mb-3">
                        {product.images[0] ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-700 font-serif italic text-xl md:text-3xl opacity-20">
                            JOYERÍA
                          </div>
                        )}
                        
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                          {!isAvailable ? (
                            <span className="bg-black/80 text-white border border-white/40 px-2 py-0.5 text-[8px] md:text-[9px] tracking-widest uppercase rounded-sm">
                              Agotado
                            </span>
                          ) : (
                            <span className="bg-[#161616]/90 border border-[#333] text-neutral-300 text-[8px] md:text-[9px] font-medium px-2 py-0.5 rounded-sm backdrop-blur-sm">
                              Stock: {product.stock}
                            </span>
                          )}
                        </div>

                        {hasDiscount && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="bg-[#C5A059] text-black text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-md">
                              -{product.discountPercentage}% OFF
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur border border-white/20 text-[10px] text-white flex items-center gap-1.5 uppercase tracking-wider">
                            <ZoomIn className="w-3 h-3 text-[#C5A059]" />
                            Ver detalle
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between space-y-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 
                            className="font-serif text-sm sm:text-base text-neutral-100 truncate group-hover:text-[#C5A059] transition-colors" 
                            title={product.title}
                          >
                            {product.title}
                          </h3>
                          <div className="flex items-baseline gap-1.5 shrink-0 text-right">
                            {hasDiscount && (
                              <span className="text-[10px] sm:text-xs text-neutral-500 line-through">
                                {formatPrice(product.price)}
                              </span>
                            )}
                            <span className={cn(
                              "font-medium text-xs sm:text-sm whitespace-nowrap", 
                              !isAvailable ? "text-neutral-500 line-through" : "text-[#C5A059]"
                            )}>
                              {formatPrice(effectivePrice)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!isAvailable}
                          onClick={(e) => handleQuickAdd(e, product)}
                          className={cn(
                            "w-full py-2 px-3 rounded text-[10px] sm:text-[11px] uppercase tracking-widest font-medium transition-all flex items-center justify-center gap-1.5 border select-none",
                            isQuickAdded
                              ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                              : !isAvailable
                                ? "bg-[#111] border-[#222] text-neutral-600 cursor-not-allowed"
                                : "bg-[#141414] border-[#333] text-neutral-300 hover:bg-[#C5A059] hover:text-black hover:border-[#C5A059] active:scale-[0.98]"
                          )}
                        >
                          {isQuickAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>¡Agregado!</span>
                            </>
                          ) : !isAvailable ? (
                            <span>Agotado</span>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Añadir al Carrito</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Product Detail Modal with INTERACTIVE MULTIPLATFORM ZOOM (PC, Android, iPhone) */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="bg-[#0F0F0F] border border-[#262626] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row relative my-auto"
            onClick={e => e.stopPropagation()}
          >
            
            {/* Close Button - Touch Target 44x44px for iPhone/Android */}
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-30 min-w-[44px] min-h-[44px] bg-[#161616]/95 border border-[#333] hover:border-[#C5A059] rounded-full text-neutral-300 hover:text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
              title="Cerrar modal"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Left: Touch & Mouse Universal Zoom Viewer */}
            <div className="w-full md:w-1/2 flex flex-col bg-[#050505] border-b md:border-b-0 md:border-r border-[#222]">
              <ProductZoomViewer
                images={selectedProduct.images}
                activeImageIndex={activeImageIndex}
                onSelectImageIndex={setActiveImageIndex}
                title={selectedProduct.title}
                onOpenFullscreen={() => setIsFullscreenZoom(true)}
              />
            </div>

            {/* Right: Product Details */}
            <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 overflow-y-auto bg-[#0F0F0F] flex flex-col justify-between space-y-4 sm:space-y-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:pb-8">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-medium">
                    {categories.find(c => c.id === selectedProduct.categoryId)?.name || 'Colección Exclusiva'}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-[#161616] text-[#C5A059] border border-[#333]">
                    ID: {getProductDisplayId(selectedProduct)}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-light text-[#F2F2F2] leading-tight">
                  {selectedProduct.title}
                </h2>

                {/* Price Display with Discount */}
                <div className="flex items-baseline gap-2.5 sm:gap-3">
                  <span className="text-2xl sm:text-3xl text-[#C5A059] font-medium">
                    {formatPrice(getEffectivePrice(selectedProduct))}
                  </span>
                  {selectedProduct.discountPercentage && selectedProduct.discountPercentage > 0 && (
                    <>
                      <span className="text-xs sm:text-sm text-neutral-500 line-through">
                        {formatPrice(selectedProduct.price)}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#C5A059] text-black font-bold text-[10px] sm:text-xs">
                        {selectedProduct.discountPercentage}% OFF
                      </span>
                    </>
                  )}
                </div>
                
                {/* Description */}
                <div className="prose prose-invert prose-sm text-neutral-400 text-xs sm:text-sm">
                  <p className="whitespace-pre-wrap leading-relaxed">{selectedProduct.description}</p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="border-t border-[#222] pt-4 sm:pt-6 space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center text-[10px] sm:text-[11px] tracking-widest uppercase text-neutral-400">
                  <span>Disponibilidad</span>
                  {selectedProduct.inStock && selectedProduct.stock > 0 ? (
                    <span className="font-bold text-[#C5A059]">{selectedProduct.stock} piezas disponibles</span>
                  ) : (
                    <span className="font-bold text-red-500">Agotado Temporalmente</span>
                  )}
                </div>
                
                {selectedProduct.inStock && selectedProduct.stock > 0 && (
                  <Button 
                    variant="primary" 
                    className="w-full min-h-[48px] h-12 flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-widest font-semibold active:scale-[0.98]"
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    AGREGAR AL CARRITO
                  </Button>
                )}

                <div className="bg-[#161616] border border-[#222] p-3 rounded-lg flex items-start gap-2.5 text-[10px] uppercase tracking-widest text-neutral-400 leading-relaxed">
                  <Info className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                  <p>Añade piezas a tu carrito para realizar un pedido o cotización por WhatsApp con nuestros orfebres y asesores.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Multiplatform Lightbox with gestures */}
      {isFullscreenZoom && selectedProduct && (
        <ProductFullscreenLightbox
          images={selectedProduct.images}
          initialIndex={activeImageIndex}
          title={selectedProduct.title}
          onClose={() => setIsFullscreenZoom(false)}
        />
      )}

    </div>
  );
}
