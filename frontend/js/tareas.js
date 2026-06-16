// ============================================
// ARCHIVO: tareas.js
// Lógica para gestionar tareas (MongoDB)
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
// REGISTRAR ACTIVIDAD DEL USUARIO
// ============================================
async function registrarActividad(tipo, descripcion = '') {
    try {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        if (!usuario) return;
        
        await fetch('/api/registrar-actividad', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: usuario._id,
                tipo: tipo,
                descripcion: descripcion
            })
        });
    } catch (error) {
        console.error('Error al registrar actividad:', error);
    }
}

// ============================================
// VERIFICAR SI EL USUARIO ES LÍDER DEL EQUIPO
// ============================================
async function verificarLider() {
    try {
        const respuesta = await fetch(`/api/equipos/detalle/${equipoId}`);
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            const equipo = resultado.equipo;
            const esLider = (equipo.lider_id === usuario._id);
            
            console.log('Verificando líder:');
            console.log('  - usuario._id:', usuario._id);
            console.log('  - equipo.lider_id:', equipo.lider_id);
            console.log('  - esLider:', esLider);
            
            const btnCrear = document.getElementById('btnCrearTarea');
            if (btnCrear) {
                if (esLider) {
                    btnCrear.style.display = 'flex';
                    btnCrear.onclick = crearTarea;
                    console.log('Botón CREAR TAREA: MOSTRADO (es líder)');
                } else {
                    btnCrear.style.display = 'none';
                    console.log('Botón CREAR TAREA: OCULTO (no es líder)');
                }
            }
            return esLider;
        }
        return false;
    } catch (error) {
        console.error('Error al verificar líder:', error);
        return false;
    }
}

// ============================================
// CARGAR TAREAS DEL EQUIPO
// ============================================
async function cargarTareas() {
    // Registrar actividad
    registrarActividad('ver_tareas', `Viendo tareas del equipo ${equipoId}`);
    
    const container = document.getElementById('tareasContainer');
    container.innerHTML = '<div class="sin-tareas"><i class="fas fa-spinner fa-pulse"></i> Cargando tareas...</div>';
    
    try {
        // Primero verificar si es líder (para el botón)
        await verificarLider();
        
        // Luego cargar las tareas
        const respuesta = await fetch(`/api/tareas/equipo/${equipoId}`);
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            mostrarTareas(resultado.tareas);
        } else {
            container.innerHTML = `<div class="sin-tareas"><i class="fas fa-exclamation-triangle"></i> Error: ${resultado.mensaje}</div>`;
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="sin-tareas"><i class="fas fa-wifi"></i> Error de conexión</div>';
    }
}

// ============================================
// MOSTRAR TAREAS
// ============================================
function mostrarTareas(tareas) {
    const container = document.getElementById('tareasContainer');
    
    if (tareas.length === 0) {
        container.innerHTML = '<div class="sin-tareas"><i class="fas fa-inbox"></i> No hay tareas en este equipo. Crea una para empezar.</div>';
        return;
    }
    
    container.innerHTML = tareas.map(tarea => {
        const fechaLimite = tarea.fecha_limite ? new Date(tarea.fecha_limite) : null;
        const hoy = new Date();
        const estaVencida = fechaLimite && fechaLimite < hoy;
        
        // Determinar si el usuario puede calificar o entregar
        const puedeCalificar = (tarea.lider_id === usuario._id);
        const puedeEntregar = !puedeCalificar && usuario.rol === 'alumno';
        
        return `
            <div class="tarea-card">
                <div class="tarea-titulo"><i class="fas fa-tasks"></i> Título: ${escapeHtml(tarea.titulo)}</div>
                <div class="tarea-descripcion"><i class="fas fa-align-left"></i> ${escapeHtml(tarea.descripcion || 'Sin descripción')}</div>
                <div class="tarea-meta">
                    <div class="tarea-fecha ${estaVencida ? 'vencida' : ''}">
                        <i class="fas fa-calendar-alt"></i> Fecha: ${tarea.fecha_limite ? formatearFecha(tarea.fecha_limite) : 'Sin fecha límite'}
                    </div>
                    <div class="tarea-creador"><i class="fas fa-user"></i> Creador: ${escapeHtml(tarea.creador_nombre)}</div>
                    <div class="entregas-badge"><i class="fas fa-paperclip"></i> ${tarea.total_entregas || 0} entregas</div>
                </div>
                <div class="tarea-acciones">
                    <button onclick="verDetalleTarea('${tarea._id}')" class="btn btn-ver-tarea"><i class="fas fa-eye"></i> Ver detalles</button>
                    
                    ${puedeEntregar ? 
                        `<button onclick="entregarTarea('${tarea._id}')" class="btn btn-entregar"><i class="fas fa-upload"></i> Entregar</button>` : ''}
                    
                    ${puedeCalificar ? 
                        `<button onclick="verEntregas('${tarea._id}')" class="btn btn-calificar"><i class="fas fa-star"></i> Calificar</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// VER DETALLE DE TAREA
// ============================================
function verDetalleTarea(tareaId) {
    window.location.href = `detalle_tarea.html?id=${tareaId}&equipo_id=${equipoId}`;
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
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    cargarTareas();
});