    // _____________________________________________________________________
    // TRABAJO EN EQUIPO REAL
    // Antes: los agentes caminaban a una sala, esperaban unos segundos y el código lo
    // escribía una sola llamada de IA al crear el proyecto (sin que nadie lo revisara).
    // Ahora, con una IA conectada (⚙ del asistente), CADA PASO lo hace de verdad el agente
    // asignado, con su puesto y sus habilidades, y le pasa su resultado al siguiente:
    //   1. PLAN     → el primero convierte tu pedido en una ficha: objetivo, secciones,
    //                 estilo, funciones y criterios de aceptación.
    //   2. CREAR    → el programador escribe el código siguiendo esa ficha.
    //   3. QA       → el tester revisa el código contra los criterios. Si encuentra fallos,
    //                 un programador los corrige y QA vuelve a revisar (máx. 2 rondas).
    //   4. ENTREGA  → se prepara el resumen para el cliente: qué se hizo y cómo usarlo.
    // El paso no avanza hasta que el agente termina su trabajo. Si pides ajustes, escribes
    // qué cambiar y el equipo vuelve a programar, probar y entregar con tus comentarios.
    // Además:
    //   · EN PARALELO: antes de programar, un redactor y un diseñador trabajan a la vez.
    //   · HABILIDADES: junior/semi/senior cambian el esfuerzo de la IA y lo a fondo que revisa QA.
    //   · MEMORIA: guía de estilo de la empresa + lecciones de cada entrega aprobada.
    //   · RECEPCIÓN: detecta los puestos que faltan y trae candidatos para ellos.
    // Sin IA conectada, la oficina funciona como antes (simulación + generador local).
    // _____________________________________________________________________
    const TEAM = { jobs: {}, hinted: false };
    const TEAM_MAX_QA_ROUNDS = 2;

    function teamworkOn() {
      return typeof aiCodeReady === 'function' && aiCodeReady();
    }

    function teamOf(p) {
      if (!p.team || typeof p.team !== 'object') p.team = { spec: null, built: false, qa: null, delivery: null, feedback: '', log: [] };
      if (!Array.isArray(p.team.log)) p.team.log = [];
      return p.team;
    }

    function teamLog(p, agent, phase, text) {
      const t = teamOf(p);
      t.log.push({
        at: Date.now(), phase,
        agent: agent ? agent.name : 'Equipo', role: agent ? (agent.role || '') : '',
        text: String(text || '').slice(0, 600)
      });
      if (t.log.length > 30) t.log.splice(0, t.log.length - 30);
    }

    // ¿Qué trabajo real corresponde a cada paso de la plantilla?
    function stepPhase(p, i) {
      const st = p.steps[i];
      if (!st) return 'entrega';
      if (i === 0) return 'plan';
      const last = i === p.steps.length - 1;
      if (last && /^(meeting|reuniones)$/.test(st.zone)) return 'entrega';
      if (/(^|_)qa_lab$/.test(st.zone) || /prob|prueb|verific|revis|valid|pul|test/i.test(st.desc)) return 'qa';
      return 'build';
    }

    // ---------- Habilidades reales: cambian cómo trabaja cada agente ----------
    // Los agentes contratados en la recepción tienen habilidades medidas en la entrevista.
    // Los del equipo inicial cuentan como nivel medio (6).
    function skillOf(a, k) {
      const v = a && a.profile && a.profile.skills && Number(a.profile.skills[k]);
      return v >= 1 && v <= 10 ? v : 6;
    }
    function seniority(a) {
      const t = skillOf(a, 'tecnica') + Math.min(2, (a && a.rankIdx) || 0) * 0.5; // los ascensos también cuentan
      return t >= 8 ? 'senior' : t >= 5 ? 'semi' : 'junior';
    }
    const SENIORITY_LABEL = { junior: 'junior', semi: 'semi-senior', senior: 'senior' };
    const SENIORITY_STYLE = {
      junior: 'Eres junior: haces una versión más sencilla, te centras en lo básico y a veces se te escapan detalles.',
      semi: 'Eres semi-senior: haces un trabajo correcto y completo.',
      senior: 'Eres senior: cuidas cada detalle, el rendimiento, la accesibilidad y la experiencia en móvil.'
    };
    const SENIORITY_EFFORT = { junior: 'low', semi: 'medium', senior: 'high' };

    // Ficha del agente para que la IA actúe como esa persona del equipo
    function agentPersona(a) {
      if (!a) return `Eres un miembro del equipo de ${BRAND}.` + companyMemoryText();
      const prof = a.profile || {};
      const lvl = seniority(a);
      const zone = (typeof ZONES !== 'undefined' && ZONES[a.homeZone]) ? ZONES[a.homeZone].name : '';
      const extra = [];
      if (skillOf(a, 'creatividad') >= 8) extra.push('Eres muy creativo: propones ideas originales.');
      else if (skillOf(a, 'creatividad') <= 4) extra.push('Eres poco creativo: tiras de soluciones conocidas.');
      if (skillOf(a, 'comunicacion') >= 8) extra.push('Te expresas con mucha claridad.');
      else if (skillOf(a, 'comunicacion') <= 4) extra.push('Te cuesta explicar las cosas: eres escueto.');
      return `Eres ${a.name}, ${a.role || 'miembro del equipo'} (${SENIORITY_LABEL[lvl]})${zone ? ' del área ' + zone : ''} en la empresa "${BRAND}". ` +
        SENIORITY_STYLE[lvl] + ' ' + extra.join(' ') + (prof.trait ? ` Rasgo: ${prof.trait}.` : '') +
        ' Trabajas en equipo: lees lo que hicieron tus compañeros antes que tú y entregas un trabajo profesional y concreto. Escribe en español.' +
        companyMemoryText();
    }

    function projectContext(p) {
      const t = teamOf(p);
      const lines = [
        `Proyecto: ${p.title}`,
        `Tipo: ${(typeof AI_KIND_HINT !== 'undefined' && AI_KIND_HINT[p.kind]) || p.kind}`,
        `Pedido del Director: ${p.brief || '(sin detalles: usa tu mejor criterio profesional)'}`
      ];
      if (t.feedback) lines.push(`AJUSTES QUE PIDIÓ EL DIRECTOR (prioridad máxima): ${t.feedback}`);
      if (t.spec) lines.push('Ficha del proyecto acordada por el equipo:\n' + JSON.stringify(t.spec, null, 1));
      if (t.copy) lines.push('Textos escritos por el redactor (úsalos tal cual):\n' + JSON.stringify(t.copy, null, 1));
      if (t.design) lines.push('Guía visual del diseñador (respétala):\n' + JSON.stringify(t.design, null, 1));
      if (t.security) lines.push('Revisión de ciberseguridad: ' + JSON.stringify(t.security));
      return lines.join('\n');
    }

    // ---------- Estadísticas por agente (las usa la recepción) ----------
    const TEAM_STATS_KEY = 'frp_team_stats_v1';
    let TEAM_STATS = {};
    try { const s = JSON.parse(localStorage.getItem(TEAM_STATS_KEY) || '{}'); if (s && typeof s === 'object' && !Array.isArray(s)) TEAM_STATS = s; } catch (e) { TEAM_STATS = {}; }
    function statOf(name) {
      const k = String(name || '').slice(0, 40);
      if (!TEAM_STATS[k] || typeof TEAM_STATS[k] !== 'object') TEAM_STATS[k] = { pasos: 0, codigos: 0, primera: 0, fallosCausados: 0, fallosEncontrados: 0, entregas: 0 };
      return TEAM_STATS[k];
    }
    function bumpStat(a, key, n = 1) {
      if (!a) return;
      const s = statOf(a.name);
      s[key] = (Number(s[key]) || 0) + n;
      try { localStorage.setItem(TEAM_STATS_KEY, JSON.stringify(TEAM_STATS)); } catch (e) { /* sin persistencia */ }
    }

    // ---------- Memoria de la empresa ----------
    // Una guía de estilo que escribes tú + lecciones que el equipo aprende de cada proyecto aprobado.
    const COMPANY_MEMORY_KEY = 'frp_company_memory_v1';
    const COMPANY_MEMORY = { guia: '', lecciones: [] };
    try {
      const m = JSON.parse(localStorage.getItem(COMPANY_MEMORY_KEY) || '{}') || {};
      COMPANY_MEMORY.guia = String(m.guia || '').slice(0, 3000);
      COMPANY_MEMORY.lecciones = Array.isArray(m.lecciones) ? m.lecciones.slice(-15).map(l => ({ at: Number(l && l.at) || 0, text: String((l && l.text) || '').slice(0, 300) })).filter(l => l.text) : [];
    } catch (e) { /* sin memoria guardada */ }
    function saveCompanyMemory() {
      try { localStorage.setItem(COMPANY_MEMORY_KEY, JSON.stringify(COMPANY_MEMORY)); } catch (e) { /* sin persistencia */ }
    }
    // Guía inicial de FRPROGRAMITY: aparece la primera vez y la puedes editar cuando quieras
    const DEFAULT_COMPANY_GUIDE = `QUIÉNES SOMOS: ${BRAND} es una empresa de desarrollo de software de República Dominicana. Hacemos webs, tiendas online, CRM, sistemas de reservas, sistemas administrativos (inventario y facturación), automatizaciones con IA y software a medida.
CLIENTES: negocios de Estados Unidos (prioridad) y de República Dominicana, sobre todo los que todavía no tienen web ni sistema. Para clientes de EE. UU., los textos van en inglés (o en ambos idiomas si se pide) y los precios en USD; para RD, en español y en pesos (RD$).
DISEÑO: moderno y llamativo, con sombras suaves, degradados, iconos vistosos y animaciones sutiles. Si el trabajo es para ${BRAND}, se usa nuestra marca: fondo oscuro con tonos marrón y cobre. Si es para un cliente, se usan los colores de su negocio.
SIEMPRE INCLUIR en webs de negocios: diseño pensado primero para el móvil, botón visible de WhatsApp y de llamar, formulario de contacto que funcione, dirección con mapa, horario de atención y botón para dejar reseña en Google.
TEXTOS: reales y persuasivos, escritos para el negocio concreto. Nada de "lorem ipsum" ni textos de relleno.
CALIDAD: rápido, accesible, sin errores en la consola y con SEO básico (título y descripción de la página).
LEGAL Y CRÉDITOS (OBLIGATORIO en todo lo que se cree): Política de Privacidad, Términos y Condiciones y Política de Cookies, con enlaces en el pie de página que abren cada texto completo, adaptado al negocio. En el pie, siempre: "© <año> <negocio>. Todos los derechos reservados" y "Desarrollado por ${BRAND}".
ENTREGA: explicarle al cliente en palabras sencillas qué se hizo y cómo usarlo, y proponer el siguiente servicio que le vendría bien.`;
    if (/^QUIÉNES SOMOS:/.test(COMPANY_MEMORY.guia) && !/LEGAL Y CRÉDITOS/.test(COMPANY_MEMORY.guia)) {
      COMPANY_MEMORY.guia = DEFAULT_COMPANY_GUIDE; // la guía original, ahora con la parte legal
      saveCompanyMemory();
    }
    if (!COMPANY_MEMORY.guia.trim() && !(function () { try { return localStorage.getItem(COMPANY_MEMORY_KEY); } catch (e) { return null; } })()) {
      COMPANY_MEMORY.guia = DEFAULT_COMPANY_GUIDE;
      saveCompanyMemory();
    }
    function resetCompanyGuide() {
      setCompanyGuide(DEFAULT_COMPANY_GUIDE);
      renderPanel();
      showToast('🧠 Guía de la empresa restaurada');
    }

    function addLesson(text) {
      const tx = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 300);
      if (!tx || COMPANY_MEMORY.lecciones.some(l => l.text === tx)) return;
      COMPANY_MEMORY.lecciones.push({ at: Date.now(), text: tx });
      if (COMPANY_MEMORY.lecciones.length > 15) COMPANY_MEMORY.lecciones.shift();
      saveCompanyMemory();
    }
    function companyMemoryText() {
      const parts = [];
      if (COMPANY_MEMORY.guia.trim()) parts.push('Guía de estilo de la empresa (síguela siempre): ' + COMPANY_MEMORY.guia.trim());
      if (COMPANY_MEMORY.lecciones.length) parts.push('Lo que el equipo aprendió en proyectos anteriores:\n' + COMPANY_MEMORY.lecciones.map(l => '- ' + l.text).join('\n'));
      return parts.length ? '\n\nMEMORIA DE LA EMPRESA\n' + parts.join('\n') : '';
    }
    function setCompanyGuide(v) {
      COMPANY_MEMORY.guia = String(v || '').slice(0, 3000);
      saveCompanyMemory();
    }
    function removeLesson(i) {
      COMPANY_MEMORY.lecciones.splice(i, 1);
      saveCompanyMemory();
      renderPanel();
    }

    function cleanHtmlDoc(raw) {
      let html = String(raw || '').replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/i, '').trim();
      if (!/^<!doctype html|^<html/i.test(html)) {
        const i = html.search(/<!doctype html|<html/i);
        html = i >= 0 ? html.slice(i) : '';
      }
      if (html.length < 200 || !/<\/html>\s*$/i.test(html)) throw new Error('Código incompleto');
      return html.slice(0, 200000);
    }

    function codeForReview(p) {
      const c = String(p.code || '');
      return c.length > 60000 ? c.slice(0, 60000) + '\n<!-- (recortado para la revisión) -->' : c;
    }

    // Cualquier programador libre de la misma oficina (para corregir lo que encuentre QA)
    function pickDeveloper(p, exclude) {
      const zones = p.officeId === 'main' ? ['software', 'apps', 'games'] : [p.officeId + '_trabajo'];
      const pool = AGENTS.filter(a => a.type === 'AI' && !a.leaving && officeOf(a) === p.officeId && a !== exclude && zones.includes(a.homeZone));
      pool.sort((a, b) => ((b.profile && b.profile.skills && b.profile.skills.tecnica) || 5) - ((a.profile && a.profile.skills && a.profile.skills.tecnica) || 5));
      return pool[0] || exclude || null;
    }


    // ---------- Reintentos: el plan gratis de Gemini deja pocos pedidos por minuto ----------
    // Si la IA dice "límite alcanzado" o "saturada", el agente espera y lo vuelve a intentar.
    function aiIsBusy(err) {
      const st = err && (err.gemini !== undefined ? err.gemini : err.status);
      return [429, 500, 502, 503, 504].includes(Number(st));
    }
    async function teamRetry(fn) {
      const waits = [20000, 40000, 60000];
      for (let i = 0; ; i++) {
        try { return await fn(); } catch (err) {
          if (!aiIsBusy(err) || i >= waits.length) throw err;
          if (i === 0) showToast('⏳ La IA llegó a su límite por minuto: el equipo espera y reintenta.');
          await new Promise(r => setTimeout(r, waits[i]));
        }
      }
    }
    const teamJson = (...args) => teamRetry(() => aiJson(...args));
    const teamText = (...args) => teamRetry(() => aiTextReply(...args));

    // ---------- Esquemas de respuesta ----------
    const SPEC_SCHEMA = {
      type: 'object', additionalProperties: false,
      required: ['objetivo', 'publico', 'secciones', 'estilo', 'funciones', 'criterios', 'nota_equipo'],
      properties: {
        objetivo: { type: 'string' },
        publico: { type: 'string' },
        secciones: { type: 'array', items: { type: 'string' } },
        estilo: { type: 'string' },
        funciones: { type: 'array', items: { type: 'string' } },
        criterios: { type: 'array', items: { type: 'string' } },
        nota_equipo: { type: 'string' }
      }
    };
    const QA_SCHEMA = {
      type: 'object', additionalProperties: false,
      required: ['aprobado', 'problemas', 'resumen'],
      properties: {
        aprobado: { type: 'boolean' },
        problemas: {
          type: 'array',
          items: {
            type: 'object', additionalProperties: false, required: ['gravedad', 'descripcion'],
            properties: { gravedad: { type: 'string', enum: ['alta', 'media', 'baja'] }, descripcion: { type: 'string' } }
          }
        },
        resumen: { type: 'string' }
      }
    };
    const DELIVERY_SCHEMA = {
      type: 'object', additionalProperties: false,
      required: ['resumen_cliente', 'como_usar', 'siguientes_pasos'],
      properties: {
        resumen_cliente: { type: 'string' },
        como_usar: { type: 'array', items: { type: 'string' } },
        siguientes_pasos: { type: 'array', items: { type: 'string' } }
      }
    };

    // ---------- Trabajo de cada fase ----------
    async function teamPlan(p, a) {
      const spec = await teamJson(
        agentPersona(a) + '\nTu tarea: convertir el pedido del Director en una ficha clara para que el resto del equipo pueda trabajar sin dudas. Los criterios deben ser comprobables (3 a 6). En "nota_equipo" deja un mensaje corto para el programador.',
        [{ role: 'user', content: projectContext(p) }], SPEC_SCHEMA, 2500);
      teamOf(p).spec = spec;
      bumpStat(a, 'pasos');
      teamLog(p, a, 'plan', `Ficha lista: ${spec.objetivo}. ${spec.criterios.length} criterios de aceptación.`);
    }

    // ---------- Trabajo en paralelo: ayudantes que trabajan a la vez que el programador ----------
    const TEAM_HELPERS = new Set(); // ids de agentes ocupados como ayudantes
    const COPY_SCHEMA = {
      type: 'object', additionalProperties: false, required: ['titulo', 'eslogan', 'secciones', 'llamada_accion'],
      properties: {
        titulo: { type: 'string' }, eslogan: { type: 'string' }, llamada_accion: { type: 'string' },
        secciones: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['nombre', 'texto'], properties: { nombre: { type: 'string' }, texto: { type: 'string' } } } }
      }
    };
    const DESIGN_SCHEMA = {
      type: 'object', additionalProperties: false, required: ['paleta', 'tipografia', 'disposicion', 'componentes'],
      properties: {
        paleta: { type: 'array', items: { type: 'string' } }, tipografia: { type: 'string' },
        disposicion: { type: 'string' }, componentes: { type: 'array', items: { type: 'string' } }
      }
    };

    function agentBusy(a) {
      if (TEAM_HELPERS.has(a.id)) return true;
      return PROJECTS.some(o => (o.status === 'en_curso' || o.status === 'revision') && o.currentAgent === a.id);
    }

    // Igual que antes, pero sin elegir a quien ya está ayudando en otro proyecto
    pickAgentForStep = function (p, zoneId) {
      const busy = new Set(PROJECTS.filter(o => o !== p && (o.status === 'en_curso' || o.status === 'revision')).map(o => o.currentAgent));
      TEAM_HELPERS.forEach(id => busy.add(id));
      const pool = AGENTS.filter(a => a.type === 'AI' && !a.leaving && officeOf(a) === p.officeId &&
        !['onboarding', 'meeting'].includes(a.status) && !busy.has(a.id) &&
        a.homeZone !== 'cocina' && a.homeZone !== 'limpieza' && a.homeZone !== 'reception');
      // si hay trabajo, se llama también a quien está descansando (cuenta un poco menos)
      // quien revisa (QA) no debe ser quien escribió el código
      const reviewer = stepPhase(p, p.stepIndex) === 'qa' ? (p.team && p.team.lastBuilder) : null;
      const score = (a) => (a.homeZone === zoneId ? 100 : 0) + (a.rankIdx || 0) * 5 + a.energy / 20 + skillOf(a, 'tecnica') - (a.status === 'break' ? 15 : 0) - (reviewer && a.name === reviewer ? 200 : 0);
      pool.sort((a, b) => score(b) - score(a));
      return pool[0] || null;
    };

    function pickHelper(p, zones, exclude) {
      const want = p.officeId === 'main' ? zones : [p.officeId + '_trabajo', p.officeId + '_reuniones'];
      const pool = AGENTS.filter(a => a.type === 'AI' && !a.leaving && officeOf(a) === p.officeId && !exclude.has(a.id) &&
        !['onboarding', 'meeting'].includes(a.status) && !agentBusy(a) && want.includes(a.homeZone));
      pool.sort((x, y) => skillOf(y, 'creatividad') - skillOf(x, 'creatividad'));
      return pool[0] || null;
    }

    function holdHelper(p, a, bubble, task) {
      TEAM_HELPERS.add(a.id);
      a._schedBreak = false;
      a.breakMinUntil = 0;
      a.status = 'working';
      a.bubble = bubble;
      a.task = `${p.title}: ${task}`;
      a._kickoffUntil = 0;
      const where = isBigProject(p) ? BIG_ROOM : a.homeZone;
      a.currentZone = where;
      a.targetPos = getWaypointForZone(where, a.id);
      if (!p.authors.includes(a.name)) p.authors.push(a.name);
    }

    function freeHelper(a, bubble) {
      TEAM_HELPERS.delete(a.id);
      if (a.leaving) return;
      a.task = 'Trabajando en su estación';
      a.bubble = bubble;
      if (a.currentZone !== a.homeZone) {
        a.currentZone = a.homeZone;
        a.targetPos = getWaypointForZone(a.homeZone, a.id);
      }
    }

    // Antes de programar, redactor y diseñador trabajan A LA VEZ; luego el programador lo une todo
    async function teamParallelPrep(p, dev) {
      const t = teamOf(p);
      const exclude = new Set([dev.id]);
      const writer = pickHelper(p, ['help_desk', 'meeting'], exclude);
      if (writer) exclude.add(writer.id);
      const designer = pickHelper(p, ['apps', 'games'], exclude);
      const jobs = [];
      if (writer) {
        holdHelper(p, writer, '✍️ Escribiendo los textos', 'redactar los textos');
        jobs.push(teamJson(agentPersona(writer) + '\nEres quien redacta. Escribe los textos finales y reales (nada de "lorem ipsum") para cada sección de la ficha.',
          [{ role: 'user', content: projectContext(p) }], COPY_SCHEMA, 2500)
          .then(c => { t.copy = c; bumpStat(writer, 'pasos'); teamLog(p, writer, 'build', `Textos listos para ${c.secciones.length} secciones (en paralelo).`); })
          .catch(e => teamLog(p, writer, 'build', '⚠️ No pude escribir los textos: el programador los hará.'))
          .finally(() => freeHelper(writer, '✅ Textos entregados')));
      }
      if (designer) {
        holdHelper(p, designer, '🎨 Preparando el diseño', 'preparar la guía visual');
        jobs.push(teamJson(agentPersona(designer) + '\nEres quien diseña. Define la guía visual: paleta en hexadecimal (4-6 colores), tipografía (fuentes del sistema), disposición de la página y componentes.',
          [{ role: 'user', content: projectContext(p) }], DESIGN_SCHEMA, 1500)
          .then(d => { t.design = d; bumpStat(designer, 'pasos'); teamLog(p, designer, 'build', `Guía visual lista: ${d.paleta.slice(0, 4).join(' ')} (en paralelo).`); })
          .catch(e => teamLog(p, designer, 'build', '⚠️ No pude preparar el diseño: el programador lo decidirá.'))
          .finally(() => freeHelper(designer, '✅ Diseño entregado')));
      }
      if (!jobs.length) return;
      dev.bubble = '⏳ Esperando textos y diseño';
      teamLog(p, dev, 'build', `Repartí el trabajo: ${[writer && writer.name + ' (textos)', designer && designer.name + ' (diseño)'].filter(Boolean).join(' y ')} trabajan a la vez.`);
      await Promise.all(jobs);
      dev.bubble = '⌨️ Uniendo todo en el código';
    }

    async function teamBuild(p, a, issues) {
      const t = teamOf(p);
      if (!t.spec) await teamPlan(p, a); // por si el plan falló o se saltó
      if (!t.built && !(issues && issues.length)) await teamParallelPrep(p, a);
      const lvl = seniority(a);
      const system = agentPersona(a) + `
Eres quien programa. Responde SOLO con un documento HTML completo de un único archivo (CSS y JavaScript en línea), sin explicaciones y sin bloques de markdown.
Requisitos: funciona dentro de un iframe con sandbox="allow-scripts" (protege localStorage con try/catch), sin recursos externos ni CDN, textos en el idioma que indique la ficha (español si no dice nada), diseño moderno y adaptable a móvil. Cumple TODOS los criterios de la ficha.
OBLIGATORIO SIEMPRE: pie de página con enlaces a Política de Privacidad, Términos y Condiciones y Política de Cookies (cada uno abre su texto completo en un modal o sección, adaptado al proyecto), "© <año> <nombre del proyecto>. Todos los derechos reservados" y el crédito "Desarrollado por ${BRAND}".`;
      let user = projectContext(p);
      if (issues && issues.length && t.built) {
        user += '\n\nQA encontró estos problemas. Corrígelos todos y devuelve el documento completo corregido:\n' +
          issues.map(x => `- [${x.gravedad}] ${x.descripcion}`).join('\n') + '\n\nCódigo actual:\n' + codeForReview(p);
      } else if (t.feedback && t.built) {
        user += '\n\nAplica los ajustes del Director sobre este código y devuelve el documento completo:\n' + codeForReview(p);
      }
      const maxTokens = AI.engine === 'gemini' ? 32000 : lvl === 'junior' ? 10000 : 16000;
      const raw = await teamText(system, [{ role: 'user', content: user }], { maxTokens, effort: SENIORITY_EFFORT[lvl] });
      p.code = ensureLegalAndCredits(cleanHtmlDoc(raw), p);
      p.codeSource = 'IA';
      t.built = true;
      t.lastBuilder = a.name;
      bumpStat(a, 'codigos');
      if (!p.authors.includes(a.name)) p.authors.push(a.name);
      teamLog(p, a, 'build', issues && issues.length ? (issues.every(x => /^\[Seguridad\]/.test(x.descripcion)) ? `Arreglé ${issues.length} riesgo(s) de seguridad.` : `Corregí ${issues.length} problema(s) que encontró QA.`) : `Escribí el código (${(p.code.length / 1024).toFixed(1)} KB) siguiendo la ficha.`);
    }

    async function teamQa(p, a) {
      const t = teamOf(p);
      if (!t.built) await teamBuild(p, pickDeveloper(p, null) || a);
      // Un tester con más nivel revisa más a fondo y pide más rondas de corrección
      const qaLvl = seniority(a);
      const rounds = qaLvl === 'senior' ? TEAM_MAX_QA_ROUNDS + 1 : qaLvl === 'semi' ? TEAM_MAX_QA_ROUNDS : 1;
      const depth = qaLvl === 'senior'
        ? ' Revisa a fondo: prueba mentalmente cada botón y formulario, casos límite, errores de consola, contraste y uso en pantallas pequeñas.'
        : qaLvl === 'junior' ? ' Haces una revisión rápida de lo más visible.' : '';
      for (let round = 1; round <= rounds; round++) {
        const qa = await teamJson(
          agentPersona(a) + '\nEres quien prueba la calidad. Revisa el código contra la ficha y los criterios de aceptación. Busca errores de JavaScript, funciones que faltan, textos de relleno, problemas en móvil y de accesibilidad. Comprueba también que el pie tenga Política de Privacidad, Términos y Condiciones y Política de Cookies (enlaces que abren su texto) y el crédito "Desarrollado por ${BRAND}"; si falta algo, es un problema de gravedad alta. Apruébalo solo si cumple los criterios y no tiene problemas de gravedad alta o media.' + depth,
          [{ role: 'user', content: projectContext(p) + '\n\nCódigo a revisar:\n' + codeForReview(p) }], QA_SCHEMA, 2500);
        t.qa = qa;
        teamLog(p, a, 'qa', (qa.aprobado ? '✅ Aprobado. ' : `❌ ${qa.problemas.length} problema(s). `) + qa.resumen);
        const serious = qa.problemas.filter(x => x.gravedad !== 'baja');
        const builder = AGENTS.find(x => x.name === t.lastBuilder);
        bumpStat(a, 'pasos');
        if (serious.length) { bumpStat(a, 'fallosEncontrados', serious.length); bumpStat(builder, 'fallosCausados', serious.length); }
        else if (round === 1 && builder) { bumpStat(builder, 'primera'); grantXp(builder, 15); }
        if (qa.aprobado || !serious.length || round === rounds) return;
        const dev = pickDeveloper(p, a);
        if (dev) dev.bubble = '🔧 Corrigiendo lo de QA';
        a.bubble = '⏳ Esperando la corrección';
        await teamBuild(p, dev || a, qa.problemas);
        a.bubble = '🧪 Revisando otra vez';
      }
    }

    async function teamDeliver(p, a) {
      const d = await teamJson(
        agentPersona(a) + '\nPrepara la entrega para el cliente: un resumen claro de lo que se hizo, cómo usarlo (pasos cortos) y siguientes pasos recomendados. Sé honesto si QA dejó algo pendiente.',
        [{ role: 'user', content: projectContext(p) + '\n\nResultado de QA: ' + JSON.stringify(teamOf(p).qa || { resumen: 'sin revisión' }) + (teamOf(p).security ? '\nMenciona al cliente que el proyecto pasó una revisión de ciberseguridad.' : '') }], DELIVERY_SCHEMA, 1500);
      teamOf(p).delivery = d;
      bumpStat(a, 'entregas');
      teamLog(p, a, 'entrega', d.resumen_cliente);
    }

    // QA y, justo después, la revisión de ciberseguridad (teamSecurity, más abajo)
    const TEAM_PHASES = { plan: teamPlan, build: teamBuild, qa: async (p, a) => { await teamQa(p, a); await teamSecurity(p, a); }, entrega: teamDeliver };
    const PHASE_LABEL = { plan: '🗂️ Plan', build: '⌨️ Código', qa: '🧪 QA', seguridad: '🛡️ Seguridad', entrega: '📨 Entrega', sala: '🏢 Sala' };

    function startTeamJob(p, a) {
      const key = p.stepIndex + ':' + (teamOf(p).round || 0);
      const cur = TEAM.jobs[p.id];
      if (cur && cur.key === key) return cur;
      const phase = stepPhase(p, p.stepIndex);
      const job = { key, phase, done: false, error: null };
      TEAM.jobs[p.id] = job;
      p.note = `${PHASE_LABEL[phase]}: ${a.name} está trabajando…`;
      TEAM_PHASES[phase](p, a).catch(err => {
        console.warn('Trabajo en equipo', phase, err);
        job.error = err;
        teamLog(p, a, phase, '⚠️ No pude terminar con la IA: ' + (typeof aiErrorMessage === 'function' ? aiErrorMessage(err) : String(err)) + ' Sigo con lo que hay.');
      }).finally(() => {
        job.done = true;
        if (findProject(p.id)) {
          p.note = '';
          saveProjects();
          if (typeof WORK_VIEW !== 'undefined' && WORK_VIEW.projectId === p.id) renderWorkView();
          if (activeTab === 'projects' || activeTab === 'operations') renderPanel();
        }
      });
      return job;
    }

    // ---------- Enganches con la oficina existente ----------
    // Con IA, el código ya no se escribe de golpe al crear el proyecto: lo hace el equipo.
    // ---------- Legal y créditos: obligatorio en todo lo que se crea ----------
    // Si la IA (o el generador local) se olvida, la oficina añade el pie con los avisos legales
    // y el crédito de la empresa antes de </body>.
    function ensureLegalAndCredits(html, p) {
      let code = String(html || '');
      if (!/<\/body>/i.test(code)) return code;
      const hasPrivacy = /pol[ií]tica de privacidad|privacy policy/i.test(code);
      const hasTerms = /t[ée]rminos y condiciones|terms (and|&) conditions|terms of (use|service)/i.test(code);
      const hasCookies = /pol[ií]tica de cookies|cookie policy/i.test(code);
      const hasCredit = new RegExp('(desarrollado|hecho|creado|developed|made|built)[^<]{0,20}(por|by)[^<]{0,40}' + BRAND.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(code);
      if (hasPrivacy && hasTerms && hasCookies && hasCredit) return code;
      const site = String((p && p.title) || BRAND).replace(/^[^"“]*["“]|["”].*$/g, '').replace(/[<>&"'`]/g, '').trim() || BRAND;
      const year = new Date().getFullYear();
      const texts = {
        privacidad: ['Política de Privacidad', `En ${site} respetamos tu privacidad. Solo recogemos los datos que nos das voluntariamente (por ejemplo, en el formulario de contacto: nombre, correo o teléfono) para responderte y prestarte nuestros servicios. No vendemos ni cedemos tus datos a terceros, salvo obligación legal. Puedes pedir en cualquier momento ver, corregir o borrar tus datos escribiéndonos por los medios de contacto de esta página. Guardamos los datos solo el tiempo necesario y con medidas de seguridad razonables.`],
        terminos: ['Términos y Condiciones', `Al usar ${site} aceptas estos términos. El contenido es informativo y puede cambiar sin previo aviso. Los precios, horarios y disponibilidad se confirman al contactar. No se permite copiar ni usar el contenido, el diseño o las marcas sin permiso. No nos hacemos responsables del mal uso del sitio ni de enlaces a páginas de terceros. Si tienes dudas, contáctanos.`],
        cookies: ['Política de Cookies', `${site} puede usar cookies o almacenamiento local del navegador para que el sitio funcione bien y recordar tus preferencias. No usamos cookies para venderte publicidad sin tu permiso. Puedes borrar o bloquear las cookies desde la configuración de tu navegador; algunas funciones podrían dejar de funcionar.`]
      };
      const links = [];
      if (!hasPrivacy) links.push('privacidad');
      if (!hasTerms) links.push('terminos');
      if (!hasCookies) links.push('cookies');
      const block = `
<!-- Avisos legales y créditos añadidos por ${BRAND} -->
<footer id="frp-legal" style="font:13px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#1c1410;color:#e7d9cc;padding:18px 16px;text-align:center;border-top:3px solid #b8743a">
  ${links.length ? `<nav style="display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:center;margin-bottom:8px">${links.map(k => `<a href="#" data-frp-legal="${k}" style="color:#f0b27a;text-decoration:underline">${texts[k][0]}</a>`).join('')}</nav>` : ''}
  <div>© ${year} ${site}. Todos los derechos reservados.</div>
  ${hasCredit ? '' : `<div style="margin-top:4px;opacity:.85">Desarrollado por <strong style="color:#f0b27a">${BRAND}</strong></div>`}
</footer>
${links.length ? `<div id="frp-legal-modal" role="dialog" aria-modal="true" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;align-items:center;justify-content:center;padding:16px">
  <div style="background:#fff;color:#222;max-width:560px;width:100%;max-height:80vh;overflow:auto;border-radius:14px;padding:20px;font:15px/1.6 system-ui,sans-serif">
    <h2 id="frp-legal-title" style="margin:0 0 10px;font-size:20px"></h2><p id="frp-legal-text" style="margin:0 0 16px"></p>
    <button type="button" id="frp-legal-close" style="background:#b8743a;color:#fff;border:0;border-radius:8px;padding:8px 16px;cursor:pointer">Cerrar</button>
  </div>
</div>
<script>(function(){var T=${JSON.stringify(texts).replace(/</g, '\\u003c')};var m=document.getElementById('frp-legal-modal');
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-frp-legal]');if(a){e.preventDefault();var t=T[a.getAttribute('data-frp-legal')];document.getElementById('frp-legal-title').textContent=t[0];document.getElementById('frp-legal-text').textContent=t[1];m.style.display='flex';}
if(e.target===m||e.target.id==='frp-legal-close')m.style.display='none';});})();</script>` : ''}
`;
      const i = code.search(/<\/body>(?![\s\S]*<\/body>)/i);
      return code.slice(0, i) + block + code.slice(i);
    }

    // El generador local también lo incluye
    const _baseGenerateProjectCode = generateProjectCode;
    generateProjectCode = function (p) {
      return ensureLegalAndCredits(_baseGenerateProjectCode(p), p);
    };
    const _baseAiGenerateProjectCode = aiGenerateProjectCode;
    aiGenerateProjectCode = async function (p) {
      return ensureLegalAndCredits(await _baseAiGenerateProjectCode(p), p);
    };

    const _basePrepareProjectCode = prepareProjectCode;
    prepareProjectCode = function (p) {
      if (!p || p.code) return;
      if (!teamworkOn()) return _basePrepareProjectCode(p);
      p.code = generateProjectCode(p); // borrador local mientras el equipo trabaja
      p.codeSource = 'plantilla';
      teamOf(p);
    };

    // El paso no termina hasta que el agente acaba su trabajo real
    const _baseProjectTick = projectTick;
    projectTick = function () {
      if (teamworkOn()) {
        for (const p of PROJECTS) {
          if (p.status !== 'en_curso') continue;
          const a = projectAgent(p);
          if (!a || a.leaving || !isAgentArrived(a)) continue;
          const job = startTeamJob(p, a);
          if (!job.done) p.stepProgress = Math.min(p.stepProgress, PROJECT_STEP_MS - 500 * rankSpeedFactor(a) - 1);
        }
      } else if (!TEAM.hinted && PROJECTS.some(p => p.status === 'en_curso')) {
        TEAM.hinted = true;
        showToast('💡 Conecta una IA en ⚙ del asistente para que el equipo trabaje de verdad (plan, código, QA y entrega).');
      }
      _baseProjectTick();
    };

    // Pedir ajustes: tus comentarios vuelven al programador, luego QA y entrega
    const _baseDisapproveProject = disapproveProject;
    disapproveProject = function (id, feedback) {
      const p = findProject(id);
      if (!p) return;
      if (p.status !== 'revision' || !teamworkOn()) return _baseDisapproveProject(id);
      const box = document.getElementById('team-feedback');
      const fb = String(feedback || (box && box.value) || '').trim().slice(0, 600);
      const t = teamOf(p);
      t.feedback = fb || 'Revisa todo el trabajo y sube la calidad: más pulido, menos texto de relleno y sin errores.';
      t.round = (t.round || 0) + 1;
      t.qa = null;
      t.security = null;
      t.delivery = null;
      const buildIdx = p.steps.findIndex((s, i) => stepPhase(p, i) === 'build');
      releaseAgent(p, '🔁 Haciendo ajustes');
      p.status = 'en_curso';
      p.stepIndex = buildIdx >= 0 ? buildIdx : Math.max(0, p.steps.length - 1);
      p.stepProgress = 0;
      teamLog(p, null, 'ajuste', 'El Director pidió ajustes: ' + t.feedback);
      assignStep(p);
      pushActivity(`Pediste ajustes en "${p.title}": vuelve al equipo.`, 'AJUSTE');
      showToast(`↺ Ajustes enviados al equipo: ${p.title}`);
      afterProjectChange();
    };

    // La entrega lleva el resumen real del equipo
    const _baseCreateDeliverable = createDeliverableFromProject;
    createDeliverableFromProject = function (p) {
      _baseCreateDeliverable(p);
      const t = p.team;
      const d = DELIVERABLES[0];
      if (!t || !d || d.projectId !== p.id) return;
      if (t.delivery) {
        d.summary = String(t.delivery.resumen_cliente).slice(0, 400);
        d.body = ('Cómo usarlo: ' + t.delivery.como_usar.join(' · ') + ' — Siguientes pasos: ' + t.delivery.siguientes_pasos.join(' · ')).slice(0, 800);
      }
      if (t.qa) d.metrics[1] = { label: 'QA', value: t.qa.aprobado ? 'Aprobado' : `${t.qa.problemas.length} pendiente(s)`, positive: true };
      if (t.security) d.metrics.push({ label: 'Seguridad', value: t.security.seguro ? 'Revisada' : `${t.security.riesgos.length} riesgo(s)`, positive: true });
      saveDeliverables();
    };

    // Al recargar, se recupera la bitácora y la ficha de cada proyecto
    const _baseRestoreProjects = restoreProjects;
    restoreProjects = function () {
      let saved = [];
      try { saved = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]'); } catch (e) { saved = []; }
      _baseRestoreProjects();
      if (!Array.isArray(saved)) return;
      const str = (v, n) => String(v == null ? '' : v).slice(0, n);
      const strList = (l, n) => Array.isArray(l) ? l.slice(0, 12).map(x => str(x, n)) : [];
      saved.forEach(raw => {
        const pb = raw && findProject(raw.id);
        if (pb && typeof raw.big === 'boolean') pb.big = raw.big;
        const p = raw && raw.team && findProject(raw.id);
        if (!p) return;
        const r = raw.team;
        const t = teamOf(p);
        t.built = !!r.built;
        t.lastBuilder = str(r.lastBuilder, 40);
        if (r.copy && typeof r.copy === 'object') t.copy = {
          titulo: str(r.copy.titulo, 120), eslogan: str(r.copy.eslogan, 200), llamada_accion: str(r.copy.llamada_accion, 120),
          secciones: Array.isArray(r.copy.secciones) ? r.copy.secciones.slice(0, 12).map(x => ({ nombre: str(x && x.nombre, 60), texto: str(x && x.texto, 800) })) : []
        };
        if (r.design && typeof r.design === 'object') t.design = {
          paleta: strList(r.design.paleta, 20), tipografia: str(r.design.tipografia, 120), disposicion: str(r.design.disposicion, 400), componentes: strList(r.design.componentes, 120)
        };
        t.round = Math.max(0, Math.min(20, Number(r.round) || 0));
        t.feedback = str(r.feedback, 600);
        if (r.spec && typeof r.spec === 'object') t.spec = {
          objetivo: str(r.spec.objetivo, 400), publico: str(r.spec.publico, 200), estilo: str(r.spec.estilo, 300),
          secciones: strList(r.spec.secciones, 160), funciones: strList(r.spec.funciones, 160), criterios: strList(r.spec.criterios, 200), nota_equipo: str(r.spec.nota_equipo, 300)
        };
        if (r.qa && typeof r.qa === 'object') t.qa = {
          aprobado: !!r.qa.aprobado, resumen: str(r.qa.resumen, 400),
          problemas: Array.isArray(r.qa.problemas) ? r.qa.problemas.slice(0, 12).map(x => ({ gravedad: ['alta', 'media', 'baja'].includes(x && x.gravedad) ? x.gravedad : 'media', descripcion: str(x && x.descripcion, 300) })) : []
        };
        if (r.security && typeof r.security === 'object') t.security = {
          seguro: !!r.security.seguro, resumen: str(r.security.resumen, 400), por: str(r.security.por, 40),
          riesgos: Array.isArray(r.security.riesgos) ? r.security.riesgos.slice(0, 12).map(x => ({ gravedad: ['alta', 'media', 'baja'].includes(x && x.gravedad) ? x.gravedad : 'media', descripcion: str(x && x.descripcion, 300), arreglo: str(x && x.arreglo, 300) })) : []
        };
        if (r.delivery && typeof r.delivery === 'object') t.delivery = {
          resumen_cliente: str(r.delivery.resumen_cliente, 600), como_usar: strList(r.delivery.como_usar, 200), siguientes_pasos: strList(r.delivery.siguientes_pasos, 200)
        };
        t.log = Array.isArray(r.log) ? r.log.slice(-30).map(e => ({ at: Number(e && e.at) || 0, phase: str(e && e.phase, 12), agent: str(e && e.agent, 40), role: str(e && e.role, 40), text: str(e && e.text, 600) })) : [];
      });
    };

    // ---------- Interfaz ----------
    function teamLogHtml(p, max) {
      const log = (p.team && p.team.log) || [];
      if (!log.length) return '';
      return log.slice(-max).map(e => `
        <div class="text-[10px] leading-snug"><span class="text-slate-500">${PHASE_LABEL[e.phase] || '↺ Ajuste'}</span>
          <span class="text-slate-200 font-semibold">${escapeHtml(e.agent)}</span>${e.role ? `<span class="text-slate-500"> · ${escapeHtml(e.role)}</span>` : ''}:
          <span class="text-slate-300">${escapeHtml(e.text)}</span></div>`).join('');
    }

    const _baseProjectCardHtml = projectCardHtml;
    projectCardHtml = function (p) {
      const html = _baseProjectCardHtml(p);
      const log = teamLogHtml(p, 2);
      if (!log) return html;
      const i = html.lastIndexOf('<div class="flex flex-wrap gap-1.5 pt-0.5">');
      const block = `<div class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">${log}</div>`;
      return i < 0 ? html : html.slice(0, i) + block + html.slice(i);
    };

    const _baseRenderWorkView = renderWorkView;
    renderWorkView = function (force = true) {
      // la vista se refresca cada segundo: conserva lo que estés escribiendo
      const prevBox = document.getElementById('team-feedback');
      const typed = prevBox ? prevBox.value : null;
      const focused = prevBox && document.activeElement === prevBox;
      const caret = prevBox ? prevBox.selectionStart : 0;
      _baseRenderWorkView(force);
      const restore = () => {
        const nb = document.getElementById('team-feedback');
        if (!nb || typed === null) return;
        nb.value = typed;
        if (focused) { nb.focus(); try { nb.setSelectionRange(caret, caret); } catch (e) { /* sin selección */ } }
      };
      setTimeout(restore, 0);
      if (WORK_VIEW.tab !== 'info' || !WORK_VIEW.projectId) return;
      const p = findProject(WORK_VIEW.projectId);
      const box = document.getElementById('modal-content');
      if (!p || !box || !p.team) return;
      const t = p.team;
      const list = (arr) => `<ul class="list-disc pl-4 space-y-0.5">${arr.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
      let extra = '';
      if (t.spec) extra += `
        <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
          <div class="text-xs font-semibold text-white">🗂️ Ficha del proyecto</div>
          <div><b>Objetivo:</b> ${escapeHtml(t.spec.objetivo)}</div>
          <div><b>Público:</b> ${escapeHtml(t.spec.publico)} · <b>Estilo:</b> ${escapeHtml(t.spec.estilo)}</div>
          <div><b>Criterios de aceptación:</b>${list(t.spec.criterios)}</div>
        </div>`;
      if (t.qa) extra += `
        <div class="p-3 rounded-xl bg-slate-900/80 border ${t.qa.aprobado ? 'border-emerald-500/40' : 'border-amber-500/40'} text-[11px] text-slate-300 space-y-1">
          <div class="text-xs font-semibold text-white">🧪 Informe de QA: ${t.qa.aprobado ? 'aprobado' : 'con pendientes'}</div>
          <div>${escapeHtml(t.qa.resumen)}</div>
          ${t.qa.problemas.length ? list(t.qa.problemas.map(x => `[${x.gravedad}] ${x.descripcion}`)) : ''}
        </div>`;
      if (t.security) extra += `
        <div class="p-3 rounded-xl bg-slate-900/80 border ${t.security.seguro ? 'border-emerald-500/40' : 'border-rose-500/40'} text-[11px] text-slate-300 space-y-1">
          <div class="text-xs font-semibold text-white">🛡️ Ciberseguridad: ${t.security.seguro ? 'sin riesgos graves' : 'con riesgos pendientes'}${t.security.por ? ` · ${escapeHtml(t.security.por)}` : ''}</div>
          <div>${escapeHtml(t.security.resumen)}</div>
          ${t.security.riesgos.length ? list(t.security.riesgos.map(x => `[${x.gravedad}] ${x.descripcion}${x.arreglo ? ' → ' + x.arreglo : ''}`)) : ''}
        </div>`;
      if (t.delivery) extra += `
        <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
          <div class="text-xs font-semibold text-white">📨 Entrega para el cliente</div>
          <div>${escapeHtml(t.delivery.resumen_cliente)}</div>
          <div><b>Cómo usarlo:</b>${list(t.delivery.como_usar)}</div>
        </div>`;
      const log = teamLogHtml(p, 30);
      if (log) extra += `<div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 max-h-48 overflow-y-auto"><div class="text-xs font-semibold text-white">🧠 Bitácora del equipo</div>${log}</div>`;
      if (p.status === 'revision' && teamworkOn()) extra += `
        <textarea id="team-feedback" rows="2" maxlength="600" placeholder="Si pides ajustes, escribe qué quieres cambiar (ej.: pon el menú arriba y usa colores azules)"
          class="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-400"></textarea>`;
      if (!extra) return;
      const space = box.querySelector(':scope > .space-y-2');
      (space || box).insertAdjacentHTML('beforeend', extra);
    };

    // ---------- Memoria: el equipo aprende de cada entrega que apruebas ----------
    const _baseApproveProject = approveProject;
    approveProject = function (id) {
      const p = findProject(id);
      const wasReview = p && p.status === 'revision';
      _baseApproveProject(id);
      if (!wasReview || !p || p.status !== 'terminado' || !p.team) return;
      const t = p.team;
      const title = p.title.replace(/["“”]/g, '');
      if (t.feedback) addLesson(`En ${title} el Director pidió: ${t.feedback}`);
      if (t.spec && t.spec.estilo) addLesson(`Estilo aprobado en ${title}: ${t.spec.estilo}`);
      if (t.design && t.design.paleta && t.design.paleta.length) addLesson(`Paleta aprobada en ${title}: ${t.design.paleta.slice(0, 5).join(', ')}`);
      if (t.qa && t.qa.problemas && t.qa.problemas.length) addLesson(`Para no repetir: ${t.qa.problemas.slice(0, 2).map(x => x.descripcion).join('; ')}`);
      AGENTS.filter(x => p.authors.includes(x.name)).forEach(x => bumpStat(x, 'proyectos'));
    };

    // Mantiene lo que escribes cuando el panel se refresca solo
    function keepTyping(id, render) {
      const ids = Array.isArray(id) ? id : [id];
      const act = document.activeElement;
      const focusedId = act && ids.includes(act.id) ? act.id : null;
      const caret = focusedId ? act.selectionStart : 0;
      render();
      if (!focusedId) return;
      const nb = document.getElementById(focusedId);
      if (nb) { nb.focus(); try { nb.setSelectionRange(caret, caret); } catch (e) { /* sin selección */ } }
    }

    function companyMemoryHtml() {
      const lessons = COMPANY_MEMORY.lecciones.slice().reverse();
      return `
        <details class="p-3 rounded-xl bg-slate-900/85 border border-slate-800 space-y-2" ${TEAM.memoryOpen ? 'open' : ''} ontoggle="TEAM.memoryOpen = this.open">
          <summary class="text-xs font-semibold text-white cursor-pointer">🧠 Memoria de la empresa <span class="text-[10px] font-normal text-slate-400">· ${lessons.length} lecciones</span></summary>
          <div class="flex items-center gap-2"><p class="flex-1 text-[10px] text-slate-400">Todo el equipo lee esto antes de trabajar. Escribe cómo quieres que sea todo lo que entrega ${escapeHtml(BRAND)}.</p>
            <button onclick="resetCompanyGuide()" class="shrink-0 px-2 py-0.5 rounded-md text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">↺ Guía original</button></div>
          <textarea id="company-guide" rows="8" maxlength="3000" oninput="setCompanyGuide(this.value)"
            placeholder="Ej.: Siempre en español, estilo moderno y oscuro, logo de FRPROGRAMITY arriba, botón de WhatsApp para contactar…"
            class="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-400">${escapeHtml(COMPANY_MEMORY.guia)}</textarea>
          ${lessons.length ? `<div class="space-y-1">${lessons.map((l, k) => `
            <div class="flex items-start gap-2 text-[10px] text-slate-300"><span class="flex-1">📌 ${escapeHtml(l.text)}</span>
              <button onclick="removeLesson(${COMPANY_MEMORY.lecciones.length - 1 - k})" title="Olvidar" class="text-slate-500 hover:text-rose-300">✕</button></div>`).join('')}</div>`
            : '<p class="text-[10px] text-slate-500">Cuando apruebes entregas, el equipo guardará aquí lo que aprendió.</p>'}
        </details>`;
    }

    const _baseRenderProjectsTab = renderProjectsTab;
    renderProjectsTab = function (container) {
      keepTyping(['company-guide', 'quote-client', 'quote-text'], () => {
        _baseRenderProjectsTab(container);
        container.insertAdjacentHTML('afterbegin', `<div class="mb-2 space-y-2">${companyMemoryHtml()}${typeof quotesBoxHtml === 'function' ? quotesBoxHtml() : ''}</div>`);
      });
    };

    // ---------- Recepción inteligente: contrata lo que el equipo necesita ----------
    function teamNeeds() {
      const team = AGENTS.filter(a => a.type === 'AI' && !a.leaving && officeOf(a) === 'main');
      const count = {};
      team.forEach(a => { count[a.homeZone] = (count[a.homeZone] || 0) + 1; });
      const needs = [];
      const name = (z) => (ZONES[z] && ZONES[z].name) || z;
      const has = (z) => ROLE_CATALOG[z] && ZONES[z];
      if (has('qa_lab') && !count.qa_lab) needs.push({ zone: 'qa_lab', weight: 5, reason: `No hay nadie en ${name('qa_lab')}: nadie revisa el código antes de entregarlo.` });
      if (has('software') && (count.software || 0) < 2) needs.push({ zone: 'software', weight: 4, reason: `Solo ${count.software || 0} programador(es) en ${name('software')}: los proyectos se atascan esperando.` });
      if (has('apps') && !count.apps) needs.push({ zone: 'apps', weight: 3, reason: `No hay diseñador en ${name('apps')}: nadie prepara el diseño en paralelo.` });
      if (has('help_desk') && !count.help_desk) needs.push({ zone: 'help_desk', weight: 2, reason: `No hay redactor en ${name('help_desk')}: el programador escribe también los textos.` });
      // ¿Los programadores causan muchos fallos? → hace falta más nivel
      const devs = team.filter(a => ['software', 'apps', 'games'].includes(a.homeZone));
      const causados = devs.reduce((s, a) => s + (Number(statOf(a.name).fallosCausados) || 0), 0);
      const codigos = devs.reduce((s, a) => s + (Number(statOf(a.name).codigos) || 0), 0);
      if (codigos >= 3 && causados / codigos >= 1.5 && has('software')) needs.push({ zone: 'software', weight: 4, senior: true, reason: `QA encuentra ${(causados / codigos).toFixed(1)} fallos por cada código: conviene un programador senior.` });
      // ¿Hay proyectos esperando personal?
      const waiting = PROJECTS.filter(p => p.status === 'en_curso' && p.note === 'Esperando personal disponible').length;
      if (waiting) needs.push({ zone: 'software', weight: 3, reason: `${waiting} proyecto(s) parados esperando personal libre.` });
      const merged = {};
      needs.forEach(n => { if (!merged[n.zone]) merged[n.zone] = { ...n, reasons: [n.reason] }; else { merged[n.zone].weight += n.weight; merged[n.zone].reasons.push(n.reason); merged[n.zone].senior = merged[n.zone].senior || n.senior; } });
      return Object.values(merged).sort((x, y) => y.weight - x.weight);
    }

    // 7 de cada 10 candidatos llegan para el puesto que más falta
    const _basePickCandidateZone = pickCandidateZone;
    pickCandidateZone = function () {
      const needs = teamNeeds();
      if (!needs.length || Math.random() > 0.7) return _basePickCandidateZone();
      let r = Math.random() * needs.reduce((s, n) => s + n.weight, 0);
      for (const n of needs) { r -= n.weight; if (r <= 0) return n.zone; }
      return needs[0].zone;
    };

    // Si falta nivel, los candidatos de ese puesto vienen algo más preparados
    const _baseGenerateCandidate = generateCandidate;
    generateCandidate = function () {
      const c = _baseGenerateCandidate();
      const need = teamNeeds().find(n => n.senior && c.cand && n.zone === c.cand.zone);
      if (need && c.cand && c.cand.skills && Math.random() < 0.6) {
        c.cand.skills.tecnica = Math.min(10, c.cand.skills.tecnica + 2);
      }
      return c;
    };

    function teamReportHtml() {
      const needs = teamNeeds();
      const team = AGENTS.filter(a => a.type === 'AI' && !a.leaving && officeOf(a) === 'main');
      const rows = team.map(a => ({ a, s: statOf(a.name) })).filter(r => r.s.pasos || r.s.codigos).sort((x, y) => (y.s.pasos + y.s.codigos) - (x.s.pasos + x.s.codigos)).slice(0, 8);
      return `
        <div class="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/40 space-y-2 mb-2">
          <div class="text-xs font-semibold text-white">🧭 Lo que necesita el equipo</div>
          ${needs.length ? needs.slice(0, 3).map(n => `
            <div class="text-[11px] text-slate-200"><b class="text-cyan-200">${escapeHtml((ZONES[n.zone] || {}).name || n.zone)}${n.senior ? ' (senior)' : ''}</b>: ${escapeHtml(n.reasons[0])}</div>`).join('')
            : '<div class="text-[11px] text-emerald-300">El equipo está equilibrado. Contrata a quien tenga mejores habilidades.</div>'}
          ${needs.length ? '<p class="text-[10px] text-slate-400">La recepción trae más candidatos para estos puestos.</p>' : ''}
          ${rows.length ? `
            <div class="text-[10px] text-slate-300 space-y-0.5 pt-1 border-t border-slate-800">
              <div class="grid grid-cols-5 gap-1 text-slate-500"><span class="col-span-2">Agente</span><span>Pasos</span><span>A la 1.ª</span><span>Fallos</span></div>
              ${rows.map(({ a, s }) => `<div class="grid grid-cols-5 gap-1"><span class="col-span-2 truncate">${escapeHtml(a.name)} <span class="text-slate-500">${SENIORITY_LABEL[seniority(a)]}</span></span><span>${(s.pasos || 0) + (s.codigos || 0)}</span><span class="text-emerald-300">${s.primera || 0}</span><span class="text-rose-300">${s.fallosCausados || 0}</span></div>`).join('')}
            </div>` : ''}
        </div>`;
    }

    const _baseRenderRecruitTab = renderRecruitTab;
    renderRecruitTab = function (container) {
      _baseRenderRecruitTab(container);
      if (ACTIVE_OFFICE === 'main') container.insertAdjacentHTML('afterbegin', teamReportHtml());
    };

    // Quien ayuda en un proyecto tampoco se va a descansar a mitad del trabajo
    isMissionAgent = function (agent) {
      return isProjectAgent(agent) || TEAM_HELPERS.has(agent.id);
    };

    // ---------- Proyectos grandes: el equipo se reúne en la Sala de Programación ----------
    // Un proyecto es "grande" si es de software, si el pedido es largo o si dice que es
    // importante / para la empresa. También lo puedes marcar tú en su tarjeta.
    const BIG_ROOM = 'programacion';
    const BIG_WORDS = /\b(grande|important[ea]s?|para la empresa|frprogramity|plataforma|crm|sistema completo|sistema administrativo)\b/i;

    function isBigProject(p) {
      if (!p || p.officeId !== 'main' || !ZONES[BIG_ROOM]) return false;
      if (typeof p.big === 'boolean') return p.big;
      return p.template === 'crear_software' || String(p.brief || '').length >= 250 || BIG_WORDS.test(p.title + ' ' + (p.brief || ''));
    }

    function toggleBigProject(id) {
      const p = findProject(id);
      if (!p || p.officeId !== 'main') return;
      p.big = !isBigProject(p);
      const a = projectAgent(p);
      if (a && p.status === 'en_curso') {
        const where = p.big ? BIG_ROOM : resolveZone(p.officeId, p.steps[Math.min(p.stepIndex, p.steps.length - 1)].zone);
        a.currentZone = where;
        a.targetPos = getWaypointForZone(where, a.id);
      }
      if (p.big && p.status === 'en_curso') kickoffMeeting(p);
      showToast(p.big ? `🏢 "${p.title}" se trabaja en la Sala de Programación` : `"${p.title}" vuelve a las salas de cada área`);
      afterProjectChange();
    }

    // El agente de cada paso trabaja en la sala grande
    const _baseAssignStep = assignStep;
    assignStep = function (p) {
      const prev = projectAgent(p);
      _baseAssignStep(p);
      const a = projectAgent(p);
      // quien terminó su paso vuelve a su puesto si no tiene otra tarea
      if (prev && prev !== a && !prev.leaving && !agentBusy(prev) && prev.currentZone !== prev.homeZone && prev.status !== 'break') {
        prev.currentZone = prev.homeZone;
        prev.targetPos = getWaypointForZone(prev.homeZone, prev.id);
        prev.task = 'Trabajando en su estación';
      }
      if (!a || !isBigProject(p)) return;
      a._kickoffUntil = 0;
      a.currentZone = BIG_ROOM;
      a.targetPos = getWaypointForZone(BIG_ROOM, a.id);
    };

    // Reunión de arranque: el equipo libre se junta en la sala para conocer el proyecto
    function kickoffMeeting(p) {
      const until = performance.now() + 35000;
      const work = ['games', 'apps', 'software', 'help_desk', 'qa_lab', 'meeting'];
      const team = AGENTS.filter(a => a.type === 'AI' && !a.leaving && officeOf(a) === 'main' && work.includes(a.homeZone) &&
        !['onboarding', 'meeting', 'waiting_human'].includes(a.status) && !agentBusy(a)).slice(0, 7);
      team.forEach(a => {
        a.status = 'working';
        a._schedBreak = false;
        a.breakMinUntil = 0;
        a._kickoffUntil = until;
        a.currentZone = BIG_ROOM;
        a.targetPos = getWaypointForZone(BIG_ROOM, a.id);
        a.bubble = '🧩 Arranque: ' + (p.title.length > 22 ? p.title.slice(0, 22) + '…' : p.title);
      });
      const lead = projectAgent(p);
      const names = [lead, ...team].filter((a, i, l) => a && l.indexOf(a) === i).map(a => a.name);
      if (names.length) {
        teamLog(p, null, 'sala', `Reunión de arranque en la Sala de Programación con ${names.join(', ')}.`);
        pushActivity(`🏢 El equipo se reúne en la Sala de Programación para "${p.title}".`, 'PROYECTO');
      }
    }

    const _baseStartProject = startProject;
    startProject = function (p) {
      _baseStartProject(p);
      if (isBigProject(p)) kickoffMeeting(p);
    };

    // Al acabar la reunión, quien no tenga tarea vuelve a su puesto
    setInterval(() => {
      const now = performance.now();
      AGENTS.forEach(a => {
        if (!a._kickoffUntil || now < a._kickoffUntil) return;
        a._kickoffUntil = 0;
        if (a.leaving || agentBusy(a) || a.currentZone !== BIG_ROOM) return;
        a.currentZone = a.homeZone;
        a.targetPos = getWaypointForZone(a.homeZone, a.id);
        a.bubble = '💼 De vuelta a su puesto';
      });
    }, 2000);

    // Botón en la tarjeta para mandar (o sacar) el proyecto de la sala grande
    const _baseCardForBig = projectCardHtml;
    projectCardHtml = function (p) {
      const html = _baseCardForBig(p);
      if (p.officeId !== 'main' || !ZONES[BIG_ROOM] || !['pendiente', 'en_curso', 'pausado'].includes(p.status)) return html;
      const on = isBigProject(p);
      const btn = `<button onclick="toggleBigProject('${p.id}')" title="Los proyectos grandes se trabajan en la Sala de Programación"
        class="px-2 py-1 rounded-lg text-[10px] font-semibold border transition ${on ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border-amber-400/50' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}">🏢 ${on ? 'En Sala de Programación' : 'Llevar a la Sala de Programación'}</button>`;
      const i = html.lastIndexOf('<div class="flex flex-wrap gap-1.5 pt-0.5">');
      if (i < 0) return html;
      const j = i + '<div class="flex flex-wrap gap-1.5 pt-0.5">'.length;
      return html.slice(0, j) + btn + html.slice(j);
    };

    // ---------- Agente de ciberseguridad: revisa cada proyecto antes de entregarlo ----------
    // 1) Un escáner automático busca fallos típicos en el código (claves expuestas, eval, XSS…).
    // 2) El agente de seguridad (un "Especialista en Ciberseguridad" si lo contrataste; si no,
    //    alguien de QA o de Software) revisa el código con la IA.
    // 3) Si hay riesgos graves o medios, un programador los arregla y se revisa otra vez.
    const SEC_SCHEMA = {
      type: 'object', additionalProperties: false, required: ['seguro', 'riesgos', 'resumen'],
      properties: {
        seguro: { type: 'boolean' },
        riesgos: {
          type: 'array',
          items: {
            type: 'object', additionalProperties: false, required: ['gravedad', 'descripcion', 'arreglo'],
            properties: { gravedad: { type: 'string', enum: ['alta', 'media', 'baja'] }, descripcion: { type: 'string' }, arreglo: { type: 'string' } }
          }
        },
        resumen: { type: 'string' }
      }
    };

    function staticSecurityScan(code) {
      const c = String(code || '');
      const out = [];
      const add = (gravedad, descripcion, arreglo) => out.push({ gravedad, descripcion, arreglo });
      if (/\beval\s*\(|new\s+Function\s*\(/.test(c)) add('alta', 'Usa eval() o new Function(): permite ejecutar código inyectado.', 'Quitar eval/new Function y usar lógica normal o JSON.parse.');
      if (/sk-ant-[\w-]{10,}|sk-[A-Za-z0-9]{32,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{30,}/.test(c)) add('alta', 'Hay una clave de API escrita dentro del código: cualquiera la puede copiar.', 'Borrar la clave del código y usarla solo desde un servidor.');
      if (/\.innerHTML\s*[+]?=\s*[^;\n]*(\.value|location\.|\.search|\.hash|prompt\()/.test(c)) add('alta', 'Se mete texto escrito por el usuario con innerHTML (riesgo de XSS).', 'Usar textContent o escapar el texto antes de mostrarlo.');
      if (/document\.write\s*\(/.test(c)) add('media', 'Usa document.write(), que es inseguro y está obsoleto.', 'Crear los elementos con el DOM (createElement / textContent).');
      if (/(src|href)\s*=\s*["']http:\/\//i.test(c)) add('media', 'Carga recursos por http:// sin cifrar.', 'Cambiar a https:// o incluir el recurso en el propio archivo.');
      if (/type\s*=\s*["']password["']/i.test(c) && /localStorage\.setItem\([^)]*(pass|clave|contrase)/i.test(c)) add('alta', 'Guarda contraseñas en localStorage, donde cualquiera puede leerlas.', 'No guardar contraseñas en el navegador.');
      if (/target\s*=\s*["']_blank["'](?![^>]*rel\s*=)/i.test(c)) add('baja', 'Enlaces que abren pestaña nueva sin rel="noopener".', 'Añadir rel="noopener noreferrer" a esos enlaces.');
      return out;
    }

    function pickSecurityAgent(p, current) {
      const free = (a) => a === current || !agentBusy(a);
      const pool = AGENTS.filter(a => a.type === 'AI' && !a.leaving && officeOf(a) === p.officeId && free(a) && !['onboarding', 'meeting'].includes(a.status));
      const score = (a) => (/seguridad|security|cyber/i.test(a.role || '') ? 1000 : 0) + (a.homeZone === 'qa_lab' ? 100 : a.homeZone === 'software' ? 50 : 0) + skillOf(a, 'tecnica') * 3;
      pool.sort((x, y) => score(y) - score(x));
      return pool[0] || current;
    }

    async function teamSecurity(p, qaAgent) {
      const t = teamOf(p);
      if (!t.built || !p.code) return;
      const sec = pickSecurityAgent(p, qaAgent);
      const helper = sec && sec !== qaAgent;
      if (helper) holdHelper(p, sec, '🛡️ Revisando la seguridad', 'revisión de ciberseguridad');
      else if (sec) sec.bubble = '🛡️ Revisando la seguridad';
      try {
        for (let round = 1; round <= 2; round++) {
          const scan = staticSecurityScan(p.code);
          let review;
          try {
            review = await teamJson(agentPersona(sec) + '\nEres quien revisa la CIBERSEGURIDAD. Busca riesgos reales en el código: XSS, datos sensibles expuestos, claves o contraseñas en el código, formularios sin validar, enlaces inseguros, librerías externas sin necesidad y datos personales sin aviso de privacidad. Para cada riesgo di cómo arreglarlo. Marca "seguro" solo si no hay riesgos de gravedad alta o media. No inventes riesgos que no estén en el código.',
              [{ role: 'user', content: projectContext(p) + '\n\nEl escáner automático encontró: ' + (scan.length ? JSON.stringify(scan) : 'nada') + '\n\nCódigo a revisar:\n' + codeForReview(p) }], SEC_SCHEMA, 2000);
          } catch (e) {
            review = { seguro: !scan.some(x => x.gravedad !== 'baja'), riesgos: [], resumen: 'Revisión hecha solo con el escáner automático (la IA no respondió).' };
          }
          if (!review || typeof review !== 'object') review = {};
          review.riesgos = Array.isArray(review.riesgos) ? review.riesgos.filter(x => x && x.descripcion).map(x => ({ gravedad: ['alta', 'media', 'baja'].includes(x.gravedad) ? x.gravedad : 'media', descripcion: String(x.descripcion).slice(0, 300), arreglo: String(x.arreglo || '').slice(0, 300) })) : [];
          review.resumen = String(review.resumen || 'Revisión de seguridad hecha.').slice(0, 400);
          // lo que encontró el escáner siempre cuenta, aunque la IA no lo mencione
          const seen = new Set(review.riesgos.map(x => x.descripcion));
          const extra = scan.filter(x => !seen.has(x.descripcion));
          extra.forEach(x => review.riesgos.push(x));
          if (extra.length) review.resumen = `El escáner automático encontró: ${extra.map(x => x.descripcion.replace(/[.:].*$/, '')).join('; ')}. ` + (review.seguro ? '' : review.resumen);
          const serious = review.riesgos.filter(x => x.gravedad !== 'baja');
          review.seguro = serious.length === 0;
          review.por = sec ? sec.name : '';
          t.security = review;
          bumpStat(sec, 'pasos');
          teamLog(p, sec, 'seguridad', (review.seguro ? '✅ Sin riesgos graves. ' : `⚠️ ${serious.length} riesgo(s) de seguridad. `) + review.resumen);
          if (review.seguro || round === 2) return;
          const dev = pickDeveloper(p, sec);
          if (dev) dev.bubble = '🔧 Arreglando la seguridad';
          await teamBuild(p, dev || sec, serious.map(x => ({ gravedad: x.gravedad, descripcion: `[Seguridad] ${x.descripcion} Arreglo: ${x.arreglo}` })));
        }
      } finally {
        if (helper) freeHelper(sec, '✅ Seguridad revisada');
      }
    }

    // ---------- Cotizaciones automáticas ----------
    // Escribe lo que quiere el cliente y la oficina arma la cotización con TUS precios.
    // La IA (si está conectada) solo entiende el pedido; los precios salen siempre de esta lista.
    const PRICE_LIST = [
      { id: 'web_basica', label: 'Web básica', min: 400, max: 900, re: /\b(web|p[aá]gina|sitio|landing)\b/i, tpl: 'crear_web' },
      { id: 'web_empresa', label: 'Web empresarial', min: 1000, max: 2500, re: /\b(empresarial|corporativ\w*|varias p[aá]ginas|multip[aá]gina|blog)\b/i, tpl: 'crear_web' },
      { id: 'ecommerce', label: 'Tienda online (e-commerce)', min: 1500, max: 3000, re: /\b(tienda|e-?commerce|carrito|pagos? (en l[ií]nea|online)|vender (en l[ií]nea|online))\b/i, tpl: 'crear_web' },
      { id: 'reservas', label: 'Sistema de reservas', min: 800, max: 2000, monthly: [50, 100], re: /\b(reservas?|citas?|agenda|turnos)\b/i, tpl: 'crear_software' },
      { id: 'crm', label: 'CRM', min: 2000, max: 5000, re: /\b(crm|seguimiento de clientes|gesti[oó]n de clientes)\b/i, tpl: 'crear_software' },
      { id: 'admin', label: 'Sistema administrativo (inventario y facturación)', min: 2500, max: 6000, re: /\b(inventario|factura\w*|administrativ\w*|punto de venta|contabilidad)\b/i, tpl: 'crear_software' },
      { id: 'medida', label: 'Software a medida', min: 3000, max: 10000, re: /\b(a medida|software|aplicaci[oó]n|app|sistema)\b/i, tpl: 'crear_software' },
      { id: 'ia', label: 'Automatización con IA', min: 500, max: 1500, monthly: [50, 200], re: /\b(automatiza\w*|chatbot|bot|inteligencia artificial|ia)\b/i, tpl: 'crear_software' },
      { id: 'qr', label: 'Placa QR para reseñas de Google', min: 40, max: 80, unit: 'placa', re: /\b(qr|rese[ñn]as)\b/i, tpl: 'crear_web' },
      { id: 'ciber', label: 'Ciberseguridad', ask: true, re: /\b(ciberseguridad|seguridad inform[aá]tica|auditor[ií]a de seguridad|hackeo|antivirus|firewall)\b/i, tpl: 'crear_software' },
      { id: 'hardware', label: 'Hardware', ask: true, re: /\b(hardware|computadoras?|servidor(es)?|c[aá]maras?|router|cableado|redes)\b/i, tpl: 'brindar_ayuda' }
    ];
    const QUOTES_KEY = 'frp_quotes_v1';
    let QUOTES = [];
    try { const q = JSON.parse(localStorage.getItem(QUOTES_KEY) || '[]'); if (Array.isArray(q)) QUOTES = q.slice(0, 30).filter(x => x && Array.isArray(x.items)); } catch (e) { QUOTES = []; }
    const QUOTE_UI = { cliente: '', pedido: '', busy: false, open: false };
    function saveQuotes() { try { localStorage.setItem(QUOTES_KEY, JSON.stringify(QUOTES.slice(0, 30))); } catch (e) { /* sin persistencia */ } }

    const QUOTE_INTENT = /\b(cotiza\w*|cotizaci[oó]n|presupuesto|cu[aá]nto (le )?(cobro|cobrar[ií]a|cobrar|cuesta|costar[ií]a))\b/i;

    function quoteLevel(text) {
      if (/\b(b[aá]sic\w*|sencill\w*|simple|peque[ñn]\w*|econ[oó]mic\w*)\b/i.test(text)) return 'basico';
      if (/\b(complet\w*|avanzad\w*|grande|profesional|premium|muchas)\b/i.test(text)) return 'avanzado';
      return 'normal';
    }

    // Detección sin IA: palabras clave
    function quoteServicesLocal(text) {
      const hits = PRICE_LIST.filter(s => s.re.test(text)).map(s => s.id);
      const has = (id) => hits.includes(id);
      let ids = hits.slice();
      if (has('web_empresa') || has('ecommerce')) ids = ids.filter(i => i !== 'web_basica');
      if (['crm', 'admin', 'reservas', 'ecommerce', 'ia'].some(has)) ids = ids.filter(i => i !== 'medida');
      if (has('qr') && !/\b(web|p[aá]gina|sitio)\b/i.test(text)) ids = ids.filter(i => i !== 'web_basica');
      const qtyMatch = text.match(/(\d{1,4})\s*(placas?|qr)/i);
      const lvl = quoteLevel(text);
      return ids.map(id => ({ id, cantidad: id === 'qr' && qtyMatch ? Math.max(1, Math.min(9999, Number(qtyMatch[1]))) : 1, nivel: lvl }));
    }

    const QUOTE_SCHEMA = {
      type: 'object', additionalProperties: false, required: ['servicios', 'resumen'],
      properties: {
        servicios: {
          type: 'array',
          items: {
            type: 'object', additionalProperties: false, required: ['id', 'cantidad', 'nivel'],
            properties: { id: { type: 'string', enum: PRICE_LIST.map(s => s.id) }, cantidad: { type: 'integer' }, nivel: { type: 'string', enum: ['basico', 'normal', 'avanzado'] } }
          }
        },
        resumen: { type: 'string' }
      }
    };

    function priceAt(svc, nivel) {
      if (svc.ask) return null;
      const f = nivel === 'basico' ? 0.15 : nivel === 'avanzado' ? 0.85 : 0.5;
      const step = svc.max <= 100 ? 5 : 50;
      return Math.round((svc.min + (svc.max - svc.min) * f) / step) * step;
    }

    async function makeQuote(pedido, cliente) {
      const text = String(pedido || '').slice(0, 1200);
      let servicios = null, resumen = '';
      if (aiReady()) {
        try {
          const r = await teamJson(`Eres el área comercial de ${BRAND}. Lee el pedido del cliente y elige SOLO los servicios de esta lista que hacen falta (no inventes otros): ` +
            PRICE_LIST.map(s => `${s.id} = ${s.label}`).join('; ') + '. "nivel": basico si pide algo sencillo, avanzado si es grande o completo, normal si no dice. "cantidad" es 1 salvo para placas QR. En "resumen" describe el pedido en una frase.',
            [{ role: 'user', content: text }], QUOTE_SCHEMA, 800);
          servicios = r.servicios.filter(s => PRICE_LIST.some(p => p.id === s.id));
          resumen = String(r.resumen || '').slice(0, 300);
        } catch (e) { servicios = null; }
      }
      if (!servicios || !servicios.length) servicios = quoteServicesLocal(text);
      if (!servicios.length) servicios = [{ id: 'web_basica', cantidad: 1, nivel: quoteLevel(text) }];
      const items = servicios.slice(0, 8).map(s => {
        const svc = PRICE_LIST.find(p => p.id === s.id);
        const qty = Math.max(1, Math.min(9999, Math.round(Number(s.cantidad) || 1)));
        const unit = priceAt(svc, s.nivel);
        let discount = 0;
        if (svc.id === 'qr') discount = qty >= 10 ? 0.15 : qty >= 5 ? 0.1 : 0;
        const subtotal = unit === null ? null : Math.round(unit * qty * (1 - discount));
        const monthly = svc.monthly ? Math.round((svc.monthly[0] + (svc.monthly[1] - svc.monthly[0]) * (s.nivel === 'basico' ? 0 : s.nivel === 'avanzado' ? 1 : 0.5)) / 5) * 5 : 0;
        return { id: svc.id, label: svc.label, nivel: s.nivel, qty, unit, discount, subtotal, monthly, range: svc.ask ? null : [svc.min, svc.max], ask: !!svc.ask };
      });
      const rd = /\b(rd\$?|pesos|rep[uú]blica dominicana|dominican[oa])\b/i.test(text);
      const n = QUOTES.reduce((m, q) => Math.max(m, Number(String(q.numero || '').split('-').pop()) || 0), 0) + 1;
      const quote = {
        id: 'cot-' + Date.now().toString(36),
        numero: `COT-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`,
        fecha: new Date().toISOString().slice(0, 10),
        cliente: String(cliente || '').replace(/[<>&"'`]/g, '').trim().slice(0, 80) || 'Cliente',
        pedido: text, resumen, items, rd,
        total: items.reduce((s, i) => s + (i.subtotal || 0), 0),
        mensual: items.reduce((s, i) => s + (i.monthly || 0), 0),
        aConsultar: items.filter(i => i.ask).map(i => i.label)
      };
      QUOTES.unshift(quote);
      saveQuotes();
      pushActivity(`💵 Cotización ${quote.numero} para ${quote.cliente}: ${money(quote.total)}.`, 'VENTAS');
      return quote;
    }

    function money(v) { return Number(v || 0).toLocaleString('en-US') + ' USD'; }
    const NIVEL_LABEL = { basico: 'básico', normal: 'estándar', avanzado: 'avanzado' };

    function quoteText(q) {
      const lines = [`*${BRAND}* — Cotización ${q.numero}`, `Cliente: ${q.cliente}`, `Fecha: ${q.fecha}`, ''];
      q.items.forEach(i => lines.push(`• ${i.label}${i.qty > 1 ? ' × ' + i.qty : ''}: ${i.ask ? 'a consultar' : money(i.subtotal)}${i.discount ? ` (descuento ${Math.round(i.discount * 100)} %)` : ''}${i.monthly ? ` + ${i.monthly} USD/mes` : ''}`));
      lines.push('', `*Total: ${money(q.total)}*${q.mensual ? ` + ${q.mensual} USD al mes` : ''}`);
      if (q.aConsultar.length) lines.push(`Por confirmar: ${q.aConsultar.join(', ')} (se cotiza tras revisar lo que necesitas).`);
      if (q.rd && q.items.some(i => i.id === 'qr')) lines.push('En República Dominicana, la placa QR cuesta RD$1,500 – RD$3,000.');
      lines.push('Precios válidos por 15 días. Todo proyecto incluye Política de Privacidad, Términos y Condiciones y Política de Cookies.');
      return lines.join('\n');
    }

    function quoteDocHtml(q) {
      const e = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      const rows = q.items.map(i => `<tr><td>${e(i.label)}<small>${i.ask ? 'Se cotiza tras revisar el caso' : 'Nivel ' + NIVEL_LABEL[i.nivel] + (i.range ? ` · rango ${i.range[0]}–${i.range[1]} USD` : '')}</small></td>
        <td class="n">${i.qty}</td><td class="n">${i.ask ? '—' : money(i.unit)}</td><td class="n">${i.ask ? 'A consultar' : money(i.subtotal)}${i.discount ? `<small>−${Math.round(i.discount * 100)} % por paquete</small>` : ''}</td>
        <td class="n">${i.monthly ? i.monthly + ' USD' : '—'}</td></tr>`).join('');
      return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cotización ${e(q.numero)} · ${e(BRAND)}</title>
<style>body{margin:0;background:#1c1410;font:15px/1.5 Georgia,'Times New Roman',serif;color:#2a1d14;padding:24px}
.s{max-width:820px;margin:auto;background:#fbf6ee;border:3px double #b8743a;padding:36px 42px}
.h{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid #b8743a;padding-bottom:14px}
.b{font:700 26px Georgia,serif;letter-spacing:4px;color:#3b2416}.k{font:600 11px system-ui,sans-serif;letter-spacing:3px;color:#b8743a;text-transform:uppercase}
.m{text-align:right;font:13px system-ui,sans-serif;color:#5a4332}.m b{font-size:18px;color:#3b2416}
h2{font:700 13px system-ui,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#8a5428;margin:22px 0 6px}
table{width:100%;border-collapse:collapse;font-size:14px}th{font:600 11px system-ui,sans-serif;letter-spacing:1px;text-transform:uppercase;color:#8a5428;text-align:left;border-bottom:1px solid #b8743a;padding:6px 4px}
td{border-bottom:1px solid #e2cfb9;padding:8px 4px;vertical-align:top}td small{display:block;color:#9a7a60;font-size:12px}.n{text-align:right;white-space:nowrap}
.t{margin-top:14px;text-align:right;font-size:20px}.t b{color:#3b2416}.mo{text-align:right;color:#5a4332}
ul{padding-left:18px;color:#5a4332;font-size:13.5px}.f{margin-top:26px;text-align:center;font:12px system-ui,sans-serif;color:#9a7a60}
@media print{body{background:#fff;padding:0}.s{border:none}}</style></head><body><div class="s">
<div class="h"><div><div class="b">${e(BRAND)}</div><div class="k">Software · Ciberseguridad · Hardware</div></div>
<div class="m"><b>Cotización ${e(q.numero)}</b><br>Fecha: ${e(q.fecha)}<br>Válida por 15 días</div></div>
<h2>Cliente</h2><div>${e(q.cliente)}</div>
<h2>Lo que nos pidió</h2><div>${e(q.resumen || q.pedido)}</div>
<h2>Detalle</h2><table><thead><tr><th>Servicio</th><th class="n">Cant.</th><th class="n">Precio</th><th class="n">Subtotal</th><th class="n">Cuota mensual</th></tr></thead><tbody>${rows}</tbody></table>
<div class="t">Total: <b>${money(q.total)}</b></div>${q.mensual ? `<div class="mo">+ ${q.mensual} USD al mes</div>` : ''}
<h2>Condiciones</h2><ul>
${q.aConsultar.length ? `<li>${e(q.aConsultar.join(', '))}: el precio se confirma después de revisar lo que necesita.</li>` : ''}
${q.rd && q.items.some(i => i.id === 'qr') ? '<li>En República Dominicana, la placa QR cuesta RD$1,500 – RD$3,000.</li>' : ''}
<li>Precios en dólares estadounidenses (USD), válidos por 15 días.</li>
<li>Todo proyecto incluye Política de Privacidad, Términos y Condiciones y Política de Cookies.</li>
<li>El precio final puede cambiar si el proyecto cambia de alcance.</li></ul>
<div class="f">${e(BRAND)} · Desarrollado por ${e(BRAND)}</div></div></body></html>`;
    }

    async function quoteFromForm() {
      if (QUOTE_UI.busy) return;
      const pedido = QUOTE_UI.pedido.trim();
      if (pedido.length < 4) { showToast('Escribe qué quiere el cliente.'); return; }
      QUOTE_UI.busy = true;
      renderPanel();
      try {
        const q = await makeQuote(pedido, QUOTE_UI.cliente);
        QUOTE_UI.pedido = '';
        showToast(`💵 ${q.numero}: ${money(q.total)}${q.mensual ? ` + ${q.mensual} USD/mes` : ''}`);
      } finally {
        QUOTE_UI.busy = false;
        renderPanel();
      }
    }

    function findQuote(id) { return QUOTES.find(q => q.id === id); }
    function openQuote(id) {
      const q = findQuote(id); if (!q) return;
      const url = URL.createObjectURL(new Blob([quoteDocHtml(q)], { type: 'text/html' }));
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
    function downloadQuote(id) {
      const q = findQuote(id); if (!q) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([quoteDocHtml(q)], { type: 'text/html' }));
      a.download = `${q.numero}_${q.cliente.replace(/[^\wÁÉÍÓÚÑÜáéíóúñü-]+/g, '_')}.html`;
      document.body.appendChild(a); a.click(); a.remove();
    }
    function copyQuote(id) {
      const q = findQuote(id); if (!q) return;
      const txt = quoteText(q);
      const done = () => showToast('📋 Cotización copiada: pégala en WhatsApp o en un correo');
      try { navigator.clipboard.writeText(txt).then(done, () => showToast('No pude copiarla.')); } catch (e) { showToast('No pude copiarla.'); }
    }
    function quoteToProject(id) {
      const q = findQuote(id); if (!q) return;
      const main = q.items.find(i => !i.ask) || q.items[0];
      const tpl = (PRICE_LIST.find(s => s.id === main.id) || {}).tpl || 'crear_web';
      const label = (PROJECT_TEMPLATES[tpl] || {}).label || 'Proyecto';
      const p = launchMission(tpl, `${label} "${q.cliente}"`, `Cotización ${q.numero} aceptada. ${q.resumen || q.pedido}`.slice(0, 600));
      if (p) { q.proyecto = p.id; saveQuotes(); }
    }
    function deleteQuote(id) {
      QUOTES = QUOTES.filter(q => q.id !== id);
      saveQuotes();
      renderPanel();
    }

    function quotesBoxHtml() {
      const btn = (fn, id, label) => `<button onclick="${fn}('${id}')" class="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">${label}</button>`;
      const list = QUOTES.slice(0, 5).map(q => `
        <div class="p-2 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
          <div class="flex items-center justify-between gap-2 text-[11px]"><span class="text-white font-semibold truncate">${escapeHtml(q.numero)} · ${escapeHtml(q.cliente)}</span>
            <span class="font-mono text-amber-200 shrink-0">${money(q.total)}${q.mensual ? ` +${q.mensual}/mes` : ''}</span></div>
          <div class="text-[10px] text-slate-400 truncate">${escapeHtml(q.items.map(i => i.label + (i.qty > 1 ? ' ×' + i.qty : '')).join(' · '))}</div>
          <div class="flex flex-wrap gap-1">${btn('openQuote', q.id, '👁 Ver')}${btn('downloadQuote', q.id, '⬇ Descargar')}${btn('copyQuote', q.id, '📋 Copiar')}
            ${q.proyecto ? '<span class="text-[10px] text-emerald-300 self-center">✓ proyecto creado</span>' : btn('quoteToProject', q.id, '▶ Aceptada: crear proyecto')}${btn('deleteQuote', q.id, '🗑')}</div>
        </div>`).join('');
      return `
        <details class="p-3 rounded-xl bg-slate-900/85 border border-slate-800 space-y-2" ${QUOTE_UI.open ? 'open' : ''} ontoggle="QUOTE_UI.open = this.open">
          <summary class="text-xs font-semibold text-white cursor-pointer">💵 Cotizaciones <span class="text-[10px] font-normal text-slate-400">· con tus precios</span></summary>
          <input id="quote-client" maxlength="80" value="${escapeHtml(QUOTE_UI.cliente)}" oninput="QUOTE_UI.cliente = this.value" placeholder="Nombre del cliente (ej.: Pizzería Nagua)"
            class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400">
          <textarea id="quote-text" rows="2" maxlength="1200" oninput="QUOTE_UI.pedido = this.value" placeholder="¿Qué quiere? Ej.: web con reservas y 10 placas QR"
            class="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400">${escapeHtml(QUOTE_UI.pedido)}</textarea>
          <button onclick="quoteFromForm()" ${QUOTE_UI.busy ? 'disabled' : ''} class="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-100 border border-amber-400/50 text-[11px] font-semibold">${QUOTE_UI.busy ? 'Calculando…' : '💵 Calcular cotización'}</button>
          ${list || '<p class="text-[10px] text-slate-500">También puedes pedírsela al asistente: "cotiza una tienda online para Zapatería Ana".</p>'}
        </details>`;
    }

    // El asistente también cotiza: "cotiza una web con reservas para Barbería Leo"
    const _baseAssistantSend = assistantSend;
    assistantSend = async function (text) {
      const t = String(text || '').trim();
      if (!QUOTE_INTENT.test(t) || ASSIST.busy) return _baseAssistantSend(text);
      openDockPanel('assistant');
      ASSIST.log.push({ me: true, text: t });
      ASSIST.busy = true;
      renderAssistant();
      let reply;
      try {
        const m = t.match(/\bpara\s+(?:el |la |los |las )?(?:cliente\s+)?["“]?([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ&.' -]{1,40}?)["”]?(?=[,.;]|\s+(?:que|con|y)\b|$)/);
        const q = await makeQuote(t, m ? m[1] : '');
        reply = `Cotización ${q.numero} para ${q.cliente}: ${q.items.map(i => `${i.label}${i.qty > 1 ? ' ×' + i.qty : ''} ${i.ask ? '(a consultar)' : money(i.subtotal)}`).join(', ')}. Total ${money(q.total)}${q.mensual ? ` más ${q.mensual} USD al mes` : ''}. La tienes en Proyectos → Cotizaciones para verla, descargarla o copiarla.`;
        if (activeTab === 'projects') renderPanel();
      } catch (e) {
        reply = '⚠️ No pude preparar la cotización: ' + (typeof aiErrorMessage === 'function' ? aiErrorMessage(e) : String(e));
      }
      ASSIST.busy = false;
      ASSIST.log.push({ me: false, text: reply });
      renderAssistant();
      speak(reply, ASSIST_WHO);
    };
