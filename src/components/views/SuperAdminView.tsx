import React from 'react';
import {
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Globe,
  Scale,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HeaderBar } from '../HeaderBar';
import { PlayerAvatar } from '../VisualAssets';

export type SuperAdminTab = 'dashboard' | 'organizaciones' | 'disputas' | 'config';

interface SuperAdminViewProps {
  activeTab: SuperAdminTab;
  onChangeTab: (tab: SuperAdminTab) => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onOpenChat: () => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  activeTab,
  onOpenMenu,
  onOpenNotifications,
  onOpenChat,
}) => {
  const {
    state,
    switchRole,
    toggleOrganizationStatus,
    verifyProUser,
    resolveDisputedMatch,
    updateServiceFee,
    togglePatrocinio,
    resetDemoData,
    showToast,
  } = useApp();

  const totalIngresosBrutos = state.reservas
    .filter((r) => r.pagoEstado === 'Aprobado')
    .reduce((sum, r) => sum + r.totalPagado, 0);
  const totalComisiones = state.reservas
    .filter((r) => r.pagoEstado === 'Aprobado')
    .reduce((sum, r) => sum + r.cargoServicio, 0);

  const disputedMatches = state.partidos.filter((m) => m.estado === 'Disputado');

  const exportNationalCSV = () => {
    const lines = [
      'Fecha,Actor,Rol,Accion,Detalle',
      ...state.auditoria.map((a) => `${a.fecha},"${a.actor}",${a.rol},"${a.accion}","${a.detalle}"`),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auditoria_nacional_tenis_panama.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Auditoría nacional exportada en CSV');
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9]">
      <HeaderBar
        variant="lines"
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
        onOpenChat={onOpenChat}
      >
        <div className="pb-1">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#B6E22E] px-2.5 py-0.5 text-[10px] font-extrabold text-[#16223B]">
              OPERADOR NACIONAL · PANAMÁ
            </span>
            <button
              type="button"
              onClick={() => switchRole('jugador')}
              className="text-[11px] font-bold text-[#ACD638] cursor-pointer"
            >
              Ver Jugador
            </button>
          </div>
          <h1 className="mt-1.5 text-2xl font-extrabold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#ACD638]" />
            Superadministración
          </h1>
          <p className="text-xs text-white/80">
            Operación nacional, organizaciones, disputas y auditoría
          </p>
        </div>
      </HeaderBar>

      <div className="flex-1 p-4 space-y-4 pb-8">
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100">
                <span className="text-[11px] text-slate-500">Sedes afiliadas</span>
                <span className="block text-2xl font-extrabold text-[#1E2B45] tabular-nums">
                  {state.sedes.length}
                </span>
                <span className="text-[10.5px] font-bold text-[#5E8210]">
                  {state.canchas.length} canchas registradas
                </span>
              </div>
              <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100">
                <span className="text-[11px] text-slate-500">Ingresos brutos demo</span>
                <span className="block text-2xl font-extrabold text-[#1E2B45] tabular-nums">
                  B/. {totalIngresosBrutos.toFixed(2)}
                </span>
                <span className="text-[10.5px] font-bold text-[#273758] tabular-nums">
                  Comisión plataforma: B/. {totalComisiones.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2">
              <h2 className="text-sm font-extrabold text-[#1E2B45]">Verificación de jugadores Pro</h2>
              {state.usuarios
                .filter((u) => u.categoria === 'Profesional' && u.rol === 'jugador')
                .map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <PlayerAvatar
                        nombre={u.nombre}
                        seed={u.avatarSeed}
                        avatarUrl={u.avatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-[#1E2B45] truncate block">{u.nombre}</span>
                        <span className="block text-[10.5px] text-slate-500">
                          Elo Pro: {u.elo.Profesional}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => verifyProUser(u.id)}
                      className={`rounded-xl px-3 py-1.5 font-bold cursor-pointer ${
                        u.verificadoPro ? 'bg-[#B6E22E] text-[#16223B]' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {u.verificadoPro ? 'Verificado' : 'Verificar'}
                    </button>
                  </div>
                ))}
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#1E2B45]">Auditoría reciente</h2>
                <button
                  type="button"
                  onClick={exportNationalCSV}
                  className="text-xs font-bold text-[#5E8210] inline-flex items-center gap-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
              <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                {state.auditoria.slice(0, 6).map((a) => (
                  <div key={a.id} className="py-2 text-xs">
                    <div className="flex justify-between font-bold text-[#1E2B45]">
                      <span>{a.accion}</span>
                      <span className="text-[10px] text-slate-400 tabular-nums">{a.fecha}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {a.actor} ({a.rol}) · {a.detalle}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'organizaciones' && (
          <div className="space-y-2.5">
            <h2 className="text-base font-extrabold text-[#1E2B45]">Organizaciones afiliadas</h2>
            {state.organizaciones.map((org) => (
              <div key={org.id} className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-[#1E2B45] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#273758]" />
                    {org.nombre}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {org.tipo} · {org.provincia} · Plan {org.planComercial} ({org.comisionPct}%)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleOrganizationStatus(org.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-extrabold cursor-pointer ${
                    org.activa ? 'bg-[#B6E22E] text-[#16223B]' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {org.activa ? 'Activa' : 'Suspendida'}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'disputas' && (
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-[#1E2B45] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#273758]" />
              Disputas de resultados ({disputedMatches.length})
            </h2>
            {disputedMatches.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center text-xs text-slate-500">
                No hay resultados en disputa pendientes.
              </div>
            ) : (
              disputedMatches.map((m) => {
                const userA = state.usuarios.find((u) => u.id === m.equipoAIds[0]);
                const userB = state.usuarios.find((u) => u.id === m.equipoBIds[0]);
                const pA = userA?.nombre || 'A';
                const pB = userB?.nombre || 'B';
                return (
                  <div key={m.id} className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs font-extrabold text-[#1E2B45]">
                      <PlayerAvatar
                        nombre={pA}
                        seed={userA?.avatarSeed}
                        avatarUrl={userA?.avatarUrl}
                        size="xs"
                      />
                      <span>{pA}</span>
                      <span className="text-slate-400 font-semibold">vs</span>
                      <PlayerAvatar
                        nombre={pB}
                        seed={userB?.avatarSeed}
                        avatarUrl={userB?.avatarUrl}
                        size="xs"
                      />
                      <span>{pB}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono">{m.marcadorSets}</span>
                    </div>
                    <p className="text-xs text-rose-700">{m.motivoDisputa}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => resolveDisputedMatch(m.id, 'A')}
                        className="flex-1 rounded-xl bg-[#B6E22E] py-2 text-xs font-extrabold text-[#16223B] cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                        Confirmar ganador {pA}
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveDisputedMatch(m.id, 'B')}
                        className="flex-1 rounded-xl bg-[#273758] py-2 text-xs font-bold text-white cursor-pointer"
                      >
                        Confirmar ganador {pB}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2.5">
              <h2 className="text-sm font-extrabold text-[#1E2B45] flex items-center gap-1.5">
                <Settings className="w-4 h-4" />
                Comisión de servicio demo ({state.serviceFeePct}%)
              </h2>
              <div className="flex gap-2">
                {[0, 5, 8, 10].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => updateServiceFee(pct)}
                    className={`flex-1 rounded-xl py-2 text-xs font-extrabold cursor-pointer ${
                      state.serviceFeePct === pct
                        ? 'bg-[#B6E22E] text-[#16223B]'
                        : 'bg-[#F4F6F9] text-[#1E2B45]'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-2">
              <h2 className="text-sm font-extrabold text-[#1E2B45] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#273758]" />
                Espacios de patrocinio (Módulo futuro)
              </h2>
              {state.patrociniosActivos.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs py-1">
                  <div>
                    <span className="font-bold text-[#1E2B45]">{p.marca}</span>
                    <span className="block text-[10.5px] text-slate-500">{p.ubicacion}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePatrocinio(p.id)}
                    className={`rounded-xl px-3 py-1 font-bold cursor-pointer ${
                      p.activo ? 'bg-[#B6E22E] text-[#16223B]' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {p.activo ? 'Habilitado' : 'Inactivo'}
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={resetDemoData}
              className="w-full rounded-2xl bg-white border border-slate-200 py-3 text-xs font-bold text-[#273758] cursor-pointer"
            >
              Reiniciar todos los datos de demostración
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
