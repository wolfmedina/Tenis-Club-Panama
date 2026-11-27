import React, { useState } from 'react';
import { ChevronRight, Eye, EyeOff, Lock, Mail, UserPlus, ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Role, SkillLevel } from '../../types/tennis';
import { BrandLogo } from '../VisualAssets';

export const LoginView: React.FC = () => {
  const { loginDemo, registerDemoPlayer } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('julio.solorzano@tenisclub.pa');
  const [password, setPassword] = useState('TenisPanama2026');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Register state
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regProvincia, setRegProvincia] = useState('Panamá');
  const [regNivel, setRegNivel] = useState<SkillLevel>('Intermedio');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (password.trim().length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    loginDemo(email.trim());
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!regNombre.trim() || !regEmail.trim() || !regEmail.includes('@')) {
      setError('Completa tu nombre y un correo electrónico válido.');
      return;
    }
    registerDemoPlayer(regNombre, regEmail, regProvincia, regNivel);
  };

  const handleQuickRole = (rol: Role) => {
    loginDemo(rol);
  };

  return (
    <div className="min-h-full flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#131F3A] via-[#1B2C4E] to-[#121D34] text-white px-6 py-8">
      {/* Top welcome hero photography (bienvenida.webp) blended into deep navy */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-x-0 top-0 h-52 overflow-hidden"
      >
        <img
          src="/assets/photos/fondos/bienvenida.webp"
          alt=""
          aria-hidden="true"
          decoding="async"
          className="w-full h-full object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#131F3A]/45 via-[#172442]/55 to-[#1A2949]" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#131F3A]/20 to-[#131F3A]/65" />
      </div>

      {/* Subtle corporate lime diagonal accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute -top-8 right-[104px] w-7 h-56 bg-gradient-to-b from-[#B6E22E] via-[#ACD638]/45 to-transparent rotate-[26deg] opacity-65"
      />

      {/* Bottom hardcourt court-line corporate backdrop (fondo_03.webp) */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 h-28 overflow-hidden"
      >
        <img
          src="/assets/photos/fondos/fondo_03.webp"
          alt=""
          aria-hidden="true"
          decoding="async"
          className="w-full h-full object-cover object-center opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#15223E] via-[#15223E]/60 to-[#121D34]/60" />
      </div>

      <div className="relative z-10 flex flex-col items-center mt-1">
        <div className="rounded-full p-2 bg-[#131F3A]/35 backdrop-blur-[2px]">
          <BrandLogo size="lg" className="h-28 w-auto drop-shadow-2xl" />
        </div>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white text-center drop-shadow-sm">
          {mode === 'login' ? '¡Bienvenido!' : 'Crear cuenta'}
        </h1>
        <p className="mt-1.5 text-sm text-white/85 text-center max-w-[300px] leading-snug">
          {mode === 'login'
            ? 'Accede a tu cuenta para reservar canchas, unirte a partidos, tomar clases y más.'
            : 'Regístrate para jugar en canchas públicas y privadas de todo Panamá.'}
        </p>
      </div>

      <div className="relative z-10 mt-6">
        {error && (
          <div
            role="alert"
            className="mb-3 rounded-xl bg-rose-500/20 border border-rose-400/50 px-3.5 py-2.5 text-xs font-medium text-rose-100"
          >
            {error}
          </div>
        )}
        {infoMsg && (
          <div className="mb-3 rounded-xl bg-[#ACD638]/20 border border-[#ACD638]/50 px-3.5 py-2.5 text-xs font-medium text-[#E8F8B8]">
            {infoMsg}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5" noValidate>
            <div>
              <label htmlFor="login-email" className="sr-only">
                Correo electrónico
              </label>
              <div className="flex items-center rounded-2xl bg-white px-3.5 py-3 shadow-sm focus-within:ring-2 focus-within:ring-[#ACD638]">
                <Mail className="w-5 h-5 text-[#273758] shrink-0" />
                <span className="mx-3 h-5 w-px bg-slate-200" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className="w-full bg-transparent text-sm font-medium text-[#1E2B45] placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="sr-only">
                Contraseña
              </label>
              <div className="flex items-center rounded-2xl bg-white px-3.5 py-3 shadow-sm focus-within:ring-2 focus-within:ring-[#ACD638]">
                <Lock className="w-5 h-5 text-[#273758] shrink-0" />
                <span className="mx-3 h-5 w-px bg-slate-200" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full bg-transparent text-sm font-medium text-[#1E2B45] placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="p-1 text-slate-400 hover:text-[#273758]"
                >
                  {showPass ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#ACD638]"
                />
                <span className="text-white/90 font-medium">Recordarme</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  setInfoMsg('Modo demostración: puedes acceder con cualquier contraseña o usar acceso rápido.')
                }
                className="font-semibold text-[#ACD638] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#B6E22E] hover:bg-[#ACD638] active:scale-[0.99] transition py-3.5 text-base font-extrabold text-[#16223B] flex items-center justify-center gap-1.5 shadow-lg shadow-black/20 cursor-pointer"
            >
              <span>Iniciar sesión</span>
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setError('');
                setMode('register');
              }}
              className="w-full rounded-2xl border border-white/40 bg-white/5 hover:bg-white/10 transition py-3 text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear cuenta</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3" noValidate>
            <div>
              <label htmlFor="reg-nombre" className="sr-only">
                Nombre completo
              </label>
              <input
                id="reg-nombre"
                type="text"
                value={regNombre}
                onChange={(e) => setRegNombre(e.target.value)}
                placeholder="Nombre completo"
                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#1E2B45] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ACD638]"
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="reg-email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="Correo electrónico"
                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#1E2B45] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ACD638]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="reg-prov" className="sr-only">
                  Provincia
                </label>
                <select
                  id="reg-prov"
                  value={regProvincia}
                  onChange={(e) => setRegProvincia(e.target.value)}
                  className="w-full rounded-2xl bg-white px-3 py-3 text-sm font-medium text-[#1E2B45]"
                >
                  <option value="Panamá">Panamá</option>
                  <option value="Panamá Oeste">Panamá Oeste</option>
                  <option value="Chiriquí">Chiriquí</option>
                  <option value="Colón">Colón</option>
                </select>
              </div>
              <div>
                <label htmlFor="reg-nivel" className="sr-only">
                  Nivel de juego
                </label>
                <select
                  id="reg-nivel"
                  value={regNivel}
                  onChange={(e) => setRegNivel(e.target.value as SkillLevel)}
                  className="w-full rounded-2xl bg-white px-3 py-3 text-sm font-medium text-[#1E2B45]"
                >
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-2xl bg-[#B6E22E] hover:bg-[#ACD638] py-3.5 text-base font-extrabold text-[#16223B] cursor-pointer"
            >
              Completar registro demo
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white/85 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a iniciar sesión
            </button>
          </form>
        )}

        <div className="mt-5 flex items-center gap-3 text-[11px] font-semibold tracking-wider text-white/75">
          <span className="flex-1 h-px bg-white/25" />
          <span>O CONTINÚA CON</span>
          <span className="flex-1 h-px bg-white/25" />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleQuickRole('jugador')}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-3 text-xs font-bold text-[#1E2B45] shadow-sm hover:bg-slate-50 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" aria-hidden="true">
              <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
            </svg>
            <span>Continuar con Apple</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickRole('jugador')}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-3 text-xs font-bold text-[#1E2B45] shadow-sm hover:bg-slate-50 cursor-pointer"
          >
            <span className="font-extrabold text-[#4285F4]">G</span>
            <span>Continuar con Google</span>
          </button>
        </div>
      </div>

      {/* Demo profile quick switcher */}
      <div className="relative z-10 mt-6 rounded-2xl bg-[#0F1B35]/80 backdrop-blur-md border border-white/15 p-3 shadow-lg">
        <p className="text-[11px] font-semibold text-white/85 text-center mb-2">
          Acceso directo Modo Demostración (sin credenciales reales)
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              ['jugador', 'Jugador'],
              ['admin', 'Admin'],
              ['instructor', 'Instructor'],
              ['superadmin', 'Nacional'],
            ] as [Role, string][]
          ).map(([roleKey, label]) => (
            <button
              key={roleKey}
              type="button"
              onClick={() => handleQuickRole(roleKey)}
              className="rounded-xl bg-[#1D2F52]/90 border border-white/10 hover:bg-[#ACD638] hover:text-[#16223B] py-2 text-[11px] font-bold text-white transition cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
