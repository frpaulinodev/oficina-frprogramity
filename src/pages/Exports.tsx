import { useEffect, useRef, useState } from "react";
import { api, download, qs } from "../lib/api";
import { fmt, useMeta } from "../lib/meta";
import { Route, useRefresh } from "../lib/nav";
import { Badge, Button, Empty, Field, Input, Panel, Select, Spinner, cx, toast } from "../components/ui";
import { IconDownload, IconLayers, IconUpload } from "../components/Icons";

export function Exports({ route }: { route: Route }) {
  const { meta, countries, reloadCountries } = useMeta();
  const { tick, bump } = useRefresh();
  const [f, setF] = useState<Record<string, string>>({});
  const [blocks, setBlocks] = useState<any[]>([]);
  const [scope, setScope] = useState({ country: "US", city: "Miami", extra_cities: "", sector: "", min_score: "" });
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [busy, setBusy] = useState("");
  const [reports, setReports] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imp, setImp] = useState({ country: "", city: "", block: "" });

  useEffect(() => { api.get("/api/blocks").then(setBlocks); }, [tick]);
  useEffect(() => {
    const cities = scope.city ? [scope.city, ...scope.extra_cities.split(",").map((c) => c.trim()).filter(Boolean)] : [""];
    Promise.all(cities.map((c) => api.get(`/api/companies${qs({ country: scope.country, city: c, sector: scope.sector, min_score: scope.min_score, in_block: "0", page_size: 5 })}`)))
      .then((rs) => setPendingCount(rs.reduce((n, r) => n + r.total, 0)));
  }, [JSON.stringify(scope), tick]);

  const set = (k: string, v: string) => setF((x) => { const n = { ...x }; if (v) n[k] = v; else delete n[k]; return n; });
  const doExport = async () => {
    setBusy("export");
    try { toast.ok(`Descargado ${await download(`/api/export${qs(f)}`)}`); } catch (e: any) { toast.error(e.message); } finally { setBusy(""); }
  };
  const nextBlock = async () => {
    setBusy("block");
    try {
      const r = await api.post("/api/blocks", scope);
      if (!r.block_id) { toast.error(r.message); return; }
      toast.ok(r.message);
      await download(`/api/blocks/${r.block_id}/export`);
      bump();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(""); }
  };
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy("import");
    const out: any[] = [];
    for (const file of Array.from(files)) {
      try {
        const r = await api.post(`/api/import${qs(imp)}`, await file.arrayBuffer(), { "X-Filename": file.name, "Content-Type": "application/octet-stream" });
        out.push(r);
      } catch (e: any) { out.push({ file: file.name, error: e.message }); }
    }
    setReports((x) => [...out, ...x]);
    setBusy("");
    if (fileRef.current) fileRef.current.value = "";
    bump();
    reloadCountries();
  };
  const countryName = (iso: string) => countries.find((c) => c.iso2 === iso)?.name || iso || "Mundo";
  const grouped = blocks.reduce((acc: Record<string, any[]>, b) => { (acc[b.scope_key] ||= []).push(b); return acc; }, {});

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title={<span className="flex items-center gap-2"><IconLayers className="w-4 h-4 text-emerald-300" />Bloques de {meta.block_size} prospectos</span>}>
          <p className="text-[13px] text-slate-400 mb-4">Cada bloque toma las siguientes empresas <b className="text-slate-200">aún no incluidas en ningún bloque</b> del mismo ámbito (mayor puntuación primero). Ninguna empresa se repite entre bloques. Excluye “No contactar” y posibles inactivas.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="País"><Select value={scope.country} onChange={(e) => setScope({ ...scope, country: e.target.value })} options={countries.map((c) => [c.iso2, c.name])} /></Field>
            <Field label="Ciudad (vacío = todo el país)"><Input value={scope.city} onChange={(e) => setScope({ ...scope, city: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="Incluir también estas localidades (área metropolitana, separadas por comas)" hint="Ej.: Hialeah, Doral, Coral Gables, Miami Beach. Cuentan dentro del mismo bloque y numeración."><Input value={scope.extra_cities} onChange={(e) => setScope({ ...scope, extra_cities: e.target.value })} placeholder="Opcional" /></Field></div>
            <Field label="Sector (opcional)"><Select value={scope.sector} onChange={(e) => setScope({ ...scope, sector: e.target.value })} placeholder="Todos" options={meta.sectors.map((s) => [s.key, s.name])} /></Field>
            <Field label="Puntuación mínima (opcional)"><Input type="number" min={0} max={100} value={scope.min_score} onChange={(e) => setScope({ ...scope, min_score: e.target.value })} /></Field>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button variant="primary" onClick={nextBlock} disabled={busy === "block" || !pendingCount}>{busy === "block" ? <Spinner /> : <IconDownload className="w-4 h-4" />}Generar siguiente bloque</Button>
            <span className="text-[13px] text-slate-400">{pendingCount === null ? "…" : `${fmt(pendingCount)} empresas disponibles sin bloque`}</span>
          </div>
          {pendingCount !== null && pendingCount < meta.block_size && pendingCount > 0 && <p className="text-[12px] text-amber-200 mt-2">Hay menos de {meta.block_size}: el bloque saldrá con {pendingCount} empresas reales (no se completa con datos inventados).</p>}
        </Panel>

        <Panel title={<span className="flex items-center gap-2"><IconUpload className="w-4 h-4 text-emerald-300" />Importar archivos previos (.xlsx)</span>}>
          <p className="text-[13px] text-slate-400 mb-4">Importa <b className="text-slate-200">prospectos_internacionales_bloque_01_usa_miami.xlsx</b> y <b className="text-slate-200">…_bloque_02_usa_miami.xlsx</b>. El bloque, país y ciudad se detectan del nombre del archivo; sus empresas quedan registradas para que no se repitan en el Bloque 03.</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="País (si no está en el nombre)"><Select value={imp.country} onChange={(e) => setImp({ ...imp, country: e.target.value })} placeholder="Automático" options={countries.map((c) => [c.iso2, c.name])} /></Field>
            <Field label="Ciudad"><Input value={imp.city} placeholder="Automático" onChange={(e) => setImp({ ...imp, city: e.target.value })} /></Field>
            <Field label="N° de bloque"><Input type="number" value={imp.block} placeholder="Automático" onChange={(e) => setImp({ ...imp, block: e.target.value })} /></Field>
          </div>
          <label className={cx("mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-line hover:border-blue-500/60 py-7 cursor-pointer text-[13px] text-slate-400", busy === "import" && "opacity-60")}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            {busy === "import" ? <Spinner /> : <IconUpload className="w-5 h-5 mb-1.5 text-slate-300" />}
            Arrastra los .xlsx aquí o haz clic para elegir
            <input ref={fileRef} type="file" accept=".xlsx" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          </label>
          {reports.map((r, i) => (
            <div key={i} className={cx("mt-3 rounded-md ring-1 px-3 py-2 text-[12px]", r.error ? "ring-rose-400/30 text-rose-200" : "ring-emerald-400/25 text-slate-300")}>
              <div className="font-medium text-slate-100">{r.file}</div>
              {r.error ? r.error : <>Filas leídas {r.rows} · nuevas {r.created} · ya existentes (fusionadas) {r.merged} · omitidas {r.skipped}{r.block_number ? ` · Bloque ${String(r.block_number).padStart(2, "0")}` : ""} · {countryName(r.country)} {r.city || ""}
                {r.unmapped_headers?.length > 0 && <div className="text-slate-500 mt-0.5">Columnas no reconocidas: {r.unmapped_headers.join(", ")}</div>}</>}
            </div>
          ))}
        </Panel>
      </div>

      <Panel title="Bloques registrados" bodyClass="p-0" actions={<>
        <Button size="sm" onClick={async () => { try { const r = await api.post("/api/blocks/all-countries", {}); toast.ok(`${r.created} bloques nuevos creados (uno o más por país)`); bump(); } catch (e: any) { toast.error(e.message); } }}><IconLayers className="w-3.5 h-3.5" />Generar bloques de todos los países</Button>
        <Button size="sm" variant="primary" disabled={!blocks.length} onClick={() => download("/api/blocks/zip").then((n) => toast.ok(`Descargado ${n}`)).catch((e) => toast.error(e.message))}><IconDownload className="w-3.5 h-3.5" />Descargar todos (.zip)</Button>
      </>}>
        {blocks.length === 0 ? <Empty title="Aún no hay bloques">Importa los bloques previos o genera el primero.</Empty> : (
          <div className="divide-y divide-line">
            {Object.entries(grouped).map(([key, bs]) => (
              <div key={key} className="px-4 py-3">
                <div className="text-[12px] text-slate-400 mb-2">{countryName(bs[0].country_iso2)} {bs[0].city ? `· ${bs[0].city}` : "· todo el país"}</div>
                <div className="flex flex-wrap gap-2">
                  {bs.map((b) => (
                    <button key={b.id} onClick={() => download(`/api/blocks/${b.id}/export`).catch((e) => toast.error(e.message))} className="rounded-md ring-1 ring-line bg-ink-950 hover:ring-blue-500/50 px-3 py-2 text-left">
                      <div className="text-[13px] font-semibold flex items-center gap-2">Bloque {String(b.number).padStart(2, "0")} <IconDownload className="w-3 h-3 text-slate-400" /></div>
                      <div className="text-[11px] text-slate-500">{b.company_count} empresas · <Badge>{b.origin}</Badge></div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Exportación personalizada">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Continente"><Select value={f.continent || ""} onChange={(e) => set("continent", e.target.value)} placeholder="Todos" options={Object.entries(meta.continents)} /></Field>
          <Field label="País"><Select value={f.country || ""} onChange={(e) => set("country", e.target.value)} placeholder="Todos" options={countries.map((c) => [c.iso2, c.name])} /></Field>
          <Field label="Ciudad"><Input value={f.city || ""} onChange={(e) => set("city", e.target.value)} placeholder="Todas" /></Field>
          <Field label="Sector"><Select value={f.sector || ""} onChange={(e) => set("sector", e.target.value)} placeholder="Todos" options={meta.sectors.map((s) => [s.key, s.name])} /></Field>
          <Field label="Prioridad"><Select value={f.priority || ""} onChange={(e) => set("priority", e.target.value)} placeholder="Todas" options={Object.entries(meta.priorities)} /></Field>
          <Field label="Estado de verificación"><Select value={f.verification_status || ""} onChange={(e) => set("verification_status", e.target.value)} placeholder="Todos" options={Object.entries(meta.verification_statuses)} /></Field>
          <Field label="Estado comercial"><Select value={f.commercial_status || ""} onChange={(e) => set("commercial_status", e.target.value)} placeholder="Todos" options={Object.entries(meta.commercial_statuses)} /></Field>
          <Field label="Opciones"><label className="h-9 flex items-center gap-2 text-[13px] text-slate-300"><input type="checkbox" className="accent-blue-500" checked={f.exclude_do_not_contact === "1"} onChange={(e) => set("exclude_do_not_contact", e.target.checked ? "1" : "")} />Excluir “No contactar”</label></Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="primary" onClick={doExport} disabled={busy === "export"}>{busy === "export" ? <Spinner /> : <IconDownload className="w-4 h-4" />}Descargar Excel</Button>
          <span className="text-[12px] text-slate-500">7 hojas: Base general · Resumen mundial · Prospectos por país · Oportunidades comerciales · Seguimiento de ventas · Directorio de países · Fuentes y metodología.</span>
        </div>
      </Panel>
    </div>
  );
}
