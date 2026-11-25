import { useEffect, useMemo, useState } from "react";
import { api, download } from "../lib/api";
import { fmt, sectorName, useMeta } from "../lib/meta";
import { Route, navigate, useRefresh } from "../lib/nav";
import { Badge, Button, Empty, Field, Input, Panel, Select, Spinner, Textarea, cx, toast } from "../components/ui";
import { WorldMap } from "../components/WorldMap";
import { IconDownload, IconPlus, IconSearch } from "../components/Icons";

const STATUS: Record<string, [string, string]> = {
  sin_iniciar: ["Sin iniciar", "bg-slate-400/10 text-slate-400 ring-slate-400/20"],
  en_progreso: ["En progreso", "bg-sky-400/10 text-sky-300 ring-sky-400/30"],
  cobertura_documentada: ["Cobertura documentada", "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30"],
};

export function Explorer({ route }: { route: Route }) {
  const { meta, countries, reloadCountries } = useMeta();
  const [continent, setContinent] = useState<string | null>(route.params.get("continent"));
  const [selected, setSelected] = useState<string | null>(route.params.get("country"));
  const [q, setQ] = useState("");

  const list = useMemo(() => countries
    .filter((c) => (!continent || c.continent === continent) && (!q || c.name.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)), [countries, continent, q]);

  const contStats = (key: string) => {
    const cs = countries.filter((c) => c.continent === key);
    return { n: cs.length, total: cs.reduce((s, c) => s + c.total, 0), started: cs.filter((c) => c.total > 0).length };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setContinent(null)} className={cx("h-8 px-3 rounded-md text-[13px] ring-1", !continent ? "bg-blue-600/20 ring-blue-500/40 text-white" : "ring-line text-slate-400 hover:text-slate-100")}>Todo el mundo</button>
        {Object.entries(meta.continents).map(([k, name]) => {
          const s = contStats(k);
          return (
            <button key={k} onClick={() => setContinent(k)} className={cx("h-8 px-3 rounded-md text-[13px] ring-1 flex items-center gap-2", continent === k ? "bg-blue-600/20 ring-blue-500/40 text-white" : "ring-line text-slate-400 hover:text-slate-100")}>
              {name}<span className="text-[11px] tabular-nums text-slate-500">{fmt(s.total)}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(380px,1fr)]">
        <div className="space-y-5 min-w-0">
          <Panel bodyClass="p-0"><WorldMap countries={countries} continent={continent} selected={selected} onSelect={setSelected} height={continent ? 460 : 440} /></Panel>
          <Panel title={`Países y territorios (${list.length})`} actions={<Input placeholder="Filtrar país…" value={q} onChange={(e) => setQ(e.target.value)} className="h-7 w-44 text-xs" />} bodyClass="p-0">
            <div className="max-h-[460px] overflow-y-auto">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-ink-900 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr><th className="text-left font-medium px-4 py-2">País</th><th className="text-left font-medium">Continente</th><th className="text-right font-medium">Prospectos</th><th className="font-medium px-3 w-40">Avance vs meta</th><th className="text-right font-medium">Alta prior.</th><th className="text-right font-medium">Verif.</th><th className="text-left font-medium px-4">Estado</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {list.map((c) => (
                    <tr key={c.iso2} onClick={() => setSelected(c.iso2)} className={cx("cursor-pointer hover:bg-ink-850", selected === c.iso2 && "bg-blue-600/10")}>
                      <td className="px-4 py-2 font-medium text-slate-100"><span className="text-slate-500 text-[11px] mr-2 tabular-nums">{c.iso2}</span>{c.name}</td>
                      <td className="text-slate-400">{meta.continents[c.continent]}</td>
                      <td className="text-right tabular-nums">{fmt(c.total)}<span className="text-slate-500"> / {fmt(c.target)}</span></td>
                      <td className="px-3"><div className="h-1.5 rounded-full bg-ink-800"><div className={cx("h-full rounded-full", c.coverage_pct >= 100 ? "bg-emerald-400" : "bg-blue-500")} style={{ width: `${c.coverage_pct}%` }} /></div></td>
                      <td className="text-right tabular-nums text-slate-300">{c.high}</td>
                      <td className="text-right tabular-nums text-slate-300">{c.verified}</td>
                      <td className="px-4"><Badge className={STATUS[c.research_status]?.[1]}>{STATUS[c.research_status]?.[0]}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
        <div className="min-w-0">
          {selected ? <CountryPanel iso={selected} onChanged={reloadCountries} /> : (
            <Panel><Empty title="Selecciona un país">Haz clic en el mapa o en la tabla para ver sus ciudades, sectores, avance y bloques.</Empty></Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function CountryPanel({ iso, onChanged }: { iso: string; onChanged: () => void }) {
  const { meta } = useMeta();
  const { tick } = useRefresh();
  const [c, setC] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [newCity, setNewCity] = useState("");
  const load = () => api.get(`/api/countries/${iso}`).then((x) => { setC(x); setForm({ target: x.target, coverage_notes: x.coverage_notes || "", research_status: x.research_status }); });
  useEffect(() => { setC(null); load(); }, [iso, tick]);
  if (!c) return <Panel><div className="py-10 grid place-items-center"><Spinner /></div></Panel>;

  const save = async () => {
    try {
      await api.patch(`/api/countries/${iso}`, { ...form, target: Number(form.target) });
      toast.ok("País actualizado");
      load();
      onChanged();
    } catch (e: any) { toast.error(e.message); }
  };
  const addCity = async () => {
    if (!newCity.trim()) return;
    await api.post(`/api/countries/${iso}/cities`, { name: newCity.trim() });
    setNewCity("");
    load();
  };
  const pct = c.target ? Math.min(100, Math.round((100 * c.total) / c.target)) : 0;

  return (
    <div className="space-y-5 xl:sticky xl:top-20">
      <Panel title={<span className="text-base">{c.name} <span className="text-slate-500 font-normal text-[12px] ml-1">{c.iso3} · {meta.continents[c.continent]}</span></span>}
        actions={<Button size="sm" onClick={() => download(`/api/export?country=${iso}`).then((n) => toast.ok(`Descargado ${n}`)).catch((e) => toast.error(e.message))}><IconDownload className="w-3.5 h-3.5" />Excel país</Button>}>
        <div className="grid grid-cols-3 gap-3">
          <div><div className="text-[11px] uppercase tracking-wider text-slate-500">Encontradas</div><div className="text-2xl font-semibold tabular-nums">{fmt(c.total)}</div></div>
          <div><div className="text-[11px] uppercase tracking-wider text-slate-500">Verificadas</div><div className="text-2xl font-semibold tabular-nums text-emerald-300">{fmt(c.verified)}</div></div>
          <div><div className="text-[11px] uppercase tracking-wider text-slate-500">Meta</div><div className="text-2xl font-semibold tabular-nums">{fmt(c.target)}</div></div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-ink-800"><div className={cx("h-full rounded-full", pct >= 100 ? "bg-emerald-400" : "bg-blue-500")} style={{ width: `${pct}%` }} /></div>
        <div className="text-[11px] text-slate-500 mt-1.5">{pct}% de la meta. Solo cuentan empresas reales encontradas en fuentes; no se completan cuotas.</div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={() => navigate("prospectos", { country: iso })}>Ver prospectos</Button>
          <Button size="sm" variant="primary" onClick={() => navigate("investigacion", { country: iso, city: c.cities[0]?.name || "" })}><IconSearch className="w-3.5 h-3.5" />Investigar</Button>
        </div>
      </Panel>

      <Panel title="Ciudades" bodyClass="p-0">
        <ul className="divide-y divide-line max-h-64 overflow-y-auto">
          {c.cities.map((ct: any) => (
            <li key={ct.name} className="px-4 py-2 flex items-center gap-2 text-[13px]">
              <span className="text-slate-100">{ct.name}</span>
              {ct.is_capital ? <Badge>Capital</Badge> : null}
              <span className="ml-auto tabular-nums text-slate-300">{fmt(ct.total)}</span>
              <Button size="sm" variant="ghost" onClick={() => navigate("prospectos", { country: iso, city: ct.name })}>Ver</Button>
              <Button size="sm" variant="ghost" onClick={() => navigate("investigacion", { country: iso, city: ct.name })}><IconSearch className="w-3.5 h-3.5" /></Button>
            </li>
          ))}
        </ul>
        <div className="p-3 border-t border-line flex gap-2">
          <Input placeholder="Añadir ciudad…" value={newCity} onChange={(e) => setNewCity(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCity()} className="h-8" />
          <Button size="sm" onClick={addCity}><IconPlus className="w-3.5 h-3.5" /></Button>
        </div>
      </Panel>

      {c.sectors.length > 0 && (
        <Panel title="Sectores encontrados" bodyClass="p-0">
          <ul className="divide-y divide-line max-h-52 overflow-y-auto">
            {c.sectors.map((s: any) => (
              <li key={s.k || "x"}><button onClick={() => navigate("prospectos", { country: iso, sector: s.k || "" })} className="w-full px-4 py-1.5 flex justify-between text-[13px] hover:bg-ink-850">
                <span className="text-slate-300">{sectorName(meta, s.k)}</span><span className="tabular-nums">{s.n}</span>
              </button></li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Cobertura y meta">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Meta de empresas"><Select value={String(form.target)} onChange={(e) => setForm({ ...form, target: e.target.value })} options={[...new Set([50, 100, 500, 1000, 5000, Number(form.target)])].sort((a, b) => a - b).map((n) => [String(n), fmt(n)])} /></Field>
            <Field label="Estado"><Select value={form.research_status} onChange={(e) => setForm({ ...form, research_status: e.target.value })} options={Object.entries(STATUS).map(([k, v]) => [k, v[0]])} /></Field>
          </div>
          <Field label="Notas de cobertura" hint="Fuentes consultadas, ciudades cubiertas y número real de empresas verificadas. Obligatorio para declarar la cobertura documentada.">
            <Textarea value={form.coverage_notes} onChange={(e) => setForm({ ...form, coverage_notes: e.target.value })} />
          </Field>
          <Button size="sm" variant="primary" onClick={save}>Guardar</Button>
        </div>
      </Panel>

      {c.blocks.length > 0 && (
        <Panel title="Bloques" bodyClass="p-0">
          <ul className="divide-y divide-line">
            {c.blocks.map((b: any) => (
              <li key={b.id} className="px-4 py-2 flex items-center gap-3 text-[13px]">
                <span className="font-medium">Bloque {String(b.number).padStart(2, "0")}</span>
                <span className="text-slate-400">{b.city || "Todo el país"}</span>
                <Badge>{b.origin}</Badge>
                <span className="ml-auto tabular-nums text-slate-300">{b.company_count}</span>
                <Button size="sm" variant="ghost" onClick={() => download(`/api/blocks/${b.id}/export`).catch((e) => toast.error(e.message))}><IconDownload className="w-3.5 h-3.5" /></Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
