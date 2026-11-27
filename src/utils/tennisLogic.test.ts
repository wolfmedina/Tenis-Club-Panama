import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyConfirmedMatchResult,
  calculateBookingTotals,
  calculateEloDelta,
  computeAdminMetrics,
  isInstructorAvailable,
  isSlotAvailable,
  joinConvocatoriaLogic,
  validateCourtRates,
  votePlanificacionLogic,
} from './tennisLogic';
import type {
  Cancha,
  ClaseProgramada,
  Convocatoria,
  Instructor,
  PartidoResultado,
  PlanificacionGrupo,
  Reserva,
  Usuario,
} from '../types/tennis';

const sampleCourt: Cancha = {
  id: 'c1',
  sedeId: 's1',
  nombre: 'Cancha Privada 1',
  superficie: 'Dura (Hard Court)',
  iluminacion: true,
  techada: false,
  precioHora: 25,
  precioNocturno: 30,
  capacidadMax: 4,
  estado: 'Disponible',
};

const samplePublicCourt: Cancha = {
  ...sampleCourt,
  id: 'c2',
  nombre: 'Cancha Municipal 1',
  precioHora: 8,
  precioNocturno: 12,
};

test('P1: mandatory paid booking totals, rate validation, custom rules & payment-confirmed slot lock', () => {
  const invalidZeroCourt: Cancha = { ...samplePublicCourt, precioHora: 0, precioNocturno: 0 };
  const invalidTotals = calculateBookingTotals(invalidZeroCourt, '09:00', 60, 5);
  assert.equal(invalidTotals.tarifaValida, false);
  assert.equal(invalidTotals.totalPagado, 0);

  assert.equal(validateCourtRates({ precioHora: 0 }).valid, false);
  assert.equal(validateCourtRates({ precioHora: -5 }).valid, false);
  assert.equal(validateCourtRates({ precioHora: 10, precioNocturno: 0 }).valid, false);
  assert.equal(
    validateCourtRates({
      precioHora: 10,
      tarifasPersonalizadas: [
        { id: 't1', dias: 'Fines de semana', horaDesde: '18:00', horaHasta: '21:00', precioHora: 0 },
      ],
    }).valid,
    false
  );
  assert.equal(validateCourtRates({ precioHora: 8, precioNocturno: 12 }).valid, true);

  const publicDay = calculateBookingTotals(samplePublicCourt, '09:00', 60, 5, false, '2026-11-27');
  assert.equal(publicDay.tarifaValida, true);
  assert.equal(publicDay.precioCancha, 8);
  assert.equal(publicDay.cargoServicio, 0.4);
  assert.equal(publicDay.totalPagado, 8.4);

  const paid = calculateBookingTotals(sampleCourt, '18:00', 90, 5, false, '2026-11-27');
  assert.equal(paid.tarifaValida, true);
  assert.equal(paid.precioCancha, 45);
  assert.equal(paid.cargoServicio, 2.25);
  assert.equal(paid.totalPagado, 47.25);

  // Custom rule by day + schedule + duration overrides base/nocturnal rate
  const customCourt: Cancha = {
    ...samplePublicCourt,
    preciosPorDuracion: { 90: 11 },
    tarifasPersonalizadas: [
      {
        id: 'rule_wknd',
        dias: 'Fines de semana',
        horaDesde: '18:00',
        horaHasta: '22:00',
        duracionMin: 60,
        precioHora: 12,
      },
    ],
  };
  // 2026-11-28 is Saturday
  const weekendRule = calculateBookingTotals(customCourt, '18:00', 60, 5, false, '2026-11-28');
  assert.equal(weekendRule.tarifaHoraAplicada, 12);
  assert.equal(weekendRule.precioCancha, 12);
  // Weekday 90 min daytime uses preciosPorDuracion[90]
  const weekdayDuration = calculateBookingTotals(customCourt, '09:00', 90, 5, false, '2026-11-27');
  assert.equal(weekdayDuration.precioCancha, 11);

  const unpaidOrRejected: Reserva[] = [
    {
      id: 'r_temp',
      codigo: 'TCP-100',
      sedeId: 's1',
      canchaId: 'c1',
      usuarioId: 'u1',
      fecha: '2026-11-27',
      horaInicio: '15:00',
      duracionMin: 60,
      modalidad: 'Individual',
      participantes: ['Julio Solórzano'],
      estado: 'Temporal',
      asistenciaValidada: false,
      precioCancha: 25,
      cargoServicio: 1.25,
      totalPagado: 26.25,
      metodoPago: 'Tarjeta',
      pagoEstado: 'Pendiente',
      creadaEn: '2026-11-26',
      tipoOrigen: 'Jugador',
    },
  ];
  // Unconfirmed/unpaid reservation must NOT definitively lock the slot
  assert.equal(
    isSlotAvailable({ canchas: [sampleCourt], reservas: unpaidOrRejected, bloqueos: [], clases: [] }, 'c1', '2026-11-27', '15:00', 60).available,
    true
  );

  const reservas: Reserva[] = [
    {
      id: 'r1',
      codigo: 'TCP-101',
      sedeId: 's1',
      canchaId: 'c1',
      usuarioId: 'u1',
      fecha: '2026-11-27',
      horaInicio: '18:00',
      duracionMin: 90,
      modalidad: 'Dobles',
      participantes: ['Julio Solórzano'],
      estado: 'Confirmada',
      asistenciaValidada: false,
      precioCancha: 45,
      cargoServicio: 2.25,
      totalPagado: 47.25,
      metodoPago: 'Tarjeta',
      pagoEstado: 'Aprobado',
      creadaEn: '2026-11-26',
      tipoOrigen: 'Jugador',
    },
  ];

  // Exact overlap blocked when payment is confirmed
  assert.equal(
    isSlotAvailable({ canchas: [sampleCourt], reservas, bloqueos: [], clases: [] }, 'c1', '2026-11-27', '18:00', 60)
      .available,
    false
  );
  // Partial overlap at 19:00 blocked (18:00-19:30 overlaps 19:00-20:00)
  assert.equal(
    isSlotAvailable({ canchas: [sampleCourt], reservas, bloqueos: [], clases: [] }, 'c1', '2026-11-27', '19:00', 60)
      .available,
    false
  );
  // Adjacent slot at 19:30 allowed
  assert.equal(
    isSlotAvailable({ canchas: [sampleCourt], reservas, bloqueos: [], clases: [] }, 'c1', '2026-11-27', '19:30', 60)
      .available,
    true
  );
});

test('P2: blocked court disappears from availability', () => {
  const blocked: Cancha = { ...sampleCourt, estado: 'Bloqueada', motivoBloqueo: 'Mantenimiento luz' };
  const check = isSlotAvailable({ canchas: [blocked], reservas: [], bloqueos: [], clases: [] }, 'c1', '2026-11-27', '09:00', 60);
  assert.equal(check.available, false);
  assert.match(check.reason || '', /Mantenimiento/);
});

test('P3: open match convocatoria closes at 4/4 and sends 5th to waitlist; planning votes without booking', () => {
  const conv: Convocatoria = {
    id: 'conv1',
    reservaId: 'r1',
    sedeId: 's1',
    canchaId: 'c1',
    organizadorId: 'u1',
    titulo: 'Dobles intermedio',
    modalidad: 'Dobles',
    nivel: 'Intermedio',
    fecha: '2026-11-27',
    horaInicio: '19:30',
    duracionMin: 90,
    cupoTotal: 4,
    jugadoresIds: ['u1', 'u2'],
    listaEsperaIds: [],
    pendientesAprobacionIds: [],
    aprobacionAutomatica: true,
    visibilidad: 'Pública',
    aportePorJugador: 8,
    pagosCompartidosIds: ['u1', 'u2'],
    descripcion: 'Partido amistoso',
    estado: 'Abierta',
    mensajes: [],
  };

  const r3 = joinConvocatoriaLogic(conv, 'u3');
  assert.equal(r3.outcome, 'joined');
  assert.equal(r3.updated.jugadoresIds.length, 3);
  assert.equal(r3.updated.estado, 'Abierta');

  const r4 = joinConvocatoriaLogic(r3.updated, 'u4');
  assert.equal(r4.outcome, 'joined');
  assert.equal(r4.updated.jugadoresIds.length, 4);
  assert.equal(r4.updated.estado, 'Completa');

  const r5 = joinConvocatoriaLogic(r4.updated, 'u5');
  assert.equal(r5.outcome, 'waitlist');
  assert.deepEqual(r5.updated.listaEsperaIds, ['u5']);

  const plan: PlanificacionGrupo = {
    id: 'p1',
    organizadorId: 'u1',
    titulo: 'Grupo Viernes',
    subtitulo: 'Sin reserva',
    modalidad: 'Dobles',
    nivel: 'Intermedio',
    tipo: 'Amistoso',
    quorumMinimo: 4,
    jugadoresIds: ['u1', 'u2', 'u3'],
    opciones: [
      { id: 'op1', fecha: '2026-11-28', horaInicio: '19:30', horaFin: '21:00', sedeId: 's1', votosIds: ['u1'] },
      { id: 'op2', fecha: '2026-11-29', horaInicio: '09:00', horaFin: '10:30', sedeId: 's1', votosIds: [] },
    ],
    cierraEnTexto: '12 h',
    estado: 'En planificación · sin reserva',
    mensajes: [],
  };

  const afterVote = votePlanificacionLogic(plan, 'op1', 'u4');
  assert.equal(afterVote.estado, 'Quórum alcanzado');
  assert.equal(afterVote.reservaVinculadaId, undefined);
  assert.equal(afterVote.opciones[0].votosIds.length, 2);
});

test('P4: class booking blocks both court and instructor simultaneously', () => {
  const inst: Instructor = {
    id: 'inst1',
    usuarioId: 'uInst1',
    nombre: 'Carlos Méndez',
    titulo: 'Head Coach',
    sedePrincipalId: 's1',
    sedesAutorizadas: ['s1'],
    especialidades: ['Técnica'],
    certificaciones: ['ITF'],
    tiposClase: ['Privadas'],
    precioBase: 35,
    rating: 4.9,
    resenasCount: 10,
    disponibleHoy: true,
    proximaSlotTexto: 'Hoy',
    verificado: true,
    avatarSeed: 'cm',
    horariosDisponibles: ['16:00'],
  };
  const clases: ClaseProgramada[] = [
    {
      id: 'cl1',
      sedeId: 's1',
      canchaId: 'c1',
      instructorId: 'inst1',
      titulo: 'Clase Técnica',
      tipo: 'Individual',
      fecha: '2026-11-27',
      horaInicio: '16:00',
      duracionMin: 60,
      precioPorCupo: 35,
      cupoMax: 1,
      alumnosIds: ['u1'],
      asistenciaIds: [],
      estado: 'Completa',
    },
  ];

  assert.equal(
    isSlotAvailable({ canchas: [sampleCourt], reservas: [], bloqueos: [], clases }, 'c1', '2026-11-27', '16:00', 60).available,
    false
  );
  assert.equal(
    isInstructorAvailable({ instructores: [inst], clases }, 'inst1', '2026-11-27', '16:00', 60).available,
    false
  );
});

test('P5: competitive Elo applies strictly once on confirmed result; disputed & friendly ignored', () => {
  const users: Usuario[] = [
    {
      id: 'u1',
      nombre: 'Carlos',
      email: 'c@tcp.pa',
      telefono: '6000',
      rol: 'jugador',
      provincia: 'Panamá',
      distrito: 'Ciudad de Panamá',
      categoria: 'Amateur',
      nivel: 'Intermedio',
      elo: { Junior: 1500, Amateur: 1500, Profesional: 1500 },
      ganados: 0,
      perdidos: 0,
      asistenciaScore: 98,
      favoritosSedes: [],
      avatarSeed: 'c',
      pushHabilitado: true,
      recordatoriosFrecuencia: 'semanal',
    },
    {
      id: 'u2',
      nombre: 'Diego',
      email: 'd@tcp.pa',
      telefono: '6001',
      rol: 'jugador',
      provincia: 'Panamá',
      distrito: 'Ciudad de Panamá',
      categoria: 'Amateur',
      nivel: 'Intermedio',
      elo: { Junior: 1500, Amateur: 1500, Profesional: 1500 },
      ganados: 0,
      perdidos: 0,
      asistenciaScore: 95,
      favoritosSedes: [],
      avatarSeed: 'd',
      pushHabilitado: true,
      recordatoriosFrecuencia: 'semanal',
    },
  ];

  const disputed: PartidoResultado = {
    id: 'm1',
    sedeId: 's1',
    fecha: '2026-11-26',
    modalidad: 'Individual',
    tipo: 'Competitivo',
    categoria: 'Amateur',
    equipoAIds: ['u1'],
    equipoBIds: ['u2'],
    marcadorSets: '6-4, 6-3',
    ganadorEquipo: 'A',
    estado: 'Disputado',
    eloProcesado: false,
    reportadoPorId: 'u1',
  };

  const resDisputed = applyConfirmedMatchResult(users, disputed);
  assert.equal(resDisputed.applied, false);
  assert.equal(resDisputed.updatedUsuarios[0].elo.Amateur, 1500);

  const confirmed: PartidoResultado = { ...disputed, estado: 'Confirmado' };
  const firstApply = applyConfirmedMatchResult(users, confirmed);
  assert.equal(firstApply.applied, true);
  assert.equal(firstApply.updatedPartido.eloProcesado, true);
  assert.equal(firstApply.updatedUsuarios[0].elo.Amateur, 1500 + calculateEloDelta(1500, 1500, true, 32));
  assert.equal(firstApply.updatedUsuarios[0].ganados, 1);
  assert.equal(firstApply.updatedUsuarios[1].perdidos, 1);

  // Second call must NOT double-apply
  const secondApply = applyConfirmedMatchResult(firstApply.updatedUsuarios, firstApply.updatedPartido);
  assert.equal(secondApply.applied, false);
  assert.equal(secondApply.updatedUsuarios[0].elo.Amateur, firstApply.updatedUsuarios[0].elo.Amateur);
});

test('P6: admin metrics isolate by sede', () => {
  const reservas: Reserva[] = [
    {
      id: 'r1',
      codigo: 'A1',
      sedeId: 's1',
      canchaId: 'c1',
      usuarioId: 'u1',
      fecha: '2026-11-27',
      horaInicio: '08:00',
      duracionMin: 60,
      modalidad: 'Individual',
      participantes: ['A', 'B'],
      estado: 'Confirmada',
      asistenciaValidada: false,
      precioCancha: 25,
      cargoServicio: 1.25,
      totalPagado: 26.25,
      metodoPago: 'Tarjeta',
      pagoEstado: 'Aprobado',
      creadaEn: '2026-11-26',
      tipoOrigen: 'Jugador',
    },
    {
      id: 'r2',
      codigo: 'B1',
      sedeId: 's2',
      canchaId: 'c9',
      usuarioId: 'u1',
      fecha: '2026-11-27',
      horaInicio: '08:00',
      duracionMin: 60,
      modalidad: 'Individual',
      participantes: ['A', 'B'],
      estado: 'Confirmada',
      asistenciaValidada: false,
      precioCancha: 12,
      cargoServicio: 0.6,
      totalPagado: 12.6,
      metodoPago: 'Yappy',
      pagoEstado: 'Aprobado',
      creadaEn: '2026-11-26',
      tipoOrigen: 'Jugador',
    },
  ];
  const m1 = computeAdminMetrics({ reservas, canchas: [sampleCourt], clases: [] }, 's1', '2026-11-27');
  assert.equal(m1.ingresosHoy, 25);
  assert.equal(m1.reservasHoy, 1);
});
