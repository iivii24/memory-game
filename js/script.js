// ── Firebase
const DB_URL = 'https://memory-game-record-default-rtdb.europe-west1.firebasedatabase.app';

async function obtenerRecord(nivel) {
  try {
    const res = await fetch(`${DB_URL}/records/nivel${nivel}.json`);
    return await res.json();
  } catch { return null; }
}

async function guardarRecord(nivel, nombre, tiempo, movimientos) {
  try {
    await fetch(`${DB_URL}/records/nivel${nivel}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, tiempo, movimientos })
    });
  } catch { console.error('Error guardando récord'); }
}

async function mostrarRecord() {
  const el = document.getElementById('record-display');
  const nivel = NIVELES[nivelActual].nivel;
  const record = await obtenerRecord(nivel);
  if (record && record.nombre) {
    el.innerHTML = `🏆 Récord nivel ${nivel}: <strong>${record.nombre}</strong> — ${record.tiempo}s en ${record.movimientos} movimientos`;
  } else {
    el.innerHTML = `🏆 Nivel ${nivel}: ¡Aún no hay récord. Sé el primero!`;
  }
}

// ── Niveles
const NIVELES = [
  { nivel: 1, parejas: 8,  columnas: 4 },
  { nivel: 2, parejas: 10, columnas: 5 },
  { nivel: 3, parejas: 12, columnas: 6 },
  { nivel: 4, parejas: 16, columnas: 4 },
  { nivel: 5, parejas: 18, columnas: 6 },
];

const SIMBOLOS = [
  '🍎','🐶','🌙','⚡','🔥','💎','🎯','🚀',
  '🌈','🎸','🦋','🍀','🎃','🌊','🦁','👾',
  '🍕','🎲'
];

// ── Estado
let nivelActual = 0;
let cartasVolteadas = [];
let cartasEncontradas = 0;
let movimientos = 0;
let bloqueado = false;
let tiempo = 0;
let tiempoTotal = 0;
let intervalo = null;

// ── Elementos DOM
const tablero         = document.getElementById('tablero');
const contMovimientos = document.getElementById('movimientos');
const contTiempo      = document.getElementById('tiempo');
const tiempoVictoria  = document.getElementById('tiempo-victoria');
const modalVictoria   = document.getElementById('victoria');
const modalNivel      = document.getElementById('modal-nivel');
const msgNivel        = document.getElementById('msg-nivel');
const nivelEl         = document.getElementById('nivel-actual');

// ── Tablero
function mezclar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function ajustarTamañoCarta() {
  const { columnas } = NIVELES[nivelActual];
  const tamaño = columnas <= 4 ? '80px' : columnas <= 5 ? '75px' : '70px';
  document.querySelectorAll('.carta').forEach(c => {
    c.style.width = tamaño;
    c.style.height = tamaño;
  });
}

function crearTablero() {
  tablero.innerHTML = '';
  const { parejas, columnas } = NIVELES[nivelActual];
  const simbolosNivel = SIMBOLOS.slice(0, parejas);
  const pares = mezclar([...simbolosNivel, ...simbolosNivel]);

  const tamaño = columnas <= 4 ? '80px' : columnas <= 5 ? '75px' : '70px';
  tablero.style.gridTemplateColumns = `repeat(${columnas}, ${tamaño})`;

  pares.forEach(simbolo => {
    const carta = document.createElement('div');
    carta.classList.add('carta');
    carta.dataset.simbolo = simbolo;
    carta.innerHTML = `
      <div class="cara-atras">?</div>
      <div class="cara-frente">${simbolo}</div>
    `;
    carta.addEventListener('click', () => voltearCarta(carta));
    tablero.appendChild(carta);
  });

  nivelEl.textContent = NIVELES[nivelActual].nivel;
  clearInterval(intervalo);
  tiempo = 0;
  contTiempo.textContent = 0;
  intervalo = null;
  ajustarTamañoCarta();
}

function voltearCarta(carta) {
  if (bloqueado) return;
  if (carta.classList.contains('volteada')) return;
  if (carta.classList.contains('encontrada')) return;

  if (cartasVolteadas.length === 0 && cartasEncontradas === 0 && tiempo === 0) {
    iniciarTemporizador();
  }

  carta.classList.add('volteada');
  cartasVolteadas.push(carta);

  if (cartasVolteadas.length === 2) {
    movimientos++;
    contMovimientos.textContent = movimientos;
    comprobarPareja();
  }
}

function comprobarPareja() {
  const [carta1, carta2] = cartasVolteadas;
  bloqueado = true;

  if (carta1.dataset.simbolo === carta2.dataset.simbolo) {
    carta1.classList.add('encontrada');
    carta2.classList.add('encontrada');
    cartasVolteadas = [];
    cartasEncontradas++;
    bloqueado = false;

    if (cartasEncontradas === NIVELES[nivelActual].parejas) {
      nivelCompletado();
    }
  } else {
    setTimeout(() => {
      carta1.classList.remove('volteada');
      carta2.classList.remove('volteada');
      cartasVolteadas = [];
      bloqueado = false;
    }, 1000);
  }
}

function iniciarTemporizador() {
  intervalo = setInterval(() => {
    tiempo++;
    contTiempo.textContent = tiempo;
  }, 1000);
}

async function nivelCompletado() {
  clearInterval(intervalo);
  tiempoTotal += tiempo;

  const esUltimo = nivelActual === NIVELES.length - 1;
  const nivel = NIVELES[nivelActual].nivel;
  const record = await obtenerRecord(nivel);
  const esRecord = !record || tiempo < record.tiempo;

  setTimeout(() => {
    if (esUltimo) {
      mostrarVictoriaFinal(esRecord, nivel);
    } else {
      // Construir modal entre niveles
      let html = `
        <h2>¡Nivel ${nivel} superado! 🎉</h2>
        <p>Completado en ${tiempo}s con ${movimientos} movimientos</p>
      `;

      if (esRecord) {
        html += `
          <p style="color:#ffb347">🏆 ¡Nuevo récord en este nivel!</p>
          <input type="text" id="input-nombre-nivel" placeholder="Tu nombre..."
            style="padding:.6rem 1rem; background:#1a1000; border:1px solid #ffb347;
            color:#f0e6d0; border-radius:8px; font-size:.9rem; outline:none;"/>
          <button id="btn-guardar-nivel">Guardar récord</button>
        `;
      } else if (record && record.nombre) {
        html += `<p>Récord actual: <strong>${record.nombre}</strong> — ${record.tiempo}s</p>`;
      }

      html += `<button id="btn-siguiente-nivel">Siguiente nivel →</button>`;

      modalNivel.innerHTML = html;
      modalNivel.style.display = 'flex';

      // Evento guardar récord del nivel
      const btnGuardarNivel = document.getElementById('btn-guardar-nivel');
      if (btnGuardarNivel) {
        btnGuardarNivel.onclick = async () => {
          const nombre = document.getElementById('input-nombre-nivel').value.trim() || 'Anónimo';
          await guardarRecord(nivel, nombre, tiempo, movimientos);
          mostrarRecord();
          btnGuardarNivel.textContent = `✓ Guardado como "${nombre}"`;
          btnGuardarNivel.disabled = true;
          document.getElementById('input-nombre-nivel').style.display = 'none';
        };
      }

      // Evento siguiente nivel
      document.getElementById('btn-siguiente-nivel').addEventListener('click', siguienteNivel);
    }
  }, 800);
}

async function mostrarVictoriaFinal(esRecord, nivel) {
  tiempoVictoria.textContent = tiempoTotal;

  setTimeout(async () => {
    modalVictoria.style.display = 'flex';

    const recordMsg   = document.getElementById('record-msg');
    const inputNombre = document.getElementById('input-nombre');
    const btnGuardar  = document.getElementById('btn-guardar');

    if (esRecord) {
      recordMsg.textContent = '🎉 ¡Nuevo récord en el nivel 5! Introduce tu nombre:';
      recordMsg.style.display = 'block';
      inputNombre.style.display = 'block';
      btnGuardar.style.display = 'block';

      btnGuardar.onclick = async () => {
        const nombre = inputNombre.value.trim() || 'Anónimo';
        await guardarRecord(nivel, nombre, tiempoTotal, movimientos);
        mostrarRecord();
        recordMsg.textContent = `✓ Récord guardado como "${nombre}"`;
        inputNombre.style.display = 'none';
        btnGuardar.style.display = 'none';
      };
    } else {
      const record = await obtenerRecord(nivel);
      recordMsg.textContent = record
        ? `El récord actual es de ${record.tiempo}s por ${record.nombre}`
        : '';
      recordMsg.style.display = 'block';
      inputNombre.style.display = 'none';
      btnGuardar.style.display = 'none';
    }
  }, 800);
}

function siguienteNivel() {
  nivelActual++;
  cartasVolteadas = [];
  cartasEncontradas = 0;
  bloqueado = false;
  tiempo = 0;
  movimientos = 0;
  contMovimientos.textContent = 0;
  contTiempo.textContent = 0;
  modalNivel.style.display = 'none';
  crearTablero();
  mostrarRecord();
}

function reiniciarJuego() {
  nivelActual = 0;
  cartasVolteadas = [];
  cartasEncontradas = 0;
  movimientos = 0;
  tiempo = 0;
  tiempoTotal = 0;
  bloqueado = false;

  contMovimientos.textContent = 0;
  contTiempo.textContent = 0;
  modalVictoria.style.display = 'none';
  modalNivel.style.display = 'none';

  clearInterval(intervalo);
  crearTablero();
  mostrarRecord();
}

// ── Eventos
document.getElementById('reiniciar').addEventListener('click', reiniciarJuego);
document.getElementById('reiniciar-victoria').addEventListener('click', reiniciarJuego);

// ── Arrancar
crearTablero();
mostrarRecord();