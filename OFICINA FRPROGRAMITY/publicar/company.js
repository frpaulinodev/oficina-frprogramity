    // _____________________________________________________________________
    // EMPRESA: identidad de la empresa que se está viendo y aislamiento de sus datos.
    // - Sin parámetros: tu empresa principal (FRPROGRAMITY).
    // - Con ?empresa=<id>: la empresa independiente de un familiar. Todo lo que guarda
    //   (equipo, proyectos, entregables, clientes, música, rangos…) vive en su propio
    //   espacio de almacenamiento, separado del tuyo.
    // Se carga ANTES que script.js.
    // _____________________________________________________________________
    const COMPANIES_KEY = 'frp_companies_v1'; // registro compartido (no se separa por empresa)

    const COMPANY_STORE = (function () {
      let ls = null;
      try { ls = window.localStorage; } catch (e) { ls = null; }
      const proto = typeof Storage !== 'undefined' ? Storage.prototype : null;
      const raw = proto ? { get: proto.getItem, set: proto.setItem, remove: proto.removeItem, key: proto.key } : null;
      const safe = (fn, fb) => { try { return fn(); } catch (e) { return fb; } };
      return {
        ls, raw,
        rawGet: (k) => (ls && raw ? safe(() => raw.get.call(ls, k), null) : null),
        rawSet: (k, v) => { if (ls && raw) safe(() => raw.set.call(ls, k, v)); },
        rawRemove: (k) => { if (ls && raw) safe(() => raw.remove.call(ls, k)); },
        rawKeys: () => {
          if (!ls || !raw) return [];
          return safe(() => { const out = []; for (let i = 0; i < ls.length; i++) out.push(raw.key.call(ls, i)); return out; }, []);
        }
      };
    })();

    function listCompanies() {
      try {
        const l = JSON.parse(COMPANY_STORE.rawGet(COMPANIES_KEY) || '[]');
        return Array.isArray(l) ? l.filter(c => c && typeof c === 'object' && /^of[a-z0-9]{3,20}$/.test(String(c.id))) : [];
      } catch (e) { return []; }
    }

    function saveCompanies(list) {
      COMPANY_STORE.rawSet(COMPANIES_KEY, JSON.stringify(list.slice(0, 12)));
    }

    function companyLink(id) {
      const base = location.href.split('#')[0].split('?')[0];
      return base + '?empresa=' + encodeURIComponent(id);
    }

    // Borra todo lo guardado por una empresa independiente
    function purgeCompanyData(id) {
      const prefix = 'frp@' + id + ':';
      COMPANY_STORE.rawKeys().forEach(k => { if (k && k.startsWith(prefix)) COMPANY_STORE.rawRemove(k); });
    }

    const COMPANY = (function () {
      let wanted = '';
      try { wanted = (new URLSearchParams(location.search).get('empresa') || '').replace(/[^a-z0-9]/gi, '').slice(0, 24); } catch (e) { wanted = ''; }
      const found = wanted ? listCompanies().find(c => c.id === wanted) : null;
      const clean = (v, n) => String(v == null ? '' : v).replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
      if (found) {
        const ns = 'frp@' + found.id + ':';
        const { ls, raw } = COMPANY_STORE;
        if (ls && raw) {
          const mapKey = (store, k) => (store === ls && typeof k === 'string' && k.startsWith('frp_') && k !== COMPANIES_KEY ? ns + k : k);
          Storage.prototype.getItem = function (k) { return raw.get.call(this, mapKey(this, k)); };
          Storage.prototype.setItem = function (k, v) { return raw.set.call(this, mapKey(this, k), v); };
          Storage.prototype.removeItem = function (k) { return raw.remove.call(this, mapKey(this, k)); };
        }
        return {
          id: found.id, independent: true,
          name: clean(found.name, 28) || 'Mi Empresa',
          owner: clean(found.owner, 24) || 'Director',
          color: Number(found.color) || 0,
          specialty: clean(found.specialty, 20) || 'tecnologia'
        };
      }
      return { id: 'main', independent: false, name: 'FRPROGRAMITY', owner: 'Tú', color: 0, specialty: 'tecnologia', missing: !!wanted };
    })();

    const BRAND = COMPANY.name;
    const BRAND_UPPER = BRAND.toUpperCase();
    const DIRECTOR_LABEL = COMPANY.independent ? COMPANY.owner : 'Tú';
    try { document.title = BRAND + ' — Oficina Virtual'; } catch (e) { /* sin DOM */ }
