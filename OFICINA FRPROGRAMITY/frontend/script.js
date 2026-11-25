
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
      meeting_b: {
        id: 'meeting_b',
        name: '📊 Sala de Reuniones B',
        subtitle: 'Presentaciones de la empresa · 15 sillas + Director',
        x: -35.25, z: 5.625, w: 9.5, d: 8.25,
        color: 0x2563eb, cssColor: '#93c5fd',
        doors: [{ side: 'n', at: -32, width: 1.6 }, { side: 's', at: -37.5, width: 1.4 }],
        skipWalls: ['w'],
        boardroom: { head: -1 }, // cabecera junto a la fachada, pantalla en la pared este
        spots: []
      },
      recreativa: {
        id: 'recreativa',
        name: '🏓 Sala Recreativa',
        subtitle: 'Ping-pong, futbolín y arcades para desconectar',
        x: -24.5, z: 5.625, w: 12, d: 8.25,
        color: 0xd946ef, cssColor: '#f0abfc',
        doors: [{ side: 'n', at: -24.5, width: 1.8 }, { side: 'e', at: 5.6, width: 1.4 }, { side: 's', at: -27.5, width: 1.4 }],
        skipWalls: ['w'],
        spots: [[-29.0, 4.2, PI / 2], [-25.4, 4.2, -PI / 2], [-21.6, 2.4, 0], [-21.6, 4.0, PI], [-20.2, 8.25, PI], [-21.3, 8.25, PI],
          [-25.1, 8.8, 0], [-23.9, 8.8, 0], [-29.3, 7.7, PI * 0.8]]
      },
      gimnasio: {
        id: 'gimnasio',
        name: '🏋️ Gimnasio',
        subtitle: 'Cintas, bicis y pesas con vista a la calle',
        x: -34.75, z: 16.5, w: 10.5, d: 9,
        color: 0x22c55e, cssColor: '#86efac',
        doors: [{ side: 'n', at: -34.75, width: 1.6 }],
        skipWalls: ['w', 's'],
        spots: [[-38.0, 19.9, 0], [-36.4, 19.9, 0], [-34.8, 19.9, 0], [-32.8, 19.9, 0], [-31.3, 19.9, 0], [-33.0, 14.6, PI], [-31.0, 15.9, -PI / 2], [-37.0, 14.6, PI]]
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
    ZONES.meeting_b.spots = boardroomSpots(ZONES.meeting_b);

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

    // ------------------------------------------------------------------------
    // 3. ESCENA 3D DE FRPROGRAMITY (THREE.JS)
    // _________________________________________________________________
    let scene, camera, renderer, controls;
    let raycaster, mouse;
    let desiredCameraTarget = new THREE.Vector3(-7.5, 0.8, 4);
    let cameraMode = 'overview';

    const zoneFloorMeshes = {};
    const agentMeshes = {};
    const packetMeshes = [];
    let steamParticles = [];

    // ------------------------------------------------------------------------
    // 3.1 TEXTURAS PROCEDIMENTALES (THREE.CanvasTexture, sin URLs externas)
    // ------------------------------------------------------------------------
    const OFFICE_TEX = {};
    const OFFICE_MAT = {};
    const animatedScreens = [];
    const blinkingLeds = [];

    function officeHash(str) {
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    }

    function officeRandom(seed) {
      let s = (seed >>> 0) || 1;
      return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
      };
    }

    // Crea (y cachea) una textura de canvas. opts: { seed, color, clamp, repeat }
    function makeOfficeTexture(key, w, h, draw, opts = {}) {
      if (OFFICE_TEX[key]) return OFFICE_TEX[key];
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      draw(ctx, w, h, officeRandom(opts.seed !== undefined ? opts.seed : officeHash(key)));
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = tex.wrapT = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
      if (opts.repeat) tex.repeat.set(opts.repeat[0], opts.repeat[1]);
      if (opts.color) tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
      OFFICE_TEX[key] = tex;
      return tex;
    }

    // Copia de una textura con su propio repeat (comparte el canvas).
    // En r128 cada clon se sube por separado a la GPU, así que se cachean por (textura, repeat).
    const OFFICE_TEX_REPEAT = new Map();
    function officeTexRepeat(tex, rx, ry) {
      const key = tex.uuid + '|' + rx.toFixed(3) + '|' + ry.toFixed(3);
      let t = OFFICE_TEX_REPEAT.get(key);
      if (!t) {
        t = tex.clone();
        t.repeat.set(rx, ry);
        t.needsUpdate = true;
        OFFICE_TEX_REPEAT.set(key, t);
      }
      return t;
    }

    // Clon único (sin caché) para texturas que se animan por separado (pantallas de código)
    function officeTexUnique(tex, rx, ry) {
      const t = tex.clone();
      t.repeat.set(rx, ry);
      t.needsUpdate = true;
      return t;
    }

    // ------------------------------------------------------------------------
    // 3.1b CACHÉ DE GEOMETRÍAS Y MATERIALES (se crean una sola vez y se comparten)
    // ------------------------------------------------------------------------
    const GEO_CACHE = new Map();
    function cachedGeo(type, ...args) {
      const key = type + '|' + args.map(a => (typeof a === 'number' ? +a.toFixed(4) : a)).join(',');
      let g = GEO_CACHE.get(key);
      if (!g) {
        g = new THREE[type + 'Geometry'](...args);
        g.computeBoundingSphere();
        GEO_CACHE.set(key, g);
      }
      return g;
    }

    const MAT_CACHE = new Map();
    function cachedMat(key, factory) {
      let m = MAT_CACHE.get(key);
      if (!m) {
        m = factory();
        MAT_CACHE.set(key, m);
      }
      return m;
    }

    // Umbral de tamaño (radio de la esfera envolvente, en metros) para proyectar sombra
    const SHADOW_MIN_RADIUS = 0.2;

    function rgba(c, a) {
      return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    }

    // --- Alfombra modular con micro-trama y juntas (color / relieve) ---
    function drawCarpetTiles(ctx, w, h, rand, mode) {
      const tiles = 4;
      const ts = w / tiles;
      const bump = mode === 'bump';
      for (let ty = 0; ty < tiles; ty++) {
        for (let tx = 0; tx < tiles; tx++) {
          const x0 = tx * ts;
          const y0 = ty * ts;
          const shade = (rand() - 0.5) * 10;
          ctx.fillStyle = bump
            ? `rgb(${200 + shade},${200 + shade},${200 + shade})`
            : `rgb(${50 + shade},${56 + shade},${68 + shade})`;
          ctx.fillRect(x0, y0, ts, ts);
          const horizontal = (tx + ty) % 2 === 0;
          ctx.lineWidth = 1;
          for (let i = 0; i < 1100; i++) {
            const px = x0 + rand() * ts;
            const py = y0 + rand() * ts;
            const len = 2 + rand() * 4;
            const v = rand();
            if (bump) ctx.strokeStyle = v > 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(120,120,120,0.35)';
            else ctx.strokeStyle = v > 0.5 ? 'rgba(110,122,145,0.33)' : 'rgba(18,22,30,0.38)';
            ctx.beginPath();
            ctx.moveTo(px, py);
            if (horizontal) ctx.lineTo(px + len, py);
            else ctx.lineTo(px, py + len);
            ctx.stroke();
          }
          // micro-trama (bucle de fibra en filas)
          ctx.fillStyle = bump ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.08)';
          for (let k = 0; k < ts; k += 4) {
            if (horizontal) ctx.fillRect(x0, y0 + k, ts, 1);
            else ctx.fillRect(x0 + k, y0, 1, ts);
          }
          // juntas sutiles entre losetas
          ctx.fillStyle = bump ? 'rgb(140,140,140)' : 'rgba(12,14,20,0.8)';
          ctx.fillRect(x0, y0, ts, 1.5);
          ctx.fillRect(x0, y0, 1.5, ts);
        }
      }
    }

    // --- Madera natural con veta periódica (sin costuras al repetir) ---
    function drawWoodGrain(ctx, w, h, rand, mode, palette) {
      const bump = mode === 'bump';
      const base = palette.base, dark = palette.dark, light = palette.light;
      ctx.fillStyle = bump ? 'rgb(150,150,150)' : `rgb(${base[0]},${base[1]},${base[2]})`;
      ctx.fillRect(0, 0, w, h);
      // bandas anchas de tono
      for (let i = 0; i < 10; i++) {
        const y = rand() * h;
        const bh = 10 + rand() * 40;
        const useDark = rand() > 0.5;
        const strength = rand();
        ctx.fillStyle = bump ? `rgba(0,0,0,${0.04 * strength})` : rgba(useDark ? dark : light, 0.12 * strength);
        ctx.fillRect(0, y, w, bh);
      }
      // veta ondulada
      for (let i = 0; i < 150; i++) {
        const y = rand() * h;
        const amp = 1.5 + rand() * 6;
        const k1 = 1 + Math.floor(rand() * 3);
        const freq = (Math.PI * 2 * k1) / w;
        const phase = rand() * Math.PI * 2;
        const darkLine = rand() > 0.35;
        ctx.lineWidth = 0.5 + rand() * 1.6;
        ctx.strokeStyle = bump
          ? (darkLine ? 'rgba(60,60,60,0.35)' : 'rgba(220,220,220,0.25)')
          : (darkLine ? rgba(dark, 0.26) : rgba(light, 0.2));
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const yy = y + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3 + phase * 1.7) * amp * 0.25;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      // poros
      for (let i = 0; i < 2600; i++) {
        const px = rand() * w;
        const py = rand() * h;
        ctx.fillStyle = bump ? 'rgba(40,40,40,0.45)' : rgba(dark, 0.3);
        ctx.fillRect(px, py, 2 + rand() * 5, 0.8);
      }
    }

    // --- Piso laminado de oficina (tablones con juntas escalonadas) ---
    function drawLaminate(ctx, w, h, rand, mode) {
      const bump = mode === 'bump';
      const rows = 8;
      const rh = h / rows;
      for (let r = 0; r < rows; r++) {
        let x = -rand() * w * 0.5;
        while (x < w) {
          const len = w * (0.45 + rand() * 0.4);
          const t = (rand() - 0.5) * 26;
          ctx.fillStyle = bump ? 'rgb(170,170,170)' : `rgb(${150 + t},${112 + t * 0.8},${78 + t * 0.6})`;
          ctx.fillRect(x, r * rh, len, rh);
          for (let g = 0; g < 9; g++) {
            const gy = r * rh + rand() * rh;
            ctx.strokeStyle = bump ? 'rgba(80,80,80,0.3)' : 'rgba(80,52,30,0.22)';
            ctx.lineWidth = 0.6 + rand();
            ctx.beginPath();
            ctx.moveTo(x, gy);
            ctx.bezierCurveTo(x + len * 0.3, gy + (rand() - 0.5) * 6, x + len * 0.6, gy + (rand() - 0.5) * 6, x + len, gy);
            ctx.stroke();
          }
          ctx.fillStyle = bump ? 'rgb(60,60,60)' : 'rgba(40,26,16,0.7)';
          ctx.fillRect(x, r * rh, 1.5, rh);
          x += len;
        }
        ctx.fillStyle = bump ? 'rgb(60,60,60)' : 'rgba(40,26,16,0.75)';
        ctx.fillRect(0, r * rh, w, 1.5);
      }
    }

    // --- Mármol claro con vetas ---
    function drawMarble(ctx, w, h, rand) {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#eeebe6');
      grad.addColorStop(1, '#e2ddd6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = `rgba(150,145,140,${rand() * 0.08})`;
        ctx.fillRect(rand() * w, rand() * h, 2, 2);
      }
      for (let v = 0; v < 9; v++) {
        let x = rand() * w;
        let y = rand() * h;
        let ang = rand() * Math.PI * 2;
        const pts = [];
        for (let s = 0; s < 60; s++) {
          ang += (rand() - 0.5) * 0.6;
          x += Math.cos(ang) * 9;
          y += Math.sin(ang) * 9;
          pts.push([x, y]);
        }
        [[7, 0.05], [3, 0.12], [1, 0.35]].forEach(([lw, a]) => {
          ctx.strokeStyle = `rgba(105,100,98,${a})`;
          ctx.lineWidth = lw * (0.6 + rand() * 0.8);
          ctx.beginPath();
          pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
          ctx.stroke();
        });
      }
    }

    // --- Tela tejida neutra (se tiñe con material.color) ---
    function drawFabric(ctx, w, h, rand, mode) {
      const bump = mode === 'bump';
      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const weave = ((x >> 1) + (y >> 1)) % 2 === 0;
          const n = (rand() - 0.5) * 18;
          const v = (weave ? (bump ? 215 : 222) : (bump ? 140 : 190)) + n;
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillRect(x, y, 2, 2);
        }
      }
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
        ctx.fillRect(rand() * w, rand() * h, 8 + rand() * 24, 2);
      }
    }

    // --- Cuero con poro y arrugas finas ---
    function drawLeather(ctx, w, h, rand) {
      ctx.fillStyle = 'rgb(205,205,205)';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) {
        const r = 1 + rand() * 3;
        ctx.fillStyle = rand() > 0.5 ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.arc(rand() * w, rand() * h, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      for (let i = 0; i < 120; i++) {
        let x = rand() * w, y = rand() * h;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let s = 0; s < 5; s++) {
          x += (rand() - 0.5) * 14;
          y += (rand() - 0.5) * 14;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    // --- Metal cepillado ---
    function drawBrushedMetal(ctx, w, h, rand) {
      ctx.fillStyle = 'rgb(170,174,180)';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) {
        const v = rand() > 0.5 ? 255 : 60;
        ctx.fillStyle = `rgba(${v},${v},${v},${0.03 + rand() * 0.06})`;
        ctx.fillRect(rand() * w - 40, rand() * h, 40 + rand() * w, 1);
      }
    }

    // --- Ruido fino (superficies mate/satinadas, cerámica, maceta) ---
    function drawFineNoise(ctx, w, h, rand) {
      ctx.fillStyle = 'rgb(200,200,200)';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const v = Math.floor(120 + rand() * 135);
        ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
        ctx.fillRect(rand() * w, rand() * h, 1.5, 1.5);
      }
    }

    // --- Frente de rack: unidades 1U/2U, rejillas, bahías y LEDs ---
    function drawRackFront(ctx, w, h, rand, mode) {
      const emissive = mode === 'emissive';
      ctx.fillStyle = emissive ? '#000' : '#14171c';
      ctx.fillRect(0, 0, w, h);
      const units = 11;
      const uh = h / units;
      const ledColors = ['#34d399', '#2dd4bf', '#22d3ee', '#fbbf24', '#34d399', '#f87171'];
      for (let u = 0; u < units; u++) {
        const y = u * uh;
        if (!emissive) {
          ctx.fillStyle = '#1f242c';
          ctx.fillRect(10, y + 3, w - 20, uh - 6);
          ctx.fillStyle = '#2b313b';
          ctx.fillRect(10, y + 3, w - 20, 2);
        }
        // rejilla de ventilación
        for (let gx = 22; gx < w * 0.55; gx += 7) {
          for (let gy = y + 10; gy < y + uh - 8; gy += 7) {
            if (!emissive) {
              ctx.fillStyle = '#07080b';
              ctx.beginPath();
              ctx.arc(gx, gy, 2.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        // bahías de disco
        for (let b = 0; b < 3; b++) {
          const bx = w * 0.6 + b * 24;
          if (!emissive) {
            ctx.fillStyle = '#0d1014';
            ctx.fillRect(bx, y + 9, 20, uh - 18);
          }
          const on = rand() > 0.2;
          const col = ledColors[Math.floor(rand() * ledColors.length)];
          ctx.fillStyle = emissive ? (on ? col : '#000') : (on ? col : '#333');
          ctx.fillRect(bx + 3, y + uh - 14, 5, 3);
        }
        const pw = rand() > 0.15;
        ctx.fillStyle = emissive ? (pw ? '#60a5fa' : '#000') : '#3b82f6';
        ctx.beginPath();
        ctx.arc(w - 22, y + uh / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // --- Fachada de torres con ventanas encendidas ---
    function drawFacade(ctx, w, h, rand, mode) {
      const emissive = mode === 'emissive';
      ctx.fillStyle = emissive ? '#000' : '#0c1424';
      ctx.fillRect(0, 0, w, h);
      const cols = 8, rows = 16;
      const cw = w / cols, rh = h / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const lit = rand() > 0.55;
          const warm = rand() > 0.6;
          const b = 0.5 + rand() * 0.5;
          if (emissive) {
            ctx.fillStyle = lit ? (warm ? `rgba(255,214,160,${b})` : `rgba(220,240,255,${b})`) : '#000';
          } else {
            ctx.fillStyle = lit ? '#3b4a63' : '#16223a';
          }
          ctx.fillRect(c * cw + 3, r * rh + 4, cw - 6, rh - 8);
        }
      }
    }

    // --- Mapa de entorno (reflejos suaves de oficina) ---
    function drawEnvironment(ctx, w, h, rand) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#c7d2e0');
      g.addColorStop(0.45, '#6b7a90');
      g.addColorStop(0.55, '#3a4456');
      g.addColorStop(1, '#16191f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // paneles de luz de techo
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = 'rgba(255,250,240,0.9)';
        ctx.fillRect(rand() * w, 15 + rand() * 50, 40, 10);
      }
      // ventanales a la altura del horizonte
      ctx.fillStyle = 'rgba(150,190,240,0.35)';
      for (let x = 0; x < w; x += 64) ctx.fillRect(x + 4, h * 0.38, 56, h * 0.12);
    }

    // --- Alfombra de la zona de descanso ---
    function drawRug(ctx, w, h, rand) {
      ctx.fillStyle = '#8f6a55';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#e8dccb';
      ctx.lineWidth = 10;
      ctx.strokeRect(22, 22, w - 44, h - 44);
      ctx.strokeStyle = '#4b3a33';
      ctx.lineWidth = 4;
      ctx.strokeRect(44, 44, w - 88, h - 88);
      ctx.fillStyle = 'rgba(232,220,203,0.55)';
      for (let y = 80; y < h - 80; y += 48) {
        for (let x = 80; x < w - 80; x += 48) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-7, -7, 14, 14);
          ctx.restore();
        }
      }
      for (let i = 0; i < 6000; i++) {
        ctx.fillStyle = rand() > 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)';
        ctx.fillRect(rand() * w, rand() * h, 2, 2);
      }
    }

    // ---------------- Pantallas con interfaz simulada ----------------
    function drawScreenFrame(ctx, w, h, title, accent) {
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#111a2e';
      ctx.fillRect(0, 0, w, 26);
      ['#f87171', '#fbbf24', '#34d399'].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(14 + i * 14, 13, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = accent;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(title, 64, 18);
    }

    function drawCodeScreen(ctx, w, h, rand) {
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#161b22';
      ctx.fillRect(0, 0, 38, h);
      const kw = ['const', 'function', 'return', 'if', 'await', 'export', 'import', 'let', 'class', 'async'];
      const ids = ['player', 'render', 'state', 'level', 'api', 'useStore', 'buildApp', 'score', 'ticket', 'router', 'deploy', 'config'];
      const strs = ["'./engine'", "'/api/help'", "'ready'", "'FRPROGRAMITY'", "'v2.4.1'"];
      ctx.font = '13px monospace';
      const lh = 18;
      let indent = 0;
      for (let i = 0; i < Math.floor(h / lh); i++) {
        const y = 14 + i * lh;
        ctx.fillStyle = '#484f58';
        ctx.fillText(String(i + 1).padStart(3, ' '), 4, y);
        let x = 48 + indent * 18;
        const kind = rand();
        if (kind < 0.12) {
          ctx.fillStyle = '#8b949e';
          ctx.fillText('// ' + ids[Math.floor(rand() * ids.length)] + ' listo para revisión', x, y);
        } else if (kind < 0.2) {
          indent = Math.max(0, indent - 1);
          ctx.fillStyle = '#c9d1d9';
          ctx.fillText('}', 48 + indent * 18, y);
        } else {
          const parts = [
            ['#ff7b72', kw[Math.floor(rand() * kw.length)] + ' '],
            ['#d2a8ff', ids[Math.floor(rand() * ids.length)]],
            ['#c9d1d9', rand() > 0.5 ? ' = ' : '('],
            ['#a5d6ff', rand() > 0.5 ? strs[Math.floor(rand() * strs.length)] : String(Math.floor(rand() * 999))],
            ['#c9d1d9', rand() > 0.6 ? ') {' : ';']
          ];
          parts.forEach(([c, t]) => {
            ctx.fillStyle = c;
            ctx.fillText(t, x, y);
            x += ctx.measureText(t).width;
          });
          if (parts[4][1] === ') {') indent = Math.min(4, indent + 1);
        }
      }
      ctx.fillStyle = 'rgba(56,139,253,0.12)';
      ctx.fillRect(38, 14 + 6 * lh - 13, w, lh);
    }

    function drawGameScreen(ctx, w, h, rand) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#1e1b4b');
      sky.addColorStop(0.6, '#6d28d9');
      sky.addColorStop(1, '#f472b6');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + rand() * 0.6})`;
        ctx.fillRect(rand() * w, rand() * h * 0.5, 2, 2);
      }
      // colinas lejanas
      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += w / 12) ctx.lineTo(x, h * 0.62 - rand() * h * 0.18);
      ctx.lineTo(w, h);
      ctx.fill();
      // suelo de tiles
      const tile = Math.max(14, Math.floor(h / 10));
      for (let x = 0; x < w; x += tile) {
        ctx.fillStyle = '#65a30d';
        ctx.fillRect(x, h - tile * 1.6, tile - 1, tile * 0.4);
        ctx.fillStyle = '#7c4a24';
        ctx.fillRect(x, h - tile * 1.2, tile - 1, tile * 1.2);
      }
      // plataformas flotantes + monedas
      for (let p = 0; p < Math.max(3, Math.floor(w / 140)); p++) {
        const px = 30 + rand() * (w - 120);
        const py = h * 0.35 + rand() * h * 0.3;
        const pw = tile * (3 + Math.floor(rand() * 3));
        ctx.fillStyle = '#a16207';
        ctx.fillRect(px, py, pw, tile * 0.6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px, py, pw, 3);
        for (let c = 0; c < 3; c++) {
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(px + tile * 0.8 + c * tile, py - tile * 0.6, tile * 0.22, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // personaje y enemigo
      const hx = w * 0.22, hy = h - tile * 1.6 - tile * 1.4;
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(hx, hy, tile * 0.9, tile * 1.4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(hx + tile * 0.5, hy + tile * 0.25, tile * 0.22, tile * 0.22);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(w * 0.62, h - tile * 1.6 - tile * 0.45, tile * 0.45, Math.PI, 0);
      ctx.fill();
      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, w, Math.max(22, h * 0.1));
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(12, Math.floor(h * 0.065))}px monospace`;
      ctx.fillText('PUNTOS 012450', 12, Math.max(16, h * 0.075));
      ctx.fillText('NIVEL 3-2', w * 0.45, Math.max(16, h * 0.075));
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('♥ ♥ ♥', w - 90, Math.max(16, h * 0.075));
    }

    function drawAppScreen(ctx, w, h, rand) {
      drawScreenFrame(ctx, w, h, 'App Studio · Panel', '#67e8f9');
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 26, 80, h - 26);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i === 1 ? '#06b6d4' : '#334155';
        ctx.fillRect(12, 44 + i * 26, 56, 10);
      }
      const cards = [['Usuarios', '18.4k', '#22d3ee'], ['Sesiones', '72%', '#a78bfa'], ['Crash-free', '99.9%', '#34d399']];
      cards.forEach((c, i) => {
        const x = 92 + i * 98;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, 40, 90, 60);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.fillText(c[0], x + 8, 58);
        ctx.fillStyle = c[2];
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(c[1], x + 8, 86);
      });
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(92, 112, 290, h - 126);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        const x = 104 + i * 22;
        const y = h - 30 - (Math.sin(i * 0.7) * 0.3 + 0.4 + rand() * 0.25) * (h - 170);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // mockup de móvil
      const px = w - 112, py = 38;
      ctx.fillStyle = '#020617';
      ctx.fillRect(px, py, 96, h - 52);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(px + 6, py + 10, 84, h - 72);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(px + 6, py + 10, 84, 28);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? '#cbd5e1' : '#94a3b8';
        ctx.fillRect(px + 12, py + 48 + i * 30, 72, 20);
      }
    }

    function drawTicketScreen(ctx, w, h, rand) {
      drawScreenFrame(ctx, w, h, 'Centro de Ayuda · Tickets', '#fcd34d');
      const titles = ['Error al iniciar sesión', 'Configurar entorno', 'Pago no reflejado', 'Guía de instalación', 'App se cierra', 'Exportar reporte', 'Acceso a API', 'Duda de facturación'];
      const states = [['Abierto', '#f59e0b'], ['En curso', '#06b6d4'], ['Resuelto', '#10b981']];
      ctx.font = '12px sans-serif';
      for (let i = 0; i < 9; i++) {
        const y = 36 + i * 31;
        ctx.fillStyle = i % 2 ? '#0f172a' : '#111c33';
        ctx.fillRect(8, y, w - 16, 27);
        ctx.fillStyle = '#64748b';
        ctx.fillText('#' + (1040 + i), 16, y + 18);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(titles[i % titles.length], 70, y + 18);
        const s = states[Math.floor(rand() * states.length)];
        ctx.fillStyle = s[1];
        ctx.fillRect(w - 110, y + 6, 84, 16);
        ctx.fillStyle = '#0b1120';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(s[0], w - 102, y + 18);
        ctx.font = '12px sans-serif';
      }
    }

    function drawKanbanScreen(ctx, w, h, rand) {
      drawScreenFrame(ctx, w, h, 'Sala de Producto · Roadmap', '#a5b4fc');
      const cols = ['Ideas', 'En curso', 'Revisión', 'Listo'];
      const colColors = ['#818cf8', '#22d3ee', '#f59e0b', '#34d399'];
      const cw = (w - 20) / cols.length;
      cols.forEach((c, i) => {
        const x = 10 + i * cw;
        ctx.fillStyle = '#111a2e';
        ctx.fillRect(x + 3, 34, cw - 6, h - 42);
        ctx.fillStyle = colColors[i];
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(c, x + 10, 52);
        const n = 2 + Math.floor(rand() * 3);
        for (let k = 0; k < n; k++) {
          const y = 62 + k * 52;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x + 9, y, cw - 18, 44);
          ctx.fillStyle = colColors[i];
          ctx.fillRect(x + 9, y, 4, 44);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(x + 20, y + 10, (cw - 40) * (0.5 + rand() * 0.5), 6);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(x + 20, y + 24, (cw - 40) * (0.3 + rand() * 0.4), 5);
        }
      });
    }

    function drawKpiScreen(ctx, w, h, rand) {
      drawScreenFrame(ctx, w, h, 'Dirección · Lanzamientos', '#7dd3fc');
      const kpis = [['Lanzamientos', '12'], ['Uptime', '99.7%'], ['Tickets', '-38%']];
      kpis.forEach((k, i) => {
        const x = 12 + i * ((w - 24) / 3);
        ctx.fillStyle = '#111c33';
        ctx.fillRect(x, 36, (w - 24) / 3 - 8, 64);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText(k[0], x + 10, 56);
        ctx.fillStyle = ['#38bdf8', '#34d399', '#fbbf24'][i];
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(k[1], x + 10, 90);
      });
      const bw = (w - 40) / 12;
      for (let i = 0; i < 12; i++) {
        const bh = 30 + rand() * (h - 160);
        ctx.fillStyle = i === 11 ? '#38bdf8' : '#1e3a5f';
        ctx.fillRect(20 + i * bw, h - 16 - bh, bw - 6, bh);
      }
    }

    function drawQaScreen(ctx, w, h, rand) {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);
      ctx.font = '13px monospace';
      const tests = ['auth.login', 'game.collision', 'app.render', 'api.tickets', 'build.android', 'build.web', 'perf.60fps', 'ui.responsive', 'db.migrate', 'help.search', 'pay.checkout', 'qa.smoke'];
      tests.forEach((t, i) => {
        ctx.fillStyle = '#34d399';
        ctx.fillText('✓', 12, 22 + i * 20);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(t, 30, 22 + i * 20);
        ctx.fillStyle = '#64748b';
        ctx.fillText(Math.floor(20 + rand() * 400) + 'ms', w - 80, 22 + i * 20);
      });
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('142 pasadas · 0 fallidas', 12, h - 30);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(12, h - 20, w - 24, 8);
      ctx.fillStyle = '#14b8a6';
      ctx.fillRect(12, h - 20, (w - 24) * 0.92, 8);
    }

    const SCREEN_DRAWERS = {
      code: [512, 512, drawCodeScreen],
      game: [512, 320, drawGameScreen],
      gameWide: [1024, 232, drawGameScreen],
      app: [512, 320, drawAppScreen],
      tickets: [512, 320, drawTicketScreen],
      kanban: [512, 320, drawKanbanScreen],
      kpi: [512, 320, drawKpiScreen],
      qa: [512, 320, drawQaScreen]
    };

    function getScreenMaterial(kind) {
      const spec = SCREEN_DRAWERS[kind] || SCREEN_DRAWERS.code;
      const base = makeOfficeTexture('screen_' + kind, spec[0], spec[1], spec[2], { color: true, clamp: kind !== 'code' });
      const makeScreenMat = (tex) => new THREE.MeshStandardMaterial({
        color: 0x111111,
        map: tex,
        emissive: 0xffffff,
        emissiveMap: tex,
        emissiveIntensity: 0.95,
        roughness: 0.18,
        metalness: 0.0
      });
      if (kind !== 'code') {
        // Pantallas estáticas: un único material compartido por tipo
        return cachedMat('screen_' + kind, () => makeScreenMat(base));
      }
      // Pantallas de código: cada una se desplaza con su propia velocidad
      const tex = officeTexUnique(base, 1, 0.6875);
      tex.offset.y = Math.random();
      animatedScreens.push({ tex, speed: 0.0006 + Math.random() * 0.0006 });
      return makeScreenMat(tex);
    }

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
      roomFloor('recreativa', woodMat('recreativa'));
      roomFloor('gimnasio', new THREE.MeshStandardMaterial({ color: new THREE.Color(0x26303b).convertSRGBToLinear(), bumpMap: officeTexRepeat(OFFICE_TEX.noise, 8, 8), bumpScale: 0.01, roughness: 0.95 }));
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
    // 3.4h SALAS NUEVAS: reuniones, comedor, cocina, servicio, recreativa, gimnasio, formación y jardín
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

    function buildRecreationRoom() {
      // Ping-pong
      const ttGreen = solidMat('ttGreen', 0x166534, { roughness: 0.45 });
      const white = solidMat('lineWhite', 0xf8fafc);
      addPart(scene, officeBox(2.74, 0.05, 1.525), ttGreen, -27.2, 0.76, 4.2);
      addPart(scene, officeBox(2.74, 0.004, 0.02), white, -27.2, 0.787, 4.2, { cast: false });
      addPart(scene, officeBox(0.02, 0.16, 1.6), OFFICE_MAT.mesh, -27.2, 0.86, 4.2, { cast: false });
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => addPart(scene, officeBox(0.05, 0.74, 0.05), OFFICE_MAT.metalLeg, -27.2 + sx * 1.2, 0.37, 4.2 + sz * 0.62, { cast: false }));
      [[-28.3, 0.1], [-26.1, -0.2]].forEach(([px, dz]) => {
        const pad = addPart(scene, cachedGeo('Cylinder', 0.08, 0.08, 0.012, 16), solidMat('paddle', 0xdc2626), px, 0.795, 4.2 + dz, { cast: false });
        pad.rotation.z = 0.05;
      });
      addCollider(-27.2, 4.2, 2.74, 1.525);
      // Futbolín
      addPart(scene, officeBox(1.2, 0.85, 0.7), OFFICE_MAT.walnut, -21.6, 0.43, 3.2);
      addPart(scene, officeBox(1.1, 0.02, 0.6), ttGreen, -21.6, 0.86, 3.2, { cast: false });
      for (let i = 0; i < 4; i++) {
        const rod = addPart(scene, cachedGeo('Cylinder', 0.012, 0.012, 1.1, 6), OFFICE_MAT.chrome, -22.05 + i * 0.3, 0.92, 3.2, { cast: false });
        rod.rotation.x = Math.PI / 2;
      }
      addCollider(-21.6, 3.2, 1.2, 0.7);
      // Arcades
      [-20.2, -21.3].forEach((ax, i) => {
        const g = new THREE.Group();
        g.position.set(ax, 0, 9.1);
        g.rotation.y = Math.PI;
        addPart(g, officeBox(0.75, 1.75, 0.7), solidMat(i ? 'arcadeB' : 'arcadeA', i ? 0x7c3aed : 0xdb2777), 0, 0.875, 0);
        const scr = new THREE.Mesh(cachedGeo('Plane', 0.55, 0.45), getScreenMaterial('game'));
        scr.position.set(0, 1.3, 0.352);
        scr.rotation.x = -0.15;
        g.add(scr);
        addPart(g, officeBox(0.7, 0.06, 0.25), OFFICE_MAT.bezel, 0, 0.98, 0.42, { cast: false });
        addPart(g, officeBox(0.72, 0.16, 0.04), cachedMat('marquee' + i, () => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: i ? 0xa78bfa : 0xf472b6, emissiveIntensity: 1.2 })), 0, 1.66, 0.36, { cast: false });
        scene.add(g);
        addCollider(ax, 9.1, 0.75, 0.7);
      });
      // Sofá frente a la tele y pufs
      buildSofa(-24.5, 7.7, 0, OFFICE_MAT.sofaFabric, 2.4);
      buildWallDisplay(-24.5, 1.45, 9.65, 1.8, 1.0, 'game', Math.PI, false);
      [[-29.3, 8.6, 0xf97316], [-28.2, 8.95, 0x22d3ee]].forEach(([px, pz, c], i) => {
        const bean = addPart(scene, cachedGeo('Sphere', 0.42, 16, 12), solidMat('bean' + i, c, { roughness: 0.95 }), px, 0.28, pz);
        bean.scale.set(1, 0.62, 1);
        addCollider(px, pz, 0.7, 0.7);
      });
      // Diana en la pared oeste
      const dart = addPart(scene, cachedGeo('Cylinder', 0.23, 0.23, 0.04, 24), solidMat('dart', 0x1f2937), -30.4, 1.6, 3.0, { cast: false });
      dart.rotation.z = Math.PI / 2;
      const bull = addPart(scene, cachedGeo('Cylinder', 0.05, 0.05, 0.05, 16), solidMat('bull', 0xdc2626), -30.38, 1.6, 3.0, { cast: false });
      bull.rotation.z = Math.PI / 2;
      buildSignPanel('sign_play', -28.6, 1.75, 1.62, 1.8, 0.6, 0, 'PLAY ZONE', 'PING-PONG · ARCADES · FUTBOLÍN', '#e879f9');
    }

    function buildGymAndTraining() {
      // --- Gimnasio ---
      const rubber = solidMat('rubber', 0x111827, { roughness: 0.9 });
      [-38.0, -36.4, -34.8].forEach(tx => {
        const g = new THREE.Group();
        g.position.set(tx, 0, 19.9);
        addPart(g, officeBox(0.75, 0.16, 1.7), rubber, 0, 0.08, 0);
        addPart(g, officeBox(0.55, 0.02, 1.5), OFFICE_MAT.bezel, 0, 0.17, 0, { cast: false });
        [-1, 1].forEach(sx => addPart(g, officeBox(0.05, 1.15, 0.05), OFFICE_MAT.aluminium, sx * 0.33, 0.65, 0.75, { cast: false }));
        addPart(g, officeBox(0.7, 0.22, 0.12), OFFICE_MAT.bezel, 0, 1.25, 0.78, { cast: false });
        const scr = new THREE.Mesh(cachedGeo('Plane', 0.4, 0.14), getScreenMaterial('kpi'));
        scr.position.set(0, 1.27, 0.71);
        scr.rotation.y = Math.PI;
        g.add(scr);
        scene.add(g);
      });
      [-32.8, -31.3].forEach(bxp => {
        const g = new THREE.Group();
        g.position.set(bxp, 0, 19.9);
        addPart(g, officeBox(0.12, 0.08, 1.1), OFFICE_MAT.bezel, 0, 0.05, 0);
        addPart(g, officeBox(0.08, 0.75, 0.08), OFFICE_MAT.aluminium, 0, 0.45, -0.25);
        addPart(g, officeBox(0.24, 0.06, 0.3), OFFICE_MAT.blackLeather, 0, 0.86, -0.25);
        addPart(g, officeBox(0.08, 0.9, 0.08), OFFICE_MAT.aluminium, 0, 0.6, 0.35);
        addPart(g, officeBox(0.5, 0.04, 0.06), OFFICE_MAT.aluminium, 0, 1.06, 0.38);
        const wheel = addPart(g, cachedGeo('Cylinder', 0.22, 0.22, 0.06, 20), rubber, 0, 0.3, 0.2);
        wheel.rotation.z = Math.PI / 2;
        scene.add(g);
      });
      // estante de mancuernas y banco de pesas
      addPart(scene, officeBox(1.8, 1.0, 0.45), OFFICE_MAT.graphiteMatte, -37.5, 0.5, 12.45);
      for (let i = 0; i < 6; i++) {
        const db = addPart(scene, cachedGeo('Cylinder', 0.06, 0.06, 0.3, 10), OFFICE_MAT.chrome, -38.2 + i * 0.28, 1.06, 12.45, { cast: false });
        db.rotation.z = Math.PI / 2;
      }
      addCollider(-37.5, 12.45, 1.8, 0.45);
      addPart(scene, officeBox(0.35, 0.42, 1.2), OFFICE_MAT.blackLeather, -33.0, 0.21, 14.6);
      const bar = addPart(scene, cachedGeo('Cylinder', 0.02, 0.02, 1.6, 8), OFFICE_MAT.chrome, -33.0, 1.0, 14.2, { cast: false });
      bar.rotation.z = Math.PI / 2;
      [-1, 1].forEach(sx => {
        const plate = addPart(scene, cachedGeo('Cylinder', 0.2, 0.2, 0.05, 20), rubber, -33.0 + sx * 0.7, 1.0, 14.2, { cast: false });
        plate.rotation.z = Math.PI / 2;
        addPart(scene, officeBox(0.05, 1.0, 0.05), OFFICE_MAT.aluminium, -33.0 + sx * 0.45, 0.5, 14.15, { cast: false });
      });
      [[-31.0, 15.9, 0x14b8a6], [-31.0, 17.3, 0xa855f7], [-31.0, 18.7, 0xf43f5e]].forEach(([mx, mz, c], i) => {
        addPart(scene, officeBox(0.65, 0.012, 1.7), solidMat('mat' + i, c, { roughness: 0.9 }), mx, 0.006, mz, { cast: false });
      });
      const gymMirror = new THREE.Mesh(cachedGeo('Plane', 3.2, 1.3), cachedMat('mirror', () => new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.02, metalness: 1.0 })));
      gymMirror.position.set(-31.6, 1.45, 12.09);
      scene.add(gymMirror);
      buildPlant(-39.4, 12.6, 1.0);

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
      buildBoardroom(ZONES.meeting_b);
      buildDiningAndKitchen();
      buildServiceRooms();
      buildRecreationRoom();
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

    // _______________________________________________________
    // 4. ETIQUETAS 3D PROYECTADAS (SIN TRANSICIÓN CSS PARA EVITAR DESFASE)
    // _______________________________________________________
    function createProjectedLabels() {
      const overlay = document.getElementById('labels-overlay');
      overlay.innerHTML = '';
      roomLabelRefs.length = 0;
      agentLabelRefs.length = 0;

      Object.values(ZONES).forEach(zone => {
        const el = document.createElement('div');
        el.id = `room-label-${zone.id}`;
        el.className = 'room-tag-3d px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-700/80 text-[10px] font-mono font-semibold shadow-lg';
        el.style.color = zone.cssColor;
        el.textContent = zone.name;
        el.onclick = () => moveDirectorTo(zone.id);
        el.style.visibility = 'hidden';
        overlay.appendChild(el);
        roomLabelRefs.push({ el, zone, sx: undefined, sy: undefined, visible: false });
      });

      AGENTS.forEach(agent => createAgentLabel(agent));
    }

    function createAgentLabel(agent) {
      const overlay = document.getElementById('labels-overlay');
      const el = document.createElement('div');
      el.id = `agent-label-${agent.id}`;
      el.className = 'label-3d flex flex-col items-center';
      el.onclick = () => selectAgent(agent.id);
      const isCandidate = agent.type === 'CANDIDATE';
      const dot = agent.type === 'HUMAN' ? 'bg-cyan-400' : isCandidate ? 'bg-violet-400' : 'bg-emerald-400';
      const border = isCandidate ? 'border-violet-400/60' : 'border-cyan-500/35';
      const chip = isCandidate
        ? '<span class="px-1 rounded bg-violet-500/25 text-violet-200 text-[8px] font-mono tracking-wide">CANDIDATO</span>'
        : agent.hired ? '<span class="px-1 rounded bg-emerald-500/20 text-emerald-200 text-[8px] font-mono tracking-wide">NUEVO</span>' : '';
      el.innerHTML = `
        <div id="agent-bubble-${agent.id}" class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-900/95 border border-slate-700 text-slate-200 shadow-md whitespace-nowrap mb-1"></div>
        <div class="px-2 py-0.5 rounded-md bg-slate-950/95 border ${border} text-[10px] font-bold text-white flex items-center gap-1.5 shadow">
          <span class="w-1.5 h-1.5 rounded-full ${dot}"></span>
          ${rankEligible(agent) && agent.rankIdx !== undefined ? '<span class="text-[9px]" title="' + rankOf(agent).name + '">' + rankOf(agent).icon + '</span>' : ''}
          <span>${escapeHtml(agent.name)}</span>
          ${chip}
        </div>
      `;
      el.style.visibility = 'hidden';
      overlay.appendChild(el);
      agentLabelRefs.push({
        el,
        agent,
        bubbleEl: el.querySelector('#agent-bubble-' + CSS.escape(agent.id)),
        bubble: undefined,
        status: undefined,
        sx: undefined,
        sy: undefined,
        visible: false
      });
    }

    function removeAgentLabel(agentId) {
      const idx = agentLabelRefs.findIndex(r => r.agent.id === agentId);
      if (idx < 0) return;
      agentLabelRefs[idx].el.remove();
      agentLabelRefs.splice(idx, 1);
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    }

    // Referencias y estado previo de cada etiqueta: el DOM solo se toca cuando algo cambia
    const _labelVec = new THREE.Vector3();
    const roomLabelRefs = [];
    const agentLabelRefs = [];
    let viewportHalfW = window.innerWidth / 2;
    let viewportHalfH = window.innerHeight / 2;

    const BUBBLE_CLASSES = {
      break: 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/95 border border-amber-400/70 text-amber-200 shadow-md whitespace-nowrap mb-1',
      working: 'px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-950/95 border border-cyan-500/60 text-cyan-200 shadow-md whitespace-nowrap mb-1',
      waiting_human: 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-900/95 border border-indigo-300 text-white shadow-md whitespace-nowrap mb-1',
      candidate: 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-950/95 border border-violet-400/70 text-violet-100 shadow-md whitespace-nowrap mb-1',
      meeting: 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/95 border border-blue-400/70 text-blue-100 shadow-md whitespace-nowrap mb-1',
      onboarding: 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-950/95 border border-sky-400/70 text-sky-100 shadow-md whitespace-nowrap mb-1',
      idle: 'px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-900/90 border border-slate-700 text-slate-300 shadow-md whitespace-nowrap mb-1'
    };

    function updateViewportCache() {
      viewportHalfW = window.innerWidth / 2;
      viewportHalfH = window.innerHeight / 2;
    }

    // Proyecta _labelVec y coloca la etiqueta; escribe estilos solo si cambian
    function placeLabel(ref, anchor) {
      _labelVec.project(camera);
      if (_labelVec.z > 1 || _labelVec.z < -1) {
        if (ref.visible !== false) {
          ref.el.style.visibility = 'hidden';
          ref.visible = false;
        }
        return;
      }
      const sx = Math.round(_labelVec.x * viewportHalfW + viewportHalfW);
      const sy = Math.round(-_labelVec.y * viewportHalfH + viewportHalfH);
      if (ref.visible !== true) {
        ref.el.style.visibility = 'visible';
        ref.visible = true;
      }
      if (sx !== ref.sx || sy !== ref.sy) {
        ref.sx = sx;
        ref.sy = sy;
        ref.el.style.transform = 'translate3d(' + sx + 'px, ' + sy + 'px, 0) translate(' + anchor + ')';
      }
    }

    function updateProjectedLabels() {
      camera.updateMatrixWorld();

      for (let i = 0; i < roomLabelRefs.length; i++) {
        const ref = roomLabelRefs[i];
        const zone = ref.zone;
        _labelVec.set(zone.x, 0.25, zone.z + zone.d / 2 - 0.55);
        placeLabel(ref, '-50%, -50%');
      }

      for (let i = 0; i < agentLabelRefs.length; i++) {
        const ref = agentLabelRefs[i];
        const agent = ref.agent;
        const m = agentMeshes[agent.id];
        if (!m) continue;

        if (ref.bubble !== agent.bubble) {
          ref.bubble = agent.bubble;
          ref.bubbleEl.textContent = agent.bubble;
        }
        if (ref.status !== agent.status) {
          ref.status = agent.status;
          ref.bubbleEl.className = BUBBLE_CLASSES[agent.status] || BUBBLE_CLASSES.idle;
        }

        m.headGroup.getWorldPosition(_labelVec);
        // a distancia solo se muestra el nombre: menos ruido visual y menos trabajo para el navegador
        const far = camera.position.distanceToSquared(_labelVec) > 1600;
        if (ref.far !== far) {
          ref.far = far;
          ref.bubbleEl.style.display = far ? 'none' : '';
        }
        _labelVec.y += far ? 0.22 : 0.3;
        placeLabel(ref, '-50%, -100%');
      }
    }

    // _______________________________________________________
    // 5. AUTONOMÍA DE CAFÉ / DESCANSO + PROYECTOS / AYUDA + ENTREGABLES
    // _______________________________________________________
    // Energía estable: se gasta despacio, se recarga en salas de descanso y después de cada descanso
    // hay un periodo de espera antes del siguiente (salvo que la energía esté en estado crítico).
    const ENERGY = {
      tickMs: 2600,
      drainWorking: 0.5,      // ~5-6 min de trabajo continuo para bajar de 92 a 30
      drainIdle: 0.35,
      drainMeeting: 0.45,
      breakAt: 30,            // umbral para pedir un descanso
      critical: 14,           // por debajo de esto se salta la espera y el límite de grupo
      fullAt: 92,             // energía con la que vuelve al trabajo
      floor: 8,
      minBreakMs: 25000,      // un descanso dura al menos 25 s
      cooldownMs: 180000,     // 3 min mínimos entre descansos…
      cooldownJitterMs: 90000, // …más hasta 1,5 min aleatorios para que no vayan todos juntos
      maxOnBreakRatio: 0.3,   // como mucho un 30% del equipo descansando a la vez
      mealEveryMs: 900000     // cada ~15 min de juego les toca almorzar en el comedor
    };

    const BREAK_ZONES = {
      cafe: { rate: 4.2, weight: 3, label: '☕ En el Café', bubbles: ['☕ Tomando un café', '☕ Espresso en la barra'] },
      lounge: { rate: 3.4, weight: 2, label: '🛋️ Descansando', bubbles: ['🛋️ Descansando un rato', '🛋️ Pausa en el sofá'] },
      naturaleza: { rate: 4.8, weight: 3, label: '🌿 En el Jardín', bubbles: ['🌿 Respirando aire puro', '🧘 Meditando junto al estanque', '🦋 Mirando las mariposas', '🌳 Conectando con la naturaleza'] },
      recreativa: { rate: 3.6, weight: 1.6, label: '🏓 Recreativa', bubbles: ['🏓 Partido de ping-pong', '🕹️ En las arcades', '⚽ Partida de futbolín'] },
      gimnasio: { rate: 3.2, weight: 1.1, label: '🏋️ Gimnasio', bubbles: ['🏃 Corriendo en la cinta', '🚴 Pedaleando', '🏋️ Haciendo pesas'] },
      comedor: { rate: 5.5, weight: 0, label: '🍽️ Almorzando', bubbles: ['🍽️ Almorzando', '🥗 Comiendo con el equipo', '🍲 Menú del día'] }
    };

    // Las salas de las oficinas vecinas usan "tipos" (cafe, descanso…) en vez de ids fijos
    const BREAK_KIND_ALIAS = { descanso: 'lounge' };
    function zoneKind(zid) {
      const z = ZONES[zid];
      return (z && z.kind) || zid;
    }
    function breakInfo(zid) {
      const k = zoneKind(zid);
      return BREAK_ZONES[BREAK_KIND_ALIAS[k] || k] || null;
    }
    function officeOf(agent) {
      return (agent && agent.officeId) || 'main';
    }

    function agentStamina(agent) {
      if (agent._stamina === undefined) agent._stamina = 0.8 + (officeHash(agent.id + '|stamina') % 1000) / 1000 * 0.45;
      return agent._stamina * rankStaminaBonus(agent); // los rangos altos aguantan algo más
    }

    // ¿Está ocupado con un paso de proyecto? (ver projects.js)
    function isMissionAgent(agent) {
      return isProjectAgent(agent);
    }

    function chooseBreakZone(agent, now) {
      if (agent.lastMealAt === undefined) agent.lastMealAt = now - Math.random() * ENERGY.mealEveryMs;
      if (officeOf(agent) !== 'main') {
        // oficina vecina: descansa en su propio café o zona de descanso
        const own = Object.values(ZONES).filter(z => z.office === agent.officeId && breakInfo(z.id)).map(z => z.id);
        return own.length ? randPick(own) : agent.homeZone;
      }
      const crowd = (zid) => AGENTS.filter(a => a.status === 'break' && a.currentZone === zid).length;
      if (now - agent.lastMealAt > ENERGY.mealEveryMs && crowd('comedor') < ZONES.comedor.spots.length) return 'comedor';
      const options = Object.keys(BREAK_ZONES).filter(z => BREAK_ZONES[z].weight > 0 && crowd(z) < Math.max(3, (ZONES[z].spots || []).length));
      let r = Math.random() * options.reduce((s, z) => s + BREAK_ZONES[z].weight, 0);
      for (const z of options) { r -= BREAK_ZONES[z].weight; if (r <= 0) return z; }
      return 'cafe';
    }

    function startBreak(agent, breakZone, manual = false) {
      const now = performance.now();
      const prevZone = agent.currentZone;
      agent.currentZone = breakZone;
      agent.targetPos = getWaypointForZone(breakZone, agent.id);
      agent.status = 'break';
      agent.breakMinUntil = now + ENERGY.minBreakMs;
      agent.bubble = randPick((breakInfo(breakZone) || BREAK_ZONES.cafe).bubbles);
      spawnDataPacket(prevZone, breakZone, 0xfbbf24);
      pushActivity(`${agent.name} ${manual ? 'fue enviado/a' : 'fue'} a ${ZONES[breakZone].name} para recargar energía.`, 'DESCANSO');
    }

    function endBreak(agent, now) {
      const prevZone = agent.currentZone;
      if (prevZone === 'comedor') agent.lastMealAt = now;
      agent.cooldownUntil = now + ENERGY.cooldownMs + Math.random() * ENERGY.cooldownJitterMs;
      agent.currentZone = agent.homeZone;
      agent.targetPos = getWaypointForZone(agent.homeZone, agent.id);
      agent.status = 'working';
      agent.bubble = 'Recargado · de vuelta';
      agent.nextTaskAt = now + 8000;
      spawnDataPacket(prevZone, agent.homeZone, agent.color);
      pushActivity(`${agent.name} recargó energía y volvió a ${ZONES[agent.homeZone].name}.`, 'ENERGÍA');
    }

    function energyTick() {
      const now = performance.now();
      const staff = AGENTS.filter(a => a.type !== 'HUMAN' && a.type !== 'CANDIDATE' && !a.leaving);
      // el límite de gente descansando a la vez se calcula por oficina
      const onBreakBy = {}, sizeBy = {};
      staff.forEach(a => {
        const o = officeOf(a);
        sizeBy[o] = (sizeBy[o] || 0) + 1;
        if (a.status === 'break') onBreakBy[o] = (onBreakBy[o] || 0) + 1;
      });
      let changed = false;

      staff.forEach(agent => {
        if (agent.status === 'onboarding') return;
        const office = officeOf(agent);
        if (agent.status === 'break') {
          // solo recarga cuando ya llegó a la sala de descanso
          if (isAgentArrived(agent)) {
            const rate = (breakInfo(agent.currentZone) || BREAK_ZONES.cafe).rate;
            agent.energy = Math.min(100, agent.energy + rate);
          }
          if (agent.energy >= ENERGY.fullAt && now >= (agent.breakMinUntil || 0)) {
            endBreak(agent, now);
            onBreakBy[office]--;
            changed = true;
          }
          return;
        }

        const drain = agent.status === 'meeting' ? ENERGY.drainMeeting : agent.status === 'working' ? ENERGY.drainWorking : ENERGY.drainIdle;
        agent.energy = Math.max(ENERGY.floor, agent.energy - drain / agentStamina(agent));
        // experiencia por tiempo trabajado (rangos)
        if (agent.status === 'working') grantXp(agent, 1);
        else if (agent.status === 'meeting') grantXp(agent, 1.5);
        if (agent.status === 'meeting' || agent.status === 'waiting_human' || isMissionAgent(agent)) return;

        const critical = agent.energy <= ENERGY.critical;
        const rested = now >= (agent.cooldownUntil || 0);
        const maxOnBreak = Math.max(2, Math.floor((sizeBy[office] || 1) * ENERGY.maxOnBreakRatio));
        if (agent.energy <= ENERGY.breakAt && (rested || critical) && ((onBreakBy[office] || 0) < maxOnBreak || critical)) {
          startBreak(agent, chooseBreakZone(agent, now));
          onBreakBy[office] = (onBreakBy[office] || 0) + 1;
          changed = true;
        }
      });

      updateServiceStaff(now);
      if (changed && activeTab === 'team') renderPanel();
    }

    // Rutinas del personal de servicio: limpieza recorre las salas, cocina alterna fogones y buffet
    function updateServiceStaff(now) {
      AGENTS.forEach(a => {
        if (a.status !== 'working' || a.leaving || a.type === 'CANDIDATE') return;
        if (a.homeZone !== 'limpieza' && a.homeZone !== 'cocina') return;
        if (!isAgentArrived(a)) return;
        if (a.nextTaskAt === undefined) a.nextTaskAt = now + 5000 + Math.random() * 8000;
        if (now < a.nextTaskAt) return;
        a.taskCount = (a.taskCount || 0) + 1;
        if (a.homeZone === 'limpieza') {
          a.nextTaskAt = now + 22000 + Math.random() * 18000;
          if (a.taskCount % 4 === 0) {
            a.currentZone = 'limpieza';
            a.targetPos = getWaypointForZone('limpieza', a.id);
            a.bubble = '🧺 Reponiendo materiales';
          } else {
            const pool = ['banos', 'banos', 'comedor', 'comedor', 'cocina', 'reception', 'naturaleza', 'cafe', 'lounge', 'meeting', 'meeting_b',
              'games', 'apps', 'software', 'help_desk', 'qa_lab', 'recreativa', 'gimnasio', 'formacion', 'director_hub'];
            const zid = randPick(pool);
            a.currentZone = zid;
            a.targetPos = randomFreePointInZone(zid, a.id);
            a.bubble = '🧹 Limpiando ' + ZONES[zid].name.replace(/^\S+\s/, '');
          }
        } else {
          a.nextTaskAt = now + 28000 + Math.random() * 16000;
          if (a.taskCount % 2 === 0) {
            a.currentZone = 'comedor';
            const busy = AGENTS.some(o => o.id !== a.id && o.targetPos && Math.hypot(o.targetPos.x - BUFFET_SPOT[0], o.targetPos.z - BUFFET_SPOT[1]) < 0.5);
            a.targetPos = busy ? randomFreePointInZone('comedor', a.id) : spotToTarget(BUFFET_SPOT);
            a.bubble = '🍽️ Sirviendo el buffet';
          } else {
            a.currentZone = 'cocina';
            a.targetPos = getWaypointForZone('cocina', a.id);
            a.bubble = randPick(['🍳 Cocinando el menú', '🥘 Preparando la comida', '🔪 Cortando verduras']);
          }
        }
      });
    }

    function startAutonomousFloorEngine() {
      const now = performance.now();
      // reparte la hora del último almuerzo y del último descanso para que no coincidan todos
      AGENTS.forEach(a => {
        a.lastMealAt = now - Math.random() * ENERGY.mealEveryMs;
        a.cooldownUntil = now + Math.random() * 60000;
      });
      setInterval(energyTick, ENERGY.tickMs);
    }

    function sendAgentToBreak(agentId, breakZone) {
      const agent = AGENTS.find(a => a.id === agentId);
      if (!agent || agent.type === 'HUMAN' || agent.type === 'CANDIDATE' || agent.leaving) return;
      // en una oficina vecina, "Café"/"Descansar"/"Jardín" usan sus propias salas
      if (officeOf(agent) !== 'main') {
        const kind = breakZone === 'lounge' || breakZone === 'naturaleza' ? 'descanso' : 'cafe';
        breakZone = agent.officeId + '_' + kind;
        if (!ZONES[breakZone]) return;
      }
      startBreak(agent, breakZone, true);
      showToast(`${agent.name} enviado a ${ZONES[breakZone].name}`);
      renderPanel();
    }

    // ---- Reuniones convocadas por el Director (hasta 15 asistentes + cabecera) ----
    const MEETING = { active: null };
    const MEETING_DURATION_MS = 45000;

    function convokeMeeting(zoneId) {
      const zone = ZONES[zoneId];
      if (!zone || !zone.boardroom) return;
      if (MEETING.active) { showToast('Ya hay una reunión en curso.'); return; }
      const office = zone.office || 'main';
      const pool = AGENTS.filter(a => a.type !== 'HUMAN' && a.type !== 'CANDIDATE' && !a.leaving && officeOf(a) === office &&
        !['break', 'waiting_human', 'onboarding'].includes(a.status) && !isMissionAgent(a));
      pool.sort((a, b) => (b.status === 'working') - (a.status === 'working'));
      const attendees = pool.slice(0, zone.spots.length - 1);
      if (!attendees.length) { showToast('No hay miembros disponibles para reunirse ahora.'); return; }
      attendees.forEach((a, i) => {
        a.preMeetingStatus = a.status;
        a.status = 'meeting';
        a.currentZone = zoneId;
        a.targetPos = spotToTarget(zone.spots[i + 1]);
        a.bubble = '📊 En reunión';
      });
      const dir = AGENTS.find(a => a.id === (office === 'main' ? 'human_dir' : office + '_dir'));
      if (dir) {
        dir.currentZone = zoneId;
        dir.targetPos = spotToTarget(zone.spots[0]);
        dir.bubble = '🎤 Presentando';
        if (dir === activeDirector()) {
          const badge = document.getElementById('user-zone-badge');
          if (badge) badge.textContent = zone.name;
        }
      }
      MEETING.active = { zone: zoneId, director: dir ? dir.id : null, endsAt: performance.now() + MEETING_DURATION_MS, attendees: attendees.map(a => a.id) };
      pushActivity(`Convocaste una reunión en ${zone.name} con ${attendees.length} miembros.`, 'REUNIÓN');
      showToast(`📊 Reunión en ${zone.name}: ${attendees.length} asistentes`);
      renderPanel();
    }

    function endMeeting() {
      if (!MEETING.active) return;
      const zone = ZONES[MEETING.active.zone];
      MEETING.active.attendees.forEach(id => {
        const a = AGENTS.find(x => x.id === id);
        if (!a || a.leaving || a.status !== 'meeting') return;
        a.status = 'working';
        a.currentZone = a.homeZone;
        a.targetPos = getWaypointForZone(a.homeZone, a.id);
        a.bubble = 'Volviendo con nuevas ideas';
        grantXp(a, 15);
      });
      const dir = AGENTS.find(a => a.id === MEETING.active.director);
      if (dir) dir.bubble = 'Reunión terminada';
      pushActivity(`Terminó la reunión en ${zone.name}.`, 'REUNIÓN');
      showToast(`Reunión terminada en ${zone.name}`);
      MEETING.active = null;
      renderPanel();
    }

    function callAgentBackToDesk(agentId) {
      const agent = AGENTS.find(a => a.id === agentId);
      if (!agent || agent.type === 'HUMAN' || agent.type === 'CANDIDATE' || agent.leaving) return;
      const prevZone = agent.currentZone;
      agent.currentZone = agent.homeZone;
      agent.targetPos = getWaypointForZone(agent.homeZone, agent.id);
      agent.status = 'working';
      agent.bubble = 'Trabajando en su estación';
      spawnDataPacket(prevZone, agent.homeZone, agent.color);
      pushActivity(`${agent.name} regresó a ${ZONES[agent.homeZone].name}.`, 'TRABAJO');
      renderPanel();
    }

    // Director que controlas ahora mismo (tu avatar o el de la oficina vecina activa)
    function activeDirector() {
      const id = ACTIVE_OFFICE === 'main' ? 'human_dir' : ACTIVE_OFFICE + '_dir';
      return AGENTS.find(a => a.id === id) || AGENTS.find(a => a.id === 'human_dir');
    }

    function moveDirectorTo(zoneId) {
      const dir = activeDirector();
      const zone = ZONES[zoneId];
      if (!dir || !zone) return;
      dir.currentZone = zoneId;
      dir.targetPos = getWaypointForZone(zoneId, dir.id);
      dir.bubble = `En ${zone.name}`;
      document.getElementById('user-zone-badge').textContent = zone.name;
      pushActivity(`Te moviste a ${zone.name}.`, 'DIRECTOR');
      showToast(`Movido a ${zone.name}`);
    }

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
      help_desk: {
        area: 'Ayuda', roles: ['Soporte Técnico', 'Customer Success', 'Especialista de Onboarding'],
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
        area: 'QA', roles: ['QA Automation', 'Tester de Rendimiento', 'QA Exploratorio'],
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