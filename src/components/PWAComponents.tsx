import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { BrandLogo } from './VisualAssets';

export const SplashScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  return (
    <div
      onClick={onDone}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onDone()}
      aria-label="Omitir pantalla de inicio"
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#1A2744] via-[#273758] to-[#16213B] text-white px-6 cursor-pointer"
    >
      <div className="relative flex flex-col items-center">
        <div className="w-40 h-40 flex items-center justify-center">
          <BrandLogo size="lg" className="h-32 w-auto drop-shadow-2xl" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold tracking-tight text-white">
          Tenis Club Panamá
        </h1>
        <p className="mt-1 text-xs font-medium text-[#ACD638]">
          Canchas · Comunidad · Clases · Ranking
        </p>
        <div className="mt-8 w-32 h-1.5 rounded-full bg-white/15 overflow-hidden">
          <div className="h-full w-2/3 bg-[#ACD638] rounded-full animate-pulse" />
        </div>
      </div>
      <span className="absolute bottom-8 text-[11px] text-white/60">
        Toca para continuar
      </span>
    </div>
  );
};

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          compact
            ? 'inline-flex items-center gap-1.5 rounded-xl bg-[#ACD638] px-3 py-2 text-xs font-bold text-[#1A2640] hover:brightness-95 transition whitespace-nowrap shrink-0'
            : 'w-full flex items-center justify-between gap-3 rounded-2xl bg-[#273758] px-4 py-3 text-left text-white shadow-sm hover:bg-[#1E2B45] transition'
        }
      >
        <span className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-[#ACD638]/20 text-[#ACD638] flex items-center justify-center shrink-0">
            {isIOS ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          </span>
          <span>
            <span className="block text-sm font-bold leading-tight">
              {compact ? 'Instalar app' : 'Instalar Tenis Club Panamá'}
            </span>
            {!compact && (
              <span className="block text-[11px] text-white/75">
                Acceso directo en pantalla de inicio (PWA)
              </span>
            )}
          </span>
        </span>
        {!compact && (
          <span className="rounded-lg bg-[#ACD638] px-2.5 py-1 text-xs font-bold text-[#1A2640]">
            Instalar
          </span>
        )}
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 shadow-2xl text-[#1E2B45]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Instalar como App (PWA)</h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Cerrar guía de instalación"
                className="p-2 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {isIOS ? (
                <>
                  <p>1. Toca el botón <strong>Compartir</strong> en la barra de Safari.</p>
                  <p>2. Desplázate y selecciona <strong>Agregar a inicio</strong>.</p>
                  <p>3. Confirma <strong>Tenis Club</strong> para abrir en pantalla completa.</p>
                </>
              ) : (
                <>
                  <p>1. Abre el menú del navegador (Chrome / Edge / Safari).</p>
                  <p>2. Selecciona <strong>Instalar aplicación</strong> o <strong>Agregar a pantalla de inicio</strong>.</p>
                  <p className="text-xs text-slate-500 pt-1">
                    Requiere dominio HTTPS en producción y soporte standalone activo.
                  </p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full rounded-xl bg-[#273758] py-2.5 text-sm font-bold text-white"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Modo sin conexión — Usando datos locales almacenados</span>
    </div>
  );
};
