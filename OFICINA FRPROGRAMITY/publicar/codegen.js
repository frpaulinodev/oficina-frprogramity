    // _____________________________________________________________________
    // CÓDIGO REAL DE LOS PROYECTOS
    // Cada proyecto genera un archivo HTML completo y funcional (web, app, juego, software o guía)
    // a partir de su nombre y de tu descripción. Si configuraste la IA (ai.js), el código lo
    // escribe Claude; si no, lo arma el generador local. Lo ves y lo pruebas en el visor.
    // _____________________________________________________________________
    const CODE_PALETTES = [
      { name: 'azul', a: '#3b82f6', b: '#06b6d4', words: /azul|cian|celeste|mar|agua/ },
      { name: 'verde', a: '#10b981', b: '#84cc16', words: /verde|natural|eco|planta|salud/ },
      { name: 'morado', a: '#8b5cf6', b: '#ec4899', words: /morado|violeta|lila|púrpura|purpura/ },
      { name: 'rojo', a: '#ef4444', b: '#f97316', words: /rojo|fuego|pasión|pasion|deporte/ },
      { name: 'naranja', a: '#f97316', b: '#facc15', words: /naranja|amarillo|sol|comida|café|cafe/ },
      { name: 'rosa', a: '#ec4899', b: '#f472b6', words: /rosa|belleza|moda/ },
      { name: 'dorado', a: '#d4a017', b: '#f59e0b', words: /dorado|oro|lujo|premium|elegante/ },
      { name: 'oscuro', a: '#6366f1', b: '#22d3ee', words: /oscuro|negro|tech|tecnolog/ }
    ];

    const htmlEsc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const jsStr = (s) => JSON.stringify(String(s == null ? '' : s)).replace(/</g, '\\u003c');

    function projectPalette(p) {
      const text = ((p.brief || '') + ' ' + (p.title || '')).toLowerCase();
      return CODE_PALETTES.find(c => c.words.test(text)) || CODE_PALETTES[officeHash(p.id || p.title || 'x') % CODE_PALETTES.length];
    }

    function plainTitle(p) {
      const m = String(p.title || '').match(/"([^"]+)"/);
      return (m ? m[1] : String(p.title || 'Proyecto').replace(/^(Juego|App|Web|Software|Ayuda)\s*:?\s*/i, '')).trim() || 'Proyecto';
    }

    // Frases del pedido → características / pasos
    function briefPoints(brief, fallback) {
      const parts = String(brief || '').split(/[.,;\n]| y | con /i).map(x => x.trim()).filter(x => x.length > 3).slice(0, 6);
      return parts.length ? parts.map(x => x[0].toUpperCase() + x.slice(1)) : fallback;
    }

    function docShell(title, css, body, script = '') {
      return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${htmlEsc(title)}</title>
<style>
${css.trim()}
</style>
</head>
<body>
${body.trim()}
${script ? `<script>\n${script.trim()}\n</script>` : ''}
</body>
</html>`;
    }

    // ---------- WEB ----------
    function genWeb(p) {
      const t = plainTitle(p), pal = projectPalette(p), brief = String(p.brief || '');
      const low = brief.toLowerCase();
      const feats = briefPoints(brief, ['Diseño moderno y adaptable', 'Carga rápida en cualquier dispositivo', 'Atención cercana y profesional']);
      const has = (re) => re.test(low);
      const shop = has(/tienda|producto|vender|venta|catálogo|catalogo|zapat|ropa/);
      const pricing = has(/precio|plan|suscrip|tarifa/) || !shop;
      const gallery = has(/galer|foto|portafolio|portfolio|imágen|imagen/);
      const testimonials = has(/testimon|opini|reseñ|clientes/) || true;
      const icons = ['⚡', '🎯', '🛡️', '💬', '🚀', '✨'];
      const products = ['Básico', 'Clásico', 'Edición Pro', 'Premium', 'Urbano', 'Especial'];
      const css = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--a:${pal.a};--b:${pal.b};--ink:#0f172a;--mute:#64748b;--bg:#f8fafc}
html{scroll-behavior:smooth}
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--ink);background:var(--bg);line-height:1.6}
a{color:inherit;text-decoration:none}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
header{position:sticky;top:0;z-index:10;background:rgba(255,255,255,.85);backdrop-filter:blur(10px);border-bottom:1px solid #e2e8f0}
nav{display:flex;align-items:center;justify-content:space-between;height:64px}
.logo{font-weight:800;font-size:20px;background:linear-gradient(90deg,var(--a),var(--b));-webkit-background-clip:text;background-clip:text;color:transparent}
.links{display:flex;gap:22px;font-size:14px;color:var(--mute)}
.links a:hover{color:var(--ink)}
.menu{display:none;background:none;border:0;font-size:24px;cursor:pointer}
.hero{padding:90px 0 70px;text-align:center;background:radial-gradient(ellipse at top,color-mix(in srgb,var(--a) 18%,transparent),transparent 70%)}
.hero h1{font-size:clamp(32px,6vw,58px);line-height:1.1;letter-spacing:-.02em}
.hero h1 span{background:linear-gradient(90deg,var(--a),var(--b));-webkit-background-clip:text;background-clip:text;color:transparent}
.hero p{max-width:620px;margin:18px auto 30px;color:var(--mute);font-size:18px}
.btn{display:inline-block;padding:13px 26px;border-radius:12px;font-weight:700;border:0;cursor:pointer;font-size:15px;transition:transform .15s,box-shadow .15s}
.btn:hover{transform:translateY(-2px)}
.btn-main{background:linear-gradient(90deg,var(--a),var(--b));color:#fff;box-shadow:0 10px 25px -10px var(--a)}
.btn-alt{background:#fff;border:1px solid #cbd5e1;margin-left:8px}
section{padding:70px 0}
h2{font-size:32px;text-align:center;margin-bottom:10px}
.sub{text-align:center;color:var(--mute);margin-bottom:40px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:24px;transition:box-shadow .2s,transform .2s}
.card:hover{transform:translateY(-3px);box-shadow:0 18px 40px -20px rgba(15,23,42,.35)}
.ico{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:color-mix(in srgb,var(--a) 14%,#fff);margin-bottom:14px}
.card h3{font-size:18px;margin-bottom:6px}
.card p{color:var(--mute);font-size:14px}
.thumb{height:150px;border-radius:12px;margin-bottom:14px;background:linear-gradient(135deg,var(--a),var(--b))}
.price{font-size:30px;font-weight:800;margin:8px 0}
.price small{font-size:14px;color:var(--mute);font-weight:500}
.card.best{border:2px solid var(--a)}
.card ul{list-style:none;margin:14px 0 18px;font-size:14px;color:var(--mute)}
.card li{padding:4px 0}
.card li::before{content:"✓ ";color:var(--a);font-weight:700}
.quote{font-style:italic}
.who{margin-top:12px;font-weight:700;font-size:14px}
.gal{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}
.gal div{aspect-ratio:1;border-radius:14px;background:linear-gradient(135deg,var(--a),var(--b));opacity:.85;transition:opacity .2s}
.gal div:nth-child(2n){background:linear-gradient(135deg,var(--b),#0f172a)}
.gal div:hover{opacity:1}
form{max-width:520px;margin:0 auto;display:grid;gap:12px}
input,textarea{width:100%;padding:13px 14px;border:1px solid #cbd5e1;border-radius:12px;font:inherit;background:#fff}
input:focus,textarea:focus{outline:2px solid var(--a);border-color:transparent}
.ok{display:none;text-align:center;color:#059669;font-weight:700}
.cart{position:fixed;right:18px;bottom:18px;background:var(--ink);color:#fff;padding:12px 16px;border-radius:14px;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,.3)}
footer{background:var(--ink);color:#94a3b8;padding:30px 0;text-align:center;font-size:14px}
@media(max-width:720px){.links{display:none;position:absolute;top:64px;left:0;right:0;background:#fff;flex-direction:column;padding:16px 20px;border-bottom:1px solid #e2e8f0}.links.open{display:flex}.menu{display:block}.btn-alt{margin:10px 0 0}}`;
      const body = `
<header><nav class="wrap">
  <a class="logo" href="#inicio">${htmlEsc(t)}</a>
  <button class="menu" aria-label="Menú" onclick="document.querySelector('.links').classList.toggle('open')">☰</button>
  <div class="links">
    <a href="#servicios">Servicios</a>${shop ? '<a href="#tienda">Tienda</a>' : ''}${pricing ? '<a href="#planes">Planes</a>' : ''}${gallery ? '<a href="#galeria">Galería</a>' : ''}<a href="#contacto">Contacto</a>
  </div>
</nav></header>
<section class="hero" id="inicio"><div class="wrap">
  <h1>Bienvenido a <span>${htmlEsc(t)}</span></h1>
  <p>${htmlEsc(brief || 'Una experiencia digital clara, rápida y pensada para tus clientes.')}</p>
  <a class="btn btn-main" href="#contacto">Empezar ahora</a><a class="btn btn-alt" href="#servicios">Saber más</a>
</div></section>
<section id="servicios"><div class="wrap">
  <h2>Lo que ofrecemos</h2><p class="sub">Todo lo que necesitas, en un solo lugar.</p>
  <div class="grid">
${feats.slice(0, 6).map((f, i) => `    <div class="card"><div class="ico">${icons[i % icons.length]}</div><h3>${htmlEsc(f)}</h3><p>Lo cuidamos al detalle para que funcione desde el primer día.</p></div>`).join('\n')}
  </div>
</div></section>
${shop ? `<section id="tienda" style="background:#fff"><div class="wrap">
  <h2>Tienda</h2><p class="sub">Elige tus favoritos y añádelos al carrito.</p>
  <div class="grid">
${products.map((n, i) => `    <div class="card"><div class="thumb"></div><h3>${htmlEsc(t)} ${n}</h3><div class="price">$${(19 + i * 12)}<small>.99</small></div><button class="btn btn-main" onclick="addCart(${19 + i * 12}.99)">Añadir</button></div>`).join('\n')}
  </div>
</div></section>` : ''}
${pricing ? `<section id="planes"><div class="wrap">
  <h2>Planes</h2><p class="sub">Precios claros, sin sorpresas.</p>
  <div class="grid">
    <div class="card"><h3>Inicial</h3><div class="price">$9<small>/mes</small></div><ul><li>Lo esencial</li><li>Soporte por correo</li></ul><a class="btn btn-alt" style="margin:0" href="#contacto">Elegir</a></div>
    <div class="card best"><h3>Profesional</h3><div class="price">$29<small>/mes</small></div><ul><li>Todo lo del plan Inicial</li><li>Funciones avanzadas</li><li>Soporte prioritario</li></ul><a class="btn btn-main" href="#contacto">Elegir</a></div>
    <div class="card"><h3>Empresa</h3><div class="price">$79<small>/mes</small></div><ul><li>Equipos ilimitados</li><li>Asesor dedicado</li></ul><a class="btn btn-alt" style="margin:0" href="#contacto">Hablemos</a></div>
  </div>
</div></section>` : ''}
${gallery ? `<section id="galeria" style="background:#fff"><div class="wrap"><h2>Galería</h2><p class="sub">Algunos de nuestros trabajos.</p><div class="gal">${'<div></div>'.repeat(8)}</div></div></section>` : ''}
${testimonials ? `<section><div class="wrap">
  <h2>Lo que dicen de nosotros</h2><p class="sub">Clientes reales, resultados reales.</p>
  <div class="grid">
    <div class="card"><p class="quote">"Superó lo que esperábamos. Rápido, bonito y fácil de usar."</p><div class="who">María G.</div></div>
    <div class="card"><p class="quote">"La atención fue excelente y el resultado, impecable."</p><div class="who">Carlos R.</div></div>
    <div class="card"><p class="quote">"Lo recomiendo sin dudarlo a cualquier negocio."</p><div class="who">Lucía P.</div></div>
  </div>
</div></section>` : ''}
<section id="contacto" style="background:#fff"><div class="wrap">
  <h2>Contacto</h2><p class="sub">Escríbenos y te respondemos hoy mismo.</p>
  <form onsubmit="return sendForm(event)">
    <input required name="nombre" placeholder="Tu nombre">
    <input required type="email" name="correo" placeholder="Tu correo">
    <textarea required name="mensaje" rows="4" placeholder="¿En qué te ayudamos?"></textarea>
    <button class="btn btn-main" type="submit">Enviar mensaje</button>
    <p class="ok" id="ok">¡Gracias! Hemos recibido tu mensaje.</p>
  </form>
</div></section>
${shop ? '<div class="cart" id="cart">🛒 0 · $0.00</div>' : ''}
<footer>© <span id="year"></span> ${htmlEsc(t)} · Hecho por ${htmlEsc(BRAND)}</footer>`;
      const script = `
document.getElementById('year').textContent = new Date().getFullYear();
document.querySelectorAll('.links a').forEach(a => a.addEventListener('click', () => document.querySelector('.links').classList.remove('open')));
let items = 0, total = 0;
function addCart(price) {
  items++; total += price;
  const c = document.getElementById('cart');
  if (c) c.textContent = '🛒 ' + items + ' · $' + total.toFixed(2);
}
function sendForm(e) {
  e.preventDefault();
  document.getElementById('ok').style.display = 'block';
  e.target.reset();
  return false;
}`;
      return docShell(t, css, body, script);
    }

    // ---------- APP ----------
    function genApp(p) {
      const t = plainTitle(p), pal = projectPalette(p), low = String(p.brief + ' ' + p.title).toLowerCase();
      const finance = /gasto|finanz|dinero|ahorro|presupuesto|cuenta/.test(low);
      const css = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--a:${pal.a};--b:${pal.b}}
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0b1020;color:#e2e8f0;min-height:100vh;display:flex;justify-content:center;padding:28px 14px}
.app{width:100%;max-width:520px}
h1{font-size:26px;margin-bottom:4px}
h1 span{background:linear-gradient(90deg,var(--a),var(--b));-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{color:#94a3b8;font-size:14px;margin-bottom:18px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
.stat{background:#131a2e;border:1px solid #1e293b;border-radius:14px;padding:12px;text-align:center}
.stat b{display:block;font-size:22px}
.stat small{color:#94a3b8;font-size:12px}
form{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
input,select{background:#131a2e;border:1px solid #1e293b;color:#e2e8f0;border-radius:12px;padding:12px;font:inherit;flex:1;min-width:0}
input:focus,select:focus{outline:2px solid var(--a)}
button{border:0;border-radius:12px;padding:12px 16px;font-weight:700;cursor:pointer;font:inherit}
.add{background:linear-gradient(90deg,var(--a),var(--b));color:#fff}
.filters{display:flex;gap:6px;margin-bottom:12px}
.filters button{background:#131a2e;color:#94a3b8;padding:7px 12px;font-size:13px;border:1px solid #1e293b}
.filters button.on{color:#fff;border-color:var(--a)}
ul{list-style:none;display:grid;gap:8px}
li{display:flex;align-items:center;gap:10px;background:#131a2e;border:1px solid #1e293b;border-radius:14px;padding:12px;animation:in .2s ease-out}
@keyframes in{from{opacity:0;transform:translateY(-4px)}}
li.done .txt{text-decoration:line-through;color:#64748b}
.chk{width:22px;height:22px;border-radius:7px;border:2px solid var(--a);background:none;padding:0;flex:none}
li.done .chk{background:var(--a)}
.txt{flex:1;word-break:break-word}
.tag{font-size:11px;padding:3px 8px;border-radius:99px;background:#1e293b;color:#cbd5e1}
.tag.alta{background:#7f1d1d;color:#fecaca}.tag.media{background:#78350f;color:#fde68a}
.del{background:none;color:#64748b;padding:4px 8px}
.del:hover{color:#f87171}
.amt{font-weight:800}
.bars{display:grid;gap:6px;margin:6px 0 16px}
.bar{display:flex;align-items:center;gap:8px;font-size:12px;color:#94a3b8}
.bar div{height:8px;border-radius:99px;background:linear-gradient(90deg,var(--a),var(--b));transition:width .3s}
.empty{text-align:center;color:#64748b;padding:26px;border:1px dashed #1e293b;border-radius:14px}`;
      const body = finance ? `
<div class="app">
  <h1>💰 <span>${htmlEsc(t)}</span></h1>
  <p class="sub">${htmlEsc(p.brief || 'Controla tus gastos e ingresos de forma sencilla.')}</p>
  <div class="stats">
    <div class="stat"><b id="sIn">$0</b><small>Ingresos</small></div>
    <div class="stat"><b id="sOut">$0</b><small>Gastos</small></div>
    <div class="stat"><b id="sBal">$0</b><small>Saldo</small></div>
  </div>
  <form id="f">
    <input id="desc" placeholder="Descripción" required>
    <input id="amt" type="number" step="0.01" placeholder="Monto" required style="max-width:120px">
    <select id="cat"><option>Comida</option><option>Transporte</option><option>Hogar</option><option>Ocio</option><option>Ingreso</option></select>
    <button class="add">Añadir</button>
  </form>
  <div class="bars" id="bars"></div>
  <ul id="list"></ul>
</div>` : `
<div class="app">
  <h1>✅ <span>${htmlEsc(t)}</span></h1>
  <p class="sub">${htmlEsc(p.brief || 'Organiza tus tareas y no olvides nada.')}</p>
  <div class="stats">
    <div class="stat"><b id="sAll">0</b><small>Total</small></div>
    <div class="stat"><b id="sTodo">0</b><small>Pendientes</small></div>
    <div class="stat"><b id="sDone">0</b><small>Hechas</small></div>
  </div>
  <form id="f">
    <input id="txt" placeholder="Nueva tarea…" required>
    <select id="pri" style="max-width:120px"><option value="baja">Baja</option><option value="media" selected>Media</option><option value="alta">Alta</option></select>
    <button class="add">Añadir</button>
  </form>
  <div class="filters"><button data-f="todas" class="on">Todas</button><button data-f="pendientes">Pendientes</button><button data-f="hechas">Hechas</button></div>
  <ul id="list"></ul>
</div>`;
      const store = `
const KEY = ${jsStr('app_' + t)};
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } };
const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* vista previa sin almacenamiento */ } };
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));`;
      const script = finance ? store + `
let items = load() || [
  { d: 'Salario', a: 1500, c: 'Ingreso' }, { d: 'Supermercado', a: 86.4, c: 'Comida' }, { d: 'Bus del mes', a: 30, c: 'Transporte' }
];
const money = (n) => '$' + n.toFixed(2);
function render() {
  const inc = items.filter(i => i.c === 'Ingreso').reduce((s, i) => s + i.a, 0);
  const out = items.filter(i => i.c !== 'Ingreso').reduce((s, i) => s + i.a, 0);
  sIn.textContent = money(inc); sOut.textContent = money(out); sBal.textContent = money(inc - out);
  sBal.style.color = inc - out >= 0 ? '#34d399' : '#f87171';
  const cats = {};
  items.filter(i => i.c !== 'Ingreso').forEach(i => { cats[i.c] = (cats[i.c] || 0) + i.a; });
  const max = Math.max(1, ...Object.values(cats));
  bars.innerHTML = Object.entries(cats).map(([c, v]) => '<div class="bar"><span style="width:80px">' + c + '</span><div style="width:' + (v / max * 100) + '%"></div><span>' + money(v) + '</span></div>').join('');
  list.innerHTML = items.length ? items.map((i, k) => '<li><span class="tag">' + esc(i.c) + '</span><span class="txt">' + esc(i.d) + '</span><span class="amt" style="color:' + (i.c === 'Ingreso' ? '#34d399' : '#f87171') + '">' + (i.c === 'Ingreso' ? '+' : '-') + money(i.a) + '</span><button class="del" data-k="' + k + '">✕</button></li>').reverse().join('') : '<div class="empty">Sin movimientos todavía.</div>';
  save(items);
}
f.addEventListener('submit', e => {
  e.preventDefault();
  const a = parseFloat(amt.value);
  if (!desc.value.trim() || !(a > 0)) return;
  items.push({ d: desc.value.trim(), a, c: cat.value });
  f.reset(); render();
});
list.addEventListener('click', e => { const k = e.target.dataset.k; if (k !== undefined) { items.splice(+k, 1); render(); } });
render();` : store + `
let tasks = load() || [
  { t: 'Revisar el diseño de la portada', p: 'alta', d: false }, { t: 'Enviar presupuesto al cliente', p: 'media', d: true }, { t: 'Preparar la reunión del lunes', p: 'baja', d: false }
];
let filter = 'todas';
function render() {
  sAll.textContent = tasks.length;
  sDone.textContent = tasks.filter(x => x.d).length;
  sTodo.textContent = tasks.filter(x => !x.d).length;
  const view = tasks.map((x, i) => ({ ...x, i })).filter(x => filter === 'todas' || (filter === 'hechas' ? x.d : !x.d));
  list.innerHTML = view.length ? view.map(x => '<li class="' + (x.d ? 'done' : '') + '"><button class="chk" data-t="' + x.i + '" aria-label="Completar"></button><span class="txt">' + esc(x.t) + '</span><span class="tag ' + x.p + '">' + x.p + '</span><button class="del" data-k="' + x.i + '">✕</button></li>').join('') : '<div class="empty">No hay tareas aquí. ¡Buen trabajo!</div>';
  save(tasks);
}
f.addEventListener('submit', e => { e.preventDefault(); if (!txt.value.trim()) return; tasks.unshift({ t: txt.value.trim(), p: pri.value, d: false }); txt.value = ''; render(); });
list.addEventListener('click', e => {
  const t = e.target.dataset.t, k = e.target.dataset.k;
  if (t !== undefined) tasks[+t].d = !tasks[+t].d;
  if (k !== undefined) tasks.splice(+k, 1);
  render();
});
document.querySelectorAll('.filters button').forEach(b => b.addEventListener('click', () => {
  filter = b.dataset.f;
  document.querySelectorAll('.filters button').forEach(o => o.classList.toggle('on', o === b));
  render();
}));
render();`;
      return docShell(t, css, body, script);
    }

    // ---------- JUEGO ----------
    function genGame(p) {
      const t = plainTitle(p), pal = projectPalette(p), low = String(p.brief + ' ' + p.title).toLowerCase();
      const theme = /espacio|nave|galax|astero|space/.test(low) ? 'space' : /carrera|coche|auto|turbo|lane/.test(low) ? 'race' : 'orb';
      const css = `
*{margin:0;padding:0;box-sizing:border-box}
body{background:#05070f;color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;overflow:hidden}
canvas{background:#0b1022;border-radius:16px;box-shadow:0 0 0 1px #1e293b,0 20px 60px -20px ${pal.a};max-width:96vw;max-height:80vh;touch-action:none}
.hud{display:flex;gap:18px;margin:10px 0;font-weight:700;font-size:14px;color:#cbd5e1}
.hud b{color:${pal.b}}
.tip{color:#64748b;font-size:12px;margin-top:8px}`;
      const body = `
<div class="hud"><span>Puntos: <b id="score">0</b></span><span>Récord: <b id="best">0</b></span><span>Vidas: <b id="lives">3</b></span><span>Nivel: <b id="level">1</b></span></div>
<canvas id="c" width="480" height="640"></canvas>
<p class="tip">Flechas / WASD o arrastra para moverte · P pausa · Espacio para empezar</p>`;
      const script = `
const THEME = ${jsStr(theme)}, TITLE = ${jsStr(t)}, A = ${jsStr(pal.a)}, B = ${jsStr(pal.b)};
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const W = cv.width, H = cv.height;
let state = 'menu', score = 0, lives = 3, level = 1, best = 0, t = 0, shake = 0;
try { best = +localStorage.getItem('best_' + TITLE) || 0; } catch (e) {}
const player = { x: W / 2, y: H - 80, r: 18, vx: 0, inv: 0 };
let foes = [], gems = [], parts = [], stars = [];
for (let i = 0; i < 70; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 2 + 0.5 });
const keys = {};
addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ' && state !== 'play') start();
  if (e.key.toLowerCase() === 'p' && (state === 'play' || state === 'pause')) state = state === 'play' ? 'pause' : 'play';
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
let drag = null;
cv.addEventListener('pointerdown', e => { if (state !== 'play') start(); drag = e.clientX; });
addEventListener('pointermove', e => {
  if (drag === null) return;
  const rect = cv.getBoundingClientRect();
  player.x = Math.max(player.r, Math.min(W - player.r, (e.clientX - rect.left) * (W / rect.width)));
});
addEventListener('pointerup', () => { drag = null; });
function start() { state = 'play'; score = 0; lives = 3; level = 1; foes = []; gems = []; parts = []; player.x = W / 2; player.inv = 60; }
function burst(x, y, col, n) { for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - .5) * 7, vy: (Math.random() - .5) * 7, life: 40, col }); }
function spawn() {
  const speed = 2.4 + level * 0.55;
  if (Math.random() < 0.035 + level * 0.008) {
    const lane = THEME === 'race' ? (Math.floor(Math.random() * 4) + 0.5) * (W / 4) : 20 + Math.random() * (W - 40);
    foes.push({ x: lane, y: -40, r: THEME === 'race' ? 22 : 14 + Math.random() * 16, v: speed + Math.random() * 1.5, rot: Math.random() * 6 });
  }
  if (Math.random() < 0.02) gems.push({ x: 20 + Math.random() * (W - 40), y: -20, r: 10, v: speed * 0.8 });
}
function hit(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r - 4; }
function update() {
  t++;
  stars.forEach(s => { s.y += s.s * (state === 'play' ? 1 + level * 0.3 : 0.4); if (s.y > H) { s.y = 0; s.x = Math.random() * W; } });
  parts.forEach(q => { q.x += q.vx; q.y += q.vy; q.vx *= .95; q.vy *= .95; q.life--; });
  parts = parts.filter(q => q.life > 0);
  if (state !== 'play') return;
  const ax = (keys.arrowleft || keys.a ? -1 : 0) + (keys.arrowright || keys.d ? 1 : 0);
  player.vx = player.vx * 0.82 + ax * 1.6;
  player.x = Math.max(player.r, Math.min(W - player.r, player.x + player.vx));
  if (player.inv > 0) player.inv--;
  spawn();
  foes.forEach(f => { f.y += f.v; f.rot += 0.05; });
  gems.forEach(g => { g.y += g.v; });
  foes = foes.filter(f => {
    if (player.inv <= 0 && hit(player, f)) { lives--; shake = 14; player.inv = 90; burst(f.x, f.y, '#f87171', 24); return false; }
    if (f.y > H + 40) { score += 1; return false; }
    return true;
  });
  gems = gems.filter(g => {
    if (hit(player, g)) { score += 10; burst(g.x, g.y, B, 14); return false; }
    return g.y < H + 20;
  });
  level = 1 + Math.floor(score / 60);
  if (lives <= 0) {
    state = 'over';
    if (score > best) { best = score; try { localStorage.setItem('best_' + TITLE, best); } catch (e) {} }
  }
  document.getElementById('score').textContent = score;
  document.getElementById('best').textContent = best;
  document.getElementById('lives').textContent = Math.max(0, lives);
  document.getElementById('level').textContent = level;
}
function drawPlayer() {
  if (player.inv > 0 && Math.floor(t / 5) % 2) return;
  ctx.save(); ctx.translate(player.x, player.y);
  ctx.shadowColor = A; ctx.shadowBlur = 20; ctx.fillStyle = A;
  if (THEME === 'space') { ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(16, 18); ctx.lineTo(0, 10); ctx.lineTo(-16, 18); ctx.closePath(); ctx.fill(); }
  else if (THEME === 'race') { ctx.fillRect(-14, -24, 28, 48); ctx.fillStyle = '#0b1022'; ctx.fillRect(-10, -14, 20, 10); }
  else { ctx.beginPath(); ctx.arc(0, 0, player.r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-5, -5, 5, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function draw() {
  ctx.save();
  if (shake > 0) { ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake); shake *= 0.85; if (shake < .5) shake = 0; }
  ctx.fillStyle = '#0b1022'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#94a3b8';
  stars.forEach(s => { ctx.globalAlpha = s.s / 2.5; ctx.fillRect(s.x, s.y, s.s, THEME === 'race' ? s.s * 6 : s.s); });
  ctx.globalAlpha = 1;
  if (THEME === 'race') { ctx.strokeStyle = '#1e293b'; ctx.setLineDash([24, 18]); ctx.lineDashOffset = -t * 6; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(i * W / 4, 0); ctx.lineTo(i * W / 4, H); ctx.stroke(); } ctx.setLineDash([]); }
  gems.forEach(g => { ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(t * 0.05); ctx.shadowColor = B; ctx.shadowBlur = 16; ctx.fillStyle = B; ctx.fillRect(-8, -8, 16, 16); ctx.restore(); });
  foes.forEach(f => {
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(THEME === 'race' ? 0 : f.rot);
    ctx.fillStyle = THEME === 'race' ? '#f43f5e' : '#64748b';
    if (THEME === 'race') ctx.fillRect(-15, -24, 30, 48);
    else { ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r = f.r * (0.75 + (i % 2) * 0.3); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
    ctx.restore();
  });
  parts.forEach(q => { ctx.globalAlpha = q.life / 40; ctx.fillStyle = q.col; ctx.fillRect(q.x, q.y, 3, 3); });
  ctx.globalAlpha = 1;
  drawPlayer();
  ctx.restore();
  if (state !== 'play') {
    ctx.fillStyle = 'rgba(5,7,15,.72)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '800 34px system-ui';
    ctx.fillText(state === 'over' ? '¡Fin de la partida!' : state === 'pause' ? 'Pausa' : TITLE, W / 2, H / 2 - 30);
    ctx.font = '500 16px system-ui'; ctx.fillStyle = '#94a3b8';
    ctx.fillText(state === 'over' ? 'Puntos: ' + score + ' · Récord: ' + best : 'Esquiva los obstáculos y recoge los cristales', W / 2, H / 2 + 6);
    ctx.fillStyle = B; ctx.fillText(state === 'pause' ? 'Pulsa P para seguir' : 'Pulsa Espacio o toca para jugar', W / 2, H / 2 + 40);
  }
}
(function loop() { update(); draw(); requestAnimationFrame(loop); })();`;
      return docShell(t, css, body, script);
    }

    // ---------- SOFTWARE ----------
    function genSoftware(p) {
      const t = plainTitle(p), pal = projectPalette(p);
      const res = (/(usuario|cliente|pedido|producto|pago|reserva|tarea|factura)s?/i.exec(String(p.brief + ' ' + p.title)) || [, 'item'])[1].toLowerCase();
      const coll = res + 's';
      const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:#0a0f1c;color:#cbd5e1;padding:22px;font-size:13px}
h1{font-family:system-ui,sans-serif;font-size:22px;color:#fff}
h1 span{color:${pal.b}}
.sub{font-family:system-ui,sans-serif;color:#64748b;margin:4px 0 16px}
.cols{display:grid;grid-template-columns:260px 1fr;gap:14px}
@media(max-width:720px){.cols{grid-template-columns:1fr}}
.box{background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:12px}
.ep{display:flex;gap:8px;align-items:center;padding:7px 8px;border-radius:8px;cursor:pointer}
.ep:hover{background:#1e293b}
.m{font-weight:700;font-size:11px;width:52px;text-align:center;border-radius:6px;padding:2px 0}
.GET{background:#064e3b;color:#6ee7b7}.POST{background:#1e3a8a;color:#93c5fd}.PUT{background:#78350f;color:#fcd34d}.DELETE{background:#7f1d1d;color:#fca5a5}
.row{display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap}
select,input,textarea,button{font:inherit;background:#020617;color:#e2e8f0;border:1px solid #1e293b;border-radius:8px;padding:8px}
input{flex:1;min-width:120px}
textarea{width:100%;height:80px;resize:vertical}
button{background:${pal.a};color:#fff;border:0;font-weight:700;cursor:pointer}
pre{background:#020617;border:1px solid #1e293b;border-radius:8px;padding:10px;min-height:120px;white-space:pre-wrap;word-break:break-word;color:#a5f3fc}
.st{font-weight:700}
.ok{color:#34d399}.err{color:#f87171}
.tests div{padding:3px 0}`;
      const body = `
<h1>⚙️ <span>${htmlEsc(t)}</span> · API</h1>
<p class="sub">${htmlEsc(p.brief || 'Servicio REST con validación, paginación y pruebas automáticas.')} — consola interactiva</p>
<div class="cols">
  <div class="box">
    <div style="color:#64748b;margin-bottom:6px">ENDPOINTS</div>
    <div class="ep" data-m="GET" data-p="/${coll}"><span class="m GET">GET</span>/${coll}</div>
    <div class="ep" data-m="GET" data-p="/${coll}/1"><span class="m GET">GET</span>/${coll}/:id</div>
    <div class="ep" data-m="POST" data-p="/${coll}"><span class="m POST">POST</span>/${coll}</div>
    <div class="ep" data-m="PUT" data-p="/${coll}/1"><span class="m PUT">PUT</span>/${coll}/:id</div>
    <div class="ep" data-m="DELETE" data-p="/${coll}/2"><span class="m DELETE">DELETE</span>/${coll}/:id</div>
    <div class="ep" data-m="GET" data-p="/health"><span class="m GET">GET</span>/health</div>
    <div style="color:#64748b;margin:14px 0 6px">PRUEBAS</div>
    <button id="runTests" style="width:100%">▶ Ejecutar pruebas</button>
    <div class="tests" id="tests"></div>
  </div>
  <div class="box">
    <div class="row">
      <select id="method"><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option></select>
      <input id="path" value="/${coll}">
      <button id="send">Enviar</button>
    </div>
    <textarea id="body" placeholder='Cuerpo JSON (POST / PUT)'>{"nombre": "Nuevo ${res}", "activo": true}</textarea>
    <div style="margin:10px 0 6px">Respuesta: <span class="st" id="status">—</span> <span id="ms" style="color:#64748b"></span></div>
    <pre id="out">Elige un endpoint y pulsa Enviar.</pre>
  </div>
</div>`;
      const script = `
// ---- Servicio en memoria (misma lógica que tendría el servidor) ----
const RESOURCE = ${jsStr(coll)};
const db = { seq: 3, rows: [
  { id: 1, nombre: ${jsStr(res + ' Uno')}, activo: true, creado: new Date().toISOString() },
  { id: 2, nombre: ${jsStr(res + ' Dos')}, activo: false, creado: new Date().toISOString() },
  { id: 3, nombre: ${jsStr(res + ' Tres')}, activo: true, creado: new Date().toISOString() }
] };
function validate(b) {
  if (!b || typeof b !== 'object') return 'El cuerpo debe ser un objeto JSON';
  if (typeof b.nombre !== 'string' || b.nombre.trim().length < 2) return 'El campo "nombre" es obligatorio (mín. 2 caracteres)';
  return null;
}
function handle(method, path, body) {
  const parts = path.split('?')[0].split('/').filter(Boolean);
  const q = new URLSearchParams(path.split('?')[1] || '');
  if (parts[0] === 'health') return [200, { estado: 'ok', registros: db.rows.length, hora: new Date().toISOString() }];
  if (parts[0] !== RESOURCE) return [404, { error: 'Ruta no encontrada' }];
  const id = parts[1] ? Number(parts[1]) : null;
  const row = id ? db.rows.find(r => r.id === id) : null;
  if (id && !row) return [404, { error: 'No existe el registro ' + id }];
  if (method === 'GET') {
    if (row) return [200, row];
    const page = Math.max(1, +q.get('pagina') || 1), size = Math.min(50, +q.get('tam') || 10);
    return [200, { datos: db.rows.slice((page - 1) * size, page * size), pagina: page, total: db.rows.length }];
  }
  if (method === 'POST' && !id) {
    const err = validate(body); if (err) return [422, { error: err }];
    const nuevo = { id: ++db.seq, nombre: body.nombre.trim(), activo: body.activo !== false, creado: new Date().toISOString() };
    db.rows.push(nuevo); return [201, nuevo];
  }
  if (method === 'PUT' && row) {
    const err = validate(body); if (err) return [422, { error: err }];
    Object.assign(row, { nombre: body.nombre.trim(), activo: body.activo !== false }); return [200, row];
  }
  if (method === 'DELETE' && row) { db.rows.splice(db.rows.indexOf(row), 1); return [204, null]; }
  return [405, { error: 'Método no permitido' }];
}
// ---- Consola ----
const $ = (id) => document.getElementById(id);
function send() {
  let body = null;
  if (['POST', 'PUT'].includes($('method').value)) { try { body = JSON.parse($('body').value || '{}'); } catch (e) { show(400, { error: 'JSON inválido' }, 0); return; } }
  const t0 = performance.now();
  const [st, data] = handle($('method').value, $('path').value.trim(), body);
  show(st, data, performance.now() - t0);
}
function show(st, data, ms) {
  $('status').textContent = st; $('status').className = 'st ' + (st < 400 ? 'ok' : 'err');
  $('ms').textContent = ms.toFixed(2) + ' ms';
  $('out').textContent = data === null ? '(sin contenido)' : JSON.stringify(data, null, 2);
}
$('send').onclick = send;
document.querySelectorAll('.ep').forEach(e => e.onclick = () => { $('method').value = e.dataset.m; $('path').value = e.dataset.p; send(); });
$('runTests').onclick = () => {
  const cases = [
    ['Lista paginada', () => handle('GET', '/' + RESOURCE)[0] === 200],
    ['Crear con datos válidos', () => handle('POST', '/' + RESOURCE, { nombre: 'Prueba' })[0] === 201],
    ['Rechaza nombre vacío', () => handle('POST', '/' + RESOURCE, { nombre: '' })[0] === 422],
    ['404 en id inexistente', () => handle('GET', '/' + RESOURCE + '/999')[0] === 404],
    ['Actualizar registro', () => handle('PUT', '/' + RESOURCE + '/1', { nombre: 'Editado' })[1].nombre === 'Editado'],
    ['Health check', () => handle('GET', '/health')[1].estado === 'ok']
  ];
  $('tests').innerHTML = cases.map(([n, f]) => { let ok = false; try { ok = f(); } catch (e) {} return '<div class="' + (ok ? 'ok' : 'err') + '">' + (ok ? '✔ ' : '✘ ') + n + '</div>'; }).join('');
};`;
      return docShell(t + ' · API', css, body, script);
    }

    // ---------- AYUDA ----------
    function genHelp(p) {
      const t = plainTitle(p), pal = projectPalette(p);
      const steps = briefPoints(p.brief, ['Identifica exactamente qué está fallando', 'Reinicia la app y el dispositivo', 'Comprueba tu conexión a internet', 'Actualiza a la última versión', 'Si sigue igual, contacta con soporte']);
      const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;color:#0f172a;line-height:1.6;padding:30px 16px}
.wrap{max-width:720px;margin:0 auto}
h1{font-size:30px}
h1 span{color:${pal.a}}
.sub{color:#64748b;margin:6px 0 20px}
input{width:100%;padding:13px 16px;border:1px solid #cbd5e1;border-radius:14px;font:inherit;margin-bottom:18px}
input:focus{outline:2px solid ${pal.a};border-color:transparent}
.bar{height:8px;background:#e2e8f0;border-radius:99px;overflow:hidden;margin-bottom:18px}
.bar div{height:100%;width:0;background:linear-gradient(90deg,${pal.a},${pal.b});transition:width .3s}
details{background:#fff;border:1px solid #e2e8f0;border-radius:14px;margin-bottom:10px;overflow:hidden}
summary{cursor:pointer;padding:15px 18px;font-weight:700;display:flex;gap:12px;align-items:center;list-style:none}
summary::-webkit-details-marker{display:none}
.n{width:28px;height:28px;border-radius:50%;background:${pal.a};color:#fff;display:grid;place-items:center;font-size:13px;flex:none}
details p{padding:0 18px 16px 58px;color:#475569}
label{display:flex;gap:8px;align-items:center;padding:0 18px 16px 58px;color:#0f172a;font-size:14px;cursor:pointer}
.faq h2{font-size:20px;margin:28px 0 10px}
.contact{margin-top:26px;padding:18px;border-radius:14px;background:linear-gradient(135deg,${pal.a},${pal.b});color:#fff}`;
      const body = `
<div class="wrap">
  <h1>🛟 <span>${htmlEsc(t)}</span></h1>
  <p class="sub">Guía paso a paso preparada por el Centro de Ayuda de ${htmlEsc(BRAND)}.</p>
  <input id="q" placeholder="Busca en la guía…">
  <div class="bar"><div id="prog"></div></div>
${steps.map((s, i) => `  <details ${i === 0 ? 'open' : ''}><summary><span class="n">${i + 1}</span>${htmlEsc(s)}</summary><p>Sigue este paso con calma. Si se resuelve aquí, no hace falta continuar con los siguientes.</p><label><input type="checkbox" class="done" style="width:auto;margin:0"> Hecho</label></details>`).join('\n')}
  <div class="faq">
    <h2>Preguntas frecuentes</h2>
    <details><summary>¿Cuánto tarda en resolverse?</summary><p>La mayoría de los casos se solucionan en menos de 5 minutos siguiendo los pasos.</p></details>
    <details><summary>¿Pierdo mis datos?</summary><p>No. Ninguno de estos pasos borra tu información.</p></details>
  </div>
  <div class="contact"><b>¿Sigues con el problema?</b><br>Escríbenos y un especialista te ayudará personalmente.</div>
</div>`;
      const script = `
const boxes = document.querySelectorAll('.done');
const upd = () => { document.getElementById('prog').style.width = ([...boxes].filter(b => b.checked).length / boxes.length * 100) + '%'; };
boxes.forEach(b => b.addEventListener('change', upd));
document.getElementById('q').addEventListener('input', e => {
  const v = e.target.value.toLowerCase();
  document.querySelectorAll('details').forEach(d => { d.style.display = d.textContent.toLowerCase().includes(v) ? '' : 'none'; if (v) d.open = true; });
});`;
      return docShell(t, css, body, script);
    }

    const CODE_GENERATORS = { web: genWeb, app: genApp, juego: genGame, software: genSoftware, ayuda: genHelp };

    function generateProjectCode(p) {
      const gen = CODE_GENERATORS[p.kind] || genWeb;
      try { return gen(p); } catch (e) { console.error('codegen', e); return genWeb(p); }
    }

    // Código local inmediato y, si hay IA configurada, versión escrita por Claude
    function prepareProjectCode(p) {
      if (!p || p.code) return;
      p.code = generateProjectCode(p);
      p.codeSource = 'plantilla';
      if (typeof aiCodeReady === 'function' && aiCodeReady()) {
        p.note = '🤖 La IA está escribiendo el código…';
        aiGenerateProjectCode(p).then(code => {
          if (code && findProject(p.id)) {
            p.code = code;
            p.codeSource = 'IA';
            pushActivity(`La IA terminó el código de "${p.title}".`, 'CÓDIGO');
          }
        }).catch(err => {
          console.warn('IA código', err);
          showToast('⚠️ La IA no pudo escribir el código: se usa el generador local.');
        }).finally(() => {
          if (p.note && p.note.startsWith('🤖')) p.note = '';
          saveProjects();
          if (WORK_VIEW.projectId === p.id) renderWorkView();
        });
      }
    }

    // ---------- Visor: vista previa + código ----------
    const WORK_VIEW = { projectId: null, deliverableId: null, tab: 'preview', timer: null, lastLen: -1 };

    function highlightCode(code) {
      return htmlEsc(code)
        .replace(/(&lt;\/?)([a-zA-Z0-9-]+)/g, '$1<span class="tok-tag">$2</span>')
        .replace(/(\/\/[^\n]*)/g, '<span class="tok-com">$1</span>')
        .replace(/\b(const|let|function|return|if|else|for|while|new|document|addEventListener)\b/g, '<span class="tok-kw">$1</span>');
    }

    function workSubject() {
      if (WORK_VIEW.projectId) {
        const p = findProject(WORK_VIEW.projectId);
        if (!p) return null;
        const pct = projectProgressPct(p);
        return { p, title: p.title, code: p.code || '', pct, ready: pct >= 75, final: p.status === 'revision' || p.status === 'terminado', source: p.codeSource };
      }
      const d = DELIVERABLES.find(x => x.id === WORK_VIEW.deliverableId);
      if (!d) return null;
      return { d, title: d.title, code: d.code || '', pct: 100, ready: true, final: true, source: d.codeSource };
    }

    function openProjectWork(id) {
      WORK_VIEW.projectId = id;
      WORK_VIEW.deliverableId = null;
      WORK_VIEW.tab = 'preview';
      showWorkModal();
    }

    // El visor de entregables sustituye al antiguo (sigue mostrando el resumen)
    const _legacyDeliverableModal = openDeliverableModal;
    openDeliverableModal = function (id) {
      const d = DELIVERABLES.find(x => x.id === id);
      if (!d) return;
      if (!d.code) { _legacyDeliverableModal(id); return; }
      WORK_VIEW.projectId = null;
      WORK_VIEW.deliverableId = id;
      WORK_VIEW.tab = 'preview';
      currentModalDeliverable = d;
      showWorkModal();
    };

    function showWorkModal() {
      WORK_VIEW.lastLen = -1;
      renderWorkView(true);
      const modal = document.getElementById('deliverable-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      clearInterval(WORK_VIEW.timer);
      WORK_VIEW.timer = setInterval(() => {
        if (modal.classList.contains('hidden')) { clearInterval(WORK_VIEW.timer); WORK_VIEW.projectId = null; return; }
        if (WORK_VIEW.projectId) renderWorkView(false);
      }, 1000);
    }

    function setWorkTab(tab) {
      WORK_VIEW.tab = tab;
      WORK_VIEW.lastLen = -1;
      renderWorkView(true);
    }

    function renderWorkView(force = true) {
      const s = workSubject();
      if (!s) return;
      const visible = s.final ? s.code.length : Math.floor(s.code.length * Math.min(1, s.pct / 100));
      if (!force && visible === WORK_VIEW.lastLen && WORK_VIEW.tab === 'preview') return;
      WORK_VIEW.lastLen = visible;
      document.getElementById('modal-badge').textContent = s.final ? (s.p && s.p.status === 'revision' ? 'POR REVISAR' : 'TERMINADO') : `EN CURSO · ${s.pct}%`;
      document.getElementById('modal-title').textContent = s.title;
      const lines = s.code.split('\n').length;
      document.getElementById('modal-meta').textContent = `${lines} líneas · ${(s.code.length / 1024).toFixed(1)} KB · código ${s.source === 'IA' ? 'escrito por la IA' : 'generado por el equipo'}`;
      const tabBtn = (k, label) => `<button onclick="setWorkTab('${k}')" class="tab-btn ${WORK_VIEW.tab === k ? 'tab-active' : ''}">${label}</button>`;
      const bar = `
        <div class="flex items-center gap-1 flex-wrap">
          ${tabBtn('preview', '🖥️ Vista previa')}${tabBtn('code', '‹/› Código')}${tabBtn('info', '📋 Detalles')}
          <span class="ml-auto flex gap-1">
            <button onclick="workCopyCode()" class="px-2 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">Copiar código</button>
            <button onclick="workDownload()" class="px-2 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">⬇ .html</button>
            <button onclick="workOpenTab()" class="px-2 py-1 rounded-lg text-[10px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border border-cyan-400/40">↗ Abrir</button>
          </span>
        </div>`;
      let main = '';
      if (WORK_VIEW.tab === 'preview') {
        main = s.ready
          ? `<div class="relative rounded-xl overflow-hidden border border-slate-700 bg-white">
               ${!s.final ? '<span class="absolute top-2 right-2 z-10 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400 text-slate-900 font-bold">BORRADOR</span>' : ''}
               <iframe id="work-frame" title="Vista previa" sandbox="allow-scripts allow-forms allow-modals" class="w-full block" style="height:min(60vh,560px);border:0"></iframe>
             </div>`
          : `<div class="h-64 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-400">
               <div class="text-3xl">🛠️</div>
               <div class="text-xs">El equipo está construyendo la primera versión (${s.pct}%).</div>
               <div class="text-[10px]">La vista previa se activa al 75 %. Mientras tanto, mira el código en vivo.</div>
             </div>`;
      } else if (WORK_VIEW.tab === 'code') {
        const shown = s.code.slice(0, visible);
        main = `<pre class="code-view">${highlightCode(shown)}${s.final ? '' : '<span class="code-caret">▋</span>'}</pre>`;
      } else {
        const p = s.p;
        const d = s.d;
        main = p ? `
          <div class="grid grid-cols-2 gap-2 text-[11px]">
            <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800"><div class="text-slate-400 text-[10px]">Estado</div><div class="font-semibold text-white">${PROJECT_STATUS[p.status].label}</div></div>
            <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800"><div class="text-slate-400 text-[10px]">Equipo</div><div class="font-semibold text-white">${escapeHtml(p.authors.join(', ') || 'Asignando…')}</div></div>
          </div>
          <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">📝 ${escapeHtml(p.brief || 'Sin descripción: el equipo usó su criterio.')}</div>
          <div class="space-y-1">${p.steps.map((st, i) => `<div class="flex items-center gap-2 text-[11px] ${i < p.stepIndex ? 'text-emerald-300' : i === p.stepIndex ? 'text-cyan-200' : 'text-slate-500'}">${i < p.stepIndex ? '✔' : i === p.stepIndex ? '▶' : '○'} ${escapeHtml(st.desc)}</div>`).join('')}</div>
          ${p.status === 'revision' ? `<div class="flex gap-2 pt-1"><button onclick="approveProject('${p.id}'); closeDeliverableModal()" class="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold">✓ Aprobar entrega</button><button onclick="disapproveProject('${p.id}'); closeDeliverableModal()" class="flex-1 py-1.5 rounded-lg bg-rose-500/20 text-rose-100 border border-rose-400/40 text-xs font-semibold">↺ Pedir ajustes</button></div>` : ''}`
          : `<p class="text-slate-200 leading-relaxed">${escapeHtml(d.summary)}</p><p class="text-[11px] text-slate-400">Autores: ${escapeHtml(d.authors.join(', '))}</p>`;
      }
      document.getElementById('modal-content').innerHTML = bar + `<div class="space-y-2">${main}</div>`;
      const frame = document.getElementById('work-frame');
      if (frame) frame.srcdoc = s.code;
      if (WORK_VIEW.tab === 'code') {
        const pre = document.querySelector('#modal-content .code-view');
        if (pre && !s.final) pre.scrollTop = pre.scrollHeight;
      }
    }

    function workFileName(s) {
      return (plainTitle({ title: s.title.replace(/^\S+\s/, '') }) || 'proyecto').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.html';
    }

    function workCopyCode() {
      const s = workSubject();
      if (!s) return;
      const done = () => showToast('Código copiado');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s.code).then(done, () => showToast('No se pudo copiar'));
    }

    function workDownload() {
      const s = workSubject();
      if (!s) return;
      const url = URL.createObjectURL(new Blob([s.code], { type: 'text/html' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = workFileName(s);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }

    function workOpenTab() {
      const s = workSubject();
      if (!s) return;
      const url = URL.createObjectURL(new Blob([s.code], { type: 'text/html' }));
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
