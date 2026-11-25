    // _____________________________________________________________________
    // MODO DIRECTOR 3D: controlas a tu Director en tercera persona.
    //  - WASD / flechas: caminar (relativo a la cámara) · Shift: correr
    //  - Arrastrar con el ratón: girar la cámara · Rueda: acercar / alejar
    //  - E: hablar con el empleado más cercano (o usar la sala en la que estás)
    //  - Clic en el suelo de una sala: ir caminando solo · Esc o V: salir
    // La interfaz se oculta para dejar la vista limpia.
    // _____________________________________________________________________
    const DIR3D = {
      active: false, keys: new Set(), vel: { x: 0, z: 0 }, walk: 3.4, run: 6.2, radius: 0.28,
      saved: null, lastPos: null, near: null, hintTimer: null, lastZone: null
    };
    const DIR3D_KEYS = { w: 'f', arrowup: 'f', s: 'b', arrowdown: 'b', a: 'l', arrowleft: 'l', d: 'r', arrowright: 'r' };

    function typingInField(e) {
      const t = e.target;
      return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    }

    function toggleDirector3D(force) {
      const on = force === undefined ? !DIR3D.active : !!force;
      if (on === DIR3D.active) return;
      const dir = activeDirector();
      if (!dir) return;
      if (on) {
        DIR3D.active = true;
        DIR3D.saved = {
          pos: camera.position.clone(), target: controls.target.clone(),
          min: controls.minDistance, max: controls.maxDistance, pan: controls.enablePan, polar: controls.maxPolarAngle, mode: cameraMode
        };
        cameraMode = 'director3d';
        controls.minDistance = 2.6;
        controls.maxDistance = 16;
        controls.enablePan = false;
        controls.maxPolarAngle = Math.PI / 2 - 0.12;
        const yaw = dir.yaw || 0;
        controls.target.set(dir.pos.x, 1.25, dir.pos.z);
        camera.position.set(dir.pos.x - Math.sin(yaw) * 6.2, 3.9, dir.pos.z - Math.cos(yaw) * 6.2);
        DIR3D.lastPos = { x: dir.pos.x, z: dir.pos.z };
        FRAME_HOOKS.cameraDirect = true;
        document.body.classList.add('mode-3d');
        closeDockPanel();
        showDir3dHint(true);
      } else {
        DIR3D.active = false;
        DIR3D.keys.clear();
        dir._manual = false;
        dir._manualMoving = false;
        FRAME_HOOKS.cameraDirect = false;
        const s = DIR3D.saved;
        if (s) {
          controls.minDistance = s.min;
          controls.maxDistance = s.max;
          controls.enablePan = s.pan;
          controls.maxPolarAngle = s.polar;
          desiredCameraTarget.set(dir.pos.x, 0.8, dir.pos.z);
          camera.position.set(dir.pos.x + 10, 16, dir.pos.z + 18);
        }
        cameraMode = 'overview';
        document.body.classList.remove('mode-3d');
        showDir3dHint(false);
        setNearPrompt(null);
      }
      const btn = document.getElementById('dock-3d');
      if (btn) btn.classList.toggle('on', DIR3D.active);
    }

    function showDir3dHint(show) {
      const el = document.getElementById('dir3d-hint');
      if (!el) return;
      clearTimeout(DIR3D.hintTimer);
      el.classList.toggle('hidden', !show);
      el.classList.remove('faded');
      if (show) DIR3D.hintTimer = setTimeout(() => el.classList.add('faded'), 6000);
    }

    function setNearPrompt(text) {
      const el = document.getElementById('dir3d-prompt');
      if (!el) return;
      el.textContent = text || '';
      el.classList.toggle('hidden', !text);
    }

    function zoneAt(x, z) {
      let best = null, area = Infinity;
      for (const id in ZONES) {
        const zn = ZONES[id];
        if (Math.abs(x - zn.x) <= zn.w / 2 && Math.abs(z - zn.z) <= zn.d / 2 && zn.w * zn.d < area) { best = id; area = zn.w * zn.d; }
      }
      return best;
    }

    function freeAt(x, z) {
      const r = DIR3D.radius;
      return isFreeWorld(x, z) && isFreeWorld(x + r, z) && isFreeWorld(x - r, z) && isFreeWorld(x, z + r) && isFreeWorld(x, z - r);
    }

    function nearestAgentTo(dir) {
      let best = null, bd = 1.9;
      for (const a of AGENTS) {
        if (a === dir || a.leaving || a.type === 'HUMAN') continue;
        const d = Math.hypot(a.pos.x - dir.pos.x, a.pos.z - dir.pos.z);
        if (d < bd) { bd = d; best = a; }
      }
      return best;
    }

    function director3dStep(dt) {
      if (!DIR3D.active) return;
      const dir = activeDirector();
      if (!dir) return;
      const k = DIR3D.keys;
      let ix = 0, iz = 0;
      if (k.has('f')) iz += 1;
      if (k.has('b')) iz -= 1;
      if (k.has('l')) ix -= 1;
      if (k.has('r')) ix += 1;
      const wantMove = ix !== 0 || iz !== 0;

      // ejes de la cámara proyectados en el suelo
      let fx = controls.target.x - camera.position.x, fz = controls.target.z - camera.position.z;
      const fl = Math.hypot(fx, fz) || 1;
      fx /= fl; fz /= fl;
      const rx = -fz, rz = fx;
      let dx = fx * iz + rx * ix, dz = fz * iz + rz * ix;
      const dl = Math.hypot(dx, dz);
      if (dl > 0) { dx /= dl; dz /= dl; }
      const speed = k.has('run') ? DIR3D.run : DIR3D.walk;
      const blend = 1 - Math.exp(-(wantMove ? 11 : 14) * dt);
      DIR3D.vel.x += (dx * speed * (wantMove ? 1 : 0) - DIR3D.vel.x) * blend;
      DIR3D.vel.z += (dz * speed * (wantMove ? 1 : 0) - DIR3D.vel.z) * blend;
      const v = Math.hypot(DIR3D.vel.x, DIR3D.vel.z);

      if (wantMove || v > 0.15) {
        // control manual: cancela cualquier ruta automática
        dir._manual = true;
        let nx = dir.pos.x + DIR3D.vel.x * dt, nz = dir.pos.z + DIR3D.vel.z * dt;
        // se desliza por las paredes probando cada eje por separado
        // (si arranca sentado dentro de un mueble, se le deja salir sin bloquearlo)
        const stuck = !freeAt(dir.pos.x, dir.pos.z);
        if (!stuck && !freeAt(nx, nz)) {
          if (freeAt(nx, dir.pos.z)) { nz = dir.pos.z; DIR3D.vel.z *= 0.3; }
          else if (freeAt(dir.pos.x, nz)) { nx = dir.pos.x; DIR3D.vel.x *= 0.3; }
          else { nx = dir.pos.x; nz = dir.pos.z; DIR3D.vel.x = DIR3D.vel.z = 0; }
        }
        dir.pos.x = nx;
        dir.pos.z = nz;
        const goal = { x: nx, z: nz };
        dir.targetPos = goal;
        dir._navGoal = goal;
        dir.path = [];
        dir.pathIndex = 0;
        dir._manualMoving = v > 0.35;
        if (v > 0.2) {
          const want = Math.atan2(DIR3D.vel.x, DIR3D.vel.z);
          let diff = want - dir.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          dir.yaw += diff * Math.min(1, 14 * dt);
        }
        const zid = zoneAt(nx, nz);
        if (zid && zid !== dir.currentZone) {
          dir.currentZone = zid;
          const badge = document.getElementById('user-zone-badge');
          if (badge) badge.textContent = ZONES[zid].name;
          dir.bubble = 'En ' + ZONES[zid].name;
        }
      } else {
        dir._manual = false; // deja que una ruta automática (clic en una sala, entrevista…) lo mueva
        dir._manualMoving = false;
      }

      // la cámara acompaña al Director sin perder el ángulo elegido
      const ddx = dir.pos.x - DIR3D.lastPos.x, ddz = dir.pos.z - DIR3D.lastPos.z;
      camera.position.x += ddx;
      camera.position.z += ddz;
      controls.target.set(dir.pos.x, 1.25, dir.pos.z);
      DIR3D.lastPos.x = dir.pos.x;
      DIR3D.lastPos.z = dir.pos.z;

      const near = nearestAgentTo(dir);
      if (near !== DIR3D.near) {
        DIR3D.near = near;
        setNearPrompt(near ? `E · Hablar con ${near.name.replace(/ IA$/, '')}` : null);
      }
    }

    function director3dInteract() {
      const dir = activeDirector();
      const a = DIR3D.near;
      if (a && a.type === 'CANDIDATE') { toggleDirector3D(false); openSidePanel(); RECRUIT.highlight = a.id; switchTab('recruit'); return; }
      if (a) {
        a.yaw = Math.atan2(dir.pos.x - a.pos.x, dir.pos.z - a.pos.z);
        openVoiceRoom({
          kind: 'meeting', title: 'Charla con ' + a.name.replace(/ IA$/, ''), subtitle: a.role,
          participants: [agentParticipant(a)],
          greeting: [{ id: a.id, text: randPick(['¡Hola! ¿En qué te ayudo?', 'Dime, ¿qué necesitas?', `Hola, ${COMPANY.independent ? COMPANY.owner : 'Director'}. Aquí estoy.`]) }],
          onUserSay: meetingReplies
        });
        return;
      }
      const z = dir.currentZone;
      if (ZONES[z] && ZONES[z].boardroom && !MEETING.active) convokeMeeting(z);
      else if (z === 'interview' || z === 'reception') { toggleDirector3D(false); openSidePanel(); switchTab('recruit'); }
      else showToast('Acércate a alguien para hablar (E)');
    }

    window.addEventListener('keydown', (e) => {
      if (typingInField(e)) return;
      const key = e.key.toLowerCase();
      if (!DIR3D.active) {
        if (key === 'v' && !e.ctrlKey && !e.metaKey && !e.altKey) toggleDirector3D(true);
        return;
      }
      if (key === 'escape' || key === 'v') { toggleDirector3D(false); e.preventDefault(); return; }
      if (key === 'shift') DIR3D.keys.add('run');
      if (DIR3D_KEYS[key]) { DIR3D.keys.add(DIR3D_KEYS[key]); e.preventDefault(); }
      if (key === 'e' && !e.repeat) director3dInteract();
    });
    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'shift') DIR3D.keys.delete('run');
      if (DIR3D_KEYS[key]) DIR3D.keys.delete(DIR3D_KEYS[key]);
    });
    window.addEventListener('blur', () => DIR3D.keys.clear());
