import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, GraduationCap, Plus, Users, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEMO_DATES, TIME_SLOTS } from '../../data/seedData';
import type { ClaseProgramada } from '../../types/tennis';
import { formatHour12 } from '../../utils/tennisLogic';
import { HeaderBar } from '../HeaderBar';
import { PlayerAvatar } from '../VisualAssets';

export type InstructorTab = 'inicio' | 'agenda' | 'alumnos' | 'ingresos' | 'perfil';

interface InstructorViewProps {
  activeTab: InstructorTab;
  onChangeTab: (tab: InstructorTab) => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onOpenChat: () => void;
}

export const InstructorView: React.FC<InstructorViewProps> = ({
  activeTab,
  onOpenMenu,
  onOpenNotifications,
  onOpenChat,
}) => {
  const {
    state,
    currentUser,
    switchRole,
    toggleClassAttendance,
    createInstructorClass,
    updateInstructorProfile,
    logout,
  } = useApp();

  const instProfile =
    state.instructores.find((i) => i.usuarioId === currentUser.id) || state.instructores[0];
  const myClases = state.clases.filter((c) => c.instructorId === instProfile.id);

  const [newTitulo, setNewTitulo] = useState('Clínica de Saque y Volea');
  const [newTipo, setNewTipo] = useState<ClaseProgramada['tipo']>('Grupal');
  const [newSedeId, setNewSedeId] = useState(instProfile.sedesAutorizadas[0] || state.sedes[0].id);
  const [newCanchaId, setNewCanchaId] = useState(
    state.canchas.find((c) => c.sedeId === newSedeId && c.estado === 'Disponible')?.id || ''
  );
  const [newFecha, setNewFecha] = useState(DEMO_DATES[0].iso);
  const [newHora, setNewHora] = useState('15:00');
  const [formErr, setFormErr] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const totalAlumnos = myClases.reduce((s, c) => s + c.alumnosIds.length, 0);
  const totalIngresos = myClases.reduce(
    (s, c) => s + c.precioPorCupo * c.alumnosIds.length,
    0
  );

  const handleToggleSlot = (slot: string) => {
    const exists = instProfile.horariosDisponibles.includes(slot);
    const next = exists
      ? instProfile.horariosDisponibles.filter((h) => h !== slot)
      : [...instProfile.horariosDisponibles, slot].sort();
    updateInstructorProfile(instProfile.id, { horariosDisponibles: next });
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9]">
      <HeaderBar
        variant="net"
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
        onOpenChat={onOpenChat}
      >
        <div className="pb-1">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#B6E22E] px-2.5 py-0.5 text-[10px] font-extrabold text-[#16223B]">
              PORTAL INSTRUCTOR
            </span>
            <button
              type="button"
              onClick={() => switchRole('jugador')}
              className="text-[11px] font-bold text-[#ACD638] cursor-pointer"
            >
              Cambiar a Jugador
            </button>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <PlayerAvatar
              nombre={instProfile.nombre}
              seed={instProfile.avatarSeed}
              size="lg"
              isInstructor
              ringLime
            />
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-white leading-tight truncate">
                {instProfile.nombre}
              </h1>
              <p className="text-xs text-white/80 truncate">{instProfile.titulo}</p>
            </div>
          </div>
        </div>
      </HeaderBar>

      <div className="flex-1 p-4 space-y-4 pb-8">
        {activeTab === 'inicio' && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white p-3 shadow-sm text-center">
                <GraduationCap className="w-4 h-4 text-[#273758] mx-auto" />
                <span className="mt-1 block text-lg font-extrabold text-[#1E2B45] tabular-nums">
                  {myClases.length}
                </span>
                <span className="text-[10px] text-slate-500">Clases activas</span>
              </div>
              <div className="rounded-2xl bg-white p-3 shadow-sm text-center">
                <Users className="w-4 h-4 text-[#6E9214] mx-auto" />
                <span className="mt-1 block text-lg font-extrabold text-[#1E2B45] tabular-nums">
                  {totalAlumnos}
                </span>
                <span className="text-[10px] text-slate-500">Alumnos</span>
              </div>
              <div className="rounded-2xl bg-white p-3 shadow-sm text-center">
                <Wallet className="w-4 h-4 text-[#273758] mx-auto" />
                <span className="mt-1 block text-lg font-extrabold text-[#1E2B45] tabular-nums">
                  B/. {totalIngresos.toFixed(0)}
                </span>
                <span className="text-[10px] text-slate-500">Ingresos demo</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="w-full rounded-2xl bg-[#B6E22E] py-3 text-sm font-extrabold text-[#16223B] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Crear nueva clase individual o grupal
            </button>

            <div className="space-y-2.5">
              <h2 className="text-sm font-extrabold text-[#1E2B45]">Próximas clases</h2>
              {myClases.map((cl) => {
                const sede = state.sedes.find((s) => s.id === cl.sedeId);
                const cancha = state.canchas.find((c) => c.id === cl.canchaId);
                return (
                  <div key={cl.id} className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 space-y-2">
                    <div className="flex justify-between">
                      <div>
                        <span className="text-[10.5px] font-bold text-[#5E8210]">{cl.tipo}</span>
                        <h3 className="text-sm font-extrabold text-[#1E2B45]">{cl.titulo}</h3>
                        <p className="text-xs text-slate-500">
                          {sede?.nombre} ({cancha?.nombre}) · {cl.fecha} {formatHour12(cl.horaInicio)}
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-[#273758] tabular-nums">
                        {cl.alumnosIds.length}/{cl.cupoMax}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'agenda' && (
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-3">
            <h2 className="text-sm font-extrabold text-[#1E2B45] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#273758]" />
              Disponibilidad publicada
            </h2>
            <p className="text-xs text-slate-500">
              Activa o desactiva tus franjas horarias disponibles para alumnos.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => {
                const active = instProfile.horariosDisponibles.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleToggleSlot(slot)}
                    className={`rounded-xl py-2 text-xs font-bold tabular-nums cursor-pointer ${
                      active
                        ? 'bg-[#B6E22E] text-[#16223B]'
                        : 'bg-[#F4F6F9] text-slate-500'
                    }`}
                  >
                    {formatHour12(slot)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'alumnos' && (
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-[#1E2B45]">Control de asistencia</h2>
            {myClases.map((cl) => (
              <div key={cl.id} className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2.5">
                <h3 className="text-sm font-extrabold text-[#1E2B45]">{cl.titulo}</h3>
                {cl.alumnosIds.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin alumnos inscritos todavía.</p>
                ) : (
                  cl.alumnosIds.map((uid) => {
                    const u = state.usuarios.find((x) => x.id === uid);
                    const present = cl.asistenciaIds.includes(uid);
                    return (
                      <div key={uid} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <PlayerAvatar nombre={u?.nombre || 'Alumno'} seed={u?.avatarSeed} avatarUrl={u?.avatarUrl} size="xs" />
                          <span className="font-bold text-[#1E2B45]">{u?.nombre}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleClassAttendance(cl.id, uid)}
                          className={`rounded-xl px-3 py-1.5 font-bold inline-flex items-center gap-1 cursor-pointer ${
                            present ? 'bg-[#B6E22E] text-[#16223B]' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {present ? 'Asistió' : 'Marcar'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ingresos' && (
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2">
            <h2 className="text-sm font-extrabold text-[#1E2B45]">Ingresos simulados</h2>
            <p className="text-2xl font-extrabold text-[#273758] tabular-nums">
              B/. {totalIngresos.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500">
              Cobros de demostración acumulados por {totalAlumnos} inscripciones en clases.
            </p>
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex items-center gap-3">
              <PlayerAvatar
                nombre={instProfile.nombre}
                seed={instProfile.avatarSeed}
                size="lg"
                shape="rounded"
                isInstructor
              />
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-[#1E2B45] truncate">
                  {instProfile.nombre}
                </h2>
                <p className="text-xs text-slate-500 truncate">{instProfile.titulo}</p>
                <p className="text-[11px] font-bold text-[#5E8210] mt-0.5">
                  ★ {instProfile.rating} · {instProfile.certificaciones.join(' · ')}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2">
              <h2 className="text-sm font-extrabold text-[#1E2B45]">Tarifa base por hora</h2>
              <div className="flex items-center gap-2">
                {[25, 30, 35, 40].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => updateInstructorProfile(instProfile.id, { precioBase: rate })}
                    className={`flex-1 rounded-xl py-2 text-xs font-extrabold cursor-pointer ${
                      instProfile.precioBase === rate
                        ? 'bg-[#B6E22E] text-[#16223B]'
                        : 'bg-[#F4F6F9] text-[#1E2B45]'
                    }`}
                  >
                    B/. {rate}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-2xl bg-white border border-rose-200 py-3 text-xs font-bold text-rose-700"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-5 space-y-3">
            <h3 className="text-base font-extrabold text-[#1E2B45]">Nueva clase</h3>
            <input
              type="text"
              value={newTitulo}
              onChange={(e) => setNewTitulo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newTipo}
                onChange={(e) => setNewTipo(e.target.value as ClaseProgramada['tipo'])}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                <option value="Grupal">Grupal</option>
                <option value="Individual">Individual</option>
                <option value="Junior">Junior</option>
              </select>
              <select
                value={newSedeId}
                onChange={(e) => {
                  const sid = e.target.value;
                  setNewSedeId(sid);
                  setNewCanchaId(
                    state.canchas.find((c) => c.sedeId === sid && c.estado === 'Disponible')?.id || ''
                  );
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                {instProfile.sedesAutorizadas.map((sid) => (
                  <option key={sid} value={sid}>
                    {state.sedes.find((s) => s.id === sid)?.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newFecha}
                onChange={(e) => setNewFecha(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                {DEMO_DATES.map((d) => (
                  <option key={d.iso} value={d.iso}>
                    {d.label}
                  </option>
                ))}
              </select>
              <select
                value={newHora}
                onChange={(e) => setNewHora(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {formatHour12(t)}
                  </option>
                ))}
              </select>
            </div>
            {formErr && <p className="text-xs font-bold text-rose-600">{formErr}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = createInstructorClass({
                    sedeId: newSedeId,
                    canchaId: newCanchaId,
                    titulo: newTitulo,
                    tipo: newTipo,
                    fecha: newFecha,
                    horaInicio: newHora,
                    duracionMin: 60,
                    precioPorCupo: instProfile.precioBase,
                    cupoMax: newTipo === 'Individual' ? 1 : 6,
                  });
                  if (!res.ok) setFormErr(res.error || 'Horario no disponible');
                  else setShowCreate(false);
                }}
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B]"
              >
                Publicar clase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
