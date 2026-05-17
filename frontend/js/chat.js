// ============================================
// CHAT DEL EQUIPO - VERSIÓN SIMPLIFICADA
// ============================================

const usuario = JSON.parse(localStorage.getItem('usuario'));

if (!usuario) {
    window.location.href = '../iniciar_sesion.html';
}

const urlParams = new URLSearchParams(window.location.search);
const equipoId = urlParams.get('equipo_id');

if (!equipoId) {
    window.location.href = 'mis_equipos.html';
}

// Configurar volver
const volverLink = document.getElementById('volverLink');
if (volverLink) {
    volverLink.href = `equipo_detalle.html?id=${equipoId}`;
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
// CARGAR MENSAJES
// ============================================
async function cargarMensajes() {
    const container = document.getElementById('chatMensajes');
    
    if (!container) {
        console.error('ERROR: No se encontró el contenedor chatMensajes');
        return;
    }
    
    console.log('Cargando mensajes...');
        
    try {
        const respuesta = await fetch(`/api/chat/${equipoId}`);
        const resultado = await respuesta.json();
        
        console.log('Respuesta recibida:', resultado);
        
        if (!resultado.exito) {
            container.innerHTML = '<div class="empty-message">❌ Error al cargar mensajes</div>';
            return;
        }
        
        const mensajes = resultado.mensajes;
        console.log('Número de mensajes:', mensajes ? mensajes.length : 0);
        
        if (!mensajes || mensajes.length === 0) {
            container.innerHTML = '<div class="empty-message">💬 No hay mensajes. ¡Escribe el primero!</div>';
            return;
        }
        
        // Construir HTML manualmente
        let html = '';
        for (let i = 0; i < mensajes.length; i++) {
            const msg = mensajes[i];
            const esPropio = msg.usuario_id === usuario.id;
            const fecha = new Date(msg.fecha_envio);
            const hora = fecha.toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'});
            
            html += '<div class="mensaje ' + (esPropio ? 'mensaje-propio' : 'mensaje-otro') + '">';
            html += '<div class="mensaje-autor">' + (esPropio ? 'Tú' : escapeHtml(msg.usuario_nombre)) + '</div>';
            html += '<div class="mensaje-texto">' + escapeHtml(msg.mensaje) + '</div>';
            html += '<div class="mensaje-fecha">' + hora + '</div>';
            html += '</div>';
        }
        
        console.log('HTML generado:', html);
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
        
    } catch (error) {
        console.error('Error en fetch:', error);
        container.innerHTML = '<div class="empty-message">❌ Error de conexión</div>';
    }
}


// ============================================
// ENVIAR MENSAJE
// ============================================
async function enviarMensaje() {
    const input = document.getElementById('mensajeInput');
    const mensaje = input.value.trim();
    
    if (!mensaje) return;
    
    console.log('Enviando:', mensaje);
    
    try {
        const respuesta = await fetch('/api/chat/enviar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                equipo_id: parseInt(equipoId),
                usuario_id: usuario.id,
                mensaje: mensaje
            })
        });
        
        const resultado = await respuesta.json();
        console.log('Respuesta enviar:', resultado);
        
        if (resultado.exito) {
            input.value = '';
            cargarMensajes();
        } else {
            alert('Error: ' + resultado.mensaje);
        }
    } catch (error) {
        console.error('Error al enviar:', error);
        alert('Error de conexión');
    }
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando chat...');
    console.log('equipoId:', equipoId);
    console.log('usuario:', usuario);
    
    cargarMensajes();
    
    const btnEnviar = document.getElementById('btnEnviar');
    const inputMensaje = document.getElementById('mensajeInput');
    
    console.log('btnEnviar encontrado:', btnEnviar);
    console.log('inputMensaje encontrado:', inputMensaje);
    
    if (btnEnviar) {
        btnEnviar.onclick = enviarMensaje;
    }
    
    if (inputMensaje) {
        inputMensaje.onkeypress = function(e) {
            if (e.key === 'Enter') enviarMensaje();
        };
    }
    
    // Actualizar cada 5 segundos
    setInterval(cargarMensajes, 5000);
});