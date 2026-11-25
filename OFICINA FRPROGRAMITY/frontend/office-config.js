    // [office-config.js] Parte de lo que antes era script.js: CONFIGURACIÓN de salas y ESTADO GLOBAL (secciones 1 y 2).
    // Se carga en orden desde index.html; no cambies el orden de los archivos.

    // _____________________________________________________________________
    // 1. CONFIGURACIÓN DE FRPROGRAMITY (JUEGOS, APPS, SOFTWARE & AYUDA)
    // _____________________________________________________________________
    // Cada sala es un rectángulo (x, z = centro; w, d = tamaño) con paredes, puertas y puestos.
    //  - doors: { side: 'n' (z mínima) | 's' (z máxima) | 'w' (x mínima) | 'e' (x máxima), at: coordenada del centro de la puerta, width }
    //  - skipWalls: lados que no se construyen porque otra sala ya levanta esa pared compartida
    //  - spots: puestos [x, z, orientación] donde se ubican los agentes (yaw 0 mira a +z, PI mira a -z)
    const PI = Math.PI;
    const ZONES = {
      games: {
        id: 'games',
        name: '🎮 Sala de Juegos',
        subtitle: 'Game loops, física, niveles y arte interactivo',
        x: -11, z: -4.5, w: 9.5, d: 8.5,
        color: 0xa855f7, cssColor: '#d8b4fe',
        doors: [{ side: 's', at: -11, width: 1.6 }, { side: 'e', at: -2.0, width: 1.4 }],
        spots: [[-12.8, -3.55, PI, 1], [-9.2, -3.55, PI, 1], [-11, -6.9, PI], [-14.4, -1.6, PI * 0.75], [-7.6, -6.4, -PI / 2]]
      },
      apps: {
        id: 'apps',
        name: '📱 Estudio de Apps',
        subtitle: 'Aplicaciones web y móviles con UI fluida',
        x: -11, z: 5.5, w: 9.5, d: 8.0,
        color: 0x06b6d4, cssColor: '#67e8f9',
        doors: [{ side: 'n', at: -11, width: 1.6 }],
        spots: [[-12.8, 6.35, PI, 1], [-9.2, 6.35, PI, 1], [-11, 8.4, PI], [-14.4, 3.0, 0], [-7.6, 3.0, 0]]
      },
      software: {
        id: 'software',
        name: '💻 Ingeniería de Software',
        subtitle: 'APIs, arquitecturas, automatización y código',
        x: -0.625, z: 6.5, w: 9.25, d: 6.5,
        color: 0x10b981, cssColor: '#6ee7b7',
        doors: [{ side: 'n', at: 2.6, width: 1.6 }, { side: 's', at: -3.5, width: 1.6 }],
        spots: [[-2.4, 7.5, PI, 1], [-1, 7.5, PI, 1], [0.4, 7.5, PI, 1], [2.7, 5.4, -PI / 2], [-4.4, 5.0, PI / 2], [2.8, 8.7, PI]]
      },
      help_desk: {
        id: 'help_desk',
        name: '🛟 Centro de Ayuda',
        subtitle: 'Soporte técnico, guías paso a paso y resolución',
        x: 8.125, z: 6.5, w: 8.25, d: 6.5,
        color: 0xf59e0b, cssColor: '#fcd34d',
        doors: [{ side: 'n', at: 5.6, width: 1.6 }],
        skipWalls: ['w'],
        spots: [[7.6, 7.5, PI, 1], [9.4, 7.5, PI, 1], [11.4, 5.0, -PI / 2], [5.0, 8.6, PI / 2], [11.4, 8.8, PI]]
      },
      meeting: {
        id: 'meeting',
        name: '🧩 Sala de Reuniones A',
        subtitle: 'Producto: presentaciones y revisión · 15 sillas + Director',
        x: 0.5, z: -1.875, w: 9.0, d: 6.95,
        color: 0x6366f1, cssColor: '#a5b4fc',
        doors: [{ side: 'e', at: 0.5, width: 1.6 }, { side: 'w', at: 0.95, width: 1.2 }],
        boardroom: { head: 1 },  // la cabecera del Director mira al oeste (pantalla en la pared oeste)
        spots: []
      },
      director_hub: {
        id: 'director_hub',
        name: '🚀 Dirección ' + BRAND,
        subtitle: 'Priorización de lanzamientos y aprobaciones',
        x: 0.5, z: -8.275, w: 9.0, d: 5.85,
        color: 0x38bdf8, cssColor: '#7dd3fc',
        doors: [{ side: 'e', at: -6.6, width: 1.4 }],
        skipWalls: ['s'],
        spots: [[0.5, -10.2, 0, 1], [0.5, -7.9, PI], [-2.4, -7.2, PI / 2], [3.4, -7.2, -PI / 2], [-2.8, -9.8, PI / 2]]
      },
      cafe: {
        id: 'cafe',
        name: '☕ Café & Espresso',
        subtitle: 'Barra de café y recarga rápida del equipo',
        x: 10.5, z: -7.8, w: 8.5, d: 5.6,
        color: 0xf97316, cssColor: '#fdba74',
        doors: [{ side: 's', at: 8.6, width: 2.4 }],
        spots: [[9.3, -7.85, PI], [10.5, -7.85, PI], [11.7, -7.85, PI], [7.4, -6.2, PI * 0.8], [13.4, -6.3, -PI * 0.8], [13.3, -8.4, -PI / 2]]
      },
      lounge: {
        id: 'lounge',
        name: '🛋️ Zona de Descanso',
        subtitle: 'Sofás y pausa creativa para recargar energía',
        x: 15.5, z: -1.025, w: 6.5, d: 6.45,
        color: 0xec4899, cssColor: '#f9a8d4',
        doors: [{ side: 'w', at: -1.0, width: 2.6 }],
        spots: [[14.8, -1.95, 0], [16.2, -1.95, 0], [14.8, -0.05, PI], [16.2, -0.05, PI], [13.2, -3.5, PI * 0.25], [18.0, 1.4, PI]]
      },
      qa_lab: {
        id: 'qa_lab',
        name: '🧪 QA & Builds',
        subtitle: 'Pruebas de calidad, rendimiento y empaquetado',
        x: 15.5, z: 6.875, w: 6.5, d: 5.75,
        color: 0x14b8a6, cssColor: '#5eead4',
        doors: [{ side: 'n', at: 13.6, width: 1.6 }],
        skipWalls: ['w'],
        spots: [[14.2, 8.6, PI], [16.6, 8.6, PI], [17.9, 5.35, PI], [13.3, 5.0, 0], [18.1, 9.0, PI]]
      },
      reception: {
        id: 'reception',
        name: '🛎️ Recepción',
        subtitle: 'Llegada de candidatos, registro y sala de espera',
        x: 4, z: 16.5, w: 13, d: 9,
        color: 0xf43f5e, cssColor: '#fda4af',
        doors: [{ side: 'n', at: 8.0, width: 2.0 }, { side: 'e', at: 15, width: 1.4 }, { side: 'w', at: 14, width: 1.6 }],
        skipWalls: ['s'], // la fachada principal (con la entrada) cierra este lado
        spots: [[4, 13.7, 0, 1], [7.6, 17.6, -PI / 2], [8.8, 13.4, PI], [1.8, 13.4, PI], [6.5, 19.6, PI]]
      },
      interview: {
        id: 'interview',
        name: '🤝 Sala de Entrevistas',
        subtitle: 'Entrevistas para sumar nuevos miembros a la empresa',
        x: 13.75, z: 15, w: 6.5, d: 6,
        color: 0x8b5cf6, cssColor: '#c4b5fd',
        doors: [],
        skipWalls: ['w'],
        spots: [[15.25, 15, -PI / 2, 1], [12.75, 15, PI / 2, 1], [14, 13.0, 0], [16.2, 17.2, PI]]
      },

      // ---------------- ALA OESTE (x -40 .. -18.5) ----------------
      comedor: {
        id: 'comedor',
        name: '🍽️ Comedor',
        subtitle: 'Almuerzo del equipo con vista al parque · 30 puestos',
        x: -33, z: -6.85, w: 14, d: 12.7,
        color: 0xeab308, cssColor: '#fde047',
        doors: [{ side: 's', at: -33, width: 2.4 }, { side: 'e', at: -5.9, width: 1.4 }],
        skipWalls: ['n', 'w'], // fachadas de vidrio con vista
        spots: [] // se generan con las mesas (ver DINING_TABLES)
      },
      cocina: {
        id: 'cocina',
        name: '👩‍🍳 Cocina',
        subtitle: 'Preparación del menú diario del comedor',
        x: -22.25, z: -9.1, w: 7.5, d: 8.2,
        color: 0xef4444, cssColor: '#fca5a5',
        doors: [{ side: 'e', at: -9, width: 1.4 }],
        skipWalls: ['n', 'w'],
        spots: [[-23.5, -11.9, PI], [-21.0, -11.9, PI], [-22.25, -8.2, PI], [-20.0, -6.6, PI / 2], [-24.3, -6.5, -PI / 2]]
      },
      limpieza: {
        id: 'limpieza',
        name: '🧹 Limpieza',
        subtitle: 'Conserjería, materiales y mantenimiento',
        x: -24, z: -2.75, w: 4, d: 4.5,
        color: 0x84cc16, cssColor: '#bef264',
        doors: [{ side: 's', at: -24, width: 1.4 }],
        skipWalls: ['n', 'w'],
        spots: [[-24.4, -2.2, -PI / 2], [-23.0, -1.4, PI], [-24.6, -3.9, -PI / 2]]
      },
      banos: {
        id: 'banos',
        name: '🚻 Baños',
        subtitle: 'Aseos del personal',
        x: -20.25, z: -2.75, w: 3.5, d: 4.5,
        color: 0x94a3b8, cssColor: '#cbd5e1',
        doors: [{ side: 's', at: -20.25, width: 1.2 }],
        skipWalls: ['n', 'w'],
        spots: [[-19.6, -2.3, PI / 2], [-20.4, -1.3, PI]]
      },
      // Antes Sala de Reuniones B: ahora es la sala del Director para practicar y aprender
      practica: {
        id: 'practica',
        name: '🧠 Sala de Práctica del Director',
        subtitle: 'Algoritmos, programación, electrónica y robótica',
        x: -35.25, z: 5.625, w: 9.5, d: 8.25,
        color: 0xa78bfa, cssColor: '#c4b5fd',
        doors: [{ side: 'n', at: -32, width: 1.6 }, { side: 's', at: -37.5, width: 1.4 }],
        skipWalls: ['w'],
        reserved0: true, // el puesto 0 (el escritorio principal) es del Director
        spots: [[-36.5, 4.85, PI, 1], [-33.0, 8.45, PI, 1], [-34.2, 3.0, -PI / 2], [-38.6, 7.2, PI / 2]]
      },
      // Antes era la Sala Recreativa: ahora es la sala grande donde el equipo se reúne
      // a trabajar en los proyectos importantes de la empresa (ver teamwork.js)
      programacion: {
        id: 'programacion',
        name: '💻 Sala de Programación',
        subtitle: 'Sala grande para los proyectos importantes de la empresa',
        x: -24.5, z: 5.625, w: 12, d: 8.25,
        color: 0xf59e0b, cssColor: '#fcd34d',
        doors: [{ side: 'n', at: -24.5, width: 1.8 }, { side: 'e', at: 5.6, width: 1.4 }, { side: 's', at: -27.5, width: 1.4 }],
        skipWalls: ['w'],
        // 8 escritorios (2 filas de 4) + líder junto a las pantallas + 2 puestos de pie para revisar
        spots: [[-28.6, 5.05, PI, 1], [-26.4, 5.05, PI, 1], [-22.6, 5.05, PI, 1], [-20.4, 5.05, PI, 1],
          [-28.6, 8.15, PI, 1], [-26.4, 8.15, PI, 1], [-22.6, 8.15, PI, 1], [-20.4, 8.15, PI, 1],
          [-24.5, 3.0, PI], [-24.5, 6.6, PI / 2], [-24.5, 8.9, PI]]
      },
      mecatronica: {
        // Antes Gimnasio: ahora el equipo hace aquí los trabajos de mecatrónica, robótica y electrónica
        id: 'mecatronica',
        name: '🤖 Laboratorio de Mecatrónica',
        subtitle: 'Electrónica, robótica y mecatrónica con Arduino',
        x: -34.75, z: 16.5, w: 10.5, d: 9,
        color: 0x14b8a6, cssColor: '#5eead4',
        doors: [{ side: 'n', at: -34.75, width: 1.6 }],
        skipWalls: ['w', 's'],
        // 8 puestos en los bancos de trabajo + 2 junto a la zona de pruebas del robot
        spots: [[-38.2, 15.45, PI, 1], [-37.0, 15.45, PI, 1], [-35.2, 15.45, PI, 1], [-34.0, 15.45, PI, 1],
          [-38.2, 18.75, PI, 1], [-37.0, 18.75, PI, 1], [-35.2, 18.75, PI, 1], [-34.0, 18.75, PI, 1],
          [-31.2, 16.4, -PI / 2], [-31.6, 19.6, PI]]
      },
      formacion: {
        id: 'formacion',
        name: '📚 Formación',
        subtitle: 'Inducción de nuevos miembros y capacitaciones',
        x: -25.25, z: 16.5, w: 8.5, d: 9,
        color: 0x60a5fa, cssColor: '#bfdbfe',
        doors: [{ side: 'n', at: -28.5, width: 1.6 }],
        skipWalls: ['w', 's'],
        trainerSpot: true, // el puesto 0 (frente a la pantalla) es del formador
        spots: [[-24.5, 13.2, 0]]
      },
      naturaleza: {
        id: 'naturaleza',
        name: '🌿 Jardín Natural',
        subtitle: 'Árboles, estanque y meditación para reconectar',
        x: -11.75, z: 16.5, w: 18.5, d: 9,
        color: 0x16a34a, cssColor: '#4ade80',
        doors: [{ side: 'n', at: -15, width: 2.0 }, { side: 'n', at: -7, width: 2.0 }],
        skipWalls: ['w', 's', 'e'],
        spots: [[-17.3, 16.6, 0], [-16.4, 16.6, 0], [-15.5, 16.6, 0], [-12.6, 14.45, 0, 1], [-11.8, 14.45, 0, 1], [-10.2, 14.45, 0, 1], [-9.4, 14.45, 0, 1],
          [-6.2, 17.6, -PI / 2, 1], [-6.2, 18.6, -PI / 2, 1], [-14.2, 16.3, PI / 2], [-12.0, 20.0, PI], [-4.2, 16.2, -PI / 2]]
      }
    };

    // Sala de reuniones: mesa larga de 7 + 7 sillas, 1 en el pie y la cabecera del Director.
    // spots[0] = cabecera (Director); spots[1..15] = asistentes.
    function boardroomTableLen(zone) {
      return (zone.boardroom.perSide || 7) * 0.9 + 0.3;
    }
    function boardroomSpots(zone) {
      const dir = zone.boardroom.head; // +1: cabecera al este, -1: cabecera al oeste
      const per = zone.boardroom.perSide || 7;
      const end = boardroomTableLen(zone) / 2 + 0.55;
      const s = [[zone.x + dir * end, zone.z, dir > 0 ? -PI / 2 : PI / 2, 1]];
      for (let i = 0; i < per; i++) {
        const x = zone.x - (per - 1) * 0.45 + i * 0.9;
        s.push([x, zone.z - 1.25, 0, 1]);
        s.push([x, zone.z + 1.25, PI, 1]);
      }
      s.push([zone.x - dir * end, zone.z, dir > 0 ? PI / 2 : -PI / 2, 1]);
      return s;
    }
    ZONES.meeting.spots = boardroomSpots(ZONES.meeting);

    // Comedor: 5 mesas de 6 = 30 puestos + puesto del buffet
    const DINING_TABLES = [[-36.4, -10.9], [-36.4, -7.4], [-36.4, -3.9], [-31.2, -9.15], [-31.2, -5.65]];
    DINING_TABLES.forEach(([tx, tz]) => {
      [-0.8, 0, 0.8].forEach(dx => {
        ZONES.comedor.spots.push([tx + dx, tz - 0.75, 0, 1]);
        ZONES.comedor.spots.push([tx + dx, tz + 0.75, PI, 1]);
      });
    });
    const BUFFET_SPOT = [-28.3, -10.2, PI / 2];

    // Formación: 3 x 3 pupitres mirando a la pantalla de la pared norte
    const TRAINING_DESKS = [];
    [-27.6, -25.1, -22.6].forEach(x => [14.8, 16.9, 19.0].forEach(z => TRAINING_DESKS.push([x, z])));
    TRAINING_DESKS.forEach(([x, z]) => ZONES.formacion.spots.push([x, z + 0.75, PI, 1]));

    // Puestos especiales del flujo de reclutamiento
    const RECEPTION_CHECKIN = [4, 16.05, PI];                 // frente al mostrador
    const RECEPTION_WAIT = [[-0.4, 19.3, PI], [0.8, 19.3, PI], [-0.95, 16.2, PI / 2], [-0.95, 17.4, PI / 2]];
    const INTERVIEW_SPOTS = { interviewer: [15.25, 15, -PI / 2, 1], candidate: [12.75, 15, PI / 2, 1] };
    const STREET_SPAWN = { x: 4, z: 27.2 };
    const MAX_TEAM_SIZE = 40; // miembros del equipo sin contar al Director

    const STATUS_ITEMS = [
      { label: 'JUEGO', text: 'Plataformas 2D/3D · 60 FPS', tone: 'text-purple-300' },
      { label: 'APPS', text: 'Interfaces rápidas & responsivas', tone: 'text-cyan-300' },
      { label: 'SOFTWARE', text: 'Módulos limpios & APIs listas', tone: 'text-emerald-300' },
      { label: 'AYUDA', text: 'Soporte directo & diagnósticos', tone: 'text-amber-300' },
      { label: 'QA', text: 'Tests automáticos sin errores', tone: 'text-teal-300' },
      { label: 'CAFÉ', text: 'Espresso activo en barra', tone: 'text-orange-300' },
      { label: 'TALENTO', text: 'Recepción abierta · entrevistas en vivo', tone: 'text-rose-300' }
    ];

    const AGENTS = [
      {
        id: 'human_dir',
        name: DIRECTOR_LABEL + ' (Director)',
        role: 'Dirección ' + BRAND,
        type: 'HUMAN',
        color: 0x38bdf8,
        outfitColor: 0x1e293b,
        homeZone: 'director_hub',
        currentZone: 'director_hub',
        pos: { x: 0.5, z: -8.2 },
        targetPos: { x: 0.5, z: -8.2 },
        yaw: 0,
        walkPhase: 0,
        status: 'available',
        energy: 96,
        bubble: 'Guiando ' + BRAND,
        task: 'Definir prioridades de juegos, apps, software y ayuda',
        inputSpec: 'Ideas, requerimientos y solicitudes de ayuda',
        outputSpec: 'Objetivos aprobados y lanzamientos listos',
        tools: ['Roadmap', 'Approval Gate', 'Team Sync']
      },
      {
        id: 'camila_ia',
        name: 'Camila IA',
        role: 'Product & Game Lead',
        type: 'AI',
        color: 0xc084fc,
        outfitColor: 0x3b0764,
        homeZone: 'games',
        currentZone: 'games',
        pos: { x: -11.5, z: -4.2 },
        targetPos: { x: -11.5, z: -4.2 },
        yaw: 0,
        walkPhase: 0,
        status: 'working',
        energy: 80,
        bubble: 'Diseñando mecánicas de juego',
        task: 'Crear prototipos de juegos, niveles y puntuación',
        inputSpec: 'Concepto del juego, controles y objetivo',
        outputSpec: 'Juego jugable y reglas de partida',
        tools: ['Game Loop', 'Collision & Score', 'Level Builder']
      },
      {
        id: 'mateo_ia',
        name: 'Mateo IA',
        role: 'Apps & UI Builder',
        type: 'AI',
        color: 0x22d3ee,
        outfitColor: 0x083344,
        homeZone: 'apps',
        currentZone: 'apps',
        pos: { x: -11.5, z: 5.2 },
        targetPos: { x: -11.5, z: 5.2 },
        yaw: 0,
        walkPhase: 0,
        status: 'working',
        energy: 73,
        bubble: 'Armando pantallas de la app',
        task: 'Construir aplicaciones interactivas y formularios',
        inputSpec: 'Flujos de usuario, vistas y acciones',
        outputSpec: 'App funcional lista para usar',
        tools: ['UI Components', 'State Store', 'Responsive Layout']
      },
      {
        id: 'elena_ia',
        name: 'Elena IA',
        role: 'Software Architect',
        type: 'AI',
        color: 0x34d399,
        outfitColor: 0x064e3b,
        homeZone: 'software',
        currentZone: 'software',
        pos: { x: -1.5, z: 6.2 },
        targetPos: { x: -1.5, z: 6.2 },
        yaw: 0,
        walkPhase: 0,
        status: 'working',
        energy: 65,
        bubble: 'Escribiendo módulos de software',
        task: 'Desarrollar lógica de negocio, utilidades y datos',
        inputSpec: 'Reglas del sistema, entradas y salidas esperadas',
        outputSpec: 'Código modular, documentado y reutilizable',
        tools: ['Code Generator', 'Schema Validator', 'Automation Runner']
      },
      {
        id: 'sofia_ia',
        name: 'Sofía IA',
        role: 'Help & Support Specialist',
        type: 'AI',
        color: 0xfbbf24,
        outfitColor: 0x451a03,
        homeZone: 'help_desk',
        currentZone: 'help_desk',
        pos: { x: 8.2, z: 6.2 },
        targetPos: { x: 8.2, z: 6.2 },
        yaw: 0,
        walkPhase: 0,
        status: 'working',
        energy: 84,
        bubble: 'Listos para brindarte ayuda',
        task: 'Resolver dudas, guiar paso a paso y dar soluciones',
        inputSpec: 'Consulta, problema o duda de cualquier usuario',
        outputSpec: 'Guía clara, solución práctica y próximos pasos',
        tools: ['Step-by-Step Guide', 'Troubleshooter', 'FAQ Knowledge']
      },
      {
        id: 'lucas_ia',
        name: 'Lucas IA',
        role: 'QA & Bug Hunter',
        type: 'AI',
        color: 0x2dd4bf,
        outfitColor: 0x042f2e,
        homeZone: 'qa_lab',
        currentZone: 'qa_lab',
        pos: { x: 15.0, z: 6.5 },
        targetPos: { x: 15.0, z: 6.5 },
        yaw: 0,
        walkPhase: 0,
        status: 'working',
        energy: 46,
        bubble: 'Probando builds sin fallos',
        task: 'Verificar errores, bordes y rendimiento en toda la empresa',
        inputSpec: 'Juegos, apps o software recién construidos',
        outputSpec: 'Reporte de calidad y verificación final',
        tools: ['Edge Case Tester', 'Performance Check', 'Release Guard']
      },
      {
        id: 'valentina_ia',
        name: 'Valentina IA',
        role: 'UX & Onboarding Helper',
        type: 'AI',
        color: 0xf472b6,
        outfitColor: 0x500724,
        homeZone: 'help_desk',
        currentZone: 'help_desk',
        pos: { x: 10.2, z: 6.8 },
        targetPos: { x: 10.2, z: 6.8 },
        yaw: 0,
        walkPhase: 0,
        status: 'idle',
        energy: 39,
        bubble: 'Preparando guías rápidas',
        task: 'Simplificar instrucciones y asistencia al usuario',
        inputSpec: 'Flujos complejos o preguntas frecuentes',
        outputSpec: 'Tutoriales simples y acompañamiento',
        tools: ['Walkthrough Builder', 'Clarity Check', 'Support Notes']
      },
      {
        id: 'diego_ia',
        name: 'Diego IA',
        role: 'Full-Stack & Tools Engineer',
        type: 'AI',
        color: 0x818cf8,
        outfitColor: 0x1e1b4b,
        homeZone: 'software',
        currentZone: 'software',
        pos: { x: 0.8, z: 6.8 },
        targetPos: { x: 0.8, z: 6.8 },
        yaw: 0,
        walkPhase: 0,
        status: 'working',
        energy: 54,
        bubble: 'Conectando herramientas & APIs',
        task: 'Integrar servicios, almacenamiento y exportación',
        inputSpec: 'Endpoints, formatos de archivo y eventos',
        outputSpec: 'Integración estable y lista para producción',
        tools: ['API Connector', 'Storage Sync', 'Build Script']
      },
      {
        id: 'andres_ia',
        name: 'Andrés IA',
        role: 'Release & Docs Coordinator',
        type: 'AI',
        color: 0x60a5fa,
        outfitColor: 0x172554,
        homeZone: 'meeting',
        currentZone: 'meeting',
        pos: { x: 1.5, z: -1.5 },
        targetPos: { x: 1.5, z: -1.5 },
        yaw: 0,
        walkPhase: 0,
        status: 'working',
        energy: 89,
        bubble: 'Empaquetando entregables',
        task: 'Reunir lo terminado y dejar documentación clara',
        inputSpec: 'Resultados de juegos, apps, software y ayuda',
        outputSpec: 'Entregable terminado y listo para abrir',
        tools: ['Release Notes', 'Package Builder', 'Handoff Hub']
      },
      {
        id: 'lucia_ia',
        name: 'Lucía IA',
        role: 'Recepción & Talento',
        type: 'AI',
        color: 0xfb7185,
        outfitColor: 0x4c0519,
        homeZone: 'reception',
        currentZone: 'reception',
        pos: { x: 4, z: 14.05 },
        targetPos: { x: 4, z: 14.05 },
        yaw: 0,
        walkPhase: 0,
        status: 'working',
        energy: 92,
        bubble: 'Recibiendo candidatos',
        task: 'Registrar a los candidatos y acompañarlos a su entrevista',
        inputSpec: 'Candidatos que llegan a la oficina',
        outputSpec: 'Candidatos registrados y listos para entrevistar',
        tools: ['Registro de Visitas', 'Agenda de Entrevistas', 'Bienvenida']
      }
    ];

    // Puesto fijo (índice en zone.spots) de cada miembro dentro de su sala de trabajo
    const HOME_SPOTS = {
      human_dir: 0, camila_ia: 0, mateo_ia: 0, elena_ia: 0, diego_ia: 2,
      sofia_ia: 0, valentina_ia: 1, lucas_ia: 0, andres_ia: 1, lucia_ia: 0
    };

    // Entregables reales: solo los crean los proyectos que tú ordenas (ver projects.js)
    let DELIVERABLES = [];

    // ------------------------------------------------------------------------
    // 2. ESTADO GLOBAL DE LA APLICACIÓN
    // _________________________________________________________________
    let activeTab = 'operations';
    let selectedAgentId = 'camila_ia';
    let panelMinimized = false;
    let currentModalDeliverable = null;

    let activityFeed = [
      { time: 'Ahora', text: BRAND + ': oficina virtual abierta. El equipo IA solo trabaja en lo que tú ordenes.', badge: 'OFICINA' }
    ];
