// ============================================
// ARCHIVO: equipos.js
// Lógica para la gestión de equipos (MongoDB)
// ============================================

const usuario = JSON.parse(localStorage.getItem('usuario'));

// Verificar sesión
if (!usuario) {
    window.location.href = 'iniciar_sesion.html';
}

// ============================================
// CARGAR EQUIPOS
// ============================================
async function cargarEquipos() {
    const container = document.getElementById('equiposContainer');
    container.innerHTML = '<div class="sin-equipos"><i class="fas fa-spinner fa-pulse"></i> Cargando equipos...</div>';
    
    try {
        const respuesta = await fetch(`/api/equipos/${usuario._id}`);
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            mostrarEquipos(resultado.equipos);
        } else {
            container.innerHTML = `<div class="sin-equipos"><i class="fas fa-exclamation-triangle"></i> Error: ${resultado.mensaje}</div>`;
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="sin-equipos"><i class="fas fa-wifi"></i> Error de conexión</div>';
    }
}

// ============================================
// MOSTRAR EQUIPOS
// ============================================
function mostrarEquipos(equipos) {
    const container = document.getElementById('equiposContainer');
    
    if (equipos.length === 0) {
        let mensaje = usuario.rol === 'maestro' 
            ? '<i class="fas fa-info-circle"></i> Aún no has creado ningún equipo. Haz click en "Crear equipo" para empezar.'
            : '<i class="fas fa-info-circle"></i> Aún no perteneces a ningún equipo. Pídele a un maestro el ID del equipo para unirte.';
        container.innerHTML = `<div class="sin-equipos">${mensaje}</div>`;
        return;
    }
    
    container.innerHTML = equipos.map(equipo => {
        const esLider = equipo.lider_id === usuario._id;
        const esMiembro = !esLider && usuario.rol === 'alumno';
        
        return `
            <div class="equipo-card">
                <div class="equipo-nombre"><i class="fas fa-tag"></i> ${escapeHtml(equipo.nombre)}</div>
                <div class="equipo-descripcion"><i class="fas fa-align-left"></i> ${escapeHtml(equipo.descripcion || 'Sin descripción')}</div>
                <div class="equipo-meta">
                    <div class="equipo-miembros"><i class="fas fa-users"></i> ${equipo.total_miembros || 0} miembros</div>
                    ${equipo.lider_nombre ? 
                        `<div class="equipo-lider"><i class="fas fa-crown"></i> Líder: ${escapeHtml(equipo.lider_nombre)}</div>` : 
                        `<div class="equipo-lider"><i class="fas fa-crown"></i> Tú eres el líder</div>`
                    }
                </div>
                <div class="equipo-acciones">
                    <button onclick="verDetalleEquipo('${equipo._id}')" class="btn btn-ver"><i class="fas fa-eye"></i> Ver detalles</button>
                    <button onclick="abrirChatEquipo('${equipo._id}')" class="btn btn-chat"><i class="fas fa-comments"></i> Chat</button>
                    <button onclick="verTareasEquipo('${equipo._id}')" class="btn btn-tareas"><i class="fas fa-tasks"></i> Tareas</button>
                    ${esLider ? `<button onclick="confirmarEliminarEquipo('${equipo._id}', '${escapeHtml(equipo.nombre)}')" class="btn btn-eliminar"><i class="fas fa-trash-alt"></i> Eliminar</button>` : ''}
                    ${esMiembro ? `<button onclick="confirmarSalirEquipo('${equipo._id}', '${escapeHtml(equipo.nombre)}')" class="btn btn-salir"><i class="fas fa-sign-out-alt"></i> Salir</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
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
// VER DETALLE
// ============================================
function verDetalleEquipo(equipoId) {
    window.location.href = `equipo_detalle.html?id=${equipoId}`;
}

// ============================================
// UNIRSE A EQUIPO
// ============================================
async function confirmarUnirse() {
    const equipoId = document.getElementById('codigoEquipo').value;
    
    if (!equipoId) {
        mostrarMensaje('error', 'Ingresa el ID del equipo');
        return;
    }
    
    try {
        const respuesta = await fetch('/api/equipos/unirse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                equipo_id: equipoId,
                usuario_id: usuario._id
            })
        });
        
        const resultado = await respuesta.json();
        mostrarMensaje(resultado.exito ? 'exito' : 'error', resultado.mensaje);
        
        if (resultado.exito) {
            document.getElementById('codigoEquipo').value = '';
            toggleFormUnirse();
            cargarEquipos();
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('error', 'Error de conexión');
    }
}

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
// MOSTRAR/OCULTAR FORMULARIO
// ============================================
function toggleFormUnirse() {
    const form = document.getElementById('formUnirse');
    form.classList.toggle('visible');
}

// ============================================
// EVENTOS Y CARGA INICIAL
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    cargarEquipos();
    
    const btnCrear = document.getElementById('btnCrearEquipo');
    const btnMostrarUnirse = document.getElementById('btnMostrarUnirse');
    
    btnCrear.style.display = 'inline-block';
    btnCrear.onclick = () => {
        window.location.href = 'crear_equipo.html';
    };
    
    if (usuario.rol === 'alumno') {
        btnMostrarUnirse.style.display = 'inline-block';
        btnMostrarUnirse.onclick = toggleFormUnirse;
    } else {
        btnMostrarUnirse.style.display = 'none';
    }
    
    document.getElementById('btnConfirmarUnirse').onclick = confirmarUnirse;
    document.getElementById('btnCancelarUnirse').onclick = toggleFormUnirse;
});

// ============================================
// CONFIRMAR ELIMINAR EQUIPO
// ============================================
function confirmarEliminarEquipo(equipoId, equipoNombre) {
    const modal = document.createElement('div');
    modal.className = 'modal-confirmacion';
    modal.innerHTML = `
        <div class="modal-contenido">
            <h3><i class="fas fa-exclamation-triangle"></i> Eliminar equipo</h3>
            <p>¿Estás seguro de que quieres eliminar el equipo <strong>"${escapeHtml(equipoNombre)}"</strong>?</p>
            <p style="font-size: 0.8rem; color: #dc2626;">⚠️ Esta acción no se puede deshacer.</p>
            <div class="modal-botones">
                <button class="btn btn-cancelar" onclick="cerrarModalConfirmacion()"><i class="fas fa-times"></i> Cancelar</button>
                <button class="btn btn-confirmar" onclick="eliminarEquipo('${equipoId}')"><i class="fas fa-trash-alt"></i> Eliminar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ============================================
// CERRAR MODAL
// ============================================
function cerrarModalConfirmacion() {
    const modal = document.querySelector('.modal-confirmacion');
    if (modal) modal.remove();
}

// ============================================
// ELIMINAR EQUIPO
// ============================================
async function eliminarEquipo(equipoId) {
    try {
        const respuesta = await fetch(`/api/equipos/eliminar/${equipoId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuario._id })
        });
        
        const resultado = await respuesta.json();
        cerrarModalConfirmacion();
        mostrarMensaje(resultado.exito ? 'exito' : 'error', resultado.mensaje);
        
        if (resultado.exito) cargarEquipos();
    } catch (error) {
        cerrarModalConfirmacion();
        mostrarMensaje('error', 'Error de conexión');
    }
}

// ============================================
// CONFIRMAR SALIR DEL EQUIPO
// ============================================
function confirmarSalirEquipo(equipoId, equipoNombre) {
    const modal = document.createElement('div');
    modal.className = 'modal-confirmacion';
    modal.innerHTML = `
        <div class="modal-contenido">
            <h3><i class="fas fa-sign-out-alt"></i> Salir del equipo</h3>
            <p>¿Estás seguro de que quieres salir del equipo <strong>"${escapeHtml(equipoNombre)}"</strong>?</p>
            <p style="font-size: 0.8rem; color: #d97706;">🔓 Podrás volver a unirte más tarde con el ID del equipo.</p>
            <div class="modal-botones">
                <button class="btn btn-cancelar" onclick="cerrarModalConfirmacion()"><i class="fas fa-times"></i> Cancelar</button>
                <button class="btn btn-confirmar" style="background: #d97706;" onclick="salirDelEquipo('${equipoId}')"><i class="fas fa-sign-out-alt"></i> Salir</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ============================================
// SALIR DEL EQUIPO
// ============================================
async function salirDelEquipo(equipoId) {
    try {
        const respuesta = await fetch(`/api/equipos/salir/${equipoId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuario._id })
        });
        
        const resultado = await respuesta.json();
        cerrarModalConfirmacion();
        mostrarMensaje(resultado.exito ? 'exito' : 'error', resultado.mensaje);
        
        if (resultado.exito) cargarEquipos();
    } catch (error) {
        cerrarModalConfirmacion();
        mostrarMensaje('error', 'Error de conexión');
    }
}

// ============================================
// VER TAREAS DEL EQUIPO
// ============================================
function verTareasEquipo(equipoId) {
    window.location.href = `tareas_equipo.html?equipo_id=${equipoId}`;
}

// ============================================
// ABRIR EL CHAT
// ============================================
function abrirChatEquipo(equipoId) {
    window.location.href = `chat_equipo.html?equipo_id=${equipoId}`;
}