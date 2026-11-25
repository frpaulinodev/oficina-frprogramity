    // _____________________________________________________________________
    // HORARIO DE LA EMPRESA: un horario para cada cosa (trabajo, café, almuerzo, recreación,
    // descanso y la hora de motivación). Sigue la hora real; el modo "rápido" condensa
    // un día entero en 24 minutos (1 s = 1 min) para ver todas las rutinas.
    // _____________________________________________________________________
    const SCHEDULE = [
      ['00:00', '07:30', 'trabajo', '🌙 Turno nocturno'],
      ['07:30', '08:00', 'cafe', '☕ Café de bienvenida'],
      ['08:00', '10:30', 'trabajo', '💼 Trabajo'],
      ['10:30', '10:45', 'cafe', '☕ Pausa de café'],
      ['10:45', '13:00', 'trabajo', '💼 Trabajo'],
      ['13:00', '14:00', 'comida', '🍽️ Almuerzo'],
      ['14:00', '14:20', 'motivacion', '🔥 Hora de motivación'],
      ['14:20', '16:30', 'trabajo', '💼 Trabajo'],
      ['16:30', '16:45', 'cafe', '☕ Pausa de café'],
      ['16:45', '17:30', 'trabajo', '💼 Trabajo'],
      ['17:30', '18:15', 'recreo', '🏓 Recreación'],
      ['18:15', '20:00', 'trabajo', '💼 Trabajo'],
      ['20:00', '20:45', 'comida', '🍽️ Cena'],
      ['20:45', '21:15', 'descanso', '🛋️ Descanso'],
      ['21:15', '24:00', 'trabajo', '🌙 Turno nocturno']
    ].map(([a, b, kind, label]) => {
      const m = (s) => { const [h, mi] = s.split(':').map(Number); return h * 60 + mi; };
      return { from: m(a), to: m(b), fromTxt: a, toTxt: b === '24:00' ? '00:00' : b, kind, label };
    });

    const SCHED_KEY = 'frp_schedule_v1';
    const SCHED = { mode: 'real', anchorReal: 0, anchorVirtual: 0, current: -1, enabled: true };
    try {
      const s = JSON.parse(localStorage.getItem(SCHED_KEY) || '{}') || {};
      if (s.mode === 'rapido') SCHED.mode = 'rapido';
    } catch (e) { /* valores por defecto */ }
    // Sin horario: el Director decidió que el equipo trabaja siempre (nada de pausas programadas).
    SCHED.enabled = false;

    function saveSchedule() {
      try { localStorage.setItem(SCHED_KEY, JSON.stringify({ mode: SCHED.mode, enabled: SCHED.enabled })); } catch (e) { /* sin persistencia */ }
    }

    function realMinutes() {
      const d = new Date();
      return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
    }

    // Minuto del día "de la empresa"
    function companyMinutes() {
      if (SCHED.mode !== 'rapido') return realMinutes();
      return (SCHED.anchorVirtual + (Date.now() - SCHED.anchorReal) / 1000) % 1440;
    }

    function minutesToReal(min) {
      return SCHED.mode === 'rapido' ? min * 1000 : min * 60000;
    }

    function fmtMin(min) {
      const h = Math.floor(min / 60) % 24, m = Math.floor(min % 60);
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }

    function scheduleIndexAt(min) {
      const i = SCHEDULE.findIndex(b => min >= b.from && min < b.to);
      return i < 0 ? 0 : i;
    }

    function currentScheduleBlock() {
      return SCHEDULE[scheduleIndexAt(companyMinutes())];
    }

    function setScheduleMode(mode) {
      const nowVirtual = companyMinutes();
      SCHED.mode = mode === 'rapido' ? 'rapido' : 'real';
      SCHED.anchorReal = Date.now();
      SCHED.anchorVirtual = mode === 'rapido' ? nowVirtual : 0;
      saveSchedule();
      showToast(SCHED.mode === 'rapido' ? '⏩ Horario rápido: un día dura 24 minutos' : '🕒 Horario con la hora real');
      scheduleTick(true);
      renderSchedulePanel();
    }

    function setScheduleEnabled(on) {
      SCHED.enabled = false; // el horario está desactivado para siempre
      on = false;
      saveSchedule();
      if (!on) endScheduledBreaks('Horario pausado: de vuelta al trabajo');
      else scheduleTick(true);
      renderSchedulePanel();
    }

    function scheduleSummaryText() {
      const min = companyMinutes();
      const b = currentScheduleBlock();
      const next = SCHEDULE[(scheduleIndexAt(min) + 1) % SCHEDULE.length];
      return `Ahora toca ${b.label.replace(/^\S+\s/, '').toLowerCase()} (hasta las ${b.toTxt}). Después: ${next.label.replace(/^\S+\s/, '').toLowerCase()} a las ${next.fromTxt}.`;
    }

    // ---- Qué hace el equipo en cada bloque ----
    const SCHED_ZONES = {
      cafe: ['cafe', 'lounge', 'naturaleza'],
      comida: ['comedor', 'comedor', 'cafe'],
      recreo: ['naturaleza', 'cafe'],
      descanso: ['lounge', 'naturaleza', 'cafe']
    };
    const SCHED_BUBBLES = {
      cafe: ['☕ Pausa de café', '☕ Café con el equipo'],
      comida: ['🍽️ Almorzando con el equipo', '🥗 Hora de comer', '🍲 Menú del día'],
      recreo: ['🏓 Partido de ping-pong', '🕹️ En las arcades', '🏋️ Un poco de ejercicio', '🌿 Paseo por el jardín'],
      descanso: ['🛋️ Descansando', '🧘 Desconectando un rato']
    };

    function scheduleStaff() {
      return AGENTS.filter(a => a.type === 'AI' && !a.leaving && !['onboarding', 'meeting', 'waiting_human'].includes(a.status));
    }

    function zoneCapacity(zid) {
      const z = ZONES[zid];
      return z ? Math.max(4, (z.spots || []).length) : 0;
    }

    function sendStaffToBlock(kind) {
      const now = performance.now();
      const remaining = Math.max(20000, minutesToReal(currentScheduleBlock().to - companyMinutes()));
      const fill = {};
      let moved = 0;
      const recCands = activeCandidates().length > 0;
      scheduleStaff().forEach(a => {
        // la cocina sirve en el almuerzo y recepción no se queda vacía con candidatos esperando
        if (kind === 'comida' && a.homeZone === 'cocina') return;
        if (a.homeZone === 'reception' && recCands) return;
        if (MOTIV.active && MOTIV.ids.includes(a.id)) return;
        let zid;
        if (officeOf(a) !== 'main') {
          zid = a.officeId + '_' + (kind === 'recreo' || kind === 'descanso' ? 'descanso' : 'cafe');
          if (!ZONES[zid]) return;
        } else {
          const opts = SCHED_ZONES[kind];
          zid = opts.find(z => ZONES[z] && (fill[z] || 0) < zoneCapacity(z)) || opts[opts.length - 1];
        }
        fill[zid] = (fill[zid] || 0) + 1;
        a.status = 'break';
        a._schedBreak = true;
        a.breakMinUntil = now + remaining;
        a.currentZone = zid;
        a.targetPos = getWaypointForZone(zid, a.id);
        a.bubble = randPick(SCHED_BUBBLES[kind]);
        if (kind === 'comida') a.lastMealAt = now;
        moved++;
      });
      return moved;
    }

    function endScheduledBreaks(bubble = '💼 De vuelta al trabajo') {
      const now = performance.now();
      AGENTS.forEach(a => {
        if (!a._schedBreak) return;
        a._schedBreak = false;
        if (a.leaving || a.status !== 'break') return;
        a.status = 'working';
        a.breakMinUntil = 0;
        a.cooldownUntil = now + ENERGY.cooldownMs;
        a.energy = Math.max(a.energy, 70);
        a.currentZone = a.homeZone;
        a.targetPos = getWaypointForZone(a.homeZone, a.id);
        a.bubble = bubble;
      });
    }

    function applyScheduleBlock(block, initial) {
      if (block.kind === 'trabajo') {
        endScheduledBreaks();
        if (!initial) pushActivity(`${block.label}: el equipo vuelve a sus puestos.`, 'HORARIO');
      } else if (block.kind === 'motivacion') {
        endScheduledBreaks();
        if (!initial) startMotivationNow(true);
      } else {
        const n = sendStaffToBlock(block.kind);
        if (n) {
          pushActivity(`${block.label} (${block.fromTxt}–${block.toTxt}): ${n} miembros en pausa.`, 'HORARIO');
          if (!initial) showToast(`${block.label} · hasta las ${block.toTxt}`);
        }
      }
      if (activeTab === 'team' || activeTab === 'operations') renderPanel();
    }

    function scheduleTick(force = false) {
      const idx = scheduleIndexAt(companyMinutes());
      const changed = idx !== SCHED.current;
      const initial = SCHED.current < 0;
      SCHED.current = idx;
      if (SCHED.enabled && (changed || force)) applyScheduleBlock(SCHEDULE[idx], initial && !force);
      updateClockHud();
    }

    function startScheduleEngine() {
      SCHED.anchorReal = Date.now();
      SCHED.anchorVirtual = SCHED.mode === 'rapido' ? realMinutes() : 0;
      scheduleTick();
      setInterval(scheduleTick, 1000);
      setInterval(todAutoTick, 30000);
    }

    // ---- Reloj de la cabecera ----
    function updateClockHud() {
      const d = new Date();
      const t = document.getElementById('hud-clock');
      if (t) t.textContent = d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dt = document.getElementById('hud-date');
      if (dt) dt.textContent = d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
      const chip = document.getElementById('hud-sched');
      if (chip) {
        const b = currentScheduleBlock();
        chip.textContent = SCHED.enabled ? `${b.label} · ${SCHED.mode === 'rapido' ? fmtMin(companyMinutes()) + ' ⏩' : 'hasta ' + b.toTxt}` : '💼 Trabajando sin pausas';
      }
      if (document.getElementById('dock-panel-schedule') && DOCK.open === 'schedule') renderScheduleProgress();
    }

    function renderScheduleProgress() {
      const b = currentScheduleBlock();
      const min = companyMinutes();
      const bar = document.getElementById('sched-progress');
      if (bar) bar.style.width = Math.round(((min - b.from) / (b.to - b.from)) * 100) + '%';
      const now = document.getElementById('sched-now');
      if (now) now.textContent = fmtMin(min);
    }

    function renderSchedulePanel() {
      const box = document.getElementById('dock-panel-schedule');
      if (!box) return;
      const cur = scheduleIndexAt(companyMinutes());
      const sub = AGENTS.length ? subdirector() : null;
      box.innerHTML = `
        <div class="panel-head"><span>🗓️ Horario de ${escapeHtml(BRAND)}</span><button class="icon-btn" onclick="closeDockPanel()">✕</button></div>
        <div class="p-2.5 space-y-2">
          <div class="flex items-center gap-1">
            <button onclick="setScheduleMode('real')" class="seg ${SCHED.mode === 'real' ? 'on' : ''}">🕒 Hora real</button>
            <button onclick="setScheduleMode('rapido')" class="seg ${SCHED.mode === 'rapido' ? 'on' : ''}">⏩ Rápido</button>
            <span class="ml-auto text-[10px] text-emerald-300 font-semibold">💼 Sin horario: trabajan siempre</span>
          </div>
          <div class="flex items-center justify-between text-[10px] text-slate-400"><span>Hora de la empresa: <b id="sched-now" class="font-mono text-white">${fmtMin(companyMinutes())}</b></span><span>Subdirector: <b class="text-amber-200">${sub ? escapeHtml(sub.name) : '—'}</b></span></div>
          <div class="sched-list quick-scroll">
            ${SCHEDULE.map((b, i) => `
              <div class="sched-row ${i === cur ? 'now' : ''} k-${b.kind}">
                <span class="font-mono text-[10px] text-slate-400 w-[74px] shrink-0">${b.fromTxt}–${b.toTxt}</span>
                <span class="flex-1 truncate">${b.label}</span>
                ${i === cur ? '<span class="text-[9px] font-mono text-cyan-200">AHORA</span>' : ''}
              </div>
              ${i === cur ? '<div class="h-1 rounded-full bg-slate-800 overflow-hidden -mt-0.5 mb-1"><div id="sched-progress" class="h-full bg-cyan-400" style="width:0%"></div></div>' : ''}`).join('')}
          </div>
          <button onclick="startMotivationNow()" ${MOTIV.active ? 'disabled' : ''} class="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 text-amber-100 border border-amber-400/40 text-[11px] font-semibold">🔥 Charla de motivación ahora</button>
        </div>`;
      renderScheduleProgress();
    }

    // _____________________________________________________________________
    // HORA DE MOTIVACIÓN: el subdirector (la IA de mayor rango) reúne a todos y los motiva
    // _____________________________________________________________________
    const MOTIV = { active: false, ids: [], speaker: null, zone: 'naturaleza', timer: null };

    function subdirector(officeId = 'main') {
      const pool = AGENTS.filter(a => a.type === 'AI' && !a.leaving && officeOf(a) === officeId && a.homeZone !== 'limpieza' && a.homeZone !== 'cocina');
      pool.sort((a, b) => (b.rankIdx || 0) - (a.rankIdx || 0) || (b.xp || 0) - (a.xp || 0));
      return pool[0] || null;
    }

    function motivationLines(sp) {
      const mine = PROJECTS.filter(p => p.officeId === 'main');
      const done = mine.filter(p => p.status === 'terminado').length;
      const running = mine.filter(p => p.status === 'en_curso' || p.status === 'revision').length;
      const team = AGENTS.filter(a => a.type === 'AI' && !a.leaving && officeOf(a) === 'main');
      const star = team.filter(a => a !== sp).sort((a, b) => (b.xp || 0) - (a.xp || 0))[0];
      return [
        randPick(['¡Equipo, gracias por venir! Es la hora de motivación.', '¡Atención todos! Paramos un momento para hablar de lo que estamos logrando.']),
        done || running
          ? `Llevamos ${done} proyecto${done === 1 ? '' : 's'} terminado${done === 1 ? '' : 's'} y ${running} en marcha. Eso es trabajo real que llega a personas reales.`
          : 'Hoy empezamos con la mesa limpia: cada orden del Director es una oportunidad de demostrar de qué somos capaces.',
        star ? `Quiero reconocer a ${star.name.replace(/ IA$/, '')}, que está dando lo mejor de sí. ¡Un aplauso!` : 'Cada uno de vosotros es parte de lo que somos.',
        randPick(['Nuestro objetivo es claro: entregar cosas de las que estemos orgullosos, a tiempo y sin errores.', 'La calidad no es un detalle: es nuestra firma. Revisad, probad y mejorad.', 'Cuando un compañero se atasca, lo ayudamos. Aquí nadie trabaja solo.']),
        randPick(['Y recordad: descansar también es parte del trabajo. Cuidaos.', 'Respirad, tomad agua y volved con energía.']),
        `¡Vamos, ${BRAND}! ¡A seguir adelante!`
      ];
    }

    async function startMotivationNow(fromSchedule = false) {
      if (MOTIV.active) return;
      const sp = subdirector('main');
      if (!sp) { showToast('No hay nadie en el equipo para dar la charla.'); return; }
      const zone = ZONES[MOTIV.zone] ? MOTIV.zone : 'reception';
      MOTIV.active = true;
      MOTIV.speaker = sp.id;
      const z = ZONES[zone];
      // el subdirector se pone al frente del jardín y el resto lo rodea mirándolo
      const stage = { x: z.x, z: z.z - z.d / 2 + 1.6 };
      const audience = AGENTS.filter(a => a.type === 'AI' && !a.leaving && officeOf(a) === 'main' && a !== sp &&
        !['onboarding', 'meeting', 'waiting_human'].includes(a.status) && a.homeZone !== 'cocina');
      MOTIV.ids = [sp.id, ...audience.map(a => a.id)];
      const prep = (a) => { a._preMotivStatus = a.status === 'break' && !a._schedBreak ? 'working' : a.status; a.status = 'break'; a._motiv = true; a.breakMinUntil = performance.now() + 600000; a.currentZone = zone; };
      prep(sp);
      sp.targetPos = { x: stage.x, z: stage.z, yaw: 0 };
      sp.bubble = '📣 ¡Todos al jardín!';
      audience.forEach((a, i) => {
        prep(a);
        const row = Math.floor(i / 8), col = i % 8;
        const x = stage.x - 4.9 + col * 1.4 + (row % 2) * 0.7;
        const zz = stage.z + 2.4 + row * 1.25;
        const tgt = isFreeWorld(x, zz) ? { x, z: zz } : randomFreePointInZone(zone, a.id);
        tgt.yaw = Math.atan2(stage.x - tgt.x, stage.z - tgt.z);
        a.targetPos = tgt;
        a.bubble = '🙂 Hacia la charla';
      });
      pushActivity(`${sp.name}, el subdirector, reúne a todo el equipo para la hora de motivación.`, 'MOTIVACIÓN');
      showToast(`🔥 Hora de motivación: ${sp.name} reúne al equipo`);
      closeDockPanel();
      if (!DIR3D.active) { cameraMode = 'nature'; setCameraPreset('nature'); }

      let lines = motivationLines(sp);
      if (aiReady()) {
        try {
          const out = await aiJson(`Eres ${sp.name}, subdirector/a de la empresa "${BRAND}", cuyos empleados son IA. Das una charla de motivación breve, sincera y concreta, en español, para leer en voz alta.`,
            [{ role: 'user', content: `Datos reales de la empresa: ${JSON.stringify(officeSnapshot())}. Escribe 6 frases cortas de la charla (la última, un grito de ánimo con el nombre de la empresa).` }],
            { type: 'object', properties: { lineas: { type: 'array', items: { type: 'string' } } }, required: ['lineas'], additionalProperties: false });
          if (Array.isArray(out.lineas) && out.lineas.length >= 3) lines = out.lineas.slice(0, 7).map(l => String(l).slice(0, 220));
        } catch (e) { /* se usa la charla local */ }
      }

      openVoiceRoom({
        kind: 'motivation',
        title: 'Hora de motivación',
        subtitle: 'Habla ' + sp.name,
        participants: [agentParticipant(sp), ...audience.slice(0, 15).map(agentParticipant)],
        onUserSay: async (text) => {
          const fans = audience.slice().sort(() => Math.random() - 0.5).slice(0, 2);
          return [{ id: sp.id, text: /gracias|bien|genial|vamos/i.test(text) ? '¡Ya lo oísteis! ¡El Director confía en nosotros!' : 'Gran mensaje. Lo llevamos al trabajo de hoy.' },
            ...fans.map(a => ({ id: a.id, text: randPick(['¡Vamos!', '¡Contad conmigo!', '¡A por ello!']) }))];
        },
        onClose: () => finishMotivation()
      });

      // espera a que llegue el público (máx. 12 s) y empieza a hablar
      const t0 = performance.now();
      while (MOTIV.active && performance.now() - t0 < 12000 && !isAgentArrived(sp)) await new Promise(r => setTimeout(r, 400));
      for (let i = 0; i < lines.length && MOTIV.active; i++) {
        sp.bubble = '📣 ' + (lines[i].length > 34 ? lines[i].slice(0, 34) + '…' : lines[i]);
        if (ROOM.open && ROOM.kind === 'motivation') roomAdd(roomParticipant(sp.id), lines[i]);
        await speak(lines[i], { id: sp.id, name: sp.name });
        if (i === 2) audience.forEach(a => { a.bubble = '👏'; });
      }
      if (!MOTIV.active) return;
      audience.forEach(a => { a.bubble = randPick(['🙌 ¡Vamos!', '💪 ¡A por ello!', '🔥 ¡Motivado/a!']); });
      setTimeout(() => { if (MOTIV.active) closeVoiceRoom(); }, 3500);
    }

    function finishMotivation() {
      if (!MOTIV.active) return;
      MOTIV.active = false;
      const now = performance.now();
      const blk = currentScheduleBlock();
      MOTIV.ids.forEach(id => {
        const a = AGENTS.find(x => x.id === id);
        if (!a || a.leaving || !a._motiv) return;
        a._motiv = false;
        a.energy = Math.min(100, a.energy + 15);
        grantXp(a, 10);
        if (SCHED.enabled && blk.kind !== 'trabajo' && blk.kind !== 'motivacion') return; // sigue la pausa del horario
        a.status = a._preMotivStatus === 'break' ? 'working' : (a._preMotivStatus || 'working');
        a.breakMinUntil = 0;
        a.cooldownUntil = now + ENERGY.cooldownMs;
        a.currentZone = a.homeZone;
        a.targetPos = getWaypointForZone(a.homeZone, a.id);
      });
      if (SCHED.enabled && blk.kind !== 'trabajo' && blk.kind !== 'motivacion') sendStaffToBlock(blk.kind);
      MOTIV.ids = [];
      pushActivity('Terminó la hora de motivación: el equipo vuelve con más energía (+15).', 'MOTIVACIÓN');
      showToast('🔥 ¡Equipo motivado! +15 de energía');
      renderPanel();
    }

    // ---- Día / noche automático según la hora real ----
    function todIsAuto() {
      try { const v = localStorage.getItem('frp_time_of_day'); return v !== 'dia' && v !== 'noche'; } catch (e) { return true; }
    }

    function todAutoTick() {
      if (!todIsAuto()) return;
      const h = new Date().getHours();
      const target = h >= 7 && h < 19 ? 1 : 0;
      if (TOD.target !== target) { TOD.target = target; updateTimeOfDayButtons(); }
    }

    const _baseSetTimeOfDay = setTimeOfDay;
    setTimeOfDay = function (mode) {
      if (mode === 'auto') {
        try { localStorage.removeItem('frp_time_of_day'); } catch (e) { /* sin persistencia */ }
        todAutoTick();
        updateTimeOfDayButtons();
        showToast('🕒 Cielo automático según la hora real');
        return;
      }
      _baseSetTimeOfDay(mode);
      try { localStorage.setItem('frp_time_of_day', mode); } catch (e) { /* sin persistencia */ }
      updateTimeOfDayButtons();
    };

    const _baseTodButtons = updateTimeOfDayButtons;
    updateTimeOfDayButtons = function () {
      _baseTodButtons();
      const auto = todIsAuto();
      document.querySelectorAll('.tod-btn').forEach(b => {
        if (b.dataset.tod === 'auto') {
          b.classList.toggle('bg-cyan-500/25', auto);
          b.classList.toggle('text-cyan-100', auto);
          b.classList.toggle('text-slate-400', !auto);
        } else if (auto) {
          b.classList.remove('bg-amber-400/25', 'text-amber-100', 'bg-indigo-500/30', 'text-indigo-100');
          b.classList.add('text-slate-400');
        }
      });
    };
