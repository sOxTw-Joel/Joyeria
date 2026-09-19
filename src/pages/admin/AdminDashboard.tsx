import { useEffect, useState } from 'react';
import { getProducts, getCategories } from '../../lib/db';
import { Package, Tags } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, categories: 0, outOfStock: 0 });

  useEffect(() => {
    Promise.all([getProducts(true), getCategories()]).then(([products, categories]) => {
      setStats({
        products: products.length,
        categories: categories.length,
        outOfStock: products.filter(p => !p.inStock || p.stock === 0).length,
      });
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif text-[#F2F2F2] mb-8 font-light italic">Resumen</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#161616] p-6 rounded border border-[#222] flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0F0F0F] border border-[#333] rounded-full flex items-center justify-center text-[#C5A059]">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-neutral-500">Total Productos</p>
            <p className="text-2xl font-serif text-white">{stats.products}</p>
          </div>
        </div>
        
        <div className="bg-[#161616] p-6 rounded border border-[#222] flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0F0F0F] border border-[#333] rounded-full flex items-center justify-center text-[#C5A059]">
            <Tags className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-neutral-500">Categorías</p>
            <p className="text-2xl font-serif text-white">{stats.categories}</p>
          </div>
        </div>

        <div className="bg-[#161616] p-6 rounded border border-[#222] flex items-center gap-4">
          <div className="w-12 h-12 bg-red-950/30 border border-red-900 rounded-full flex items-center justify-center text-red-500">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-neutral-500">Sin Stock</p>
            <p className="text-2xl font-serif text-red-500">{stats.outOfStock}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link to="/admin/products" className="bg-[#C5A059] text-black px-4 py-2 rounded text-[11px] uppercase tracking-widest font-bold hover:bg-[#d4b373] transition-colors">
          Gestión de Catálogo
        </Link>
        <Link to="/admin/settings" className="bg-transparent border border-[#333] text-neutral-400 px-4 py-2 rounded text-[11px] uppercase tracking-widest font-bold hover:border-[#C5A059] hover:text-[#C5A059] transition-colors">
          Configuración
        </Link>
      </div>
    </div>
  );
}
