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
                <button class="btn primario" onclick="abrirModalImportarCSV()"><i class="fas fa-file-csv"></i> Importar alumnos (CSV)</button>
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
    // Usamos confirm nativo, no se puede personalizar con iconos
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
            mostrarMensaje('exito', 'Has salido del equipo');
            setTimeout(() => {
                window.location.href = 'mis_equipos.html';
            }, 1500);
        } else {
            mostrarMensaje('error', resultado.mensaje);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('error', 'Error de conexión');
    }
}

// ============================================
// MOSTRAR MENSAJE (estilo profesional)
// ============================================
function mostrarMensaje(tipo, texto) {
    // Crear un div de mensaje flotante (puedes personalizarlo)
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = `mensaje-flotante ${tipo}`;
    mensajeDiv.innerHTML = `<i class="fas ${tipo === 'exito' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${texto}`;
    document.body.appendChild(mensajeDiv);
    
    setTimeout(() => {
        mensajeDiv.remove();
    }, 3000);
}

// ============================================
// ABRIR CHAT
// ============================================
function abrirChat() {
    window.location.href = `chat_equipo.html?equipo_id=${equipoId}`;
}

// ============================================
// MODAL IMPORTAR CSV
// ============================================
function abrirModalImportarCSV() {
    const modal = document.getElementById('modalImportarCSV');
    const equipoIdInput = document.getElementById('equipoIdImport');
    if (equipoIdInput) {
        equipoIdInput.value = equipoId;
    }
    if (modal) {
        modal.style.display = 'flex';
    }
}

function cerrarModalImportarCSV() {
    const modal = document.getElementById('modalImportarCSV');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Configurar eventos de importación (se ejecutan una sola vez)
document.addEventListener('DOMContentLoaded', function() {
    const btnConfirmar = document.getElementById('btnConfirmarImportar');
    const btnCancelar = document.getElementById('btnCancelarImportar');
    
    if (btnConfirmar) {
        btnConfirmar.onclick = async function() {
            const fileInput = document.getElementById('csvFile');
            const equipoIdImport = document.getElementById('equipoIdImport').value;
            
            if (!fileInput.files.length) {
                mostrarMensaje('error', 'Selecciona un archivo CSV');
                return;
            }
            
            const formData = new FormData();
            formData.append('archivo', fileInput.files[0]);
            formData.append('equipo_id', equipoIdImport);
            formData.append('usuario_id', usuario._id);
            
            const btn = this;
            const textoOriginal = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Importando...';
            btn.disabled = true;
            
            try {
                const respuesta = await fetch('/api/importar/alumnos', {
                    method: 'POST',
                    body: formData
                });
                
                const resultado = await respuesta.json();
                
                if (resultado.exito) {
                    mostrarMensaje('exito', resultado.mensaje);
                    cerrarModalImportarCSV();
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                } else {
                    mostrarMensaje('error', resultado.mensaje);
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje('error', 'Error de conexión');
            } finally {
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
                fileInput.value = '';
            }
        };
    }
    
    if (btnCancelar) {
        btnCancelar.onclick = cerrarModalImportarCSV;
    }
    
    // Cerrar modal haciendo click fuera
    const modal = document.getElementById('modalImportarCSV');
    if (modal) {
        modal.onclick = function(e) {
            if (e.target === modal) {
                cerrarModalImportarCSV();
            }
        };
    }
});

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    cargarEquipo();
});