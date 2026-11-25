    // _____________________________________________________________________
    // ASISTENTE "<EMPRESA> IA": tu asistente personal. Entiende órdenes en lenguaje natural
    // (crear proyectos, convocar reuniones, poner música, llamar clientes, informes…)
    // y las ejecuta de verdad en la oficina. Con la IA configurada, responde Claude.
    // _____________________________________________________________________
    const ASSIST = { open: false, view: 'chat', log: [], history: [], busy: false, turns: 0 };
    const ASSIST_NAME = BRAND + ' IA';
    const ASSIST_WHO = { id: 'assistant', name: 'Asistente IA' };

    const KIND_WORDS = [
      ['crear_mecatronica', /\b(arduino|robot\w*|rob[oó]tica|mecatr[oó]nica|electr[oó]nica|circuito|sensor\w*|servo\w*|motor(es)?)\b/],
      ['crear_web', /\b(web|p[aá]gina|sitio|landing|portafolio|tienda online)\b/],
      ['crear_juego', /\b(juego|videojuego|game)\b/],
      ['crear_app', /\b(app|aplicaci[oó]n|aplicacion)\b/],
      ['crear_software', /\b(software|api|herramienta|sistema|backend|script|bot)\b/],
      ['brindar_ayuda', /\b(gu[ií]a|manual|tutorial|ayuda|faq|soporte)\b/]
    ];

    function extractProjectName(text) {
      const m = text.match(/(?:llamad[oa]|que se llame|con el nombre(?: de)?|nombre)\s+["“']?([^"”',.;]{2,40})/i) ||
        text.match(/["“']([^"”']{2,40})["”']/) ||
        text.match(/\b(?:para|de|sobre)\s+(?:una?\s+|mi\s+|el\s+|la\s+)?([a-záéíóúñ0-9][^,.;]{2,36})/i);
      if (!m) return '';
      return m[1].trim().replace(/\s+(con|que|y|para)\s.*$/i, '').replace(/^./, c => c.toUpperCase());
    }

    // Ejecuta una orden si la reconoce. Devuelve una frase con lo que hizo, o null.
    function runOfficeCommand(text, opts = {}) {
      const low = String(text || '').toLowerCase();
      const wantsCreate = /\b(crea|cre[aá]|haz|hazme|hagan|haced|desarroll|constru|program|dise[ñn]a|quiero|necesito|ordena|prepar|lanza|empiecen|monten)/.test(low);
      if (wantsCreate) {
        const hit = KIND_WORDS.find(([, re]) => re.test(low));
        if (hit) {
          const tpl = PROJECT_TEMPLATES[hit[0]];
          const name = extractProjectName(text);
          const p = launchMission(hit[0], name ? `${tpl.label} "${name}"` : null, String(text).slice(0, 600));
          if (p) return `He ordenado el proyecto ${p.title}.`;
        }
      }
      if (/\b(convoca|reuni[oó]n|re[uú]ne|junta)\b/.test(low) && !/termina|acaba/.test(low)) {
        if (MEETING.active) return null;
        convokeMeeting('meeting'); // la sala B ahora es la Sala de Práctica del Director
        return 'He convocado la reunión.';
      }
      if (/motiva/.test(low)) { startMotivationNow(); return 'He llamado a todos a la charla de motivación.'; }
      if (/(para|quita|apaga|det[eé]n|silencia).*(m[uú]sica|radio)/.test(low)) { musicStop(); return 'He parado la música.'; }
      if (/\b(pon|ponme|reproduce|m[uú]sica|radio|canci[oó]n)/.test(low) && !/\b(cliente|proyecto)\b/.test(low)) {
        const st = musicPlayByQuery(low);
        return st ? `Suena ${st.name}.` : null;
      }
      if (/(llama|llamar|habla con|contacta).*(cliente|a )/.test(low) || /llamada conjunta/.test(low)) {
        const r = callClientsFromText(text);
        if (r) return r;
      }
      if (/(modo 3d|controlar al director|mover al director|tercera persona)/.test(low)) { toggleDirector3D(true); return 'Activé el modo Director 3D.'; }
      if (/(vacante|candidat|contratar|entrevist)/.test(low)) { if (!opts.silent) switchTab('recruit'); return 'Abrí la sección de Talento: los candidatos llegarán mientras esté abierta.'; }
      return null;
    }

    function officeStatusText() {
      const s = officeSnapshot();
      const blk = s.bloque_horario ? `Ahora toca: ${s.bloque_horario}. ` : '';
      const run = s.proyectos_en_curso.length ? s.proyectos_en_curso.map(p => `${p.titulo} (${p.avance})`).join(', ') : 'ninguno';
      return `${blk}Son las ${s.hora}. Equipo: ${s.equipo} empleados IA. Proyectos en curso: ${run}. Por revisar: ${s.por_revisar.length ? s.por_revisar.join(', ') : 'ninguno'}. Terminados: ${s.terminados}.`;
    }

    function localAssistantReply(text) {
      const low = text.toLowerCase();
      const done = runOfficeCommand(text);
      if (done) return done;
      if (/(estado|resumen|c[oó]mo va|informe|reporte|qu[eé] tal)/.test(low)) return officeStatusText();
      if (/(qu[eé] hora|la hora)/.test(low)) return 'Son las ' + new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) + '.';
      if (/(horario|qu[eé] toca|descanso|almuerzo|caf[eé]|recreo)/.test(low)) return scheduleSummaryText();
      if (/(cliente)/.test(low)) { openDockPanel('clients'); return 'Te abrí la lista de clientes: puedes llamar a uno o hacer una llamada conjunta.'; }
      if (/(hola|buenas|buenos)/.test(low)) return `¡Hola${COMPANY.independent ? ', ' + COMPANY.owner : ''}! Soy ${ASSIST_NAME}. Dime qué quieres que haga el equipo hoy.`;
      if (/(gracias)/.test(low)) return '¡A tu servicio! Aquí estoy para lo que necesites.';
      return 'Puedo: ordenar proyectos ("crea una web para una panadería con menú y contacto"), convocar reuniones, dar un informe, decirte el horario, poner música, llamar a clientes, iniciar la motivación o activar el modo Director 3D.' +
        (aiReady() ? '' : ' Puedes activar una IA gratis (Gemini o en tu navegador) en ⚙.');
    }

    // ---- Herramientas que Claude puede usar para actuar en la oficina ----
    const ASSIST_TOOLS = [
      {
        name: 'crear_proyecto', strict: true,
        description: 'Ordena al equipo un proyecto nuevo que empieza de inmediato. Úsalo solo cuando el Director pida crear algo.',
        input_schema: {
          type: 'object', additionalProperties: false, required: ['tipo', 'nombre', 'descripcion'],
          properties: {
            tipo: { type: 'string', enum: ['web', 'app', 'juego', 'software', 'ayuda', 'mecatronica'] },
            nombre: { type: 'string', description: 'Nombre corto del proyecto' },
            descripcion: { type: 'string', description: 'Qué debe incluir, con los detalles que dio el Director' }
          }
        }
      },
      { name: 'estado_empresa', strict: true, description: 'Devuelve el estado actual: hora, horario, equipo y proyectos.', input_schema: { type: 'object', additionalProperties: false, properties: {}, required: [] } },
      { name: 'convocar_reunion', strict: true, description: 'Convoca una reunión de voz con el equipo.', input_schema: { type: 'object', additionalProperties: false, required: ['sala'], properties: { sala: { type: 'string', enum: ['A', 'B'] } } } },
      { name: 'iniciar_motivacion', strict: true, description: 'Reúne a todo el equipo para la charla de motivación del subdirector.', input_schema: { type: 'object', additionalProperties: false, properties: {}, required: [] } },
      { name: 'poner_musica', strict: true, description: 'Pone música de fondo. busqueda: estilo o emisora (salsa o corridos) o "parar".', input_schema: { type: 'object', additionalProperties: false, required: ['busqueda'], properties: { busqueda: { type: 'string' } } } },
      { name: 'llamar_clientes', strict: true, description: 'Abre una llamada de voz con uno o varios clientes por su nombre.', input_schema: { type: 'object', additionalProperties: false, required: ['nombres'], properties: { nombres: { type: 'array', items: { type: 'string' } } } } },
      { name: 'abrir_seccion', strict: true, description: 'Abre una sección de la interfaz.', input_schema: { type: 'object', additionalProperties: false, required: ['seccion'], properties: { seccion: { type: 'string', enum: ['proyectos', 'equipo', 'talento', 'entregables', 'empresas', 'clientes', 'horario', 'musica', 'modo3d'] } } } }
    ];

    function runAssistTool(name, input) {
      const KIND_TO_TPL = { web: 'crear_web', app: 'crear_app', juego: 'crear_juego', software: 'crear_software', ayuda: 'brindar_ayuda', mecatronica: 'crear_mecatronica' };
      switch (name) {
        case 'crear_proyecto': {
          const key = KIND_TO_TPL[input.tipo] || 'crear_web';
          const tpl = PROJECT_TEMPLATES[key];
          const p = launchMission(key, input.nombre ? `${tpl.label} "${String(input.nombre).slice(0, 50)}"` : null, String(input.descripcion || '').slice(0, 600));
          return p ? { ok: true, proyecto: p.title } : { ok: false };
        }
        case 'estado_empresa': return officeSnapshot();
        case 'convocar_reunion':
          if (MEETING.active) return { ok: false, motivo: 'Ya hay una reunión en curso' };
          convokeMeeting('meeting');
          return { ok: !!MEETING.active };
        case 'iniciar_motivacion': startMotivationNow(); return { ok: true };
        case 'poner_musica': {
          if (/parar|stop|apaga|quita/i.test(input.busqueda)) { musicStop(); return { ok: true, estado: 'parada' }; }
          const st = musicPlayByQuery(String(input.busqueda).toLowerCase());
          return st ? { ok: true, sonando: st.name } : { ok: false };
        }
        case 'llamar_clientes': {
          const r = callClientsByNames(input.nombres || []);
          return r ? { ok: true, detalle: r } : { ok: false, clientes: CLIENTS.map(c => c.name) };
        }
        case 'abrir_seccion': {
          const tabs = { proyectos: 'projects', equipo: 'team', talento: 'recruit', entregables: 'deliverables', empresas: 'offices' };
          if (tabs[input.seccion]) { openSidePanel(); switchTab(tabs[input.seccion]); }
          else if (input.seccion === 'modo3d') toggleDirector3D(true);
          else openDockPanel(input.seccion === 'clientes' ? 'clients' : input.seccion === 'horario' ? 'schedule' : 'music');
          return { ok: true };
        }
      }
      return { ok: false, motivo: 'herramienta desconocida' };
    }

    function assistSystemPrompt() {
      return `Eres "${ASSIST_NAME}", el asistente personal del Director de la empresa "${BRAND}"${COMPANY.independent ? ` (el Director se llama ${COMPANY.owner})` : ''}.
${BRAND} es una empresa real con objetivos reales cuyos empleados son IA virtuales que trabajan en una oficina 3D: hacen webs, apps, juegos, software y guías de ayuda.
Hablas en español, con calidez y precisión, en respuestas breves (2-4 frases) porque se leen en voz alta.
Usa las herramientas para actuar: el equipo solo trabaja en proyectos que el Director ordena, nunca crees proyectos sin que te lo pida.
Para dar datos de la empresa consulta estado_empresa en lugar de inventarlos.`;
    }

    async function claudeAssistantReply(text) {
      if (ASSIST.turns >= 30) { ASSIST.history = []; ASSIST.turns = 0; } // conversación nueva cada 30 turnos
      ASSIST.turns++;
      ASSIST.history.push({ role: 'user', content: text });
      for (let i = 0; i < 4; i++) {
        const res = await aiCreate({
          max_tokens: 4000,
          system: assistSystemPrompt(),
          tools: ASSIST_TOOLS,
          tool_choice: { type: 'auto' },
          messages: ASSIST.history,
          output_config: { effort: 'low' }
        });
        ASSIST.history.push({ role: 'assistant', content: res.content });
        if (res.stop_reason !== 'tool_use') return aiText(res) || 'Hecho.';
        const results = res.content.filter(b => b.type === 'tool_use').map(b => {
          let out;
          try { out = runAssistTool(b.name, b.input || {}); } catch (e) { return { type: 'tool_result', tool_use_id: b.id, content: String(e.message || e), is_error: true }; }
          return { type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(out) };
        });
        ASSIST.history.push({ role: 'user', content: results });
      }
      return 'Listo.';
    }

    // Gemini y la IA del navegador: la oficina ejecuta primero las órdenes claras y la IA
    // responde en JSON { respuesta, acciones } para lo demás.
    async function genericAssistantReply(text) {
      const done = runOfficeCommand(text);
      const wantsCreate = /\b(crea|cre[aá]|haz|hazme|hagan|desarroll|constru|program|dise[ñn]a|quiero|necesito|ordena|prepar|lanza)/i.test(text);
      const system = assistSystemPrompt().replace(/Usa las herramientas[^\n]*\n?/, '').replace(/Para dar datos[^\n]*/, '') + `
Responde SIEMPRE con un objeto JSON: {"respuesta": "texto breve para el Director", "acciones": []}.
Acciones posibles (úsalas solo si el Director lo pide claramente):
{"tipo":"crear_proyecto","proyecto":"web|app|juego|software|ayuda|mecatronica","nombre":"...","descripcion":"..."}
{"tipo":"convocar_reunion","sala":"A"}
{"tipo":"iniciar_motivacion"}
{"tipo":"poner_musica","busqueda":"estilo o 'parar'"}
{"tipo":"llamar_clientes","nombres":["..."]}
{"tipo":"abrir_seccion","seccion":"proyectos|equipo|talento|entregables|empresas|clientes|horario|musica|modo3d"}
Usa solo los datos reales del estado de la empresa; no los inventes.`;
      const history = ASSIST.history.slice(-10);
      const user = `Estado actual de la empresa: ${JSON.stringify(officeSnapshot())}
${done ? `La oficina YA ejecutó esta orden: "${done}". Confírmalo con naturalidad y no repitas la acción.` : ''}
Mensaje del Director: ${text}`;
      let out;
      try { out = await aiJson(system, [...history, { role: 'user', content: user }], { type: 'object', properties: { respuesta: { type: 'string' }, acciones: { type: 'array' } }, required: ['respuesta'] }, 1500); }
      catch (e) { if (done) return done; throw e; }
      const names = { crear_proyecto: 'crear_proyecto', convocar_reunion: 'convocar_reunion', iniciar_motivacion: 'iniciar_motivacion', poner_musica: 'poner_musica', llamar_clientes: 'llamar_clientes', abrir_seccion: 'abrir_seccion' };
      if (!done && Array.isArray(out.acciones)) {
        out.acciones.slice(0, 3).forEach(a => {
          if (!a || !names[a.tipo]) return;
          // el equipo solo crea proyectos cuando el Director lo pidió de verdad
          if (a.tipo === 'crear_proyecto' && !wantsCreate) return;
          const input = a.tipo === 'crear_proyecto' ? { tipo: a.proyecto, nombre: a.nombre, descripcion: a.descripcion || text } : a;
          try { runAssistTool(names[a.tipo], input); } catch (e) { /* acción inválida: se ignora */ }
        });
      }
      const reply = String((out && typeof out.respuesta === 'string' && out.respuesta.trim()) || done || localAssistantReply(text)).slice(0, 900);
      ASSIST.history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });
      if (ASSIST.history.length > 20) ASSIST.history.splice(0, ASSIST.history.length - 20);
      return reply;
    }

    async function assistantSend(text) {
      text = String(text || '').trim().slice(0, 800);
      if (!text || ASSIST.busy) return;
      openDockPanel('assistant');
      ASSIST.log.push({ me: true, text });
      ASSIST.busy = true;
      renderAssistant();
      let reply;
      if (aiReady()) {
        try { reply = AI.engine === 'claude' ? await claudeAssistantReply(text) : await genericAssistantReply(text); } catch (e) {
          // la conversación con herramientas puede quedar a medias: se reinicia limpia
          ASSIST.history = [];
          ASSIST.turns = 0;
          reply = '⚠️ ' + aiErrorMessage(e) + ' ' + localAssistantReply(text);
        }
      } else reply = localAssistantReply(text);
      ASSIST.busy = false;
      ASSIST.log.push({ me: false, text: reply });
      if (ASSIST.log.length > 50) ASSIST.log.splice(0, ASSIST.log.length - 50);
      renderAssistant();
      speak(reply, ASSIST_WHO);
    }

    function assistantSubmit(e) {
      e.preventDefault();
      const inp = document.getElementById('as-input');
      const v = inp.value;
      inp.value = '';
      assistantSend(v);
    }

    function assistantMic() {
      startListening(t => assistantSend(t), t => {
        const inp = document.getElementById('as-input');
        if (inp) inp.value = t;
      });
      renderAssistant();
    }

    function chooseAiEngine(k) {
      if (k !== AI.engine) { ASSIST.history = []; ASSIST.turns = 0; } // cada motor guarda la conversación a su manera
      setAiEngine(k);
      renderAssistant();
    }

    function renderAssistantProgress() {
      const bar = document.getElementById('wl-bar');
      const txt = document.getElementById('wl-text');
      const box = document.getElementById('wl-progress');
      if (box) box.classList.remove('hidden');
      if (bar) bar.style.width = AI.webllmProgress + '%';
      if (txt) txt.textContent = AI.webllmText;
      const dot = document.getElementById('as-engine');
      if (dot && AI.webllmLoading) dot.textContent = 'Descargando IA ' + AI.webllmProgress + '%';
    }

    function renderAssistant() {
      const box = document.getElementById('dock-panel-assistant');
      if (!box) return;
      if (ASSIST.view === 'settings') {
        const e = AI.engine;
        const keyField = (id, val, ph) => `<input id="${id}" type="password" autocomplete="off" value="${val ? '••••••••' + escapeHtml(val.slice(-4)) : ''}" placeholder="${ph}" class="field" onfocus="if(this.value.startsWith('••'))this.value=''" />`;
        let detail = '';
        if (e === 'local') {
          detail = `<p>Sin IA externa: la oficina responde con su propia lógica. Gratis y sin conexión, pero con respuestas más simples.</p>`;
        } else if (e === 'gemini') {
          detail = `
            <p><b>Gratis</b> con una cuenta de Google. Crea tu clave en <b>aistudio.google.com</b> → «Get API key» → «Create API key» y pégala aquí.</p>
            ${keyField('gem-key', AI.geminiKey, 'Pega aquí tu clave de AI Studio')}
            <button onclick="(async () => { const v = document.getElementById('gem-key').value; if (v.startsWith('••')) { setAiEngine('gemini'); renderAssistant(); return; } const b = this; b.disabled = true; b.textContent = 'Comprobando…'; if (await setGeminiKey(v)) { ASSIST.view = 'chat'; } renderAssistant(); })()" class="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold">Guardar y usar Gemini</button>
            ${AI.geminiKey ? `<p class="text-[10px] text-emerald-300">✔ Conectado · modelo ${escapeHtml(AI.geminiModel)}</p>` : ''}
            <p class="text-[10px] text-slate-500">El nivel gratis tiene un límite de mensajes por minuto y por día. Google puede usar las conversaciones gratuitas para mejorar sus modelos: no compartas datos privados.</p>`;
        } else if (e === 'webllm') {
          const loaded = AI.webllm && AI.webllm.modelId === AI.webllmModel;
          detail = `
            <p><b>Gratis y sin cuenta.</b> Un modelo abierto se descarga una sola vez y corre en tu PC dentro del navegador. Necesita Chrome o Edge actualizados y una tarjeta gráfica decente.</p>
            ${webgpuAvailable() ? '' : '<p class="text-[10px] text-rose-300">⚠️ Este navegador no tiene WebGPU: no podrá usar este motor.</p>'}
            <select onchange="AI.webllmModel=this.value; saveAiSettings(); renderAssistant()" class="field nice-select">${WEBLLM_MODELS.map(m => `<option value="${m.id}" ${AI.webllmModel === m.id ? 'selected' : ''}>${m.label}</option>`).join('')}</select>
            <button ${AI.webllmLoading || loaded ? 'disabled' : ''} onclick="ensureWebLLM().catch(err => showToast('⚠️ ' + aiErrorMessage(err))); renderAssistant()" class="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold">${loaded ? '✔ Modelo listo' : AI.webllmLoading ? 'Descargando…' : '⬇ Descargar y activar'}</button>
            <div id="wl-progress" class="${AI.webllmLoading ? '' : 'hidden'}"><div class="h-1.5 rounded-full bg-slate-800 overflow-hidden"><div id="wl-bar" class="h-full bg-cyan-400" style="width:${AI.webllmProgress}%"></div></div><p id="wl-text" class="text-[10px] text-slate-500 mt-1 truncate">${escapeHtml(AI.webllmText)}</p></div>
            <p class="text-[10px] text-slate-500">Es más lento y simple que Gemini o Claude. El código de los proyectos lo sigue haciendo el generador local.</p>`;
        } else {
          detail = `
            <p>Claude de Anthropic: la mejor calidad, <b>de pago</b> según el uso (console.anthropic.com).</p>
            ${keyField('ai-key', AI.key, 'sk-ant-...')}
            <select onchange="setAiModel(this.value)" class="field nice-select">${AI_MODELS.map(m => `<option value="${m.id}" ${AI.model === m.id ? 'selected' : ''}>${m.label}</option>`).join('')}</select>
            <div class="flex gap-1.5">
              <button onclick="const v=document.getElementById('ai-key').value; if (v.startsWith('••')) { setAiEngine('claude'); ASSIST.view='chat'; renderAssistant(); } else if (setAiKey(v)) { ASSIST.view='chat'; renderAssistant(); }" class="flex-1 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold">Guardar y usar Claude</button>
              ${AI.key ? `<button onclick="setAiKey(''); setAiEngine('local'); renderAssistant()" class="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-100 border border-rose-400/40">Quitar</button>` : ''}
            </div>`;
        }
        box.innerHTML = `
          <div class="panel-head"><span>⚙ Motor de IA</span><button class="icon-btn" onclick="ASSIST.view='chat'; renderAssistant()">←</button></div>
          <div class="p-3 space-y-2.5 text-[11px] text-slate-300 overflow-y-auto">
            <div class="grid grid-cols-2 gap-1.5">
              ${Object.entries(AI_ENGINES).map(([k, v]) => `
                <button onclick="chooseAiEngine('${k}')" class="p-2 rounded-xl border text-left transition ${e === k ? 'bg-cyan-500/15 border-cyan-400/60' : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'}">
                  <div class="text-[11px] font-semibold text-white">${v.icon} ${v.label}</div>
                  <div class="text-[9px] ${v.price === 'Gratis' ? 'text-emerald-300' : 'text-amber-300'}">${v.price}</div>
                </button>`).join('')}
            </div>
            ${detail}
            <p class="text-[10px] text-slate-500">Las claves se guardan solo en este navegador. Si el motor falla o llega a su límite, la oficina responde con la lógica local.</p>
          </div>`;
        return;
      }
      box.innerHTML = `
        <div class="panel-head">
          <span class="flex items-center gap-1.5 min-w-0"><span class="w-2 h-2 rounded-full shrink-0 ${aiReady() ? 'bg-emerald-400' : 'bg-amber-400'}"></span><span class="truncate">🤖 ${escapeHtml(ASSIST_NAME)}</span><span id="as-engine" class="text-[9px] font-normal text-slate-400 truncate">${escapeHtml(aiReady() ? aiEngineName() : 'Lógica local')}</span></span>
          <span class="flex gap-1">
            <button class="icon-btn" title="${VOICE.enabled ? 'Silenciar voz' : 'Activar voz'}" onclick="setVoiceEnabled(!VOICE.enabled); renderAssistant()">${VOICE.enabled ? '🔊' : '🔇'}</button>
            <button class="icon-btn" title="Conectar IA" onclick="ASSIST.view='settings'; renderAssistant()">⚙</button>
            <button class="icon-btn" title="Cerrar" onclick="closeDockPanel()">✕</button>
          </span>
        </div>
        <div id="as-log" class="as-log">
          ${ASSIST.log.length ? ASSIST.log.map(m => `<div class="as-msg ${m.me ? 'me' : ''}">${escapeHtml(m.text)}</div>`).join('') : `
            <div class="as-msg">Hola, soy ${escapeHtml(ASSIST_NAME)}, tu asistente. Pídeme lo que necesites: proyectos, reuniones, informes, música o llamadas con clientes.</div>
            <div class="flex flex-wrap gap-1 px-1">${['Dame un informe', 'Crea una web para una cafetería', 'Cotiza una web con reservas', 'Pon salsa'].map(s => `<button onclick="assistantSend('${s}')" class="chip">${s}</button>`).join('')}</div>`}
          ${ASSIST.busy ? '<div class="as-msg typing">Escribiendo…</div>' : ''}
        </div>
        <form onsubmit="assistantSubmit(event)" class="flex items-center gap-1.5 p-2 border-t border-slate-800">
          <button type="button" onclick="assistantMic()" title="Hablar" class="mic-btn ${VOICE.listening ? 'on' : ''}">${VOICE.listening ? '■' : '🎙️'}</button>
          <input id="as-input" maxlength="800" autocomplete="off" placeholder="Escribe o habla…" class="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400" />
          <button type="submit" class="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs">➤</button>
        </form>`;
      const log = document.getElementById('as-log');
      if (log) log.scrollTop = log.scrollHeight;
    }

    // La barra de órdenes del Director: primero intenta ejecutar, si no, pregunta al asistente
    sendSpatialDirective = function (e) {
      e.preventDefault();
      const input = document.getElementById('spatial-input');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      const done = runOfficeCommand(text);
      if (done) {
        showToast('✅ ' + done);
        pushActivity(`Orden del Director: "${text}"`, 'ORDEN');
        renderPanel();
        return;
      }
      assistantSend(text);
    };
