// ============================================
// menu.js - Lógica del menú lateral (reutilizable)
// ============================================

function cargarInfoUsuarioEnMenu() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    if (!usuario) {
        window.location.href = '../iniciar_sesion.html';
        return;
    }
    
    // Mostrar información en el menú
    const userInfoSidebar = document.getElementById('userInfoSidebar');
    if (userInfoSidebar) {
        userInfoSidebar.innerHTML = `
            <div class="user-avatar">${usuario.nombre.charAt(0).toUpperCase()}</div>
            <div class="user-details">
                <span class="user-name">${escapeHtml(usuario.nombre)}</span>
                <span class="user-role">${usuario.rol === 'maestro' ? '<i class="fas fa-chalkboard-teacher"></i> Maestro' : '<i class="fas fa-user-graduate"></i> Alumno'}</span>
            </div>
        `;
    }
    
    // Mostrar botón "Crear Equipo" solo para maestros
    const btnCrearEquipo = document.getElementById('menuCrearEquipo');
    if (btnCrearEquipo && usuario.rol === 'maestro') {
        btnCrearEquipo.style.display = 'flex';
        btnCrearEquipo.href = '../pages/crear_equipo.html';
    }
}

function escapeHtml(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function cerrarSesion() {
    localStorage.removeItem('usuario');
    window.location.href = '../bienvenida.html';
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarInfoUsuarioEnMenu();
});