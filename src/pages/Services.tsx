import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button, Field, Input, Panel, Textarea, cx, toast } from "../components/ui";
import { IconPlus, IconTrash } from "../components/Icons";
import { FrBrand, FrMark } from "../components/Brand";

const num = (v: any) => (v === "" || v === null || v === undefined ? null : Number(v));

function Profile() {
  const [p, setP] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  useEffect(() => { api.get("/api/profile").then(setP); }, []);
  const set = (k: string, v: string) => { setP((x) => ({ ...x, [k]: v })); setDirty(true); };
  const save = async (extra?: Record<string, string>) => {
    try {
      const body = { ...p, ...(extra || {}) };
      const r = await api.put("/api/profile", body);
      setP(r); setDirty(false);
      window.dispatchEvent(new Event("glf:brand"));
      toast.ok("Perfil guardado");
    } catch (e: any) { toast.error(e.message); }
  };
  const variant = (p.logo_variant || "1") as "1" | "2" | "3";
  const names: Record<string, string> = { "1": "Código", "2": "Circuito", "3": "Cursor" };
  return (
    <div className="grid lg:grid-cols-[1.1fr_1fr] gap-4">
      <Panel title="Logo de FRPROGRAMITY" className="lift">
        <p className="text-[12px] text-slate-400 mb-3">Elige el logo de tu empresa. Se usa en el inicio de sesión, el menú y las exportaciones.</p>
        <div className="grid grid-cols-3 gap-3">
          {(["1", "2", "3"] as const).map((v) => (
            <button key={v} onClick={() => { setP((x) => ({ ...x, logo_variant: v })); save({ logo_variant: v }); }}
              className={cx("rounded-xl p-4 flex flex-col items-center gap-3 ring-1 transition-all hover:-translate-y-0.5", variant === v ? "ring-amber-400/70 bg-gradient-to-b from-amber-500/15 to-transparent shadow-[0_18px_40px_-20px_rgba(251,191,36,.8)]" : "ring-line hover:ring-amber-400/30 bg-ink-900/40")}>
              <FrMark variant={v} size={72} />
              <span className="text-[12px] text-slate-300">Opción {v} · {names[v]}</span>
              {variant === v && <span className="text-[10px] uppercase tracking-wider text-amber-300">Seleccionado</span>}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-gradient-to-br from-[#2a1a10] to-[#120b07] ring-1 ring-amber-900/40 p-4 flex items-center justify-center">
          <FrBrand variant={variant} size={46} name={p.company_name || "FRPROGRAMITY"} />
        </div>
      </Panel>
      <Panel title="Mi perfil comercial" className="lift" actions={<Button size="sm" variant={dirty ? "primary" : "default"} onClick={() => save()}>Guardar perfil</Button>}>
        <p className="text-[12px] text-slate-400 mb-3">Estos datos firman los mensajes que la app te prepara. Nada se envía solo: tú revisas y envías.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Tu nombre"><Input value={p.seller_name || ""} onChange={(e) => set("seller_name", e.target.value)} placeholder="Nombre y apellido" /></Field>
          <Field label="Empresa"><Input value={p.company_name || ""} onChange={(e) => set("company_name", e.target.value.toUpperCase())} placeholder="FRPROGRAMITY" /></Field>
          <Field label="Teléfono / WhatsApp"><Input value={p.seller_phone || ""} onChange={(e) => set("seller_phone", e.target.value)} placeholder="+1 809 000 0000" /></Field>
          <Field label="Correo"><Input type="email" value={p.seller_email || ""} onChange={(e) => set("seller_email", e.target.value)} placeholder="ventas@tuempresa.com" /></Field>
          <div className="sm:col-span-2"><Field label="Sitio web o portafolio"><Input value={p.seller_website || ""} onChange={(e) => set("seller_website", e.target.value)} placeholder="https://..." /></Field></div>
        </div>
      </Panel>
    </div>
  );
}

export function Services() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const load = () => api.get("/api/services").then(setRows);
  useEffect(() => { load(); }, []);

  const save = async (r: any) => {
    try {
      const payload = {
        name: r.name, description: r.description || null, unit: r.unit || null, currency: (r.currency || "USD").toUpperCase(), active: !!r.active,
        price_min: num(r.price_min), price_max: num(r.price_max),
        monthly_min: num(r.monthly_min), monthly_max: num(r.monthly_max), notes: r.notes || null,
      };
      if (r.id) await api.put(`/api/services/${r.id}`, payload);
      else await api.post("/api/services", payload);
      toast.ok("Servicio guardado");
      load();
    } catch (e: any) { toast.error(e.message); }
  };
  const upd = (i: number, k: string, v: any) => setRows((x) => x.map((r, j) => (j === i ? { ...r, [k]: v, _dirty: true } : r)));
  const money = (a: any, b: any) => (a == null && b == null ? "Sin definir" : `${a ?? "?"}–${b ?? "?"}`);

  return (
    <div className="space-y-4">
      <Profile />
      <Panel title="Mis servicios y precios" actions={<Button size="sm" onClick={() => setRows([...rows, { name: "", currency: "USD", unit: "proyecto", active: 1, _dirty: true }])}><IconPlus className="w-3.5 h-3.5" />Añadir servicio</Button>} bodyClass="p-0">
        <p className="px-4 pt-3 text-[12px] text-slate-500">Los precios los defines tú. Pon el precio del proyecto y, si aplica, la cuota mensual (hosting, mantenimiento, soporte). En “Notas” explica qué hace subir o bajar el precio.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] mt-2">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-line">
              <tr>
                <th className="text-left font-medium px-4 py-2 w-52">Servicio</th><th className="text-left font-medium">Descripción</th>
                <th className="text-left font-medium w-24">Desde</th><th className="text-left font-medium w-24">Hasta</th>
                <th className="text-left font-medium w-24 text-amber-300/80">Mensual desde</th><th className="text-left font-medium w-24 text-amber-300/80">Mensual hasta</th>
                <th className="text-left font-medium w-16">Moneda</th><th className="font-medium w-14">Activo</th><th className="w-48 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r, i) => {
                const key = String(r.id || `n${i}`);
                return [
                  <tr key={key} className="hover:bg-white/[.02] transition-colors">
                    <td className="px-4 py-2"><Input value={r.name} onChange={(e) => upd(i, "name", e.target.value)} className="h-8" /></td>
                    <td className="py-2 pr-2"><Input value={r.description || ""} onChange={(e) => upd(i, "description", e.target.value)} className="h-8" /></td>
                    <td className="pr-2"><Input type="number" min={0} placeholder="—" value={r.price_min ?? ""} onChange={(e) => upd(i, "price_min", e.target.value)} className="h-8" /></td>
                    <td className="pr-2"><Input type="number" min={0} placeholder="—" value={r.price_max ?? ""} onChange={(e) => upd(i, "price_max", e.target.value)} className="h-8" /></td>
                    <td className="pr-2"><Input type="number" min={0} placeholder="—" value={r.monthly_min ?? ""} onChange={(e) => upd(i, "monthly_min", e.target.value)} className="h-8" /></td>
                    <td className="pr-2"><Input type="number" min={0} placeholder="—" value={r.monthly_max ?? ""} onChange={(e) => upd(i, "monthly_max", e.target.value)} className="h-8" /></td>
                    <td className="pr-2"><Input maxLength={3} value={r.currency || ""} onChange={(e) => upd(i, "currency", e.target.value)} className="h-8 uppercase" /></td>
                    <td className="text-center"><input type="checkbox" className="accent-emerald-500" checked={!!r.active} onChange={(e) => upd(i, "active", e.target.checked ? 1 : 0)} /></td>
                    <td className="px-4 text-right whitespace-nowrap space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}>{open[key] ? "Ocultar notas" : "Notas"}</Button>
                      <Button size="sm" variant={r._dirty ? "primary" : "default"} disabled={!r.name} onClick={() => save(r)}>Guardar</Button>
                      <Button size="sm" variant="ghost" onClick={async () => { if (r.id) { await api.del(`/api/services/${r.id}`); } load(); }} aria-label="Eliminar"><IconTrash className="w-3.5 h-3.5" /></Button>
                    </td>
                  </tr>,
                  open[key] && (
                    <tr key={key + "-n"} className="bg-ink-900/40">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="grid md:grid-cols-[1fr_220px] gap-3">
                          <Field label="Qué hace variar el precio" hint="Ej.: número de páginas, idiomas, integraciones, pasarela de pago, cantidad de usuarios, urgencia.">
                            <Textarea rows={3} value={r.notes || ""} onChange={(e) => upd(i, "notes", e.target.value)} />
                          </Field>
                          <div className="rounded-lg ring-1 ring-line p-3 text-[12px] text-slate-400 space-y-1">
                            <div>Proyecto: <span className="text-slate-100">{money(r.price_min, r.price_max)} {r.currency}</span></div>
                            <div>Mensual: <span className="text-amber-200">{money(r.monthly_min, r.monthly_max)} {r.currency}</span></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
