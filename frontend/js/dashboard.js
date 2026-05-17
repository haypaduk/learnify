// ============================================
// ARCHIVO: dashboard.js
// Lógica del dashboard principal
// ============================================

const usuario = JSON.parse(localStorage.getItem('usuario'));

// Verificar sesión
if (!usuario) {
    window.location.href = 'iniciar_sesion.html';
}

// ============================================
// FORMATEAR FECHA
// ============================================
function formatearFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX');
}

// ============================================
// MOSTRAR INFORMACIÓN DEL USUARIO
// ============================================
function mostrarInfoUsuario() {
    const nombreElemento = document.getElementById('usuarioNombre');
    const rolElemento = document.getElementById('usuarioRol');
    
    if (nombreElemento) {
        nombreElemento.textContent = usuario.nombre;
    }
    
    if (rolElemento) {
        rolElemento.innerHTML = usuario.rol === 'maestro' 
            ? '👨‍🏫 Maestro / Líder de equipo' 
            : '👨‍🎓 Alumno / Miembro de equipo';
    }
}

// ============================================
// ESCAPAR HTML (seguridad)
// ============================================
function escapeHtml(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// ============================================
// CARGAR EQUIPOS DEL USUARIO
// ============================================
async function cargarEquipos() {
    const container = document.getElementById('equiposLista');
    
    if (!container) return;
    
    try {
        const respuesta = await fetch(`/api/equipos/${usuario.id}`);
        const resultado = await respuesta.json();
        
        if (resultado.exito && resultado.equipos && resultado.equipos.length > 0) {
            const equiposMostrar = resultado.equipos.slice(0, 3);
            container.innerHTML = equiposMostrar.map(equipo => `
                <div class="equipo-item">
                    <span class="equipo-nombre">Equipo: ${escapeHtml(equipo.nombre)}</span>
                    <span class="equipo-rol">${equipo.total_miembros || 0} miembros</span>
                </div>
            `).join('');
            
            if (resultado.equipos.length > 3) {
                container.innerHTML += `<div style="text-align: center; margin-top: 0.5rem; font-size: 0.8rem; color: #94a3b8;">+${resultado.equipos.length - 3} más</div>`;
            }
        } else {
            container.innerHTML = `
                <div class="empty-message">
                    Aún no tienes equipos.<br>
                    <a href="pages/mis_equipos.html" style="color: #667eea;">Crear o unirse a uno</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar equipos:', error);
        container.innerHTML = '<div class="empty-message">Error al cargar equipos</div>';
    }
}

// ============================================
// CARGAR TAREAS PENDIENTES
// ============================================
async function cargarTareasPendientes() {
    const container = document.getElementById('tareasPendientesLista');
    
    if (!container) return;
    
    if (usuario.rol === 'alumno') {
        try {
            const respuesta = await fetch(`/api/tareas/alumno/${usuario.id}`);
            const resultado = await respuesta.json();
            
            if (resultado.exito && resultado.tareas && resultado.tareas.length > 0) {
                const tareasMostrar = resultado.tareas.slice(0, 5);
                container.innerHTML = tareasMostrar.map(tarea => `
                    <div class="tarea-pendiente-item">
                        <div class="tarea-pendiente-info">
                            <div class="tarea-pendiente-titulo">Titulo: ${escapeHtml(tarea.titulo)}</div>
                            <div class="tarea-pendiente-equipo">Nombre: ${escapeHtml(tarea.equipo_nombre)}</div>
                            ${tarea.fecha_limite ? `
                                <div class="tarea-pendiente-fecha ${tarea.estado_tarea === 'vencida' ? 'vencida' : ''}">
                                    Fecha: ${formatearFecha(tarea.fecha_limite)}
                                </div>
                            ` : ''}
                        </div>
                        <button onclick="entregarTareaDesdeDashboard(${tarea.id}, ${tarea.equipo_id})" class="btn btn-entregar-pequeno">Entregar</button>
                    </div>
                `).join('');
                
                if (resultado.tareas.length > 5) {
                    container.innerHTML += `<div class="ver-mas"><a href="pages/mis_equipos.html">Ver más tareas →</a></div>`;
                }
            } else {
                container.innerHTML = '<div class="empty-message">No tienes tareas pendientes</div>';
            }
        } catch (error) {
            container.innerHTML = '<div class="empty-message">Error al cargar tareas</div>';
        }
    } else {
        // Para líder/maestro
        try {
            const respuesta = await fetch(`/api/tareas/lider/${usuario.id}`);
            const resultado = await respuesta.json();
            
            if (resultado.exito && resultado.tareas && resultado.tareas.length > 0) {
                const tareasMostrar = resultado.tareas.slice(0, 5);
                container.innerHTML = tareasMostrar.map(tarea => `
                    <div class="tarea-pendiente-item">
                        <div class="tarea-pendiente-info">
                            <div class="tarea-pendiente-titulo">Titulo: ${escapeHtml(tarea.titulo)}</div>
                            <div class="tarea-pendiente-equipo">Nombre: ${escapeHtml(tarea.equipo_nombre)}</div>
                            <div class="tarea-pendiente-entregas">Entrego: ${tarea.total_entregas || 0} entregas</div>
                        </div>
                        <button onclick="verDetalleTareaLider(${tarea.id}, ${tarea.equipo_id})" class="btn btn-ver-pequeno">Ver</button>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<div class="empty-message">No hay tareas recientes en tus equipos</div>';
            }
        } catch (error) {
            container.innerHTML = '<div class="empty-message">Error al cargar tareas</div>';
        }
    }
}

// ============================================
// ENTREGAR TAREA DESDE DASHBOARD
// ============================================
function entregarTareaDesdeDashboard(tareaId, equipoId) {
    window.location.href = `pages/entregar_tarea.html?tarea_id=${tareaId}&equipo_id=${equipoId}`;
}

// ============================================
// VER DETALLE TAREA (para líder)
// ============================================
function verDetalleTareaLider(tareaId, equipoId) {
    window.location.href = `pages/detalle_tarea.html?id=${tareaId}&equipo_id=${equipoId}`;
}

// ============================================
// CERRAR SESIÓN
// ============================================
function cerrarSesion() {
    localStorage.removeItem('usuario');
    window.location.href = 'bienvenida.html';
}

// ============================================
// INICIALIZAR DASHBOARD
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    mostrarInfoUsuario();
    cargarEquipos();
    cargarTareasPendientes();
});