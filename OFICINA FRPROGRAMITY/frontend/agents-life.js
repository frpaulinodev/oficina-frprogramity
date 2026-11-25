    // [agents-life.js] Parte de lo que antes era script.js: ETIQUETAS 3D y VIDA DE LOS AGENTES: energía, descansos, tareas (secciones 4 y 5).
    // Se carga en orden desde index.html; no cambies el orden de los archivos.
    // _______________________________________________________
    // 4. ETIQUETAS 3D PROYECTADAS (SIN TRANSICIÓN CSS PARA EVITAR DESFASE)
    // _______________________________________________________
    function createProjectedLabels() {
      const overlay = document.getElementById('labels-overlay');
      overlay.innerHTML = '';
      roomLabelRefs.length = 0;
      agentLabelRefs.length = 0;

      Object.values(ZONES).forEach(zone => {
        const el = document.createElement('div');
        el.id = `room-label-${zone.id}`;
        el.className = 'room-tag-3d px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-700/80 text-[10px] font-mono font-semibold shadow-lg';
        el.style.color = zone.cssColor;
        el.textContent = zone.name;
        el.onclick = () => moveDirectorTo(zone.id);
        el.style.visibility = 'hidden';
        overlay.appendChild(el);
        roomLabelRefs.push({ el, zone, sx: undefined, sy: undefined, visible: false });
      });

      AGENTS.forEach(agent => createAgentLabel(agent));
    }

    function createAgentLabel(agent) {
      const overlay = document.getElementById('labels-overlay');
      const el = document.createElement('div');
      el.id = `agent-label-${agent.id}`;
      el.className = 'label-3d flex flex-col items-center';
      el.onclick = () => selectAgent(agent.id);
      const isCandidate = agent.type === 'CANDIDATE';
      const dot = agent.type === 'HUMAN' ? 'bg-cyan-400' : isCandidate ? 'bg-violet-400' : 'bg-emerald-400';
      const border = isCandidate ? 'border-violet-400/60' : 'border-cyan-500/35';
      const chip = isCandidate
        ? '<span class="px-1 rounded bg-violet-500/25 text-violet-200 text-[8px] font-mono tracking-wide">CANDIDATO</span>'
        : agent.hired ? '<span class="px-1 rounded bg-emerald-500/20 text-emerald-200 text-[8px] font-mono tracking-wide">NUEVO</span>' : '';
      el.innerHTML = `
        <div id="agent-bubble-${agent.id}" class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-900/95 border border-slate-700 text-slate-200 shadow-md whitespace-nowrap mb-1"></div>
        <div class="px-2 py-0.5 rounded-md bg-slate-950/95 border ${border} text-[10px] font-bold text-white flex items-center gap-1.5 shadow">
          <span class="w-1.5 h-1.5 rounded-full ${dot}"></span>
          ${rankEligible(agent) && agent.rankIdx !== undefined ? '<span class="text-[9px]" title="' + rankOf(agent).name + '">' + rankOf(agent).icon + '</span>' : ''}
          <span>${escapeHtml(agent.name)}</span>
          ${chip}
        </div>
      `;
      el.style.visibility = 'hidden';
      overlay.appendChild(el);
      agentLabelRefs.push({
        el,
        agent,
        bubbleEl: el.querySelector('#agent-bubble-' + CSS.escape(agent.id)),
        bubble: undefined,
        status: undefined,
        sx: undefined,
        sy: undefined,
        visible: false
      });
    }

    function removeAgentLabel(agentId) {
      const idx = agentLabelRefs.findIndex(r => r.agent.id === agentId);
      if (idx < 0) return;
      agentLabelRefs[idx].el.remove();
      agentLabelRefs.splice(idx, 1);
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    }

    // Referencias y estado previo de cada etiqueta: el DOM solo se toca cuando algo cambia
    const _labelVec = new THREE.Vector3();
    const roomLabelRefs = [];
    const agentLabelRefs = [];
    let viewportHalfW = window.innerWidth / 2;
    let viewportHalfH = window.innerHeight / 2;

    const BUBBLE_CLASSES = {
      break: 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/95 border border-amber-400/70 text-amber-200 shadow-md whitespace-nowrap mb-1',
      working: 'px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-950/95 border border-cyan-500/60 text-cyan-200 shadow-md whitespace-nowrap mb-1',
      waiting_human: 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-900/95 border border-indigo-300 text-white shadow-md whitespace-nowrap mb-1',
      candidate: 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-950/95 border border-violet-400/70 text-violet-100 shadow-md whitespace-nowrap mb-1',
      meeting: 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/95 border border-blue-400/70 text-blue-100 shadow-md whitespace-nowrap mb-1',
      onboarding: 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-950/95 border border-sky-400/70 text-sky-100 shadow-md whitespace-nowrap mb-1',
      idle: 'px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-900/90 border border-slate-700 text-slate-300 shadow-md whitespace-nowrap mb-1'
    };

    function updateViewportCache() {
      viewportHalfW = window.innerWidth / 2;
      viewportHalfH = window.innerHeight / 2;
    }

    // Proyecta _labelVec y coloca la etiqueta; escribe estilos solo si cambian
    function placeLabel(ref, anchor) {
      _labelVec.project(camera);
      if (_labelVec.z > 1 || _labelVec.z < -1) {
        if (ref.visible !== false) {
          ref.el.style.visibility = 'hidden';
          ref.visible = false;
        }
        return;
      }
      const sx = Math.round(_labelVec.x * viewportHalfW + viewportHalfW);
      const sy = Math.round(-_labelVec.y * viewportHalfH + viewportHalfH);
      if (ref.visible !== true) {
        ref.el.style.visibility = 'visible';
        ref.visible = true;
      }
      if (sx !== ref.sx || sy !== ref.sy) {
        ref.sx = sx;
        ref.sy = sy;
        ref.el.style.transform = 'translate3d(' + sx + 'px, ' + sy + 'px, 0) translate(' + anchor + ')';
      }
    }

    function updateProjectedLabels() {
      camera.updateMatrixWorld();

      for (let i = 0; i < roomLabelRefs.length; i++) {
        const ref = roomLabelRefs[i];
        const zone = ref.zone;
        _labelVec.set(zone.x, 0.25, zone.z + zone.d / 2 - 0.55);
        placeLabel(ref, '-50%, -50%');
      }

      for (let i = 0; i < agentLabelRefs.length; i++) {
        const ref = agentLabelRefs[i];
        const agent = ref.agent;
        const m = agentMeshes[agent.id];
        if (!m) continue;

        if (ref.bubble !== agent.bubble) {
          ref.bubble = agent.bubble;
          ref.bubbleEl.textContent = agent.bubble;
        }
        if (ref.status !== agent.status) {
          ref.status = agent.status;
          ref.bubbleEl.className = BUBBLE_CLASSES[agent.status] || BUBBLE_CLASSES.idle;
        }

        m.headGroup.getWorldPosition(_labelVec);
        // a distancia solo se muestra el nombre: menos ruido visual y menos trabajo para el navegador
        const far = camera.position.distanceToSquared(_labelVec) > 1600;
        if (ref.far !== far) {
          ref.far = far;
          ref.bubbleEl.style.display = far ? 'none' : '';
        }
        _labelVec.y += far ? 0.22 : 0.3;
        placeLabel(ref, '-50%, -100%');
      }
    }

    // _______________________________________________________
    // 5. AUTONOMÍA DE CAFÉ / DESCANSO + PROYECTOS / AYUDA + ENTREGABLES
    // _______________________________________________________
    // Energía estable: se gasta despacio, se recarga en salas de descanso y después de cada descanso
    // hay un periodo de espera antes del siguiente (salvo que la energía esté en estado crítico).
    const ENERGY = {
      tickMs: 2600,
      drainWorking: 0.3,      // ~9-10 min de trabajo continuo para bajar de 92 a 30 (menos pausas)
      drainIdle: 0.35,
      drainMeeting: 0.45,
      breakAt: 30,            // umbral para pedir un descanso
      critical: 14,           // por debajo de esto se salta la espera y el límite de grupo
      fullAt: 92,             // energía con la que vuelve al trabajo
      floor: 8,
      minBreakMs: 25000,      // un descanso dura al menos 25 s
      cooldownMs: 180000,     // 3 min mínimos entre descansos…
      cooldownJitterMs: 90000, // …más hasta 1,5 min aleatorios para que no vayan todos juntos
      maxOnBreakRatio: 0.3,   // como mucho un 30% del equipo descansando a la vez
      mealEveryMs: 3600000    // cada ~60 min de juego les toca comer (antes cada 15: iban demasiado)
    };

    const BREAK_ZONES = {
      cafe: { rate: 4.2, weight: 3, label: '☕ En el Café', bubbles: ['☕ Tomando un café', '☕ Espresso en la barra'] },
      lounge: { rate: 3.4, weight: 2, label: '🛋️ Descansando', bubbles: ['🛋️ Descansando un rato', '🛋️ Pausa en el sofá'] },
      naturaleza: { rate: 4.8, weight: 3, label: '🌿 En el Jardín', bubbles: ['🌿 Respirando aire puro', '🧘 Meditando junto al estanque', '🦋 Mirando las mariposas', '🌳 Conectando con la naturaleza'] },
      comedor: { rate: 5.5, weight: 0, label: '🍽️ Almorzando', bubbles: ['🍽️ Almorzando', '🥗 Comiendo con el equipo', '🍲 Menú del día'] }
    };

    // Las salas de las oficinas vecinas usan "tipos" (cafe, descanso…) en vez de ids fijos
    const BREAK_KIND_ALIAS = { descanso: 'lounge' };
    function zoneKind(zid) {
      const z = ZONES[zid];
      return (z && z.kind) || zid;
    }
    function breakInfo(zid) {
      const k = zoneKind(zid);
      return BREAK_ZONES[BREAK_KIND_ALIAS[k] || k] || null;
    }
    function officeOf(agent) {
      return (agent && agent.officeId) || 'main';
    }

    function agentStamina(agent) {
      if (agent._stamina === undefined) agent._stamina = 0.8 + (officeHash(agent.id + '|stamina') % 1000) / 1000 * 0.45;
      return agent._stamina * rankStaminaBonus(agent); // los rangos altos aguantan algo más
    }

    // ¿Está ocupado con un paso de proyecto? (ver projects.js)
    function isMissionAgent(agent) {
      return isProjectAgent(agent);
    }

    function chooseBreakZone(agent, now) {
      if (agent.lastMealAt === undefined) agent.lastMealAt = now - Math.random() * ENERGY.mealEveryMs;
      if (officeOf(agent) !== 'main') {
        // oficina vecina: descansa en su propio café o zona de descanso
        const own = Object.values(ZONES).filter(z => z.office === agent.officeId && breakInfo(z.id)).map(z => z.id);
        return own.length ? randPick(own) : agent.homeZone;
      }
      const crowd = (zid) => AGENTS.filter(a => a.status === 'break' && a.currentZone === zid).length;
      if (now - agent.lastMealAt > ENERGY.mealEveryMs && crowd('comedor') < ZONES.comedor.spots.length) return 'comedor';
      const options = Object.keys(BREAK_ZONES).filter(z => BREAK_ZONES[z].weight > 0 && crowd(z) < Math.max(3, (ZONES[z].spots || []).length));
      let r = Math.random() * options.reduce((s, z) => s + BREAK_ZONES[z].weight, 0);
      for (const z of options) { r -= BREAK_ZONES[z].weight; if (r <= 0) return z; }
      return 'cafe';
    }

    function startBreak(agent, breakZone, manual = false) {
      const now = performance.now();
      const prevZone = agent.currentZone;
      agent.currentZone = breakZone;
      agent.targetPos = getWaypointForZone(breakZone, agent.id);
      agent.status = 'break';
      agent.breakMinUntil = now + ENERGY.minBreakMs;
      agent.bubble = randPick((breakInfo(breakZone) || BREAK_ZONES.cafe).bubbles);
      spawnDataPacket(prevZone, breakZone, 0xfbbf24);
      pushActivity(`${agent.name} ${manual ? 'fue enviado/a' : 'fue'} a ${ZONES[breakZone].name} para recargar energía.`, 'DESCANSO');
    }

    function endBreak(agent, now) {
      const prevZone = agent.currentZone;
      if (prevZone === 'comedor') agent.lastMealAt = now;
      agent.cooldownUntil = now + ENERGY.cooldownMs + Math.random() * ENERGY.cooldownJitterMs;
      agent.currentZone = agent.homeZone;
      agent.targetPos = getWaypointForZone(agent.homeZone, agent.id);
      agent.status = 'working';
      agent.bubble = 'Recargado · de vuelta';
      agent.nextTaskAt = now + 8000;
      spawnDataPacket(prevZone, agent.homeZone, agent.color);
      pushActivity(`${agent.name} recargó energía y volvió a ${ZONES[agent.homeZone].name}.`, 'ENERGÍA');
    }

    function energyTick() {
      const now = performance.now();
      const staff = AGENTS.filter(a => a.type !== 'HUMAN' && a.type !== 'CANDIDATE' && !a.leaving);
      // el límite de gente descansando a la vez se calcula por oficina
      const onBreakBy = {}, sizeBy = {};
      staff.forEach(a => {
        const o = officeOf(a);
        sizeBy[o] = (sizeBy[o] || 0) + 1;
        if (a.status === 'break') onBreakBy[o] = (onBreakBy[o] || 0) + 1;
      });
      let changed = false;

      staff.forEach(agent => {
        if (agent.status === 'onboarding') return;
        const office = officeOf(agent);
        if (agent.status === 'break') {
          // solo recarga cuando ya llegó a la sala de descanso
          if (isAgentArrived(agent)) {
            const rate = (breakInfo(agent.currentZone) || BREAK_ZONES.cafe).rate;
            agent.energy = Math.min(100, agent.energy + rate);
          }
          if (agent.energy >= ENERGY.fullAt && now >= (agent.breakMinUntil || 0)) {
            endBreak(agent, now);
            onBreakBy[office]--;
            changed = true;
          }
          return;
        }

        const drain = agent.status === 'meeting' ? ENERGY.drainMeeting : agent.status === 'working' ? ENERGY.drainWorking : ENERGY.drainIdle;
        agent.energy = Math.max(ENERGY.floor, agent.energy - drain / agentStamina(agent));
        // experiencia por tiempo trabajado (rangos)
        if (agent.status === 'working') grantXp(agent, 1);
        else if (agent.status === 'meeting') grantXp(agent, 1.5);
        if (agent.status === 'meeting' || agent.status === 'waiting_human' || isMissionAgent(agent)) return;

        const critical = agent.energy <= ENERGY.critical;
        const rested = now >= (agent.cooldownUntil || 0);
        const maxOnBreak = Math.max(2, Math.floor((sizeBy[office] || 1) * ENERGY.maxOnBreakRatio));
        if (agent.energy <= ENERGY.breakAt && (rested || critical) && ((onBreakBy[office] || 0) < maxOnBreak || critical)) {
          startBreak(agent, chooseBreakZone(agent, now));
          onBreakBy[office] = (onBreakBy[office] || 0) + 1;
          changed = true;
        }
      });

      updateServiceStaff(now);
      if (changed && activeTab === 'team') renderPanel();
    }

    // Rutinas del personal de servicio: limpieza recorre las salas, cocina alterna fogones y buffet
    function updateServiceStaff(now) {
      AGENTS.forEach(a => {
        if (a.status !== 'working' || a.leaving || a.type === 'CANDIDATE') return;
        if (a.homeZone !== 'limpieza' && a.homeZone !== 'cocina') return;
        if (!isAgentArrived(a)) return;
        if (a.nextTaskAt === undefined) a.nextTaskAt = now + 5000 + Math.random() * 8000;
        if (now < a.nextTaskAt) return;
        a.taskCount = (a.taskCount || 0) + 1;
        if (a.homeZone === 'limpieza') {
          a.nextTaskAt = now + 22000 + Math.random() * 18000;
          if (a.taskCount % 4 === 0) {
            a.currentZone = 'limpieza';
            a.targetPos = getWaypointForZone('limpieza', a.id);
            a.bubble = '🧺 Reponiendo materiales';
          } else {
            const pool = ['banos', 'banos', 'comedor', 'comedor', 'cocina', 'reception', 'naturaleza', 'cafe', 'lounge', 'meeting', 'practica',
              'games', 'apps', 'software', 'help_desk', 'qa_lab', 'programacion', 'mecatronica', 'formacion', 'director_hub'];
            const zid = randPick(pool);
            a.currentZone = zid;
            a.targetPos = randomFreePointInZone(zid, a.id);
            a.bubble = '🧹 Limpiando ' + ZONES[zid].name.replace(/^\S+\s/, '');
          }
        } else {
          a.nextTaskAt = now + 28000 + Math.random() * 16000;
          if (a.taskCount % 2 === 0) {
            a.currentZone = 'comedor';
            const busy = AGENTS.some(o => o.id !== a.id && o.targetPos && Math.hypot(o.targetPos.x - BUFFET_SPOT[0], o.targetPos.z - BUFFET_SPOT[1]) < 0.5);
            a.targetPos = busy ? randomFreePointInZone('comedor', a.id) : spotToTarget(BUFFET_SPOT);
            a.bubble = '🍽️ Sirviendo el buffet';
          } else {
            a.currentZone = 'cocina';
            a.targetPos = getWaypointForZone('cocina', a.id);
            a.bubble = randPick(['🍳 Cocinando el menú', '🥘 Preparando la comida', '🔪 Cortando verduras']);
          }
        }
      });
    }

    function startAutonomousFloorEngine() {
      const now = performance.now();
      // reparte la hora del último almuerzo y del último descanso para que no coincidan todos
      AGENTS.forEach(a => {
        a.lastMealAt = now - Math.random() * ENERGY.mealEveryMs;
        a.cooldownUntil = now + Math.random() * 60000;
      });
      setInterval(energyTick, ENERGY.tickMs);
    }

    function sendAgentToBreak(agentId, breakZone) {
      const agent = AGENTS.find(a => a.id === agentId);
      if (!agent || agent.type === 'HUMAN' || agent.type === 'CANDIDATE' || agent.leaving) return;
      // en una oficina vecina, "Café"/"Descansar"/"Jardín" usan sus propias salas
      if (officeOf(agent) !== 'main') {
        const kind = breakZone === 'lounge' || breakZone === 'naturaleza' ? 'descanso' : 'cafe';
        breakZone = agent.officeId + '_' + kind;
        if (!ZONES[breakZone]) return;
      }
      startBreak(agent, breakZone, true);
      showToast(`${agent.name} enviado a ${ZONES[breakZone].name}`);
      renderPanel();
    }

    // ---- Reuniones convocadas por el Director (hasta 15 asistentes + cabecera) ----
    const MEETING = { active: null };
    const MEETING_DURATION_MS = 45000;

    function convokeMeeting(zoneId) {
      const zone = ZONES[zoneId];
      if (!zone || !zone.boardroom) return;
      if (MEETING.active) { showToast('Ya hay una reunión en curso.'); return; }
      const office = zone.office || 'main';
      const pool = AGENTS.filter(a => a.type !== 'HUMAN' && a.type !== 'CANDIDATE' && !a.leaving && officeOf(a) === office &&
        !['break', 'waiting_human', 'onboarding'].includes(a.status) && !isMissionAgent(a));
      pool.sort((a, b) => (b.status === 'working') - (a.status === 'working'));
      const attendees = pool.slice(0, zone.spots.length - 1);
      if (!attendees.length) { showToast('No hay miembros disponibles para reunirse ahora.'); return; }
      attendees.forEach((a, i) => {
        a.preMeetingStatus = a.status;
        a.status = 'meeting';
        a.currentZone = zoneId;
        a.targetPos = spotToTarget(zone.spots[i + 1]);
        a.bubble = '📊 En reunión';
      });
      const dir = AGENTS.find(a => a.id === (office === 'main' ? 'human_dir' : office + '_dir'));
      if (dir) {
        dir.currentZone = zoneId;
        dir.targetPos = spotToTarget(zone.spots[0]);
        dir.bubble = '🎤 Presentando';
        if (dir === activeDirector()) {
          const badge = document.getElementById('user-zone-badge');
          if (badge) badge.textContent = zone.name;
        }
      }
      MEETING.active = { zone: zoneId, director: dir ? dir.id : null, endsAt: performance.now() + MEETING_DURATION_MS, attendees: attendees.map(a => a.id) };
      pushActivity(`Convocaste una reunión en ${zone.name} con ${attendees.length} miembros.`, 'REUNIÓN');
      showToast(`📊 Reunión en ${zone.name}: ${attendees.length} asistentes`);
      renderPanel();
    }

    function endMeeting() {
      if (!MEETING.active) return;
      const zone = ZONES[MEETING.active.zone];
      MEETING.active.attendees.forEach(id => {
        const a = AGENTS.find(x => x.id === id);
        if (!a || a.leaving || a.status !== 'meeting') return;
        a.status = 'working';
        a.currentZone = a.homeZone;
        a.targetPos = getWaypointForZone(a.homeZone, a.id);
        a.bubble = 'Volviendo con nuevas ideas';
        grantXp(a, 15);
      });
      const dir = AGENTS.find(a => a.id === MEETING.active.director);
      if (dir) dir.bubble = 'Reunión terminada';
      pushActivity(`Terminó la reunión en ${zone.name}.`, 'REUNIÓN');
      showToast(`Reunión terminada en ${zone.name}`);
      MEETING.active = null;
      renderPanel();
    }

    function callAgentBackToDesk(agentId) {
      const agent = AGENTS.find(a => a.id === agentId);
      if (!agent || agent.type === 'HUMAN' || agent.type === 'CANDIDATE' || agent.leaving) return;
      const prevZone = agent.currentZone;
      agent.currentZone = agent.homeZone;
      agent.targetPos = getWaypointForZone(agent.homeZone, agent.id);
      agent.status = 'working';
      agent.bubble = 'Trabajando en su estación';
      spawnDataPacket(prevZone, agent.homeZone, agent.color);
      pushActivity(`${agent.name} regresó a ${ZONES[agent.homeZone].name}.`, 'TRABAJO');
      renderPanel();
    }

    // Director que controlas ahora mismo (tu avatar o el de la oficina vecina activa)
    function activeDirector() {
      const id = ACTIVE_OFFICE === 'main' ? 'human_dir' : ACTIVE_OFFICE + '_dir';
      return AGENTS.find(a => a.id === id) || AGENTS.find(a => a.id === 'human_dir');
    }

    function moveDirectorTo(zoneId) {
      const dir = activeDirector();
      const zone = ZONES[zoneId];
      if (!dir || !zone) return;
      dir.currentZone = zoneId;
      dir.targetPos = getWaypointForZone(zoneId, dir.id);
      dir.bubble = `En ${zone.name}`;
      document.getElementById('user-zone-badge').textContent = zone.name;
      pushActivity(`Te moviste a ${zone.name}.`, 'DIRECTOR');
      showToast(`Movido a ${zone.name}`);
    }
