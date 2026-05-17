// ============================================
// ARCHIVO: equipo-detalle.js
// Muestra información detallada de un equipo
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
            container.innerHTML = `<div class="sin-equipos">Error: ${resultado.mensaje}</div>`;
        }
    } catch (error) {
        container.innerHTML = '<div class="sin-equipos">Error de conexión</div>';
    }
}

// ============================================
// MOSTRAR EQUIPO EN PANTALLA
// ============================================
function mostrarEquipo(equipo) {
    const container = document.getElementById('equipoContent');
    const esLider = usuario.id === equipo.lider_id;
    
    container.innerHTML = `
        <!-- Info del equipo -->
        <div class="info-equipo">
            <div class="nombre-equipo">Equipo: ${escapeHtml(equipo.nombre)}</div>
            <div class="descripcion-equipo">${escapeHtml(equipo.descripcion || 'Sin descripción')}</div>
            <div class="meta-equipo">
                <div class="meta-item">Miembros: ${equipo.total_miembros} miembros</div>
                <div class="meta-item">Líder: ${escapeHtml(equipo.lider_nombre)}</div>
                <div class="meta-item">Creado: ${formatearFecha(equipo.fecha_creacion)}</div>
            </div>
        </div>
        
        <!-- Lista de miembros -->
        <div class="miembros-section">
            <div class="miembros-header">
                <h3>Miembros del equipo (${equipo.miembros.length})</h3>
            </div>
            <div class="lista-miembros">
                ${equipo.miembros.map(miembro => `
                    <div class="miembro-item">
                        <div class="miembro-info">
                            <div class="miembro-avatar">${miembro.nombre.charAt(0).toUpperCase()}</div>
                            <div>
                                <div class="miembro-nombre">${escapeHtml(miembro.nombre)}</div>
                                <div class="miembro-rol">${miembro.email}</div>
                            </div>
                        </div>
                        ${equipo.lider_id === miembro.id ? '<span class="rol-lider">Líder</span>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        
<!-- Acciones del equipo -->
<div class="acciones-equipo" style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
    <!-- Chat visible para TODOS los miembros -->
    <button class="btn primario" onclick="abrirChat()">💬 Chat del equipo</button>
    
    ${esLider ? `
        <button class="btn primario" onclick="abrirModalAgregar()">➕ Invitar miembros</button>
    ` : ''}
    
    ${!esLider && usuario.rol === 'alumno' ? `
        <button class="btn btn-salir" onclick="confirmarSalirEquipoDetalle(${equipo.id}, '${escapeHtml(equipo.nombre)}')">🚪 Salir del equipo</button>
    ` : ''}
</div>    
`;
    
    // Guardar código del equipo para el modal
    window.equipoIdActual = equipo.id;
}

// ============================================
// ABRIR MODAL CON CÓDIGO DEL EQUIPO
// ============================================
function abrirModalAgregar() {
    const modal = document.getElementById('modalAgregar');
    const codigoSpan = document.getElementById('equipoIdCodigo');
    if (codigoSpan) {
        codigoSpan.textContent = window.equipoIdActual;
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
            body: JSON.stringify({ usuario_id: usuario.id })
        });
        
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            alert('Has salido del equipo');
            window.location.href = 'mis_equipos.html';
        } else {
            alert('Error' + resultado.mensaje);
        }
    } catch (error) {
        alert('Error de conexión');
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