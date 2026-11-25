    // _____________________________________________________________________
    // ENTREVISTAS: banco amplio de preguntas. Cada entrevista ofrece 10 preguntas distintas
    // (2 por habilidad, elegidas al azar) y debes hacer 5 antes de aprobar o rechazar.
    // _____________________________________________________________________
    const EXTRA_QUESTIONS = {
      comunicacion: [
        { q: 'Un cliente está enfadado porque el proyecto se retrasó. ¿Qué le dices?',
          high: ['Primero lo escucho sin interrumpir, reconozco el retraso, le explico la causa sin excusas y le doy una fecha nueva con un plan concreto.'],
          mid: ['Le pediría disculpas y le diría que estamos trabajando para terminar pronto.'],
          low: ['Le diría que no es culpa mía, que fueron otros del equipo.'] },
        { q: '¿Cómo informas a tu jefe de un error que cometiste?',
          high: ['Se lo cuento enseguida, con lo que pasó, el impacto y la solución que propongo. Ocultarlo solo lo empeora.'],
          mid: ['Se lo diría cuando tenga un rato, intentando arreglarlo antes.'],
          low: ['Si nadie se da cuenta, mejor no decir nada.'] }
      ],
      equipo: [
        { q: 'Un compañero nuevo no entiende cómo funciona el proyecto. ¿Qué haces?',
          high: ['Le dedico un rato para explicarle la estructura, le paso la documentación y le asigno una tarea pequeña para que gane confianza.'],
          mid: ['Le paso la documentación y le digo que me pregunte si tiene dudas.'],
          low: ['Que aprenda solo, como hice yo.'] },
        { q: '¿Qué haces si terminas tu parte antes que el resto del equipo?',
          high: ['Pregunto quién va más cargado y ayudo, o reviso el trabajo de otros para que la entrega salga mejor.'],
          mid: ['Avisaría de que terminé y esperaría nuevas tareas.'],
          low: ['Aprovecho para descansar hasta que me pidan algo.'] }
      ],
      creatividad: [
        { q: 'Tienes la mitad del presupuesto que necesitas. ¿Cómo sacas el proyecto adelante?',
          high: ['Defino lo esencial, reutilizo piezas que ya tenemos, busco soluciones más simples y entrego por fases para demostrar valor pronto.'],
          mid: ['Quitaría algunas funciones para que encaje en el presupuesto.'],
          low: ['Sin presupuesto no se puede hacer nada bien.'] },
        { q: '¿Cómo harías que un producto aburrido resulte atractivo?',
          high: ['Buscaría la historia del usuario: qué problema le quita. Luego lo cuento con diseño limpio, ejemplos reales y un toque de humor.'],
          mid: ['Le pondría colores más llamativos y mejores fotos.'],
          low: ['Si el producto es aburrido, no hay mucho que hacer.'] }
      ],
      motivacion: [
        { q: '¿Dónde te ves dentro de dos años?',
          high: [`Liderando proyectos aquí, habiendo aprendido muchísimo y ayudando a formar a los nuevos.`],
          mid: ['Supongo que con más experiencia, quizá aquí o en otro sitio.'],
          low: ['No lo sé, ya veremos.'] },
        { q: '¿Qué haces cuando una tarea te resulta muy difícil?',
          high: ['La divido en partes pequeñas, investigo, pido opinión a quien sabe más y no paro hasta resolverla. Es cuando más aprendo.'],
          mid: ['Lo intento un rato y, si no sale, pido ayuda.'],
          low: ['La dejo para después o se la paso a otro.'] }
      ]
    };

    const EXTRA_TECH = {
      games: { q: '¿Cómo harías que un nivel sea desafiante pero no frustrante?', high: ['Curva de dificultad gradual, enseño cada mecánica de forma segura antes de exigirla, puntos de control frecuentes y pruebo con jugadores reales.'], mid: ['Haría el principio fácil y el final más difícil.'], low: ['Pondría muchos enemigos para que sea difícil.'] },
      apps: { q: '¿Qué revisas para que una app sea accesible?', high: ['Contraste suficiente, tamaños de toque grandes, textos alternativos, navegación por teclado y lector de pantalla, y que no dependa solo del color.'], mid: ['Que los textos se lean bien y los botones sean grandes.'], low: ['La verdad, nunca me he fijado en eso.'] },
      software: { q: 'Un servicio en producción empieza a fallar de noche. ¿Qué haces?', high: ['Miro las alertas y los registros, reviso el último despliegue, si es necesario lo revierto, comunico el incidente y luego escribo el análisis de la causa.'], mid: ['Reinicio el servidor y miro si se arregla.'], low: ['Lo miraría por la mañana.'] },
      help_desk: { q: '¿Cómo explicas una solución técnica a alguien que no sabe de tecnología?', high: ['Paso a paso, con palabras sencillas, capturas y comprobando en cada paso que lo ha conseguido.'], mid: ['Le mando un enlace con la explicación.'], low: ['Le digo que lo busque en internet.'] },
      qa_lab: { q: '¿Cómo reportas un error para que lo arreglen rápido?', high: ['Título claro, pasos exactos para reproducirlo, resultado esperado y real, capturas, versión y entorno, y su gravedad.'], mid: ['Escribo qué falla y adjunto una captura.'], low: ['Aviso de que algo no funciona.'] },
      meeting: { q: '¿Cómo sabes si un proyecto va por buen camino?', high: ['Con objetivos medibles, entregas cortas, revisión del avance real frente al plan y hablando a menudo con el equipo y el cliente.'], mid: ['Preguntando al equipo cómo va.'], low: ['Si nadie se queja, va bien.'] },
      mecatronica: { q: 'Tu robot empieza a reiniciarse cuando arrancan los motores. ¿Qué pasa?', high: ['Los motores hacen caer el voltaje: separo la alimentación de motores y Arduino, uno las tierras, añado condensadores y reviso que la batería dé la corriente necesaria.'], mid: ['Será la batería: le pondría una más grande.'], low: ['Ni idea, lo reiniciaría y ya.'] },
      cocina: { q: '¿Cómo garantizas la higiene en una cocina con mucho trabajo?', high: ['Limpieza continua por zonas, separación de crudos y cocinados, control de temperaturas y una lista de verificación por turno.'], mid: ['Limpio al terminar cada servicio.'], low: ['Cuando hay prisa, la limpieza puede esperar.'] },
      limpieza: { q: '¿Qué haces si encuentras algo roto mientras limpias?', high: ['Señalizo la zona para que nadie se haga daño, aviso a mantenimiento con una foto y lo anoto en el parte.'], mid: ['Aviso a alguien cuando pueda.'], low: ['Sigo limpiando, no es mi trabajo.'] }
    };

    // Todas las preguntas posibles de una habilidad para el puesto del candidato
    function questionPool(skill, cat, zone) {
      if (skill === 'tecnica') {
        const list = [{ q: cat.techQ, high: cat.techA.high, mid: cat.techA.mid, low: cat.techA.low }];
        if (EXTRA_TECH[zone]) list.push(EXTRA_TECH[zone]);
        return list;
      }
      return [GENERIC_QUESTIONS[skill], ...(EXTRA_QUESTIONS[skill] || [])];
    }

    // Cada candidato recibe su propio juego de preguntas (2 por habilidad)
    function ensureInterviewOptions(c) {
      if (c.options) return c.options;
      const cat = ROLE_CATALOG[c.zone];
      c.options = [];
      SKILL_KEYS.forEach(skill => {
        const pool = questionPool(skill, cat, c.zone).map((q, i) => ({ skill, i, q }));
        pool.sort(() => Math.random() - 0.5).slice(0, 2).forEach(o => c.options.push({ id: skill + ':' + o.i, skill, i: o.i }));
      });
      c.options.sort(() => Math.random() - 0.5);
      return c.options;
    }

    function optionData(c, opt) {
      const cat = ROLE_CATALOG[c.zone];
      const src = questionPool(opt.skill, cat, c.zone)[opt.i];
      const fill = (s) => String(s).replace(/\{area\}/g, cat.area).replace(/FRPROGRAMITY/g, BRAND);
      return { q: fill(src.q), answers: { high: src.high.map(fill), mid: src.mid.map(fill), low: src.low.map(fill) } };
    }

    function revealedSkills(c) {
      return [...new Set(c.transcript.map(t => t.key))];
    }

    askInterviewQuestion = function (id) {
      const a = AGENTS.find(x => x.id === RECRUIT.modalCandId);
      if (!a || !a.cand) return;
      const c = a.cand;
      const opts = ensureInterviewOptions(c);
      const opt = opts.find(o => o.id === id) || opts.find(o => o.skill === id && !c.asked.includes(o.id));
      if (!opt || c.asked.includes(opt.id) || c.asked.length >= MAX_QUESTIONS) return;
      const data = optionData(c, opt);
      const tier = skillTier(c.skills[opt.skill]);
      const ans = randPick(data.answers[tier]);
      c.asked.push(opt.id);
      c.transcript.push({ key: opt.skill, q: data.q, a: ans, tier });
      const dir = AGENTS.find(x => x.id === 'human_dir');
      if (dir) dir.bubble = '❓ ' + (data.q.length > 30 ? data.q.slice(0, 30) + '…' : data.q);
      a.bubble = '💬 ' + (ans.length > 30 ? ans.slice(0, 30) + '…' : ans);
      renderInterviewModal();
      // las respuestas se escuchan con la voz del candidato
      if (typeof speak === 'function') speak(ans, { id: a.id, name: a.name });
    };

    const _baseDecideCandidate = decideCandidate;
    decideCandidate = function (decision) {
      const a = AGENTS.find(x => x.id === RECRUIT.modalCandId);
      if (a && a.cand && (decision === 'hire' || decision === 'reject') && a.cand.asked.length < MAX_QUESTIONS) {
        showToast(`Haz las ${MAX_QUESTIONS} preguntas antes de decidir (llevas ${a.cand.asked.length}).`);
        return;
      }
      if (hasTTS()) speechSynthesis.cancel();
      _baseDecideCandidate(decision);
    };

    renderInterviewModal = function () {
      const a = AGENTS.find(x => x.id === RECRUIT.modalCandId);
      if (!a || !a.cand) return;
      const c = a.cand;
      const opts = ensureInterviewOptions(c);
      const hex = '#' + new THREE.Color(a.color).getHexString();
      const revealed = revealedSkills(c);
      const remaining = MAX_QUESTIONS - c.asked.length;
      document.getElementById('interview-title').textContent = `${a.name} · ${a.role}`;
      document.getElementById('interview-meta').textContent = `Postula a ${ZONES[c.zone].name} · ${c.years} años de experiencia · Preguntas ${c.asked.length}/${MAX_QUESTIONS}`;

      const vals = revealed.map(k => c.skills[k]);
      const impression = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
      const impressionHtml = impression === null
        ? '<span class="text-slate-400">Aún sin evaluar: cada respuesta revela una habilidad real.</span>'
        : impression >= 7.5 ? '<span class="text-emerald-300 font-semibold">Muy buena impresión</span>'
        : impression >= 5 ? '<span class="text-amber-300 font-semibold">Impresión correcta</span>'
        : '<span class="text-rose-300 font-semibold">Impresión floja</span>';

      const questionsHtml = opts.map(o => {
        const done = c.asked.includes(o.id);
        const disabled = done || remaining <= 0;
        return `
          <button ${disabled ? 'disabled' : ''} onclick="askInterviewQuestion('${o.id}')"
            class="w-full text-left px-2.5 py-1.5 rounded-xl border transition ${done ? 'bg-violet-500/15 border-violet-400/40 text-violet-100' : disabled ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-900/90 border-slate-700 hover:border-violet-400/60 hover:bg-violet-500/10 text-slate-200'}">
            <div class="text-[9px] font-mono ${done ? 'text-violet-300' : 'text-slate-500'}">${done ? '✓ ' : ''}${SKILL_LABELS[o.skill].toUpperCase()}</div>
            <div class="text-[11px]">${escapeHtml(optionData(c, o).q)}</div>
          </button>`;
      }).join('');

      const transcriptHtml = c.transcript.length ? c.transcript.map(t => `
        <div class="space-y-1">
          <div class="flex justify-end"><div class="max-w-[85%] px-2.5 py-1.5 rounded-xl rounded-br-sm bg-cyan-500/15 border border-cyan-500/30 text-cyan-100">${escapeHtml(t.q)}</div></div>
          <div class="flex justify-start"><div class="max-w-[85%] px-2.5 py-1.5 rounded-xl rounded-bl-sm bg-slate-900 border border-slate-700 text-slate-200">
            ${escapeHtml(t.a)}
            <div class="mt-1 text-[10px] font-mono ${t.tier === 'high' ? 'text-emerald-300' : t.tier === 'mid' ? 'text-amber-300' : 'text-rose-300'}">${t.tier === 'high' ? 'Muy buena respuesta' : t.tier === 'mid' ? 'Respuesta correcta' : 'Respuesta floja'} · ${SKILL_LABELS[t.key]}</div>
          </div></div>
        </div>`).join('') : '<p class="text-[11px] text-slate-500">Elige una pregunta para empezar.</p>';

      document.getElementById('interview-content').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div class="md:col-span-2 space-y-2.5">
            <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full" style="background:${hex}"></span><span class="text-sm font-bold text-white">${escapeHtml(a.name)}</span></div>
              <div class="text-[11px] text-violet-200">${escapeHtml(a.role)} · ${escapeHtml(c.area)}</div>
            </div>
            <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div class="flex items-center justify-between"><span class="text-xs font-semibold text-white">CV vs. evaluación</span><span class="text-[10px] font-mono text-slate-500">gris = CV</span></div>
              ${SKILL_KEYS.map(k => skillBarHtml(SKILL_LABELS[k], c.claims[k], revealed.includes(k) ? c.skills[k] : undefined)).join('')}
            </div>
            <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px]">
              <div class="text-xs font-semibold text-white mb-1">Impresión general</div>
              ${impressionHtml}
              <p class="mt-1.5 text-slate-500">Algunos exageran su CV y otros son modestos: las respuestas revelan la verdad.</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 max-h-56 overflow-y-auto text-[11px]">${transcriptHtml}</div>
          </div>
          <div class="md:col-span-3 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-white">Elige ${MAX_QUESTIONS} preguntas</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full ${remaining > 0 ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40' : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'}">${remaining > 0 ? 'Quedan ' + remaining : 'Listo para decidir'}</span>
            </div>
            <div class="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden"><div class="h-full bg-violet-400 transition-all" style="width:${(c.asked.length / MAX_QUESTIONS) * 100}%"></div></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">${questionsHtml}</div>
          </div>
        </div>`;

      const full = teamSize() >= MAX_TEAM_SIZE;
      const ready = remaining <= 0;
      document.getElementById('interview-actions').innerHTML = `
        <span class="mr-auto self-center text-[10px] font-mono text-slate-500">Equipo ${teamSize()}/${MAX_TEAM_SIZE}${ready ? '' : ` · faltan ${remaining} preguntas para decidir`}</span>
        <button onclick="decideCandidate('later')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition">↩ Volver a la espera</button>
        <button ${ready ? '' : 'disabled'} onclick="decideCandidate('reject')" class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${ready ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/40' : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'}">✕ Rechazar</button>
        <button ${ready && !full ? '' : 'disabled'} onclick="decideCandidate('hire')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition ${ready && !full ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}">✓ Aprobar y contratar</button>`;
    };
