import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createInitialState } from '../data/seedData';
import type {
  AdminSubRole,
  AppState,
  ClaseProgramada,
  Convocatoria,
  IncidenciaMantenimiento,
  Modality,
  PaymentMethod,
  RankingCategory,
  Reserva,
  Role,
  SkillLevel,
  Usuario,
} from '../types/tennis';
import {
  applyConfirmedMatchResult,
  calculateBookingTotals,
  formatHour12,
  isInstructorAvailable,
  isSlotAvailable,
  joinConvocatoriaLogic,
  votePlanificacionLogic,
} from '../utils/tennisLogic';

const STORAGE_KEY = 'tenis_club_panama_state_v2';

export interface ToastMessage {
  id: string;
  text: string;
  tone: 'success' | 'error' | 'info';
}

interface CreateBookingInput {
  sedeId: string;
  canchaId: string;
  fecha: string;
  horaInicio: string;
  duracionMin: 60 | 90 | 120;
  modalidad: Modality;
  participantes: string[];
  metodoPago: PaymentMethod;
  simulateFailure?: boolean;
  tipoOrigen?: 'Jugador' | 'Manual Admin' | 'Planificación';
  usuarioIdOverride?: string;
}

interface AppContextValue {
  state: AppState;
  currentUser: Usuario;
  activeSede: AppState['sedes'][number];
  toast: ToastMessage | null;
  showToast: (text: string, tone?: ToastMessage['tone']) => void;
  loginDemo: (emailOrRole: string | Role, authed?: boolean) => void;
  registerDemoPlayer: (nombre: string, email: string, provincia: string, nivel: SkillLevel) => void;
  logout: () => void;
  switchRole: (rol: Role, adminSubRol?: AdminSubRole) => void;
  switchSede: (sedeId: string) => void;
  toggleFavoriteSede: (sedeId: string) => void;
  updateUserPreferences: (patch: Partial<Usuario>) => void;
  resetDemoData: () => void;
  createReservation: (input: CreateBookingInput) => { ok: boolean; reserva?: Reserva; error?: string };
  cancelReservation: (reservaId: string, byAdmin?: boolean) => void;
  rescheduleReservation: (reservaId: string, nuevaFecha: string, nuevaHora: string) => { ok: boolean; error?: string };
  validateCheckInCode: (codigo: string) => { ok: boolean; message: string };
  toggleCourtStatus: (canchaId: string) => void;
  createConvocatoria: (input: {
    reservaId: string;
    titulo: string;
    nivel: SkillLevel;
    modalidad: Modality;
    cupoTotal: number;
    aportePorJugador: number;
    descripcion: string;
    visibilidad: 'Pública' | 'Privada';
    aprobacionAutomatica: boolean;
  }) => { ok: boolean; convocatoria?: Convocatoria; error?: string };
  joinConvocatoria: (convId: string) => { ok: boolean; message: string };
  approvePendingPlayer: (convId: string, userId: string, approve: boolean) => void;
  leaveConvocatoria: (convId: string) => void;
  sendConvocatoriaMessage: (convId: string, texto: string) => void;
  createPlanificacion: (input: {
    titulo: string;
    modalidad: Modality;
    nivel: SkillLevel;
    tipo: 'Amistoso' | 'Competitivo';
    quorumMinimo: number;
    opciones: { fecha: string; horaInicio: string; horaFin: string; sedeId: string }[];
  }) => void;
  votePlanificacion: (planId: string, opcionId: string) => void;
  sendPlanificacionMessage: (planId: string, texto: string) => void;
  convertPlanificacionToBooking: (
    planId: string,
    opcionId: string,
    canchaId: string,
    metodoPago: PaymentMethod
  ) => { ok: boolean; error?: string };
  bookClass: (input: {
    instructorId: string;
    sedeId: string;
    canchaId: string;
    tipo: ClaseProgramada['tipo'];
    fecha: string;
    horaInicio: string;
    duracionMin: 60 | 90;
    metodoPago: PaymentMethod;
  }) => { ok: boolean; error?: string };
  enrollInExistingClass: (claseId: string) => { ok: boolean; message: string };
  toggleClassAttendance: (claseId: string, alumnoId: string) => void;
  createInstructorClass: (input: {
    sedeId: string;
    canchaId: string;
    titulo: string;
    tipo: ClaseProgramada['tipo'];
    fecha: string;
    horaInicio: string;
    duracionMin: 60 | 90;
    precioPorCupo: number;
    cupoMax: number;
  }) => { ok: boolean; error?: string };
  updateInstructorProfile: (instructorId: string, patch: { precioBase?: number; especialidades?: string[]; horariosDisponibles?: string[] }) => void;
  reportMatchResult: (input: {
    sedeId: string;
    modalidad: 'Individual' | 'Dobles';
    tipo: 'Amistoso' | 'Competitivo';
    categoria: RankingCategory;
    rivalId: string;
    marcadorSets: string;
    ganadorEquipo: 'A' | 'B';
  }) => void;
  confirmMatchResult: (matchId: string) => void;
  disputeMatchResult: (matchId: string, motivo: string) => void;
  resolveDisputedMatch: (matchId: string, ganadorEquipo: 'A' | 'B') => void;
  reportMaintenance: (input: { sedeId: string; canchaId: string; titulo: string; detalle: string; prioridad: IncidenciaMantenimiento['prioridad']; bloquearCancha: boolean }) => void;
  resolveMaintenance: (incId: string) => void;
  suspendByRain: (sedeId: string, fecha: string, reason: string) => number;
  sendAdminNotification: (titulo: string, mensaje: string) => void;
  markAllNotificationsRead: () => void;
  toggleOrganizationStatus: (orgId: string) => void;
  verifyProUser: (userId: string) => void;
  updateServiceFee: (pct: number) => void;
  togglePatrocinio: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadPersistedState(): AppState {
  const initial = createInitialState();
  const autostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && Array.isArray(parsed.sedes) && Array.isArray(parsed.usuarios)) {
        return autostart ? { ...parsed, isAuthenticated: true } : parsed;
      }
    }
  } catch {
    // Fallback to initial state
  }
  return autostart ? { ...initial, isAuthenticated: true } : initial;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(loadPersistedState);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors in private mode
    }
  }, [state]);

  const showToast = useCallback((text: string, tone: ToastMessage['tone'] = 'success') => {
    const id = String(Date.now());
    setToast({ id, text, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3400);
  }, []);

  const currentUser = useMemo(
    () => state.usuarios.find((u) => u.id === state.currentUserId) || state.usuarios[0],
    [state.usuarios, state.currentUserId]
  );

  const activeSede = useMemo(
    () => state.sedes.find((s) => s.id === state.activeSedeId) || state.sedes[0],
    [state.sedes, state.activeSedeId]
  );

  const loginDemo = useCallback((emailOrRole: string | Role) => {
    setState((prev) => {
      let targetUser = prev.usuarios.find((u) => u.rol === emailOrRole);
      if (!targetUser && typeof emailOrRole === 'string') {
        targetUser = prev.usuarios.find(
          (u) => u.email.toLowerCase() === emailOrRole.toLowerCase()
        );
      }
      if (!targetUser) {
        targetUser = prev.usuarios.find((u) => u.rol === 'jugador') || prev.usuarios[0];
      }
      return {
        ...prev,
        currentUserId: targetUser.id,
        isAuthenticated: true,
      };
    });
  }, []);

  const registerDemoPlayer = useCallback(
    (nombre: string, email: string, provincia: string, nivel: SkillLevel) => {
      const id = `u_${Date.now()}`;
      const newUser: Usuario = {
        id,
        nombre: nombre.trim(),
        email: email.trim(),
        telefono: '+507 6000-9999',
        rol: 'jugador',
        provincia,
        distrito: provincia === 'Panamá' ? 'Ciudad de Panamá' : 'Centro',
        categoria: 'Amateur',
        nivel,
        elo: { Junior: 1500, Amateur: 1500, Profesional: 1500 },
        ganados: 0,
        perdidos: 0,
        asistenciaScore: 100,
        favoritosSedes: ['sede_tcp'],
        avatarSeed: nombre.slice(0, 4).toLowerCase(),
        pushHabilitado: true,
        recordatoriosFrecuencia: 'semanal',
      };
      setState((prev) => ({
        ...prev,
        usuarios: [...prev.usuarios, newUser],
        currentUserId: id,
        isAuthenticated: true,
      }));
      showToast(`Bienvenido a Tenis Club Panamá, ${newUser.nombre}`);
    },
    [showToast]
  );

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, isAuthenticated: false }));
  }, []);

  const switchRole = useCallback(
    (rol: Role, adminSubRol?: AdminSubRole) => {
      setState((prev) => {
        const match = prev.usuarios.find((u) => u.rol === rol);
        if (!match) return prev;
        const updatedUsuarios =
          rol === 'admin' && adminSubRol
            ? prev.usuarios.map((u) => (u.id === match.id ? { ...u, adminSubRol } : u))
            : prev.usuarios;
        return {
          ...prev,
          usuarios: updatedUsuarios,
          currentUserId: match.id,
          isAuthenticated: true,
        };
      });
      const label =
        rol === 'jugador'
          ? 'Jugador'
          : rol === 'admin'
            ? `Administrador${adminSubRol ? ` (${adminSubRol})` : ''}`
            : rol === 'instructor'
              ? 'Instructor'
              : 'Superadministrador';
      showToast(`Perfil activo: ${label}`, 'info');
    },
    [showToast]
  );

  const switchSede = useCallback((sedeId: string) => {
    setState((prev) => ({ ...prev, activeSedeId: sedeId }));
  }, []);

  const toggleFavoriteSede = useCallback((sedeId: string) => {
    setState((prev) => ({
      ...prev,
      usuarios: prev.usuarios.map((u) => {
        if (u.id !== prev.currentUserId) return u;
        const exists = u.favoritosSedes.includes(sedeId);
        return {
          ...u,
          favoritosSedes: exists
            ? u.favoritosSedes.filter((id) => id !== sedeId)
            : [...u.favoritosSedes, sedeId],
        };
      }),
    }));
  }, []);

  const updateUserPreferences = useCallback(
    (patch: Partial<Usuario>) => {
      setState((prev) => ({
        ...prev,
        usuarios: prev.usuarios.map((u) => (u.id === prev.currentUserId ? { ...u, ...patch } : u)),
      }));
      showToast('Preferencias actualizadas');
    },
    [showToast]
  );

  const resetDemoData = useCallback(() => {
    const fresh = createInitialState();
    fresh.isAuthenticated = true;
    setState(fresh);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignore
    }
    showToast('Datos de demostración reiniciados', 'info');
  }, [showToast]);

  const createReservation = useCallback(
    (input: CreateBookingInput): { ok: boolean; reserva?: Reserva; error?: string } => {
      const cancha = state.canchas.find((c) => c.id === input.canchaId);
      if (!cancha) return { ok: false, error: 'Cancha no encontrada' };

      const avail = isSlotAvailable(
        state,
        input.canchaId,
        input.fecha,
        input.horaInicio,
        input.duracionMin
      );
      if (!avail.available) {
        return { ok: false, error: avail.reason || 'Horario no disponible' };
      }

      const totals = calculateBookingTotals(
        cancha,
        input.horaInicio,
        input.duracionMin,
        state.serviceFeePct
      );
      const userId = input.usuarioIdOverride || state.currentUserId;
      const code = `TCP-${Math.floor(2500 + Math.random() * 7000)}`;

      if (input.simulateFailure) {
        const failedRes: Reserva = {
          id: `res_${Date.now()}`,
          codigo: code,
          sedeId: input.sedeId,
          canchaId: input.canchaId,
          usuarioId: userId,
          fecha: input.fecha,
          horaInicio: input.horaInicio,
          duracionMin: input.duracionMin,
          modalidad: input.modalidad,
          participantes: input.participantes,
          estado: 'Cancelada',
          asistenciaValidada: false,
          precioCancha: totals.precioCancha,
          cargoServicio: totals.cargoServicio,
          totalPagado: totals.totalPagado,
          metodoPago: input.metodoPago,
          pagoEstado: 'Rechazado',
          creadaEn: new Date().toISOString(),
          tipoOrigen: input.tipoOrigen || 'Jugador',
          notas: 'Pago simulado rechazado; el bloqueo temporal fue liberado.',
        };
        setState((prev) => ({
          ...prev,
          reservas: [failedRes, ...prev.reservas],
          notificaciones: [
            {
              id: `not_${Date.now()}`,
              usuarioId: userId,
              titulo: `Pago rechazado · ${code}`,
              mensaje: 'Tu pago simulado fue rechazado y el turno volvió a quedar disponible.',
              categoria: 'Reserva',
              leida: false,
              fechaTexto: 'Ahora',
            },
            ...prev.notificaciones,
          ],
        }));
        return { ok: false, error: 'Pago simulado rechazado. El horario fue liberado.' };
      }

      const newRes: Reserva = {
        id: `res_${Date.now()}`,
        codigo: code,
        sedeId: input.sedeId,
        canchaId: input.canchaId,
        usuarioId: userId,
        fecha: input.fecha,
        horaInicio: input.horaInicio,
        duracionMin: input.duracionMin,
        modalidad: input.modalidad,
        participantes: input.participantes.length > 0 ? input.participantes : [currentUser.nombre],
        estado: 'Confirmada',
        asistenciaValidada: false,
        precioCancha: totals.precioCancha,
        cargoServicio: totals.cargoServicio,
        totalPagado: totals.totalPagado,
        metodoPago: totals.esGratuita ? 'Gratuita' : input.metodoPago,
        pagoEstado: 'Aprobado',
        creadaEn: new Date().toISOString(),
        tipoOrigen: input.tipoOrigen || 'Jugador',
      };

      const sede = state.sedes.find((s) => s.id === input.sedeId);

      setState((prev) => ({
        ...prev,
        reservas: [newRes, ...prev.reservas],
        notificaciones: [
          {
            id: `not_${Date.now()}`,
            usuarioId: userId,
            titulo: `Reserva confirmada · ${code}`,
            mensaje: `${cancha.nombre} en ${sede?.nombre || 'Sede'} el ${input.fecha} a las ${formatHour12(input.horaInicio)}.`,
            categoria: 'Reserva',
            leida: false,
            fechaTexto: 'Ahora',
          },
          ...prev.notificaciones,
        ],
        auditoria: [
          {
            id: `aud_${Date.now()}`,
            fecha: '2026-11-26 19:20',
            actor: currentUser.nombre,
            rol: currentUser.rol,
            accion: 'Reserva confirmada',
            detalle: `${code} · ${cancha.nombre} (${totals.esGratuita ? 'Gratuita' : `B/. ${totals.totalPagado.toFixed(2)}`})`,
            sedeId: input.sedeId,
          },
          ...prev.auditoria,
        ],
      }));
      return { ok: true, reserva: newRes };
    },
    [state, currentUser]
  );

  const cancelReservation = useCallback(
    (reservaId: string, byAdmin = false) => {
      setState((prev) => {
        const target = prev.reservas.find((r) => r.id === reservaId);
        if (!target) return prev;
        const refunded = target.totalPagado > 0 ? 'Devuelto' : target.pagoEstado;
        return {
          ...prev,
          reservas: prev.reservas.map((r) =>
            r.id === reservaId
              ? {
                  ...r,
                  estado: 'Cancelada',
                  pagoEstado: refunded,
                  notas: byAdmin ? 'Cancelada por administración (reembolso simulado).' : 'Cancelada según política.',
                }
              : r
          ),
          notificaciones: [
            {
              id: `not_${Date.now()}`,
              usuarioId: target.usuarioId,
              titulo: `Reserva cancelada · ${target.codigo}`,
              mensaje:
                target.totalPagado > 0
                  ? `Se liberó el turno y se procesó devolución simulada de B/. ${target.totalPagado.toFixed(2)}.`
                  : 'Se liberó el turno correctamente.',
              categoria: 'Reserva',
              leida: false,
              fechaTexto: 'Ahora',
            },
            ...prev.notificaciones,
          ],
          auditoria: [
            {
              id: `aud_${Date.now()}`,
              fecha: '2026-11-26 19:25',
              actor: currentUser.nombre,
              rol: currentUser.rol,
              accion: 'Cancelación de reserva',
              detalle: `Reserva ${target.codigo} cancelada`,
              sedeId: target.sedeId,
            },
            ...prev.auditoria,
          ],
        };
      });
      showToast('Reserva cancelada y horario liberado');
    },
    [currentUser, showToast]
  );

  const rescheduleReservation = useCallback(
    (reservaId: string, nuevaFecha: string, nuevaHora: string): { ok: boolean; error?: string } => {
      const target = state.reservas.find((r) => r.id === reservaId);
      if (!target) return { ok: false, error: 'Reserva no encontrada' };

      const avail = isSlotAvailable(
        state,
        target.canchaId,
        nuevaFecha,
        nuevaHora,
        target.duracionMin,
        target.id
      );
      if (!avail.available) {
        return { ok: false, error: avail.reason || 'Nuevo horario no disponible' };
      }

      setState((prev) => ({
        ...prev,
        reservas: prev.reservas.map((r) =>
          r.id === reservaId ? { ...r, fecha: nuevaFecha, horaInicio: nuevaHora } : r
        ),
        notificaciones: [
          {
            id: `not_${Date.now()}`,
            usuarioId: target.usuarioId,
            titulo: `Reserva reprogramada · ${target.codigo}`,
            mensaje: `Nuevo horario: ${nuevaFecha} a las ${formatHour12(nuevaHora)}.`,
            categoria: 'Reserva',
            leida: false,
            fechaTexto: 'Ahora',
          },
          ...prev.notificaciones,
        ],
        auditoria: [
          {
            id: `aud_${Date.now()}`,
            fecha: '2026-11-26 19:30',
            actor: currentUser.nombre,
            rol: currentUser.rol,
            accion: 'Reprogramación de reserva',
            detalle: `${target.codigo} movida a ${nuevaFecha} ${nuevaHora}`,
            sedeId: target.sedeId,
          },
          ...prev.auditoria,
        ],
      }));
      showToast('Reserva reprogramada correctamente');
      return { ok: true };
    },
    [state, currentUser, showToast]
  );

  const validateCheckInCode = useCallback(
    (codigo: string): { ok: boolean; message: string } => {
      const clean = codigo.trim().toUpperCase();
      const target = state.reservas.find((r) => r.codigo.toUpperCase() === clean);
      if (!target) {
        return { ok: false, message: `Código ${clean} no encontrado en la agenda.` };
      }
      if (target.estado === 'Cancelada') {
        return { ok: false, message: `La reserva ${clean} está cancelada.` };
      }
      setState((prev) => ({
        ...prev,
        reservas: prev.reservas.map((r) =>
          r.id === target.id ? { ...r, asistenciaValidada: true, estado: 'En curso' } : r
        ),
      }));
      showToast(`Check-in validado para ${clean}`);
      return { ok: true, message: `Asistencia validada: ${target.participantes.join(', ')}` };
    },
    [state.reservas, showToast]
  );

  const toggleCourtStatus = useCallback(
    (canchaId: string) => {
      setState((prev) => {
        const cancha = prev.canchas.find((c) => c.id === canchaId);
        if (!cancha) return prev;
        const nextEstado = cancha.estado === 'Disponible' ? 'Bloqueada' : 'Disponible';
        return {
          ...prev,
          canchas: prev.canchas.map((c) =>
            c.id === canchaId
              ? {
                  ...c,
                  estado: nextEstado,
                  motivoBloqueo: nextEstado === 'Bloqueada' ? 'Bloqueo administrativo' : undefined,
                }
              : c
          ),
          auditoria: [
            {
              id: `aud_${Date.now()}`,
              fecha: '2026-11-26 19:32',
              actor: currentUser.nombre,
              rol: currentUser.rol,
              accion: `Cancha ${nextEstado}`,
              detalle: `${cancha.nombre} marcada como ${nextEstado}`,
              sedeId: cancha.sedeId,
            },
            ...prev.auditoria,
          ],
        };
      });
      showToast('Estado de cancha actualizado');
    },
    [currentUser, showToast]
  );

  const createConvocatoria = useCallback(
    (input: {
      reservaId: string;
      titulo: string;
      nivel: SkillLevel;
      modalidad: Modality;
      cupoTotal: number;
      aportePorJugador: number;
      descripcion: string;
      visibilidad: 'Pública' | 'Privada';
      aprobacionAutomatica: boolean;
    }) => {
      const reserva = state.reservas.find((r) => r.id === input.reservaId);
      if (!reserva || reserva.estado === 'Cancelada') {
        return { ok: false, error: 'Selecciona una reserva confirmada válida' };
      }
      const conv: Convocatoria = {
        id: `conv_${Date.now()}`,
        reservaId: reserva.id,
        sedeId: reserva.sedeId,
        canchaId: reserva.canchaId,
        organizadorId: state.currentUserId,
        titulo: input.titulo,
        modalidad: input.modalidad,
        nivel: input.nivel,
        fecha: reserva.fecha,
        horaInicio: reserva.horaInicio,
        duracionMin: reserva.duracionMin,
        cupoTotal: input.cupoTotal,
        jugadoresIds: [state.currentUserId],
        listaEsperaIds: [],
        pendientesAprobacionIds: [],
        aprobacionAutomatica: input.aprobacionAutomatica,
        visibilidad: input.visibilidad,
        aportePorJugador: input.aportePorJugador,
        pagosCompartidosIds: [state.currentUserId],
        descripcion: input.descripcion,
        estado: 'Abierta',
        mensajes: [],
      };
      setState((prev) => ({
        ...prev,
        convocatorias: [conv, ...prev.convocatorias],
      }));
      showToast('Convocatoria publicada en Comunidad');
      return { ok: true, convocatoria: conv };
    },
    [state.reservas, state.currentUserId, showToast]
  );

  const joinConvocatoria = useCallback(
    (convId: string): { ok: boolean; message: string } => {
      const conv = state.convocatorias.find((c) => c.id === convId);
      if (!conv) return { ok: false, message: 'Convocatoria no encontrada' };

      const res = joinConvocatoriaLogic(conv, state.currentUserId);
      if (res.outcome === 'already') {
        return { ok: false, message: 'Ya participas o estás en lista de espera en este partido.' };
      }
      if (res.outcome === 'closed') {
        return { ok: false, message: 'Esta convocatoria ya fue cerrada.' };
      }

      setState((prev) => ({
        ...prev,
        convocatorias: prev.convocatorias.map((c) => (c.id === convId ? res.updated : c)),
        notificaciones: [
          {
            id: `not_${Date.now()}`,
            usuarioId: state.currentUserId,
            titulo:
              res.outcome === 'waitlist'
                ? 'Añadido a lista de espera'
                : res.outcome === 'pending'
                  ? 'Solicitud enviada'
                  : 'Te uniste al partido',
            mensaje: conv.titulo,
            categoria: 'Comunidad',
            leida: false,
            fechaTexto: 'Ahora',
          },
          ...prev.notificaciones,
        ],
      }));

      const msg =
        res.outcome === 'waitlist'
          ? 'Cupo completo: entraste en lista de espera'
          : res.outcome === 'pending'
            ? 'Solicitud enviada al organizador'
            : '¡Te uniste al partido!';
      showToast(msg, res.outcome === 'waitlist' ? 'info' : 'success');
      return { ok: true, message: msg };
    },
    [state.convocatorias, state.currentUserId, showToast]
  );

  const approvePendingPlayer = useCallback(
    (convId: string, userId: string, approve: boolean) => {
      setState((prev) => ({
        ...prev,
        convocatorias: prev.convocatorias.map((c) => {
          if (c.id !== convId) return c;
          const pending = c.pendientesAprobacionIds.filter((id) => id !== userId);
          if (!approve) return { ...c, pendientesAprobacionIds: pending };
          const nextJ = [...c.jugadoresIds, userId];
          return {
            ...c,
            pendientesAprobacionIds: pending,
            jugadoresIds: nextJ,
            estado: nextJ.length >= c.cupoTotal ? 'Completa' : 'Abierta',
          };
        }),
      }));
      showToast(approve ? 'Jugador aprobado' : 'Solicitud rechazada');
    },
    [showToast]
  );

  const leaveConvocatoria = useCallback(
    (convId: string) => {
      setState((prev) => ({
        ...prev,
        convocatorias: prev.convocatorias.map((c) => {
          if (c.id !== convId) return c;
          const nextJ = c.jugadoresIds.filter((id) => id !== prev.currentUserId);
          const promoted = c.listaEsperaIds[0];
          const nextWait = promoted ? c.listaEsperaIds.slice(1) : c.listaEsperaIds;
          const finalJ = promoted ? [...nextJ, promoted] : nextJ;
          return {
            ...c,
            jugadoresIds: finalJ,
            listaEsperaIds: nextWait,
            estado: finalJ.length >= c.cupoTotal ? 'Completa' : 'Abierta',
          };
        }),
      }));
      showToast('Has salido de la convocatoria (la reserva mantiene su política)', 'info');
    },
    [showToast]
  );

  const sendConvocatoriaMessage = useCallback(
    (convId: string, texto: string) => {
      if (!texto.trim()) return;
      if (currentUser.esMenor) {
        showToast('Cuentas Junior tienen chat abierto deshabilitado por seguridad', 'error');
        return;
      }
      setState((prev) => ({
        ...prev,
        convocatorias: prev.convocatorias.map((c) =>
          c.id === convId
            ? {
                ...c,
                mensajes: [
                  ...c.mensajes,
                  {
                    id: `cm_${Date.now()}`,
                    autorId: currentUser.id,
                    autorNombre: currentUser.nombre.split(' ')[0],
                    texto: texto.trim(),
                    hora: 'Ahora',
                  },
                ],
              }
            : c
        ),
      }));
    },
    [currentUser, showToast]
  );

  const createPlanificacion = useCallback(
    (input: {
      titulo: string;
      modalidad: Modality;
      nivel: SkillLevel;
      tipo: 'Amistoso' | 'Competitivo';
      quorumMinimo: number;
      opciones: { fecha: string; horaInicio: string; horaFin: string; sedeId: string }[];
    }) => {
      const id = `plan_${Date.now()}`;
      setState((prev) => ({
        ...prev,
        planificaciones: [
          {
            id,
            organizadorId: prev.currentUserId,
            titulo: input.titulo,
            subtitulo: 'En planificación · sin reserva',
            modalidad: input.modalidad,
            nivel: input.nivel,
            tipo: input.tipo,
            quorumMinimo: input.quorumMinimo,
            jugadoresIds: [prev.currentUserId],
            opciones: input.opciones.map((o, idx) => ({
              id: `op_${Date.now()}_${idx}`,
              ...o,
              votosIds: idx === 0 ? [prev.currentUserId] : [],
            })),
            cierraEnTexto: 'Cierra en 24 h',
            estado: 'En planificación · sin reserva',
            mensajes: [],
          },
          ...prev.planificaciones,
        ],
      }));
      showToast('Planificación creada (sin bloqueo ni cobro previo)');
    },
    [showToast]
  );

  const votePlanificacion = useCallback((planId: string, opcionId: string) => {
    setState((prev) => ({
      ...prev,
      planificaciones: prev.planificaciones.map((p) =>
        p.id === planId ? votePlanificacionLogic(p, opcionId, prev.currentUserId) : p
      ),
    }));
  }, []);

  const sendPlanificacionMessage = useCallback(
    (planId: string, texto: string) => {
      if (!texto.trim()) return;
      if (currentUser.esMenor) {
        showToast('Chat abierto deshabilitado para cuentas Junior', 'error');
        return;
      }
      setState((prev) => ({
        ...prev,
        planificaciones: prev.planificaciones.map((p) =>
          p.id === planId
            ? {
                ...p,
                mensajes: [
                  ...p.mensajes,
                  {
                    id: `pm_${Date.now()}`,
                    autorId: currentUser.id,
                    autorNombre: currentUser.nombre.split(' ')[0],
                    texto: texto.trim(),
                    hora: 'Ahora',
                  },
                ],
              }
            : p
        ),
      }));
    },
    [currentUser, showToast]
  );

  const convertPlanificacionToBooking = useCallback(
    (planId: string, opcionId: string, canchaId: string, metodoPago: PaymentMethod) => {
      const plan = state.planificaciones.find((p) => p.id === planId);
      const opcion = plan?.opciones.find((o) => o.id === opcionId);
      if (!plan || !opcion) return { ok: false, error: 'Opción no encontrada' };
      if (plan.jugadoresIds.length < plan.quorumMinimo) {
        return { ok: false, error: 'Aún no se alcanza el quórum mínimo para reservar' };
      }

      const participantes = plan.jugadoresIds.map(
        (id) => state.usuarios.find((u) => u.id === id)?.nombre || 'Jugador'
      );

      const bookingResult = createReservation({
        sedeId: opcion.sedeId,
        canchaId,
        fecha: opcion.fecha,
        horaInicio: opcion.horaInicio,
        duracionMin: 90,
        modalidad: plan.modalidad,
        participantes,
        metodoPago,
        tipoOrigen: 'Planificación',
      });

      if (!bookingResult.ok || !bookingResult.reserva) {
        return { ok: false, error: bookingResult.error || 'Horario no disponible' };
      }

      setState((prev) => ({
        ...prev,
        planificaciones: prev.planificaciones.map((p) =>
          p.id === planId
            ? { ...p, estado: 'Reservada', reservaVinculadaId: bookingResult.reserva!.id }
            : p
        ),
      }));
      showToast('¡Planificación confirmada y cancha reservada!');
      return { ok: true };
    },
    [state.planificaciones, state.usuarios, createReservation, showToast]
  );

  const bookClass = useCallback(
    (input: {
      instructorId: string;
      sedeId: string;
      canchaId: string;
      tipo: ClaseProgramada['tipo'];
      fecha: string;
      horaInicio: string;
      duracionMin: 60 | 90;
      metodoPago: PaymentMethod;
    }): { ok: boolean; error?: string } => {
      const courtCheck = isSlotAvailable(
        state,
        input.canchaId,
        input.fecha,
        input.horaInicio,
        input.duracionMin
      );
      if (!courtCheck.available) {
        return { ok: false, error: `Cancha ocupada: ${courtCheck.reason}` };
      }

      const instCheck = isInstructorAvailable(
        state,
        input.instructorId,
        input.fecha,
        input.horaInicio,
        input.duracionMin
      );
      if (!instCheck.available) {
        return { ok: false, error: instCheck.reason || 'Instructor ocupado en ese horario' };
      }

      const inst = state.instructores.find((i) => i.id === input.instructorId);
      if (!inst) return { ok: false, error: 'Instructor no encontrado' };

      const cupoMax = input.tipo === 'Individual' ? 1 : input.tipo === 'Pareja' ? 2 : 6;
      const newClass: ClaseProgramada = {
        id: `cl_${Date.now()}`,
        sedeId: input.sedeId,
        canchaId: input.canchaId,
        instructorId: input.instructorId,
        titulo: `Clase ${input.tipo} · ${inst.nombre}`,
        tipo: input.tipo,
        fecha: input.fecha,
        horaInicio: input.horaInicio,
        duracionMin: input.duracionMin,
        precioPorCupo: inst.precioBase,
        cupoMax,
        alumnosIds: [state.currentUserId],
        asistenciaIds: [],
        estado: cupoMax === 1 ? 'Completa' : 'Abierta',
      };

      setState((prev) => ({
        ...prev,
        clases: [newClass, ...prev.clases],
        notificaciones: [
          {
            id: `not_${Date.now()}`,
            usuarioId: state.currentUserId,
            titulo: 'Clase confirmada',
            mensaje: `${newClass.titulo} el ${input.fecha} a las ${formatHour12(input.horaInicio)}.`,
            categoria: 'Clase',
            leida: false,
            fechaTexto: 'Ahora',
          },
          ...prev.notificaciones,
        ],
        auditoria: [
          {
            id: `aud_${Date.now()}`,
            fecha: '2026-11-26 19:40',
            actor: currentUser.nombre,
            rol: currentUser.rol,
            accion: 'Clase reservada',
            detalle: `${newClass.titulo} bloqueó instructor y cancha`,
            sedeId: input.sedeId,
          },
          ...prev.auditoria,
        ],
      }));
      showToast('Clase reservada: cancha e instructor bloqueados');
      return { ok: true };
    },
    [state, currentUser, showToast]
  );

  const enrollInExistingClass = useCallback(
    (claseId: string) => {
      const cl = state.clases.find((c) => c.id === claseId);
      if (!cl) return { ok: false, message: 'Clase no encontrada' };
      if (cl.alumnosIds.includes(state.currentUserId)) {
        return { ok: false, message: 'Ya estás inscrito en esta clase' };
      }
      if (cl.alumnosIds.length >= cl.cupoMax) {
        return { ok: false, message: 'Esta clase ya completó sus cupos' };
      }
      setState((prev) => ({
        ...prev,
        clases: prev.clases.map((c) => {
          if (c.id !== claseId) return c;
          const nextAlumnos = [...c.alumnosIds, prev.currentUserId];
          return {
            ...c,
            alumnosIds: nextAlumnos,
            estado: nextAlumnos.length >= c.cupoMax ? 'Completa' : 'Abierta',
          };
        }),
      }));
      showToast('Inscripción a clase grupal confirmada');
      return { ok: true, message: 'Inscrito correctamente' };
    },
    [state.clases, state.currentUserId, showToast]
  );

  const toggleClassAttendance = useCallback((claseId: string, alumnoId: string) => {
    setState((prev) => ({
      ...prev,
      clases: prev.clases.map((c) => {
        if (c.id !== claseId) return c;
        const exists = c.asistenciaIds.includes(alumnoId);
        return {
          ...c,
          asistenciaIds: exists
            ? c.asistenciaIds.filter((id) => id !== alumnoId)
            : [...c.asistenciaIds, alumnoId],
        };
      }),
    }));
  }, []);

  const createInstructorClass = useCallback(
    (input: {
      sedeId: string;
      canchaId: string;
      titulo: string;
      tipo: ClaseProgramada['tipo'];
      fecha: string;
      horaInicio: string;
      duracionMin: 60 | 90;
      precioPorCupo: number;
      cupoMax: number;
    }): { ok: boolean; error?: string } => {
      const inst =
        state.instructores.find((i) => i.usuarioId === state.currentUserId) ||
        state.instructores[0];
      const avail = isSlotAvailable(state, input.canchaId, input.fecha, input.horaInicio, input.duracionMin);
      if (!avail.available) return { ok: false, error: avail.reason };
      const instAvail = isInstructorAvailable(state, inst.id, input.fecha, input.horaInicio, input.duracionMin);
      if (!instAvail.available) return { ok: false, error: instAvail.reason };

      const newCl: ClaseProgramada = {
        id: `cl_${Date.now()}`,
        sedeId: input.sedeId,
        canchaId: input.canchaId,
        instructorId: inst.id,
        titulo: input.titulo,
        tipo: input.tipo,
        fecha: input.fecha,
        horaInicio: input.horaInicio,
        duracionMin: input.duracionMin,
        precioPorCupo: input.precioPorCupo,
        cupoMax: input.cupoMax,
        alumnosIds: [],
        asistenciaIds: [],
        estado: 'Abierta',
      };
      setState((prev) => ({ ...prev, clases: [newCl, ...prev.clases] }));
      showToast('Nueva clase programada en agenda');
      return { ok: true };
    },
    [state, showToast]
  );

  const updateInstructorProfile = useCallback(
    (
      instructorId: string,
      patch: { precioBase?: number; especialidades?: string[]; horariosDisponibles?: string[] }
    ) => {
      setState((prev) => ({
        ...prev,
        instructores: prev.instructores.map((i) =>
          i.id === instructorId ? { ...i, ...patch } : i
        ),
      }));
      showToast('Perfil y disponibilidad de instructor actualizados');
    },
    [showToast]
  );

  const reportMatchResult = useCallback(
    (input: {
      sedeId: string;
      modalidad: 'Individual' | 'Dobles';
      tipo: 'Amistoso' | 'Competitivo';
      categoria: RankingCategory;
      rivalId: string;
      marcadorSets: string;
      ganadorEquipo: 'A' | 'B';
    }) => {
      const matchId = `match_${Date.now()}`;
      setState((prev) => ({
        ...prev,
        partidos: [
          {
            id: matchId,
            sedeId: input.sedeId,
            fecha: '2026-11-26',
            modalidad: input.modalidad,
            tipo: input.tipo,
            categoria: input.categoria,
            equipoAIds: [prev.currentUserId],
            equipoBIds: [input.rivalId],
            marcadorSets: input.marcadorSets,
            ganadorEquipo: input.ganadorEquipo,
            estado: 'Pendiente',
            eloProcesado: false,
            reportadoPorId: prev.currentUserId,
          },
          ...prev.partidos,
        ],
      }));
      showToast('Marcador registrado (pendiente de confirmación)');
    },
    [showToast]
  );

  const confirmMatchResult = useCallback(
    (matchId: string) => {
      setState((prev) => {
        const match = prev.partidos.find((m) => m.id === matchId);
        if (!match) return prev;
        const confirmed = { ...match, estado: 'Confirmado' as const };
        const { updatedUsuarios, updatedPartido, applied } = applyConfirmedMatchResult(
          prev.usuarios,
          confirmed
        );
        return {
          ...prev,
          usuarios: updatedUsuarios,
          partidos: prev.partidos.map((m) => (m.id === matchId ? updatedPartido : m)),
          notificaciones: applied
            ? [
                {
                  id: `not_${Date.now()}`,
                  usuarioId: 'ALL',
                  titulo: 'Ranking Elo actualizado',
                  mensaje: `Resultado confirmado (${match.marcadorSets}). Ajuste aplicado una sola vez.`,
                  categoria: 'Ranking',
                  leida: false,
                  fechaTexto: 'Ahora',
                },
                ...prev.notificaciones,
              ]
            : prev.notificaciones,
        };
      });
      showToast('Resultado confirmado y ranking actualizado');
    },
    [showToast]
  );

  const disputeMatchResult = useCallback(
    (matchId: string, motivo: string) => {
      setState((prev) => ({
        ...prev,
        partidos: prev.partidos.map((m) =>
          m.id === matchId
            ? { ...m, estado: 'Disputado', motivoDisputa: motivo || 'Discrepancia en el marcador' }
            : m
        ),
      }));
      showToast('Resultado marcado en disputa (no afecta ranking hasta resolverse)', 'info');
    },
    [showToast]
  );

  const resolveDisputedMatch = useCallback(
    (matchId: string, ganadorEquipo: 'A' | 'B') => {
      setState((prev) => {
        const match = prev.partidos.find((m) => m.id === matchId);
        if (!match) return prev;
        const resolved = { ...match, ganadorEquipo, estado: 'Confirmado' as const };
        const { updatedUsuarios, updatedPartido } = applyConfirmedMatchResult(
          prev.usuarios,
          resolved
        );
        return {
          ...prev,
          usuarios: updatedUsuarios,
          partidos: prev.partidos.map((m) => (m.id === matchId ? updatedPartido : m)),
          auditoria: [
            {
              id: `aud_${Date.now()}`,
              fecha: '2026-11-26 19:45',
              actor: currentUser.nombre,
              rol: currentUser.rol,
              accion: 'Disputa resuelta',
              detalle: `Partido ${match.id} confirmado con ganador Equipo ${ganadorEquipo}`,
              sedeId: match.sedeId,
            },
            ...prev.auditoria,
          ],
        };
      });
      showToast('Disputa resuelta y Elo aplicado');
    },
    [currentUser, showToast]
  );

  const reportMaintenance = useCallback(
    (input: {
      sedeId: string;
      canchaId: string;
      titulo: string;
      detalle: string;
      prioridad: IncidenciaMantenimiento['prioridad'];
      bloquearCancha: boolean;
    }) => {
      setState((prev) => ({
        ...prev,
        incidencias: [
          {
            id: `inc_${Date.now()}`,
            sedeId: input.sedeId,
            canchaId: input.canchaId,
            titulo: input.titulo,
            detalle: input.detalle,
            prioridad: input.prioridad,
            estado: 'Abierta',
            creadaEn: '2026-11-26',
          },
          ...prev.incidencias,
        ],
        canchas: input.bloquearCancha
          ? prev.canchas.map((c) =>
              c.id === input.canchaId
                ? { ...c, estado: 'Mantenimiento', motivoBloqueo: input.titulo }
                : c
            )
          : prev.canchas,
      }));
      showToast('Incidencia de mantenimiento registrada');
    },
    [showToast]
  );

  const resolveMaintenance = useCallback(
    (incId: string) => {
      setState((prev) => {
        const inc = prev.incidencias.find((i) => i.id === incId);
        return {
          ...prev,
          incidencias: prev.incidencias.map((i) =>
            i.id === incId ? { ...i, estado: 'Resuelta' } : i
          ),
          canchas: inc
            ? prev.canchas.map((c) =>
                c.id === inc.canchaId && c.estado !== 'Disponible'
                  ? { ...c, estado: 'Disponible', motivoBloqueo: undefined }
                  : c
              )
            : prev.canchas,
        };
      });
      showToast('Alerta resuelta y cancha habilitada');
    },
    [showToast]
  );

  const suspendByRain = useCallback(
    (sedeId: string, fecha: string, reason: string): number => {
      let affectedCount = 0;
      setState((prev) => {
        const affectedIds = new Set<string>();
        const nextReservas = prev.reservas.map((r) => {
          if (r.sedeId === sedeId && r.fecha === fecha && r.estado === 'Confirmada') {
            affectedIds.add(r.usuarioId);
            affectedCount += 1;
            return {
              ...r,
              estado: 'Cancelada' as const,
              pagoEstado: r.totalPagado > 0 ? ('Devuelto' as const) : r.pagoEstado,
              notas: `Suspendida por lluvia: ${reason}`,
            };
          }
          return r;
        });

        const sedeCanchas = prev.canchas.filter((c) => c.sedeId === sedeId && !c.techada);
        const rainBloqueos = sedeCanchas.map((c, idx) => ({
          id: `blq_rain_${Date.now()}_${idx}`,
          sedeId,
          canchaId: c.id,
          fecha,
          horaInicio: '15:00',
          duracionMin: 240,
          motivo: 'Lluvia' as const,
          creadoPor: prev.currentUserId,
        }));

        const sedeNombre = prev.sedes.find((s) => s.id === sedeId)?.nombre || 'la sede';
        return {
          ...prev,
          reservas: nextReservas,
          bloqueos: [...rainBloqueos, ...prev.bloqueos],
          notificaciones: [
            {
              id: `not_rain_${Date.now()}`,
              usuarioId: 'ALL',
              titulo: `Suspensión por lluvia · ${sedeNombre}`,
              mensaje: `${reason}. ${affectedCount} reserva(s) afectada(s) con devolución simulada o crédito para reprogramación.`,
              categoria: 'Clima',
              leida: false,
              fechaTexto: 'Ahora',
            },
            ...prev.notificaciones,
          ],
          auditoria: [
            {
              id: `aud_rain_${Date.now()}`,
              fecha: '2026-11-26 19:50',
              actor: currentUser.nombre,
              rol: currentUser.rol,
              accion: 'Suspensión por lluvia',
              detalle: `${affectedCount} reservas canceladas con reembolso simulado en ${sedeNombre}`,
              sedeId,
            },
            ...prev.auditoria,
          ],
        };
      });
      showToast(`Lluvia activada: avisos enviados y devoluciones procesadas`);
      return affectedCount;
    },
    [currentUser, showToast]
  );

  const sendAdminNotification = useCallback(
    (titulo: string, mensaje: string) => {
      setState((prev) => ({
        ...prev,
        notificaciones: [
          {
            id: `not_${Date.now()}`,
            usuarioId: 'ALL',
            titulo,
            mensaje,
            categoria: 'Sistema',
            leida: false,
            fechaTexto: 'Ahora',
          },
          ...prev.notificaciones,
        ],
      }));
      showToast('Aviso enviado a todos los usuarios de la sede');
    },
    [showToast]
  );

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notificaciones: prev.notificaciones.map((n) => ({ ...n, leida: true })),
    }));
  }, []);

  const toggleOrganizationStatus = useCallback(
    (orgId: string) => {
      setState((prev) => ({
        ...prev,
        organizaciones: prev.organizaciones.map((o) =>
          o.id === orgId ? { ...o, activa: !o.activa } : o
        ),
      }));
      showToast('Estado de organización actualizado');
    },
    [showToast]
  );

  const verifyProUser = useCallback(
    (userId: string) => {
      setState((prev) => ({
        ...prev,
        usuarios: prev.usuarios.map((u) =>
          u.id === userId ? { ...u, verificadoPro: !u.verificadoPro } : u
        ),
      }));
      showToast('Verificación deportiva actualizada');
    },
    [showToast]
  );

  const updateServiceFee = useCallback(
    (pct: number) => {
      setState((prev) => ({ ...prev, serviceFeePct: pct }));
      showToast(`Comisión de plataforma ajustada a ${pct}%`);
    },
    [showToast]
  );

  const togglePatrocinio = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        patrociniosActivos: prev.patrociniosActivos.map((p) =>
          p.id === id ? { ...p, activo: !p.activo } : p
        ),
      }));
    },
    []
  );

  const value: AppContextValue = {
    state,
    currentUser,
    activeSede,
    toast,
    showToast,
    loginDemo,
    registerDemoPlayer,
    logout,
    switchRole,
    switchSede,
    toggleFavoriteSede,
    updateUserPreferences,
    resetDemoData,
    createReservation,
    cancelReservation,
    rescheduleReservation,
    validateCheckInCode,
    toggleCourtStatus,
    createConvocatoria,
    joinConvocatoria,
    approvePendingPlayer,
    leaveConvocatoria,
    sendConvocatoriaMessage,
    createPlanificacion,
    votePlanificacion,
    sendPlanificacionMessage,
    convertPlanificacionToBooking,
    bookClass,
    enrollInExistingClass,
    toggleClassAttendance,
    createInstructorClass,
    updateInstructorProfile,
    reportMatchResult,
    confirmMatchResult,
    disputeMatchResult,
    resolveDisputedMatch,
    reportMaintenance,
    resolveMaintenance,
    suspendByRain,
    sendAdminNotification,
    markAllNotificationsRead,
    toggleOrganizationStatus,
    verifyProUser,
    updateServiceFee,
    togglePatrocinio,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
