import React, { useEffect, useState } from "react";
import { 
  getProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  getCategories, 
  addCategory, 
  updateCategory, 
  deleteCategory 
} from '../../lib/db';
import { Product, Category } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Label } from '../../components/ui/Forms';
import { compressImage, getProductDisplayId, formatPrice } from '../../lib/utils';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Archive, 
  CheckCircle, 
  Image as ImageIcon, 
  X, 
  Package, 
  Tags, 
  Search, 
  Check, 
  Sparkles,
  Layers
} from 'lucide-react';

export default function AdminProducts() {
  // Navigation tabs within Gestión de Catálogo
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter in products list
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Product Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State for Product
  const [sku, setSku] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<string>('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState<string>('1');
  const [inStock, setInStock] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [archived, setArchived] = useState(false);

  // Inline Category Creation inside Product Modal (Feature 3)
  const [isCreatingCategoryInline, setIsCreatingCategoryInline] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState('');
  const [inlineCategoryLoading, setInlineCategoryLoading] = useState(false);
  const [categoryNotice, setCategoryNotice] = useState('');

  // Category Management Tab State (Feature 2 & 4)
  const [newCatName, setNewCatName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [prods, cats] = await Promise.all([getProducts(true), getCategories()]);
    setProducts(prods);
    setCategories(cats);
    setLoading(false);
  };

  const resetProductForm = (availableCategories: Category[] = categories) => {
    setSku('');
    setTitle('');
    setDescription('');
    setPrice('');
    setDiscountPercentage('');
    setCategoryId(availableCategories.length > 0 ? availableCategories[0].id : '');
    setStock('1');
    setInStock(true);
    setImages([]);
    setArchived(false);
    setEditingId(null);
    setIsCreatingCategoryInline(false);
    setInlineCategoryName('');
    setCategoryNotice('');
  };

  const handleOpenNew = () => {
    resetProductForm();
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setSku(p.sku || '');
    setTitle(p.title);
    setDescription(p.description);
    setPrice(p.price !== undefined && p.price !== null ? String(p.price) : '');
    setDiscountPercentage(p.discountPercentage !== undefined && p.discountPercentage !== null ? String(p.discountPercentage) : '');
    setCategoryId(p.categoryId);
    setStock(String(p.stock ?? 1));
    setInStock(p.inStock);
    setImages(p.images);
    setArchived(p.archived);
    setEditingId(p.id);
    setIsCreatingCategoryInline(false);
    setInlineCategoryName('');
    setCategoryNotice('');
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const base64 = await compressImage(files[i]);
        newImages.push(base64);
      } catch (err) {
        console.error("Error compressing image", err);
      }
    }
    setImages(prev => [...prev, ...newImages]);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = price === '' ? 0 : parseFloat(price);
    const numStock = stock === '' ? 0 : parseInt(stock, 10);
    const numDiscount = discountPercentage === '' ? undefined : parseFloat(discountPercentage);
    const productData = {
      sku: sku.trim().toUpperCase() || undefined,
      title,
      description,
      price: isNaN(numPrice) ? 0 : numPrice,
      discountPercentage: (numDiscount !== undefined && !isNaN(numDiscount) && numDiscount > 0) ? Math.min(100, Math.max(0, numDiscount)) : undefined,
      categoryId,
      stock: isNaN(numStock) ? 0 : numStock,
      inStock,
      images,
      archived,
    };

    if (editingId) {
      await updateProduct(editingId, productData);
    } else {
      await addProduct({ ...productData, createdAt: Date.now() });
    }
    setShowModal(false);
    loadData();
  };

  const handleToggleArchive = async (id: string, current: boolean) => {
    await updateProduct(id, { archived: !current });
    loadData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      await deleteProduct(id);
      loadData();
    }
  };

  // INLINE CATEGORY CREATION (Feature 3: Without losing product progress)
  const handleCreateCategoryInline = async () => {
    const trimmed = inlineCategoryName.trim();
    if (!trimmed) return;
    setInlineCategoryLoading(true);
    try {
      const newCatId = await addCategory({ name: trimmed });
      const updatedCats = await getCategories();
      setCategories(updatedCats);
      // Automatically assign the newly created category to the current product form
      setCategoryId(newCatId);
      setInlineCategoryName('');
      setIsCreatingCategoryInline(false);
      setCategoryNotice(`Categoría "${trimmed}" creada y seleccionada automáticamente.`);
      setTimeout(() => setCategoryNotice(''), 4500);
    } catch (err) {
      console.error('Error creating inline category:', err);
      alert('Error al crear la categoría.');
    } finally {
      setInlineCategoryLoading(false);
    }
  };

  // CATEGORIES TAB ACTIONS (Feature 2)
  const handleAddCategoryFromTab = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    setAddingCategory(true);
    try {
      await addCategory({ name: trimmed });
      setNewCatName('');
      const updated = await getCategories();
      setCategories(updated);
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Error al agregar categoría.');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    const trimmed = editingCatName.trim();
    if (!trimmed) return;
    await updateCategory(id, { name: trimmed });
    setEditingCatId(null);
    const updated = await getCategories();
    setCategories(updated);
  };

  const handleDeleteCategory = async (id: string) => {
    const count = products.filter(p => p.categoryId === id).length;
    const warning = count > 0 
      ? `Esta categoría tiene ${count} producto(s) asignado(s). ¿Estás seguro de eliminarla?`
      : '¿Estás seguro de eliminar esta categoría permanentemente?';

    if (confirm(warning)) {
      await deleteCategory(id);
      const updated = await getCategories();
      setCategories(updated);
    }
  };

  // Filtered products
  const filteredProducts = products.filter(p => {
    if (selectedCategoryFilter !== 'all' && p.categoryId !== selectedCategoryFilter) return false;
    if (productSearch) {
      const searchLower = productSearch.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(searchLower);
      const matchSku = p.sku?.toLowerCase().includes(searchLower);
      const matchDesc = p.description?.toLowerCase().includes(searchLower);
      if (!matchTitle && !matchSku && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] mb-1">Inventario & Colecciones</div>
          <h1 className="text-2xl font-serif text-[#F2F2F2] font-light italic">Gestión de Catálogo</h1>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'products' ? (
            <Button onClick={handleOpenNew} variant="primary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </Button>
          ) : (
            <button
              onClick={() => {
                const el = document.getElementById('new-category-input');
                el?.focus();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#C5A059] text-black font-semibold text-[11px] uppercase tracking-widest hover:bg-[#d4b373] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Categoría</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center border-b border-[#222] gap-8">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 pb-3 text-xs uppercase tracking-widest font-medium transition-colors relative ${
            activeTab === 'products' ? 'text-[#C5A059]' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Productos</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-[#161616] border border-[#333] text-neutral-300">
            {products.length}
          </span>
          {activeTab === 'products' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A059]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 pb-3 text-xs uppercase tracking-widest font-medium transition-colors relative ${
            activeTab === 'categories' ? 'text-[#C5A059]' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Tags className="w-4 h-4" />
          <span>Categorías</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-[#161616] border border-[#333] text-neutral-300">
            {categories.length}
          </span>
          {activeTab === 'categories' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A059]" />
          )}
        </button>
      </div>

      {/* TAB 1: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0F0F0F] p-4 rounded border border-[#222]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Buscar por título, SKU o ID..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-[#050505] border border-[#333] rounded text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059]"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 whitespace-nowrap">Filtrar:</span>
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="h-8 rounded border border-[#333] bg-[#050505] px-3 text-xs text-neutral-300 focus:outline-none focus:border-[#C5A059] uppercase tracking-wider"
              >
                <option value="all">Todas las categorías ({products.length})</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({products.filter(p => p.categoryId === c.id).length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-[#0F0F0F] rounded border border-[#222] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] uppercase tracking-widest whitespace-nowrap">
                <thead className="bg-[#161616] text-neutral-500 border-b border-[#222]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Producto</th>
                    <th className="px-6 py-4 font-medium">Precio</th>
                    <th className="px-6 py-4 font-medium">Stock</th>
                    <th className="px-6 py-4 font-medium">Estado</th>
                    <th className="px-6 py-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-neutral-500">Cargando catálogo...</td></tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-neutral-500">
                        No se encontraron productos registrados con estos filtros.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => {
                      const catName = categories.find(c => c.id === p.categoryId)?.name || 'Sin categoría';
                      return (
                        <tr key={p.id} className={`hover:bg-[#161616]/50 transition-colors ${p.archived ? 'opacity-40' : ''}`}>
                          <td className="px-6 py-4 flex items-center gap-4">
                            {p.images[0] ? (
                              <img src={p.images[0]} alt={p.title} className="w-11 h-11 rounded object-cover border border-[#333]" />
                            ) : (
                              <div className="w-11 h-11 rounded bg-[#161616] flex items-center justify-center text-neutral-500 border border-[#333]">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-serif text-white tracking-normal text-sm capitalize">{p.title}</p>
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1c1c1c] text-[#C5A059] border border-[#333]">
                                  [{getProductDisplayId(p)}]
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-500">{catName}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white font-medium">
                            <div className="flex items-center gap-2">
                              <span>{formatPrice(p.price)}</span>
                              {p.discountPercentage && p.discountPercentage > 0 ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#C5A059] text-black">
                                  -{p.discountPercentage}%
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white">{p.inStock ? p.stock : 'Agotado'}</td>
                          <td className="px-6 py-4">
                            {p.archived ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">Archivado</span>
                            ) : p.inStock && p.stock > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-bold bg-[#C5A059] text-black">Activo</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-medium bg-red-950/50 text-red-500 border border-red-900">Sin Stock</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(p)} title="Editar Producto">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleToggleArchive(p.id, p.archived)} title={p.archived ? "Desarchivar" : "Archivar"}>
                                {p.archived ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Archive className="w-4 h-4 text-neutral-400" />}
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteProduct(p.id)} title="Eliminar Producto">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES MANAGEMENT (Feature 2 & 4) */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Add Category Section */}
          <div className="bg-[#0F0F0F] rounded border border-[#222] p-6">
            <h3 className="text-sm uppercase tracking-widest font-semibold text-[#C5A059] mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Añadir Nueva Categoría
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Crea categorías para clasificar y organizar las joyas del catálogo (ej. Anillos, Pulseras, Relojes, Collares).
            </p>
            <form onSubmit={handleAddCategoryFromTab} className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <Input
                id="new-category-input"
                placeholder="Nombre de la categoría..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" variant="primary" disabled={addingCategory}>
                {addingCategory ? 'Creando...' : 'Crear Categoría'}
              </Button>
            </form>
          </div>

          {/* Categories List */}
          <div className="bg-[#0F0F0F] rounded border border-[#222] overflow-hidden">
            <div className="p-4 border-b border-[#222] bg-[#161616] flex justify-between items-center">
              <h4 className="text-[11px] uppercase tracking-widest text-neutral-400 font-medium">
                Categorías Registradas ({categories.length})
              </h4>
            </div>

            <ul className="divide-y divide-[#222]">
              {loading ? (
                <li className="p-6 text-center text-neutral-500 text-xs uppercase tracking-widest">Cargando categorías...</li>
              ) : categories.length === 0 ? (
                <li className="p-8 text-center text-neutral-500 text-xs uppercase tracking-widest">
                  No hay categorías registradas. Comienza añadiendo una en el formulario superior.
                </li>
              ) : (
                categories.map(cat => {
                  const count = products.filter(p => p.categoryId === cat.id).length;
                  return (
                    <li key={cat.id} className="p-4 flex items-center justify-between hover:bg-[#161616]/50 transition-colors">
                      {editingCatId === cat.id ? (
                        <div className="flex items-center gap-3 flex-1 mr-4">
                          <Input
                            value={editingCatName}
                            onChange={e => setEditingCatName(e.target.value)}
                            autoFocus
                            className="max-w-md"
                          />
                          <Button size="icon" variant="ghost" onClick={() => handleUpdateCategory(cat.id)} title="Guardar">
                            <Check className="w-4 h-4 text-green-400" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingCatId(null)} title="Cancelar">
                            <X className="w-4 h-4 text-neutral-400" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <Tags className="w-4 h-4 text-[#C5A059]" />
                            <span className="font-medium text-white text-xs uppercase tracking-widest">{cat.name}</span>
                            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-[#161616] text-neutral-400 border border-[#333]">
                              {count} {count === 1 ? 'producto' : 'productos'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditingCatName(cat.name);
                              }}
                              title="Editar nombre"
                            >
                              <Edit2 className="w-4 h-4 text-neutral-400 hover:text-white" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteCategory(cat.id)}
                              title="Eliminar categoría"
                            >
                              <Trash2 className="w-4 h-4 text-red-500 hover:text-red-400" />
                            </Button>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      )}

      {/* PRODUCT CREATION/EDIT MODAL (With Feature 3: Inline Category Creation) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0F0F0F] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#222]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#222] flex justify-between items-center sticky top-0 bg-[#161616] z-20">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-[#C5A059]">Gestión de Producto</span>
                <h2 className="text-xl font-serif text-[#F2F2F2] italic">
                  {editingId ? 'Editar Pieza' : 'Crear Nueva Pieza de Joyería'}
                </h2>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-6 space-y-6">
              
              {/* Notification Banner when a category is created inline */}
              {categoryNotice && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded flex items-center gap-2 text-xs text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{categoryNotice}</span>
                </div>
              )}

              {/* Title & SKU */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Título de la Pieza *</Label>
                  <Input 
                    required 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="Ej: Anillo Solitario Diamante Oro Blanco 18k" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID / SKU (Opcional)</Label>
                  <Input 
                    value={sku} 
                    onChange={e => setSku(e.target.value)} 
                    placeholder="Ej: AN-001" 
                    className="font-mono uppercase text-xs"
                  />
                </div>
              </div>

              {/* CATEGORY SELECTOR + INLINE CREATION (Feature 3) */}
              <div className="space-y-2 p-4 bg-[#141414] rounded border border-[#2a2a2a]">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs uppercase tracking-widest text-neutral-300">Categoría *</Label>
                  {!isCreatingCategoryInline && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingCategoryInline(true)}
                      className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#C5A059] hover:text-[#d4b373] font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Crear Nueva Categoría</span>
                    </button>
                  )}
                </div>

                {/* Inline Category Creation Box */}
                {isCreatingCategoryInline ? (
                  <div className="p-3 bg-[#0a0a0a] rounded border border-[#C5A059]/40 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[#C5A059] font-medium">
                        Nueva Categoría (se guardará sin perder tus datos de producto)
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategoryInline(false)}
                        className="text-neutral-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Ej: Dijes, Brazaletes, Gargantillas..."
                        value={inlineCategoryName}
                        onChange={e => setInlineCategoryName(e.target.value)}
                        className="flex-1 text-xs"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateCategoryInline();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleCreateCategoryInline}
                        disabled={inlineCategoryLoading || !inlineCategoryName.trim()}
                        className="text-xs uppercase tracking-wider px-3"
                      >
                        {inlineCategoryLoading ? 'Creando...' : 'Crear y Asignar'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsCreatingCategoryInline(false)}
                        className="text-xs"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <select 
                    className="flex h-10 w-full rounded border border-[#333] bg-[#0a0a0a] px-3 py-1 text-sm shadow-sm transition-colors text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C5A059] focus-visible:border-[#C5A059]"
                    required
                    value={categoryId} 
                    onChange={e => setCategoryId(e.target.value)}
                  >
                    <option value="" disabled>Selecciona una categoría...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}

                {categories.length === 0 && !isCreatingCategoryInline && (
                  <p className="text-[11px] text-amber-400/90 mt-1">
                    Aún no tienes categorías creadas. Haz clic en <strong>"+ Crear Nueva Categoría"</strong> arriba para registrar tu primera categoría.
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Descripción Detallada *</Label>
                <Textarea 
                  required 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Materiales, quilates, pureza del oro, gemas incrustadas, cuidados recomendados..."
                  rows={3}
                />
              </div>

              {/* Pricing, Discount & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Precio ($) *</Label>
                  <Input 
                    type="number" 
                    required 
                    min="0" 
                    step="0.01" 
                    placeholder="0" 
                    value={price} 
                    onChange={e => setPrice(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descuento (%) (Opcional)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="1"
                    placeholder="Ej: 15 (para 15% OFF)" 
                    value={discountPercentage} 
                    onChange={e => setDiscountPercentage(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cantidad (Stock) *</Label>
                  <Input 
                    type="number" 
                    required 
                    min="0" 
                    placeholder="1" 
                    value={stock} 
                    onChange={e => setStock(e.target.value)} 
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-end">
                  <label className="flex items-center gap-2 h-9 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={inStock} 
                      onChange={e => setInStock(e.target.checked)} 
                      className="rounded border-[#333] bg-[#0a0a0a] text-[#C5A059] focus:ring-[#C5A059] w-4 h-4" 
                    />
                    <span className="text-[11px] uppercase tracking-widest text-neutral-300">Disponible para Venta</span>
                  </label>
                </div>
              </div>

              {/* Live price preview with discount */}
              {discountPercentage && parseFloat(discountPercentage) > 0 && price && parseFloat(price) > 0 && (
                <div className="p-3 bg-[#161616] border border-[#C5A059]/40 rounded flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#C5A059] text-black font-bold text-[10px]">
                      {discountPercentage}% OFF
                    </span>
                    <span className="text-neutral-400">
                      Precio original: <span className="line-through">{formatPrice(parseFloat(price))}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-400 text-[10px] uppercase tracking-wider block">Precio Final al Cliente</span>
                    <span className="font-bold text-[#C5A059] text-base">
                      {formatPrice(Math.round(parseFloat(price) * (1 - Math.min(100, parseFloat(discountPercentage)) / 100)))}
                    </span>
                  </div>
                </div>
              )}

              {/* Images */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Fotografías de la Joya</Label>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
                    {images.length} foto(s) cargada(s)
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative group w-24 h-24">
                      <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover rounded border border-[#333]" />
                      <button 
                        type="button" 
                        onClick={() => setImages(images.filter((_, index) => index !== i))}
                        className="absolute -top-2 -right-2 bg-[#161616] rounded-full p-1 border border-[#333] text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:border-red-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <label className="w-24 h-24 border-2 border-dashed border-[#333] rounded flex flex-col items-center justify-center text-neutral-500 hover:bg-[#161616] hover:text-[#C5A059] hover:border-[#C5A059] transition-colors cursor-pointer">
                    <Plus className="w-6 h-6 mb-1" />
                    <span className="text-[10px] uppercase tracking-widest">Agregar</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#222] flex justify-end gap-3 sticky bottom-0 bg-[#0F0F0F] pb-2">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  {editingId ? 'Guardar Cambios' : 'Crear Producto'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
