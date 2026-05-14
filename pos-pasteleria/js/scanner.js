
// ==================== SISTEMA DE ESCÁNER DE CÓDIGO DE BARRAS ====================
// Este archivo maneja la lectura de códigos de barras desde escáner USB
// El escáner funciona como un teclado: escribe el código y presiona ENTER

class SistemaEscanner {
    constructor() {
        this.inputActivo = null;
        this.callbackOnScan = null;
        this.timeout = null;
        this.buffer = '';
        this.TIMEOUT_MS = 100; // Tiempo máximo entre caracteres (ms)
        this.inicializado = false;
    }

    // Inicializar el sistema de escáner
    inicializar(callback) {
        if (this.inicializado) {
            console.log('⚠️ Escáner ya inicializado');
            return;
        }

        this.callbackOnScan = callback;
        this.crearInputOculto();
        this.inicializado = true;
        console.log('📷 Sistema de escáner inicializado correctamente');
        console.log('💡 Instrucciones:');
        console.log('   1. Conecta el escáner USB a tu computadora');
        console.log('   2. Apunta el escáner al código de barras');
        console.log('   3. Presiona el botón del escáner');
        console.log('   4. El sistema detectará automáticamente el producto');
    }

    // Crear input oculto para capturar el escáner
    crearInputOculto() {
        // Verificar si ya existe
        if (document.getElementById('scannerHiddenInput')) return;

        // Crear input oculto
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'text';
        hiddenInput.id = 'scannerHiddenInput';
        hiddenInput.style.position = 'fixed';
        hiddenInput.style.top = '-100px';
        hiddenInput.style.left = '-100px';
        hiddenInput.style.opacity = '0';
        hiddenInput.style.pointerEvents = 'none';
        
        document.body.appendChild(hiddenInput);
        
        // Configurar evento de teclado
        hiddenInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.procesarCodigo();
                e.preventDefault();
            }
        });
        
        hiddenInput.addEventListener('input', (e) => {
            this.buffer += e.target.value;
            this.resetTimer();
            e.target.value = '';
        });
        
        this.hiddenInput = hiddenInput;
        this.focusInput();
    }

    // Enfocar el input oculto
    focusInput() {
        if (this.hiddenInput) {
            this.hiddenInput.focus();
        }
    }

    // Resetear el timer del buffer
    resetTimer() {
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.buffer = '';
        }, this.TIMEOUT_MS);
    }

    // Procesar el código escaneado
    procesarCodigo() {
        const codigo = this.buffer.trim();
        this.buffer = '';
        
        if (codigo && this.callbackOnScan) {
            console.log(`📷 Código escaneado: ${codigo}`);
            this.callbackOnScan(codigo);
        }
        
        // Volver a enfocar después de procesar
        setTimeout(() => this.focusInput(), 100);
    }

    // Configurar un input visible para el escáner (alternativa más simple)
    configurarInputVisible(inputElement) {
        if (!inputElement) return;
        
        this.inputVisible = inputElement;
        
        inputElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const codigo = inputElement.value.trim();
                if (codigo && this.callbackOnScan) {
                    console.log(`📷 Código escaneado (input visible): ${codigo}`);
                    this.callbackOnScan(codigo);
                }
                inputElement.value = '';
            }
        });
        
        // Auto-focus
        inputElement.focus();
    }

    // Simular escaneo (para pruebas sin hardware)
    simularEscaneo(codigo) {
        console.log(`🧪 Simulando escaneo: ${codigo}`);
        if (this.callbackOnScan) {
            this.callbackOnScan(codigo);
        }
    }
}

// Crear instancia global del escáner
const scanner = new SistemaEscanner();

// ==================== INTEGRACIÓN CON EL SISTEMA DE VENTAS ====================

// Función que procesa el producto escaneado (vinculada con ventas)
function procesarProductoEscaneado(codigo) {
    console.log(`🔍 Buscando producto con código: ${codigo}`);
    
    // Buscar en la base de datos
    const productos = DB.find('productos', 'codigo_barras', codigo);
    
    if (productos.length === 0) {
        // Producto no encontrado
        const mensaje = `❌ Producto con código ${codigo} no encontrado`;
        console.warn(mensaje);
        
        if (typeof mostrarAlertaUI === 'function') {
            mostrarAlertaUI(mensaje, 'danger');
        } else {
            alert(mensaje);
        }
        
        // Preguntar si quiere agregar el producto
        const agregar = confirm(`Producto no registrado.\n¿Desea agregar "${codigo}" al inventario?`);
        if (agregar && typeof abrirModalAgregarProducto === 'function') {
            abrirModalAgregarProducto(codigo);
        }
        return;
    }
    
    const producto = productos[0];
    
    // Verificar stock
    if (producto.stock_actual <= 0) {
        const mensaje = `❌ ${producto.nombre} - ¡SIN STOCK! Stock actual: ${producto.stock_actual}`;
        console.warn(mensaje);
        
        if (typeof mostrarAlertaUI === 'function') {
            mostrarAlertaUI(mensaje, 'danger');
        } else {
            alert(mensaje);
        }
        return;
    }
    
    // Verificar turno abierto
    const apertura = getAperturaActual();
    if (!apertura) {
        const mensaje = '❌ No hay un turno abierto. Realice la apertura primero.';
        console.warn(mensaje);
        
        if (typeof mostrarAlertaUI === 'function') {
            mostrarAlertaUI(mensaje, 'danger');
        } else {
            alert(mensaje);
        }
        return;
    }
    
    // Registrar la venta
    const venta = venderBebida(apertura.id, producto);
    
    // Mensaje de éxito
    const mensaje = `✅ ${producto.nombre} vendido por $${producto.precio.toLocaleString()}. Stock restante: ${producto.stock_actual - 1}`;
    console.log(mensaje);
    
    if (typeof mostrarAlertaUI === 'function') {
        mostrarAlertaUI(mensaje, 'success');
    } else {
        alert(mensaje);
    }
    
    // Actualizar UI si existen las funciones
    if (typeof actualizarListaBebidas === 'function') {
        actualizarListaBebidas();
    }
    
    if (typeof actualizarTotales === 'function') {
        actualizarTotales();
    }
    
    if (typeof actualizarDashboard === 'function') {
        actualizarDashboard();
    }
    
    // Verificar si el producto quedó con stock bajo
    if (producto.stock_actual - 1 <= producto.stock_minimo) {
        const alertaStock = `⚠️ ¡ALERTA! ${producto.nombre} está por agotarse. Stock restante: ${producto.stock_actual - 1}`;
        console.warn(alertaStock);
        
        if (typeof mostrarAlertaUI === 'function') {
            mostrarAlertaUI(alertaStock, 'warning');
        }
    }
}

// ==================== FUNCIÓN PARA ESCANEAR DESDE MÓVIL (CÁMARA) ====================
// Esta función usa la cámara del celular como escáner

async function iniciarEscaneoCamara() {
    // Verificar si el navegador soporta la cámara
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Tu navegador no soporta el acceso a la cámara');
        return;
    }
    
    // Crear modal para el escáner
    const modal = document.createElement('div');
    modal.id = 'scannerModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 20px; max-width: 90%; text-align: center;">
            <h3>📷 Escanear código de barras</h3>
            <video id="scannerVideo" autoplay playsinline style="width: 100%; max-width: 500px; border-radius: 10px;"></video>
            <div style="margin-top: 15px;">
                <button onclick="detenerEscaneoCamara()" class="btn btn-danger">❌ Cerrar</button>
            </div>
            <p style="margin-top: 10px; font-size: 12px;">Alinea el código de barras con la cámara</p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const video = document.getElementById('scannerVideo');
        video.srcObject = stream;
        
        // Aquí se integraría una librería como html5-qrcode para leer códigos
        // Por ahora, mostramos un mensaje
        console.log('📷 Cámara activada. Para escanear real, instala html5-qrcode');
        
        window.scannerStream = stream;
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
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

// ==================== CONFIGURAR ESCÁNER EN LA PÁGINA ====================

// Función principal para inicializar el escáner en cualquier página
function configurarEscannerGlobal() {
    // Inicializar el sistema de escáner
    scanner.inicializar(procesarProductoEscaneado);
    
    // Buscar input de escáner en la página
    const scannerInput = document.getElementById('scannerInput');
    if (scannerInput) {
        scanner.configurarInputVisible(scannerInput);
        console.log('✅ Escáner configurado en input visible');
    } else {
        // Usar input oculto
        console.log('✅ Escáner configurado con input oculto');
    }
    
    // Agregar listener global para tecla F2 (activar escáner)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
            e.preventDefault();
            scanner.focusInput();
            if (typeof mostrarAlertaUI === 'function') {
                mostrarAlertaUI('📷 Escáner activado, enfoca el código', 'info');
            }
        }
        
        // Tecla F3 para simular escaneo (pruebas)
        if (e.key === 'F3') {
            e.preventDefault();
            const codigoSimulado = prompt('Ingresa código de prueba:', '7702123456789');
            if (codigoSimulado) {
                scanner.simularEscaneo(codigoSimulado);
            }
        }
    });
    
    console.log('💡 Presiona F2 para activar el escáner | F3 para simular escaneo');
}

// ==================== PRUEBA DEL ESCÁNER ====================

function probarEscanner() {
    console.log('=== PRUEBA DEL ESCÁNER ===');
    console.log('1. Conecta el escáner USB a tu PC');
    console.log('2. Abre el Bloc de Notas');
    console.log('3. Escanea un código - debería aparecer el número');
    console.log('4. Si funciona en Bloc de Notas, funcionará en el sistema');
    console.log('');
    console.log('Para probar sin escáner:');
    console.log('- Presiona F3 y escribe un código manualmente');
    console.log('- O escribe el código en el input y presiona Enter');
}

// Exportar funciones para uso global
window.scanner = scanner;
window.probarEscanner = probarEscanner;
window.configurarEscannerGlobal = configurarEscannerGlobal;
window.iniciarEscaneoCamara = iniciarEscaneoCamara;
window.detenerEscaneoCamara = detenerEscaneoCamara;

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    configurarEscannerGlobal();
    console.log('🔧 Escáner listo para usar');
    probarEscanner();
});