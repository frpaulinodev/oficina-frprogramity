    // [scene-office.js] Parte de lo que antes era script.js: ESCENA 3D: construcción de la oficina, agentes y movimiento (sección 3.4).
    // Se carga en orden desde index.html; no cambies el orden de los archivos.
    // ------------------------------------------------------------------------
    // 3.4 ESCENA PRINCIPAL
    // ------------------------------------------------------------------------
    function initThreeScene() {
      const container = document.getElementById('canvas-container');
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x060a14);
      scene.fog = new THREE.FogExp2(0x060a14, 0.013);

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 270);
      camera.position.set(14, 34, 44);

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      container.appendChild(renderer.domElement);

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.065;
      controls.maxPolarAngle = Math.PI / 2 - 0.05;
      controls.minDistance = 5;
      controls.maxDistance = 82;
      controls.target.copy(desiredCameraTarget);

      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      // Luz hemisferica (cielo frio / suelo calido). Absorbe el antiguo AmbientLight.
      const hemiLight = new THREE.HemisphereLight(0xdbe7ff, 0x2a2018, 0.68);
      scene.add(hemiLight);
      SCENE_LIGHTS.hemi = hemiLight;

      // UNICA luz con sombras: lucernario principal. Mapa 1024x1024 con frustum ajustado al estudio.
      const dirLight = new THREE.DirectionalLight(0xfff4e6, 1.25);
      dirLight.position.set(18, 28, 18.5);
      dirLight.target.position.set(2, 0, 0.5);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.set(1024, 1024); // en calidad Alta sube a 2048 (ver applyGraphicsQuality)
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.03;
      scene.add(dirLight);
      scene.add(dirLight.target);
      fitShadowFrustum(dirLight);
      SCENE_LIGHTS.dir = dirLight;

      // Luces secundarias SIN sombras: solo se encienden en calidad Alta.
      // El resto del brillo calido lo dan los materiales emisivos (bombillas, pantallas, LEDs).
      const fillLight = new THREE.DirectionalLight(0x9ec5ff, 0.3);
      fillLight.position.set(-14, 12, -20);
      scene.add(fillLight);
      SCENE_LIGHTS.extras.push(fillLight);
      SCENE_LIGHTS.fill = fillLight;

      const warmCafeLight = new THREE.PointLight(0xffb46b, 1.6, 16, 1.6);
      warmCafeLight.position.set(10.5, 3.2, -7.5);
      scene.add(warmCafeLight);
      SCENE_LIGHTS.extras.push(warmCafeLight);

      const loungeLight = new THREE.PointLight(0xffc98a, 0.95, 10, 1.6);
      loungeLight.position.set(17.9, 1.75, -3.9);
      scene.add(loungeLight);
      SCENE_LIGHTS.extras.push(loungeLight);

      createOfficeMaterials();
      buildOfficeEnvironment();
      buildSky();
      buildStudioFloorAndBackdrop();
      buildAllZonesFurniture();
      buildAllWalls();
      buildAcrossStreet();         // terrenos frente a tu oficina (offices.js)
      loadGuestOffices();          // oficinas vecinas guardadas: geometría, salas y equipo
      buildNavGrid();
      freezeStaticObjects(scene, new Set([...steamParticles.map(sp => sp.mesh), ...DOOR_LEAVES, ...NATURE_ANIMATED]));
      optimizeStaticScene();       // fusiona las mallas estáticas por material (perf.js)
      loadHiredAgents();
      initRanks();                 // rangos y experiencia (ranks.js)
      placeAgentsAtHome();
      buildAllAgentAvatars();      // personajes (avatars.js)
      createProjectedLabels();
      setupClickInteractions(renderer.domElement);
      restoreProjects();           // proyectos guardados (projects.js)
      renderDirectorPanel();
      refreshCameraOptions();

      applyGraphicsQuality(loadGraphicsQuality(), false);
      TOD.target = TOD.t = loadTimeOfDay() === 'dia' ? 1 : 0;
      applyTimeOfDay(TOD.t);
      updateTimeOfDayButtons();
      window.addEventListener('resize', onWindowResize);
      document.addEventListener('visibilitychange', onVisibilityChange);
      updateViewportCache();
      renderClock.start();
      startRenderLoop();
    }

    // ------------------------------------------------------------------------
    // 3.4b RENDIMIENTO: luces, sombras, calidad gráfica y objetos estáticos
    // ------------------------------------------------------------------------
    const SCENE_LIGHTS = { dir: null, extras: [] };

    // Ajusta la cámara ortográfica de sombras a la caja real del estudio vista desde la luz
    function fitShadowFrustum(light) {
      const cam = light.shadow.camera;
      light.updateMatrixWorld();
      light.target.updateMatrixWorld();
      cam.position.copy(light.position);
      cam.lookAt(light.target.position);
      cam.updateMatrixWorld();
      const inv = new THREE.Matrix4().copy(cam.matrixWorld).invert();
      // suelo 46 x 28 centrado en (2, 0.5) + altura máxima de muebles/cristalera (4.3 m)
      const xs = [-40.5, 25], ys = [0, 4.3], zs = [-13.6, 28.6];
      const v = new THREE.Vector3();
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
      xs.forEach(x => ys.forEach(y => zs.forEach(z => {
        v.set(x, y, z).applyMatrix4(inv);
        minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
        minZ = Math.min(minZ, v.z); maxZ = Math.max(maxZ, v.z);
      })));
      const pad = 0.5;
      cam.left = minX - pad;
      cam.right = maxX + pad;
      cam.bottom = minY - pad;
      cam.top = maxY + pad;
      cam.near = Math.max(0.5, -maxZ - pad);
      cam.far = -minZ + pad;
      cam.updateProjectionMatrix();
    }

    // Los objetos que no se mueven no recalculan su matriz en cada cuadro
    function freezeStaticObjects(root, exclude) {
      root.updateMatrixWorld(true);
      root.traverse(obj => {
        if (obj === root || exclude.has(obj)) return;
        if (obj.isLight || obj.isCamera) return;
        obj.matrixAutoUpdate = false;
      });
    }

    const GRAPHICS_PRESETS = {
      baja:  { pixelRatio: 1.0,  shadows: false, extraLights: false, blur: false },
      media: { pixelRatio: 1.25, shadows: true,  extraLights: false, blur: true },
      alta:  { pixelRatio: 1.5,  shadows: true,  extraLights: true,  blur: true }
    };
    let graphicsQuality = null;

    function loadGraphicsQuality() {
      try {
        const q = localStorage.getItem('frp_graphics_quality');
        if (q && GRAPHICS_PRESETS[q]) return q;
      } catch (e) { /* almacenamiento no disponible */ }
      // Por defecto: Alta en equipos con 8+ hilos, Media en el resto
      return (navigator.hardwareConcurrency || 4) >= 8 ? 'alta' : 'media';
    }

    function applyGraphicsQuality(q, persist = true) {
      if (!GRAPHICS_PRESETS[q] || !renderer) return;
      const p = GRAPHICS_PRESETS[q];
      const prev = graphicsQuality ? GRAPHICS_PRESETS[graphicsQuality] : null;
      graphicsQuality = q;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, p.pixelRatio));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = p.shadows;
      renderer.shadowMap.needsUpdate = true;
      if (SCENE_LIGHTS.dir) {
        const dl = SCENE_LIGHTS.dir;
        dl.castShadow = p.shadows;
        // el estudio ampliado cubre más metros: en Alta se usa un mapa de sombras más fino
        const size = q === 'alta' ? 2048 : 1024;
        if (dl.shadow.mapSize.x !== size) {
          dl.shadow.mapSize.set(size, size);
          if (dl.shadow.map) { dl.shadow.map.dispose(); dl.shadow.map = null; }
        }
      }
      SCENE_LIGHTS.extras.forEach(l => { l.visible = p.extraLights; });
      if (prev && (prev.shadows !== p.shadows || prev.extraLights !== p.extraLights)) {
        // cambiar sombras o número de luces exige recompilar los shaders (una sola vez)
        scene.traverse(obj => {
          if (!obj.material) return;
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => { m.needsUpdate = true; });
        });
      }
      document.body.classList.toggle('perf-no-blur', !p.blur);

      document.querySelectorAll('.gfx-btn').forEach(b => {
        const active = b.dataset.quality === q;
        b.classList.toggle('bg-cyan-500/25', active);
        b.classList.toggle('text-cyan-200', active);
        b.classList.toggle('text-slate-400', !active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      if (persist) {
        try { localStorage.setItem('frp_graphics_quality', q); } catch (e) { /* sin persistencia */ }
        showToast('Calidad gráfica: ' + q.charAt(0).toUpperCase() + q.slice(1));
      }
    }

    function setGraphicsQuality(q) {
      if (q === graphicsQuality) return;
      applyGraphicsQuality(q, true);
    }

    // ------------------------------------------------------------------------
    // 3.4c BUCLE DE RENDER (se detiene con la pestaña oculta)
    // ------------------------------------------------------------------------
    const renderClock = new THREE.Clock(false);
    let rafId = 0;

    function startRenderLoop() {
      if (rafId) return;
      renderClock.getDelta(); // descarta el tiempo transcurrido mientras estaba pausado
      rafId = requestAnimationFrame(animate);
    }

    function stopRenderLoop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }

    function onVisibilityChange() {
      if (document.hidden) stopRenderLoop();
      else startRenderLoop();
    }

    function buildStudioFloorAndBackdrop() {
      // Suelo de alfombra modular con micro-trama y relieve
      // Edificio ampliado: de la cristalera trasera (z -13.5) a la fachada principal (z 21)
      const mainFloorGeo = cachedGeo('Box', 46, 0.4, 34.5);
      const mainFloor = new THREE.Mesh(mainFloorGeo, OFFICE_MAT.carpet);
      mainFloor.position.set(2, -0.2, 3.75);
      mainFloor.receiveShadow = true;
      scene.add(mainFloor);

      // Ala oeste (x -40 .. -21)
      const westCarpet = OFFICE_MAT.carpet.clone();
      westCarpet.map = officeTexRepeat(OFFICE_TEX.carpet_c, 9.5, 17.25);
      westCarpet.bumpMap = officeTexRepeat(OFFICE_TEX.carpet_b, 9.5, 17.25);
      westCarpet.roughnessMap = westCarpet.bumpMap;
      const westFloor = new THREE.Mesh(cachedGeo('Box', 19, 0.4, 34.5), westCarpet);
      westFloor.position.set(-30.5, -0.2, 3.75);
      westFloor.receiveShadow = true;
      scene.add(westFloor);

      // Pasillos de piso laminado que conectan las puertas de las salas
      const buildRunner = (cx, cz, len, wid, alongZ = false) => {
        const mat = cachedMat('runner|' + len + '|' + wid, () => {
          const m = OFFICE_MAT.laminate.clone();
          m.map = officeTexRepeat(OFFICE_MAT.laminate.map, len / 2, wid / 2);
          m.bumpMap = officeTexRepeat(OFFICE_MAT.laminate.bumpMap, len / 2, wid / 2);
          m.roughnessMap = m.bumpMap;
          return m;
        });
        const runner = new THREE.Mesh(cachedGeo('Plane', len, wid), mat);
        runner.rotation.x = -Math.PI / 2;
        if (alongZ) runner.rotation.z = Math.PI / 2;
        runner.position.set(cx, 0.01, cz);
        runner.receiveShadow = true;
        scene.add(runner);
      };
      buildRunner(-10.95, 0.62, 9.3, 1.6);       // entre Juegos y Apps
      buildRunner(-5.12, -4.2, 14.0, 2.1, true);  // pasillo oeste
      buildRunner(4.0, 2.42, 16.0, 1.5);          // pasillo central
      buildRunner(2.375, 10.9, 36.25, 1.9);       // pasillo frontal (hacia Recepción)
      buildRunner(8.6, -1.7, 7.0, 6.6);           // vestíbulo central
      buildRunner(-17.125, -0.6, 25.2, 2.5, true); // pasillo norte-sur del ala oeste
      buildRunner(-29.25, 0.5, 21.5, 1.8);        // pasillo este-oeste del ala oeste
      buildRunner(-29.25, 10.875, 21.5, 1.9);     // pasillo frontal del ala oeste

      // Pisos propios de las salas nuevas
      const roomFloor = (zid, mat) => {
        const zn = ZONES[zid];
        const m = new THREE.Mesh(cachedGeo('Plane', zn.w, zn.d), mat);
        m.rotation.x = -Math.PI / 2;
        m.position.set(zn.x, 0.008, zn.z);
        m.receiveShadow = true;
        scene.add(m);
      };
      const tiles = makeOfficeTexture('tiles', 256, 256, drawTiles, { seed: 515, color: true });
      const tileMat = (zid, tint) => new THREE.MeshStandardMaterial({
        color: new THREE.Color(tint).convertSRGBToLinear(), map: officeTexRepeat(tiles, ZONES[zid].w / 1.2, ZONES[zid].d / 1.2), roughness: 0.35, envMapIntensity: 0.6
      });
      const woodMat = (zid) => {
        const m = OFFICE_MAT.oak.clone();
        m.map = officeTexRepeat(OFFICE_MAT.oak.map, ZONES[zid].w / 2.2, ZONES[zid].d / 2.2);
        m.bumpMap = officeTexRepeat(OFFICE_MAT.oak.bumpMap, ZONES[zid].w / 2.2, ZONES[zid].d / 2.2);
        m.roughnessMap = m.bumpMap;
        return m;
      };
      roomFloor('comedor', woodMat('comedor'));
      roomFloor('cocina', tileMat('cocina', 0xffffff));
      roomFloor('limpieza', tileMat('limpieza', 0xd9e2ec));
      roomFloor('banos', tileMat('banos', 0xe0f2fe));
      roomFloor('programacion', woodMat('programacion'));
      roomFloor('mecatronica', new THREE.MeshStandardMaterial({ color: new THREE.Color(0x26303b).convertSRGBToLinear(), bumpMap: officeTexRepeat(OFFICE_TEX.noise, 8, 8), bumpScale: 0.01, roughness: 0.95 }));
      const grass = makeOfficeTexture('grass', 256, 256, drawGrass, { seed: 717, color: true });
      roomFloor('naturaleza', new THREE.MeshStandardMaterial({ map: officeTexRepeat(grass, 9, 4.5), roughness: 1.0 }));

      // Recepción: piso de mármol pulido
      const recZone = ZONES.reception;
      const recFloorMat = OFFICE_MAT.marble.clone();
      recFloorMat.map = officeTexRepeat(OFFICE_MAT.marble.map, recZone.w / 3, recZone.d / 3);
      recFloorMat.roughness = 0.22;
      const recFloor = new THREE.Mesh(cachedGeo('Plane', recZone.w, recZone.d), recFloorMat);
      recFloor.rotation.x = -Math.PI / 2;
      recFloor.position.set(recZone.x, 0.008, recZone.z);
      recFloor.receiveShadow = true;
      scene.add(recFloor);

      // Sala de entrevistas: madera
      const intZone = ZONES.interview;
      const intFloorMat = OFFICE_MAT.oak.clone();
      intFloorMat.map = officeTexRepeat(OFFICE_MAT.oak.map, intZone.w / 2, intZone.d / 2);
      intFloorMat.bumpMap = officeTexRepeat(OFFICE_MAT.oak.bumpMap, intZone.w / 2, intZone.d / 2);
      intFloorMat.roughnessMap = intFloorMat.bumpMap;
      const intFloor = new THREE.Mesh(cachedGeo('Plane', intZone.w, intZone.d), intFloorMat);
      intFloor.rotation.x = -Math.PI / 2;
      intFloor.position.set(intZone.x, 0.008, intZone.z);
      intFloor.receiveShadow = true;
      scene.add(intFloor);

      buildExteriorPlaza();

      // Piso de madera bajo el café
      const cafeZone = ZONES.cafe;
      const cafeFloorMat = OFFICE_MAT.laminate.clone();
      cafeFloorMat.map = officeTexRepeat(OFFICE_MAT.laminate.map, cafeZone.w / 2, cafeZone.d / 2);
      cafeFloorMat.bumpMap = officeTexRepeat(OFFICE_MAT.laminate.bumpMap, cafeZone.w / 2, cafeZone.d / 2);
      cafeFloorMat.roughnessMap = cafeFloorMat.bumpMap;
      const cafeFloor = new THREE.Mesh(cachedGeo('Plane', cafeZone.w, cafeZone.d), cafeFloorMat);
      cafeFloor.rotation.x = -Math.PI / 2;
      cafeFloor.position.set(cafeZone.x, 0.008, cafeZone.z);
      cafeFloor.receiveShadow = true;
      scene.add(cafeFloor);

      // Rodapié perimetral
      const skirting = new THREE.Mesh(cachedGeo('Box', 46, 0.1, 0.05), OFFICE_MAT.edgeBand);
      skirting.position.set(2, 0.05, -13.12);
      scene.add(skirting);

      // Pared panorámica de cristal del estudio con perfilería de aluminio
      const glassWallMat = new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.16,
        roughness: 0.05,
        metalness: 0.9,
        envMapIntensity: 1.2,
        depthWrite: false
      });
      const backGlass = new THREE.Mesh(cachedGeo('Box', 45, 4.2, 0.12), glassWallMat);
      backGlass.position.set(2, 2.1, -13.2);
      scene.add(backGlass);

      for (let mx = -20.5; mx <= 24.5; mx += 3) {
        const mullion = new THREE.Mesh(cachedGeo('Box', 0.08, 4.2, 0.16), OFFICE_MAT.aluminium);
        mullion.position.set(mx, 2.1, -13.2);
        mullion.castShadow = true;
        scene.add(mullion);
      }
      [0.06, 4.17].forEach(ry => {
        const rail = new THREE.Mesh(cachedGeo('Box', 45.2, 0.1, 0.18), OFFICE_MAT.aluminium);
        rail.position.set(2, ry, -13.2);
        scene.add(rail);
      });

      // Torres de campus tecnológico al fondo con fachada de ventanas
      const towerPositions = [
        { x: -16, z: -19, w: 4.2, h: 16, d: 4.2 },
        { x: -9, z: -21, w: 5.0, h: 22, d: 4.8 },
        { x: -2, z: -18, w: 3.8, h: 13, d: 3.8 },
        { x: 5, z: -22, w: 5.4, h: 25, d: 5.0 },
        { x: 12, z: -19, w: 4.5, h: 18, d: 4.2 },
        { x: 19, z: -21, w: 4.8, h: 20, d: 4.5 },
        { x: -24, z: -20, w: 4.4, h: 17, d: 4.2 },
        { x: -32, z: -22.5, w: 5.2, h: 24, d: 4.8 },
        { x: -41, z: -19.5, w: 4.0, h: 14, d: 4.0 }
      ];

      const facadeColor = makeOfficeTexture('facade_c', 256, 512, (c, w, h, r) => drawFacade(c, w, h, r, 'color'), { seed: 300, color: true });
      const facadeEmit = makeOfficeTexture('facade_e', 256, 512, (c, w, h, r) => drawFacade(c, w, h, r, 'emissive'), { seed: 300, color: true });

      towerPositions.forEach((t, idx) => {
        const rx = Math.max(1, Math.round(t.w / 2.4));
        const ry = Math.max(1, Math.round(t.h / 9));
        const winColor = idx % 2 === 0 ? 0x67e8f9 : 0xc4b5fd;
        const bMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: officeTexRepeat(facadeColor, rx, ry),
          emissive: winColor,
          emissiveMap: officeTexRepeat(facadeEmit, rx, ry),
          emissiveIntensity: 0.75,
          roughness: 0.35,
          metalness: 0.6
        });
        const bMesh = new THREE.Mesh(cachedGeo('Box', t.w, t.h, t.d), bMat);
        bMesh.position.set(t.x, t.h / 2 - 2, t.z);
        scene.add(bMesh);
        TOWER_MATS.push(bMat);

        // remate de azotea
        const roof = new THREE.Mesh(cachedGeo('Box', t.w * 0.6, 0.6, t.d * 0.6), OFFICE_MAT.aluminium);
        roof.position.set(t.x, t.h - 1.7, t.z);
        scene.add(roof);
      });
    }

    // ------------------------------------------------------------------------
    // 3.4d PAREDES, PUERTAS CORREDIZAS Y FACHADA
    // ------------------------------------------------------------------------
    const TOWER_MATS = [];
    const DOORS = [];
    const DOOR_LEAVES = new Set();
    const WALL_H = 2.35;       // altura total de los tabiques de sala
    const WALL_BASE_H = 0.95;  // zócalo opaco; encima va vidrio
    const WALL_T = 0.12;
    const FACADE_H = 3.2;

    function getWallMats(accent) {
      const base = cachedMat('wallBase', () => new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xf1eee8).convertSRGBToLinear(),
        map: makeOfficeTexture('plaster', 256, 256, drawPlaster, { seed: 1212, color: true }),
        bumpMap: OFFICE_TEX.noise, bumpScale: 0.002, roughness: 0.86, metalness: 0.0, envMapIntensity: 0.5
      }));
      const glass = cachedMat('wallGlass', () => new THREE.MeshStandardMaterial({
        color: 0xbfe6ff, transparent: true, opacity: 0.14, roughness: 0.04, metalness: 0.1, envMapIntensity: 1.2, depthWrite: false
      }));
      const facadeGlass = cachedMat('facadeGlass', () => new THREE.MeshStandardMaterial({
        color: 0x7dd3fc, transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0.6, envMapIntensity: 1.2, depthWrite: false
      }));
      const doorGlass = cachedMat('doorGlass', () => new THREE.MeshStandardMaterial({
        color: 0xd8f0ff, transparent: true, opacity: 0.26, roughness: 0.03, metalness: 0.15, envMapIntensity: 1.3, depthWrite: false
      }));
      const strip = accent !== undefined
        ? cachedMat('wallStrip|' + accent, () => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: accent, emissiveIntensity: 0.85, roughness: 0.5 }))
        : null;
      return { base, glass, facadeGlass, doorGlass, strip };
    }

    // Tramo recto de pared (alineado a X o a Z) + su huella de colisión
    function buildWallRun(ax, az, bx, bz, style, accent) {
      const alongX = Math.abs(az - bz) < 1e-6;
      const len = alongX ? Math.abs(bx - ax) : Math.abs(bz - az);
      if (len < 0.04) return;
      const cx = (ax + bx) / 2, cz = (az + bz) / 2;
      const g = new THREE.Group();
      g.position.set(cx, 0, cz);
      if (!alongX) g.rotation.y = Math.PI / 2;
      const M = getWallMats(accent);

      if (style === 'facade') {
        addPart(g, officeBox(len, FACADE_H, 0.06), M.facadeGlass, 0, FACADE_H / 2, 0, { cast: false, receive: false });
        addPart(g, officeBox(len, 0.1, 0.16), OFFICE_MAT.aluminium, 0, 0.05, 0);
        addPart(g, officeBox(len, 0.1, 0.16), OFFICE_MAT.aluminium, 0, FACADE_H, 0, { cast: false });
        const n = Math.max(1, Math.round(len / 3.6));
        for (let k = 0; k <= n; k++) {
          addPart(g, officeBox(0.08, FACADE_H, 0.14), OFFICE_MAT.aluminium, -len / 2 + (len * k) / n, FACADE_H / 2, 0, { cast: false });
        }
      } else {
        const L = len + WALL_T; // solapa las esquinas
        addPart(g, officeBox(L, WALL_BASE_H, WALL_T), M.base, 0, WALL_BASE_H / 2, 0);
        addPart(g, officeBox(L + 0.004, 0.09, WALL_T + 0.012), OFFICE_MAT.edgeBand, 0, 0.045, 0, { cast: false });
        if (M.strip) addPart(g, officeBox(L, 0.03, WALL_T + 0.016), M.strip, 0, WALL_BASE_H + 0.015, 0, { cast: false });
        const gh = WALL_H - WALL_BASE_H - 0.03;
        const gy = WALL_BASE_H + 0.03 + gh / 2;
        addPart(g, officeBox(len, gh, 0.04), M.glass, 0, gy, 0, { cast: false, receive: false });
        addPart(g, officeBox(L, 0.06, 0.1), OFFICE_MAT.aluminium, 0, WALL_H, 0, { cast: false });
        const n = Math.max(1, Math.round(len / 2.4));
        for (let k = 0; k <= n; k++) {
          addPart(g, officeBox(0.05, gh, 0.07), OFFICE_MAT.aluminium, -len / 2 + (len * k) / n, gy, 0, { cast: false });
        }
      }
      scene.add(g);

      const half = (style === 'facade' ? 0.1 : WALL_T) / 2;
      if (alongX) COLLIDERS.push({ x1: Math.min(ax, bx), x2: Math.max(ax, bx), z1: cz - half, z2: cz + half, kind: 'wall', tag: BUILD_TAG });
      else COLLIDERS.push({ x1: cx - half, x2: cx + half, z1: Math.min(az, bz), z2: Math.max(az, bz), kind: 'wall', tag: BUILD_TAG });
    }

    // Puerta corrediza de vidrio de dos hojas que se abre sola al acercarse alguien
    function buildDoor(cx, cz, alongX, width, style) {
      const facade = style === 'facade';
      const topH = facade ? FACADE_H : WALL_H;
      const doorH = facade ? 2.55 : 2.1;
      const g = new THREE.Group();
      g.position.set(cx, 0, cz);
      if (!alongX) g.rotation.y = Math.PI / 2;
      const M = getWallMats();

      [-1, 1].forEach(sx => {
        addPart(g, officeBox(0.07, topH, facade ? 0.16 : 0.14), OFFICE_MAT.aluminium, sx * (width / 2), topH / 2, 0, { cast: false });
      });
      addPart(g, officeBox(width, 0.08, facade ? 0.16 : 0.13), OFFICE_MAT.aluminium, 0, doorH + 0.04, 0, { cast: false });
      const transomH = topH - doorH - 0.08;
      if (transomH > 0.05) {
        addPart(g, officeBox(width, transomH, 0.04), facade ? M.facadeGlass : M.glass, 0, doorH + 0.08 + transomH / 2, 0, { cast: false, receive: false });
      }
      addPart(g, officeBox(width, 0.012, 0.24), OFFICE_MAT.aluminium, 0, 0.006, 0, { cast: false });

      const lw = width / 2 + 0.02;
      const leafH = doorH - 0.04;
      const makeLeaf = (sx) => {
        const leaf = new THREE.Group();
        addPart(leaf, officeBox(lw, leafH, 0.03), M.doorGlass, 0, leafH / 2 + 0.02, 0, { cast: false, receive: false });
        addPart(leaf, officeBox(0.035, leafH, 0.045), OFFICE_MAT.aluminium, -sx * (lw / 2 - 0.018), leafH / 2 + 0.02, 0, { cast: false });
        addPart(leaf, officeBox(lw, 0.035, 0.045), OFFICE_MAT.aluminium, 0, leafH + 0.02, 0, { cast: false });
        addPart(leaf, officeBox(lw, 0.035, 0.045), OFFICE_MAT.aluminium, 0, 0.035, 0, { cast: false });
        addPart(leaf, officeBox(0.025, 0.42, 0.07), OFFICE_MAT.chrome, -sx * (lw / 2 - 0.09), 1.05, 0, { cast: false });
        leaf.position.set(sx * width / 4, 0, 0.12);
        g.add(leaf);
        DOOR_LEAVES.add(leaf);
        return leaf;
      };
      const left = makeLeaf(-1);
      const right = makeLeaf(1);
      scene.add(g);
      DOORS.push({ x: cx, z: cz, width, slide: (width / 2) * 0.96, left, right, open: 0, tag: BUILD_TAG });
    }

    // Pared con huecos de puerta: doors = [{ at, width }] sobre el eje de la pared
    function buildWallWithDoors(ax, az, bx, bz, doors, style, accent) {
      const alongX = Math.abs(az - bz) < 1e-6;
      const start = alongX ? Math.min(ax, bx) : Math.min(az, bz);
      const end = alongX ? Math.max(ax, bx) : Math.max(az, bz);
      const fixed = alongX ? az : ax;
      const seg = (p, q) => {
        if (q - p < 0.04) return;
        if (alongX) buildWallRun(p, fixed, q, fixed, style, accent);
        else buildWallRun(fixed, p, fixed, q, style, accent);
      };
      let cur = start;
      doors.slice().sort((a, b) => a.at - b.at).forEach(d => {
        seg(cur, d.at - d.width / 2);
        if (alongX) buildDoor(d.at, fixed, true, d.width, style);
        else buildDoor(fixed, d.at, false, d.width, style);
        cur = d.at + d.width / 2;
      });
      seg(cur, end);
    }

    function buildRoomWalls(zone) {
      const x1 = zone.x - zone.w / 2, x2 = zone.x + zone.w / 2;
      const z1 = zone.z - zone.d / 2, z2 = zone.z + zone.d / 2;
      const sides = { n: [x1, z1, x2, z1], s: [x1, z2, x2, z2], w: [x1, z1, x1, z2], e: [x2, z1, x2, z2] };
      Object.keys(sides).forEach(side => {
        if ((zone.skipWalls || []).includes(side)) return;
        const doors = (zone.doors || []).filter(d => d.side === side);
        const [ax, az, bx, bz] = sides[side];
        buildWallWithDoors(ax, az, bx, bz, doors, 'room', zone.color);
      });
    }

    function buildAllWalls() {
      Object.values(ZONES).forEach(zone => buildRoomWalls(zone));
      // Fachada principal (con la entrada a Recepción) y laterales del edificio
      buildWallWithDoors(-40, 21, 25, 21, [{ at: 4, width: 2.6 }], 'facade');
      buildWallWithDoors(-40, -13.2, -40, 21, [], 'facade');   // fachada oeste: vista al parque
      buildWallWithDoors(25, -13.2, 25, 21, [], 'facade');
      buildWallWithDoors(-40, -13.2, -20.5, -13.2, [], 'facade'); // ala oeste: vista a la ciudad
      // la cristalera trasera original ya existe: solo se registra su colisión
      COLLIDERS.push({ x1: -20.5, x2: 25, z1: -13.28, z2: -13.12, kind: 'wall' });
    }

    function updateDoors(dt) {
      const blend = Math.min(1, dt * 5);
      for (let i = 0; i < DOORS.length; i++) {
        const d = DOORS[i];
        let want = 0;
        for (let j = 0; j < AGENTS.length; j++) {
          const dx = AGENTS[j].pos.x - d.x, dz = AGENTS[j].pos.z - d.z;
          if (dx * dx + dz * dz < 2.9) { want = 1; break; }
        }
        const nv = d.open + (want - d.open) * blend;
        if (Math.abs(nv - d.open) < 0.0004) continue;
        d.open = nv;
        d.left.position.x = -d.width / 4 - nv * d.slide;
        d.right.position.x = d.width / 4 + nv * d.slide;
      }
    }

    // ------------------------------------------------------------------------
    // 3.4e EXTERIOR, RECEPCIÓN Y SALA DE ENTREVISTAS
    // ------------------------------------------------------------------------
    function drawPaving(ctx, w, h, rand) {
      ctx.fillStyle = '#8d949c';
      ctx.fillRect(0, 0, w, h);
      const n = 4, s = w / n;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const l = 128 + Math.floor(rand() * 26);
          ctx.fillStyle = `rgb(${l},${l + 4},${l + 10})`;
          ctx.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
          for (let k = 0; k < 40; k++) {
            const v = Math.floor(rand() * 40) + 100;
            ctx.fillStyle = `rgba(${v},${v},${v},0.25)`;
            ctx.fillRect(i * s + rand() * s, j * s + rand() * s, 2, 2);
          }
        }
      }
    }

    // Yeso pintado: manchas suaves y microtextura para los zócalos de las paredes
    function drawPlaster(ctx, w, h, rand) {
      ctx.fillStyle = '#ece8e1';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 140; i++) {
        const l = 220 + Math.floor(rand() * 30);
        ctx.fillStyle = `rgba(${l},${l - 3},${l - 8},0.18)`;
        ctx.beginPath();
        ctx.arc(rand() * w, rand() * h, 6 + rand() * 26, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 2600; i++) {
        const v = 200 + Math.floor(rand() * 55);
        ctx.fillStyle = `rgba(${v},${v},${v},0.22)`;
        ctx.fillRect(rand() * w, rand() * h, 1, 1);
      }
    }

    function drawTiles(ctx, w, h, rand) {
      ctx.fillStyle = '#b9c0c8';
      ctx.fillRect(0, 0, w, h);
      const n = 4, s = w / n;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const l = 226 + Math.floor(rand() * 18);
          ctx.fillStyle = `rgb(${l},${l},${l + 2})`;
          ctx.fillRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3);
        }
      }
    }

    function drawGrass(ctx, w, h, rand) {
      ctx.fillStyle = '#3f7a35';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) {
        const g = 90 + Math.floor(rand() * 70);
        ctx.strokeStyle = `rgba(${40 + Math.floor(rand() * 40)},${g + 30},${30 + Math.floor(rand() * 30)},0.55)`;
        ctx.lineWidth = 1;
        const x = rand() * w, y = rand() * h;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (rand() - 0.5) * 3, y - 3 - rand() * 4);
        ctx.stroke();
      }
    }

    function drawWater(ctx, w, h, rand) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#2b7fa8');
      g.addColorStop(1, '#1d5f86');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        ctx.strokeStyle = `rgba(200,235,255,${0.12 + rand() * 0.2})`;
        ctx.lineWidth = 1 + rand() * 1.5;
        const x = rand() * w, y = rand() * h, r = 6 + rand() * 22;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function drawSign(ctx, w, h, title, subtitle, accent) {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#0b1220');
      g.addColorStop(1, '#16213a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(4, h * 0.03);
      ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f8fafc';
      ctx.font = `800 ${Math.round(h * 0.34)}px Inter, Arial, sans-serif`;
      ctx.fillText(title, w / 2, h * 0.42, w * 0.9);
      ctx.fillStyle = accent;
      ctx.font = `600 ${Math.round(h * 0.14)}px Inter, Arial, sans-serif`;
      ctx.fillText(subtitle, w / 2, h * 0.76, w * 0.92);
    }

    function buildSignPanel(key, x, y, z, w, h, rotY, title, subtitle, accent) {
      const tex = makeOfficeTexture(key, 1024, Math.round(1024 * h / w), (c, cw, ch) => drawSign(c, cw, ch, title, subtitle, accent), { color: true, clamp: true });
      const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.5, roughness: 0.4 });
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = rotY;
      addPart(g, officeBox(w + 0.08, h + 0.08, 0.06), OFFICE_MAT.bezel, 0, y, -0.035, { cast: false });
      const face = new THREE.Mesh(cachedGeo('Plane', w, h), mat);
      face.position.set(0, y, 0.0);
      g.add(face);
      scene.add(g);
      return g;
    }

    function buildStreetLamp(x, z) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      addPart(g, cachedGeo('Cylinder', 0.16, 0.2, 0.12, 16), OFFICE_MAT.bezel, 0, 0.06, 0);
      addPart(g, cachedGeo('Cylinder', 0.045, 0.055, 3.4, 10), OFFICE_MAT.aluminium, 0, 1.75, 0);
      addPart(g, officeBox(0.5, 0.08, 0.22), OFFICE_MAT.aluminium, 0, 3.45, 0, { cast: false });
      addPart(g, officeBox(0.42, 0.03, 0.16), OFFICE_MAT.bulb, 0, 3.4, 0, { cast: false });
      scene.add(g);
      addCollider(x, z, 0.34, 0.34);
    }

    function buildExteriorPlaza() {
      const paving = makeOfficeTexture('paving', 256, 256, drawPaving, { seed: 909, color: true });
      const plazaMat = new THREE.MeshStandardMaterial({
        map: officeTexRepeat(paving, 32.5, 3.75), bumpMap: officeTexRepeat(OFFICE_TEX.noise, 42, 5), bumpScale: 0.01, roughness: 0.92
      });
      const plaza = new THREE.Mesh(cachedGeo('Box', 65, 0.3, 7.5), plazaMat);
      plaza.position.set(-7.5, -0.15, 24.75);
      plaza.receiveShadow = true;
      scene.add(plaza);

      // bordillo, franja verde y calle
      const curb = new THREE.Mesh(cachedGeo('Box', 83, 0.14, 0.3), OFFICE_MAT.potConcrete);
      curb.position.set(-16.5, 0.02, 28.6);
      curb.receiveShadow = true;
      scene.add(curb);
      const grassMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x3f7d3a).convertSRGBToLinear(), roughness: 1.0 });
      [[-21.5, 22.3, 34, 1.4], [16.5, 22.3, 17, 1.4]].forEach(([gx, gz, gw, gd]) => {
        const grass = new THREE.Mesh(cachedGeo('Box', gw, 0.06, gd), grassMat);
        grass.position.set(gx, 0.03, gz);
        grass.receiveShadow = true;
        scene.add(grass);
      });
      const asphalt = new THREE.Mesh(cachedGeo('Box', 83, 0.2, 5), new THREE.MeshStandardMaterial({ color: new THREE.Color(0x2b2f36).convertSRGBToLinear(), roughness: 0.95 }));
      asphalt.position.set(-16.5, -0.12, 31.25);
      asphalt.receiveShadow = true;
      scene.add(asphalt);

      // Parque al oeste: la vista del Comedor y de la Sala de Reuniones B
      const parkGrass = makeOfficeTexture('grass', 256, 256, drawGrass, { seed: 717, color: true });
      const park = new THREE.Mesh(cachedGeo('Box', 18, 0.3, 42.5), new THREE.MeshStandardMaterial({ map: officeTexRepeat(parkGrass, 9, 21), roughness: 1.0 }));
      park.position.set(-49, -0.16, 7.25);
      park.receiveShadow = true;
      scene.add(park);
      const pathMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0xb8a98f).convertSRGBToLinear(), roughness: 0.95 });
      const parkPath = new THREE.Mesh(cachedGeo('Box', 1.6, 0.04, 42), pathMat);
      parkPath.position.set(-46.5, 0.0, 7.25);
      parkPath.receiveShadow = true;
      scene.add(parkPath);
      [[-43.5, -10], [-51, -6.5], [-44, -1.5], [-53, 3], [-43.8, 8], [-50.5, 12.5], [-44.2, 17.5], [-52.5, 21], [-49, -12.5], [-55, -2]].forEach(([tx, tz], i) => {
        buildTree(tx, tz, 1.1 + (i % 3) * 0.22, false);
      });
      [[-48.2, -4], [-48.2, 10], [-48.2, 19]].forEach(([bx, bz]) => buildBench(bx, bz, Math.PI / 2, false));
      const dashMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });
      for (let dx = -56; dx <= 23; dx += 3) {
        const dash = new THREE.Mesh(cachedGeo('Box', 1.4, 0.01, 0.12), dashMat);
        dash.position.set(dx, -0.015, 31.25);
        scene.add(dash);
      }

      // felpudo de entrada, árboles y farolas
      const mat = new THREE.Mesh(cachedGeo('Box', 2.6, 0.012, 1.2), OFFICE_MAT.bezel);
      mat.position.set(4, 0.006, 21.8);
      scene.add(mat);
      [-35, -29, -23, -17, -11, -5, 13, 19].forEach(px => buildPlant(px, 22.3, 1.55));
      buildStreetLamp(-1.5, 23.6);
      buildStreetLamp(9.5, 23.6);
      buildStreetLamp(-20, 23.6);
      buildSignPanel('sign_main', 4, 3.75, 21.1, 4.4, 1.0, 0, BRAND_UPPER, 'OFICINA · WEBS · APPS · JUEGOS · SOFTWARE', '#22d3ee');
    }

    // Árbol: tronco + copa de varias esferas (collide = registra el tronco como obstáculo)
    function buildTree(x, z, scale = 1, collide = true) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.scale.setScalar(scale);
      const bark = cachedMat('bark', () => new THREE.MeshStandardMaterial({ color: new THREE.Color(0x5b4030).convertSRGBToLinear(), roughness: 0.95 }));
      const crownA = cachedMat('crownA', () => new THREE.MeshStandardMaterial({ color: new THREE.Color(0x2f7d3f).convertSRGBToLinear(), roughness: 0.85 }));
      const crownB = cachedMat('crownB', () => new THREE.MeshStandardMaterial({ color: new THREE.Color(0x3f9a4c).convertSRGBToLinear(), roughness: 0.85 }));
      addPart(g, cachedGeo('Cylinder', 0.12, 0.18, 1.7, 10), bark, 0, 0.85, 0);
      const ball = cachedGeo('Sphere', 1, 14, 10);
      const rand = officeRandom(officeHash('tree|' + x + '|' + z));
      [[0, 2.15, 0, 0.95], [0.45, 1.9, 0.2, 0.7], [-0.4, 1.95, -0.25, 0.72], [0.1, 2.6, -0.1, 0.62]].forEach(([px, py, pz, r], i) => {
        const m = new THREE.Mesh(ball, i % 2 ? crownB : crownA);
        const rr = r * (0.9 + rand() * 0.25);
        m.scale.set(rr, rr * 0.85, rr);
        m.position.set(px, py, pz);
        m.castShadow = true;
        m.receiveShadow = true;
        g.add(m);
      });
      scene.add(g);
      if (collide) addCollider(x, z, 0.5 * scale, 0.5 * scale);
      return g;
    }

    // Banco de madera con patas metálicas (rotY 0 = mira a +z)
    function buildBench(x, z, rotY = 0, collide = true, w = 1.6) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = rotY;
      for (let i = 0; i < 3; i++) addPart(g, officeBox(w, 0.04, 0.12), OFFICE_MAT.walnut, 0, 0.45, -0.14 + i * 0.14);
      for (let i = 0; i < 2; i++) addPart(g, officeBox(w, 0.1, 0.03), OFFICE_MAT.walnut, 0, 0.62 + i * 0.14, -0.24);
      [-1, 1].forEach(sx => {
        addPart(g, officeBox(0.05, 0.45, 0.42), OFFICE_MAT.metalLeg, sx * (w / 2 - 0.12), 0.225, 0);
        addPart(g, officeBox(0.05, 0.4, 0.05), OFFICE_MAT.metalLeg, sx * (w / 2 - 0.12), 0.65, -0.24);
      });
      scene.add(g);
      if (collide) addCollider(x, z, w, 0.5, rotY);
      return g;
    }

    function buildReceptionAndInterview() {
      // Mostrador de recepción: tablero de mármol, frente de listones y franja luminosa
      buildOfficeDesk(4, 15.0, 3.6, 0.9, OFFICE_MAT.marble, { height: 1.05, panel: false });
      const front = new THREE.Mesh(officeBox(3.6, 1.0, 0.06), OFFICE_MAT.walnutSlats);
      front.position.set(4, 0.52, 15.43);
      front.castShadow = true;
      front.receiveShadow = true;
      scene.add(front);
      const glow = new THREE.Mesh(officeBox(3.4, 0.03, 0.02), cachedMat('deskGlow|' + 0xfb7185, () => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xfb7185, emissiveIntensity: 1.4 })));
      glow.position.set(4, 0.12, 15.47);
      scene.add(glow);
      buildMonitor(3.3, 1.05, 14.85, 0.7, 0.4, 'tickets', { rotY: Math.PI });
      buildKeyboardAndMouse(3.3, 1.05, 14.6, Math.PI);
      buildCup(scene, 5.2, 1.05, 14.8, { saucer: true, accent: 0xfb7185 });
      buildOfficeChair(4, 13.65, 0, { seatMat: OFFICE_MAT.mesh });
      buildSignPanel('sign_reception', 4, 1.65, 12.1, 3.4, 0.9, 0, BRAND_UPPER, 'BIENVENIDO · RECEPCIÓN & TALENTO', '#fb7185');

      // Sala de espera: dos sofás, mesa redonda y alfombra
      const waitRug = new THREE.Mesh(cachedGeo('Plane', 3.6, 4.6), new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x3b3552).convertSRGBToLinear(), map: officeTexRepeat(OFFICE_TEX.fabric_c, 6, 6), roughness: 0.98,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
      }));
      waitRug.rotation.x = -Math.PI / 2;
      waitRug.position.set(0.0, 0.014, 18.0);
      waitRug.receiveShadow = true;
      scene.add(waitRug);
      buildSofa(0.2, 20.1, Math.PI, OFFICE_MAT.sofaFabric);
      buildSofa(-1.75, 16.8, Math.PI / 2, OFFICE_MAT.leather);
      const rtable = new THREE.Group();
      rtable.position.set(0.35, 0, 17.7);
      scene.add(rtable);
      addPart(rtable, cachedGeo('Cylinder', 0.4, 0.4, 0.04, 28), OFFICE_MAT.walnut, 0, 0.42, 0);
      addPart(rtable, cachedGeo('Cylinder', 0.03, 0.03, 0.4, 10), OFFICE_MAT.metalLeg, 0, 0.2, 0);
      addPart(rtable, cachedGeo('Cylinder', 0.22, 0.24, 0.02, 20), OFFICE_MAT.metalLeg, 0, 0.01, 0);
      [0xf8fafc, 0xfb7185].forEach((mc, i) => {
        const mag = new THREE.Mesh(officeBox(0.24, 0.008, 0.32), new THREE.MeshStandardMaterial({ color: mc, roughness: 0.55 }));
        mag.position.set(-0.08 + i * 0.12, 0.445 + i * 0.009, 0.02);
        mag.rotation.y = 0.3 + i * 0.4;
        rtable.add(mag);
      });
      addCollider(0.35, 17.7, 0.8, 0.8);
      [[-1.9, 12.6, 1.0], [9.9, 12.6, 1.0], [9.9, 20.4, 1.1], [-1.9, 20.4, 0.9]].forEach(([px, pz, s]) => buildPlant(px, pz, s));
      buildWallDisplay(10.3, 1.5, 18.6, 1.4, 0.8, 'kanban', -Math.PI / 2, false);

      // Sala de entrevistas: mesa entre dos sillas enfrentadas
      buildOfficeDesk(14, 15, 1.3, 1.6, OFFICE_MAT.walnut, { height: 0.75, panel: false });
      buildOfficeChair(15.25, 15, -Math.PI / 2, { tall: true, seatMat: OFFICE_MAT.blackLeather });
      buildOfficeChair(12.75, 15, Math.PI / 2, { seatMat: OFFICE_MAT.mesh });
      buildLaptop(14.35, 0.75, 15, Math.PI / 2, 'kpi');
      for (let i = 0; i < 3; i++) {
        const sheet = new THREE.Mesh(officeBox(0.22, 0.003, 0.3), OFFICE_MAT.paper);
        sheet.position.set(13.65, 0.752 + i * 0.004, 15.25);
        sheet.rotation.y = (i - 1) * 0.08;
        scene.add(sheet);
      }
      buildCup(scene, 13.6, 0.75, 14.55, {});
      buildCup(scene, 14.5, 0.75, 15.5, { saucer: true, accent: 0x8b5cf6 });
      buildWallDisplay(14, 1.55, 12.2, 2.2, 1.0, 'kpi', 0, false);
      buildPlant(16.4, 12.6, 0.95);
      buildPlant(11.1, 17.4, 0.9);
    }

    // ------------------------------------------------------------------------
    // 3.4f NAVEGACIÓN: rejilla de colisión + A* + suavizado de ruta
    // ------------------------------------------------------------------------
    const NAV = { cell: 0.25, minX: -40.2, maxX: 25, minZ: -13.3, maxZ: 28.4, cols: 0, rows: 0, grid: null };
    const AGENT_RADIUS = 0.25;
    const AGENT_SPEED = 2.4; // m/s

    function buildNavGrid() {
      NAV.cols = Math.ceil((NAV.maxX - NAV.minX) / NAV.cell);
      NAV.rows = Math.ceil((NAV.maxZ - NAV.minZ) / NAV.cell);
      const cols = NAV.cols, rows = NAV.rows, cell = NAV.cell;
      const grid = new Uint8Array(cols * rows);
      for (let i = 0; i < COLLIDERS.length; i++) {
        const c = COLLIDERS[i];
        const r = c.kind === 'wall' ? AGENT_RADIUS + 0.05 : AGENT_RADIUS;
        const x1 = c.x1 - r, x2 = c.x2 + r, z1 = c.z1 - r, z2 = c.z2 + r;
        const gx1 = Math.max(0, Math.floor((x1 - NAV.minX) / cell));
        const gx2 = Math.min(cols - 1, Math.floor((x2 - NAV.minX) / cell));
        const gz1 = Math.max(0, Math.floor((z1 - NAV.minZ) / cell));
        const gz2 = Math.min(rows - 1, Math.floor((z2 - NAV.minZ) / cell));
        for (let gz = gz1; gz <= gz2; gz++) {
          const cz = NAV.minZ + (gz + 0.5) * cell;
          if (cz <= z1 || cz >= z2) continue;
          for (let gx = gx1; gx <= gx2; gx++) {
            const cx = NAV.minX + (gx + 0.5) * cell;
            if (cx > x1 && cx < x2) grid[gz * cols + gx] = 1;
          }
        }
      }
      for (let gx = 0; gx < cols; gx++) { grid[gx] = 1; grid[(rows - 1) * cols + gx] = 1; }
      for (let gz = 0; gz < rows; gz++) { grid[gz * cols] = 1; grid[gz * cols + cols - 1] = 1; }
      NAV.grid = grid;
      const n = cols * rows;
      NAV.g = new Float32Array(n);
      NAV.parent = new Int32Array(n);
      NAV.open = new Uint32Array(n);
      NAV.closed = new Uint32Array(n);
      NAV.searchId = 0;
    }

    function navIndex(x, z) {
      const gx = Math.floor((x - NAV.minX) / NAV.cell);
      const gz = Math.floor((z - NAV.minZ) / NAV.cell);
      if (gx < 0 || gz < 0 || gx >= NAV.cols || gz >= NAV.rows) return -1;
      return gz * NAV.cols + gx;
    }

    function navFree(i) {
      return i >= 0 && NAV.grid[i] === 0;
    }

    function isFreeWorld(x, z) {
      if (!NAV.grid) return true;
      return navFree(navIndex(x, z));
    }

    function navCellCenter(i) {
      return { x: NAV.minX + ((i % NAV.cols) + 0.5) * NAV.cell, z: NAV.minZ + (Math.floor(i / NAV.cols) + 0.5) * NAV.cell };
    }

    // Celda libre más cercana (búsqueda por anillos)
    function navNearestFree(x, z, maxR = 24) {
      const cx = Math.max(0, Math.min(NAV.cols - 1, Math.floor((x - NAV.minX) / NAV.cell)));
      const cz = Math.max(0, Math.min(NAV.rows - 1, Math.floor((z - NAV.minZ) / NAV.cell)));
      const i0 = cz * NAV.cols + cx;
      if (navFree(i0)) return i0;
      for (let r = 1; r <= maxR; r++) {
        let best = -1, bestD = Infinity;
        for (let dz = -r; dz <= r; dz++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
            const gx = cx + dx, gz = cz + dz;
            if (gx < 0 || gz < 0 || gx >= NAV.cols || gz >= NAV.rows) continue;
            const i = gz * NAV.cols + gx;
            if (NAV.grid[i] !== 0) continue;
            const d = dx * dx + dz * dz;
            if (d < bestD) { bestD = d; best = i; }
          }
        }
        if (best >= 0) return best;
      }
      return -1;
    }

    // Línea de visión sobre la rejilla (muestreo denso, todo con variables locales: es el bucle más caliente)
    function navLineFree(a, b) {
      const cell = NAV.cell, cols = NAV.cols, rows = NAV.rows, grid = NAV.grid;
      const x0 = (a.x - NAV.minX) / cell, z0 = (a.z - NAV.minZ) / cell;
      const dx = (b.x - NAV.minX) / cell - x0, dz = (b.z - NAV.minZ) / cell - z0;
      const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) * 2.5);
      let last = -1;
      for (let s = 0; s <= steps; s++) {
        const t = steps === 0 ? 0 : s / steps;
        const gx = Math.floor(x0 + dx * t), gz = Math.floor(z0 + dz * t);
        if (gx < 0 || gz < 0 || gx >= cols || gz >= rows) return false;
        const i = gz * cols + gx;
        if (i === last) continue;
        if (grid[i] !== 0) return false;
        last = i;
      }
      return true;
    }

    const NAV_DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];

    // Devuelve los puntos a recorrer (sin incluir el origen) o null si no hay ruta
    function findPath(sx, sz, tx, tz) {
      if (!NAV.grid) return [{ x: tx, z: tz }];
      const cols = NAV.cols, rows = NAV.rows, grid = NAV.grid;
      const s = navNearestFree(sx, sz);
      const goalRaw = navIndex(tx, tz);
      const goalFree = navFree(goalRaw);
      const t = goalFree ? goalRaw : navNearestFree(tx, tz);
      if (s < 0 || t < 0) return null;
      const end = goalFree ? { x: tx, z: tz } : navCellCenter(t);
      if (s === t) return [end];

      const id = ++NAV.searchId;
      const tgx = t % cols, tgz = Math.floor(t / cols);
      // A* ligeramente ponderado (×1.2): explora menos celdas; el suavizado posterior recupera rutas naturales
      const heur = (i) => {
        const dx = Math.abs((i % cols) - tgx), dz = Math.abs(Math.floor(i / cols) - tgz);
        return (dx + dz + (Math.SQRT2 - 2) * Math.min(dx, dz)) * 1.2;
      };
      const heapI = [], heapF = [];
      const push = (i, f) => {
        let k = heapI.length;
        heapI.push(i); heapF.push(f);
        while (k > 0) {
          const p = (k - 1) >> 1;
          if (heapF[p] <= f) break;
          heapI[k] = heapI[p]; heapF[k] = heapF[p];
          k = p;
        }
        heapI[k] = i; heapF[k] = f;
      };
      const pop = () => {
        const top = heapI[0];
        const li = heapI.pop(), lf = heapF.pop();
        const n = heapI.length;
        if (n > 0) {
          let k = 0;
          while (true) {
            let c = 2 * k + 1;
            if (c >= n) break;
            if (c + 1 < n && heapF[c + 1] < heapF[c]) c++;
            if (heapF[c] >= lf) break;
            heapI[k] = heapI[c]; heapF[k] = heapF[c];
            k = c;
          }
          heapI[k] = li; heapF[k] = lf;
        }
        return top;
      };

      NAV.g[s] = 0;
      NAV.open[s] = id;
      NAV.parent[s] = -1;
      push(s, heur(s));
      let found = false;
      while (heapI.length) {
        const cur = pop();
        if (NAV.closed[cur] === id) continue;
        NAV.closed[cur] = id;
        if (cur === t) { found = true; break; }
        const cx = cur % cols, cz = Math.floor(cur / cols);
        for (let k = 0; k < 8; k++) {
          const d = NAV_DIRS[k];
          const nx = cx + d[0], nz = cz + d[1];
          if (nx < 0 || nz < 0 || nx >= cols || nz >= rows) continue;
          const ni = nz * cols + nx;
          if (grid[ni] !== 0 || NAV.closed[ni] === id) continue;
          if (d[2] !== 1 && (grid[cz * cols + nx] !== 0 || grid[nz * cols + cx] !== 0)) continue; // sin cortar esquinas
          const ng = NAV.g[cur] + d[2];
          if (NAV.open[ni] !== id || ng < NAV.g[ni]) {
            NAV.open[ni] = id;
            NAV.g[ni] = ng;
            NAV.parent[ni] = cur;
            push(ni, ng + heur(ni));
          }
        }
      }
      if (!found) return null;

      const cells = [];
      for (let c = t; c !== -1; c = NAV.parent[c]) cells.push(c);
      cells.reverse();
      const pts = cells.map(navCellCenter);
      pts[pts.length - 1] = end;
      if (navFree(navIndex(sx, sz))) pts[0] = { x: sx, z: sz };

      // Suavizado: salta a la celda visible más lejana
      const out = [];
      let i = 0;
      if (pts[0].x !== sx || pts[0].z !== sz) out.push(pts[0]); // primero sale del obstáculo
      while (i < pts.length - 1) {
        let j = i + 1;
        while (j + 1 < pts.length && navLineFree(pts[i], pts[j + 1])) j++;
        out.push(pts[j]);
        i = j;
      }
      return out;
    }

    function planAgentPath(agent) {
      agent._navGoal = agent.targetPos;
      agent.pathIndex = 0;
      if (!agent.targetPos) { agent.path = []; return; }
      const p = findPath(agent.pos.x, agent.pos.z, agent.targetPos.x, agent.targetPos.z);
      agent.path = p || [];
    }

    function isAgentArrived(agent) {
      return agent._navGoal === agent.targetPos && (!agent.path || agent.pathIndex >= agent.path.length);
    }

    // [x, z, orientación, asiento?] -> destino; seat = el agente se sienta al llegar
    function spotToTarget(s) {
      return { x: s[0], z: s[1], yaw: s[2], seat: s[3] === 1 };
    }

    // ------------------------------------------------------------------------
    // 3.4g CIELO DÍA / NOCHE (cúpula con degradado, sol, luna, estrellas y nubes)
    // ------------------------------------------------------------------------
    const TOD_PRESETS = {
      noche: {
        skyTop: 0x020617, skyHorizon: 0x0c1a36, skyBottom: 0x060a14, bg: 0x060a14, fog: 0x060a14, fogDensity: 0.0095,
        hemiSky: 0xdbe7ff, hemiGround: 0x2a2018, hemiInt: 0.68, dirColor: 0xfff4e6, dirInt: 1.25, fillInt: 0.3,
        exposure: 1.05, tower: 0.75, stars: 0.9, sun: 0, moon: 1, clouds: 0.06, sign: 0.6
      },
      dia: {
        skyTop: 0x2f6fd0, skyHorizon: 0xcfe6fb, skyBottom: 0xaec6da, bg: 0xbcd7ee, fog: 0xc9def0, fogDensity: 0.0062,
        hemiSky: 0xeef6ff, hemiGround: 0x7d6b55, hemiInt: 1.05, dirColor: 0xfff3dc, dirInt: 2.0, fillInt: 0.5,
        exposure: 0.98, tower: 0.06, stars: 0, sun: 1, moon: 0, clouds: 0.92, sign: 0.25
      }
    };
    const SKY = { uniforms: null, stars: null, sun: null, halo: null, moon: null, cloudMat: null };
    const TOD = { t: 0, target: 0 };
    const _todA = new THREE.Color();
    const _todB = new THREE.Color();

    function buildSky() {
      SKY.uniforms = {
        topColor: { value: new THREE.Color(TOD_PRESETS.noche.skyTop) },
        horizonColor: { value: new THREE.Color(TOD_PRESETS.noche.skyHorizon) },
        bottomColor: { value: new THREE.Color(TOD_PRESETS.noche.skyBottom) }
      };
      const skyMat = new THREE.ShaderMaterial({
        uniforms: SKY.uniforms,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        vertexShader: `
          varying vec3 vDir;
          void main() {
            vDir = normalize((modelMatrix * vec4(position, 1.0)).xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 horizonColor;
          uniform vec3 bottomColor;
          varying vec3 vDir;
          void main() {
            float h = vDir.y;
            vec3 c = h >= 0.0
              ? mix(horizonColor, topColor, pow(clamp(h, 0.0, 1.0), 0.55))
              : mix(horizonColor, bottomColor, pow(clamp(-h, 0.0, 1.0), 0.4));
            gl_FragColor = vec4(c, 1.0);
          }`
      });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), skyMat);
      dome.renderOrder = -10;
      dome.frustumCulled = false;
      scene.add(dome);

      // Estrellas en el hemisferio superior
      const N = 520;
      const pos = new Float32Array(N * 3);
      const rand = officeRandom(2024);
      for (let i = 0; i < N; i++) {
        const th = rand() * Math.PI * 2;
        const y = 0.12 + rand() * 0.88;
        const r = Math.sqrt(1 - y * y);
        pos[i * 3] = Math.cos(th) * r * 140;
        pos[i * 3 + 1] = y * 140;
        pos[i * 3 + 2] = Math.sin(th) * r * 140;
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      SKY.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: 0xffffff, size: 1.7, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false, fog: false
      }));
      SKY.stars.frustumCulled = false;
      scene.add(SKY.stars);

      // Sol con halo, y luna
      SKY.sun = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff2c2, transparent: true, opacity: 0, fog: false, depthWrite: false }));
      SKY.sun.position.set(80, 70, -95);
      scene.add(SKY.sun);
      const haloTex = makeOfficeTexture('sun_halo', 128, 128, (c, w, h) => {
        const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gr.addColorStop(0, 'rgba(255,240,200,0.9)');
        gr.addColorStop(0.3, 'rgba(255,220,150,0.35)');
        gr.addColorStop(1, 'rgba(255,200,120,0)');
        c.fillStyle = gr;
        c.fillRect(0, 0, w, h);
      }, { color: true, clamp: true });
      SKY.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
      SKY.halo.position.copy(SKY.sun.position);
      SKY.halo.scale.set(48, 48, 1);
      scene.add(SKY.halo);
      SKY.moon = new THREE.Mesh(new THREE.SphereGeometry(4.5, 24, 16), new THREE.MeshBasicMaterial({ color: 0xe6ecf7, transparent: true, opacity: 1, fog: false, depthWrite: false }));
      SKY.moon.position.set(-75, 62, -100);
      scene.add(SKY.moon);

      // Nubes bajas y suaves (solo se notan de día)
      SKY.cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, fog: false, depthWrite: false });
      const cloudGeo = cachedGeo('Sphere', 1, 14, 10);
      for (let c = 0; c < 8; c++) {
        const cg = new THREE.Group();
        cg.position.set(-85 + rand() * 170, 40 + rand() * 10, -100 + rand() * 55);
        const puffs = 4 + Math.floor(rand() * 3);
        for (let p = 0; p < puffs; p++) {
          const puff = new THREE.Mesh(cloudGeo, SKY.cloudMat);
          const s = 4 + rand() * 4;
          puff.scale.set(s, s * 0.55, s);
          puff.position.set((p - puffs / 2) * 4.2 + rand() * 2, rand() * 1.5, rand() * 3);
          cg.add(puff);
        }
        scene.add(cg);
      }
    }

    function lerpColorTo(target, a, b, t) {
      _todA.setHex(a);
      _todB.setHex(b);
      target.copy(_todA).lerp(_todB, t);
    }

    function applyTimeOfDay(t) {
      const N = TOD_PRESETS.noche, D = TOD_PRESETS.dia;
      const mix = (a, b) => a + (b - a) * t;
      lerpColorTo(scene.background, N.bg, D.bg, t);
      lerpColorTo(scene.fog.color, N.fog, D.fog, t);
      scene.fog.density = mix(N.fogDensity, D.fogDensity);
      lerpColorTo(SKY.uniforms.topColor.value, N.skyTop, D.skyTop, t);
      lerpColorTo(SKY.uniforms.horizonColor.value, N.skyHorizon, D.skyHorizon, t);
      lerpColorTo(SKY.uniforms.bottomColor.value, N.skyBottom, D.skyBottom, t);
      if (SCENE_LIGHTS.hemi) {
        lerpColorTo(SCENE_LIGHTS.hemi.color, N.hemiSky, D.hemiSky, t);
        lerpColorTo(SCENE_LIGHTS.hemi.groundColor, N.hemiGround, D.hemiGround, t);
        SCENE_LIGHTS.hemi.intensity = mix(N.hemiInt, D.hemiInt);
      }
      if (SCENE_LIGHTS.dir) {
        lerpColorTo(SCENE_LIGHTS.dir.color, N.dirColor, D.dirColor, t);
        SCENE_LIGHTS.dir.intensity = mix(N.dirInt, D.dirInt);
      }
      if (SCENE_LIGHTS.fill) SCENE_LIGHTS.fill.intensity = mix(N.fillInt, D.fillInt);
      renderer.toneMappingExposure = mix(N.exposure, D.exposure);
      const towerI = mix(N.tower, D.tower);
      for (let i = 0; i < TOWER_MATS.length; i++) TOWER_MATS[i].emissiveIntensity = towerI;
      SKY.stars.material.opacity = mix(N.stars, D.stars);
      SKY.stars.visible = SKY.stars.material.opacity > 0.01;
      SKY.sun.material.opacity = mix(N.sun, D.sun);
      SKY.halo.material.opacity = mix(N.sun, D.sun) * 0.9;
      SKY.sun.visible = SKY.halo.visible = SKY.sun.material.opacity > 0.01;
      SKY.moon.material.opacity = mix(N.moon, D.moon);
      SKY.moon.visible = SKY.moon.material.opacity > 0.01;
      SKY.cloudMat.opacity = mix(N.clouds, D.clouds);
      if (SKY.shaft) SKY.shaft.material.opacity = mix(0.035, 0.11);
    }

    function loadTimeOfDay() {
      try {
        const saved = localStorage.getItem('frp_time_of_day');
        if (saved === 'dia' || saved === 'noche') return saved;
      } catch (e) { /* sin almacenamiento */ }
      const h = new Date().getHours();
      return h >= 7 && h < 19 ? 'dia' : 'noche';
    }

    function updateTimeOfDayButtons() {
      const mode = TOD.target >= 0.5 ? 'dia' : 'noche';
      document.querySelectorAll('.tod-btn').forEach(b => {
        const active = b.dataset.tod === mode;
        b.classList.toggle('bg-amber-400/25', active && mode === 'dia');
        b.classList.toggle('text-amber-100', active && mode === 'dia');
        b.classList.toggle('bg-indigo-500/30', active && mode === 'noche');
        b.classList.toggle('text-indigo-100', active && mode === 'noche');
        b.classList.toggle('text-slate-400', !active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    function setTimeOfDay(mode) {
      const target = mode === 'dia' ? 1 : 0;
      if (TOD.target === target) return;
      TOD.target = target;
      try { localStorage.setItem('frp_time_of_day', mode); } catch (e) { /* sin persistencia */ }
      updateTimeOfDayButtons();
      showToast(mode === 'dia' ? '☀️ Modo día' : '🌙 Modo noche');
    }

    function updateTimeOfDay(dt) {
      if (TOD.t === TOD.target) return;
      const step = dt / 1.6;
      TOD.t = TOD.target > TOD.t ? Math.min(TOD.target, TOD.t + step) : Math.max(TOD.target, TOD.t - step);
      const e = TOD.t * TOD.t * (3 - 2 * TOD.t);
      applyTimeOfDay(e);
    }

    // ------------------------------------------------------------------------
    // 3.4h SALAS NUEVAS: reuniones, comedor, cocina, servicio, programación, gimnasio, formación y jardín
    // ------------------------------------------------------------------------
    const BUTTERFLIES = [];
    const NATURE_ANIMATED = new Set();

    function solidMat(key, hex, opts = {}) {
      return cachedMat('solid|' + key, () => new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(hex).convertSRGBToLinear(), roughness: 0.6 }, opts)));
    }

    function buildBoardroom(zone) {
      const dir = zone.boardroom.head;
      const cx = zone.x, cz = zone.z;
      const tableLen = boardroomTableLen(zone);
      const lastSide = zone.spots.length - 1; // el último puesto es el pie de la mesa
      buildOfficeDesk(cx, cz, tableLen, 1.6, OFFICE_MAT.walnut, { height: 0.76, panel: false });
      // franja central con regletas y micrófonos
      addPart(scene, officeBox(tableLen - 1.0, 0.012, 0.32), OFFICE_MAT.bezel, cx, 0.766, cz, { cast: false });
      [-tableLen / 3, 0, tableLen / 3].forEach(dx => addPart(scene, cachedGeo('Cylinder', 0.09, 0.1, 0.03, 20), OFFICE_MAT.bezel, cx + dx, 0.785, cz, { cast: false }));

      zone.spots.forEach((s, i) => {
        const head = i === 0;
        buildOfficeChair(s[0], s[1], s[2], head
          ? { tall: true, seatMat: OFFICE_MAT.blackLeather, accent: zone.color }
          : { seatMat: OFFICE_MAT.mesh });
        if (!head && i < lastSide && i % 2 === 1) {
          // portátil delante de cada otro asiento lateral, mirando a su silla
          const towardTable = s[1] < cz ? 1 : -1;
          buildLaptop(s[0], 0.76, s[1] + towardTable * 0.82, towardTable > 0 ? Math.PI : 0, i % 4 === 1 ? 'kpi' : 'kanban');
        } else if (!head && i < lastSide) {
          const towardTable = s[1] < cz ? 1 : -1;
          buildCup(scene, s[0] + 0.18, 0.76, s[1] + towardTable * 0.75, {});
        }
      });

      // Pantalla principal de presentaciones en la pared del pie de la mesa
      const footWallX = cx - dir * (zone.w / 2 - 0.1);
      buildWallDisplay(footWallX, 1.6, cz, 3.4, 1.7, 'kpi', dir > 0 ? Math.PI / 2 : -Math.PI / 2, false);
      // Pantalla secundaria en la pared lateral
      const sideZ = dir > 0 ? zone.z - zone.d / 2 + 0.1 : zone.z + zone.d / 2 - 0.1;
      buildWallDisplay(cx + (dir > 0 ? 0 : 1.25), 1.55, sideZ, 2.4, 1.2, 'kanban', dir > 0 ? 0 : Math.PI, false);

      // Atril para el presentador junto a la pantalla
      const lx = footWallX + dir * 0.55, lz = cz - 2.6;
      const lect = new THREE.Group();
      lect.position.set(lx, 0, lz);
      lect.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      addPart(lect, officeBox(0.5, 1.0, 0.36), OFFICE_MAT.walnutSlats, 0, 0.5, 0);
      const top = addPart(lect, officeBox(0.56, 0.04, 0.42), OFFICE_MAT.walnut, 0, 1.04, 0.02);
      top.rotation.x = 0.25;
      addPart(lect, cachedGeo('Cylinder', 0.006, 0.006, 0.28, 6), OFFICE_MAT.chrome, 0.15, 1.2, -0.1, { cast: false });
      scene.add(lect);
      addCollider(lx, lz, 0.5, 0.4, lect.rotation.y);

      if (dir > 0) {
        buildPlant(zone.x + zone.w / 2 - 0.5, zone.z - zone.d / 2 + 0.5, 0.95);
      } else {
        buildPlant(zone.x - zone.w / 2 + 0.5, zone.z - zone.d / 2 + 0.5, 1.0);
        buildPlant(zone.x - zone.w / 2 + 0.5, zone.z + zone.d / 2 - 0.5, 1.0);
      }
    }

    function buildDiningChair(x, z, rotY) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = rotY;
      addPart(g, officeBox(0.44, 0.05, 0.42), OFFICE_MAT.walnut, 0, 0.46, 0);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
        addPart(g, cachedGeo('Cylinder', 0.018, 0.018, 0.46, 8), OFFICE_MAT.metalLeg, sx * 0.19, 0.23, sz * 0.18, { cast: false });
      });
      const back = addPart(g, officeBox(0.44, 0.36, 0.04), OFFICE_MAT.walnut, 0, 0.72, -0.2);
      back.rotation.x = -0.08;
      scene.add(g);
    }

    function buildDiningAndKitchen() {
      // --- Comedor: 5 mesas de 6 = 30 puestos, buffet y bebidas ---
      const plateMat = OFFICE_MAT.ceramic;
      const foodMats = [0xf59e0b, 0x22c55e, 0xef4444, 0xfde68a, 0x92400e].map((c, i) => solidMat('food' + i, c, { roughness: 0.7 }));
      DINING_TABLES.forEach(([tx, tz], t) => {
        buildOfficeDesk(tx, tz, 2.4, 0.9, OFFICE_MAT.oak, { height: 0.75, panel: false });
        [-0.8, 0, 0.8].forEach((dx, k) => {
          [-1, 1].forEach(side => {
            buildDiningChair(tx + dx, tz + side * 0.75, side < 0 ? 0 : Math.PI);
            const pz = tz + side * 0.26;
            addPart(scene, cachedGeo('Cylinder', 0.12, 0.1, 0.015, 20), plateMat, tx + dx, 0.758, pz, { cast: false });
            if ((t + k + (side > 0 ? 1 : 0)) % 2 === 0) {
              const food = addPart(scene, cachedGeo('Sphere', 0.06, 10, 8), foodMats[(t + k) % foodMats.length], tx + dx, 0.78, pz, { cast: false });
              food.scale.set(1, 0.45, 1);
            }
          });
        });
        // jarrón con flores en el centro de cada mesa
        addPart(scene, cachedGeo('Cylinder', 0.045, 0.06, 0.18, 14), OFFICE_MAT.ceramic, tx, 0.84, tz);
        addPart(scene, cachedGeo('Sphere', 0.08, 10, 8), solidMat('flowerPink', 0xf472b6), tx, 0.97, tz, { cast: false });
        [-0.8, 0.8].forEach(dx => buildPendantLamp(tx + dx, 2.2, tz));
      });

      // buffet de autoservicio junto a la puerta de la cocina
      const bx = -27.3, bz = -10.2;
      addPart(scene, officeBox(0.8, 0.9, 4.4), OFFICE_MAT.steel, bx, 0.45, bz);
      addPart(scene, officeBox(0.84, 0.03, 4.44), OFFICE_MAT.marble, bx, 0.915, bz, { cast: false });
      const guard = addPart(scene, officeBox(0.04, 0.45, 4.3), getWallMats().doorGlass, bx + 0.18, 1.2, bz, { cast: false, receive: false });
      guard.rotation.z = -0.2;
      for (let i = 0; i < 6; i++) {
        addPart(scene, officeBox(0.5, 0.05, 0.55), OFFICE_MAT.chrome, bx, 0.955, bz - 1.75 + i * 0.7, { cast: false });
        const f = addPart(scene, officeBox(0.42, 0.04, 0.46), foodMats[i % foodMats.length], bx, 0.985, bz - 1.75 + i * 0.7, { cast: false });
        f.scale.y = 1;
      }
      addCollider(bx, bz, 0.8, 4.4);
      // estación de bebidas
      addPart(scene, officeBox(1.2, 0.95, 0.55), OFFICE_MAT.walnutSlats, -28.4, 0.475, -1.2);
      addPart(scene, officeBox(1.24, 0.03, 0.58), OFFICE_MAT.marble, -28.4, 0.965, -1.2, { cast: false });
      const waterMat = cachedMat('waterJug', () => new THREE.MeshStandardMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.55, roughness: 0.05 }));
      [-28.75, -28.05].forEach(wx => addPart(scene, cachedGeo('Cylinder', 0.12, 0.12, 0.42, 16), waterMat, wx, 1.19, -1.25, { cast: false }));
      addCollider(-28.4, -1.2, 1.2, 0.55);
      buildPlant(-39.3, -12.5, 1.1);
      buildPlant(-39.3, -1.1, 1.0);
      buildSignPanel('sign_menu', -26.1, 1.7, -2.8, 1.8, 1.0, -Math.PI / 2, 'MENÚ DEL DÍA', 'LASAÑA · ENSALADA · FRUTA', '#facc15');

      // --- Cocina ---
      const steel = OFFICE_MAT.steel;
      addPart(scene, officeBox(6.4, 0.9, 0.7), steel, -22.4, 0.45, -12.75);
      addPart(scene, officeBox(6.44, 0.03, 0.74), OFFICE_MAT.marble, -22.4, 0.915, -12.75, { cast: false });
      addCollider(-22.4, -12.75, 6.4, 0.7);
      const burnerMat = cachedMat('burner', () => new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0xff5a1f, emissiveIntensity: 0.9, roughness: 0.4 }));
      [-23.5, -21.0].forEach(sx => {
        addPart(scene, officeBox(0.8, 0.02, 0.6), OFFICE_MAT.bezel, sx, 0.94, -12.75, { cast: false });
        [[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]].forEach(([ox, oz]) => {
          const b = addPart(scene, cachedGeo('Torus', 0.07, 0.012, 6, 16), burnerMat, sx + ox, 0.955, -12.75 + oz, { cast: false });
          b.rotation.x = Math.PI / 2;
        });
        addPart(scene, cachedGeo('Cylinder', 0.15, 0.14, 0.18, 18), OFFICE_MAT.chrome, sx - 0.2, 1.04, -12.6);
        addPart(scene, cachedGeo('Cylinder', 0.13, 0.12, 0.08, 18), OFFICE_MAT.bezel, sx + 0.2, 0.99, -12.9);
      });
      addPart(scene, officeBox(4.0, 0.45, 0.85), steel, -22.25, 2.05, -12.7);
      addPart(scene, officeBox(0.6, 1.2, 0.5), steel, -22.25, 2.9, -12.85, { cast: false });
      // isla central con tablas de cortar y verduras
      buildOfficeDesk(-22.25, -9.4, 3.0, 1.1, steel, { height: 0.9, panel: false });
      [-23.1, -21.5].forEach(px => addPart(scene, officeBox(0.5, 0.025, 0.32), OFFICE_MAT.oak, px, 0.915, -9.4, { cast: false }));
      [0xef4444, 0x22c55e, 0xf97316, 0xfacc15].forEach((c, i) => {
        addPart(scene, cachedGeo('Sphere', 0.05, 10, 8), solidMat('veg' + i, c), -23.2 + i * 0.12, 0.96, -9.35 + (i % 2) * 0.06, { cast: false });
      });
      // neveras
      [-8.0, -8.9].forEach(fz => {
        addPart(scene, officeBox(0.75, 2.0, 0.85), OFFICE_MAT.steel, -25.55, 1.0, fz);
        addPart(scene, officeBox(0.03, 0.9, 0.04), OFFICE_MAT.chrome, -25.15, 1.15, fz + 0.3, { cast: false });
        addCollider(-25.55, fz, 0.75, 0.85);
      });
      // fregadero
      addPart(scene, officeBox(0.7, 0.9, 1.8), steel, -19.0, 0.45, -6.5);
      addPart(scene, officeBox(0.5, 0.04, 0.7), OFFICE_MAT.bezel, -19.0, 0.905, -6.5, { cast: false });
      addPart(scene, cachedGeo('Cylinder', 0.015, 0.015, 0.35, 8), OFFICE_MAT.chrome, -18.75, 1.08, -6.5, { cast: false });
      addCollider(-19.0, -6.5, 0.7, 1.8);
    }

    function buildServiceRooms() {
      // --- Limpieza: estantería, carro y lavadora ---
      addPart(scene, officeBox(0.45, 1.8, 2.4), OFFICE_MAT.graphiteMatte, -25.7, 0.9, -3.0);
      const bottleColors = [0x22d3ee, 0xa3e635, 0xfacc15, 0xf472b6, 0x60a5fa];
      for (let r = 0; r < 3; r++) {
        for (let i = 0; i < 6; i++) {
          addPart(scene, cachedGeo('Cylinder', 0.05, 0.05, 0.22, 10), solidMat('bottle' + ((r + i) % 5), bottleColors[(r + i) % 5]), -25.55, 0.55 + r * 0.5, -4.0 + i * 0.4, { cast: false });
        }
      }
      addCollider(-25.7, -3.0, 0.45, 2.4);
      addPart(scene, officeBox(0.6, 0.7, 0.9), solidMat('cartBlue', 0x1d4ed8), -23.0, 0.45, -3.6);
      addPart(scene, cachedGeo('Cylinder', 0.18, 0.15, 0.28, 16), solidMat('bucket', 0xfacc15), -23.0, 0.94, -3.85);
      addPart(scene, cachedGeo('Cylinder', 0.012, 0.012, 1.3, 6), OFFICE_MAT.aluminium, -22.85, 1.2, -3.35, { cast: false });
      addCollider(-23.0, -3.6, 0.6, 0.9);
      addPart(scene, officeBox(0.6, 0.85, 0.6), OFFICE_MAT.whiteSatin, -22.6, 0.425, -4.55);
      const drum = addPart(scene, cachedGeo('Cylinder', 0.18, 0.18, 0.02, 20), OFFICE_MAT.bezel, -22.6, 0.5, -4.24, { cast: false });
      drum.rotation.x = Math.PI / 2;
      addCollider(-22.6, -4.55, 0.6, 0.6);

      // --- Baños: cubículos y lavamanos con espejo ---
      const partMat = solidMat('stall', 0x64748b, { roughness: 0.5 });
      [-22.0 + 0.04, -20.85, -19.65, -18.5 - 0.04].forEach(px => addPart(scene, officeBox(0.05, 1.9, 1.3), partMat, px, 0.95, -4.3));
      [-21.42, -20.25, -19.07].forEach(px => {
        addPart(scene, officeBox(0.9, 1.8, 0.04), partMat, px, 0.95, -3.66);
        addPart(scene, officeBox(0.38, 0.42, 0.55), OFFICE_MAT.ceramic, px, 0.21, -4.55);
      });
      addCollider(-20.25, -4.3, 3.5, 1.4);
      addPart(scene, officeBox(0.55, 0.85, 1.8), OFFICE_MAT.marble, -18.85, 0.425, -2.3);
      [-2.8, -1.8].forEach(sz => addPart(scene, cachedGeo('Cylinder', 0.16, 0.12, 0.06, 18), OFFICE_MAT.ceramic, -18.85, 0.87, sz, { cast: false }));
      const mirror = new THREE.Mesh(cachedGeo('Plane', 1.6, 0.9), cachedMat('mirror', () => new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.02, metalness: 1.0, envMapIntensity: 1.4 })));
      mirror.rotation.y = -Math.PI / 2;
      mirror.position.set(-18.58, 1.55, -2.3);
      scene.add(mirror);
      addCollider(-18.85, -2.3, 0.55, 1.8);
    }

    // Sala de Programación: 8 escritorios con monitores dobles, pantallas grandes y mesa del líder
    function buildProgrammingRoom() {
      const accent = 0xf59e0b;
      [4.2, 7.3].forEach((z, row) => [-28.6, -26.4, -22.6, -20.4].forEach((x, i) => {
        buildOfficeDesk(x, z, 2.0, 0.9, (i + row) % 2 ? OFFICE_MAT.oak : OFFICE_MAT.whiteSatin, { glow: accent });
        buildMonitor(x - 0.45, 0.75, z - 0.2, 0.8, 0.45, ['code', 'app', 'kanban', 'kpi'][(i + row * 2) % 4], {});
        buildMonitor(x + 0.45, 0.75, z - 0.2, 0.8, 0.45, ['code', 'kpi', 'code', 'app'][(i + row) % 4], {});
        buildKeyboardAndMouse(x - 0.08, 0.75, z + 0.22);
        buildOfficeChair(x, z + 0.85, Math.PI);
      }));
      // pantallas grandes en la pared norte (a los lados de la puerta)
      buildWallDisplay(-28.0, 1.65, 1.6, 2.8, 1.3, 'code', 0, false);
      buildWallDisplay(-21.0, 1.65, 1.6, 2.8, 1.3, 'kanban', 0, false);
      // pizarra del proyecto en la pared sur
      buildWallDisplay(-22.6, 1.55, 9.65, 2.6, 1.1, 'kpi', Math.PI, false);
      buildPlant(-30.0, 2.1, 1.0);
      buildPlant(-19.0, 9.2, 1.0);
      buildSignPanel('sign_prog', -24.5, 2.55, 1.62, 1.6, 0.45, 0, 'PROGRAMACIÓN', 'PROYECTOS IMPORTANTES', '#fcd34d');
    }

    // ---------- Piezas de electrónica y robótica ----------
    function buildArduinoBoard(parent, x, y, z, rotY = 0) {
      const g = new THREE.Group();
      g.position.set(x, y, z); g.rotation.y = rotY;
      addPart(g, officeBox(0.17, 0.012, 0.13), solidMat('unoPcb', 0x0e7490, { roughness: 0.5 }), 0, 0.006, 0, { cast: false });
      addPart(g, officeBox(0.05, 0.012, 0.02), solidMat('chip', 0x111827), 0.01, 0.018, 0, { cast: false });
      addPart(g, officeBox(0.03, 0.03, 0.035), OFFICE_MAT.aluminium, -0.075, 0.02, 0.03, { cast: false });
      addPart(g, officeBox(0.14, 0.012, 0.01), solidMat('header', 0x0b0f17), 0.01, 0.018, -0.058, { cast: false });
      parent.add(g);
      return g;
    }
    function buildBreadboard(parent, x, y, z) {
      addPart(parent, officeBox(0.17, 0.012, 0.055), solidMat('breadboard', 0xf8fafc, { roughness: 0.8 }), x, y + 0.006, z, { cast: false });
      [0xef4444, 0x22c55e, 0xfacc15].forEach((c, i) => addPart(parent, cachedGeo('Sphere', 0.006, 8, 6), cachedMat('ledGlow' + c, () => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: c, emissiveIntensity: 2 })), x - 0.04 + i * 0.03, y + 0.02, z, { cast: false }));
    }
    function buildRobotCar(x, z, rotY = 0, scale = 1) {
      const g = new THREE.Group();
      g.position.set(x, 0, z); g.rotation.y = rotY; g.scale.setScalar(scale);
      addPart(g, officeBox(0.24, 0.03, 0.16), solidMat('carBody', 0xf59e0b, { roughness: 0.4 }), 0, 0.06, 0);
      [[-0.07, 0.095], [-0.07, -0.095]].forEach(([wx, wz]) => { const w = addPart(g, cachedGeo('Cylinder', 0.035, 0.035, 0.025, 16), solidMat('tire', 0x111827, { roughness: 0.95 }), wx, 0.035, wz); w.rotation.x = Math.PI / 2; });
      addPart(g, officeBox(0.03, 0.025, 0.08), solidMat('sonar', 0x0ea5e9), 0.125, 0.085, 0, { cast: false });
      buildArduinoBoard(g, -0.02, 0.075, 0);
      scene.add(g);
      return g;
    }
    function buildRobotArm(x, z, rotY = 0, scale = 1) {
      const g = new THREE.Group();
      g.position.set(x, 0, z); g.rotation.y = rotY; g.scale.setScalar(scale);
      const orange = solidMat('armOrange', 0xf97316, { roughness: 0.45 });
      addPart(g, cachedGeo('Cylinder', 0.16, 0.2, 0.08, 24), OFFICE_MAT.graphiteMatte, 0, 0.04, 0);
      const s1 = new THREE.Group(); s1.position.set(0, 0.1, 0); s1.rotation.z = -0.35; g.add(s1);
      addPart(s1, officeBox(0.08, 0.5, 0.08), orange, 0, 0.25, 0);
      const s2 = new THREE.Group(); s2.position.set(0, 0.5, 0); s2.rotation.z = 1.3; s1.add(s2);
      addPart(s2, cachedGeo('Sphere', 0.06, 16, 12), OFFICE_MAT.chrome, 0, 0, 0);
      addPart(s2, officeBox(0.06, 0.4, 0.06), orange, 0, 0.2, 0);
      addPart(s2, officeBox(0.12, 0.04, 0.05), OFFICE_MAT.chrome, 0, 0.42, 0);
      [-0.045, 0.045].forEach(dx => addPart(s2, officeBox(0.015, 0.08, 0.04), OFFICE_MAT.chrome, dx, 0.48, 0));
      scene.add(g);
      return g;
    }
    function buildOscilloscope(x, y, z) {
      addPart(scene, officeBox(0.34, 0.2, 0.22), OFFICE_MAT.graphiteMatte, x, y + 0.1, z);
      const scr = new THREE.Mesh(cachedGeo('Plane', 0.17, 0.12), getScreenMaterial('kpi'));
      scr.position.set(x - 0.06, y + 0.11, z + 0.111);
      scene.add(scr);
    }

    // Laboratorio de Mecatrónica: 4 bancos de trabajo, robot de pruebas, brazo robótico e impresora 3D
    function buildMechatronicsLab() {
      const accent = 0x14b8a6;
      [14.6, 17.9].forEach((bz, row) => [-37.6, -34.6].forEach((bx, i) => {
        buildOfficeDesk(bx, bz, 2.4, 0.9, (i + row) % 2 ? OFFICE_MAT.oak : OFFICE_MAT.whiteSatin, { glow: accent, panelMat: OFFICE_MAT.graphiteMatte });
        buildMonitor(bx - 0.6, 0.75, bz - 0.22, 0.8, 0.45, 'code', {});
        buildOscilloscope(bx + 0.55, 0.75, bz - 0.2);
        buildArduinoBoard(scene, bx - 0.1, 0.752, bz + 0.12, 0.2);
        buildBreadboard(scene, bx + 0.2, 0.752, bz + 0.14);
        [-0.6, 0.6].forEach(dx => buildOfficeChair(bx + dx, bz + 0.85, Math.PI, { seatMat: OFFICE_MAT.chairFabric }));
      }));
      // zona de pruebas: pista para el robot, robots y brazo
      addPart(scene, officeBox(2.6, 0.012, 3.6), solidMat('testMat', 0xe7e5e4, { roughness: 0.95 }), -31.3, 0.007, 16.6, { cast: false });
      addPart(scene, officeBox(0.05, 0.014, 2.8), solidMat('lineTape', 0x111827), -31.3, 0.012, 16.6, { cast: false });
      buildRobotCar(-31.3, 15.6, Math.PI / 2, 1.6);
      buildRobotCar(-30.6, 17.9, -Math.PI / 3, 1.6);
      buildRobotArm(-30.5, 13.2, Math.PI, 1);
      addCollider(-30.5, 13.2, 0.45, 0.45);
      // impresora 3D sobre un mueble
      addPart(scene, officeBox(0.9, 0.75, 0.6), OFFICE_MAT.graphiteMatte, -38.9, 0.375, 12.75);
      addPart(scene, officeBox(0.45, 0.5, 0.45), solidMat('printerFrame', 0x1f2937, { roughness: 0.5 }), -38.9, 1.0, 12.75);
      addPart(scene, officeBox(0.3, 0.02, 0.3), solidMat('printBed', 0x14b8a6), -38.9, 0.8, 12.75, { cast: false });
      addCollider(-38.9, 12.75, 0.9, 0.6);
      buildWallDisplay(-36.0, 1.65, 12.12, 2.6, 1.2, 'kpi', 0, false);
      buildSignPanel('sign_meca', -32.4, 2.4, 12.12, 2.2, 0.5, 0, 'MECATRÓNICA', 'ELECTRÓNICA · ROBÓTICA · ARDUINO', '#5eead4');
      buildPlant(-39.4, 20.4, 1.0);
    }

    // Sala de Práctica del Director: escritorio con 3 pantallas, banco de electrónica y pizarra
    function buildPracticeRoom() {
      // escritorio principal en L
      buildOfficeDesk(-36.5, 4.0, 2.6, 0.9, OFFICE_MAT.walnut, { height: 0.76, panelMat: OFFICE_MAT.walnutSlats, glow: 0xa78bfa });
      buildOfficeDesk(-38.15, 5.2, 0.7, 1.5, OFFICE_MAT.walnut, { height: 0.76, panel: false });
      [-37.35, -36.5, -35.65].forEach((mx, i) => buildMonitor(mx, 0.76, 3.78, 0.8, 0.46, ['code', 'code', 'kanban'][i], {}));
      buildKeyboardAndMouse(-36.6, 0.76, 4.2);
      buildOfficeChair(-36.5, 4.85, Math.PI, { tall: true, seatMat: OFFICE_MAT.blackLeather, accent: 0xa78bfa });
      buildLaptop(-38.15, 0.76, 5.3, Math.PI / 2, 'app');
      // banco de electrónica para practicar con Arduino y robots
      buildOfficeDesk(-33.0, 7.6, 2.2, 0.8, OFFICE_MAT.oak, { glow: 0xa78bfa, panel: false });
      buildArduinoBoard(scene, -33.4, 0.752, 7.7, -0.3);
      buildBreadboard(scene, -33.0, 0.752, 7.75);
      buildOscilloscope(-32.4, 0.75, 7.45);
      buildRobotCar(-33.75, 7.55, 0.4, 0.9);
      buildOfficeChair(-33.0, 8.45, Math.PI, { seatMat: OFFICE_MAT.chairFabric });
      buildRobotArm(-31.2, 8.9, -Math.PI / 2, 0.8);
      addCollider(-31.2, 8.9, 0.4, 0.4);
      // pizarra de algoritmos y pantalla grande
      buildWallDisplay(-36.5, 1.95, 1.62, 3.0, 1.05, 'code', 0, false);
      buildWallDisplay(-30.62, 1.6, 4.6, 2.4, 1.2, 'kanban', -Math.PI / 2, false);
      // estantería y rincón de lectura
      addPart(scene, officeBox(0.4, 1.8, 1.6), OFFICE_MAT.walnutSlats, -39.6, 0.9, 8.4);
      addCollider(-39.6, 8.4, 0.4, 1.6);
      [0.45, 0.95, 1.45].forEach((sy, i) => [0, 1, 2, 3].forEach(k => addPart(scene, officeBox(0.22, 0.28, 0.08), solidMat('book' + ((i + k) % 4), [0xa78bfa, 0xf59e0b, 0x22d3ee, 0xf43f5e][(i + k) % 4]), -39.55, sy + 0.14, 7.85 + k * 0.32, { cast: false })));
      buildPlant(-39.5, 2.1, 1.0);
      buildPlant(-31.0, 2.1, 0.9);
      buildSignPanel('sign_practica', -33.4, 2.45, 1.62, 1.9, 0.45, 0, 'SALA DE PRÁCTICA', 'APRENDER · PROGRAMAR · CONSTRUIR', '#c4b5fd');
    }

    function buildGymAndTraining() {
      // --- Laboratorio de Mecatrónica (antes Gimnasio) ---
      buildMechatronicsLab();

      // --- Formación: 3 x 3 pupitres, pantalla y puesto del formador ---
      TRAINING_DESKS.forEach(([x, z], i) => {
        buildOfficeDesk(x, z, 1.6, 0.7, OFFICE_MAT.whiteSatin, { panel: false });
        buildOfficeChair(x, z + 0.75, Math.PI, { seatMat: OFFICE_MAT.chairFabric });
        buildLaptop(x, 0.75, z + 0.02, 0, i % 3 === 0 ? 'code' : i % 3 === 1 ? 'app' : 'kanban');
      });
      buildWallDisplay(-24.5, 1.55, 12.12, 2.6, 1.3, 'kanban', 0, false);
      addPart(scene, officeBox(0.6, 0.95, 0.4), OFFICE_MAT.walnutSlats, -26.3, 0.475, 13.0);
      addCollider(-26.3, 13.0, 0.6, 0.4);
      buildPlant(-21.6, 20.4, 1.0);
      buildPlant(-29.0, 20.4, 1.0);
    }

    function buildNatureRoom() {
      // Estanque con orilla de piedras, nenúfares y cascada
      const waterTex = officeTexUnique(makeOfficeTexture('water', 256, 256, drawWater, { seed: 818, color: true }), 2, 1.2);
      animatedScreens.push({ tex: waterTex, speed: 0.0012 });
      const waterMat = new THREE.MeshStandardMaterial({ map: waterTex, color: 0xffffff, roughness: 0.05, metalness: 0.25, emissive: 0x0b3a52, emissiveIntensity: 0.35, transparent: true, opacity: 0.92 });
      const pond = new THREE.Mesh(cachedGeo('Cylinder', 1, 1, 0.06, 40), waterMat);
      pond.scale.set(2.3, 1, 1.3);
      pond.position.set(-11, 0.03, 17.6);
      pond.receiveShadow = true;
      scene.add(pond);
      addCollider(-11, 17.6, 4.4, 2.4);
      const stone = solidMat('stone', 0x8b8f97, { roughness: 0.95 });
      const stoneDark = solidMat('stoneDark', 0x5f646c, { roughness: 0.95 });
      const pebble = cachedGeo('Sphere', 1, 10, 8);
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        const s = addPart(scene, pebble, i % 3 ? stone : stoneDark, -11 + Math.cos(a) * 2.38, 0.06, 17.6 + Math.sin(a) * 1.38, { cast: false });
        s.scale.set(0.22 + (i % 4) * 0.04, 0.11, 0.18 + (i % 3) * 0.04);
      }
      const lily = solidMat('lily', 0x3f9a4c, { roughness: 0.6 });
      [[-12, 17.2], [-10.2, 18.1], [-9.6, 17.2], [-11.4, 18.3]].forEach(([lx, lz], i) => {
        addPart(scene, cachedGeo('Cylinder', 0.18, 0.18, 0.01, 16), lily, lx, 0.07, lz, { cast: false });
        if (i % 2 === 0) addPart(scene, cachedGeo('Sphere', 0.06, 10, 8), solidMat('lotus', 0xf9a8d4), lx, 0.11, lz, { cast: false });
      });
      // rocas de la cascada
      [[-13.7, 18.6, 0.5, 0.55], [-13.5, 19.1, 0.38, 0.85], [-14.0, 18.1, 0.32, 0.35]].forEach(([rx, rz, r, h], i) => {
        const rock = addPart(scene, pebble, i === 1 ? stoneDark : stone, rx, h * 0.5, rz);
        rock.scale.set(r, h, r * 0.9);
      });
      addCollider(-13.7, 18.6, 1.0, 1.2);
      const fallTex = officeTexUnique(makeOfficeTexture('water', 256, 256, drawWater, { seed: 818, color: true }), 0.6, 1.5);
      animatedScreens.push({ tex: fallTex, speed: -0.01 });
      const fall = new THREE.Mesh(cachedGeo('Plane', 0.45, 0.85), new THREE.MeshStandardMaterial({ map: fallTex, transparent: true, opacity: 0.8, roughness: 0.05, emissive: 0x0b3a52, emissiveIntensity: 0.3, side: THREE.DoubleSide }));
      fall.position.set(-13.25, 0.45, 18.55);
      fall.rotation.y = Math.PI / 2;
      scene.add(fall);

      // Árboles grandes, arbustos y flores
      [[-19.6, 13.3, 1.25], [-19.4, 19.8, 1.35], [-14.6, 20.2, 1.15], [-8.6, 20.3, 1.2], [-4.0, 19.9, 1.3], [-4.2, 12.8, 1.1]].forEach(([tx, tz, s]) => buildTree(tx, tz, s, true));
      const bush = solidMat('bush', 0x2f7d3f, { roughness: 0.85 });
      [[-17.5, 20.5], [-10.5, 20.55], [-6.2, 20.5], [-20.5, 16.5], [-2.95, 17.5], [-12.8, 12.45], [-10.0, 12.45]].forEach(([bxp, bzp], i) => {
        const b = addPart(scene, pebble, bush, bxp, 0.3, bzp);
        b.scale.set(0.55 + (i % 2) * 0.15, 0.4, 0.4);
        addCollider(bxp, bzp, 0.9, 0.7);
      });
      const flowerCols = [0xf472b6, 0xfacc15, 0xa78bfa, 0xfb7185, 0xffffff];
      [[-18.4, 14.2], [-7.6, 16.2], [-5.0, 15.0], [-16.8, 19.4], [-9.2, 19.6], [-3.4, 15.8]].forEach(([fx, fz], p) => {
        for (let i = 0; i < 9; i++) {
          const a = i * 2.4 + p;
          const fl = addPart(scene, cachedGeo('Sphere', 0.05, 8, 6), solidMat('flower' + ((p + i) % 5), flowerCols[(p + i) % 5]), fx + Math.cos(a) * 0.35 * (i / 9 + 0.3), 0.22 + (i % 3) * 0.04, fz + Math.sin(a) * 0.3 * (i / 9 + 0.3), { cast: false });
          fl.scale.setScalar(1 + (i % 2) * 0.4);
          addPart(scene, cachedGeo('Cylinder', 0.006, 0.006, 0.2, 4), OFFICE_MAT.leaf, fl.position.x, 0.1, fl.position.z, { cast: false });
        }
      });

      // Terraza de madera para yoga / meditación
      addPart(scene, officeBox(3.2, 0.08, 2.2), OFFICE_MAT.oak, -16.4, 0.04, 16.9);
      [[-17.3, 0x14b8a6], [-16.4, 0xa855f7], [-15.5, 0xf59e0b]].forEach(([mx, c], i) => {
        addPart(scene, officeBox(0.6, 0.012, 1.5), solidMat('yoga' + i, c, { roughness: 0.9 }), mx, 0.086, 16.9, { cast: false });
      });
      // Bancos frente al estanque (se puede sentar en ellos: sin colisión)
      buildBench(-12.2, 14.45, 0, false);
      buildBench(-9.8, 14.45, 0, false);
      buildBench(-6.2, 18.1, -Math.PI / 2, false, 1.8);

      // Camino de piedras desde las puertas
      const stepMat = solidMat('step', 0xa8a29e, { roughness: 0.9 });
      [[-15, 12.6], [-15.2, 13.4], [-15.6, 14.2], [-15.9, 15.0], [-7, 12.6], [-7.6, 13.3], [-8.5, 13.7], [-3.1, 14.0], [-3.9, 14.6], [-4.7, 15.3], [-5.4, 16.1]].forEach(([sx, sz], i) => {
        const st = addPart(scene, cachedGeo('Cylinder', 0.3, 0.32, 0.03, 14), stepMat, sx, 0.015, sz, { cast: false });
        st.rotation.y = i * 0.7;
        st.scale.set(1, 1, 0.8);
      });
      [[-20.4, 12.6], [-2.95, 20.4]].forEach(([px, pz]) => buildPlant(px, pz, 1.3));

      // Haz de luz natural sobre el estanque (más intenso de día)
      SKY.shaft = new THREE.Mesh(
        cachedGeo('Cylinder', 1.0, 2.6, 3.4, 28, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xfff6d5, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false })
      );
      SKY.shaft.position.set(-11, 1.7, 17.6);
      scene.add(SKY.shaft);
      buildSignPanel('sign_nature', -11, 1.7, 12.1, 2.6, 0.75, 0, 'JARDÍN NATURAL', 'RESPIRA · CONECTA · RECARGA', '#4ade80');

      // Mariposas animadas
      const wingGeo = cachedGeo('Plane', 0.14, 0.1);
      [0xfacc15, 0xf472b6, 0x60a5fa, 0xfb923c, 0xa78bfa, 0xffffff].forEach((c, i) => {
        const g = new THREE.Group();
        const wm = new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
        const l = new THREE.Mesh(wingGeo, wm);
        const r = new THREE.Mesh(wingGeo, wm);
        l.position.x = -0.07;
        r.position.x = 0.07;
        const lp = new THREE.Group(); lp.add(l);
        const rp = new THREE.Group(); rp.add(r);
        g.add(lp); g.add(rp);
        scene.add(g);
        [g, lp, rp].forEach(o => NATURE_ANIMATED.add(o));
        BUTTERFLIES.push({ g, lp, rp, cx: -18 + i * 2.6, cz: 14 + (i % 3) * 2.4, phase: i * 1.7, r: 0.9 + (i % 3) * 0.4 });
      });
    }

    function updateButterflies(time) {
      for (let i = 0; i < BUTTERFLIES.length; i++) {
        const b = BUTTERFLIES[i];
        const t = time * 0.5 + b.phase;
        b.g.position.set(b.cx + Math.sin(t) * b.r, 0.9 + Math.sin(t * 2.3) * 0.35, b.cz + Math.sin(t * 0.7) * b.r * 0.8);
        b.g.rotation.y = Math.cos(t) * 1.2;
        const flap = Math.sin(time * 18 + b.phase) * 0.9;
        b.lp.rotation.z = flap;
        b.rp.rotation.z = -flap;
      }
    }

    function buildAllZonesFurniture() {
      Object.values(ZONES).forEach(zone => {
        const padGeo = cachedGeo('Plane', zone.w, zone.d);
        const padMat = new THREE.MeshStandardMaterial({
          color: zone.color,
          transparent: true,
          opacity: 0.1,
          roughness: 0.6,
          depthWrite: false
        });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(zone.x, 0.02, zone.z);
        pad.userData.zoneId = zone.id;
        pad.receiveShadow = true;
        scene.add(pad);
        zoneFloorMeshes[zone.id] = pad;

        const edges = new THREE.EdgesGeometry(cachedGeo('Box', zone.w, 0.04, zone.d));
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: zone.color, transparent: true, opacity: 0.55 })
        );
        line.position.set(zone.x, 0.03, zone.z);
        scene.add(line);
      });

      // --- 1. SALA DE JUEGOS: Estaciones gamer + Pantalla de Juego ---
      [-12.8, -9.2].forEach((dx, i) => {
        buildOfficeDesk(dx, -4.5, 2.2, 1.1, OFFICE_MAT.graphiteMatte, { glow: 0xa855f7 });
        buildMonitor(dx - 0.5, 0.75, -4.78, 0.8, 0.45, 'game', { rotY: 0.14 });
        buildMonitor(dx + 0.5, 0.75, -4.78, 0.8, 0.45, i === 0 ? 'code' : 'game', { rotY: -0.14 });
        buildKeyboardAndMouse(dx - 0.1, 0.75, -4.25);
        buildOfficeChair(dx, -3.55, Math.PI, { tall: true, seatMat: OFFICE_MAT.blackLeather, accent: 0xa855f7 });
      });

      buildWallDisplay(-11, 2.3, -8.4, 6.2, 1.4, 'gameWide', 0, true);
      // mueble de consolas bajo la pantalla
      const credenza = buildOfficeDesk(-11, -7.95, 3.4, 0.5, OFFICE_MAT.walnut, { height: 0.5, panel: false });
      credenza.children.forEach(ch => { if (ch.material === OFFICE_MAT.metalLeg) ch.visible = false; });
      const credenzaBody = new THREE.Mesh(officeBox(3.36, 0.44, 0.46), OFFICE_MAT.walnutSlats);
      credenzaBody.position.set(-11, 0.24, -7.95);
      credenzaBody.castShadow = true;
      credenzaBody.receiveShadow = true;
      scene.add(credenzaBody);
      [-11.8, -10.2].forEach(cx => {
        const consoleBox = new THREE.Mesh(officeBox(0.42, 0.08, 0.3), OFFICE_MAT.bezel);
        consoleBox.position.set(cx, 0.54, -7.95);
        consoleBox.castShadow = true;
        scene.add(consoleBox);
      });
      buildPlant(-15.2, -8.2, 1.1);

      // --- 2. ESTUDIO DE APPS: Estaciones móviles/web ---
      [-12.8, -9.2].forEach(dx => {
        buildOfficeDesk(dx, 5.5, 2.2, 1.1, OFFICE_MAT.whiteSatin, { panelMat: OFFICE_MAT.whiteSatin });
        buildMonitor(dx, 0.75, 5.18, 1.15, 0.52, 'app');
        buildKeyboardAndMouse(dx - 0.1, 0.75, 5.72);
        // tablet y móvil con la app
        const tablet = new THREE.Mesh(officeBox(0.26, 0.012, 0.36), OFFICE_MAT.bezel);
        tablet.position.set(dx + 0.75, 0.756, 5.65);
        tablet.rotation.y = -0.3;
        tablet.castShadow = true;
        scene.add(tablet);
        const tabScreen = new THREE.Mesh(cachedGeo('Plane', 0.23, 0.33), getScreenMaterial('app'));
        tabScreen.rotation.set(-Math.PI / 2, 0, -0.3);
        tabScreen.position.set(dx + 0.75, 0.763, 5.65);
        scene.add(tabScreen);
        const phone = new THREE.Mesh(officeBox(0.08, 0.01, 0.16), OFFICE_MAT.bezel);
        phone.position.set(dx - 0.75, 0.755, 5.7);
        phone.rotation.y = 0.2;
        scene.add(phone);
        buildOfficeChair(dx, 6.35, Math.PI);
      });
      buildPlant(-15.2, 9.0, 1.0);

      // --- 3. INGENIERÍA DE SOFTWARE: Mesa de programación ---
      buildOfficeDesk(-1, 6.5, 4.4, 1.2, OFFICE_MAT.oak);
      [-2.4, -1, 0.4].forEach(mx => {
        buildMonitor(mx, 0.75, 6.12, 1.0, 0.5, 'code');
        buildKeyboardAndMouse(mx - 0.08, 0.75, 6.68);
        buildOfficeChair(mx, 7.5, Math.PI);
      });
      buildCup(scene, 1.0, 0.75, 6.55, { accent: 0x10b981 });
      buildPlant(3.6, 9.2, 0.9);

      // --- 4. CENTRO DE AYUDA: Mesa de soporte y guías ---
      buildOfficeDesk(8.5, 6.5, 3.8, 1.2, OFFICE_MAT.walnut);
      [7.6, 9.4].forEach(mx => {
        buildMonitor(mx, 0.75, 6.12, 1.0, 0.5, 'tickets');
        buildKeyboardAndMouse(mx - 0.08, 0.75, 6.68);
        buildOfficeChair(mx, 7.5, Math.PI);
      });
      // auriculares de soporte y documentos
      const headsetBand = new THREE.Mesh(cachedGeo('Torus', 0.08, 0.01, 8, 20, Math.PI), OFFICE_MAT.plastic);
      headsetBand.position.set(10.05, 0.84, 6.5);
      scene.add(headsetBand);
      [-1, 1].forEach(sx => {
        const cup = new THREE.Mesh(cachedGeo('Cylinder', 0.035, 0.035, 0.03, 16), OFFICE_MAT.plastic);
        cup.rotation.z = Math.PI / 2;
        cup.position.set(10.05 + sx * 0.08, 0.77, 6.5);
        scene.add(cup);
      });
      for (let i = 0; i < 5; i++) {
        const sheet = new THREE.Mesh(officeBox(0.22, 0.003, 0.3), OFFICE_MAT.paper);
        sheet.position.set(6.95, 0.752 + i * 0.004, 6.55);
        sheet.rotation.y = (i - 2) * 0.05;
        scene.add(sheet);
      }

      // --- 5. SALA DE REUNIONES A: mesa para 15 + cabecera del Director y pantallas ---
      buildBoardroom(ZONES.meeting);

      // --- 6. DIRECCIÓN FRPROGRAMITY: Escritorio ejecutivo ---
      buildOfficeDesk(0.5, -9.2, 3.2, 1.2, OFFICE_MAT.walnut, { height: 0.78, panelMat: OFFICE_MAT.walnutSlats });
      buildMonitor(0.2, 0.78, -9.45, 1.0, 0.5, 'kpi', { rotY: Math.PI });
      buildLaptop(1.3, 0.78, -9.35, Math.PI - 0.2, 'kpi');
      buildDeskLamp(-0.85, 0.78, -9.5);
      buildCup(scene, 1.6, 0.78, -9.0, { saucer: true, accent: 0x38bdf8 });
      buildOfficeChair(0.5, -10.2, 0, { tall: true, seatMat: OFFICE_MAT.blackLeather });
      buildWallDisplay(0.5, 1.8, -10.8, 2.6, 1.2, 'kpi', 0, true);
      buildPlant(4.4, -10.4, 1.1);
      buildPlant(-3.4, -10.4, 0.9);

      // --- 7. CAFÉ & ESPRESSO: Barra de mármol + Cafetera + Vapor ---
      const bar = new THREE.Group();
      bar.position.set(10.5, 0, -9.4);
      scene.add(bar);
      addCollider(10.5, -9.37, 4.7, 1.1);
      addPart(bar, officeBox(4.5, 0.86, 0.95), OFFICE_MAT.walnutSlats, 0, 0.47, 0);
      // listones verticales del frente
      for (let sx = -2.15; sx <= 2.16; sx += 0.18) {
        addPart(bar, officeBox(0.12, 0.82, 0.03), OFFICE_MAT.walnut, sx, 0.47, 0.49, { cast: false });
      }
      addPart(bar, officeBox(4.4, 0.06, 0.9), OFFICE_MAT.bezel, 0, 0.03, 0.02);
      const barTop = addPart(bar, officeBox(4.7, 0.05, 1.1), OFFICE_MAT.marble.clone(), 0, 0.925, 0.03);
      barTop.material.map = officeTexRepeat(OFFICE_MAT.marble.map, 2, 0.5);

      // Cafetera espresso detallada (centrada en x=9.4 para el vapor)
      const machine = new THREE.Group();
      machine.position.set(9.4, 0.95, -9.55);
      scene.add(machine);
      addPart(machine, officeBox(0.95, 0.46, 0.55), OFFICE_MAT.steel, 0, 0.23, 0);
      addPart(machine, officeBox(0.97, 0.03, 0.57), OFFICE_MAT.chrome, 0, 0.475, 0);
      addPart(machine, officeBox(0.9, 0.16, 0.02), OFFICE_MAT.bezel, 0, 0.35, 0.28);
      [-0.22, 0.22].forEach(gx => {
        addPart(machine, cachedGeo('Cylinder', 0.06, 0.07, 0.08, 20), OFFICE_MAT.chrome, gx, 0.22, 0.3);
        addPart(machine, cachedGeo('Cylinder', 0.05, 0.045, 0.04, 20), OFFICE_MAT.bezel, gx, 0.16, 0.31);
        const handle = addPart(machine, officeBox(0.03, 0.03, 0.18), OFFICE_MAT.blackLeather, gx, 0.16, 0.42);
        handle.rotation.x = 0.15;
        buildCup(machine, gx, 0.045, 0.3, { scale: 0.75 });
      });
      // manómetro
      const gauge = addPart(machine, cachedGeo('Cylinder', 0.05, 0.05, 0.015, 24), OFFICE_MAT.chrome, 0, 0.36, 0.29);
      gauge.rotation.x = Math.PI / 2;
      const dial = addPart(machine, cachedGeo('Cylinder', 0.04, 0.04, 0.004, 24), new THREE.MeshStandardMaterial({ color: 0xfafafa, emissive: 0xfff7e0, emissiveIntensity: 0.25 }), 0, 0.36, 0.298, { cast: false });
      dial.rotation.x = Math.PI / 2;
      // bandeja de goteo con rejilla
      addPart(machine, officeBox(0.85, 0.035, 0.16), OFFICE_MAT.chrome, 0, 0.02, 0.34);
      for (let gx = -0.38; gx <= 0.39; gx += 0.06) {
        addPart(machine, officeBox(0.012, 0.006, 0.15), OFFICE_MAT.bezel, gx, 0.04, 0.34, { cast: false });
      }
      // vaporizador
      const wand = addPart(machine, cachedGeo('Cylinder', 0.008, 0.008, 0.3, 8), OFFICE_MAT.chrome, 0.46, 0.2, 0.25);
      wand.rotation.z = 0.25;
      // tazas sobre el calientatazas
      [-0.3, -0.12, 0.08, 0.26].forEach(tx => buildCup(machine, tx, 0.49, -0.1, { scale: 0.8 }));

      // Molino de café
      const grinder = new THREE.Group();
      grinder.position.set(10.55, 0.95, -9.6);
      scene.add(grinder);
      addPart(grinder, officeBox(0.24, 0.34, 0.3), OFFICE_MAT.bezel, 0, 0.17, 0);
      const hopper = new THREE.Mesh(
        cachedGeo('Cylinder', 0.11, 0.05, 0.22, 20),
        new THREE.MeshStandardMaterial({ color: 0x5b3a22, transparent: true, opacity: 0.75, roughness: 0.1, metalness: 0.1 })
      );
      hopper.position.set(0, 0.45, 0);
      grinder.add(hopper);

      // Tazas y platillos para servir en la barra
      [11.4, 11.75, 12.1].forEach((cx, i) => buildCup(scene, cx, 0.95, -9.05, { saucer: true, accent: i === 1 ? 0xf97316 : undefined }));
      // Lámparas colgantes sobre la barra
      [9.2, 10.5, 11.8].forEach(px => buildPendantLamp(px, 2.25, -9.25));
      // Taburetes
      [9.3, 10.5, 11.7].forEach(sx => buildBarStool(sx, -8.4));
      buildPlant(14.2, -10.2, 0.9);

      const steamGeo = cachedGeo('Sphere', 0.08, 8, 8);
      const steamMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.45, depthWrite: false });
      for (let i = 0; i < 6; i++) {
        const s = new THREE.Mesh(steamGeo, steamMat.clone());
        s.position.set(9.4 + (Math.random() - 0.5) * 0.25, 1.6 + i * 0.18, -9.4);
        scene.add(s);
        steamParticles.push({ mesh: s, baseY: 1.55, offset: i * 0.7 });
      }

      // --- 8. ZONA DE DESCANSO: Alfombra, sofás de tela/cuero y mesa de centro ---
      const rugTex = makeOfficeTexture('rug', 512, 512, drawRug, { seed: 404, color: true, clamp: true });
      const rugMat = new THREE.MeshStandardMaterial({
        map: rugTex,
        bumpMap: officeTexRepeat(OFFICE_TEX.fabric_b, 8, 8),
        bumpScale: 0.01,
        roughness: 0.97,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      });
      const rug = new THREE.Mesh(cachedGeo('Plane', 3.6, 4.4), rugMat);
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(15.5, 0.016, -1.0);
      rug.receiveShadow = true;
      scene.add(rug);

      buildSofa(15.5, -2.8, 0, OFFICE_MAT.sofaFabric);
      buildSofa(15.5, 0.8, Math.PI, OFFICE_MAT.leather);
      // cojín decorativo
      const pillow = new THREE.Mesh(officeBox(0.4, 0.34, 0.12), new THREE.MeshStandardMaterial({
        color: 0xec4899, map: officeTexRepeat(OFFICE_TEX.fabric_c, 1, 1), roughness: 0.95
      }));
      pillow.position.set(14.55, 0.62, -2.95);
      pillow.rotation.set(-0.2, 0.25, 0.1);
      pillow.castShadow = true;
      scene.add(pillow);

      // Mesa de centro: tablero de nogal, patas metálicas y repisa inferior
      const ctable = new THREE.Group();
      ctable.position.set(15.5, 0, -1.0);
      scene.add(ctable);
      addCollider(15.5, -1.0, 1.6, 0.85);
      addPart(ctable, officeBox(1.6, 0.05, 0.85), OFFICE_MAT.walnut, 0, 0.385, 0);
      addPart(ctable, officeBox(1.5, 0.025, 0.75), OFFICE_MAT.walnut, 0, 0.12, 0);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
        addPart(ctable, cachedGeo('Cylinder', 0.018, 0.018, 0.36, 10), OFFICE_MAT.metalLeg, sx * 0.72, 0.18, sz * 0.36);
      });
      // revistas, jarrón y tazas
      [0xf8fafc, 0x38bdf8].forEach((mc, i) => {
        const mag = new THREE.Mesh(officeBox(0.28, 0.008, 0.36), new THREE.MeshStandardMaterial({ color: mc, roughness: 0.55 }));
        mag.position.set(-0.45, 0.415 + i * 0.009, 0.05);
        mag.rotation.y = 0.2 + i * 0.25;
        ctable.add(mag);
      });
      const vase = addPart(ctable, cachedGeo('Cylinder', 0.06, 0.08, 0.22, 20), OFFICE_MAT.ceramic, 0.45, 0.52, -0.1);
      vase.material = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.2 });
      [0, 1, 2].forEach(i => {
        const stem = addPart(ctable, cachedGeo('Sphere', 1, 8, 6), OFFICE_MAT.leaf, 0.45 + (i - 1) * 0.04, 0.72, -0.1);
        stem.scale.set(0.025, 0.16, 0.012);
        stem.rotation.z = (i - 1) * 0.35;
      });
      buildCup(ctable, 0.05, 0.41, 0.2, { saucer: true });
      buildCup(ctable, 0.25, 0.41, -0.22, { saucer: true, accent: 0xec4899 });

      // Lámpara de pie cálida
      const floorLamp = new THREE.Group();
      floorLamp.position.set(17.9, 0, -3.9);
      scene.add(floorLamp);
      addPart(floorLamp, cachedGeo('Cylinder', 0.16, 0.18, 0.03, 24), OFFICE_MAT.bezel, 0, 0.015, 0);
      addPart(floorLamp, cachedGeo('Cylinder', 0.014, 0.014, 1.55, 8), OFFICE_MAT.copper, 0, 0.8, 0);
      const lampShade = new THREE.Mesh(
        cachedGeo('Cylinder', 0.17, 0.24, 0.3, 24, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xf5e6cc, emissive: 0xffb866, emissiveIntensity: 0.55, roughness: 0.9, side: THREE.DoubleSide })
      );
      lampShade.position.set(0, 1.62, 0);
      floorLamp.add(lampShade);
      addCollider(17.9, -3.9, 0.36, 0.36);
      buildPlant(13.0, 1.7, 0.85);

      // --- 9. QA & BUILDS: Racks de pruebas ---
      [14.2, 16.6].forEach(rx => {
        buildServerRack(rx, 7.2);

        const ledMat = new THREE.MeshStandardMaterial({ color: 0x0a2a26, emissive: 0x2dd4bf, emissiveIntensity: 1.6 });
        const led = new THREE.Mesh(cachedGeo('Box', 0.8, 0.04, 0.03), ledMat);
        led.position.set(rx, 2.12, 7.72);
        scene.add(led);
        blinkingLeds.push({ material: ledMat, base: 1.0, amp: 0.9, speed: 1.4 + Math.random(), phase: Math.random() * 6 });
      });
      // carro de pruebas con monitor de resultados
      buildOfficeDesk(17.9, 4.6, 0.9, 0.6, OFFICE_MAT.graphiteMatte, { height: 1.0, panel: false });
      buildMonitor(17.9, 1.0, 4.45, 0.75, 0.42, 'qa', { rotY: -0.35 });
      const cable = new THREE.Mesh(cachedGeo('Torus', 0.5, 0.012, 6, 30, Math.PI), OFFICE_MAT.plastic);
      cable.rotation.x = Math.PI / 2;
      cable.position.set(15.4, 0.02, 7.2);
      scene.add(cable);

      // --- 10 y 11. RECEPCIÓN + SALA DE ENTREVISTAS ---
      buildReceptionAndInterview();

      // --- 12. ALA OESTE + JARDÍN NATURAL ---
      buildPracticeRoom();
      buildDiningAndKitchen();
      buildServiceRooms();
      buildProgrammingRoom();
      buildGymAndTraining();
      buildNatureRoom();

      // Ajuste global de reflejos del entorno para materiales sin calibrar
      scene.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.isMeshStandardMaterial && obj.material.envMapIntensity === 1) {
          obj.material.envMapIntensity = 0.6;
        }
      });
    }

    // ------------------------------------------------------------------------
    // 3.5 AVATARES: ver avatars.js
    // ------------------------------------------------------------------------
    // Quita un agente de la escena, del panel y de la lista (candidatos que se van, despedidos)
    function removeAgent(agentId) {
      const m = agentMeshes[agentId];
      if (m) {
        scene.remove(m.root);
        disposeAvatar(m);
        delete agentMeshes[agentId];
      }
      removeAgentLabel(agentId);
      const idx = AGENTS.findIndex(a => a.id === agentId);
      if (idx >= 0) AGENTS.splice(idx, 1);
      if (selectedAgentId === agentId) selectedAgentId = 'camila_ia';
    }

    // Ubica a cada agente en su puesto de trabajo (sin pisar muebles)
    function placeAgentsAtHome() {
      AGENTS.forEach(a => {
        if (HOME_SPOTS[a.id] !== undefined) a.homeSpot = HOME_SPOTS[a.id];
        a.targetPos = null;
      });
      AGENTS.forEach(a => {
        const wp = getWaypointForZone(a.homeZone, a.id);
        a.pos = { x: wp.x, z: wp.z };
        a.targetPos = wp;
        a.yaw = wp.yaw || 0;
        a.currentZone = a.homeZone;
        a._navGoal = wp;
        a.path = [];
        a.pathIndex = 0;
      });
    }

    // Elige un puesto libre de la sala: primero el puesto fijo del agente, luego los demás puestos,
    // y si la sala está llena, un punto libre de obstáculos dentro de ella.
    function getWaypointForZone(zoneId, agentId) {
      const z = ZONES[zoneId] || ZONES.meeting;
      const agent = AGENTS.find(a => a.id === agentId);
      const spots = z.spots || [];
      const taken = (sx, sz) => AGENTS.some(a => a.id !== agentId && a.targetPos &&
        Math.hypot(a.targetPos.x - sx, a.targetPos.z - sz) < 0.5);

      if (zoneId === 'interview' && agentId === 'human_dir') return spotToTarget(INTERVIEW_SPOTS.interviewer);
      // cabecera de las salas de reuniones y frente del aula: reservados para el Director
      const reserved0 = !!(z.boardroom || z.trainerSpot || z.reserved0);
      const zoneDirector = z.office ? z.office + '_dir' : 'human_dir';
      const isDirector = agentId === 'human_dir' || /_dir$/.test(agentId);
      if (reserved0 && isDirector && spots[0]) return spotToTarget(spots[0]);
      if (reserved0 && agentId === zoneDirector && spots[0]) return spotToTarget(spots[0]);
      if (agent && agent.homeZone === zoneId && agent.homeSpot !== undefined && spots[agent.homeSpot]) {
        const hs = spots[agent.homeSpot];
        if (!taken(hs[0], hs[1])) return spotToTarget(hs);
      }
      if (spots.length) {
        const start = officeHash(agentId) % spots.length;
        for (let k = 0; k < spots.length; k++) {
          const idx = (start + k) % spots.length;
          if (reserved0 && idx === 0) continue;
          const s = spots[idx];
          if (!taken(s[0], s[1])) return spotToTarget(s);
        }
      }
      return randomFreePointInZone(zoneId, agentId, Math.random);
    }

    // Punto libre de obstáculos (y de otros agentes) dentro de una sala
    function randomFreePointInZone(zoneId, agentId, rand = Math.random) {
      const z = ZONES[zoneId] || ZONES.meeting;
      const taken = (sx, sz) => AGENTS.some(a => a.id !== agentId && a.targetPos &&
        Math.hypot(a.targetPos.x - sx, a.targetPos.z - sz) < 0.6);
      for (let tries = 0; tries < 80; tries++) {
        const x = z.x + (rand() - 0.5) * (z.w - 1.2);
        const zz = z.z + (rand() - 0.5) * (z.d - 1.2);
        if (isFreeWorld(x, zz) && !taken(x, zz)) return { x, z: zz, yaw: rand() * Math.PI * 2 };
      }
      return { x: z.x, z: z.z };
    }

    function spawnDataPacket(fromZoneId, toZoneId, colorHex = 0x22d3ee) {
      const a = ZONES[fromZoneId] || ZONES.meeting;
      const b = ZONES[toZoneId] || ZONES.meeting;
      const mesh = new THREE.Mesh(
        cachedGeo('Sphere', 0.14, 10, 10),
        cachedMat('packet|' + colorHex, () => new THREE.MeshBasicMaterial({ color: colorHex }))
      );
      mesh.position.set(a.x, 1.1, a.z);
      scene.add(mesh);
      packetMeshes.push({
        mesh,
        start: new THREE.Vector3(a.x, 1.1, a.z),
        end: new THREE.Vector3(b.x, 1.1, b.z),
        progress: 0
      });
    }

    // Bucle principal: sin asignaciones de objetos por cuadro y con pasos escalados por dt
    // (k = 1 equivale a un cuadro a 60 FPS, así la velocidad es igual a 60, 120 o 144 Hz)
    // Sistemas añadidos (ciudad, reloj, modo Director 3D…) se enganchan al bucle sin tocarlo
    const FRAME_HOOKS = { pre: [], post: [], cameraDirect: false };

    function animate() {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(renderClock.getDelta(), 0.05);
      const k = dt * 60;
      const time = performance.now() * 0.001;

      for (let i = 0; i < steamParticles.length; i++) {
        const sp = steamParticles[i];
        const cycle = (time * 0.55 + sp.offset) % 1.4;
        sp.mesh.position.y = sp.baseY + cycle * 0.65;
        sp.mesh.position.x = 9.4 + Math.sin(time * 2 + sp.offset) * 0.08;
        sp.mesh.material.opacity = Math.max(0, (1 - cycle / 1.4) * 0.45);
      }

      for (let i = 0; i < animatedScreens.length; i++) {
        const sc = animatedScreens[i];
        sc.tex.offset.y = (sc.tex.offset.y + sc.speed * k) % 1;
      }

      for (let i = 0; i < blinkingLeds.length; i++) {
        const l = blinkingLeds[i];
        l.material.emissiveIntensity = l.base + Math.max(0, Math.sin(time * l.speed + l.phase)) * l.amp;
      }

      if (FRAME_HOOKS.pre.length) for (let i = 0; i < FRAME_HOOKS.pre.length; i++) FRAME_HOOKS.pre[i](dt, time);
      updateDoors(dt);
      updateTimeOfDay(dt);
      updateButterflies(time);

      const yawBlend = Math.min(1, 0.18 * k);
      const pathStart = performance.now();
      let pathCount = 0;
      for (let i = 0; i < AGENTS.length; i++) {
        const agent = AGENTS[i];
        const m = agentMeshes[agent.id];
        if (!m) continue;

        // Nuevo destino: se calcula una ruta que rodea paredes y muebles
        // (máximo unas pocas rutas por cuadro para que nunca se trabe la animación)
        if (agent.targetPos !== agent._navGoal && (pathCount === 0 || performance.now() - pathStart < 6)) {
          planAgentPath(agent);
          pathCount++;
        }

        let moving = false;
        let desiredYaw = null;
        const pendingPlan = agent.targetPos !== agent._navGoal; // espera su turno para calcular ruta
        if (!pendingPlan && agent.path && agent.pathIndex < agent.path.length) {
          let budget = AGENT_SPEED * dt;
          while (budget > 0 && agent.pathIndex < agent.path.length) {
            const wp = agent.path[agent.pathIndex];
            const dx = wp.x - agent.pos.x;
            const dz = wp.z - agent.pos.z;
            const dist = Math.hypot(dx, dz);
            if (dist > 0.001) desiredYaw = Math.atan2(dx, dz);
            if (dist <= budget) {
              agent.pos.x = wp.x;
              agent.pos.z = wp.z;
              budget -= dist;
              agent.pathIndex++;
            } else {
              agent.pos.x += (dx / dist) * budget;
              agent.pos.z += (dz / dist) * budget;
              budget = 0;
            }
          }
          moving = agent.pathIndex < agent.path.length;
        } else if (agent.targetPos && agent.targetPos.yaw !== undefined) {
          desiredYaw = agent.targetPos.yaw; // ya llegó: mira hacia su escritorio / interlocutor
        }
        if (agent._manual) { moving = agent._manualMoving; desiredYaw = null; } // Director en modo 3D (director3d.js)

        if (desiredYaw !== null) {
          let diff = desiredYaw - agent.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          agent.yaw += diff * (moving ? yawBlend : yawBlend * 0.6);
        }

        animateAvatar(agent, m, dt, k, time, moving, pendingPlan);
        m.root.position.set(agent.pos.x, 0, agent.pos.z);
        m.pivot.rotation.y = agent.yaw;
      }

      for (let i = packetMeshes.length - 1; i >= 0; i--) {
        const p = packetMeshes[i];
        p.progress = Math.min(1, p.progress + 0.032 * k);
        p.mesh.position.lerpVectors(p.start, p.end, p.progress);
        p.mesh.position.y = 1.05 + Math.sin(p.progress * Math.PI) * 1.4;
        if (p.progress >= 1) {
          // geometría y material son compartidos (caché): basta con quitar la malla
          scene.remove(p.mesh);
          packetMeshes.splice(i, 1);
        }
      }

      if (cameraMode === 'follow') {
        for (let i = 0; i < AGENTS.length; i++) {
          if (AGENTS[i].id === selectedAgentId) {
            desiredCameraTarget.set(AGENTS[i].pos.x, 1.1, AGENTS[i].pos.z);
            break;
          }
        }
      }

      for (let i = 0; i < FRAME_HOOKS.post.length; i++) FRAME_HOOKS.post[i](dt, time);
      if (!FRAME_HOOKS.cameraDirect) controls.target.lerp(desiredCameraTarget, 1 - Math.pow(0.92, k));
      controls.update();
      updateProjectedLabels();
      renderer.render(scene, camera);
      trackFrameRate(dt); // FPS y calidad adaptativa (perf.js)
    }

    function setupClickInteractions(domElement) {
      let downPos = { x: 0, y: 0 };
      domElement.addEventListener('pointerdown', (e) => {
        downPos = { x: e.clientX, y: e.clientY };
      });

      domElement.addEventListener('pointerup', (e) => {
        const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
        if (dist > 6) return;

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const agentTargets = [];
        Object.values(agentMeshes).forEach(m => {
          agentTargets.push(...m.pivot.children, ...m.headGroup.children);
        });
        const agentHits = raycaster.intersectObjects(agentTargets, true);
        if (agentHits.length > 0) {
          let obj = agentHits[0].object;
          while (obj && !obj.userData.agentId) obj = obj.parent;
          if (obj && obj.userData.agentId) {
            selectAgent(obj.userData.agentId);
            return;
          }
        }

        const floorHits = raycaster.intersectObjects(Object.values(zoneFloorMeshes));
        if (floorHits.length > 0) {
          const zId = floorHits[0].object.userData.zoneId;
          if (zId) moveDirectorTo(zId);
        }
      });
    }

    function setCameraPreset(preset) {
      cameraMode = preset;
      const sel = document.getElementById('cam-select');
      if (sel && sel.value !== preset && [...sel.options].some(o => o.value === preset)) sel.value = preset;

      if (preset.startsWith('office:')) {
        const o = guestOffice(preset.slice(7));
        if (!o) return;
        const ox = GUEST_SLOTS_X[o.slot];
        desiredCameraTarget.set(ox, 0.8, GUEST_OZ + 8);
        camera.position.set(ox + 6, 20, GUEST_OZ - 12);
        return;
      }
      if (preset === 'street') {
        desiredCameraTarget.set(-8, 0.8, 32);
        camera.position.set(-8, 30, 8);
      } else if (preset === 'overview') {
        desiredCameraTarget.set(-7.5, 0.8, 4);
        camera.position.set(14, 34, 44);
      } else if (preset === 'west_wing') {
        desiredCameraTarget.set(-29, 1.0, -1);
        camera.position.set(-12, 22, 18);
      } else if (preset === 'nature') {
        desiredCameraTarget.set(-11.5, 1.0, 16.5);
        camera.position.set(-4, 12, 32);
      } else if (preset === 'reception') {
        desiredCameraTarget.set(7.5, 1.0, 16);
        camera.position.set(13, 12, 30);
      } else if (preset === 'dev_lab') {
        desiredCameraTarget.set(-11, 1.0, 0.5);
        camera.position.set(-1, 12, 11);
      } else if (preset === 'cafe_lounge') {
        desiredCameraTarget.set(13, 1.0, -4.5);
        camera.position.set(23, 10, 4);
      } else if (preset === 'help_desk') {
        desiredCameraTarget.set(8.5, 1.0, 6.5);
        camera.position.set(15, 9, 14);
      } else if (preset === 'follow') {
        const ag = AGENTS.find(a => a.id === selectedAgentId);
        if (ag) desiredCameraTarget.set(ag.pos.x, 1.1, ag.pos.z);
      }
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      updateViewportCache();
    }
