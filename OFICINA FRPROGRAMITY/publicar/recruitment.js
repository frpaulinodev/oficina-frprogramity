    // [recruitment.js] Parte de lo que antes era script.js: RECEPCIÓN, ENTREVISTAS Y CONTRATACIÓN (sección 5b).
    // Se carga en orden desde index.html; no cambies el orden de los archivos.
    // _______________________________________________________
    // 5b. RECEPCIÓN, ENTREVISTAS Y CONTRATACIÓN DE NUEVOS MIEMBROS
    // _______________________________________________________
    const SKILL_KEYS = ['tecnica', 'comunicacion', 'equipo', 'creatividad', 'motivacion'];
    const SKILL_LABELS = { tecnica: 'Técnica', comunicacion: 'Comunicación', equipo: 'Trabajo en equipo', creatividad: 'Creatividad', motivacion: 'Motivación' };
    const MAX_QUESTIONS = 5; // hay que hacer 5 preguntas antes de aprobar o rechazar

    // Puestos que se pueden cubrir, por sala de destino
    const ROLE_CATALOG = {
      games: {
        area: 'Juegos', roles: ['Game Developer', 'Level Designer', 'Gameplay Programmer'],
        task: 'Prototipar mecánicas, niveles y sensaciones de juego',
        input: 'Idea del juego, controles y reglas', output: 'Niveles jugables y mecánicas pulidas',
        tools: ['Game Loop', 'Level Builder', 'Physics Tuner'],
        techQ: '¿Qué harías si un juego baja de 60 FPS en mitad de una partida?',
        techA: {
          high: ['Primero perfilo el cuadro: draw calls, físicas y recolección de basura. Agrupo mallas, uso pools de objetos y bajo la frecuencia de la IA lejana.'],
          mid: ['Revisaría qué hay en escena y quitaría efectos pesados. Probaría bajando la resolución de las sombras.'],
          low: ['Supongo que bajaría la calidad gráfica… nunca me tocó medir el rendimiento, la verdad.']
        }
      },
      apps: {
        area: 'Apps', roles: ['Mobile Developer', 'Frontend UI Engineer', 'Diseñador/a UX/UI'],
        task: 'Construir pantallas, flujos y componentes de apps',
        input: 'Flujos de usuario y diseños', output: 'App usable, rápida y accesible',
        tools: ['UI Kit', 'State Store', 'Responsive Grid'],
        techQ: '¿Cómo harías que una app cargue rápido en un móvil con mala conexión?',
        techA: {
          high: ['Divido el código por rutas, cacheo con un service worker, comprimo imágenes y muestro esqueletos de carga para que se sienta instantánea.'],
          mid: ['Optimizaría las imágenes y cargaría menos cosas al inicio. Tal vez algo de caché.'],
          low: ['Le pondría un spinner bonito mientras carga; creo que con eso basta.']
        }
      },
      software: {
        area: 'Software', roles: ['Backend Engineer', 'DevOps & Cloud', 'Data Engineer'],
        task: 'Diseñar APIs, servicios y automatizaciones',
        input: 'Requisitos, datos y contratos de API', output: 'Servicios estables y documentados',
        tools: ['API Designer', 'CI Pipeline', 'DB Migrator'],
        techQ: '¿Cómo diseñarías una API que tenga que aguantar mucho tráfico?',
        techA: {
          high: ['La haría sin estado para escalar horizontalmente, con caché delante, límites de uso, colas para el trabajo pesado y métricas desde el primer día.'],
          mid: ['Usaría un buen framework, una base de datos con índices y algún balanceador.'],
          low: ['Contrataría un servidor más grande, supongo. No he trabajado con mucho tráfico.']
        }
      },
      mecatronica: {
        area: 'Mecatrónica', roles: ['Ingeniero/a Mecatrónico', 'Técnico/a en Electrónica', 'Programador/a de Robótica'],
        task: 'Diseñar circuitos, programar Arduino y construir robots',
        input: 'Idea del montaje, sensores y actuadores', output: 'Circuito probado y código Arduino listo para la placa',
        tools: ['Arduino IDE', 'Multímetro', 'Simulador de circuitos'],
        techQ: '¿Cómo conectarías un motor DC a un Arduino?',
        techA: {
          high: ['Nunca directo al pin: uso un driver como el L298N o un transistor con diodo de protección, fuente aparte para el motor y GND común; la velocidad la controlo con PWM.'],
          mid: ['Con un transistor o un módulo de motor, y lo controlo con analogWrite.'],
          low: ['Lo conecto directo a un pin digital y le doy HIGH.']
        }
      },
      help_desk: {
        area: 'Ayuda', roles: ['Soporte Técnico', 'Customer Success', 'Especialista de Onboarding', 'Técnico de Hardware'],
        task: 'Resolver incidencias y guiar a los usuarios',
        input: 'Consultas, tickets y errores reportados', output: 'Soluciones claras y usuarios contentos',
        tools: ['Ticket Desk', 'Troubleshooter', 'Knowledge Base'],
        techQ: 'Un usuario no puede iniciar sesión. ¿Qué revisas primero?',
        techA: {
          high: ['Reproduzco el caso, reviso el estado del servicio, si la cuenta está bloqueada, la caché y la hora del dispositivo. Le doy pasos cortos y documento la solución.'],
          mid: ['Le pediría que restablezca la contraseña y que borre la caché del navegador.'],
          low: ['Le diría que lo intente más tarde; a veces se arregla solo.']
        }
      },
      qa_lab: {
        area: 'QA', roles: ['QA Automation', 'Tester de Rendimiento', 'QA Exploratorio', 'Especialista en Ciberseguridad'],
        task: 'Diseñar pruebas y cazar errores antes del lanzamiento',
        input: 'Builds nuevas y criterios de aceptación', output: 'Reportes de calidad y builds verificadas',
        tools: ['Test Runner', 'Bug Tracker', 'Load Tester'],
        techQ: 'Te llega una build nueva una hora antes del lanzamiento. ¿Qué pruebas primero?',
        techA: {
          high: ['Un smoke test del flujo crítico, luego lo que cambió en esta versión y la regresión automática en paralelo. Si algo bloquea, aviso con evidencia y pasos para reproducir.'],
          mid: ['Probaría las funciones principales y lo que cambió, lo que me dé el tiempo.'],
          low: ['Abriría la app y haría clic por todos lados a ver si algo se rompe.']
        }
      },
      meeting: {
        area: 'Producto', roles: ['Product Manager', 'Technical Writer', 'Scrum Master'],
        task: 'Coordinar entregas, priorizar y documentar',
        input: 'Objetivos de la empresa y avances del equipo', output: 'Planes claros y entregables documentados',
        tools: ['Roadmap', 'Docs Hub', 'Sprint Board'],
        techQ: 'Hay más tareas que tiempo para el lanzamiento. ¿Cómo priorizas?',
        techA: {
          high: ['Ordeno por impacto en el usuario y esfuerzo, defino lo mínimo que tiene sentido lanzar, negocio el alcance con el equipo y comunico qué queda para la siguiente versión.'],
          mid: ['Haría una lista con lo más importante primero y lo hablaría con el equipo.'],
          low: ['Intentaría hacerlo todo igual, trabajando más horas si hace falta.']
        }
      },
      cocina: {
        area: 'Cocina', service: true, roles: ['Chef', 'Ayudante de Cocina', 'Pastelero/a'],
        task: 'Preparar el menú diario y abastecer el comedor',
        input: 'Menú, ingredientes y número de comensales', output: 'Comidas listas y buffet abastecido',
        tools: ['Menú Semanal', 'Inventario', 'Horno & Fogones'],
        techQ: 'El comedor espera a 30 personas en una hora y falta un ingrediente clave. ¿Qué haces?',
        techA: {
          high: ['Reviso el inventario, adapto la receta con un sustituto que conserve el sabor, organizo la cocina por estaciones y aviso al comedor del cambio de menú.'],
          mid: ['Cambiaría el plato por otro más sencillo que sí pueda preparar a tiempo.'],
          low: ['Haría lo que se pueda y, si no alcanza, que coman otra cosa.']
        }
      },
      limpieza: {
        area: 'Limpieza', service: true, roles: ['Personal de Limpieza', 'Conserje', 'Técnico/a de Mantenimiento'],
        task: 'Mantener las salas limpias, ordenadas y seguras',
        input: 'Rutas de limpieza y avisos de incidencias', output: 'Salas impecables y equipos en buen estado',
        tools: ['Ruta de Limpieza', 'Carro de Limpieza', 'Checklist'],
        techQ: '¿Cómo organizas la limpieza de una oficina con muchas salas en uso?',
        techA: {
          high: ['Hago una ruta por prioridad: baños y comedor primero, y las zonas de trabajo cuando están vacías. Uso señalización, el producto adecuado para cada superficie y una checklist.'],
          mid: ['Empiezo por las salas más sucias y voy avanzando en orden.'],
          low: ['Limpio lo que vea sucio cuando paso por ahí.']
        }
      }
    };

    // Las vacantes de servicio (cocina / limpieza) tienen prioridad mientras falte personal
    function pickCandidateZone() {
      const counts = {};
      AGENTS.forEach(a => { if (a.type !== 'CANDIDATE' && !a.leaving) counts[a.homeZone] = (counts[a.homeZone] || 0) + 1; });
      const entries = Object.keys(ROLE_CATALOG).map(z => {
        const cat = ROLE_CATALOG[z];
        const n = counts[z] || 0;
        const w = cat.service ? (n < 2 ? 3.0 : n < 4 ? 1.0 : 0.3) : 1.0;
        return [z, w];
      });
      let r = Math.random() * entries.reduce((s, e) => s + e[1], 0);
      for (const [z, w] of entries) { r -= w; if (r <= 0) return z; }
      return entries[0][0];
    }

    const GENERIC_QUESTIONS = {
      comunicacion: {
        q: '¿Cómo le explicarías tu último proyecto a alguien que no es técnico?',
        high: ['Lo cuento como una historia: qué problema tenía la gente, qué construimos y qué cambió para ellos. Sin jerga y con un ejemplo concreto.', 'Empiezo por el resultado y luego explico el cómo con una comparación simple. Siempre pregunto si quedó claro.'],
        mid: ['Intentaría no usar palabras técnicas, aunque a veces se me escapan.', 'Explicaría qué hace el proyecto y mostraría unas capturas.'],
        low: ['Mmm… es complicado de explicar si no sabes programar.', 'Bueno, eh… hace cosas con datos, básicamente. Es difícil de contar.']
      },
      equipo: {
        q: 'Si no estás de acuerdo con un compañero sobre cómo resolver algo, ¿qué haces?',
        high: ['Escucho su razonamiento, propongo probar ambas ideas con un prototipo pequeño y decidimos con datos. Lo importante es el resultado del equipo.', 'Lo hablamos en privado, buscamos lo que tenemos en común y, si no llegamos a un acuerdo, lo escalamos juntos sin dramas.'],
        mid: ['Explico mi punto de vista y, si no nos ponemos de acuerdo, que decida el líder.', 'Normalmente cedo para evitar conflictos, aunque a veces lo comento después.'],
        low: ['Hago lo mío y que el resultado hable por sí solo.', 'Prefiero trabajar solo; así no hay discusiones.']
      },
      creatividad: {
        q: 'Propón una idea nueva para el área de {area} de FRPROGRAMITY.',
        high: ['¡Un "laboratorio abierto" de {area} donde los usuarios votan prototipos cada semana! Lanzamos lo más votado y medimos cómo se usa.', 'Una biblioteca interna de piezas reutilizables para {area}, con ejemplos vivos, que acelere cada proyecto nuevo.'],
        mid: ['Podríamos mejorar las plantillas que ya existen en {area}.', 'Tal vez agregar un modo oscuro o más opciones de personalización.'],
        low: ['No se me ocurre nada ahora mismo, la verdad.', 'Haría lo mismo que la competencia, pero más barato.']
      },
      motivacion: {
        q: '¿Por qué quieres unirte a FRPROGRAMITY?',
        high: ['Sigo sus lanzamientos desde hace tiempo y me encanta que combinen juegos, apps y ayuda real. Quiero crecer aquí y aportar desde el primer día.', 'Me motiva construir cosas que la gente use de verdad, y aquí veo un equipo con el que aprender muchísimo.'],
        mid: ['Me parece un buen lugar para ganar experiencia.', 'Vi la vacante y encaja con lo que sé hacer.'],
        low: ['Necesito un trabajo y este quedaba cerca.', 'La verdad, estoy aplicando a muchos sitios a la vez.']
      }
    };

    const CANDIDATE_NAMES = ['Martina', 'Bruno', 'Isabella', 'Tomás', 'Renata', 'Nicolás', 'Julieta', 'Gael', 'Abril', 'Santiago', 'Daniela', 'Joaquín',
      'Paula', 'Emilio', 'Carla', 'Iván', 'Ximena', 'Hugo', 'Lola', 'Rafael', 'Irene', 'Marco', 'Sara', 'Leo', 'Alma', 'Bautista', 'Noa', 'Elías'];
    const CANDIDATE_COLORS = [0xa78bfa, 0x34d399, 0xf472b6, 0x60a5fa, 0xfbbf24, 0xf87171, 0x2dd4bf, 0xc084fc, 0x38bdf8, 0xfb923c, 0xa3e635, 0xe879f9];
    const HIRED_STORAGE_KEY = 'frp_hired_members_v1';

    const RECRUIT = {
      open: false,                      // al entrar no hay vacantes: se abren en la sección Talento
      nextArrivalAt: 0,
      interview: null,                  // { candId }
      modalCandId: null,
      history: [],                      // últimas decisiones
      counter: 0
    };

    const randPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));
    const randGauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 0.5;
    const skillTier = (v) => (v >= 8 ? 'high' : v >= 5 ? 'mid' : 'low');

    function teamSize() {
      return AGENTS.filter(a => a.id !== 'human_dir' && a.type !== 'CANDIDATE' && !a.leaving).length;
    }

    function activeCandidates() {
      return AGENTS.filter(a => a.type === 'CANDIDATE' && !a.leaving);
    }

    function generateCandidate() {
      const zone = pickCandidateZone();
      const cat = ROLE_CATALOG[zone];
      const used = new Set(AGENTS.map(a => a.name.replace(/ IA$/, '')));
      const freeNames = CANDIDATE_NAMES.filter(n => !used.has(n));
      const first = freeNames.length ? randPick(freeNames) : randPick(CANDIDATE_NAMES) + ' ' + (RECRUIT.counter + 2);

      // Habilidades reales (ocultas) y lo que el candidato declara en su CV
      const quality = 3 + Math.random() * 6.5;
      const skills = {};
      ['tecnica', 'comunicacion', 'equipo', 'creatividad'].forEach(k => { skills[k] = clampInt(quality + randGauss() * 1.7, 1, 10); });
      skills.motivacion = clampInt(4 + Math.random() * 6 + randGauss(), 1, 10);
      const roll = Math.random();
      const trait = roll < 0.45 ? 'honesto' : roll < 0.8 ? 'exagera' : 'modesto';
      const claims = {};
      ['tecnica', 'comunicacion', 'equipo', 'creatividad'].forEach(k => {
        const v = skills[k];
        const delta = trait === 'honesto' ? Math.round(Math.random() * 2 - 1)
          : trait === 'exagera' ? 2 + Math.round(Math.random())
          : -(1 + Math.round(Math.random()));
        claims[k] = clampInt(v + delta, 1, 10);
      });

      const color = randPick(CANDIDATE_COLORS);
      const outfit = new THREE.Color(color).multiplyScalar(0.28).getHex();
      RECRUIT.counter += 1;
      const id = 'cand_' + Date.now().toString(36) + '_' + RECRUIT.counter;
      const start = { x: STREET_SPAWN.x + (Math.random() - 0.5) * 3, z: STREET_SPAWN.z };
      return {
        id,
        name: first + ' IA',
        role: randPick(cat.roles),
        type: 'CANDIDATE',
        color,
        outfitColor: outfit,
        homeZone: 'reception',
        currentZone: 'reception',
        pos: { x: start.x, z: start.z },
        targetPos: null,
        yaw: Math.PI,
        walkPhase: 0,
        status: 'candidate',
        energy: 80,
        bubble: '🚶 Llegando a la oficina',
        task: `Postula al área de ${cat.area}`,
        inputSpec: cat.input,
        outputSpec: cat.output,
        tools: cat.tools.slice(),
        path: [],
        pathIndex: 0,
        cand: {
          zone,
          area: cat.area,
          skills,
          claims,
          trait,
          years: clampInt(quality / 2 + Math.random() * 3 - 0.5, 0, 12),
          phase: 'arriving',
          asked: [],
          transcript: [],
          waitIdx: -1,
          phaseAt: performance.now()
        }
      };
    }

    function freeCheckinSpot(selfId) {
      const options = [RECEPTION_CHECKIN, [3.1, 16.15, PI], [4.9, 16.15, PI]];
      for (const s of options) {
        const busy = AGENTS.some(a => a.id !== selfId && a.targetPos && Math.hypot(a.targetPos.x - s[0], a.targetPos.z - s[1]) < 0.4);
        if (!busy) return spotToTarget(s);
      }
      return spotToTarget(RECEPTION_CHECKIN);
    }

    function spawnCandidate(manual = false) {
      if (teamSize() >= MAX_TEAM_SIZE) {
        if (manual) showToast('El equipo está completo: no hay vacantes disponibles.');
        return null;
      }
      if (activeCandidates().length >= RECEPTION_WAIT.length) {
        if (manual) showToast('La sala de espera está llena. Entrevista a alguien primero.');
        return null;
      }
      const c = generateCandidate();
      AGENTS.push(c);
      c.targetPos = freeCheckinSpot(c.id);
      buildAgentAvatar(c);
      createAgentLabel(c);
      pushActivity(`${c.name} llegó a ${BRAND}: postula como ${c.role} (${c.cand.area}).`, 'TALENTO');
      showToast(`🛎️ Llega un candidato: ${c.name} · ${c.role}`);
      refreshRecruitUI();
      return c;
    }

    function callCandidateNow() {
      spawnCandidate(true);
    }

    function toggleRecruitOpen() {
      RECRUIT.open = !RECRUIT.open;
      RECRUIT.nextArrivalAt = performance.now() + 3000;
      showToast(RECRUIT.open ? '📣 Vacantes publicadas: los candidatos llegan mientras estés en Talento' : '⏸️ Vacantes cerradas');
      refreshRecruitUI();
    }

    function sendCandidateToWaiting(a) {
      const used = new Set(activeCandidates().filter(o => o.id !== a.id).map(o => o.cand.waitIdx).filter(i => i >= 0));
      let idx = RECEPTION_WAIT.findIndex((_, i) => !used.has(i));
      if (idx < 0) idx = 0;
      a.cand.waitIdx = idx;
      a.cand.phase = 'to_wait';
      a.cand.phaseAt = performance.now();
      a.currentZone = 'reception';
      a.targetPos = spotToTarget(RECEPTION_WAIT[idx]);
      a.bubble = '🪑 Tomando asiento';
    }

    function setLuciaBubble(text, ms = 4000) {
      const lucia = AGENTS.find(x => x.id === 'lucia_ia');
      if (!lucia || lucia.status === 'break') return;
      lucia.bubble = text;
      clearTimeout(setLuciaBubble._t);
      setLuciaBubble._t = setTimeout(() => {
        if (lucia.status !== 'break') lucia.bubble = 'Recibiendo candidatos';
      }, ms);
    }

    function directorAtInterview() {
      const dir = AGENTS.find(a => a.id === 'human_dir');
      if (!dir || !dir.targetPos) return false;
      const s = INTERVIEW_SPOTS.interviewer;
      return Math.hypot(dir.targetPos.x - s[0], dir.targetPos.z - s[1]) < 0.1 && isAgentArrived(dir);
    }

    function sendDirectorToInterview() {
      const dir = AGENTS.find(a => a.id === 'human_dir');
      if (!dir) return;
      dir.currentZone = 'interview';
      dir.targetPos = spotToTarget(INTERVIEW_SPOTS.interviewer);
      dir.bubble = '🤝 Hacia la entrevista';
      const badge = document.getElementById('user-zone-badge');
      if (badge) badge.textContent = ZONES.interview.name;
    }

    function startInterview(candId) {
      const a = AGENTS.find(x => x.id === candId);
      if (!a || a.type !== 'CANDIDATE') return;
      if (RECRUIT.interview && RECRUIT.interview.candId !== candId) {
        showToast('Ya hay una entrevista en curso.');
        return;
      }
      if (!['waiting', 'to_wait', 'checkin'].includes(a.cand.phase)) return;
      RECRUIT.interview = { candId };
      a.cand.phase = 'to_interview';
      a.cand.waitIdx = -1;
      a.currentZone = 'interview';
      a.targetPos = spotToTarget(INTERVIEW_SPOTS.candidate);
      a.bubble = '🚶 Yendo a la entrevista';
      setLuciaBubble(`${a.name.split(' ')[0]}, pasa a la Sala de Entrevistas`);
      sendDirectorToInterview();
      pushActivity(`Llamaste a ${a.name} a la Sala de Entrevistas.`, 'ENTREVISTA');
      showToast(`🤝 Entrevista con ${a.name}: caminando a la sala…`);
      refreshRecruitUI();
    }

    function recruitmentTick() {
      const now = performance.now();
      let changed = false;
      const snapshot = AGENTS.slice();
      for (let i = 0; i < snapshot.length; i++) {
        const a = snapshot[i];
        if (a.leaving) {
          if (isAgentArrived(a)) { removeAgent(a.id); changed = true; }
          continue;
        }
        if (a.type !== 'CANDIDATE') continue;
        const c = a.cand;
        if (c.phase === 'arriving' && isAgentArrived(a)) {
          c.phase = 'checkin';
          c.phaseAt = now;
          a.bubble = '👋 Hola, vengo por la vacante';
          setLuciaBubble(`¡Bienvenido/a, ${a.name.split(' ')[0]}! Toma asiento`);
          changed = true;
        } else if (c.phase === 'checkin' && now - c.phaseAt > 2400) {
          sendCandidateToWaiting(a);
          pushActivity(`Lucía IA registró a ${a.name} en Recepción.`, 'RECEPCIÓN');
          changed = true;
        } else if (c.phase === 'to_wait' && isAgentArrived(a)) {
          c.phase = 'waiting';
          a.bubble = '⏳ Esperando entrevista';
          changed = true;
        } else if (c.phase === 'to_interview' && isAgentArrived(a) && directorAtInterview()) {
          c.phase = 'interviewing';
          a.bubble = '🎙️ En entrevista';
          const dir = AGENTS.find(x => x.id === 'human_dir');
          if (dir) dir.bubble = '🤝 Entrevistando';
          openInterviewModal(a.id);
          changed = true;
        }
      }

      updateOnboarding(now);
      if (MEETING.active && now >= MEETING.active.endsAt) endMeeting();

      // los candidatos solo llegan mientras tienes abierta la sección de vacantes
      if (RECRUIT.open && activeTab === 'recruit' && now >= RECRUIT.nextArrivalAt) {
        RECRUIT.nextArrivalAt = now + 32000 + Math.random() * 24000;
        spawnCandidate(false);
      }
      if (changed) refreshRecruitUI();
    }

    function startRecruitmentEngine() {
      RECRUIT.nextArrivalAt = performance.now() + 4500;
      setInterval(recruitmentTick, 250);
    }

    function exitTarget() {
      return { x: STREET_SPAWN.x + (Math.random() - 0.5) * 4, z: STREET_SPAWN.z + 0.5 };
    }

    function computeRating(skills) {
      const score = (skills.tecnica * 2 + skills.comunicacion + skills.equipo + skills.creatividad + skills.motivacion) / 6;
      return { score: Math.round(score * 10) / 10, stars: Math.max(1, Math.min(5, Math.round(score / 2))) };
    }

    function starsText(n) {
      return '★'.repeat(n) + '☆'.repeat(5 - n);
    }

    function askInterviewQuestion(key) {
      const a = AGENTS.find(x => x.id === RECRUIT.modalCandId);
      if (!a || !a.cand) return;
      const c = a.cand;
      if (c.asked.includes(key) || c.asked.length >= MAX_QUESTIONS) return;
      const cat = ROLE_CATALOG[c.zone];
      const tier = skillTier(c.skills[key]);
      let q, ans;
      if (key === 'tecnica') {
        q = cat.techQ;
        ans = randPick(cat.techA[tier]);
      } else {
        const g = GENERIC_QUESTIONS[key];
        q = g.q.replace('{area}', cat.area);
        ans = randPick(g[tier]).replace(/\{area\}/g, cat.area);
      }
      c.asked.push(key);
      c.transcript.push({ key, q, a: ans, tier });
      const dir = AGENTS.find(x => x.id === 'human_dir');
      if (dir) dir.bubble = '❓ ' + (q.length > 30 ? q.slice(0, 30) + '…' : q);
      a.bubble = '💬 ' + (ans.length > 30 ? ans.slice(0, 30) + '…' : ans);
      renderInterviewModal();
    }

    function decideCandidate(decision) {
      const a = AGENTS.find(x => x.id === RECRUIT.modalCandId);
      if (!a || !a.cand) return;
      const dir = AGENTS.find(x => x.id === 'human_dir');
      if (decision === 'hire') {
        if (teamSize() >= MAX_TEAM_SIZE) {
          showToast('El equipo está completo: no puedes contratar a más miembros.');
          return;
        }
        hireCandidate(a);
      } else if (decision === 'reject') {
        a.cand.phase = 'leaving';
        a.leaving = true;
        a.status = 'idle';
        a.bubble = '🙏 Gracias por la oportunidad';
        a.targetPos = exitTarget();
        RECRUIT.history.unshift({ name: a.name, role: a.role, decision: 'Rechazado', detail: a.cand.area });
        pushActivity(`No seleccionaste a ${a.name} (${a.role}). Se retira de la oficina.`, 'ENTREVISTA');
        showToast(`${a.name} no fue seleccionado/a`);
      } else {
        // pausar: vuelve a la sala de espera conservando las preguntas hechas
        sendCandidateToWaiting(a);
        pushActivity(`${a.name} volvió a la sala de espera.`, 'ENTREVISTA');
      }
      RECRUIT.history = RECRUIT.history.slice(0, 6);
      RECRUIT.interview = null;
      if (dir) dir.bubble = 'En Sala de Entrevistas';
      closeInterviewModal();
      refreshRecruitUI();
    }

    function hireCandidate(a) {
      const c = a.cand;
      const cat = ROLE_CATALOG[c.zone];
      const rating = computeRating(c.skills);
      a.type = 'AI';
      a.hired = true;
      a.status = 'working';
      a.homeZone = c.zone;
      a.currentZone = c.zone;
      a.task = cat.task;
      a.inputSpec = cat.input;
      a.outputSpec = cat.output;
      a.tools = cat.tools.slice();
      a.energy = clampInt(55 + c.skills.motivacion * 4, 40, 100);
      a.profile = { skills: { ...c.skills }, claims: { ...c.claims }, trait: c.trait, years: c.years, rating: rating.score, stars: rating.stars, area: c.area };
      // Primero pasa por Formación para su inducción y después va a su sala
      a.status = 'onboarding';
      a.currentZone = 'formacion';
      a.onboardingUntil = performance.now() + 16000;
      a.bubble = '🎉 ¡Nuevo en el equipo!';
      a.targetPos = getWaypointForZone('formacion', a.id);
      delete a.cand;

      initAgentRank(a, true);
      removeAgentLabel(a.id);
      createAgentLabel(a);
      refreshAvatarRank(a);
      spawnDataPacket('interview', a.homeZone, a.color);
      saveHiredAgents();

      const verdict = rating.score >= 8 ? '¡Un fichaje excelente!' : rating.score >= 6.2 ? 'Buen fichaje.' : rating.score >= 4.5 ? 'Fichaje regular.' : 'Fichaje arriesgado…';
      const traitNote = c.trait === 'exagera' ? ' Su CV estaba algo inflado.' : c.trait === 'modesto' ? ' Resultó mejor de lo que decía su CV.' : '';
      RECRUIT.history.unshift({ name: a.name, role: a.role, decision: 'Contratado', detail: starsText(rating.stars) });
      pushActivity(`Contrataste a ${a.name} como ${a.role} (${ZONES[a.homeZone].name}). ${verdict}${traitNote}`, 'CONTRATADO');
      showToast(`✅ ${a.name} se une al equipo · ${starsText(rating.stars)}`);
      setTimeout(() => {
        if (a.status === 'onboarding' && a.bubble === '🎉 ¡Nuevo en el equipo!') a.bubble = '📚 Inducción en Formación';
      }, 5000);
    }

    // Termina la inducción cuando ya estuvo un rato en Formación
    function updateOnboarding(now) {
      for (let i = 0; i < AGENTS.length; i++) {
        const a = AGENTS[i];
        if (a.status !== 'onboarding' || a.leaving) continue;
        if (!isAgentArrived(a)) { a.onboardingUntil = Math.max(a.onboardingUntil, now + 9000); continue; }
        if (now < a.onboardingUntil) continue;
        delete a.onboardingUntil;
        a.status = 'working';
        a.currentZone = a.homeZone;
        a.targetPos = getWaypointForZone(a.homeZone, a.id);
        a.bubble = 'Instalándose en su estación';
        spawnDataPacket('formacion', a.homeZone, a.color);
        pushActivity(`${a.name} terminó su inducción y fue a ${ZONES[a.homeZone].name}.`, 'EQUIPO');
        refreshRecruitUI();
      }
    }

    function dismissMember(agentId) {
      const a = AGENTS.find(x => x.id === agentId);
      if (!a || !a.hired || a.leaving) return;
      a.leaving = true;
      a.status = 'idle';
      a.bubble = '👋 ¡Hasta pronto!';
      a.currentZone = 'reception';
      a.targetPos = exitTarget();
      saveHiredAgents();
      pushActivity(`${a.name} dejó el equipo y salió de la oficina.`, 'EQUIPO');
      showToast(`${a.name} dejó ${BRAND}`);
      if (selectedAgentId === agentId) selectedAgentId = 'camila_ia';
      refreshRecruitUI();
    }

    function saveHiredAgents() {
      try {
        const list = AGENTS.filter(a => a.hired && !a.leaving).map(a => ({
          id: a.id, name: a.name, role: a.role, color: a.color, outfitColor: a.outfitColor,
          homeZone: a.homeZone, task: a.task, inputSpec: a.inputSpec, outputSpec: a.outputSpec, tools: a.tools, profile: a.profile
        }));
        localStorage.setItem(HIRED_STORAGE_KEY, JSON.stringify(list));
      } catch (e) { /* sin persistencia */ }
    }

    function loadHiredAgents() {
      let list;
      try {
        list = JSON.parse(localStorage.getItem(HIRED_STORAGE_KEY) || '[]');
      } catch (e) { return; }
      if (!Array.isArray(list)) return;
      const clean = (v, n = 60) => String(v == null ? '' : v).replace(/[<>&"']/g, '').slice(0, n);
      list.slice(0, MAX_TEAM_SIZE).forEach(h => {
        if (!h || typeof h !== 'object' || !ZONES[h.homeZone] || !ROLE_CATALOG[h.homeZone]) return;
        const id = clean(h.id, 40);
        if (!/^cand_[a-z0-9_]+$/i.test(id) || AGENTS.some(a => a.id === id)) return;
        if (teamSize() >= MAX_TEAM_SIZE) return;
        const cat = ROLE_CATALOG[h.homeZone];
        const p = h.profile && typeof h.profile === 'object' ? h.profile : {};
        const skills = {};
        SKILL_KEYS.forEach(k => { skills[k] = clampInt(Number(p.skills && p.skills[k]) || 5, 1, 10); });
        const rating = computeRating(skills);
        AGENTS.push({
          id,
          name: clean(h.name, 32) || 'Nuevo IA',
          role: clean(h.role, 40) || cat.roles[0],
          type: 'AI',
          hired: true,
          color: Number(h.color) || 0x94a3b8,
          outfitColor: Number(h.outfitColor) || 0x1e293b,
          homeZone: h.homeZone,
          currentZone: h.homeZone,
          pos: { x: ZONES[h.homeZone].x, z: ZONES[h.homeZone].z },
          targetPos: null,
          yaw: 0,
          walkPhase: 0,
          status: 'working',
          energy: 80,
          bubble: 'Trabajando en su estación',
          task: cat.task,
          inputSpec: cat.input,
          outputSpec: cat.output,
          tools: cat.tools.slice(),
          profile: { skills, trait: clean(p.trait, 12), years: clampInt(Number(p.years) || 0, 0, 40), rating: rating.score, stars: rating.stars, area: cat.area }
        });
      });
    }

    function updateRecruitBadge() {
      const el = document.getElementById('recruit-count');
      if (el) el.textContent = String(activeCandidates().length);
    }

    function refreshRecruitUI() {
      updateRecruitBadge();
      if (activeTab === 'recruit' || activeTab === 'team') renderPanel();
    }

    // --- Modal de entrevista ---
    function openInterviewModal(candId) {
      RECRUIT.modalCandId = candId;
      renderInterviewModal();
      const modal = document.getElementById('interview-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeInterviewModal() {
      const modal = document.getElementById('interview-modal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      RECRUIT.modalCandId = null;
    }

    function skillBarHtml(label, claim, real) {
      const revealed = real !== undefined;
      const tone = !revealed ? '' : real >= 8 ? 'bg-emerald-400' : real >= 5 ? 'bg-amber-400' : 'bg-rose-400';
      let flag = '';
      if (revealed && claim !== undefined) {
        if (real <= claim - 2) flag = '<span class="text-rose-300">⚠ exageró</span>';
        else if (real >= claim + 2) flag = '<span class="text-emerald-300">✨ mejor que su CV</span>';
      }
      return `
        <div>
          <div class="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>${label}</span>
            <span>CV ${claim !== undefined ? claim : '—'}${revealed ? ` · Real <b class="text-white">${real}</b>` : ''} ${flag}</span>
          </div>
          <div class="relative w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            ${claim !== undefined ? `<div class="absolute inset-y-0 left-0 bg-slate-500/60" style="width:${claim * 10}%"></div>` : ''}
            ${revealed ? `<div class="absolute inset-y-0 left-0 ${tone}" style="width:${real * 10}%"></div>` : ''}
          </div>
        </div>
      `;
    }

    function renderInterviewModal() {
      const a = AGENTS.find(x => x.id === RECRUIT.modalCandId);
      if (!a || !a.cand) return;
      const c = a.cand;
      const cat = ROLE_CATALOG[c.zone];
      const hex = '#' + new THREE.Color(a.color).getHexString();
      document.getElementById('interview-title').textContent = `${a.name} · ${a.role}`;
      document.getElementById('interview-meta').textContent = `Postula a ${ZONES[c.zone].name} · ${c.years} años de experiencia · Preguntas: ${c.asked.length}/${MAX_QUESTIONS}`;

      const revealedVals = c.asked.map(k => c.skills[k]);
      const impression = revealedVals.length ? revealedVals.reduce((s, v) => s + v, 0) / revealedVals.length : null;
      const impressionHtml = impression === null
        ? '<span class="text-slate-400">Aún sin evaluar: haz preguntas para descubrir sus habilidades reales.</span>'
        : impression >= 7.5 ? '<span class="text-emerald-300 font-semibold">Muy buena impresión</span>'
        : impression >= 5 ? '<span class="text-amber-300 font-semibold">Impresión correcta</span>'
        : '<span class="text-rose-300 font-semibold">Impresión floja</span>';

      const remaining = MAX_QUESTIONS - c.asked.length;
      const questionText = (k) => (k === 'tecnica' ? cat.techQ : GENERIC_QUESTIONS[k].q.replace('{area}', cat.area));
      const questionsHtml = SKILL_KEYS.map(k => {
        const done = c.asked.includes(k);
        const disabled = done || remaining <= 0;
        return `
          <button ${disabled ? 'disabled' : ''} onclick="askInterviewQuestion('${k}')"
            class="w-full text-left p-2 rounded-xl border transition ${done ? 'bg-violet-500/15 border-violet-400/40 text-violet-100' : disabled ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-900/90 border-slate-700 hover:border-violet-400/60 hover:bg-violet-500/10 text-slate-200'}">
            <div class="text-[10px] font-mono ${done ? 'text-violet-300' : 'text-slate-400'}">${done ? '✓ ' : ''}${SKILL_LABELS[k].toUpperCase()}</div>
            <div class="text-[11px]">${escapeHtml(questionText(k))}</div>
          </button>
        `;
      }).join('');

      const transcriptHtml = c.transcript.length ? c.transcript.map(t => `
        <div class="space-y-1">
          <div class="flex justify-end"><div class="max-w-[85%] px-2.5 py-1.5 rounded-xl rounded-br-sm bg-cyan-500/15 border border-cyan-500/30 text-cyan-100">${escapeHtml(t.q)}</div></div>
          <div class="flex justify-start"><div class="max-w-[85%] px-2.5 py-1.5 rounded-xl rounded-bl-sm bg-slate-900 border border-slate-700 text-slate-200">
            ${escapeHtml(t.a)}
            <div class="mt-1 text-[10px] font-mono ${t.tier === 'high' ? 'text-emerald-300' : t.tier === 'mid' ? 'text-amber-300' : 'text-rose-300'}">${t.tier === 'high' ? 'Muy buena respuesta' : t.tier === 'mid' ? 'Respuesta correcta' : 'Respuesta floja'} · ${SKILL_LABELS[t.key]}</div>
          </div></div>
        </div>
      `).join('') : '<p class="text-[11px] text-slate-500">Elige una pregunta para comenzar la entrevista.</p>';

      document.getElementById('interview-content').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div class="md:col-span-2 space-y-3">
            <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full" style="background:${hex}"></span>
                <span class="text-sm font-bold text-white">${escapeHtml(a.name)}</span>
              </div>
              <div class="text-[11px] text-violet-200">${escapeHtml(a.role)} · ${escapeHtml(c.area)}</div>
              <div class="text-[11px] text-slate-400">Sala de destino: ${ZONES[c.zone].name}</div>
            </div>
            <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-white">CV vs. evaluación</span>
                <span class="text-[10px] font-mono text-slate-500">gris = CV</span>
              </div>
              ${SKILL_KEYS.map(k => skillBarHtml(SKILL_LABELS[k], c.claims[k], c.asked.includes(k) ? c.skills[k] : undefined)).join('')}
            </div>
            <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px]">
              <div class="text-xs font-semibold text-white mb-1">Impresión general</div>
              ${impressionHtml}
              <p class="mt-1.5 text-slate-500">Consejo: algunos candidatos exageran su CV y otros son modestos. Tus preguntas revelan la verdad.</p>
            </div>
          </div>
          <div class="md:col-span-3 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-white">Preguntas</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full ${remaining > 0 ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}">Quedan ${remaining}</span>
            </div>
            <div class="grid grid-cols-1 gap-1.5">${questionsHtml}</div>
            <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 max-h-64 overflow-y-auto text-[11px]">${transcriptHtml}</div>
          </div>
        </div>
      `;

      const full = teamSize() >= MAX_TEAM_SIZE;
      document.getElementById('interview-actions').innerHTML = `
        <span class="mr-auto self-center text-[10px] font-mono text-slate-500">Equipo ${teamSize()}/${MAX_TEAM_SIZE}</span>
        <button onclick="decideCandidate('later')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition">↩ Volver a la espera</button>
        <button onclick="decideCandidate('reject')" class="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold border border-rose-500/40 transition">✕ Rechazar</button>
        <button ${full ? 'disabled' : ''} onclick="decideCandidate('hire')" class="px-3 py-1.5 rounded-lg ${full ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'} text-xs font-semibold transition">✓ Contratar</button>
      `;
    }

    function updateDeliverablesBadge() {
      const el = document.getElementById('deliverables-count');
      if (el) el.textContent = String(DELIVERABLES.length);
    }

    function sendSpatialDirective(e) {
      e.preventDefault();
      const input = document.getElementById('spatial-input');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';

      const dir = activeDirector();
      const nearby = AGENTS.filter(a => a.type !== 'HUMAN' && a.type !== 'CANDIDATE' && !a.leaving && a.currentZone === dir.currentZone);
      const fallback = AGENTS.find(a => a.type !== 'HUMAN' && a.type !== 'CANDIDATE' && officeOf(a) === officeOf(dir));
      const targets = nearby.length > 0 ? nearby : [fallback || AGENTS.find(a => a.id === 'sofia_ia')];

      targets.forEach(ag => {
        ag.bubble = `"${text.slice(0, 22)}${text.length > 22 ? '…' : ''}"`;
        ag.status = 'working';
      });

      if (/caf[eé]|espresso|descanso|lounge/i.test(text) && nearby.length > 0) {
        const dest = /lounge|descanso/i.test(text) ? 'lounge' : 'cafe';
        sendAgentToBreak(nearby[0].id, dest);
        return;
      }

      if (/juego|game|jugar/i.test(text)) {
        launchMission('crear_juego', `Juego: ${text.slice(0, 42)}`);
        return;
      }

      if (/app|aplicaci[oó]n|interfaz|pantalla/i.test(text)) {
        launchMission('crear_app', `App: ${text.slice(0, 42)}`);
        return;
      }

      if (/ayuda|error|problema|c[oó]mo|soporte|gu[ií]a/i.test(text)) {
        launchMission('brindar_ayuda', `Ayuda: ${text.slice(0, 42)}`);
        return;
      }

      const quickDel = {
        id: 'del-' + Date.now(),
        title: `Solución & Entrega: ${text.slice(0, 46)}`,
        category: 'FRPROGRAMITY · Respuesta',
        createdAt: 'Ahora',
        authors: targets.map(t => t.name),
        status: 'Terminado',
        summary: `Atendido en ${ZONES[dir.currentZone].name}: "${text}".`,
        metrics: [
          { label: 'Sala', value: ZONES[dir.currentZone].name, positive: true },
          { label: 'Equipo', value: `${targets.length} agentes`, positive: true }
        ],
        table: targets.map(t => ({
          activo: t.name,
          peso: t.role,
          accion: 'Resuelto',
          nota: text
        })),
        body: `Solicitud registrada en FRPROGRAMITY: "${text}". Los especialistas asignados en ${ZONES[dir.currentZone].name} prepararon esta respuesta y la añadieron a Entregables.`
      };
      DELIVERABLES.unshift(quickDel);
      updateDeliverablesBadge();

      pushActivity(`Tú (${ZONES[dir.currentZone].name}): "${text}"`, 'SOLICITUD');
      showToast(`Enviado a ${targets.map(t => t.name).join(', ')}`);
      renderPanel();
    }

    function pushActivity(text, badge = 'INFO') {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      activityFeed.unshift({ time: now, text, badge });
      if (activityFeed.length > 25) activityFeed.pop();
    }

    function showToast(msg) {
      const container = document.getElementById('toast-container');
      const item = document.createElement('div');
      item.className = 'px-3 py-2 rounded-xl bg-slate-900/95 border border-cyan-500/35 text-xs text-slate-100 shadow-xl';
      item.textContent = msg;
      container.appendChild(item);
      setTimeout(() => item.remove(), 3200);
    }
