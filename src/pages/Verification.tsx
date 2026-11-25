import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { fmt, useMeta } from "../lib/meta";
import { navigate, useOpenCompany, useRefresh } from "../lib/nav";
import { Button, Empty, Field, Input, Panel, Select, toast } from "../components/ui";
import { IconMerge, IconTrash } from "../components/Icons";

export function Verification() {
  const { meta } = useMeta();
  const { tick, bump } = useRefresh();
  const open = useOpenCompany();
  const [dups, setDups] = useState<any[] | null>(null);
  const [exc, setExc] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [ex, setEx] = useState({ kind: "domain", value: "", reason: "" });

  useEffect(() => {
    api.get("/api/duplicates").then(setDups);
    api.get("/api/exclusions").then(setExc);
    Promise.all(Object.keys(meta.verification_statuses).map((k) => api.get(`/api/companies?verification_status=${k}&page_size=5`).then((r) => [k, r.total] as const)))
      .then((r) => setCounts(Object.fromEntries(r)));
  }, [tick]);

  const merge = async (a: number, b: number) => {
    try {
      await api.post("/api/duplicates/merge", { primary_id: a, secondary_id: b });
      toast.ok("Fusionadas. Se conservaron todas las fuentes.");
      bump();
    } catch (e: any) { toast.error(e.message); }
  };
  const addExc = async () => {
    try {
      await api.post("/api/exclusions", ex);
      setEx({ ...ex, value: "", reason: "" });
      toast.ok("Añadido a la lista de exclusión");
      bump();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {Object.entries(meta.verification_statuses).map(([k, label]) => (
          <button key={k} onClick={() => navigate("prospectos", { verification_status: k })} className="text-left rounded-lg bg-ink-900/70 ring-1 ring-line px-4 py-3 hover:ring-blue-500/50">
            <div className="text-[11px] text-slate-400 h-8 leading-tight">{label}</div>
            <div className="text-xl font-semibold tabular-nums">{fmt(counts[k])}</div>
          </button>
        ))}
      </div>
      <p className="text-[12px] text-slate-500 -mt-2">La verificación de web, correo y teléfono es independiente en cada ficha. Una empresa que solo aparece en un directorio nunca se marca como verificada.</p>

      <Panel title={`Posibles duplicados${dups ? ` (${dups.length})` : ""}`} bodyClass="p-0">
        {!dups ? null : dups.length === 0 ? <Empty title="No se detectaron duplicados">Se comparan dominio, teléfono, dirección y nombre normalizado.</Empty> : (
          <table className="w-full text-[13px]">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-line"><tr><th className="text-left font-medium px-4 py-2">Registro A</th><th className="text-left font-medium">Registro B</th><th className="text-left font-medium">Motivo</th><th className="px-4" /></tr></thead>
            <tbody className="divide-y divide-line">
              {dups.map((d) => (
                <tr key={`${d.a_id}-${d.b_id}`}>
                  <td className="px-4 py-2"><button className="hover:text-blue-300" onClick={() => open(d.a_id)}>#{d.a_id} {d.a_name}</button> <span className="text-slate-500">{d.a_city}</span></td>
                  <td><button className="hover:text-blue-300" onClick={() => open(d.b_id)}>#{d.b_id} {d.b_name}</button> <span className="text-slate-500">{d.b_city}</span></td>
                  <td className="text-slate-400">{d.reason}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap space-x-2">
                    <Button size="sm" onClick={() => merge(d.a_id, d.b_id)}><IconMerge className="w-3.5 h-3.5" />Conservar A</Button>
                    <Button size="sm" onClick={() => merge(d.b_id, d.a_id)}><IconMerge className="w-3.5 h-3.5" />Conservar B</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Lista de exclusión (No contactar)">
        <div className="grid md:grid-cols-[160px_1fr_1fr_auto] gap-3 items-end">
          <Field label="Tipo"><Select value={ex.kind} onChange={(e) => setEx({ ...ex, kind: e.target.value })} options={[["domain", "Dominio web"], ["email", "Correo"], ["phone", "Teléfono"], ["name", "Nombre"]]} /></Field>
          <Field label="Valor"><Input value={ex.value} onChange={(e) => setEx({ ...ex, value: e.target.value })} placeholder="empresa.com" /></Field>
          <Field label="Motivo"><Input value={ex.reason} onChange={(e) => setEx({ ...ex, reason: e.target.value })} placeholder="Solicitó no ser contactado" /></Field>
          <Button variant="primary" onClick={addExc} disabled={!ex.value.trim()}>Añadir</Button>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">Los registros que coincidan se marcan “No contactar” y las nuevas investigaciones no los vuelven a añadir.</p>
        {exc.length > 0 && (
          <ul className="mt-4 divide-y divide-line rounded-md ring-1 ring-line">
            {exc.map((e) => (
              <li key={e.id} className="px-3 py-2 flex items-center gap-3 text-[13px]">
                <span className="text-[11px] uppercase text-slate-500 w-16">{e.kind}</span><span className="text-slate-200">{e.value}</span><span className="text-slate-500">{e.reason}</span>
                <button className="ml-auto text-slate-500 hover:text-rose-300" onClick={async () => { await api.del(`/api/exclusions/${e.id}`); bump(); }} aria-label="Quitar"><IconTrash className="w-3.5 h-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
