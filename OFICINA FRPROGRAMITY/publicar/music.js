    // _____________________________________________________________________
    // MÚSICA DE LA OFICINA: emisoras reales por internet (gran variedad de géneros)
    // y canales generativos que se crean en el propio navegador (funcionan sin conexión).
    // Baja el volumen sola mientras alguien habla.
    // _____________________________________________________________________
    const MUSIC_KEY = 'frp_music_v1';
    // Emisoras EN VIVO de salsa y de corridos / regional mexicano. Se buscan al abrir la oficina en
    // Radio Browser (directorio público y gratuito de radios por internet), así siempre son emisoras
    // que funcionan hoy. Solo se usan las que emiten por https.
    const MUSIC_STATIONS = [];
    const MUSIC_GENRES = {
      salsa: { label: '💃 Salsa', tags: ['salsa', 'salsa romantica', 'salsa brava', 'salsa dura'] },
      corridos: { label: '🎺 Corridos', tags: ['corridos', 'corridos tumbados', 'regional mexicano', 'musica mexicana', 'banda'] }
    };
    const RADIO_API = ['https://de1.api.radio-browser.info', 'https://nl1.api.radio-browser.info', 'https://at1.api.radio-browser.info', 'https://all.api.radio-browser.info'];
    const RADIO_STATE = { loading: false, loaded: false, error: '' };

    async function radioFetch(path) {
      let last = null;
      for (const base of RADIO_API) {
        try {
          const r = await fetch(base + path, { headers: { Accept: 'application/json' } });
          if (r.ok) return await r.json();
          last = new Error('HTTP ' + r.status);
        } catch (e) { last = e; }
      }
      throw last || new Error('sin conexión');
    }

    async function loadRadioStations() {
      if (RADIO_STATE.loading || RADIO_STATE.loaded) return;
      RADIO_STATE.loading = true;
      RADIO_STATE.error = '';
      if (typeof renderMusicPanel === 'function') renderMusicPanel();
      const clean = (v, n) => String(v == null ? '' : v).replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
      try {
        for (const [genre, g] of Object.entries(MUSIC_GENRES)) {
          const seen = new Set();
          for (const tag of g.tags) {
            let list = [];
            try { list = await radioFetch(`/json/stations/bytag/${encodeURIComponent(tag)}?order=clickcount&reverse=true&hidebroken=true&limit=40`); } catch (e) { continue; }
            (Array.isArray(list) ? list : []).forEach(x => {
              const url = String(x.url_resolved || x.url || '');
              const name = clean(x.name, 40);
              const key = name.toLowerCase();
              if (!/^https:\/\//i.test(url) || !name || seen.has(key) || Number(x.lastcheckok) === 0) return;
              if (MUSIC_STATIONS.filter(s => s.genreKey === genre).length >= 15) return;
              seen.add(key);
              MUSIC_STATIONS.push({
                id: genre + '_' + String(x.stationuuid || key).replace(/[^\w-]/g, '').slice(0, 40),
                name, genreKey: genre, genre: g.label.replace(/^\S+\s/, '') + (x.country ? ' · ' + clean(x.country, 20) : ''),
                tags: genre + ' ' + clean(x.tags, 120).replace(/,/g, ' '), url: url.slice(0, 400)
              });
            });
          }
        }
        RADIO_STATE.loaded = MUSIC_STATIONS.length > 0;
        if (!RADIO_STATE.loaded) RADIO_STATE.error = 'No encontré emisoras ahora mismo. Prueba más tarde.';
      } catch (e) {
        RADIO_STATE.error = 'No pude conectar con el directorio de radios. Revisa tu internet.';
      } finally {
        RADIO_STATE.loading = false;
        if (!MUSIC.station && MUSIC.savedStation && stationById(MUSIC.savedStation)) MUSIC.station = MUSIC.savedStation;
        if (MUSIC.station && !stationById(MUSIC.station)) MUSIC.station = null;
        if (typeof renderMusicPanel === 'function') renderMusicPanel();
      }
    }

    // Álbumes de Fuerza Regida en el reproductor OFICIAL de Apple Music (o Deezer).
    // Sin iniciar sesión se oyen fragmentos; con tu cuenta, los álbumes completos.
    const FR_ALBUMS = [
      { title: '111xpantia', year: 2025, deezer: '749564401' },
      { title: 'Pero No Te Enamores', year: 2024, apple: '1759045282' },
      { title: "Pa Las Baby's y Belikeada", year: 2023, apple: '1712362875' },
      { title: 'Sigan Hablando', year: 2022, apple: '1660156647' },
      { title: 'Pa Que Hablen', year: 2022 },
      { title: 'Del Barrio Hasta Aquí, Vol. 2', year: 2021, apple: '1602315092' },
      { title: 'Otro Pedo, Otro Mundo', year: 2020, apple: '1532854348' },
      { title: 'Adicto', year: 2020, apple: '1504221505' },
      { title: 'Del Barrio Hasta Aquí', year: 2019, apple: '1469645955' }
    ];
    function albumEmbed(al) {
      if (al.apple) return `https://embed.music.apple.com/us/album/${al.apple}`;
      if (al.deezer) return `https://widget.deezer.com/widget/dark/album/${al.deezer}`;
      return '';
    }
    function albumYouTube(al) {
      return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(`Fuerza Regida ${al.title} álbum completo`);
    }
    function openAlbum(i) {
      MUSIC.album = i;
      if (MUSIC.playing) musicStop(); // que no suenen la radio y el álbum a la vez
      renderMusicPanel();
    }

    const MUSIC = { station: null, playing: false, volume: 0.45, onlyWork: false, filter: 'todas', audio: null, ctx: null, gen: null, duck: false, error: '' };
    try {
      const s = JSON.parse(localStorage.getItem(MUSIC_KEY) || '{}') || {};
      if (typeof s.station === 'string') MUSIC.savedStation = s.station.slice(0, 60); // se recupera cuando carguen las emisoras
      if (Number.isFinite(s.volume)) MUSIC.volume = Math.max(0, Math.min(1, s.volume));
      MUSIC.onlyWork = false; // ya no hay horario de pausas
    } catch (e) { /* valores por defecto */ }

    function saveMusic() {
      try { localStorage.setItem(MUSIC_KEY, JSON.stringify({ station: MUSIC.station, volume: MUSIC.volume, onlyWork: MUSIC.onlyWork })); } catch (e) { /* sin persistencia */ }
    }

    function stationById(id) { return MUSIC_STATIONS.find(s => s.id === id) || null; }

    function effectiveVolume() { return MUSIC.volume * (MUSIC.duck ? 0.25 : 1); }

    function applyVolume() {
      if (MUSIC.audio) MUSIC.audio.volume = effectiveVolume();
      if (MUSIC.gen && MUSIC.ctx) MUSIC.gen.master.gain.setTargetAtTime(effectiveVolume() * 0.6, MUSIC.ctx.currentTime, 0.25);
    }

    function musicDuck(on) {
      if (MUSIC.duck === !!on) return;
      MUSIC.duck = !!on;
      applyVolume();
    }

    function stopAllAudio() {
      if (MUSIC.audio) { MUSIC.audio.pause(); MUSIC.audio.removeAttribute('src'); MUSIC.audio.load(); }
      if (MUSIC.gen) { MUSIC.gen.stop(); MUSIC.gen = null; }
    }

    function musicPlay(id) {
      const st = stationById(id || MUSIC.station) || MUSIC_STATIONS[0];
      if (!st) { loadRadioStations(); MUSIC.error = RADIO_STATE.loading ? 'Buscando emisoras…' : 'Aún no hay emisoras: espera un momento.'; renderMusicPanel(); return null; }
      stopAllAudio();
      MUSIC.station = st.id;
      MUSIC.error = '';
      MUSIC.playing = true;
      saveMusic();
      if (st.gen) {
        try {
          if (!MUSIC.ctx) MUSIC.ctx = new (window.AudioContext || window.webkitAudioContext)();
          if (MUSIC.ctx.state === 'suspended') MUSIC.ctx.resume();
          MUSIC.gen = createGenerative(MUSIC.ctx, st.gen);
          applyVolume();
        } catch (e) { MUSIC.playing = false; MUSIC.error = 'Tu navegador no permite audio generado.'; }
      } else {
        if (!MUSIC.audio) {
          MUSIC.audio = new Audio();
          MUSIC.audio.preload = 'none';
          MUSIC.audio.addEventListener('error', () => {
            if (!MUSIC.playing || !MUSIC.audio.getAttribute('src')) return;
            MUSIC.error = 'No se pudo conectar con la emisora. Prueba otra o un canal generativo.';
            MUSIC.playing = false;
            renderMusicPanel();
            updateMusicChip();
          });
        }
        MUSIC.audio.src = st.url;
        applyVolume();
        const pr = MUSIC.audio.play();
        if (pr && pr.catch) pr.catch(() => { MUSIC.playing = false; MUSIC.error = 'Pulsa ▶ para empezar (el navegador pide un clic).'; renderMusicPanel(); updateMusicChip(); });
      }
      renderMusicPanel();
      updateMusicChip();
      return st;
    }

    function musicStop() {
      stopAllAudio();
      MUSIC.playing = false;
      renderMusicPanel();
      updateMusicChip();
    }

    function musicToggle() {
      if (MUSIC.playing) musicStop(); else musicPlay(MUSIC.station);
    }

    function musicStep(dir) {
      const list = filteredStations();
      if (!list.length) return;
      const i = Math.max(0, list.findIndex(s => s.id === MUSIC.station));
      musicPlay(list[(i + dir + list.length) % list.length].id);
    }

    function musicPlayByQuery(q) {
      const words = String(q).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\W+/).filter(w => w.length > 2 && !['pon', 'ponme', 'musica', 'radio', 'reproduce', 'algo', 'una', 'para', 'por', 'favor', 'cancion', 'canciones', 'quiero', 'escuchar'].includes(w));
      const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      let best = null, score = 0;
      MUSIC_STATIONS.forEach(st => {
        const hay = norm(st.name + ' ' + st.genre + ' ' + st.tags);
        const sc = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
        if (sc > score) { score = sc; best = st; }
      });
      const pick = best || stationById(MUSIC.station) || MUSIC_STATIONS[0];
      return pick ? musicPlay(pick.id) : (loadRadioStations(), null);
    }

    function setMusicVolume(v) {
      MUSIC.volume = Math.max(0, Math.min(1, Number(v) || 0));
      applyVolume();
      saveMusic();
    }

    function setMusicFilter(f) {
      MUSIC.filter = f;
      renderMusicPanel();
    }

    function filteredStations() {
      if (MUSIC_GENRES[MUSIC.filter]) return MUSIC_STATIONS.filter(s => s.genreKey === MUSIC.filter);
      return MUSIC_STATIONS;
    }

    // Pausa automática fuera del horario de trabajo (si lo activas)
    let _musicPausedBySchedule = false;
    function musicScheduleTick() {
      if (!MUSIC.onlyWork || typeof currentScheduleBlock !== 'function') return;
      const working = currentScheduleBlock().kind === 'trabajo';
      if (!working && MUSIC.playing) { _musicPausedBySchedule = true; musicStop(); showToast('🎧 Música en pausa durante el descanso'); }
      else if (working && _musicPausedBySchedule) { _musicPausedBySchedule = false; musicPlay(MUSIC.station); }
    }
    setInterval(musicScheduleTick, 5000);

    function updateMusicChip() {
      const el = document.getElementById('dock-music-dot');
      if (el) el.classList.toggle('hidden', !MUSIC.playing);
    }

    function renderMusicPanel() {
      const box = document.getElementById('dock-panel-music');
      if (!box) return;
      if (!RADIO_STATE.loaded && !RADIO_STATE.loading && !RADIO_STATE.error) loadRadioStations();
      const st = stationById(MUSIC.station);
      const list = filteredStations();
      const tabs = [['todas', '📻 Todas'], ['salsa', MUSIC_GENRES.salsa.label], ['corridos', MUSIC_GENRES.corridos.label], ['fuerza', '🔥 Fuerza Regida']];
      let body;
      if (MUSIC.filter === 'fuerza') {
        const al = FR_ALBUMS[MUSIC.album] || null;
        const src = al ? albumEmbed(al) : '';
        body = `
          ${al ? `<div class="space-y-1">
            <div class="flex items-center justify-between text-[11px]"><b class="text-white truncate">${escapeHtml(al.title)} <span class="text-slate-400 font-normal">· ${al.year}</span></b>
              <a href="${albumYouTube(al)}" target="_blank" rel="noopener noreferrer" class="text-[10px] text-rose-300 hover:underline shrink-0">▶ En YouTube</a></div>
            ${src ? `<iframe src="${src}" title="${escapeHtml(al.title)}" allow="autoplay *; encrypted-media *; clipboard-write" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" style="width:100%;height:300px;border:0;border-radius:12px;overflow:hidden;background:transparent"></iframe>`
              : `<div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">Este álbum no tiene reproductor aquí: ábrelo en <a href="${albumYouTube(al)}" target="_blank" rel="noopener noreferrer" class="text-rose-300 underline">YouTube</a>.</div>`}
          </div>` : '<p class="text-[10px] text-slate-400">Elige un álbum para escucharlo.</p>'}
          <div class="music-list quick-scroll">
            ${FR_ALBUMS.map((a, i) => `
              <button onclick="openAlbum(${i})" class="music-row ${i === MUSIC.album ? 'on' : ''}">
                <span class="truncate">${i === MUSIC.album ? '▶ ' : ''}${escapeHtml(a.title)}</span>
                <span class="text-[9px] text-slate-500 shrink-0">${a.year}</span>
              </button>`).join('')}
          </div>
          <p class="text-[9px] text-slate-500">Reproductor oficial de Apple Music / Deezer: sin iniciar sesión suenan fragmentos; con tu cuenta, los álbumes completos.</p>`;
      } else {
        const status = RADIO_STATE.loading ? '⏳ Buscando emisoras de salsa y corridos…' : RADIO_STATE.error ? escapeHtml(RADIO_STATE.error) : '';
        body = `
          <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
            <div class="eq ${MUSIC.playing ? 'on' : ''}"><i></i><i></i><i></i><i></i></div>
            <div class="min-w-0 flex-1">
              <div class="text-[11px] font-bold text-white truncate">${st ? escapeHtml(st.name) : 'Elige una emisora'}</div>
              <div class="text-[10px] ${MUSIC.error ? 'text-rose-300' : 'text-slate-400'} truncate">${MUSIC.error ? escapeHtml(MUSIC.error) : st ? escapeHtml(st.genre) + ' · en vivo' : ''}</div>
            </div>
            <button class="icon-btn" onclick="musicStep(-1)" title="Anterior">⏮</button>
            <button class="play-btn" onclick="musicToggle()" title="${MUSIC.playing ? 'Pausar' : 'Reproducir'}">${MUSIC.playing ? '⏸' : '▶'}</button>
            <button class="icon-btn" onclick="musicStep(1)" title="Siguiente">⏭</button>
          </div>
          <div class="flex items-center gap-2 text-[10px] text-slate-400">
            🔈<input type="range" min="0" max="1" step="0.01" value="${MUSIC.volume}" oninput="setMusicVolume(this.value)" class="flex-1 accent-cyan-400">🔊
          </div>
          ${status ? `<p class="text-[10px] ${RADIO_STATE.error ? 'text-rose-300' : 'text-slate-400'}">${status} ${RADIO_STATE.error ? '<button onclick="RADIO_STATE.error=\'\'; loadRadioStations()" class="underline">Reintentar</button>' : ''}</p>` : ''}
          <div class="music-list quick-scroll">
            ${list.map(s => `
              <button onclick="musicPlay('${s.id}')" class="music-row ${s.id === MUSIC.station ? 'on' : ''}">
                <span class="truncate">${s.id === MUSIC.station && MUSIC.playing ? '▶ ' : ''}${escapeHtml(s.name)}</span>
                <span class="text-[9px] text-slate-500 shrink-0">${escapeHtml(s.genre)}</span>
              </button>`).join('')}
          </div>
          <p class="text-[9px] text-slate-500">Emisoras en vivo del directorio público Radio Browser.</p>`;
      }
      box.innerHTML = `
        <div class="panel-head"><span>🎧 Música</span><button class="icon-btn" onclick="closeDockPanel()">✕</button></div>
        <div class="p-2.5 space-y-2">
          <div class="flex gap-1 flex-wrap">${tabs.map(([k, l]) => `<button onclick="setMusicFilter('${k}')" class="seg ${MUSIC.filter === k ? 'on' : ''}">${l}</button>`).join('')}</div>
          ${body}
        </div>`;
    }

    // _____________________________________________________________________
    // Música generativa con Web Audio (acordes, melodía y ritmo suaves en bucle)
    // _____________________________________________________________________
    function createGenerative(ctx, style) {
      const master = ctx.createGain();
      master.gain.value = 0;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
      // reverberación sencilla con eco
      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = style === 'synth' ? 0.33 : 0.42;
      const fb = ctx.createGain();
      fb.gain.value = 0.32;
      const wet = ctx.createGain();
      wet.gain.value = style === 'ambient' ? 0.5 : 0.25;
      delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
      const bus = ctx.createGain();
      bus.connect(master); bus.connect(delay);

      const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

      const PROG = {
        lofi: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]],
        ambient: [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]],
        piano: [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]],
        synth: [[45, 52, 57, 60], [41, 48, 53, 57], [48, 55, 60, 64], [43, 50, 55, 59]],
        rain: [[50, 57, 62, 65], [46, 53, 58, 62]]
      }[style] || [[57, 60, 64, 67]];
      const bpm = { lofi: 76, ambient: 50, piano: 66, synth: 98, rain: 54 }[style] || 70;
      const beat = 60 / bpm;
      const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
      const nodes = new Set();

      function tone(midi, t, dur, type, vol, cutoff = 2400, attack = 0.02) {
        const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = type; o.frequency.value = hz(midi);
        f.type = 'lowpass'; f.frequency.value = cutoff;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(f); f.connect(g); g.connect(bus);
        o.start(t); o.stop(t + dur + 0.05);
        nodes.add(o); o.onended = () => nodes.delete(o);
      }
      function noiseHit(t, dur, vol, freq, type = 'highpass') {
        const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        s.buffer = noiseBuf; f.type = type; f.frequency.value = freq;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(f); f.connect(g); g.connect(master);
        s.start(t, Math.random()); s.stop(t + dur + 0.02);
        nodes.add(s); s.onended = () => nodes.delete(s);
      }
      function kick(t, vol) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.32);
        nodes.add(o); o.onended = () => nodes.delete(o);
      }

      // lluvia continua (solo en el canal de lluvia, y suave en lo-fi)
      let rain = null;
      if (style === 'rain' || style === 'lofi') {
        rain = ctx.createBufferSource();
        rain.buffer = noiseBuf; rain.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = style === 'rain' ? 1400 : 3500; f.Q.value = 0.6;
        const g = ctx.createGain(); g.gain.value = style === 'rain' ? 0.22 : 0.025;
        rain.connect(f); f.connect(g); g.connect(master);
        rain.start();
      }

      let bar = 0, nextTime = ctx.currentTime + 0.15, stopped = false;
      const scale = [0, 2, 3, 5, 7, 9, 10];
      function scheduleBar(t) {
        const chord = PROG[bar % PROG.length];
        const len = beat * 4;
        if (style === 'ambient' || style === 'rain') {
          chord.forEach((m, i) => tone(m, t + i * 0.12, len * 1.6, 'sine', 0.05, 1200, 1.2));
          if (Math.random() < 0.6) tone(chord[3] + 12 + randPick([0, 2, 5]), t + beat * 2, beat * 3, 'triangle', 0.03, 2000, 0.4);
        } else if (style === 'piano') {
          tone(chord[0] - 12, t, len, 'triangle', 0.08, 1500, 0.01);
          for (let i = 0; i < 8; i++) if (Math.random() < 0.75) tone(chord[i % 4] + (i > 3 ? 12 : 0), t + i * beat / 2, beat * 1.6, 'triangle', 0.05, 2600, 0.005);
        } else if (style === 'synth') {
          chord.forEach(m => { tone(m, t, len, 'sawtooth', 0.018, 1100, 0.3); tone(m + 0.08, t, len, 'sawtooth', 0.014, 1100, 0.3); });
          for (let i = 0; i < 8; i++) tone(chord[0] - 12 + (i % 2 ? 12 : 0), t + i * beat / 2, beat / 2.2, 'square', 0.03, 700, 0.005);
          for (let i = 0; i < 4; i++) { kick(t + i * beat, 0.35); noiseHit(t + i * beat + beat / 2, 0.06, 0.05, 7000); }
          if (bar % 2) noiseHit(t + beat * 1, 0.2, 0.12, 1800, 'bandpass'), noiseHit(t + beat * 3, 0.2, 0.12, 1800, 'bandpass');
        } else { // lofi
          chord.forEach((m, i) => tone(m, t + i * 0.03, len * 0.95, 'triangle', 0.035, 1300, 0.04));
          tone(chord[0] - 12, t, beat * 1.5, 'sine', 0.12, 600, 0.01);
          tone(chord[0] - 12, t + beat * 2.5, beat, 'sine', 0.09, 600, 0.01);
          kick(t, 0.32); kick(t + beat * 2.5, 0.22);
          for (let i = 0; i < 8; i++) noiseHit(t + i * beat / 2 + (i % 2 ? 0.03 : 0), 0.04, i % 2 ? 0.02 : 0.035, 8000);
          noiseHit(t + beat, 0.16, 0.08, 1500, 'bandpass'); noiseHit(t + beat * 3, 0.16, 0.08, 1500, 'bandpass');
          const root = chord[0] + 12;
          for (let i = 0; i < 4; i++) if (Math.random() < 0.55) tone(root + scale[Math.floor(Math.random() * scale.length)], t + i * beat + (Math.random() < 0.3 ? beat / 2 : 0), beat * 0.9, 'sine', 0.045, 2200, 0.01);
        }
        bar++;
        return len;
      }
      const timer = setInterval(() => {
        if (stopped) return;
        while (nextTime < ctx.currentTime + 1.2) nextTime += scheduleBar(nextTime);
      }, 250);

      return {
        master,
        stop() {
          stopped = true;
          clearInterval(timer);
          const t = ctx.currentTime;
          master.gain.cancelScheduledValues(t);
          master.gain.setTargetAtTime(0, t, 0.15);
          setTimeout(() => {
            nodes.forEach(n => { try { n.stop(); } catch (e) { /* ya parado */ } });
            if (rain) try { rain.stop(); } catch (e) { /* ya parado */ }
            master.disconnect();
          }, 600);
        }
      };
    }

    // Busca las emisoras al abrir la oficina (en segundo plano)
    setTimeout(() => { try { loadRadioStations(); } catch (e) { /* sin red */ } }, 4000);
