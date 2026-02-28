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
    })

    clearInterval(intervalo);
    tiempo = 0;
    contTiempo.textContent = 0;
    intervalo = null;
}

function voltearCarta(carta) {
    if(bloqueado) return;
    if(carta.classList.contains('volteada')) return;
    if(carta.classList.contains('encontrada')) return;

    // Arrancar el temporizador al pulsar la primera carta
    if(cartasVolteadas.length === 0 && cartasEncontradas === 0 && tiempo === 0){
        iniciarTemporizador();
    }

    carta.classList.add('volteada');
    cartasVolteadas.push(carta);

    if(cartasVolteadas.length === 2){
        movimientos++;
        contMovimientos.textContent = movimientos;
        comprobarPareja();
    }
}

function comprobarPareja() {
    const [carta1, carta2] = cartasVolteadas;
    bloqueado = true;

    if(carta1.dataset.simbolo === carta2.dataset.simbolo){
        carta1.classList.add('encontrada');
        carta2.classList.add('encontrada');
        cartasVolteadas = [];
        cartasEncontradas++;
        bloqueado = false;

        if(cartasEncontradas === simbolos.length){
            mostrarVictoria();
        }
    } else {
        setTimeout(() => {
            carta1.classList.remove('volteada');
            carta2.classList.remove('volteada');
            cartasVolteadas = [];
            bloqueado = false;
        }, 1000)
    }
}

function iniciarTemporizador(){
    intervalo = setInterval(() => {
        tiempo++;
        contTiempo.textContent = tiempo;
    }, 1000)
}

function mostrarVictoria() {
    clearInterval(intervalo);
    tiempoVictoria.textContent = tiempo;
    setTimeout(() => {
        modalVictoria.style.display = 'flex';
    }, 1000)
}

function reiniciarJuego() {
    cartasVolteadas = [];
    cartasEncontradas = 0;
    movimientos = 0;
    tiempo = 0;
    bloqueado = false;

    // Resetear contadores en pantalla
    contMovimientos.textContent = 0;
    contTiempo.textContent = 0;

    // Ocultar modal
    modalVictoria.style.display = 'none';

    // Resetear temporizador
    clearInterval(intervalo);

    // Crear tablero nuevo
    crearTablero();
}

// Botones de reinicio
document.getElementById('reiniciar').addEventListener('click', reiniciarJuego);
document.getElementById('reiniciar-victoria').addEventListener('click', reiniciarJuego);

crearTablero();