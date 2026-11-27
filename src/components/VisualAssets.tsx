import React from 'react';
import type { Sede } from '../types/tennis';

export const BrandLogo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  className = '',
  size = 'md',
}) => {
  const sizeCls =
    size === 'lg' ? 'h-24 w-auto' : size === 'sm' ? 'h-10 w-auto' : 'h-12 w-auto';
  return (
    <img
      src="/logo-shield.png"
      alt="Tenis Club Panamá"
      className={`${sizeCls} object-contain select-none ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};

export const CourtScene: React.FC<{
  variant?: Sede['imagenVariant'];
  clubLabel?: string;
  className?: string;
}> = ({ variant = 'night-club', clubLabel = 'TENIS CLUB PANAMÁ', className = '' }) => {
  const palette =
    variant === 'coastal-palm'
      ? { skyTop: '#164E63', skyBot: '#38BDF8', courtBlue: '#1D4ED8', surround: '#3F7D4C', night: false }
      : variant === 'balboa-park'
        ? { skyTop: '#0F766E', skyBot: '#6EE7B7', courtBlue: '#1E40AF', surround: '#4D7C0F', night: false }
        : variant === 'west-clay'
          ? { skyTop: '#1E3A5F', skyBot: '#60A5FA', courtBlue: '#B45309', surround: '#78350F', night: false }
          : { skyTop: '#0A1328', skyBot: '#1B2D52', courtBlue: '#1D4ED8', surround: '#3B6E38', night: true };

  return (
    <svg
      viewBox="0 0 400 220"
      className={`w-full h-full object-cover ${className}`}
      aria-label={clubLabel}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`sky-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.skyTop} />
          <stop offset="100%" stopColor={palette.skyBot} />
        </linearGradient>
        <linearGradient id={`court-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.courtBlue} />
          <stop offset="100%" stopColor={variant === 'west-clay' ? '#92400E' : '#1E3A8A'} />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="400" height="125" fill={`url(#sky-${variant})`} />

      {/* Trees / City skyline */}
      <path
        d="M0 105 Q35 72 70 98 T140 94 T210 96 T290 88 T360 95 L400 100 L400 128 L0 128 Z"
        fill={palette.night ? '#0E241C' : '#166534'}
        opacity="0.9"
      />
      {!palette.night && (
        <g fill="#1E293B" opacity="0.45">
          <rect x="260" y="34" width="20" height="68" rx="2" />
          <rect x="286" y="20" width="24" height="82" rx="2" />
          <rect x="316" y="42" width="18" height="60" rx="2" />
        </g>
      )}

      {/* Floodlights for night courts */}
      {palette.night && (
        <g>
          <line x1="60" y1="28" x2="60" y2="122" stroke="#64748B" strokeWidth="3" />
          <circle cx="60" cy="26" r="16" fill="#FEF08A" opacity="0.22" />
          <rect x="52" y="23" width="16" height="6" rx="2" fill="#FEF9C3" />

          <line x1="170" y1="36" x2="170" y2="122" stroke="#64748B" strokeWidth="2.5" />
          <circle cx="170" cy="34" r="14" fill="#FEF08A" opacity="0.2" />
          <rect x="163" y="31" width="14" height="5" rx="2" fill="#FEF9C3" />

          <line x1="340" y1="26" x2="340" y2="122" stroke="#64748B" strokeWidth="3" />
          <circle cx="340" cy="24" r="18" fill="#FEF08A" opacity="0.24" />
          <rect x="331" y="21" width="18" height="6" rx="2" fill="#FEF9C3" />
        </g>
      )}

      {/* Back Fence & Club Banner */}
      <rect x="0" y="76" width="400" height="48" fill="#0F2A22" opacity="0.78" />
      <rect x="182" y="79" width="166" height="40" rx="3" fill="#182C4C" />
      <text
        x="265"
        y="96"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="8.8"
        fontWeight="800"
        letterSpacing="0.5"
      >
        {clubLabel.slice(0, 18).toUpperCase()}
      </text>
      <text
        x="265"
        y="109"
        textAnchor="middle"
        fill="#ACD638"
        fontSize="7.8"
        fontWeight="700"
        letterSpacing="1.1"
      >
        PANAMÁ
      </text>

      {/* Court surround */}
      <polygon points="0,124 400,124 400,220 0,220" fill={palette.surround} />

      {/* Perspective blue court surface */}
      <polygon points="88,128 312,128 378,218 22,218" fill={`url(#court-${variant})`} />

      {/* Crisp white court lines */}
      <polygon
        points="88,128 312,128 378,218 22,218"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.4"
      />
      <line x1="112" y1="128" x2="62" y2="218" stroke="#FFFFFF" strokeWidth="1.8" />
      <line x1="288" y1="128" x2="338" y2="218" stroke="#FFFFFF" strokeWidth="1.8" />
      <line x1="76" y1="184" x2="324" y2="184" stroke="#FFFFFF" strokeWidth="1.8" />
      <line x1="200" y1="150" x2="200" y2="184" stroke="#FFFFFF" strokeWidth="1.8" />

      {/* Tennis Net */}
      <line x1="46" y1="156" x2="354" y2="156" stroke="#E2E8F0" strokeWidth="2.5" />
      <rect x="48" y="156" width="304" height="12" fill="#0F172A" opacity="0.45" />
      <line x1="48" y1="149" x2="48" y2="169" stroke="#CBD5E1" strokeWidth="3.5" />
      <line x1="352" y1="149" x2="352" y2="169" stroke="#CBD5E1" strokeWidth="3.5" />
    </svg>
  );
};

const AVATAR_COLORS: Record<string, { bg: string; shirt: string; accent: string }> = {
  carlos: { bg: '#DBEAFE', shirt: '#273758', accent: '#ACD638' },
  carlos_coach: { bg: '#E0F2FE', shirt: '#1E3A8A', accent: '#ACD638' },
  andres: { bg: '#ECFCCB', shirt: '#1E293B', accent: '#ACD638' },
  maria: { bg: '#FCE7F3', shirt: '#273758', accent: '#F472B6' },
  javier: { bg: '#FEF3C7', shirt: '#334155', accent: '#F59E0B' },
  valentina: { bg: '#EDE9FE', shirt: '#273758', accent: '#A78BFA' },
  diego: { bg: '#D1FAE5', shirt: '#1E293B', accent: '#34D399' },
  sofia: { bg: '#FFE4E6', shirt: '#273758', accent: '#ACD638' },
  mateo: { bg: '#E0E7FF', shirt: '#2563EB', accent: '#ACD638' },
  lucia: { bg: '#FAE8FF', shirt: '#273758', accent: '#ACD638' },
  ricardo: { bg: '#FEF9C3', shirt: '#18243E', accent: '#ACD638' },
  super: { bg: '#E2E8F0', shirt: '#18243E', accent: '#ACD638' },
};

export const PlayerAvatar: React.FC<{
  nombre: string;
  seed?: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  ringLime?: boolean;
}> = ({ nombre, seed = 'carlos', avatarUrl, size = 'md', ringLime = false }) => {
  const colors = AVATAR_COLORS[seed] || AVATAR_COLORS.carlos;
  const initials = nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  const sizeCls =
    size === 'xs'
      ? 'w-7 h-7 text-[10px]'
      : size === 'sm'
        ? 'w-9 h-9 text-xs'
        : size === 'lg'
          ? 'w-14 h-14 text-base'
          : 'w-11 h-11 text-sm';

  return (
    <div
      className={`${sizeCls} rounded-full shrink-0 overflow-hidden relative flex items-center justify-center font-bold select-none ${
        ringLime ? 'ring-2 ring-[#ACD638]' : 'ring-1 ring-slate-200'
      }`}
      style={{ backgroundColor: colors.bg }}
      aria-label={nombre}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={nombre}
          className="w-full h-full object-cover object-top"
        />
      ) : (
        <svg viewBox="0 0 48 48" className="w-full h-full">
          <rect width="48" height="48" fill={colors.bg} />
          <circle cx="24" cy="19" r="8.5" fill="#D9A37C" />
          <path d="M15 17 C16 9, 32 9, 33 17 Z" fill="#1E293B" />
          <path d="M13 15 L35 15 L33 12 L15 12 Z" fill="#FFFFFF" />
          <path d="M10 48 C11 34, 37 34, 38 48 Z" fill={colors.shirt} />
          <path d="M20 35 L24 41 L28 35" stroke={colors.accent} strokeWidth="2" fill="none" />
        </svg>
      )}
      <span className="sr-only">{initials}</span>
    </div>
  );
};

export const DemoQRCode: React.FC<{ code: string }> = ({ code }) => {
  // Deterministic 11x11 pattern based on reservation code
  const cells: boolean[] = [];
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) % 9973;
  }
  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 11; c++) {
      const isCorner =
        (r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3);
      if (isCorner) {
        cells.push(true);
      } else {
        cells.push(((hash + r * 17 + c * 29) % 3) !== 0);
      }
    }
  }

  return (
    <div className="inline-flex flex-col items-center p-3 bg-white rounded-2xl border border-slate-200">
      <svg viewBox="0 0 110 110" className="w-28 h-28" aria-label={`QR ${code}`}>
        <rect width="110" height="110" fill="#FFFFFF" />
        {cells.map((filled, idx) => {
          if (!filled) return null;
          const r = Math.floor(idx / 11);
          const c = idx % 11;
          return (
            <rect
              key={idx}
              x={c * 10 + 1}
              y={r * 10 + 1}
              width="8"
              height="8"
              rx="1.5"
              fill="#1E2B45"
            />
          );
        })}
      </svg>
      <span className="mt-1.5 text-xs font-mono font-bold tracking-wider text-[#273758]">
        {code}
      </span>
    </div>
  );
};
