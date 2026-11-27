import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Crown,
  GraduationCap,
  Info,
  Plus,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import type { RankingCategory } from '../../../types/tennis';
import { getLeaderboard } from '../../../utils/tennisLogic';
import { HeaderBar } from '../../HeaderBar';
import { PlayerAvatar } from '../../VisualAssets';

interface MatchesRankingViewProps {
  initialMode?: 'ranking' | 'partidos';
  onBack?: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onOpenChat: () => void;
}

export const MatchesRankingView: React.FC<MatchesRankingViewProps> = ({
  initialMode = 'ranking',
  onBack,
  onOpenMenu,
  onOpenNotifications,
  onOpenChat,
}) => {
  const {
    state,
    currentUser,
    reportMatchResult,
    confirmMatchResult,
    disputeMatchResult,
  } = useApp();

  const [mode, setMode] = useState<'ranking' | 'partidos'>(initialMode);
  const [category, setCategory] = useState<RankingCategory>(currentUser.categoria || 'Amateur');
  const [sedeFilter, setSedeFilter] = useState<string>('ALL');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEloInfo, setShowEloInfo] = useState(false);

  // Report match form
  const rivals = state.usuarios.filter(
    (u) => u.rol === 'jugador' && u.id !== currentUser.id
  );
  const [rivalId, setRivalId] = useState(rivals[0]?.id || '');
  const [matchTipo, setMatchTipo] = useState<'Competitivo' | 'Amistoso'>('Competitivo');
  const [matchMod, setMatchMod] = useState<'Individual' | 'Dobles'>('Individual');
  const [marcador, setMarcador] = useState('6-4, 6-3');
  const [ganador, setGanador] = useState<'A' | 'B'>('A');
  const [sedeId, setSedeId] = useState(state.sedes[0].id);

  const leaderboard = useMemo(
    () => getLeaderboard(state.usuarios, category, sedeFilter, state.reservas),
    [state.usuarios, category, sedeFilter, state.reservas]
  );

  const myIndex = leaderboard.findIndex((u) => u.id === currentUser.id);
  const myRankPos = myIndex >= 0 ? myIndex + 1 : null;

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reportMatchResult({
      sedeId,
      modalidad: matchMod,
      tipo: matchTipo,
      categoria: currentUser.categoria,
      rivalId,
      marcadorSets: marcador,
      ganadorEquipo: ganador,
    });
    setShowReportModal(false);
    setMode('partidos');
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9]">
      <HeaderBar
        variant="lines"
        onBack={onBack}
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
        onOpenChat={onOpenChat}
      >
        <div className="pb-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-[#ACD638]" />
                <span>{mode === 'ranking' ? 'Ranking' : 'Partidos y resultados'}</span>
              </h1>
              <button
                type="button"
                onClick={() => setShowEloInfo((v) => !v)}
                className="text-xs text-white/85 flex items-center gap-1 mt-0.5 cursor-pointer"
              >
                <span>Clasificación demo (Elo 1500 · no federativa)</span>
                <Info className="w-3.5 h-3.5 text-[#ACD638]" />
              </button>
            </div>
            <div className="bg-white/10 p-1 rounded-xl flex gap-1">
              <button
                type="button"
                onClick={() => setMode('ranking')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  mode === 'ranking' ? 'bg-[#B6E22E] text-[#16223B]' : 'text-white'
                }`}
              >
                Ranking
              </button>
              <button
                type="button"
                onClick={() => setMode('partidos')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  mode === 'partidos' ? 'bg-[#B6E22E] text-[#16223B]' : 'text-white'
                }`}
              >
                Partidos
              </button>
            </div>
          </div>

          {showEloInfo && (
            <div className="mt-2 rounded-2xl bg-white/15 backdrop-blur-sm p-3 text-[11px] text-white">
              Reglas de demostración: categorías Junior, Amateur y Profesional independientes. Elo inicial 1500 (K=32 individual). Solo los partidos competitivos confirmados ajustan puntos una vez; amistosos y disputados no alteran la tabla.
            </div>
          )}

          {mode === 'ranking' && (
            <>
              <div className="mt-3 rounded-full bg-white p-1 grid grid-cols-3 gap-1 shadow-sm">
                {(
                  [
                    { id: 'Junior', icon: GraduationCap },
                    { id: 'Amateur', icon: Users },
                    { id: 'Profesional', icon: Crown },
                  ] as const
                ).map((cat) => {
                  const Icon = cat.icon;
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`rounded-full py-2 text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        active
                          ? 'bg-[#B6E22E] text-[#16223B]'
                          : 'text-[#273758] hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.id}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <select
                  aria-label="Filtrar ranking por club"
                  value={sedeFilter}
                  onChange={(e) => setSedeFilter(e.target.value)}
                  className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#1E2B45]"
                >
                  <option value="ALL">Todos los clubes</option>
                  {state.sedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
                <div className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#1E2B45] flex items-center justify-center">
                  Temporada Nov 2026
                </div>
              </div>
            </>
          )}
        </div>
      </HeaderBar>

      <div className="flex-1 p-4 space-y-3.5 pb-8">
        {mode === 'ranking' ? (
          <>
            {/* My Position Highlight Card */}
            <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="text-center pr-2 border-r border-slate-100">
                  <span className="block text-[9.5px] font-bold text-slate-400">MI POSICIÓN</span>
                  <span className="block text-2xl font-extrabold text-[#1E2B45] tabular-nums">
                    {myRankPos ? `#${myRankPos}` : '—'}
                  </span>
                </div>
                <PlayerAvatar
                  nombre={currentUser.nombre}
                  seed={currentUser.avatarSeed}
                  avatarUrl={currentUser.avatarUrl}
                  size="md"
                  ringLime
                />
                <div>
                  <h2 className="text-sm font-extrabold text-[#1E2B45]">{currentUser.nombre}</h2>
                  <p className="text-[11px] text-slate-500">Categoría: {currentUser.categoria}</p>
                  <p className="text-[11px] font-bold text-[#1E2B45] tabular-nums mt-0.5">
                    {currentUser.elo[category] ?? 1500} pts ·{' '}
                    <span className="text-[#5E8210]">G {currentUser.ganados}</span>{' '}
                    <span className="text-rose-600">P {currentUser.perdidos}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="rounded-xl bg-[#B6E22E] px-3 py-2 text-[11px] font-extrabold text-[#16223B] shrink-0 cursor-pointer"
              >
                + Resultado
              </button>
            </div>

            {category === 'Junior' && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-[11px] text-blue-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Clasificación juvenil independiente con perfiles limitados y gestión de tutor.
              </div>
            )}
            {category === 'Profesional' && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-900 flex items-center gap-2">
                <Award className="w-4 h-4 shrink-0" />
                Acceso sujeto a verificación administrativa de la plataforma.
              </div>
            )}

            {/* Leaderboard Table */}
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#1E2B45]">
                  Ranking {category}
                </h3>
                <span className="text-[10.5px] text-slate-400">Elo simplificado</span>
              </div>

              <div className="grid grid-cols-12 px-3 py-2 bg-[#F4F6F9] text-[10.5px] font-bold text-slate-500">
                <span className="col-span-1">#</span>
                <span className="col-span-5">Jugador</span>
                <span className="col-span-2 text-center">G / P</span>
                <span className="col-span-2 text-center">Efec.</span>
                <span className="col-span-2 text-right">Puntos</span>
              </div>

              <div className="divide-y divide-slate-100">
                {leaderboard.map((u, idx) => {
                  const isMe = u.id === currentUser.id;
                  const total = u.ganados + u.perdidos;
                  const eff = total > 0 ? Math.round((u.ganados / total) * 100) : 0;
                  const pts = u.elo[category] ?? 1500;
                  return (
                    <div
                      key={u.id}
                      className={`grid grid-cols-12 items-center px-3 py-2.5 text-xs ${
                        isMe ? 'bg-[#F4FCE1]' : 'bg-white'
                      }`}
                    >
                      <span className="col-span-1 font-extrabold text-[#1E2B45] tabular-nums">
                        {idx + 1}
                      </span>
                      <div className="col-span-5 flex items-center gap-2 min-w-0">
                        <PlayerAvatar nombre={u.nombre} seed={u.avatarSeed} avatarUrl={u.avatarUrl} size="xs" />
                        <div className="min-w-0">
                          <span className="block font-bold text-[#1E2B45] truncate">
                            {u.esMenor ? `${u.nombre.split(' ')[0]} (Jr)` : u.nombre}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            {u.verificadoPro ? 'Verificado Pro' : `Nivel: ${u.nivel}`}
                          </span>
                        </div>
                      </div>
                      <span className="col-span-2 text-center font-semibold text-slate-600 tabular-nums">
                        {u.ganados}/{u.perdidos}
                      </span>
                      <span className="col-span-2 text-center font-semibold text-slate-600 tabular-nums">
                        {eff}%
                      </span>
                      <div className="col-span-2 text-right">
                        <span
                          className={`inline-block rounded-lg px-2 py-0.5 text-[11px] font-extrabold tabular-nums ${
                            isMe ? 'bg-[#B6E22E] text-[#16223B]' : 'bg-[#F4F6F9] text-[#273758]'
                          }`}
                        >
                          {pts}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* Partidos y Resultados */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#1E2B45]">Resultados registrados</h2>
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="rounded-xl bg-[#B6E22E] px-3 py-2 text-xs font-extrabold text-[#16223B] inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar marcador
              </button>
            </div>

            {state.partidos.map((p) => {
              const userA = state.usuarios.find((u) => u.id === p.equipoAIds[0]);
              const userB = state.usuarios.find((u) => u.id === p.equipoBIds[0]);
              const pA = userA?.nombre || 'Equipo A';
              const pB = userB?.nombre || 'Equipo B';
              const sede = state.sedes.find((s) => s.id === p.sedeId);

              return (
                <div
                  key={p.id}
                  className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-500">
                      {p.tipo} · {p.modalidad} · {p.categoria}
                    </span>
                    <span
                      className={`font-extrabold ${
                        p.estado === 'Confirmado'
                          ? 'text-[#4E7006]'
                          : p.estado === 'Disputado'
                            ? 'text-rose-600'
                            : 'text-amber-600'
                      }`}
                    >
                      {p.estado}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap text-xs font-extrabold text-[#1E2B45]">
                      <PlayerAvatar
                        nombre={pA}
                        seed={userA?.avatarSeed}
                        avatarUrl={userA?.avatarUrl}
                        size="xs"
                      />
                      <span className="truncate">{pA}</span>
                      <span className="text-slate-400 font-semibold">vs</span>
                      <PlayerAvatar
                        nombre={pB}
                        seed={userB?.avatarSeed}
                        avatarUrl={userB?.avatarUrl}
                        size="xs"
                      />
                      <span className="truncate">{pB}</span>
                    </div>
                    <span className="shrink-0 rounded-xl bg-[#F4F6F9] px-2.5 py-1 text-xs font-mono font-extrabold text-[#273758]">
                      {p.marcadorSets}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    {sede?.nombre} · {p.fecha} · Ganador: Equipo {p.ganadorEquipo}
                    {p.eloProcesado && p.deltaEloA !== undefined && (
                      <span className="text-[#4E7006] font-bold">
                        {' '}
                        (Elo +{Math.abs(p.deltaEloA)} aplicado)
                      </span>
                    )}
                  </p>

                  {p.motivoDisputa && (
                    <p className="rounded-xl bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {p.motivoDisputa}
                    </p>
                  )}

                  {p.estado === 'Pendiente' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => confirmMatchResult(p.id)}
                        className="flex-1 rounded-xl bg-[#B6E22E] py-2 text-xs font-extrabold text-[#16223B] inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirmar resultado
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          disputeMatchResult(p.id, 'Contraparte solicita revisión de marcador.')
                        }
                        className="flex-1 rounded-xl border border-rose-200 py-2 text-xs font-bold text-rose-700 cursor-pointer"
                      >
                        Disputar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Match Result Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <form
            onSubmit={handleReportSubmit}
            className="w-full max-w-[390px] rounded-3xl bg-white p-5 space-y-3"
          >
            <h3 className="text-base font-extrabold text-[#1E2B45]">Registrar marcador de partido</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#1E2B45] mb-1">Tipo</label>
                <select
                  value={matchTipo}
                  onChange={(e) => setMatchTipo(e.target.value as 'Competitivo' | 'Amistoso')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  <option value="Competitivo">Competitivo (Elo)</option>
                  <option value="Amistoso">Amistoso (sin puntos)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E2B45] mb-1">Modalidad</label>
                <select
                  value={matchMod}
                  onChange={(e) => setMatchMod(e.target.value as 'Individual' | 'Dobles')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  <option value="Individual">Individual</option>
                  <option value="Dobles">Dobles</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E2B45] mb-1">Rival</label>
              <select
                value={rivalId}
                onChange={(e) => setRivalId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                {rivals.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} ({r.categoria})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E2B45] mb-1">Sede</label>
              <select
                value={sedeId}
                onChange={(e) => setSedeId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                {state.sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#1E2B45] mb-1">Marcador por sets</label>
                <input
                  type="text"
                  value={marcador}
                  onChange={(e) => setMarcador(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E2B45] mb-1">Ganador</label>
                <select
                  value={ganador}
                  onChange={(e) => setGanador(e.target.value as 'A' | 'B')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  <option value="A">Yo ({currentUser.nombre.split(' ')[0]})</option>
                  <option value="B">Rival</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#B6E22E] py-2.5 text-xs font-extrabold text-[#16223B]"
              >
                Guardar marcador
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
