    // [panel.js] Parte de lo que antes era script.js: PANEL DERECHO, entregables y ARRANQUE de la oficina (sección 6).
    // Se carga en orden desde index.html; no cambies el orden de los archivos.
    // _______________________________________________________
    // 6. RENDERIZADO DEL PANEL DERECHO Y MODAL DE ENTREGABLES
    //
    function switchTab(tab) {
      activeTab = tab;
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('tab-active', btn.id === 'tab-' + tab));
      renderPanel();
    }

    function toggleSidePanel() {
      panelMinimized = !panelMinimized;
      const body = document.getElementById('panel-body');
      const aside = document.getElementById('side-panel');
      if (panelMinimized) {
        body.classList.add('hidden');
        aside.classList.remove('bottom-3');
      } else {
        body.classList.remove('hidden');
        aside.classList.add('bottom-3');
      }
    }

    function selectAgent(agentId) {
      const ag = AGENTS.find(a => a.id === agentId);
      if (ag && ag.type === 'CANDIDATE') {
        RECRUIT.highlight = agentId;
        switchTab('recruit');
        return;
      }
      selectedAgentId = agentId;
      switchTab('team');
    }

    function renderPanel() {
      const body = document.getElementById('panel-body');
      if (!body) return;

      if (activeTab === 'operations') {
        renderOperationsTab(body);
      } else if (activeTab === 'projects') {
        renderProjectsTab(body);
      } else if (activeTab === 'team') {
        renderTeamAndCafeTab(body);
      } else if (activeTab === 'deliverables') {
        renderDeliverablesTab(body);
      } else if (activeTab === 'recruit') {
        renderRecruitTab(body);
      } else if (activeTab === 'offices') {
        renderOfficesTab(body);
      }
    }

    const CANDIDATE_PHASE_TEXT = {
      arriving: '🚶 Llegando',
      checkin: '🛎️ En el mostrador',
      to_wait: '🪑 Tomando asiento',
      waiting: '⏳ En sala de espera',
      to_interview: '🚶 Hacia la entrevista',
      interviewing: '🎙️ En entrevista'
    };

    function renderRecruitTab(container) {
      if (ACTIVE_OFFICE !== 'main') {
        container.innerHTML = `
          <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div class="text-2xl">🛎️</div>
            <div class="text-xs font-semibold text-white">La recepción de candidatos está en ${BRAND}</div>
            <p class="text-[11px] text-slate-400">Las entrevistas se hacen en la oficina principal. Vuelve a ella para contratar.</p>
            <button onclick="switchOffice('main')" class="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border border-cyan-400/50 text-[11px] font-semibold">Ir a ${BRAND}</button>
          </div>`;
        return;
      }
      const cands = activeCandidates();
      const size = teamSize();
      const iv = RECRUIT.interview ? AGENTS.find(a => a.id === RECRUIT.interview.candId) : null;

      let interviewHtml = '';
      if (iv && iv.cand) {
        const dirThere = directorAtInterview();
        const dir = AGENTS.find(a => a.id === 'human_dir');
        const dirHeading = dir && dir.targetPos && Math.hypot(dir.targetPos.x - INTERVIEW_SPOTS.interviewer[0], dir.targetPos.z - INTERVIEW_SPOTS.interviewer[1]) < 0.1;
        const status = iv.cand.phase === 'interviewing' ? 'Entrevista abierta'
          : !dirHeading ? 'Te están esperando en la sala'
          : dirThere ? 'Esperando al candidato…' : 'Caminando a la sala…';
        interviewHtml = `
          <div class="p-3 rounded-xl bg-violet-500/15 border border-violet-400/50 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-mono font-bold text-violet-200">ENTREVISTA EN CURSO</span>
              <span class="text-[10px] text-violet-100">${status}</span>
            </div>
            <p class="text-xs font-semibold text-white">${escapeHtml(iv.name)} · ${escapeHtml(iv.role)}</p>
            <div class="flex gap-2">
              ${iv.cand.phase === 'interviewing'
                ? `<button onclick="openInterviewModal('${iv.id}')" class="flex-1 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-semibold text-xs transition">Abrir entrevista</button>`
                : !dirHeading ? `<button onclick="sendDirectorToInterview()" class="flex-1 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-semibold text-xs transition">🤝 Ir a la Sala de Entrevistas</button>` : ''}
            </div>
          </div>
        `;
      }

      const candHtml = cands.length ? cands.map(a => {
        const c = a.cand;
        const hex = '#' + new THREE.Color(a.color).getHexString();
        const canInterview = !RECRUIT.interview && ['waiting', 'to_wait', 'checkin'].includes(c.phase);
        const hl = RECRUIT.highlight === a.id;
        return `
          <div class="p-2.5 rounded-xl border ${hl ? 'bg-violet-500/10 border-violet-400/50' : 'bg-slate-900/85 border-slate-800'} space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full" style="background:${hex}"></span>
                  <span class="text-xs font-bold text-white">${escapeHtml(a.name)}</span>
                </div>
                <div class="text-[11px] text-violet-200">${escapeHtml(a.role)} <span class="text-slate-400">· ${escapeHtml(c.area)} · ${c.years} años</span></div>
              </div>
              <span class="text-[10px] font-mono text-slate-300 shrink-0">${CANDIDATE_PHASE_TEXT[c.phase] || ''}</span>
            </div>
            <div class="grid grid-cols-4 gap-1.5">
              ${['tecnica', 'comunicacion', 'equipo', 'creatividad'].map(k => `
                <div>
                  <div class="text-[9px] font-mono text-slate-500 truncate">${SKILL_LABELS[k]}</div>
                  <div class="w-full h-1 rounded-full bg-slate-800 overflow-hidden"><div class="h-full bg-slate-400/70" style="width:${c.claims[k] * 10}%"></div></div>
                </div>
              `).join('')}
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-slate-500">Barras = lo que dice su CV</span>
              <button ${canInterview ? '' : 'disabled'} onclick="startInterview('${a.id}')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${canInterview ? 'bg-violet-500/25 hover:bg-violet-500/35 text-violet-100 border-violet-400/50' : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'}">
                🤝 Entrevistar
              </button>
            </div>
          </div>
        `;
      }).join('') : `
        <div class="p-3 rounded-xl bg-slate-900/70 border border-dashed border-slate-700 text-[11px] text-slate-400 text-center">
          ${RECRUIT.open ? 'Nadie en recepción por ahora. Mientras esta sección esté abierta llegarán candidatos, o llama a uno ya.' : 'No hay vacantes publicadas. Ábrelas para que lleguen candidatos mientras estés en esta sección.'}
        </div>
      `;

      const historyHtml = RECRUIT.history.length ? `
        <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 space-y-1.5">
          <div class="text-xs font-semibold text-white">Decisiones recientes</div>
          ${RECRUIT.history.map(h => `
            <div class="flex items-center justify-between text-[11px] px-2 py-1 rounded-lg bg-slate-950/70 border border-slate-800/70">
              <span class="text-slate-200">${escapeHtml(h.name)} <span class="text-slate-500">· ${escapeHtml(h.role)}</span></span>
              <span class="font-mono text-[10px] ${h.decision === 'Contratado' ? 'text-emerald-300' : 'text-rose-300'}">${h.decision === 'Contratado' ? escapeHtml(h.detail) : 'Rechazado'}</span>
            </div>
          `).join('')}
        </div>
      ` : '';

      container.innerHTML = `
        <div class="p-3 rounded-xl bg-slate-900/95 border border-rose-500/30 space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-bold text-white">🛎️ Recepción &amp; Talento</div>
              <div class="text-[11px] text-slate-400">Lucía IA recibe a los candidatos y tú los entrevistas.</div>
            </div>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">Equipo ${size}/${MAX_TEAM_SIZE}</span>
          </div>
          <div class="flex gap-1.5">
            <button onclick="toggleRecruitOpen()" class="flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition ${RECRUIT.open ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}">
              ${RECRUIT.open ? '📣 Vacantes abiertas' : '📣 Abrir vacantes'}
            </button>
            <button onclick="callCandidateNow()" class="flex-1 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 border border-rose-500/40 text-[11px] font-semibold transition">
              🛎️ Llamar candidato
            </button>
            <button onclick="moveDirectorTo('reception'); setCameraPreset('reception')" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] transition" title="Ir a Recepción">
              📍
            </button>
          </div>
        </div>

        ${interviewHtml}

        <div class="space-y-1.5">
          <div class="flex items-center justify-between px-0.5">
            <span class="text-xs font-semibold text-white">Candidatos en la oficina (${cands.length}/${RECEPTION_WAIT.length})</span>
            <span class="text-[10px] font-mono text-slate-500">${MAX_QUESTIONS} preguntas por entrevista</span>
          </div>
          ${candHtml}
        </div>

        ${historyHtml}

        <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div class="font-semibold text-slate-200">Cómo funciona</div>
          <p>1. Llegan por la entrada principal y se registran con Lucía.</p>
          <p>2. Esperan en los sofás hasta que los llames a la Sala de Entrevistas.</p>
          <p>3. Les haces ${MAX_QUESTIONS} preguntas (cambian en cada entrevista): cada respuesta revela su habilidad real. Después decides si lo apruebas o lo rechazas.</p>
          <p>4. Si lo contratas, camina a su sala y trabaja con el equipo (se guarda al recargar).</p>
        </div>
      `;
    }

    function renderTeamAndCafeTab(container) {
      const members = AGENTS.filter(a => a.type !== 'CANDIDATE' && !a.leaving && officeOf(a) === ACTIVE_OFFICE);
      members.sort((a, b) => (a.type === 'HUMAN' ? -1 : b.type === 'HUMAN' ? 1 : (b.rankIdx || 0) - (a.rankIdx || 0)));
      const selected = members.find(a => a.id === selectedAgentId) || members[1] || members[0];
      if (!selected) { container.innerHTML = '<p class="text-[11px] text-slate-400">Sin miembros.</p>'; return; }
      const next = rankEligible(selected) ? RANKS[(selected.rankIdx || 0) + 1] : null;
      const rankHtml = rankEligible(selected) ? `
        <div class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
          <div class="flex items-center justify-between">
            ${rankChipHtml(selected)}
            ${selected.promotionReady ? '<span class="text-[10px] font-semibold text-amber-200 animate-pulse">🎖️ Listo para ascender</span>' : ''}
          </div>
          ${rankProgressHtml(selected)}
          <div class="flex gap-1.5">
            ${next ? `<button onclick="promoteAgent('${selected.id}')" class="flex-1 py-1 rounded-lg text-[10px] font-semibold border ${selected.promotionReady ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300' : 'bg-slate-900 text-slate-500 border-slate-800'}">⬆ Ascender a ${next.name}</button>` : ''}
            ${selected.rankIdx ? `<button onclick="demoteAgent('${selected.id}')" class="px-2 py-1 rounded-lg text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800">⬇ Bajar rango</button>` : ''}
          </div>
        </div>` : '';
      const prof = selected.profile;
      const profileHtml = prof ? `
        <div class="p-2 rounded-lg bg-slate-950/70 border border-emerald-500/25 space-y-1.5">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-emerald-200 font-semibold">Contratado en entrevista</span>
            <span class="font-mono text-amber-300">${starsText(prof.stars)}</span>
          </div>
          ${SKILL_KEYS.map(k => `
            <div class="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span class="w-24 shrink-0">${SKILL_LABELS[k]}</span>
              <div class="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden"><div class="h-full ${prof.skills[k] >= 8 ? 'bg-emerald-400' : prof.skills[k] >= 5 ? 'bg-amber-400' : 'bg-rose-400'}" style="width:${prof.skills[k] * 10}%"></div></div>
              <span class="w-4 text-right text-slate-300">${prof.skills[k]}</span>
            </div>
          `).join('')}
        </div>
      ` : '';

      container.innerHTML = `
        <div class="p-3 rounded-xl bg-slate-900/95 border border-cyan-500/30 space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-bold text-white">${escapeHtml(selected.name)}</div>
              <div class="text-[11px] text-cyan-300">${escapeHtml(selected.role)}</div>
            </div>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
              ${ZONES[selected.currentZone]?.name || selected.currentZone}
            </span>
          </div>

          <div>
            <div class="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Energía</span>
              <span>${Math.round(selected.energy)}%${selected.cooldownUntil && selected.status !== 'break' && performance.now() < selected.cooldownUntil ? ' · recién descansó' : ''}</span>
            </div>
            <div class="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div class="h-full ${selected.energy > 50 ? 'bg-emerald-400' : selected.energy > 30 ? 'bg-amber-400' : 'bg-rose-400'}" style="width:${Math.round(selected.energy)}%"></div>
            </div>
          </div>

          <p class="text-[11px] text-slate-300"><b>Tarea actual:</b> ${selected.task}</p>
          <p class="text-[11px] text-slate-400"><b>Entrada:</b> ${selected.inputSpec}</p>
          <p class="text-[11px] text-slate-400"><b>Salida:</b> ${selected.outputSpec}</p>
          ${rankHtml}
          ${profileHtml}

          ${selected.type !== 'HUMAN' ? `
            <div class="flex gap-1.5 pt-1">
              <button onclick="sendAgentToBreak('${selected.id}', 'cafe')" class="flex-1 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-500/40 text-[11px] font-semibold transition">
                ☕ Ir al Café
              </button>
              <button onclick="sendAgentToBreak('${selected.id}', 'lounge')" class="flex-1 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-[11px] font-semibold transition">
                🛋️ Descansar
              </button>
              <button onclick="sendAgentToBreak('${selected.id}', 'naturaleza')" class="flex-1 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-200 border border-green-500/40 text-[11px] font-semibold transition">
                🌿 Jardín
              </button>
              <button onclick="callAgentBackToDesk('${selected.id}')" class="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-[11px] font-semibold transition">
                💻 Estación
              </button>
            </div>
            ${selected.hired ? `
              <button onclick="dismissMember('${selected.id}')" class="w-full py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 border border-rose-500/30 text-[11px] font-semibold transition">
                👋 Despedir del equipo
              </button>
            ` : ''}
          ` : ''}
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between px-0.5">
            <span class="text-xs font-semibold text-white">Equipo ${escapeHtml(officeName(ACTIVE_OFFICE))} (${members.length})</span>
            <span class="text-[10px] font-mono text-slate-500">${RANKS.map(r => r.icon).join(' ')}</span>
          </div>
          ${members.map(ag => {
            const isSel = ag.id === selected.id;
            const statusText = ag.status === 'break'
              ? ((breakInfo(ag.currentZone) && breakInfo(ag.currentZone).label) || '☕ Descanso')
              : ag.status === 'meeting'
                ? '📊 En reunión'
              : ag.status === 'onboarding'
                ? '📚 Inducción'
              : ag.status === 'waiting_human'
                ? '⏸️ Revisión'
                : ag.status === 'working'
                  ? '🟢 Activo'
                  : '⚪ Disponible';
            return `
              <button onclick="selectAgent('${ag.id}')" class="w-full text-left p-2.5 rounded-xl border transition ${isSel ? 'bg-cyan-500/15 border-cyan-400/50' : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/70'}">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-white">${escapeHtml(ag.name)} ${rankChipHtml(ag, false)}${ag.promotionReady ? ' <span title="Listo para ascender">🎖️</span>' : ''}${ag.hired ? ' <span class="ml-1 px-1 rounded bg-emerald-500/20 text-emerald-200 text-[9px] font-mono">NUEVO</span>' : ''}</span>
                  <span class="text-[10px] font-mono text-slate-300">${statusText}</span>
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                  <span>${escapeHtml(ag.role)}${rankEligible(ag) ? ' · ' + rankOf(ag).name : ''}</span>
                  <span class="font-mono text-[10px]">⚡ ${Math.round(ag.energy)}%</span>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      `;
    }

    function renderDeliverablesTab(container) {
      container.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-white">Entregables Terminados</div>
            <div class="text-[11px] text-slate-400">Juegos, apps, software y guías de ayuda listos para consultar.</div>
          </div>
        </div>

        <div class="space-y-2">
          ${DELIVERABLES.filter(d => (d.officeId || 'main') === ACTIVE_OFFICE).length ? '' : '<div class="p-4 rounded-xl border border-dashed border-slate-700 text-center text-[11px] text-slate-400">Aún no hay entregables. Aprueba un proyecto terminado para crear uno.</div>'}
          ${DELIVERABLES.filter(d => (d.officeId || 'main') === ACTIVE_OFFICE).map(del => `
            <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">${del.category}</span>
                  <h4 class="text-xs font-bold text-white mt-1">${del.title}</h4>
                </div>
                <span class="text-[10px] font-mono text-slate-400 shrink-0">${del.createdAt}</span>
              </div>
              <p class="text-[11px] text-slate-300 line-clamp-2">${del.summary}</p>
              <div class="flex items-center justify-between pt-1">
                <span class="text-[10px] text-slate-400 truncate">Por: ${del.authors.join(', ')}</span>
                <div class="flex gap-1.5 shrink-0">
                  <button onclick="deleteDeliverable('${del.id}')" class="px-2 py-1 rounded-lg text-[10px] border transition ${PROJ_UI.confirmDelete === del.id ? 'bg-rose-600 text-white border-rose-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}">${PROJ_UI.confirmDelete === del.id ? '¿Seguro?' : '🗑'}</button>
                  <button onclick="openDeliverableModal('${del.id}')" class="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-[11px] font-semibold transition">
                    Ver →
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    function openDeliverableModal(id) {
      const del = DELIVERABLES.find(d => d.id === id);
      if (!del) return;
      currentModalDeliverable = del;

      document.getElementById('modal-badge').textContent = del.status.toUpperCase();
      document.getElementById('modal-title').textContent = del.title;
      document.getElementById('modal-meta').textContent = `${del.category} · ${del.createdAt} · Autores: ${del.authors.join(', ')}`;

      const metricsHtml = (del.metrics || []).map(m => `
        <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <div class="text-[10px] text-slate-400">${m.label}</div>
          <div class="text-sm font-bold font-mono ${m.positive ? 'text-emerald-300' : 'text-amber-300'}">${m.value}</div>
        </div>
      `).join('');

      const tableRowsHtml = (del.table || []).map(r => `
        <tr class="border-t border-slate-800/80">
          <td class="py-2 pr-3 font-semibold text-white">${r.activo}</td>
          <td class="py-2 px-3 font-mono text-cyan-300">${r.peso}</td>
          <td class="py-2 px-3 text-emerald-300 font-medium">${r.accion}</td>
          <td class="py-2 pl-3 text-slate-300">${r.nota}</td>
        </tr>
      `).join('');

      document.getElementById('modal-content').innerHTML = `
        <p class="text-slate-200 leading-relaxed">${del.summary}</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">${metricsHtml}</div>
        <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table class="w-full text-left border-collapse text-[11px]">
            <thead class="bg-slate-900 text-slate-400 font-mono text-[10px]">
              <tr>
                <th class="py-2 pr-3 pl-3">Elemento</th>
                <th class="py-2 px-3">Área / Sala</th>
                <th class="py-2 px-3">Estado</th>
                <th class="py-2 pl-3 pr-3">Detalle</th>
              </tr>
            </thead>
            <tbody>${tableRowsHtml}</tbody>
          </table>
        </div>
        <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 leading-relaxed">
          ${del.body}
        </div>
      `;

      const modal = document.getElementById('deliverable-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeDeliverableModal() {
      const modal = document.getElementById('deliverable-modal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      currentModalDeliverable = null;
    }

    function copyDeliverableContent() {
      if (!currentModalDeliverable) return;
      const text = `${currentModalDeliverable.title}\n${currentModalDeliverable.summary}\n\n${currentModalDeliverable.body}`;
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast('Entregable copiado al portapapeles');
      } catch (err) {
        showToast('No se pudo copiar automáticamente');
      }
      document.body.removeChild(ta);
    }

    function renderTicker() {
      const el = document.getElementById('ticker-content');
      if (!el) return;
      const items = [...STATUS_ITEMS, ...STATUS_ITEMS].map(item => `
        <span class="inline-flex items-center gap-1.5 px-3">
          <b class="${item.tone}">${item.label}</b>
          <span class="text-slate-300">${item.text}</span>
        </span>
      `).join('');
      el.innerHTML = items;
    }

    window.onload = function () {
      try {
        renderTicker();
        updateDeliverablesBadge();
        initThreeScene();
        startAutonomousFloorEngine();
        startRecruitmentEngine();
        updateRecruitBadge();
        updateRankBadge();
        renderPanel();
      } catch (err) {
        console.error('Error al inicializar FRPROGRAMITY 3D:', err);
        showToast('Hubo un problema al iniciar la vista 3D.');
      }
    };
