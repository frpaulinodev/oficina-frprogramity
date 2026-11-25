    // _____________________________________________________________________
    // MOTORES DE IA de la oficina (se eligen en ⚙ del asistente):
    //  - local   : lógica propia de la oficina, sin IA (gratis, siempre disponible)
    //  - gemini  : Google Gemini con clave gratuita de Google AI Studio (gratis con límites)
    //  - webllm  : modelo abierto que corre DENTRO de tu navegador (gratis, sin cuenta)
    //  - claude  : Claude de Anthropic con tu clave de API (de pago)
    // Si el motor falla o llega a su límite, la oficina responde con la lógica local.
    // Las claves solo se guardan en ESTE navegador.
    // _____________________________________________________________________
    const AI_SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.60.0/+esm';
    const WEBLLM_URL = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.79/+esm';
    const AI_KEY = 'frp_ai_v1';
    const AI_MODELS = [
      { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (máxima calidad)', fallbacks: true },
      { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (rápido)', fallbacks: true },
      { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5 (económico)', fallbacks: false }
    ];
    const WEBLLM_MODELS = [
      { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Qwen 2.5 · 1.5B (rápido, ~1 GB)' },
      { id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', label: 'Qwen 2.5 · 3B (mejor, ~2 GB)' },
      { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 · 3B (~2 GB)' }
    ];
    const AI_ENGINES = {
      local: { label: 'Local', icon: '🏢', price: 'Gratis' },
      gemini: { label: 'Gemini', icon: '✨', price: 'Gratis' },
      webllm: { label: 'En tu navegador', icon: '💻', price: 'Gratis' },
      claude: { label: 'Claude', icon: '🟠', price: 'De pago' }
    };
    const AI = {
      engine: 'local', key: '', model: AI_MODELS[0].id,
      geminiKey: '', geminiModel: 'gemini-2.5-flash',
      webllmModel: WEBLLM_MODELS[0].id, webllm: null, webllmLoading: null, webllmProgress: 0, webllmText: '',
      sdk: null, client: null, clientKey: ''
    };

    // Las claves de Google pueden ser "AIza…" o de formato nuevo con puntos (p. ej. "AQ.…").
    // La comprobación de verdad la hace Google al guardar; aquí solo descartamos texto que no es una clave.
    const GEMINI_KEY_RE = /^[\w.~+/=-]{20,200}$/;
    function cleanGeminiKey(value) {
      return String(value || '')
        .replace(/^\s*(GEMINI_API_KEY|GOOGLE_API_KEY|API_KEY|key)\s*[:=]\s*/i, '') // si pegaste "GEMINI_API_KEY=…"
        .replace(/[\s"'“”‘’`]/g, '');                                               // espacios, saltos y comillas al copiar
    }

    (function loadAiSettings() {
      try {
        const s = JSON.parse(localStorage.getItem(AI_KEY) || '{}') || {};
        if (typeof s.key === 'string' && /^sk-ant-[\w-]{10,}$/.test(s.key.trim())) AI.key = s.key.trim();
        if (AI_MODELS.some(m => m.id === s.model)) AI.model = s.model;
        if (typeof s.geminiKey === 'string' && GEMINI_KEY_RE.test(s.geminiKey)) AI.geminiKey = s.geminiKey;
        if (typeof s.geminiModel === 'string' && /^gemini-[\w.-]+$/.test(s.geminiModel)) AI.geminiModel = s.geminiModel;
        if (Array.isArray(s.geminiModels)) AI.geminiModels = s.geminiModels.filter(m => typeof m === 'string' && /^gemini-[\w.-]+$/.test(m)).slice(0, 6);
        if (WEBLLM_MODELS.some(m => m.id === s.webllmModel)) AI.webllmModel = s.webllmModel;
        if (AI_ENGINES[s.engine]) AI.engine = s.engine;
        else if (AI.key) AI.engine = 'claude'; // ajustes antiguos: solo había Claude
      } catch (e) { /* sin ajustes */ }
    })();

    function saveAiSettings() {
      try {
        localStorage.setItem(AI_KEY, JSON.stringify({
          engine: AI.engine, key: AI.key, model: AI.model, geminiKey: AI.geminiKey, geminiModel: AI.geminiModel, geminiModels: AI.geminiModels || [], webllmModel: AI.webllmModel
        }));
      } catch (e) { /* sin persistencia */ }
    }

    // ¿Hay un motor de IA listo para responder?
    function aiReady() {
      if (AI.engine === 'claude') return !!AI.key;
      if (AI.engine === 'gemini') return !!AI.geminiKey;
      if (AI.engine === 'webllm') return true; // se descarga la primera vez que se usa
      return false;
    }

    // El modelo del navegador es pequeño: el código largo lo hace mejor el generador local
    function aiCodeReady() {
      return aiReady() && AI.engine !== 'webllm';
    }

    function aiEngineName() {
      if (AI.engine === 'claude') return (AI_MODELS.find(m => m.id === AI.model) || AI_MODELS[0]).label.split(' (')[0];
      if (AI.engine === 'gemini') return 'Gemini (' + AI.geminiModel.replace(/^gemini-/, '') + ')';
      if (AI.engine === 'webllm') return (WEBLLM_MODELS.find(m => m.id === AI.webllmModel) || WEBLLM_MODELS[0]).label.split(' (')[0];
      return 'Lógica local';
    }

    function setAiEngine(engine) {
      if (!AI_ENGINES[engine]) return;
      AI.engine = engine;
      saveAiSettings();
      if (engine === 'webllm' && !webgpuAvailable()) showToast('⚠️ Tu navegador no tiene WebGPU: usa Chrome o Edge actualizados, o elige Gemini.');
    }

    function webgpuAvailable() {
      return typeof navigator !== 'undefined' && !!navigator.gpu;
    }

    // ---- Claude ----
    function setAiKey(value) {
      const v = String(value || '').trim();
      if (v && !/^sk-ant-[\w-]{10,}$/.test(v)) { showToast('La clave debe empezar por "sk-ant-".'); return false; }
      AI.key = v;
      AI.client = null;
      if (v) AI.engine = 'claude';
      saveAiSettings();
      showToast(v ? '🤖 Claude conectado' : 'Clave de Claude quitada');
      return true;
    }

    function setAiModel(id) {
      if (!AI_MODELS.some(m => m.id === id)) return;
      AI.model = id;
      saveAiSettings();
    }

    async function aiClient() {
      if (!AI.sdk) AI.sdk = await import(AI_SDK_URL);
      if (!AI.client || AI.clientKey !== AI.key) {
        const Anthropic = AI.sdk.default;
        // Aplicación personal en el navegador: la clave es del propio usuario y no sale de su equipo
        AI.client = new Anthropic({ apiKey: AI.key, dangerouslyAllowBrowser: true, maxRetries: 2 });
        AI.clientKey = AI.key;
      }
      return AI.client;
    }

    // Petición a Claude con el respaldo automático del servidor si el modelo rechaza la petición
    async function aiCreate(params) {
      if (!AI.key) throw new Error('Claude no configurado');
      const client = await aiClient();
      const model = AI_MODELS.find(m => m.id === AI.model) || AI_MODELS[0];
      const body = Object.assign({ model: model.id }, params);
      if (model.fallbacks) {
        body.betas = ['server-side-fallback-2026-07-01'];
        body.fallbacks = 'default';
      }
      const res = await client.beta.messages.create(body);
      if (res.stop_reason === 'refusal') {
        const e = new Error('La IA no puede ayudar con esa petición.');
        e.refusal = true;
        throw e;
      }
      return res;
    }

    function aiText(res) {
      return (res.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
    }

    // ---- Gemini (gratis con clave de Google AI Studio) ----
    function geminiError(status, msg) {
      const e = new Error(msg || 'Gemini ' + status);
      e.gemini = status;
      return e;
    }
    const geminiBusy = (e) => e && [500, 502, 503, 504].includes(e.gemini);
    const geminiSleep = (ms) => new Promise(r => setTimeout(r, ms));

    async function geminiFetch(url, body) {
      let r;
      try {
        r = await fetch(url, {
          method: body ? 'POST' : 'GET',
          headers: Object.assign({ 'x-goog-api-key': AI.geminiKey }, body ? { 'Content-Type': 'application/json' } : {}),
          body: body ? JSON.stringify(body) : undefined
        });
      } catch (e) { throw geminiError(0, 'Sin conexión con Gemini'); }
      let j = null;
      try { j = await r.json(); } catch (e) { j = null; }
      if (!r.ok) throw geminiError(r.status, (j && j.error && j.error.message) || 'Error ' + r.status);
      return j;
    }

    // Modelos a probar, en orden: el que funcionó la última vez, el elegido, y los demás "flash" gratuitos
    function geminiModelOrder() {
      const listed = Array.isArray(AI.geminiModels) ? AI.geminiModels : [];
      const order = [AI.geminiWorking, AI.geminiModel, ...listed, 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
      return order.filter((m, i) => m && order.indexOf(m) === i);
    }

    // Llama a Gemini; si está saturado (503) reintenta y, si sigue, cambia a otro modelo gratuito
    async function geminiCall(body) {
      let lastErr = null;
      const models = geminiModelOrder().slice(0, 4);
      for (let mi = 0; mi < models.length; mi++) {
        const model = models[mi];
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
        for (let attempt = 0; attempt < (mi === 0 ? 2 : 1); attempt++) {
          try {
            const j = await geminiFetch(url, body);
            if (AI.geminiWorking !== model && model !== AI.geminiModel) showToast('✨ Gemini estaba saturado: uso ' + model.replace(/^gemini-/, '') + ' por ahora.');
            AI.geminiWorking = model;
            return j;
          } catch (e) {
            lastErr = e;
            if (geminiBusy(e)) { if (attempt === 0 && mi === 0) await geminiSleep(1200); continue; }
            if (e.gemini === 404 || e.gemini === 429) break; // modelo no disponible o sin cupo: probar el siguiente
            throw e; // clave mala, sin conexión…: no sirve probar otro modelo
          }
        }
        if (AI.geminiWorking === model) AI.geminiWorking = '';
      }
      throw lastErr || geminiError(503);
    }

    // Comprueba la clave y elige el modelo "flash" gratuito más reciente disponible
    async function setGeminiKey(value) {
      const v = cleanGeminiKey(value);
      if (!v) { AI.geminiKey = ''; saveAiSettings(); showToast('Clave de Gemini quitada'); return true; }
      if (!GEMINI_KEY_RE.test(v)) { showToast('Esa clave parece incompleta: cópiala entera desde Google AI Studio (botón "Copiar").'); return false; }
      const prev = AI.geminiKey;
      AI.geminiKey = v;
      AI.geminiWorking = '';
      try {
        const j = await geminiFetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200');
        const all = (j.models || [])
          .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
          .map(m => String(m.name).replace(/^models\//, ''));
        const ver = (n) => parseFloat(n.split('-')[1]) || 0;
        const flash = all.filter(n => /^gemini-[\d.]+-flash$/.test(n)).sort((a, b) => ver(b) - ver(a));
        const lite = all.filter(n => /^gemini-[\d.]+-flash-lite$/.test(n)).sort((a, b) => ver(b) - ver(a));
        if (flash.length) AI.geminiModel = flash[0];
        AI.geminiModels = flash.concat(lite).slice(0, 6);
      } catch (e) {
        if (!geminiBusy(e)) {
          AI.geminiKey = prev;
          showToast('⚠️ ' + aiErrorMessage(e));
          return false;
        }
        // Google está saturado y no deja comprobarla: la guardamos igualmente
        showToast('⚠️ Google está saturado y no pude comprobar la clave; la guardo igualmente.');
      }
      AI.engine = 'gemini';
      saveAiSettings();
      showToast('✨ Gemini conectado (' + AI.geminiModel + ')');
      return true;
    }

    async function geminiGenerate(system, messages, { json = false, maxTokens = 8192 } = {}) {
      const body = {
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content) }] })),
        generationConfig: Object.assign({ maxOutputTokens: maxTokens, temperature: 0.8 }, json ? { responseMimeType: 'application/json' } : {})
      };
      const j = await geminiCall(body);
      if (j.promptFeedback && j.promptFeedback.blockReason) { const e = new Error('Gemini bloqueó la petición.'); e.refusal = true; throw e; }
      const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
      const text = parts.filter(p => !p.thought).map(p => p.text || '').join('').trim();
      if (!text) throw geminiError(500, 'Gemini no devolvió texto');
      return text;
    }

    // ---- IA dentro del navegador (WebLLM + WebGPU) ----
    async function ensureWebLLM() {
      if (AI.webllm && AI.webllm.modelId === AI.webllmModel) return AI.webllm.engine;
      if (!webgpuAvailable()) throw Object.assign(new Error('Tu navegador no tiene WebGPU (usa Chrome o Edge actualizados).'), { local: true });
      if (AI.webllmLoading) return AI.webllmLoading;
      AI.webllmLoading = (async () => {
        const lib = await import(WEBLLM_URL);
        const modelId = AI.webllmModel;
        AI.webllmProgress = 0;
        const engine = await lib.CreateMLCEngine(modelId, {
          initProgressCallback: (p) => {
            AI.webllmProgress = Math.round((p.progress || 0) * 100);
            AI.webllmText = p.text || '';
            if (typeof renderAssistantProgress === 'function') renderAssistantProgress();
          }
        });
        AI.webllm = { engine, modelId };
        return engine;
      })();
      try {
        const e = await AI.webllmLoading;
        showToast('💻 IA del navegador lista');
        return e;
      } finally {
        AI.webllmLoading = null;
        if (typeof renderAssistant === 'function') renderAssistant();
      }
    }

    async function webllmGenerate(system, messages, { json = false, maxTokens = 700 } = {}) {
      const engine = await ensureWebLLM();
      const res = await engine.chat.completions.create({
        messages: [{ role: 'system', content: system }, ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content) }))],
        temperature: 0.7,
        max_tokens: maxTokens,
        response_format: json ? { type: 'json_object' } : undefined
      });
      return String((res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content) || '').trim();
    }

    // ---- Interfaz común para los motores ----
    // Texto libre con el motor elegido
    async function aiTextReply(system, messages, opts = {}) {
      if (AI.engine === 'claude') {
        const res = await aiCreate({ max_tokens: opts.maxTokens || 4000, system, messages, output_config: { effort: opts.effort || 'low' } });
        return aiText(res);
      }
      if (AI.engine === 'gemini') return geminiGenerate(system, messages, opts);
      if (AI.engine === 'webllm') return webllmGenerate(system, messages, opts);
      throw new Error('IA no configurada');
    }

    function parseJsonLoose(text) {
      const t = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      try { return JSON.parse(t); } catch (e) { /* busca el objeto dentro del texto */ }
      const a = t.indexOf('{'), b = t.lastIndexOf('}');
      if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
      throw new Error('Respuesta sin JSON');
    }

    // Respuesta JSON (reuniones, llamadas con clientes, charla de motivación)
    async function aiJson(system, messages, schema, maxTokens = 2000) {
      if (AI.engine === 'claude') {
        const res = await aiCreate({
          max_tokens: maxTokens, system, messages,
          output_config: { effort: 'low', format: { type: 'json_schema', schema } }
        });
        return JSON.parse(aiText(res));
      }
      const sys = system + '\n\nResponde SOLO con un objeto JSON válido (sin texto extra) que siga este esquema JSON:\n' + JSON.stringify(schema);
      const text = AI.engine === 'gemini'
        ? await geminiGenerate(sys, messages, { json: true, maxTokens: Math.max(4096, maxTokens) })
        : await webllmGenerate(sys, messages, { json: true, maxTokens: Math.min(900, maxTokens) });
      return parseJsonLoose(text);
    }

    function aiErrorMessage(err) {
      if (err && err.refusal) return err.message;
      if (err && err.local) return err.message;
      if (err && err.gemini !== undefined) {
        if (err.gemini === 0) return 'Sin conexión con Gemini.';
        if (err.gemini === 429) return 'Se alcanzó el límite gratis de Gemini por ahora: espera un poco.';
        if (err.gemini === 400 || err.gemini === 401 || err.gemini === 403) return 'La clave de Gemini no es válida o no tiene permiso.';
        if (err.gemini === 404) return 'Ese modelo de Gemini ya no está disponible: vuelve a guardar la clave.';
        if ([500, 502, 503, 504].includes(err.gemini)) return 'Gemini está saturado ahora mismo (no es tu clave): prueba otra vez en un minuto.';
        return 'Gemini respondió con un error (' + err.gemini + ').';
      }
      const sdk = AI.sdk && AI.sdk.default;
      if (sdk) {
        if (sdk.AuthenticationError && err instanceof sdk.AuthenticationError) return 'La clave de Claude no es válida.';
        if (sdk.PermissionDeniedError && err instanceof sdk.PermissionDeniedError) return 'Tu clave no tiene permiso para este modelo.';
        if (sdk.RateLimitError && err instanceof sdk.RateLimitError) return 'Demasiadas peticiones: espera unos segundos.';
        if (sdk.APIConnectionError && err instanceof sdk.APIConnectionError) return 'Sin conexión con la IA.';
        if (sdk.APIError && err instanceof sdk.APIError) return 'La IA respondió con un error (' + (err.status || '?') + ').';
      }
      if (AI.engine === 'webllm') return 'La IA del navegador no pudo responder (' + String((err && err.message) || err).slice(0, 80) + ').';
      return 'No se pudo contactar con la IA.';
    }

    // ---- Código real de un proyecto escrito por la IA ----
    const AI_KIND_HINT = {
      web: 'un sitio web completo y adaptable (cabecera, secciones con contenido real, formulario de contacto funcional)',
      app: 'una aplicación web interactiva y útil con estado, filtros y guardado en localStorage protegido con try/catch',
      juego: 'un juego jugable en <canvas> con controles de teclado y táctiles, puntuación, niveles, pausa y reinicio',
      software: 'una herramienta de software con lógica real en JavaScript y una consola o panel para probarla, incluyendo pruebas automáticas visibles',
      ayuda: 'una guía de ayuda paso a paso con buscador, pasos plegables, lista de verificación y preguntas frecuentes'
    };

    async function aiGenerateProjectCode(p) {
      const system = `Eres el equipo de desarrollo de la empresa "${BRAND}". Escribes código de producción, limpio y comentado en español.
Responde SOLO con un documento HTML completo de un único archivo (CSS y JavaScript incluidos en línea), sin explicaciones y sin bloques de markdown.
Requisitos: funciona dentro de un iframe con sandbox="allow-scripts" (sin acceso a localStorage garantizado: protégelo con try/catch), sin recursos externos ni CDN, textos en español, diseño moderno y adaptable a móvil.`;
      const user = `Proyecto: ${p.title}
Tipo: ${AI_KIND_HINT[p.kind] || AI_KIND_HINT.web}
Pedido del Director: ${p.brief || '(sin detalles: usa tu mejor criterio profesional)'}`;
      const raw = await aiTextReply(system, [{ role: 'user', content: user }], { maxTokens: AI.engine === 'gemini' ? 32000 : 16000, effort: 'medium' });
      let html = String(raw).replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/i, '').trim();
      if (!/^<!doctype html|^<html/i.test(html)) {
        const i = html.search(/<!doctype html|<html/i);
        html = i >= 0 ? html.slice(i) : '';
      }
      if (html.length < 200 || !/<\/html>\s*$/i.test(html)) throw new Error('Código incompleto');
      return html.slice(0, 200000);
    }
