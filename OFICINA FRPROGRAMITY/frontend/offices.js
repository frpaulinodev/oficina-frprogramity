    // _____________________________________________________________________
    // EMPRESAS DE FAMILIARES: cada familiar crea su propia empresa INDEPENDIENTE.
    // - Se abre en su propio enlace (?empresa=<id>) con sus datos separados de los tuyos.
    // - En tu oficina solo se ve su edificio al otro lado de la calle (vecino), sin mezclar proyectos.
    // Sin servidor: se guarda en este navegador y se comparte con un código para copiar/pegar.
    // _____________________________________________________________________
    let ACTIVE_OFFICE = 'main';
    const GUEST_OFFICES = [];
    const OFFICES_KEY = 'frp_offices_v1';
    const GUEST_SLOTS_X = [-24, 8];   // dos terrenos frente a tu oficina
    const GUEST_OZ = 35.5;            // fachada de las oficinas vecinas (la calle está en z 28.8..33.7)
    const GUEST_ROOTS = {};
    const LOT_SIGNS = {};
    const OFFICE_UI = { confirmDelete: null, confirmTimer: null, exportCode: '', form: { color: 0, specialty: 'tecnologia', size: 4 } };
    NAV.maxZ = 52.4; // la rejilla de navegación cubre también los terrenos de enfrente

    const OFFICE_COLORS = [
      { hex: 0x22d3ee, css: '#22d3ee', name: 'Cian' },
      { hex: 0xa78bfa, css: '#a78bfa', name: 'Violeta' },
      { hex: 0xf472b6, css: '#f472b6', name: 'Rosa' },
      { hex: 0x34d399, css: '#34d399', name: 'Verde' },
      { hex: 0xfbbf24, css: '#fbbf24', name: 'Ámbar' },
      { hex: 0xf87171, css: '#f87171', name: 'Coral' }
    ];
    const OFFICE_SPECIALTIES = {
      tecnologia: { label: '💻 Tecnología', roles: ['Desarrollador/a Web', 'Diseñador/a UI', 'QA Tester', 'Project Manager', 'DevOps', 'Analista de Datos'] },
      creativa: { label: '🎨 Agencia Creativa', roles: ['Diseñador/a Gráfico', 'Ilustrador/a', 'Community Manager', 'Editor/a de Video', 'Copywriter', 'Director/a de Arte'] },
      negocios: { label: '📈 Negocios', roles: ['Asesor/a Comercial', 'Contador/a', 'Analista Financiero', 'Recursos Humanos', 'Atención al Cliente', 'Gerente de Ventas'] },
      educacion: { label: '📚 Educación', roles: ['Profesor/a', 'Tutor/a', 'Diseñador/a Instruccional', 'Coordinador/a Académico', 'Asistente', 'Investigador/a'] }
    };
    const GUEST_NAMES = ['Ana', 'Pablo', 'Mía', 'Andrea', 'Luis', 'Valeria', 'Óscar', 'Camilo', 'Elisa', 'Ramiro', 'Clara', 'Fabián', 'Inés', 'Jorge', 'Luna', 'Manuel', 'Nora', 'Pedro', 'Rocío', 'Teo'];

    const cleanName = (v, n) => String(v == null ? '' : v).replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);

    function officeName(id) {
      if (!id || id === 'main') return BRAND;
      const o = GUEST_OFFICES.find(x => x.id === id);
      return o ? o.name : 'Oficina';
    }

    function guestOffice(id) {
      return GUEST_OFFICES.find(o => o.id === id) || null;
    }

    // ---- Terrenos al otro lado de la calle ----
    function buildAcrossStreet() {
      const grass = makeOfficeTexture('grass', 256, 256, drawGrass, { seed: 717, color: true });
      const ground = new THREE.Mesh(cachedGeo('Box', 86, 0.3, 24), new THREE.MeshStandardMaterial({ map: officeTexRepeat(grass, 43, 12), roughness: 1 }));
      ground.position.set(-17, -0.16, 46);
      ground.receiveShadow = true;
      scene.add(ground);
      const curb = new THREE.Mesh(cachedGeo('Box', 83, 0.14, 0.3), OFFICE_MAT.potConcrete);
      curb.position.set(-16.5, 0.02, 33.9);
      scene.add(curb);
      const walk = new THREE.Mesh(cachedGeo('Box', 83, 0.06, 1.4), new THREE.MeshStandardMaterial({ color: new THREE.Color(0x9aa1ab).convertSRGBToLinear(), roughness: 0.92 }));
      walk.position.set(-16.5, 0.0, 34.75);
      walk.receiveShadow = true;
      scene.add(walk);
      [-52, -44, -6.5, 24].forEach((tx, i) => buildTree(tx, 37 + (i % 2) * 6, 1.3, false));
      GUEST_SLOTS_X.forEach((x, slot) => buildLotSign(slot));
    }

    function buildLotSign(slot) {
      if (LOT_SIGNS[slot]) return;
      const g = new THREE.Group();
      g.userData.mergeRoot = true; // no se fusiona: se quita al construir en el terreno
      const real = scene;
      scene = g;
      try {
        const x = GUEST_SLOTS_X[slot];
        buildSignPanel('lot_sign_' + slot, x, 1.6, GUEST_OZ + 2, 3.2, 0.9, Math.PI, 'TERRENO LIBRE', 'CREA AQUÍ TU OFICINA', '#94a3b8');
        [-1.4, 1.4].forEach(dx => addPart(scene, officeBox(0.08, 1.2, 0.08), OFFICE_MAT.aluminium, x + dx, 0.6, GUEST_OZ + 2.05));
        const outline = new THREE.Mesh(cachedGeo('Box', 26, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0x64748b, transparent: true, opacity: 0.25, depthWrite: false }));
        outline.position.set(x, 0.01, GUEST_OZ + 8);
        scene.add(outline);
      } finally { scene = real; }
      scene.add(g);
      LOT_SIGNS[slot] = g;
    }

    function removeLotSign(slot) {
      const g = LOT_SIGNS[slot];
      if (!g) return;
      scene.remove(g);
      delete LOT_SIGNS[slot];
    }

    // ---- Salas de una oficina vecina (coordenadas relativas a su terreno) ----
    function guestZonesFor(office) {
      const ox = GUEST_SLOTS_X[office.slot], oz = GUEST_OZ;
      const col = OFFICE_COLORS[office.color] || OFFICE_COLORS[0];
      const P = (s) => [ox + s[0], oz + s[1], s[2], s[3]];
      const mk = (kind, name, subtitle, x1, x2, z1, z2, doors, skip, spots, extra = {}) => Object.assign({
        id: office.id + '_' + kind, kind, office: office.id, name, subtitle,
        x: ox + (x1 + x2) / 2, z: oz + (z1 + z2) / 2, w: x2 - x1, d: z2 - z1,
        color: col.hex, cssColor: col.css,
        doors: doors.map(d => ({ side: d[0], at: (d[0] === 'n' || d[0] === 's' ? ox : oz) + d[1], width: d[2] })),
        skipWalls: skip,
        spots: spots.map(P)
      }, extra);
      const deskSeats = [];
      [-10.3, -6.8, -3.3].forEach(x => [9.6, 12.9].forEach(z => deskSeats.push([x, z + 0.85, PI, 1])));
      const zones = [
        mk('recepcion', '🛎️ Recepción', 'Bienvenida de la oficina', -4, 4, 0, 5, [['s', 0, 1.8]], ['n'],
          [[0, 2.85, PI, 1], [2.6, 3.8, -PI / 2], [-2.6, 3.8, PI / 2]]),
        mk('descanso', '🛋️ Descanso', 'Sofá con vista a la calle', -13, -4, 0, 5, [['s', -5.5, 1.6]], ['n', 'w', 'e'],
          [[-10.9, 2.3, PI / 2], [-7.1, 2.3, -PI / 2], [-9.0, 1.2, 0], [-12.0, 1.2, PI * 0.25]]),
        mk('cafe', '☕ Café', 'Barra de café de la oficina', 4, 13, 0, 5, [['s', 5.5, 1.6]], ['n', 'w', 'e'],
          [[7.5, 3.05, 0], [9.0, 3.05, 0], [10.5, 3.05, 0], [6.0, 1.6, PI * 0.75], [12.0, 1.4, -PI * 0.75]]),
        mk('trabajo', '💼 Área de Trabajo', 'Escritorios del equipo', -13, 3, 7, 16, [['n', -5.5, 1.8]], ['w', 's'],
          [[0.6, 15.2, PI, 1], ...deskSeats, [-12.2, 8.0, PI * 0.75], [1.8, 8.2, -PI / 2]], { reserved0: true }),
        mk('reuniones', '📊 Sala de Reuniones', 'Mesa para 7 + Director', 3, 13, 7, 16, [['n', 5.2, 1.6]], ['w', 'e', 's'],
          [], { boardroom: { head: 1, perSide: 3 } })
      ];
      const meet = zones[4];
      meet.spots = boardroomSpots(meet);
      return zones;
    }

    function buildZonePad(zone) {
      const pad = new THREE.Mesh(cachedGeo('Plane', zone.w, zone.d), new THREE.MeshStandardMaterial({ color: zone.color, transparent: true, opacity: 0.1, roughness: 0.6, depthWrite: false }));
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(zone.x, 0.02, zone.z);
      pad.userData.zoneId = zone.id;
      scene.add(pad);
      zoneFloorMeshes[zone.id] = pad;
      const line = new THREE.LineSegments(new THREE.EdgesGeometry(cachedGeo('Box', zone.w, 0.04, zone.d)), new THREE.LineBasicMaterial({ color: zone.color, transparent: true, opacity: 0.55 }));
      line.position.set(zone.x, 0.03, zone.z);
      scene.add(line);
    }

    function buildGuestFurniture(office, zones) {
      const ox = GUEST_SLOTS_X[office.slot], oz = GUEST_OZ;
      const col = OFFICE_COLORS[office.color] || OFFICE_COLORS[0];
      const X = (x) => ox + x, Z = (z) => oz + z;

      // piso, fachada y salas
      const floorMat = OFFICE_MAT.laminate.clone();
      floorMat.map = officeTexRepeat(OFFICE_MAT.laminate.map, 13, 8);
      floorMat.bumpMap = officeTexRepeat(OFFICE_MAT.laminate.bumpMap, 13, 8);
      floorMat.roughnessMap = floorMat.bumpMap;
      const floor = new THREE.Mesh(cachedGeo('Box', 26, 0.3, 16), floorMat);
      floor.position.set(ox, -0.149, oz + 8);
      floor.receiveShadow = true;
      scene.add(floor);
      buildWallWithDoors(X(-13), Z(0), X(13), Z(0), [{ at: ox, width: 2.4 }], 'facade');
      buildWallWithDoors(X(-13), Z(0), X(-13), Z(16), [], 'facade');
      buildWallWithDoors(X(13), Z(0), X(13), Z(16), [], 'facade');
      buildWallWithDoors(X(-13), Z(16), X(13), Z(16), [], 'facade');
      zones.forEach(z => { buildRoomWalls(z); buildZonePad(z); });
      buildSignPanel('sign_' + office.id, ox, 3.75, Z(-0.1), 4.6, 1.0, Math.PI, office.name.toUpperCase(), ('OFICINA DE ' + office.owner).toUpperCase(), col.css);
      addPart(scene, officeBox(2.6, 0.012, 1.2), OFFICE_MAT.bezel, ox, 0.006, Z(-0.8), { cast: false });

      // recepción
      buildOfficeDesk(X(0), Z(2.0), 2.6, 0.8, OFFICE_MAT.marble, { height: 1.0, panel: false });
      buildMonitor(X(-0.5), 1.0, Z(2.15), 0.6, 0.36, 'tickets', {});
      buildOfficeChair(X(0), Z(2.85), Math.PI, { seatMat: OFFICE_MAT.mesh });
      buildSignPanel('sign_in_' + office.id, X(-2.0), 1.7, Z(4.9), 2.0, 0.6, Math.PI, office.name.toUpperCase(), 'BIENVENIDOS', col.css);
      buildPlant(X(3.4), Z(0.6), 1.0);
      buildPlant(X(-3.4), Z(0.6), 1.0);

      // descanso
      buildSofa(X(-9.0), Z(3.7), Math.PI, OFFICE_MAT.sofaFabric, 2.4);
      buildOfficeDesk(X(-9.0), Z(2.3), 1.2, 0.6, OFFICE_MAT.walnut, { height: 0.4, panel: false });
      buildPlant(X(-12.4), Z(4.4), 1.1);

      // café
      buildOfficeDesk(X(9.0), Z(3.9), 5.0, 0.7, OFFICE_MAT.walnutSlats, { height: 0.95, panel: false });
      addPart(scene, officeBox(0.7, 0.42, 0.45), OFFICE_MAT.steel, X(8.0), 1.16, Z(4.05));
      [7.5, 9.0, 10.5].forEach(x => { buildBarStool(X(x), Z(3.25)); buildCup(scene, X(x + 0.2), 0.95, Z(3.75), { saucer: true, accent: col.hex }); });
      buildPlant(X(12.4), Z(4.4), 0.9);

      // área de trabajo: 6 escritorios + escritorio del Director
      [-10.3, -6.8, -3.3].forEach((x, i) => [9.6, 12.9].forEach((z, j) => {
        buildOfficeDesk(X(x), Z(z), 2.2, 1.0, (i + j) % 2 ? OFFICE_MAT.oak : OFFICE_MAT.whiteSatin, { glow: col.hex });
        buildMonitor(X(x), 0.75, Z(z - 0.25), 1.0, 0.5, ['code', 'app', 'kanban', 'kpi'][(i + j) % 4], {});
        buildKeyboardAndMouse(X(x - 0.08), 0.75, Z(z + 0.25));
        buildOfficeChair(X(x), Z(z + 0.85), Math.PI);
      }));
      buildOfficeDesk(X(0.6), Z(14.4), 2.0, 0.9, OFFICE_MAT.walnut, { height: 0.78, panelMat: OFFICE_MAT.walnutSlats });
      buildMonitor(X(0.4), 0.78, Z(14.2), 0.9, 0.45, 'kpi', {});
      buildOfficeChair(X(0.6), Z(15.2), Math.PI, { tall: true, seatMat: OFFICE_MAT.blackLeather, accent: col.hex });
      buildWallDisplay(X(-5.0), 1.6, Z(15.9), 3.2, 1.3, 'kanban', Math.PI, false);
      buildPlant(X(-12.4), Z(15.4), 1.1);
      buildPlant(X(2.4), Z(7.6), 0.9);

      // sala de reuniones
      buildBoardroom(zones[4]);
    }

    // Crea la geometría, las salas y (opcionalmente) el equipo de una oficina vecina
    function buildGuestOfficeWorld(office) {
      removeLotSign(office.slot);
      const zones = guestZonesFor(office);
      zones.forEach(z => { ZONES[z.id] = z; });
      const root = new THREE.Group();
      root.userData.mergeRoot = true;
      root.userData.officeId = office.id;
      const real = scene;
      BUILD_TAG = office.id;
      scene = root;
      try {
        buildGuestFurniture(office, zones);
      } finally {
        scene = real;
        BUILD_TAG = null;
      }
      scene.add(root);
      GUEST_ROOTS[office.id] = root;
      mergeStaticRoot(root, new Set(DOOR_LEAVES));
      mergeDoorLeaves();
      return zones;
    }

    function guestAgentsFor(office) {
      const col = OFFICE_COLORS[office.color] || OFFICE_COLORS[0];
      const base = new THREE.Color(col.hex);
      const list = [{
        id: office.id + '_dir', name: office.owner + ' (Director)', role: 'Dirección · ' + office.name, type: 'HUMAN',
        color: col.hex, outfitColor: 0x1e293b, homeZone: office.id + '_trabajo', homeSpot: 0,
        task: 'Dirigir la oficina y aprobar proyectos', inputSpec: 'Ideas y propuestas del equipo', outputSpec: 'Decisiones y proyectos aprobados',
        tools: ['Roadmap', 'Aprobaciones', 'Reuniones']
      }];
      office.team.forEach((m, i) => {
        const tint = base.clone().offsetHSL((i * 0.09) % 0.5 - 0.2, 0, (i % 2 ? -0.08 : 0.05));
        list.push({
          id: m.id, name: m.name, role: m.role, type: 'AI',
          color: tint.getHex(), outfitColor: tint.clone().multiplyScalar(0.3).getHex(),
          homeZone: i === 0 ? office.id + '_recepcion' : office.id + '_trabajo',
          homeSpot: i === 0 ? 0 : i,
          task: i === 0 ? 'Recibir visitas y organizar la agenda' : `Trabajar como ${m.role}`,
          inputSpec: 'Encargos del Director', outputSpec: 'Trabajo terminado', tools: ['Agenda', 'Documentos', 'Chat del equipo']
        });
      });
      return list.map(a => Object.assign({
        officeId: office.id, currentZone: a.homeZone, pos: { x: 0, z: 0 }, targetPos: null, yaw: 0, walkPhase: 0,
        status: a.type === 'HUMAN' ? 'available' : 'working', energy: 75 + Math.round(Math.random() * 20),
        bubble: a.type === 'HUMAN' ? 'Dirigiendo ' + office.name : 'Trabajando en su estación', path: [], pathIndex: 0
      }, a));
    }

    function placeAgentAtHome(a) {
      const wp = getWaypointForZone(a.homeZone, a.id);
      a.pos = { x: wp.x, z: wp.z };
      a.targetPos = wp;
      a.yaw = wp.yaw || 0;
      a.currentZone = a.homeZone;
      a._navGoal = wp;
      a.path = [];
      a.pathIndex = 0;
    }

    // Tras cambiar obstáculos hay que recalcular la rejilla y las rutas en curso
    function refreshNavigation() {
      buildNavGrid();
      AGENTS.forEach(a => { a._navGoal = null; });
    }

    function rebuildRoomLabels() {
      roomLabelRefs.forEach(r => r.el.remove());
      roomLabelRefs.length = 0;
      const overlay = document.getElementById('labels-overlay');
      Object.values(ZONES).forEach(zone => {
        const el = document.createElement('div');
        el.className = 'room-tag-3d px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-700/80 text-[10px] font-mono font-semibold shadow-lg';
        el.style.color = zone.cssColor;
        el.textContent = zone.name;
        el.onclick = () => moveDirectorTo(zone.id);
        el.style.visibility = 'hidden';
        overlay.appendChild(el);
        roomLabelRefs.push({ el, zone, sx: undefined, sy: undefined, visible: false });
      });
    }

    // ---- Persistencia ----
    function saveOffices() {
      try {
        localStorage.setItem(OFFICES_KEY, JSON.stringify(GUEST_OFFICES.map(o => ({
          id: o.id, slot: o.slot, name: o.name, owner: o.owner, color: o.color, specialty: o.specialty, team: o.team
        }))));
      } catch (e) { /* sin persistencia */ }
    }

    function sanitizeOffice(raw, keepIds) {
      if (!raw || typeof raw !== 'object') return null;
      const name = cleanName(raw.name, 28), owner = cleanName(raw.owner, 24);
      if (!name || !owner) return null;
      const color = Math.max(0, Math.min(OFFICE_COLORS.length - 1, Math.round(Number(raw.color) || 0)));
      const specialty = OFFICE_SPECIALTIES[raw.specialty] ? raw.specialty : 'tecnologia';
      const id = keepIds && /^of[a-z0-9]{3,16}$/.test(String(raw.id)) ? String(raw.id) : 'of' + Date.now().toString(36) + Math.floor(Math.random() * 99);
      const teamRaw = Array.isArray(raw.team) ? raw.team.slice(0, 6) : [];
      const team = teamRaw.map((m, i) => ({
        id: keepIds && m && /^of[a-z0-9]{3,16}_m\d{1,2}$/.test(String(m.id)) && String(m.id).startsWith(id + '_') ? String(m.id) : id + '_m' + i,
        name: (cleanName(m && m.name, 24) || GUEST_NAMES[i]).replace(/ IA$/, '') + ' IA',
        role: cleanName(m && m.role, 32) || OFFICE_SPECIALTIES[specialty].roles[i % 6]
      }));
      if (team.length < 2) return null;
      return { id, name, owner, color, specialty, team, slot: raw.slot };
    }

    function loadGuestOffices() {
      let list = [];
      try { list = JSON.parse(localStorage.getItem(OFFICES_KEY) || '[]'); } catch (e) { list = []; }
      if (!Array.isArray(list)) return;
      list.slice(0, GUEST_SLOTS_X.length).forEach(raw => {
        const o = sanitizeOffice(raw, true);
        if (!o) return;
        const slot = Number.isInteger(raw.slot) && raw.slot >= 0 && raw.slot < GUEST_SLOTS_X.length && !GUEST_OFFICES.some(g => g.slot === raw.slot) ? raw.slot : freeSlot();
        if (slot < 0) return;
        o.slot = slot;
        GUEST_OFFICES.push(o);
        buildGuestOfficeWorld(o);
        guestAgentsFor(o).forEach(a => AGENTS.push(a)); // se ubican, reciben rango y avatar en el arranque normal
        registerCompany(o); // oficinas antiguas: pasan a ser empresas independientes con enlace propio
      });
    }

    function freeSlot() {
      for (let s = 0; s < GUEST_SLOTS_X.length; s++) if (!GUEST_OFFICES.some(o => o.slot === s)) return s;
      return -1;
    }

    // ---- Crear / importar / eliminar ----
    function makeTeam(id, specialty, size) {
      const used = new Set(AGENTS.map(a => a.name.replace(/ IA$/, '')));
      const pool = GUEST_NAMES.filter(n => !used.has(n));
      const roles = OFFICE_SPECIALTIES[specialty].roles;
      const team = [];
      for (let i = 0; i < size; i++) {
        const name = (pool.length ? pool.splice(Math.floor(Math.random() * pool.length), 1)[0] : GUEST_NAMES[i]) + ' IA';
        team.push({ id: id + '_m' + i, name, role: i === 0 ? 'Recepción & Agenda' : roles[(i - 1) % roles.length] });
      }
      return team;
    }

    function addGuestOfficeRuntime(office) {
      GUEST_OFFICES.push(office);
      buildGuestOfficeWorld(office);
      refreshNavigation();
      const agents = guestAgentsFor(office);
      agents.forEach(a => {
        AGENTS.push(a);
        initAgentRank(a);
      });
      agents.forEach(a => {
        placeAgentAtHome(a);
        a.lastMealAt = performance.now();
        a.cooldownUntil = performance.now() + Math.random() * 60000;
        buildAgentAvatar(a);
        createAgentLabel(a);
      });
      rebuildRoomLabels();
      saveOffices();
      refreshCameraOptions();
      renderDirectorPanel();
    }

    function createGuestOfficeFromForm() {
      const name = cleanName(document.getElementById('of-name')?.value, 28);
      const owner = cleanName(document.getElementById('of-owner')?.value, 24);
      if (!name || !owner) { showToast('Escribe el nombre de la oficina y el de su dueño.'); return; }
      const slot = freeSlot();
      if (slot < 0) { showToast('Los dos terrenos de enfrente ya están ocupados.'); return; }
      const f = OFFICE_UI.form;
      const id = 'of' + Date.now().toString(36);
      const office = { id, slot, name, owner, color: f.color, specialty: f.specialty, team: makeTeam(id, f.specialty, f.size) };
      addGuestOfficeRuntime(office);
      OFFICE_UI.form.name = '';
      OFFICE_UI.form.owner = '';
      registerCompany(office);
      pushActivity(`${owner} fundó su empresa independiente "${name}" frente a ${BRAND}.`, 'VECINOS');
      showToast(`🏢 ¡Empresa "${name}" creada! Ábrela con su propio enlace.`);
      setCameraPreset('office:' + id);
      renderPanel();
    }

    function exportOffice(id) {
      const o = guestOffice(id);
      if (!o) return;
      const json = JSON.stringify({ v: 1, name: o.name, owner: o.owner, color: o.color, specialty: o.specialty, team: o.team.map(m => ({ name: m.name, role: m.role })) });
      OFFICE_UI.exportCode = 'FRP1:' + btoa(unescape(encodeURIComponent(json)));
      const done = () => showToast('📋 Código copiado: pégalo en otro navegador con "Importar oficina".');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(OFFICE_UI.exportCode).then(done, () => showToast('Copia el código del recuadro.'));
      else showToast('Copia el código del recuadro.');
      renderPanel();
    }

    function importOfficeFromCode() {
      const box = document.getElementById('of-import');
      const code = String(box ? box.value : '').trim();
      if (!code.startsWith('FRP1:')) { showToast('El código debe empezar por "FRP1:".'); return; }
      let raw;
      try { raw = JSON.parse(decodeURIComponent(escape(atob(code.slice(5))))); } catch (e) { showToast('El código no es válido.'); return; }
      const slot = freeSlot();
      if (slot < 0) { showToast('Los dos terrenos de enfrente ya están ocupados.'); return; }
      const o = sanitizeOffice(raw, false);
      if (!o) { showToast('El código no contiene una oficina válida.'); return; }
      o.slot = slot;
      addGuestOfficeRuntime(o);
      registerCompany(o);
      pushActivity(`Se importó la empresa "${o.name}" de ${o.owner}.`, 'VECINOS');
      showToast(`🏢 Oficina "${o.name}" importada`);
      setCameraPreset('office:' + o.id);
      renderPanel();
    }

    function deleteGuestOffice(id) {
      const o = guestOffice(id);
      if (!o) return;
      if (OFFICE_UI.confirmDelete !== id) {
        OFFICE_UI.confirmDelete = id;
        clearTimeout(OFFICE_UI.confirmTimer);
        OFFICE_UI.confirmTimer = setTimeout(() => { OFFICE_UI.confirmDelete = null; renderPanel(); }, 4000);
        renderPanel();
        return;
      }
      OFFICE_UI.confirmDelete = null;
      if (ACTIVE_OFFICE === id) switchOffice('main', true);
      if (MEETING.active && ZONES[MEETING.active.zone] && ZONES[MEETING.active.zone].office === id) endMeeting();

      AGENTS.filter(a => a.officeId === id).map(a => a.id).forEach(removeAgent);
      // visitantes de otras oficinas que estaban dentro: vuelven a su puesto
      AGENTS.forEach(a => {
        if (String(a.currentZone).startsWith(id + '_')) {
          a.currentZone = a.homeZone;
          a.targetPos = getWaypointForZone(a.homeZone, a.id);
        }
      });
      Object.keys(ZONES).filter(k => ZONES[k].office === id).forEach(k => { delete ZONES[k]; delete zoneFloorMeshes[k]; });
      for (let i = COLLIDERS.length - 1; i >= 0; i--) if (COLLIDERS[i].tag === id) COLLIDERS.splice(i, 1);
      for (let i = DOORS.length - 1; i >= 0; i--) if (DOORS[i].tag === id) { DOOR_LEAVES.delete(DOORS[i].left); DOOR_LEAVES.delete(DOORS[i].right); DOORS.splice(i, 1); }
      const root = GUEST_ROOTS[id];
      if (root) {
        scene.remove(root);
        root.traverse(obj => { if (obj.userData.ownGeo && obj.geometry) obj.geometry.dispose(); });
        delete GUEST_ROOTS[id];
      }
      for (let i = PROJECTS.length - 1; i >= 0; i--) if (PROJECTS[i].officeId === id) PROJECTS.splice(i, 1);
      DELIVERABLES = DELIVERABLES.filter(d => d.officeId !== id);
      GUEST_OFFICES.splice(GUEST_OFFICES.indexOf(o), 1);
      saveCompanies(listCompanies().filter(c => c.id !== id));
      purgeCompanyData(id);
      buildLotSign(o.slot);
      refreshNavigation();
      rebuildRoomLabels();
      saveOffices();
      saveProjects();
      saveDeliverables();
      refreshCameraOptions();
      renderDirectorPanel();
      pushActivity(`Se eliminó la oficina "${o.name}".`, 'VECINOS');
      showToast(`🗑️ Oficina "${o.name}" eliminada`);
      renderPanel();
    }

    // Cambia qué oficina controlas (Director, equipo, proyectos y accesos rápidos)
    function switchOffice(id, silent = false) {
      if (id !== 'main' && !guestOffice(id)) return;
      ACTIVE_OFFICE = id;
      const first = AGENTS.find(a => a.type === 'AI' && officeOf(a) === id);
      if (first) selectedAgentId = first.id;
      renderDirectorPanel();
      updateProjectsBadge();
      updateRankBadge();
      if (!silent) {
        setCameraPreset(id === 'main' ? 'overview' : 'office:' + id);
        showToast(id === 'main' ? '🏢 Controlas ' + BRAND : `🏢 Ahora controlas "${officeName(id)}"`);
        renderPanel();
      }
    }

    // ---- Panel del Director (abajo a la izquierda) ----
    const MAIN_QUICK = [
      ['director_hub', '🚀 Dirección'], ['reception', '🛎️ Recepción'], ['interview', '🤝 Entrevistas'], ['meeting', '🧩 Reuniones A'],
      ['practica', '🧠 Práctica'], ['games', '🎮 Juegos'], ['apps', '📱 Apps'], ['software', '💻 Software'], ['help_desk', '🛟 Ayuda'],
      ['qa_lab', '🧪 QA'], ['cafe', '☕ Café'], ['lounge', '🛋️ Descanso'], ['naturaleza', '🌿 Jardín'], ['comedor', '🍽️ Comedor'],
      ['programacion', '💻 Programación'], ['mecatronica', '🤖 Mecatrónica'], ['formacion', '📚 Formación']
    ];

    function renderDirectorPanel() {
      const dir = activeDirector();
      const title = document.getElementById('director-title');
      if (title) title.textContent = ACTIVE_OFFICE === 'main' ? (COMPANY.independent ? COMPANY.owner : 'Tú') + ' · Director' : dir.name;
      const badge = document.getElementById('user-zone-badge');
      if (badge && dir && ZONES[dir.currentZone]) badge.textContent = ZONES[dir.currentZone].name;
      const box = document.getElementById('director-quick');
      if (!box) return;
      let items;
      if (ACTIVE_OFFICE === 'main') {
        items = MAIN_QUICK.filter(([z]) => ZONES[z]);
        GUEST_OFFICES.forEach(o => items.push([o.id + '_recepcion', '🏘️ Visitar a ' + o.name]));
      } else {
        items = Object.values(ZONES).filter(z => z.office === ACTIVE_OFFICE).map(z => [z.id, z.name]);
        items.push(['reception', '🏢 Visitar ' + BRAND]);
      }
      const here = dir && dir.currentZone;
      box.innerHTML = `<option value="">📍 Ir a…</option>` + items.map(([z, label]) =>
        `<option value="${z}" ${z === here ? 'disabled' : ''}>${escapeHtml(label)}</option>`).join('');
      box.value = '';
      const sel = document.getElementById('office-select');
      if (sel) {
        sel.innerHTML = `<option value="main">🏢 ${escapeHtml(BRAND)}</option>`;
        sel.value = 'main';
      }
    }

    // ---- Selector de cámara (cabecera) ----
    const CAMERA_OPTIONS = [
      ['overview', '🏢 Oficina completa'], ['reception', '🛎️ Recepción'], ['west_wing', '🍽️ Ala Oeste'], ['nature', '🌿 Jardín Natural'],
      ['dev_lab', '🎮 Juegos & Apps'], ['cafe_lounge', '☕ Café & Descanso'], ['help_desk', '🛟 Mesa de Ayuda'], ['street', '🏘️ Calle y vecinos'], ['follow', '🎯 Seguir agente']
    ];

    function refreshCameraOptions() {
      const sel = document.getElementById('cam-select');
      if (!sel) return;
      const cur = sel.value || cameraMode;
      sel.innerHTML = [...CAMERA_OPTIONS, ...GUEST_OFFICES.map(o => ['office:' + o.id, '🏘️ ' + o.name])]
        .map(([v, l]) => `<option value="${v}">${escapeHtml(l)}</option>`).join('');
      sel.value = [...sel.options].some(o => o.value === cur) ? cur : 'overview';
    }

    // ---- Pestaña Oficinas ----
    function setOfficeForm(key, value) {
      OFFICE_UI.form[key] = value;
      renderPanel();
    }

    function renderOfficesTab(container) {
      if (COMPANY.independent) {
        container.innerHTML = `
          <div class="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2 text-center">
            <div class="text-2xl">🏢</div>
            <div class="text-sm font-bold text-white">${escapeHtml(BRAND)}</div>
            <p class="text-[11px] text-slate-400">Empresa independiente de ${escapeHtml(COMPANY.owner)}. Su equipo, proyectos, clientes y datos están separados de cualquier otra empresa.</p>
            <button onclick="copyCompanyLink('${COMPANY.id}')" class="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border border-cyan-400/50 text-[11px] font-semibold">🔗 Copiar enlace de esta empresa</button>
          </div>`;
        return;
      }
      const f = OFFICE_UI.form;
      const slot = freeSlot();
      const mainCount = AGENTS.filter(a => a.type !== 'HUMAN' && a.type !== 'CANDIDATE' && !a.leaving && officeOf(a) === 'main').length;
      const officeCard = (o) => {
        const col = OFFICE_COLORS[o.color] || OFFICE_COLORS[0];
        const n = AGENTS.filter(a => a.officeId === o.id && a.type === 'AI').length;
        const active = ACTIVE_OFFICE === o.id;
        return `
          <div class="p-3 rounded-xl border ${active ? 'bg-slate-900 border-cyan-400/50' : 'bg-slate-900/85 border-slate-800'} space-y-2">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-3 h-3 rounded-full shrink-0" style="background:${col.css}"></span>
                <div class="min-w-0">
                  <div class="text-xs font-bold text-white truncate">${escapeHtml(o.name)}</div>
                  <div class="text-[10px] text-slate-400">De ${escapeHtml(o.owner)} · ${OFFICE_SPECIALTIES[o.specialty].label} · empresa independiente</div>
                </div>
              </div>
              ${active ? '<span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-100 border border-cyan-400/40">CONTROLANDO</span>' : ''}
            </div>
            <div class="flex flex-wrap gap-1.5">
              <button onclick="openCompany('${o.id}')" class="px-2 py-1 rounded-lg text-[10px] font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border border-cyan-400/50">🚪 Abrir su empresa</button>
              <button onclick="copyCompanyLink('${o.id}')" class="px-2 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">🔗 Enlace</button>
              <button onclick="setCameraPreset('office:${o.id}')" class="px-2 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">👁 Ver</button>
              <button onclick="exportOffice('${o.id}')" class="px-2 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">📤 Exportar código</button>
              <button onclick="deleteGuestOffice('${o.id}')" class="px-2 py-1 rounded-lg text-[10px] font-semibold border ${OFFICE_UI.confirmDelete === o.id ? 'bg-rose-600 text-white border-rose-400' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 border-rose-500/30'}">${OFFICE_UI.confirmDelete === o.id ? '¿Seguro? Eliminar' : '🗑 Eliminar'}</button>
            </div>
          </div>
        `;
      };

      container.innerHTML = `
        <div class="p-3 rounded-xl bg-slate-900/95 border border-cyan-500/30 space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-bold text-white">🏢 ${escapeHtml(BRAND)}</div>
              <div class="text-[10px] text-slate-400">Tu empresa · ${mainCount} miembros</div>
            </div>
            ${ACTIVE_OFFICE === 'main'
              ? '<span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-100 border border-cyan-400/40">CONTROLANDO</span>'
              : `<button onclick="switchOffice('main')" class="px-2 py-1 rounded-lg text-[10px] font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border border-cyan-400/50">Volver a mi oficina</button>`}
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between px-0.5">
            <span class="text-xs font-semibold text-white">Empresas de familiares (${GUEST_OFFICES.length}/${GUEST_SLOTS_X.length})</span>
            <button onclick="setCameraPreset('street')" class="text-[10px] text-cyan-300 hover:text-cyan-100">Ver la calle →</button>
          </div>
          ${GUEST_OFFICES.length ? GUEST_OFFICES.map(officeCard).join('') : '<div class="p-3 rounded-xl border border-dashed border-slate-700 text-[11px] text-slate-400 text-center">Aún no hay empresas de familiares. Cada una es independiente de la tuya: su equipo, sus proyectos y sus datos.</div>'}
          ${OFFICE_UI.exportCode ? `
            <div class="p-2 rounded-xl bg-slate-950 border border-slate-700 space-y-1">
              <div class="text-[10px] text-slate-400">Código para compartir (cópialo y envíalo):</div>
              <textarea readonly onclick="this.select()" class="w-full h-16 bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[10px] font-mono text-emerald-200 resize-none">${OFFICE_UI.exportCode}</textarea>
            </div>` : ''}
        </div>

        ${slot >= 0 ? `
          <div class="p-3 rounded-xl bg-slate-900/85 border border-emerald-500/30 space-y-2.5">
            <div class="text-xs font-semibold text-white">➕ Crear empresa de un familiar</div>
            <input id="of-name" maxlength="28" value="${escapeHtml(f.name || '')}" oninput="OFFICE_UI.form.name = this.value" placeholder="Nombre de su empresa (p. ej. Luna Digital)" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400" />
            <input id="of-owner" maxlength="24" value="${escapeHtml(f.owner || '')}" oninput="OFFICE_UI.form.owner = this.value" placeholder="Nombre del dueño (tu familiar)" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400" />
            <div>
              <div class="text-[10px] text-slate-400 mb-1">Color</div>
              <div class="flex gap-1.5">
                ${OFFICE_COLORS.map((c, i) => `<button title="${c.name}" onclick="setOfficeForm('color', ${i})" class="w-6 h-6 rounded-full border-2 ${f.color === i ? 'border-white scale-110' : 'border-transparent'} transition" style="background:${c.css}"></button>`).join('')}
              </div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 mb-1">Especialidad</div>
              <div class="grid grid-cols-2 gap-1">
                ${Object.keys(OFFICE_SPECIALTIES).map(k => `<button onclick="setOfficeForm('specialty', '${k}')" class="px-2 py-1 rounded-lg text-[10px] border ${f.specialty === k ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/50' : 'bg-slate-950 text-slate-300 border-slate-800'}">${OFFICE_SPECIALTIES[k].label}</button>`).join('')}
              </div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 mb-1">Tamaño del equipo: <b class="text-white">${f.size}</b> miembros + Director</div>
              <div class="flex gap-1">${[3, 4, 5, 6].map(n => `<button onclick="setOfficeForm('size', ${n})" class="flex-1 py-1 rounded-lg text-[10px] border ${f.size === n ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/50' : 'bg-slate-950 text-slate-300 border-slate-800'}">${n}</button>`).join('')}</div>
            </div>
            <button onclick="createGuestOfficeFromForm()" class="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition">🏗️ Fundar empresa independiente</button>
          </div>` : '<div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400">Los dos terrenos están ocupados. Elimina una oficina para crear otra.</div>'}

        <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div class="text-xs font-semibold text-white">📥 Importar empresa</div>
          <p class="text-[10px] text-slate-400">Si tu familiar creó su empresa en otro navegador, pulsa allí "Exportar código" y pégalo aquí: tendrá su enlace propio y su edificio enfrente del tuyo.</p>
          <textarea id="of-import" placeholder="FRP1:..." class="w-full h-14 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-[10px] font-mono text-white resize-none focus:outline-none focus:border-cyan-400"></textarea>
          <button onclick="importOfficeFromCode()" ${slot < 0 ? 'disabled' : ''} class="w-full py-1.5 rounded-lg text-[11px] font-semibold border ${slot < 0 ? 'bg-slate-900 text-slate-500 border-slate-800' : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border-cyan-400/50'}">Importar</button>
        </div>
      `;
    }

    // ---- Empresas independientes (registro compartido + enlace propio) ----
    function registerCompany(o) {
      const list = listCompanies();
      if (list.some(c => c.id === o.id)) return;
      list.push({ id: o.id, name: o.name, owner: o.owner, color: o.color, specialty: o.specialty, createdAt: Date.now() });
      saveCompanies(list);
    }

    function openCompany(id) {
      const o = guestOffice(id);
      if (o) registerCompany(o);
      const w = window.open(companyLink(id), '_blank', 'noopener');
      if (!w) { copyCompanyLink(id); showToast('Tu navegador bloqueó la ventana: el enlace quedó copiado.'); }
    }

    function copyCompanyLink(id) {
      const url = companyLink(id);
      const done = () => showToast('🔗 Enlace de la empresa copiado');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => showToast(url));
      else showToast(url);
    }
