// ============================================
// ARCHIVO: equipo-detalle.js
// Muestra información detallada de un equipo (MongoDB)
// ============================================

const usuario = JSON.parse(localStorage.getItem('usuario'));

// Verificar sesión
if (!usuario) {
    window.location.href = 'iniciar_sesion.html';
}

// Obtener ID del equipo de la URL
const urlParams = new URLSearchParams(window.location.search);
const equipoId = urlParams.get('id');

if (!equipoId) {
    window.location.href = 'mis_equipos.html';
}

// ============================================
// CARGAR DATOS DEL EQUIPO
// ============================================
async function cargarEquipo() {
    const container = document.getElementById('equipoContent');
    
    try {
        const respuesta = await fetch(`/api/equipos/detalle/${equipoId}`);
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            mostrarEquipo(resultado.equipo);
        } else {
            container.innerHTML = `<div class="sin-equipos"><i class="fas fa-exclamation-triangle"></i> Error: ${resultado.mensaje}</div>`;
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="sin-equipos"><i class="fas fa-wifi"></i> Error de conexión</div>';
    }
}

// ============================================
// MOSTRAR EQUIPO EN PANTALLA
// ============================================
function mostrarEquipo(equipo) {
    console.log('Equipo completo recibido:', equipo);
    const container = document.getElementById('equipoContent');
    // CAMBIO: usuario.id → usuario._id
    const esLider = usuario._id === equipo.lider_id;
    
    container.innerHTML = `
        <!-- Info del equipo -->
        <div class="info-equipo">
            <div class="nombre-equipo"><i class="fas fa-tag"></i> Equipo: ${escapeHtml(equipo.nombre)}</div>
            <div class="descripcion-equipo"><i class="fas fa-align-left"></i> ${escapeHtml(equipo.descripcion || 'Sin descripción')}</div>
            <div class="meta-equipo">
                <div class="meta-item"><i class="fas fa-users"></i> Miembros: ${equipo.total_miembros} miembros</div>
                <div class="meta-item"><i class="fas fa-crown"></i> Líder: ${escapeHtml(equipo.lider_nombre)}</div>
                <div class="meta-item"><i class="fas fa-calendar-alt"></i> Creado: ${formatearFecha(equipo.fecha_creacion)}</div>
            </div>
        </div>
        
        <!-- Lista de miembros -->
        <div class="miembros-section">
            <div class="miembros-header">
                <h3><i class="fas fa-user-friends"></i> Miembros del equipo (${equipo.miembros.length})</h3>
            </div>
            <div class="lista-miembros">
                ${equipo.miembros.map(miembro => `
                    <div class="miembro-item">
                        <div class="miembro-info">
                            <div class="miembro-avatar"><i class="fas fa-user-circle"></i></div>
                            <div>
                                <div class="miembro-nombre">${escapeHtml(miembro.nombre)}</div>
                                <div class="miembro-rol"><i class="fas fa-envelope"></i> ${miembro.email}</div>
                            </div>
                        </div>
                        ${equipo.lider_id === miembro.id ? '<span class="rol-lider"><i class="fas fa-crown"></i> Líder</span>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Acciones del equipo -->
        <div class="acciones-equipo" style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
            <button class="btn primario" onclick="abrirChat()"><i class="fas fa-comments"></i> Chat del equipo</button>
            ${esLider ? `
                <button class="btn primario" onclick="abrirModalAgregar()"><i class="fas fa-user-plus"></i> Invitar miembros</button>
            ` : ''}
            ${!esLider && usuario.rol === 'alumno' ? `
                <button class="btn btn-salir" onclick="confirmarSalirEquipoDetalle('${equipo.id}', '${escapeHtml(equipo.nombre)}')"><i class="fas fa-sign-out-alt"></i> Salir del equipo</button>
            ` : ''}
        </div>
    `;
    
    // Guardar código del equipo para el modal
    window.equipoIdActual = equipo.id;
    console.log('ID guardado en window.equipoIdActual:', window.equipoIdActual);
}

// ============================================
// ABRIR MODAL CON CÓDIGO DEL EQUIPO
// ============================================
function abrirModalAgregar() {
    console.log('Abriendo modal, ID actual:', window.equipoIdActual);
    const modal = document.getElementById('modalAgregar');
    const codigoSpan = document.getElementById('equipoIdCodigo');
    console.log('Elemento codigoSpan encontrado:', codigoSpan);
    if (codigoSpan) {
        codigoSpan.innerHTML = `<i class="fas fa-key"></i> ${window.equipoIdActual}`;
        console.log('Texto asignado:', codigoSpan.innerHTML);
    }
    modal.style.display = 'flex';
}

function cerrarModal() {
    const modal = document.getElementById('modalAgregar');
    modal.style.display = 'none';
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
    if (!fecha) return 'Fecha no disponible';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX');
}

// ============================================
// CONFIRMAR SALIR DEL EQUIPO (desde detalle)
// ============================================
function confirmarSalirEquipoDetalle(equipoId, equipoNombre) {
    if (confirm(`¿Estás seguro de que quieres salir del equipo "${equipoNombre}"?`)) {
        salirDelEquipoDetalle(equipoId);
    }
}

// ============================================
// SALIR DEL EQUIPO (desde detalle)
// ============================================
async function salirDelEquipoDetalle(equipoId) {
    try {
        const respuesta = await fetch(`/api/equipos/salir/${equipoId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuario._id })
        });
        
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            alert('✅ Has salido del equipo');
            window.location.href = 'mis_equipos.html';
        } else {
            alert('❌ Error: ' + resultado.mensaje);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión');
    }
}

// ============================================
// ABRIR CHAT
// ============================================
function abrirChat() {
    window.location.href = `chat_equipo.html?equipo_id=${equipoId}`;
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    cargarEquipo();
});