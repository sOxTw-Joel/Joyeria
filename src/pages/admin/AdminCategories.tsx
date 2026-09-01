import React from "react";
import { useEffect, useState } from 'react';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../../lib/db';
import { Category } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Forms';
import { Edit2, Trash2, Plus, X, Check } from 'lucide-react';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const cats = await getCategories();
    setCategories(cats);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await addCategory({ name: newName });
    setNewName('');
    loadCategories();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await updateCategory(id, { name: editName });
    setEditingId(null);
    loadCategories();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta categoría permanentemente?')) {
      await deleteCategory(id);
      loadCategories();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-serif text-[#F2F2F2] font-light italic">Categorías</h1>
      </div>

      <div className="bg-[#0F0F0F] rounded border border-[#222] overflow-hidden">
        <div className="p-4 border-b border-[#222] bg-[#161616]">
          <form onSubmit={handleAdd} className="flex gap-3">
            <Input 
              placeholder="Nueva categoría..." 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              className="max-w-sm"
            />
            <Button type="submit" variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </form>
        </div>

        <ul className="divide-y divide-[#222]">
          {loading ? (
            <li className="p-4 text-center text-neutral-500">Cargando...</li>
          ) : categories.length === 0 ? (
            <li className="p-4 text-center text-neutral-500">No hay categorías registradas.</li>
          ) : (
            categories.map(cat => (
              <li key={cat.id} className="p-4 flex items-center justify-between hover:bg-[#161616]/50 transition-colors">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-3 flex-1 mr-4">
                    <Input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={() => handleUpdate(cat.id)}>
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-white text-[11px] uppercase tracking-widest">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(cat.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
