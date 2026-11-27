import React, { useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Lock,
  MapPin,
  ShieldCheck,
  Smartphone,
  Users,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { DEMO_DATES } from '../../../data/seedData';
import type { Modality, PaymentMethod, Reserva } from '../../../types/tennis';
import { calculateBookingTotals, formatHour12, minutesToTime, timeToMinutes } from '../../../utils/tennisLogic';
import { HeaderBar } from '../../HeaderBar';
import { CourtScene, DemoQRCode, PlayerAvatar } from '../../VisualAssets';

interface BookingCheckoutViewProps {
  selection: {
    sedeId: string;
    canchaId: string;
    fecha: string;
    horaInicio: string;
    duracionMin: 60 | 90;
    modalidad: Modality;
  };
  onBack: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onOpenChat: () => void;
  onDoneToBookings: () => void;
  onPublishOpenMatch: (reservaId: string) => void;
}

export const BookingCheckoutView: React.FC<BookingCheckoutViewProps> = ({
  selection,
  onBack,
  onOpenMenu,
  onOpenNotifications,
  onOpenChat,
  onDoneToBookings,
  onPublishOpenMatch,
}) => {
  const { state, currentUser, createReservation, showToast } = useApp();
  const sede = state.sedes.find((s) => s.id === selection.sedeId)!;
  const cancha = state.canchas.find((c) => c.id === selection.canchaId)!;

  const totals = calculateBookingTotals(
    cancha,
    selection.horaInicio,
    selection.duracionMin,
    state.serviceFeePct,
    false,
    selection.fecha
  );

  const [metodo, setMetodo] = useState<PaymentMethod>('Tarjeta');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [playersText, setPlayersText] = useState(
    selection.modalidad === 'Dobles'
      ? `${currentUser.nombre}, Ana, Miguel, Sofía`
      : `${currentUser.nombre}, Diego`
  );
  const [editingPlayers, setEditingPlayers] = useState(false);
  const [confirmedReserva, setConfirmedReserva] = useState<Reserva | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const endTime = minutesToTime(timeToMinutes(selection.horaInicio) + selection.duracionMin);
  const dateLabel =
    DEMO_DATES.find((d) => d.iso === selection.fecha)?.label || selection.fecha;

  const handleConfirmPayment = () => {
    setErrorMsg('');
    const participants = playersText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const res = createReservation({
      sedeId: sede.id,
      canchaId: cancha.id,
      fecha: selection.fecha,
      horaInicio: selection.horaInicio,
      duracionMin: selection.duracionMin,
      modalidad: selection.modalidad,
      participantes: participants,
      metodoPago: metodo,
      simulateFailure,
    });

    if (!res.ok || !res.reserva) {
      setErrorMsg(res.error || 'No se pudo completar la reserva.');
      showToast(res.error || 'Error en pago simulado', 'error');
      return;
    }

    setConfirmedReserva(res.reserva);
    showToast('¡Reserva confirmada!');
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9]">
      <HeaderBar
        variant="lines"
        onBack={confirmedReserva ? undefined : onBack}
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
        onOpenChat={onOpenChat}
      >
        <div className="pb-2">
          <h1 className="text-2xl font-extrabold text-white">
            {confirmedReserva ? 'Reserva confirmada' : 'Reserva y pago'}
          </h1>
          <p className="text-xs text-white/85 flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-[#ACD638]" />
            <span>
              {confirmedReserva
                ? 'Tu turno quedó bloqueado en la agenda del club'
                : 'Confirma los detalles de tu reserva y realiza el pago simulado'}
            </span>
          </p>

          {/* 3-Step Stepper */}
          <div className="mt-3.5 flex items-center justify-between text-[11px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-[#ACD638] text-[#16223B] flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
              <span className="text-white leading-tight">Seleccionar<br />cancha</span>
            </div>
            <span className="h-0.5 flex-1 mx-2 bg-[#ACD638]" />
            <div className="flex items-center gap-1.5">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  confirmedReserva
                    ? 'bg-[#ACD638] text-[#16223B]'
                    : 'bg-[#ACD638] text-[#16223B] ring-4 ring-[#ACD638]/25'
                }`}
              >
                {confirmedReserva ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
              </span>
              <span className="text-white leading-tight">Reserva<br />y pago</span>
            </div>
            <span className={`h-0.5 flex-1 mx-2 ${confirmedReserva ? 'bg-[#ACD638]' : 'bg-white/25'}`} />
            <div className="flex items-center gap-1.5">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  confirmedReserva
                    ? 'bg-[#ACD638] text-[#16223B] ring-4 ring-[#ACD638]/25'
                    : 'bg-white/20 text-white'
                }`}
              >
                3
              </span>
              <span className={confirmedReserva ? 'text-white' : 'text-white/60'}>Confirmación</span>
            </div>
          </div>
        </div>
      </HeaderBar>

      <div className="flex-1 p-4 space-y-3.5 pb-8">
        {confirmedReserva ? (
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#ACD638]/25 text-[#4E7006] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#1E2B45]">
                ¡Reserva lista para jugar!
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Presenta este código QR en la recepción de {sede.nombre}
              </p>
            </div>

            <DemoQRCode code={confirmedReserva.codigo} />

            <div className="rounded-2xl bg-[#F4F6F9] p-3.5 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Instalación</span>
                <span className="font-bold text-[#1E2B45]">{sede.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cancha</span>
                <span className="font-bold text-[#1E2B45]">{cancha.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha y horario</span>
                <span className="font-bold text-[#1E2B45] tabular-nums">
                  {dateLabel} · {formatHour12(confirmedReserva.horaInicio)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Método / Estado</span>
                <span className="font-bold text-[#4E7006]">
                  {confirmedReserva.metodoPago} · {confirmedReserva.pagoEstado}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="font-bold text-[#1E2B45]">Total</span>
                <span className="font-extrabold text-[#273758] tabular-nums">
                  {`B/. ${confirmedReserva.totalPagado.toFixed(2)}`}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Pago simulado en modo demostración · Sin cobros reales.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => onPublishOpenMatch(confirmedReserva.id)}
                className="w-full rounded-2xl bg-[#B6E22E] hover:bg-[#ACD638] py-3 text-sm font-extrabold text-[#16223B] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Tengo cancha reservada: buscar compañeros
              </button>
              <button
                type="button"
                onClick={onDoneToBookings}
                className="w-full rounded-2xl bg-[#273758] py-3 text-sm font-bold text-white cursor-pointer"
              >
                Ir a Mis Reservas
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Card */}
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden flex border border-slate-100">
              <div className="w-[62%] p-3.5 space-y-1">
                <span className="text-[10.5px] font-bold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> RESUMEN DE LA RESERVA
                </span>
                <h2 className="text-sm font-extrabold text-[#1E2B45] leading-snug">
                  {cancha.nombre} – {sede.nombre}
                </h2>
                <div className="text-[11.5px] text-slate-600 space-y-0.5 pt-1">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sede.nombre}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{dateLabel}</span>
                  </p>
                  <p className="flex items-center gap-1.5 tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {formatHour12(selection.horaInicio)} – {formatHour12(endTime)} ({selection.duracionMin} min)
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selection.modalidad}</span>
                  </p>
                </div>
              </div>
              <div
                className="w-[42%] -ml-3 relative"
                style={{ clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)' }}
              >
                <CourtScene
                  sedeId={sede.id}
                  isPublic={sede.tipo === 'Pública'}
                  variant={sede.imagenVariant}
                  clubLabel={sede.nombre}
                  eager
                />
              </div>
            </div>

            {/* Players row */}
            <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[#1E2B45] flex items-center gap-1.5 shrink-0">
                  <Users className="w-4 h-4 text-[#273758]" />
                  Jugadores
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  {!editingPlayers && (
                    <div className="flex items-center -space-x-1.5 shrink-0">
                      {playersText
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .slice(0, 4)
                        .map((part, idx) => {
                          const norm = part.toLowerCase();
                          const matched = state.usuarios.find(
                            (u) =>
                              u.nombre.toLowerCase() === norm ||
                              u.nombre.toLowerCase().startsWith(`${norm} `)
                          );
                          return (
                            <PlayerAvatar
                              key={`${part}-${idx}`}
                              nombre={matched?.nombre || part}
                              seed={matched?.avatarSeed || part.split(' ')[0]}
                              avatarUrl={matched?.avatarUrl}
                              size="xs"
                            />
                          );
                        })}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingPlayers((v) => !v)}
                    className="text-xs font-semibold text-[#273758] underline cursor-pointer truncate"
                  >
                    {editingPlayers ? 'Listo' : playersText}
                  </button>
                </div>
              </div>
              {editingPlayers && (
                <input
                  type="text"
                  value={playersText}
                  onChange={(e) => setPlayersText(e.target.value)}
                  aria-label="Nombres de participantes separados por coma"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#1E2B45]"
                />
              )}
            </div>

            {/* Payment Breakdown */}
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2.5">
              <h3 className="text-sm font-extrabold text-[#1E2B45]">Detalle del pago</h3>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Reserva de cancha ({selection.duracionMin} min)</span>
                <span className="font-bold text-[#1E2B45] tabular-nums">
                  B/. {totals.precioCancha.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Cargo por servicio ({state.serviceFeePct}%)</span>
                <span className="font-bold text-[#1E2B45] tabular-nums">
                  B/. {totals.cargoServicio.toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#1E2B45]">Total a pagar</span>
                <span className="rounded-xl bg-[#B6E22E] px-3 py-1 text-sm font-extrabold text-[#16223B] tabular-nums">
                  {`B/. ${totals.totalPagado.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#1E2B45]">Método de pago</h3>
                  <span className="text-[11px] font-bold text-[#5E8210] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Simulación segura
                  </span>
                </div>

                {(
                  [
                    {
                      id: 'Yappy',
                      title: 'Yappy (Banco General)',
                      sub: 'Pago instantáneo Panamá en simulación',
                      icon: Smartphone,
                    },
                    {
                      id: 'Tarjeta',
                      title: 'Tarjeta de crédito / débito',
                      sub: 'Visa, Mastercard o American Express',
                      icon: CreditCard,
                    },
                    {
                      id: 'Apple Pay',
                      title: 'Apple Pay',
                      sub: 'Paga de forma rápida y segura',
                      icon: Smartphone,
                    },
                    {
                      id: 'PayPal',
                      title: 'PayPal',
                      sub: 'Usa tu cuenta de PayPal',
                      icon: ShieldCheck,
                    },
                  ] as const
                ).map((m) => {
                  const Icon = m.icon;
                  const active = metodo === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMetodo(m.id)}
                      className={`w-full rounded-xl p-3 flex items-center justify-between text-left border transition cursor-pointer ${
                        active
                          ? 'border-[#ACD638] bg-[#F7FCEB]'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            active ? 'border-[#6E9214]' : 'border-slate-300'
                          }`}
                        >
                          {active && <span className="w-2 h-2 rounded-full bg-[#6E9214]" />}
                        </span>
                        <Icon className="w-4 h-4 text-[#273758]" />
                        <div>
                          <span className="block text-xs font-bold text-[#1E2B45]">{m.title}</span>
                          <span className="block text-[10.5px] text-slate-500">{m.sub}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-[#273758]">{m.id}</span>
                    </button>
                  );
                })}

                <label className="pt-1 flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="rounded accent-rose-600"
                  />
                  <span>Simular rechazo bancario (prueba de liberación de bloqueo)</span>
                </label>
              </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="button"
              disabled={!totals.tarifaValida}
              onClick={handleConfirmPayment}
              className="w-full rounded-2xl bg-[#B6E22E] hover:bg-[#ACD638] disabled:bg-slate-200 disabled:text-slate-400 py-3.5 text-base font-extrabold text-[#16223B] flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{`Confirmar pago – B/. ${totals.totalPagado.toFixed(2)}`}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
