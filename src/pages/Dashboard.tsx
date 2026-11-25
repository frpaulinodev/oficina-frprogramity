import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { CATEGORY_COLOR, PRIORITY_SHORT, PRIORITY_STYLE, fmt, sectorName, useMeta } from "../lib/meta";
import { navigate, useOpenCompany, useRefresh } from "../lib/nav";
import { Badge, Button, Empty, HBar, Panel, ScoreBar, Spinner, Stat } from "../components/ui";
import { WorldMap } from "../components/WorldMap";
import { IconBell, IconSearch } from "../components/Icons";

export function Dashboard() {
  const { meta, countries } = useMeta();
  const { tick } = useRefresh();
  const open = useOpenCompany();
  const [d, setD] = useState<any>(null);
  useEffect(() => { api.get("/api/dashboard").then(setD); }, [tick]);
  if (!d) return <div className="py-20 grid place-items-center"><Spinner /></div>;
  const k = d.kpis;
  const countryName = (iso: string) => countries.find((c) => c.iso2 === iso)?.name || iso || "—";
  const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}% del total` : "—");

  if (k.total === 0) {
    return (
      <div className="space-y-5">
        <Panel>
          <div className="py-8 text-center max-w-xl mx-auto">
            <h2 className="text-lg font-semibold">La base está vacía</h2>
            <p className="text-sm text-slate-400 mt-2">Importa tus bloques anteriores de Miami (01 y 02) para que no se repitan, y después lanza una investigación desde fuentes públicas.</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button onClick={() => navigate("exportar", { tab: "importar" })}>Importar bloques previos</Button>
              <Button variant="primary" onClick={() => navigate("investigacion", { country: "US", city: "Miami" })}><IconSearch className="w-3.5 h-3.5" />Investigar Miami</Button>
            </div>
          </div>
        </Panel>
        <Panel title="Cobertura mundial" bodyClass="p-0"><WorldMap countries={countries} onSelect={(iso) => navigate("explorador", { country: iso })} /></Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg bg-ink-900/70 ring-1 ring-line grid grid-cols-2 md:grid-cols-5 2xl:grid-cols-10 divide-x divide-y 2xl:divide-y-0 divide-line">
        <Stat label="Empresas" value={fmt(k.total)} sub={`${fmt(k.verified)} verificadas`} />
        <Stat label="Países" value={fmt(k.countries)} sub={`de ${countries.length}`} />
        <Stat label="Con web" value={fmt(k.with_web)} sub={pct(k.with_web, k.total)} />
        <Stat label="Sin web encontrada" value={fmt(k.without_web)} sub={pct(k.without_web, k.total)} accent />
        <Stat label="Correos" value={fmt(k.emails)} sub="empresariales públicos" />
        <Stat label="Teléfonos" value={fmt(k.phones)} sub="empresariales públicos" />
        <Stat label="Alta prioridad" value={fmt(k.high_priority)} sub="puntuación ≥ 60" accent />
        <Stat label="Por verificar" value={fmt(k.pending_verification)} sub="1 fuente o contradictorios" />
        <Stat label="Contactados" value={fmt(k.contacted)} sub={`${fmt(k.do_not_contact)} no contactar`} />
        <Stat label="Clientes ganados" value={fmt(k.won)} accent />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Cobertura mundial" actions={<Button size="sm" variant="ghost" onClick={() => navigate("explorador")}>Abrir explorador</Button>} bodyClass="p-0">
          <WorldMap countries={countries} onSelect={(iso) => navigate("explorador", { country: iso })} height={400} />
        </Panel>
        <Panel title="Mejores oportunidades" actions={<Button size="sm" variant="ghost" onClick={() => navigate("prospectos", { sort: "score" })}>Ver todas</Button>} bodyClass="p-0">
          <ul className="divide-y divide-line">
            {d.top_prospects.map((p: any) => (
              <li key={p.id}>
                <button onClick={() => open(p.id)} className="w-full text-left px-4 py-2.5 hover:bg-ink-850 grid grid-cols-[minmax(0,1fr)_110px] gap-3 items-center">
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-slate-100 truncate">{p.trade_name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{p.city || "—"}, {countryName(p.country_iso2)} · {sectorName(meta, p.sector)} · Cat. {p.digital_category}</div>
                  </div>
                  <ScoreBar score={p.score} />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Panel title="Por prioridad">
          <HBar rows={["muy_alta", "alta", "media", "baja"].map((p) => ({
            label: meta.priorities[p], value: d.by_priority.find((r: any) => r.k === p)?.n || 0,
            color: { muy_alta: "bg-emerald-400", alta: "bg-sky-400", media: "bg-amber-300", baja: "bg-slate-500" }[p],
          }))} />
        </Panel>
        <Panel title="Diagnóstico digital">
          <HBar rows={Object.keys(meta.categories).map((c) => ({ label: `${c} · ${meta.categories[c]}`, value: d.by_category.find((r: any) => r.k === c)?.n || 0, color: "" }))
            .map((r, i) => ({ ...r, color: ["bg-emerald-400", "bg-sky-400", "bg-violet-400", "bg-blue-400", "bg-slate-500", "bg-slate-600"][i] }))} />
        </Panel>
        <Panel title="Por continente">
          <HBar rows={Object.entries(meta.continents).map(([key, name]) => ({ label: name, value: d.by_continent.find((r: any) => r.k === key)?.n || 0 }))} />
        </Panel>
        <Panel title="Sectores principales">
          <HBar rows={d.by_sector.slice(0, 8).map((r: any) => ({ label: sectorName(meta, r.k), value: r.n }))} color="bg-blue-400" />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Embudo comercial" className="xl:col-span-2">
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
            {Object.entries(meta.commercial_statuses).map(([key, label]) => {
              const n = d.by_commercial_status.find((r: any) => r.k === key)?.n || 0;
              return (
                <button key={key} onClick={() => navigate("prospectos", { commercial_status: key })} className="text-left rounded-md bg-ink-950/60 ring-1 ring-line px-3 py-2.5 hover:ring-blue-500/50">
                  <div className="text-[11px] text-slate-400 leading-tight h-7">{label}</div>
                  <div className="text-lg font-semibold tabular-nums mt-1">{fmt(n)}</div>
                </button>
              );
            })}
          </div>
        </Panel>
        <Panel title={<span className="flex items-center gap-2"><IconBell className="w-3.5 h-3.5 text-emerald-300" />Recordatorios</span>} bodyClass="p-0">
          {d.reminders.length === 0 ? <Empty title="Sin recordatorios pendientes" /> : (
            <ul className="divide-y divide-line">
              {d.reminders.map((r: any) => (
                <li key={r.id}><button onClick={() => open(r.company_id)} className="w-full text-left px-4 py-2.5 hover:bg-ink-850">
                  <div className="text-[13px] text-slate-200">{r.body}</div>
                  <div className="text-[11px] text-slate-500">{r.trade_name} · {r.due_date || "sin fecha"}</div>
                </button></li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Investigaciones recientes" actions={<Button size="sm" variant="ghost" onClick={() => navigate("investigacion")}>Motor de investigación</Button>} bodyClass="p-0">
        {d.recent_jobs.length === 0 ? <Empty title="Aún no hay investigaciones">Lanza la primera desde el motor de investigación.</Empty> : (
          <table className="w-full text-[13px]">
            <tbody className="divide-y divide-line">
              {d.recent_jobs.map((j: any) => (
                <tr key={j.id}>
                  <td className="px-4 py-2 text-slate-400">#{j.id}</td>
                  <td className="py-2">{j.city}, {countryName(j.country_iso2)}</td>
                  <td className="py-2 text-slate-400">{j.sector === "todos" ? "Todos los sectores" : sectorName(meta, j.sector)}</td>
                  <td className="py-2"><Badge className={j.status === "completado" ? PRIORITY_STYLE.muy_alta : j.status === "error" ? "bg-rose-500/10 text-rose-300 ring-rose-400/30" : undefined}>{j.status}</Badge></td>
                  <td className="py-2 tabular-nums text-slate-300 pr-4 text-right">{j.created_count} nuevas · {j.merged_count} fusionadas</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

