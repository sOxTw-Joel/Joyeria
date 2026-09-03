import React from "react";
import { useEffect, useState } from 'react';
import { getSettings, updateSettings, getCategories } from '../../lib/db';
import { StoreSettings, Category } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Forms';
import { compressImage } from '../../lib/utils';
import { Image as ImageIcon, X } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState<StoreSettings>({ title: '', logo: null, visibleCategories: [] });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getSettings(), getCategories()]).then(([s, cats]) => {
      setSettings(s);
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateSettings(settings);
    setSaving(false);
    alert('Configuración guardada correctamente.');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 400); // smaller max width for logo
      setSettings({ ...settings, logo: base64 });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCategory = (id: string) => {
    const visible = settings.visibleCategories || [];
    if (visible.includes(id)) {
      setSettings({ ...settings, visibleCategories: visible.filter(c => c !== id) });
    } else {
      setSettings({ ...settings, visibleCategories: [...visible, id] });
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-serif text-[#F2F2F2] mb-6 font-light italic">Configuración de la Tienda</h1>

      <form onSubmit={handleSave} className="bg-[#0F0F0F] rounded border border-[#222] p-8 space-y-8">
        
        <div className="space-y-4">
          <h2 className="text-[11px] font-bold text-[#C5A059] uppercase tracking-[0.2em] border-b border-[#222] pb-2">Información General</h2>
          
          <div className="space-y-2 max-w-md mt-4">
            <Label>Título del Catálogo</Label>
            <Input 
              value={settings.title} 
              onChange={e => setSettings({ ...settings, title: e.target.value })} 
              required
            />
          </div>

          <div className="space-y-2 mt-6">
            <Label>Logotipo</Label>
            <div className="flex items-start gap-6 mt-2">
              <div className="w-32 h-32 border border-[#333] rounded flex items-center justify-center bg-[#050505] overflow-hidden relative group">
                {settings.logo ? (
                  <>
                    <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
                    <button 
                      type="button" 
                      onClick={() => setSettings({ ...settings, logo: null })}
                      className="absolute top-1 right-1 bg-[#161616] border border-[#333] rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:border-red-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="w-8 h-8 text-neutral-600" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="cursor-pointer inline-flex items-center justify-center rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] border border-[#333] bg-transparent hover:border-[#C5A059] text-white hover:text-[#C5A059] h-9 px-4 py-2 text-[10px] uppercase tracking-widest">
                  Subir Imagen
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500">Se recomienda un logo con fondo transparente (PNG).</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-[11px] font-bold text-[#C5A059] uppercase tracking-[0.2em] border-b border-[#222] pb-2 mt-8">Configuración de WhatsApp</h2>
          <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-4 leading-relaxed">Número de WhatsApp donde se recibirán los pedidos (incluir código de país sin el símbolo +). Ejemplo: 5215555555555</p>
          
          <div className="space-y-2 max-w-md">
            <Label>Número de WhatsApp</Label>
            <Input 
              type="text"
              placeholder="Ej. 5215555555555"
              value={settings.whatsappNumber || ''} 
              onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })} 
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-[11px] font-bold text-[#C5A059] uppercase tracking-[0.2em] border-b border-[#222] pb-2 mt-8">Menú de Navegación</h2>
          <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-4 leading-relaxed">Selecciona qué categorías serán visibles en el menú principal del catálogo.</p>
          
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-[11px] text-neutral-500 uppercase tracking-widest">No hay categorías. Crea algunas en la sección de Categorías.</p>
            ) : (
              categories.map(cat => (
                <label key={cat.id} className="flex items-center gap-4 p-4 border border-[#333] rounded bg-[#0a0a0a] hover:border-[#C5A059] cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={(settings.visibleCategories || []).includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="rounded border-[#333] bg-[#161616] text-[#C5A059] focus:ring-[#C5A059] w-4 h-4"
                  />
                  <span className="font-medium text-[11px] uppercase tracking-widest text-white">{cat.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-[#222] flex justify-end mt-8">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Guardando...' : 'GUARDAR CONFIGURACIÓN'}
          </Button>
        </div>

      </form>
    </div>
  );
}
