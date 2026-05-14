/* ==================== COMPONENTE DE NAVEGACIÓN GLOBAL ==================== */
// Este archivo se encarga de mostrar el mismo menú en TODAS las páginas

function cargarNavbar() {
    // Verificar si ya existe el navbar para no duplicar
    if (document.querySelector('.navbar-global')) return;
    
    // Determinar la página actual para resaltar el botón activo
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const currentFolder = window.location.pathname.includes('/pages/') ? '../' : '';
    
    // Crear el HTML del navbar
    const navbarHTML = `
        <div class="navbar-global">
            <div class="navbar-logo">
                <h1>🧁 POS Pastelería</h1>
                <div class="fecha" id="fechaNavbar"></div>
            </div>
            <div class="navbar-menu">
                <a href="${currentFolder}index.html" class="nav-link ${currentPage === 'index.html' ? 'active' : ''}">
                    🏠 Inicio
                </a>
                <a href="${currentFolder}pages/apertura.html" class="nav-link ${currentPage === 'apertura.html' ? 'active' : ''}">
                    🚀 Apertura
                </a>
                <a href="${currentFolder}pages/ventas.html" class="nav-link ${currentPage === 'ventas.html' ? 'active' : ''}">
                    💰 Ventas
                </a>
                <a href="${currentFolder}pages/cierre.html" class="nav-link ${currentPage === 'cierre.html' ? 'active' : ''}">
                    📊 Cierre
                </a>
                <a href="${currentFolder}pages/historial.html" class="nav-link ${currentPage === 'historial.html' ? 'active' : ''}">
                    📜 Historial
                </a>
                <a href="${currentFolder}pages/inventario.html" class="nav-link ${currentPage === 'inventario.html' ? 'active' : ''}">
                    📦 Inventario
                </a>
                <a href="${currentFolder}pages/recibir_pedido.html" class="nav-link ${currentPage === 'recibir_pedido.html' ? 'active' : ''}">
                    📥 Recibir Pedido
                </a>
            </div>
            <div class="navbar-status" id="navbarStatusGlobal">
                <div class="status-indicator ${getAperturaActual() ? 'open' : 'closed'}"></div>
                <span class="status-text">${getAperturaActual() ? '🟢 Turno abierto' : '🔴 Turno cerrado'}</span>
            </div>
        </div>
        <div class="toast-container" id="toastContainerGlobal"></div>
    `;
    
    // Insertar el navbar al inicio del body
    const body = document.body;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = navbarHTML;
    
    // Insertar después del body pero antes del contenido existente
    if (body.firstChild) {
        body.insertBefore(tempDiv.firstElementChild, body.firstChild);
    } else {
        body.appendChild(tempDiv.firstElementChild);
    }
    
    // Actualizar fecha en el navbar
    actualizarFechaNavbar();
    
    // Actualizar estado del turno periódicamente
    setInterval(() => {
        actualizarEstadoNavbar();
    }, 5000);
}

function actualizarFechaNavbar() {
    const fechaElement = document.getElementById('fechaNavbar');
    if (fechaElement) {
        const hoy = new Date();
        const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        fechaElement.textContent = hoy.toLocaleDateString('es-ES', opciones);
    }
}

function actualizarEstadoNavbar() {
    const apertura = getAperturaActual();
    const statusDiv = document.getElementById('navbarStatusGlobal');
    if (statusDiv) {
        if (apertura) {
            statusDiv.innerHTML = `
                <div class="status-indicator open"></div>
                <span class="status-text">🟢 Turno abierto | Base: $${apertura.base_total.toLocaleString()}</span>
            `;
        } else {
            statusDiv.innerHTML = `
                <div class="status-indicator closed"></div>
                <span class="status-text">🔴 Turno cerrado</span>
            `;
        }
    }
}

// Función global para mostrar toast desde cualquier página
function mostrarToastGlobal(mensaje, tipo) {
    let container = document.getElementById('toastContainerGlobal');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainerGlobal';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    
    const iconos = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${iconos[tipo] || '📢'}</span>
        <span style="flex: 1;">${mensaje}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer;">✖</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 3500);
}

// Sobrescribir mostrarToast si existe
window.mostrarToast = mostrarToastGlobal;

// Cargar navbar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    cargarNavbar();
});