import { useEffect, useState } from "react";
import { api, download, qs } from "../lib/api";
import { NF, PRIORITY_SHORT, PRIORITY_STYLE, VERIF_STYLE, fmt, sectorName, useMeta } from "../lib/meta";
import { Route, useOpenCompany, useRefresh } from "../lib/nav";
import { Badge, Button, Empty, Field, Input, Modal, ScoreBar, Select, Spinner, cx, toast } from "../components/ui";
import * as I from "../components/Icons";

const FILTER_KEYS = ["opportunity", "q", "continent", "country", "city", "sector", "priority", "verification_status", "commercial_status", "digital_category", "has_web", "has_email", "in_block", "block_id"];

export function Prospects({ route }: { route: Route }) {
  const { meta, countries } = useMeta();
  const { tick, bump } = useRefresh();
  const open = useOpenCompany();
  const init: Record<string, string> = {};
  FILTER_KEYS.forEach((k) => { const v = route.params.get(k); if (v) init[k] = v; });
  if (!route.params.has("opportunity") && !route.params.has("commercial_status")) init.opportunity = "1";
  if (init.opportunity === "0") delete init.opportunity;
  const [f, setF] = useState<Record<string, string>>(init);
  const [qInput, setQInput] = useState(init.q || "");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: route.params.get("sort") || "score", dir: "desc" });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const [data, setData] = useState<any>(null);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);

  useEffect(() => { const n: Record<string, string> = {}; FILTER_KEYS.forEach((k) => { const v = route.params.get(k); if (v) n[k] = v; }); if (!route.params.has("opportunity") && !route.params.has("commercial_status")) n.opportunity = "1"; if (n.opportunity === "0") delete n.opportunity; setF(n); setQInput(n.q || ""); setPage(1); }, [route.params.toString()]);
  useEffect(() => {
    setData(null);
    api.get(`/api/companies${qs({ ...f, sort: sort.key, dir: sort.dir, page, page_size: size })}`).then(setData).catch((e) => toast.error(e.message));
  }, [JSON.stringify(f), sort.key, sort.dir, page, size, tick]);

  const set = (k: string, v: string) => { setF((x) => { const n = { ...x }; if (v) n[k] = v; else delete n[k]; return n; }); setPage(1); setSel(new Set()); };
  const toggleSort = (key: string) => setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));
  const items: any[] = data?.items || [];
  const allSel = items.length > 0 && items.every((i) => sel.has(i.id));
  const countryName = (iso: string) => countries.find((c) => c.iso2 === iso)?.name || iso;
  const pages = data ? Math.max(1, Math.ceil(data.total / size)) : 1;

  const bulk = async (action: string, value?: string) => {
    if (action === "delete" && !confirm(`¿Eliminar ${sel.size} registros? Esta acción no se puede deshacer.`)) return;
    try {
      await api.post("/api/companies/bulk", { ids: [...sel], action, value });
      toast.ok(`${sel.size} registros actualizados`);
      setSel(new Set());
      bump();
    } catch (e: any) { toast.error(e.message); }
  };

  const Th = ({ k, children, className }: { k?: string; children: React.ReactNode; className?: string }) => (
    <th className={cx("px-3 py-2 font-medium text-left whitespace-nowrap", className)}>
      {k ? <button onClick={() => toggleSort(k)} className={cx("inline-flex items-center gap-1 hover:text-slate-200", sort.key === k && "text-slate-200")}>{children}<I.IconSort className="w-3 h-3 opacity-60" /></button> : children}
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => set("opportunity", f.opportunity ? "" : "1")} className={cx("group flex items-center gap-2.5 h-10 pl-2 pr-4 rounded-full ring-1 transition-all", f.opportunity ? "bg-gradient-to-r from-emerald-500/25 to-emerald-500/5 ring-emerald-400/50 text-emerald-100 shadow-[0_10px_30px_-15px_rgba(52,211,153,.9)]" : "ring-line text-slate-400 hover:text-slate-100")}>
          <span className={cx("w-9 h-5 rounded-full relative transition-colors", f.opportunity ? "bg-emerald-400" : "bg-ink-700")}><span className={cx("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", f.opportunity ? "left-[18px]" : "left-0.5")} /></span>
          <span className="text-[13px] font-medium">Solo oportunidades</span>
        </button>
        <span className="text-[12px] text-slate-500">{f.opportunity ? "Mostrando solo negocios a los que les falta lo que vendes (sin web, web mejorable, solo redes o sin reservas/tienda). Oculta los que ya lo tienen todo." : "Mostrando todas las empresas, incluidas las que ya tienen presencia digital completa."}</span>
      </div>
      <div className="rounded-xl glass-panel p-3">
        <div className="grid gap-2 grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
          <form className="col-span-2" onSubmit={(e) => { e.preventDefault(); set("q", qInput); }}>
            <div className="relative"><I.IconSearch className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input placeholder="Buscar nombre, correo, web, teléfono, dirección" value={qInput} onChange={(e) => setQInput(e.target.value)} className="pl-8" /></div>
          </form>
          <Select value={f.continent || ""} onChange={(e) => set("continent", e.target.value)} placeholder="Continente" options={Object.entries(meta.continents)} />
          <Select value={f.country || ""} onChange={(e) => set("country", e.target.value)} placeholder="País" options={countries.filter((c) => !f.continent || c.continent === f.continent).map((c) => [c.iso2, c.name])} />
          <Input placeholder="Ciudad" defaultValue={f.city || ""} key={f.city || "city"} onBlur={(e) => set("city", e.target.value.trim())} onKeyDown={(e) => e.key === "Enter" && set("city", (e.target as HTMLInputElement).value.trim())} />
          <Select value={f.sector || ""} onChange={(e) => set("sector", e.target.value)} placeholder="Sector" options={meta.sectors.map((s) => [s.key, s.name])} />
          <Select value={f.priority || ""} onChange={(e) => set("priority", e.target.value)} placeholder="Prioridad" options={Object.entries(meta.priorities)} />
          <Select value={f.digital_category || ""} onChange={(e) => set("digital_category", e.target.value)} placeholder="Diagnóstico" options={Object.entries(meta.categories).map(([k, v]) => [k, `${k} · ${v}`])} />
          <Select value={f.verification_status || ""} onChange={(e) => set("verification_status", e.target.value)} placeholder="Verificación" options={Object.entries(meta.verification_statuses)} />
          <Select value={f.commercial_status || ""} onChange={(e) => set("commercial_status", e.target.value)} placeholder="Estado comercial" options={Object.entries(meta.commercial_statuses)} />
          <Select value={f.has_web || ""} onChange={(e) => set("has_web", e.target.value)} placeholder="Web: todas" options={[["1", "Con web"], ["0", "Sin web encontrada"]]} />
          <Select value={f.has_email || ""} onChange={(e) => set("has_email", e.target.value)} placeholder="Correo: todos" options={[["1", "Con correo"], ["0", "Sin correo"]]} />
          <Select value={f.in_block || ""} onChange={(e) => set("in_block", e.target.value)} placeholder="Bloque: todos" options={[["0", "Sin bloque asignado"], ["1", "Ya en un bloque"]]} />
          <div className="flex gap-2 col-span-2 md:col-span-1 xl:col-span-2 justify-end">
            {Object.keys(f).some((k) => k !== "opportunity") && <Button variant="ghost" onClick={() => { setF(f.opportunity ? { opportunity: "1" } : {}); setQInput(""); }}>Limpiar</Button>}
            <Button onClick={() => download(`/api/export${qs(f)}`).then((n) => toast.ok(`Descargado ${n}`)).catch((e) => toast.error(e.message))}><I.IconDownload className="w-3.5 h-3.5" />Excel</Button>
            <Button variant="primary" onClick={() => setCreating(true)}><I.IconPlus className="w-3.5 h-3.5" />Nuevo</Button>
          </div>
        </div>
      </div>

      {sel.size > 0 && (
        <div className="sticky top-16 z-[5] rounded-lg bg-blue-950/90 ring-1 ring-blue-500/40 px-4 py-2 flex flex-wrap items-center gap-2 text-[13px] backdrop-blur">
          <span className="font-medium">{sel.size} seleccionados</span>
          <Select className="w-56" value="" onChange={(e) => e.target.value && bulk("set_status", e.target.value)} placeholder="Cambiar estado comercial…" options={Object.entries(meta.commercial_statuses)} />
          <Button size="sm" onClick={() => download(`/api/export?ids=${[...sel].join(",")}`).catch((e) => toast.error(e.message))}><I.IconDownload className="w-3.5 h-3.5" />Exportar selección</Button>
          <Button size="sm" onClick={() => bulk("recompute")}><I.IconRefresh className="w-3.5 h-3.5" />Recalcular</Button>
          <Button size="sm" variant="danger" onClick={() => bulk("do_not_contact")}>No contactar</Button>
          <Button size="sm" variant="danger" onClick={() => bulk("delete")}><I.IconTrash className="w-3.5 h-3.5" />Eliminar</Button>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSel(new Set())}>Deseleccionar</Button>
        </div>
      )}

      <div className="rounded-xl glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[1500px]">
            <thead className="bg-ink-950/60 text-[11px] uppercase tracking-wider text-slate-500 border-b border-line">
              <tr>
                <th className="pl-4 w-8"><input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set(items.map((i) => i.id)))} className="accent-blue-500" aria-label="Seleccionar página" /></th>
                <Th k="trade_name">Empresa</Th><Th k="country_iso2">País</Th><Th k="city">Ciudad</Th><Th k="sector">Sector</Th>
                <Th>Teléfono</Th><Th>Correo</Th><Th>Página web</Th><Th>Redes</Th><Th>Diagnóstico</Th><Th>Servicio recomendado</Th>
                <Th k="score">Puntuación</Th><Th k="priority">Prioridad</Th><Th k="verification_status">Verificación</Th><Th k="commercial_status">Estado comercial</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {!data && <tr><td colSpan={15} className="py-16 text-center"><Spinner /></td></tr>}
              {data && items.length === 0 && <tr><td colSpan={15}><Empty title="Sin resultados">Cambia los filtros, importa archivos previos o lanza una investigación.</Empty></td></tr>}
              {items.map((c) => (
                <tr key={c.id} className={cx("hover:bg-ink-850/80", sel.has(c.id) && "bg-blue-600/10", c.do_not_contact && "opacity-60")}>
                  <td className="pl-4"><input type="checkbox" checked={sel.has(c.id)} onChange={() => { const n = new Set(sel); n.has(c.id) ? n.delete(c.id) : n.add(c.id); setSel(n); }} className="accent-blue-500" aria-label={`Seleccionar ${c.trade_name}`} /></td>
                  <td className="px-3 py-2 max-w-[240px]">
                    <button onClick={() => open(c.id)} className="text-left font-medium text-slate-100 hover:text-blue-300 truncate block max-w-full">{c.trade_name}</button>
                    {c.block_number && <span className="text-[10px] text-slate-500">Bloque {String(c.block_number).padStart(2, "0")}</span>}
                  </td>
                  <td className="px-3 text-slate-300 whitespace-nowrap">{countryName(c.country_iso2)}</td>
                  <td className="px-3 text-slate-300 whitespace-nowrap">{c.city || NF}</td>
                  <td className="px-3 text-slate-400 whitespace-nowrap">{sectorName(meta, c.sector)}</td>
                  <td className="px-3 whitespace-nowrap tabular-nums"><Val v={c.phone} status={c.phone_status} /></td>
                  <td className="px-3 max-w-[200px] truncate"><Val v={c.email} status={c.email_status} /></td>
                  <td className="px-3 max-w-[180px] truncate">{c.website ? <a href={c.website} target="_blank" rel="noreferrer noopener" className="text-blue-300 hover:underline">{c.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a> : <span className="text-slate-500">{NF}</span>}</td>
                  <td className="px-3 whitespace-nowrap text-[11px] text-slate-400">{[c.facebook && "FB", c.instagram && "IG", c.linkedin && "IN", c.whatsapp && "WA"].filter(Boolean).join(" · ") || <span className="text-slate-500">{NF}</span>}</td>
                  <td className="px-3 whitespace-nowrap"><Badge>{c.digital_category || "—"}</Badge> <span className="text-[11px] text-slate-400">{meta.categories[c.digital_category]?.slice(0, 34)}</span></td>
                  <td className="px-3 text-slate-300 whitespace-nowrap">{c.recommended_service || "—"}</td>
                  <td className="px-3"><ScoreBar score={c.score} /></td>
                  <td className="px-3"><Badge className={PRIORITY_STYLE[c.priority]}>{PRIORITY_SHORT[c.priority] || "—"}</Badge></td>
                  <td className={cx("px-3 whitespace-nowrap text-[12px]", VERIF_STYLE[c.verification_status])}>{meta.verification_statuses[c.verification_status]}</td>
                  <td className="px-3 whitespace-nowrap text-[12px] text-slate-300">{meta.commercial_statuses[c.commercial_status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="flex flex-wrap items-center gap-3 px-4 h-12 border-t border-line text-[13px] text-slate-400">
          <span className="tabular-nums">{data ? `${fmt(data.total)} empresas` : "…"}</span>
          <Select className="w-28" value={String(size)} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }} options={[["25", "25 / pág."], ["50", "50 / pág."], ["100", "100 / pág."], ["200", "200 / pág."]]} />
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
            <span className="tabular-nums">Página {page} de {pages}</span>
            <Button size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Siguiente</Button>
          </div>
        </footer>
      </div>
      <CreateModal open={creating} onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); bump(); open(id); }} defaults={{ country_iso2: f.country || "US", city: f.city || "" }} />
    </div>
  );
}

function Val({ v, status }: { v: string | null; status: string }) {
  const { meta } = useMeta();
  if (!v) return <span className="text-slate-500">{NF}</span>;
  const verified = status?.startsWith("verificado");
  return (
    <span className="inline-flex items-center gap-1" title={meta.field_statuses[status]}>
      {verified ? <I.IconCheck className="w-3 h-3 text-emerald-400 shrink-0" /> : status === "contradictorio" ? <I.IconAlert className="w-3 h-3 text-rose-400 shrink-0" /> : <span className="w-3" />}
      <span className="text-slate-200 truncate">{v}</span>
    </span>
  );
}

function CreateModal({ open, onClose, onCreated, defaults }: { open: boolean; onClose: () => void; onCreated: (id: number) => void; defaults: any }) {
  const { meta, countries } = useMeta();
  const [d, setD] = useState<any>({});
  useEffect(() => { if (open) setD({ ...defaults, source_name: "", source_url: "" }); }, [open]);
  const s = (k: string) => (e: any) => setD({ ...d, [k]: e.target.value });
  const save = async () => {
    try {
      const r = await api.post("/api/companies/new", Object.fromEntries(Object.entries(d).filter(([, v]) => v !== "")));
      toast.ok(r.result === "fusionada" ? "Ya existía: se fusionó con el registro existente" : "Prospecto creado");
      onCreated(r.id);
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Nuevo prospecto (manual)">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Nombre comercial *"><Input value={d.trade_name || ""} onChange={s("trade_name")} /></Field></div>
        <Field label="País *"><Select value={d.country_iso2 || ""} onChange={s("country_iso2")} options={countries.map((c) => [c.iso2, c.name])} /></Field>
        <Field label="Ciudad"><Input value={d.city || ""} onChange={s("city")} /></Field>
        <Field label="Sector"><Select value={d.sector || ""} onChange={s("sector")} placeholder="—" options={meta.sectors.map((x) => [x.key, x.name])} /></Field>
        <Field label="Teléfono empresarial"><Input value={d.phone || ""} onChange={s("phone")} /></Field>
        <Field label="Correo empresarial"><Input value={d.email || ""} onChange={s("email")} /></Field>
        <Field label="Web oficial"><Input value={d.website || ""} onChange={s("website")} /></Field>
        <div className="col-span-2"><Field label="Dirección comercial"><Input value={d.address || ""} onChange={s("address")} /></Field></div>
        <Field label="Fuente * (dónde lo encontraste)"><Input value={d.source_name || ""} onChange={s("source_name")} placeholder="Cámara de Comercio de…" /></Field>
        <Field label="URL de la fuente"><Input value={d.source_url || ""} onChange={s("source_url")} /></Field>
      </div>
      <p className="text-[11px] text-slate-500 mt-3">Registra solo datos empresariales publicados. Lo que no tengas, déjalo vacío: aparecerá como “No encontrado”.</p>
      <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={save} disabled={!d.trade_name || !d.source_name}>Guardar</Button></div>
    </Modal>
  );
}
