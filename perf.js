    // _____________________________________________________________________
    // RENDIMIENTO: fusión de mallas estáticas + FPS + calidad adaptativa
    // _____________________________________________________________________
    // El estudio tiene miles de piezas (paredes, muebles, plantas…). Dibujar cada una por separado
    // cuesta una "draw call". Aquí se agrupan por material en unas pocas mallas grandes: el aspecto
    // es idéntico, pero el navegador trabaja muchísimo menos.

    const _mergeV = new THREE.Vector3();
    const _mergeN = new THREE.Matrix3();

    // items: [{ geo, matrix }] -> una BufferGeometry con posiciones/normales ya transformadas
    function mergeGeometryItems(items) {
      let vCount = 0, iCount = 0;
      for (const it of items) {
        const p = it.geo.attributes.position;
        vCount += p.count;
        iCount += it.geo.index ? it.geo.index.count : p.count;
      }
      const pos = new Float32Array(vCount * 3);
      const nor = new Float32Array(vCount * 3);
      const uv = new Float32Array(vCount * 2);
      const withColor = items.some(it => it.color);
      const col = withColor ? new Float32Array(vCount * 3) : null;
      const idx = vCount > 65535 ? new Uint32Array(iCount) : new Uint16Array(iCount);
      let vo = 0, io = 0;
      for (const it of items) {
        const g = it.geo, m = it.matrix;
        const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
        _mergeN.getNormalMatrix(m);
        for (let i = 0; i < p.count; i++) {
          const o3 = (vo + i) * 3;
          _mergeV.fromBufferAttribute(p, i).applyMatrix4(m);
          pos[o3] = _mergeV.x; pos[o3 + 1] = _mergeV.y; pos[o3 + 2] = _mergeV.z;
          if (n) {
            _mergeV.fromBufferAttribute(n, i).applyMatrix3(_mergeN).normalize();
            nor[o3] = _mergeV.x; nor[o3 + 1] = _mergeV.y; nor[o3 + 2] = _mergeV.z;
          }
          if (u) {
            uv[(vo + i) * 2] = u.getX(i);
            uv[(vo + i) * 2 + 1] = u.getY(i);
          }
          if (col && it.color) {
            col[o3] = it.color.r; col[o3 + 1] = it.color.g; col[o3 + 2] = it.color.b;
          }
        }
        if (g.index) {
          const ia = g.index.array;
          for (let j = 0; j < ia.length; j++) idx[io++] = ia[j] + vo;
        } else {
          for (let j = 0; j < p.count; j++) idx[io++] = vo + j;
        }
        vo += p.count;
      }
      const out = new THREE.BufferGeometry();
      out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      if (col) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
      out.setIndex(new THREE.BufferAttribute(idx, 1));
      out.computeBoundingSphere();
      return out;
    }

    function isMergeableMesh(obj) {
      if (!obj.isMesh || obj.isSkinnedMesh || obj.isInstancedMesh || !obj.visible) return false;
      const mat = obj.material, geo = obj.geometry;
      if (!mat || Array.isArray(mat) || mat.isShaderMaterial) return false;
      if (!geo || !geo.isBufferGeometry || !geo.attributes.position || !geo.attributes.normal) return false;
      if (obj.renderOrder !== 0 || obj.frustumCulled === false) return false;
      if (obj.userData.zoneId || obj.userData.noMerge) return false;
      return obj.matrixWorld.determinant() > 0;
    }

    // Fusiona todas las mallas estáticas bajo `root` (sin entrar en `exclude` ni en otras raíces fusionables)
    function mergeStaticRoot(root, exclude) {
      root.updateMatrixWorld(true);
      const groups = new Map();
      const visit = (obj) => {
        if (exclude.has(obj)) return;
        if (obj !== root && obj.userData.mergeRoot) return; // las oficinas vecinas se fusionan aparte
        if (!obj.visible) return;
        if (isMergeableMesh(obj)) {
          const key = obj.material.uuid + '|' + obj.castShadow + '|' + obj.receiveShadow;
          let list = groups.get(key);
          if (!list) groups.set(key, list = []);
          list.push(obj);
        }
        for (let i = 0; i < obj.children.length; i++) visit(obj.children[i]);
      };
      visit(root);

      let before = 0, after = 0;
      groups.forEach(list => {
        before += list.length;
        if (list.length < 2) { after += list.length; return; }
        const geo = mergeGeometryItems(list.map(o => ({ geo: o.geometry, matrix: o.matrixWorld })));
        const merged = new THREE.Mesh(geo, list[0].material);
        merged.castShadow = list[0].castShadow;
        merged.receiveShadow = list[0].receiveShadow;
        merged.userData.merged = true;
        merged.userData.ownGeo = true;
        // la geometría ya está en coordenadas de mundo: se compensa la transformación de la raíz
        merged.matrix.copy(root.matrixWorld).invert();
        merged.matrix.decompose(merged.position, merged.quaternion, merged.scale);
        merged.matrixAutoUpdate = false;
        merged.updateMatrix();
        root.add(merged);
        list.forEach(o => o.parent && o.parent.remove(o));
        after += 1;
      });

      // quita los grupos que quedaron vacíos (no toca luces ni sus objetivos)
      const prune = (obj) => {
        for (let i = obj.children.length - 1; i >= 0; i--) {
          const ch = obj.children[i];
          if (exclude.has(ch)) continue;
          prune(ch);
          if (ch.type === 'Group' && ch.children.length === 0 && !ch.userData.mergeRoot) obj.remove(ch);
        }
      };
      prune(root);
      return { before, after };
    }

    function optimizeStaticScene() {
      const exclude = new Set([...steamParticles.map(sp => sp.mesh), ...DOOR_LEAVES, ...NATURE_ANIMATED]);
      const r = mergeStaticRoot(scene, exclude);
      mergeDoorLeaves();
      PERF.mergedFrom = r.before;
      PERF.mergedTo = r.after;
      console.info(`FRPROGRAMITY: ${r.before} mallas estáticas fusionadas en ${r.after}.`);
    }

    // Las hojas de las puertas se mueven enteras: se fusionan sus piezas en su propio espacio
    function mergeDoorLeaves() {
      DOOR_LEAVES.forEach(leaf => { if (!leaf.userData.leafMerged) { mergeMeshChildren(leaf, true); leaf.userData.leafMerged = true; } });
    }

    // Material único con color por vértice: todas las piezas opacas de una parte del cuerpo
    // se dibujan de una sola vez (el color de cada pieza queda guardado en sus vértices)
    let _vcMat = null;
    function vertexColorMaterial() {
      if (_vcMat) return _vcMat;
      _vcMat = new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 0.62, metalness: 0.04, envMapIntensity: 0.45,
        bumpMap: OFFICE_TEX.fabric_b ? officeTexRepeat(OFFICE_TEX.fabric_b, 3, 3) : null, bumpScale: 0.0015
      });
      return _vcMat;
    }

    function canBakeColor(mat) {
      if (!mat || !mat.isMeshStandardMaterial || mat.transparent) return false;
      if (mat.emissive && mat.emissiveIntensity > 0 && mat.emissive.getHex() !== 0) return false;
      return true;
    }

    // Fusiona las mallas hijas directas de un grupo (en su espacio local).
    // vertexColors = true: además junta materiales lisos distintos en uno solo.
    function mergeMeshChildren(group, vertexColors = false) {
      const byMat = new Map();
      group.children.slice().forEach(ch => {
        if (!ch.isMesh || Array.isArray(ch.material) || !ch.geometry.attributes.normal) return;
        ch.updateMatrix();
        const bake = vertexColors && canBakeColor(ch.material);
        const key = bake ? 'vc' : ch.material.uuid;
        let list = byMat.get(key);
        if (!list) byMat.set(key, list = []);
        list.push(ch);
      });
      byMat.forEach((list, key) => {
        if (list.length < 2 && key !== 'vc') return;
        const bake = key === 'vc';
        const geo = mergeGeometryItems(list.map(o => ({ geo: o.geometry, matrix: o.matrix, color: bake ? o.material.color : null })));
        const mesh = new THREE.Mesh(geo, bake ? vertexColorMaterial() : list[0].material);
        mesh.castShadow = list.some(o => o.castShadow);
        mesh.receiveShadow = list.some(o => o.receiveShadow);
        mesh.userData.ownGeo = true;
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        list.forEach(o => group.remove(o));
        group.add(mesh);
      });
    }

    // ---- FPS y calidad adaptativa ----
    const PERF = { frames: 0, last: 0, fps: 60, lowSecs: 0, auto: true, lastDowngradeAt: 0, mergedFrom: 0, mergedTo: 0 };

    function trackFrameRate() {
      const now = performance.now();
      if (!PERF.last) PERF.last = now;
      PERF.frames++;
      const elapsed = now - PERF.last;
      if (elapsed < 1000) return;
      PERF.fps = (PERF.frames * 1000) / elapsed;
      PERF.frames = 0;
      PERF.last = now;

      const chip = document.getElementById('fps-chip');
      if (chip) {
        const f = Math.round(PERF.fps);
        chip.textContent = f + ' FPS';
        chip.className = 'px-1.5 text-[10px] font-mono tabular-nums ' + (f >= 50 ? 'text-emerald-300' : f >= 30 ? 'text-amber-300' : 'text-rose-300');
      }

      if (!PERF.auto || document.hidden || elapsed > 2500) return; // una pausa larga no cuenta
      PERF.lowSecs = PERF.fps < 28 ? PERF.lowSecs + 1 : 0;
      if (PERF.lowSecs >= 5 && graphicsQuality !== 'baja' && now - PERF.lastDowngradeAt > 15000) {
        const next = graphicsQuality === 'alta' ? 'media' : 'baja';
        applyGraphicsQuality(next, false);
        try { localStorage.setItem('frp_graphics_quality', next); } catch (e) { /* sin persistencia */ }
        PERF.lowSecs = 0;
        PERF.lastDowngradeAt = now;
        showToast(`⚡ Calidad ajustada a ${next === 'media' ? 'Media' : 'Baja'} para mantener la fluidez`);
      }
    }
