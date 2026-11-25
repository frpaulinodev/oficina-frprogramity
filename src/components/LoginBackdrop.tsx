// Fondo "en vivo" del inicio de sesión: pantallas de varios tamaños que van pasando slides.
import { useEffect, useState } from "react";

const QUOTES = [
  ["Vende soluciones,", "no tecnología."],
  ["Cada cliente empieza", "con un buen primer mensaje."],
  ["50 empresas por país.", "Una conversación a la vez."],
  ["Hoy es un buen día", "para cerrar una venta."],
  ["El seguimiento", "es donde se gana la venta."],
  ["Pocos mensajes, bien hechos,", "valen más que cien iguales."],
];

const EXAMPLES = [
  { sector: "Barbería", icon: "✂", gap: "Sin página web", offer: "Página web básica", score: 86 },
  { sector: "Clínica dental", icon: "🦷", gap: "Sin citas en línea", offer: "Sistema de reservas", score: 82 },
  { sector: "Restaurante", icon: "🍽", gap: "Sin pedidos en línea", offer: "E-commerce / menú", score: 78 },
  { sector: "Taller mecánico", icon: "🔧", gap: "Web no apta para celular", offer: "Rediseño web", score: 71 },
  { sector: "Gimnasio", icon: "🏋", gap: "Sin portal de socios", offer: "Portal + reservas", score: 80 },
  { sector: "Abogados", icon: "⚖", gap: "Seguimiento manual", offer: "CRM", score: 74 },
];

const FACTS = [
  { n: "235", t: "países y territorios" },
  { n: "8", t: "continentes y regiones" },
  { n: "47", t: "sectores económicos" },
  { n: "50", t: "prospectos por bloque" },
  { n: "7", t: "hojas en cada Excel" },
];

function useCycle(n: number, ms: number, offset = 0) {
  const [i, setI] = useState(offset % n);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % n), ms);
    return () => clearInterval(t);
  }, [n, ms]);
  return i;
}

function Globe() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <radialGradient id="lg-globe" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#1e3a8a" /><stop offset="1" stopColor="#020617" /></radialGradient>
      </defs>
      <circle cx="100" cy="100" r="78" fill="url(#lg-globe)" stroke="#3b82f6" strokeOpacity=".5" />
      <g className="lb-spin" style={{ transformOrigin: "100px 100px" }} fill="none" stroke="#60a5fa" strokeOpacity=".35">
        {[16, 34, 52, 70].map((rx) => <ellipse key={rx} cx="100" cy="100" rx={rx} ry="78" />)}
      </g>
      {[40, 70, 100, 130, 160].map((y) => <line key={y} x1={100 - Math.sqrt(78 * 78 - (y - 100) ** 2)} x2={100 + Math.sqrt(78 * 78 - (y - 100) ** 2)} y1={y} y2={y} stroke="#60a5fa" strokeOpacity=".25" />)}
      {[[70, 80], [128, 66], [112, 120], [82, 132], [146, 104], [96, 58]].map(([x, y], k) => (
        <g key={k}>
          <circle cx={x} cy={y} r="9" fill="#34d399" opacity=".25" className="lb-ping" style={{ animationDelay: `${k * 0.5}s`, transformOrigin: `${x}px ${y}px` }} />
          <circle cx={x} cy={y} r="3" fill="#34d399" />
        </g>
      ))}
    </svg>
  );
}

function Bars() {
  const vals = [38, 62, 48, 80, 66, 92, 74];
  return (
    <div className="h-full flex flex-col">
      <div className="text-[10px] uppercase tracking-[0.2em] text-blue-200/70">Embudo de ventas</div>
      <div className="flex-1 flex items-end gap-1.5 mt-2">
        {vals.map((v, i) => <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-blue-600 to-emerald-400 lb-bar" style={{ height: `${v}%`, animationDelay: `${i * 0.12}s` }} />)}
      </div>
    </div>
  );
}

function Pipeline() {
  const cols = ["Nuevo", "Contactado", "Interesado", "Ganado"];
  return (
    <div className="h-full grid grid-cols-4 gap-1.5">
      {cols.map((c, i) => (
        <div key={c} className="rounded-md bg-white/[0.04] p-1.5 flex flex-col gap-1">
          <div className="text-[8px] uppercase tracking-wider text-blue-200/70 truncate">{c}</div>
          {Array.from({ length: 4 - i }).map((_, k) => (
            <div key={k} className={`h-3 rounded ${i === 3 ? "bg-emerald-400/70" : "bg-blue-400/40"} lb-card`} style={{ animationDelay: `${(i + k) * 0.4}s` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Slide({ kind, idx }: { kind: string; idx: number }) {
  if (kind === "globe") return <Globe />;
  if (kind === "bars") return <Bars />;
  if (kind === "pipeline") return <Pipeline />;
  if (kind === "quote") {
    const q = QUOTES[idx % QUOTES.length];
    return (
      <div className="h-full flex flex-col justify-center">
        <div className="text-amber-300/80 text-3xl leading-none">“</div>
        <div className="text-white font-semibold text-lg leading-snug">{q[0]}<br /><span className="text-emerald-300">{q[1]}</span></div>
      </div>
    );
  }
  if (kind === "fact") {
    const f = FACTS[idx % FACTS.length];
    return (
      <div className="h-full flex flex-col justify-center">
        <div className="text-5xl font-black bg-gradient-to-br from-white to-blue-300 bg-clip-text text-transparent tabular-nums">{f.n}</div>
        <div className="text-[12px] text-blue-100/80 mt-1">{f.t}</div>
      </div>
    );
  }
  const e = EXAMPLES[idx % EXAMPLES.length];
  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg grid place-items-center bg-white/10 text-base">{e.icon}</span>
        <div className="min-w-0"><div className="text-white text-[13px] font-semibold truncate">{e.sector}</div><div className="text-[10px] text-blue-200/60">ejemplo de oportunidad</div></div>
        <span className="ml-auto text-[11px] font-bold text-emerald-300 tabular-nums">{e.score}</span>
      </div>
      <div className="text-[11px] text-rose-200/80">● {e.gap}</div>
      <div className="text-[11px] text-emerald-200">→ {e.offer}</div>
    </div>
  );
}

const SCREENS: { x: string; y: string; w: number; h: number; depth: number; kinds: string[]; ms: number; delay: number }[] = [
  { x: "6%", y: "16%", w: 300, h: 190, depth: 1, kinds: ["globe", "bars"], ms: 7000, delay: 0 },
  { x: "30%", y: "8%", w: 190, h: 120, depth: 2, kinds: ["fact"], ms: 3500, delay: 1 },
  { x: "8%", y: "58%", w: 240, h: 140, depth: 1, kinds: ["card"], ms: 4200, delay: 2 },
  { x: "33%", y: "64%", w: 280, h: 150, depth: 2, kinds: ["quote"], ms: 6000, delay: 0 },
  { x: "70%", y: "6%", w: 220, h: 130, depth: 3, kinds: ["pipeline", "bars"], ms: 6500, delay: 3 },
  { x: "78%", y: "68%", w: 200, h: 120, depth: 3, kinds: ["card"], ms: 3800, delay: 4 },
  { x: "52%", y: "80%", w: 160, h: 100, depth: 3, kinds: ["fact"], ms: 4600, delay: 2 },
  { x: "88%", y: "36%", w: 150, h: 96, depth: 3, kinds: ["globe"], ms: 9000, delay: 1 },
];

function Screen({ s, i }: { s: (typeof SCREENS)[number]; i: number }) {
  const tick = useCycle(1000, s.ms, i);
  const kind = s.kinds[tick % s.kinds.length];
  const scale = s.depth === 1 ? 1 : s.depth === 2 ? 0.88 : 0.74;
  return (
    <div className="absolute lb-float" style={{ left: s.x, top: s.y, width: s.w * scale, height: s.h * scale, animationDelay: `-${s.delay * 2}s`, animationDuration: `${12 + s.depth * 4}s`, opacity: s.depth === 3 ? 0.55 : s.depth === 2 ? 0.78 : 0.95, filter: s.depth === 3 ? "blur(1px)" : undefined }}>
      <div className="w-full h-full rounded-2xl p-3.5 bg-gradient-to-br from-slate-900/80 to-blue-950/60 ring-1 ring-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,.8),inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-sm overflow-hidden">
        <div className="flex gap-1 mb-2 opacity-60"><i className="w-1.5 h-1.5 rounded-full bg-rose-400" /><i className="w-1.5 h-1.5 rounded-full bg-amber-300" /><i className="w-1.5 h-1.5 rounded-full bg-emerald-400" /></div>
        <div key={`${kind}-${tick}`} className="h-[calc(100%-14px)] lb-slide"><Slide kind={kind} idx={tick + i} /></div>
      </div>
    </div>
  );
}

export function LoginBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 lb-aurora" />
      <div className="absolute inset-0 lb-grid opacity-40" />
      {SCREENS.map((s, i) => <Screen key={i} s={s} i={i} />)}
      <div className="absolute inset-0 bg-gradient-to-r from-[#050c19]/30 via-transparent to-[#050c19]/70" />
    </div>
  );
}
