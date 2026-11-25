    // _____________________________________________________________________
    // PERSONAJES: cuerpo articulado (rodillas y codos), peinados, ropa por cargo,
    // rostro con parpadeo, insignia de rango, sombra de contacto y poses (caminar,
    // sentarse, escribir, comer, correr, jugar…)
    // _____________________________________________________________________
    const AVATAR_SKIN_TONES = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac, 0xd9a066, 0xb07a4f];
    const AVATAR_HAIR_COLORS = [0x1c1917, 0x3f2a1d, 0x6b4423, 0x111827, 0x8a5a14, 0x2b2522, 0xb7a17a, 0x7c2d12];
    const AVATAR_IRIS_COLORS = [0x3b2a1a, 0x1f3b57, 0x2f4f2f, 0x4a3426];
    const HAIR_STYLES = ['short', 'long', 'ponytail', 'bun', 'curly', 'side', 'buzz'];

    function avatarColor(hex) {
      return new THREE.Color(hex).convertSRGBToLinear();
    }

    // Torso con silueta suave (torno): cintura, pecho y hombros redondeados
    let _torsoGeo = null;
    function torsoGeometry() {
      if (_torsoGeo) return _torsoGeo;
      const prof = [[0.165, 0.0], [0.175, 0.06], [0.19, 0.16], [0.205, 0.28], [0.215, 0.38], [0.21, 0.44], [0.185, 0.49], [0.13, 0.53], [0.075, 0.55], [0.001, 0.556]];
      _torsoGeo = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 22);
      _torsoGeo.computeBoundingSphere();
      return _torsoGeo;
    }

    let _blobMat = null;
    function blobShadowMaterial() {
      if (_blobMat) return _blobMat;
      const tex = makeOfficeTexture('blob_shadow', 128, 128, (c, w, h) => {
        const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, 'rgba(0,0,0,0.55)');
        g.addColorStop(0.55, 'rgba(0,0,0,0.25)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
      }, { clamp: true });
      _blobMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.85 });
      return _blobMat;
    }

    function outfitStyle(agent) {
      if (agent.type === 'HUMAN') return 'suit';
      if (agent.type === 'CANDIDATE') return 'casual';
      const hz = agent.homeZone || '';
      if (hz === 'cocina') return 'chef';
      if (hz === 'limpieza') return 'cleaning';
      if (hz === 'reception' || /_recepcion$/.test(hz)) return 'scarf';
      return 'blazer';
    }

    function buildAllAgentAvatars() {
      AGENTS.forEach(agent => buildAgentAvatar(agent));
    }

    function buildAgentAvatar(agent) {
      const seed = officeHash(agent.id);
      const rand = officeRandom(seed);
      const style = outfitStyle(agent);
      const isHuman = agent.type === 'HUMAN';
      const isAI = !isHuman;
      const fabricMap = OFFICE_TEX.fabric_c;
      const fabricBump = OFFICE_TEX.fabric_b;

      // --- materiales ---
      const shirtMat = cachedMat('avatarShirt', () => new THREE.MeshStandardMaterial({ color: avatarColor(0xf1f5f9), roughness: 0.7 }));
      const whiteMat = cachedMat('avatarWhite', () => new THREE.MeshStandardMaterial({ color: avatarColor(0xf8fafc), roughness: 0.75, map: fabricMap ? officeTexRepeat(fabricMap, 3, 3) : null }));
      const shoeMat = cachedMat('avatarShoe', () => new THREE.MeshStandardMaterial({ color: avatarColor(0x1c1410), roughness: 0.32, metalness: 0.1, envMapIntensity: 0.8 }));
      const soleMat = cachedMat('avatarSole', () => new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.8 }));
      const darkMat = cachedMat('avatarDark', () => new THREE.MeshStandardMaterial({ color: 0x0f0f12, roughness: 0.3 }));
      const mouthMat = cachedMat('avatarMouth', () => new THREE.MeshStandardMaterial({ color: avatarColor(0x9f3d3d), roughness: 0.5 }));
      const eyeWhiteMat = cachedMat('avatarEyeWhite', () => new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 }));
      const irisHex = AVATAR_IRIS_COLORS[(seed >> 5) % AVATAR_IRIS_COLORS.length];
      const irisMat = cachedMat('avatarIris|' + irisHex, () => new THREE.MeshStandardMaterial({ color: avatarColor(irisHex), roughness: 0.2 }));

      let jacketHex = agent.outfitColor, pantsHex = null;
      if (style === 'chef') { jacketHex = 0xf8fafc; pantsHex = 0x1f2937; }
      if (style === 'cleaning') { jacketHex = 0x0f766e; pantsHex = 0x1e293b; }
      if (style === 'casual') { pantsHex = 0x1e3a5f; }
      const outfitMat = new THREE.MeshStandardMaterial({
        color: avatarColor(jacketHex),
        map: fabricMap ? officeTexRepeat(fabricMap, 2, 2) : null,
        bumpMap: fabricBump ? officeTexRepeat(fabricBump, 3, 3) : null,
        bumpScale: 0.003, roughness: style === 'chef' ? 0.75 : 0.82, metalness: 0.0, envMapIntensity: 0.4
      });
      const lapelMat = new THREE.MeshStandardMaterial({ color: avatarColor(jacketHex).lerp(avatarColor(0x000000), 0.18), roughness: 0.55 });
      const pantsMat = new THREE.MeshStandardMaterial({
        color: pantsHex !== null ? avatarColor(pantsHex) : avatarColor(jacketHex).lerp(avatarColor(0x111318), 0.55),
        map: fabricMap ? officeTexRepeat(fabricMap, 2, 2) : null, roughness: 0.85, metalness: 0.0
      });
      const accentMat = new THREE.MeshStandardMaterial({ color: avatarColor(agent.color), roughness: 0.35, metalness: 0.25 });
      const skinHex = AVATAR_SKIN_TONES[seed % AVATAR_SKIN_TONES.length];
      const skinMat = cachedMat('avatarSkin|' + skinHex, () => new THREE.MeshStandardMaterial({ color: avatarColor(skinHex), roughness: 0.58, metalness: 0.0, envMapIntensity: 0.35 }));
      const hairHex = AVATAR_HAIR_COLORS[(seed >> 3) % AVATAR_HAIR_COLORS.length];
      const hairMat = cachedMat('avatarHair|' + hairHex, () => new THREE.MeshStandardMaterial({ color: avatarColor(hairHex), roughness: 0.5, metalness: 0.05 }));

      const add = (parent, geo, mat, x, y, z, opts = {}) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        if (opts.scale) m.scale.set(opts.scale[0], opts.scale[1], opts.scale[2]);
        if (opts.rot) m.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
        m.castShadow = !!opts.cast;
        parent.add(m);
        return m;
      };

      const root = new THREE.Group();
      root.position.set(agent.pos.x, 0, agent.pos.z);
      const pivot = new THREE.Group();
      pivot.userData.agentId = agent.id;
      root.add(pivot);

      // sombra de contacto (funciona aunque las sombras reales estén apagadas)
      const blob = new THREE.Mesh(cachedGeo('Plane', 0.95, 0.95), blobShadowMaterial());
      blob.rotation.x = -Math.PI / 2;
      blob.position.y = 0.012;
      blob.renderOrder = 1;
      root.add(blob);

      // --- piernas: cadera -> rodilla -> pie ---
      const makeLeg = (sx) => {
        const thigh = new THREE.Group();
        thigh.position.set(sx * 0.095, 0.58, 0);
        add(thigh, cachedGeo('Cylinder', 0.078, 0.066, 0.28, 12), pantsMat, 0, -0.14, 0, { cast: true });
        const knee = new THREE.Group();
        knee.position.set(0, -0.28, 0);
        thigh.add(knee);
        add(knee, cachedGeo('Sphere', 0.066, 10, 8), pantsMat, 0, 0, 0);
        add(knee, cachedGeo('Cylinder', 0.064, 0.054, 0.25, 12), pantsMat, 0, -0.125, 0, { cast: true });
        add(knee, cachedGeo('Box', 0.11, 0.07, 0.24), shoeMat, 0, -0.265, 0.04);
        add(knee, cachedGeo('Sphere', 0.056, 10, 8), shoeMat, 0, -0.262, 0.15, { scale: [1, 0.6, 0.8] });
        add(knee, cachedGeo('Box', 0.115, 0.018, 0.26), soleMat, 0, -0.3, 0.045);
        pivot.add(thigh);
        return { thigh, knee };
      };
      const legL = makeLeg(-1), legR = makeLeg(1);

      // --- cadera y torso ---
      add(pivot, cachedGeo('Cylinder', 0.17, 0.16, 0.14, 18), pantsMat, 0, 0.62, 0, { scale: [1, 1, 0.7], cast: true });
      add(pivot, cachedGeo('Cylinder', 0.172, 0.172, 0.035, 18), style === 'chef' ? whiteMat : darkMat, 0, 0.675, 0, { scale: [1, 1, 0.71] });
      if (style !== 'chef') add(pivot, cachedGeo('Box', 0.05, 0.03, 0.01), OFFICE_MAT.chrome, 0, 0.675, 0.124);
      const torso = add(pivot, torsoGeometry(), outfitMat, 0, 0.66, 0, { scale: [1, 1, 0.62], cast: true });
      torso.userData.agentId = agent.id;

      const chestZ = 0.131;
      if (style === 'blazer' || style === 'suit' || style === 'scarf') {
        add(pivot, cachedGeo('Box', 0.1, 0.22, 0.02), shirtMat, 0, 1.06, chestZ - 0.003);
        [-1, 1].forEach(sx => {
          add(pivot, cachedGeo('Box', 0.05, 0.27, 0.018), lapelMat, sx * 0.07, 1.03, chestZ + 0.004, { rot: [0, 0, -sx * 0.3] });
          add(pivot, cachedGeo('Box', 0.07, 0.05, 0.02), shirtMat, sx * 0.04, 1.18, chestZ - 0.03, { rot: [-0.35, 0, sx * -0.5] });
        });
        [0.84, 0.92].forEach(by => add(pivot, cachedGeo('Sphere', 0.012, 8, 6), darkMat, 0, by, 0.12));
        if (style === 'suit') add(pivot, cachedGeo('Box', 0.04, 0.2, 0.012), accentMat, 0, 1.04, chestZ + 0.01);
        if (style === 'scarf') add(pivot, cachedGeo('Torus', 0.075, 0.025, 8, 18), accentMat, 0, 1.2, 0.0, { rot: [Math.PI / 2, 0, 0] });
      } else if (style === 'chef') {
        [-1, 1].forEach(sx => [0.86, 0.96, 1.06].forEach(by => add(pivot, cachedGeo('Sphere', 0.014, 8, 6), darkMat, sx * 0.055, by, 0.127)));
        add(pivot, cachedGeo('Torus', 0.07, 0.022, 8, 18), cachedMat('chefScarf', () => new THREE.MeshStandardMaterial({ color: avatarColor(0xdc2626), roughness: 0.6 })), 0, 1.2, 0.0, { rot: [Math.PI / 2, 0, 0] });
      } else if (style === 'cleaning') {
        const apron = cachedMat('apron', () => new THREE.MeshStandardMaterial({ color: avatarColor(0x134e4a), roughness: 0.8 }));
        add(pivot, cachedGeo('Box', 0.3, 0.46, 0.02), apron, 0, 0.84, chestZ + 0.006);
        add(pivot, cachedGeo('Box', 0.12, 0.08, 0.008), whiteMat, 0, 0.9, chestZ + 0.018);
      } else if (style === 'casual') {
        add(pivot, cachedGeo('Torus', 0.068, 0.018, 8, 18), lapelMat, 0, 1.2, 0, { rot: [Math.PI / 2, 0, 0] });
        const bag = cachedMat('backpack', () => new THREE.MeshStandardMaterial({ color: avatarColor(0x334155), roughness: 0.8 }));
        add(pivot, cachedGeo('Box', 0.26, 0.33, 0.12), bag, 0, 0.98, -0.175, { cast: true });
        [-1, 1].forEach(sx => add(pivot, cachedGeo('Box', 0.03, 0.34, 0.02), bag, sx * 0.09, 1.0, 0.125));
      }
      // identificador con el color del agente
      if (style !== 'casual') {
        add(pivot, cachedGeo('Box', 0.07, 0.095, 0.012), accentMat, 0.12, 0.94, chestZ);
        add(pivot, cachedGeo('Box', 0.05, 0.03, 0.004), shirtMat, 0.12, 0.95, chestZ + 0.008);
      }

      // --- insignia de rango: charreteras + pin (un solo material intercambiable) ---
      const rankGroup = new THREE.Group();
      const rankMat = rankMaterial(agent.rankIdx || 0, isHuman);
      [-1, 1].forEach(sx => add(rankGroup, cachedGeo('Box', 0.09, 0.022, 0.12), rankMat, sx * 0.17, 1.2, 0, { scale: [1, 1, 0.8] }));
      add(rankGroup, cachedGeo('Cylinder', 0.022, 0.022, 0.012, 14), rankMat, -0.11, 1.03, chestZ + 0.006, { rot: [Math.PI / 2, 0, 0] });
      rankGroup.visible = agent.type !== 'CANDIDATE';
      pivot.add(rankGroup);

      // --- brazos: hombro -> codo -> mano ---
      const sleeveMat = style === 'cleaning' ? outfitMat : outfitMat;
      const makeArm = (sx) => {
        const arm = new THREE.Group();
        arm.position.set(sx * 0.255, 1.13, 0);
        arm.rotation.z = sx * 0.07;
        add(arm, cachedGeo('Sphere', 0.062, 12, 10), sleeveMat, 0, 0, 0);
        add(arm, cachedGeo('Cylinder', 0.056, 0.049, 0.25, 10), sleeveMat, 0, -0.125, 0, { cast: true });
        const elbow = new THREE.Group();
        elbow.position.set(0, -0.25, 0);
        arm.add(elbow);
        add(elbow, cachedGeo('Sphere', 0.05, 10, 8), sleeveMat, 0, 0, 0);
        add(elbow, cachedGeo('Cylinder', 0.048, 0.041, 0.21, 10), sleeveMat, 0, -0.105, 0);
        add(elbow, cachedGeo('Cylinder', 0.044, 0.044, 0.03, 10), style === 'chef' ? whiteMat : shirtMat, 0, -0.21, 0);
        add(elbow, cachedGeo('Sphere', 0.045, 12, 10), skinMat, 0, -0.25, 0.005, { scale: [0.85, 1.15, 0.75] });
        pivot.add(arm);
        return { arm, elbow };
      };
      const armL = makeArm(-1), armR = makeArm(1);
      const coffeeCup = buildCup(armR.elbow, 0, -0.29, 0.06, { scale: 1.05, accent: agent.color });
      coffeeCup.visible = false;

      // --- cuello y cabeza ---
      add(pivot, cachedGeo('Cylinder', 0.052, 0.058, 0.1, 12), skinMat, 0, 1.235, 0);
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.38, 0);
      pivot.add(headGroup);
      const head = add(headGroup, cachedGeo('Sphere', 0.175, 28, 22), skinMat, 0, 0, 0, { scale: [0.94, 1.06, 1.0], cast: true });
      head.userData.agentId = agent.id;
      add(headGroup, cachedGeo('Sphere', 0.12, 16, 12), skinMat, 0, -0.07, 0.03, { scale: [1, 0.8, 1] }); // mandíbula
      [-1, 1].forEach(sx => add(headGroup, cachedGeo('Sphere', 0.038, 10, 8), skinMat, sx * 0.165, -0.01, 0, { scale: [0.5, 1, 0.8] }));
      add(headGroup, cachedGeo('Sphere', 0.024, 10, 8), skinMat, 0, -0.025, 0.172, { scale: [0.8, 1, 0.9] });
      add(headGroup, cachedGeo('Torus', 0.026, 0.006, 6, 12, Math.PI), mouthMat, 0, -0.07, 0.158, { rot: [0, 0, Math.PI] });

      // ojos (grupo propio para parpadear)
      const eyes = new THREE.Group();
      eyes.position.set(0, 0.022, 0.15);
      headGroup.add(eyes);
      [-1, 1].forEach(sx => {
        add(eyes, cachedGeo('Sphere', 0.025, 12, 10), eyeWhiteMat, sx * 0.06, 0, 0, { scale: [1, 0.85, 0.5] });
        add(eyes, cachedGeo('Sphere', 0.014, 10, 8), irisMat, sx * 0.06, 0, 0.011);
        add(eyes, cachedGeo('Sphere', 0.006, 6, 4), darkMat, sx * 0.06, 0, 0.0185);
      });
      [-1, 1].forEach(sx => add(headGroup, cachedGeo('Box', 0.058, 0.012, 0.012), hairMat, sx * 0.062, 0.068, 0.162, { rot: [0, 0, sx * -0.12] }));

      // peinado
      const hairStyle = HAIR_STYLES[(seed >> 7) % HAIR_STYLES.length];
      const hasHat = style === 'chef' || style === 'cleaning';
      const capGeo = cachedGeo('Sphere', 0.185, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
      add(headGroup, capGeo, hairMat, 0, 0.02, -0.012, { scale: [0.97, hairStyle === 'buzz' ? 0.98 : 1.06, 1.03], rot: [-0.32, 0, 0], cast: true });
      if (!hasHat) {
        if (hairStyle === 'long') {
          add(headGroup, cachedGeo('Cylinder', 0.165, 0.13, 0.34, 16), hairMat, 0, -0.13, -0.075, { scale: [1, 1, 0.62] });
        } else if (hairStyle === 'ponytail') {
          add(headGroup, cachedGeo('Sphere', 0.065, 12, 10), hairMat, 0, 0.05, -0.19);
          add(headGroup, cachedGeo('Cylinder', 0.042, 0.018, 0.24, 10), hairMat, 0, -0.08, -0.22, { rot: [0.32, 0, 0] });
        } else if (hairStyle === 'bun') {
          add(headGroup, cachedGeo('Sphere', 0.075, 12, 10), hairMat, 0, 0.17, -0.09);
        } else if (hairStyle === 'curly') {
          for (let i = 0; i < 9; i++) {
            const a = (i / 9) * Math.PI * 2;
            add(headGroup, cachedGeo('Sphere', 0.058, 10, 8), hairMat, Math.sin(a) * 0.13, 0.1 + Math.cos(a * 2) * 0.02, Math.cos(a) * 0.12 - 0.02);
          }
        } else if (hairStyle === 'side') {
          add(headGroup, cachedGeo('Box', 0.2, 0.05, 0.08), hairMat, 0.035, 0.12, 0.12, { rot: [0.3, 0, -0.32] });
        }
      }
      if (style === 'chef') {
        add(headGroup, cachedGeo('Cylinder', 0.16, 0.165, 0.15, 18), whiteMat, 0, 0.19, -0.01);
        add(headGroup, cachedGeo('Sphere', 0.18, 16, 10), whiteMat, 0, 0.3, -0.01, { scale: [1, 0.62, 1], cast: true });
      } else if (style === 'cleaning') {
        add(headGroup, cachedGeo('Sphere', 0.19, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), outfitMat, 0, 0.04, -0.01, { scale: [1, 0.85, 1] });
        add(headGroup, cachedGeo('Box', 0.18, 0.015, 0.11), outfitMat, 0, 0.06, 0.17, { rot: [0.15, 0, 0] });
      }

      // accesorios: auricular luminoso (IA) o gafas (Directores)
      if (isAI) {
        add(headGroup, cachedGeo('Torus', 0.2, 0.011, 8, 28, Math.PI), accentMat, 0, 0.02, 0);
        const glowMat = cachedMat('avatarGlow|' + agent.color, () => new THREE.MeshStandardMaterial({ color: avatarColor(agent.color), emissive: avatarColor(agent.color), emissiveIntensity: 0.9, roughness: 0.3 }));
        [-1, 1].forEach(sx => add(headGroup, cachedGeo('Cylinder', 0.046, 0.046, 0.032, 16), glowMat, sx * 0.185, 0.0, 0, { rot: [0, 0, Math.PI / 2] }));
        add(headGroup, cachedGeo('Cylinder', 0.006, 0.006, 0.15, 6), darkMat, -0.19, -0.06, 0.075, { rot: [Math.PI / 2 - 0.35, 0, 0] });
      } else {
        [-1, 1].forEach(sx => add(headGroup, cachedGeo('Torus', 0.03, 0.005, 6, 16), accentMat, sx * 0.06, 0.022, 0.175));
        add(headGroup, cachedGeo('Box', 0.04, 0.005, 0.005), accentMat, 0, 0.026, 0.178);
      }

      // --- fusión por material de cada parte rígida (muchas menos draw calls) ---
      [pivot, headGroup, eyes, rankGroup, legL.thigh, legL.knee, legR.thigh, legR.knee, armL.arm, armL.elbow, armR.arm, armR.elbow].forEach(g => mergeMeshChildren(g, true));
      const rankMesh = rankGroup.children.find(c => c.isMesh) || null;

      // las piezas sin animación no recalculan su matriz cada cuadro
      const animated = new Set([root, pivot, legL.thigh, legL.knee, legR.thigh, legR.knee, armL.arm, armL.elbow, armR.arm, armR.elbow, coffeeCup, headGroup, eyes]);
      root.traverse(obj => {
        if (animated.has(obj)) return;
        obj.updateMatrix();
        obj.matrixAutoUpdate = false;
      });

      scene.add(root);
      agentMeshes[agent.id] = {
        root, pivot, headGroup, eyes, coffeeCup, rankMesh, style,
        thighL: legL.thigh, kneeL: legL.knee, thighR: legR.thigh, kneeR: legR.knee,
        armL: armL.arm, elbowL: armL.elbow, armR: armR.arm, elbowR: armR.elbow,
        sit: 0, phase: rand() * 10, nextBlink: rand() * 4, blinkUntil: 0
      };
      return agentMeshes[agent.id];
    }

    // Vuelve a construir el avatar (p. ej. un candidato contratado se pone el uniforme de su cargo)
    function rebuildAgentAvatar(agent) {
      const m = agentMeshes[agent.id];
      if (m) {
        scene.remove(m.root);
        disposeAvatar(m);
        delete agentMeshes[agent.id];
      }
      buildAgentAvatar(agent);
    }

    function disposeAvatar(m) {
      const shared = new Set([...MAT_CACHE.values(), ...Object.values(OFFICE_MAT)]);
      m.root.traverse(obj => {
        if (obj.userData.ownGeo && obj.geometry) obj.geometry.dispose();
        if (obj.material && !shared.has(obj.material) && obj.material !== _blobMat && obj.material !== _vcMat) obj.material.dispose();
      });
    }

    function refreshAvatarRank(agent) {
      const m = agentMeshes[agent.id];
      if (!m) return;
      if (m.style !== outfitStyle(agent)) { rebuildAgentAvatar(agent); return; }
      if (m.rankMesh) {
        m.rankMesh.material = rankMaterial(agent.rankIdx || 0, agent.type === 'HUMAN');
        m.rankMesh.parent.visible = agent.type !== 'CANDIDATE';
      }
    }

    // ---- Animación por cuadro ----
    function approachRot(obj, target, blend) {
      obj.rotation.x += (target - obj.rotation.x) * blend;
    }

    const WORK_KINDS = new Set(['games', 'apps', 'software', 'help_desk', 'qa_lab', 'director_hub', 'reception', 'formacion', 'trabajo', 'recepcion']);

    function animateAvatar(agent, m, dt, k, time, moving, pending) {
      const blend = Math.min(1, dt * 10);
      const arrived = !moving && !pending && isAgentArrived(agent);
      const target = agent.targetPos;
      const wantSit = arrived && target && target.seat ? 1 : 0;
      m.sit += (wantSit - m.sit) * Math.min(1, dt * 6);
      const s = m.sit;
      const kind = zoneKind(agent.currentZone);
      const onBreak = agent.status === 'break';

      let thighL = 0, thighR = 0, kneeL = 0.06, kneeR = 0.06;
      let armL = 0, armR = 0, elbowL = -0.12, elbowR = -0.12;
      let bob = Math.sin(time * 2.4 + m.phase) * 0.006; // respiración
      let headTurn = Math.sin(time * 0.5 + m.phase) * 0.22;

      if (moving) {
        agent.walkPhase += dt * 9.5;
        const ph = agent.walkPhase, sw = Math.sin(ph);
        thighL = sw * 0.55; thighR = -sw * 0.55;
        kneeL = 0.1 + 0.75 * Math.max(0, Math.sin(ph - 0.6));
        kneeR = 0.1 + 0.75 * Math.max(0, Math.sin(ph + Math.PI - 0.6));
        armL = -sw * 0.5; armR = sw * 0.5;
        elbowL = elbowR = -0.32;
        bob = Math.abs(Math.cos(ph)) * 0.035;
        headTurn = 0;
      } else if (s > 0.02) {
        // sentado: muslos horizontales y piernas colgando
        thighL = thighR = -1.45 * s;
        kneeL = kneeR = 1.42 * s;
        bob = -0.06 * s + Math.sin(time * 2.4 + m.phase) * 0.004;
        if (onBreak && kind === 'comedor') {
          const c = (time * 0.9 + m.phase) % 3;
          const lift = c < 0.8 ? Math.sin((c / 0.8) * Math.PI) : 0; // lleva el tenedor a la boca
          armR = -0.75 - lift * 0.55; elbowR = -1.1 - lift * 0.9;
          armL = -0.45; elbowL = -0.9;
        } else if (agent.status === 'meeting') {
          armL = armR = -0.42; elbowL = elbowR = -0.85;
          headTurn *= 0.4;
        } else if ((agent.status === 'working' || agent.status === 'onboarding') && WORK_KINDS.has(kind)) {
          const t = time * 9 + m.phase;
          armL = -0.58 + Math.sin(t) * 0.04; armR = -0.58 + Math.sin(t + 1.7) * 0.04; // escribiendo
          elbowL = -0.95 + Math.sin(t * 1.3) * 0.06; elbowR = -0.95 + Math.sin(t * 1.3 + 2) * 0.06;
          headTurn *= 0.3;
        } else {
          armL = armR = -0.25; elbowL = elbowR = -0.65; // manos sobre las rodillas
        }
        thighL += 0; // (valores ya asignados)
      } else if (arrived && onBreak && kind === 'gimnasio') {
        // corriendo en la cinta / pedaleando
        agent.walkPhase += dt * 13;
        const ph = agent.walkPhase, sw = Math.sin(ph);
        thighL = sw * 0.7; thighR = -sw * 0.7;
        kneeL = 0.3 + 0.9 * Math.max(0, Math.sin(ph - 0.6));
        kneeR = 0.3 + 0.9 * Math.max(0, Math.sin(ph + Math.PI - 0.6));
        armL = -sw * 0.7; armR = sw * 0.7; elbowL = elbowR = -1.2;
        bob = Math.abs(Math.cos(ph)) * 0.05;
        headTurn = 0;
      } else if (arrived && onBreak && kind === 'recreativa') {
        armR = -0.9 + Math.sin(time * 6 + m.phase) * 0.5; elbowR = -0.6; // jugando
        armL = -0.3; elbowL = -0.5;
        headTurn = Math.sin(time * 3 + m.phase) * 0.35;
      } else if (arrived && onBreak && (kind === 'cafe' || kind === 'lounge' || kind === 'descanso')) {
        const c = (time * 0.7 + m.phase) % 4;
        const sip = c < 0.9 ? Math.sin((c / 0.9) * Math.PI) : 0;
        armR = -0.55 - sip * 0.55; elbowR = -0.9 - sip * 0.7; // taza de café
      } else if (arrived && agent.status === 'working' && agent.homeZone === 'limpieza' && agent.currentZone !== 'limpieza') {
        const t = Math.sin(time * 4 + m.phase);
        armL = armR = -0.6 + t * 0.3; elbowL = elbowR = -0.4; // barriendo
      } else if (arrived && agent.status === 'working' && agent.homeZone === 'cocina') {
        armR = -0.75; elbowR = -0.95 + Math.sin(time * 5 + m.phase) * 0.3; // removiendo la olla
        armL = -0.45; elbowL = -0.8;
      } else if (agent.status === 'waiting_human') {
        armL = armR = 0.08; elbowL = elbowR = -0.5; // brazos cruzados esperando
      }

      approachRot(m.thighL, thighL, moving ? 1 : blend);
      approachRot(m.thighR, thighR, moving ? 1 : blend);
      approachRot(m.kneeL, kneeL, moving ? 1 : blend);
      approachRot(m.kneeR, kneeR, moving ? 1 : blend);
      approachRot(m.armL, armL, moving ? 1 : blend);
      approachRot(m.armR, armR, moving ? 1 : blend);
      approachRot(m.elbowL, elbowL, blend);
      approachRot(m.elbowR, elbowR, blend);
      m.pivot.position.y += (bob - m.pivot.position.y) * Math.min(1, dt * 14);
      m.headGroup.rotation.y += (headTurn - m.headGroup.rotation.y) * Math.min(1, dt * 3);

      // parpadeo
      if (time > m.nextBlink) {
        m.blinkUntil = time + 0.12;
        m.nextBlink = time + 2.2 + Math.random() * 3.8;
      }
      m.eyes.scale.y = time < m.blinkUntil ? 0.12 : 1;

      m.coffeeCup.visible = onBreak && s < 0.5 && (kind === 'cafe' || kind === 'lounge' || kind === 'descanso');
    }
