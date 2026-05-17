// ============================================
// ARCHIVO: equipos.js
// Lógica para la gestión de equipos
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
    container.innerHTML = '<div class="sin-equipos">Cargando equipos...</div>';
    
    try {
        const respuesta = await fetch(`/api/equipos/${usuario.id}`);
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            mostrarEquipos(resultado.equipos);
        } else {
            container.innerHTML = `<div class="sin-equipos">Error: ${resultado.mensaje}</div>`;
        }
    } catch (error) {
        container.innerHTML = '<div class="sin-equipos">Error de conexión</div>';
    }
}

// ============================================
// MOSTRAR EQUIPOS
// ============================================
function mostrarEquipos(equipos) {
    const container = document.getElementById('equiposContainer');
    
    if (equipos.length === 0) {
        let mensaje = usuario.rol === 'maestro' 
            ? 'Aún no has creado ningún equipo. Haz click en "Crear equipo" para empezar.'
            : 'Aún no perteneces a ningún equipo. Pídele a un maestro el ID del equipo para unirte.';
        container.innerHTML = `<div class="sin-equipos">${mensaje}</div>`;
        return;
    }
    
    container.innerHTML = equipos.map(equipo => {
        const esLider = equipo.lider_id === usuario.id;
        const esMiembro = !esLider && usuario.rol === 'alumno';
        
        return `
            <div class="equipo-card">
                <div class="equipo-nombre">Equipo: ${escapeHtml(equipo.nombre)}</div>
                <div class="equipo-descripcion">${escapeHtml(equipo.descripcion || 'Sin descripción')}</div>
                <div class="equipo-meta">
                    <div class="equipo-miembros">Miembros: ${equipo.total_miembros || 0} miembros</div>
                    ${equipo.lider_nombre ? 
                        `<div class="equipo-lider">👑 ${escapeHtml(equipo.lider_nombre)}</div>` : 
                        `<div class="equipo-lider">Tú eres el líder</div>`
                    }
                </div>
                <div class="equipo-acciones">
                    <button onclick="verDetalleEquipo(${equipo.id})" class="btn btn-ver">Ver detalles</button>
                    <button onclick="abrirChatEquipo(${equipo.id})" class="btn btn-chat">💬 Chat</button>
                    <button onclick="verTareasEquipo(${equipo.id})" class="btn btn-tareas">Tareas</button>
                    ${esLider ? `<button onclick="confirmarEliminarEquipo(${equipo.id}, '${escapeHtml(equipo.nombre)}')" class="btn btn-eliminar">Eliminar</button>` : ''}
                    ${esMiembro ? `<button onclick="confirmarSalirEquipo(${equipo.id}, '${escapeHtml(equipo.nombre)}')" class="btn btn-salir">Salir</button>` : ''}
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
                equipo_id: parseInt(equipoId),
                usuario_id: usuario.id
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
        mostrarMensaje('error', 'Error de conexión');
    }
}

// ============================================
// MOSTRAR MENSAJE
// ============================================
function mostrarMensaje(tipo, texto) {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.textContent = tipo === 'exito' ? `${texto}` : `${texto}`;
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
// EVENTOS Y CARGA INICIAL (modificada esta parte)
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    cargarEquipos();
    
    const btnCrear = document.getElementById('btnCrearEquipo');
    const btnMostrarUnirse = document.getElementById('btnMostrarUnirse');
    
    // ============================================
    // AHORA: Todos pueden crear equipos
    // ============================================
    btnCrear.style.display = 'inline-block';
    btnCrear.onclick = () => {
        window.location.href = 'crear_equipo.html';
    };
    
    // El botón "Unirse" solo para alumnos (por si quieren unirse a equipos de otros)
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
    // Crear modal de confirmación
    const modal = document.createElement('div');
    modal.className = 'modal-confirmacion';
    modal.innerHTML = `
        <div class="modal-contenido">
            <h3>Eliminar equipo</h3>
            <p>¿Estás seguro de que quieres eliminar el equipo <strong>"${escapeHtml(equipoNombre)}"</strong>?</p>
            <p style="font-size: 0.8rem; color: #dc2626;">Esta acción no se puede deshacer.</p>
            <div class="modal-botones">
                <button class="btn btn-cancelar" onclick="cerrarModalConfirmacion()">Cancelar</button>
                <button class="btn btn-confirmar" onclick="eliminarEquipo(${equipoId})">Eliminar</button>
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
    if (modal) {
        modal.remove();
    }
}

// ============================================
// ELIMINAR EQUIPO
// ============================================
async function eliminarEquipo(equipoId) {
    try {
        const respuesta = await fetch(`/api/equipos/eliminar/${equipoId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuario.id })
        });
        
        const resultado = await respuesta.json();
        
        cerrarModalConfirmacion();
        mostrarMensaje(resultado.exito ? 'exito' : 'error', resultado.mensaje);
        
        if (resultado.exito) {
            // Recargar la lista de equipos
            cargarEquipos();
        }
    } catch (error) {
        cerrarModalConfirmacion();
        mostrarMensaje('error', 'Error de conexión');
    }
}

// ============================================
// CONFIRMAR SALIR DEL EQUIPO
// ============================================
function confirmarSalirEquipo(equipoId, equipoNombre) {
    // Crear modal de confirmación
    const modal = document.createElement('div');
    modal.className = 'modal-confirmacion';
    modal.innerHTML = `
        <div class="modal-contenido">
            <h3>Salir del equipo</h3>
            <p>¿Estás seguro de que quieres salir del equipo <strong>"${escapeHtml(equipoNombre)}"</strong>?</p>
            <p style="font-size: 0.8rem; color: #d97706;">Podrás volver a unirte más tarde con el ID del equipo.</p>
            <div class="modal-botones">
                <button class="btn btn-cancelar" onclick="cerrarModalConfirmacion()">Cancelar</button>
                <button class="btn btn-confirmar" style="background: #d97706;" onclick="salirDelEquipo(${equipoId})">Salir</button>
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
            body: JSON.stringify({ usuario_id: usuario.id })
        });
        
        const resultado = await respuesta.json();
        
        cerrarModalConfirmacion();
        mostrarMensaje(resultado.exito ? 'exito' : 'error', resultado.mensaje);
        
        if (resultado.exito) {
            // Recargar la lista de equipos
            cargarEquipos();
        }
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