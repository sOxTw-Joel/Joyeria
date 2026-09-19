import React from "react";
import { useEffect, useState } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, getCategories } from '../../lib/db';
import { Product, Category } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Label } from '../../components/ui/Forms';
import { compressImage } from '../../lib/utils';
import { Plus, Edit2, Trash2, Archive, CheckCircle, Image as ImageIcon, X } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState<string>('1');
  const [inStock, setInStock] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [archived, setArchived] = useState(false);

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

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setStock('1');
    setInStock(true);
    setImages([]);
    setArchived(false);
    setEditingId(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setTitle(p.title);
    setDescription(p.description);
    setPrice(p.price !== undefined && p.price !== null ? String(p.price) : '');
    setCategoryId(p.categoryId);
    setStock(String(p.stock ?? 1));
    setInStock(p.inStock);
    setImages(p.images);
    setArchived(p.archived);
    setEditingId(p.id);
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
    setImages([...images, ...newImages]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = price === '' ? 0 : parseFloat(price);
    const numStock = stock === '' ? 0 : parseInt(stock, 10);
    const productData = {
      title,
      description,
      price: isNaN(numPrice) ? 0 : numPrice,
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

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      await deleteProduct(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-serif text-[#F2F2F2] font-light italic">Productos</h1>
        <Button onClick={handleOpenNew} variant="primary">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
        </Button>
      </div>

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
                <tr><td colSpan={5} className="p-6 text-center text-neutral-500">Cargando...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-neutral-500">No hay productos.</td></tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} className={`hover:bg-[#161616]/50 transition-colors ${p.archived ? 'opacity-40' : ''}`}>
                    <td className="px-6 py-4 flex items-center gap-4">
                      {p.images[0] ? (
                        <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded object-cover border border-[#333]" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-[#161616] flex items-center justify-center text-neutral-500 border border-[#333]">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-serif text-white tracking-normal text-sm capitalize">{p.title}</p>
                        <p className="text-[10px] text-neutral-500">{categories.find(c => c.id === p.categoryId)?.name || 'Sin categoría'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">${p.price}</td>
                    <td className="px-6 py-4 text-white">{p.inStock ? p.stock : 'Agotado'}</td>
                    <td className="px-6 py-4">
                      {p.archived ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-sm text-[9px] font-medium bg-neutral-800 text-neutral-400">Archivado</span>
                      ) : p.inStock && p.stock > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-sm text-[9px] font-bold bg-[#C5A059] text-black">Activo</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-sm text-[9px] font-medium bg-red-950/50 text-red-500 border border-red-900">Sin Stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(p)} title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleToggleArchive(p.id, p.archived)} title={p.archived ? "Desarchivar" : "Archivar"}>
                          {p.archived ? <CheckCircle className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)} title="Eliminar">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0F0F0F] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#222]">
            <div className="p-6 border-b border-[#222] flex justify-between items-center sticky top-0 bg-[#161616] z-10">
              <h2 className="text-xl font-serif text-[#F2F2F2] italic">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <Button size="icon" variant="ghost" onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input required value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <select 
                    className="flex h-9 w-full rounded border border-[#333] bg-[#0a0a0a] px-3 py-1 text-sm shadow-sm transition-colors text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C5A059] focus-visible:border-[#C5A059]"
                    required
                    value={categoryId} 
                    onChange={e => setCategoryId(e.target.value)}
                  >
                    <option value="" disabled>Seleccione...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea required value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Precio ($)</Label>
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
                  <Label>Cantidad (Stock)</Label>
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
                    <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} className="rounded border-[#333] bg-[#0a0a0a] text-[#C5A059] focus:ring-[#C5A059] w-3 h-3" />
                    <span className="text-[11px] uppercase tracking-widest text-neutral-400">Disponible</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Imágenes</Label>
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

              <div className="pt-4 border-t border-[#222] flex justify-end gap-3 sticky bottom-0 bg-[#0F0F0F]">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button type="submit" variant="primary">Guardar Producto</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
