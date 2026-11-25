import { useEffect, useState } from "react";
import { api, qs } from "../lib/api";
import { PRIORITY_SHORT, PRIORITY_STYLE, STATUS_GROUP, fmt, sectorName, useMeta } from "../lib/meta";
import { navigate, useOpenCompany, useRefresh } from "../lib/nav";
import { Badge, Select, cx, toast } from "../components/ui";

const DOT: Record<string, string> = { slate: "bg-slate-400", sky: "bg-sky-400", blue: "bg-blue-500", emerald: "bg-emerald-400", green: "bg-green-400", rose: "bg-rose-400" };

export function Pipeline() {
  const { meta, countries } = useMeta();
  const { tick, bump } = useRefresh();
  const open = useOpenCompany();
  const [country, setCountry] = useState("");
  const [cols, setCols] = useState<Record<string, { items: any[]; total: number }>>({});
  const [dragId, setDragId] = useState<number | null>(null);

  useEffect(() => {
    const keys = Object.keys(meta.commercial_statuses);
    Promise.all(keys.map((k) => api.get(`/api/companies${qs({ commercial_status: k, country, page_size: 30, sort: "score" })}`)))
      .then((res) => setCols(Object.fromEntries(keys.map((k, i) => [k, { items: res[i].items, total: res[i].total }]))));
  }, [country, tick]);

  const move = async (id: number, status: string) => {
    try {
      await api.patch(`/api/companies/${id}`, { commercial_status: status });
      toast.ok(`Movido a “${meta.commercial_statuses[status]}”`);
      bump();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select className="w-64" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Todos los países" options={countries.filter((c) => c.total > 0).map((c) => [c.iso2, c.name])} />
        <span className="text-[13px] text-slate-500">Arrastra tarjetas entre columnas o cambia el estado desde la tarjeta. Se muestran las 30 de mayor puntuación por columna.</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {Object.entries(meta.commercial_statuses).map(([key, label]) => {
          const col = cols[key];
          return (
            <div key={key} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragId) move(dragId, key); setDragId(null); }}
              className="w-[260px] shrink-0 rounded-lg bg-ink-900/60 ring-1 ring-line flex flex-col max-h-[calc(100vh-190px)]">
              <header className="px-3 h-10 shrink-0 flex items-center gap-2 border-b border-line">
                <span className={cx("w-2 h-2 rounded-full", DOT[STATUS_GROUP[key]])} />
                <span className="text-[12px] font-semibold text-slate-200 truncate">{label}</span>
                <button onClick={() => navigate("prospectos", { commercial_status: key })} className="ml-auto text-[11px] tabular-nums text-slate-400 hover:text-slate-100">{fmt(col?.total)}</button>
              </header>
              <div className="p-2 space-y-2 overflow-y-auto">
                {col?.items.map((c) => (
                  <article key={c.id} draggable onDragStart={() => setDragId(c.id)} className="rounded-md bg-ink-950 ring-1 ring-line p-2.5 hover:ring-blue-500/50 cursor-grab active:cursor-grabbing">
                    <button onClick={() => open(c.id)} className="text-left w-full">
                      <div className="text-[13px] font-medium text-slate-100 leading-snug">{c.trade_name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">{c.city || "—"} · {sectorName(meta, c.sector)}</div>
                    </button>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Badge className={PRIORITY_STYLE[c.priority]}>{c.score} · {PRIORITY_SHORT[c.priority]}</Badge>
                      <span className="text-[11px] text-slate-500 truncate">{c.recommended_service}</span>
                    </div>
                    <select value={key} onChange={(e) => move(c.id, e.target.value)} className="mt-2 w-full h-7 rounded bg-ink-900 ring-1 ring-line text-[11px] text-slate-300 px-1.5 focus:outline-none" aria-label="Cambiar estado">
                      {Object.entries(meta.commercial_statuses).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </article>
                ))}
                {col && col.items.length === 0 && <div className="text-[12px] text-slate-600 text-center py-6">Vacío</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
