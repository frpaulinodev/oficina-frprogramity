    // _____________________________________________________________________
    // CLIENTES: cartera de clientes de la empresa. Puedes llamar a uno (llamada individual)
    // o a varios a la vez (llamada conjunta) y hablar con ellos por voz. Sus pedidos solo
    // se convierten en proyectos cuando tú lo decides.
    // _____________________________________________________________________
    const CLIENTS_KEY = 'frp_clients_v1';
    const CLIENT_COLORS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f87171', '#2dd4bf', '#fb923c'];
    const CLIENT_LEADS = [
      { name: 'Carmen Ruiz', company: 'Panadería La Espiga', sector: 'Alimentación', kind: 'web', need: 'Una web con el menú, los horarios, fotos del local y un formulario para encargos.' },
      { name: 'Javier Morales', company: 'FitZone Gym', sector: 'Deporte', kind: 'app', need: 'Una app para que los socios apunten sus entrenamientos y vean su progreso.' },
      { name: 'Lucía Fernández', company: 'Viajes Horizonte', sector: 'Turismo', kind: 'web', need: 'Una landing de destinos con planes, precios y opiniones de viajeros.' },
      { name: 'Andrés Castillo', company: 'Castillo Logística', sector: 'Transporte', kind: 'software', need: 'Un sistema para registrar pedidos y consultar su estado por número.' },
      { name: 'Valeria Soto', company: 'Kids Learning', sector: 'Educación', kind: 'juego', need: 'Un juego sencillo para que los niños practiquen reflejos y sumen puntos.' },
      { name: 'Ricardo Peña', company: 'Peña & Asociados', sector: 'Legal', kind: 'ayuda', need: 'Una guía paso a paso para que sus clientes preparen sus documentos.' },
      { name: 'Sofía Herrera', company: 'Moda Urbana SH', sector: 'Moda', kind: 'web', need: 'Una tienda online con catálogo, carrito y contacto.' },
      { name: 'Miguel Ángel Torres', company: 'Ahorro Fácil', sector: 'Finanzas', kind: 'app', need: 'Una app de gastos e ingresos con resumen por categorías.' }
    ];
    const KIND_TPL = { web: 'crear_web', app: 'crear_app', juego: 'crear_juego', software: 'crear_software', ayuda: 'brindar_ayuda' };
    const KIND_LABEL = { web: '🌐 Web', app: '📱 App', juego: '🎮 Juego', software: '💻 Software', ayuda: '🛟 Guía' };
    const CLIENT_STATUS = { nuevo: ['Nuevo pedido', 'text-amber-200 bg-amber-500/15 border-amber-400/40'], proyecto: ['En proyecto', 'text-cyan-200 bg-cyan-500/15 border-cyan-400/40'], satisfecho: ['Satisfecho', 'text-emerald-200 bg-emerald-500/15 border-emerald-400/40'] };
    let CLIENTS = [];
    const CLIENT_UI = { selected: new Set(), form: false };

    function saveClients() {
      try { localStorage.setItem(CLIENTS_KEY, JSON.stringify(CLIENTS)); } catch (e) { /* sin persistencia */ }
    }

    function makeClient(lead, i) {
      return {
        id: 'cl' + Date.now().toString(36) + Math.floor(Math.random() * 999),
        name: cleanName(lead.name, 30), company: cleanName(lead.company, 40), sector: cleanName(lead.sector || 'General', 24),
        kind: KIND_TPL[lead.kind] ? lead.kind : 'web', need: cleanName(lead.need, 300),
        color: CLIENT_COLORS[(i || 0) % CLIENT_COLORS.length], status: 'nuevo', projectId: null, calls: 0, notes: []
      };
    }

    function loadClients() {
      let list = null;
      try { list = JSON.parse(localStorage.getItem(CLIENTS_KEY) || 'null'); } catch (e) { list = null; }
      if (Array.isArray(list)) {
        CLIENTS = list.filter(c => c && typeof c === 'object' && c.name).slice(0, 30).map((c, i) => Object.assign(makeClient(c, i), {
          id: /^cl[a-z0-9]{3,20}$/.test(String(c.id)) ? c.id : 'cl' + i + Date.now().toString(36),
          status: CLIENT_STATUS[c.status] ? c.status : 'nuevo', projectId: c.projectId ? cleanName(c.projectId, 40) : null,
          calls: Number(c.calls) || 0, notes: Array.isArray(c.notes) ? c.notes.slice(-8).map(n => cleanName(n, 200)) : [],
          color: /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : CLIENT_COLORS[i % CLIENT_COLORS.length]
        }));
      } else {
        CLIENTS = CLIENT_LEADS.slice(0, 4).map(makeClient);
        saveClients();
      }
    }

    function clientParticipant(c) {
      return { id: c.id, name: c.name, role: c.company, color: c.color };
    }

    function findClientByName(name) {
      const n = String(name || '').toLowerCase().trim();
      if (!n) return null;
      return CLIENTS.find(c => c.name.toLowerCase() === n || c.company.toLowerCase() === n) ||
        CLIENTS.find(c => c.name.toLowerCase().split(' ')[0] === n.split(' ')[0] || c.company.toLowerCase().includes(n) || n.includes(c.name.toLowerCase().split(' ')[0]));
    }

    function callClientsByNames(names) {
      const list = names.map(findClientByName).filter(Boolean);
      const uniq = [...new Set(list)];
      if (!uniq.length) return null;
      startClientCall(uniq.map(c => c.id));
      return uniq.length > 1 ? `Llamada conjunta con ${uniq.map(c => c.name).join(', ')}.` : `Llamando a ${uniq[0].name}.`;
    }

    function callClientsFromText(text) {
      const low = text.toLowerCase();
      if (/conjunta|todos los clientes|a todos/.test(low)) {
        const ids = (CLIENT_UI.selected.size ? [...CLIENT_UI.selected] : CLIENTS.map(c => c.id)).slice(0, 6);
        if (!ids.length) return null;
        startClientCall(ids);
        return `Llamada conjunta con ${ids.length} clientes.`;
      }
      const hits = CLIENTS.filter(c => low.includes(c.name.toLowerCase().split(' ')[0]) || low.includes(c.company.toLowerCase()));
      if (!hits.length) return null;
      startClientCall(hits.map(c => c.id));
      return hits.length > 1 ? `Llamada con ${hits.map(c => c.name).join(', ')}.` : `Llamando a ${hits[0].name}.`;
    }

    function startClientCall(ids) {
      const list = ids.map(id => CLIENTS.find(c => c.id === id)).filter(Boolean).slice(0, 6);
      if (!list.length) { showToast('Elige al menos un cliente.'); return; }
      list.forEach(c => { c.calls++; });
      saveClients();
      const joint = list.length > 1;
      const greet = list.map((c, i) => ({
        id: c.id,
        text: i === 0
          ? (c.status === 'satisfecho' ? `¡Hola! Soy ${c.name} de ${c.company}. Muy contentos con lo que nos entregaron.` : `Hola, soy ${c.name} de ${c.company}. ${c.status === 'proyecto' ? '¿Cómo va nuestro proyecto?' : 'Les llamo por nuestro pedido: ' + c.need}`)
          : `Y yo soy ${c.name}, de ${c.company}. ${c.status === 'nuevo' ? 'Nosotros también tenemos un pedido.' : 'Encantado de estar en la llamada.'}`
      }));
      openVoiceRoom({
        kind: 'client',
        title: joint ? 'Llamada conjunta con clientes' : 'Llamada con ' + list[0].name,
        subtitle: joint ? list.map(c => c.company).join(' · ') : list[0].company,
        participants: list.map(clientParticipant),
        greeting: greet,
        actions: list.filter(c => c.status === 'nuevo').map(c => `<button onclick="acceptClientOrder('${c.id}')" class="chip">📁 Crear proyecto de ${escapeHtml(c.company)}</button>`).join(''),
        onUserSay: (text, transcript) => clientReplies(list, text, transcript),
        onClose: (log) => {
          list.forEach(c => { c.notes.push(new Date().toLocaleDateString('es') + ': llamada de ' + Math.max(1, log.length) + ' mensajes'); c.notes = c.notes.slice(-8); });
          saveClients();
          pushActivity(`Terminó la llamada con ${list.map(c => c.name).join(', ')}.`, 'CLIENTES');
          renderClientsPanel();
        }
      });
      closeDockPanel();
      pushActivity(joint ? `Llamada conjunta con ${list.length} clientes.` : `Llamada con ${list[0].name} (${list[0].company}).`, 'CLIENTES');
    }

    function acceptClientOrder(id) {
      const c = CLIENTS.find(x => x.id === id);
      if (!c || c.status !== 'nuevo') return null;
      const tpl = KIND_TPL[c.kind] || 'crear_web';
      const p = launchMission(tpl, `${PROJECT_TEMPLATES[tpl].label} "${c.company}"`, c.need, { clientId: c.id, proposedBy: 'Tú (pedido de ' + c.name + ')' });
      if (!p) return null;
      c.status = 'proyecto';
      c.projectId = p.id;
      saveClients();
      if (ROOM.open && ROOM.kind === 'client') {
        ROOM.actions = ROOM.actions.replace(new RegExp(`<button onclick="acceptClientOrder\\('${id}'\\)"[^]*?</button>`), '');
        renderVoiceRoom();
        const who = roomParticipant(c.id);
        if (who) roomSpeakAll([{ id: c.id, text: '¡Perfecto! Muchas gracias, quedamos atentos al avance.' }]);
      }
      renderClientsPanel();
      return p;
    }

    function onClientProjectDone(p) {
      const c = CLIENTS.find(x => x.id === p.clientId || x.projectId === p.id);
      if (!c) return;
      c.status = 'satisfecho';
      saveClients();
      pushActivity(`${c.name} (${c.company}) recibió su entrega: "${p.title}".`, 'CLIENTES');
      showToast(`🤝 ${c.company} recibió su proyecto`);
    }

    async function clientReplies(list, text, transcript) {
      const low = text.toLowerCase();
      // si el Director acepta el encargo en la llamada, se crea el proyecto de verdad
      if (/\b(acept|de acuerdo|hecho|trato|lo hacemos|empezamos|cuenta con|vamos a hacerlo)/.test(low)) {
        const pending = list.filter(c => c.status === 'nuevo');
        const target = pending.find(c => low.includes(c.name.toLowerCase().split(' ')[0]) || low.includes(c.company.toLowerCase())) || (pending.length === 1 ? pending[0] : null);
        if (target) {
          const p = acceptClientOrder(target.id);
          if (p) return [];
        }
      }
      if (aiReady()) {
        try {
          const info = list.map(c => {
            const p = c.projectId && findProject(c.projectId);
            return `- ${c.name}, de ${c.company} (${c.sector}). Pedido: ${c.need}. Estado: ${CLIENT_STATUS[c.status][0]}${p ? `, proyecto "${p.title}" al ${projectProgressPct(p)}% (${PROJECT_STATUS[p.status].label})` : ''}.`;
          }).join('\n');
          const system = `Simulas a clientes reales de la empresa "${BRAND}" en una llamada de voz con su Director. Hablan en español, con naturalidad, en 1-2 frases cada uno (se leen en voz alta).
Responde el cliente al que se dirige el Director o el más relevante; en llamadas conjuntas puede intervenir otro brevemente. Pueden preguntar por plazos, precios o detalles, y agradecen las buenas noticias.
Clientes en la llamada:\n${info}`;
          const history = transcript.slice(-12).map(t => `${t.who}: ${t.text}`).join('\n');
          const out = await aiJson(system, [{ role: 'user', content: `Conversación:\n${history}\n\nResponde al último mensaje del Director.` }], {
            type: 'object',
            properties: { respuestas: { type: 'array', items: { type: 'object', properties: { nombre: { type: 'string' }, texto: { type: 'string' } }, required: ['nombre', 'texto'], additionalProperties: false } } },
            required: ['respuestas'], additionalProperties: false
          });
          const res = (out.respuestas || []).slice(0, 3).map(r => ({ name: r.nombre, text: String(r.texto).slice(0, 300) }));
          if (res.length) return res;
        } catch (e) {
          showToast('⚠️ ' + aiErrorMessage(e) + ' Respondo con la lógica local.');
        }
      }
      const named = list.find(c => low.includes(c.name.toLowerCase().split(' ')[0]) || low.includes(c.company.toLowerCase()));
      const c = named || list[0];
      const p = c.projectId && findProject(c.projectId);
      let reply;
      if (/(c[oó]mo va|avance|progreso|estado|cu[aá]ndo)/.test(low) && p) reply = p.status === 'terminado' ? '¡Ya lo tenemos y funciona genial, gracias!' : `Nos dicen que va al ${projectProgressPct(p)} por ciento. ¡Qué bien!`;
      else if (/(precio|presupuesto|cu[aá]nto|costo|coste)/.test(low)) reply = 'Tenemos un presupuesto razonable. Si nos dan una propuesta clara, firmamos esta semana.';
      else if (/(plazo|fecha|tiempo|semana|d[ií]as)/.test(low)) reply = 'Lo ideal sería tenerlo en un par de semanas. ¿Es posible?';
      else if (/(detalle|qu[eé] necesita|cu[eé]ntame|explica|requisit)/.test(low)) reply = `Necesitamos esto: ${c.need}`;
      else if (/(gracias|adi[oó]s|hasta luego|un placer)/.test(low)) reply = '¡Gracias a ustedes! Un placer hablar.';
      else if (/(hola|buenas)/.test(low)) reply = '¡Hola! Encantado de saludarle.';
      else reply = c.status === 'nuevo' ? 'Me parece bien. Si aceptan el encargo, díganme "aceptamos" y empezamos.' : 'Perfecto, lo tengo en cuenta. Muchas gracias.';
      const out = [{ id: c.id, text: reply }];
      if (list.length > 1 && Math.random() < 0.4) {
        const other = list.find(x => x !== c);
        out.push({ id: other.id, text: randPick(['Estoy de acuerdo.', 'Nosotros igual, nos interesa.', 'Coincido con lo que dicen.']) });
      }
      return out;
    }

    function addLead() {
      const used = new Set(CLIENTS.map(c => c.company));
      const lead = CLIENT_LEADS.find(l => !used.has(l.company));
      if (!lead) { showToast('Ya contactaste a todos los posibles clientes. Añade uno a mano.'); return; }
      CLIENTS.unshift(makeClient(lead, CLIENTS.length));
      saveClients();
      showToast(`📇 Nuevo cliente: ${lead.name} (${lead.company})`);
      renderClientsPanel();
    }

    function addClientFromForm() {
      const v = (id) => (document.getElementById(id) || {}).value || '';
      const name = cleanName(v('cl-name'), 30), company = cleanName(v('cl-company'), 40), need = cleanName(v('cl-need'), 300);
      if (!name || !company) { showToast('Escribe el nombre y la empresa del cliente.'); return; }
      CLIENTS.unshift(makeClient({ name, company, need: need || 'Por definir en la primera llamada.', kind: v('cl-kind'), sector: 'Cliente' }, CLIENTS.length));
      CLIENT_UI.form = false;
      saveClients();
      showToast(`📇 Cliente añadido: ${name}`);
      renderClientsPanel();
    }

    function removeClient(id) {
      CLIENTS = CLIENTS.filter(c => c.id !== id);
      CLIENT_UI.selected.delete(id);
      saveClients();
      renderClientsPanel();
    }

    function toggleClientSel(id) {
      if (CLIENT_UI.selected.has(id)) CLIENT_UI.selected.delete(id); else CLIENT_UI.selected.add(id);
      renderClientsPanel();
    }

    function renderClientsPanel() {
      const box = document.getElementById('dock-panel-clients');
      if (!box) return;
      const sel = CLIENT_UI.selected;
      box.innerHTML = `
        <div class="panel-head"><span>🤝 Clientes (${CLIENTS.length})</span>
          <span class="flex gap-1"><button class="icon-btn" title="Añadir cliente" onclick="CLIENT_UI.form=!CLIENT_UI.form; renderClientsPanel()">＋</button><button class="icon-btn" onclick="closeDockPanel()">✕</button></span>
        </div>
        <div class="p-2.5 space-y-2">
          ${CLIENT_UI.form ? `
            <div class="p-2 rounded-xl bg-slate-950 border border-slate-700 space-y-1.5">
              <input id="cl-name" maxlength="30" placeholder="Nombre del cliente" class="field" />
              <input id="cl-company" maxlength="40" placeholder="Empresa" class="field" />
              <select id="cl-kind" class="field nice-select">${Object.keys(KIND_LABEL).map(k => `<option value="${k}">${KIND_LABEL[k]}</option>`).join('')}</select>
              <textarea id="cl-need" maxlength="300" placeholder="¿Qué necesita?" class="field h-12 resize-none"></textarea>
              <button onclick="addClientFromForm()" class="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-semibold">Guardar cliente</button>
            </div>` : ''}
          <div class="flex gap-1.5">
            <button onclick="startClientCall([...CLIENT_UI.selected])" ${sel.size < 2 ? 'disabled' : ''} class="flex-1 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-40 text-cyan-100 border border-cyan-400/40 text-[11px] font-semibold">👥 Llamada conjunta (${sel.size})</button>
            <button onclick="addLead()" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px]" title="Buscar nuevo cliente">🔎 Buscar</button>
          </div>
          <div class="space-y-1.5 max-h-[46vh] overflow-y-auto quick-scroll pr-0.5">
            ${CLIENTS.length ? CLIENTS.map(c => {
              const st = CLIENT_STATUS[c.status];
              const p = c.projectId && findProject(c.projectId);
              return `
              <div class="p-2 rounded-xl border ${sel.has(c.id) ? 'bg-cyan-500/10 border-cyan-400/50' : 'bg-slate-900/85 border-slate-800'}">
                <div class="flex items-start gap-2">
                  <input type="checkbox" ${sel.has(c.id) ? 'checked' : ''} onchange="toggleClientSel('${c.id}')" class="mt-1 accent-cyan-400" title="Seleccionar para llamada conjunta" />
                  <span class="vr-avatar sm" style="background:${c.color}">${escapeHtml(initials(c.name))}</span>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-1"><span class="text-[11px] font-bold text-white truncate">${escapeHtml(c.name)}</span><span class="text-[9px] font-mono px-1.5 py-0.5 rounded border ${st[1]}">${st[0]}</span></div>
                    <div class="text-[10px] text-slate-400 truncate">${escapeHtml(c.company)} · ${KIND_LABEL[c.kind]}</div>
                    <div class="text-[10px] text-slate-500 line-clamp-2">${escapeHtml(c.need)}</div>
                    ${p ? `<div class="text-[10px] text-cyan-300">📁 ${escapeHtml(p.title)} · ${projectProgressPct(p)}%</div>` : ''}
                  </div>
                </div>
                <div class="flex gap-1 mt-1.5 pl-6">
                  <button onclick="startClientCall(['${c.id}'])" class="chip">📞 Llamar</button>
                  ${c.status === 'nuevo' ? `<button onclick="acceptClientOrder('${c.id}')" class="chip">📁 Aceptar pedido</button>` : ''}
                  <button onclick="removeClient('${c.id}')" class="chip ml-auto" title="Quitar">🗑</button>
                </div>
              </div>`;
            }).join('') : '<div class="text-[11px] text-slate-500 text-center p-3">Sin clientes. Pulsa 🔎 Buscar o ＋.</div>'}
          </div>
        </div>`;
    }
