import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { fmt, useMeta } from "../lib/meta";
import { navigate, useOpenCompany, useRefresh } from "../lib/nav";
import { Empty, HBar, Panel, Spinner, Stat } from "../components/ui";
import * as I from "../components/Icons";

const money = (n: number) => "$" + Math.round(n).toLocaleString("es");

export function Results() {
  const { countries } = useMeta();
  const { tick } = useRefresh();
  const open = useOpenCompany();
  const [d, setD] = useState<any>(null);
  useEffect(() => { api.get("/api/results").then(setD); }, [tick]);
  if (!d) return <div className="py-20 grid place-items-center"><Spinner /></div>;
  const cname = (iso: string) => countries.find((c) => c.iso2 === iso)?.name || iso || "—";
  const maxMonth = Math.max(1, ...d.by_month.map((m: any) => m.revenue));

  return (
    <div className="space-y-5">
      <section className="rounded-xl glass-panel grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 divide-x divide-y xl:divide-y-0 divide-line">
        <Stat label="Contactados" value={fmt(d.contacted)} icon={<I.IconMail className="w-3.5 h-3.5" />} sub="primer contacto o más" />
        <Stat label="Respondieron" value={fmt(d.replied)} icon={<I.IconBell className="w-3.5 h-3.5" />} sub={`${d.reply_rate}% de los contactados`} />
        <Stat label="Clientes ganados" value={fmt(d.won)} icon={<I.IconCheck className="w-3.5 h-3.5" />} sub={`${d.win_rate}% de los contactados`} accent />
        <Stat label="Ingresos" value={money(d.revenue)} icon={<I.IconTag className="w-3.5 h-3.5" />} sub="tratos ganados" accent />
        <Stat label="Ticket promedio" value={money(d.avg_deal)} icon={<I.IconLayers className="w-3.5 h-3.5" />} sub="por cliente ganado" />
        <Stat label="En negociación" value={money(d.pipeline)} icon={<I.IconPipeline className="w-3.5 h-3.5" />} sub="interesados y propuestas" />
      </section>

      {d.contacted === 0 && (
        <Panel>
          <Empty title="Aún no hay ventas registradas">
            Cuando contactes a una empresa, márcala como contactada en su ficha. Al cerrar una venta, cambia su estado a “Cliente ganado” y escribe el valor del trato: aquí verás tus resultados por país y por servicio.
          </Empty>
        </Panel>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Resultados por país" bodyClass="p-0">
          {d.by_country.length === 0 ? <Empty title="Sin datos todavía" /> : (
            <table className="w-full text-[13px]">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-line">
                <tr><th className="text-left font-medium px-4 py-2">País</th><th className="text-right font-medium">Contactados</th><th className="text-right font-medium">Respondieron</th><th className="text-right font-medium">Ganados</th><th className="text-right font-medium px-4">Ingresos</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {d.by_country.map((r: any) => (
                  <tr key={r.k} className="hover:bg-white/[0.03] cursor-pointer" onClick={() => navigate("prospectos", { country: r.k })}>
                    <td className="px-4 py-2 text-slate-100">{cname(r.k)}</td>
                    <td className="text-right tabular-nums">{r.contacted}</td>
                    <td className="text-right tabular-nums">{r.replied} <span className="text-slate-500 text-[11px]">({r.contacted ? Math.round((100 * r.replied) / r.contacted) : 0}%)</span></td>
                    <td className="text-right tabular-nums text-emerald-300">{r.won}</td>
                    <td className="text-right tabular-nums px-4 font-semibold">{money(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
        <Panel title="Ingresos por servicio">
          {d.by_service.length === 0 ? <Empty title="Sin ventas todavía" /> : (
            <HBar rows={d.by_service.map((r: any) => ({ label: `${r.k} · ${r.won} venta${r.won === 1 ? "" : "s"}`, value: Math.round(r.revenue) }))} color="bg-emerald-400" />
          )}
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Ingresos por mes">
          {d.by_month.length === 0 ? <Empty title="Sin ventas todavía" /> : (
            <div className="h-48 flex items-end gap-3">
              {d.by_month.map((m: any) => (
                <div key={m.k} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <div className="text-[11px] tabular-nums text-slate-300">{money(m.revenue)}</div>
                  <div className="w-full rounded-t-md bg-gradient-to-t from-blue-700 to-emerald-400 shadow-[0_0_18px_-4px_rgba(52,211,153,.6)]" style={{ height: `${Math.max(4, (140 * m.revenue) / maxMonth)}px` }} />
                  <div className="text-[11px] text-slate-500">{m.k}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Últimos clientes ganados" bodyClass="p-0">
          {d.recent_won.length === 0 ? <Empty title="Aún no hay clientes ganados">¡El primero está cerca!</Empty> : (
            <ul className="divide-y divide-line">
              {d.recent_won.map((c: any) => (
                <li key={c.id}><button onClick={() => open(c.id)} className="w-full text-left px-4 py-2.5 hover:bg-white/[0.03] flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg grid place-items-center bg-emerald-400/10 ring-1 ring-emerald-400/30 text-emerald-300"><I.IconCheck className="w-4 h-4" /></span>
                  <div className="min-w-0 flex-1"><div className="text-[13px] text-slate-100 truncate">{c.trade_name}</div><div className="text-[11px] text-slate-500">{c.city || "—"}, {cname(c.country_iso2)} · {c.deal_service || "Servicio sin definir"}</div></div>
                  <div className="text-[13px] font-semibold tabular-nums text-emerald-300">{c.deal_value ? money(c.deal_value) : "—"}</div>
                </button></li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
