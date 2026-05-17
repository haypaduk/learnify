// ============================================
// ARCHIVO: crear-tarea.js
// Lógica para crear una nueva tarea
// ============================================

const usuario = JSON.parse(localStorage.getItem('usuario'));

// Verificar sesión
if (!usuario) {
    window.location.href = '../iniciar_sesion.html';
}

// Obtener ID del equipo de la URL
const urlParams = new URLSearchParams(window.location.search);
const equipoId = urlParams.get('equipo_id');

if (!equipoId) {
    window.location.href = 'mis_equipos.html';
}

// Configurar enlace de volver
const volverLink = document.getElementById('volverLink');
if (volverLink) {
    volverLink.href = `tareas_equipo.html?equipo_id=${equipoId}`;
}

// ============================================
// MOSTRAR MENSAJE
// ============================================
function mostrarMensaje(tipo, texto) {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.textContent = tipo === 'exito' ? `Correcto ${texto}` : `Error ${texto}`;
    mensajeDiv.style.display = 'block';
    setTimeout(() => {
        mensajeDiv.style.display = 'none';
    }, 3000);
}

// ============================================
// CANCELAR
// ============================================
function cancelar() {
    window.location.href = `tareas_equipo.html?equipo_id=${equipoId}`;
}

// ============================================
// CREAR TAREA
// ============================================
document.getElementById('formCrearTarea').addEventListener('submit', async function(e) {
    e.preventDefault();

    const titulo = document.getElementById('titulo').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const fecha_limite = document.getElementById('fecha_limite').value;

    if (!titulo) {
        mostrarMensaje('error', 'El título de la tarea es obligatorio');
        return;
    }

    const btnSubmit = this.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit.textContent;
    btnSubmit.textContent = 'Creando...';
    btnSubmit.disabled = true;

    try {
        const respuesta = await fetch('/api/tareas/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                titulo: titulo,
                descripcion: descripcion,
                equipo_id: parseInt(equipoId),
                creador_id: usuario.id,
                fecha_limite: fecha_limite || null
            })
        });

        const resultado = await respuesta.json();

        if (resultado.exito) {
            mostrarMensaje('exito', 'Tarea creada correctamente');
            setTimeout(() => {
                window.location.href = `tareas_equipo.html?equipo_id=${equipoId}`;
            }, 1500);
        } else {
            mostrarMensaje('error', resultado.mensaje);
            btnSubmit.textContent = textoOriginal;
            btnSubmit.disabled = false;
        }

    } catch (error) {
        mostrarMensaje('error', 'Error de conexión');
        btnSubmit.textContent = textoOriginal;
        btnSubmit.disabled = false;
    }
});