// ============================================
// ARCHIVO: crear-equipo.js
// AHORA: Cualquier usuario puede crear equipos
// ============================================

const usuario = JSON.parse(localStorage.getItem('usuario'));

// Verificar sesión
if (!usuario) {
    window.location.href = 'iniciar_sesion.html';
}

// ============================================
// ELIMINO ESTAS LÍNEAS (ya no bloqueamos a alumnos)
// ============================================
// if (usuario.rol !== 'maestro') {
//     alert('Solo los maestros pueden crear equipos.');
//     window.location.href = 'mis_equipos.html';
// }

// ============================================
// EN SU LUGAR, podemos mostrar un mensaje diferente según el rol
// ============================================
function mostrarMensajeBienvenida() {
    const titulo = document.querySelector('h2');
    if (usuario.rol === 'alumno') {
        titulo.innerHTML = 'Crear Equipo de Proyecto';
        const ayuda = document.querySelector('.ayuda');
        if (ayuda) {
            ayuda.innerHTML = 'Crea un equipo para trabajar en proyectos con tus compañeros.';
        }
    }
}

// ============================================
// RESTO DEL CÓDIGO IGUAL
// ============================================
function mostrarMensaje(tipo, texto) {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.textContent = tipo === 'exito' ? `Bien ${texto}` : `Error ${texto}`;
    mensajeDiv.style.display = 'block';
    setTimeout(() => {
        mensajeDiv.style.display = 'none';
    }, 3000);
}

function cancelar() {
    window.location.href = 'mis_equipos.html';
}

document.getElementById('formCrearEquipo').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    
    if (!nombre) {
        mostrarMensaje('error', 'El nombre del equipo es obligatorio');
        return;
    }
    
    const btnSubmit = this.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit.textContent;
    btnSubmit.textContent = 'Creando...';
    btnSubmit.disabled = true;
    
    try {
        const respuesta = await fetch('/api/equipos/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: nombre,
                descripcion: descripcion,
                lider_id: usuario.id
            })
        });
        
        const resultado = await respuesta.json();
        
        if (resultado.exito) {
            mostrarMensaje('exito', 'Equipo creado correctamente');
            setTimeout(() => {
                window.location.href = 'mis_equipos.html';
            }, 1500);
        } else {
            mostrarMensaje('error', resultado.mensaje);
            btnSubmit.textContent = textoOriginal;
            btnSubmit.disabled = false;
        }
        
    } catch (error) {
        mostrarMensaje('error', 'Error de conexión');
        btnSubmit.textContent = textoOriginal;
        btnSubmit.disabled = false;
    }
});

// Llamar al iniciar
mostrarMensajeBienvenida();