import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { fmt, sectorName, useMeta } from "../lib/meta";
import { Route, navigate, useRefresh } from "../lib/nav";
import { Badge, Button, Empty, Field, Input, Panel, Select, Spinner, cx, toast } from "../components/ui";
import { IconCheck, IconSearch, IconX } from "../components/Icons";

const JOB_STYLE: Record<string, string> = {
  completado: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30",
  error: "bg-rose-500/10 text-rose-300 ring-rose-400/30",
  en_ejecucion: "bg-sky-400/10 text-sky-300 ring-sky-400/30",
  en_cola: "bg-slate-400/10 text-slate-300 ring-slate-400/20",
  interrumpido: "bg-amber-400/10 text-amber-200 ring-amber-300/30",
};

export function Research({ route }: { route: Route }) {
  const { meta, countries, reloadCountries } = useMeta();
  const { bump } = useRefresh();
  const [form, setForm] = useState({
    country_iso2: route.params.get("country") || "US", city: route.params.get("city") || "Miami", sector: "todos",
    providers: meta.providers.filter((p) => p.available && p.key !== "website").map((p) => p.key), max_results: 100, analyze_websites: true,
  });
  const [cities, setCities] = useState<string[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [logJob, setLogJob] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get(`/api/countries/${form.country_iso2}`).then((c) => setCities(c.cities.map((x: any) => x.name))); }, [form.country_iso2]);
  const loadJobs = () => api.get("/api/research/jobs").then((j) => {
    setJobs((prev) => {
      if (prev.some((p) => p.status === "en_ejecucion" || p.status === "en_cola") && !j.some((x: any) => x.status === "en_ejecucion" || x.status === "en_cola")) { bump(); reloadCountries(); }
      return j;
    });
  });
  useEffect(() => { loadJobs(); }, []);
  const active = jobs.some((j) => j.status === "en_ejecucion" || j.status === "en_cola");
  useEffect(() => {
    if (!active && !logJob) return;
    const t = setInterval(() => { loadJobs(); if (logJob) api.get(`/api/research/jobs/${logJob.id}`).then(setLogJob); }, 2500);
    return () => clearInterval(t);
  }, [active, logJob?.id]);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await api.post("/api/research/jobs", { ...form, max_results: Number(form.max_results) });
      toast.ok(`Investigación #${r.id} en cola`);
      await loadJobs();
      setLogJob(await api.get(`/api/research/jobs/${r.id}`));
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  const toggleProvider = (k: string) => setForm((f) => ({ ...f, providers: f.providers.includes(k) ? f.providers.filter((x) => x !== k) : [...f.providers, k] }));
  const countryName = (iso: string) => countries.find((c) => c.iso2 === iso)?.name || iso;

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="space-y-5">
        <Panel title="Nueva investigación">
          <div className="space-y-3">
            <Field label="País"><Select value={form.country_iso2} onChange={(e) => setForm({ ...form, country_iso2: e.target.value, city: "" })} options={countries.map((c) => [c.iso2, `${c.name} · ${meta.continents[c.continent]}`])} /></Field>
            <Field label="Ciudad" hint="Las fuentes se consultan por ciudad. Puedes escribir otra ciudad o barrio.">
              <Input list="cities" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <datalist id="cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Sector"><Select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} options={[["todos", "Todos los sectores principales"], ...meta.sectors.map((s) => [s.key, s.name + (s.extra ? " (adicional)" : "")] as [string, string])]} /></Field>
            <Field label="Máximo de resultados por fuente"><Select value={String(form.max_results)} onChange={(e) => setForm({ ...form, max_results: Number(e.target.value) })} options={[["50", "50"], ["100", "100"], ["250", "250"], ["500", "500"], ["1000", "1.000"]]} /></Field>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">Fuentes</div>
              <div className="space-y-1.5">
                {meta.providers.filter((p) => p.key !== "website").map((p) => (
                  <label key={p.key} className={cx("flex items-start gap-2.5 rounded-md ring-1 ring-line px-3 py-2 text-[13px]", !p.available && "opacity-50")}>
                    <input type="checkbox" className="mt-0.5 accent-blue-500" disabled={!p.available} checked={form.providers.includes(p.key)} onChange={() => toggleProvider(p.key)} />
                    <span><span className="text-slate-100">{p.name}</span><span className="block text-[11px] text-slate-500">{p.available ? p.notes : "No configurado: añade la clave en el archivo .env y reinicia."}</span></span>
                  </label>
                ))}
                <label className="flex items-start gap-2.5 rounded-md ring-1 ring-line px-3 py-2 text-[13px]">
                  <input type="checkbox" className="mt-0.5 accent-blue-500" checked={form.analyze_websites} onChange={(e) => setForm({ ...form, analyze_websites: e.target.checked })} />
                  <span><span className="text-slate-100">Analizar webs oficiales encontradas</span><span className="block text-[11px] text-slate-500">Verifica correo/teléfono en la web y detecta oportunidades. Respeta robots.txt.</span></span>
                </label>
              </div>
            </div>
            <Button variant="primary" className="w-full" disabled={busy || !form.city || form.providers.length === 0} onClick={submit}>{busy ? <Spinner /> : <><IconSearch className="w-4 h-4" />Iniciar investigación</>}</Button>
            <p className="text-[11px] text-slate-500 leading-relaxed">El motor solo registra empresas que aparecen en las fuentes. Si una ciudad tiene pocos resultados verificables, verás el número real; no se completan cuotas con datos inventados. Los duplicados se fusionan automáticamente conservando todas las fuentes.</p>
          </div>
        </Panel>
        <WorldPanel onStarted={loadJobs} />
        <Panel title="Estado de las fuentes">
          <ul className="space-y-2 text-[13px]">
            {meta.providers.map((p) => (
              <li key={p.key} className="flex items-start gap-2">
                {p.available ? <IconCheck className="w-4 h-4 text-emerald-400 mt-0.5" /> : <IconX className="w-4 h-4 text-slate-500 mt-0.5" />}
                <span><span className="text-slate-200">{p.name}</span><span className="block text-[11px] text-slate-500">{p.notes}</span></span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="space-y-5 min-w-0">
        {logJob && (
          <Panel title={`Investigación #${logJob.id} · ${logJob.mode === "pais" ? "país completo: " : logJob.city + ", "}${countryName(logJob.country_iso2)}`} actions={<><Badge className={JOB_STYLE[logJob.status]}>{logJob.status}</Badge><Button size="sm" variant="ghost" onClick={() => setLogJob(null)}><IconX className="w-3.5 h-3.5" /></Button></>}>
            <div className="h-2 rounded-full bg-ink-800 overflow-hidden"><div className={cx("h-full rounded-full transition-all", logJob.status === "error" ? "bg-rose-400" : "bg-emerald-400")} style={{ width: `${logJob.progress}%` }} /></div>
            <div className="grid grid-cols-4 gap-3 mt-3 text-center">
              {[["Recibidas", logJob.found], ["Nuevas", logJob.created_count], ["Fusionadas", logJob.merged_count], ["Omitidas", logJob.skipped_count]].map(([l, v]) => (
                <div key={l as string}><div className="text-[11px] uppercase tracking-wider text-slate-500">{l}</div><div className="text-xl font-semibold tabular-nums">{fmt(v as number)}</div></div>
              ))}
            </div>
            <pre className="mt-3 max-h-72 overflow-y-auto rounded-md bg-ink-950 ring-1 ring-line p-3 text-[11.5px] leading-relaxed text-slate-400 whitespace-pre-wrap">{logJob.log || "Esperando…"}</pre>
            {logJob.status === "completado" && <Button size="sm" className="mt-3" onClick={() => navigate("prospectos", { country: logJob.country_iso2, city: logJob.city || "" })}>Ver prospectos de {logJob.city || countryName(logJob.country_iso2)}</Button>}
          </Panel>
        )}
        <Panel title="Historial de investigaciones" bodyClass="p-0" actions={<>
          {jobs.some((j) => j.status === "error" || j.status === "interrumpido") && <Button size="sm" variant="subtle" onClick={async () => { const r = await api.post("/api/research/retry-failed"); toast.ok(r.jobs ? `${r.jobs} países/ciudades vuelven a la cola` : "No hay nada pendiente de reintentar"); loadJobs(); }}><IconSearch className="w-3.5 h-3.5" />Reintentar los que fallaron</Button>}
          {jobs.some((j) => j.status === "en_cola") && <Button size="sm" variant="danger" onClick={async () => { const r = await api.post("/api/research/cancel-queued"); toast.ok(`${r.cancelled} trabajos en cola cancelados`); loadJobs(); }}>Cancelar los que están en cola</Button>}
        </>}>
          {jobs.length === 0 ? <Empty title="Sin investigaciones todavía">Configura país, ciudad y sector a la izquierda.</Empty> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-line">
                  <tr><th className="text-left font-medium px-4 py-2">#</th><th className="text-left font-medium">Lugar</th><th className="text-left font-medium">Sector</th><th className="text-left font-medium">Fuentes</th><th className="text-left font-medium">Estado</th><th className="text-right font-medium">Nuevas</th><th className="text-right font-medium">Fusionadas</th><th className="text-right font-medium px-4">Fecha</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-ink-850 cursor-pointer" onClick={() => api.get(`/api/research/jobs/${j.id}`).then(setLogJob)}>
                      <td className="px-4 py-2 text-slate-500">{j.id}</td>
                      <td>{j.mode === "pais" ? <><b className="text-slate-100">{countryName(j.country_iso2)}</b> <span className="text-slate-500">· país completo, meta {j.target}</span></> : <>{j.city}, {countryName(j.country_iso2)}</>}</td>
                      <td className="text-slate-400">{j.sector === "todos" ? "Todos" : sectorName(meta, j.sector)}</td>
                      <td className="text-slate-400">{j.providers}</td>
                      <td><Badge className={JOB_STYLE[j.status]}>{j.status}{j.status === "en_ejecucion" ? ` ${j.progress}%` : ""}</Badge></td>
                      <td className="text-right tabular-nums">{j.created_count}</td>
                      <td className="text-right tabular-nums">{j.merged_count}</td>
                      <td className="text-right text-slate-500 px-4 whitespace-nowrap">{j.created_at.slice(0, 16).replace("T", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}


function WorldPanel({ onStarted }: { onStarted: () => void }) {
  const { meta, countries } = useMeta();
  const [conts, setConts] = useState<string[]>([]);
  const [target, setTarget] = useState(50);
  const [sector, setSector] = useState("todos");
  const [analyze, setAnalyze] = useState(false);
  const [busy, setBusy] = useState(false);
  const pool = countries.filter((c) => !conts.length || conts.includes(c.continent));
  const pending = pool.filter((c) => c.total < target).length;
  const start = async () => {
    if (!confirm(`Se encolarán ${pending} países (uno tras otro). Con OpenStreetMap esto puede tardar varias horas; puedes seguir usando la app. ¿Continuar?`)) return;
    setBusy(true);
    try {
      const r = await api.post("/api/research/world", { continents: conts, target, sector, analyze_websites: analyze, providers: meta.providers.filter((p) => p.available && p.key !== "website").map((p) => p.key) });
      toast.ok(`${r.jobs} países en cola`);
      onStarted();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <Panel title="Investigación mundial (país por país)">
      <p className="text-[12px] text-slate-400 mb-3">Para cada país consulta su capital y ciudades principales hasta llegar a la meta. Omite cadenas y franquicias. Si un país no llega, anota cuántas empresas reales encontró. Si un servidor de OpenStreetMap está saturado, prueba otro, espera y reintenta solo cada país hasta 3 veces.</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.entries(meta.continents).map(([k, n]) => (
          <button key={k} onClick={() => setConts((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]))}
            className={cx("h-7 px-2.5 rounded text-[12px] ring-1", conts.includes(k) ? "bg-blue-600/25 ring-blue-500/50 text-white" : "ring-line text-slate-400")}>{n}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Meta por país"><Select value={String(target)} onChange={(e) => setTarget(Number(e.target.value))} options={[["50", "50"], ["100", "100"], ["500", "500"], ["1000", "1.000"]]} /></Field>
        <Field label="Sector"><Select value={sector} onChange={(e) => setSector(e.target.value)} options={[["todos", "Todos los principales"], ...meta.sectors.map((s) => [s.key, s.name] as [string, string])]} /></Field>
      </div>
      <label className="mt-3 flex items-center gap-2 text-[12px] text-slate-300"><input type="checkbox" className="accent-blue-500" checked={analyze} onChange={(e) => setAnalyze(e.target.checked)} />Analizar también las webs (mucho más lento)</label>
      <Button variant="primary" className="w-full mt-3" disabled={busy || pending === 0} onClick={start}>{busy ? <Spinner /> : `Investigar ${pending} países pendientes${conts.length ? "" : " del mundo"}`}</Button>
    </Panel>
  );
}
