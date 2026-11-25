    // _____________________________________________________________________
    // VOZ: los empleados, clientes y el asistente hablan (síntesis de voz del navegador)
    // y tú hablas con el micrófono (reconocimiento de voz). Incluye la "sala de llamada"
    // que usan las reuniones, las llamadas con clientes y el asistente.
    // _____________________________________________________________________
    const VOICE_KEY = 'frp_voice_v1';
    const VOICE = { enabled: true, voices: [], rec: null, listening: false, speakingId: null };

    try { VOICE.enabled = localStorage.getItem(VOICE_KEY) !== 'off'; } catch (e) { /* por defecto activada */ }

    // ¿El navegador puede hablar? (algunos no traen síntesis de voz)
    function hasTTS() {
      return typeof window.speechSynthesis !== 'undefined' && !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== 'undefined';
    }

    function loadVoices() {
      if (!(hasTTS())) return;
      const all = speechSynthesis.getVoices();
      const es = all.filter(v => /^es/i.test(v.lang));
      VOICE.voices = es.length ? es : all;
    }
    if (hasTTS()) {
      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    function setVoiceEnabled(on) {
      VOICE.enabled = !!on;
      try { localStorage.setItem(VOICE_KEY, on ? 'on' : 'off'); } catch (e) { /* sin persistencia */ }
      if (!on && hasTTS()) speechSynthesis.cancel();
      renderVoiceRoom();
    }

    // Voz estable por persona: misma voz y tono cada vez que habla
    function voiceProfile(id, name) {
      const h = officeHash(String(id || name || 'x'));
      const first = String(name || '').split(' ')[0].toLowerCase();
      const high = /a$/.test(first) || /lucía|inés|abril|noa|isabel|carmen|sofía/.test(first);
      const list = VOICE.voices;
      return {
        voice: list.length ? list[h % list.length] : null,
        pitch: (high ? 1.12 : 0.88) + ((h >> 3) % 10) / 100,
        rate: 1.0 + ((h >> 5) % 8) / 100
      };
    }

    function speak(text, who = {}) {
      return new Promise(resolve => {
        if (!VOICE.enabled || !(hasTTS()) || !text) { setTimeout(resolve, Math.min(4000, 400 + String(text).length * 35)); return; }
        const u = new SpeechSynthesisUtterance(String(text).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').slice(0, 400));
        const prof = voiceProfile(who.id, who.name);
        if (prof.voice) u.voice = prof.voice;
        u.lang = (prof.voice && prof.voice.lang) || 'es-ES';
        u.pitch = prof.pitch;
        u.rate = prof.rate;
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          VOICE.speakingId = null;
          if (typeof musicDuck === 'function') musicDuck(false);
          renderVoiceRoomParticipants();
          resolve();
        };
        u.onstart = () => {
          VOICE.speakingId = who.id || null;
          if (typeof musicDuck === 'function') musicDuck(true);
          renderVoiceRoomParticipants();
        };
        u.onend = finish;
        u.onerror = finish;
        setTimeout(finish, 15000 + String(text).length * 80); // seguro por si el navegador no avisa
        try { speechSynthesis.speak(u); } catch (e) { finish(); }
      });
    }

    // ---- MICRÓFONO ----
    // 1) Dictado del navegador (Chrome / Edge). 2) Si no existe o falla (Brave, Opera, Firefox…)
    //    y hay clave de Gemini: se graba el audio y Gemini lo transcribe.
    const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition;

    function canRecordAudio() {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
    }
    function geminiCanTranscribe() {
      return typeof AI !== 'undefined' && !!AI.geminiKey && canRecordAudio();
    }
    function canListen() {
      return !!SR() || geminiCanTranscribe();
    }

    // Actualiza los botones de micrófono sin redibujar (no se pierde lo que estás escribiendo)
    function syncMicButtons() {
      if (!document.querySelectorAll) return;
      document.querySelectorAll('.mic-btn').forEach(b => {
        b.classList.toggle('on', VOICE.listening);
        b.textContent = VOICE.listening ? '■' : '🎙️';
      });
      const inp = document.getElementById('vr-input');
      if (inp) inp.placeholder = VOICE.listening ? 'Te escucho… (pulsa ■ al terminar)' : 'Escribe o pulsa el micrófono';
    }

    function setListening(on) {
      VOICE.listening = on;
      if (typeof musicDuck === 'function') musicDuck(on);
      syncMicButtons();
    }

    function stopListening() {
      if (VOICE.rec) { try { VOICE.rec.stop(); } catch (e) { /* ya parado */ } }
      if (VOICE.recorder) { try { VOICE.recorder.stop(); } catch (e) { /* ya parado */ } }
    }

    function micHelpText(kind) {
      const fileUrl = location.protocol === 'file:';
      if (kind === 'denied') return '🎙️ El micrófono está bloqueado. Pulsa el candado 🔒 junto a la dirección → Micrófono → Permitir, y recarga.' +
        (fileUrl ? ' (Abriste la oficina como archivo: el navegador suele bloquear el micro así; ábrela desde tu web de Netlify o un servidor local.)' : '');
      if (kind === 'nomic') return '🎙️ No se detecta ningún micrófono. Conéctalo o revisa en Windows: Configuración → Privacidad → Micrófono.';
      if (kind === 'insecure') return '🎙️ El micrófono solo funciona en https o en localhost. Abre la oficina desde tu web (Netlify).';
      if (kind === 'network') return '🎙️ El dictado de este navegador no conecta (pasa en Brave, Opera o sin internet). Usa Chrome o Edge' +
        (canRecordAudio() ? ', o añade una clave gratis de Gemini en ⚙ del asistente y te entenderé igual.' : '.');
      if (kind === 'unsupported') return '🎙️ Este navegador no tiene dictado por voz. Usa Chrome o Edge, o añade una clave gratis de Gemini en ⚙ del asistente.';
      return '🎙️ No se pudo usar el micrófono.';
    }

    // Pide permiso de micrófono una vez (así aparece el aviso del navegador y detectamos fallos claros)
    async function ensureMicPermission() {
      if (VOICE.micOk) return 'ok';
      if (!window.isSecureContext && location.protocol !== 'file:') return 'insecure';
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return 'ok'; // que lo intente el dictado
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach(t => t.stop());
        VOICE.micOk = true;
        return 'ok';
      } catch (e) {
        if (e && (e.name === 'NotFoundError' || e.name === 'OverconstrainedError')) return 'nomic';
        if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) return 'denied';
        if (e && e.name === 'NotReadableError') return 'busy';
        return 'ok';
      }
    }

    // Escucha una frase y la entrega ya transcrita
    function startListening(onFinal, onInterim) {
      if (VOICE.listening || VOICE.starting) { stopListening(); return false; }
      if (!canListen()) { showToast(micHelpText('unsupported')); return false; }
      if (hasTTS()) speechSynthesis.cancel();
      VOICE.starting = true;
      ensureMicPermission().then(state => {
        VOICE.starting = false;
        if (state === 'busy') { showToast('🎙️ Otro programa está usando el micrófono. Ciérralo e inténtalo de nuevo.'); return; }
        if (state !== 'ok') { showToast(micHelpText(state)); return; }
        if (SR() && !VOICE.useGemini) startBrowserDictation(onFinal, onInterim);
        else if (geminiCanTranscribe()) startGeminiDictation(onFinal, onInterim);
        else showToast(micHelpText('unsupported'));
      });
      return true;
    }

    function startBrowserDictation(onFinal, onInterim) {
      const rec = new (SR())();
      rec.lang = 'es-ES';
      rec.interimResults = true;
      rec.continuous = true; // no se corta a la primera pausa
      rec.maxAlternatives = 1;
      let finalText = '', lastText = '', silence = null, failed = '';
      const hardStop = setTimeout(() => { try { rec.stop(); } catch (e) { /* */ } }, 30000);
      rec.onresult = (ev) => {
        let interim = '';
        finalText = '';
        for (let i = 0; i < ev.results.length; i++) {
          const r = ev.results[i];
          if (r.isFinal) finalText += r[0].transcript + ' ';
          else interim += r[0].transcript;
        }
        lastText = (finalText + interim).trim();
        if (onInterim) onInterim(lastText);
        // tras una pausa de ~1,6 s con algo dicho, se envía solo
        clearTimeout(silence);
        silence = setTimeout(() => { try { rec.stop(); } catch (e) { /* */ } }, 1600);
      };
      rec.onerror = (ev) => {
        failed = ev.error;
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { VOICE.micOk = false; showToast(micHelpText('denied')); }
        else if (ev.error === 'no-speech') showToast('🎙️ No te escuché. Pulsa el micro y habla un poco más alto o más cerca.');
        else if (ev.error === 'audio-capture') showToast(micHelpText('nomic'));
        else if (ev.error === 'network') {
          if (geminiCanTranscribe()) { VOICE.useGemini = true; showToast('🎙️ El dictado del navegador no conecta: ahora te entiendo con Gemini. Pulsa el micro y habla.'); }
          else showToast(micHelpText('network'));
        } else if (ev.error === 'language-not-supported') showToast('🎙️ Este navegador no reconoce español por voz. Usa Chrome o Edge.');
        else if (ev.error !== 'aborted') showToast('🎙️ El micrófono falló (' + ev.error + '). Inténtalo de nuevo.');
      };
      rec.onend = () => {
        clearTimeout(silence);
        clearTimeout(hardStop);
        VOICE.rec = null;
        setListening(false);
        if (typeof renderVoiceRoom === 'function') renderVoiceRoom();
        const t = (finalText.trim() || (failed ? '' : lastText)).trim();
        if (t && onFinal) onFinal(t);
      };
      VOICE.rec = rec;
      setListening(true);
      try { rec.start(); } catch (e) { VOICE.rec = null; setListening(false); showToast('🎙️ No se pudo iniciar el dictado. Inténtalo de nuevo.'); }
    }

    // Graba hasta que dejas de hablar (o pulsas ■) y Gemini lo transcribe
    async function startGeminiDictation(onFinal, onInterim) {
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch (e) { showToast(micHelpText(e && e.name === 'NotFoundError' ? 'nomic' : 'denied')); return; }
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find(m => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || '';
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      let ctx = null, raf = 0, spoke = false, quietSince = 0;
      const started = Date.now();
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const an = ctx.createAnalyser();
        an.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(an);
        const buf = new Uint8Array(an.fftSize);
        const tick = () => {
          if (recorder.state !== 'recording') return;
          an.getByteTimeDomainData(buf);
          let peak = 0;
          for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i] - 128));
          const now = Date.now();
          if (peak > 14) { spoke = true; quietSince = 0; } else if (!quietSince) quietSince = now;
          if ((spoke && quietSince && now - quietSince > 1600) || now - started > 25000 || (!spoke && now - started > 8000)) { try { recorder.stop(); } catch (e) { /* */ } return; }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (e) { setTimeout(() => { try { recorder.stop(); } catch (er) { /* */ } }, 10000); }
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      recorder.onstop = async () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach(t => t.stop());
        if (ctx) ctx.close().catch(() => {});
        VOICE.recorder = null;
        setListening(false);
        if (!chunks.length || !spoke) { if (!spoke) showToast('🎙️ No te escuché. Inténtalo de nuevo.'); return; }
        if (onInterim) onInterim('✍️ Entendiendo lo que dijiste…');
        try {
          const text = await geminiTranscribe(new Blob(chunks, { type: recorder.mimeType || mime || 'audio/webm' }));
          if (onInterim) onInterim('');
          if (text && onFinal) onFinal(text);
          else showToast('🎙️ No te escuché. Inténtalo de nuevo.');
        } catch (e) {
          if (onInterim) onInterim('');
          showToast('⚠️ ' + (typeof aiErrorMessage === 'function' ? aiErrorMessage(e) : 'No se pudo transcribir el audio.'));
        }
      };
      VOICE.recorder = recorder;
      recorder.start();
      setListening(true);
      if (onInterim) onInterim('Te escucho…');
    }

    async function geminiTranscribe(blob) {
      const b64 = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result).split(',')[1] || '');
        fr.onerror = rej;
        fr.readAsDataURL(blob);
      });
      const j = await geminiCall({
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: blob.type.split(';')[0] || 'audio/webm', data: b64 } },
          { text: 'Transcribe exactamente lo que dice esta persona, en español. Devuelve solo el texto dicho, sin comillas ni comentarios. Si no se oye nada, devuelve un texto vacío.' }
        ] }],
        generationConfig: { temperature: 0, maxOutputTokens: 400 }
      });
      const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
      return parts.filter(p => !p.thought).map(p => p.text || '').join('').trim().replace(/^["“]|["”]$/g, '');
    }

    // _____________________________________________________________________
    // SALA DE LLAMADA (reuniones, clientes, asistente)
    // _____________________________________________________________________
    const ROOM = { open: false, kind: '', title: '', subtitle: '', participants: [], transcript: [], busy: false, onSay: null, onClose: null, startedAt: 0, timer: null, interim: '', actions: '' };

    function initials(name) {
      return String(name || '?').replace(/ IA$/, '').split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
    }

    function openVoiceRoom(opts) {
      if (ROOM.open) closeVoiceRoom(true);
      Object.assign(ROOM, {
        open: true, kind: opts.kind || 'call', title: opts.title || 'Llamada', subtitle: opts.subtitle || '',
        participants: opts.participants || [], transcript: [], busy: false, onSay: opts.onUserSay || null,
        onClose: opts.onClose || null, startedAt: Date.now(), interim: '', actions: opts.actions || '', lastAsk: null, pending: []
      });
      const el = document.getElementById('voice-room');
      el.classList.remove('hidden');
      renderVoiceRoom();
      clearInterval(ROOM.timer);
      ROOM.timer = setInterval(() => {
        const t = document.getElementById('vr-time');
        if (!t || !ROOM.open) return;
        const s = Math.floor((Date.now() - ROOM.startedAt) / 1000);
        t.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      }, 1000);
      if (opts.greeting && opts.greeting.length) roomSpeakAll(opts.greeting);
    }

    function closeVoiceRoom(silent = false) {
      if (!ROOM.open) return;
      ROOM.open = false;
      clearInterval(ROOM.timer);
      stopListening();
      if (hasTTS()) speechSynthesis.cancel();
      document.getElementById('voice-room').classList.add('hidden');
      const cb = ROOM.onClose;
      ROOM.onClose = null;
      if (cb && !silent) cb(ROOM.transcript.slice());
      else if (cb) cb(ROOM.transcript.slice(), true);
    }

    function roomParticipant(nameOrId) {
      const key = String(nameOrId || '').toLowerCase();
      return ROOM.participants.find(p => p.id === nameOrId) ||
        ROOM.participants.find(p => p.name.toLowerCase() === key) ||
        ROOM.participants.find(p => key && p.name.toLowerCase().startsWith(key.split(' ')[0])) || null;
    }

    function roomAdd(who, text) {
      ROOM.transcript.push({ who: who ? who.name : 'Tú', id: who ? who.id : 'me', color: who ? who.color : null, text });
      if (ROOM.transcript.length > 60) ROOM.transcript.shift();
      renderVoiceRoomTranscript();
    }

    // Habla cada respuesta en orden: texto en la sala, burbuja en 3D y voz.
    // Las intervenciones se encadenan para que nunca se pisen dos voces.
    let _roomSpeech = Promise.resolve();
    let _roomSpeechGen = 0;
    function roomSpeakAll(replies) {
      const session = ROOM.startedAt, gen = _roomSpeechGen;
      _roomSpeech = _roomSpeech.then(() => speakReplies(replies, session, gen)).catch(() => {});
      return _roomSpeech;
    }

    // El Director toma la palabra: se calla quien hable y se descartan las frases pendientes
    function roomInterrupt() {
      _roomSpeechGen++;
      if (hasTTS()) { try { speechSynthesis.cancel(); } catch (e) { /* nada que cortar */ } }
    }

    async function speakReplies(replies, session, gen) {
      for (const r of replies) {
        // mientras el Director habla por el micrófono, el equipo espera su turno
        while (VOICE.listening && ROOM.open && ROOM.startedAt === session) await new Promise(res => setTimeout(res, 200));
        if (!ROOM.open || ROOM.startedAt !== session || gen !== _roomSpeechGen) return;
        const who = roomParticipant(r.id || r.name) || ROOM.participants[0];
        if (!who || !r.text) continue;
        roomAdd(who, r.text);
        const ag = who.agentId && AGENTS.find(a => a.id === who.agentId);
        if (ag) ag.bubble = '💬 ' + (r.text.length > 34 ? r.text.slice(0, 34) + '…' : r.text);
        await speak(r.text, who);
      }
    }

    // Promesa con límite de tiempo: nunca dejamos la sala bloqueada esperando a la IA
    function withTimeout(promise, ms) {
      let t;
      return Promise.race([
        promise,
        new Promise((_, rej) => { t = setTimeout(() => rej(Object.assign(new Error('La IA tardó demasiado.'), { timeout: true })), ms); })
      ]).finally(() => clearTimeout(t));
    }

    // Lo que dices mientras el equipo piensa no se pierde: se responde a continuación
    async function roomUserSays(text) {
      text = String(text || '').trim().slice(0, 500);
      if (!text || !ROOM.open) return;
      roomInterrupt();
      ROOM.interim = '';
      roomAdd(null, text);
      if (!ROOM.onSay) return;
      if (ROOM.busy) { (ROOM.pending = ROOM.pending || []).push(text); return; }
      const session = ROOM.startedAt;
      ROOM.busy = true;
      renderVoiceRoom();
      while (text) {
        let replies = [];
        try { replies = await withTimeout(Promise.resolve(ROOM.onSay(text, ROOM.transcript.slice())), 45000); } catch (e) { console.warn(e); replies = []; }
        if (!ROOM.open || ROOM.startedAt !== session) return;
        const more = ROOM.pending && ROOM.pending.length ? ROOM.pending.splice(0).join('. ') : '';
        // si dijiste algo más mientras pensaban, se contesta a lo último (sin responder a destiempo)
        if (!more && replies && replies.length) roomSpeakAll(replies);
        text = more;
      }
      ROOM.busy = false;
      renderVoiceRoom();
    }

    function roomMic() {
      if (!VOICE.listening) roomInterrupt();
      startListening(t => roomUserSays(t), t => {
        ROOM.interim = t;
        const el = document.getElementById('vr-interim');
        if (el) el.textContent = t ? '🎙️ ' + t : '';
      });
    }

    function roomSubmit(e) {
      e.preventDefault();
      const inp = document.getElementById('vr-input');
      const v = inp.value;
      inp.value = '';
      roomUserSays(v);
    }

    function renderVoiceRoomParticipants() {
      const box = document.getElementById('vr-people');
      if (!box || !ROOM.open) return;
      box.innerHTML = ROOM.participants.slice(0, 16).map(p => {
        const talking = VOICE.speakingId === p.id;
        return `<div class="vr-person ${talking ? 'talking' : ''}" title="${escapeHtml(p.name)}${p.role ? ' · ' + escapeHtml(p.role) : ''}">
          <span class="vr-avatar" style="background:${p.color || '#334155'}">${escapeHtml(initials(p.name))}</span>
          <span class="vr-name">${escapeHtml(p.name.replace(/ IA$/, ''))}</span>
        </div>`;
      }).join('');
    }

    function renderVoiceRoomTranscript() {
      const box = document.getElementById('vr-log');
      if (!box) return;
      box.innerHTML = ROOM.transcript.length ? ROOM.transcript.map(t => `
        <div class="vr-line ${t.id === 'me' ? 'me' : ''}">
          <b style="${t.color ? `color:${t.color}` : ''}">${escapeHtml(t.who)}</b> ${escapeHtml(t.text)}
        </div>`).join('') : `<div class="text-[11px] text-slate-500 text-center py-3">${canListen() ? 'Pulsa 🎙️ y habla, o escribe abajo.' : 'Escribe tu mensaje abajo.'}</div>`;
      box.scrollTop = box.scrollHeight;
    }

    function renderVoiceRoom() {
      const el = document.getElementById('voice-room');
      if (!el || !ROOM.open) return;
      const icon = ROOM.kind === 'meeting' ? '📊' : ROOM.kind === 'client' ? '📞' : ROOM.kind === 'motivation' ? '🔥' : '🤖';
      // conserva lo que estabas escribiendo y el foco al redibujar la sala
      const prevInput = document.getElementById('vr-input');
      const draft = prevInput ? prevInput.value : '';
      const hadFocus = !!prevInput && document.activeElement === prevInput;
      el.innerHTML = `
        <div class="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-800">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 text-xs font-bold text-white truncate"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>${icon} ${escapeHtml(ROOM.title)}</div>
            <div class="text-[10px] text-slate-400 truncate">${escapeHtml(ROOM.subtitle)} · <span id="vr-time" class="font-mono">00:00</span></div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button onclick="setVoiceEnabled(!VOICE.enabled)" title="${VOICE.enabled ? 'Silenciar voces' : 'Activar voces'}" class="icon-btn">${VOICE.enabled ? '🔊' : '🔇'}</button>
            <button onclick="closeVoiceRoom()" class="px-2 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-bold">Colgar</button>
          </div>
        </div>
        <div id="vr-people" class="flex gap-2 px-3 pt-2 overflow-x-auto quick-scroll"></div>
        <div id="vr-log" class="vr-log"></div>
        <div id="vr-interim" class="px-3 text-[10px] text-cyan-300 h-3.5 truncate">${ROOM.busy ? '✍️ Pensando la respuesta…' : ''}</div>
        ${ROOM.actions ? `<div class="px-3 pb-1 flex flex-wrap gap-1">${ROOM.actions}</div>` : ''}
        <form onsubmit="roomSubmit(event)" class="flex items-center gap-1.5 p-2 border-t border-slate-800">
          <button type="button" onclick="roomMic()" title="Hablar" class="mic-btn ${VOICE.listening ? 'on' : ''}">${VOICE.listening ? '■' : '🎙️'}</button>
          <input id="vr-input" maxlength="500" autocomplete="off" placeholder="${VOICE.listening ? 'Te escucho…' : 'Escribe o pulsa el micrófono'}" class="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400" />
          <button type="submit" class="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-semibold text-xs">➤</button>
        </form>`;
      const inp = document.getElementById('vr-input');
      if (inp && draft) inp.value = draft;
      if (inp && hadFocus) inp.focus();
      renderVoiceRoomParticipants();
      renderVoiceRoomTranscript();
    }

    // _____________________________________________________________________
    // REUNIONES CON VOZ: al convocar, se abre la llamada con los asistentes
    // _____________________________________________________________________
    function agentParticipant(a) {
      return { id: a.id, agentId: a.id, name: a.name, role: a.role, color: '#' + new THREE.Color(a.color).getHexString() };
    }

    const _baseConvokeMeeting = convokeMeeting;
    convokeMeeting = function (zoneId) {
      // el Director puede convocar aunque sea hora de descanso: quien está en pausa del horario acude
      const office = (ZONES[zoneId] && ZONES[zoneId].office) || 'main';
      if (!MEETING.active) AGENTS.forEach(a => {
        if (a._schedBreak && a.status === 'break' && !a.leaving && officeOf(a) === office) { a._schedBreak = false; a.status = 'working'; a.breakMinUntil = 0; }
      });
      _baseConvokeMeeting(zoneId);
      if (!MEETING.active || MEETING.active.zone !== zoneId) return;
      MEETING.active.endsAt = performance.now() + 30 * 60000; // la reunión dura lo que dure la llamada
      const people = MEETING.active.attendees.map(id => AGENTS.find(a => a.id === id)).filter(Boolean);
      const lead = people.slice().sort((a, b) => (b.rankIdx || 0) - (a.rankIdx || 0))[0];
      openVoiceRoom({
        kind: 'meeting',
        title: 'Reunión · ' + ZONES[zoneId].name.replace(/^\S+\s/, ''),
        subtitle: people.length + ' asistentes',
        participants: people.map(agentParticipant),
        greeting: lead ? [{ id: lead.id, text: `Buenas, ${COMPANY.independent ? COMPANY.owner : 'Director'}. Estamos todos. ¿De qué quieres que hablemos?` }] : [],
        onUserSay: meetingReplies,
        onClose: () => { if (MEETING.active) endMeeting(); }
      });
      if (typeof setCameraPreset === 'function' && !DIR3D.active) desiredCameraTarget.set(ZONES[zoneId].x, 1, ZONES[zoneId].z);
    };

    const _baseEndMeeting = endMeeting;
    endMeeting = function () {
      const wasMeeting = !!MEETING.active;
      _baseEndMeeting();
      if (wasMeeting && ROOM.open && ROOM.kind === 'meeting') closeVoiceRoom(true);
    };

    function officeSnapshot() {
      const mine = PROJECTS.filter(p => p.officeId === ACTIVE_OFFICE);
      return {
        empresa: BRAND,
        hora: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
        bloque_horario: typeof currentScheduleBlock === 'function' ? currentScheduleBlock().label : '',
        equipo: AGENTS.filter(a => a.type === 'AI' && !a.leaving && officeOf(a) === ACTIVE_OFFICE).length,
        proyectos_en_curso: mine.filter(p => p.status === 'en_curso').map(p => ({ titulo: p.title, avance: projectProgressPct(p) + '%', responsable: (projectAgent(p) || {}).name || 'sin asignar' })),
        por_revisar: mine.filter(p => p.status === 'revision').map(p => p.title),
        terminados: mine.filter(p => p.status === 'terminado').length,
        entregables: DELIVERABLES.length
      };
    }

    // ---- Cómo está y qué hace cada empleado (para que hablen de su realidad) ----
    function agentFirst(a) { return a.name.replace(/ IA$/, '').split(' ')[0]; }
    function agentArea(a) { return String(a.role || 'el equipo').split(/\s*[&·,]\s*|\s+y\s+/)[0]; }
    function agentDoing(a) {
      const p = PROJECTS.find(pr => pr.officeId === ACTIVE_OFFICE && pr.status === 'en_curso' && projectAgent(pr) === a);
      if (p) return `con ${p.title}, que va al ${projectProgressPct(p)} por ciento`;
      if (a.status === 'break') return 'de descanso un momento';
      if (a.task) return 'con la tarea de ' + a.task.charAt(0).toLowerCase() + a.task.slice(1).replace(/\.$/, '');
      return 'con tareas de ' + agentArea(a).toLowerCase();
    }
    function agentMood(a) {
      const e = a.energy || 0;
      if (e > 80) return randPick(['¡Muy bien, la verdad! Con mucha energía hoy.', '¡Genial! Hoy estoy con las pilas cargadas.', 'De maravilla, hoy está siendo un buen día.']);
      if (e > 55) return randPick(['Bien, bien. Tranquilo el día por ahora.', 'Pues bien, con buen ritmo.', 'Todo bien por aquí, gracias por preguntar.']);
      if (e > 30) return randPick(['Bien, aunque ya se nota el cansancio.', 'Regular tirando a bien: un café no me vendría mal.', 'Bien, pero con ganas de una pausa.']);
      return randPick(['Sinceramente, con bastante cansancio.', 'Sin mucha energía, la verdad. Necesito un descanso pronto.']);
    }

    async function meetingReplies(text, transcript) {
      const people = ROOM.participants.map(p => AGENTS.find(a => a.id === p.agentId)).filter(Boolean);
      const cmd = typeof runOfficeCommand === 'function' ? runOfficeCommand(text, { silent: true }) : null;
      // la IA del navegador aún no está descargada: se prepara en segundo plano y mientras responde la lógica local
      const webllmCold = AI.engine === 'webllm' && !(AI.webllm && AI.webllm.modelId === AI.webllmModel);
      if (webllmCold && webgpuAvailable() && !AI.webllmLoading) {
        showToast('💻 Preparando la IA del navegador; mientras, responde el equipo con la lógica local.');
        ensureWebLLM().catch(e => showToast('⚠️ ' + aiErrorMessage(e)));
      }
      if (aiReady() && !webllmCold) {
        try {
          const boss = COMPANY.independent ? COMPANY.owner : 'Director';
          const roster = people.map(a => `- ${a.name} (${a.role}, ${rankOf(a).name}). Energía ${Math.round(a.energy || 0)}/100. Ahora está ${agentDoing(a)}.`).join('\n');
          const system = `Interpretas a los empleados de la empresa "${BRAND}" en una reunión con su jefe (${boss}). Hablan en español de España, como compañeros de trabajo reales: naturales, cercanos y con personalidad propia. Sus frases se leen en voz alta: cortas, máximo 2 frases por persona.

REGLAS:
- Responde EXACTAMENTE a lo que dijo ${boss} en su último mensaje. Si pregunta cómo están, dicen cómo se sienten de verdad (según su energía) y en qué andan. Si saluda, saludan. Si cuenta algo personal o bromea, reaccionan como personas.
- No conviertas cada frase en trabajo: NO ofrezcas "trabajar en eso" ni crear proyectos si no lo pidió.
- Responden 1 o 2 personas (si nombra a alguien, responde esa persona; a un grupo, pueden responder 2). Nunca repiten frases ya dichas.
- Nunca inventan proyectos que no existan en el estado de la empresa.

EJEMPLOS:
${boss}: ¿cómo están? → "¡Muy bien! Hoy voy a tope con la web de la panadería." / "Yo bien, aunque con algo de sueño. ¿Y tú qué tal?"
${boss}: hoy estoy cansado → "Vaya, normal con la semana que llevamos. ¿Te traigo un café?"
${boss}: ¿qué tal el fin de semana? → "Tranquilo, fui a la montaña con mi familia. ¿Y el tuyo?"

Asistentes:
${roster}`;
          const history = transcript.slice(-14).map(t => `${t.who}: ${t.text}`).join('\n');
          const ctx = `Estado de la empresa: ${JSON.stringify(officeSnapshot())}${cmd ? `\nAcción ya ejecutada por la oficina: ${cmd}` : ''}\n\nConversación:\n${history}\n\nResponde al último mensaje de ${boss}.`;
          const out = await withTimeout(aiJson(system, [{ role: 'user', content: ctx }], {
            type: 'object',
            properties: { respuestas: { type: 'array', items: { type: 'object', properties: { nombre: { type: 'string' }, texto: { type: 'string' } }, required: ['nombre', 'texto'], additionalProperties: false } } },
            required: ['respuestas'], additionalProperties: false
          }), 25000);
          const list = (out.respuestas || []).slice(0, 3).map(r => ({ name: r.nombre, text: String(r.texto).slice(0, 300) })).filter(r => r.text.trim());
          if (list.length) { ROOM.lastAsk = null; return list; }
        } catch (e) {
          showToast('⚠️ ' + (e && e.timeout ? e.message : aiErrorMessage(e)) + ' Respondo con la lógica local.');
        }
      }
      return localMeetingReplies(text, people, cmd);
    }

    // Elige una frase que no se haya dicho ya en esta reunión
    let _turnSaid = [];
    function freshLine(pool) {
      const said = new Set(ROOM.transcript.map(t => t.text).concat(_turnSaid));
      const unused = pool.filter(s => ![...said].some(t => t.includes(s)));
      const line = randPick(unused.length ? unused : pool);
      _turnSaid.push(line);
      return line;
    }

    // ---- Conversación local (sin IA): entiende la intención de lo que dices y contesta a eso ----
    const TALK = {
      bye: /\b(adios|chao|chau|hasta luego|hasta manana|hasta pronto|nos vemos|me voy|bye|buenas noches)\b/,
      yes: /^(si|sip|sii+|vale|claro|ok|okay|dale|venga|por favor|bueno|de acuerdo|perfecto|adelante|hazlo|cuentame|contadme|cuentenme|a ver)\b/,
      no: /^(no|nop|nah|nada|todavia no|ahora no|mejor no|de momento no)\b/,
      greet: /\b(hola|buenas|buenos dias|buenas tardes|saludos|hey|que onda|ey)\b/,
      howAre: /(como (estan|estais|estas|esta|andan|andais|andas|os va|les va|te va|va todo|va el dia|se sienten|os sentis|te sientes|amanecieron|habeis dormido)|que tal (estan|estais|estas|todo|el dia|vais|van|vas|la semana|la manana|la tarde|os va|les va|chicos|equipo|gente)?\s*\??$|todo bien|que tal\b|como vamos)/,
      userGood: /\b(bien|genial|perfecto|de lujo|estupendo|muy bien|fenomenal|excelente|contento|feliz|tranquilo)\b/,
      userBad: /\b(mal|cansad[oa]|agotad[oa]|estresad[oa]|regular|triste|enferm[oa]|fatal|harto|harta|aburrid[oa]|preocupad[oa]|dormido|sueno)\b/,
      doing: /(que (estan|estais|estas|esta) haciendo|que hacen|que haceis|que haces|en que (estan|estais|estas|andan|andais|trabajan|trabajais)|que tal el trabajo|que tareas|a que se dedican)/,
      who: /(quien(es)? (eres|sois|son|es)|presentate|presentaos|presentense|preséntense|como te llamas|como os llamais|como se llaman|cual es tu (rol|puesto|trabajo)|que puesto)/,
      status: /(avance|progreso|proyecto|entrega|como va(n)? (el|la|los|las|lo) |pendiente|por revisar|terminad)/,
      joke: /(chiste|algo gracioso|hazme reir|haznos reir|broma)/,
      food: /(comida|comer|almuerzo|almorzar|cafe|descanso|hambre|merienda|pausa|desayun|cenar)/,
      time: /(que hora|la hora)/,
      weekend: /(fin de semana|finde|vacaciones|planes|que hiciste|que hicisteis|ayer)/,
      weather: /(que tiempo|clima|lluvia|llueve|calor|frio|sol hace)/,
      likes: /(te gusta|os gusta|les gusta|favorit|prefier)/,
      thanks: /(gracias|bien hecho|felicit|excelente trabajo|buen trabajo|enhorabuena|orgullos|os quiero|sois los mejores|son los mejores)/,
      insult: /(mal trabajo|lentos|vagos|tontos|inutil|no sirven|horrible|decepcion|desastre|que mal)/,
      ideas: /(idea|propuesta|suger|mejorar|opin|que piensan|que pensais|que os parece|que les parece)/,
      problem: /(problema|bloque|error|fallo|bug|no funciona|ayuda)/,
      goals: /(objetivo|meta|esta semana|este mes|plan de)/,
      doubts: /(alguna (pregunta|duda)|dudas|preguntas\??$|algo que decir|algo mas)/,
      laugh: /^(ja(ja)+|je(je)+|lol|xd+|jsjs)/
    };

    function localMeetingReplies(text, people, cmd) {
      if (!people.length) return [];
      _turnSaid = [];
      const n = String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
      const words = n.replace(/[^a-z0-9ñ\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
      const named = people.find(a => words.includes(agentFirst(a).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
      const shuffled = people.slice().sort(() => Math.random() - 0.5);
      const pick = (k) => (named ? [named] : shuffled).slice(0, k);
      const one = () => pick(1)[0];
      const boss = COMPANY.independent ? COMPANY.owner : 'Director';
      const last = ROOM.lastAsk || null;
      ROOM.lastAsk = null;
      const ask = (type) => { ROOM.lastAsk = type; };
      const say = (a, t) => ({ id: a.id, text: t });

      if (cmd) return [say(one(), `Hecho, ${boss}. ${cmd} Nos ponemos con ello ahora mismo.`)];

      if (TALK.laugh.test(n)) return [say(one(), freshLine(['¡Jaja! Me alegra verte de buen humor.', 'Jajaja, ¡qué bueno!', '¡Jaja! Así da gusto empezar la reunión.']))];

      if (TALK.bye.test(n)) {
        return pick(2).map((a, i) => say(a, freshLine(i ? ['¡Chao! Que vaya bien.', '¡Nos vemos!', 'Hasta luego, cualquier cosa nos avisas.'] : [`¡Hasta luego, ${boss}!`, '¡Adiós! Seguimos con lo nuestro.', `Gracias por la reunión, ${boss}. ¡Hasta pronto!`])));
      }

      // respuestas cortas a lo que te acaban de preguntar
      if (last === 'howareyou' && (TALK.userGood.test(n) || TALK.userBad.test(n))) {
        if ((TALK.userBad.test(n) && !/\bno (estoy )?mal\b/.test(n)) || /\bno (muy |tan |estoy )?bien\b/.test(n)) {
          return [say(one(), freshLine(['Vaya, lo siento. Si quieres, hoy nos encargamos nosotros de lo pesado.', 'Ánimo, que ya queda menos. ¿Te traemos un café?', 'Uf, te entiendo. Tómatelo con calma, el equipo responde.']))];
        }
        return [say(one(), freshLine(['¡Me alegro mucho! Así da gusto.', '¡Qué bien! Se nota el buen ambiente.', '¡Genial! Entonces vamos con todo.']))];
      }
      if (last && TALK.yes.test(n) && words.length <= 4) {
        if (last === 'status') return statusReplies(people, one, say);
        if (last === 'newtask') return [say(one(), '¡Perfecto! Dinos qué quieres: una web, una app, un juego o un programa, y para quién.')];
        if (last === 'joke') return [say(one(), tellJoke())];
        if (last === 'coffee') return [say(one(), '¡Marchando! Ahora te lo traigo. ☕')];
        return [say(one(), freshLine(['¡Perfecto!', 'Genial, así lo hacemos.', 'Vale, perfecto.']))];
      }
      if (last && TALK.no.test(n) && words.length <= 4) {
        return [say(one(), freshLine(['Vale, sin problema.', 'De acuerdo, cuando quieras.', 'Entendido. Aquí estamos si cambias de idea.']))];
      }

      // ¿cómo están? (con o sin saludo delante)
      if (TALK.howAre.test(n) && !TALK.status.test(n) && !TALK.weekend.test(n) && !TALK.food.test(n) && !TALK.weather.test(n)) {
        const who = pick(named ? 1 : 2);
        const out = who.map((a, i) => say(a, (i === 0 && TALK.greet.test(n) ? `¡Hola, ${boss}! ` : '') + agentMood(a) + ' ' + freshLine([`Ahora mismo ando ${agentDoing(a)}.`, `Estoy ${agentDoing(a)}.`, `Aquí, ${agentDoing(a)}.`])));
        out[out.length - 1].text += ' ' + freshLine(['¿Y tú qué tal?', '¿Y tú cómo estás?', '¿Qué tal tu día?']);
        ask('howareyou');
        return out;
      }

      // saludo
      if (TALK.greet.test(n) && words.length <= 5) {
        const greet = [
          (a) => `¡Hola, ${boss}! Aquí ${agentFirst(a)}, de ${agentArea(a)}.`,
          (a) => `¡Buenas, ${boss}! ${agentFirst(a)} presente.`,
          (a) => `¡Hola! ${(a.energy || 0) > 60 ? 'Qué bien verte por aquí.' : 'Buenas, ya con el café en la mano.'}`,
          (a) => `¡Muy buenas, ${boss}!`
        ];
        const out = pick(named ? 1 : 2).map(a => say(a, freshLine(greet.map(g => g(a)))));
        out[out.length - 1].text += ' ' + freshLine(['¿Qué tal estás?', '¿Cómo va tu día?', '¿Qué tal todo?']);
        ask('howareyou');
        return out;
      }

      if (TALK.doing.test(n)) return pick(named ? 1 : 2).map(a => say(a, freshLine([`Yo estoy ${agentDoing(a)}.`, `Pues ahora mismo, ${agentDoing(a)}.`, `Ando ${agentDoing(a)}. Va bien.`])));

      if (TALK.who.test(n)) {
        return pick(named ? 1 : 3).map(a => say(a, `Soy ${agentFirst(a)}, ${rankOf(a).name.toLowerCase()} de ${a.role}.`));
      }

      if (TALK.status.test(n)) return statusReplies(people, one, say);

      if (TALK.joke.test(n)) { ask('joke'); return [say(one(), tellJoke()), say(pick(2)[1] || one(), freshLine(['Jajaja, ese es malísimo.', '¡Siempre el mismo chiste! Jaja.', 'Jaja, ¿otro?']))].filter((r, i, arr) => i === 0 || r.id !== arr[0].id); }

      if (TALK.food.test(n)) {
        const sched = typeof scheduleSummaryText === 'function' ? scheduleSummaryText() : '';
        ask('coffee');
        return [say(one(), freshLine(['¡Uf, sí! Un café ahora sentaría de maravilla.', 'Yo ya tengo hambre, la verdad.', 'Buena idea, un descanso nos vendría bien.']) + (sched ? ' ' + sched : '') + ' ¿Te traigo un café?')];
      }

      if (TALK.time.test(n)) return [say(one(), 'Son las ' + new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) + '.')];

      if (TALK.weekend.test(n)) {
        return pick(2).map((a, i) => say(a, freshLine(['Fue tranquilo: descansé, vi una serie y salí a caminar.', 'Fui a ver a mi familia, muy bien la verdad.', 'Estuve aprendiendo un framework nuevo, no lo puedo evitar.', 'Hice deporte y dormí mucho. ¡Lo necesitaba!', 'Fui al cine. Muy recomendable.']) + (i === 1 ? ' ¿Y tú qué hiciste?' : '')));
      }

      if (TALK.weather.test(n)) return [say(one(), freshLine(['Desde aquí dentro ni me entero, ¡pero ojalá haga bueno!', 'Con el aire acondicionado de la oficina siempre es primavera.', 'Yo he venido con chaqueta, así que algo de fresco hace.']))];

      if (TALK.likes.test(n)) {
        return pick(2).map(a => say(a, freshLine([`A mí lo que más me gusta es ${agentArea(a).toLowerCase()}, es lo mío.`, 'Me encanta cuando un proyecto sale a la primera.', 'Lo que más me gusta es el buen ambiente del equipo.', 'Yo soy de café y de música mientras programo.'])));
      }

      if (TALK.thanks.test(n)) {
        return pick(2).map(a => say(a, freshLine(['¡Gracias! Así da gusto trabajar.', 'Gracias a ti por la confianza.', '¡Qué bien sienta oír eso!', '¡Se agradece! Lo celebramos con un café.', 'Gracias, nos motiva mucho.'])));
      }

      if (TALK.insult.test(n)) {
        return [say(one(), freshLine(['Lo sentimos. Dinos qué ha fallado exactamente y lo arreglamos hoy mismo.', 'Entendido, nos lo tomamos en serio. ¿Qué es lo que más te ha molestado?']))];
      }

      if (TALK.ideas.test(n)) {
        const ideas = ['podríamos crear una plantilla reutilizable para acelerar las webs', 'propongo revisar el rendimiento en móviles antes de cada entrega', 'convendría documentar mejor cada proyecto para los clientes', 'sería útil una sesión de pruebas cruzadas entre equipos'];
        return pick(2).map((a, i) => say(a, `Yo creo que ${ideas[(officeHash(a.id) + i) % ideas.length]}.`));
      }

      if (TALK.problem.test(n)) return [say(one(), freshLine(['Vaya. Cuéntanos qué pasa y lo miramos ahora mismo.', '¿Qué ha fallado? Si es un error, lo reproducimos y lo corregimos.']))];

      if (TALK.goals.test(n)) return pick(2).map(a => say(a, freshLine(['Me parece bien. Lo apuntamos como objetivo.', 'Perfecto, lo dividimos en tareas.', 'De acuerdo, lo revisamos a mitad de semana.'])));

      if (TALK.doubts.test(n)) {
        const a = one();
        return [say(a, freshLine(['Yo tengo una: ¿qué es lo más prioritario para esta semana?', '¿Hay algún cliente nuevo en camino?', 'Por mi parte nada, todo claro.', '¿Vamos a contratar a alguien más pronto?']))];
      }

      if (TALK.yes.test(n) && words.length <= 3) return [say(one(), freshLine(['¡Perfecto!', 'Genial.', 'Vale.']))];
      if (TALK.no.test(n) && words.length <= 3) return [say(one(), freshLine(['Vale, sin problema.', 'De acuerdo.']))];

      // cuentas algo tuyo ("me gusta…", "tengo…", "hoy…"): reaccionan como compañeros
      const likeM = n.match(/\bme (gusta|gustan|encanta|encantan) (.{2,40})/);
      if (likeM) {
        const thing = likeM[2].replace(/[?.!¡¿]+$/, '').trim();
        if (/futbol|deporte|baloncesto|tenis|correr|gimnasio/.test(thing)) return [say(one(), freshLine([`¡Anda! ¿De qué equipo eres?`, `¡A mí también me gusta ${thing}! ¿Juegas o solo lo ves?`, `¿En serio? Tenemos que organizar un partido del equipo.`]))];
        return [say(one(), freshLine([`¿Ah, sí? A mí también me gusta ${thing}.`, `¡Qué bien! ¿Desde hace mucho te gusta ${thing}?`, `Mira, no lo sabía. ¿Qué es lo que más te gusta de eso?`]))];
      }
      if (/^(yo |hoy |ayer |tengo |estoy |acabo de |me (he|siento) |mi )/.test(n)) {
        if (TALK.userBad.test(n)) return [say(one(), freshLine(['Vaya, lo siento. Si necesitas algo, aquí estamos.', 'Uf, ánimo. Tómatelo con calma hoy.']))];
        if (TALK.userGood.test(n)) return [say(one(), freshLine(['¡Qué bien! Me alegro mucho.', '¡Genial, eso hay que celebrarlo!']))];
        return [say(one(), freshLine(['¿Ah, sí? Cuéntanos más.', '¡Anda! ¿Y qué tal?', 'Mira tú. ¿Y cómo fue?']))];
      }

      // solo dijo el nombre de alguien
      if (named && words.length <= 2) return [say(named, freshLine([`¿Sí, ${boss}? Dime.`, 'Aquí estoy, dime.', '¿Qué necesitas?']))];

      // lo demás: reaccionan a lo que dijiste, sin empujar a hacer proyectos
      const isQuestion = /\?|^(que|como|cuando|donde|por que|quien|cual|cuanto)\b/.test(n);
      const a = one();
      if (isQuestion) {
        return [say(a, freshLine(['Buena pregunta. Sinceramente, no lo sé seguro; lo miro y te digo.', 'Mmm, déjame pensarlo un momento. ¿A qué te refieres exactamente?', 'Pues no sabría decirte. ¿Alguien del equipo lo sabe?', 'Interesante pregunta. ¿Me lo explicas un poco más?']))];
      }
      return [say(a, freshLine(['Ya veo. Cuéntame más.', 'Ah, vale, entiendo.', 'Totalmente de acuerdo.', 'Mmm, interesante. ¿Y eso?', 'Vale, lo tengo en cuenta.', 'Entiendo lo que dices.']))];
    }

    function statusReplies(people, one, say) {
      const running = PROJECTS.filter(p => p.officeId === ACTIVE_OFFICE && (p.status === 'en_curso' || p.status === 'revision'));
      if (!running.length) { ROOM.lastAsk = 'newtask'; return [say(one(), 'Ahora mismo no tenemos proyectos en marcha. ¿Quieres encargarnos alguno?')]; }
      return running.slice(0, 2).map(p => {
        const a = projectAgent(p);
        const who = people.includes(a) ? a : one();
        return say(who, p.status === 'revision' ? `${p.title} ya está terminado y espera tu revisión.` : `${p.title} va al ${projectProgressPct(p)} por ciento. Ahora toca: ${p.steps[Math.min(p.stepIndex, p.steps.length - 1)].desc.toLowerCase()}.`);
      });
    }

    function tellJoke() {
      return freshLine([
        '¿Por qué los programadores confunden Halloween con Navidad? Porque OCT 31 es igual a DEC 25.',
        'Un programador va al súper. Su pareja le dice: trae leche, y si hay huevos, trae seis. Volvió con seis leches.',
        '¿Cuántos programadores hacen falta para cambiar una bombilla? Ninguno: es un problema de hardware.',
        'Mi código funciona y no sé por qué. Ayer no funcionaba y tampoco sabía por qué.',
        '¿Qué le dice un bit a otro? Nos vemos en el bus.'
      ]);
    }
