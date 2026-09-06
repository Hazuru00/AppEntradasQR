'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Shield, ArrowLeft, Loader2, Monitor, AlertCircle } from 'lucide-react';
import { loginAdminAction } from '@/actions/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append('password', password);

    startTransition(async () => {
      const res = await loginAdminAction(formData);
      if (res.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(res.error || 'Contraseña incorrecta');
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#14151b] text-white p-4 font-mono">
      <div className="w-full max-w-sm space-y-4">
        <Link
          href="/"
          className="win98-btn text-xs py-1 px-3 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al sitio principal</span>
        </Link>

        <div className="win98-box overflow-hidden">
          <div className="win98-titlebar">
            <div className="flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-white" />
              <span className="text-xs">ADMIN_SECURITY.EXE</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="win98-winbtn">_</div>
              <div className="win98-winbtn">□</div>
              <div className="win98-winbtn">✕</div>
            </div>
          </div>

          <div className="p-6 bg-[#1f2029] space-y-5">
            <div className="border-b border-[#363847] pb-3 space-y-1 text-center">
              <Shield className="w-8 h-8 text-[#457b9d] mx-auto" />
              <h1 className="text-base font-bold text-white uppercase">
                Control de Taquilla
              </h1>
              <p className="text-xs text-[#8f92a8]">
                Ingresa la clave de administrador
              </p>
            </div>

            {error && (
              <div className="p-2.5 bg-[#3a1818] border border-[#8c2727] text-white text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#e05252] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-[#8f92a8] uppercase block">
                  Contraseña:
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="win98-sunken w-full p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="win98-btn win98-btn-primary w-full py-2.5 text-xs font-bold uppercase flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <span>[ Ingresar al Panel ]</span>
                )}
              </button>
            </form>
          </div>

          <div className="win98-statusbar">
            <span>Auth: Requerido</span>
            <span>Nivel: Administrador</span>
          </div>
        </div>
      </div>
    </div>
  );
}
