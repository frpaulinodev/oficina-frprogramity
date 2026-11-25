    // _____________________________________________________________________
    // PROYECTOS: solo los que ordena el Director (tú). en curso ⇄ pausado → revisión → terminado.
    // Cada proyecto produce código real (codegen.js / IA) que puedes ver y probar antes de aprobarlo.
    // _____________________________________________________________________
    // Los pasos indican el *tipo* de sala; en la oficina principal coincide con el id de la sala
    // y en las oficinas vecinas se traduce a "<oficina>_<tipo>".
    const PROJECT_TEMPLATES = {
      crear_web: {
        office: 'main', icon: '🌐', label: 'Web', tone: 'text-sky-300', kind: 'web',
        titles: ['Web "Nova Studio"', 'Landing "Impulso"', 'Sitio "Café Central"'],
        summary: 'Diseñar, maquetar y publicar un sitio web adaptable listo para usar.',
        steps: [
          { zone: 'apps', desc: 'Diseñar la estructura, colores y textos de la web', bubble: '🎨 Diseñando la web' },
          { zone: 'software', desc: 'Programar las secciones, formularios e interacción', bubble: '⌨️ Programando la web' },
          { zone: 'qa_lab', desc: 'Probar en móvil y PC, enlaces y velocidad', bubble: '🧪 Probando la web' },
          { zone: 'meeting', desc: 'Preparar la entrega y la vista previa', bubble: '🚀 Publicando la web' }
        ]
      },
      crear_juego: {
        office: 'main', icon: '🎮', label: 'Juego', tone: 'text-purple-300', kind: 'juego',
        titles: ['Juego Arcade "Space Reflexes"', 'Plataformas "Sky Hopper"', 'Puzzle "Neon Blocks"', 'Carreras "Turbo Lane"', 'Aventura "Bosque Pixel"'],
        summary: 'Diseñar mecánicas, programar el motor, probar el rendimiento y empaquetar el juego.',
        steps: [
          { zone: 'games', desc: 'Definir mecánicas, controles y puntaje', bubble: '🎮 Diseñando mecánicas' },
          { zone: 'software', desc: 'Programar el motor de colisiones y el estado de partida', bubble: '⚙️ Programando el motor' },
          { zone: 'qa_lab', desc: 'Probar FPS, reinicio rápido y casos límite', bubble: '🧪 Probando el juego' },
          { zone: 'meeting', desc: 'Preparar el paquete final y la guía de controles', bubble: '📦 Cerrando el entregable' }
        ]
      },
      crear_app: {
        office: 'main', icon: '📱', label: 'App', tone: 'text-cyan-300', kind: 'app',
        titles: ['App de Gestión "TaskFlow"', 'App de Hábitos "Daily Spark"', 'App de Recetas "Cocina Fácil"', 'App de Finanzas "Ahorro+"', 'App de Eventos "Agenda Viva"'],
        summary: 'Construir la interfaz, conectar la lógica y validar el diseño adaptable.',
        steps: [
          { zone: 'apps', desc: 'Diseñar pantallas, tarjetas y navegación', bubble: '📱 Diseñando la UI' },
          { zone: 'software', desc: 'Conectar datos, filtros y exportación', bubble: '🔌 Conectando la lógica' },
          { zone: 'qa_lab', desc: 'Verificar diseño adaptable y errores', bubble: '🧪 Validando la app' },
          { zone: 'meeting', desc: 'Consolidar el entregable listo para usar', bubble: '🚀 Publicando la app' }
        ]
      },
      crear_software: {
        office: 'main', icon: '💻', label: 'Software', tone: 'text-emerald-300', kind: 'software',
        titles: ['API de Pagos "PayCore"', 'Herramienta Interna "DeployBot"', 'Motor de Búsqueda "FindIt"', 'Panel de Métricas "PulseBoard"'],
        summary: 'Diseñar la arquitectura, implementar el servicio, probarlo y documentarlo.',
        steps: [
          { zone: 'software', desc: 'Diseñar la arquitectura y los contratos de API', bubble: '🧩 Diseñando la arquitectura' },
          { zone: 'software', desc: 'Implementar el servicio y la automatización', bubble: '⌨️ Implementando el servicio' },
          { zone: 'qa_lab', desc: 'Pruebas de carga y seguridad', bubble: '🧪 Pruebas de carga' },
          { zone: 'meeting', desc: 'Documentación y demo al equipo', bubble: '📚 Documentando' }
        ]
      },
      brindar_ayuda: {
        office: 'main', icon: '🛟', label: 'Ayuda', tone: 'text-amber-300', kind: 'ayuda',
        titles: ['Guía "Primeros Pasos"', 'Centro de Soluciones Rápidas', 'Manual de Recuperación de Cuentas', 'FAQ Interactiva'],
        summary: 'Diagnosticar necesidades de los usuarios y entregar una guía clara.',
        steps: [
          { zone: 'help_desk', desc: 'Diagnosticar el problema y buscar la solución', bubble: '🩺 Diagnosticando' },
          { zone: 'help_desk', desc: 'Redactar pasos claros y ejemplos', bubble: '✍️ Escribiendo la guía' },
          { zone: 'software', desc: 'Verificar la solución técnica', bubble: '✅ Validando la solución' },
          { zone: 'meeting', desc: 'Entregar la respuesta completa', bubble: '📨 Entregando la ayuda' }
        ]
      },
      // --- plantillas para las oficinas vecinas ---
      proyecto_cliente: {
        office: 'guest', icon: '🤝', label: 'Cliente', tone: 'text-sky-300', kind: 'web',
        titles: ['Proyecto para Cliente "Aurora"', 'Pedido Especial "Nova"', 'Propuesta Comercial "Delta"'],
        summary: 'Entender al cliente, producir la solución y presentarla.',
        steps: [
          { zone: 'trabajo', desc: 'Reunir requisitos y planificar', bubble: '🗂️ Planificando' },
          { zone: 'trabajo', desc: 'Producir la solución', bubble: '🛠️ Produciendo' },
          { zone: 'reuniones', desc: 'Presentar el resultado', bubble: '🎤 Presentando' }
        ]
      },
      campana: {
        office: 'guest', icon: '📣', label: 'Campaña', tone: 'text-pink-300', kind: 'web',
        titles: ['Campaña "Lanzamiento de Verano"', 'Campaña "Marca Fresca"', 'Campaña de Redes "Conecta"'],
        summary: 'Idear la campaña, crear las piezas y aprobarlas en equipo.',
        steps: [
          { zone: 'reuniones', desc: 'Lluvia de ideas', bubble: '💡 Lluvia de ideas' },
          { zone: 'trabajo', desc: 'Crear las piezas', bubble: '🎨 Creando piezas' },
          { zone: 'trabajo', desc: 'Revisar y pulir', bubble: '🔍 Revisando' }
        ]
      }
    };

    const PROJECT_STATUS = {
      pendiente: { label: 'Pendiente de aprobación', cls: 'bg-amber-500/15 text-amber-200 border-amber-400/40' },
      en_curso: { label: 'En curso', cls: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/40' },
      pausado: { label: 'En pausa', cls: 'bg-slate-500/20 text-slate-200 border-slate-400/40' },
      revision: { label: 'Esperando tu revisión', cls: 'bg-indigo-500/20 text-indigo-100 border-indigo-300/60' },
      terminado: { label: 'Aprobado y terminado', cls: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40' },
      rechazado: { label: 'Desaprobado', cls: 'bg-rose-500/15 text-rose-200 border-rose-400/40' },
      cancelado: { label: 'Cancelado', cls: 'bg-slate-700/40 text-slate-300 border-slate-600' }
    };
    const PROJECT_STEP_MS = 9000;   // tiempo de trabajo de cada paso (más rápido con rangos altos)
    const PROJECTS_KEY = 'frp_projects_v1';
    const DELIVERABLES_KEY = 'frp_deliverables_v1';
    const PROJECTS = [];
    const PROJ_UI = { filter: 'activos', confirmDelete: null, confirmTimer: null, lastRender: 0 };

    function resolveZone(officeId, kind) {
      return officeId === 'main' ? kind : officeId + '_' + kind;
    }

    function templatesForOffice(officeId) {
      const kind = officeId === 'main' ? 'main' : 'guest';
      return Object.keys(PROJECT_TEMPLATES).filter(k => PROJECT_TEMPLATES[k].office === kind);
    }

    function projectAgent(p) {
      return p.currentAgent ? AGENTS.find(a => a.id === p.currentAgent) : null;
    }

    function isProjectAgent(agent) {
      for (let i = 0; i < PROJECTS.length; i++) {
        const p = PROJECTS[i];
        if ((p.status === 'en_curso' || p.status === 'revision') && p.currentAgent === agent.id) return true;
      }
      return false;
    }

    function createProject(templateKey, opts = {}) {
      const tpl = PROJECT_TEMPLATES[templateKey];
      if (!tpl) return null;
      const officeId = opts.officeId || ACTIVE_OFFICE;
      const p = {
        id: 'prj-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e4),
        officeId,
        template: templateKey,
        title: String(opts.title || randPick(tpl.titles)).slice(0, 80),
        summary: tpl.summary,
        steps: tpl.steps.map(s => ({ ...s })),
        stepIndex: 0,
        stepProgress: 0,
        status: 'pendiente',
        proposedBy: opts.proposedBy || 'Tú',
        brief: String(opts.brief || '').slice(0, 600),
        clientId: opts.clientId || null,
        kind: tpl.kind || 'web',
        code: '',
        codeSource: '',
        createdAt: Date.now(),
        authors: [],
        currentAgent: null,
        note: ''
      };
      PROJECTS.unshift(p);
      prepareProjectCode(p); // código real del proyecto (codegen.js)
      if (PROJECTS.length > 60) PROJECTS.length = 60;
      if (opts.start) startProject(p);
      saveProjects();
      updateProjectsBadge();
      return p;
    }

    // El Director crea y arranca el proyecto directamente (única forma de crear proyectos)
    function launchMission(templateKey, customTitle = null, brief = '', extra = {}) {
      const p = createProject(templateKey, Object.assign({ title: customTitle || undefined, start: true, proposedBy: 'Tú', brief }, extra));
      if (!p) return null;
      pushActivity(`Iniciaste el proyecto "${p.title}".`, 'PROYECTO');
      showToast(`▶ Proyecto en curso: ${p.title}`);
      renderPanel();
      return p;
    }

    function pickAgentForStep(p, zoneId) {
      const busy = new Set(PROJECTS.filter(o => o !== p && (o.status === 'en_curso' || o.status === 'revision')).map(o => o.currentAgent));
      const pool = AGENTS.filter(a => a.type === 'AI' && !a.leaving && officeOf(a) === p.officeId &&
        !['onboarding', 'meeting', 'break'].includes(a.status) && !busy.has(a.id) &&
        a.homeZone !== 'cocina' && a.homeZone !== 'limpieza' && a.homeZone !== 'reception');
      const score = (a) => (a.homeZone === zoneId ? 100 : 0) + (a.rankIdx || 0) * 5 + a.energy / 20;
      pool.sort((a, b) => score(b) - score(a));
      return pool[0] || null;
    }

    function assignStep(p) {
      const step = p.steps[p.stepIndex];
      if (!step) return;
      const zoneId = resolveZone(p.officeId, step.zone);
      if (!ZONES[zoneId]) { p.note = 'Sala no disponible'; return; }
      const agent = pickAgentForStep(p, zoneId);
      p.currentAgent = agent ? agent.id : null;
      p.note = agent ? '' : 'Esperando personal disponible';
      if (!agent) return;
      const prev = agent.currentZone;
      agent.currentZone = zoneId;
      agent.targetPos = getWaypointForZone(zoneId, agent.id);
      agent.status = 'working';
      agent.task = `${p.title}: ${step.desc}`;
      agent.bubble = step.bubble;
      if (!p.authors.includes(agent.name)) p.authors.push(agent.name);
      spawnDataPacket(prev, zoneId, agent.color);
    }

    function releaseAgent(p, bubble) {
      const a = projectAgent(p);
      p.currentAgent = null;
      if (!a || a.leaving) return;
      if (a.status === 'waiting_human') a.status = 'working';
      a.task = 'Trabajando en su estación';
      a.bubble = bubble;
      a.currentZone = a.homeZone;
      a.targetPos = getWaypointForZone(a.homeZone, a.id);
    }

    function startProject(p) {
      p.status = 'en_curso';
      p.stepIndex = 0;
      p.stepProgress = 0;
      assignStep(p);
    }

    function findProject(id) {
      return PROJECTS.find(p => p.id === id);
    }

    function approveProject(id) {
      const p = findProject(id);
      if (!p) return;
      if (p.status === 'pendiente') {
        startProject(p);
        pushActivity(`Aprobaste el proyecto "${p.title}" (propuesto por ${p.proposedBy}).`, 'APROBADO');
        showToast(`✅ Proyecto aprobado: ${p.title}`);
      } else if (p.status === 'revision') {
        const a = projectAgent(p);
        p.status = 'terminado';
        p.finishedAt = Date.now();
        AGENTS.filter(x => p.authors.includes(x.name)).forEach(x => grantXp(x, 50));
        releaseAgent(p, '🎉 ¡Proyecto aprobado!');
        createDeliverableFromProject(p);
        if (typeof onClientProjectDone === 'function') onClientProjectDone(p);
        pushActivity(`Aprobaste la entrega de "${p.title}". Entregable listo.`, 'APROBADO');
        if (a) a.bubble = '🎉 ¡Proyecto aprobado!';
      } else return;
      afterProjectChange();
    }

    function disapproveProject(id) {
      const p = findProject(id);
      if (!p) return;
      if (p.status === 'pendiente') {
        p.status = 'rechazado';
        pushActivity(`Desaprobaste la propuesta "${p.title}".`, 'DESAPROBADO');
        showToast(`✕ Propuesta desaprobada: ${p.title}`);
        const proposer = AGENTS.find(a => a.name === p.proposedBy);
        if (proposer) proposer.bubble = '😕 Propuesta desaprobada';
      } else if (p.status === 'revision') {
        // pide cambios: se repite el último paso
        releaseAgent(p, '🔁 Haciendo ajustes');
        p.status = 'en_curso';
        p.stepIndex = p.steps.length - 1;
        p.stepProgress = 0;
        p.note = 'Ajustes pedidos por el Director';
        assignStep(p);
        pushActivity(`Pediste ajustes en "${p.title}".`, 'AJUSTE');
        showToast(`↺ Ajustes pedidos: ${p.title}`);
      } else return;
      afterProjectChange();
    }

    function pauseProject(id) {
      const p = findProject(id);
      if (!p || p.status !== 'en_curso') return;
      p.status = 'pausado';
      releaseAgent(p, '⏸️ Proyecto en pausa');
      pushActivity(`Pausaste "${p.title}".`, 'PAUSA');
      showToast(`⏸️ En pausa: ${p.title}`);
      afterProjectChange();
    }

    function resumeProject(id) {
      const p = findProject(id);
      if (!p || p.status !== 'pausado') return;
      p.status = 'en_curso';
      assignStep(p);
      pushActivity(`Reanudaste "${p.title}".`, 'PROYECTO');
      showToast(`▶ Reanudado: ${p.title}`);
      afterProjectChange();
    }

    function cancelProject(id) {
      const p = findProject(id);
      if (!p || !['pendiente', 'en_curso', 'pausado', 'revision'].includes(p.status)) return;
      releaseAgent(p, '⛔ Proyecto cancelado');
      p.status = 'cancelado';
      pushActivity(`Cancelaste "${p.title}".`, 'CANCELADO');
      showToast(`⛔ Cancelado: ${p.title}`);
      afterProjectChange();
    }

    // Eliminar pide confirmación con un segundo clic (4 s)
    function deleteProject(id) {
      const p = findProject(id);
      if (!p) return;
      if (PROJ_UI.confirmDelete !== id) {
        PROJ_UI.confirmDelete = id;
        clearTimeout(PROJ_UI.confirmTimer);
        PROJ_UI.confirmTimer = setTimeout(() => { PROJ_UI.confirmDelete = null; renderPanel(); }, 4000);
        renderPanel();
        return;
      }
      PROJ_UI.confirmDelete = null;
      if (['en_curso', 'pausado', 'revision'].includes(p.status)) releaseAgent(p, 'Proyecto eliminado');
      PROJECTS.splice(PROJECTS.indexOf(p), 1);
      pushActivity(`Eliminaste el proyecto "${p.title}".`, 'ELIMINADO');
      showToast(`🗑️ Eliminado: ${p.title}`);
      afterProjectChange();
    }

    function clearArchivedProjects() {
      const before = PROJECTS.length;
      for (let i = PROJECTS.length - 1; i >= 0; i--) {
        const p = PROJECTS[i];
        if (p.officeId === ACTIVE_OFFICE && ['terminado', 'rechazado', 'cancelado'].includes(p.status)) PROJECTS.splice(i, 1);
      }
      showToast(`Archivados eliminados: ${before - PROJECTS.length}`);
      afterProjectChange();
    }

    function afterProjectChange() {
      saveProjects();
      updateProjectsBadge();
      renderPanel();
    }

    function projectTick() {
      const now = performance.now();
      let changed = false;
      for (const p of PROJECTS) {
        if (p.status !== 'en_curso') continue;
        let a = projectAgent(p);
        if (!a || a.leaving) { assignStep(p); a = projectAgent(p); if (!a) continue; }
        if (a.status === 'break' || a.status === 'meeting' || !isAgentArrived(a)) continue;
        p.stepProgress += 500 * rankSpeedFactor(a);
        if (p.stepProgress < PROJECT_STEP_MS) continue;
        grantXp(a, 25);
        p.stepIndex++;
        p.stepProgress = 0;
        changed = true;
        if (p.stepIndex >= p.steps.length) {
          p.status = 'revision';
          p.stepIndex = p.steps.length;
          a.status = 'waiting_human';
          a.bubble = 'Esperando tu aprobación';
          pushActivity(`"${p.title}" está listo para tu revisión.`, 'REVISIÓN');
          showToast(`📋 Revisión pendiente: ${p.title}`);
        } else {
          a.status = 'working';
          a.bubble = 'Paso completado ✓';
          assignStep(p);
        }
      }

      if (changed) { saveProjects(); updateProjectsBadge(); }
      const live = activeTab === 'projects' || activeTab === 'operations';
      if (live && (changed || now - PROJ_UI.lastRender > 2000)) { PROJ_UI.lastRender = now; renderPanel(); }
    }

    function startProjectsEngine() {
      setInterval(projectTick, 500);
    }

    function updateProjectsBadge() {
      const el = document.getElementById('projects-count');
      if (!el) return;
      const n = PROJECTS.filter(p => p.officeId === ACTIVE_OFFICE && (p.status === 'pendiente' || p.status === 'revision')).length;
      el.textContent = String(n);
      el.classList.toggle('hidden', n === 0);
    }

    // ---- Entregables ----
    function createDeliverableFromProject(p) {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const tpl = PROJECT_TEMPLATES[p.template] || {};
      const del = {
        id: 'del-' + Date.now(),
        officeId: p.officeId,
        title: `${tpl.icon || '📦'} ${p.title}`,
        category: `${tpl.label || 'Proyecto'} · ${officeName(p.officeId)}`,
        createdAt: `Hoy · ${nowStr}`,
        authors: p.authors.slice(),
        status: 'Terminado',
        summary: (p.brief ? `Pedido: ${p.brief} — ` : '') + `${p.summary} Completado y aprobado por el Director.`,
        kind: p.kind,
        code: p.code || '',
        codeSource: p.codeSource || 'plantilla',
        projectId: p.id,
        metrics: [
          { label: 'Etapas', value: `${p.steps.length}/${p.steps.length}`, positive: true },
          { label: 'Revisión', value: 'Aprobada', positive: true },
          { label: 'Pedido por', value: p.proposedBy, positive: true }
        ],
        table: p.steps.map((st, i) => ({
          activo: `Paso ${i + 1}`,
          peso: (ZONES[resolveZone(p.officeId, st.zone)] || {}).name || st.zone,
          accion: 'Completado',
          nota: st.desc
        })),
        body: `Entrega de "${p.title}". Todos los pasos se completaron en la oficina y el Director aprobó el resultado.`
      };
      DELIVERABLES.unshift(del);
      if (DELIVERABLES.length > 40) DELIVERABLES.length = 40;
      saveDeliverables();
      updateDeliverablesBadge();
      showToast(`📦 Entregable listo: ${p.title}`);
    }

    function deleteDeliverable(id) {
      const i = DELIVERABLES.findIndex(d => d.id === id);
      if (i < 0) return;
      if (PROJ_UI.confirmDelete !== id) {
        PROJ_UI.confirmDelete = id;
        clearTimeout(PROJ_UI.confirmTimer);
        PROJ_UI.confirmTimer = setTimeout(() => { PROJ_UI.confirmDelete = null; renderPanel(); }, 4000);
        renderPanel();
        return;
      }
      PROJ_UI.confirmDelete = null;
      const [d] = DELIVERABLES.splice(i, 1);
      saveDeliverables();
      updateDeliverablesBadge();
      showToast(`🗑️ Entregable eliminado: ${d.title}`);
      renderPanel();
    }

    // ---- Persistencia (con limpieza de datos al cargar) ----
    function saveProjects() {
      try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(PROJECTS)); } catch (e) { /* sin persistencia */ }
    }

    function saveDeliverables() {
      try { localStorage.setItem(DELIVERABLES_KEY, JSON.stringify(DELIVERABLES)); } catch (e) { /* sin persistencia */ }
    }

    const cleanText = (v, n = 120) => String(v == null ? '' : v).replace(/[<>&"']/g, '').slice(0, n);

    function restoreProjects() {
      let list = [];
      try { list = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]'); } catch (e) { list = []; }
      if (Array.isArray(list)) {
        list.slice(0, 60).forEach(raw => {
          if (!raw || typeof raw !== 'object' || !PROJECT_TEMPLATES[raw.template] || !PROJECT_STATUS[raw.status]) return;
          const officeId = raw.officeId === 'main' || GUEST_OFFICES.some(o => o.id === raw.officeId) ? raw.officeId : null;
          if (!officeId) return;
          // solo se conservan los proyectos que ordenó el Director
          if (!/^Tú/.test(String(raw.proposedBy || ''))) return;
          const tpl = PROJECT_TEMPLATES[raw.template];
          const p = {
            id: cleanText(raw.id, 40), officeId, template: raw.template, title: cleanText(raw.title, 80), summary: tpl.summary,
            steps: tpl.steps.map(s => ({ ...s })),
            stepIndex: Math.max(0, Math.min(tpl.steps.length, Math.round(Number(raw.stepIndex) || 0))),
            stepProgress: 0, status: raw.status, proposedBy: cleanText(raw.proposedBy, 40), createdAt: Number(raw.createdAt) || Date.now(),
            authors: Array.isArray(raw.authors) ? raw.authors.slice(0, 10).map(x => cleanText(x, 40)) : [],
            currentAgent: null, note: '',
            brief: cleanText(raw.brief, 600), clientId: cleanText(raw.clientId, 40) || null, kind: tpl.kind || 'web',
            code: typeof raw.code === 'string' ? raw.code.slice(0, 200000) : '', codeSource: cleanText(raw.codeSource, 20)
          };
          PROJECTS.push(p);
          if (!p.code) prepareProjectCode(p);
        });
      }
      // los proyectos activos retoman su paso con el personal disponible
      PROJECTS.forEach(p => {
        if (p.status === 'en_curso') assignStep(p);
        if (p.status === 'revision') {
          const a = AGENTS.find(x => p.authors.includes(x.name) && x.type === 'AI' && officeOf(x) === p.officeId);
          if (a) { p.currentAgent = a.id; a.status = 'waiting_human'; a.bubble = 'Esperando tu aprobación'; }
        }
      });

      let dels = null;
      try { dels = JSON.parse(localStorage.getItem(DELIVERABLES_KEY) || 'null'); } catch (e) { dels = null; }
      if (Array.isArray(dels)) {
        // fuera los entregables de ejemplo y los de proyectos que no ordenaste
        const ordered = (d) => !/^del-[123]$/.test(String(d.id)) && !/Respuesta$/.test(String(d.category || '')) &&
          (Array.isArray(d.metrics) ? d.metrics : []).some(m => m && /^(Pedido|Propuesto) por$/.test(m.label) && /^Tú/.test(String(m.value)));
        DELIVERABLES = dels.slice(0, 40).filter(d => d && typeof d === 'object' && ordered(d)).map(d => ({
          id: cleanText(d.id, 40), officeId: d.officeId === 'main' || GUEST_OFFICES.some(o => o.id === d.officeId) ? d.officeId : 'main',
          title: cleanText(d.title, 100), category: cleanText(d.category, 60), createdAt: cleanText(d.createdAt, 30),
          authors: Array.isArray(d.authors) ? d.authors.slice(0, 10).map(x => cleanText(x, 40)) : [],
          status: 'Terminado', summary: cleanText(d.summary, 400),
          metrics: Array.isArray(d.metrics) ? d.metrics.slice(0, 4).map(m => ({ label: cleanText(m && m.label, 30), value: cleanText(m && m.value, 40), positive: true })) : [],
          table: Array.isArray(d.table) ? d.table.slice(0, 8).map(r => ({ activo: cleanText(r && r.activo, 60), peso: cleanText(r && r.peso, 60), accion: cleanText(r && r.accion, 30), nota: cleanText(r && r.nota, 160) })) : [],
          body: cleanText(d.body, 800),
          kind: cleanText(d.kind, 12), codeSource: cleanText(d.codeSource, 20), projectId: cleanText(d.projectId, 40),
          code: typeof d.code === 'string' ? d.code.slice(0, 200000) : ''
        }));
      }
      updateDeliverablesBadge();
      updateProjectsBadge();
      startProjectsEngine();
    }

    // ---- Interfaz: pestaña Proyectos ----
    function projectProgressPct(p) {
      if (p.status === 'terminado' || p.status === 'revision') return 100;
      const total = p.steps.length;
      return Math.round(((p.stepIndex + Math.min(1, p.stepProgress / PROJECT_STEP_MS)) / total) * 100);
    }

    function projectActionsHtml(p) {
      const btn = (fn, label, cls) => `<button onclick="${fn}('${p.id}')" class="px-2 py-1 rounded-lg text-[10px] font-semibold border transition ${cls}">${label}</button>`;
      const ok = 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border-emerald-400/50';
      const bad = 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-100 border-rose-400/40';
      const mid = 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700';
      const del = PROJ_UI.confirmDelete === p.id
        ? btn('deleteProject', '¿Seguro? Eliminar', 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400')
        : btn('deleteProject', '🗑 Eliminar', mid);
      switch (p.status) {
        case 'pendiente': return btn('approveProject', '✓ Aprobar', ok) + btn('disapproveProject', '✕ Desaprobar', bad) + del;
        case 'en_curso': return btn('pauseProject', '⏸ Pausar', mid) + btn('cancelProject', '⛔ Cancelar', bad) + del;
        case 'pausado': return btn('resumeProject', '▶ Reanudar', ok) + btn('cancelProject', '⛔ Cancelar', bad) + del;
        case 'revision': return btn('approveProject', '✓ Aprobar entrega', ok) + btn('disapproveProject', '↺ Desaprobar', bad) + btn('cancelProject', '⛔ Cancelar', mid);
        default: return del;
      }
    }

    function projectCardHtml(p) {
      const tpl = PROJECT_TEMPLATES[p.template] || {};
      const st = PROJECT_STATUS[p.status];
      const a = projectAgent(p);
      const pct = projectProgressPct(p);
      const step = p.steps[Math.min(p.stepIndex, p.steps.length - 1)];
      const showSteps = ['en_curso', 'pausado', 'revision'].includes(p.status);
      return `
        <div class="p-3 rounded-xl bg-slate-900/85 border border-slate-800 hover:border-slate-700 transition space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="text-xs font-bold text-white truncate">${tpl.icon || '📁'} ${escapeHtml(p.title)}</div>
              <div class="text-[10px] text-slate-400">Propuesto por ${escapeHtml(p.proposedBy)} · ${tpl.label || ''}</div>
            </div>
            <span class="shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded-md border ${st.cls}">${st.label}</span>
          </div>
          ${p.status !== 'pendiente' && p.status !== 'rechazado' ? `
            <div class="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div class="h-full rounded-full ${p.status === 'pausado' ? 'bg-slate-400' : p.status === 'cancelado' ? 'bg-slate-600' : 'bg-gradient-to-r from-cyan-400 to-emerald-400'}" style="width:${pct}%"></div>
            </div>` : `<p class="text-[11px] text-slate-300">${escapeHtml(p.summary)}</p>`}
          ${showSteps ? `
            <div class="flex items-center justify-between text-[10px] text-slate-400">
              <span>${p.status === 'revision' ? '📋 Todo listo: decide si apruebas la entrega' : `Paso ${Math.min(p.stepIndex + 1, p.steps.length)}/${p.steps.length}: ${escapeHtml(step.desc)}`}</span>
              <span class="font-mono text-slate-300">${pct}%</span>
            </div>
            <div class="text-[10px] ${p.note ? 'text-amber-300' : 'text-slate-500'}">${p.note ? escapeHtml(p.note) : a ? `👤 ${escapeHtml(a.name)} ${rankChipHtml(a, false)}` : ''}</div>
          ` : ''}
          ${p.brief ? `<p class="text-[10px] text-slate-400 line-clamp-2">📝 ${escapeHtml(p.brief)}</p>` : ''}
          <div class="flex flex-wrap gap-1.5 pt-0.5">
            ${p.status !== 'rechazado' && p.status !== 'cancelado' ? `<button onclick="openProjectWork('${p.id}')" class="px-2 py-1 rounded-lg text-[10px] font-semibold border transition bg-sky-500/15 hover:bg-sky-500/25 text-sky-100 border-sky-400/40">${p.status === 'revision' || p.status === 'terminado' ? '👁 Ver resultado y código' : '👁 Ver avance'}</button>` : ''}
            ${projectActionsHtml(p)}
          </div>
        </div>
      `;
    }

    const PROJECT_FILTERS = {
      activos: { label: 'Activos', test: p => ['pendiente', 'en_curso', 'pausado', 'revision'].includes(p.status) },
      pendientes: { label: 'Por decidir', test: p => p.status === 'pendiente' || p.status === 'revision' },
      archivados: { label: 'Archivados', test: p => ['terminado', 'rechazado', 'cancelado'].includes(p.status) },
      todos: { label: 'Todos', test: () => true }
    };

    function setProjectFilter(f) {
      PROJ_UI.filter = f;
      renderPanel();
    }

    function renderProjectsTab(container) {
      const mine = PROJECTS.filter(p => p.officeId === ACTIVE_OFFICE);
      const count = (st) => mine.filter(p => p.status === st).length;
      const filter = PROJECT_FILTERS[PROJ_UI.filter] || PROJECT_FILTERS.activos;
      const list = mine.filter(filter.test);
      const tpls = templatesForOffice(ACTIVE_OFFICE);
      container.innerHTML = `
        <div class="grid grid-cols-4 gap-1.5">
          ${[['pendiente', 'Por aprobar', 'text-amber-300'], ['en_curso', 'En curso', 'text-cyan-300'], ['pausado', 'En pausa', 'text-slate-300'], ['revision', 'Revisión', 'text-indigo-200']].map(([k, l, c]) => `
            <div class="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
              <div class="text-base font-bold font-mono ${c}">${count(k)}</div>
              <div class="text-[9px] text-slate-400">${l}</div>
            </div>`).join('')}
        </div>

        ${newProjectFormHtml(tpls)}

        <div class="flex items-center gap-1 flex-wrap">
          ${Object.keys(PROJECT_FILTERS).map(k => `
            <button onclick="setProjectFilter('${k}')" class="px-2 py-1 rounded-lg text-[10px] font-semibold border transition ${PROJ_UI.filter === k ? 'bg-cyan-500/20 text-cyan-100 border-cyan-400/50' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'}">${PROJECT_FILTERS[k].label}</button>
          `).join('')}
          ${PROJ_UI.filter === 'archivados' && list.length ? `<button onclick="clearArchivedProjects()" class="ml-auto px-2 py-1 rounded-lg text-[10px] text-rose-200 bg-rose-500/10 border border-rose-500/30">Vaciar archivados</button>` : ''}
        </div>

        <div class="space-y-2">
          ${list.length ? list.map(projectCardHtml).join('') : `
            <div class="p-4 rounded-xl border border-dashed border-slate-700 text-center text-[11px] text-slate-400">
              No hay proyectos en "${filter.label}". El equipo solo trabaja en lo que tú le ordenes: crea uno arriba.
            </div>`}
        </div>
      `;
    }

    // ---- Interfaz: pestaña Estudio (resumen) ----
    function renderOperationsTab(container) {
      const members = AGENTS.filter(a => a.type !== 'HUMAN' && a.type !== 'CANDIDATE' && !a.leaving && officeOf(a) === ACTIVE_OFFICE);
      const working = members.filter(a => a.status === 'working').length;
      const resting = members.filter(a => a.status === 'break').length;
      const mine = PROJECTS.filter(p => p.officeId === ACTIVE_OFFICE);
      const toDecide = mine.filter(p => p.status === 'pendiente' || p.status === 'revision');
      const running = mine.filter(p => p.status === 'en_curso');
      const meetingRooms = Object.values(ZONES).filter(z => z.boardroom && (z.office || 'main') === ACTIVE_OFFICE);
      const dels = DELIVERABLES.filter(d => (d.officeId || 'main') === ACTIVE_OFFICE).length;

      container.innerHTML = `
        <div class="grid grid-cols-3 gap-2">
          <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div class="text-[10px] text-slate-400">Trabajando</div>
            <div class="text-base font-bold font-mono text-cyan-300">${working}<span class="text-[10px] text-slate-500">/${members.length}</span></div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div class="text-[10px] text-slate-400">Descansando</div>
            <div class="text-base font-bold font-mono text-amber-300">${resting}</div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div class="text-[10px] text-slate-400">Entregables</div>
            <div class="text-base font-bold font-mono text-emerald-300">${dels}</div>
          </div>
        </div>

        ${!mine.length ? `
          <div class="p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 space-y-2">
            <div class="text-xs font-semibold text-white">El equipo espera tus órdenes</div>
            <p class="text-[11px] text-slate-400">Solo trabajan en lo que tú pides. Ordena un proyecto, acepta el pedido de un cliente o díselo a tu asistente.</p>
            <div class="flex flex-wrap gap-1.5">
              <button onclick="switchTab('projects')" class="chip">📁 Ordenar proyecto</button>
              <button onclick="openDockPanel('clients')" class="chip">🤝 Ver clientes</button>
              <button onclick="openDockPanel('assistant')" class="chip">🤖 Asistente</button>
            </div>
          </div>` : ''}

        ${toDecide.length ? `
          <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-400/40 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-mono font-bold text-amber-200">TIENES ${toDecide.length} DECISIÓN${toDecide.length > 1 ? 'ES' : ''} PENDIENTE${toDecide.length > 1 ? 'S' : ''}</span>
              <button onclick="setProjectFilter('pendientes'); switchTab('projects')" class="text-[10px] text-amber-100 underline">Ver todas</button>
            </div>
            ${toDecide.slice(0, 2).map(projectCardHtml).join('')}
          </div>` : ''}

        ${running.length ? `
          <div class="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/25 space-y-2">
            <div class="text-xs font-semibold text-white">En curso</div>
            ${running.slice(0, 3).map(p => `
              <div class="space-y-1">
                <div class="flex justify-between text-[11px]"><span class="text-slate-200 truncate">${(PROJECT_TEMPLATES[p.template] || {}).icon || ''} ${escapeHtml(p.title)}</span><span class="font-mono text-cyan-300">${projectProgressPct(p)}%</span></div>
                <div class="w-full h-1 rounded-full bg-slate-800 overflow-hidden"><div class="h-full bg-cyan-400" style="width:${projectProgressPct(p)}%"></div></div>
              </div>`).join('')}
          </div>` : ''}

        ${meetingRooms.length ? `
          <div class="p-3 rounded-xl bg-slate-900/80 border border-blue-500/25 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-white">📊 Reuniones</span>
              <span class="text-[10px] font-mono text-slate-400">${meetingRooms.map(z => z.spots.length - 1 + ' sillas').join(' · ')} + Director</span>
            </div>
            ${MEETING.active ? `
              <div class="p-2 rounded-lg bg-blue-500/15 border border-blue-400/40 text-[11px] text-blue-100 flex items-center justify-between gap-2">
                <span>En ${ZONES[MEETING.active.zone].name} · ${MEETING.active.attendees.length} asistentes · ${Math.max(0, Math.ceil((MEETING.active.endsAt - performance.now()) / 1000))} s</span>
                <button onclick="endMeeting()" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px]">Terminar</button>
              </div>
            ` : `
              <div class="grid grid-cols-${Math.min(2, meetingRooms.length)} gap-1.5">
                ${meetingRooms.map(z => `
                  <button onclick="convokeMeeting('${z.id}')" class="p-2 rounded-xl bg-slate-950/80 hover:bg-blue-500/15 border border-slate-800 text-left transition">
                    <div class="text-[11px] font-semibold text-blue-200">Convocar</div>
                    <div class="text-[10px] text-slate-400">${z.name}</div>
                  </button>`).join('')}
              </div>
            `}
          </div>` : ''}

        <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-white">Bitácora en vivo</span>
            <button onclick="switchTab('projects')" class="text-[10px] text-cyan-300 hover:text-cyan-100">Gestionar proyectos →</button>
          </div>
          <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            ${activityFeed.map(item => `
              <div class="p-2 rounded-lg bg-slate-950/75 border border-slate-800/70 text-[11px]">
                <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                  <span class="px-1.5 rounded bg-slate-800 text-cyan-300">${item.badge}</span>
                  <span>${item.time}</span>
                </div>
                <p class="text-slate-200">${item.text}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // ---- Formulario de nuevo proyecto (tipo + nombre + descripción) ----
    const NEW_PROJECT = { template: 'crear_web', title: '', brief: '' };

    function newProjectFormHtml(tpls) {
      if (!tpls.includes(NEW_PROJECT.template)) NEW_PROJECT.template = tpls[0];
      return `
        <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-white">Ordenar un proyecto</span>
            <span class="text-[10px] text-slate-500">empieza al instante</span>
          </div>
          <div class="flex flex-wrap gap-1">
            ${tpls.map(k => {
              const t = PROJECT_TEMPLATES[k];
              const on = NEW_PROJECT.template === k;
              return `<button onclick="NEW_PROJECT.template='${k}'; renderPanel()" class="px-2 py-1 rounded-lg text-[10px] font-semibold border transition ${on ? 'bg-cyan-500/20 text-cyan-100 border-cyan-400/50' : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:text-white'}">${t.icon} ${t.label}</button>`;
            }).join('')}
          </div>
          <input id="np-title" maxlength="70" value="${escapeHtml(NEW_PROJECT.title)}" oninput="NEW_PROJECT.title=this.value" placeholder="Nombre (p. ej. Tienda Urbana)" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400" />
          <textarea id="np-brief" maxlength="600" oninput="NEW_PROJECT.brief=this.value" placeholder="¿Qué quieres exactamente? Secciones, colores, funciones…" class="w-full h-14 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-400">${escapeHtml(NEW_PROJECT.brief)}</textarea>
          <button onclick="submitNewProject()" class="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition">▶ Ordenar al equipo</button>
        </div>`;
    }

    function submitNewProject() {
      const tpl = PROJECT_TEMPLATES[NEW_PROJECT.template];
      if (!tpl) return;
      const title = cleanText(NEW_PROJECT.title, 70).trim();
      const brief = cleanText(NEW_PROJECT.brief, 600).trim();
      launchMission(NEW_PROJECT.template, title ? `${tpl.label} "${title}"` : null, brief);
      NEW_PROJECT.title = '';
      NEW_PROJECT.brief = '';
      renderPanel();
    }
