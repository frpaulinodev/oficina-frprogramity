// _____________________________________________________________________
// LABORATORIO · INTERFAZ
// Pestañas: Circuito Arduino · Robot · Retos · Electrónica · Algoritmos
// _____________________________________________________________________
const LAB_KEY = 'frp_lab_v1';
const PWM_PINS = [3, 5, 6, 9, 10, 11];
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pinName = (p) => (Number(p) >= 14 ? 'A' + (Number(p) - 14) : String(p));

let LAB = { code: {}, comps: null, done: { retos: {}, algos: {} }, sound: true };
try { const s = JSON.parse(localStorage.getItem(LAB_KEY) || '{}'); if (s && typeof s === 'object') LAB = Object.assign(LAB, s); } catch (e) { /* sin datos */ }
LAB.code = LAB.code || {}; LAB.done = LAB.done || { retos: {}, algos: {} }; LAB.done.retos = LAB.done.retos || {}; LAB.done.algos = LAB.done.algos || {};
let saveTimer = null;
function saveLab() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { localStorage.setItem(LAB_KEY, JSON.stringify(LAB)); } catch (e) { /* lleno */ } }, 300); }

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 2600);
}

// ---------- Editor de código con números de línea ----------
function makeEditor(host, value, onChange) {
  host.innerHTML = `<div class="ed"><pre class="ed-lines"></pre><textarea spellcheck="false" autocapitalize="off" autocomplete="off"></textarea></div>`;
  const ta = $('textarea', host), lines = $('.ed-lines', host);
  const sync = () => { const n = ta.value.split('\n').length; lines.textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n'); lines.scrollTop = ta.scrollTop; };
  ta.value = value || '';
  sync();
  ta.addEventListener('input', () => { sync(); onChange && onChange(ta.value); });
  ta.addEventListener('scroll', () => { lines.scrollTop = ta.scrollTop; });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart, en = ta.selectionEnd;
      ta.setRangeText('  ', s, en, 'end'); sync(); onChange && onChange(ta.value);
    } else if (e.key === 'Enter') {
      const s = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
      const indent = (ta.value.slice(lineStart, s).match(/^\s*/) || [''])[0] + (ta.value[s - 1] === '{' ? '  ' : '');
      e.preventDefault();
      ta.setRangeText('\n' + indent, s, ta.selectionEnd, 'end'); sync(); onChange && onChange(ta.value);
    }
  });
  return { get value() { return ta.value; }, set value(v) { ta.value = v; sync(); }, el: ta, focus: () => ta.focus() };
}

// ---------- Materiales y conexiones reales ----------
function ledResistor(color) {
  const vf = LED_VF[color] || 2.0;
  const r = (5 - vf) / 0.015;
  const e12 = [100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820, 1000];
  return e12.find(x => x >= r) || 1000;
}
function wiringFor(c) {
  const p = c.pines || {};
  switch (c.tipo) {
    case 'led': return `Ánodo (pata larga) → resistencia de ${ledResistor(c.color)} Ω → pin ${pinName(p.pin)}. Cátodo (pata corta) → GND.`;
    case 'rgb': return `R → 220 Ω → pin ${pinName(p.r)}, G → 220 Ω → pin ${pinName(p.g)}, B → 220 Ω → pin ${pinName(p.b)}. Pata común → GND (cátodo común).`;
    case 'boton': return `Una pata → pin ${pinName(p.pin)}; la pata contraria → GND. En el código: pinMode(${pinName(p.pin)}, INPUT_PULLUP).`;
    case 'pot': return `Patas de los extremos → 5V y GND. Pata del centro → ${pinName(p.pin)}.`;
    case 'ldr': return `LDR entre 5V y ${pinName(p.pin)}; resistencia de 10 kΩ de ${pinName(p.pin)} a GND (divisor de voltaje).`;
    case 'temp': return `LM35 (cara plana hacia ti): izquierda → 5V, centro → ${pinName(p.pin)}, derecha → GND.`;
    case 'ultrasonico': return `VCC → 5V, Trig → pin ${pinName(p.trig)}, Echo → pin ${pinName(p.echo)}, GND → GND.`;
    case 'pir': return `VCC → 5V, OUT → pin ${pinName(p.pin)}, GND → GND. Espera ~1 min al encenderlo para que se calibre.`;
    case 'servo': return `Cable marrón → GND, rojo → 5V, naranja (señal) → pin ${pinName(p.pin)}. Con más de un servo usa fuente externa de 5V (GND común).`;
    case 'motor': return `Nunca directo al pin: pin ${pinName(p.pin)} → 1 kΩ → base de un transistor TIP120 (o entrada EN de un L298N). Diodo 1N4007 en paralelo con el motor y fuente aparte.`;
    case 'buzzer': return `Pata + (larga) → pin ${pinName(p.pin)}; pata − → GND. Si es buzzer pasivo, suena con tone().`;
    case 'rele': return `Módulo relé: VCC → 5V, GND → GND, IN → pin ${pinName(p.pin)}. La lámpara va por COM y NO. ⚠️ Con 110/220 V pide ayuda a un adulto: es peligroso.`;
    case 'lcd': return `Módulo I2C: GND → GND, VCC → 5V, SDA → A4, SCL → A5. Dirección habitual 0x27 (o 0x3F). Librería LiquidCrystal_I2C.`;
    case 'brazo': return `Servo base → pin ${pinName(p.base)}, codo → pin ${pinName(p.codo)}, pinza → pin ${pinName(p.pinza)}. Señal naranja al pin; rojo/marrón a una fuente de 5V 2A (GND común con Arduino).`;
  }
  return '';
}
function materialsFor(comps) {
  const items = { 'Arduino Uno (o compatible) + cable USB': 1, 'Protoboard': 1, 'Cables dupont macho-macho': 10 };
  const add = (k, n = 1) => { items[k] = (items[k] || 0) + n; };
  comps.forEach(c => {
    switch (c.tipo) {
      case 'led': add(`LED ${c.color || 'rojo'} 5 mm`); add(`Resistencia ${ledResistor(c.color)} Ω`); break;
      case 'rgb': add('LED RGB cátodo común'); add('Resistencia 220 Ω', 3); break;
      case 'boton': add('Pulsador (botón) 6×6 mm'); break;
      case 'pot': add('Potenciómetro 10 kΩ'); break;
      case 'ldr': add('Fotorresistencia LDR'); add('Resistencia 10 kΩ'); break;
      case 'temp': add('Sensor de temperatura LM35'); break;
      case 'ultrasonico': add('Sensor ultrasónico HC-SR04'); break;
      case 'pir': add('Sensor de movimiento PIR HC-SR501'); break;
      case 'servo': add('Servomotor SG90'); break;
      case 'motor': add('Motor DC 5V'); add('Transistor TIP120 (o driver L298N)'); add('Diodo 1N4007'); add('Resistencia 1 kΩ'); break;
      case 'buzzer': add('Zumbador (buzzer) pasivo'); break;
      case 'rele': add('Módulo relé 5V'); add('Lámpara'); break;
      case 'lcd': add('Pantalla LCD 16x2 con módulo I2C'); break;
      case 'brazo': add('Brazo robótico de 3 servos (kit)'); add('Servomotor SG90 / MG90S', 3); add('Fuente 5V 2A'); break;
    }
  });
  return Object.entries(items);
}

// ---------- Banco de trabajo (editor + placa + componentes + monitor serie) ----------
class Workbench {
  constructor(root, opts) {
    this.root = root;
    this.opts = opts;
    this.components = (opts.components || []).map(c => JSON.parse(JSON.stringify(c)));
    this.inputs = {};
    this.raf = 0;
    this.serialBuf = '';
    root.innerHTML = `
      <div class="wb">
        <div class="wb-left">
          <div class="bar">${opts.toolbar || ''}
            <button class="btn go" data-act="run">▶ Ejecutar</button>
            <button class="btn" data-act="stop" disabled>■ Detener</button>
            <span class="grow"></span>
            <button class="btn ghost" data-act="sound" title="Sonido del zumbador">${LAB.sound ? '🔊' : '🔈'}</button>
            <button class="btn ghost" data-act="copy" title="Copiar el código">📋</button>
            <button class="btn ghost" data-act="ino" title="Descargar .ino para el Arduino real">⬇ .ino</button>
          </div>
          <div class="editor-host"></div>
          <div class="err hidden"></div>
          <div class="serial">
            <div class="serial-head"><b>Monitor serie</b><span class="grow"></span><button class="btn ghost sm" data-act="clear">Limpiar</button></div>
            <pre class="serial-out"></pre>
            <form class="serial-in"><input placeholder="Escribe y pulsa Enviar (Serial.read)"><button class="btn sm">Enviar</button></form>
          </div>
        </div>
        <div class="wb-right">${opts.right || ''}</div>
      </div>`;
    this.editor = makeEditor($('.editor-host', root), opts.code || '', (v) => opts.onCode && opts.onCode(v));
    this.btnRun = $('[data-act=run]', root);
    this.btnStop = $('[data-act=stop]', root);
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b || !root.contains(b)) return;
      const act = b.dataset.act;
      if (act === 'run') this.run();
      else if (act === 'stop') this.stop();
      else if (act === 'clear') { this.serialBuf = ''; $('.serial-out', root).textContent = ''; }
      else if (act === 'sound') { LAB.sound = !LAB.sound; saveLab(); b.textContent = LAB.sound ? '🔊' : '🔈'; if (this.board) this.board.sound = LAB.sound; }
      else if (act === 'copy') { navigator.clipboard.writeText(this.editor.value).then(() => toast('Código copiado'), () => toast('No pude copiar')); }
      else if (act === 'ino') this.download();
    });
    $('.serial-in', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = $('input', e.target);
      if (this.board && this.board.running) { this.board.sendSerial(inp.value); this.print('» ' + inp.value + '\n'); }
      else toast('Primero pulsa ▶ Ejecutar');
      inp.value = '';
    });
  }

  print(txt) {
    this.serialBuf = (this.serialBuf + txt).slice(-6000);
    const out = $('.serial-out', this.root);
    out.textContent = this.serialBuf;
    out.scrollTop = out.scrollHeight;
  }

  showError(msg) {
    const el = $('.err', this.root);
    el.textContent = msg ? '⚠️ ' + msg : '';
    el.classList.toggle('hidden', !msg);
  }

  makeBoard(speed = 1) {
    const board = new ArduinoBoard({
      components: this.components, inputs: this.inputs, speed, sound: LAB.sound && speed === 1,
      extra: this.opts.extra ? this.opts.extra(this) : null,
      onChange: () => this.scheduleDraw(),
      onSerial: (t) => this.print(t),
      onError: (m) => this.showError(m),
      onStop: () => {
        if (this.board !== board) return; // una ejecución anterior que termina tarde
        this.btnRun.disabled = false; this.btnStop.disabled = true; this.scheduleDraw(); this.opts.onStopped && this.opts.onStopped(this);
      }
    });
    return board;
  }

  run(speed = 1) {
    this.stop();
    this.showError('');
    this.print('\n— Ejecutando —\n');
    this.board = this.makeBoard(speed);
    this.btnRun.disabled = true; this.btnStop.disabled = false;
    this.opts.onStart && this.opts.onStart(this);
    return this.board.run(this.editor.value);
  }

  stop() { if (this.board) this.board.stop(); }

  download() {
    const name = (this.opts.fileName ? this.opts.fileName() : 'sketch').replace(/[^\wÁÉÍÓÚÑáéíóúñ-]+/g, '_');
    const blob = new Blob([this.editor.value], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name + '.ino';
    document.body.appendChild(a); a.click(); a.remove();
    toast('Descargado: ábrelo con el Arduino IDE y súbelo a tu placa');
  }

  scheduleDraw() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; this.opts.draw && this.opts.draw(this); });
  }
}

// ---------- Vista de la placa y de los componentes ----------
function boardSvg(board) {
  const pins = board ? board.pins : {};
  const dot = (p, x, y) => {
    const s = pins[p] || { value: 0, pwm: null, mode: 'INPUT' };
    const lvl = s.pwm !== null && s.pwm !== undefined ? s.pwm / 255 : s.value;
    const fill = s.mode === 'OUTPUT' || s.pwm !== null ? `rgba(74,222,128,${0.15 + lvl * 0.85})` : s.mode === 'INPUT_PULLUP' ? '#60a5fa' : '#1e293b';
    return `<g><title>${pinName(p)}: ${s.mode}${s.mode === 'OUTPUT' ? (s.pwm !== null ? ' PWM ' + s.pwm : s.value ? ' HIGH' : ' LOW') : ''}</title><rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2" fill="${fill}" stroke="#0f172a"/><text x="${x}" y="${y > 50 ? y + 16 : y - 9}" font-size="8" text-anchor="middle" fill="#cbd5e1">${PWM_PINS.includes(p) ? '~' : ''}${pinName(p)}</text></g>`;
  };
  const top = []; for (let p = 13; p >= 0; p--) top.push(dot(p, 70 + (13 - p) * 17, 24));
  const bot = []; for (let p = 14; p <= 19; p++) bot.push(dot(p, 196 + (p - 14) * 17, 112));
  const l13 = pins[13] && (pins[13].pwm ? pins[13].pwm / 255 : pins[13].value);
  const running = board && board.running;
  return `<svg viewBox="0 0 330 140" class="uno">
    <rect x="4" y="6" width="322" height="128" rx="10" fill="#0e7490" stroke="#155e75" stroke-width="2"/>
    <rect x="-6" y="40" width="30" height="34" rx="3" fill="#94a3b8"/><rect x="-4" y="88" width="26" height="30" rx="3" fill="#1f2937"/>
    <rect x="120" y="54" width="90" height="34" rx="3" fill="#111827"/><text x="165" y="75" font-size="10" text-anchor="middle" fill="#e2e8f0" font-family="monospace">ATmega328P</text>
    <text x="60" y="70" font-size="13" font-weight="700" fill="#e0f2fe" font-family="sans-serif">UNO</text>
    <circle cx="44" cy="96" r="4" fill="${running ? '#4ade80' : '#14532d'}"/><text x="52" y="99" font-size="8" fill="#e0f2fe">ON</text>
    <circle cx="44" cy="54" r="4" fill="rgba(251,191,36,${0.15 + (l13 || 0) * 0.85})"/><text x="52" y="57" font-size="8" fill="#e0f2fe">L</text>
    ${top.join('')}${bot.join('')}
    <text x="110" y="120" font-size="8" fill="#e0f2fe">5V  GND</text>
  </svg>`;
}

function compControl(c, i, wb) {
  const p = c.pines || {};
  const key = (k) => `data-i="${i}" data-k="${k}"`;
  switch (c.tipo) {
    case 'boton': return `<button class="press" ${key('btn' + p.pin)}>Mantén pulsado</button>`;
    case 'pir': return `<label class="chk"><input type="checkbox" ${key('pir' + p.pin)}> Hay movimiento</label>`;
    case 'pot': return `<input type="range" min="0" max="1023" value="${wb.inputs['an' + p.pin] ?? 512}" ${key('an' + p.pin)}><span class="val" data-val="an${p.pin}">${wb.inputs['an' + p.pin] ?? 512}</span>`;
    case 'ldr': return `<span class="mini">🌑</span><input type="range" min="0" max="1023" value="${wb.inputs['an' + p.pin] ?? 600}" ${key('an' + p.pin)}><span class="mini">☀️</span><span class="val" data-val="an${p.pin}">${wb.inputs['an' + p.pin] ?? 600}</span>`;
    case 'temp': return `<input type="range" min="0" max="60" step="0.5" value="${wb.inputs['an' + p.pin] ?? 24}" ${key('an' + p.pin)}><span class="val" data-val="an${p.pin}">${wb.inputs['an' + p.pin] ?? 24} °C</span>`;
    case 'ultrasonico': return `<input type="range" min="2" max="300" value="${wb.inputs['dist' + p.trig] ?? 100}" ${key('dist' + p.trig)}><span class="val" data-val="dist${p.trig}">${wb.inputs['dist' + p.trig] ?? 100} cm</span>`;
  }
  return '';
}

function compVisual(c, b) {
  const p = c.pines || {};
  const lvl = (pin) => { if (!b) return 0; const s = b.pins[Number(pin)]; if (!s) return 0; return s.pwm !== null ? s.pwm / 255 : s.value; };
  switch (c.tipo) {
    case 'led': { const col = LED_COLORS[c.color] || LED_COLORS.rojo; const v = lvl(p.pin); return `<div class="led" style="--c:${col};--b:${v}"></div>`; }
    case 'rgb': { const r = lvl(p.r), g = lvl(p.g), bb = lvl(p.b); return `<div class="led" style="--c:rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(bb * 255)});--b:${Math.max(r, g, bb)}"></div>`; }
    case 'servo': { const a = b && b.servos[Number(p.pin)] !== undefined ? b.servos[Number(p.pin)] : null; return `<svg viewBox="0 0 80 50" class="vis"><rect x="20" y="22" width="40" height="22" rx="3" fill="#1d4ed8"/><g transform="rotate(${a === null ? 0 : 90 - a} 40 30)"><rect x="37" y="4" width="6" height="28" rx="3" fill="#f8fafc"/></g><circle cx="40" cy="30" r="5" fill="#e2e8f0"/></svg><span class="val">${a === null ? 'sin attach' : Math.round(a) + '°'}</span>`; }
    case 'motor': { const v = lvl(p.pin); return `<svg viewBox="0 0 50 50" class="vis spin" style="--spd:${v > 0.02 ? (1.6 - v * 1.4).toFixed(2) + 's' : '0s'}"><g class="fan"><path d="M25 25 L25 4 A21 21 0 0 1 43 15 Z" fill="#94a3b8"/><path d="M25 25 L43 35 A21 21 0 0 1 25 46 Z" fill="#94a3b8"/><path d="M25 25 L7 35 A21 21 0 0 1 7 15 Z" fill="#94a3b8"/></g><circle cx="25" cy="25" r="4" fill="#475569"/></svg><span class="val">${Math.round(v * 100)} %</span>`; }
    case 'buzzer': { const f = b && b.tones[Number(p.pin)]; return `<div class="buzz ${f ? 'on' : ''}">${f ? '🔊 ' + Math.round(f) + ' Hz' : '🔈 silencio'}</div>`; }
    case 'rele': { const on = lvl(p.pin) > 0.5; return `<div class="bulb ${on ? 'on' : ''}">💡</div><span class="val">${on ? 'ENCENDIDA' : 'apagada'}</span>`; }
    case 'lcd': { const l = b ? b.lcd : { lines: ['', ''], backlight: false }; return `<div class="lcd ${l.backlight ? 'bl' : ''}"><div>${esc((l.lines[0] || '').padEnd(16, ' ')).replace(/ /g, '&nbsp;')}</div><div>${esc((l.lines[1] || '').padEnd(16, ' ')).replace(/ /g, '&nbsp;')}</div></div>`; }
    case 'brazo': {
      const g = (k, d) => (b && b.servos[Number(p[k])] !== undefined ? b.servos[Number(p[k])] : d);
      const base = g('base', 90), codo = g('codo', 90), pinza = g('pinza', 45);
      const a1 = (180 - base) * Math.PI / 180, x1 = 60 + Math.cos(a1) * 34, y1 = 70 - Math.sin(a1) * 34;
      const a2 = a1 + (codo - 90) * Math.PI / 180, x2 = x1 + Math.cos(a2) * 28, y2 = y1 - Math.sin(a2) * 28;
      const open = (pinza / 90) * 0.6, j1 = a2 + open, j2 = a2 - open;
      return `<svg viewBox="0 0 120 80" class="vis wide"><rect x="40" y="70" width="40" height="8" rx="2" fill="#475569"/><line x1="60" y1="70" x2="${x1}" y2="${y1}" stroke="#f59e0b" stroke-width="7" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fbbf24" stroke-width="5" stroke-linecap="round"/><line x1="${x2}" y1="${y2}" x2="${x2 + Math.cos(j1) * 10}" y2="${y2 - Math.sin(j1) * 10}" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/><line x1="${x2}" y1="${y2}" x2="${x2 + Math.cos(j2) * 10}" y2="${y2 - Math.sin(j2) * 10}" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="70" r="4" fill="#e2e8f0"/><circle cx="${x1}" cy="${y1}" r="3" fill="#e2e8f0"/></svg><span class="val">base ${Math.round(base)}° · codo ${Math.round(codo)}° · pinza ${Math.round(pinza)}°</span>`;
    }
    case 'ultrasonico': return `<div class="us">((📏))</div>`;
    case 'boton': { const pressed = b && b.inputs['btn' + p.pin]; return `<div class="btnvis ${pressed ? 'on' : ''}"></div>`; }
    case 'pir': return `<div class="pirvis">👁</div>`;
    default: return `<div class="icon">${(COMPONENT_TYPES[c.tipo] || {}).icon || '🔧'}</div>`;
  }
}

function pinsLabel(c) {
  const p = c.pines || {};
  if (c.tipo === 'lcd') return 'SDA A4 · SCL A5';
  return Object.entries(p).map(([k, v]) => (k === 'pin' ? '' : k + ' ') + pinName(v)).join(' · ');
}

// Panel de componentes (para el circuito libre y los retos)
function renderComponents(wb, host, editable) {
  host.innerHTML = wb.components.map((c, i) => `
    <div class="comp" data-ci="${i}">
      <div class="comp-head"><span>${(COMPONENT_TYPES[c.tipo] || {}).icon || '🔧'} ${esc(c.nombre || (COMPONENT_TYPES[c.tipo] || {}).label)}</span><span class="pins">${esc(pinsLabel(c))}</span>
        ${editable ? `<button class="x" data-del="${i}" title="Quitar">✕</button>` : ''}</div>
      <div class="comp-vis" data-vis="${i}">${compVisual(c, wb.board)}</div>
      <div class="comp-ctl">${compControl(c, i, wb)}</div>
    </div>`).join('') || '<p class="muted">No hay componentes. Añade uno abajo.</p>';
  host.querySelectorAll('input[type=range]').forEach(r => r.addEventListener('input', () => {
    wb.inputs[r.dataset.k] = Number(r.value);
    const v = host.querySelector(`[data-val="${r.dataset.k}"]`);
    if (v) v.textContent = r.value + (r.dataset.k.startsWith('dist') ? ' cm' : wb.components[r.dataset.i].tipo === 'temp' ? ' °C' : '');
  }));
  host.querySelectorAll('input[type=checkbox]').forEach(r => r.addEventListener('change', () => { wb.inputs[r.dataset.k] = r.checked; wb.scheduleDraw(); }));
  host.querySelectorAll('.press').forEach(btn => {
    const set = (v) => { wb.inputs[btn.dataset.k] = v; btn.classList.toggle('on', v); wb.scheduleDraw(); };
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); btn.setPointerCapture(e.pointerId); set(true); });
    btn.addEventListener('pointerup', () => set(false));
    btn.addEventListener('pointercancel', () => set(false));
    btn.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') set(true); });
    btn.addEventListener('keyup', () => set(false));
  });
  host.querySelectorAll('[data-del]').forEach(x => x.addEventListener('click', () => {
    wb.components.splice(Number(x.dataset.del), 1);
    wb.opts.onComponents && wb.opts.onComponents(wb);
  }));
}

function drawComponents(wb, host, boardHost) {
  if (boardHost) boardHost.innerHTML = boardSvg(wb.board);
  wb.components.forEach((c, i) => {
    const v = host.querySelector(`[data-vis="${i}"]`);
    if (v) v.innerHTML = compVisual(c, wb.board);
  });
}

function materialsHtml(comps) {
  return `<details class="card" open><summary>📋 Materiales y conexiones para montarlo de verdad</summary>
    <table class="tbl"><tbody>${materialsFor(comps).map(([k, n]) => `<tr><td>${esc(k)}</td><td class="r">× ${n}</td></tr>`).join('')}</tbody></table>
    <ul class="wiring">${comps.map(c => `<li><b>${esc(c.nombre || (COMPONENT_TYPES[c.tipo] || {}).label)}:</b> ${esc(wiringFor(c))}</li>`).join('')}</ul>
    <p class="muted">Conecta siempre con el Arduino desenchufado. Todos los GND deben estar unidos.</p></details>`;
}

// ---------- Pestaña: circuito libre ----------
const Circuit = {
  wb: null, project: null,
  init() {
    const root = $('#tab-circuito');
    const saved = LAB.comps && Array.isArray(LAB.comps) ? LAB.comps : PRESETS[0].componentes;
    const opts = PRESETS.map(p => `<option value="${p.id}">${esc(p.titulo)} · ${p.nivel}</option>`).join('');
    this.wb = new Workbench(root, {
      toolbar: `<select class="sel" data-preset><option value="">📚 Ejemplos…</option>${opts}</select>`,
      code: LAB.code.circuito || PRESETS[0].codigo,
      components: saved,
      right: `<div class="proj hidden"></div><div class="board"></div><div class="comps"></div>
        <details class="card"><summary>➕ Añadir componente</summary><div class="add"></div></details><div class="mats"></div>`,
      onCode: (v) => { LAB.code.circuito = v; saveLab(); },
      onComponents: () => this.refresh(),
      draw: (wb) => drawComponents(wb, $('.comps', root), $('.board', root)),
      fileName: () => (this.project && this.project.titulo) || 'mi_circuito'
    });
    $('[data-preset]', root).addEventListener('change', (e) => {
      const p = PRESETS.find(x => x.id === e.target.value);
      e.target.value = '';
      if (!p) return;
      this.load(p);
      toast('Cargado: ' + p.titulo + '. Pulsa ▶ Ejecutar');
    });
    this.renderAdd();
    this.refresh();
  },
  load(p, asProject) {
    this.wb.stop();
    this.wb.components = p.componentes.map(c => JSON.parse(JSON.stringify(c)));
    this.wb.inputs = {};
    this.wb.editor.value = p.codigo;
    LAB.code.circuito = p.codigo;
    this.project = asProject ? p : null;
    const box = $('#tab-circuito .proj');
    box.classList.toggle('hidden', !asProject);
    if (asProject) box.innerHTML = `<b>🤖 Proyecto del equipo: ${esc(p.titulo || 'Montaje')}</b>${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ''}`;
    this.refresh();
  },
  refresh() {
    const root = $('#tab-circuito');
    LAB.comps = this.wb.components; saveLab();
    renderComponents(this.wb, $('.comps', root), true);
    drawComponents(this.wb, $('.comps', root), $('.board', root));
    $('.mats', root).innerHTML = materialsHtml(this.wb.components);
  },
  renderAdd() {
    const host = $('#tab-circuito .add');
    const types = Object.entries(COMPONENT_TYPES).map(([k, t]) => `<option value="${k}">${t.icon} ${t.label}</option>`).join('');
    host.innerHTML = `<select class="sel" data-type>${types}</select><div class="pinsel"></div><button class="btn go sm" data-add>Añadir</button>`;
    const pinsel = $('.pinsel', host);
    const draw = () => {
      const t = COMPONENT_TYPES[$('[data-type]', host).value];
      const opt = (analog) => (analog ? [14, 15, 16, 17, 18, 19] : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]).map(p => `<option value="${p}">${PWM_PINS.includes(p) ? '~' : ''}${pinName(p)}</option>`).join('');
      pinsel.innerHTML = t.pins.map(k => `<label>${k === 'pin' ? 'Pin' : k}<select class="sel" data-pin="${k}">${opt(t.analog)}</select></label>`).join('') +
        (t.extra === 'color' ? `<label>Color<select class="sel" data-color>${Object.keys(LED_COLORS).map(c => `<option>${c}</option>`).join('')}</select></label>` : '') +
        (t.pins.length ? '' : '<span class="muted">Usa A4 (SDA) y A5 (SCL)</span>');
    };
    $('[data-type]', host).addEventListener('change', draw);
    draw();
    $('[data-add]', host).addEventListener('click', () => {
      const tipo = $('[data-type]', host).value;
      const t = COMPONENT_TYPES[tipo];
      const pines = {};
      host.querySelectorAll('[data-pin]').forEach(s => { pines[s.dataset.pin] = Number(s.value); });
      const used = new Set(this.wb.components.flatMap(c => Object.values(c.pines || {}).map(Number)));
      const clash = Object.values(pines).find(p => used.has(p));
      if (clash !== undefined) toast(`Ojo: el pin ${pinName(clash)} ya lo usa otro componente`);
      const c = { tipo, nombre: t.label + (tipo === 'led' ? ' ' + $('[data-color]', host).value : ''), pines };
      if (tipo === 'led') c.color = $('[data-color]', host).value;
      this.wb.components.push(c);
      this.refresh();
    });
  }
};

// ---------- Pestaña: robot ----------
const ROBOT_SCALE = 2; // píxeles por centímetro
const Robot = {
  wb: null, arena: 'obstaculos', state: null, lineData: null, last: 0, anim: 0, crashes: 0,
  init() {
    const root = $('#tab-robot');
    const opts = ROBOT_PRESETS.map(p => `<option value="${p.id}">${esc(p.titulo)}</option>`).join('');
    this.wb = new Workbench(root, {
      toolbar: `<select class="sel" data-rpreset><option value="">🤖 Ejemplos…</option>${opts}</select>`,
      code: LAB.code.robot || ROBOT_PRESETS[0].codigo,
      components: [],
      right: `<div class="bar"><select class="sel" data-arena><option value="obstaculos">Pista con obstáculos</option><option value="linea">Pista con línea negra</option><option value="libre">Pista libre</option></select>
          <button class="btn sm" data-reset>↺ Volver a la salida</button><span class="grow"></span><span class="muted" data-rstat></span></div>
        <canvas width="640" height="420" class="arena"></canvas>
        <details class="card"><summary>🔧 Conexiones del robot real (carro 2WD + L298N)</summary>
          <table class="tbl"><tbody>${ROBOT_WIRING.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table>
          <p class="muted">Materiales: chasis 2WD con 2 motores TT, driver L298N, HC-SR04, 2 sensores TCRT5000, Arduino Uno, portapilas 2×18650.</p></details>`,
      onCode: (v) => { LAB.code.robot = v; saveLab(); },
      extra: () => ({
        digitalRead: (p) => {
          if (p === ROBOT_PINS.IR_IZQ) return this.sensorOnLine(-1) ? 1 : 0;
          if (p === ROBOT_PINS.IR_DER) return this.sensorOnLine(1) ? 1 : 0;
          return undefined;
        },
        pulseIn: (p) => (p === ROBOT_PINS.ECHO ? Math.round(this.sonar() * 58) : undefined)
      }),
      onStart: () => { this.reset(false); this.loop(); },
      onStopped: () => { cancelAnimationFrame(this.anim); this.anim = 0; this.draw(); },
      draw: () => {},
      fileName: () => 'robot'
    });
    $('[data-rpreset]', root).addEventListener('change', (e) => {
      const p = ROBOT_PRESETS.find(x => x.id === e.target.value); e.target.value = '';
      if (!p) return;
      this.wb.stop(); this.wb.editor.value = p.codigo; LAB.code.robot = p.codigo; saveLab();
      this.setArena(p.arena);
      toast('Cargado: ' + p.titulo + '. Pulsa ▶ Ejecutar');
    });
    $('[data-arena]', root).addEventListener('change', (e) => this.setArena(e.target.value));
    $('[data-reset]', root).addEventListener('click', () => { this.reset(true); });
    this.setArena('obstaculos');
  },
  setArena(a) {
    this.arena = a;
    $('#tab-robot [data-arena]').value = a;
    this.buildLine();
    this.reset(true);
  },
  obstacles() {
    const W = 320, H = 210;
    const walls = [[0, 0, W, 3], [0, H - 3, W, 3], [0, 0, 3, H], [W - 3, 0, 3, H]];
    if (this.arena === 'obstaculos') return walls.concat([[90, 40, 25, 60], [170, 120, 60, 22], [240, 30, 22, 55], [60, 150, 40, 25]]);
    return walls;
  },
  linePath(ctx) {
    const s = ROBOT_SCALE;
    ctx.beginPath();
    ctx.moveTo(60 * s, 105 * s);
    ctx.bezierCurveTo(60 * s, 30 * s, 140 * s, 20 * s, 170 * s, 55 * s);
    ctx.bezierCurveTo(200 * s, 90 * s, 230 * s, 25 * s, 265 * s, 50 * s);
    ctx.bezierCurveTo(300 * s, 80 * s, 290 * s, 175 * s, 220 * s, 175 * s);
    ctx.bezierCurveTo(150 * s, 175 * s, 140 * s, 140 * s, 100 * s, 170 * s);
    ctx.bezierCurveTo(70 * s, 190 * s, 60 * s, 150 * s, 60 * s, 105 * s);
    ctx.closePath();
  },
  buildLine() {
    this.lineData = null;
    if (this.arena !== 'linea') return;
    const c = document.createElement('canvas'); c.width = 640; c.height = 420;
    const ctx = c.getContext('2d');
    ctx.lineWidth = 2.6 * ROBOT_SCALE; ctx.strokeStyle = '#000';
    this.linePath(ctx); ctx.stroke();
    this.lineData = ctx.getImageData(0, 0, 640, 420).data;
  },
  reset(redraw) {
    this.state = this.arena === 'linea' ? { x: 60, y: 110, h: -Math.PI / 2 } : { x: 30, y: 105, h: 0 };
    this.crashes = 0; this.touching = false;
    if (redraw) this.draw();
  },
  hit(x, y, r = 0) {
    return this.obstacles().some(([ox, oy, w, h]) => x + r > ox && x - r < ox + w && y + r > oy && y - r < oy + h);
  },
  // El HC-SR04 real "ve" en un cono de unos 30°: se toma lo más cercano dentro del cono
  sonarRay(a) {
    const { x, y } = this.state;
    for (let d = 2; d <= 400; d += 1) {
      const px = x + Math.cos(a) * (9 + d), py = y + Math.sin(a) * (9 + d);
      if (this.hit(px, py)) return d;
    }
    return 400;
  },
  sonar() {
    const h = this.state.h;
    return Math.min(...[-15, -7.5, 0, 7.5, 15].map(g => this.sonarRay(h + g * Math.PI / 180)));
  },
  sensorPos(side) {
    const { x, y, h } = this.state;
    return { x: x + Math.cos(h) * 9 - Math.sin(h) * 3.5 * side, y: y + Math.sin(h) * 9 + Math.cos(h) * 3.5 * side };
  },
  sensorOnLine(side) {
    if (!this.lineData) return false;
    const p = this.sensorPos(side);
    const px = Math.round(p.x * ROBOT_SCALE), py = Math.round(p.y * ROBOT_SCALE);
    if (px < 0 || py < 0 || px >= 640 || py >= 420) return false;
    return this.lineData[(py * 640 + px) * 4 + 3] > 100;
  },
  motor(en, a, b) {
    const bd = this.wb.board; if (!bd) return 0;
    const pin = bd.pins[en];
    const pwm = pin.pwm !== null ? pin.pwm : pin.value * 255;
    const dir = bd.pins[a].value && !bd.pins[b].value ? 1 : !bd.pins[a].value && bd.pins[b].value ? -1 : 0;
    return dir * pwm / 255;
  },
  loop() {
    cancelAnimationFrame(this.anim);
    this.last = performance.now();
    const step = (t) => {
      const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t;
      const L = this.motor(ROBOT_PINS.ENA, ROBOT_PINS.IN1, ROBOT_PINS.IN2), R = this.motor(ROBOT_PINS.ENB, ROBOT_PINS.IN3, ROBOT_PINS.IN4);
      const vMax = 40; // cm/s a máxima potencia
      const v = (L + R) / 2 * vMax, w = (R - L) * vMax / 13;
      const s = this.state;
      const nh = s.h - w * dt; // y crece hacia abajo
      const nx = s.x + Math.cos(nh) * v * dt, ny = s.y + Math.sin(nh) * v * dt;
      if (this.hit(nx, ny, 9)) {
        if (Math.abs(v) > 1 && !this.touching) { this.crashes++; this.bump = performance.now(); }
        this.touching = true; s.h = nh;
      } else { this.touching = false; s.x = nx; s.y = ny; s.h = nh; }
      this.draw();
      if (this.wb.board && this.wb.board.running) this.anim = requestAnimationFrame(step);
    };
    this.anim = requestAnimationFrame(step);
  },
  draw() {
    const cv = $('#tab-robot canvas'); if (!cv) return;
    const ctx = cv.getContext('2d'), S = ROBOT_SCALE;
    ctx.fillStyle = '#e7e5e4'; ctx.fillRect(0, 0, 640, 420);
    ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 420); ctx.stroke(); }
    for (let y = 0; y < 420; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke(); }
    if (this.arena === 'linea') { ctx.lineWidth = 2.6 * S; ctx.strokeStyle = '#111'; this.linePath(ctx); ctx.stroke(); }
    ctx.fillStyle = '#78350f';
    this.obstacles().forEach(([x, y, w, h]) => ctx.fillRect(x * S, y * S, w * S, h * S));
    const s = this.state; if (!s) return;
    const d = this.sonar();
    // cono del sensor de distancia
    const fx = (s.x + Math.cos(s.h) * 9) * S, fy = (s.y + Math.sin(s.h) * 9) * S, cone = 15 * Math.PI / 180;
    ctx.fillStyle = 'rgba(14,165,233,.13)';
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.arc(fx, fy, d * S, s.h - cone, s.h + cone); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(s.x * S, s.y * S); ctx.rotate(s.h);
    const bumped = this.bump && performance.now() - this.bump < 300;
    ctx.fillStyle = '#111827'; ctx.fillRect(-7 * S, -9 * S, 6 * S, 2.5 * S); ctx.fillRect(-7 * S, 6.5 * S, 6 * S, 2.5 * S);
    ctx.fillStyle = bumped ? '#dc2626' : '#f59e0b'; ctx.beginPath(); ctx.roundRect(-9 * S, -6.5 * S, 18 * S, 13 * S, 3 * S); ctx.fill();
    ctx.fillStyle = '#0ea5e9'; ctx.fillRect(7 * S, -3 * S, 2.5 * S, 6 * S);
    ctx.restore();
    if (this.arena === 'linea') [-1, 1].forEach(side => { const p = this.sensorPos(side); ctx.fillStyle = this.sensorOnLine(side) ? '#22c55e' : '#ef4444'; ctx.beginPath(); ctx.arc(p.x * S, p.y * S, 3, 0, 7); ctx.fill(); });
    const st = $('#tab-robot [data-rstat]');
    if (st) st.textContent = `Distancia al frente: ${d} cm${this.crashes ? ' · choques: ' + this.crashes : ''}`;
  }
};

// ---------- Pestaña: retos ----------
const Retos = {
  wb: null, cur: null,
  init() {
    const root = $('#tab-retos');
    root.innerHTML = `<div class="split"><aside class="list"></aside><section class="reto"></section></div>`;
    this.renderList();
    this.open(ARDUINO_CHALLENGES.find(c => !LAB.done.retos[c.id]) || ARDUINO_CHALLENGES[0]);
  },
  renderList() {
    $('#tab-retos .list').innerHTML = `<h3>🎯 Retos de Arduino <span class="muted">${Object.keys(LAB.done.retos).length}/${ARDUINO_CHALLENGES.length}</span></h3>` +
      ARDUINO_CHALLENGES.map(c => `<button class="item ${this.cur && this.cur.id === c.id ? 'on' : ''}" data-r="${c.id}">${LAB.done.retos[c.id] ? '✅' : '⬜'} ${esc(c.titulo)}<small>${c.nivel}</small></button>`).join('');
    $('#tab-retos .list').querySelectorAll('[data-r]').forEach(b => b.addEventListener('click', () => this.open(ARDUINO_CHALLENGES.find(c => c.id === b.dataset.r))));
  },
  open(ch) {
    if (this.wb) this.wb.stop();
    this.cur = ch;
    this.renderList();
    const host = $('#tab-retos .reto');
    host.innerHTML = `<div class="card"><h3>${esc(ch.titulo)}</h3><p>${esc(ch.enunciado)}</p>
      <div class="bar"><button class="btn go" data-check>✔ Comprobar mi solución</button><button class="btn ghost" data-hint>💡 Pista</button><button class="btn ghost" data-restart>↺ Empezar de nuevo</button></div>
      <div class="result hidden"></div><p class="hint hidden">💡 ${esc(ch.pista)}</p></div><div class="wbhost"></div>`;
    const key = 'reto_' + ch.id;
    this.wb = new Workbench($('.wbhost', host), {
      code: LAB.code[key] || ch.codigo, components: ch.componentes,
      right: `<div class="board"></div><div class="comps"></div>`,
      onCode: (v) => { LAB.code[key] = v; saveLab(); },
      draw: (wb) => drawComponents(wb, $('.comps', host), $('.board', host)),
      fileName: () => ch.id
    });
    renderComponents(this.wb, $('.comps', host), false);
    drawComponents(this.wb, $('.comps', host), $('.board', host));
    $('[data-hint]', host).addEventListener('click', () => $('.hint', host).classList.toggle('hidden'));
    $('[data-restart]', host).addEventListener('click', () => { this.wb.stop(); this.wb.editor.value = ch.codigo; LAB.code[key] = ch.codigo; saveLab(); });
    $('[data-check]', host).addEventListener('click', () => this.check());
  },
  async check() {
    const ch = this.cur, wb = this.wb, host = $('#tab-retos .reto');
    const res = $('.result', host);
    res.className = 'result'; res.textContent = '⏳ Probando tu código…';
    $('[data-check]', host).disabled = true;
    wb.inputs = {};
    renderComponents(wb, $('.comps', host), false);
    const SPEED = 4;
    let error = '';
    const runP = wb.run(SPEED);
    const b = wb.board;
    b.onError = (m) => { error = m; wb.showError(m); };
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const t = {
      wait: (ms) => sleep(ms / SPEED),
      changes: (pin) => { const h = b.history[pin] || []; const out = []; let prev = null; h.forEach(e => { const v = e.v > 0.5 ? 1 : 0; if (v !== prev) { out.push({ t: e.t, v }); prev = v; } }); return out.slice(1); },
      high: (pin) => { const s = b.pins[pin]; return s.pwm !== null ? s.pwm > 127 : s.value === 1; },
      pwm: (pin) => { const s = b.pins[pin]; return s.pwm !== null ? s.pwm : s.value * 255; },
      servo: (pin) => (b.servos[pin] === undefined ? null : b.servos[pin]),
      press: (pin, v) => { wb.inputs['btn' + pin] = v; },
      analog: (pin, v) => { wb.inputs['an' + pin] = v; },
      distance: (trig, cm) => { wb.inputs['dist' + trig] = cm; },
      tone: (pin) => !!b.tones[pin],
      pass: (msg) => ({ ok: true, msg }), fail: (msg) => ({ ok: false, msg })
    };
    let r;
    try {
      await sleep(60);
      if (!error && !b.running) error = $('.err', host).textContent.replace(/^⚠️\s*/, '');
      if (error || !b.running) r = t.fail(error || 'El programa se detuvo antes de tiempo.');
      else r = await Promise.race([ch.check(t), sleep(20000).then(() => t.fail('La comprobación tardó demasiado.'))]);
      if (error && r.ok) r = t.fail(error);
    } catch (e) { r = t.fail(String(e.message || e)); }
    wb.stop();
    await runP;
    $('[data-check]', host).disabled = false;
    res.className = 'result ' + (r.ok ? 'ok' : 'bad');
    res.textContent = (r.ok ? '✅ ' : '❌ ') + r.msg;
    if (r.ok) { LAB.done.retos[ch.id] = true; saveLab(); this.renderList(); }
  }
};

// ---------- Pestaña: electrónica ----------
const Elec = {
  init() {
    const root = $('#tab-electronica');
    const BANDS = ['negro', 'marrón', 'rojo', 'naranja', 'amarillo', 'verde', 'azul', 'violeta', 'gris', 'blanco'];
    const BC = ['#111', '#7c2d12', '#dc2626', '#f97316', '#facc15', '#16a34a', '#2563eb', '#7c3aed', '#9ca3af', '#f8fafc'];
    const bandSel = (id, list, def) => `<select class="sel" id="${id}">${list.map((n, i) => `<option value="${i}" ${i === def ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
    root.innerHTML = `<div class="grid">
      <div class="card"><h3>⚡ Ley de Ohm</h3><p class="muted">Rellena dos valores y te calculo el tercero. V = I × R</p>
        <label>Voltaje (V)<input id="o-v" type="number" step="any"></label><label>Corriente (mA)<input id="o-i" type="number" step="any"></label><label>Resistencia (Ω)<input id="o-r" type="number" step="any"></label>
        <div class="out" id="o-out">—</div></div>
      <div class="card"><h3>💡 Resistencia para un LED</h3>
        <label>Fuente (V)<input id="l-vs" type="number" value="5" step="any"></label>
        <label>Color del LED<select class="sel" id="l-col">${Object.keys(LED_VF).map(c => `<option>${c}</option>`).join('')}</select></label>
        <label>Corriente (mA)<input id="l-i" type="number" value="15" step="any"></label><div class="out" id="l-out">—</div></div>
      <div class="card"><h3>🔀 Divisor de voltaje</h3><p class="muted">Vout = Vin × R2 / (R1 + R2)</p>
        <label>Vin (V)<input id="d-vin" type="number" value="5" step="any"></label><label>R1 (Ω)<input id="d-r1" type="number" value="10000"></label><label>R2 (Ω)<input id="d-r2" type="number" value="10000"></label>
        <div class="out" id="d-out">—</div></div>
      <div class="card"><h3>🎨 Código de colores de resistencias</h3>
        <svg viewBox="0 0 200 50" class="res"><line x1="0" y1="25" x2="200" y2="25" stroke="#94a3b8" stroke-width="4"/><rect x="45" y="8" width="110" height="34" rx="14" fill="#e7c9a0"/>
          <rect id="b1" x="62" y="8" width="9" height="34"/><rect id="b2" x="80" y="8" width="9" height="34"/><rect id="b3" x="98" y="8" width="9" height="34"/><rect id="b4" x="132" y="8" width="9" height="34" fill="#d4af37"/></svg>
        <div class="row">${bandSel('c1', BANDS, 1)}${bandSel('c2', BANDS, 0)}${bandSel('c3', BANDS.slice(0, 7), 2)}<select class="sel" id="c4"><option value="5">dorado ±5 %</option><option value="10">plateado ±10 %</option><option value="1">marrón ±1 %</option></select></div>
        <div class="out" id="c-out">—</div></div>
      <div class="card"><h3>🔋 Autonomía de una batería</h3>
        <label>Capacidad (mAh)<input id="b-cap" type="number" value="2000"></label><label>Consumo del circuito (mA)<input id="b-con" type="number" value="120"></label>
        <div class="out" id="b-out">—</div></div>
      <div class="card"><h3>⏱️ Constante de tiempo RC</h3><p class="muted">τ = R × C · el condensador se carga al 99 % en 5τ</p>
        <label>R (Ω)<input id="rc-r" type="number" value="10000"></label><label>C (µF)<input id="rc-c" type="number" value="100" step="any"></label>
        <div class="out" id="rc-out">—</div></div>
      <div class="card wide"><h3>📌 Pines del Arduino Uno</h3><ul class="wiring">
        <li><b>Digitales 0-13:</b> HIGH (5V) o LOW (0V). Máx. 20 mA por pin. Los pines 0 y 1 los usa el monitor serie.</li>
        <li><b>PWM (~3, 5, 6, 9, 10, 11):</b> analogWrite(pin, 0-255) simula un voltaje intermedio: brillo de LEDs y velocidad de motores.</li>
        <li><b>Analógicos A0-A5:</b> analogRead() da 0-1023 para 0-5V. A4 y A5 son también SDA y SCL (I2C).</li>
        <li><b>Motores y servos:</b> nunca los alimentes desde un pin; usa driver o transistor y fuente aparte, con GND común.</li></ul></div>
    </div>`;
    const n = (id) => { const v = parseFloat($('#' + id).value); return Number.isFinite(v) ? v : null; };
    const fmtR = (r) => r >= 1e6 ? (r / 1e6).toFixed(r % 1e6 ? 1 : 0) + ' MΩ' : r >= 1000 ? (r / 1000).toFixed(r % 1000 ? 1 : 0) + ' kΩ' : Math.round(r * 10) / 10 + ' Ω';
    const upd = () => {
      const v = n('o-v'), i = n('o-i'), r = n('o-r');
      $('#o-out').textContent = v !== null && i !== null && r === null && i ? `R = ${fmtR(v / (i / 1000))}` : v !== null && r !== null && i === null && r ? `I = ${(v / r * 1000).toFixed(2)} mA` : i !== null && r !== null && v === null ? `V = ${(i / 1000 * r).toFixed(2)} V` : 'Deja vacío el valor que quieres calcular.';
      const vs = n('l-vs'), li = n('l-i'), vf = LED_VF[$('#l-col').value];
      if (vs !== null && li) {
        const R = (vs - vf) / (li / 1000);
        const e12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];
        let std = null; for (let d = 1; d <= 1e6 && !std; d *= 10) std = e12.map(x => x * d).find(x => x >= R) || null;
        $('#l-out').innerHTML = R <= 0 ? 'La fuente es demasiado baja para este LED.' : `Mínimo ${fmtR(R)} → usa <b>${fmtR(std)}</b> (valor comercial). Potencia: ${((vs - vf) * li / 1000 * 1000).toFixed(0)} mW (sirve una de ¼ W).`;
      }
      const vin = n('d-vin'), r1 = n('d-r1'), r2 = n('d-r2');
      if (vin !== null && r1 && r2) $('#d-out').textContent = `Vout = ${(vin * r2 / (r1 + r2)).toFixed(2)} V → analogRead ≈ ${Math.round(vin * r2 / (r1 + r2) / 5 * 1023)}`;
      const c1 = +$('#c1').value, c2 = +$('#c2').value, c3 = +$('#c3').value;
      ['b1', 'b2', 'b3'].forEach((b, k) => $('#' + b).setAttribute('fill', BC[[c1, c2, c3][k]]));
      $('#b4').setAttribute('fill', { 5: '#d4af37', 10: '#c0c0c0', 1: '#7c2d12' }[$('#c4').value]);
      $('#c-out').textContent = `${fmtR((c1 * 10 + c2) * Math.pow(10, c3))} ±${$('#c4').value} %`;
      const cap = n('b-cap'), con = n('b-con');
      if (cap && con) { const h = cap / con * 0.7; $('#b-out').textContent = `≈ ${h >= 1 ? h.toFixed(1) + ' horas' : Math.round(h * 60) + ' minutos'} (con un 70 % de rendimiento real)`; }
      const rr = n('rc-r'), cc = n('rc-c');
      if (rr && cc) { const tau = rr * cc / 1e6; $('#rc-out').textContent = `τ = ${tau >= 1 ? tau.toFixed(2) + ' s' : (tau * 1000).toFixed(1) + ' ms'} · carga completa ≈ ${(5 * tau).toFixed(2)} s`; }
    };
    root.querySelectorAll('input, select').forEach(x => x.addEventListener('input', upd));
    upd();
  }
};

// ---------- Pestaña: algoritmos ----------
const Algo = {
  cur: null, editor: null, tries: {},
  init() {
    const root = $('#tab-algoritmos');
    root.innerHTML = `<div class="split"><aside class="list"></aside><section class="algo"></section></div>`;
    this.renderList();
    this.open(ALGO_CHALLENGES.find(c => !LAB.done.algos[c.id]) || ALGO_CHALLENGES[0]);
  },
  renderList() {
    const done = Object.keys(LAB.done.algos).length;
    $('#tab-algoritmos .list').innerHTML = `<h3>🧠 Algoritmos <span class="muted">${done}/${ALGO_CHALLENGES.length}</span></h3>
      <div class="progress"><i style="width:${done / ALGO_CHALLENGES.length * 100}%"></i></div>` +
      ALGO_CHALLENGES.map(c => `<button class="item ${this.cur && this.cur.id === c.id ? 'on' : ''}" data-a="${c.id}">${LAB.done.algos[c.id] ? '✅' : '⬜'} ${esc(c.titulo)}<small class="lv-${c.nivel}">${c.nivel}</small></button>`).join('') +
      `<button class="item" data-a="__libre">🧪 Consola libre</button>`;
    $('#tab-algoritmos .list').querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => this.open(b.dataset.a === '__libre' ? null : ALGO_CHALLENGES.find(c => c.id === b.dataset.a))));
  },
  open(ch) {
    this.cur = ch;
    this.renderList();
    const host = $('#tab-algoritmos .algo');
    const key = ch ? 'algo_' + ch.id : 'algo_libre';
    host.innerHTML = ch
      ? `<div class="card"><h3>${esc(ch.titulo)} <small class="lv-${ch.nivel}">${ch.nivel}</small></h3><p>${esc(ch.enunciado)}</p>
          <p class="muted">Ejemplo: ${esc(ch.fn)}(${ch.pruebas[0][0].map(x => JSON.stringify(x)).join(', ')}) → ${esc(JSON.stringify(ch.pruebas[0][1]))}</p></div>
        <div class="edhost"></div>
        <div class="bar"><button class="btn go" data-run>▶ Probar mi código</button><button class="btn ghost" data-sol>👀 Ver solución</button><button class="btn ghost" data-restart>↺ Empezar de nuevo</button></div>
        <div class="tests"></div><pre class="console hidden"></pre><pre class="solution hidden"></pre>`
      : `<div class="card"><h3>🧪 Consola libre</h3><p>Escribe cualquier JavaScript y usa console.log() para ver resultados.</p></div>
        <div class="edhost"></div><div class="bar"><button class="btn go" data-run>▶ Ejecutar</button></div><pre class="console"></pre>`;
    this.editor = makeEditor($('.edhost', host), LAB.code[key] || (ch ? ch.codigo : 'console.log("¡Hola, FRPROGRAMITY!");\n\nfor (let i = 1; i <= 5; i++) {\n  console.log("Vuelta", i);\n}'), (v) => { LAB.code[key] = v; saveLab(); });
    $('[data-run]', host).addEventListener('click', () => this.run());
    if (ch) {
      $('[data-sol]', host).addEventListener('click', () => {
        if (!this.tries[ch.id] && !LAB.done.algos[ch.id]) { toast('Inténtalo al menos una vez antes de ver la solución 💪'); return; }
        const s = $('.solution', host); s.textContent = ch.solucion; s.classList.toggle('hidden');
      });
      $('[data-restart]', host).addEventListener('click', () => { this.editor.value = ch.codigo; LAB.code[key] = ch.codigo; saveLab(); });
    }
  },
  run() {
    const ch = this.cur, host = $('#tab-algoritmos .algo');
    const code = this.editor.value;
    const cons = $('.console', host);
    if (ch && ch.prohibido && ch.prohibido.test(code)) {
      $('.tests', host).innerHTML = `<div class="result bad">❌ En este ejercicio no se puede usar <code>${esc(String(ch.prohibido).replace(/\\s\*|\\|\//g, '').replace(/\(/g, '('))}</code>: la idea es que lo programes tú.</div>`;
      return;
    }
    const worker = `
      const logs = [];
      const fmt = (x) => typeof x === 'string' ? x : JSON.stringify(x);
      console.log = (...a) => logs.push(a.map(fmt).join(' '));
      const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      onmessage = (e) => {
        const { code, fn, tests } = e.data;
        let results = [], error = null;
        try {
          const f = new Function(code + (fn ? '\\n;return typeof ' + fn + ' === "function" ? ' + fn + ' : null;' : ''))();
          if (fn && !f) throw new Error('No encuentro la función ' + fn + '(): ¿le cambiaste el nombre?');
          if (fn) results = tests.map(([args, exp]) => { try { const got = f(...JSON.parse(JSON.stringify(args))); return { args, exp, got: got === undefined ? '(nada: falta return)' : got, ok: eq(got, exp) }; } catch (er) { return { args, exp, got: 'Error: ' + er.message, ok: false }; } });
        } catch (er) { error = er.message; }
        postMessage({ results, error, logs });
      };`;
    const w = new Worker(URL.createObjectURL(new Blob([worker], { type: 'text/javascript' })));
    const timer = setTimeout(() => { w.terminate(); show({ results: [], error: 'Tardó más de 3 segundos: ¿hay un bucle infinito?', logs: [] }); }, 3000);
    const show = ({ results, error, logs }) => {
      clearTimeout(timer);
      if (logs && logs.length) { cons.textContent = logs.join('\n'); cons.classList.remove('hidden'); } else if (ch) cons.classList.add('hidden'); else cons.textContent = '(sin salida: usa console.log)';
      if (!ch) { if (error) cons.textContent = '⚠️ ' + error; return; }
      this.tries[ch.id] = true;
      const okAll = !error && results.length && results.every(r => r.ok);
      $('.tests', host).innerHTML = (error ? `<div class="result bad">⚠️ ${esc(error)}</div>` : '') +
        results.map(r => `<div class="test ${r.ok ? 'ok' : 'bad'}">${r.ok ? '✅' : '❌'} ${esc(ch.fn)}(${r.args.map(x => esc(JSON.stringify(x))).join(', ')}) → esperaba <b>${esc(JSON.stringify(r.exp))}</b>, salió <b>${esc(typeof r.got === 'string' && r.got.startsWith('Error') ? r.got : JSON.stringify(r.got))}</b></div>`).join('') +
        (okAll ? `<div class="result ok">🎉 ¡Todas las pruebas pasan! Ejercicio completado.</div>` : '');
      if (okAll && !LAB.done.algos[ch.id]) { LAB.done.algos[ch.id] = true; saveLab(); this.renderList(); }
    };
    w.onmessage = (e) => { w.terminate(); show(e.data); };
    w.onerror = (e) => { w.terminate(); show({ results: [], error: e.message, logs: [] }); };
    w.postMessage({ code, fn: ch ? ch.fn : null, tests: ch ? ch.pruebas : [] });
  }
};

// ---------- Arranque ----------
const TABS = { circuito: Circuit, robot: Robot, retos: Retos, electronica: Elec, algoritmos: Algo };
const inited = {};
function showTab(name) {
  if (!TABS[name]) name = 'circuito';
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === name));
  document.querySelectorAll('.pane').forEach(p => p.classList.toggle('hidden', p.id !== 'tab-' + name));
  if (!inited[name]) { inited[name] = true; TABS[name].init(); }
  if (name === 'robot') Robot.draw();
}

function readHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  const proj = h.get('p');
  if (proj) {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(proj))));
      showTab('circuito');
      Circuit.load({ titulo: String(data.titulo || 'Montaje'), descripcion: String(data.descripcion || ''), componentes: (Array.isArray(data.componentes) ? data.componentes : []).filter(c => c && COMPONENT_TYPES[c.tipo]).slice(0, 16), codigo: String(data.codigo || '') }, true);
      return;
    } catch (e) { toast('No pude abrir el proyecto'); }
  }
  showTab(h.get('tab') || 'circuito');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));
  const close = $('#close');
  if (window.parent !== window) close.addEventListener('click', () => window.parent.postMessage({ type: 'frp-lab-close' }, '*'));
  else close.remove();
  readHash();
  window.addEventListener('hashchange', readHash);
});
