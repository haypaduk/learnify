// ============================================
// ARCHIVO: duales.js
// Lógica para gestionar Duales
// ============================================

const usuario = JSON.parse(localStorage.getItem('usuario'));

if (!usuario) {
    window.location.href = '../../iniciar_sesion.html';
}

let dualesCache = [];
let dualIdAEliminar = null;

// Elementos del modal
const modalConfirmar = document.getElementById('modalConfirmar');
const btnCancelarEliminar = document.getElementById('btnCancelarEliminar');
const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');

// ============================================
// CARGAR DUALES DEL USUARIO (API REAL)
// ============================================
async function cargarDuales() {
    const container = document.getElementById('dualesContainer');
    container.innerHTML = '<div class="sin-duales"><i class="fas fa-spinner fa-pulse"></i> Cargando duales...</div>';
    
    try {
        const respuesta = await fetch(`/api/duales/${usuario._id}`);
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            dualesCache = resultado.duales;
            mostrarDuales(dualesCache);
        } else {
            container.innerHTML = `<div class="sin-duales"><i class="fas fa-exclamation-triangle"></i> ${resultado.mensaje}</div>`;
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="sin-duales"><i class="fas fa-exclamation-triangle"></i> Error al cargar duales</div>';
    }
}

// ============================================
// MOSTRAR DUALES
// ============================================
function mostrarDuales(duales) {
    const container = document.getElementById('dualesContainer');
    
    if (duales.length === 0) {
        container.innerHTML = `
            <div class="sin-duales">
                <i class="fas fa-briefcase fa-3x" style="color: #94a3b8; margin-bottom: 1rem; display: block;"></i>
                No tienes duales registrados.<br>
                <button id="btnCrearVacio" class="btn primario" style="margin-top: 1rem;">
                    <i class="fas fa-plus-circle"></i> Registrar tu primer dual
                </button>
            </div>
        `;
        
        const btnVacio = document.getElementById('btnCrearVacio');
        if (btnVacio) {
            btnVacio.onclick = () => window.location.href = 'crear_dual.html';
        }
        return;
    }
    
    container.innerHTML = duales.map(dual => {
        let estadoClass = '';
        let estadoText = '';
        let estadoIcono = '';
        
        switch(dual.estado) {
            case 'activo':
                estadoClass = 'estado-activo';
                estadoText = 'Activo';
                estadoIcono = '<i class="fas fa-play-circle"></i>';
                break;
            case 'pendiente':
                estadoClass = 'estado-pendiente';
                estadoText = 'Pendiente';
                estadoIcono = '<i class="fas fa-clock"></i>';
                break;
            case 'finalizado':
                estadoClass = 'estado-finalizado';
                estadoText = 'Finalizado';
                estadoIcono = '<i class="fas fa-check-circle"></i>';
                break;
            default:
                estadoClass = 'estado-pendiente';
                estadoText = dual.estado;
                estadoIcono = '<i class="fas fa-clock"></i>';
        }
        
        return `
            <div class="dual-card ${dual.estado === 'activo' ? 'activo' : ''}">
                <div class="dual-titulo"><i class="fas fa-bullseye"></i> ${escapeHtml(dual.titulo)}</div>
                <div class="dual-empresa"><i class="fas fa-building"></i> ${escapeHtml(dual.empresa)}</div>
                <div class="dual-fechas">
                    <span><i class="fas fa-calendar-alt"></i> Inicio: ${formatearFecha(dual.fecha_inicio)}</span>
                    <span><i class="fas fa-calendar-check"></i> Fin: ${formatearFecha(dual.fecha_fin)}</span>
                </div>
                <div class="dual-fechas">
                    <span><i class="fas fa-clock"></i> Horas: ${dual.horas}</span>
                    <span><i class="fas fa-chalkboard-user"></i> Tutor: ${escapeHtml(dual.tutor)}</span>
                </div>
                <span class="dual-estado ${estadoClass}">${estadoIcono} ${estadoText}</span>
                <div class="dual-acciones">
                    <button onclick="verDetalleDual('${dual._id}')" class="btn-ver-dual">
                        <i class="fas fa-eye"></i> Ver detalles
                    </button>
                    ${dual.estado !== 'finalizado' ? `
                        <button onclick="editarDual('${dual._id}')" class="btn-editar-dual">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    ` : ''}
                    <button onclick="mostrarModalEliminarDual('${dual._id}')" class="btn-eliminar-dual">
                        <i class="fas fa-trash-alt"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// MOSTRAR MENSAJE
// ============================================
function mostrarMensaje(tipo, texto) {
    const mensajeDiv = document.getElementById('mensaje');
    if (!mensajeDiv) return;
    
    const icono = tipo === 'exito' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-triangle"></i>';
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.innerHTML = `${icono} ${texto}`;
    mensajeDiv.style.display = 'block';
    
    setTimeout(() => {
        mensajeDiv.style.display = 'none';
    }, 3000);
}

// ============================================
// MODAL PARA ELIMINAR DUAL
// ============================================
function mostrarModalEliminarDual(dualId) {
    dualIdAEliminar = dualId;
    if (modalConfirmar) {
        modalConfirmar.style.display = 'flex';
    }
}

function cerrarModalEliminar() {
    if (modalConfirmar) {
        modalConfirmar.style.display = 'none';
    }
    dualIdAEliminar = null;
}

async function eliminarDualConfirmado() {
    if (!dualIdAEliminar) return;
    
    try {
        const respuesta = await fetch(`/api/duales/eliminar/${dualIdAEliminar}`, {
            method: 'DELETE'
        });
        
        const resultado = await respuesta.json();
        
        cerrarModalEliminar();
        
        if (resultado.exito) {
            mostrarMensaje('exito', 'Dual eliminado correctamente');
            cargarDuales();
        } else {
            mostrarMensaje('error', resultado.mensaje);
        }
    } catch (error) {
        cerrarModalEliminar();
        mostrarMensaje('error', 'Error de conexión');
    }
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
    if (!fecha) return 'Sin fecha';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX');
}

function verDetalleDual(dualId) {
    window.location.href = `detalle_dual.html?id=${dualId}`;
}

function editarDual(dualId) {
    window.location.href = `crear_dual.html?id=${dualId}`;
}

function crearDual() {
    window.location.href = 'crear_dual.html';
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    cargarDuales();
    
    const btnCrear = document.getElementById('btnCrearDual');
    if (btnCrear) {
        btnCrear.onclick = crearDual;
    }
    
    // Eventos del modal
    if (btnCancelarEliminar) {
        btnCancelarEliminar.onclick = cerrarModalEliminar;
    }
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.onclick = eliminarDualConfirmado;
    }
    if (modalConfirmar) {
        modalConfirmar.onclick = function(e) {
            if (e.target === modalConfirmar) {
                cerrarModalEliminar();
            }
        };
    }
});