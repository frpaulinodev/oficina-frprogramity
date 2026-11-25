import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { NF, PRIORITY_SHORT, PRIORITY_STYLE, VERIF_STYLE, sectorName, useMeta } from "../lib/meta";
import { Badge, Button, Drawer, Field, Input, ScoreBar, Select, Spinner, Textarea, cx, toast } from "../components/ui";
import * as I from "../components/Icons";

const EDITABLE: [string, string][] = [
  ["trade_name", "Nombre comercial"], ["legal_name", "Nombre legal"], ["city", "Ciudad"], ["region", "Región / provincia"],
  ["address", "Dirección comercial"], ["phone", "Teléfono empresarial"], ["whatsapp", "WhatsApp empresarial"], ["email", "Correo empresarial"],
  ["website", "Página web oficial"], ["facebook", "Facebook"], ["instagram", "Instagram"], ["linkedin", "LinkedIn"],
  ["other_socials", "Otras redes"], ["contact_person", "Responsable (solo si es público)"], ["contact_role", "Cargo publicado"], ["subsector", "Subsector"],
];

export function CompanyDrawer({ id, onClose, onChanged }: { id: number | null; onClose: () => void; onChanged: () => void }) {
  const { meta, countries } = useMeta();
  const [c, setC] = useState<any>(null);
  const [edit, setEdit] = useState<any | null>(null);
  const [note, setNote] = useState({ body: "", kind: "nota", due_date: "" });
  const [busy, setBusy] = useState(false);

  const load = () => id && api.get(`/api/companies/${id}`).then(setC).catch((e) => { toast.error(e.message); onClose(); });
  useEffect(() => { setC(null); setEdit(null); if (id) load(); }, [id]);

  const patch = async (data: any, msg = "Guardado") => {
    try {
      const r = await api.patch(`/api/companies/${id}`, data);
      setC(r);
      toast.ok(msg);
      onChanged();
    } catch (e: any) { toast.error(e.message); }
  };
  const addNote = async () => {
    if (!note.body.trim()) return;
    await api.post(`/api/companies/${id}/notes`, { ...note, due_date: note.due_date || null });
    setNote({ body: "", kind: "nota", due_date: "" });
    load();
    onChanged();
  };
  const analyze = async () => {
    setBusy(true);
    try {
      setC(await api.post(`/api/companies/${id}/analyze-website`));
      toast.ok("Web analizada");
      onChanged();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!confirm("¿Eliminar este registro y sus fuentes? No se puede deshacer.")) return;
    await api.del(`/api/companies/${id}`);
    toast.ok("Registro eliminado");
    onChanged();
    onClose();
  };

  const country = countries.find((x) => x.iso2 === c?.country_iso2);
  const wa = c?.website_analysis;

  return (
    <Drawer open={id !== null} onClose={onClose}>
      {!c ? <div className="h-full grid place-items-center"><Spinner /></div> : (
        <div>
          <header className="px-6 pt-5 pb-4 border-b border-line bg-gradient-to-b from-blue-950/40 to-transparent">
            <div className="flex flex-wrap gap-1.5 mb-2 pr-8">
              <Badge className={PRIORITY_STYLE[c.priority]}>{meta.priorities[c.priority] || "Sin prioridad"}</Badge>
              <Badge>Cat. {c.digital_category} · {meta.categories[c.digital_category]}</Badge>
              <Badge className={cx("bg-ink-800 ring-line", VERIF_STYLE[c.verification_status])}>{meta.verification_statuses[c.verification_status]}</Badge>
              {c.block_number && <Badge>Bloque {String(c.block_number).padStart(2, "0")}</Badge>}
              {c.is_chain ? <Badge className="bg-amber-400/10 text-amber-200 ring-amber-300/30">Posible cadena</Badge> : null}
              {c.do_not_contact ? <Badge className="bg-rose-500/15 text-rose-300 ring-rose-400/30">No contactar</Badge> : null}
            </div>
            <h2 className="text-xl font-semibold text-slate-50">{c.trade_name}</h2>
            <div className="text-[13px] text-slate-400 mt-0.5">{[c.city, c.region, country?.name].filter(Boolean).join(", ")} · {sectorName(meta, c.sector)}{c.subsector ? ` · ${c.subsector}` : ""}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setEdit(edit ? null : Object.fromEntries(EDITABLE.map(([k]) => [k, c[k] || ""])))}>{edit ? "Cancelar edición" : "Corregir datos"}</Button>
              {c.website && <Button size="sm" onClick={analyze} disabled={busy}>{busy ? <Spinner className="w-3 h-3" /> : <I.IconRefresh className="w-3.5 h-3.5" />}Analizar web</Button>}
              {!c.do_not_contact ? <Button size="sm" variant="danger" onClick={() => patch({ do_not_contact: true }, "Marcado como No contactar")}>No contactar</Button>
                : <Button size="sm" onClick={() => patch({ do_not_contact: false, commercial_status: "nuevo" }, "Reactivado")}>Quitar “No contactar”</Button>}
              <Button size="sm" variant="ghost" onClick={remove}><I.IconTrash className="w-3.5 h-3.5" />Eliminar</Button>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {edit ? (
              <section className="rounded-lg ring-1 ring-blue-500/30 bg-blue-950/20 p-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  {EDITABLE.map(([k, label]) => <Field key={k} label={label}><Input value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></Field>)}
                  <Field label="Sector"><Select value={edit.sector ?? c.sector ?? ""} onChange={(e) => setEdit({ ...edit, sector: e.target.value })} placeholder="—" options={meta.sectors.map((s) => [s.key, s.name])} /></Field>
                  <Field label="Actividad"><Select value={edit.activity_status ?? c.activity_status} onChange={(e) => setEdit({ ...edit, activity_status: e.target.value })} options={[["activa_segun_fuente", "Activa según fuente"], ["posiblemente_inactiva", "Posiblemente inactiva"]]} /></Field>
                </div>
                <p className="text-[11px] text-slate-500 mt-3">Los campos vacíos se guardan como “No encontrado”. Al guardar se recalculan diagnóstico y puntuación.</p>
                <div className="mt-3 flex gap-2"><Button size="sm" variant="primary" onClick={async () => { await patch(edit); setEdit(null); }}>Guardar cambios</Button></div>
              </section>
            ) : (
              <section>
                <H>Datos públicos de contacto</H>
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  <Row label="Teléfono empresarial" v={c.phone} status={c.phone_status} icon={<I.IconPhone className="w-3.5 h-3.5" />} />
                  <Row label="Correo empresarial" v={c.email} status={c.email_status} icon={<I.IconMail className="w-3.5 h-3.5" />} href={c.email ? `mailto:${c.email}` : undefined} />
                  <Row label="Página web oficial" v={c.website} status={c.web_status} icon={<I.IconLink className="w-3.5 h-3.5" />} href={c.website} />
                  <Row label="Dirección comercial" v={c.address} status={c.address_status} />
                  <Row label="WhatsApp empresarial" v={c.whatsapp} />
                  <Row label="Nombre legal" v={c.legal_name} />
                  <Row label="Facebook" v={c.facebook} href={c.facebook} />
                  <Row label="Instagram" v={c.instagram} href={c.instagram} />
                  <Row label="LinkedIn" v={c.linkedin} href={c.linkedin} />
                  <Row label="Otras redes" v={c.other_socials} />
                  <Row label="Responsable publicado" v={c.contact_person ? `${c.contact_person}${c.contact_role ? ` (${c.contact_role})` : ""}` : null} />
                  <Row label="Primera recopilación" v={c.first_collected_at?.slice(0, 10)} />
                </dl>
              </section>
            )}

            <section>
              <H>Análisis comercial</H>
              <div className="rounded-lg bg-ink-900 ring-1 ring-line divide-y divide-line">
                <div className="p-4 grid sm:grid-cols-[1fr_200px] gap-4">
                  <div>
                    <Label>Diagnóstico digital preliminar</Label>
                    <p className="text-[13px] text-slate-200">{c.diagnosis}</p>
                    <Label className="mt-3">Evidencia</Label>
                    <p className="text-[13px] text-slate-400 whitespace-pre-line">{c.evidence}</p>
                  </div>
                  <div>
                    <Label>Puntuación</Label>
                    <ScoreBar score={c.score} />
                    <div className="mt-1.5"><Badge className={PRIORITY_STYLE[c.priority]}>{PRIORITY_SHORT[c.priority]}</Badge> <span className="text-[11px] text-slate-500 ml-1">Confianza {c.confidence}</span></div>
                    <details className="mt-2 text-[12px] text-slate-400"><summary className="cursor-pointer text-slate-300">¿Por qué esta puntuación?</summary><pre className="whitespace-pre-wrap font-sans mt-1.5 leading-relaxed">{c.score_reasons}</pre></details>
                  </div>
                </div>
                <div className="p-4 grid sm:grid-cols-2 gap-4 text-[13px]">
                  <div><Label>Posible problema empresarial</Label><p className="text-slate-300">{c.problem}</p></div>
                  <div><Label>Solución tecnológica</Label><p className="text-slate-300">{c.solution}</p></div>
                  <div><Label>Beneficio comercial</Label><p className="text-slate-300">{c.benefit}</p></div>
                  <div><Label>Servicio a ofrecer</Label><p className="text-emerald-300 font-medium">{c.recommended_service}</p></div>
                </div>
                <div className="px-4 py-2.5 text-[11px] text-slate-500">Hipótesis comercial basada en información pública. No indica intención de compra ni presupuesto confirmado.</div>
              </div>
            </section>

            {!c.do_not_contact && <MessageBox id={c.id} onContacted={(x: any) => { setC(x); onChanged(); }} />}

            {wa && (
              <section>
                <H>Análisis automático de la web</H>
                {wa.ok ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
                    <Chk ok={wa.https} label="HTTPS" />
                    <Chk ok={wa.has_viewport} label="Adaptada a móvil (viewport)" />
                    <Chk ok={!!wa.meta_description} label="Meta descripción" />
                    <Chk ok={wa.has_contact_form} label="Formulario" />
                    <Chk ok={wa.has_booking} label="Reservas / citas en línea" />
                    <Chk ok={wa.has_ecommerce} label="Tienda / pedidos" />
                    <Chk ok={wa.has_whatsapp} label="WhatsApp" />
                    <Chk ok={wa.has_chat} label="Chat en vivo" />
                    <div className="col-span-2 sm:col-span-4 text-slate-500 mt-1">Título: {wa.title || NF} · Copyright: {wa.copyright_year || NF} · Respuesta: {wa.load_ms ? `${(wa.load_ms / 1000).toFixed(1)} s` : NF} · Analizada {c.website_analyzed_at?.slice(0, 10)}</div>
                  </div>
                ) : <p className="text-[13px] text-amber-200">No se pudo analizar: {wa.error}</p>}
              </section>
            )}

            <section>
              <H>Seguimiento comercial</H>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Estado"><Select value={c.commercial_status} onChange={(e) => patch({ commercial_status: e.target.value }, "Estado actualizado")} options={Object.entries(meta.commercial_statuses)} /></Field>
                <Field label="Próxima acción"><Input defaultValue={c.next_action || ""} key={"na" + c.updated_at} onBlur={(e) => e.target.value !== (c.next_action || "") && patch({ next_action: e.target.value })} /></Field>
                <Field label="Fecha próxima acción"><Input type="date" defaultValue={c.next_action_date || ""} key={"nd" + c.updated_at} onChange={(e) => patch({ next_action_date: e.target.value || null })} /></Field>
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5">Último contacto: {c.last_contact_date || "—"}. La app no envía mensajes: registra aquí los contactos que hagas.</div>
              <div className="grid sm:grid-cols-3 gap-3 mt-3">
                <Field label="Valor del trato (USD)"><Input type="number" min={0} defaultValue={c.deal_value ?? ""} key={"dv" + c.updated_at} onBlur={(e) => String(c.deal_value ?? "") !== e.target.value && patch({ deal_value: e.target.value }, "Valor guardado")} placeholder="Ej. 900" /></Field>
                <div className="sm:col-span-2"><Field label="Servicio vendido / propuesto"><Input defaultValue={c.deal_service || ""} key={"ds" + c.updated_at} onBlur={(e) => e.target.value !== (c.deal_service || "") && patch({ deal_service: e.target.value })} placeholder={c.recommended_service || "Ej. Página web básica"} /></Field></div>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Al marcar “Cliente ganado” con su valor, la venta aparece en Resultados de ventas.</div>
              <div className="mt-4 rounded-lg ring-1 ring-line p-3 space-y-2">
                <div className="flex gap-2">
                  <Select className="w-40" value={note.kind} onChange={(e) => setNote({ ...note, kind: e.target.value })} options={[["nota", "Nota"], ["contacto", "Contacto realizado"], ["recordatorio", "Recordatorio"]]} />
                  {note.kind === "recordatorio" && <Input type="date" className="w-40" value={note.due_date} onChange={(e) => setNote({ ...note, due_date: e.target.value })} />}
                </div>
                <Textarea placeholder="Escribe una nota, resultado de llamada o recordatorio…" value={note.body} onChange={(e) => setNote({ ...note, body: e.target.value })} />
                <Button size="sm" variant="primary" onClick={addNote} disabled={!note.body.trim()}>Añadir</Button>
              </div>
              <ul className="mt-3 space-y-2">
                {c.notes.map((n: any) => (
                  <li key={n.id} className={cx("rounded-md px-3 py-2 text-[13px] ring-1 ring-line", n.kind === "sistema" ? "bg-ink-950/50 text-slate-500" : "bg-ink-900")}>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="uppercase tracking-wider">{n.kind}</span><span>{n.created_at.slice(0, 16).replace("T", " ")}</span>
                      {n.due_date && <span className="text-amber-200">vence {n.due_date}</span>}
                      {n.kind === "recordatorio" && (
                        <label className="ml-auto flex items-center gap-1"><input type="checkbox" className="accent-emerald-500" checked={!!n.done} onChange={async () => { await api.patch(`/api/notes/${n.id}`, { done: !n.done }); load(); onChanged(); }} />hecho</label>
                      )}
                      <button className={cx("text-slate-500 hover:text-rose-300", n.kind !== "recordatorio" && "ml-auto")} onClick={async () => { await api.del(`/api/notes/${n.id}`); load(); }} aria-label="Borrar nota"><I.IconX className="w-3 h-3" /></button>
                    </div>
                    <div className={cx("mt-0.5 whitespace-pre-line", n.done && "line-through text-slate-500")}>{n.body}</div>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <H>Fuentes ({c.sources.length})</H>
              <ul className="space-y-2">
                {c.sources.map((s: any) => (
                  <li key={s.id} className="rounded-md bg-ink-900 ring-1 ring-line px-3 py-2 text-[13px]">
                    <div className="flex items-center gap-2"><span className="font-medium text-slate-200">{s.source_name}</span><Badge>{s.source_type}</Badge><span className="ml-auto text-[11px] text-slate-500">consultado {s.consulted_at.slice(0, 10)}</span></div>
                    {s.url ? <a href={s.url} target="_blank" rel="noreferrer noopener" className="text-[12px] text-blue-300 hover:underline break-all inline-flex items-center gap-1">{s.url}<I.IconExternal className="w-3 h-3" /></a> : <div className="text-[12px] text-slate-500">Sin URL directa</div>}
                    {Object.keys(s.fields || {}).length > 0 && <div className="text-[11px] text-slate-500 mt-0.5">Aportó: {Object.keys(s.fields).join(", ")}</div>}
                    {s.license && <div className="text-[11px] text-slate-600">{s.license}</div>}
                  </li>
                ))}
              </ul>
              {c.merged_from.length > 0 && <div className="text-[11px] text-slate-500 mt-2">Fusionado desde: {c.merged_from.map((m: any) => `#${m.id} ${m.trade_name}`).join(", ")}</div>}
            </section>
          </div>
        </div>
      )}
    </Drawer>
  );
}

const H = ({ children }: { children: React.ReactNode }) => <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-3">{children}</h3>;
const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={cx("text-[11px] uppercase tracking-wider text-slate-500 mb-1", className)}>{children}</div>;

function Row({ label, v, status, icon, href }: { label: string; v?: string | null; status?: string; icon?: React.ReactNode; href?: string }) {
  const { meta } = useMeta();
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">{icon}{label}</dt>
      <dd className="text-[13px] mt-0.5 break-words">
        {v ? (href ? <a href={href} target="_blank" rel="noreferrer noopener" className="text-blue-300 hover:underline">{v}</a> : <span className="text-slate-100">{v}</span>) : <span className="text-slate-500">{NF}</span>}
        {status && v && <span className={cx("block text-[11px]", VERIF_STYLE[status])}>{meta.field_statuses[status]}</span>}
      </dd>
    </div>
  );
}

function Chk({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={cx("rounded px-2 py-1.5 ring-1 flex items-center gap-1.5", ok ? "ring-emerald-400/25 bg-emerald-400/5 text-emerald-200" : "ring-line bg-ink-900 text-slate-400")}>
      {ok ? <I.IconCheck className="w-3 h-3" /> : <I.IconX className="w-3 h-3" />}{label}
    </div>
  );
}


function MessageBox({ id, onContacted }: { id: number; onContacted: (c: any) => void }) {
  const [lang, setLang] = useState<string | null>(null);
  const [m, setM] = useState<any>(null);
  const [tab, setTab] = useState<"whatsapp" | "email">("whatsapp");
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  useEffect(() => {
    api.get(`/api/companies/${id}/messages${lang ? `?lang=${lang}` : ""}`).then((x) => { setM(x); setLang(x.language); });
  }, [id, lang]);
  useEffect(() => { if (m) { setText(tab === "email" ? m.email : m.whatsapp); setSubject(m.subject); } }, [m, tab]);
  if (!m) return null;
  const copy = async () => { try { await navigator.clipboard.writeText(tab === "email" ? `${subject}\n\n${text}` : text); toast.ok("Mensaje copiado"); } catch { toast.error("No se pudo copiar; selecciónalo y cópialo a mano"); } };
  const waUrl = m.whatsapp_number ? `https://wa.me/${m.whatsapp_number}?text=${encodeURIComponent(text)}` : null;
  const mailUrl = m.email_to ? `mailto:${m.email_to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}` : null;
  const markSent = async () => { const r = await api.post(`/api/companies/${id}/contacted`, { channel: tab, text }); toast.ok("Registrado como contactado"); onContacted(r); };
  return (
    <section>
      <H>Mensaje sugerido</H>
      <div className="rounded-xl glass-panel p-4">
        <div className="flex flex-wrap items-center gap-2">
          {(["whatsapp", "email"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cx("h-8 px-3 rounded-lg text-[12px] ring-1 transition-colors", tab === t ? "bg-emerald-400/15 ring-emerald-400/40 text-emerald-200" : "ring-line text-slate-400 hover:text-slate-100")}>{t === "whatsapp" ? "WhatsApp" : "Correo"}</button>
          ))}
          <div className="ml-auto flex gap-1">
            {["es", "en"].map((l) => <button key={l} onClick={() => setLang(l)} className={cx("h-7 px-2 rounded text-[11px] uppercase ring-1", lang === l ? "bg-blue-500/20 ring-blue-400/50 text-white" : "ring-line text-slate-500")}>{l}</button>)}
          </div>
        </div>
        {tab === "email" && <Input className="mt-3" value={subject} onChange={(e) => setSubject(e.target.value)} />}
        <Textarea className="mt-3 min-h-[170px] leading-relaxed" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={copy}>Copiar</Button>
          {tab === "whatsapp" && (waUrl ? <a href={waUrl} target="_blank" rel="noreferrer noopener"><Button size="sm" variant="subtle">Abrir en WhatsApp</Button></a> : <span className="text-[11px] text-slate-500 self-center">Sin teléfono para WhatsApp</span>)}
          {tab === "email" && (mailUrl ? <a href={mailUrl}><Button size="sm" variant="subtle">Abrir en mi correo</Button></a> : <span className="text-[11px] text-slate-500 self-center">Sin correo público</span>)}
          <Button size="sm" variant="primary" className="ml-auto" onClick={markSent}><I.IconCheck className="w-3.5 h-3.5" />Ya lo envié</Button>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">Revisa y personaliza antes de enviar. La app no envía nada sola: envía pocos mensajes y bien hechos para no parecer spam.</p>
      </div>
    </section>
  );
}
