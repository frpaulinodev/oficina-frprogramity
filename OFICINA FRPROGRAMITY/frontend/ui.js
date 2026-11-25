    // _____________________________________________________________________
    // INTERFAZ: barra inferior (dock) con paneles flotantes compactos, panel lateral
    // plegable, pantalla de carga y arranque de todos los sistemas nuevos.
    // Se carga el último.
    // _____________________________________________________________________
    const DOCK = { open: null };
    const DOCK_RENDER = {
      assistant: () => renderAssistant(),
      music: () => renderMusicPanel(),
      schedule: () => renderSchedulePanel(),
      clients: () => renderClientsPanel()
    };

    function openDockPanel(name) {
      if (!DOCK_RENDER[name]) return;
      DOCK.open = name;
      document.querySelectorAll('.dock-panel').forEach(p => p.classList.toggle('hidden', p.id !== 'dock-panel-' + name));
      document.querySelectorAll('.dock-btn[data-panel]').forEach(b => b.classList.toggle('on', b.dataset.panel === name));
      DOCK_RENDER[name]();
      if (name === 'assistant') setTimeout(() => { const i = document.getElementById('as-input'); if (i) i.focus(); }, 30);
    }

    function closeDockPanel() {
      DOCK.open = null;
      document.querySelectorAll('.dock-panel').forEach(p => p.classList.add('hidden'));
      document.querySelectorAll('.dock-btn[data-panel]').forEach(b => b.classList.remove('on'));
    }

    function toggleDockPanel(name) {
      if (DOCK.open === name) closeDockPanel(); else openDockPanel(name);
    }

    function dockMeeting() {
      if (MEETING.active) {
        if (ROOM.open && ROOM.kind === 'meeting') { endMeeting(); return; }
        endMeeting();
        return;
      }
      convokeMeeting('meeting');
    }

    // ---- Panel lateral plegable (recuerda tu preferencia) ----
    function setSidePanel(open) {
      panelMinimized = !open;
      const aside = document.getElementById('side-panel');
      const body = document.getElementById('panel-body');
      aside.classList.toggle('collapsed', !open);
      body.classList.toggle('hidden', !open);
      try { localStorage.setItem('frp_panel_open', open ? '1' : '0'); } catch (e) { /* sin persistencia */ }
    }
    toggleSidePanel = function () { setSidePanel(panelMinimized); };
    function openSidePanel() { if (panelMinimized) setSidePanel(true); }

    // Al pulsar una pestaña con el panel plegado, se despliega
    const _baseSwitchTab = switchTab;
    switchTab = function (tab) {
      _baseSwitchTab(tab);
      openSidePanel();
      if (tab === 'recruit' && RECRUIT.open) {
        // abriste la sección de vacantes: el siguiente candidato llega enseguida
        RECRUIT.nextArrivalAt = Math.min(RECRUIT.nextArrivalAt, performance.now() + 2500);
      }
    };

    // ---- Ajustes (cámara, calidad, cielo) en un menú compacto ----
    function toggleSettings(force) {
      const el = document.getElementById('settings-pop');
      const show = force === undefined ? el.classList.contains('hidden') : force;
      el.classList.toggle('hidden', !show);
    }
    document.addEventListener('pointerdown', (e) => {
      const pop = document.getElementById('settings-pop');
      if (pop && !pop.classList.contains('hidden') && !e.target.closest('#settings-pop') && !e.target.closest('#settings-btn')) pop.classList.add('hidden');
    });

    // ---- Pantalla de carga ----
    function loaderStep(text, pct) {
      const t = document.getElementById('loader-text');
      if (t) t.textContent = text;
      const b = document.getElementById('loader-bar');
      if (b && pct !== undefined) b.style.width = pct + '%';
    }

    function hideLoader() {
      const el = document.getElementById('loader');
      if (!el) return;
      el.classList.add('done');
      setTimeout(() => el.remove(), 700);
    }

    function applyBranding() {
      const n = document.getElementById('brand-name');
      if (n) n.textContent = BRAND;
      const l = document.getElementById('brand-logo');
      if (l) l.textContent = BRAND.replace(/[^A-Za-zÁÉÍÓÚÑ0-9]/g, '').slice(0, 3).toUpperCase() || 'IA';
      const sub = document.getElementById('brand-sub');
      if (sub) sub.textContent = COMPANY.independent ? 'Empresa de ' + COMPANY.owner : 'Oficina virtual · equipo IA';
      const ln = document.getElementById('loader-brand');
      if (ln) ln.textContent = BRAND;
      const asb = document.getElementById('dock-assistant-label');
      if (asb) asb.textContent = BRAND.length > 14 ? 'Asistente' : BRAND + ' IA';
      if (COMPANY.missing) setTimeout(() => showToast('No encontré esa empresa en este navegador: estás en ' + BRAND + '.'), 1500);
    }

    // ---- Arranque ----
    const _baseOnload = window.onload;
    window.onload = function () {
      applyBranding();
      loaderStep('Construyendo la oficina…', 25);
      // deja pintar la pantalla de carga antes del trabajo pesado
      requestAnimationFrame(() => setTimeout(() => {
        try {
          _baseOnload();
          loaderStep('Preparando al equipo…', 60);
          loadClients();
          startScheduleEngine();
          FRAME_HOOKS.pre.push(director3dStep);
          FRAME_HOOKS.post.push(updateCityScreens);
          let open = window.innerWidth >= 1280;
          try { const v = localStorage.getItem('frp_panel_open'); if (v === '0' || v === '1') open = v === '1'; } catch (e) { /* por defecto */ }
          setSidePanel(open);
          updateTimeOfDayButtons();
          updateMusicChip();
          renderDirectorPanel();
        } catch (err) {
          console.error('Error al iniciar la oficina:', err);
          showToast('Hubo un problema al iniciar la oficina. Recarga la página.');
        }
        loaderStep('Levantando la ciudad…', 85);
        requestAnimationFrame(() => setTimeout(() => {
          try { buildCity(); } catch (err) { console.error('Ciudad:', err); }
          loaderStep('¡Listo!', 100);
          hideLoader();
        }, 40));
      }, 30));
    };
