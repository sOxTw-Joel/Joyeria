import React, { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Forms';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      setError('Credenciales inválidas. Verifica tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-[#0F0F0F] rounded-lg border border-[#222] p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#161616] border border-[#333] rounded-full flex items-center justify-center mx-auto mb-4 text-[#C5A059]">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-serif text-[#F2F2F2] italic">Panel de Administración</h1>
          <p className="text-neutral-500 text-[11px] tracking-widest uppercase mt-2">Ingresa tus credenciales</p>
        </div>
        
        {error && (
          <div className="bg-red-950/30 text-red-500 text-[11px] tracking-widest uppercase p-3 rounded mb-6 border border-red-900 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aurum.com"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
          <Button type="submit" variant="primary" className="w-full mt-4 h-11" disabled={loading}>
            {loading ? 'INGRESANDO...' : 'INGRESAR'}
          </Button>
        </form>

        <div className="pt-6 border-t border-[#222] mt-8 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-neutral-500 hover:text-[#C5A059] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
