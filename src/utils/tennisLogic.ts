import type {
  AppState,
  Cancha,
  Convocatoria,
  PartidoResultado,
  PlanificacionGrupo,
  RankingCategory,
  Reserva,
  Usuario,
} from '../types/tennis';

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatHour12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'p. m.' : 'a. m.';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function intervalsOverlap(
  startA: number,
  durA: number,
  startB: number,
  durB: number
): boolean {
  const endA = startA + durA;
  const endB = startB + durB;
  return startA < endB && startB < endA;
}

/**
 * Checks whether a court slot is completely free of blocks, maintenance,
 * non-cancelled reservations, and scheduled classes.
 */
export function isSlotAvailable(
  state: Pick<AppState, 'canchas' | 'reservas' | 'bloqueos' | 'clases'>,
  canchaId: string,
  fecha: string,
  horaInicio: string,
  duracionMin: number,
  excludeReservaId?: string
): { available: boolean; reason?: string } {
  const cancha = state.canchas.find((c) => c.id === canchaId);
  if (!cancha) return { available: false, reason: 'Cancha no encontrada' };
  if (cancha.estado === 'Bloqueada' || cancha.estado === 'Mantenimiento') {
    return {
      available: false,
      reason: cancha.motivoBloqueo || `Cancha ${cancha.estado.toLowerCase()}`,
    };
  }

  const reqStart = timeToMinutes(horaInicio);

  // Check manual blocks / rain / tournaments
  const blockingEntry = state.bloqueos.find(
    (b) =>
      b.canchaId === canchaId &&
      b.fecha === fecha &&
      intervalsOverlap(reqStart, duracionMin, timeToMinutes(b.horaInicio), b.duracionMin)
  );
  if (blockingEntry) {
    return { available: false, reason: `Bloqueada (${blockingEntry.motivo})` };
  }

  // Check active reservations
  const activeStatuses = new Set(['Temporal', 'Confirmada', 'En curso', 'Finalizada']);
  const conflictingRes = state.reservas.find(
    (r) =>
      r.id !== excludeReservaId &&
      r.canchaId === canchaId &&
      r.fecha === fecha &&
      activeStatuses.has(r.estado) &&
      intervalsOverlap(reqStart, duracionMin, timeToMinutes(r.horaInicio), r.duracionMin)
  );
  if (conflictingRes) {
    return { available: false, reason: 'Horario ya reservado' };
  }

  // Check scheduled classes on the same court
  const conflictingClass = state.clases.find(
    (cl) =>
      cl.canchaId === canchaId &&
      cl.fecha === fecha &&
      cl.estado !== 'Cancelada' &&
      intervalsOverlap(reqStart, duracionMin, timeToMinutes(cl.horaInicio), cl.duracionMin)
  );
  if (conflictingClass) {
    return { available: false, reason: `Ocupada por clase (${conflictingClass.titulo})` };
  }

  return { available: true };
}

/**
 * Checks whether an instructor has no overlapping classes at the requested time.
 */
export function isInstructorAvailable(
  state: Pick<AppState, 'instructores' | 'clases'>,
  instructorId: string,
  fecha: string,
  horaInicio: string,
  duracionMin: number
): { available: boolean; reason?: string } {
  const inst = state.instructores.find((i) => i.id === instructorId);
  if (!inst) return { available: false, reason: 'Instructor no encontrado' };

  const reqStart = timeToMinutes(horaInicio);
  const conflict = state.clases.find(
    (cl) =>
      cl.instructorId === instructorId &&
      cl.fecha === fecha &&
      cl.estado !== 'Cancelada' &&
      intervalsOverlap(reqStart, duracionMin, timeToMinutes(cl.horaInicio), cl.duracionMin)
  );
  if (conflict) {
    return { available: false, reason: `Instructor ocupado (${conflict.titulo})` };
  }
  return { available: true };
}

export function calculateBookingTotals(
  cancha: Pick<Cancha, 'precioHora' | 'precioNocturno'>,
  horaInicio: string,
  duracionMin: number,
  serviceFeePct: number,
  isResidentDiscount = false
): { precioCancha: number; cargoServicio: number; totalPagado: number; esGratuita: boolean } {
  const hour = Number(horaInicio.split(':')[0] || 0);
  const baseRate =
    hour >= 18 && cancha.precioNocturno !== undefined
      ? cancha.precioNocturno
      : cancha.precioHora;

  if (baseRate <= 0) {
    return { precioCancha: 0, cargoServicio: 0, totalPagado: 0, esGratuita: true };
  }

  const multiplier = duracionMin / 60;
  let precioCancha = Number((baseRate * multiplier).toFixed(2));
  if (isResidentDiscount) {
    precioCancha = Number((precioCancha * 0.8).toFixed(2));
  }
  const cargoServicio = Number(((precioCancha * serviceFeePct) / 100).toFixed(2));
  const totalPagado = Number((precioCancha + cargoServicio).toFixed(2));
  return { precioCancha, cargoServicio, totalPagado, esGratuita: totalPagado === 0 };
}

/**
 * Simplified Elo calculation (base 1500, K=32 individual, team avg in doubles).
 * Returns signed integer delta for Team A (Team B gets -delta).
 */
export function calculateEloDelta(
  ratingA: number,
  ratingB: number,
  teamAWon: boolean,
  kFactor = 32
): number {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const actualA = teamAWon ? 1 : 0;
  return Math.round(kFactor * (actualA - expectedA));
}

/**
 * Applies a confirmed competitive match result to player Elo ratings & W/L records
 * strictly ONCE. Friendly or disputed or already-processed matches are never re-applied.
 */
export function applyConfirmedMatchResult(
  usuarios: Usuario[],
  partido: PartidoResultado
): { updatedUsuarios: Usuario[]; updatedPartido: PartidoResultado; applied: boolean } {
  if (
    partido.estado !== 'Confirmado' ||
    partido.tipo !== 'Competitivo' ||
    partido.eloProcesado
  ) {
    return { updatedUsuarios: usuarios, updatedPartido: partido, applied: false };
  }

  const cat: RankingCategory = partido.categoria;
  const teamAUsers = usuarios.filter((u) => partido.equipoAIds.includes(u.id));
  const teamBUsers = usuarios.filter((u) => partido.equipoBIds.includes(u.id));

  if (teamAUsers.length === 0 || teamBUsers.length === 0) {
    return { updatedUsuarios: usuarios, updatedPartido: partido, applied: false };
  }

  const avgA =
    teamAUsers.reduce((acc, u) => acc + (u.elo[cat] ?? 1500), 0) / teamAUsers.length;
  const avgB =
    teamBUsers.reduce((acc, u) => acc + (u.elo[cat] ?? 1500), 0) / teamBUsers.length;

  const teamAWon = partido.ganadorEquipo === 'A';
  const kFactor = partido.modalidad === 'Individual' ? 32 : 24;
  const deltaA = calculateEloDelta(avgA, avgB, teamAWon, kFactor);

  const updatedUsuarios = usuarios.map((u) => {
    const inA = partido.equipoAIds.includes(u.id);
    const inB = partido.equipoBIds.includes(u.id);
    if (!inA && !inB) return u;

    const currentElo = u.elo[cat] ?? 1500;
    const delta = inA ? deltaA : -deltaA;
    const won = (inA && teamAWon) || (inB && !teamAWon);
    return {
      ...u,
      elo: {
        ...u.elo,
        [cat]: Math.max(800, currentElo + delta),
      },
      ganados: u.ganados + (won ? 1 : 0),
      perdidos: u.perdidos + (won ? 0 : 1),
    };
  });

  return {
    updatedUsuarios,
    updatedPartido: {
      ...partido,
      eloProcesado: true,
      deltaEloA: deltaA,
    },
    applied: true,
  };
}

/**
 * Joins an open match convocatoria, closing automatically when cupoTotal is reached,
 * moving excess requests to listaEsperaIds, and avoiding double charging.
 */
export function joinConvocatoriaLogic(
  conv: Convocatoria,
  userId: string
): { updated: Convocatoria; outcome: 'joined' | 'waitlist' | 'pending' | 'already' | 'closed' } {
  if (conv.estado === 'Cancelada' || conv.estado === 'Cerrada') {
    return { updated: conv, outcome: 'closed' };
  }
  if (
    conv.jugadoresIds.includes(userId) ||
    conv.listaEsperaIds.includes(userId) ||
    conv.pendientesAprobacionIds.includes(userId)
  ) {
    return { updated: conv, outcome: 'already' };
  }

  if (conv.jugadoresIds.length >= conv.cupoTotal || conv.estado === 'Completa') {
    return {
      updated: {
        ...conv,
        estado: 'Completa',
        listaEsperaIds: [...conv.listaEsperaIds, userId],
      },
      outcome: 'waitlist',
    };
  }

  if (!conv.aprobacionAutomatica) {
    return {
      updated: {
        ...conv,
        pendientesAprobacionIds: [...conv.pendientesAprobacionIds, userId],
      },
      outcome: 'pending',
    };
  }

  const nextJugadores = [...conv.jugadoresIds, userId];
  const isNowFull = nextJugadores.length >= conv.cupoTotal;
  const nextPagos =
    conv.aportePorJugador > 0 && !conv.pagosCompartidosIds.includes(userId)
      ? [...conv.pagosCompartidosIds, userId]
      : conv.pagosCompartidosIds;

  return {
    updated: {
      ...conv,
      jugadoresIds: nextJugadores,
      pagosCompartidosIds: nextPagos,
      estado: isNowFull ? 'Completa' : 'Abierta',
    },
    outcome: 'joined',
  };
}

/**
 * Casts or toggles a vote on a planning option without creating any court lock or payment.
 */
export function votePlanificacionLogic(
  plan: PlanificacionGrupo,
  opcionId: string,
  userId: string
): PlanificacionGrupo {
  if (plan.estado === 'Cancelada' || plan.estado === 'Reservada' || plan.estado === 'Vencida') {
    return plan;
  }

  const nextJugadores = plan.jugadoresIds.includes(userId)
    ? plan.jugadoresIds
    : [...plan.jugadoresIds, userId];

  const nextOpciones = plan.opciones.map((op) => {
    const filtered = op.votosIds.filter((id) => id !== userId);
    if (op.id === opcionId) {
      return { ...op, votosIds: [...filtered, userId] };
    }
    return { ...op, votosIds: filtered };
  });

  const quorumReached = nextJugadores.length >= plan.quorumMinimo;
  return {
    ...plan,
    jugadoresIds: nextJugadores,
    opciones: nextOpciones,
    estado: quorumReached ? 'Quórum alcanzado' : 'En planificación · sin reserva',
  };
}

export function computeAdminMetrics(
  state: Pick<AppState, 'reservas' | 'canchas' | 'clases'>,
  sedeId: string,
  fecha: string
) {
  const sedeReservas = state.reservas.filter((r) => r.sedeId === sedeId && r.fecha === fecha);
  const activeReservas = sedeReservas.filter(
    (r) => r.estado !== 'Cancelada' && r.estado !== 'Vencida' && r.pagoEstado !== 'Rechazado'
  );
  const ingresosHoy = activeReservas.reduce((sum, r) => sum + r.precioCancha, 0);
  const sedeClases = state.clases.filter(
    (cl) => cl.sedeId === sedeId && cl.fecha === fecha && cl.estado !== 'Cancelada'
  );
  const clasesIngresos = sedeClases.reduce(
    (sum, cl) => sum + cl.precioPorCupo * cl.alumnosIds.length,
    0
  );

  const sedeCanchas = state.canchas.filter((c) => c.sedeId === sedeId);
  const maxDailySlots = Math.max(1, sedeCanchas.length * 8);
  const usedSlots = activeReservas.length + sedeClases.length;
  const ocupacionPct = Math.min(100, Math.round((usedSlots / maxDailySlots) * 100));

  return {
    ingresosHoy: Number((ingresosHoy + clasesIngresos).toFixed(2)),
    reservasHoy: activeReservas.length,
    clasesHoy: sedeClases.length,
    alumnosHoy: sedeClases.reduce((sum, c) => sum + c.alumnosIds.length, 0),
    ocupacionPct,
  };
}

export function getLeaderboard(
  usuarios: Usuario[],
  categoria: RankingCategory,
  sedeIdFilter?: string,
  reservas?: Reserva[]
): Usuario[] {
  let list = usuarios.filter((u) => u.rol === 'jugador' && u.categoria === categoria);
  if (sedeIdFilter && sedeIdFilter !== 'ALL' && reservas) {
    const activeAtSede = new Set(
      reservas.filter((r) => r.sedeId === sedeIdFilter).map((r) => r.usuarioId)
    );
    const filtered = list.filter(
      (u) => u.favoritosSedes.includes(sedeIdFilter) || activeAtSede.has(u.id)
    );
    if (filtered.length > 0) list = filtered;
  }
  return [...list].sort((a, b) => (b.elo[categoria] ?? 1500) - (a.elo[categoria] ?? 1500));
}
