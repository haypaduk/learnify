// ============================================
// ARCHIVO 21/30: tareas.js
// Lógica para gestionar tareas
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

// ============================================
// CARGAR TAREAS DEL EQUIPO
// ============================================
async function cargarTareas() {
    const container = document.getElementById('tareasContainer');
    container.innerHTML = '<div class="sin-tareas">Cargando tareas...</div>';
    
    try {
        const respuesta = await fetch(`/api/tareas/equipo/${equipoId}`);
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            mostrarTareas(resultado.tareas);
        } else {
            container.innerHTML = `<div class="sin-tareas">Error: ${resultado.mensaje}</div>`;
        }
    } catch (error) {
        container.innerHTML = '<div class="sin-tareas">Error de conexión</div>';
    }
}

// ============================================
// MOSTRAR TAREAS
// ============================================
function mostrarTareas(tareas) {
    const container = document.getElementById('tareasContainer');
    
    if (tareas.length === 0) {
        container.innerHTML = '<div class="sin-tareas">No hay tareas en este equipo. Crea una para empezar.</div>';
        return;
    }
    
    container.innerHTML = tareas.map(tarea => {
        const fechaLimite = new Date(tarea.fecha_limite);
        const hoy = new Date();
        const estaVencida = fechaLimite < hoy && tarea.fecha_limite;
        const esLider = usuario.rol === 'maestro' || tarea.creador_id === usuario.id;
        
        return `
            <div class="tarea-card">
                <div class="tarea-titulo">Titulo: ${escapeHtml(tarea.titulo)}</div>
                <div class="tarea-descripcion">${escapeHtml(tarea.descripcion || 'Sin descripción')}</div>
                <div class="tarea-meta">
                    <div class="tarea-fecha ${estaVencida ? 'vencida' : ''}">
                        Fecha: ${tarea.fecha_limite ? formatearFecha(tarea.fecha_limite) : 'Sin fecha límite'}
                    </div>
                    <div class="tarea-creador">Creador: ${escapeHtml(tarea.creador_nombre)}</div>
                    <div class="entregas-badge">Entrego: ${tarea.total_entregas || 0} entregas</div>
                </div>
                <div class="tarea-acciones">
                    <button onclick="verDetalleTarea(${tarea.id})" class="btn btn-ver-tarea">Ver detalles</button>
                    ${usuario.rol === 'alumno' ? 
                        `<button onclick="entregarTarea(${tarea.id})" class="btn btn-entregar">Entregar</button>` : ''}
                    ${esLider ? 
                        `<button onclick="verEntregas(${tarea.id})" class="btn btn-calificar">Calificar</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// VER DETALLE DE TAREA
// ============================================
function verDetalleTarea(tareaId) {
    window.location.href = `detalle_tarea.html?id=${tareaId}`;
}

// ============================================
// ENTREGAR TAREA (alumno)
// ============================================
function entregarTarea(tareaId) {
    window.location.href = `entregar_tarea.html?tarea_id=${tareaId}&equipo_id=${equipoId}`;
}

// ============================================
// VER ENTREGAS (líder)
// ============================================
function verEntregas(tareaId) {
    window.location.href = `entregas_tarea.html?tarea_id=${tareaId}`;
}

// ============================================
// CREAR TAREA
// ============================================
function crearTarea() {
    window.location.href = `crear_tarea.html?equipo_id=${equipoId}`;
}

// ============================================
// UTILIDADES
// ============================================
function escapeHtml(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function formatearFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX');
}

// ============================================
// VOLVER AL EQUIPO
// ============================================
function volverAlEquipo() {
    window.location.href = `equipo_detalle.html?id=${equipoId}`;
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    cargarTareas();
    
    // Configurar botón crear tarea (solo líder)
    const btnCrear = document.getElementById('btnCrearTarea');
    if (btnCrear) {
        // Solo mostrar si es líder del equipo (lo verificamos en backend)
        btnCrear.onclick = crearTarea;
    }
});