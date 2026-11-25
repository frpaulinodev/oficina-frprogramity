    // [scene-furniture.js] Parte de lo que antes era script.js: ESCENA 3D: materiales y muebles reutilizables (secciones 3.2 y 3.3).
    // Se carga en orden desde index.html; no cambies el orden de los archivos.
    // ------------------------------------------------------------------------
    // 3.2 MATERIALES PBR CALIBRADOS
    // ------------------------------------------------------------------------
    function createOfficeMaterials() {
      const carpetColor = makeOfficeTexture('carpet_c', 512, 512, (c, w, h, r) => drawCarpetTiles(c, w, h, r, 'color'), { seed: 11, color: true });
      const carpetBump = makeOfficeTexture('carpet_b', 512, 512, (c, w, h, r) => drawCarpetTiles(c, w, h, r, 'bump'), { seed: 11 });

      const oakPal = { base: [176, 132, 90], dark: [96, 62, 36], light: [214, 176, 132] };
      const walnutPal = { base: [104, 70, 46], dark: [52, 32, 20], light: [150, 108, 74] };
      const oakColor = makeOfficeTexture('oak_c', 512, 512, (c, w, h, r) => drawWoodGrain(c, w, h, r, 'color', oakPal), { seed: 21, color: true });
      const oakBump = makeOfficeTexture('oak_b', 512, 512, (c, w, h, r) => drawWoodGrain(c, w, h, r, 'bump', oakPal), { seed: 21 });
      const walnutColor = makeOfficeTexture('walnut_c', 512, 512, (c, w, h, r) => drawWoodGrain(c, w, h, r, 'color', walnutPal), { seed: 33, color: true });
      const walnutBump = makeOfficeTexture('walnut_b', 512, 512, (c, w, h, r) => drawWoodGrain(c, w, h, r, 'bump', walnutPal), { seed: 33 });

      const laminateColor = makeOfficeTexture('laminate_c', 512, 512, (c, w, h, r) => drawLaminate(c, w, h, r, 'color'), { seed: 44, color: true });
      const laminateBump = makeOfficeTexture('laminate_b', 512, 512, (c, w, h, r) => drawLaminate(c, w, h, r, 'bump'), { seed: 44 });

      const marble = makeOfficeTexture('marble', 512, 512, drawMarble, { seed: 55, color: true });
      const fabric = makeOfficeTexture('fabric_c', 256, 256, (c, w, h, r) => drawFabric(c, w, h, r, 'color'), { seed: 66, color: true });
      const fabricBump = makeOfficeTexture('fabric_b', 256, 256, (c, w, h, r) => drawFabric(c, w, h, r, 'bump'), { seed: 66 });
      const leather = makeOfficeTexture('leather', 256, 256, drawLeather, { seed: 77, color: true });
      const brushed = makeOfficeTexture('brushed', 256, 256, drawBrushedMetal, { seed: 88, color: true });
      const noise = makeOfficeTexture('noise', 256, 256, drawFineNoise, { seed: 99 });

      OFFICE_MAT.carpet = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: officeTexRepeat(carpetColor, 23, 14),
        bumpMap: officeTexRepeat(carpetBump, 23, 14),
        bumpScale: 0.018,
        roughnessMap: officeTexRepeat(carpetBump, 23, 14),
        roughness: 1.0,
        metalness: 0.0,
        envMapIntensity: 0.25
      });
      OFFICE_MAT.laminate = new THREE.MeshStandardMaterial({
        map: laminateColor,
        bumpMap: laminateBump,
        bumpScale: 0.012,
        roughnessMap: laminateBump,
        roughness: 0.62,
        metalness: 0.0,
        envMapIntensity: 0.55
      });
      OFFICE_MAT.oak = new THREE.MeshStandardMaterial({
        map: oakColor, bumpMap: oakBump, bumpScale: 0.004, roughnessMap: oakBump,
        roughness: 0.55, metalness: 0.0, envMapIntensity: 0.6
      });
      OFFICE_MAT.walnut = new THREE.MeshStandardMaterial({
        map: walnutColor, bumpMap: walnutBump, bumpScale: 0.004, roughnessMap: walnutBump,
        roughness: 0.48, metalness: 0.0, envMapIntensity: 0.65
      });
      OFFICE_MAT.walnutSlats = new THREE.MeshStandardMaterial({
        map: officeTexRepeat(walnutColor, 1, 1), bumpMap: walnutBump, bumpScale: 0.006,
        roughness: 0.6, metalness: 0.0, envMapIntensity: 0.5
      });
      OFFICE_MAT.whiteSatin = new THREE.MeshStandardMaterial({
        color: 0xe9ebee, bumpMap: noise, bumpScale: 0.0015, roughnessMap: noise,
        roughness: 0.42, metalness: 0.0, envMapIntensity: 0.7
      });
      OFFICE_MAT.graphiteMatte = new THREE.MeshStandardMaterial({
        color: 0x2a2e35, bumpMap: noise, bumpScale: 0.0015, roughnessMap: noise,
        roughness: 0.78, metalness: 0.05, envMapIntensity: 0.5
      });
      OFFICE_MAT.edgeBand = new THREE.MeshStandardMaterial({ color: 0x15181d, roughness: 0.38, metalness: 0.1 });
      OFFICE_MAT.metalLeg = new THREE.MeshStandardMaterial({
        color: 0x3a3f47, map: brushed, roughness: 0.32, metalness: 0.9, envMapIntensity: 1.0
      });
      OFFICE_MAT.steel = new THREE.MeshStandardMaterial({
        color: 0xd7dbe0, map: brushed, roughnessMap: noise, roughness: 0.28, metalness: 0.95, envMapIntensity: 1.1
      });
      OFFICE_MAT.chrome = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.12, metalness: 1.0, envMapIntensity: 1.2 });
      OFFICE_MAT.copper = new THREE.MeshStandardMaterial({ color: 0xc27a4a, map: brushed, roughness: 0.3, metalness: 0.95, envMapIntensity: 1.0 });
      OFFICE_MAT.bezel = new THREE.MeshStandardMaterial({ color: 0x0b0d11, roughness: 0.32, metalness: 0.35 });
      OFFICE_MAT.plastic = new THREE.MeshStandardMaterial({ color: 0x1b1e24, roughness: 0.55, metalness: 0.05 });
      OFFICE_MAT.keycap = new THREE.MeshStandardMaterial({ color: 0x2b2f36, bumpMap: noise, bumpScale: 0.001, roughness: 0.6 });
      OFFICE_MAT.panelFabric = new THREE.MeshStandardMaterial({
        color: 0x4b5563, map: officeTexRepeat(fabric, 4, 2), bumpMap: officeTexRepeat(fabricBump, 4, 2), bumpScale: 0.004, roughness: 0.95
      });
      OFFICE_MAT.chairFabric = new THREE.MeshStandardMaterial({
        color: 0x2f3542, map: officeTexRepeat(fabric, 2, 2), bumpMap: officeTexRepeat(fabricBump, 2, 2), bumpScale: 0.004, roughness: 0.92
      });
      OFFICE_MAT.mesh = new THREE.MeshStandardMaterial({
        color: 0x1f232a, map: officeTexRepeat(fabric, 6, 6), bumpMap: officeTexRepeat(fabricBump, 6, 6), bumpScale: 0.006, roughness: 0.85
      });
      OFFICE_MAT.sofaFabric = new THREE.MeshStandardMaterial({
        color: 0x4a5878, map: officeTexRepeat(fabric, 3, 3), bumpMap: officeTexRepeat(fabricBump, 3, 3), bumpScale: 0.006,
        roughnessMap: officeTexRepeat(fabricBump, 3, 3), roughness: 1.0, metalness: 0.0, envMapIntensity: 0.3
      });
      OFFICE_MAT.leather = new THREE.MeshStandardMaterial({
        color: 0x8a4f2e, map: officeTexRepeat(leather, 5, 5), bumpMap: officeTexRepeat(leather, 5, 5), bumpScale: 0.002, roughnessMap: officeTexRepeat(leather, 5, 5),
        roughness: 0.5, metalness: 0.0, envMapIntensity: 0.7
      });
      OFFICE_MAT.blackLeather = new THREE.MeshStandardMaterial({
        color: 0x2a2a2e, map: leather, bumpMap: leather, bumpScale: 0.003, roughnessMap: leather,
        roughness: 0.45, metalness: 0.0, envMapIntensity: 0.8
      });
      OFFICE_MAT.marble = new THREE.MeshStandardMaterial({
        map: marble, roughness: 0.16, metalness: 0.0, envMapIntensity: 0.9
      });
      OFFICE_MAT.ceramic = new THREE.MeshStandardMaterial({ color: 0xf7f5f2, roughness: 0.14, metalness: 0.0, envMapIntensity: 0.9 });
      OFFICE_MAT.coffee = new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.12, metalness: 0.0 });
      OFFICE_MAT.potConcrete = new THREE.MeshStandardMaterial({ color: 0xbab5ae, bumpMap: noise, bumpScale: 0.01, roughness: 0.92 });
      OFFICE_MAT.soil = new THREE.MeshStandardMaterial({ color: 0x2e2118, roughness: 1.0 });
      OFFICE_MAT.leaf = new THREE.MeshStandardMaterial({ color: 0x2f7d4a, roughness: 0.62, side: THREE.DoubleSide });
      OFFICE_MAT.leafDark = new THREE.MeshStandardMaterial({ color: 0x1f5f38, roughness: 0.68, side: THREE.DoubleSide });
      OFFICE_MAT.rackBody = new THREE.MeshStandardMaterial({
        color: 0x22262d, map: brushed, roughness: 0.42, metalness: 0.8, envMapIntensity: 0.8
      });
      OFFICE_MAT.paper = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
      OFFICE_MAT.bulb = new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffc985, emissiveIntensity: 1.6, roughness: 0.4 });
      OFFICE_MAT.aluminium = new THREE.MeshStandardMaterial({ color: 0x2b3038, roughness: 0.35, metalness: 0.85, envMapIntensity: 0.8 });

      // Los hex están pensados en sRGB: se pasan a lineal para que la salida sRGB no los deslave
      Object.values(OFFICE_MAT).forEach(m => {
        if (m.color) m.color.convertSRGBToLinear();
      });
    }

    function buildOfficeEnvironment() {
      try {
        const envTex = makeOfficeTexture('env', 512, 256, drawEnvironment, { seed: 5, color: true, clamp: true });
        envTex.mapping = THREE.EquirectangularReflectionMapping;
        const pmrem = new THREE.PMREMGenerator(renderer);
        const rt = pmrem.fromEquirectangular(envTex);
        pmrem.dispose();
        scene.environment = rt.texture;
      } catch (err) {
        console.warn('Mapa de entorno no disponible:', err);
      }
    }

    // ------------------------------------------------------------------------
    // 3.3 PIEZAS DE MOBILIARIO REUTILIZABLES
    // ------------------------------------------------------------------------
    function addPart(parent, geo, mat, x, y, z, opts = {}) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      // Solo las piezas grandes proyectan sombra (tazas, cables, LEDs y detalles no)
      if (opts.cast === true) m.castShadow = true;
      else if (opts.cast === false) m.castShadow = false;
      else m.castShadow = !!(geo.boundingSphere && geo.boundingSphere.radius >= SHADOW_MIN_RADIUS);
      m.receiveShadow = opts.receive !== false;
      if (opts.rot) m.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
      parent.add(m);
      return m;
    }

    function officeBox(w, h, d) {
      return cachedGeo('Box', w, h, d);
    }

    // ------------------------------------------------------------------------
    // 3.3a OBSTÁCULOS: huella en planta (rectángulos) de muebles y paredes
    // ------------------------------------------------------------------------
    const COLLIDERS = [];
    // Etiqueta de construcción: los obstáculos y puertas creados mientras está activa pertenecen
    // a esa oficina (así se pueden quitar al eliminar una oficina vecina)
    let BUILD_TAG = null;
    // rect centrado en (x, z) de tamaño w x d; rotY solo se usa para girar 90°
    function addCollider(x, z, w, d, rotY = 0, kind = 'furniture') {
      const quarter = Math.abs(Math.round((rotY || 0) / (Math.PI / 2))) % 2 === 1;
      const hw = (quarter ? d : w) / 2;
      const hd = (quarter ? w : d) / 2;
      COLLIDERS.push({ x1: x - hw, x2: x + hw, z1: z - hd, z2: z + hd, kind, tag: BUILD_TAG });
    }

    // Escritorio: tablero con canto marcado, patas metálicas tipo trineo y faldón
    function buildOfficeDesk(x, z, w, d, topMat, opts = {}) {
      const h = opts.height || 0.75;
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      if (opts.rotY) g.rotation.y = opts.rotY;
      const topT = 0.045;
      const top = addPart(g, officeBox(w, topT, d), topMat, 0, h - topT / 2, 0);
      if (topMat.map) {
        // la veta sigue al largo del tablero (material cacheado por tamaño de repetición)
        const rx = Math.max(1, w / 2.4), ry = Math.max(0.5, d / 2.4);
        top.material = cachedMat('deskTop|' + topMat.uuid + '|' + rx.toFixed(3) + '|' + ry.toFixed(3), () => {
          const mm = topMat.clone();
          mm.map = officeTexRepeat(topMat.map, rx, ry);
          if (topMat.bumpMap) mm.bumpMap = officeTexRepeat(topMat.bumpMap, rx, ry);
          if (topMat.roughnessMap) mm.roughnessMap = mm.bumpMap;
          return mm;
        });
      }
      addPart(g, officeBox(w - 0.02, 0.022, d - 0.02), OFFICE_MAT.edgeBand, 0, h - topT - 0.011, 0);
      const legH = h - topT - 0.022;
      [-1, 1].forEach(sx => {
        const lx = sx * (w / 2 - 0.12);
        addPart(g, officeBox(0.05, legH, 0.05), OFFICE_MAT.metalLeg, lx, legH / 2, d / 2 - 0.1);
        addPart(g, officeBox(0.05, legH, 0.05), OFFICE_MAT.metalLeg, lx, legH / 2, -d / 2 + 0.1);
        addPart(g, officeBox(0.06, 0.03, d - 0.12), OFFICE_MAT.metalLeg, lx, 0.015, 0);
        addPart(g, officeBox(0.05, 0.04, d - 0.16), OFFICE_MAT.metalLeg, lx, legH - 0.02, 0);
      });
      addPart(g, officeBox(w - 0.3, 0.04, 0.04), OFFICE_MAT.metalLeg, 0, legH - 0.02, -d / 2 + 0.12);
      if (opts.panel !== false) {
        addPart(g, officeBox(w - 0.34, 0.34, 0.02), opts.panelMat || OFFICE_MAT.panelFabric, 0, h - 0.28, -d / 2 + 0.14);
      }
      if (opts.glow) {
        const glowMat = cachedMat('deskGlow|' + opts.glow, () => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: opts.glow, emissiveIntensity: 1.4 }));
        addPart(g, officeBox(w - 0.2, 0.012, 0.012), glowMat, 0, h - topT - 0.03, d / 2 - 0.04, { cast: false });
      }
      if (opts.collide !== false) addCollider(x, z, w, d, opts.rotY || 0);
      scene.add(g);
      return g;
    }

    // Monitor con bisel, pantalla simulada, cuello y base
    function buildMonitor(x, y, z, w, h, screenKind, opts = {}) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = opts.rotY || 0;
      const standH = opts.standH !== undefined ? opts.standH : 0.14;
      addPart(g, cachedGeo('Cylinder', 0.11, 0.12, 0.014, 24), OFFICE_MAT.aluminium, 0, 0.007, -0.03);
      addPart(g, officeBox(0.045, standH + h * 0.35, 0.03), OFFICE_MAT.aluminium, 0, (standH + h * 0.35) / 2, -0.055);
      const cy = standH + h / 2;
      addPart(g, officeBox(w + 0.035, h + 0.035, 0.032), OFFICE_MAT.bezel, 0, cy, -0.02);
      addPart(g, officeBox(w * 0.6, h * 0.55, 0.03), OFFICE_MAT.plastic, 0, cy, -0.05);
      const scr = new THREE.Mesh(cachedGeo('Plane', w, h), getScreenMaterial(screenKind));
      scr.position.set(0, cy, 0.0);
      g.add(scr);
      scene.add(g);
      return g;
    }

    function buildKeyboardAndMouse(x, y, z, rotY = 0) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = rotY;
      addPart(g, officeBox(0.44, 0.018, 0.14), OFFICE_MAT.plastic, 0, 0.009, 0);
      addPart(g, officeBox(0.41, 0.008, 0.11), OFFICE_MAT.keycap, 0, 0.022, 0, { cast: false });
      addPart(g, cachedGeo('Sphere', 0.035, 12, 8), OFFICE_MAT.plastic, 0.32, 0.012, 0.01).scale.set(0.8, 0.45, 1.25);
      addPart(g, officeBox(0.26, 0.004, 0.21), OFFICE_MAT.graphiteMatte, 0.32, 0.002, 0.01, { cast: false });
      scene.add(g);
      return g;
    }

    // Silla de oficina: base de 5 radios con ruedas, pistón, asiento y respaldo
    function buildOfficeChair(x, z, rotY, opts = {}) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = rotY;
      const seatMat = opts.seatMat || OFFICE_MAT.chairFabric;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const spoke = addPart(g, officeBox(0.04, 0.03, 0.3), OFFICE_MAT.aluminium, Math.sin(a) * 0.15, 0.07, Math.cos(a) * 0.15);
        spoke.rotation.y = a;
        addPart(g, cachedGeo('Sphere', 0.03, 8, 6), OFFICE_MAT.plastic, Math.sin(a) * 0.29, 0.03, Math.cos(a) * 0.29);
      }
      addPart(g, cachedGeo('Cylinder', 0.025, 0.03, 0.34, 12), OFFICE_MAT.chrome, 0, 0.25, 0);
      addPart(g, officeBox(0.5, 0.07, 0.48), seatMat, 0, 0.45, 0);
      addPart(g, officeBox(0.46, 0.02, 0.44), OFFICE_MAT.plastic, 0, 0.405, 0);
      const backH = opts.tall ? 0.78 : 0.52;
      const back = addPart(g, officeBox(0.46, backH, 0.06), opts.backMat || seatMat, 0, 0.5 + backH / 2 + 0.05, -0.23);
      back.rotation.x = -0.1;
      addPart(g, officeBox(0.06, 0.32, 0.04), OFFICE_MAT.aluminium, 0, 0.62, -0.25);
      if (opts.accent) {
        const accentMat = cachedMat('chairAccent|' + opts.accent, () => new THREE.MeshStandardMaterial({ color: opts.accent, roughness: 0.5 }));
        [-0.14, 0.14].forEach(sx => {
          const stripe = addPart(g, officeBox(0.05, backH * 0.92, 0.065), accentMat, sx, 0.5 + backH / 2 + 0.05, -0.23);
          stripe.rotation.x = -0.1;
        });
      }
      if (opts.arms !== false) {
        [-1, 1].forEach(sx => {
          addPart(g, officeBox(0.03, 0.2, 0.03), OFFICE_MAT.plastic, sx * 0.25, 0.56, -0.02);
          addPart(g, officeBox(0.06, 0.025, 0.24), OFFICE_MAT.plastic, sx * 0.25, 0.67, 0.0);
        });
      }
      scene.add(g);
      return g;
    }

    function buildPlant(x, z, scale = 1) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.scale.setScalar(scale);
      addCollider(x, z, 0.46 * scale, 0.46 * scale);
      addPart(g, cachedGeo('Cylinder', 0.24, 0.18, 0.46, 24), OFFICE_MAT.potConcrete, 0, 0.23, 0);
      addPart(g, cachedGeo('Cylinder', 0.22, 0.22, 0.02, 20), OFFICE_MAT.soil, 0, 0.45, 0, { cast: false });
      const leafGeo = cachedGeo('Sphere', 1, 10, 8);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + (i % 3) * 0.3;
        const tilt = 0.35 + (i % 4) * 0.12;
        const leaf = new THREE.Mesh(leafGeo, i % 2 ? OFFICE_MAT.leaf : OFFICE_MAT.leafDark);
        leaf.scale.set(0.07, 0.36 + (i % 3) * 0.06, 0.02);
        leaf.position.set(Math.sin(a) * 0.12, 0.75 + (i % 3) * 0.06, Math.cos(a) * 0.12);
        leaf.rotation.set(Math.cos(a) * tilt, a, -Math.sin(a) * tilt);
        leaf.castShadow = false; // las hojas son detalle fino: la maceta ya proyecta sombra
        g.add(leaf);
      }
      scene.add(g);
      return g;
    }

    // Taza con asa (ceramica + café)
    function buildCup(parent, x, y, z, opts = {}) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      const s = opts.scale || 1;
      g.scale.setScalar(s);
      const body = new THREE.Mesh(cachedGeo('Cylinder', 0.045, 0.036, 0.085, 20, 1, true), cachedMat('ceramicDouble', () => {
        const mm = OFFICE_MAT.ceramic.clone();
        mm.side = THREE.DoubleSide;
        return mm;
      }));
      body.position.y = 0.0425;
      body.castShadow = false;
      g.add(body);
      addPart(g, cachedGeo('Cylinder', 0.036, 0.036, 0.006, 20), OFFICE_MAT.ceramic, 0, 0.003, 0);
      addPart(g, cachedGeo('Cylinder', 0.042, 0.042, 0.004, 20), OFFICE_MAT.coffee, 0, 0.07, 0, { cast: false });
      const handle = addPart(g, cachedGeo('Torus', 0.024, 0.0065, 8, 16, Math.PI), OFFICE_MAT.ceramic, 0.046, 0.044, 0);
      handle.rotation.z = -Math.PI / 2;
      if (opts.saucer) {
        addPart(g, cachedGeo('Cylinder', 0.075, 0.06, 0.01, 24), OFFICE_MAT.ceramic, 0, -0.004, 0);
      }
      if (opts.accent !== undefined) {
        const band = new THREE.Mesh(cachedGeo('Cylinder', 0.0455, 0.043, 0.014, 20, 1, true), cachedMat('cupBand|' + opts.accent, () => new THREE.MeshStandardMaterial({ color: opts.accent, roughness: 0.3 })));
        band.position.y = 0.05;
        g.add(band);
      }
      parent.add(g);
      return g;
    }

    function buildWallDisplay(x, y, z, w, h, kind, rotY = 0, withStand = true) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = rotY;
      addPart(g, officeBox(w + 0.1, h + 0.1, 0.07), OFFICE_MAT.bezel, 0, y, 0);
      const scr = new THREE.Mesh(cachedGeo('Plane', w, h), getScreenMaterial(kind));
      scr.position.set(0, y, 0.04);
      g.add(scr);
      if (withStand) {
        [-1, 1].forEach(sx => {
          addPart(g, officeBox(0.06, y, 0.06), OFFICE_MAT.aluminium, sx * (w / 2 - 0.25), y / 2, -0.07);
          addPart(g, officeBox(0.12, 0.03, 0.55), OFFICE_MAT.aluminium, sx * (w / 2 - 0.25), 0.015, -0.07);
        });
      }
      scene.add(g);
      return g;
    }

    function buildLaptop(x, y, z, rotY, kind) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = rotY;
      addPart(g, officeBox(0.34, 0.014, 0.23), OFFICE_MAT.steel, 0, 0.007, 0);
      addPart(g, officeBox(0.3, 0.002, 0.12), OFFICE_MAT.keycap, 0, 0.015, 0.02, { cast: false });
      const lid = new THREE.Group();
      lid.position.set(0, 0.014, -0.115);
      lid.rotation.x = -0.28;
      g.add(lid);
      addPart(lid, officeBox(0.34, 0.22, 0.008), OFFICE_MAT.steel, 0, 0.11, 0);
      const scr = new THREE.Mesh(cachedGeo('Plane', 0.31, 0.19), getScreenMaterial(kind));
      scr.position.set(0, 0.11, 0.0045);
      lid.add(scr);
      scene.add(g);
      return g;
    }

    function buildDeskLamp(x, y, z, rotY = 0) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = rotY;
      addPart(g, cachedGeo('Cylinder', 0.07, 0.08, 0.02, 20), OFFICE_MAT.bezel, 0, 0.01, 0);
      const arm = addPart(g, cachedGeo('Cylinder', 0.01, 0.01, 0.42, 8), OFFICE_MAT.chrome, 0.05, 0.21, 0);
      arm.rotation.z = -0.25;
      const head = addPart(g, cachedGeo('Cone', 0.07, 0.12, 20, 1, true), OFFICE_MAT.bezel, 0.11, 0.41, 0.02);
      head.rotation.z = 0.9;
      addPart(g, cachedGeo('Sphere', 0.025, 10, 8), OFFICE_MAT.bulb, 0.13, 0.385, 0.02, { cast: false });
      scene.add(g);
      return g;
    }

    function buildServerRack(x, z) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      addCollider(x, z, 1.14, 1.04);
      addPart(g, officeBox(1.1, 2.2, 1.0), OFFICE_MAT.rackBody, 0, 1.1, 0);
      addPart(g, officeBox(1.14, 0.06, 1.04), OFFICE_MAT.bezel, 0, 2.23, 0);
      addPart(g, officeBox(1.14, 0.08, 1.04), OFFICE_MAT.bezel, 0, 0.04, 0);
      const frontColor = makeOfficeTexture('rack_c', 256, 512, (c, w, h, r) => drawRackFront(c, w, h, r, 'color'), { seed: 123, color: true, clamp: true });
      const frontEmit = makeOfficeTexture('rack_e', 256, 512, (c, w, h, r) => drawRackFront(c, w, h, r, 'emissive'), { seed: 123, color: true, clamp: true });
      const frontMat = cachedMat('rackFront|' + x + '|' + z, () => new THREE.MeshStandardMaterial({
        map: frontColor,
        emissive: 0xffffff,
        emissiveMap: frontEmit,
        emissiveIntensity: 1.2,
        roughness: 0.4,
        metalness: 0.6
      }));
      const front = new THREE.Mesh(cachedGeo('Plane', 0.98, 2.0), frontMat);
      front.position.set(0, 1.12, 0.502);
      g.add(front);
      if (!blinkingLeds.some(l => l.material === frontMat)) {
        blinkingLeds.push({ material: frontMat, base: 0.8, amp: 0.7, speed: 3 + Math.random() * 3, phase: Math.random() * 6 });
      }
      // puerta perforada lateral (rejilla)
      [-1, 1].forEach(sx => {
        addPart(g, officeBox(0.02, 2.0, 0.9), OFFICE_MAT.mesh, sx * 0.555, 1.12, 0, { cast: false });
      });
      // asas
      [-0.42, 0.42].forEach(hx => {
        addPart(g, officeBox(0.03, 0.4, 0.03), OFFICE_MAT.chrome, hx, 1.2, 0.53);
      });
      scene.add(g);
      return g;
    }

    function buildSofa(x, z, rotY, mat, w = 2.6) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = rotY;
      const d = 0.95;
      addCollider(x, z, w, d, rotY);
      // patas
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
        addPart(g, cachedGeo('Cylinder', 0.025, 0.018, 0.1, 10), OFFICE_MAT.walnut, sx * (w / 2 - 0.1), 0.05, sz * (d / 2 - 0.1));
      });
      addPart(g, officeBox(w, 0.18, d), mat, 0, 0.19, 0);
      // cojines del asiento separados
      const cushionW = (w - 0.36) / 2;
      [-1, 1].forEach(sx => {
        addPart(g, officeBox(cushionW - 0.02, 0.16, d - 0.24), mat, sx * (cushionW / 2 + 0.005), 0.36, 0.06);
      });
      // respaldo + cojines traseros inclinados
      addPart(g, officeBox(w, 0.52, 0.18), mat, 0, 0.5, -d / 2 + 0.09);
      [-1, 1].forEach(sx => {
        const bc = addPart(g, officeBox(cushionW - 0.04, 0.38, 0.14), mat, sx * (cushionW / 2 + 0.005), 0.6, -d / 2 + 0.24);
        bc.rotation.x = -0.18;
      });
      // brazos
      [-1, 1].forEach(sx => {
        addPart(g, officeBox(0.18, 0.5, d), mat, sx * (w / 2 - 0.09), 0.37, 0);
      });
      scene.add(g);
      return g;
    }

    function buildBarStool(x, z) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      addPart(g, cachedGeo('Cylinder', 0.2, 0.22, 0.03, 24), OFFICE_MAT.chrome, 0, 0.015, 0);
      addPart(g, cachedGeo('Cylinder', 0.028, 0.028, 0.66, 12), OFFICE_MAT.chrome, 0, 0.35, 0);
      const ring = addPart(g, cachedGeo('Torus', 0.16, 0.012, 8, 24), OFFICE_MAT.chrome, 0, 0.3, 0);
      ring.rotation.x = Math.PI / 2;
      addPart(g, cachedGeo('Cylinder', 0.19, 0.17, 0.08, 24), OFFICE_MAT.blackLeather, 0, 0.7, 0);
      scene.add(g);
      return g;
    }

    function buildPendantLamp(x, y, z) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      addPart(g, cachedGeo('Cylinder', 0.006, 0.006, 3.6 - y, 6), OFFICE_MAT.bezel, 0, y + (3.6 - y) / 2, 0, { cast: false });
      const shade = new THREE.Mesh(cachedGeo('Cone', 0.2, 0.22, 24, 1, true), cachedMat('copperDouble', () => {
        const mm = OFFICE_MAT.copper.clone();
        mm.side = THREE.DoubleSide;
        return mm;
      }));
      shade.position.set(0, y, 0);
      g.add(shade);
      addPart(g, cachedGeo('Sphere', 0.06, 14, 10), OFFICE_MAT.bulb, 0, y - 0.08, 0, { cast: false });
      scene.add(g);
      return g;
    }
