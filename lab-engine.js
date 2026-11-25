// _____________________________________________________________________
// LABORATORIO · MOTOR ARDUINO
// 1) Traduce código Arduino (C++) a JavaScript que el navegador puede ejecutar.
// 2) Simula la placa Arduino Uno: pines digitales y analógicos, PWM, tiempo,
//    monitor serie, Servo, LCD I2C, tone(), pulseIn() y los sensores conectados.
// El tiempo es real (1 s simulado = 1 s); en las comprobaciones va más rápido.
// _____________________________________________________________________

const C_TYPES = '(?:unsigned\\s+long|unsigned\\s+int|unsigned\\s+char|unsigned|long\\s+long|long|int|short|float|double|byte|bool|boolean|char|String|word|size_t|u?int(?:8|16|32|64)_t)';
const STOP = Symbol('stop');

class ArduinoCompileError extends Error {}

// ---------- Traductor Arduino → JavaScript ----------
function transpileArduino(src) {
  // 1) Separar textos y comentarios para no tocarlos
  const strs = [];
  let code = '';
  for (let i = 0; i < src.length;) {
    const c = src[i], n = src[i + 1];
    if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== c && src[j] !== '\n') { if (src[j] === '\\') j++; j++; }
      if (src[j] !== c) throw new ArduinoCompileError(`Falta cerrar las comillas ${c} (línea ${src.slice(0, i).split('\n').length}).`);
      strs.push(src.slice(i, j + 1));
      code += '\u0001' + (strs.length - 1) + '\u0002';
      i = j + 1; continue;
    }
    code += c; i++;
  }

  // 2) Preprocesador
  code = code.replace(/^[ \t]*#\s*include[^\n]*$/gm, '');
  code = code.replace(/^[ \t]*#\s*define[ \t]+([A-Za-z_]\w*)[ \t]+([^\n]+)$/gm, 'const $1 = $2;');
  code = code.replace(/^[ \t]*#[^\n]*$/gm, '');
  code = code.replace(/\b(PROGMEM|volatile|static|register|inline|extern)\b\s*/g, '');
  code = code.replace(/\bF\s*\(/g, '__F(');
  code = code.replace(/\bNULL\b/g, 'null');
  code = code.replace(/\bsizeof\s*\(\s*(\w+)\s*\)\s*\/\s*sizeof\s*\(\s*\1\s*\[\s*0\s*\]\s*\)/g, '$1.length');
  code = code.replace(/\.length\s*\(\s*\)/g, '.length');

  // 3) Conversiones de tipo: (int)x → Math.trunc(x); (float)x → x
  code = code.replace(/\(\s*(?:unsigned\s+)?(?:int|long|byte|short|word|char|u?int(?:8|16|32)_t)\s*\)\s*(\([^()]*\)|[A-Za-z_][\w.]*(?:\[[^\]]*\])?(?:\([^()]*\))?|\d+(?:\.\d+)?)/g, 'Math.trunc($1)');
  code = code.replace(/\(\s*(?:float|double)\s*\)\s*/g, '');

  // 4) Funciones: tipo nombre(params) { → async function nombre(params) {
  const userFns = new Set();
  const intFns = new Set();
  const fnRe = new RegExp('\\b(void|' + C_TYPES + ')\\s*[*&]?\\s+([A-Za-z_]\\w*)\\s*\\(([^)]*)\\)\\s*\\{', 'g');
  code = code.replace(fnRe, (m, type, name, params) => {
    userFns.add(name);
    if (!/void|float|double|String|bool|char/.test(type)) intFns.add(name);
    const ps = params.trim() === '' || params.trim() === 'void' ? [] : params.split(',').map(p => {
      const def = p.split('=');
      const nm = (def[0].trim().match(/([A-Za-z_]\w*)\s*(\[\s*\])?$/) || [])[1];
      if (!nm) throw new ArduinoCompileError(`No entiendo el parámetro "${p.trim()}" de ${name}().`);
      return nm + (def[1] ? ' = ' + def[1].trim() : '');
    });
    return `async function ${name}(${ps.join(', ')}) {`;
  });
  // prototipos sueltos (void f(int a);) → fuera
  code = code.replace(new RegExp('\\b(?:void|' + C_TYPES + ')\\s*[*&]?\\s+[A-Za-z_]\\w*\\s*\\([^)]*\\)\\s*;', 'g'), '');

  // 5) Objetos de librerías: Servo s1, s2;  LiquidCrystal_I2C lcd(0x27,16,2);
  code = code.replace(/\b(Servo|LiquidCrystal_I2C|LiquidCrystal)\s+([^;=]+);/g, (m, cls, list) => {
    return list.split(/,(?![^(]*\))/).map(d => {
      const mm = d.trim().match(/^([A-Za-z_]\w*)\s*(?:\(([^)]*)\))?$/);
      if (!mm) return m;
      return `let ${mm[1]} = new ${cls}(${mm[2] || ''});`;
    }).join(' ');
  });

  // 6) Arreglos: int pines[] = {2,3}; → let pines = [2,3];   int v[5]; → let v = __arr(5);
  const arrRe = new RegExp('\\b(?:const\\s+)?' + C_TYPES + '\\s+([A-Za-z_]\\w*)\\s*\\[([^\\]]*)\\](?:\\s*\\[([^\\]]*)\\])?\\s*(=)?', 'g');
  let out = '', last = 0, m;
  while ((m = arrRe.exec(code))) {
    out += code.slice(last, m.index);
    if (m[4]) {
      out += `let ${m[1]} =`;
      let k = arrRe.lastIndex;
      while (/\s/.test(code[k])) k++;
      if (code[k] === '{') {
        let depth = 0, j = k, buf = '';
        for (; j < code.length; j++) {
          const ch = code[j];
          if (ch === '{') { depth++; buf += '['; }
          else if (ch === '}') { depth--; buf += ']'; if (depth === 0) { j++; break; } }
          else buf += ch;
        }
        out += ' ' + buf;
        last = j; arrRe.lastIndex = j; continue;
      }
      last = arrRe.lastIndex; continue;
    }
    out += `let ${m[1]} = __arr(${m[2] || 0}${m[3] ? ', ' + m[3] : ''})`;
    last = arrRe.lastIndex;
  }
  code = out + code.slice(last);

  // 7) Variables: int x = 1, y; → let x = 1, y;   (recuerda las enteras para la división)
  const intVars = new Set();
  const varRe = new RegExp('\\b(?:const\\s+)?(' + C_TYPES + ')\\s*[*&]?\\s+(?=[A-Za-z_]\\w*\\s*(?:=|;|,|\\)|:))', 'g');
  code = code.replace(varRe, (mm, type, offset) => {
    if (!/float|double|String|bool|char/.test(type)) {
      const rest = code.slice(offset + mm.length).match(/^([A-Za-z_]\w*)/);
      if (rest) intVars.add(rest[1]);
    }
    return /^const/.test(mm) ? 'const ' : 'let ';
  });
  // División entera como en C cuando el resultado va a una variable entera
  intVars.forEach(v => {
    const re = new RegExp('(\\b' + v + '\\s*(?<![=!<>])=(?!=)\\s*)([^;]*\\/[^;]*);', 'g');
    code = code.replace(re, (mm, lhs, rhs) => (/Math\.trunc/.test(rhs) ? mm : `${lhs}Math.trunc(${rhs});`));
  });

  // Las funciones que devuelven enteros también dividen como en C
  intFns.forEach(name => {
    const head = code.indexOf(`async function ${name}(`);
    if (head < 0) return;
    let j = code.indexOf('{', head), depth = 0, end = j;
    for (; end < code.length; end++) { if (code[end] === '{') depth++; else if (code[end] === '}') { depth--; if (depth === 0) break; } }
    const body = code.slice(j, end).replace(/\breturn\s+([^;]*\/[^;]*);/g, (mm, e) => /Math\.trunc/.test(e) ? mm : `return Math.trunc(${e});`);
    code = code.slice(0, j) + body + code.slice(end);
  });

  // 8) await delante de las funciones que esperan (delay, pulseIn…) y de las del usuario
  const asyncNames = ['delay', 'delayMicroseconds', 'pulseIn', ...userFns];
  asyncNames.forEach(n => {
    code = code.replace(new RegExp('(?<!function\\s+)(?<![\\w.$])(' + n + ')\\s*\\(', 'g'), 'await $1(');
  });

  // 9) Ceder el control en cada vuelta de while/for/do para no congelar la página
  code = addLoopTicks(code);

  // 10) Devolver los textos
  code = code.replace(/\u0001(\d+)\u0002/g, (mm, i) => strs[Number(i)]);
  return { js: code, functions: [...userFns] };
}

function addLoopTicks(code) {
  let res = '', i = 0;
  const re = /\b(while|for)\s*\(|\bdo\s*\{/g;
  let m;
  while ((m = re.exec(code))) {
    if (m[0].startsWith('do')) {
      res += code.slice(i, m.index + m[0].length) + ' await __tick();';
      i = re.lastIndex; continue;
    }
    // salta el paréntesis del while/for
    let j = re.lastIndex, depth = 1;
    while (j < code.length && depth > 0) { if (code[j] === '(') depth++; else if (code[j] === ')') depth--; j++; }
    let k = j;
    while (/\s/.test(code[k] || '')) k++;
    if (code[k] === '{') {
      res += code.slice(i, k + 1) + ' await __tick();';
      i = k + 1; re.lastIndex = k + 1;
    } else if (code[k] === ';') { // do { } while(...);
      res += code.slice(i, j); i = j; re.lastIndex = j;
    } else {
      // una sola instrucción: se envuelve en llaves
      let e = k, d = 0;
      for (; e < code.length; e++) { const ch = code[e]; if ('([{'.includes(ch)) d++; else if (')]}'.includes(ch)) d--; else if (ch === ';' && d === 0) break; }
      res += code.slice(i, k) + '{ await __tick(); ' + code.slice(k, e + 1) + ' }';
      i = e + 1; re.lastIndex = e + 1;
    }
  }
  return res + code.slice(i);
}

// ---------- La placa simulada ----------
class ArduinoBoard {
  constructor(opts = {}) {
    this.components = opts.components || [];
    this.onChange = opts.onChange || (() => {});
    this.onSerial = opts.onSerial || (() => {});
    this.onError = opts.onError || (() => {});
    this.onStop = opts.onStop || (() => {});
    this.inputs = opts.inputs || {};       // estado de botones, potenciómetros, distancias…
    this.extra = opts.extra || null;        // hooks del robot
    this.speed = opts.speed || 1;
    this.sound = !!opts.sound;
    this.reset();
  }

  reset() {
    this.pins = {};
    for (let p = 0; p <= 19; p++) this.pins[p] = { mode: 'INPUT', value: 0, pwm: null };
    this.history = {};
    this.servos = {};
    this.tones = {};
    this.lcd = { lines: ['', ''], cursor: [0, 0], backlight: false, on: false };
    this.serialIn = [];
    this.running = false;
    this.stopped = false;
    this.ticks = 0;
    this.t0 = performance.now();
    this.trigAt = {};
  }

  now() { return (performance.now() - this.t0) * this.speed; }

  log(pin, value) {
    (this.history[pin] = this.history[pin] || []).push({ t: this.now(), v: value });
    if (this.history[pin].length > 400) this.history[pin].shift();
  }

  norm(pin) {
    const p = Number(pin);
    if (!Number.isFinite(p) || p < 0 || p > 19) throw new Error(`El pin ${pin} no existe en Arduino Uno (pines 0-13 y A0-A5).`);
    return p;
  }

  compFor(pin, key = 'pin') {
    return this.components.find(c => c.pines && Number(c.pines[key]) === pin);
  }

  digitalReadPin(p) {
    if (this.extra && this.extra.digitalRead) { const r = this.extra.digitalRead(p); if (r !== undefined) return r; }
    const pin = this.pins[p];
    const btn = this.components.find(c => c.tipo === 'boton' && Number(c.pines.pin) === p);
    if (btn) {
      const pressed = !!this.inputs['btn' + p];
      return pin.mode === 'INPUT_PULLUP' ? (pressed ? 0 : 1) : (pressed ? 1 : 0);
    }
    const pir = this.components.find(c => c.tipo === 'pir' && Number(c.pines.pin) === p);
    if (pir) return this.inputs['pir' + p] ? 1 : 0;
    if (pin.mode === 'OUTPUT') return pin.value;
    if (pin.mode === 'INPUT_PULLUP') return 1;
    return 0;
  }

  analogReadPin(p) {
    if (p < 14) p += 14;
    const c = this.components.find(x => ['pot', 'ldr', 'temp'].includes(x.tipo) && Number(x.pines.pin) === p);
    if (!c) return Math.floor(Math.random() * 8); // pin al aire: ruido
    const v = this.inputs['an' + p];
    if (c.tipo === 'temp') {
      const grados = v === undefined ? 24 : Number(v);
      return Math.max(0, Math.min(1023, Math.round(grados * 1023 / 500)));
    }
    return Math.max(0, Math.min(1023, Math.round(v === undefined ? 512 : Number(v))));
  }

  pulseInPin(p) {
    if (this.extra && this.extra.pulseIn) { const r = this.extra.pulseIn(p); if (r !== undefined) return r; }
    const us = this.components.find(c => c.tipo === 'ultrasonico' && Number(c.pines.echo) === p);
    if (!us) return 0;
    const cm = this.inputs['dist' + Number(us.pines.trig)];
    const d = cm === undefined ? 100 : Number(cm);
    if (d > 400 || d < 2) return 0;
    return Math.round(d * 58 + (Math.random() - 0.5) * 20);
  }

  // API que verá el código del usuario
  api() {
    const b = this;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const checkStop = () => { if (b.stopped) throw STOP; };
    const changed = () => b.onChange();
    class Servo {
      constructor() { this.pin = null; this.angle = 90; }
      attach(pin) { this.pin = b.norm(pin); b.servos[this.pin] = this.angle; changed(); return 1; }
      write(a) { this.angle = Math.max(0, Math.min(180, Number(a) || 0)); if (this.pin !== null) b.servos[this.pin] = this.angle; changed(); }
      writeMicroseconds(us) { this.write((Number(us) - 544) * 180 / (2400 - 544)); }
      read() { return Math.round(this.angle); }
      attached() { return this.pin !== null; }
      detach() { if (this.pin !== null) delete b.servos[this.pin]; this.pin = null; changed(); }
    }
    class LCD {
      constructor(a, cols = 16, rows = 2) { this.cols = typeof a === 'number' && a > 40 ? cols : 16; }
      init() { b.lcd.on = true; changed(); }
      begin() { b.lcd.on = true; changed(); }
      backlight() { b.lcd.backlight = true; changed(); }
      noBacklight() { b.lcd.backlight = false; changed(); }
      clear() { b.lcd.lines = ['', '']; b.lcd.cursor = [0, 0]; changed(); }
      home() { b.lcd.cursor = [0, 0]; }
      setCursor(c, r) { b.lcd.cursor = [Math.max(0, Math.min(15, c)), Math.max(0, Math.min(1, r))]; }
      print(x, d) {
        const txt = fmt(x, d);
        let [c, r] = b.lcd.cursor;
        let line = b.lcd.lines[r].padEnd(16, ' ');
        for (const ch of txt) { if (c < 16) line = line.slice(0, c) + ch + line.slice(c + 1); c++; }
        b.lcd.lines[r] = line.slice(0, 16);
        b.lcd.cursor = [Math.min(c, 16), r];
        b.lcd.on = true;
        changed();
      }
      write(x) { this.print(typeof x === 'number' ? String.fromCharCode(x) : x); }
      display() {} noDisplay() {} cursor() {} noCursor() {} blink() {} noBlink() {}
    }
    function fmt(x, d) {
      if (typeof x === 'number') {
        if (d === 16) return Math.trunc(x).toString(16).toUpperCase();
        if (d === 2) return Math.trunc(x).toString(2);
        if (d === 8) return Math.trunc(x).toString(8);
        if (d === 10 || Number.isInteger(x)) return String(Number.isInteger(x) ? x : Math.trunc(x));
        return x.toFixed(d === undefined ? 2 : d);
      }
      if (typeof x === 'boolean') return x ? '1' : '0';
      return String(x);
    }
    const Serial = {
      begin() {}, end() {}, flush() {},
      print(x, d) { b.onSerial(fmt(x, d)); },
      println(x, d) { b.onSerial((x === undefined ? '' : fmt(x, d)) + '\n'); },
      write(x) { b.onSerial(typeof x === 'number' ? String.fromCharCode(x) : String(x)); },
      available() { return b.serialIn.length; },
      read() { return b.serialIn.length ? b.serialIn.shift() : -1; },
      peek() { return b.serialIn.length ? b.serialIn[0] : -1; },
      readString() { const s = b.serialIn.join(''); b.serialIn = []; return s; },
      readStringUntil(c) { const i = b.serialIn.indexOf(c); const part = i < 0 ? b.serialIn.splice(0) : b.serialIn.splice(0, i + 1); if (i >= 0) part.pop(); return part.join(''); },
      parseInt() { const s = this.readString(); return parseInt(s, 10) || 0; },
      parseFloat() { const s = this.readString(); return parseFloat(s) || 0; },
      setTimeout() {}
    };
    let audio = null;
    function beep(pin, freq) {
      if (!b.sound) return;
      try {
        if (!audio) { const C = window.AudioContext || window.webkitAudioContext; audio = { ctx: new C(), osc: {} }; }
        const o = audio.osc[pin];
        if (o) { o.frequency.value = freq; return; }
        const osc = audio.ctx.createOscillator(), g = audio.ctx.createGain();
        osc.type = 'square'; osc.frequency.value = freq; g.gain.value = 0.04;
        osc.connect(g); g.connect(audio.ctx.destination); osc.start();
        audio.osc[pin] = osc;
      } catch (e) { /* sin audio */ }
    }
    function quiet(pin) { if (audio && audio.osc[pin]) { try { audio.osc[pin].stop(); } catch (e) {} delete audio.osc[pin]; } }
    b._quietAll = () => { if (audio) Object.keys(audio.osc).forEach(quiet); };

    const api = {
      HIGH: 1, LOW: 0, INPUT: 'INPUT', OUTPUT: 'OUTPUT', INPUT_PULLUP: 'INPUT_PULLUP', LED_BUILTIN: 13,
      A0: 14, A1: 15, A2: 16, A3: 17, A4: 18, A5: 19, DEC: 10, HEX: 16, BIN: 2, OCT: 8,
      PI: Math.PI, HALF_PI: Math.PI / 2, TWO_PI: Math.PI * 2, DEG_TO_RAD: Math.PI / 180, RAD_TO_DEG: 180 / Math.PI,
      true: true, false: false,
      Serial, Servo, LiquidCrystal_I2C: LCD, LiquidCrystal: LCD,
      __F: (s) => s,
      __arr: (n, m) => m === undefined ? new Array(Number(n) || 0).fill(0) : Array.from({ length: Number(n) || 0 }, () => new Array(Number(m) || 0).fill(0)),
      __tick: async () => { checkStop(); if (++b.ticks % 300 === 0) await sleep(0); },
      pinMode(pin, mode) { const p = b.norm(pin); b.pins[p].mode = mode; changed(); },
      digitalWrite(pin, v) {
        checkStop();
        const p = b.norm(pin); const val = v ? 1 : 0;
        const pin_ = b.pins[p];
        if (pin_.mode === 'INPUT' && val) pin_.mode = 'INPUT_PULLUP'; // como en un Arduino real
        if (pin_.value !== val || pin_.pwm !== null) { pin_.value = val; pin_.pwm = null; b.log(p, val); changed(); }
        if (val === 0 && b.components.some(c => c.tipo === 'ultrasonico' && Number(c.pines.trig) === p)) b.trigAt[p] = b.now();
      },
      digitalRead(pin) { checkStop(); return b.digitalReadPin(b.norm(pin)); },
      analogRead(pin) { checkStop(); return b.analogReadPin(b.norm(pin)); },
      analogWrite(pin, v) {
        checkStop();
        const p = b.norm(pin);
        const val = Math.max(0, Math.min(255, Math.round(Number(v) || 0)));
        const pin_ = b.pins[p];
        if (pin_.pwm !== val) { pin_.pwm = val; pin_.value = val > 0 ? 1 : 0; b.log(p, val / 255); changed(); }
      },
      async delay(ms) {
        checkStop();
        let left = Math.max(0, Number(ms) || 0) / b.speed;
        while (left > 0) { const step = Math.min(left, 50); await sleep(step); left -= step; checkStop(); }
      },
      async delayMicroseconds(us) { checkStop(); if (++b.ticks % 50 === 0) await sleep(0); },
      async pulseIn(pin) { checkStop(); await sleep(1); return b.pulseInPin(b.norm(pin)); },
      millis: () => Math.floor(b.now()),
      micros: () => Math.floor(b.now() * 1000),
      tone(pin, f) { const p = b.norm(pin); b.tones[p] = Number(f) || 0; beep(p, Number(f) || 440); changed(); },
      noTone(pin) { const p = b.norm(pin); delete b.tones[p]; quiet(p); changed(); },
      map: (x, a, c, d, e) => Math.trunc((x - a) * (e - d) / (c - a) + d),
      constrain: (x, a, c) => Math.min(Math.max(x, a), c),
      random: (a, c) => c === undefined ? Math.floor(Math.random() * a) : Math.floor(a + Math.random() * (c - a)),
      randomSeed() {},
      abs: Math.abs, min: Math.min, max: Math.max, pow: Math.pow, sqrt: Math.sqrt, sq: (x) => x * x,
      sin: Math.sin, cos: Math.cos, tan: Math.tan, atan2: Math.atan2, floor: Math.floor, ceil: Math.ceil, round: Math.round,
      isnan: Number.isNaN, isDigit: (c) => /^[0-9]$/.test(c), isAlpha: (c) => /^[A-Za-z]$/.test(c),
      bitRead: (x, n) => (x >> n) & 1, bitSet: (x, n) => x | (1 << n), bitClear: (x, n) => x & ~(1 << n),
      lowByte: (x) => x & 0xff, highByte: (x) => (x >> 8) & 0xff,
      attachInterrupt() {}, detachInterrupt() {}, digitalPinToInterrupt: (p) => p, interrupts() {}, noInterrupts() {}
    };
    return api;
  }

  async run(source) {
    this.stop(true);
    this.reset();
    let compiled;
    try { compiled = transpileArduino(String(source || '')); } catch (e) { this.onError(e.message); this.onStop(); return false; }
    const api = this.api();
    const names = Object.keys(api).filter(k => k !== 'true' && k !== 'false');
    let factory;
    try {
      // String de Arduino: algunos métodos útiles
      if (!String.prototype.toInt) {
        Object.defineProperty(String.prototype, 'toInt', { value: function () { return parseInt(this, 10) || 0; } });
        Object.defineProperty(String.prototype, 'toFloat', { value: function () { return parseFloat(this) || 0; } });
        Object.defineProperty(String.prototype, 'equals', { value: function (o) { return String(this) === String(o); } });
      }
      const body = `"use strict";\nreturn (async () => {\n${compiled.js}\n;return { setup: typeof setup === 'function' ? setup : null, loop: typeof loop === 'function' ? loop : null };\n})();`;
      factory = new Function(...names, body);
    } catch (e) {
      this.onError('Error de sintaxis: ' + explainSyntax(e.message) + ' Revisa llaves { }, paréntesis y puntos y coma.');
      this.onStop();
      return false;
    }
    this.running = true;
    this.t0 = performance.now();
    this.onChange();
    try {
      const prog = await factory(...names.map(n => api[n]));
      if (!prog.setup || !prog.loop) throw new Error('Falta la función ' + (!prog.setup ? 'setup()' : 'loop()') + '.');
      await prog.setup();
      let n = 0;
      while (!this.stopped) {
        await prog.loop();
        if (++n % 20 === 0) await new Promise(r => setTimeout(r, 0));
      }
    } catch (e) {
      if (e !== STOP) this.onError(explainRuntime(e));
    } finally {
      this.running = false;
      if (this._quietAll) this._quietAll();
      this.onStop();
    }
    return true;
  }

  stop(silent) {
    this.stopped = true;
    if (this._quietAll) this._quietAll();
    if (!silent) this.onChange();
  }

  sendSerial(text) {
    for (const ch of String(text)) this.serialIn.push(ch);
  }
}

function explainSyntax(msg) {
  return String(msg).replace('Unexpected token', 'símbolo inesperado').replace('Unexpected end of input', 'el código termina antes de tiempo (¿falta una llave } ?)').replace('missing ) after argument list', 'falta un paréntesis )').replace('Unexpected identifier', 'nombre inesperado');
}
function explainRuntime(e) {
  const m = String((e && e.message) || e);
  const nd = m.match(/(\w+) is not defined/);
  if (nd) return `No existe "${nd[1]}": ¿lo declaraste o está bien escrito? (Arduino distingue mayúsculas).`;
  const nf = m.match(/(\S+) is not a function/);
  if (nf) return `"${nf[1]}" no es una función que conozca el simulador.`;
  return m;
}

if (typeof module !== 'undefined') module.exports = { transpileArduino, ArduinoBoard };
