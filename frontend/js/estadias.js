// ============================================
// ARCHIVO: estadias.js
// Lógica para gestionar Estadías Profesionales
// ============================================

const usuario = JSON.parse(localStorage.getItem('usuario'));

if (!usuario) {
    window.location.href = '../../iniciar_sesion.html';
}

let estadiasCache = [];
let estadiaIdAEliminar = null;

// Elementos del modal
const modalConfirmar = document.getElementById('modalConfirmarEstadia');
const btnCancelarEliminar = document.getElementById('btnCancelarEliminarEstadia');
const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminarEstadia');

// ============================================
// CARGAR ESTADÍAS DEL USUARIO (API REAL)
// ============================================
async function cargarEstadias() {
    const container = document.getElementById('estadiasContainer');
    container.innerHTML = '<div class="sin-estadias"><i class="fas fa-spinner fa-pulse"></i> Cargando estadías...</div>';
    
    try {
        const respuesta = await fetch(`/api/estadias/${usuario._id}`);
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            estadiasCache = resultado.estadias;
            mostrarEstadias(estadiasCache);
            
            // Configurar filtros
            const filtroEstado = document.getElementById('filtroEstado');
            const filtroBusqueda = document.getElementById('filtroBusqueda');
            if (filtroEstado) filtroEstado.addEventListener('change', filtrarEstadias);
            if (filtroBusqueda) filtroBusqueda.addEventListener('input', filtrarEstadias);
        } else {
            container.innerHTML = `<div class="sin-estadias"><i class="fas fa-exclamation-triangle"></i> ${resultado.mensaje}</div>`;
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="sin-estadias"><i class="fas fa-exclamation-triangle"></i> Error al cargar estadías</div>';
    }
}

// ============================================
// FILTRAR ESTADÍAS
// ============================================
function filtrarEstadias() {
    const estadoFiltro = document.getElementById('filtroEstado')?.value || 'todos';
    const busquedaFiltro = document.getElementById('filtroBusqueda')?.value.toLowerCase() || '';
    
    let filtrados = [...estadiasCache];
    
    if (estadoFiltro !== 'todos') {
        filtrados = filtrados.filter(e => e.estado === estadoFiltro);
    }
    
    if (busquedaFiltro) {
        filtrados = filtrados.filter(e => 
            e.empresa.toLowerCase().includes(busquedaFiltro) ||
            e.titulo.toLowerCase().includes(busquedaFiltro)
        );
    }
    
    mostrarEstadias(filtrados);
}

// ============================================
// MOSTRAR ESTADÍAS
// ============================================
function mostrarEstadias(estadias) {
    const container = document.getElementById('estadiasContainer');
    
    if (estadias.length === 0) {
        container.innerHTML = `
            <div class="sin-estadias">
                <i class="fas fa-building fa-3x" style="color: #94a3b8; margin-bottom: 1rem; display: block;"></i>
                No hay estadías registradas.<br>
                <button id="btnCrearVacio" class="btn primario" style="margin-top: 1rem;">
                    <i class="fas fa-plus-circle"></i> Solicitar tu primera estadía
                </button>
            </div>
        `;
        
        const btnVacio = document.getElementById('btnCrearVacio');
        if (btnVacio) {
            btnVacio.onclick = () => window.location.href = 'crear_estadia.html';
        }
        return;
    }
    
    container.innerHTML = estadias.map(estadia => {
        let estadoClass = '';
        let estadoText = '';
        let estadoIcono = '';
        
        switch(estadia.estado) {
            case 'en-curso':
                estadoClass = 'estado-en-curso';
                estadoText = 'En curso';
                estadoIcono = '<i class="fas fa-play-circle"></i>';
                break;
            case 'pendiente':
                estadoClass = 'estado-pendiente';
                estadoText = 'Pendiente';
                estadoIcono = '<i class="fas fa-clock"></i>';
                break;
            case 'completada':
                estadoClass = 'estado-completada';
                estadoText = 'Completada';
                estadoIcono = '<i class="fas fa-check-circle"></i>';
                break;
            case 'cancelada':
                estadoClass = 'estado-cancelada';
                estadoText = 'Cancelada';
                estadoIcono = '<i class="fas fa-times-circle"></i>';
                break;
            default:
                estadoClass = 'estado-pendiente';
                estadoText = estadia.estado;
                estadoIcono = '<i class="fas fa-clock"></i>';
        }
        
        const diasRestantes = calcularDiasRestantes(estadia.fecha_fin);
        
        return `
            <div class="estadia-card ${estadia.estado === 'en-curso' ? 'en-curso' : ''}">
                <div class="estadia-titulo"><i class="fas fa-chalkboard-user"></i> ${escapeHtml(estadia.titulo)}</div>
                <div class="estadia-empresa"><i class="fas fa-building"></i> ${escapeHtml(estadia.empresa)}</div>
                <div class="estadia-fechas">
                    <span><i class="fas fa-calendar-alt"></i> Inicio: ${formatearFecha(estadia.fecha_inicio)}</span>
                    <span><i class="fas fa-calendar-check"></i> Fin: ${formatearFecha(estadia.fecha_fin)}</span>
                </div>
                <div class="estadia-fechas">
                    <span><i class="fas fa-clock"></i> Horas: ${estadia.horas}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(estadia.ubicacion)}</span>
                </div>
                ${estadia.estado === 'en-curso' && diasRestantes > 0 ? 
                    `<div class="estadia-duracion"><i class="fas fa-hourglass-half"></i> ${diasRestantes} días restantes</div>` : ''}
                <span class="estadia-estado ${estadoClass}">${estadoIcono} ${estadoText}</span>
                <div class="estadia-acciones">
                    <button onclick="verDetalleEstadia('${estadia._id}')" class="btn-ver-estadia">
                        <i class="fas fa-eye"></i> Ver detalles
                    </button>
                    ${estadia.estado !== 'completada' && estadia.estado !== 'cancelada' ? `
                        <button onclick="editarEstadia('${estadia._id}')" class="btn-editar-estadia">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    ` : ''}
                    ${estadia.estado === 'completada' ? `
                        <button onclick="generarReporte('${estadia._id}')" class="btn-generar-reporte">
                            <i class="fas fa-file-pdf"></i> Reporte
                        </button>
                    ` : ''}
                    <button onclick="mostrarModalEliminarEstadia('${estadia._id}')" class="btn-eliminar-estadia">
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
// MODAL PARA ELIMINAR ESTADÍA
// ============================================
function mostrarModalEliminarEstadia(estadiaId) {
    estadiaIdAEliminar = estadiaId;
    if (modalConfirmar) {
        modalConfirmar.style.display = 'flex';
    }
}

function cerrarModalEliminar() {
    if (modalConfirmar) {
        modalConfirmar.style.display = 'none';
    }
    estadiaIdAEliminar = null;
}

async function eliminarEstadiaConfirmado() {
    if (!estadiaIdAEliminar) return;
    
    try {
        const respuesta = await fetch(`/api/estadias/eliminar/${estadiaIdAEliminar}`, {
            method: 'DELETE'
        });
        
        const resultado = await respuesta.json();
        
        cerrarModalEliminar();
        
        if (resultado.exito) {
            mostrarMensaje('exito', 'Estadía eliminada correctamente');
            cargarEstadias();
        } else {
            mostrarMensaje('error', resultado.mensaje);
        }
    } catch (error) {
        cerrarModalEliminar();
        mostrarMensaje('error', 'Error de conexión');
    }
}

// ============================================
// CALCULAR DÍAS RESTANTES
// ============================================
function calcularDiasRestantes(fechaFin) {
    if (!fechaFin) return 0;
    const fin = new Date(fechaFin);
    const hoy = new Date();
    const diffTime = fin - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
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

function verDetalleEstadia(estadiaId) {
    window.location.href = `detalle_estadia.html?id=${estadiaId}`;
}

function editarEstadia(estadiaId) {
    window.location.href = `crear_estadia.html?id=${estadiaId}`;
}

function generarReporte(estadiaId) {
    mostrarMensaje('info', '📄 Generando reporte... (Próximamente)');
}

function crearEstadia() {
    window.location.href = 'crear_estadia.html';
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    cargarEstadias();
    
    const btnCrear = document.getElementById('btnCrearEstadia');
    if (btnCrear) {
        btnCrear.onclick = crearEstadia;
    }
    
    // Eventos del modal
    if (btnCancelarEliminar) {
        btnCancelarEliminar.onclick = cerrarModalEliminar;
    }
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.onclick = eliminarEstadiaConfirmado;
    }
    if (modalConfirmar) {
        modalConfirmar.onclick = function(e) {
            if (e.target === modalConfirmar) {
                cerrarModalEliminar();
            }
        };
    }
});