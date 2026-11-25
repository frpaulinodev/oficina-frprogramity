    // _____________________________________________________________________
    // ARREGLO DE ESCRITURA: varios paneles se redibujan solos cada pocos segundos
    // (Proyectos cada 2 s mientras el equipo trabaja, Talento aún más a menudo…).
    // Al redibujarse, el campo donde escribías se recreaba y perdías el cursor.
    // Ahora, si estás escribiendo, el redibujo conserva el foco, el cursor y el texto.
    // Se carga el ÚLTIMO para envolver la versión final de cada función.
    // _____________________________________________________________________
    function isTypingField(el) {
      if (!el || !el.id) return false;
      if (el.tagName === 'TEXTAREA') return true;
      return el.tagName === 'INPUT' && !/^(checkbox|radio|range|button|submit|reset|file|color)$/i.test(el.type || 'text');
    }

    function keepFocusWhile(rootId, render) {
      const root = document.getElementById(rootId);
      const act = document.activeElement;
      const ev = typeof window !== 'undefined' ? window.event : null;
      // si el redibujo lo provoca un clic, un envío o una tecla del usuario, se deja como siempre
      const byUser = ev && /^(submit|click|change|keydown|keyup|pointerdown|mousedown)$/.test(ev.type);
      const typing = !byUser && root && isTypingField(act) && root.contains(act);
      if (!typing) return render();
      const snap = { id: act.id, value: act.value, s: act.selectionStart, e: act.selectionEnd, inner: act.scrollTop, outer: root.scrollTop };
      const out = render();
      const el = document.getElementById(snap.id);
      if (el && isTypingField(el)) {
        if (el.value !== snap.value) el.value = snap.value;
        try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
        try { el.setSelectionRange(snap.s, snap.e); } catch (e) { /* sin selección */ }
        el.scrollTop = snap.inner;
      }
      root.scrollTop = snap.outer;
      return out;
    }

    [['renderPanel', 'panel-body'], ['renderAssistant', 'dock-panel-assistant'], ['renderClientsPanel', 'dock-panel-clients'],
     ['renderWorkView', 'modal-content'], ['renderVoiceRoom', 'voice-room']].forEach(([name, rootId]) => {
      const base = window[name];
      if (typeof base !== 'function') return;
      window[name] = function (...args) { return keepFocusWhile(rootId, () => base.apply(this, args)); };
    });
