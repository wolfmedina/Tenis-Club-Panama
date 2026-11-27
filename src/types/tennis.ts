export type Role = 'jugador' | 'admin' | 'instructor' | 'superadmin';
export type AdminSubRole = 'propietario' | 'recepcion' | 'finanzas' | 'mantenimiento';
export type RankingCategory = 'Junior' | 'Amateur' | 'Profesional';
export type SkillLevel = 'Principiante' | 'Intermedio' | 'Avanzado' | 'Pro';
export type Modality = 'Individual' | 'Dobles' | 'Dobles mixto';
export type SurfaceType = 'Dura (Hard Court)' | 'Arcilla' | 'Césped Sintético';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: Role;
  adminSubRol?: AdminSubRole;
  provincia: string;
  distrito: string;
  categoria: RankingCategory;
  nivel: SkillLevel;
  elo: Record<RankingCategory, number>;
  ganados: number;
  perdidos: number;
  asistenciaScore: number; // % reputación de asistencia separada del ranking
  esMenor?: boolean;
  tutorNombre?: string;
  verificadoPro?: boolean;
  favoritosSedes: string[];
  autorizadoSedes?: string[]; // para admin
  avatarSeed: string;
  avatarUrl?: string;
  pushHabilitado: boolean;
  recordatoriosFrecuencia: 'diario' | 'semanal' | 'desactivado';
}

export interface Organizacion {
  id: string;
  nombre: string;
  tipo: 'Privada' | 'Pública / Municipal';
  provincia: string;
  activa: boolean;
  planComercial: 'Básico' | 'Club Pro' | 'Institucional';
  comisionPct: number;
}

export interface Sede {
  id: string;
  organizacionId: string;
  nombre: string;
  tipo: 'Pública' | 'Privada';
  provincia: string;
  distrito: string;
  direccion: string;
  rating: number;
  resenasCount: number;
  amenidades: string[];
  reglamento: string;
  horarioApertura: string; // "06:00"
  horarioCierre: string;   // "22:00"
  politicaCancelacionHoras: number;
  tarifaResidentePct?: number;
  imagenVariant: 'night-club' | 'coastal-palm' | 'balboa-park' | 'west-clay';
  activa: boolean;
}

export interface Cancha {
  id: string;
  sedeId: string;
  nombre: string;
  superficie: SurfaceType;
  iluminacion: boolean;
  techada: boolean;
  precioHora: number; // 0 = gratuita
  precioNocturno?: number;
  capacidadMax: number;
  estado: 'Disponible' | 'Bloqueada' | 'Mantenimiento';
  motivoBloqueo?: string;
}

export type ReservaEstado =
  | 'Temporal'
  | 'Confirmada'
  | 'En curso'
  | 'Finalizada'
  | 'Cancelada'
  | 'Vencida'
  | 'No asistió';

export type PagoEstado =
  | 'Pendiente'
  | 'Aprobado'
  | 'Rechazado'
  | 'Devolución pendiente'
  | 'Devuelto';

export type PaymentMethod = 'Tarjeta' | 'Yappy' | 'Apple Pay' | 'PayPal' | 'Gratuita';

export interface Reserva {
  id: string;
  codigo: string;
  sedeId: string;
  canchaId: string;
  usuarioId: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:MM (24h)
  duracionMin: 60 | 90 | 120;
  modalidad: Modality;
  participantes: string[];
  estado: ReservaEstado;
  asistenciaValidada: boolean;
  precioCancha: number;
  cargoServicio: number;
  totalPagado: number;
  metodoPago: PaymentMethod;
  pagoEstado: PagoEstado;
  creadaEn: string;
  tipoOrigen: 'Jugador' | 'Manual Admin' | 'Planificación';
  notas?: string;
}

export interface BloqueoCancha {
  id: string;
  sedeId: string;
  canchaId: string;
  fecha: string;
  horaInicio: string;
  duracionMin: number;
  motivo: 'Mantenimiento' | 'Lluvia' | 'Torneo / Institucional';
  creadoPor: string;
}

export type ConvocatoriaEstado = 'Abierta' | 'Completa' | 'Cerrada' | 'Cancelada';

export interface MensajeChat {
  id: string;
  autorId: string;
  autorNombre: string;
  texto: string;
  hora: string;
  bloqueadoPorSeguridad?: boolean;
}

export interface Convocatoria {
  id: string;
  reservaId: string;
  sedeId: string;
  canchaId: string;
  organizadorId: string;
  titulo: string;
  modalidad: Modality;
  nivel: SkillLevel;
  fecha: string;
  horaInicio: string;
  duracionMin: number;
  cupoTotal: number;
  jugadoresIds: string[];
  listaEsperaIds: string[];
  pendientesAprobacionIds: string[];
  aprobacionAutomatica: boolean;
  visibilidad: 'Pública' | 'Privada';
  aportePorJugador: number;
  pagosCompartidosIds: string[]; // evita doble cobro
  descripcion: string;
  estado: ConvocatoriaEstado;
  destacado?: boolean;
  mensajes: MensajeChat[];
}

export interface OpcionVotacion {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  sedeId: string;
  votosIds: string[];
}

export type PlanificacionEstado =
  | 'En planificación · sin reserva'
  | 'Quórum alcanzado'
  | 'Reservada'
  | 'Vencida'
  | 'Cancelada';

export interface PlanificacionGrupo {
  id: string;
  organizadorId: string;
  titulo: string;
  subtitulo: string;
  modalidad: Modality;
  nivel: SkillLevel;
  tipo: 'Amistoso' | 'Competitivo';
  quorumMinimo: number;
  jugadoresIds: string[];
  opciones: OpcionVotacion[];
  cierraEnTexto: string;
  estado: PlanificacionEstado;
  reservaVinculadaId?: string;
  mensajes: MensajeChat[];
}

export interface Instructor {
  id: string;
  usuarioId: string;
  nombre: string;
  titulo: string;
  sedePrincipalId: string;
  sedesAutorizadas: string[];
  especialidades: string[];
  certificaciones: string[];
  tiposClase: ('Grupales' | 'Privadas' | 'Dúo' | 'Junior')[];
  precioBase: number;
  rating: number;
  resenasCount: number;
  disponibleHoy: boolean;
  proximaSlotTexto: string;
  verificado: boolean;
  avatarSeed: string;
  horariosDisponibles: string[]; // ["07:00", "09:00", "16:00", "18:00", "19:30"]
}

export interface ClaseProgramada {
  id: string;
  sedeId: string;
  canchaId: string;
  instructorId: string;
  titulo: string;
  tipo: 'Individual' | 'Pareja' | 'Grupal' | 'Junior';
  fecha: string;
  horaInicio: string;
  duracionMin: 60 | 90;
  precioPorCupo: number;
  cupoMax: number;
  alumnosIds: string[];
  asistenciaIds: string[];
  estado: 'Abierta' | 'Completa' | 'Finalizada' | 'Cancelada';
  evaluacionPromedio?: number;
}

export type ResultadoEstado = 'Pendiente' | 'Confirmado' | 'Disputado';

export interface PartidoResultado {
  id: string;
  sedeId: string;
  fecha: string;
  modalidad: 'Individual' | 'Dobles';
  tipo: 'Amistoso' | 'Competitivo';
  categoria: RankingCategory;
  equipoAIds: string[]; // jugador 1 (y 2 en dobles)
  equipoBIds: string[];
  marcadorSets: string; // ej. "6-4, 3-6, 7-5"
  ganadorEquipo: 'A' | 'B';
  estado: ResultadoEstado;
  eloProcesado: boolean; // Garantiza que solo se ajuste una vez
  deltaEloA?: number;
  reportadoPorId: string;
  motivoDisputa?: string;
}

export interface IncidenciaMantenimiento {
  id: string;
  sedeId: string;
  canchaId: string;
  titulo: string;
  detalle: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: 'Abierta' | 'Resuelta';
  creadaEn: string;
}

export interface Notificacion {
  id: string;
  usuarioId: string; // 'ALL' o id específico
  titulo: string;
  mensaje: string;
  categoria: 'Reserva' | 'Clima' | 'Comunidad' | 'Clase' | 'Ranking' | 'Sistema';
  leida: boolean;
  fechaTexto: string;
}

export interface AuditoriaEntry {
  id: string;
  fecha: string;
  actor: string;
  rol: Role;
  accion: string;
  detalle: string;
  sedeId?: string;
}

export interface AppState {
  currentUserId: string;
  activeSedeId: string;
  isAuthenticated: boolean;
  serviceFeePct: number;
  usuarios: Usuario[];
  organizaciones: Organizacion[];
  sedes: Sede[];
  canchas: Cancha[];
  reservas: Reserva[];
  bloqueos: BloqueoCancha[];
  convocatorias: Convocatoria[];
  planificaciones: PlanificacionGrupo[];
  instructores: Instructor[];
  clases: ClaseProgramada[];
  partidos: PartidoResultado[];
  incidencias: IncidenciaMantenimiento[];
  notificaciones: Notificacion[];
  auditoria: AuditoriaEntry[];
  patrociniosActivos: { id: string; marca: string; ubicacion: string; activo: boolean }[];
}
