// ── Firebase
const DB_URL = 'https://memory-game-record-default-rtdb.europe-west1.firebasedatabase.app';

async function obtenerRecord() {
  try {
    const res = await fetch(`${DB_URL}/record.json`);
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

async function guardarRecord(nombre, tiempo, movimientos) {
  try {
    await fetch(`${DB_URL}/record.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, tiempo, movimientos })
    });
  } catch {
    console.error('Error guardando récord');
  }
}

async function mostrarRecord() {
  const record = await obtenerRecord();
  const el = document.getElementById('record-display');
  if (record && record.nombre) {
    el.innerHTML = `🏆 Mejor tiempo: <strong>${record.nombre}</strong> — ${record.tiempo}s en ${record.movimientos} movimientos`;
  } else {
    el.innerHTML = '🏆 Aún no hay récord. ¡Sé el primero!';
  }
}

// ── Juego
const tablero = document.getElementById('tablero');
const contMovimientos = document.getElementById('movimientos');
const contTiempo = document.getElementById('tiempo');
const tiempoVictoria = document.getElementById('tiempo-victoria');
const modalVictoria = document.getElementById('victoria');

const simbolos = ['★','♠','♥','♦','♣','☀','☽','⚡'];

let cartasVolteadas = [];
let cartasEncontradas = 0;
let movimientos = 0;
let bloqueado = false;
let tiempo = 0;
let intervalo = null;

function mezclar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function crearTablero() {
  tablero.innerHTML = '';
  const parejas = mezclar([...simbolos, ...simbolos]);

  parejas.forEach(simbolo => {
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

  clearInterval(intervalo);
  tiempo = 0;
  contTiempo.textContent = 0;
  intervalo = null;
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

    if (cartasEncontradas === simbolos.length) {
      mostrarVictoria();
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

async function mostrarVictoria() {
  clearInterval(intervalo);
  tiempoVictoria.textContent = tiempo;

  // Comprobar si es récord
  const record = await obtenerRecord();
  const esRecord = !record || tiempo < record.tiempo;

  setTimeout(() => {
    modalVictoria.style.display = 'flex';

    // Mostrar input de nombre si es récord o no hay récord aún
    const recordMsg = document.getElementById('record-msg');
    const inputNombre = document.getElementById('input-nombre');
    const btnGuardar = document.getElementById('btn-guardar');

    if (esRecord) {
      recordMsg.textContent = '🎉 ¡Nuevo récord! Introduce tu nombre:';
      recordMsg.style.display = 'block';
      inputNombre.style.display = 'block';
      btnGuardar.style.display = 'block';

      btnGuardar.onclick = async () => {
        const nombre = inputNombre.value.trim() || 'Anónimo';
        await guardarRecord(nombre, tiempo, movimientos);
        mostrarRecord();
        recordMsg.textContent = `✓ Récord guardado como "${nombre}"`;
        inputNombre.style.display = 'none';
        btnGuardar.style.display = 'none';
      };
    } else {
      recordMsg.textContent = `El récord actual es de ${record.tiempo}s por ${record.nombre}`;
      recordMsg.style.display = 'block';
      inputNombre.style.display = 'none';
      btnGuardar.style.display = 'none';
    }
  }, 1000);
}

function reiniciarJuego() {
  cartasVolteadas = [];
  cartasEncontradas = 0;
  movimientos = 0;
  tiempo = 0;
  bloqueado = false;

  contMovimientos.textContent = 0;
  contTiempo.textContent = 0;
  modalVictoria.style.display = 'none';

  clearInterval(intervalo);
  crearTablero();
}

document.getElementById('reiniciar').addEventListener('click', reiniciarJuego);
document.getElementById('reiniciar-victoria').addEventListener('click', reiniciarJuego);

crearTablero();
mostrarRecord();