import React from "react";
import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Forms';

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
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Credenciales inválidas. Verifica tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      setError('Ingresa correo y contraseña para crear la cuenta.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('No se pudo crear la cuenta (quizás ya existe o la contraseña es muy débil).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-[#0F0F0F] rounded border border-[#222] p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif text-[#F2F2F2] italic">Panel de Administración</h1>
          <p className="text-neutral-500 text-[11px] tracking-widest uppercase mt-4">Ingresa tus credenciales</p>
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
              required 
            />
          </div>
          <Button type="submit" variant="primary" className="w-full mt-4" disabled={loading}>
            {loading ? 'Ingresando...' : 'INGRESAR'}
          </Button>
          
          <div className="pt-6 border-t border-[#222] mt-6 text-center">
            <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-3">¿Primera vez?</p>
            <Button type="button" variant="outline" className="w-full" onClick={handleRegister} disabled={loading}>
              Crear Cuenta Admin
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
