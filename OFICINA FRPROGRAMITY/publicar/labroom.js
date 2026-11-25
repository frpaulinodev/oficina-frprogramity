    // _____________________________________________________________________
    // LABORATORIO EN LA OFICINA
    // - Botón 🔬 Lab en la barra de abajo: abre el laboratorio (lab.html) encima de la oficina.
    // - Sala de Práctica del Director: al entrar se abre el laboratorio en Algoritmos.
    // - Laboratorio de Mecatrónica: al entrar se abre el simulador de circuitos.
    // - Proyectos de MECATRÓNICA: el equipo diseña el circuito y escribe el código Arduino,
    //   comprueba que compila en el simulador y lo entrega listo para montarlo de verdad.
    // _____________________________________________________________________

    // ---------- Abrir y cerrar el laboratorio ----------
    function labProjectHash(project) {
      const json = JSON.stringify(project);
      return 'p=' + btoa(unescape(encodeURIComponent(json)));
    }

    function openLab(arg) {
      const hash = typeof arg === 'object' && arg ? labProjectHash(arg) : 'tab=' + (arg || 'circuito');
      let ov = document.getElementById('lab-overlay');
      if (!ov) {
        ov = document.createElement('div');
        ov.id = 'lab-overlay';
        ov.style.cssText = 'position:fixed;inset:0;z-index:9000;background:#0b1120;display:flex;flex-direction:column';
        ov.innerHTML = '<iframe id="lab-frame" title="Laboratorio" style="flex:1;width:100%;border:0" allow="clipboard-write"></iframe>';
        document.body.appendChild(ov);
      }
      const fr = document.getElementById('lab-frame');
      const url = 'lab.html#' + hash;
      if (fr.getAttribute('src') !== url) fr.setAttribute('src', url);
      ov.style.display = 'flex';
      if (typeof musicDuck === 'function') musicDuck(true);
    }

    function closeLab() {
      const ov = document.getElementById('lab-overlay');
      if (ov) ov.style.display = 'none';
      if (typeof musicDuck === 'function') musicDuck(false);
    }

    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'frp-lab-close') closeLab();
    });
    window.addEventListener('keydown', (e) => {
      const ov = document.getElementById('lab-overlay');
      if (e.key === 'Escape' && ov && ov.style.display !== 'none') closeLab();
    });

    // Botón en la barra de abajo
    (function addLabDockButton() {
      const ref = document.getElementById('dock-3d');
      if (!ref || document.getElementById('dock-lab')) return;
      const b = document.createElement('button');
      b.id = 'dock-lab';
      b.className = 'dock-btn';
      b.title = 'Laboratorio: Arduino, robótica, electrónica y algoritmos';
      b.innerHTML = '<span>🔬</span><small>Lab</small>';
      b.onclick = () => openLab('circuito');
      ref.parentNode.insertBefore(b, ref);
    })();

    // Al llevar al Director a una de las salas, se abre su herramienta
    const LAB_ROOMS = { practica: 'algoritmos', mecatronica: 'circuito' };
    const _baseMoveDirectorTo = moveDirectorTo;
    moveDirectorTo = function (zoneId) {
      _baseMoveDirectorTo(zoneId);
      if (LAB_ROOMS[zoneId]) {
        showToast(zoneId === 'practica' ? '🧠 Tu Sala de Práctica: abriendo el laboratorio…' : '🤖 Laboratorio de Mecatrónica: abriendo el simulador…');
        setTimeout(() => openLab(LAB_ROOMS[zoneId]), 1200);
      }
    };
    if (typeof director3dInteract === 'function') {
      const _baseInteract = director3dInteract;
      director3dInteract = function () {
        const dir = typeof activeDirector === 'function' ? activeDirector() : null;
        if (dir && LAB_ROOMS[dir.currentZone]) { openLab(LAB_ROOMS[dir.currentZone]); return; }
        return _baseInteract();
      };
    }

    // ---------- Proyectos de mecatrónica ----------
    PROJECT_TEMPLATES.crear_mecatronica = {
      office: 'main', icon: '🤖', label: 'Mecatrónica', tone: 'text-teal-300', kind: 'mecatronica',
      titles: ['Robot "Explorador"', 'Sensor de Parqueo "Distancia+"', 'Riego Automático "Planta Feliz"', 'Brazo Robótico "Pinza"', 'Alarma "Guardián"'],
      summary: 'Diseñar el circuito, programar el Arduino, probarlo en el simulador y entregar materiales y conexiones.',
      steps: [
        { zone: 'mecatronica', desc: 'Diseñar el circuito y elegir los componentes', bubble: '🔌 Diseñando el circuito' },
        { zone: 'mecatronica', desc: 'Programar el Arduino y montarlo en el simulador', bubble: '⌨️ Programando el Arduino' },
        { zone: 'mecatronica', desc: 'Probar el montaje en el simulador', bubble: '🧪 Probando el montaje' },
        { zone: 'meeting', desc: 'Preparar la entrega con materiales y conexiones', bubble: '📦 Preparando la entrega' }
      ]
    };
    if (typeof AI_KIND_HINT !== 'undefined') AI_KIND_HINT.mecatronica = 'un montaje de electrónica / robótica / mecatrónica con Arduino Uno: lista de componentes con sus pines y el código Arduino (.ino) real que lo controla';

    // El proyecto se guarda como una página que abre el laboratorio con el montaje cargado
    function labWrapperHtml(project) {
      const t = String(project.titulo || 'Montaje').replace(/[<>&"']/g, '');
      return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${t}</title>
<style>html,body{margin:0;height:100%;background:#0b1120}iframe{width:100%;height:100vh;border:0;display:block}</style></head>
<body><iframe src="lab.html#${labProjectHash(project)}" title="${t}"></iframe>
<!-- MONTAJE ${encodeURIComponent(JSON.stringify(project))} -->
</body></html>`;
    }
    function labFromCode(code) {
      const m = String(code || '').match(/<!-- MONTAJE ([^ ]+) -->/);
      if (!m) return null;
      try { return JSON.parse(decodeURIComponent(m[1])); } catch (e) { return null; }
    }

    // Sin IA: se elige un ejemplo del laboratorio según lo que pida el Director
    function presetForBrief(text) {
      const t = String(text || '').toLowerCase();
      const pick = (id) => (typeof PRESETS !== 'undefined' ? PRESETS.find(p => p.id === id) : null);
      const rules = [[/parque|distanc|ultras/, 'distancia'], [/sem[aá]foro/, 'semaforo'], [/brazo|pinza/, 'brazo'], [/temperatur|term[oó]metro|lcd|pantalla/, 'termometro'],
        [/ventilador|calor/, 'ventilador'], [/luz|ldr|oscur|l[aá]mpara/, 'luz_auto'], [/alarma|movimiento|pir|intrus/, 'alarma_pir'], [/servo/, 'servo_pot'],
        [/rgb|color/, 'rgb_serial'], [/bot[oó]n/, 'boton'], [/brillo|potenci/, 'pot_led']];
      const hit = rules.find(([re]) => re.test(t));
      return pick(hit ? hit[1] : 'blink');
    }

    const _labBaseGenerate = generateProjectCode;
    generateProjectCode = function (p) {
      if (p && p.kind === 'mecatronica') {
        const pre = presetForBrief((p.brief || '') + ' ' + (p.title || ''));
        const project = pre
          ? { titulo: p.title, descripcion: pre.descripcion, componentes: pre.componentes, codigo: pre.codigo }
          : { titulo: p.title, descripcion: '', componentes: [], codigo: 'void setup() {\n}\n\nvoid loop() {\n}' };
        return ensureLegalAndCredits(labWrapperHtml(project), p);
      }
      return _labBaseGenerate(p);
    };

    // El equipo escribe el montaje con la IA
    const MECA_PIN_KEYS = ['pin', 'trig', 'echo', 'r', 'g', 'b', 'base', 'codo', 'pinza'];
    const MECA_SCHEMA = {
      type: 'object', additionalProperties: false, required: ['titulo', 'descripcion', 'componentes', 'codigo'],
      properties: {
        titulo: { type: 'string' },
        descripcion: { type: 'string' },
        componentes: {
          type: 'array',
          items: {
            type: 'object', additionalProperties: false, required: ['tipo', 'nombre', 'color', 'pines'],
            properties: {
              tipo: { type: 'string', enum: Object.keys(typeof COMPONENT_TYPES !== 'undefined' ? COMPONENT_TYPES : { led: 1 }) },
              nombre: { type: 'string' },
              color: { type: 'string', enum: ['rojo', 'verde', 'amarillo', 'azul', 'blanco', 'ninguno'] },
              pines: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['nombre', 'numero'], properties: { nombre: { type: 'string', enum: MECA_PIN_KEYS }, numero: { type: 'integer' } } } }
            }
          }
        },
        codigo: { type: 'string' }
      }
    };
    const MECA_RULES = `Placa: Arduino Uno. Pines digitales 2-13 (PWM en 3, 5, 6, 9, 10, 11) y analógicos A0-A5, que se escriben como 14-19 en "numero".
Componentes y sus pines: led(pin, color), rgb(r,g,b), boton(pin, usa INPUT_PULLUP), pot(pin analógico), ldr(pin analógico), temp = LM35 (pin analógico), ultrasonico = HC-SR04 (trig, echo), pir(pin), servo(pin), motor(pin PWM), buzzer(pin, usa tone/noTone), rele(pin), lcd = LCD 16x2 I2C (sin pines, usa LiquidCrystal_I2C lcd(0x27,16,2)), brazo = 3 servos (base, codo, pinza).
El código debe ser Arduino REAL (C++), que compile en el Arduino IDE y funcione en la placa: setup() y loop(), comentarios en español, librerías Servo.h y LiquidCrystal_I2C.h si hacen falta. No uses pines 0 y 1.`;

    function mecaToProject(r) {
      const comps = (Array.isArray(r.componentes) ? r.componentes : []).slice(0, 14).map(c => {
        const pines = {};
        (c.pines || []).forEach(x => { if (MECA_PIN_KEYS.includes(x.nombre)) pines[x.nombre] = Math.max(0, Math.min(19, Number(x.numero) || 0)); });
        const out = { tipo: c.tipo, nombre: String(c.nombre || '').slice(0, 40), pines };
        if (c.tipo === 'led') out.color = ['rojo', 'verde', 'amarillo', 'azul', 'blanco'].includes(c.color) ? c.color : 'rojo';
        return out;
      }).filter(c => typeof COMPONENT_TYPES === 'undefined' || COMPONENT_TYPES[c.tipo]);
      return { titulo: String(r.titulo || '').slice(0, 80), descripcion: String(r.descripcion || '').slice(0, 400), componentes: comps, codigo: String(r.codigo || '').replace(/^```\w*\s*|```\s*$/g, '').slice(0, 20000) };
    }

    async function mecaBuild(p, a, issues) {
      const t = teamOf(p);
      if (!t.spec) await teamPlan(p, a);
      const current = labFromCode(p.code);
      let user = projectContext(p);
      if ((issues && issues.length) || (t.feedback && t.built)) {
        user += '\n\nMontaje actual (corrígelo y devuélvelo completo):\n' + JSON.stringify(current);
        if (issues && issues.length) user += '\n\nProblemas a corregir:\n' + issues.map(x => `- [${x.gravedad}] ${x.descripcion}`).join('\n');
      }
      const lvl = seniority(a);
      let project = null, compileErr = '';
      for (let attempt = 0; attempt < 2; attempt++) {
        const r = await teamJson(agentPersona(a) + '\nEres quien diseña y programa el montaje electrónico.\n' + MECA_RULES + (compileErr ? `\n\nTu versión anterior NO compiló: ${compileErr}. Corrígelo.` : ''),
          [{ role: 'user', content: user }], MECA_SCHEMA, lvl === 'junior' ? 6000 : 9000);
        project = mecaToProject(r);
        // ¿compila en el simulador?
        try { if (typeof transpileArduino === 'function') { const js = transpileArduino(project.codigo).js; new Function('return (async () => {' + js + '\n})'); } compileErr = ''; break; }
        catch (e) { compileErr = String(e.message || e); }
      }
      if (!project.titulo) project.titulo = p.title;
      p.code = ensureLegalAndCredits(labWrapperHtml(project), p);
      p.codeSource = 'IA';
      t.built = true;
      t.lastBuilder = a.name;
      bumpStat(a, 'codigos');
      if (!p.authors.includes(a.name)) p.authors.push(a.name);
      teamLog(p, a, 'build', (issues && issues.length ? `Corregí ${issues.length} problema(s) del montaje. ` : '') +
        `Montaje con ${project.componentes.length} componente(s): ${project.componentes.map(c => c.nombre || c.tipo).join(', ')}.` + (compileErr ? ' ⚠️ El código aún no compila en el simulador.' : ' El código compila en el simulador.'));
    }

    const _labBaseTeamBuild = teamBuild;
    teamBuild = function (p, a, issues) {
      return p && p.kind === 'mecatronica' ? mecaBuild(p, a, issues) : _labBaseTeamBuild(p, a, issues);
    };
    TEAM_PHASES.build = teamBuild;

    // QA revisa el montaje (componentes + código Arduino), no la página que lo envuelve
    const _labBaseCodeForReview = codeForReview;
    codeForReview = function (p) {
      if (p && p.kind === 'mecatronica') {
        const pr = labFromCode(p.code);
        return pr ? 'ES UN MONTAJE DE ARDUINO, NO UNA WEB: revisa que los pines del código coincidan con los componentes, que no haya dos componentes en el mismo pin, que el código compile en el Arduino IDE, que la lógica cumpla los criterios y que sea seguro conectarlo (motores con driver, relés). No evalúes diseño web, móvil ni accesibilidad. La página de entrega ya incluye Política de Privacidad, Términos y Condiciones, Política de Cookies y el crédito "Desarrollado por FRPROGRAMITY".\n\nMONTAJE (componentes y pines):\n' + JSON.stringify(pr.componentes, null, 1) + '\n\nCÓDIGO ARDUINO:\n' + pr.codigo : '(sin montaje)';
      }
      return _labBaseCodeForReview(p);
    };
    // La revisión de ciberseguridad es para webs y software, no para un circuito
    const _labBaseSecurity = teamSecurity;
    teamSecurity = function (p, a) {
      return p && p.kind === 'mecatronica' ? Promise.resolve() : _labBaseSecurity(p, a);
    };
    // Los proyectos de mecatrónica se trabajan en su propio laboratorio, no en la Sala de Programación
    const _labBaseIsBig = isBigProject;
    isBigProject = function (p) {
      return p && p.kind === 'mecatronica' ? false : _labBaseIsBig(p);
    };
    // Los fallos de un montaje los arregla preferiblemente alguien de mecatrónica
    const _labBasePickDev = pickDeveloper;
    pickDeveloper = function (p, exclude) {
      if (p && p.kind === 'mecatronica') {
        const m = AGENTS.find(x => x.type === 'AI' && !x.leaving && x !== exclude && x.homeZone === 'mecatronica' && !agentBusy(x));
        if (m) return m;
      }
      return _labBasePickDev(p, exclude);
    };

    // La recepción busca gente de mecatrónica cuando hay proyectos de ese tipo y nadie que sepa
    const _labBaseNeeds = teamNeeds;
    teamNeeds = function () {
      const needs = _labBaseNeeds();
      const hasMeca = AGENTS.some(a => a.type === 'AI' && !a.leaving && a.homeZone === 'mecatronica');
      const mecaProjects = PROJECTS.filter(p => p.kind === 'mecatronica' && p.status !== 'cancelado').length;
      if (!hasMeca && mecaProjects && ZONES.mecatronica) {
        needs.unshift({ zone: 'mecatronica', weight: 5, reason: `Hay ${mecaProjects} proyecto(s) de mecatrónica y nadie del Laboratorio de Mecatrónica.`, reasons: [`Hay ${mecaProjects} proyecto(s) de mecatrónica y nadie del Laboratorio de Mecatrónica.`] });
      }
      return needs;
    };

    // Botón para abrir el montaje en el laboratorio desde la tarjeta del proyecto
    const _labBaseCard = projectCardHtml;
    projectCardHtml = function (p) {
      const html = _labBaseCard(p);
      if (p.kind !== 'mecatronica' || !labFromCode(p.code)) return html;
      const marker = '<div class="flex flex-wrap gap-1.5 pt-0.5">';
      const i = html.lastIndexOf(marker);
      if (i < 0) return html;
      const btn = `<button onclick="openProjectInLab('${p.id}')" class="px-2 py-1 rounded-lg text-[10px] font-semibold border transition bg-teal-500/15 hover:bg-teal-500/25 text-teal-100 border-teal-400/40">🔬 Abrir en el laboratorio</button>`;
      return html.slice(0, i + marker.length) + btn + html.slice(i + marker.length);
    };
    function openProjectInLab(id) {
      const p = findProject(id) || null;
      const d = !p && typeof DELIVERABLES !== 'undefined' ? DELIVERABLES.find(x => x.id === id) : null;
      const pr = labFromCode((p || d || {}).code);
      if (pr) openLab(pr); else showToast('Este proyecto aún no tiene montaje.');
    }
