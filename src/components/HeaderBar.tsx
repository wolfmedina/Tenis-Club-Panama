import React from 'react';
import { Bell, ChevronLeft, Menu, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './VisualAssets';

interface HeaderBarProps {
  onBack?: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onOpenChat: () => void;
  children?: React.ReactNode;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onBack,
  onOpenMenu,
  onOpenNotifications,
  onOpenChat,
  children,
}) => {
  const { state, currentUser } = useApp();
  const unreadCount = state.notificaciones.filter(
    (n) => !n.leida && (n.usuarioId === currentUser.id || n.usuarioId === 'ALL')
  ).length;

  return (
    <header className="shrink-0 relative overflow-hidden bg-gradient-to-br from-[#192644] via-[#273758] to-[#1D2D4E] text-white px-4 pt-safe pb-4">
      {/* Subtle lime streak & tennis ball graphic matching reference screenshots */}
      <svg
        viewBox="0 0 480 220"
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hdrLime" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ACD638" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ACD638" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points="365,0 390,0 305,155 290,155" fill="url(#hdrLime)" opacity="0.65" />
        <circle cx="435" cy="145" r="56" fill="#A3CF2D" opacity="0.28" />
        <path
          d="M402 104 Q428 145 402 186"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          fill="none"
          opacity="0.28"
        />
      </svg>

      {/* 3-zone top row */}
      <div className="relative z-10 flex items-center justify-between h-12">
        <div className="w-20 flex items-center">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver"
              className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenMenu}
              aria-label="Abrir menú y selector de perfil"
              className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-center">
          <BrandLogo size="md" className="h-12 w-auto drop-shadow" />
        </div>

        <div className="w-20 flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label={`Notificaciones (${unreadCount} sin leer)`}
            className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#ACD638] ring-2 ring-[#273758]" />
            )}
          </button>
          <button
            type="button"
            onClick={onOpenChat}
            aria-label="Mensajes y grupos"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition cursor-pointer"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </div>

      {children && <div className="relative z-10 mt-1">{children}</div>}
    </header>
  );
};
