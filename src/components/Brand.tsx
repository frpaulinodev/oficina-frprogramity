// Identidad visual: logo de Global Lead Finder y logos de FRPROGRAMITY (3 variantes).
import { useId } from "react";

export function AppLogo({ size = 36 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Global Lead Finder">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <radialGradient id={`r${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#34d399" stopOpacity="0.9" />
          <stop offset="1" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
        <filter id={`s${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#020617" floodOpacity="0.6" />
        </filter>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#g${id})`} filter={`url(#s${id})`} />
      <rect x="2.5" y="2.5" width="59" height="59" rx="15.5" fill="none" stroke="#93c5fd" strokeOpacity="0.35" />
      <g fill="none" stroke="#dbeafe" strokeOpacity="0.85" strokeWidth="1.6">
        <circle cx="30" cy="32" r="17" />
        <ellipse cx="30" cy="32" rx="7.5" ry="17" />
        <path d="M13 32h34M15.5 23h29M15.5 41h29" />
      </g>
      <circle cx="44" cy="20" r="11" fill={`url(#r${id})`} />
      <path d="M44 11.5c-4.4 0-8 3.4-8 7.7 0 5.6 8 12.8 8 12.8s8-7.2 8-12.8c0-4.3-3.6-7.7-8-7.7z" fill="#34d399" stroke="#065f46" strokeWidth="1.2" />
      <circle cx="44" cy="19.3" r="3" fill="#064e3b" />
    </svg>
  );
}

/** Marca de la empresa. variant: "1" monograma con código, "2" hexágono, "3" cursor. */
export function FrMark({ variant = "1", size = 44 }: { variant?: string; size?: number }) {
  const id = useId().replace(/:/g, "");
  const defs = (
    <defs>
      <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#3a2215" />
        <stop offset="0.55" stopColor="#21130b" />
        <stop offset="1" stopColor="#120a05" />
      </linearGradient>
      <linearGradient id={`gold${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe2a8" />
        <stop offset="0.45" stopColor="#f5a524" />
        <stop offset="1" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id={`edge${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fbbf24" stopOpacity="0.9" />
        <stop offset="1" stopColor="#7c2d12" stopOpacity="0.4" />
      </linearGradient>
      <filter id={`sh${id}`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.6" />
      </filter>
      <filter id={`glow${id}`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.2" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
  const letters = (x: number, y: number, fs: number) => (
    <text x={x} y={y} textAnchor="middle" fontFamily="'Segoe UI Black','Arial Black',Inter,system-ui,sans-serif" fontWeight={900}
      fontSize={fs} letterSpacing="-1" fill={`url(#gold${id})`} filter={`url(#glow${id})`}>FR</text>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="FRPROGRAMITY">
      {defs}
      {variant === "2" ? (
        <g filter={`url(#sh${id})`}>
          <path d="M32 3l25 14.5v29L32 61 7 46.5v-29z" fill={`url(#bg${id})`} stroke={`url(#edge${id})`} strokeWidth="2" />
          <path d="M32 9.5l19.5 11.3v22.4L32 54.5 12.5 43.2V20.8z" fill="none" stroke="#f59e0b" strokeOpacity="0.25" />
          <g stroke="#f59e0b" strokeOpacity="0.45" strokeWidth="1.2" fill="#f59e0b">
            <path d="M12.5 26h6M45.5 38h6M32 9.5v5M32 49.5v5" fill="none" />
            <circle cx="18.5" cy="26" r="1.3" /><circle cx="45.5" cy="38" r="1.3" />
          </g>
          {letters(32, 41, 23)}
        </g>
      ) : variant === "3" ? (
        <g filter={`url(#sh${id})`}>
          <rect x="3" y="3" width="58" height="58" rx="29" fill={`url(#bg${id})`} stroke={`url(#edge${id})`} strokeWidth="2" />
          {letters(28, 41, 24)}
          <rect x="44" y="22" width="4" height="22" rx="1.5" fill="#fb923c" className="fr-cursor" />
          <circle cx="50" cy="15" r="3" fill="#f97316" filter={`url(#glow${id})`} />
        </g>
      ) : (
        <g filter={`url(#sh${id})`}>
          <rect x="3" y="3" width="58" height="58" rx="14" fill={`url(#bg${id})`} stroke={`url(#edge${id})`} strokeWidth="2" />
          <rect x="7" y="7" width="50" height="50" rx="10" fill="none" stroke="#fbbf24" strokeOpacity="0.15" />
          <path d="M13 24l-6 8 6 8M51 24l6 8-6 8" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
          {letters(32, 41, 22)}
          <path d="M20 47h24" stroke={`url(#gold${id})`} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        </g>
      )}
    </svg>
  );
}

export function FrBrand({ variant = "1", size = 40, name = "FRPROGRAMITY", tagline = true }: { variant?: string; size?: number; name?: string; tagline?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <FrMark variant={variant} size={size} />
      <div className="leading-tight">
        <div className="fr-wordmark font-black tracking-[0.18em]" style={{ fontSize: size * 0.42 }}>{name}</div>
        {tagline && <div className="text-[10px] tracking-[0.28em] uppercase text-amber-200/60">Software · Webs · Sistemas</div>}
      </div>
    </div>
  );
}
