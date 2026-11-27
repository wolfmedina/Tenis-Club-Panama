import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CloudRain,
  Download,
  FileText,
  GraduationCap,
  MapPin,
  Megaphone,
  Plus,
  QrCode,
  RefreshCw,
  Settings,
  UserCheck,
  Users,
  Wallet,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEMO_DATES, TIME_SLOTS } from '../../data/seedData';
import type { AdminSubRole, Modality } from '../../types/tennis';
import { computeAdminMetrics, formatHour12, isSlotAvailable } from '../../utils/tennisLogic';
import { HeaderBar } from '../HeaderBar';

export type AdminTab = 'inicio' | 'reservas' | 'clases' | 'canchas' | 'mantenimiento' | 'perfil';

interface AdminMobileViewProps {
  activeTab: AdminTab;
  onChangeTab: (tab: AdminTab) => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onOpenChat: () => void;
}

export const AdminMobileView: React.FC<AdminMobileViewProps> = ({
  activeTab,
  onChangeTab,
  onOpenMenu,
  onOpenNotifications,
  onOpenChat,
}) => {
  const {
    state,
    currentUser,
    activeSede,
    switchSede,
    switchRole,
    toggleCourtStatus,
    createReservation,
    cancelReservation,
    rescheduleReservation,
    validateCheckInCode,
    reportMaintenance,
    resolveMaintenance,
    suspendByRain,
    sendAdminNotification,
    createInstructorClass,
    resetDemoData,
    logout,
    showToast,
  } = useApp();

  const [showSedeMenu, setShowSedeMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState(DEMO_DATES[0].iso);

  // Modals
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showRainModal, setShowRainModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);

  // Form states
  const sedeCanchas = useMemo(
    () => state.canchas.filter((c) => c.sedeId === activeSede.id),
    [state.canchas, activeSede.id]
  );

  const [manCanchaId, setManCanchaId] = useState(sedeCanchas[0]?.id || '');
  const [manHora, setManHora] = useState('16:30');
  const [manJugador, setManJugador] = useState('Roberto Díaz (Presencial)');
  const [manModalidad, setManModalidad] = useState<Modality>('Dobles');
  const [manError, setManError] = useState('');

  const [qrCodeInput, setQrCodeInput] = useState('TCP-2401');
  const [qrResult, setQrResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [rainReason, setRainReason] = useState('Tormenta eléctrica en la zona');
  const [notifTitle, setNotifTitle] = useState('Aviso del club');
  const [notifBody, setNotifBody] = useState('Recuerden llegar 10 min antes para validación QR.');

  const [maintCanchaId, setMaintCanchaId] = useState(sedeCanchas[0]?.id || '');
  const [maintTitle, setMaintTitle] = useState('Revisión de malla / red');
  const [maintDetail, setMaintDetail] = useState('Ajustar tensión central');
  const [maintPriority, setMaintPriority] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [maintBlock, setMaintBlock] = useState(false);

  const [clsTitulo, setClsTitulo] = useState('Clínica Nocturna Intermedio');
  const [clsCanchaId, setClsCanchaId] = useState(sedeCanchas[0]?.id || '');
  const [clsHora, setClsHora] = useState('18:00');
  const [clsError, setClsError] = useState('');

  const metrics = useMemo(
    () => computeAdminMetrics(state, activeSede.id, selectedDate),
    [state, activeSede.id, selectedDate]
  );

  const sedeReservas = useMemo(
    () =>
      state.reservas.filter(
        (r) => r.sedeId === activeSede.id && (activeTab === 'inicio' ? r.fecha === selectedDate : true)
      ),
    [state.reservas, activeSede.id, activeTab, selectedDate]
  );

  const sedeClases = useMemo(
    () => state.clases.filter((cl) => cl.sedeId === activeSede.id),
    [state.clases, activeSede.id]
  );

  const sedeIncidencias = useMemo(
    () => state.incidencias.filter((i) => i.sedeId === activeSede.id && i.estado === 'Abierta'),
    [state.incidencias, activeSede.id]
  );

  const handleExportCSV = () => {
    const headers = ['Codigo,Fecha,Hora,Cancha,Estado,Metodo,TotalUSD'];
    const rows = state.reservas
      .filter((r) => r.sedeId === activeSede.id)
      .map((r) => {
        const cname = state.canchas.find((c) => c.id === r.canchaId)?.nombre || r.canchaId;
        return `${r.codigo},${r.fecha},${r.horaInicio},"${cname}",${r.estado},${r.metodoPago},${r.totalPagado.toFixed(2)}`;
      });
    const csvContent = [...headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ingresos_${activeSede.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`CSV de ingresos exportado (${rows.length} registros)`);
  };

  const handleManualBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManError('');
    const targetCanchaId = manCanchaId || sedeCanchas[0]?.id;
    const res = createReservation({
      sedeId: activeSede.id,
      canchaId: targetCanchaId,
      fecha: selectedDate,
      horaInicio: manHora,
      duracionMin: 60,
      modalidad: manModalidad,
      participantes: [manJugador],
      metodoPago: 'Tarjeta',
      tipoOrigen: 'Manual Admin',
    });
    if (!res.ok) {
      setManError(res.error || 'No disponible');
      return;
    }
    setShowManualBooking(false);
    showToast('Reserva manual registrada en agenda');
  };

  const firstName = currentUser.nombre.split(' ')[0];

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9]">
      <HeaderBar
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
        onOpenChat={onOpenChat}
      >
        <div className="pb-1">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#B6E22E] px-2.5 py-0.5 text-[10px] font-extrabold text-[#16223B]">
              <Settings className="w-3 h-3" />
              ADMINISTRADOR · {(currentUser.adminSubRol || 'propietario').toUpperCase()}
            </span>
            <button
              type="button"
              onClick={() => switchRole('jugador')}
              className="text-[11px] font-bold text-[#ACD638] hover:underline cursor-pointer"
            >
              Ver como Jugador
            </button>
          </div>

          <h1 className="mt-1.5 text-[24px] font-extrabold text-white leading-tight">
            Hola, {firstName}
          </h1>

          {/* Sede Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSedeMenu((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-[#ACD638] cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#ACD638]" />
              <span>Gestión del club: {activeSede.nombre}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showSedeMenu && (
              <div className="mt-2 rounded-2xl bg-white p-2 shadow-xl text-[#1E2B45] z-30 relative">
                {state.sedes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      switchSede(s.id);
                      setShowSedeMenu(false);
                      showToast(`Sede activa: ${s.nombre}`, 'info');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#F4F6F9] flex items-center justify-between cursor-pointer"
                  >
                    <span>
                      {s.nombre} <span className="font-normal text-slate-400">({s.tipo})</span>
                    </span>
                    {s.id === activeSede.id && <span className="text-[#5E8210]">Activa</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3 KPI Cards */}
          {activeTab === 'inicio' && (
            <div className="mt-3.5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white p-2.5 text-[#1E2B45] shadow-sm border-l-4 border-[#B6E22E]">
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <Wallet className="w-3 h-3 text-[#273758]" />
                  Ingresos hoy
                </span>
                <span className="mt-1 block text-base font-extrabold tabular-nums">
                  B/. {metrics.ingresosHoy.toFixed(2)}
                </span>
                <span className="mt-1 inline-block rounded-md bg-[#ECFCCB] px-1.5 py-0.5 text-[9.5px] font-bold text-[#4E7006]">
                  ↑ +12% vs ayer
                </span>
              </div>

              <div className="rounded-2xl bg-white p-2.5 text-[#1E2B45] shadow-sm border-l-4 border-[#B6E22E]">
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-[#273758]" />
                  Ocupación
                </span>
                <span className="mt-1 block text-xl font-extrabold tabular-nums">
                  {metrics.ocupacionPct}%
                </span>
                <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[#B6E22E] rounded-full"
                    style={{ width: `${metrics.ocupacionPct}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-2.5 text-[#1E2B45] shadow-sm border-l-4 border-[#B6E22E]">
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#273758]" />
                  Reservas hoy
                </span>
                <span className="mt-1 block text-xl font-extrabold tabular-nums">
                  {metrics.reservasHoy}
                </span>
                <span className="mt-1 inline-block rounded-md bg-[#ECFCCB] px-1.5 py-0.5 text-[9.5px] font-bold text-[#4E7006]">
                  {activeSede.tipo}
                </span>
              </div>
            </div>
          )}
        </div>
      </HeaderBar>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-4 pb-8">
        {activeTab === 'inicio' && (
          <>
            {/* Gestión de canchas con toggles reales */}
            <section className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-sm font-extrabold text-[#1E2B45]">Gestión de canchas</h2>
                <button
                  type="button"
                  onClick={() => onChangeTab('canchas')}
                  className="text-xs font-bold text-[#5E8210] inline-flex items-center gap-0.5 cursor-pointer"
                >
                  Ver canchas <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sedeCanchas.slice(0, 4).map((c) => {
                  const isAvail = c.estado === 'Disponible';
                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border border-slate-100 bg-[#F9FAFB] p-2 flex flex-col items-center gap-1.5 text-center"
                    >
                      <span className="text-[11px] font-extrabold text-[#1E2B45] truncate w-full">
                        {c.nombre}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isAvail}
                        aria-label={`Alternar disponibilidad de ${c.nombre}`}
                        onClick={() => toggleCourtStatus(c.id)}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                          isAvail ? 'bg-[#B6E22E] justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-white shadow" />
                      </button>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[9.5px] font-bold ${
                          isAvail
                            ? 'bg-[#ECFCCB] text-[#4E7006]'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {c.estado}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 5 Quick Admin Actions */}
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { label: 'Nueva reserva', icon: Calendar, onClick: () => setShowManualBooking(true) },
                { label: 'Agregar clase', icon: Users, onClick: () => setShowClassModal(true) },
                { label: 'Mantenimiento', icon: Wrench, onClick: () => setShowMaintModal(true) },
                { label: 'Enviar aviso', icon: Megaphone, onClick: () => setShowNotifyModal(true) },
                { label: 'Lluvia', icon: CloudRain, onClick: () => setShowRainModal(true) },
              ].map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.label}
                    type="button"
                    onClick={act.onClick}
                    className="rounded-2xl bg-white py-2.5 px-1 shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-1 hover:border-[#ACD638] cursor-pointer"
                  >
                    <Icon className="w-5 h-5 text-[#273758]" />
                    <span className="text-[9.5px] font-bold text-[#1E2B45] text-center leading-tight">
                      {act.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Próximas reservas */}
            <section className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#1E2B45]">Próximas reservas</h2>
                <button
                  type="button"
                  onClick={() => onChangeTab('reservas')}
                  className="text-xs font-bold text-[#5E8210] inline-flex items-center gap-0.5 cursor-pointer"
                >
                  Ver agenda completa <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {sedeReservas.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No hay reservas para esta fecha en {activeSede.nombre}.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {sedeReservas.slice(0, 4).map((r) => {
                    const cname = state.canchas.find((c) => c.id === r.canchaId)?.nombre;
                    return (
                      <div key={r.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs font-extrabold text-[#273758] tabular-nums w-16 shrink-0">
                            {formatHour12(r.horaInicio)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-[#1E2B45] truncate">
                              {cname} – {r.codigo}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {r.modalidad} ({r.participantes.length} jug.) · {r.metodoPago}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                            r.estado === 'Cancelada'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-[#ECFCCB] text-[#4E7006]'
                          }`}
                        >
                          {r.estado}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 2-Column Alerts & Today Classes */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-[#1E2B45] flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-[#273758]" />
                    Alertas ({sedeIncidencias.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => onChangeTab('mantenimiento')}
                    className="text-[10.5px] font-bold text-[#5E8210] cursor-pointer"
                  >
                    Ver
                  </button>
                </div>
                {sedeIncidencias.slice(0, 2).map((inc) => (
                  <div key={inc.id} className="rounded-xl bg-[#F9FAFB] p-2 text-[10.5px]">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-[#1E2B45] truncate">{inc.titulo}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                          inc.prioridad === 'Alta'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inc.prioridad}
                      </span>
                    </div>
                    <p className="text-slate-500 truncate mt-0.5">{inc.detalle}</p>
                  </div>
                ))}
                {sedeIncidencias.length === 0 && (
                  <p className="text-[11px] text-slate-400">Sin alertas abiertas</p>
                )}
              </div>

              <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-[#1E2B45] flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-[#273758]" />
                    Clases hoy
                  </h3>
                  <button
                    type="button"
                    onClick={() => onChangeTab('clases')}
                    className="text-[10.5px] font-bold text-[#5E8210] cursor-pointer"
                  >
                    Ver
                  </button>
                </div>
                <div className="flex items-center justify-between text-center bg-[#F9FAFB] rounded-xl p-2">
                  <div>
                    <span className="block text-base font-extrabold text-[#1E2B45] tabular-nums">
                      {metrics.clasesHoy}
                    </span>
                    <span className="text-[9.5px] text-slate-500">Clases</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div>
                    <span className="block text-base font-extrabold text-[#1E2B45] tabular-nums">
                      {metrics.alumnosHoy}
                    </span>
                    <span className="text-[9.5px] text-slate-500">Alumnos</span>
                  </div>
                </div>
                {sedeClases.slice(0, 1).map((cl) => (
                  <p key={cl.id} className="text-[10.5px] text-slate-600 truncate">
                    {formatHour12(cl.horaInicio)} · {cl.titulo}
                  </p>
                ))}
              </div>
            </div>

            {/* Bottom Operational Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShowCheckInModal(true)}
                className="rounded-2xl bg-white border border-slate-200 py-3 px-3 text-xs font-extrabold text-[#1E2B45] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-[#273758]" />
                Validar QR / Asistencia
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="rounded-2xl bg-[#B6E22E] py-3 px-3 text-xs font-extrabold text-[#16223B] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Descargar ingresos (CSV)
              </button>
            </div>
          </>
        )}

        {activeTab === 'reservas' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#1E2B45]">
                Agenda de {activeSede.nombre}
              </h2>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(true)}
                  className="rounded-xl bg-white border border-slate-200 px-2.5 py-2 text-xs font-bold text-[#273758] cursor-pointer"
                >
                  QR
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualBooking(true)}
                  className="rounded-xl bg-[#B6E22E] px-3 py-2 text-xs font-extrabold text-[#16223B] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Manual
                </button>
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {DEMO_DATES.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedDate(d.iso)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer ${
                    selectedDate === d.iso ? 'bg-[#273758] text-white' : 'bg-white text-[#1E2B45]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {sedeReservas.map((r) => {
              const cname = state.canchas.find((c) => c.id === r.canchaId)?.nombre;
              return (
                <div key={r.id} className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#273758]">
                        {r.codigo} · {r.tipoOrigen}
                      </span>
                      <h3 className="text-sm font-extrabold text-[#1E2B45]">
                        {cname} · {formatHour12(r.horaInicio)}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {r.participantes.join(', ')} · {r.fecha}
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-[#273758] tabular-nums">
                      {r.totalPagado === 0 ? 'Gratuita' : `B/. ${r.totalPagado.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!r.asistenciaValidada && r.estado === 'Confirmada' && (
                      <button
                        type="button"
                        onClick={() => validateCheckInCode(r.codigo)}
                        className="rounded-xl bg-[#B6E22E] px-3 py-1.5 text-[11px] font-extrabold text-[#16223B] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Marcar asistencia
                      </button>
                    )}
                    {r.estado === 'Confirmada' && (
                      <>
                        <button
                          type="button"
                          onClick={() => rescheduleReservation(r.id, r.fecha, '15:00')}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-[#273758] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Mover 3:00 p. m.
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelReservation(r.id, true)}
                          className="rounded-xl border border-rose-200 px-3 py-1.5 text-[11px] font-bold text-rose-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" />
                          Cancelar y devolver
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'canchas' && (
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-[#1E2B45]">
              Canchas y tarifas · {activeSede.nombre}
            </h2>
            {sedeCanchas.map((c) => {
              const isAvail = c.estado === 'Disponible';
              return (
                <div key={c.id} className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1E2B45]">{c.nombre}</h3>
                    <p className="text-xs text-slate-500">
                      {c.superficie} · {c.iluminacion ? 'LED' : 'Sin LED'} ·{' '}
                      {c.precioHora === 0 ? 'Gratuita' : `B/. ${c.precioHora}/h`}
                    </p>
                    {c.motivoBloqueo && (
                      <p className="text-[11px] text-rose-600 mt-0.5">{c.motivoBloqueo}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCourtStatus(c.id)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer ${
                      isAvail ? 'bg-[#B6E22E] text-[#16223B]' : 'bg-[#273758] text-white'
                    }`}
                  >
                    {isAvail ? 'Bloquear' : 'Habilitar'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'clases' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#1E2B45]">Clases de {activeSede.nombre}</h2>
              <button
                type="button"
                onClick={() => setShowClassModal(true)}
                className="rounded-xl bg-[#B6E22E] px-3 py-2 text-xs font-extrabold text-[#16223B] cursor-pointer"
              >
                + Programar clase
              </button>
            </div>
            {sedeClases.map((cl) => {
              const inst = state.instructores.find((i) => i.id === cl.instructorId);
              const cancha = state.canchas.find((c) => c.id === cl.canchaId);
              return (
                <div key={cl.id} className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100">
                  <h3 className="text-sm font-extrabold text-[#1E2B45]">{cl.titulo}</h3>
                  <p className="text-xs text-slate-500">
                    {inst?.nombre} · {cancha?.nombre} · {cl.fecha} {formatHour12(cl.horaInicio)}
                  </p>
                  <p className="text-xs font-bold text-[#5E8210] mt-1">
                    Alumnos: {cl.alumnosIds.length}/{cl.cupoMax} · B/. {cl.precioPorCupo}/cupo
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'mantenimiento' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#1E2B45]">Mantenimiento y Clima</h2>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowRainModal(true)}
                  className="rounded-xl bg-[#273758] px-3 py-2 text-xs font-bold text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  <CloudRain className="w-3.5 h-3.5" /> Lluvia
                </button>
                <button
                  type="button"
                  onClick={() => setShowMaintModal(true)}
                  className="rounded-xl bg-[#B6E22E] px-3 py-2 text-xs font-extrabold text-[#16223B] cursor-pointer"
                >
                  + Alerta
                </button>
              </div>
            </div>

            {state.incidencias
              .filter((i) => i.sedeId === activeSede.id)
              .map((inc) => (
                <div key={inc.id} className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-extrabold text-[#1E2B45]">{inc.titulo}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {inc.detalle} · Prioridad {inc.prioridad} · {inc.estado}
                    </p>
                  </div>
                  {inc.estado === 'Abierta' && (
                    <button
                      type="button"
                      onClick={() => resolveMaintenance(inc.id)}
                      className="rounded-xl bg-[#B6E22E] px-3 py-1.5 text-xs font-extrabold text-[#16223B] cursor-pointer"
                    >
                      Resolver
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2.5">
              <h2 className="text-sm font-extrabold text-[#1E2B45]">Sub-rol operativo de sede</h2>
              <div className="grid grid-cols-2 gap-2">
                {(['propietario', 'recepcion', 'finanzas', 'mantenimiento'] as AdminSubRole[]).map((sr) => (
                  <button
                    key={sr}
                    type="button"
                    onClick={() => switchRole('admin', sr)}
                    className={`rounded-xl py-2 px-3 text-xs font-bold capitalize border cursor-pointer ${
                      currentUser.adminSubRol === sr
                        ? 'border-[#ACD638] bg-[#F7FCEB] text-[#16223B]'
                        : 'border-slate-200'
                    }`}
                  >
                    {sr}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2">
              <h2 className="text-sm font-extrabold text-[#1E2B45]">Cambiar de portal</h2>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => switchRole('jugador')}
                  className="rounded-xl bg-[#F4F6F9] py-2 text-xs font-bold text-[#273758] cursor-pointer"
                >
                  Jugador
                </button>
                <button
                  type="button"
                  onClick={() => switchRole('instructor')}
                  className="rounded-xl bg-[#F4F6F9] py-2 text-xs font-bold text-[#273758] cursor-pointer"
                >
                  Instructor
                </button>
                <button
                  type="button"
                  onClick={() => switchRole('superadmin')}
                  className="rounded-xl bg-[#F4F6F9] py-2 text-xs font-bold text-[#273758] cursor-pointer"
                >
                  Nacional
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={resetDemoData}
                className="rounded-2xl bg-white border border-slate-200 py-3 text-xs font-bold text-[#273758]"
              >
                Reiniciar demo
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-2xl bg-white border border-rose-200 py-3 text-xs font-bold text-rose-700"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Manual Booking */}
      {showManualBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <form onSubmit={handleManualBookingSubmit} className="w-full max-w-[380px] rounded-3xl bg-white p-5 space-y-3">
            <h3 className="text-base font-extrabold text-[#1E2B45]">Nueva reserva manual</h3>
            <div>
              <label className="block text-xs font-bold mb-1">Cancha</label>
              <select
                value={manCanchaId || sedeCanchas[0]?.id}
                onChange={(e) => setManCanchaId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                {sedeCanchas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.estado})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Horario ({selectedDate})</label>
              <select
                value={manHora}
                onChange={(e) => setManHora(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                {TIME_SLOTS.map((t) => {
                  const ok = isSlotAvailable(
                    state,
                    manCanchaId || sedeCanchas[0]?.id,
                    selectedDate,
                    t,
                    60
                  ).available;
                  return (
                    <option key={t} value={t}>
                      {formatHour12(t)} {ok ? '' : '(Ocupado)'}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Cliente / Socio</label>
              <input
                type="text"
                value={manJugador}
                onChange={(e) => setManJugador(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Modalidad</label>
              <select
                value={manModalidad}
                onChange={(e) => setManModalidad(e.target.value as Modality)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                <option value="Dobles">Dobles</option>
                <option value="Individual">Individual</option>
              </select>
            </div>
            {manError && <p className="text-xs font-bold text-rose-600">{manError}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowManualBooking(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold">
                Cancelar
              </button>
              <button type="submit" className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B]">
                Guardar reserva
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: QR Check-in */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[360px] rounded-3xl bg-white p-5 space-y-3">
            <h3 className="text-base font-extrabold text-[#1E2B45]">Validar código / QR de reserva</h3>
            <input
              type="text"
              value={qrCodeInput}
              onChange={(e) => setQrCodeInput(e.target.value)}
              placeholder="Ej. TCP-2401"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono uppercase"
            />
            {qrResult && (
              <p className={`text-xs font-bold ${qrResult.ok ? 'text-[#4E7006]' : 'text-rose-600'}`}>
                {qrResult.message}
              </p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCheckInModal(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold">
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => setQrResult(validateCheckInCode(qrCodeInput))}
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B]"
              >
                Validar entrada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rain Suspension */}
      {showRainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 space-y-3">
            <h3 className="text-base font-extrabold text-[#1E2B45] flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-[#273758]" />
              Suspender operación por lluvia
            </h3>
            <p className="text-xs text-slate-500">
              Cancela turnos activos no techados del {selectedDate} en {activeSede.nombre}, emite devolución simulada y envía alerta.
            </p>
            <input
              type="text"
              value={rainReason}
              onChange={(e) => setRainReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowRainModal(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  suspendByRain(activeSede.id, selectedDate, rainReason);
                  setShowRainModal(false);
                }}
                className="flex-1 rounded-xl bg-[#273758] py-2.5 text-xs font-extrabold text-white"
              >
                Suspender y avisar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Send Notification */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 space-y-3">
            <h3 className="text-base font-extrabold text-[#1E2B45]">Enviar notificación a jugadores</h3>
            <input
              type="text"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
            />
            <textarea
              value={notifBody}
              onChange={(e) => setNotifBody(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowNotifyModal(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  sendAdminNotification(notifTitle, notifBody);
                  setShowNotifyModal(false);
                }}
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B]"
              >
                Enviar aviso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Report Maintenance */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 space-y-3">
            <h3 className="text-base font-extrabold text-[#1E2B45]">Reportar mantenimiento</h3>
            <select
              value={maintCanchaId || sedeCanchas[0]?.id}
              onChange={(e) => setMaintCanchaId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            >
              {sedeCanchas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={maintTitle}
              onChange={(e) => setMaintTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              placeholder="Título de incidencia"
            />
            <input
              type="text"
              value={maintDetail}
              onChange={(e) => setMaintDetail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              placeholder="Detalle"
            />
            <div className="flex items-center justify-between text-xs">
              <select
                value={maintPriority}
                onChange={(e) => setMaintPriority(e.target.value as 'Alta' | 'Media' | 'Baja')}
                className="rounded-xl border border-slate-200 px-3 py-1.5"
              >
                <option value="Alta">Prioridad Alta</option>
                <option value="Media">Prioridad Media</option>
                <option value="Baja">Prioridad Baja</option>
              </select>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintBlock}
                  onChange={(e) => setMaintBlock(e.target.checked)}
                />
                Bloquear cancha
              </label>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowMaintModal(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  reportMaintenance({
                    sedeId: activeSede.id,
                    canchaId: maintCanchaId || sedeCanchas[0]?.id,
                    titulo: maintTitle,
                    detalle: maintDetail,
                    prioridad: maintPriority,
                    bloquearCancha: maintBlock,
                  });
                  setShowMaintModal(false);
                }}
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B]"
              >
                Guardar alerta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Class */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 space-y-3">
            <h3 className="text-base font-extrabold text-[#1E2B45]">Agregar clase a la agenda</h3>
            <input
              type="text"
              value={clsTitulo}
              onChange={(e) => setClsTitulo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />
            <select
              value={clsCanchaId || sedeCanchas[0]?.id}
              onChange={(e) => setClsCanchaId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            >
              {sedeCanchas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <select
              value={clsHora}
              onChange={(e) => setClsHora(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {formatHour12(t)}
                </option>
              ))}
            </select>
            {clsError && <p className="text-xs font-bold text-rose-600">{clsError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowClassModal(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = createInstructorClass({
                    sedeId: activeSede.id,
                    canchaId: clsCanchaId || sedeCanchas[0]?.id,
                    titulo: clsTitulo,
                    tipo: 'Grupal',
                    fecha: selectedDate,
                    horaInicio: clsHora,
                    duracionMin: 60,
                    precioPorCupo: 25,
                    cupoMax: 8,
                  });
                  if (!res.ok) setClsError(res.error || 'Conflicto de horario');
                  else setShowClassModal(false);
                }}
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B]"
              >
                Programar clase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
