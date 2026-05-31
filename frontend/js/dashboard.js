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
            ? '<i class="fas fa-chalkboard-teacher"></i> Maestro / Líder de equipo' 
            : '<i class="fas fa-user-graduate"></i> Alumno / Miembro de equipo';
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
        const respuesta = await fetch(`/api/equipos/${usuario._id}`);
        const resultado = await respuesta.json();
        
        if (resultado.exito && resultado.equipos && resultado.equipos.length > 0) {
            const equiposMostrar = resultado.equipos.slice(0, 3);
            container.innerHTML = equiposMostrar.map(equipo => `
                <div class="equipo-item">
                    <span class="equipo-nombre"><i class="fas fa-tag"></i> ${escapeHtml(equipo.nombre)}</span>
                    <span class="equipo-rol"><i class="fas fa-users"></i> ${equipo.total_miembros || 0} miembros</span>
                </div>
            `).join('');
            
            if (resultado.equipos.length > 3) {
                container.innerHTML += `<div style="text-align: center; margin-top: 0.5rem; font-size: 0.8rem; color: #94a3b8;"><i class="fas fa-ellipsis-h"></i> +${resultado.equipos.length - 3} más</div>`;
            }
        } else {
            container.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-info-circle"></i> Aún no tienes equipos.<br>
                    <a href="pages/mis_equipos.html" style="color: #667eea;"><i class="fas fa-plus-circle"></i> Crear o unirse a uno</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar equipos:', error);
        container.innerHTML = '<div class="empty-message"><i class="fas fa-exclamation-triangle"></i> Error al cargar equipos</div>';
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
            const respuesta = await fetch(`/api/tareas/alumno/${usuario._id}`);
            const resultado = await respuesta.json();
            
            if (resultado.exito && resultado.tareas && resultado.tareas.length > 0) {
                const tareasMostrar = resultado.tareas.slice(0, 5);
                container.innerHTML = tareasMostrar.map(tarea => {
                    const esLiderDeEsteEquipo = tarea.lider_id === usuario._id;
                    
                    return `
                        <div class="tarea-pendiente-item">
                            <div class="tarea-pendiente-info">
                                <div class="tarea-pendiente-titulo"><i class="fas fa-tasks"></i> ${escapeHtml(tarea.titulo)}</div>
                                <div class="tarea-pendiente-equipo"><i class="fas fa-users"></i> ${escapeHtml(tarea.equipo_nombre)}</div>
                                ${tarea.fecha_limite ? `
                                    <div class="tarea-pendiente-fecha">
                                        <i class="fas fa-calendar-alt"></i> ${formatearFecha(tarea.fecha_limite)}
                                    </div>
                                ` : ''}
                            </div>
                            ${!esLiderDeEsteEquipo ? 
                                `<button onclick="entregarTareaDesdeDashboard('${tarea._id}', '${tarea.equipo_id}')" class="btn btn-entregar-pequeno"><i class="fas fa-upload"></i> Entregar</button>` : 
                                `<button onclick="verDetalleTareaLider('${tarea._id}', '${tarea.equipo_id}')" class="btn btn-ver-pequeno"><i class="fas fa-star"></i> Calificar</button>`
                            }                        
                        </div>
                    `;
                }).join('');
                
                if (resultado.tareas.length > 5) {
                    container.innerHTML += `<div class="ver-mas"><a href="pages/mis_equipos.html"><i class="fas fa-arrow-right"></i> Ver más tareas</a></div>`;
                }
            } else {
                container.innerHTML = '<div class="empty-message"><i class="fas fa-inbox"></i> No tienes tareas pendientes</div>';
            }
        } catch (error) {
            console.error('Error:', error);
            container.innerHTML = '<div class="empty-message"><i class="fas fa-exclamation-triangle"></i> Error al cargar tareas</div>';
        }
    } else {
        // Para líder/maestro
        try {
            const respuesta = await fetch(`/api/tareas/lider/${usuario._id}`);
            const resultado = await respuesta.json();
            
            if (resultado.exito && resultado.tareas && resultado.tareas.length > 0) {
                const tareasMostrar = resultado.tareas.slice(0, 5);
                container.innerHTML = tareasMostrar.map(tarea => `
                    <div class="tarea-pendiente-item">
                        <div class="tarea-pendiente-info">
                            <div class="tarea-pendiente-titulo"><i class="fas fa-tasks"></i> ${escapeHtml(tarea.titulo)}</div>
                            <div class="tarea-pendiente-equipo"><i class="fas fa-users"></i> ${escapeHtml(tarea.equipo_nombre)}</div>
                            <div class="tarea-pendiente-entregas"><i class="fas fa-paperclip"></i> Entregas: ${tarea.total_entregas || 0}</div>
                        </div>
                        <button onclick="verDetalleTareaLider('${tarea._id}', '${tarea.equipo_id}')" class="btn btn-ver-pequeno"><i class="fas fa-star"></i> Calificar</button>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<div class="empty-message"><i class="fas fa-inbox"></i> No hay tareas recientes en tus equipos</div>';
            }
        } catch (error) {
            console.error('Error:', error);
            container.innerHTML = '<div class="empty-message"><i class="fas fa-exclamation-triangle"></i> Error al cargar tareas</div>';
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
// CARGAR ESTADÍSTICAS
// ============================================
function cargarEstadisticas() {
    const completadas = 5;
    const pendientes = 3;
    const vencidas = 1;
    const total = completadas + pendientes + vencidas;
    
    document.getElementById('tareasCompletadas').innerHTML = `<i class="fas fa-check-circle" style="color: #10b981;"></i> ${completadas}`;
    document.getElementById('tareasPendientesEstadisticas').innerHTML = `<i class="fas fa-hourglass-half" style="color: #f59e0b;"></i> ${pendientes}`;
    document.getElementById('tareasVencidas').innerHTML = `<i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i> ${vencidas}`;
    document.getElementById('totalTareas').innerHTML = `${total}`;
    
    const porcentajeCompletadas = total > 0 ? (completadas / total) * 100 : 0;
    const porcentajePendientes = total > 0 ? (pendientes / total) * 100 : 0;
    const porcentajeVencidas = total > 0 ? (vencidas / total) * 100 : 0;
    
    document.getElementById('progresoCompletadas').style.width = `${porcentajeCompletadas}%`;
    document.getElementById('progresoPendientes').style.width = `${porcentajePendientes}%`;
    document.getElementById('progresoVencidas').style.width = `${porcentajeVencidas}%`;
}

// ============================================
// CARGAR ACTIVIDAD RECIENTE
// ============================================
function cargarActividadReciente() {
    const container = document.getElementById('actividadLista');
    
    const actividades = [
        { texto: "Completaste la tarea 'Reporte semanal'", fecha: "Hace 2 horas", icono: '<i class="fas fa-check-circle" style="color: #10b981;"></i>' },
        { texto: "Nueva tarea asignada: 'Validar entregas'", fecha: "Hace 1 día", icono: '<i class="fas fa-plus-circle" style="color: #f59e0b;"></i>' },
        { texto: "Te uniste al equipo 'Equipo Verde'", fecha: "Hace 2 días", icono: '<i class="fas fa-user-plus" style="color: #667eea;"></i>' }
    ];
    
    container.innerHTML = actividades.map(act => `
        <div class="actividad-item">
            <div class="actividad-icono">${act.icono}</div>
            <div class="actividad-texto">${act.texto}</div>
            <div class="actividad-fecha"><i class="fas fa-clock"></i> ${act.fecha}</div>
        </div>
    `).join('');
}

// ============================================
// GRÁFICA DE TAREAS (Chart.js)
// ============================================
let graficaTareas = null;

function inicializarGrafica() {
    const ctx = document.getElementById('graficaTareas').getContext('2d');
    
    graficaTareas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Tarea 1', 'Tarea 2', 'Tarea 3', 'Tarea 4', 'Tarea 5'],
            datasets: [{
                label: 'Calificaciones',
                data: [85, 92, 78, 95, 88],
                backgroundColor: 'rgba(102, 126, 234, 0.7)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Calificación: ${context.raw}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Calificación (%)' }
                },
                x: {
                    title: { display: true, text: 'Tareas' }
                }
            }
        }
    });
}

// ============================================
// EXPORTAR GRÁFICA COMO PNG
// ============================================
function exportarGrafica() {
    const canvas = document.getElementById('graficaTareas');
    const link = document.createElement('a');
    link.download = 'grafica_tareas.png';
    link.href = canvas.toDataURL();
    link.click();
}

// ============================================
// GENERAR REPORTE
// ============================================
function generarReporte() {
    const reporte = `
REPORTE DE TAREAS - ${new Date().toLocaleDateString('es-MX')}
========================================

[RESUMEN DE TAREAS]
- Tareas completadas: 5
- Tareas pendientes: 3
- Tareas vencidas: 1

[DETALLE DE TAREAS]
- Tarea 1: 85% (Completada)
- Tarea 2: 92% (Completada)
- Tarea 3: 78% (Pendiente)
- Tarea 4: 95% (Completada)
- Tarea 5: 88% (Completada)

[PROMEDIO GENERAL]
Promedio: 87.6%

Generado: ${new Date().toLocaleString('es-MX')}
    `;
    
    const blob = new Blob([reporte], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = `reporte_tareas_${new Date().toISOString().slice(0,10)}.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    
    alert('📄 Reporte generado y descargado');
}

// ============================================
// INICIALIZAR DASHBOARD
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    mostrarInfoUsuario();
    cargarEquipos();
    cargarTareasPendientes();
    cargarEstadisticas();
    cargarActividadReciente();
    inicializarGrafica();
});