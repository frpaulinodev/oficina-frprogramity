import { createContext, useContext } from "react";

export type Meta = {
  continents: Record<string, string>;
  sectors: { key: string; name: string; extra: boolean }[];
  commercial_statuses: Record<string, string>;
  verification_statuses: Record<string, string>;
  field_statuses: Record<string, string>;
  categories: Record<string, string>;
  priorities: Record<string, string>;
  providers: { key: string; name: string; available: boolean; needs_key: boolean; notes: string }[];
  block_size: number;
};

export type Country = {
  iso2: string; iso3: string; name: string; name_en: string; continent: string; lat: number; lon: number;
  target: number; coverage_notes: string | null; research_status: string; total: number; no_web: number;
  high: number; verified: number; coverage_pct: number;
};

export const MetaContext = createContext<{ meta: Meta; countries: Country[]; reloadCountries: () => void } | null>(null);

export function useMeta() {
  const m = useContext(MetaContext);
  if (!m) throw new Error("MetaContext");
  return m;
}

export const sectorName = (meta: Meta, key?: string | null) => meta.sectors.find((s) => s.key === key)?.name || (key ? key : "Sin clasificar");

export const PRIORITY_STYLE: Record<string, string> = {
  muy_alta: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  alta: "bg-sky-400/15 text-sky-300 ring-sky-400/30",
  media: "bg-amber-400/10 text-amber-200 ring-amber-300/25",
  baja: "bg-slate-400/10 text-slate-300 ring-slate-400/20",
};
export const PRIORITY_SHORT: Record<string, string> = { muy_alta: "Muy alta", alta: "Alta", media: "Media", baja: "Baja" };

export const VERIF_STYLE: Record<string, string> = {
  encontrado_1_fuente: "text-slate-300",
  verificado_fuente_oficial: "text-emerald-300",
  verificado_web: "text-emerald-300",
  verificado_2_fuentes: "text-emerald-300",
  pendiente_revision: "text-amber-200",
  dato_contradictorio: "text-rose-300",
  posiblemente_inactiva: "text-rose-300",
  contradictorio: "text-rose-300",
  no_encontrado: "text-slate-500",
};

export const STATUS_GROUP: Record<string, string> = {
  nuevo: "slate", pendiente_investigar: "slate", verificado: "sky", contacto_pendiente: "sky", primer_contacto: "blue",
  esperando_respuesta: "blue", interesado: "emerald", reunion: "emerald", propuesta: "emerald", negociacion: "emerald",
  ganado: "green", perdido: "rose", no_contactar: "rose",
};

export const CATEGORY_COLOR: Record<string, string> = {
  A: "#34d399", B: "#38bdf8", C: "#a78bfa", D: "#60a5fa", E: "#64748b", F: "#475569",
};

export const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString("es");
export const NF = "No encontrado";
