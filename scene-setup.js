    // [scene-setup.js] Parte de lo que antes era script.js: ESCENA 3D: cámara, luces y base (sección 3).
    // Se carga en orden desde index.html; no cambies el orden de los archivos.
    // ------------------------------------------------------------------------
    // 3. ESCENA 3D DE FRPROGRAMITY (THREE.JS)
    // _________________________________________________________________
    let scene, camera, renderer, controls;
    let raycaster, mouse;
    let desiredCameraTarget = new THREE.Vector3(-7.5, 0.8, 4);
    let cameraMode = 'overview';

    const zoneFloorMeshes = {};
    const agentMeshes = {};
    const packetMeshes = [];
    let steamParticles = [];

    // ------------------------------------------------------------------------
    // 3.1 TEXTURAS PROCEDIMENTALES (THREE.CanvasTexture, sin URLs externas)
    // ------------------------------------------------------------------------
    const OFFICE_TEX = {};
    const OFFICE_MAT = {};
    const animatedScreens = [];
    const blinkingLeds = [];

    function officeHash(str) {
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    }

    function officeRandom(seed) {
      let s = (seed >>> 0) || 1;
      return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
      };
    }

    // Crea (y cachea) una textura de canvas. opts: { seed, color, clamp, repeat }
    function makeOfficeTexture(key, w, h, draw, opts = {}) {
      if (OFFICE_TEX[key]) return OFFICE_TEX[key];
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      draw(ctx, w, h, officeRandom(opts.seed !== undefined ? opts.seed : officeHash(key)));
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = tex.wrapT = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
      if (opts.repeat) tex.repeat.set(opts.repeat[0], opts.repeat[1]);
      if (opts.color) tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
      OFFICE_TEX[key] = tex;
      return tex;
    }

    // Copia de una textura con su propio repeat (comparte el canvas).
    // En r128 cada clon se sube por separado a la GPU, así que se cachean por (textura, repeat).
    const OFFICE_TEX_REPEAT = new Map();
    function officeTexRepeat(tex, rx, ry) {
      const key = tex.uuid + '|' + rx.toFixed(3) + '|' + ry.toFixed(3);
      let t = OFFICE_TEX_REPEAT.get(key);
      if (!t) {
        t = tex.clone();
        t.repeat.set(rx, ry);
        t.needsUpdate = true;
        OFFICE_TEX_REPEAT.set(key, t);
      }
      return t;
    }

    // Clon único (sin caché) para texturas que se animan por separado (pantallas de código)
    function officeTexUnique(tex, rx, ry) {
      const t = tex.clone();
      t.repeat.set(rx, ry);
      t.needsUpdate = true;
      return t;
    }

    // ------------------------------------------------------------------------
    // 3.1b CACHÉ DE GEOMETRÍAS Y MATERIALES (se crean una sola vez y se comparten)
    // ------------------------------------------------------------------------
    const GEO_CACHE = new Map();
    function cachedGeo(type, ...args) {
      const key = type + '|' + args.map(a => (typeof a === 'number' ? +a.toFixed(4) : a)).join(',');
      let g = GEO_CACHE.get(key);
      if (!g) {
        g = new THREE[type + 'Geometry'](...args);
        g.computeBoundingSphere();
        GEO_CACHE.set(key, g);
      }
      return g;
    }

    const MAT_CACHE = new Map();
    function cachedMat(key, factory) {
      let m = MAT_CACHE.get(key);
      if (!m) {
        m = factory();
        MAT_CACHE.set(key, m);
      }
      return m;
    }

    // Umbral de tamaño (radio de la esfera envolvente, en metros) para proyectar sombra
    const SHADOW_MIN_RADIUS = 0.2;

    function rgba(c, a) {
      return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    }

    // --- Alfombra modular con micro-trama y juntas (color / relieve) ---
    function drawCarpetTiles(ctx, w, h, rand, mode) {
      const tiles = 4;
      const ts = w / tiles;
      const bump = mode === 'bump';
      for (let ty = 0; ty < tiles; ty++) {
        for (let tx = 0; tx < tiles; tx++) {
          const x0 = tx * ts;
          const y0 = ty * ts;
          const shade = (rand() - 0.5) * 10;
          ctx.fillStyle = bump
            ? `rgb(${200 + shade},${200 + shade},${200 + shade})`
            : `rgb(${50 + shade},${56 + shade},${68 + shade})`;
          ctx.fillRect(x0, y0, ts, ts);
          const horizontal = (tx + ty) % 2 === 0;
          ctx.lineWidth = 1;
          for (let i = 0; i < 1100; i++) {
            const px = x0 + rand() * ts;
            const py = y0 + rand() * ts;
            const len = 2 + rand() * 4;
            const v = rand();
            if (bump) ctx.strokeStyle = v > 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(120,120,120,0.35)';
            else ctx.strokeStyle = v > 0.5 ? 'rgba(110,122,145,0.33)' : 'rgba(18,22,30,0.38)';
            ctx.beginPath();
            ctx.moveTo(px, py);
            if (horizontal) ctx.lineTo(px + len, py);
            else ctx.lineTo(px, py + len);
            ctx.stroke();
          }
          // micro-trama (bucle de fibra en filas)
          ctx.fillStyle = bump ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.08)';
          for (let k = 0; k < ts; k += 4) {
            if (horizontal) ctx.fillRect(x0, y0 + k, ts, 1);
            else ctx.fillRect(x0 + k, y0, 1, ts);
          }
          // juntas sutiles entre losetas
          ctx.fillStyle = bump ? 'rgb(140,140,140)' : 'rgba(12,14,20,0.8)';
          ctx.fillRect(x0, y0, ts, 1.5);
          ctx.fillRect(x0, y0, 1.5, ts);
        }
      }
    }

    // --- Madera natural con veta periódica (sin costuras al repetir) ---
    function drawWoodGrain(ctx, w, h, rand, mode, palette) {
      const bump = mode === 'bump';
      const base = palette.base, dark = palette.dark, light = palette.light;
      ctx.fillStyle = bump ? 'rgb(150,150,150)' : `rgb(${base[0]},${base[1]},${base[2]})`;
      ctx.fillRect(0, 0, w, h);
      // bandas anchas de tono
      for (let i = 0; i < 10; i++) {
        const y = rand() * h;
        const bh = 10 + rand() * 40;
        const useDark = rand() > 0.5;
        const strength = rand();
        ctx.fillStyle = bump ? `rgba(0,0,0,${0.04 * strength})` : rgba(useDark ? dark : light, 0.12 * strength);
        ctx.fillRect(0, y, w, bh);
      }
      // veta ondulada
      for (let i = 0; i < 150; i++) {
        const y = rand() * h;
        const amp = 1.5 + rand() * 6;
        const k1 = 1 + Math.floor(rand() * 3);
        const freq = (Math.PI * 2 * k1) / w;
        const phase = rand() * Math.PI * 2;
        const darkLine = rand() > 0.35;
        ctx.lineWidth = 0.5 + rand() * 1.6;
        ctx.strokeStyle = bump
          ? (darkLine ? 'rgba(60,60,60,0.35)' : 'rgba(220,220,220,0.25)')
          : (darkLine ? rgba(dark, 0.26) : rgba(light, 0.2));
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const yy = y + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3 + phase * 1.7) * amp * 0.25;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      // poros
      for (let i = 0; i < 2600; i++) {
        const px = rand() * w;
        const py = rand() * h;
        ctx.fillStyle = bump ? 'rgba(40,40,40,0.45)' : rgba(dark, 0.3);
        ctx.fillRect(px, py, 2 + rand() * 5, 0.8);
      }
    }

    // --- Piso laminado de oficina (tablones con juntas escalonadas) ---
    function drawLaminate(ctx, w, h, rand, mode) {
      const bump = mode === 'bump';
      const rows = 8;
      const rh = h / rows;
      for (let r = 0; r < rows; r++) {
        let x = -rand() * w * 0.5;
        while (x < w) {
          const len = w * (0.45 + rand() * 0.4);
          const t = (rand() - 0.5) * 26;
          ctx.fillStyle = bump ? 'rgb(170,170,170)' : `rgb(${150 + t},${112 + t * 0.8},${78 + t * 0.6})`;
          ctx.fillRect(x, r * rh, len, rh);
          for (let g = 0; g < 9; g++) {
            const gy = r * rh + rand() * rh;
            ctx.strokeStyle = bump ? 'rgba(80,80,80,0.3)' : 'rgba(80,52,30,0.22)';
            ctx.lineWidth = 0.6 + rand();
            ctx.beginPath();
            ctx.moveTo(x, gy);
            ctx.bezierCurveTo(x + len * 0.3, gy + (rand() - 0.5) * 6, x + len * 0.6, gy + (rand() - 0.5) * 6, x + len, gy);
            ctx.stroke();
          }
          ctx.fillStyle = bump ? 'rgb(60,60,60)' : 'rgba(40,26,16,0.7)';
          ctx.fillRect(x, r * rh, 1.5, rh);
          x += len;
        }
        ctx.fillStyle = bump ? 'rgb(60,60,60)' : 'rgba(40,26,16,0.75)';
        ctx.fillRect(0, r * rh, w, 1.5);
      }
    }

    // --- Mármol claro con vetas ---
    function drawMarble(ctx, w, h, rand) {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#eeebe6');
      grad.addColorStop(1, '#e2ddd6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = `rgba(150,145,140,${rand() * 0.08})`;
        ctx.fillRect(rand() * w, rand() * h, 2, 2);
      }
      for (let v = 0; v < 9; v++) {
        let x = rand() * w;
        let y = rand() * h;
        let ang = rand() * Math.PI * 2;
        const pts = [];
        for (let s = 0; s < 60; s++) {
          ang += (rand() - 0.5) * 0.6;
          x += Math.cos(ang) * 9;
          y += Math.sin(ang) * 9;
          pts.push([x, y]);
        }
        [[7, 0.05], [3, 0.12], [1, 0.35]].forEach(([lw, a]) => {
          ctx.strokeStyle = `rgba(105,100,98,${a})`;
          ctx.lineWidth = lw * (0.6 + rand() * 0.8);
          ctx.beginPath();
          pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
          ctx.stroke();
        });
      }
    }

    // --- Tela tejida neutra (se tiñe con material.color) ---
    function drawFabric(ctx, w, h, rand, mode) {
      const bump = mode === 'bump';
      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const weave = ((x >> 1) + (y >> 1)) % 2 === 0;
          const n = (rand() - 0.5) * 18;
          const v = (weave ? (bump ? 215 : 222) : (bump ? 140 : 190)) + n;
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillRect(x, y, 2, 2);
        }
      }
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
        ctx.fillRect(rand() * w, rand() * h, 8 + rand() * 24, 2);
      }
    }

    // --- Cuero con poro y arrugas finas ---
    function drawLeather(ctx, w, h, rand) {
      ctx.fillStyle = 'rgb(205,205,205)';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) {
        const r = 1 + rand() * 3;
        ctx.fillStyle = rand() > 0.5 ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.arc(rand() * w, rand() * h, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      for (let i = 0; i < 120; i++) {
        let x = rand() * w, y = rand() * h;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let s = 0; s < 5; s++) {
          x += (rand() - 0.5) * 14;
          y += (rand() - 0.5) * 14;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    // --- Metal cepillado ---
    function drawBrushedMetal(ctx, w, h, rand) {
      ctx.fillStyle = 'rgb(170,174,180)';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) {
        const v = rand() > 0.5 ? 255 : 60;
        ctx.fillStyle = `rgba(${v},${v},${v},${0.03 + rand() * 0.06})`;
        ctx.fillRect(rand() * w - 40, rand() * h, 40 + rand() * w, 1);
      }
    }

    // --- Ruido fino (superficies mate/satinadas, cerámica, maceta) ---
    function drawFineNoise(ctx, w, h, rand) {
      ctx.fillStyle = 'rgb(200,200,200)';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const v = Math.floor(120 + rand() * 135);
        ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
        ctx.fillRect(rand() * w, rand() * h, 1.5, 1.5);
      }
    }

    // --- Frente de rack: unidades 1U/2U, rejillas, bahías y LEDs ---
    function drawRackFront(ctx, w, h, rand, mode) {
      const emissive = mode === 'emissive';
      ctx.fillStyle = emissive ? '#000' : '#14171c';
      ctx.fillRect(0, 0, w, h);
      const units = 11;
      const uh = h / units;
      const ledColors = ['#34d399', '#2dd4bf', '#22d3ee', '#fbbf24', '#34d399', '#f87171'];
      for (let u = 0; u < units; u++) {
        const y = u * uh;
        if (!emissive) {
          ctx.fillStyle = '#1f242c';
          ctx.fillRect(10, y + 3, w - 20, uh - 6);
          ctx.fillStyle = '#2b313b';
          ctx.fillRect(10, y + 3, w - 20, 2);
        }
        // rejilla de ventilación
        for (let gx = 22; gx < w * 0.55; gx += 7) {
          for (let gy = y + 10; gy < y + uh - 8; gy += 7) {
            if (!emissive) {
              ctx.fillStyle = '#07080b';
              ctx.beginPath();
              ctx.arc(gx, gy, 2.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        // bahías de disco
        for (let b = 0; b < 3; b++) {
          const bx = w * 0.6 + b * 24;
          if (!emissive) {
            ctx.fillStyle = '#0d1014';
            ctx.fillRect(bx, y + 9, 20, uh - 18);
          }
          const on = rand() > 0.2;
          const col = ledColors[Math.floor(rand() * ledColors.length)];
          ctx.fillStyle = emissive ? (on ? col : '#000') : (on ? col : '#333');
          ctx.fillRect(bx + 3, y + uh - 14, 5, 3);
        }
        const pw = rand() > 0.15;
        ctx.fillStyle = emissive ? (pw ? '#60a5fa' : '#000') : '#3b82f6';
        ctx.beginPath();
        ctx.arc(w - 22, y + uh / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // --- Fachada de torres con ventanas encendidas ---
    function drawFacade(ctx, w, h, rand, mode) {
      const emissive = mode === 'emissive';
      ctx.fillStyle = emissive ? '#000' : '#0c1424';
      ctx.fillRect(0, 0, w, h);
      const cols = 8, rows = 16;
      const cw = w / cols, rh = h / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const lit = rand() > 0.55;
          const warm = rand() > 0.6;
          const b = 0.5 + rand() * 0.5;
          if (emissive) {
            ctx.fillStyle = lit ? (warm ? `rgba(255,214,160,${b})` : `rgba(220,240,255,${b})`) : '#000';
          } else {
            ctx.fillStyle = lit ? '#3b4a63' : '#16223a';
          }
          ctx.fillRect(c * cw + 3, r * rh + 4, cw - 6, rh - 8);
        }
      }
    }

    // --- Mapa de entorno (reflejos suaves de oficina) ---
    function drawEnvironment(ctx, w, h, rand) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#c7d2e0');
      g.addColorStop(0.45, '#6b7a90');
      g.addColorStop(0.55, '#3a4456');
      g.addColorStop(1, '#16191f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // paneles de luz de techo
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = 'rgba(255,250,240,0.9)';
        ctx.fillRect(rand() * w, 15 + rand() * 50, 40, 10);
      }
      // ventanales a la altura del horizonte
      ctx.fillStyle = 'rgba(150,190,240,0.35)';
      for (let x = 0; x < w; x += 64) ctx.fillRect(x + 4, h * 0.38, 56, h * 0.12);
    }

    // --- Alfombra de la zona de descanso ---
    function drawRug(ctx, w, h, rand) {
      ctx.fillStyle = '#8f6a55';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#e8dccb';
      ctx.lineWidth = 10;
      ctx.strokeRect(22, 22, w - 44, h - 44);
      ctx.strokeStyle = '#4b3a33';
      ctx.lineWidth = 4;
      ctx.strokeRect(44, 44, w - 88, h - 88);
      ctx.fillStyle = 'rgba(232,220,203,0.55)';
      for (let y = 80; y < h - 80; y += 48) {
        for (let x = 80; x < w - 80; x += 48) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-7, -7, 14, 14);
          ctx.restore();
        }
      }
      for (let i = 0; i < 6000; i++) {
        ctx.fillStyle = rand() > 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)';
        ctx.fillRect(rand() * w, rand() * h, 2, 2);
      }
    }

    // ---------------- Pantallas con interfaz simulada ----------------
    function drawScreenFrame(ctx, w, h, title, accent) {
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#111a2e';
      ctx.fillRect(0, 0, w, 26);
      ['#f87171', '#fbbf24', '#34d399'].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(14 + i * 14, 13, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = accent;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(title, 64, 18);
    }

    function drawCodeScreen(ctx, w, h, rand) {
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#161b22';
      ctx.fillRect(0, 0, 38, h);
      const kw = ['const', 'function', 'return', 'if', 'await', 'export', 'import', 'let', 'class', 'async'];
      const ids = ['player', 'render', 'state', 'level', 'api', 'useStore', 'buildApp', 'score', 'ticket', 'router', 'deploy', 'config'];
      const strs = ["'./engine'", "'/api/help'", "'ready'", "'FRPROGRAMITY'", "'v2.4.1'"];
      ctx.font = '13px monospace';
      const lh = 18;
      let indent = 0;
      for (let i = 0; i < Math.floor(h / lh); i++) {
        const y = 14 + i * lh;
        ctx.fillStyle = '#484f58';
        ctx.fillText(String(i + 1).padStart(3, ' '), 4, y);
        let x = 48 + indent * 18;
        const kind = rand();
        if (kind < 0.12) {
          ctx.fillStyle = '#8b949e';
          ctx.fillText('// ' + ids[Math.floor(rand() * ids.length)] + ' listo para revisión', x, y);
        } else if (kind < 0.2) {
          indent = Math.max(0, indent - 1);
          ctx.fillStyle = '#c9d1d9';
          ctx.fillText('}', 48 + indent * 18, y);
        } else {
          const parts = [
            ['#ff7b72', kw[Math.floor(rand() * kw.length)] + ' '],
            ['#d2a8ff', ids[Math.floor(rand() * ids.length)]],
            ['#c9d1d9', rand() > 0.5 ? ' = ' : '('],
            ['#a5d6ff', rand() > 0.5 ? strs[Math.floor(rand() * strs.length)] : String(Math.floor(rand() * 999))],
            ['#c9d1d9', rand() > 0.6 ? ') {' : ';']
          ];
          parts.forEach(([c, t]) => {
            ctx.fillStyle = c;
            ctx.fillText(t, x, y);
            x += ctx.measureText(t).width;
          });
          if (parts[4][1] === ') {') indent = Math.min(4, indent + 1);
        }
      }
      ctx.fillStyle = 'rgba(56,139,253,0.12)';
      ctx.fillRect(38, 14 + 6 * lh - 13, w, lh);
    }

    function drawGameScreen(ctx, w, h, rand) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#1e1b4b');
      sky.addColorStop(0.6, '#6d28d9');
      sky.addColorStop(1, '#f472b6');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + rand() * 0.6})`;
        ctx.fillRect(rand() * w, rand() * h * 0.5, 2, 2);
      }
      // colinas lejanas
      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += w / 12) ctx.lineTo(x, h * 0.62 - rand() * h * 0.18);
      ctx.lineTo(w, h);
      ctx.fill();
      // suelo de tiles
      const tile = Math.max(14, Math.floor(h / 10));
      for (let x = 0; x < w; x += tile) {
        ctx.fillStyle = '#65a30d';
        ctx.fillRect(x, h - tile * 1.6, tile - 1, tile * 0.4);
        ctx.fillStyle = '#7c4a24';
        ctx.fillRect(x, h - tile * 1.2, tile - 1, tile * 1.2);
      }
      // plataformas flotantes + monedas
      for (let p = 0; p < Math.max(3, Math.floor(w / 140)); p++) {
        const px = 30 + rand() * (w - 120);
        const py = h * 0.35 + rand() * h * 0.3;
        const pw = tile * (3 + Math.floor(rand() * 3));
        ctx.fillStyle = '#a16207';
        ctx.fillRect(px, py, pw, tile * 0.6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px, py, pw, 3);
        for (let c = 0; c < 3; c++) {
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(px + tile * 0.8 + c * tile, py - tile * 0.6, tile * 0.22, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // personaje y enemigo
      const hx = w * 0.22, hy = h - tile * 1.6 - tile * 1.4;
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(hx, hy, tile * 0.9, tile * 1.4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(hx + tile * 0.5, hy + tile * 0.25, tile * 0.22, tile * 0.22);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(w * 0.62, h - tile * 1.6 - tile * 0.45, tile * 0.45, Math.PI, 0);
      ctx.fill();
      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, w, Math.max(22, h * 0.1));
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(12, Math.floor(h * 0.065))}px monospace`;
      ctx.fillText('PUNTOS 012450', 12, Math.max(16, h * 0.075));
      ctx.fillText('NIVEL 3-2', w * 0.45, Math.max(16, h * 0.075));
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('♥ ♥ ♥', w - 90, Math.max(16, h * 0.075));
    }

    function drawAppScreen(ctx, w, h, rand) {
      drawScreenFrame(ctx, w, h, 'App Studio · Panel', '#67e8f9');
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 26, 80, h - 26);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i === 1 ? '#06b6d4' : '#334155';
        ctx.fillRect(12, 44 + i * 26, 56, 10);
      }
      const cards = [['Usuarios', '18.4k', '#22d3ee'], ['Sesiones', '72%', '#a78bfa'], ['Crash-free', '99.9%', '#34d399']];
      cards.forEach((c, i) => {
        const x = 92 + i * 98;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, 40, 90, 60);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.fillText(c[0], x + 8, 58);
        ctx.fillStyle = c[2];
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(c[1], x + 8, 86);
      });
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(92, 112, 290, h - 126);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        const x = 104 + i * 22;
        const y = h - 30 - (Math.sin(i * 0.7) * 0.3 + 0.4 + rand() * 0.25) * (h - 170);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // mockup de móvil
      const px = w - 112, py = 38;
      ctx.fillStyle = '#020617';
      ctx.fillRect(px, py, 96, h - 52);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(px + 6, py + 10, 84, h - 72);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(px + 6, py + 10, 84, 28);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? '#cbd5e1' : '#94a3b8';
        ctx.fillRect(px + 12, py + 48 + i * 30, 72, 20);
      }
    }

    function drawTicketScreen(ctx, w, h, rand) {
      drawScreenFrame(ctx, w, h, 'Centro de Ayuda · Tickets', '#fcd34d');
      const titles = ['Error al iniciar sesión', 'Configurar entorno', 'Pago no reflejado', 'Guía de instalación', 'App se cierra', 'Exportar reporte', 'Acceso a API', 'Duda de facturación'];
      const states = [['Abierto', '#f59e0b'], ['En curso', '#06b6d4'], ['Resuelto', '#10b981']];
      ctx.font = '12px sans-serif';
      for (let i = 0; i < 9; i++) {
        const y = 36 + i * 31;
        ctx.fillStyle = i % 2 ? '#0f172a' : '#111c33';
        ctx.fillRect(8, y, w - 16, 27);
        ctx.fillStyle = '#64748b';
        ctx.fillText('#' + (1040 + i), 16, y + 18);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(titles[i % titles.length], 70, y + 18);
        const s = states[Math.floor(rand() * states.length)];
        ctx.fillStyle = s[1];
        ctx.fillRect(w - 110, y + 6, 84, 16);
        ctx.fillStyle = '#0b1120';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(s[0], w - 102, y + 18);
        ctx.font = '12px sans-serif';
      }
    }

    function drawKanbanScreen(ctx, w, h, rand) {
      drawScreenFrame(ctx, w, h, 'Sala de Producto · Roadmap', '#a5b4fc');
      const cols = ['Ideas', 'En curso', 'Revisión', 'Listo'];
      const colColors = ['#818cf8', '#22d3ee', '#f59e0b', '#34d399'];
      const cw = (w - 20) / cols.length;
      cols.forEach((c, i) => {
        const x = 10 + i * cw;
        ctx.fillStyle = '#111a2e';
        ctx.fillRect(x + 3, 34, cw - 6, h - 42);
        ctx.fillStyle = colColors[i];
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(c, x + 10, 52);
        const n = 2 + Math.floor(rand() * 3);
        for (let k = 0; k < n; k++) {
          const y = 62 + k * 52;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x + 9, y, cw - 18, 44);
          ctx.fillStyle = colColors[i];
          ctx.fillRect(x + 9, y, 4, 44);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(x + 20, y + 10, (cw - 40) * (0.5 + rand() * 0.5), 6);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(x + 20, y + 24, (cw - 40) * (0.3 + rand() * 0.4), 5);
        }
      });
    }

    function drawKpiScreen(ctx, w, h, rand) {
      drawScreenFrame(ctx, w, h, 'Dirección · Lanzamientos', '#7dd3fc');
      const kpis = [['Lanzamientos', '12'], ['Uptime', '99.7%'], ['Tickets', '-38%']];
      kpis.forEach((k, i) => {
        const x = 12 + i * ((w - 24) / 3);
        ctx.fillStyle = '#111c33';
        ctx.fillRect(x, 36, (w - 24) / 3 - 8, 64);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText(k[0], x + 10, 56);
        ctx.fillStyle = ['#38bdf8', '#34d399', '#fbbf24'][i];
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(k[1], x + 10, 90);
      });
      const bw = (w - 40) / 12;
      for (let i = 0; i < 12; i++) {
        const bh = 30 + rand() * (h - 160);
        ctx.fillStyle = i === 11 ? '#38bdf8' : '#1e3a5f';
        ctx.fillRect(20 + i * bw, h - 16 - bh, bw - 6, bh);
      }
    }

    function drawQaScreen(ctx, w, h, rand) {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);
      ctx.font = '13px monospace';
      const tests = ['auth.login', 'game.collision', 'app.render', 'api.tickets', 'build.android', 'build.web', 'perf.60fps', 'ui.responsive', 'db.migrate', 'help.search', 'pay.checkout', 'qa.smoke'];
      tests.forEach((t, i) => {
        ctx.fillStyle = '#34d399';
        ctx.fillText('✓', 12, 22 + i * 20);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(t, 30, 22 + i * 20);
        ctx.fillStyle = '#64748b';
        ctx.fillText(Math.floor(20 + rand() * 400) + 'ms', w - 80, 22 + i * 20);
      });
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('142 pasadas · 0 fallidas', 12, h - 30);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(12, h - 20, w - 24, 8);
      ctx.fillStyle = '#14b8a6';
      ctx.fillRect(12, h - 20, (w - 24) * 0.92, 8);
    }

    const SCREEN_DRAWERS = {
      code: [512, 512, drawCodeScreen],
      game: [512, 320, drawGameScreen],
      gameWide: [1024, 232, drawGameScreen],
      app: [512, 320, drawAppScreen],
      tickets: [512, 320, drawTicketScreen],
      kanban: [512, 320, drawKanbanScreen],
      kpi: [512, 320, drawKpiScreen],
      qa: [512, 320, drawQaScreen]
    };

    function getScreenMaterial(kind) {
      const spec = SCREEN_DRAWERS[kind] || SCREEN_DRAWERS.code;
      const base = makeOfficeTexture('screen_' + kind, spec[0], spec[1], spec[2], { color: true, clamp: kind !== 'code' });
      const makeScreenMat = (tex) => new THREE.MeshStandardMaterial({
        color: 0x111111,
        map: tex,
        emissive: 0xffffff,
        emissiveMap: tex,
        emissiveIntensity: 0.95,
        roughness: 0.18,
        metalness: 0.0
      });
      if (kind !== 'code') {
        // Pantallas estáticas: un único material compartido por tipo
        return cachedMat('screen_' + kind, () => makeScreenMat(base));
      }
      // Pantallas de código: cada una se desplaza con su propia velocidad
      const tex = officeTexUnique(base, 1, 0.6875);
      tex.offset.y = Math.random();
      animatedScreens.push({ tex, speed: 0.0006 + Math.random() * 0.0006 });
      return makeScreenMat(tex);
    }
