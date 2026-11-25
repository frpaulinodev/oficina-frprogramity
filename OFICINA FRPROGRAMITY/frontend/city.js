    // _____________________________________________________________________
    // CIUDAD ESTILO WALL STREET: rascacielos alrededor de la oficina, pantallas gigantes con
    // datos reales en vivo (mercados, divisas, noticias, clima) y un gran reloj con la hora actual.
    // Se construye justo después del primer cuadro para que la oficina cargue rápido.
    // _____________________________________________________________________
    const CITY = { root: null, screens: [], tickers: [], clock: null, built: false, lastDraw: 0, page: 0 };
    const LIVE = { crypto: null, fx: null, news: [], history: [], weather: [], status: {}, updated: {} };
    const CITY_CENTER = { x: -15, z: 12 };

    // ---- Fachadas procedurales (color + ventanas encendidas de noche) ----
    function drawCityFacade(ctx, w, h, rand, style, emissive) {
      const S = {
        glass: { base: '#1b2b44', win: '#3d5f8c', frame: '#0e1726', cols: 6, rows: 8 },
        steel: { base: '#2a2f38', win: '#4a5566', frame: '#171b22', cols: 5, rows: 8 },
        stone: { base: '#8c7f6a', win: '#2c2f36', frame: '#6f6452', cols: 4, rows: 6 },
        dark: { base: '#0d111a', win: '#1c2636', frame: '#07090f', cols: 8, rows: 10 }
      }[style];
      ctx.fillStyle = emissive ? '#000' : S.base;
      ctx.fillRect(0, 0, w, h);
      const cw = w / S.cols, rh = h / S.rows;
      for (let r = 0; r < S.rows; r++) {
        for (let c = 0; c < S.cols; c++) {
          const lit = rand() > (style === 'stone' ? 0.6 : 0.5);
          const warm = rand() > 0.55;
          const b = 0.45 + rand() * 0.55;
          const mx = style === 'glass' ? 1 : cw * 0.16, my = style === 'glass' ? 1 : rh * 0.2;
          if (emissive) ctx.fillStyle = lit ? (warm ? `rgba(255,210,150,${b})` : `rgba(200,230,255,${b})`) : '#000';
          else {
            const g = ctx.createLinearGradient(0, r * rh, 0, (r + 1) * rh);
            g.addColorStop(0, S.win);
            g.addColorStop(1, S.frame);
            ctx.fillStyle = g;
          }
          ctx.fillRect(c * cw + mx, r * rh + my, cw - mx * 2, rh - my * 2);
        }
      }
      if (!emissive && style === 'stone') {
        // cornisas de piedra cada pocos pisos
        ctx.fillStyle = 'rgba(255,245,225,0.18)';
        for (let r = 0; r <= S.rows; r += 2) ctx.fillRect(0, r * rh - 2, w, 4);
      }
      if (!emissive && style === 'glass') {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, 'rgba(255,255,255,0.10)');
        g.addColorStop(0.5, 'rgba(255,255,255,0)');
        g.addColorStop(1, 'rgba(255,255,255,0.06)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
    }

    const CITY_STYLES = ['glass', 'steel', 'stone', 'dark'];
    const CITY_MATS = {};
    function cityMaterial(style) {
      if (CITY_MATS[style]) return CITY_MATS[style];
      const seed = 500 + CITY_STYLES.indexOf(style) * 17;
      const col = makeOfficeTexture('city_' + style + '_c', 256, 256, (c, w, h, r) => drawCityFacade(c, w, h, r, style, false), { seed, color: true });
      const emi = makeOfficeTexture('city_' + style + '_e', 256, 256, (c, w, h, r) => drawCityFacade(c, w, h, r, style, true), { seed, color: true });
      const m = new THREE.MeshStandardMaterial({
        color: 0xffffff, map: col, emissive: 0xffffff, emissiveMap: emi, emissiveIntensity: 0.75,
        roughness: style === 'glass' ? 0.25 : style === 'stone' ? 0.85 : 0.5,
        metalness: style === 'glass' ? 0.7 : style === 'steel' ? 0.5 : 0.05,
        envMapIntensity: 0.8
      });
      CITY_MATS[style] = m;
      TOWER_MATS.push(m); // se ilumina de noche con el ciclo día/noche
      return m;
    }

    // Caja cuyas UV se escalan por tamaño: todas las torres de un estilo comparten material
    function cityBoxGeometry(w, h, d, module) {
      const g = new THREE.BoxGeometry(w, h, d);
      const uv = g.attributes.uv;
      const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; // +x −x +y −y +z −z
      for (let f = 0; f < 6; f++) {
        const [fw, fh] = faces[f];
        const top = f === 2 || f === 3;
        for (let i = 0; i < 4; i++) {
          const k = f * 4 + i;
          uv.setXY(k, uv.getX(k) * Math.max(1, Math.round(fw / module)), top ? 0 : uv.getY(k) * Math.max(1, Math.round(fh / module)));
        }
      }
      uv.needsUpdate = true;
      return g;
    }

    function inOfficeArea(x, z, pad) {
      return x > -64 - pad && x < 32 + pad && z > -27 - pad && z < 60 + pad;
    }

    function buildCityBlocks(root) {
      const rand = officeRandom(4242);
      const ground = new THREE.Mesh(cachedGeo('Plane', 420, 420), new THREE.MeshStandardMaterial({ color: new THREE.Color(0x23272e).convertSRGBToLinear(), roughness: 0.95 }));
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(CITY_CENTER.x, -0.36, CITY_CENTER.z);
      ground.receiveShadow = false;
      root.add(ground);
      const sidewalk = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x5b616b).convertSRGBToLinear(), roughness: 0.9 });
      const roofMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x3a3f47).convertSRGBToLinear(), roughness: 0.8, metalness: 0.3 });
      const STEP = 15;
      let count = 0;
      for (let gx = -120; gx <= 90; gx += STEP) {
        for (let gz = -105; gz <= 120; gz += STEP) {
          const cx = gx + (rand() - 0.5) * 2, cz = gz + (rand() - 0.5) * 2;
          const dist = Math.hypot(cx - CITY_CENTER.x, cz - CITY_CENTER.z);
          if (dist > 118 || inOfficeArea(cx, cz, 6)) continue;
          const w = 8 + rand() * 4.5, d = 8 + rand() * 4.5;
          // más altos cuanto más lejos: la ciudad "abraza" la oficina sin taparla
          const near = Math.max(0, Math.min(1, (dist - 45) / 60));
          const h = 16 + near * 46 + rand() * (18 + near * 30);
          const style = CITY_STYLES[Math.floor(rand() * CITY_STYLES.length)];
          const tower = new THREE.Mesh(cityBoxGeometry(w, h, d, style === 'stone' ? 3.2 : 4), cityMaterial(style));
          tower.position.set(cx, h / 2 - 0.35, cz);
          tower.userData.ownGeo = true;
          root.add(tower);
          // acera y remate de azotea
          const walk = new THREE.Mesh(cachedGeo('Box', w + 2.4, 0.2, d + 2.4), sidewalk);
          walk.position.set(cx, -0.26, cz);
          root.add(walk);
          const roof = new THREE.Mesh(cachedGeo('Box', w * 0.55, 1.6, d * 0.55), roofMat);
          roof.position.set(cx, h - 0.35 + 0.8, cz);
          root.add(roof);
          if (h > 55 && rand() > 0.4) {
            const spire = new THREE.Mesh(cachedGeo('Cylinder', 0.12, 0.35, 8, 6), OFFICE_MAT.aluminium);
            spire.position.set(cx, h + 5, cz);
            root.add(spire);
          }
          count++;
        }
      }
      return count;
    }

    // ---- Pantallas gigantes ----
    function makeScreen(root, { x, z, y, w, h, kind, towerH, towerW }) {
      const yaw = Math.atan2(CITY_CENTER.x - x, CITY_CENTER.z - z);
      // torre que sostiene la pantalla, orientada hacia la oficina
      const tw = towerW || w + 4;
      const tower = new THREE.Mesh(cityBoxGeometry(tw, towerH, 9, 4), cityMaterial('dark'));
      tower.position.set(x, towerH / 2 - 0.35, z);
      tower.rotation.y = yaw;
      tower.userData.ownGeo = true;
      root.add(tower);

      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const tex = new THREE.CanvasTexture(canvas);
      tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      const mat = new THREE.MeshBasicMaterial({ map: tex, fog: false, toneMapped: false });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      const fx = Math.sin(yaw) * 4.56, fz = Math.cos(yaw) * 4.56;
      screen.position.set(x + fx, y, z + fz);
      screen.rotation.y = yaw;
      screen.userData.noMerge = true;
      root.add(screen);
      // marco
      const frame = new THREE.Mesh(cachedGeo('Box', w + 0.6, h + 0.6, 0.3), OFFICE_MAT.bezel);
      frame.position.set(x + Math.sin(yaw) * 4.45, y, z + Math.cos(yaw) * 4.45);
      frame.rotation.y = yaw;
      root.add(frame);

      // cinta de titulares debajo de la pantalla
      const tc = document.createElement('canvas');
      tc.width = 2048;
      tc.height = 64;
      const ttex = new THREE.CanvasTexture(tc);
      ttex.wrapS = THREE.RepeatWrapping;
      ttex.encoding = THREE.sRGBEncoding;
      const tick = new THREE.Mesh(new THREE.PlaneGeometry(w, h * 0.11), new THREE.MeshBasicMaterial({ map: ttex, fog: false, toneMapped: false }));
      tick.position.set(x + Math.sin(yaw) * 4.58, y - h / 2 - h * 0.09, z + Math.cos(yaw) * 4.58);
      tick.rotation.y = yaw;
      tick.userData.noMerge = true;
      ttex.repeat.x = 0.5;
      root.add(tick);

      const s = { kind, canvas, ctx: canvas.getContext('2d'), tex, mesh: screen, tick: { canvas: tc, ctx: tc.getContext('2d'), tex: ttex, text: '' } };
      CITY.screens.push(s);
      return s;
    }

    // ---- Reloj gigante (hora real) ----
    function buildBigClock(root, x, z, towerH) {
      const yaw = Math.atan2(CITY_CENTER.x - x, CITY_CENTER.z - z);
      const tower = new THREE.Mesh(cityBoxGeometry(13, towerH, 13, 3.2), cityMaterial('stone'));
      tower.position.set(x, towerH / 2 - 0.35, z);
      tower.rotation.y = yaw;
      tower.userData.ownGeo = true;
      root.add(tower);
      const R = 5.2;
      const faceTex = makeOfficeTexture('clock_face', 512, 512, (c, w, h) => {
        const cx = w / 2, cy = h / 2, r = w / 2 - 6;
        const g = c.createRadialGradient(cx, cy, 10, cx, cy, r);
        g.addColorStop(0, '#fffdf5');
        g.addColorStop(1, '#e8dcc0');
        c.fillStyle = g;
        c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
        c.lineWidth = 14; c.strokeStyle = '#b08d3c'; c.stroke();
        c.fillStyle = '#1f2937';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = '700 54px Georgia, serif';
        const nums = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * Math.PI * 2;
          c.fillText(nums[i], cx + Math.sin(a) * r * 0.78, cy - Math.cos(a) * r * 0.78);
        }
        for (let i = 0; i < 60; i++) {
          const a = i / 60 * Math.PI * 2, l = i % 5 ? 10 : 22;
          c.lineWidth = i % 5 ? 3 : 6;
          c.beginPath();
          c.moveTo(cx + Math.sin(a) * (r - 18), cy - Math.cos(a) * (r - 18));
          c.lineTo(cx + Math.sin(a) * (r - 18 - l), cy - Math.cos(a) * (r - 18 - l));
          c.stroke();
        }
        c.font = '600 22px Georgia, serif';
        c.fillText(BRAND_UPPER.slice(0, 18), cx, cy + r * 0.38);
      }, { color: true, clamp: true });
      const group = new THREE.Group();
      group.position.set(x + Math.sin(yaw) * 6.62, towerH - 9, z + Math.cos(yaw) * 6.62);
      group.rotation.y = yaw;
      group.userData.noMerge = true;
      const face = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshBasicMaterial({ map: faceTex, fog: false, toneMapped: false }));
      face.userData.noMerge = true;
      group.add(face);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(R + 0.15, 0.28, 8, 48), OFFICE_MAT.copper);
      ring.userData.noMerge = true;
      group.add(ring);
      const handMat = new THREE.MeshBasicMaterial({ color: 0x111827, fog: false });
      const mkHand = (len, wid, z, color) => {
        const pivot = new THREE.Group();
        const m = new THREE.Mesh(new THREE.PlaneGeometry(wid, len), color ? new THREE.MeshBasicMaterial({ color, fog: false }) : handMat);
        m.position.y = len / 2 - len * 0.12;
        m.position.z = z;
        m.userData.noMerge = true;
        pivot.add(m);
        group.add(pivot);
        return pivot;
      };
      const hHand = mkHand(R * 0.55, 0.32, 0.03);
      const mHand = mkHand(R * 0.82, 0.2, 0.05);
      const sHand = mkHand(R * 0.88, 0.07, 0.07, 0xdc2626);
      const cap = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), new THREE.MeshBasicMaterial({ color: 0xb08d3c, fog: false }));
      cap.position.z = 0.09;
      group.add(cap);
      root.add(group);
      CITY.clock = { hHand, mHand, sHand };
    }

    function updateBigClock() {
      if (!CITY.clock) return;
      const d = new Date();
      const s = d.getSeconds() + d.getMilliseconds() / 1000;
      const m = d.getMinutes() + s / 60;
      const h = (d.getHours() % 12) + m / 60;
      CITY.clock.sHand.rotation.z = -s / 60 * Math.PI * 2;
      CITY.clock.mHand.rotation.z = -m / 60 * Math.PI * 2;
      CITY.clock.hHand.rotation.z = -h / 12 * Math.PI * 2;
    }

    // ---- Datos en vivo ----
    async function fetchJson(url, ms = 9000) {
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const t = ctrl ? setTimeout(() => ctrl.abort(), ms) : null;
      try {
        const r = await fetch(url, { signal: ctrl ? ctrl.signal : undefined, cache: 'no-store' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return await r.json();
      } finally { if (t) clearTimeout(t); }
    }

    const CRYPTO_IDS = [['bitcoin', 'BTC'], ['ethereum', 'ETH'], ['solana', 'SOL'], ['ripple', 'XRP'], ['dogecoin', 'DOGE'], ['cardano', 'ADA']];
    async function refreshMarkets() {
      try {
        const j = await fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=' + CRYPTO_IDS.map(c => c[0]).join(',') + '&vs_currencies=usd&include_24hr_change=true');
        LIVE.crypto = CRYPTO_IDS.filter(([id]) => j[id]).map(([id, sym]) => ({ sym, price: j[id].usd, change: j[id].usd_24h_change || 0 }));
        LIVE.updated.crypto = Date.now();
        LIVE.status.crypto = 'ok';
      } catch (e) { LIVE.status.crypto = 'error'; }
    }

    const FX_LIST = ['EUR', 'GBP', 'JPY', 'MXN', 'COP', 'ARS', 'CLP', 'PEN', 'BRL', 'DOP'];
    async function refreshFx() {
      try {
        const j = await fetchJson('https://open.er-api.com/v6/latest/USD');
        if (j && j.rates) {
          LIVE.fx = FX_LIST.filter(k => j.rates[k]).map(k => ({ sym: 'USD/' + k, rate: j.rates[k] }));
          LIVE.updated.fx = Date.now();
          LIVE.status.fx = 'ok';
        }
      } catch (e) { LIVE.status.fx = 'error'; }
    }

    async function refreshNews() {
      const d = new Date();
      const ymd = d.getUTCFullYear() + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + String(d.getUTCDate()).padStart(2, '0');
      try {
        const j = await fetchJson('https://es.wikipedia.org/api/rest_v1/feed/featured/' + ymd);
        const arts = (j.mostread && j.mostread.articles) || [];
        LIVE.news = arts.filter(a => a.titles && !/^(Especial|Wikipedia|Portal|Anexo):/.test(a.titles.normalized || '') && !/Página principal/.test(a.titles.normalized || ''))
          .slice(0, 10).map(a => ({ title: a.titles.normalized, desc: a.description || '', views: a.views || 0 }));
        if (j.news && j.news.length) LIVE.news.unshift(...j.news.slice(0, 3).map(n => ({ title: String(n.story || '').replace(/<[^>]+>/g, '').slice(0, 140), desc: '', views: 0 })));
        LIVE.updated.news = Date.now();
        LIVE.status.news = 'ok';
      } catch (e) { LIVE.status.news = 'error'; }
      try {
        const mm = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
        const j = await fetchJson(`https://es.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`);
        const ev = (j.events || []).filter(e => e.text && e.year).sort(() => Math.random() - 0.5).slice(0, 6);
        LIVE.history = ev.map(e => ({ year: e.year, text: e.text }));
      } catch (e) { /* sin efemérides */ }
    }

    const WEATHER_CITIES = [['Nueva York', 40.71, -74.01], ['Madrid', 40.42, -3.70], ['CDMX', 19.43, -99.13], ['Bogotá', 4.71, -74.07], ['Buenos Aires', -34.60, -58.38], ['Santo Domingo', 18.49, -69.93]];
    const WMO = (c) => c === 0 ? ['☀', 'Despejado'] : c <= 2 ? ['🌤', 'Poco nuboso'] : c === 3 ? ['☁', 'Nublado'] : c <= 48 ? ['🌫', 'Niebla'] : c <= 57 ? ['🌦', 'Llovizna'] : c <= 67 ? ['🌧', 'Lluvia'] : c <= 77 ? ['❄', 'Nieve'] : c <= 82 ? ['🌧', 'Chubascos'] : ['⛈', 'Tormenta'];
    async function refreshWeather() {
      try {
        const lat = WEATHER_CITIES.map(c => c[1]).join(','), lon = WEATHER_CITIES.map(c => c[2]).join(',');
        const j = await fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`);
        const arr = Array.isArray(j) ? j : [j];
        LIVE.weather = arr.map((r, i) => ({ city: WEATHER_CITIES[i][0], temp: r.current.temperature_2m, code: r.current.weather_code, wind: r.current.wind_speed_10m, tz: r.timezone }));
        LIVE.updated.weather = Date.now();
        LIVE.status.weather = 'ok';
      } catch (e) { LIVE.status.weather = 'error'; }
    }

    function startLiveData() {
      const run = (fn, every) => { fn(); setInterval(() => { if (!document.hidden) fn(); }, every); };
      run(refreshMarkets, 120000);
      run(refreshFx, 600000);
      run(refreshNews, 900000);
      run(refreshWeather, 600000);
    }

    // ---- Dibujo de las pantallas ----
    function screenFrame(ctx, w, h, title, accent, source) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#050a18');
      g.addColorStop(1, '#0b1430');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, w, 64);
      ctx.fillStyle = '#020617';
      ctx.font = '800 34px Inter, Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(title, 28, 33);
      ctx.textAlign = 'right';
      const blink = Math.floor(Date.now() / 700) % 2;
      ctx.fillStyle = blink ? '#dc2626' : '#7f1d1d';
      ctx.beginPath(); ctx.arc(w - 128, 33, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#020617';
      ctx.font = '800 26px Inter, Arial, sans-serif';
      ctx.fillText('EN VIVO', w - 24, 34);
      ctx.fillStyle = 'rgba(148,163,184,0.75)';
      ctx.font = '500 18px Inter, Arial, sans-serif';
      ctx.fillText(source, w - 24, h - 20);
      ctx.textAlign = 'left';
      ctx.fillText(new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 28, h - 20);
    }

    function fitText(ctx, text, maxW) {
      let t = String(text);
      if (ctx.measureText(t).width <= maxW) return t;
      while (t.length > 3 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
      return t + '…';
    }

    function waiting(ctx, w, h, st) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 34px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(st === 'error' ? 'Sin conexión con la fuente de datos' : 'Conectando con los datos en vivo…', w / 2, h / 2);
      ctx.textAlign = 'left';
    }

    const fmtPrice = (n) => n >= 1000 ? '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : n >= 1 ? '$' + n.toFixed(2) : '$' + n.toFixed(4);

    function drawMarkets(s) {
      const { ctx, canvas: { width: w, height: h } } = s;
      screenFrame(ctx, w, h, 'MERCADOS · CRIPTO Y DIVISAS', '#22d3ee', 'CoinGecko · ExchangeRate-API');
      if (!LIVE.crypto && !LIVE.fx) { waiting(ctx, w, h, LIVE.status.crypto); return; }
      (LIVE.crypto || []).forEach((c, i) => {
        const y = 108 + i * 56;
        ctx.fillStyle = '#e2e8f0'; ctx.font = '800 34px Inter, Arial, sans-serif';
        ctx.fillText(c.sym, 32, y);
        ctx.font = '700 34px "JetBrains Mono", monospace';
        ctx.fillText(fmtPrice(c.price), 150, y);
        const up = c.change >= 0;
        ctx.fillStyle = up ? '#34d399' : '#f87171';
        ctx.fillText((up ? '▲ ' : '▼ ') + Math.abs(c.change).toFixed(2) + '%', 390, y);
      });
      ctx.fillStyle = '#1e293b'; ctx.fillRect(600, 84, 3, h - 150);
      (LIVE.fx || []).slice(0, 7).forEach((f, i) => {
        const y = 108 + i * 48;
        ctx.fillStyle = '#94a3b8'; ctx.font = '700 28px Inter, Arial, sans-serif';
        ctx.fillText(f.sym, 630, y);
        ctx.fillStyle = '#fde68a'; ctx.font = '700 28px "JetBrains Mono", monospace';
        ctx.fillText(f.rate >= 100 ? f.rate.toFixed(0) : f.rate.toFixed(3), 830, y);
      });
    }

    function drawNews(s) {
      const { ctx, canvas: { width: w, height: h } } = s;
      const showHistory = CITY.page % 2 === 1 && LIVE.history.length;
      screenFrame(ctx, w, h, showHistory ? 'TAL DÍA COMO HOY' : 'LO MÁS LEÍDO HOY', '#f472b6', 'Wikipedia en español');
      if (showHistory) {
        LIVE.history.slice(0, 4).forEach((e, i) => {
          const y = 110 + i * 84;
          ctx.fillStyle = '#f9a8d4'; ctx.font = '800 32px Inter, Arial, sans-serif';
          ctx.fillText(String(e.year), 32, y);
          ctx.fillStyle = '#e2e8f0'; ctx.font = '500 26px Inter, Arial, sans-serif';
          ctx.fillText(fitText(ctx, e.text, w - 180), 140, y);
          ctx.fillStyle = '#94a3b8'; ctx.font = '400 22px Inter, Arial, sans-serif';
          ctx.fillText(fitText(ctx, e.text.slice(70), w - 180), 140, y + 32);
        });
        return;
      }
      if (!LIVE.news.length) { waiting(ctx, w, h, LIVE.status.news); return; }
      LIVE.news.slice(0, 6).forEach((n, i) => {
        const y = 106 + i * 58;
        ctx.fillStyle = '#f472b6'; ctx.font = '800 30px Inter, Arial, sans-serif';
        ctx.fillText(String(i + 1), 32, y);
        ctx.fillStyle = '#f8fafc'; ctx.font = '700 30px Inter, Arial, sans-serif';
        const t = fitText(ctx, n.title, 520);
        ctx.fillText(t, 76, y);
        ctx.fillStyle = '#94a3b8'; ctx.font = '400 22px Inter, Arial, sans-serif';
        ctx.fillText(fitText(ctx, n.desc, w - 120 - Math.min(540, ctx.measureText(t).width + 30)), 96 + Math.min(520, ctx.measureText(t).width) + 20, y + 2);
      });
    }

    function drawWeather(s) {
      const { ctx, canvas: { width: w, height: h } } = s;
      screenFrame(ctx, w, h, 'CLIMA EN EL MUNDO', '#fbbf24', 'Open-Meteo');
      if (!LIVE.weather.length) { waiting(ctx, w, h, LIVE.status.weather); return; }
      LIVE.weather.forEach((c, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = 36 + col * 494, y = 120 + row * 116;
        const [ico, txt] = WMO(c.code);
        ctx.fillStyle = 'rgba(30,41,59,0.6)';
        ctx.fillRect(x - 12, y - 46, 470, 100);
        ctx.font = '48px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.fillStyle = '#fde68a';
        ctx.fillText(ico, x, y);
        ctx.fillStyle = '#f8fafc'; ctx.font = '800 30px Inter, Arial, sans-serif';
        ctx.fillText(c.city, x + 70, y - 12);
        ctx.fillStyle = '#94a3b8'; ctx.font = '500 22px Inter, Arial, sans-serif';
        let local = '';
        try { local = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', timeZone: c.tz }); } catch (e) { local = ''; }
        ctx.fillText(`${txt} · ${Math.round(c.wind)} km/h${local ? ' · ' + local : ''}`, x + 70, y + 22);
        ctx.fillStyle = '#fbbf24'; ctx.font = '800 44px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(c.temp) + '°', x + 446, y + 4);
        ctx.textAlign = 'left';
      });
    }

    function drawCompany(s) {
      const { ctx, canvas: { width: w, height: h } } = s;
      screenFrame(ctx, w, h, BRAND_UPPER.slice(0, 22) + ' · AHORA', '#34d399', 'Datos de tu empresa');
      const d = new Date();
      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 120px "JetBrains Mono", monospace';
      ctx.fillText(d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }), 32, 180);
      ctx.fillStyle = '#94a3b8'; ctx.font = '600 30px Inter, Arial, sans-serif';
      ctx.fillText(d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), 36, 240);
      const blk = typeof currentScheduleBlock === 'function' ? currentScheduleBlock() : null;
      if (blk) { ctx.fillStyle = '#6ee7b7'; ctx.font = '700 32px Inter, Arial, sans-serif'; ctx.fillText(blk.label.replace(/^\S+\s/, '') + ' · hasta las ' + blk.toTxt, 36, 296); }
      const mine = PROJECTS.filter(p => p.officeId === 'main');
      const stats = [
        ['Equipo IA', AGENTS.filter(a => a.type === 'AI' && !a.leaving && officeOf(a) === 'main').length],
        ['En curso', mine.filter(p => p.status === 'en_curso').length],
        ['Por revisar', mine.filter(p => p.status === 'revision').length],
        ['Entregados', DELIVERABLES.length]
      ];
      stats.forEach(([k, v], i) => {
        const x = 36 + i * 245;
        ctx.fillStyle = 'rgba(30,41,59,0.7)'; ctx.fillRect(x, 330, 225, 120);
        ctx.fillStyle = '#34d399'; ctx.font = '800 54px "JetBrains Mono", monospace'; ctx.fillText(String(v), x + 20, 385);
        ctx.fillStyle = '#cbd5e1'; ctx.font = '600 24px Inter, Arial, sans-serif'; ctx.fillText(k, x + 20, 428);
      });
    }

    const SCREEN_DRAW = { markets: drawMarkets, news: drawNews, weather: drawWeather, company: drawCompany };

    function tickerText() {
      const parts = [];
      (LIVE.crypto || []).forEach(c => parts.push(`${c.sym} ${fmtPrice(c.price)} ${c.change >= 0 ? '▲' : '▼'}${Math.abs(c.change).toFixed(1)}%`));
      (LIVE.fx || []).slice(0, 5).forEach(f => parts.push(`${f.sym} ${f.rate >= 100 ? f.rate.toFixed(0) : f.rate.toFixed(3)}`));
      LIVE.news.slice(0, 5).forEach(n => parts.push('📰 ' + n.title));
      LIVE.weather.slice(0, 3).forEach(c => parts.push(`${c.city} ${Math.round(c.temp)}°`));
      parts.push(BRAND + ' · ' + new Date().toLocaleDateString('es', { day: 'numeric', month: 'long' }));
      return parts.join('   •   ');
    }

    function drawTicker(t, text) {
      if (t.text === text) return;
      t.text = text;
      const { ctx, canvas } = t;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fde68a';
      ctx.font = '700 36px Inter, Arial, sans-serif';
      ctx.textBaseline = 'middle';
      let s = text + '   •   ';
      while (ctx.measureText(s).width < canvas.width) s += s;
      ctx.fillText(s, 0, canvas.height / 2 + 2);
      t.tex.needsUpdate = true;
    }

    function updateCityScreens(dt) {
      if (!CITY.built) return;
      updateBigClock();
      for (let i = 0; i < CITY.screens.length; i++) CITY.screens[i].tick.tex.offset.x = (CITY.screens[i].tick.tex.offset.x + dt * 0.025) % 1;
      const now = performance.now();
      if (now - CITY.lastDraw < 1000) return;
      CITY.lastDraw = now;
      CITY.page = Math.floor(Date.now() / 12000);
      const tt = tickerText();
      CITY.screens.forEach(s => {
        try { SCREEN_DRAW[s.kind](s); } catch (e) { /* datos incompletos */ }
        s.tex.needsUpdate = true;
        drawTicker(s.tick, tt);
      });
      updateHudTicker(tt);
    }

    // Cinta de la cabecera con los mismos datos en vivo
    let _hudTickerText = '';
    function updateHudTicker(text) {
      const el = document.getElementById('ticker-content');
      if (!el || text === _hudTickerText) return;
      _hudTickerText = text;
      const items = text.split('   •   ').map(t => `<span class="inline-flex items-center px-3 text-slate-200">${escapeHtml(t)}</span>`).join('<span class="text-slate-600">•</span>');
      el.innerHTML = items + '<span class="text-slate-600">•</span>' + items;
    }

    function buildCity() {
      if (CITY.built) return;
      const root = new THREE.Group();
      root.userData.mergeRoot = true;
      root.name = 'ciudad';
      const n = buildCityBlocks(root);
      makeScreen(root, { x: -12, z: -44, y: 24, w: 20, h: 10, kind: 'company', towerH: 44, towerW: 26 });
      makeScreen(root, { x: 24, z: -38, y: 22, w: 17, h: 8.5, kind: 'markets', towerH: 40 });
      makeScreen(root, { x: -50, z: -40, y: 22, w: 17, h: 8.5, kind: 'news', towerH: 42 });
      makeScreen(root, { x: 46, z: 8, y: 20, w: 17, h: 8.5, kind: 'weather', towerH: 36 });
      makeScreen(root, { x: -84, z: 10, y: 22, w: 17, h: 8.5, kind: 'markets', towerH: 40 });
      buildBigClock(root, 6, -52, 62);
      scene.add(root);
      const exclude = new Set();
      root.traverse(o => { if (o.userData.noMerge) exclude.add(o); });
      mergeStaticRoot(root, exclude);
      root.traverse(o => { if (o.isMesh && !o.userData.noMerge) { o.castShadow = false; o.receiveShadow = false; } });
      CITY.root = root;
      CITY.built = true;
      // aplica la iluminación actual de día / noche a las fachadas nuevas
      applyTimeOfDay(TOD.t * TOD.t * (3 - 2 * TOD.t));
      console.info(`Ciudad: ${n} edificios, ${CITY.screens.length} pantallas en vivo y reloj gigante.`);
      startLiveData();
    }
