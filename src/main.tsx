import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./lib/api";
import { Country, Meta, MetaContext } from "./lib/meta";
import { CompanyCtx, RefreshCtx, Route, navigate } from "./lib/nav";
import { Button, Field, Input, Spinner, Toaster, cx } from "./components/ui";
import * as I from "./components/Icons";
import { CompanyDrawer } from "./pages/CompanyDrawer";
import { Dashboard } from "./pages/Dashboard";
import { Explorer } from "./pages/Explorer";
import { Prospects } from "./pages/Prospects";
import { Pipeline } from "./pages/Pipeline";
import { Research } from "./pages/Research";
import { Verification } from "./pages/Verification";
import { Exports } from "./pages/Exports";
import { Services } from "./pages/Services";
import { Results } from "./pages/Results";
import { AppLogo, FrBrand, FrMark } from "./components/Brand";
import { LoginBackdrop } from "./components/LoginBackdrop";

const NAV = [
  { group: "Análisis", items: [
    { key: "panel", label: "Panel general", icon: I.IconDashboard },
    { key: "explorador", label: "Explorador mundial", icon: I.IconGlobe },
  ] },
  { group: "Prospectos", items: [
    { key: "prospectos", label: "Base de prospectos", icon: I.IconTable },
    { key: "seguimiento", label: "Seguimiento de ventas", icon: I.IconPipeline },
    { key: "resultados", label: "Resultados de ventas", icon: I.IconDashboard },
  ] },
  { group: "Datos", items: [
    { key: "investigacion", label: "Motor de investigación", icon: I.IconSearch },
    { key: "verificacion", label: "Verificación y duplicados", icon: I.IconShield },
    { key: "exportar", label: "Exportar e importar", icon: I.IconDownload },
  ] },
  { group: "Negocio", items: [{ key: "servicios", label: "Servicios y precios", icon: I.IconTag }] },
];

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, "");
  const [page, q] = h.split("?");
  return { page: page || "panel", params: new URLSearchParams(q || "") };
}

type Brand = { company_name: string; logo_variant: string };

function Auth({ hasUsers, onDone, brand }: { hasUsers: boolean; onDone: () => void; brand: Brand }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api.post(hasUsers ? "/api/auth/login" : "/api/auth/setup", { email, password });
      onDone();
    } catch (x: any) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050c19]">
      <LoginBackdrop />
      <header className="absolute top-0 left-0 p-6 z-10 flex items-center gap-3">
        <AppLogo size={46} />
        <div className="leading-tight">
          <div className="text-[17px] font-black tracking-[0.16em] text-white drop-shadow">GLOBAL LEAD</div>
          <div className="text-[11px] font-bold tracking-[0.5em] text-emerald-300">FINDER</div>
        </div>
      </header>
      <main className="relative z-10 min-h-screen flex items-center justify-center lg:justify-end px-6 lg:pr-[9vw]">
        <form onSubmit={submit} className="page-in w-full max-w-[400px] rounded-2xl p-8 bg-gradient-to-b from-slate-900/85 to-[#071021]/90 ring-1 ring-white/10 shadow-[0_40px_120px_-30px_rgba(37,99,235,.55),0_0_0_1px_rgba(59,130,246,.15)] backdrop-blur-xl">
          <div className="flex items-center gap-3"><AppLogo size={38} /><div className="text-[11px] uppercase tracking-[0.3em] text-blue-200/70">Acceso privado</div></div>
          <h1 className="mt-5 text-2xl font-bold text-white">{hasUsers ? "Bienvenido de nuevo" : "Crear cuenta de administrador"}</h1>
          <p className="text-[13px] text-slate-400 mt-1">{hasUsers ? "Tu equipo comercial, tu mapa de oportunidades." : "Primer uso: define el acceso a la aplicación."}</p>
          <div className="mt-6 space-y-4">
            <Field label="Correo"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus className="h-11" /></Field>
            <Field label="Contraseña" hint={hasUsers ? undefined : "Mínimo 10 caracteres, con mayúsculas, minúsculas y un número."}>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
            </Field>
            {err && <div className="text-[13px] text-rose-300 bg-rose-500/10 ring-1 ring-rose-400/20 rounded-md px-3 py-2">{err}</div>}
            <Button variant="primary" className="w-full h-11 text-[15px]" disabled={busy}>{busy ? <Spinner /> : hasUsers ? "Entrar" : "Crear y entrar"}</Button>
          </div>
        </form>
      </main>
      <footer className="absolute bottom-0 left-0 right-0 z-10 p-6 flex items-end justify-between gap-4">
        <div className="rounded-2xl px-4 py-3 bg-gradient-to-br from-[#2a1810]/90 to-[#120a05]/90 ring-1 ring-amber-500/25 shadow-[0_20px_50px_-20px_rgba(245,158,11,.45)] backdrop-blur">
          <div className="text-[9px] uppercase tracking-[0.35em] text-amber-200/60 mb-1.5">Un producto de</div>
          <FrBrand variant={brand.logo_variant} size={38} name={brand.company_name} />
        </div>
        <div className="hidden md:block text-[11px] text-slate-500">© {new Date().getFullYear()} {brand.company_name} · Global Lead Finder</div>
      </footer>
    </div>
  );
}

function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <AppLogo size={34} />
      {!compact && (
        <div className="leading-tight">
          <div className="text-[13px] font-black tracking-[0.14em] text-slate-50">GLOBAL LEAD</div>
          <div className="text-[10px] font-bold tracking-[0.42em] text-emerald-300">FINDER</div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [auth, setAuth] = useState<{ has_users: boolean; authenticated: boolean; email: string | null } | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [route, setRoute] = useState<Route>(parseHash());
  const [company, setCompany] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [brand, setBrand] = useState<Brand>({ company_name: "FRPROGRAMITY", logo_variant: "1" });
  useEffect(() => {
    const load = () => api.get<Brand>("/api/brand").then(setBrand).catch(() => {});
    load();
    window.addEventListener("glf:brand", load);
    return () => window.removeEventListener("glf:brand", load);
  }, []);

  const checkAuth = useCallback(() => api.get("/api/auth/status").then(setAuth).catch(() => setAuth({ has_users: true, authenticated: false, email: null })), []);
  const reloadCountries = useCallback(() => api.get<Country[]>("/api/countries").then(setCountries), []);

  useEffect(() => { checkAuth(); }, [checkAuth]);
  useEffect(() => {
    const h = () => { setRoute(parseHash()); setNavOpen(false); };
    const u = () => checkAuth();
    window.addEventListener("hashchange", h);
    window.addEventListener("glf:unauthorized", u);
    return () => { window.removeEventListener("hashchange", h); window.removeEventListener("glf:unauthorized", u); };
  }, [checkAuth]);
  useEffect(() => {
    if (auth?.authenticated) {
      api.get<Meta>("/api/meta").then(setMeta);
      reloadCountries();
    }
  }, [auth?.authenticated, reloadCountries, tick]);

  if (!auth) return <div className="min-h-screen grid place-items-center"><Spinner /></div>;
  if (!auth.authenticated) return <Auth hasUsers={auth.has_users} onDone={checkAuth} brand={brand} />;
  if (!meta) return <div className="min-h-screen grid place-items-center"><Spinner /></div>;

  const bump = () => setTick((t) => t + 1);
  const page = route.page;
  const current = NAV.flatMap((g) => g.items).find((i) => i.key === page);

  return (
    <MetaContext.Provider value={{ meta, countries, reloadCountries }}>
      <RefreshCtx.Provider value={{ tick, bump }}>
        <CompanyCtx.Provider value={setCompany}>
          <div className="min-h-screen lg:grid lg:grid-cols-[236px_minmax(0,1fr)]">
            <aside className={cx("fixed lg:sticky top-0 z-30 h-screen w-[236px] bg-gradient-to-b from-[#071226] via-ink-950 to-[#04080f] border-r border-line flex flex-col transition-transform shadow-[12px_0_40px_-30px_rgba(37,99,235,.6)]", navOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
              <div className="h-14 px-4 flex items-center border-b border-line"><Logo /></div>
              <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
                {NAV.map((g) => (
                  <div key={g.group}>
                    <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{g.group}</div>
                    {g.items.map((it) => (
                      <a key={it.key} href={`#/${it.key}`} className={cx("relative flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[13px] transition-all duration-200",
                        page === it.key ? "bg-gradient-to-r from-blue-600/25 to-blue-600/5 text-white ring-1 ring-blue-500/30 shadow-[0_8px_20px_-12px_rgba(37,99,235,.8)] before:absolute before:-left-2.5 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-emerald-400" : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] hover:translate-x-0.5")}>
                        <it.icon className={cx("w-4 h-4", page === it.key ? "text-emerald-300" : "")} />
                        {it.label}
                      </a>
                    ))}
                  </div>
                ))}
              </nav>
              <div className="mx-3 mb-2 rounded-xl px-3 py-2.5 bg-gradient-to-br from-[#2a1810] to-[#120a05] ring-1 ring-amber-500/20 flex items-center gap-2.5">
                <FrMark variant={brand.logo_variant} size={30} />
                <div className="leading-tight min-w-0"><div className="text-[9px] uppercase tracking-[0.25em] text-amber-200/50">Un producto de</div><div className="fr-wordmark text-[12px] font-black tracking-[0.14em] truncate">{brand.company_name}</div></div>
              </div>
              <div className="p-3 border-t border-line">
                <div className="text-[11px] text-slate-500 truncate px-1">{auth.email}</div>
                <button onClick={async () => { await api.post("/api/auth/logout"); checkAuth(); }} className="mt-1.5 w-full flex items-center gap-2 h-8 px-2 rounded-md text-[13px] text-slate-400 hover:bg-ink-850 hover:text-slate-100">
                  <I.IconLogout /> Cerrar sesión
                </button>
              </div>
            </aside>
            {navOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setNavOpen(false)} />}
            <main className="min-w-0">
              <header className="sticky top-0 z-10 h-14 flex items-center gap-3 px-4 lg:px-6 bg-ink-950/85 backdrop-blur border-b border-line">
                <button className="lg:hidden p-1.5 rounded hover:bg-ink-800" onClick={() => setNavOpen(true)} aria-label="Menú"><I.IconLayers /></button>
                <div className="text-[13px] text-slate-500">Global Lead Finder <span className="mx-1.5">/</span><span className="text-slate-200 font-medium">{current?.label || "Panel general"}</span></div>
                <div className="ml-auto flex items-center gap-2">
                  <GlobalSearch />
                  <Button size="sm" variant="primary" onClick={() => navigate("investigacion")}><I.IconSearch className="w-3.5 h-3.5" />Investigar</Button>
                </div>
              </header>
              <div className="p-4 lg:p-6 page-in" key={page}>
                {page === "panel" && <Dashboard />}
                {page === "explorador" && <Explorer route={route} />}
                {page === "prospectos" && <Prospects route={route} />}
                {page === "seguimiento" && <Pipeline />}
                {page === "resultados" && <Results />}
                {page === "investigacion" && <Research route={route} />}
                {page === "verificacion" && <Verification />}
                {page === "exportar" && <Exports route={route} />}
                {page === "servicios" && <Services />}
              </div>
            </main>
          </div>
          <CompanyDrawer id={company} onClose={() => setCompany(null)} onChanged={bump} />
          <Toaster />
        </CompanyCtx.Provider>
      </RefreshCtx.Provider>
    </MetaContext.Provider>
  );
}

function GlobalSearch() {
  const [q, setQ] = useState("");
  return (
    <form className="hidden md:block" onSubmit={(e) => { e.preventDefault(); navigate("prospectos", { q }); }}>
      <div className="relative">
        <I.IconSearch className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar empresa, correo, web…" className="h-8 w-64 rounded-md bg-ink-900 ring-1 ring-line pl-8 pr-3 text-[13px] focus:outline-none focus:ring-blue-500/60 placeholder:text-slate-500" />
      </div>
    </form>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
