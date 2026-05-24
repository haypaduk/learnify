// ============================================
// ARCHIVO 27/30: detalle-tarea.js
// Muestra información completa de una tarea
// ============================================

const usuario = JSON.parse(localStorage.getItem('usuario'));

// Verificar sesión
if (!usuario) {
    window.location.href = '../iniciar_sesion.html';
}

// Obtener ID de la tarea de la URL
const urlParams = new URLSearchParams(window.location.search);
const tareaId = urlParams.get('id');
const equipoId = urlParams.get('equipo_id');

if (!tareaId) {
    window.location.href = 'mis_equipos.html';
}

// ============================================
// CACHÉ PARA ENTREGAS (usado en el modal)
// ============================================
let entregasCache = null;

// ============================================
// ESCAPAR HTML
// ============================================
function escapeHtml(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// ============================================
// FORMATEAR FECHA
// ============================================
function formatearFecha(fecha) {
    if (!fecha) return 'Sin fecha';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX');
}

function formatearFechaCompleta(fecha) {
    if (!fecha) return 'Sin fecha';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX') + ' ' + d.toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'});
}

// ============================================
// CARGAR DETALLE DE LA TAREA
// ============================================
async function cargarDetalle() {
    const container = document.getElementById('tareaContent');
    
    try {
        const respuesta = await fetch(`/api/tareas/detalle/${tareaId}`);
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            mostrarDetalle(resultado.tarea);
        } else {
            container.innerHTML = `<div class="sin-entregas">Error: ${resultado.mensaje}</div>`;
        }
    } catch (error) {
        container.innerHTML = '<div class="sin-entregas">Error de conexión</div>';
    }
}

// ============================================
// MOSTRAR DETALLE
// ============================================
function mostrarDetalle(tarea) {
    const container = document.getElementById('tareaContent');
    const esLider = usuario.rol === 'maestro' || tarea.creador_id === usuario.id;
    const esAlumno = usuario.rol === 'alumno';
    
    // Guardar entregas en caché para el modal
    entregasCache = tarea.entregas || [];
    
    // Buscar mi entrega (si soy alumno)
    const miEntrega = esAlumno ? entregasCache.find(e => e.alumno_id === usuario.id) : null;
    
    let miEntregaHtml = '';
    if (esAlumno) {
        if (miEntrega) {
            miEntregaHtml = `
                <div class="mi-entrega">
                    <div class="mi-entrega-header">
                        <h3>📤 Mi entrega</h3>
                    </div>
                    <div class="mi-entrega-body">
                        <div class="entrega-info">
                            <strong>📅 Entregado:</strong> ${formatearFechaCompleta(miEntrega.fecha_entrega)}
                            ${miEntrega.comentario ? `
                                <div class="entrega-comentario-texto">
                                    <strong>💬 Comentario:</strong><br>
                                    ${escapeHtml(miEntrega.comentario)}
                                </div>
                            ` : ''}
                            ${miEntrega.archivo ? `
                                <div class="entrega-archivo" style="margin-top: 10px; padding: 8px; background: #f1f5f9; border-radius: 8px;">
                                    📎 <a href="/${miEntrega.archivo}" target="_blank">Ver archivo adjunto: ${escapeHtml(miEntrega.nombre_archivo || 'archivo')}</a>
                                </div>
                            ` : '<div class="entrega-archivo" style="margin-top: 10px;">📎 Sin archivo adjunto</div>'}
                            ${miEntrega.calificacion !== null ? `
                                <div class="entrega-calificacion-mostrada">
                                    ⭐ Calificación: ${miEntrega.calificacion}/100
                                </div>
                            ` : `
                                <div class="entrega-calificacion-mostrada" style="color: #f59e0b;">
                                    ⏳ Pendiente de calificar
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;
        } else {
            miEntregaHtml = `
                <div class="mi-entrega">
                    <div class="mi-entrega-header">
                        <h3>📤 Mi entrega</h3>
                    </div>
                    <div class="mi-entrega-body">
                        <div class="sin-entrega">
                            📭 Aún no has entregado esta tarea.
                        </div>
                        <div class="acciones-tarea">
                            <button onclick="entregarTarea()" class="btn btn-entregar-ahora">📤 Entregar ahora</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }    
    
    // Lista de entregas (para líder)
    let entregasHtml = '';
    if (esLider && entregasCache.length > 0) {
        entregasHtml = `
            <div class="entregas-lista-detalle">
                <h3>Entregas de alumnos (${entregasCache.length})</h3>
                ${entregasCache.map(entrega => `
                    <div class="entrega-item-detalle">
                        <div class="entrega-alumno-info">
                            <span class="entrega-alumno-nombre">Alumno: ${escapeHtml(entrega.alumno_nombre)}</span>
                            ${entrega.calificacion !== null ? 
                                `<span class="entrega-status entregado">Calificación: ${entrega.calificacion}/100</span>` : 
                                `<span class="entrega-status no-entregado">Sin calificar</span>`
                            }
                        </div>
                        <button onclick="verEntrega(${entrega.id})" class="btn btn-ver-entrega">Ver entrega</button>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (esLider) {
        entregasHtml = `
            <div class="entregas-lista-detalle">
                <h3>Entregas de alumnos</h3>
                <div class="sin-entrega">Aún no hay entregas para esta tarea.</div>
            </div>
        `;
    }
    
    container.innerHTML = `
        <!-- Información principal -->
        <div class="tarea-info-principal">
            <div class="tarea-titulo-grande">Titulo: ${escapeHtml(tarea.titulo)}</div>
            <div class="tarea-descripcion-completa">${escapeHtml(tarea.descripcion || 'Sin descripción')}</div>
            <div class="tarea-metadatos">
                <div class="metadato">Creada por: ${escapeHtml(tarea.creador_nombre)}</div>
                <div class="metadato">Equipo: ${escapeHtml(tarea.equipo_nombre)}</div>
                <div class="metadato">Fecha límite: ${tarea.fecha_limite || 'Sin fecha límite'}</div>
            </div>
        </div>
        
        ${miEntregaHtml}
        
        ${entregasHtml}
        
        ${esLider ? `
            <div class="acciones-tarea" style="margin-top: 2rem;">
                <button onclick="verTodasEntregas()" class="btn primario">Ver todas las entregas</button>
            </div>
        ` : ''}
    `;
}

// ============================================
// ENTREGAR TAREA
// ============================================
function entregarTarea() {
    window.location.href = `entregar_tarea.html?tarea_id=${tareaId}&equipo_id=${equipoId || ''}`;
}

// ============================================
// VER ENTREGA (mostrar modal)
// ============================================
function verEntrega(entregaId) {
    if (!entregasCache) return;
    
    const entrega = entregasCache.find(e => e.id === entregaId);
    if (!entrega) return;
    
    const modal = document.getElementById('modalVerEntrega');
    const content = document.getElementById('modalEntregaContent');
    
    content.innerHTML = `
        <p><strong>👨‍🎓 Alumno:</strong> ${escapeHtml(entrega.alumno_nombre)}</p>
        <p><strong>📅 Entregado:</strong> ${formatearFechaCompleta(entrega.fecha_entrega)}</p>
        <p><strong>💬 Comentario:</strong><br>${escapeHtml(entrega.comentario || 'Sin comentario')}</p>
        ${entrega.archivo ? 
            `<p>📎 <a href="/${entrega.archivo}" target="_blank">Ver archivo adjunto</a></p>` : 
            '<p>📎 Sin archivo adjunto</p>'}
        ${entrega.calificacion !== null ? 
            `<p>⭐ Calificación: ${entrega.calificacion}/100</p>` : 
            '<p>⏳ Pendiente de calificar</p>'}
    `;
    
    modal.style.display = 'flex';
}

// ============================================
// CERRAR MODAL
// ============================================
function cerrarModalEntrega() {
    const modal = document.getElementById('modalVerEntrega');
    if (modal) modal.style.display = 'none';
}

// ============================================
// VER TODAS LAS ENTREGAS
// ============================================
function verTodasEntregas() {
    window.location.href = `entregas_tarea.html?tarea_id=${tareaId}`;
}

// ============================================
// INICIALIZAR
// ============================================
cargarDetalle();