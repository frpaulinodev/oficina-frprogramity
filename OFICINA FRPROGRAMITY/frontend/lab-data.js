// _____________________________________________________________________
// LABORATORIO · DATOS: ejemplos de Arduino, retos con comprobación automática,
// robot y ejercicios de algoritmos. Todo el código Arduino de aquí es REAL:
// funciona igual en una placa Arduino Uno con las conexiones que indica cada montaje.
// _____________________________________________________________________

// Tipos de componentes que se pueden montar
const COMPONENT_TYPES = {
  led: { label: 'LED', icon: '💡', pins: ['pin'], extra: 'color' },
  rgb: { label: 'LED RGB', icon: '🌈', pins: ['r', 'g', 'b'] },
  boton: { label: 'Botón', icon: '🔘', pins: ['pin'] },
  pot: { label: 'Potenciómetro', icon: '🎛️', pins: ['pin'], analog: true },
  ldr: { label: 'Sensor de luz (LDR)', icon: '☀️', pins: ['pin'], analog: true },
  temp: { label: 'Sensor de temperatura LM35', icon: '🌡️', pins: ['pin'], analog: true },
  ultrasonico: { label: 'Sensor de distancia HC-SR04', icon: '📏', pins: ['trig', 'echo'] },
  pir: { label: 'Sensor de movimiento PIR', icon: '🚶', pins: ['pin'] },
  servo: { label: 'Servomotor', icon: '🦾', pins: ['pin'] },
  motor: { label: 'Motor DC (con driver)', icon: '⚙️', pins: ['pin'] },
  buzzer: { label: 'Zumbador (buzzer)', icon: '🔊', pins: ['pin'] },
  rele: { label: 'Módulo relé + lámpara', icon: '🔌', pins: ['pin'] },
  lcd: { label: 'Pantalla LCD 16x2 I2C', icon: '📟', pins: [] },
  brazo: { label: 'Brazo robótico (3 servos)', icon: '🤖', pins: ['base', 'codo', 'pinza'] }
};

const LED_COLORS = { rojo: '#ef4444', verde: '#22c55e', amarillo: '#facc15', azul: '#3b82f6', blanco: '#f8fafc' };
const LED_VF = { rojo: 2.0, verde: 2.1, amarillo: 2.1, azul: 3.0, blanco: 3.1 };

// ---------- Ejemplos listos (circuito + código) ----------
const PRESETS = [
  {
    id: 'blink', titulo: 'Parpadeo (Blink)', nivel: 'Básico',
    descripcion: 'El "Hola mundo" de Arduino: un LED se enciende y se apaga cada segundo.',
    componentes: [{ tipo: 'led', nombre: 'LED rojo', pines: { pin: 13 }, color: 'rojo' }],
    codigo: `// Parpadeo: enciende y apaga un LED cada segundo
const int LED = 13;

void setup() {
  pinMode(LED, OUTPUT);
}

void loop() {
  digitalWrite(LED, HIGH);  // enciende
  delay(1000);              // espera 1 segundo
  digitalWrite(LED, LOW);   // apaga
  delay(1000);
}`
  },
  {
    id: 'semaforo', titulo: 'Semáforo', nivel: 'Básico',
    descripcion: 'Tres LEDs que imitan un semáforo: verde, amarillo y rojo.',
    componentes: [
      { tipo: 'led', nombre: 'LED rojo', pines: { pin: 10 }, color: 'rojo' },
      { tipo: 'led', nombre: 'LED amarillo', pines: { pin: 11 }, color: 'amarillo' },
      { tipo: 'led', nombre: 'LED verde', pines: { pin: 12 }, color: 'verde' }
    ],
    codigo: `// Semáforo con 3 LEDs
const int ROJO = 10;
const int AMARILLO = 11;
const int VERDE = 12;

void setup() {
  pinMode(ROJO, OUTPUT);
  pinMode(AMARILLO, OUTPUT);
  pinMode(VERDE, OUTPUT);
}

void encender(int pin, int tiempo) {
  digitalWrite(pin, HIGH);
  delay(tiempo);
  digitalWrite(pin, LOW);
}

void loop() {
  encender(VERDE, 3000);
  // amarillo parpadeando 3 veces
  for (int i = 0; i < 3; i++) {
    encender(AMARILLO, 300);
    delay(300);
  }
  encender(ROJO, 3000);
}`
  },
  {
    id: 'boton', titulo: 'Botón que enciende un LED', nivel: 'Básico',
    descripcion: 'Mientras mantienes el botón, el LED se enciende. Usa la resistencia interna (INPUT_PULLUP).',
    componentes: [
      { tipo: 'boton', nombre: 'Botón', pines: { pin: 2 } },
      { tipo: 'led', nombre: 'LED verde', pines: { pin: 13 }, color: 'verde' }
    ],
    codigo: `// Botón con resistencia interna: pulsado = LOW
const int BOTON = 2;
const int LED = 13;

void setup() {
  pinMode(BOTON, INPUT_PULLUP);
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (digitalRead(BOTON) == LOW) {
    digitalWrite(LED, HIGH);
  } else {
    digitalWrite(LED, LOW);
  }
}`
  },
  {
    id: 'pot_led', titulo: 'Regular el brillo con un potenciómetro', nivel: 'Básico',
    descripcion: 'Lee el potenciómetro (0-1023) y lo convierte en brillo del LED (0-255) con PWM.',
    componentes: [
      { tipo: 'pot', nombre: 'Potenciómetro', pines: { pin: 14 } },
      { tipo: 'led', nombre: 'LED azul', pines: { pin: 9 }, color: 'azul' }
    ],
    codigo: `// Brillo del LED controlado por un potenciómetro
const int POT = A0;
const int LED = 9;   // pin con PWM (~)

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int lectura = analogRead(POT);              // 0 a 1023
  int brillo = map(lectura, 0, 1023, 0, 255); // 0 a 255
  analogWrite(LED, brillo);
  Serial.print("Potenciómetro: ");
  Serial.print(lectura);
  Serial.print("  Brillo: ");
  Serial.println(brillo);
  delay(200);
}`
  },
  {
    id: 'servo_pot', titulo: 'Servo controlado con potenciómetro', nivel: 'Intermedio',
    descripcion: 'Gira el potenciómetro y el servomotor se mueve de 0° a 180°.',
    componentes: [
      { tipo: 'pot', nombre: 'Potenciómetro', pines: { pin: 14 } },
      { tipo: 'servo', nombre: 'Servo', pines: { pin: 9 } }
    ],
    codigo: `#include <Servo.h>

Servo miServo;
const int POT = A0;

void setup() {
  miServo.attach(9);
}

void loop() {
  int lectura = analogRead(POT);
  int angulo = map(lectura, 0, 1023, 0, 180);
  miServo.write(angulo);
  delay(15);
}`
  },
  {
    id: 'distancia', titulo: 'Alarma de distancia (sensor de parqueo)', nivel: 'Intermedio',
    descripcion: 'El HC-SR04 mide la distancia; si algo se acerca a menos de 20 cm suena el zumbador.',
    componentes: [
      { tipo: 'ultrasonico', nombre: 'HC-SR04', pines: { trig: 7, echo: 6 } },
      { tipo: 'buzzer', nombre: 'Zumbador', pines: { pin: 8 } },
      { tipo: 'led', nombre: 'LED rojo', pines: { pin: 13 }, color: 'rojo' }
    ],
    codigo: `// Sensor de parqueo con HC-SR04
const int TRIG = 7;
const int ECHO = 6;
const int BUZZER = 8;
const int LED = 13;

void setup() {
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

long medirDistancia() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long duracion = pulseIn(ECHO, HIGH);
  return duracion / 58;   // microsegundos a centímetros
}

void loop() {
  long cm = medirDistancia();
  Serial.print("Distancia: ");
  Serial.print(cm);
  Serial.println(" cm");
  if (cm < 20) {
    tone(BUZZER, 1000);
    digitalWrite(LED, HIGH);
  } else {
    noTone(BUZZER);
    digitalWrite(LED, LOW);
  }
  delay(200);
}`
  },
  {
    id: 'termometro', titulo: 'Termómetro con pantalla LCD', nivel: 'Intermedio',
    descripcion: 'Lee el LM35 y muestra la temperatura en una pantalla LCD 16x2 con I2C.',
    componentes: [
      { tipo: 'temp', nombre: 'LM35', pines: { pin: 15 } },
      { tipo: 'lcd', nombre: 'LCD 16x2', pines: {} }
    ],
    codigo: `#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
const int SENSOR = A1;

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.print("Termometro");
}

void loop() {
  int lectura = analogRead(SENSOR);
  float voltios = lectura * 5.0 / 1023.0;
  float grados = voltios * 100.0;   // LM35: 10 mV por grado
  lcd.setCursor(0, 1);
  lcd.print("Temp: ");
  lcd.print(grados, 1);
  lcd.print(" C   ");
  delay(500);
}`
  },
  {
    id: 'luz_auto', titulo: 'Luz automática con relé', nivel: 'Intermedio',
    descripcion: 'Cuando oscurece, el relé enciende una lámpara. Así funcionan las luces de calle.',
    componentes: [
      { tipo: 'ldr', nombre: 'LDR', pines: { pin: 14 } },
      { tipo: 'rele', nombre: 'Relé + lámpara', pines: { pin: 7 } }
    ],
    codigo: `// Luz automática: LDR + relé
const int LDR = A0;
const int RELE = 7;
const int UMBRAL = 300;   // por debajo = está oscuro

void setup() {
  pinMode(RELE, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int luz = analogRead(LDR);
  Serial.print("Luz: ");
  Serial.println(luz);
  if (luz < UMBRAL) {
    digitalWrite(RELE, HIGH);   // enciende la lámpara
  } else {
    digitalWrite(RELE, LOW);
  }
  delay(300);
}`
  },
  {
    id: 'alarma_pir', titulo: 'Alarma con sensor de movimiento', nivel: 'Intermedio',
    descripcion: 'Si el PIR detecta movimiento, suena una sirena y avisa por el monitor serie.',
    componentes: [
      { tipo: 'pir', nombre: 'Sensor PIR', pines: { pin: 2 } },
      { tipo: 'buzzer', nombre: 'Zumbador', pines: { pin: 8 } },
      { tipo: 'led', nombre: 'LED rojo', pines: { pin: 13 }, color: 'rojo' }
    ],
    codigo: `// Alarma con sensor PIR
const int PIR = 2;
const int BUZZER = 8;
const int LED = 13;

void setup() {
  pinMode(PIR, INPUT);
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (digitalRead(PIR) == HIGH) {
    Serial.println("¡Movimiento detectado!");
    for (int f = 600; f < 1200; f += 100) {
      tone(BUZZER, f);
      digitalWrite(LED, HIGH);
      delay(60);
      digitalWrite(LED, LOW);
      delay(40);
    }
  } else {
    noTone(BUZZER);
  }
  delay(100);
}`
  },
  {
    id: 'brazo', titulo: 'Brazo robótico con 3 potenciómetros', nivel: 'Avanzado',
    descripcion: 'Cada potenciómetro mueve una articulación del brazo: base, codo y pinza.',
    componentes: [
      { tipo: 'pot', nombre: 'Pot. base', pines: { pin: 14 } },
      { tipo: 'pot', nombre: 'Pot. codo', pines: { pin: 15 } },
      { tipo: 'pot', nombre: 'Pot. pinza', pines: { pin: 16 } },
      { tipo: 'brazo', nombre: 'Brazo robótico', pines: { base: 9, codo: 10, pinza: 11 } }
    ],
    codigo: `#include <Servo.h>

Servo base, codo, pinza;

void setup() {
  base.attach(9);
  codo.attach(10);
  pinza.attach(11);
}

void loop() {
  base.write(map(analogRead(A0), 0, 1023, 0, 180));
  codo.write(map(analogRead(A1), 0, 1023, 20, 160));
  pinza.write(map(analogRead(A2), 0, 1023, 10, 90));
  delay(20);
}`
  },
  {
    id: 'ventilador', titulo: 'Ventilador inteligente', nivel: 'Avanzado',
    descripcion: 'El motor gira más rápido cuanto más calor hace (LM35 + PWM).',
    componentes: [
      { tipo: 'temp', nombre: 'LM35', pines: { pin: 15 } },
      { tipo: 'motor', nombre: 'Ventilador', pines: { pin: 5 } }
    ],
    codigo: `// Ventilador que acelera con la temperatura
const int SENSOR = A1;
const int MOTOR = 5;   // PWM hacia el driver o transistor

void setup() {
  pinMode(MOTOR, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  float grados = analogRead(SENSOR) * 500.0 / 1023.0;
  int velocidad = 0;
  if (grados > 25) {
    velocidad = constrain(map(grados, 25, 40, 80, 255), 0, 255);
  }
  analogWrite(MOTOR, velocidad);
  Serial.print(grados);
  Serial.print(" C -> velocidad ");
  Serial.println(velocidad);
  delay(500);
}`
  },
  {
    id: 'rgb_serial', titulo: 'LED RGB controlado por el monitor serie', nivel: 'Intermedio',
    descripcion: 'Escribe r, g, b o a en el monitor serie para cambiar el color.',
    componentes: [{ tipo: 'rgb', nombre: 'LED RGB', pines: { r: 9, g: 10, b: 11 } }],
    codigo: `// Escribe r, g, b o a (apagar) en el monitor serie
const int R = 9, G = 10, B = 11;

void color(int r, int g, int b) {
  analogWrite(R, r);
  analogWrite(G, g);
  analogWrite(B, b);
}

void setup() {
  Serial.begin(9600);
  Serial.println("Escribe r, g, b o a");
}

void loop() {
  if (Serial.available() > 0) {
    char c = Serial.read();
    if (c == 'r') color(255, 0, 0);
    if (c == 'g') color(0, 255, 0);
    if (c == 'b') color(0, 0, 255);
    if (c == 'a') color(0, 0, 0);
    Serial.print("Recibido: ");
    Serial.println(c);
  }
}`
  }
];

// ---------- Robot (carro 2WD con driver L298N) ----------
// Conexiones fijas, iguales que en un robot real:
const ROBOT_PINS = { ENA: 5, IN1: 7, IN2: 8, ENB: 6, IN3: 9, IN4: 10, TRIG: 11, ECHO: 12, IR_IZQ: 2, IR_DER: 3 };
const ROBOT_WIRING = [
  ['L298N ENA (velocidad motor izquierdo)', 'Pin 5 (PWM)'],
  ['L298N IN1 / IN2 (sentido motor izquierdo)', 'Pines 7 y 8'],
  ['L298N ENB (velocidad motor derecho)', 'Pin 6 (PWM)'],
  ['L298N IN3 / IN4 (sentido motor derecho)', 'Pines 9 y 10'],
  ['HC-SR04 Trig / Echo (frente)', 'Pines 11 y 12'],
  ['Sensor de línea TCRT5000 izquierdo / derecho', 'Pines 2 y 3 (HIGH = línea negra)'],
  ['L298N 12V / GND', 'Batería 7.4 V (2× 18650) — GND común con el Arduino'],
  ['Arduino VIN', 'Salida 5V del L298N o la batería']
];
const ROBOT_PRESETS = [
  {
    id: 'evita', titulo: 'Robot que esquiva obstáculos', arena: 'obstaculos',
    codigo: `// Robot que esquiva obstáculos (L298N + HC-SR04)
const int ENA = 5, IN1 = 7, IN2 = 8;    // motor izquierdo
const int ENB = 6, IN3 = 9, IN4 = 10;   // motor derecho
const int TRIG = 11, ECHO = 12;

void motores(int izq, int der) {
  digitalWrite(IN1, izq >= 0 ? HIGH : LOW);
  digitalWrite(IN2, izq >= 0 ? LOW : HIGH);
  digitalWrite(IN3, der >= 0 ? HIGH : LOW);
  digitalWrite(IN4, der >= 0 ? LOW : HIGH);
  analogWrite(ENA, abs(izq));
  analogWrite(ENB, abs(der));
}

long distancia() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  return pulseIn(ECHO, HIGH) / 58;
}

void setup() {
  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(TRIG, OUTPUT); pinMode(ECHO, INPUT);
  Serial.begin(9600);
}

void loop() {
  long cm = distancia();
  if (cm > 30) {
    motores(180, 180);        // adelante
  } else {
    motores(-150, -150);      // retrocede un poco
    delay(300);
    motores(160, -160);       // gira a la derecha
    delay(400);
  }
  delay(30);
}`
  },
  {
    id: 'linea', titulo: 'Robot seguidor de línea', arena: 'linea',
    codigo: `// Seguidor de línea con 2 sensores TCRT5000 (HIGH = ve la línea negra)
const int ENA = 5, IN1 = 7, IN2 = 8;
const int ENB = 6, IN3 = 9, IN4 = 10;
const int IR_IZQ = 2, IR_DER = 3;

void motores(int izq, int der) {
  digitalWrite(IN1, izq >= 0 ? HIGH : LOW);
  digitalWrite(IN2, izq >= 0 ? LOW : HIGH);
  digitalWrite(IN3, der >= 0 ? HIGH : LOW);
  digitalWrite(IN4, der >= 0 ? LOW : HIGH);
  analogWrite(ENA, abs(izq));
  analogWrite(ENB, abs(der));
}

void setup() {
  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(IR_IZQ, INPUT); pinMode(IR_DER, INPUT);
}

void loop() {
  int izq = digitalRead(IR_IZQ);
  int der = digitalRead(IR_DER);
  if (izq == LOW && der == LOW) {
    motores(150, 150);        // la línea va por el centro: recto
  } else if (izq == HIGH && der == LOW) {
    motores(40, 170);         // la línea se va a la izquierda
  } else if (izq == LOW && der == HIGH) {
    motores(170, 40);         // la línea se va a la derecha
  } else {
    motores(120, 120);
  }
  delay(10);
}`
  },
  {
    id: 'manual', titulo: 'Robot manual por el monitor serie', arena: 'obstaculos',
    codigo: `// Escribe w (adelante), s (atrás), a (izquierda), d (derecha) o x (parar)
const int ENA = 5, IN1 = 7, IN2 = 8;
const int ENB = 6, IN3 = 9, IN4 = 10;

void motores(int izq, int der) {
  digitalWrite(IN1, izq >= 0 ? HIGH : LOW);
  digitalWrite(IN2, izq >= 0 ? LOW : HIGH);
  digitalWrite(IN3, der >= 0 ? HIGH : LOW);
  digitalWrite(IN4, der >= 0 ? LOW : HIGH);
  analogWrite(ENA, abs(izq));
  analogWrite(ENB, abs(der));
}

void setup() {
  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  Serial.begin(9600);
  Serial.println("Listo: w a s d x");
}

void loop() {
  if (Serial.available() > 0) {
    char c = Serial.read();
    if (c == 'w') motores(200, 200);
    if (c == 's') motores(-200, -200);
    if (c == 'a') motores(-150, 150);
    if (c == 'd') motores(150, -150);
    if (c == 'x') motores(0, 0);
  }
}`
  }
];

// ---------- Retos de Arduino con comprobación automática ----------
// Cada reto prepara el circuito, da un código para completar y lo comprueba simulando entradas.
const ARDUINO_CHALLENGES = [
  {
    id: 'r_blink', titulo: '1. Haz parpadear el LED', nivel: 'Básico',
    enunciado: 'Haz que el LED del pin 13 se encienda 1 segundo y se apague 1 segundo, sin parar.',
    pista: 'Usa pinMode(13, OUTPUT) en setup(), y en loop() digitalWrite(13, HIGH), delay(1000), digitalWrite(13, LOW), delay(1000).',
    componentes: [{ tipo: 'led', nombre: 'LED rojo', pines: { pin: 13 }, color: 'rojo' }],
    codigo: `void setup() {
  // configura el pin 13 como salida

}

void loop() {
  // enciende, espera 1 s, apaga, espera 1 s

}`,
    async check(t) {
      await t.wait(5000);
      const ch = t.changes(13);
      if (ch.length < 4) return t.fail('El LED del pin 13 cambió solo ' + ch.length + ' veces en 5 segundos.');
      const gaps = ch.slice(1).map((c, i) => c.t - ch[i].t);
      const bad = gaps.find(g => Math.abs(g - 1000) > 150);
      if (bad !== undefined) return t.fail(`Los cambios deben ser cada 1000 ms; encontré uno de ${Math.round(bad)} ms.`);
      return t.pass('¡El LED parpadea cada segundo!');
    }
  },
  {
    id: 'r_semaforo', titulo: '2. Semáforo', nivel: 'Básico',
    enunciado: 'Enciende el verde (pin 12) 3 s, luego el amarillo (pin 11) 1 s y luego el rojo (pin 10) 3 s. Nunca dos luces a la vez.',
    pista: 'Configura los tres pines como OUTPUT. En loop(): enciende uno, delay, apágalo y pasa al siguiente.',
    componentes: [
      { tipo: 'led', nombre: 'LED rojo', pines: { pin: 10 }, color: 'rojo' },
      { tipo: 'led', nombre: 'LED amarillo', pines: { pin: 11 }, color: 'amarillo' },
      { tipo: 'led', nombre: 'LED verde', pines: { pin: 12 }, color: 'verde' }
    ],
    codigo: `const int ROJO = 10, AMARILLO = 11, VERDE = 12;

void setup() {

}

void loop() {

}`,
    async check(t) {
      let both = false;
      const seen = [];
      for (let i = 0; i < 80; i++) {
        await t.wait(100);
        const on = [12, 11, 10].filter(p => t.high(p));
        if (on.length > 1) both = true;
        if (on.length === 1 && seen[seen.length - 1] !== on[0]) seen.push(on[0]);
      }
      if (both) return t.fail('Hubo dos luces encendidas a la vez.');
      const s = seen.join(',');
      if (!/12,11,10/.test(s)) return t.fail('No vi la secuencia verde → amarillo → rojo. Vi: ' + (seen.map(p => ({ 12: 'verde', 11: 'amarillo', 10: 'rojo' })[p]).join(' → ') || 'nada'));
      return t.pass('¡Semáforo correcto!');
    }
  },
  {
    id: 'r_boton', titulo: '3. Botón y LED', nivel: 'Básico',
    enunciado: 'El LED (pin 13) debe encenderse solo mientras el botón (pin 2) está pulsado. Conecta el botón con INPUT_PULLUP.',
    pista: 'Con INPUT_PULLUP, digitalRead(2) da LOW cuando el botón está pulsado.',
    componentes: [
      { tipo: 'boton', nombre: 'Botón', pines: { pin: 2 } },
      { tipo: 'led', nombre: 'LED verde', pines: { pin: 13 }, color: 'verde' }
    ],
    codigo: `const int BOTON = 2;
const int LED = 13;

void setup() {

}

void loop() {

}`,
    async check(t) {
      await t.wait(300);
      if (t.high(13)) return t.fail('El LED está encendido sin pulsar el botón.');
      t.press(2, true); await t.wait(400);
      if (!t.high(13)) return t.fail('Pulsé el botón y el LED no se encendió.');
      t.press(2, false); await t.wait(400);
      if (t.high(13)) return t.fail('Solté el botón y el LED siguió encendido.');
      return t.pass('¡El botón controla el LED!');
    }
  },
  {
    id: 'r_pot', titulo: '4. Brillo con potenciómetro', nivel: 'Intermedio',
    enunciado: 'Lee el potenciómetro (A0) y ajusta el brillo del LED del pin 9 con analogWrite: 0 → apagado, 1023 → brillo máximo.',
    pista: 'int brillo = map(analogRead(A0), 0, 1023, 0, 255); analogWrite(9, brillo);',
    componentes: [
      { tipo: 'pot', nombre: 'Potenciómetro', pines: { pin: 14 } },
      { tipo: 'led', nombre: 'LED azul', pines: { pin: 9 }, color: 'azul' }
    ],
    codigo: `const int POT = A0;
const int LED = 9;

void setup() {
  pinMode(LED, OUTPUT);
}

void loop() {

}`,
    async check(t) {
      const tries = [[0, 0, 10], [1023, 245, 255], [512, 110, 145]];
      for (const [v, lo, hi] of tries) {
        t.analog(14, v); await t.wait(500);
        const pwm = t.pwm(9);
        if (pwm < lo || pwm > hi) return t.fail(`Con el potenciómetro en ${v}, el brillo debía estar entre ${lo} y ${hi}, pero fue ${pwm}.`);
      }
      return t.pass('¡El brillo sigue al potenciómetro!');
    }
  },
  {
    id: 'r_servo', titulo: '5. Servo que sigue al potenciómetro', nivel: 'Intermedio',
    enunciado: 'Mueve el servo del pin 9 de 0° a 180° según el potenciómetro de A0.',
    pista: '#include <Servo.h>, Servo s; s.attach(9); y en loop: s.write(map(analogRead(A0), 0, 1023, 0, 180));',
    componentes: [
      { tipo: 'pot', nombre: 'Potenciómetro', pines: { pin: 14 } },
      { tipo: 'servo', nombre: 'Servo', pines: { pin: 9 } }
    ],
    codigo: `#include <Servo.h>

Servo s;

void setup() {

}

void loop() {

}`,
    async check(t) {
      for (const [v, ang, tol] of [[0, 0, 5], [1023, 180, 5], [512, 90, 8]]) {
        t.analog(14, v); await t.wait(500);
        const a = t.servo(9);
        if (a === null || Math.abs(a - ang) > tol) return t.fail(`Con el potenciómetro en ${v} el servo debía estar cerca de ${ang}°, pero está en ${a === null ? 'ninguna posición (¿hiciste attach?)' : Math.round(a) + '°'}.`);
      }
      return t.pass('¡El servo sigue al potenciómetro!');
    }
  },
  {
    id: 'r_parqueo', titulo: '6. Sensor de parqueo', nivel: 'Avanzado',
    enunciado: 'Con el HC-SR04 (Trig 7, Echo 6) mide la distancia. Si hay algo a menos de 20 cm, haz sonar el zumbador del pin 8 con tone(); si no, apágalo con noTone().',
    pista: 'Pulso de 10 µs en Trig, luego long cm = pulseIn(6, HIGH) / 58;',
    componentes: [
      { tipo: 'ultrasonico', nombre: 'HC-SR04', pines: { trig: 7, echo: 6 } },
      { tipo: 'buzzer', nombre: 'Zumbador', pines: { pin: 8 } }
    ],
    codigo: `const int TRIG = 7, ECHO = 6, BUZZER = 8;

void setup() {

}

void loop() {

}`,
    async check(t) {
      t.distance(7, 100); await t.wait(700);
      if (t.tone(8)) return t.fail('A 100 cm el zumbador no debería sonar.');
      t.distance(7, 10); await t.wait(700);
      if (!t.tone(8)) return t.fail('A 10 cm el zumbador debería sonar.');
      t.distance(7, 60); await t.wait(700);
      if (t.tone(8)) return t.fail('Al alejarse a 60 cm el zumbador debería apagarse.');
      return t.pass('¡Tu sensor de parqueo funciona!');
    }
  }
];

// ---------- Algoritmos (JavaScript) ----------
// Cada ejercicio: función a completar + pruebas automáticas.
const ALGO_CHALLENGES = [
  { id: 'a_suma', titulo: 'Suma de dos números', nivel: 'Fácil', fn: 'sumar',
    enunciado: 'Devuelve la suma de a y b.',
    codigo: 'function sumar(a, b) {\n  // tu código aquí\n}',
    pruebas: [[[2, 3], 5], [[-4, 4], 0], [[100, 250], 350]],
    solucion: 'function sumar(a, b) {\n  return a + b;\n}' },
  { id: 'a_invertir', titulo: 'Invertir un texto', nivel: 'Fácil', fn: 'invertir',
    enunciado: 'Devuelve el texto al revés. Ejemplo: "hola" → "aloh".',
    codigo: 'function invertir(texto) {\n  \n}',
    pruebas: [[['hola'], 'aloh'], [['Nagua'], 'augaN'], [[''], '']],
    solucion: 'function invertir(texto) {\n  let r = "";\n  for (let i = texto.length - 1; i >= 0; i--) r += texto[i];\n  return r;\n}' },
  { id: 'a_mayor', titulo: 'El número mayor', nivel: 'Fácil', fn: 'mayor',
    enunciado: 'Devuelve el número más grande de la lista sin usar Math.max.',
    codigo: 'function mayor(lista) {\n  \n}',
    pruebas: [[[[3, 9, 2]], 9], [[[-5, -1, -9]], -1], [[[7]], 7]],
    solucion: 'function mayor(lista) {\n  let m = lista[0];\n  for (const n of lista) if (n > m) m = n;\n  return m;\n}' },
  { id: 'a_vocales', titulo: 'Contar vocales', nivel: 'Fácil', fn: 'contarVocales',
    enunciado: 'Cuenta las vocales (a, e, i, o, u, con o sin tilde, mayúsculas incluidas).',
    codigo: 'function contarVocales(texto) {\n  \n}',
    pruebas: [[['programacion'], 5], [['ÁRBOL'], 2], [['xyz'], 0]],
    solucion: 'function contarVocales(texto) {\n  let n = 0;\n  for (const c of texto.toLowerCase()) if ("aeiouáéíóú".includes(c)) n++;\n  return n;\n}' },
  { id: 'a_fizz', titulo: 'FizzBuzz', nivel: 'Fácil', fn: 'fizzBuzz',
    enunciado: 'Devuelve una lista del 1 al n: "Fizz" si es múltiplo de 3, "Buzz" si es de 5, "FizzBuzz" si de ambos; si no, el número.',
    codigo: 'function fizzBuzz(n) {\n  const r = [];\n  \n  return r;\n}',
    pruebas: [[[5], [1, 2, 'Fizz', 4, 'Buzz']], [[15], [1, 2, 'Fizz', 4, 'Buzz', 'Fizz', 7, 8, 'Fizz', 'Buzz', 11, 'Fizz', 13, 14, 'FizzBuzz']]],
    solucion: 'function fizzBuzz(n) {\n  const r = [];\n  for (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) r.push("FizzBuzz");\n    else if (i % 3 === 0) r.push("Fizz");\n    else if (i % 5 === 0) r.push("Buzz");\n    else r.push(i);\n  }\n  return r;\n}' },
  { id: 'a_palindromo', titulo: 'Palíndromo', nivel: 'Medio', fn: 'esPalindromo',
    enunciado: 'Devuelve true si se lee igual al revés, ignorando espacios y mayúsculas. "Anita lava la tina" → true.',
    codigo: 'function esPalindromo(texto) {\n  \n}',
    pruebas: [[['Anita lava la tina'], true], [['reconocer'], true], [['robot'], false]],
    solucion: 'function esPalindromo(texto) {\n  const t = texto.toLowerCase().replace(/\\s/g, "");\n  return t === t.split("").reverse().join("");\n}' },
  { id: 'a_factorial', titulo: 'Factorial', nivel: 'Medio', fn: 'factorial',
    enunciado: 'Devuelve n! (n factorial). 5! = 120 y 0! = 1.',
    codigo: 'function factorial(n) {\n  \n}',
    pruebas: [[[5], 120], [[0], 1], [[10], 3628800]],
    solucion: 'function factorial(n) {\n  let r = 1;\n  for (let i = 2; i <= n; i++) r *= i;\n  return r;\n}' },
  { id: 'a_fibo', titulo: 'Fibonacci', nivel: 'Medio', fn: 'fibonacci',
    enunciado: 'Devuelve el número n de Fibonacci (0, 1, 1, 2, 3, 5, 8…): fibonacci(0) = 0, fibonacci(6) = 8. Debe ser rápido con n = 50.',
    codigo: 'function fibonacci(n) {\n  \n}',
    pruebas: [[[0], 0], [[6], 8], [[50], 12586269025]],
    solucion: 'function fibonacci(n) {\n  let a = 0, b = 1;\n  for (let i = 0; i < n; i++) [a, b] = [b, a + b];\n  return a;\n}' },
  { id: 'a_primos', titulo: 'Números primos', nivel: 'Medio', fn: 'primosHasta',
    enunciado: 'Devuelve la lista de números primos menores o iguales que n.',
    codigo: 'function primosHasta(n) {\n  \n}',
    pruebas: [[[10], [2, 3, 5, 7]], [[1], []], [[30], [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]]],
    solucion: 'function primosHasta(n) {\n  const r = [];\n  for (let i = 2; i <= n; i++) {\n    let primo = true;\n    for (let d = 2; d * d <= i; d++) if (i % d === 0) { primo = false; break; }\n    if (primo) r.push(i);\n  }\n  return r;\n}' },
  { id: 'a_burbuja', titulo: 'Ordenar (burbuja)', nivel: 'Medio', fn: 'ordenar',
    enunciado: 'Ordena la lista de menor a mayor SIN usar .sort(). Prueba el método de la burbuja.',
    codigo: 'function ordenar(lista) {\n  const a = lista.slice();\n  \n  return a;\n}',
    pruebas: [[[[5, 2, 9, 1]], [1, 2, 5, 9]], [[[3, 3, 1]], [1, 3, 3]], [[[]], []]],
    prohibido: /\.sort\s*\(/,
    solucion: 'function ordenar(lista) {\n  const a = lista.slice();\n  for (let i = 0; i < a.length; i++)\n    for (let j = 0; j < a.length - 1 - i; j++)\n      if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];\n  return a;\n}' },
  { id: 'a_binaria', titulo: 'Búsqueda binaria', nivel: 'Medio', fn: 'buscar',
    enunciado: 'La lista está ordenada. Devuelve la posición del número o -1 si no está, partiendo la lista a la mitad en cada paso.',
    codigo: 'function buscar(lista, objetivo) {\n  let izq = 0, der = lista.length - 1;\n  \n  return -1;\n}',
    pruebas: [[[[1, 3, 5, 7, 9, 11], 7], 3], [[[1, 3, 5, 7], 4], -1], [[[2], 2], 0]],
    solucion: 'function buscar(lista, objetivo) {\n  let izq = 0, der = lista.length - 1;\n  while (izq <= der) {\n    const m = Math.floor((izq + der) / 2);\n    if (lista[m] === objetivo) return m;\n    if (lista[m] < objetivo) izq = m + 1; else der = m - 1;\n  }\n  return -1;\n}' },
  { id: 'a_binario', titulo: 'Decimal a binario', nivel: 'Medio', fn: 'aBinario',
    enunciado: 'Convierte un número decimal a texto binario sin usar toString(2). 10 → "1010".',
    codigo: 'function aBinario(n) {\n  \n}',
    pruebas: [[[10], '1010'], [[0], '0'], [[255], '11111111']],
    prohibido: /toString\s*\(\s*2\s*\)/,
    solucion: 'function aBinario(n) {\n  if (n === 0) return "0";\n  let r = "";\n  while (n > 0) { r = (n % 2) + r; n = Math.floor(n / 2); }\n  return r;\n}' },
  { id: 'a_parentesis', titulo: 'Paréntesis balanceados', nivel: 'Difícil', fn: 'balanceado',
    enunciado: 'Devuelve true si los (), [] y {} están bien cerrados. "{[()]}" → true, "(]" → false.',
    codigo: 'function balanceado(texto) {\n  const pila = [];\n  \n}',
    pruebas: [[['{[()]}'], true], [['(]'], false], [['(()'], false], [['a(b)c[d]'], true]],
    solucion: 'function balanceado(texto) {\n  const pila = [], par = { ")": "(", "]": "[", "}": "{" };\n  for (const c of texto) {\n    if ("([{".includes(c)) pila.push(c);\n    else if (par[c]) { if (pila.pop() !== par[c]) return false; }\n  }\n  return pila.length === 0;\n}' },
  { id: 'a_twosum', titulo: 'Dos números que suman', nivel: 'Difícil', fn: 'dosSuman',
    enunciado: 'Devuelve las posiciones [i, j] (i < j) de los dos números que suman el objetivo. Intenta hacerlo en una sola pasada.',
    codigo: 'function dosSuman(lista, objetivo) {\n  \n}',
    pruebas: [[[[2, 7, 11, 15], 9], [0, 1]], [[[3, 2, 4], 6], [1, 2]], [[[1, 5, 8, 3], 11], [2, 3]]],
    solucion: 'function dosSuman(lista, objetivo) {\n  const vistos = {};\n  for (let i = 0; i < lista.length; i++) {\n    const falta = objetivo - lista[i];\n    if (falta in vistos) return [vistos[falta], i];\n    vistos[lista[i]] = i;\n  }\n}' },
  { id: 'a_kadane', titulo: 'Mayor suma seguida', nivel: 'Difícil', fn: 'mayorSuma',
    enunciado: 'Devuelve la mayor suma de números SEGUIDOS de la lista. [-2,1,-3,4,-1,2,1,-5,4] → 6 (4,-1,2,1).',
    codigo: 'function mayorSuma(lista) {\n  \n}',
    pruebas: [[[[-2, 1, -3, 4, -1, 2, 1, -5, 4]], 6], [[[-3, -1, -2]], -1], [[[5, 4, -1, 7, 8]], 23]],
    solucion: 'function mayorSuma(lista) {\n  let mejor = lista[0], actual = lista[0];\n  for (let i = 1; i < lista.length; i++) {\n    actual = Math.max(lista[i], actual + lista[i]);\n    mejor = Math.max(mejor, actual);\n  }\n  return mejor;\n}' },
  { id: 'a_frecuencia', titulo: 'Palabra más repetida', nivel: 'Difícil', fn: 'masRepetida',
    enunciado: 'Devuelve la palabra que más se repite (en minúsculas). Si hay empate, la que aparece primero.',
    codigo: 'function masRepetida(texto) {\n  \n}',
    pruebas: [[['el robot y el carro y el sensor'], 'el'], [['Hola hola mundo'], 'hola'], [['uno dos'], 'uno']],
    solucion: 'function masRepetida(texto) {\n  const c = {};\n  let mejor = "", max = 0;\n  for (const p of texto.toLowerCase().split(/\\s+/)) {\n    c[p] = (c[p] || 0) + 1;\n    if (c[p] > max) { max = c[p]; mejor = p; }\n  }\n  return mejor;\n}' }
];
