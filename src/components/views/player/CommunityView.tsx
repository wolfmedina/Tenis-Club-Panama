import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Crown,
  Info,
  MapPin,
  MessageSquare,
  Plus,
  Send,
  ShieldAlert,
  Star,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { DEMO_DATES, TIME_SLOTS } from '../../../data/seedData';
import type { Modality, PaymentMethod, SkillLevel } from '../../../types/tennis';
import { formatHour12, isSlotAvailable } from '../../../utils/tennisLogic';
import { HeaderBar } from '../../HeaderBar';
import { CourtScene, PlayerAvatar } from '../../VisualAssets';

interface CommunityViewProps {
  preselectedReservaForConvocatoria?: string | null;
  onClearPreselectedReserva: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onOpenChat: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  preselectedReservaForConvocatoria,
  onClearPreselectedReserva,
  onOpenMenu,
  onOpenNotifications,
  onOpenChat,
}) => {
  const {
    state,
    currentUser,
    joinConvocatoria,
    leaveConvocatoria,
    approvePendingPlayer,
    sendConvocatoriaMessage,
    createConvocatoria,
    createPlanificacion,
    votePlanificacion,
    sendPlanificacionMessage,
    convertPlanificacionToBooking,
    showToast,
  } = useApp();

  const [subTab, setSubTab] = useState<'abiertos' | 'actividad' | 'planificacion'>(
    'abiertos'
  );
  const [nivelFilter, setNivelFilter] = useState<'Todos' | SkillLevel>('Todos');
  const [sedeFilter, setSedeFilter] = useState<string>('Todas');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    state.planificaciones[0]?.id || ''
  );
  const [chatText, setChatText] = useState('');
  const [planChatText, setPlanChatText] = useState('');

  // Modals for the 2 unequivocal actions
  const [showActionChoice, setShowActionChoice] = useState(false);
  const [showCreateConvModal, setShowCreateConvModal] = useState(
    Boolean(preselectedReservaForConvocatoria)
  );
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showConvertBookingModal, setShowConvertBookingModal] = useState(false);

  // Create Convocatoria form
  const myConfirmedReservas = state.reservas.filter(
    (r) => r.usuarioId === currentUser.id && r.estado === 'Confirmada'
  );
  const [convReservaId, setConvReservaId] = useState(
    preselectedReservaForConvocatoria || myConfirmedReservas[0]?.id || ''
  );
  const [convTitulo, setConvTitulo] = useState('Partido abierto – Nivel Intermedio');
  const [convModalidad, setConvModalidad] = useState<Modality>('Dobles');
  const [convNivel, setConvNivel] = useState<SkillLevel>('Intermedio');
  const [convCupo, setConvCupo] = useState(4);
  const [convAporte, setConvAporte] = useState(8);
  const [convAuto, setConvAuto] = useState(true);

  // Create Planificacion form
  const [planTitulo, setPlanTitulo] = useState('Partido de Dobles – Grupo');
  const [planModalidad, setPlanModalidad] = useState<Modality>('Dobles');
  const [planQuorum, setPlanQuorum] = useState(4);
  const [planSedeId, setPlanSedeId] = useState(state.sedes[0].id);
  const [planFecha, setPlanFecha] = useState(DEMO_DATES[0].iso);
  const [planHora, setPlanHora] = useState('19:30');

  // Convert Planning to Booking state
  const [convertCanchaId, setConvertCanchaId] = useState('');
  const [convertMetodo, setConvertMetodo] = useState<PaymentMethod>('Yappy');
  const [convertError, setConvertError] = useState('');

  const filteredConvs = useMemo(() => {
    return state.convocatorias.filter((c) => {
      if (subTab === 'actividad') {
        const involved =
          c.organizadorId === currentUser.id ||
          c.jugadoresIds.includes(currentUser.id) ||
          c.listaEsperaIds.includes(currentUser.id);
        if (!involved) return false;
      }
      if (nivelFilter !== 'Todos' && c.nivel !== nivelFilter) return false;
      if (sedeFilter !== 'Todas' && c.sedeId !== sedeFilter) return false;
      return true;
    });
  }, [state.convocatorias, subTab, nivelFilter, sedeFilter, currentUser.id]);

  const featuredMatch =
    filteredConvs.find((c) => c.destacado) || filteredConvs[0] || null;
  const moreMatches = filteredConvs.filter((c) => c.id !== featuredMatch?.id);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof moreMatches> = {};
    moreMatches.forEach((m) => {
      if (!groups[m.fecha]) groups[m.fecha] = [];
      groups[m.fecha].push(m);
    });
    return Object.entries(groups);
  }, [moreMatches]);

  const activePlan =
    state.planificaciones.find((p) => p.id === selectedPlanId) ||
    state.planificaciones[0];

  const selectedConv = state.convocatorias.find((c) => c.id === selectedConvId);

  const handleSubmitConv = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createConvocatoria({
      reservaId: convReservaId,
      titulo: convTitulo,
      nivel: convNivel,
      modalidad: convModalidad,
      cupoTotal: convCupo,
      aportePorJugador: convAporte,
      descripcion: 'Convocatoria abierta desde Tenis Club Panamá.',
      visibilidad: 'Pública',
      aprobacionAutomatica: convAuto,
    });
    if (res.ok) {
      setShowCreateConvModal(false);
      onClearPreselectedReserva();
    } else {
      showToast(res.error || 'Selecciona una reserva confirmada', 'error');
    }
  };

  const handleSubmitPlan = (e: React.FormEvent) => {
    e.preventDefault();
    createPlanificacion({
      titulo: planTitulo,
      modalidad: planModalidad,
      nivel: 'Intermedio',
      tipo: 'Amistoso',
      quorumMinimo: planQuorum,
      opciones: [
        {
          fecha: planFecha,
          horaInicio: planHora,
          horaFin: '21:00',
          sedeId: planSedeId,
        },
        {
          fecha: DEMO_DATES[1].iso,
          horaInicio: '09:00',
          horaFin: '10:30',
          sedeId: planSedeId,
        },
      ],
    });
    setShowCreatePlanModal(false);
    setSubTab('planificacion');
  };

  // Winning option for planning
  const winningOption = useMemo(() => {
    if (!activePlan) return null;
    return [...activePlan.opciones].sort(
      (a, b) => b.votosIds.length - a.votosIds.length
    )[0];
  }, [activePlan]);

  const availableCanchasForWin = useMemo(() => {
    if (!winningOption) return [];
    return state.canchas
      .filter((c) => c.sedeId === winningOption.sedeId)
      .map((c) => ({
        cancha: c,
        ...isSlotAvailable(
          state,
          c.id,
          winningOption.fecha,
          winningOption.horaInicio,
          90
        ),
      }));
  }, [state, winningOption]);

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9]">
      <HeaderBar
        onBack={subTab === 'planificacion' ? () => setSubTab('abiertos') : undefined}
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
        onOpenChat={onOpenChat}
      >
        <div className="pb-1">
          {subTab === 'planificacion' ? (
            <div>
              <span className="text-xs font-bold text-[#ACD638]">Comunidad</span>
              <h1 className="text-2xl font-extrabold text-white">Organizar partido</h1>
              <p className="text-xs text-white/85">
                Propón un juego, coordina con tu grupo y reserven la cancha al alcanzar quórum.
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-extrabold text-white">Comunidad</h1>
              <p className="text-xs text-white/85 flex items-center gap-1.5 mt-0.5">
                <Users className="w-3.5 h-3.5 text-[#ACD638]" />
                <span>Conecta, juega y vive el tenis</span>
              </p>
            </div>
          )}

          {/* Segmented Nav */}
          <div className="mt-3 rounded-full bg-white p-1 grid grid-cols-3 gap-1 shadow-sm">
            <button
              type="button"
              onClick={() => setSubTab('abiertos')}
              className={`rounded-full py-2 text-[11.5px] font-extrabold transition cursor-pointer ${
                subTab === 'abiertos'
                  ? 'bg-[#B6E22E] text-[#16223B]'
                  : 'text-[#273758] hover:bg-slate-100'
              }`}
            >
              Partidos abiertos
            </button>
            <button
              type="button"
              onClick={() => setSubTab('actividad')}
              className={`rounded-full py-2 text-[11.5px] font-extrabold transition cursor-pointer ${
                subTab === 'actividad'
                  ? 'bg-[#B6E22E] text-[#16223B]'
                  : 'text-[#273758] hover:bg-slate-100'
              }`}
            >
              Mi actividad
            </button>
            <button
              type="button"
              onClick={() => setSubTab('planificacion')}
              className={`rounded-full py-2 text-[11.5px] font-extrabold transition cursor-pointer ${
                subTab === 'planificacion'
                  ? 'bg-[#B6E22E] text-[#16223B]'
                  : 'text-[#273758] hover:bg-slate-100'
              }`}
            >
              Planificar grupo
            </button>
          </div>
        </div>
      </HeaderBar>

      <div className="flex-1 p-4 space-y-4 pb-8">
        {/* Two primary unequivocal actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setShowCreateConvModal(true)}
            className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100 text-left hover:border-[#ACD638] transition cursor-pointer"
          >
            <span className="block text-xs font-extrabold text-[#273758]">
              Tengo cancha reservada
            </span>
            <span className="block text-[10.5px] text-slate-500 mt-0.5">
              Publica convocatoria sobre reserva
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowCreatePlanModal(true)}
            className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100 text-left hover:border-[#ACD638] transition cursor-pointer"
          >
            <span className="block text-xs font-extrabold text-[#273758]">
              Planificar un partido
            </span>
            <span className="block text-[10.5px] text-slate-500 mt-0.5">
              Vota horarios sin pagar previo
            </span>
          </button>
        </div>

        {subTab === 'planificacion' && activePlan ? (
          /* 06_Planificacion_Grupal View */
          <div className="space-y-3.5">
            {state.planificaciones.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {state.planificaciones.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer ${
                      p.id === activePlan.id
                        ? 'bg-[#273758] text-white'
                        : 'bg-white text-[#1E2B45]'
                    }`}
                  >
                    {p.titulo}
                  </button>
                ))}
              </div>
            )}

            {/* Plan Header Card */}
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden flex border border-slate-100">
              <div className="w-[62%] p-3.5 space-y-1.5">
                <span className="text-[10px] font-extrabold tracking-wider text-[#273758]/70 uppercase">
                  PLANIFICACIÓN DE GRUPO · {activePlan.estado}
                </span>
                <h2 className="text-base font-extrabold text-[#1E2B45] leading-snug">
                  {activePlan.titulo}
                </h2>
                <p className="text-xs text-slate-500">{activePlan.subtitulo}</p>
                <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-[#273758]">
                  <span>{activePlan.modalidad}</span>
                  <span>·</span>
                  <span>Nivel {activePlan.nivel}</span>
                  <span>·</span>
                  <span>{activePlan.tipo}</span>
                </div>
              </div>
              <div
                className="w-[42%] -ml-3 relative"
                style={{ clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)' }}
              >
                <CourtScene variant="night-club" clubLabel="TENIS CLUB PANAMÁ" />
              </div>
            </div>

            {/* Players & Quorum Progress */}
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#1E2B45] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#273758]" />
                  Jugadores del grupo ({activePlan.jugadoresIds.length}/{activePlan.quorumMinimo})
                </h3>
                <button
                  type="button"
                  onClick={() => showToast('Enlace de invitación copiado (demo)', 'info')}
                  className="rounded-xl bg-[#F4F6F9] px-2.5 py-1.5 text-[11px] font-bold text-[#273758] inline-flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Invitar jugadores
                </button>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                {activePlan.jugadoresIds.map((uid) => {
                  const u = state.usuarios.find((usr) => usr.id === uid);
                  const isOrg = uid === activePlan.organizadorId;
                  return (
                    <div key={uid} className="flex flex-col items-center gap-1 shrink-0">
                      <div className="relative">
                        <PlayerAvatar
                          nombre={u?.nombre || 'Jugador'}
                          seed={u?.avatarSeed}
                          avatarUrl={u?.avatarUrl}
                          ringLime={isOrg}
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${
                            isOrg ? 'bg-[#B6E22E] text-[#16223B]' : 'bg-[#ACD638] text-[#16223B]'
                          }`}
                        >
                          {isOrg ? <Crown className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-[#1E2B45]">
                        {uid === currentUser.id
                          ? `${u?.nombre.split(' ')[0]} (Tú)`
                          : u?.nombre.split(' ')[0] || 'Jugador'}
                      </span>
                    </div>
                  );
                })}
                {!activePlan.jugadoresIds.includes(currentUser.id) && (
                  <button
                    type="button"
                    onClick={() =>
                      activePlan.opciones[0] &&
                      votePlanificacion(activePlan.id, activePlan.opciones[0].id)
                    }
                    className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span className="w-11 h-11 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-500">
                      <UserPlus className="w-4 h-4" />
                    </span>
                    <span className="text-[10.5px] font-semibold text-slate-500">Unirme</span>
                  </button>
                )}
              </div>

              {/* Quorum Progress Bar */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-extrabold text-[#1E2B45]">Progreso del quórum</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#273758] tabular-nums">
                      {activePlan.jugadoresIds.length} de {activePlan.quorumMinimo} jugadores
                    </span>
                    {activePlan.jugadoresIds.length >= activePlan.quorumMinimo && (
                      <span className="rounded-lg bg-[#B6E22E] px-2 py-0.5 text-[11px] font-extrabold text-[#16223B]">
                        ✓ ¡Listo!
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[#B6E22E] rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (activePlan.jugadoresIds.length / activePlan.quorumMinimo) * 100
                      )}%`,
                    }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {activePlan.jugadoresIds.length >= activePlan.quorumMinimo
                    ? '¡Excelente! Ya tienen el mínimo de jugadores. Pueden verificar cancha y reservar sin pagos previos.'
                    : 'Faltan jugadores para alcanzar el quórum. Ninguna cancha está bloqueada todavía.'}
                </p>
              </div>
            </div>

            {/* Voting Section */}
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#1E2B45] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#273758]" />
                    Votación de fecha y hora
                  </h3>
                  <p className="text-[11px] text-slate-500">Elijan la mejor opción para el partido.</p>
                </div>
                <span className="rounded-lg bg-[#F4F6F9] px-2.5 py-1 text-[10.5px] font-bold text-[#273758]">
                  {activePlan.cierraEnTexto}
                </span>
              </div>

              <div className="space-y-2">
                {activePlan.opciones.map((op) => {
                  const votedByMe = op.votosIds.includes(currentUser.id);
                  const isTop = winningOption?.id === op.id && op.votosIds.length > 0;
                  const dObj = DEMO_DATES.find((d) => d.iso === op.fecha);
                  const sede = state.sedes.find((s) => s.id === op.sedeId);

                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => votePlanificacion(activePlan.id, op.id)}
                      className={`w-full rounded-xl p-2.5 border text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                        votedByMe
                          ? 'border-[#ACD638] bg-[#F7FCEB]'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            votedByMe ? 'border-[#5E8210]' : 'border-slate-300'
                          }`}
                        >
                          {votedByMe && <span className="w-2 h-2 rounded-full bg-[#5E8210]" />}
                        </span>
                        <div className="text-center pr-2 border-r border-slate-200">
                          <span className="block text-[9px] font-bold text-slate-500">{dObj?.dow || 'VIE'}</span>
                          <span className="block text-sm font-extrabold text-[#1E2B45] tabular-nums leading-none">
                            {dObj?.day || '27'}
                          </span>
                          <span className="block text-[9px] text-slate-500">{dObj?.month || 'NOV'}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-extrabold text-[#1E2B45] tabular-nums">
                            {formatHour12(op.horaInicio)} – {formatHour12(op.horaFin)}
                          </span>
                          <span className="block text-[10.5px] text-slate-500">{sede?.nombre}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-[#273758] tabular-nums">
                          {op.votosIds.length} votos
                        </span>
                        {isTop && (
                          <span className="rounded-lg bg-[#B6E22E] px-2 py-0.5 text-[10px] font-extrabold text-[#16223B]">
                            Más votada
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group Conversation */}
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#1E2B45] flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#273758]" />
                  Conversación del grupo
                </h3>
              </div>

              {currentUser.esMenor ? (
                <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  Chat abierto restringido para cuentas Junior por seguridad.
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {activePlan.mensajes.map((m) => (
                      <div key={m.id} className="flex items-start gap-2">
                        <PlayerAvatar nombre={m.autorNombre} size="xs" />
                        <div className="rounded-xl bg-[#F4F6F9] px-3 py-1.5 text-xs flex-1">
                          <span className="font-bold text-[#1E2B45]">{m.autorNombre}</span>{' '}
                          <span className="text-[10px] text-slate-400">· {m.hora}</span>
                          <p className="text-slate-700 mt-0.5">{m.texto}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendPlanificacionMessage(activePlan.id, planChatText);
                      setPlanChatText('');
                    }}
                    className="flex items-center gap-2 pt-1"
                  >
                    <input
                      type="text"
                      value={planChatText}
                      onChange={(e) => setPlanChatText(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      aria-label="Escribe un mensaje en la planificación"
                      className="flex-1 rounded-full border border-slate-200 px-3.5 py-2 text-xs text-[#1E2B45]"
                    />
                    <button
                      type="submit"
                      aria-label="Enviar mensaje"
                      className="w-9 h-9 rounded-full bg-[#273758] text-white flex items-center justify-center cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              )}
            </div>

            {activePlan.estado === 'Reservada' ? (
              <div className="rounded-2xl bg-[#ECFCCB] border border-[#ACD638] p-3.5 text-center text-xs font-extrabold text-[#273758]">
                ✓ Cancha reservada y vinculada a este grupo
              </div>
            ) : (
              <button
                type="button"
                disabled={activePlan.jugadoresIds.length < activePlan.quorumMinimo}
                onClick={() => {
                  setConvertError('');
                  const firstFree = availableCanchasForWin.find((c) => c.available);
                  setConvertCanchaId(firstFree?.cancha.id || '');
                  setShowConvertBookingModal(true);
                }}
                className="w-full rounded-2xl bg-[#B6E22E] hover:bg-[#ACD638] disabled:bg-slate-200 disabled:text-slate-400 py-3.5 text-base font-extrabold text-[#16223B] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Buscar cancha y reservar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          /* 05_Comunidad_Partidos_Abiertos View */
          <>
            <div>
              <h2 className="text-lg font-extrabold text-[#1E2B45]">Partidos abiertos</h2>
              <p className="text-xs text-slate-500">
                Encuentra partidos disponibles y únete en tu nivel
              </p>

              {/* Filters */}
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <select
                  aria-label="Filtrar partidos por nivel"
                  value={nivelFilter}
                  onChange={(e) => setNivelFilter(e.target.value as 'Todos' | SkillLevel)}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#1E2B45] border border-slate-200"
                >
                  <option value="Todos">Nivel: Todos los niveles</option>
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
                <select
                  aria-label="Filtrar partidos por ubicación"
                  value={sedeFilter}
                  onChange={(e) => setSedeFilter(e.target.value)}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#1E2B45] border border-slate-200"
                >
                  <option value="Todas">Ubicación: Todas</option>
                  {state.sedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {featuredMatch && (
              <div className="rounded-2xl bg-[#1D2D4E] text-white shadow-md overflow-hidden relative flex">
                <div className="w-[62%] p-3.5 z-10 flex flex-col justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[#B6E22E] px-2 py-0.5 text-[10px] font-extrabold text-[#16223B]">
                      <Star className="w-3 h-3 fill-current" /> PARTIDO DESTACADO
                    </span>
                    <h3 className="mt-2 text-base font-extrabold leading-snug">
                      {featuredMatch.titulo}
                    </h3>
                    <div className="mt-1.5 space-y-1 text-[11px] text-white/85">
                      <p className="flex items-center gap-1.5 tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-[#ACD638]" />
                        {DEMO_DATES.find((d) => d.iso === featuredMatch.fecha)?.label || featuredMatch.fecha} ·{' '}
                        {formatHour12(featuredMatch.horaInicio)}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#ACD638]" />
                        {state.sedes.find((s) => s.id === featuredMatch.sedeId)?.nombre}
                      </p>
                      <p className="flex items-center gap-1.5 tabular-nums">
                        <Users className="w-3.5 h-3.5 text-[#ACD638]" />
                        <span>
                          {featuredMatch.jugadoresIds.length}/{featuredMatch.cupoTotal} jugadores
                        </span>
                        <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px]">
                          {featuredMatch.cupoTotal - featuredMatch.jugadoresIds.length > 0
                            ? `Faltan ${featuredMatch.cupoTotal - featuredMatch.jugadoresIds.length}`
                            : 'Cupo completo'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => joinConvocatoria(featuredMatch.id)}
                      className="rounded-xl bg-[#B6E22E] px-3.5 py-2 text-xs font-extrabold text-[#16223B] cursor-pointer"
                    >
                      {featuredMatch.jugadoresIds.includes(currentUser.id)
                        ? 'Inscrito'
                        : featuredMatch.estado === 'Completa'
                          ? 'Lista espera'
                          : 'Unirme'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedConvId(featuredMatch.id)}
                      className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#1E2B45] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Ver detalles
                    </button>
                  </div>
                </div>
                <div
                  className="w-[44%] -ml-4 relative"
                  style={{ clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)' }}
                >
                  <CourtScene variant="night-club" clubLabel="TENIS CLUB PANAMÁ" />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-base font-extrabold text-[#1E2B45]">Más partidos disponibles</h3>
              {groupedByDate.length === 0 ? (
                <div className="rounded-2xl bg-white p-6 text-center text-xs text-slate-500">
                  No hay otros partidos abiertos con estos filtros.
                </div>
              ) : (
                groupedByDate.map(([fecha, matches]) => {
                  const dLabel = DEMO_DATES.find((d) => d.iso === fecha)?.label || fecha;
                  return (
                    <div key={fecha} className="space-y-2">
                      <p className="text-[11px] font-extrabold tracking-wider text-slate-500 uppercase">
                        {dLabel}
                      </p>
                      {matches.map((m) => {
                        const sede = state.sedes.find((s) => s.id === m.sedeId);
                        const joined = m.jugadoresIds.includes(currentUser.id);
                        const full = m.jugadoresIds.length >= m.cupoTotal;
                        return (
                          <div
                            key={m.id}
                            className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100 flex items-center justify-between gap-2"
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedConvId(m.id)}
                              className="text-left min-w-0 flex-1 cursor-pointer"
                            >
                              <h4 className="text-xs font-extrabold text-[#1E2B45] truncate">
                                {m.titulo}
                              </h4>
                              <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-2 tabular-nums">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatHour12(m.horaInicio)}
                                </span>
                                <span>·</span>
                                <span>
                                  {m.jugadoresIds.length}/{m.cupoTotal} jugadores
                                </span>
                              </p>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {sede?.nombre} · Aporte B/. {m.aportePorJugador.toFixed(2)}
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={() => joinConvocatoria(m.id)}
                              className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer ${
                                joined
                                  ? 'bg-[#273758] text-white'
                                  : full
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-[#B6E22E] text-[#16223B]'
                              }`}
                            >
                              {joined ? 'Inscrito' : full ? 'Espera' : 'Unirme'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowActionChoice(true)}
              className="w-full rounded-2xl bg-[#B6E22E] hover:bg-[#ACD638] py-3.5 text-base font-extrabold text-[#16223B] flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear partido</span>
            </button>
          </>
        )}
      </div>

      {/* Choice Modal: Tengo cancha reservada vs Planificar */}
      {showActionChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 space-y-3">
            <h3 className="text-base font-extrabold text-[#1E2B45]">¿Cómo quieres organizar el partido?</h3>
            <button
              type="button"
              onClick={() => {
                setShowActionChoice(false);
                setShowCreateConvModal(true);
              }}
              className="w-full rounded-2xl border-2 border-[#ACD638] bg-[#F7FCEB] p-3.5 text-left cursor-pointer"
            >
              <span className="block text-sm font-extrabold text-[#1E2B45]">Tengo cancha reservada</span>
              <span className="block text-xs text-slate-600 mt-0.5">
                Selecciona una reserva confirmada y abre cupos para jugadores.
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowActionChoice(false);
                setShowCreatePlanModal(true);
              }}
              className="w-full rounded-2xl border border-slate-200 p-3.5 text-left cursor-pointer"
            >
              <span className="block text-sm font-extrabold text-[#1E2B45]">Planificar un partido</span>
              <span className="block text-xs text-slate-600 mt-0.5">
                Propón fechas y vota en grupo antes de reservar ni pagar.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowActionChoice(false)}
              className="w-full py-2 text-xs font-bold text-slate-500 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Convocatoria Detail Modal */}
      {selectedConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-[400px] max-h-[85dvh] overflow-y-auto rounded-3xl bg-white p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-[#5E8210]">{selectedConv.estado}</span>
                <h3 className="text-base font-extrabold text-[#1E2B45]">{selectedConv.titulo}</h3>
                <p className="text-xs text-slate-500">
                  {state.sedes.find((s) => s.id === selectedConv.sedeId)?.nombre} ·{' '}
                  {formatHour12(selectedConv.horaInicio)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedConvId(null)}
                className="text-xs font-bold text-slate-500 px-2 py-1"
              >
                Cerrar
              </button>
            </div>

            <p className="text-xs text-slate-600">{selectedConv.descripcion}</p>

            <div className="rounded-xl bg-[#F4F6F9] p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Cupos confirmados</span>
                <span className="font-bold text-[#1E2B45]">
                  {selectedConv.jugadoresIds.length}/{selectedConv.cupoTotal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Aporte compartido</span>
                <span className="font-bold text-[#1E2B45] tabular-nums">
                  B/. {selectedConv.aportePorJugador.toFixed(2)} (sin doble cobro)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lista de espera</span>
                <span className="font-bold text-[#1E2B45]">{selectedConv.listaEsperaIds.length}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-extrabold text-[#1E2B45] mb-1.5">Jugadores confirmados</h4>
              <div className="flex flex-wrap gap-2">
                {selectedConv.jugadoresIds.map((uid) => {
                  const u = state.usuarios.find((x) => x.id === uid);
                  return (
                    <span
                      key={uid}
                      className="rounded-xl bg-[#F4F6F9] px-2.5 py-1 text-xs font-bold text-[#1E2B45]"
                    >
                      {u?.nombre || 'Jugador'}
                    </span>
                  );
                })}
              </div>
            </div>

            {selectedConv.organizadorId === currentUser.id &&
              selectedConv.pendientesAprobacionIds.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-extrabold text-[#1E2B45]">Solicitudes pendientes</h4>
                  {selectedConv.pendientesAprobacionIds.map((uid) => {
                    const u = state.usuarios.find((x) => x.id === uid);
                    return (
                      <div key={uid} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl">
                        <span>{u?.nombre}</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => approvePendingPlayer(selectedConv.id, uid, true)}
                            className="rounded-lg bg-[#ACD638] px-2 py-1 font-bold text-[#16223B]"
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            onClick={() => approvePendingPlayer(selectedConv.id, uid, false)}
                            className="rounded-lg bg-slate-200 px-2 py-1 font-bold"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            {/* Chat inside Convocatoria */}
            {!currentUser.esMenor && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <h4 className="text-xs font-extrabold text-[#1E2B45]">Chat del partido</h4>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {selectedConv.mensajes.map((m) => (
                    <div key={m.id} className="text-xs bg-[#F4F6F9] rounded-xl px-2.5 py-1.5">
                      <strong>{m.autorNombre}:</strong> {m.texto}
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendConvocatoriaMessage(selectedConv.id, chatText);
                    setChatText('');
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="Mensaje al grupo..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                  />
                  <button type="submit" className="rounded-xl bg-[#273758] px-3 text-white text-xs font-bold">
                    Enviar
                  </button>
                </form>
              </div>
            )}

            <div className="flex gap-2">
              {selectedConv.jugadoresIds.includes(currentUser.id) ? (
                <button
                  type="button"
                  onClick={() => leaveConvocatoria(selectedConv.id)}
                  className="flex-1 rounded-xl border border-rose-200 py-2.5 text-xs font-bold text-rose-700"
                >
                  Abandonar partido
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => joinConvocatoria(selectedConv.id)}
                  className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B]"
                >
                  {selectedConv.estado === 'Completa' ? 'Entrar en lista de espera' : 'Unirme ahora'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Convocatoria ("Tengo cancha reservada") */}
      {showCreateConvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <form
            onSubmit={handleSubmitConv}
            className="w-full max-w-[390px] rounded-3xl bg-white p-5 space-y-3"
          >
            <h3 className="text-base font-extrabold text-[#1E2B45]">
              Publicar convocatoria (Tengo cancha reservada)
            </h3>
            {myConfirmedReservas.length === 0 ? (
              <p className="text-xs text-rose-600">
                No tienes reservas confirmadas vigentes. Reserva una cancha primero.
              </p>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#1E2B45] mb-1">
                    Reserva confirmada
                  </label>
                  <select
                    value={convReservaId}
                    onChange={(e) => setConvReservaId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    {myConfirmedReservas.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.codigo} · {r.fecha} {formatHour12(r.horaInicio)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E2B45] mb-1">Título</label>
                  <input
                    type="text"
                    value={convTitulo}
                    onChange={(e) => setConvTitulo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#1E2B45] mb-1">Modalidad</label>
                    <select
                      value={convModalidad}
                      onChange={(e) => {
                        const mod = e.target.value as Modality;
                        setConvModalidad(mod);
                        setConvCupo(mod === 'Individual' ? 2 : 4);
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    >
                      <option value="Dobles">Dobles (4)</option>
                      <option value="Dobles mixto">Dobles mixto (4)</option>
                      <option value="Individual">Individual (2)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1E2B45] mb-1">Nivel</label>
                    <select
                      value={convNivel}
                      onChange={(e) => setConvNivel(e.target.value as SkillLevel)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    >
                      <option value="Principiante">Principiante</option>
                      <option value="Intermedio">Intermedio</option>
                      <option value="Avanzado">Avanzado</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#1E2B45] mb-1">
                      Aporte/jugador (B/.)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={convAporte}
                      onChange={(e) => setConvAporte(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs pt-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={convAuto}
                      onChange={(e) => setConvAuto(e.target.checked)}
                    />
                    Ingreso automático
                  </label>
                </div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateConvModal(false);
                  onClearPreselectedReserva();
                }}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700"
              >
                Cancelar
              </button>
              {myConfirmedReservas.length > 0 && (
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B]"
                >
                  Publicar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Modal: Create Planificacion ("Planificar un partido") */}
      {showCreatePlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <form
            onSubmit={handleSubmitPlan}
            className="w-full max-w-[390px] rounded-3xl bg-white p-5 space-y-3"
          >
            <h3 className="text-base font-extrabold text-[#1E2B45]">
              Planificar partido sin reserva previa
            </h3>
            <p className="text-xs text-slate-500">
              No se cobra ni se bloquea cancha hasta alcanzar quórum.
            </p>
            <div>
              <label className="block text-xs font-bold text-[#1E2B45] mb-1">Nombre del grupo</label>
              <input
                type="text"
                value={planTitulo}
                onChange={(e) => setPlanTitulo(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#1E2B45] mb-1">Modalidad</label>
                <select
                  value={planModalidad}
                  onChange={(e) => {
                    const m = e.target.value as Modality;
                    setPlanModalidad(m);
                    setPlanQuorum(m === 'Individual' ? 2 : 4);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  <option value="Dobles">Dobles (Quórum 4)</option>
                  <option value="Individual">Individual (Quórum 2)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E2B45] mb-1">Sede propuesta</label>
                <select
                  value={planSedeId}
                  onChange={(e) => setPlanSedeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  {state.sedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#1E2B45] mb-1">Fecha propuesta</label>
                <select
                  value={planFecha}
                  onChange={(e) => setPlanFecha(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  {DEMO_DATES.map((d) => (
                    <option key={d.iso} value={d.iso}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E2B45] mb-1">Hora propuesta</label>
                <select
                  value={planHora}
                  onChange={(e) => setPlanHora(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {formatHour12(t)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreatePlanModal(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B]"
              >
                Crear votación
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Convert Planning to Real Booking Modal */}
      {showConvertBookingModal && activePlan && winningOption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 space-y-3">
            <h3 className="text-base font-extrabold text-[#1E2B45]">
              Reservar opción ganadora
            </h3>
            <p className="text-xs text-slate-500">
              {DEMO_DATES.find((d) => d.iso === winningOption.fecha)?.label} ·{' '}
              {formatHour12(winningOption.horaInicio)}
            </p>
            <div className="space-y-2">
              <span className="block text-xs font-bold text-[#1E2B45]">
                Canchas disponibles en tiempo real
              </span>
              {availableCanchasForWin.map(({ cancha, available, reason }) => (
                <button
                  key={cancha.id}
                  type="button"
                  disabled={!available}
                  onClick={() => setConvertCanchaId(cancha.id)}
                  className={`w-full rounded-xl p-2.5 text-left text-xs border flex justify-between items-center ${
                    !available
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : convertCanchaId === cancha.id
                        ? 'border-[#ACD638] bg-[#F7FCEB] font-bold'
                        : 'border-slate-200'
                  }`}
                >
                  <span>
                    {cancha.nombre} ({cancha.superficie})
                  </span>
                  <span>
                    {available
                      ? cancha.precioHora === 0
                        ? 'Gratuita'
                        : `B/. ${cancha.precioHora}/h`
                      : reason}
                  </span>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E2B45] mb-1">Método de pago simulado</label>
              <select
                value={convertMetodo}
                onChange={(e) => setConvertMetodo(e.target.value as PaymentMethod)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                <option value="Yappy">Yappy</option>
                <option value="Tarjeta">Tarjeta de crédito/débito</option>
              </select>
            </div>
            {convertError && <p className="text-xs font-semibold text-rose-600">{convertError}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConvertBookingModal(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!convertCanchaId}
                onClick={() => {
                  const res = convertPlanificacionToBooking(
                    activePlan.id,
                    winningOption.id,
                    convertCanchaId,
                    convertMetodo
                  );
                  if (!res.ok) {
                    setConvertError(res.error || 'Horario ya ocupado');
                  } else {
                    setShowConvertBookingModal(false);
                  }
                }}
                className="flex-1 rounded-xl bg-[#B6E22E] disabled:bg-slate-200 py-2.5 text-xs font-extrabold text-[#16223B]"
              >
                Confirmar reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
