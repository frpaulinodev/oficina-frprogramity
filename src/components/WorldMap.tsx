import { useEffect, useMemo, useState } from "react";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import type { Country } from "../lib/meta";

// Contornos de países (world-atlas, Natural Earth 1:110m). Si no hay internet, el mapa funciona igual
// con la cuadrícula y los marcadores por país.
const ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
let atlasCache: any = null;

function decodeTopo(topo: any) {
  const { scale, translate } = topo.transform;
  const arcs: number[][][] = topo.arcs.map((arc: number[][]) => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => {
      x += dx; y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
  });
  const ring = (idx: number[]) => {
    const pts: number[][] = [];
    idx.forEach((i, k) => {
      const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
      pts.push(...(k ? a.slice(1) : a));
    });
    return pts;
  };
  const geoms = topo.objects.countries.geometries.map((g: any) => ({
    type: "Feature", properties: {}, geometry: g.type === "Polygon"
      ? { type: "Polygon", coordinates: g.arcs.map(ring) }
      : { type: "MultiPolygon", coordinates: g.arcs.map((p: number[][]) => p.map(ring)) },
  }));
  return { type: "FeatureCollection", features: geoms };
}

export function WorldMap({ countries, selected, onSelect, continent, height = 420 }: {
  countries: Country[]; selected?: string | null; onSelect?: (iso: string) => void; continent?: string | null; height?: number;
}) {
  const [land, setLand] = useState<any>(atlasCache);
  const [hover, setHover] = useState<{ c: Country; x: number; y: number } | null>(null);
  const width = 960;

  useEffect(() => {
    if (atlasCache) return;
    fetch(ATLAS_URL).then((r) => r.json()).then((t) => { atlasCache = decodeTopo(t); setLand(atlasCache); }).catch(() => {});
  }, []);

  const shown = continent ? countries.filter((c) => c.continent === continent) : countries;

  const projection = useMemo(() => {
    const p = geoNaturalEarth1();
    if (continent && shown.length) {
      const pts = { type: "MultiPoint", coordinates: shown.map((c) => [c.lon, c.lat]) } as any;
      p.fitExtent([[60, 40], [width - 60, height - 40]], pts);
    } else {
      p.fitExtent([[8, 8], [width - 8, height - 8]], { type: "Sphere" } as any);
    }
    return p;
  }, [continent, shown.length, height]);

  const path = geoPath(projection);
  const max = Math.max(1, ...countries.map((c) => c.total));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none" role="img" aria-label="Mapa mundial de prospectos">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={path({ type: "Sphere" } as any) || ""} fill="#081428" stroke="#1b2f52" />
        <path d={path(geoGraticule10() as any) || ""} fill="none" stroke="#12274a" strokeWidth={0.5} />
        {land && <path d={path(land) || ""} fill="#10223f" stroke="#1d375f" strokeWidth={0.5} />}
        {shown.map((c) => {
          const xy = projection([c.lon, c.lat]);
          if (!xy) return null;
          const r = c.total ? 3 + 14 * Math.sqrt(c.total / max) : 1.8;
          const isSel = selected === c.iso2;
          const done = c.coverage_pct >= 100;
          const fill = c.total === 0 ? "#3b5b8c" : done ? "#34d399" : "#3b82f6";
          return (
            <g key={c.iso2} transform={`translate(${xy[0]},${xy[1]})`} className="cursor-pointer"
              onMouseEnter={(e) => setHover({ c, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })}
              onMouseLeave={() => setHover(null)} onClick={() => onSelect?.(c.iso2)}>
              {c.total > 0 && <circle r={r * 2.2} fill="url(#glow)" opacity={0.5} />}
              <circle r={Math.max(r, 3.5) + 4} fill="transparent" />
              <circle r={r} fill={fill} fillOpacity={c.total ? 0.85 : 0.5} stroke={isSel ? "#fff" : "#0b1b34"} strokeWidth={isSel ? 2 : 1} />
            </g>
          );
        })}
      </svg>
      {hover && (
        <div className="pointer-events-none absolute z-10 rounded-md bg-ink-950/95 ring-1 ring-line px-3 py-2 text-xs shadow-xl" style={{ left: Math.min(hover.x + 12, 9999), top: hover.y + 12 }}>
          <div className="font-semibold text-slate-100">{hover.c.name}</div>
          <div className="text-slate-400 tabular-nums">{hover.c.total} prospectos · meta {hover.c.target} · {hover.c.coverage_pct}%</div>
          {hover.c.total > 0 && <div className="text-slate-500">{hover.c.high} alta prioridad · {hover.c.verified} verificados</div>}
        </div>
      )}
      <div className="absolute left-3 bottom-3 flex gap-3 text-[11px] text-slate-400 bg-ink-950/70 rounded px-2 py-1">
        <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#3b5b8c] inline-block" />Sin datos</span>
        <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-blue-500 inline-block" />En progreso</span>
        <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Meta alcanzada</span>
      </div>
    </div>
  );
}
