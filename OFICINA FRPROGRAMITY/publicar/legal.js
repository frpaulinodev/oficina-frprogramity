// _____________________________________________________________________
// AVISOS LEGALES Y CRÉDITOS de la oficina y del laboratorio
// (regla de FRPROGRAMITY: todo lo que se crea lleva Privacidad, Términos, Cookies y créditos)
// - En la oficina: sección "Legal" en el menú ⚙ + aviso la primera vez que se entra.
// - En el laboratorio: pie de página con los enlaces.
// _____________________________________________________________________
(function () {
  const OWNER = 'FRPROGRAMITY';
  const YEAR = new Date().getFullYear();
  const UPDATED = '25 de noviembre de 2026';
  const TEXTS = {
    privacidad: ['Política de Privacidad', `
      <p><b>Responsable:</b> ${OWNER}, empresa de desarrollo de software de República Dominicana. Última actualización: ${UPDATED}.</p>
      <p><b>Qué datos se guardan y dónde.</b> La oficina virtual y el laboratorio no tienen servidor propio ni cuentas de usuario. Todo lo que creas (proyectos, cotizaciones, clientes, equipo, progreso del laboratorio, ajustes y claves de IA) se guarda <b>solo en este navegador</b> (almacenamiento local). ${OWNER} no recibe ni ve esos datos.</p>
      <p><b>Inteligencia artificial.</b> Si conectas una IA, el texto de tus pedidos se envía directamente desde tu navegador al proveedor que elijas: Google (Gemini) o Anthropic (Claude), con tu propia clave, y se rige por sus políticas de privacidad. La opción "en tu navegador" descarga un modelo y no envía tus textos a nadie.</p>
      <p><b>Servicios de terceros.</b> Para funcionar, la página carga recursos de otros sitios: librerías (cdnjs, jsDelivr), el directorio de radios Radio Browser y las emisoras que escuches, y los reproductores oficiales de Apple Music, Deezer o YouTube cuando abres un álbum. Esos servicios pueden registrar tu dirección IP según sus propias políticas.</p>
      <p><b>Tus derechos.</b> Puedes borrar todos tus datos cuando quieras borrando los datos de este sitio en la configuración de tu navegador. No vendemos ni compartimos datos personales.</p>
      <p><b>Menores de edad.</b> Si eres menor, usa la oficina con permiso de tu madre, padre o tutor, sobre todo antes de conectar servicios de IA.</p>`],
    terminos: ['Términos y Condiciones', `
      <p>Al usar la oficina virtual y el laboratorio de ${OWNER} aceptas estos términos. Última actualización: ${UPDATED}.</p>
      <p><b>Uso.</b> La herramienta se ofrece "tal cual", de forma gratuita, para trabajar, aprender y practicar. Puede cambiar o dejar de estar disponible sin previo aviso.</p>
      <p><b>Contenido generado por IA.</b> El código, los textos y las cotizaciones que genera el equipo de IA pueden contener errores. Revísalos antes de entregarlos a un cliente o usarlos en producción. Los precios de las cotizaciones son orientativos y el precio final se acuerda con el cliente.</p>
      <p><b>Electrónica y robótica.</b> El simulador es una ayuda para aprender: un circuito real puede comportarse distinto. Monta siempre con el Arduino desconectado, no conectes motores ni relés directamente a los pines y no trabajes con 110/220 V sin la supervisión de un adulto con experiencia. ${OWNER} no se hace responsable de daños por montajes reales.</p>
      <p><b>Claves y servicios externos.</b> Eres responsable de tus claves de API y del uso que hagas de los servicios de Google, Anthropic y otros proveedores, según sus condiciones.</p>
      <p><b>Propiedad.</b> El nombre, el logo y el diseño de ${OWNER}, la oficina virtual y el laboratorio son de ${OWNER}. Los álbumes y emisoras pertenecen a sus autores y se escuchan desde sus reproductores oficiales.</p>`],
    cookies: ['Política de Cookies', `
      <p><b>No usamos cookies de publicidad ni de seguimiento.</b> Última actualización: ${UPDATED}.</p>
      <p>La página usa el <b>almacenamiento local del navegador</b> (parecido a las cookies) solo para que funcione: recordar tus proyectos, ajustes, música elegida, progreso del laboratorio y claves de IA. Esos datos no salen de tu navegador.</p>
      <p>Los reproductores de terceros (Apple Music, Deezer, YouTube) pueden usar sus propias cookies cuando los abres. Puedes borrar todo desde la configuración de tu navegador; si lo haces, la oficina empezará de cero.</p>`]
  };

  function openLegal(kind) {
    const t = TEXTS[kind] || TEXTS.privacidad;
    let m = document.getElementById('frp-legal-modal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'frp-legal-modal';
      m.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(2,6,23,.7);display:flex;align-items:center;justify-content:center;padding:16px';
      m.innerHTML = `<div role="dialog" aria-modal="true" style="background:#0f172a;color:#e2e8f0;border:1px solid #b8743a;border-radius:16px;max-width:620px;width:100%;max-height:85vh;overflow:auto;padding:20px 22px;font:14px/1.55 system-ui,sans-serif">
        <h2 id="frp-legal-title" style="margin:0 0 10px;font-size:19px;color:#fbbf24"></h2><div id="frp-legal-body"></div>
        <p style="margin-top:14px;font-size:12px;color:#94a3b8">© ${YEAR} ${OWNER}. Todos los derechos reservados · Desarrollado por ${OWNER}</p>
        <button type="button" id="frp-legal-close" style="margin-top:6px;background:#b8743a;color:#fff;border:0;border-radius:10px;padding:8px 16px;cursor:pointer;font:inherit">Cerrar</button></div>`;
      const st = document.createElement('style');
      st.textContent = '#frp-legal-body p{margin:0 0 10px}#frp-legal-body b{color:#f8fafc}';
      m.appendChild(st);
      document.body.appendChild(m);
      m.addEventListener('click', (e) => { if (e.target === m || e.target.id === 'frp-legal-close') m.style.display = 'none'; });
    }
    document.getElementById('frp-legal-title').textContent = t[0];
    document.getElementById('frp-legal-body').innerHTML = t[1];
    m.style.display = 'flex';
  }
  window.openLegal = openLegal;

  const links = (style) => ['privacidad', 'terminos', 'cookies'].map(k =>
    `<a href="#" data-legal="${k}" style="${style}">${TEXTS[k][0]}</a>`).join(' · ');
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('[data-legal]');
    if (a) { e.preventDefault(); openLegal(a.dataset.legal); }
  });

  function mount() {
    const pop = document.getElementById('settings-pop');
    if (pop) {
      // Oficina: sección Legal dentro del menú ⚙
      const box = document.createElement('div');
      box.className = 'pt-2 border-t border-slate-800 text-[10px] text-slate-400 leading-relaxed';
      box.innerHTML = `<div class="mb-1">⚖️ Legal</div>${links('color:#fbbf24;text-decoration:underline')}<div class="mt-1.5 text-slate-500">© ${YEAR} ${OWNER} · Desarrollado por <b style="color:#f0b27a">${OWNER}</b></div>`;
      pop.appendChild(box);
      // aviso la primera vez
      let seen = false;
      try { seen = localStorage.getItem('frp_legal_ok_v1') === '1'; } catch (e) { seen = false; }
      if (!seen) {
        const bar = document.createElement('div');
        bar.id = 'frp-legal-bar';
        bar.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:84px;z-index:9500;max-width:560px;width:calc(100% - 24px);background:#0f172a;border:1px solid #b8743a;color:#e2e8f0;border-radius:14px;padding:10px 12px;font:12px/1.5 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5);display:flex;gap:10px;align-items:center;flex-wrap:wrap';
        bar.innerHTML = `<span style="flex:1;min-width:220px">🍪 Tus proyectos y ajustes se guardan <b>solo en este navegador</b>. Si conectas una IA, tus pedidos se envían a Google o Anthropic. Más en la ${links('color:#fbbf24;text-decoration:underline').split(' · ')[0]}.</span>
          <button type="button" style="background:#b8743a;color:#fff;border:0;border-radius:10px;padding:6px 14px;cursor:pointer;font:inherit">Entendido</button>`;
        bar.querySelector('button').onclick = () => { try { localStorage.setItem('frp_legal_ok_v1', '1'); } catch (e) { /* sin almacenamiento */ } bar.remove(); };
        document.body.appendChild(bar);
      }
    } else {
      // Laboratorio: pie de página
      const f = document.createElement('footer');
      f.style.cssText = 'text-align:center;padding:14px 12px 22px;color:#94a3b8;font:12px/1.6 system-ui,sans-serif;border-top:1px solid #1e293b';
      f.innerHTML = `${links('color:#fbbf24;text-decoration:underline')}<br>© ${YEAR} ${OWNER}. Todos los derechos reservados · Desarrollado por <b style="color:#f0b27a">${OWNER}</b>`;
      document.body.appendChild(f);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
