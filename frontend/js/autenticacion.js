// ============================================
// ARCHIVO: autenticacion.js
// PROPÓSITO: Manejar el registro de usuarios
// ============================================

// ============================================
// CUANDO EL DOM ESTÉ COMPLETAMENTE CARGADO
// ============================================
// document.addEventListener('DOMContentLoaded', ...) se ejecuta cuando
// el navegador ya ha cargado todo el HTML, listo para interactuar.
document.addEventListener('DOMContentLoaded', function() {

    // ========================================
    // 1. BUSCAR EL FORMULARIO DE REGISTRO
    // ========================================
    // document.getElementById() busca un elemento por su id.
    // Aquí buscamos el formulario que creamos en registrarse.html
    const formularioRegistro = document.getElementById('formulario-registro');
    // Si no existe (por ejemplo, si estamos en otra página), no hacemos nada.

    // ========================================
    // 2. SI EXISTE EL FORMULARIO, AGREGAMOS UN ESCUCHADOR DE EVENTOS
    // ========================================
    if (formularioRegistro) {
        // .addEventListener('submit', ...) se activa cuando el usuario hace click en el botón "Registrarse"
        formularioRegistro.addEventListener('submit', async function(evento) {
            // evento.preventDefault() evita que el navegador recargue la página al enviar el formulario
            evento.preventDefault();

            // ========================================
            // 3. MOSTRAR MENSAJE DE "REGISTRANDO..."
            // ========================================
            // Buscamos el div con id="mensaje" para mostrar los mensajes al usuario
            const mensajeDiv = document.getElementById('mensaje');
            // Limpiamos clases anteriores y mostramos el mensaje de carga
            mensajeDiv.className = 'mensaje';
            mensajeDiv.textContent = 'Registrando...';
            mensajeDiv.style.display = 'block';

            // ========================================
            // 4. RECOGER DATOS DEL FORMULARIO
            // ========================================
            // Obtenemos los valores que el usuario escribió en los campos
            const datos = {
                nombre: document.getElementById('nombre').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                rol: document.getElementById('rol').value
            };

            // ========================================
            // 5. ENVIAR DATOS AL BACKEND CON FETCH
            // ========================================
            try {
                // fetch() es una función de JavaScript para hacer peticiones HTTP
                // Enviamos los datos a la ruta /api/registro que creamos en app.py
                const respuesta = await fetch('/api/registro', {
                    method: 'POST',                // Método HTTP POST (envío de datos)
                    headers: {
                        'Content-Type': 'application/json'   // Indicamos que enviamos JSON
                    },
                    body: JSON.stringify(datos)    // Convertimos los datos a formato JSON
                });

                // Esperamos la respuesta del servidor y la convertimos a JSON
                const resultado = await respuesta.json();

                // ========================================
                // 6. PROCESAR LA RESPUESTA DEL SERVIDOR
                // ========================================
                if (resultado.exito) {
                    // ÉXITO: Mostrar mensaje verde
                    mensajeDiv.className = 'mensaje exito';
                    mensajeDiv.textContent = '¡Registro exitoso! Redirigiendo...';

                    // Esperar 2 segundos y luego ir a la página de login
                    setTimeout(() => {
                        window.location.href = 'iniciar_sesion.html';
                    }, 2000);
                } else {
                    // ERROR: Mostrar mensaje rojo con el error que devolvió el servidor
                    mensajeDiv.className = 'mensaje error';
                    mensajeDiv.textContent = 'Error' + resultado.mensaje;
                }

            } catch (error) {
                // Si hubo un problema de red o el servidor no responde
                mensajeDiv.className = 'mensaje error';
                mensajeDiv.textContent = 'Error de conexión. Asegúrate de que el servidor esté corriendo.';
            }
        });
    }
});


// ============================================
// INICIO DE SESIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const formularioLogin = document.getElementById('formulario-login');

    if (formularioLogin) {
        formularioLogin.addEventListener('submit', async function(evento) {
            evento.preventDefault();

            const mensajeDiv = document.getElementById('mensaje');
            mensajeDiv.className = 'mensaje';
            mensajeDiv.textContent = 'Iniciando sesión...';
            mensajeDiv.style.display = 'block';

            // Recoger datos del formulario
            const datos = {
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };

            try {
                // Enviar al backend
                const respuesta = await fetch('/api/iniciar-sesion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });

                const resultado = await respuesta.json();

                if (resultado.exito) {
                    mensajeDiv.className = 'mensaje exito';
                    mensajeDiv.textContent = '¡Bienvenido! Redirigiendo...';

                    // Guardar datos del usuario en localStorage
                    localStorage.setItem('usuario', JSON.stringify(resultado.usuario));

                    // Redirigir al dashboard
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    mensajeDiv.className = 'mensaje error';
                    mensajeDiv.textContent = 'Error' + resultado.mensaje;
                }

            } catch (error) {
                mensajeDiv.className = 'mensaje error';
                mensajeDiv.textContent = 'Error de conexión. Asegúrate de que el servidor esté corriendo.';
            }
        });
    }
});