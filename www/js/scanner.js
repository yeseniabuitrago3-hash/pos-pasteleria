// js/scanner.js - Sistema de escáner
// Ruta: C:\xampp\htdocs\pos-pasteleria\js\scanner.js

// Sistema de escáner mejorado
class SistemaEscanner {
    constructor() {
        this.input = null;
        this.callback = null;
        this.buffer = '';
        this.timeout = null;
        this.TIMEOUT_MS = 100; // Para escáneres USB
        this.activado = false;
    }

    inicializar(callback) {
        this.callback = callback;
        this.crearInputOculto();
        this.activado = true;
        console.log('📷 Escáner listo');
    }

    crearInputOculto() {
        // Input invisible siempre enfocado
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'scannerHidden';
        input.style.cssText = `
            position: fixed;
            bottom: -100px;
            left: -100px;
            opacity: 0;
            pointer-events: none;
            width: 1px;
            height: 1px;
        `;
        document.body.appendChild(input);
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.procesarCodigo();
            }
        });
        
        input.addEventListener('input', (e) => {
            this.buffer += e.target.value;
            this.resetTimer();
            e.target.value = '';
        });
        
        this.input = input;
        this.enfocar();
    }

    enfocar() {
        if (this.input) {
            this.input.focus();
        }
    }

    resetTimer() {
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.buffer = '';
        }, this.TIMEOUT_MS);
    }

    procesarCodigo() {
        const codigo = this.buffer.trim();
        this.buffer = '';
        if (codigo && this.callback) {
            console.log(`📷 Código: ${codigo}`);
            this.callback(codigo);
        }
        setTimeout(() => this.enfocar(), 50);
    }

    simularEscaneo(codigo) {
        console.log(`🧪 Simulando: ${codigo}`);
        if (this.callback) this.callback(codigo);
    }
}

// Inicializar
const scanner = new SistemaEscanner();
scanner.inicializar(procesarProductoEscaneado);

// Atajo para activar manualmente (F2)
document.addEventListener('keydown', (e) => {
    if (e.key === 'F2') {
        e.preventDefault();
        scanner.enfocar();
        mostrarMensaje('📷 Escáner activo', 'info');
    }
});

// ==================== FUNCIÓN PARA OBTENER APERTURA ====================

function getAperturaActual() {
    try {
        const aperturaId = localStorage.getItem('pos_apertura_actual_id');
        if (aperturaId) {
            const aperturas = JSON.parse(localStorage.getItem('pos_aperturas') || '[]');
            const apertura = aperturas.find(a => a.id == aperturaId && a.estado === 'abierta');
            if (apertura) return apertura;
        }
        const aperturaSession = sessionStorage.getItem('aperturaActual');
        if (aperturaSession) {
            const apertura = JSON.parse(aperturaSession);
            if (apertura && apertura.estado === 'abierta') return apertura;
        }
        return null;
    } catch (e) {
        console.error('Error:', e);
        return null;
    }
}

// ==================== PROCESAR PRODUCTO ESCANEADO ====================

async function procesarProductoEscaneado(codigo) {
    console.log(`🔍 Buscando: ${codigo}`);
    
    try {
        // 🔥 RUTA CORRECTA: pages/api/productos.php
        const response = await fetch(`../pages/api/productos.php?action=buscar&codigo=${encodeURIComponent(codigo)}`);
        const data = await response.json();
        
        if (!data.success) {
            mostrarAlertaUI('Error al consultar el producto', 'danger');
            return;
        }
        
        if (data.total === 0) {
            const mensaje = `❌ Producto "${codigo}" no encontrado`;
            console.warn(mensaje);
            mostrarAlertaUI(mensaje, 'danger');
            
            const agregar = confirm(`Producto no registrado.\n¿Desea agregar "${codigo}" al inventario?`);
            if (agregar && typeof abrirModalAgregarProducto === 'function') {
                abrirModalAgregarProducto(codigo);
            }
            return;
        }
        
        const producto = data.productos[0];
        
        if (producto.stock <= 0) {
            mostrarAlertaUI(`❌ ${producto.nombre} - ¡SIN STOCK!`, 'danger');
            return;
        }
        
        const apertura = getAperturaActual();
        if (!apertura) {
            mostrarAlertaUI('❌ No hay turno abierto. Realice la apertura primero.', 'danger');
            return;
        }
        
        // Mostrar producto encontrado
        mostrarAlertaUI(`✅ ${producto.nombre} (${producto.codigo}) - $${Number(producto.precio).toLocaleString()}`, 'success');
        
        // Actualizar stock en la base de datos
        await actualizarStockProducto(producto.id, -1);
        
        // Actualizar UI
        if (typeof cargarInventario === 'function') cargarInventario();
        if (typeof actualizarListaBebidas === 'function') actualizarListaBebidas();
        if (typeof actualizarTotales === 'function') actualizarTotales();
        
        // Verificar stock bajo
        if (producto.stock - 1 <= producto.stock_minimo) {
            mostrarAlertaUI(`⚠️ ¡ALERTA! ${producto.nombre} está por agotarse (Stock: ${producto.stock - 1})`, 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarAlertaUI('❌ Error de conexión con el servidor. Verifica XAMPP.', 'danger');
    }
}

// ==================== ACTUALIZAR STOCK ====================

async function actualizarStockProducto(id, cantidad) {
    try {
        const formData = new FormData();
        formData.append('action', 'recibir_pedido');
        formData.append('id', id);
        formData.append('cantidad', Math.abs(cantidad));
        formData.append('motivo', cantidad < 0 ? 'Venta por escáner' : 'Recepcion de pedido');
        
        const response = await fetch('../pages/api/productos.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            console.log('✅ Stock actualizado');
            return true;
        } else {
            console.error('❌ Error:', data.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Error en actualizarStockProducto:', error);
        return false;
    }
}

// ==================== FUNCIÓN PARA MOSTRAR ALERTAS ====================

function mostrarAlertaUI(mensaje, tipo = 'info') {
    if (typeof mostrarAlerta === 'function') {
        mostrarAlerta(mensaje, tipo);
        return;
    }
    
    // Si no existe la función, crear alerta simple
    const container = document.getElementById('alertContainer');
    if (container) {
        const colores = {
            success: '#27ae60',
            danger: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        const alerta = document.createElement('div');
        alerta.style.cssText = `
            padding: 12px 20px; margin: 10px 0; border-radius: 8px;
            background: ${colores[tipo] || '#3498db'}; color: white;
            font-weight: 500; display: flex; justify-content: space-between; align-items: center;
            animation: slideDown 0.3s ease;
        `;
        alerta.innerHTML = `
            <span>${mensaje}</span>
            <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;">×</button>
        `;
        container.appendChild(alerta);
        setTimeout(() => { if (alerta.parentElement) alerta.remove(); }, 5000);
    } else {
        alert(mensaje);
    }
}

// ==================== ESCÁNER DE CÁMARA ====================

async function iniciarEscaneoCamara() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Tu navegador no soporta la cámara');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'scannerModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); z-index: 10000;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
    `;
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 20px; max-width: 90%; text-align: center;">
            <h3>📷 Escanear código de barras</h3>
            <video id="scannerVideo" autoplay playsinline style="width: 100%; max-width: 500px; border-radius: 10px;"></video>
            <button onclick="detenerEscaneoCamara()" style="margin-top:15px;padding:10px 30px;background:#e74c3c;color:white;border:none;border-radius:8px;cursor:pointer;">❌ Cerrar</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        document.getElementById('scannerVideo').srcObject = stream;
        window.scannerStream = stream;
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo acceder a la cámara');
    }
}

function detenerEscaneoCamara() {
    if (window.scannerStream) {
        window.scannerStream.getTracks().forEach(track => track.stop());
    }
    const modal = document.getElementById('scannerModal');
    if (modal) modal.remove();
}

// ==================== CONFIGURAR ESCÁNER ====================

function configurarEscannerGlobal() {
    scanner.inicializar(procesarProductoEscaneado);
    const scannerInput = document.getElementById('scannerInput');
    if (scannerInput) {
        scanner.configurarInputVisible(scannerInput);
        console.log('✅ Escáner configurado en input visible');
    } else {
        console.log('✅ Escáner configurado con input oculto');
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
            e.preventDefault();
            scanner.focusInput();
            mostrarAlertaUI('📷 Escáner activado', 'info');
        }
        if (e.key === 'F3') {
            e.preventDefault();
            const codigo = prompt('Código de prueba:', 'BEB122');
            if (codigo) scanner.simularEscaneo(codigo);
        }
    });
}

function probarEscanner() {
    console.log('=== PRUEBA DEL ESCÁNER ===');
    console.log('F2: Activar escáner | F3: Simular escaneo');
    console.log('Códigos de prueba: PAN001, BEB122, POS001');
}

// ==================== EXPORTAR FUNCIONES ====================

window.scanner = scanner;
window.probarEscanner = probarEscanner;
window.configurarEscannerGlobal = configurarEscannerGlobal;
window.iniciarEscaneoCamara = iniciarEscaneoCamara;
window.detenerEscaneoCamara = detenerEscaneoCamara;
window.procesarProductoEscaneado = procesarProductoEscaneado;
window.mostrarAlertaUI = mostrarAlertaUI;
window.getAperturaActual = getAperturaActual;
window.actualizarStockProducto = actualizarStockProducto;

// ==================== INICIALIZAR ====================

document.addEventListener('DOMContentLoaded', function() {
    configurarEscannerGlobal();
    console.log('🔧 Escáner listo para usar');
    probarEscanner();
});

// Estilos para las alertas
(function agregarEstilos() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
})();