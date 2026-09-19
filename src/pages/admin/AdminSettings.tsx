import React, { useEffect, useState, useRef } from "react";
import { getSettings, updateSettings, getCategories } from '../../lib/db';
import { StoreSettings, Category } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Forms';
import { compressImage } from '../../lib/utils';
import { Image as ImageIcon, Trash2, Upload, Check } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState<StoreSettings>({ title: '', logo: null, visibleCategories: [] });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    setSavedSuccess(false);
    try {
      await updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 500); // good resolution for logo
      // Completely replace previous logo
      setSettings(prev => ({ ...prev, logo: base64 }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error(err);
      alert('Error al procesar la imagen del logo.');
    }
  };

  const handleDeleteLogo = () => {
    // Explicitly delete previous logo
    setSettings(prev => ({ ...prev, logo: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

          <div className="space-y-3 mt-6">
            <Label>Logotipo de la Marca</Label>
            <p className="text-[11px] text-neutral-400">
              Al subir una nueva imagen, se reemplazará y eliminará automáticamente el logo anterior.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-2 p-4 bg-[#0a0a0a] rounded border border-[#222]">
              <div className="w-40 h-28 border border-[#333] rounded flex items-center justify-center bg-[#050505] overflow-hidden relative group p-2 flex-shrink-0">
                {settings.logo ? (
                  <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-neutral-600">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-[9px] uppercase tracking-wider">Sin logo</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C5A059] border border-[#333] bg-[#161616] hover:border-[#C5A059] text-white hover:text-[#C5A059] h-9 px-4 py-2 text-[10px] uppercase tracking-widest">
                    <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{settings.logo ? 'Reemplazar Logo' : 'Subir Imagen de Logo'}</span>
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLogoUpload} 
                    />
                  </label>

                  {settings.logo && (
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      className="inline-flex items-center gap-1.5 rounded font-medium transition-colors border border-red-900/50 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 h-9 px-3 text-[10px] uppercase tracking-widest"
                      title="Eliminar logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Logo</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                  Formato recomendado: PNG transparente o SVG de alta calidad.
                </p>
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

        <div className="pt-6 border-t border-[#222] flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
          <div>
            {savedSuccess && (
              <span className="inline-flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <Check className="w-4 h-4 text-emerald-400" />
                Configuración y logo guardados correctamente en Firebase.
              </span>
            )}
          </div>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Guardando en Firebase...' : 'GUARDAR CONFIGURACIÓN'}
          </Button>
        </div>

      </form>
    </div>
  );
}
