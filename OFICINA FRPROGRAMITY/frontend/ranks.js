    // _____________________________________________________________________
    // RANGOS: experiencia (XP) por trabajar, reunirse y completar proyectos.
    // Cuando un miembro alcanza el siguiente umbral queda "listo para ascender"
    // y el Director decide si lo asciende.
    // _____________________________________________________________________
    const RANKS = [
      { id: 'becario', name: 'Becario', icon: '🌱', xp: 0, hex: 0x94a3b8, css: '#cbd5e1' },
      { id: 'junior', name: 'Junior', icon: '🔹', xp: 120, hex: 0x38bdf8, css: '#7dd3fc' },
      { id: 'semi', name: 'Semi-Senior', icon: '🔷', xp: 360, hex: 0x6366f1, css: '#a5b4fc' },
      { id: 'senior', name: 'Senior', icon: '⭐', xp: 800, hex: 0xf59e0b, css: '#fcd34d' },
      { id: 'lead', name: 'Líder de Área', icon: '🏅', xp: 1500, hex: 0xf97316, css: '#fdba74' },
      { id: 'manager', name: 'Gerente', icon: '👑', xp: 2600, hex: 0xeab308, css: '#fde047' }
    ];
    const RANK_STORAGE_KEY = 'frp_ranks_v1';
    // rango inicial del equipo fundador
    const FOUNDER_RANKS = {
      camila_ia: 3, mateo_ia: 2, elena_ia: 4, sofia_ia: 3, lucas_ia: 2, valentina_ia: 1, diego_ia: 3, andres_ia: 2, lucia_ia: 1
    };

    function rankEligible(agent) {
      return agent && agent.type !== 'HUMAN' && agent.type !== 'CANDIDATE';
    }

    function rankOf(agent) {
      return RANKS[Math.max(0, Math.min(RANKS.length - 1, agent.rankIdx || 0))];
    }

    function rankMaterial(idx, isHuman) {
      if (isHuman) {
        return cachedMat('rankDirector', () => new THREE.MeshStandardMaterial({ color: 0xe2e8f0, emissive: 0x7dd3fc, emissiveIntensity: 0.5, metalness: 0.9, roughness: 0.25 }));
      }
      const r = RANKS[Math.max(0, Math.min(RANKS.length - 1, idx))];
      return cachedMat('rank|' + r.id, () => new THREE.MeshStandardMaterial({
        color: new THREE.Color(r.hex).convertSRGBToLinear(), emissive: r.hex, emissiveIntensity: 0.35, metalness: 0.7, roughness: 0.3
      }));
    }

    function rankStaminaBonus(agent) {
      return 1 + 0.05 * (agent.rankIdx || 0);
    }

    function rankSpeedFactor(agent) {
      return 1 + 0.08 * ((agent && agent.rankIdx) || 0);
    }

    let _rankStore = null;
    function rankStore() {
      if (_rankStore) return _rankStore;
      try { _rankStore = JSON.parse(localStorage.getItem(RANK_STORAGE_KEY) || '{}') || {}; } catch (e) { _rankStore = {}; }
      if (typeof _rankStore !== 'object' || Array.isArray(_rankStore)) _rankStore = {};
      return _rankStore;
    }

    let _rankSaveTimer = null;
    function scheduleRankSave() {
      if (_rankSaveTimer) return;
      _rankSaveTimer = setTimeout(() => {
        _rankSaveTimer = null;
        const store = {};
        AGENTS.forEach(a => { if (rankEligible(a) && !a.leaving) store[a.id] = { r: a.rankIdx || 0, xp: Math.round(a.xp || 0) }; });
        _rankStore = store;
        try { localStorage.setItem(RANK_STORAGE_KEY, JSON.stringify(store)); } catch (e) { /* sin persistencia */ }
      }, 2500);
    }

    // fresh = recién contratado: el rango inicial depende de las estrellas de la entrevista
    function initAgentRank(agent, fresh = false) {
      if (!rankEligible(agent)) return;
      const saved = !fresh && rankStore()[agent.id];
      if (saved && Number.isFinite(saved.r)) {
        agent.rankIdx = Math.max(0, Math.min(RANKS.length - 1, Math.round(saved.r)));
        agent.xp = Math.max(RANKS[agent.rankIdx].xp, Number(saved.xp) || 0);
      } else {
        let idx = FOUNDER_RANKS[agent.id];
        if (idx === undefined) {
          const stars = agent.profile && agent.profile.stars;
          idx = stars >= 5 ? 2 : stars >= 4 ? 1 : 0;
        }
        agent.rankIdx = idx;
        agent.xp = RANKS[idx].xp;
      }
      const next = RANKS[agent.rankIdx + 1];
      agent.promotionReady = !!(next && agent.xp >= next.xp);
      scheduleRankSave();
    }

    function initRanks() {
      AGENTS.forEach(a => initAgentRank(a));
    }

    function grantXp(agent, amount) {
      if (!rankEligible(agent) || agent.leaving) return;
      if (agent.rankIdx === undefined) initAgentRank(agent);
      agent.xp = (agent.xp || 0) + amount;
      const next = RANKS[agent.rankIdx + 1];
      if (next && agent.xp >= next.xp && !agent.promotionReady) {
        agent.promotionReady = true;
        pushActivity(`${agent.name} está listo/a para ascender a ${next.icon} ${next.name}.`, 'RANGO');
        showToast(`🎖️ ${agent.name} puede ascender a ${next.name}`);
        updateRankBadge();
        if (activeTab === 'team') renderPanel();
      }
      scheduleRankSave();
    }

    function promoteAgent(agentId) {
      const a = AGENTS.find(x => x.id === agentId);
      if (!rankEligible(a) || a.rankIdx >= RANKS.length - 1) return;
      const next = RANKS[a.rankIdx + 1];
      if (a.xp < next.xp) { showToast(`A ${a.name} le faltan ${Math.ceil(next.xp - a.xp)} XP para ${next.name}.`); return; }
      a.rankIdx++;
      const after = RANKS[a.rankIdx + 1];
      a.promotionReady = !!(after && a.xp >= after.xp);
      a.bubble = `🎉 ¡Ascendido/a a ${next.name}!`;
      refreshAvatarRank(a);
      removeAgentLabel(a.id);
      createAgentLabel(a);
      spawnDataPacket(a.currentZone, a.currentZone, next.hex);
      pushActivity(`Ascendiste a ${a.name} a ${next.icon} ${next.name}.`, 'ASCENSO');
      showToast(`${next.icon} ${a.name} ahora es ${next.name}`);
      scheduleRankSave();
      updateRankBadge();
      renderPanel();
    }

    function demoteAgent(agentId) {
      const a = AGENTS.find(x => x.id === agentId);
      if (!rankEligible(a) || !a.rankIdx) return;
      a.rankIdx--;
      a.xp = Math.min(a.xp, RANKS[a.rankIdx + 1].xp - 1);
      a.promotionReady = false;
      refreshAvatarRank(a);
      removeAgentLabel(a.id);
      createAgentLabel(a);
      pushActivity(`${a.name} bajó a ${rankOf(a).name}.`, 'RANGO');
      showToast(`${a.name} ahora es ${rankOf(a).name}`);
      scheduleRankSave();
      updateRankBadge();
      renderPanel();
    }

    function promotionsPending(officeId) {
      return AGENTS.filter(a => a.promotionReady && rankEligible(a) && !a.leaving && (!officeId || officeOf(a) === officeId)).length;
    }

    function updateRankBadge() {
      const el = document.getElementById('team-count');
      if (!el) return;
      const n = promotionsPending(ACTIVE_OFFICE);
      el.textContent = n ? '🎖️' + n : '';
      el.classList.toggle('hidden', !n);
    }

    function rankChipHtml(agent, withName = true) {
      if (!rankEligible(agent)) return '';
      const r = rankOf(agent);
      return `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-semibold border" style="color:${r.css};border-color:${r.css}55;background:${r.css}14">${r.icon}${withName ? ' ' + r.name : ''}</span>`;
    }

    function rankProgressHtml(agent) {
      if (!rankEligible(agent)) return '';
      const r = rankOf(agent);
      const next = RANKS[agent.rankIdx + 1];
      if (!next) {
        return `<div class="text-[10px] font-mono text-amber-200">Rango máximo alcanzado · ${Math.round(agent.xp)} XP</div>`;
      }
      const span = next.xp - r.xp;
      const pct = Math.max(0, Math.min(100, ((agent.xp - r.xp) / span) * 100));
      return `
        <div>
          <div class="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>${r.icon} ${r.name} → ${next.icon} ${next.name}</span>
            <span>${Math.round(agent.xp)} / ${next.xp} XP</span>
          </div>
          <div class="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div class="h-full rounded-full" style="width:${pct}%;background:linear-gradient(90deg, ${r.css}, ${next.css})"></div>
          </div>
        </div>
      `;
    }
