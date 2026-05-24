// ============================================
// ARCHIVO: entregas-tarea.js
// Lógica para ver y calificar entregas (CON ARCHIVOS)
// ============================================

const usuario = JSON.parse(localStorage.getItem('usuario'));

// Verificar sesión
if (!usuario) {
    window.location.href = '../iniciar_sesion.html';
}

// Obtener ID de la tarea de la URL
const urlParams = new URLSearchParams(window.location.search);
const tareaId = urlParams.get('tarea_id');

if (!tareaId) {
    window.location.href = 'mis_equipos.html';
}

let equipoIdActual = null;

// ============================================
// MOSTRAR MENSAJE
// ============================================
function mostrarMensaje(tipo, texto) {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.textContent = tipo === 'exito' ? `✅ ${texto}` : `❌ ${texto}`;
    mensajeDiv.style.display = 'block';
    setTimeout(() => {
        mensajeDiv.style.display = 'none';
    }, 3000);
}

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
    if (!fecha) return 'Fecha no disponible';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX') + ' ' + d.toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'});
}

// ============================================
// CARGAR INFORMACIÓN DE LA TAREA Y ENTREGAS
// ============================================
async function cargarDatos() {
    const infoContainer = document.getElementById('infoTarea');
    const entregasContainer = document.getElementById('entregasContainer');
    
    try {
        const respuesta = await fetch(`/api/tareas/detalle/${tareaId}`);
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            const tarea = resultado.tarea;
            equipoIdActual = tarea.equipo_id;
            
            // Mostrar información de la tarea
            infoContainer.innerHTML = `
                <h3>📋 ${escapeHtml(tarea.titulo)}</h3>
                <div class="tarea-desc">${escapeHtml(tarea.descripcion || 'Sin descripción')}</div>
                <div class="tarea-meta">
                    <span>👤 Creada por: ${escapeHtml(tarea.creador_nombre)}</span>
                    <span>🏷️ Equipo: ${escapeHtml(tarea.equipo_nombre)}</span>
                    <span>📅 Fecha límite: ${tarea.fecha_limite || 'Sin fecha'}</span>
                </div>
            `;
            
            // Mostrar entregas
            const entregas = tarea.entregas || [];
            
            if (entregas.length === 0) {
                entregasContainer.innerHTML = '<div class="sin-entregas">📭 Aún no hay entregas para esta tarea.</div>';
            } else {
                entregasContainer.innerHTML = entregas.map(entrega => `
                    <div class="entrega-card" id="entrega-${entrega.id}">
                        <div class="entrega-header">
                            <div class="entrega-alumno">
                                👨‍🎓 <strong>${escapeHtml(entrega.alumno_nombre)}</strong>
                            </div>
                            <div class="entrega-fecha">
                                📅 Entregado: ${formatearFecha(entrega.fecha_entrega)}
                            </div>
                        </div>
                        <div class="entrega-body">
                            <div class="entrega-comentario">
                                💬 <strong>Comentario:</strong><br>
                                ${escapeHtml(entrega.comentario || 'Sin comentario')}
                            </div>
                            <!-- ============================================ -->
                            <!-- SOLUCIÓN 3: Mostrar enlace al archivo adjunto -->
                            <!-- ============================================ -->
                            <div class="entrega-archivo">
                                ${entrega.archivo ? 
                                    `📎 <a href="/${entrega.archivo}" target="_blank">Ver archivo adjunto: ${escapeHtml(entrega.nombre_archivo || 'archivo')}</a>` : 
                                    '📎 Sin archivo adjunto'}
                            </div>
                            <div class="entrega-calificacion">
                                ${entrega.calificacion !== null ? `
                                    <span class="calificacion-actual">⭐ Calificación actual: ${entrega.calificacion}/100</span>
                                    <label>Nueva calificación:</label>
                                    <input type="number" id="calif-${entrega.id}" min="0" max="100" value="${entrega.calificacion}" placeholder="0-100">
                                ` : `
                                    <label>⭐ Calificación (0-100):</label>
                                    <input type="number" id="calif-${entrega.id}" min="0" max="100" placeholder="Ej: 85">
                                `}
                                <button onclick="calificarEntrega(${entrega.id})" class="btn btn-calificar-entrega">Guardar calificación</button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            infoContainer.innerHTML = `<div class="sin-entregas">Error: ${resultado.mensaje}</div>`;
            entregasContainer.innerHTML = '';
        }
    } catch (error) {
        console.error('Error:', error);
        infoContainer.innerHTML = '<div class="sin-entregas">Error de conexión</div>';
        entregasContainer.innerHTML = '';
    }
}

// ============================================
// CALIFICAR ENTREGA
// ============================================
async function calificarEntrega(entregaId) {
    const input = document.getElementById(`calif-${entregaId}`);
    const calificacion = parseInt(input.value);
    
    if (isNaN(calificacion) || calificacion < 0 || calificacion > 100) {
        mostrarMensaje('error', 'La calificación debe ser un número entre 0 y 100');
        return;
    }
    
    try {
        const respuesta = await fetch('/api/entregas/calificar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                entrega_id: entregaId,
                calificacion: calificacion
            })
        });
        
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            mostrarMensaje('exito', 'Calificación guardada correctamente');
            setTimeout(() => {
                cargarDatos();
            }, 500);
        } else {
            mostrarMensaje('error', resultado.mensaje);
        }
    } catch (error) {
        mostrarMensaje('error', 'Error de conexión');
    }
}

// ============================================
// INICIALIZAR
// ============================================
cargarDatos();