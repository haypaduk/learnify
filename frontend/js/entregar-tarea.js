// ============================================
// ARCHIVO: entregar-tarea.js
// Lógica para entregar una tarea
// ============================================

const usuario = JSON.parse(localStorage.getItem('usuario'));

// Verificar sesión
if (!usuario) {
    window.location.href = '../iniciar_sesion.html';
}

// Solo alumnos pueden entregar tareas
if (usuario.rol !== 'alumno') {
    alert('Solo los alumnos pueden entregar tareas');
    window.location.href = 'mis_equipos.html';
}

// Obtener parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const tareaId = urlParams.get('tarea_id');
const equipoId = urlParams.get('equipo_id');

if (!tareaId) {
    window.location.href = 'mis_equipos.html';
}

// Configurar enlace de volver
const volverLink = document.getElementById('volverLink');
if (volverLink && equipoId) {
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
// CARGAR INFORMACIÓN DE LA TAREA
// ============================================
async function cargarInfoTarea() {
    const infoContainer = document.getElementById('infoTarea');
    
    try {
        const respuesta = await fetch(`/api/tareas/detalle/${tareaId}`);
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            const tarea = resultado.tarea;
            const fechaLimite = tarea.fecha_limite ? new Date(tarea.fecha_limite).toLocaleDateString('es-MX') : 'Sin fecha límite';
            
            infoContainer.innerHTML = `
                <h3>Titulo: ${escapeHtml(tarea.titulo)}</h3>
                <p>${escapeHtml(tarea.descripcion || 'Sin descripción')}</p>
                <p><strong>Creada por:</strong> ${escapeHtml(tarea.creador_nombre)}</p>
                <p><strong>Equipo:</strong> ${escapeHtml(tarea.equipo_nombre)}</p>
                <div class="fecha-limite">Fecha límite: ${fechaLimite}</div>
            `;
            
            // Verificar si ya entregó
            const yaEntrego = tarea.entregas && tarea.entregas.some(e => e.alumno_id === usuario.id);
            
            if (yaEntrego) {
                const entrega = tarea.entregas.find(e => e.alumno_id === usuario.id);
                const fechaEntrega = new Date(entrega.fecha_entrega).toLocaleDateString('es-MX');
                infoContainer.innerHTML += `
                    <div class="entrega-existente" style="margin-top: 1rem;">
                        <p>Ya has entregado esta tarea</p>
                        <p class="fecha-entrega">Entregada el: ${fechaEntrega}</p>
                    </div>
                `;
                document.getElementById('formEntregar').style.display = 'none';
            } else {
                document.getElementById('formEntregar').style.display = 'block';
            }
        } else {
            infoContainer.innerHTML = `<div class="sin-tareas">Error: ${resultado.mensaje}</div>`;
        }
    } catch (error) {
        infoContainer.innerHTML = '<div class="sin-tareas">Error de conexión</div>';
    }
}

// ============================================
// CANCELAR
// ============================================
function cancelar() {
    if (equipoId) {
        window.location.href = `tareas_equipo.html?equipo_id=${equipoId}`;
    } else {
        window.location.href = 'mis_equipos.html';
    }
}

// ============================================
// ENTREGAR TAREA
// ============================================
// Reemplazar la función de enviar
document.getElementById('formEntregar').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const comentario = document.getElementById('comentario').value.trim();
    const archivo = document.getElementById('archivo').files[0];
    
    const btnSubmit = this.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit.textContent;
    btnSubmit.textContent = 'Entregando...';
    btnSubmit.disabled = true;
    
    const formData = new FormData();
    formData.append('tarea_id', tareaId);
    formData.append('alumno_id', usuario.id);
    formData.append('comentario', comentario);
    if (archivo) {
        formData.append('archivo', archivo);
    }
    
    try {
        const respuesta = await fetch('/api/entregas/subir', {
            method: 'POST',
            body: formData
        });
        
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            mostrarMensaje('exito', '¡Tarea entregada correctamente!');
            setTimeout(() => {
                if (equipoId) {
                    window.location.href = `tareas_equipo.html?equipo_id=${equipoId}`;
                } else {
                    window.location.href = 'mis_equipos.html';
                }
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

// ============================================
// UTILIDADES
// ============================================
function escapeHtml(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// ============================================
// INICIALIZAR
// ============================================
cargarInfoTarea();