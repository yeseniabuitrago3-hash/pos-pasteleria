// ==================== APLICACIÓN PRINCIPAL ====================

// Actualizar fecha en el header
function actualizarFecha() {
    const fechaElement = document.getElementById('fechaActual');
    if (fechaElement) {
        const hoy = new Date();
        const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        fechaElement.textContent = hoy.toLocaleDateString('es-ES', opciones);
    }
}

// ==================== TOAST NOTIFICATIONS (ALERTAS VISUALES) ====================

function mostrarToast(mensaje, tipo) {
    // Crear contenedor si no existe
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        
        // Agregar estilos CSS para los toasts
        const style = document.createElement('style');
        style.textContent = `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .toast {
                background: #333;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 250px;
                animation: slideInRight 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .toast-success { background: #27ae60; }
            .toast-error { background: #e74c3c; }
            .toast-warning { background: #f39c12; }
            .toast-info { background: #3498db; }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Crear el toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    
    // Iconos según tipo
    const iconos = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${iconos[tipo] || '📢'}</span>
        <span style="flex: 1;">${mensaje}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem;">✖</button>
    `;
    
    container.appendChild(toast);
    
    // Auto desaparecer después de 3 segundos
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 300);
        }
    }, 3500);
}

// Función para mostrar alerta UI
function mostrarAlertaUI(mensaje, tipo) {
    mostrarToast(mensaje, tipo);
}

// ==================== ACTUALIZAR DASHBOARD ====================

// Actualizar resumen en dashboard
function actualizarDashboard() {
    const apertura = getAperturaActual();
    if (!apertura) return;
    
    const resumen = getResumenVentas(apertura.id);
    
    const resumenPasteles = document.getElementById('resumenPasteles');
    const resumenBebidas = document.getElementById('resumenBebidas');
    const resumenTotal = document.getElementById('resumenTotal');
    const resumenNequi = document.getElementById('resumenNequi');
    
    if (resumenPasteles) resumenPasteles.textContent = `$${resumen.totalPasteles.toLocaleString()}`;
    if (resumenBebidas) resumenBebidas.textContent = `$${resumen.totalBebidas.toLocaleString()}`;
    if (resumenTotal) resumenTotal.textContent = `$${resumen.totalEfectivo.toLocaleString()}`;
    if (resumenNequi) resumenNequi.textContent = `$${resumen.totalNequi.toLocaleString()}`;
    
    // Actualizar alertas de stock
    const productos = DB.get('productos');
    const productosCriticos = productos.filter(p => p.stock_actual <= p.stock_minimo);
    
    const alertasContainer = document.getElementById('alertasStock');
    if (alertasContainer) {
        if (productosCriticos.length === 0) {
            alertasContainer.innerHTML = '<p>✅ Todos los productos tienen stock suficiente</p>';
        } else {
            let html = '';
            productosCriticos.forEach(p => {
                html += `<div class="alert-stock" style="background: #fff3cd; padding: 10px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid #f39c12;">
                    <strong>⚠️ ${p.nombre}</strong><br>
                    Stock actual: ${p.stock_actual} (Mínimo: ${p.stock_minimo})
                </div>`;
            });
            alertasContainer.innerHTML = html;
        }
    }
}

// Actualizar estado del turno en header
function actualizarEstadoTurno() {
    const apertura = getAperturaActual();
    const estadoElement = document.getElementById('estadoTurno');
    const baseInfo = document.getElementById('baseInfo');
    
    if (estadoElement) {
        if (apertura) {
            estadoElement.className = 'estado-abierto';
            estadoElement.innerHTML = '🟢 Turno abierto';
            if (baseInfo) {
                baseInfo.innerHTML = `Base: $${apertura.base_total.toLocaleString()}`;
            }
        } else {
            estadoElement.className = 'estado-cerrado';
            estadoElement.innerHTML = '🔴 Turno cerrado';
            if (baseInfo) {
                baseInfo.innerHTML = '';
            }
        }
    }
}

// ==================== PÁGINA DE APERTURA ====================
function registrarApertura() {
    const billetesInput = document.getElementById('baseBilletes');
    const monedasInput = document.getElementById('baseMonedas');
    
    if (!billetesInput || !monedasInput) return;
    
    const billetes = parseInt(billetesInput.value.replace(/[^0-9]/g, '')) || 0;
    const monedas = parseInt(monedasInput.value.replace(/[^0-9]/g, '')) || 0;
    
    if (billetes === 0 && monedas === 0) {
        mostrarAlertaUI('❌ Debes ingresar la base inicial de efectivo', 'error');
        return;
    }
    
    const baseTotal = billetes + monedas;
    
    const apertura = {
        base_billetes: billetes,
        base_monedas: monedas,
        base_total: baseTotal,
        fecha: new Date().toISOString(),
        usuario: 'cajero',
        estado: 'abierta'
    };
    
    DB.add('aperturas_caja', apertura);
    mostrarAlertaUI(`✅ Apertura registrada con éxito. Base: $${baseTotal.toLocaleString()}`, 'success');
    
    // Redirigir a ventas después de 1.5 segundos
    setTimeout(() => {
        window.location.href = 'ventas.html';
    }, 1500);
}

// ==================== PÁGINA DE VENTAS ====================
function agregarPastel() {
    const cantidadInput = document.getElementById('cantidadPasteles');
    if (!cantidadInput) return;
    
    const cantidad = parseInt(cantidadInput.value.replace(/[^0-9]/g, '')) || 0;
    
    if (cantidad <= 0) {
        mostrarAlertaUI('❌ Ingresa una cantidad válida de pasteles', 'error');
        return;
    }
    
    const apertura = getAperturaActual();
    if (!apertura) {
        mostrarAlertaUI('❌ No hay un turno abierto. Realiza la apertura primero', 'error');
        return;
    }
    
    venderPastel(cantidad, apertura.id);
    mostrarAlertaUI(`✅ ${cantidad} pastel(es) vendido(s) por $${(cantidad * 2000).toLocaleString()}`, 'success');
    
    // Limpiar input
    cantidadInput.value = '';
    actualizarListaVentas();
    actualizarTotales();
}

// Escáner para bebidas
function inicializarScanner() {
    const scannerInput = document.getElementById('scannerInput');
    if (!scannerInput) return;
    
    scannerInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const codigo = this.value.trim();
            
            if (codigo) {
                procesarProductoEscaneado(codigo);
            }
            
            this.value = '';
        }
    });
    
    console.log('📷 Escáner inicializado. Enfoque el código de barras.');
}

function procesarProductoEscaneado(codigo) {
    const productos = DB.find('productos', 'codigo_barras', codigo);
    
    if (productos.length === 0) {
        mostrarAlertaUI(`❌ Producto con código ${codigo} no encontrado`, 'error');
        return;
    }
    
    const producto = productos[0];
    
    // Verificar stock
    if (producto.stock_actual <= 0) {
        mostrarAlertaUI(`❌ ${producto.nombre} - ¡SIN STOCK!`, 'error');
        return;
    }
    
    const apertura = getAperturaActual();
    if (!apertura) {
        mostrarAlertaUI('❌ No hay un turno abierto', 'error');
        return;
    }
    
    venderBebida(apertura.id, producto);
    mostrarAlertaUI(`✅ ${producto.nombre} vendido por $${producto.precio.toLocaleString()}`, 'success');
    
    actualizarListaBebidas();
    actualizarTotales();
}

function agregarTransferenciaNequi() {
    const montoInput = document.getElementById('montoNequi');
    const referenciaInput = document.getElementById('refNequi');
    
    if (!montoInput) return;
    
    const monto = parseInt(montoInput.value.replace(/[^0-9]/g, '')) || 0;
    const referencia = referenciaInput ? referenciaInput.value : '';
    
    if (monto <= 0) {
        mostrarAlertaUI('❌ Ingresa un monto válido', 'error');
        return;
    }
    
    const apertura = getAperturaActual();
    if (!apertura) {
        mostrarAlertaUI('❌ No hay un turno abierto', 'error');
        return;
    }
    
    const transferencia = {
        apertura_id: apertura.id,
        monto: monto,
        referencia: referencia || 'Sin referencia',
        fecha: new Date().toISOString()
    };
    
    DB.add('transferencias_nequi', transferencia);
    mostrarAlertaUI(`✅ Transferencia Nequi por $${monto.toLocaleString()} registrada`, 'success');
    
    // Limpiar inputs
    montoInput.value = '';
    if (referenciaInput) referenciaInput.value = '';
    actualizarTotales();
}

function actualizarListaVentas() {
    const apertura = getAperturaActual();
    if (!apertura) return;
    
    const ventas = DB.find('ventas_pasteles', 'apertura_id', apertura.id);
    const container = document.getElementById('listaPastelesVendidos');
    
    if (container) {
        if (ventas.length === 0) {
            container.innerHTML = '<p>No hay pasteles vendidos</p>';
        } else {
            let html = '<ul style="list-style:none; padding-left:0;">';
            ventas.forEach(v => {
                const fecha = new Date(v.fecha).toLocaleTimeString();
                html += `<li style="padding:5px 0; border-bottom:1px solid #eee;">
                            📅 ${fecha} - ${v.cantidad} ud - $${v.total.toLocaleString()}
                        </li>`;
            });
            html += '</ul>';
            container.innerHTML = html;
        }
    }
}

function actualizarListaBebidas() {
    const apertura = getAperturaActual();
    if (!apertura) return;
    
    const ventas = DB.find('ventas_bebidas', 'apertura_id', apertura.id);
    const container = document.getElementById('listaBebidasVendidas');
    const productos = DB.get('productos');
    
    if (container) {
        if (ventas.length === 0) {
            container.innerHTML = '<p>No hay bebidas vendidas</p>';
        } else {
            let html = '<ul style="list-style:none; padding-left:0;">';
            ventas.forEach(v => {
                const producto = productos.find(p => p.id === v.producto_id);
                const nombre = producto ? producto.nombre : 'Desconocido';
                const fecha = new Date(v.fecha).toLocaleTimeString();
                html += `<li style="padding:5px 0; border-bottom:1px solid #eee;">
                            📅 ${fecha} - ${nombre} - $${v.subtotal.toLocaleString()}
                        </li>`;
            });
            html += '</ul>';
            container.innerHTML = html;
        }
    }
}

function actualizarTotales() {
    const apertura = getAperturaActual();
    if (!apertura) return;
    
    const resumen = getResumenVentas(apertura.id);
    
    const totalPastelesElement = document.getElementById('totalPasteles');
    const totalBebidasElement = document.getElementById('totalBebidas');
    const totalNequiElement = document.getElementById('totalNequi');
    
    if (totalPastelesElement) totalPastelesElement.textContent = `$${resumen.totalPasteles.toLocaleString()}`;
    if (totalBebidasElement) totalBebidasElement.textContent = `$${resumen.totalBebidas.toLocaleString()}`;
    if (totalNequiElement) totalNequiElement.textContent = `$${resumen.totalNequi.toLocaleString()}`;
}

// ==================== PÁGINA DE CIERRE ====================
function cargarDatosCierre() {
    const apertura = getAperturaActual();
    if (!apertura) {
        mostrarAlertaUI('❌ No hay un turno abierto para cerrar', 'error');
        return;
    }
    
    const resumen = getResumenVentas(apertura.id);
    const efectivoEsperado = apertura.base_total + resumen.totalEfectivo;
    
    const elementos = {
        resumenPastelesCierre: document.getElementById('resumenPastelesCierre'),
        resumenBebidasCierre: document.getElementById('resumenBebidasCierre'),
        totalEfectivoCierre: document.getElementById('totalEfectivoCierre'),
        totalNequiCierre: document.getElementById('totalNequiCierre'),
        baseBilletesCierre: document.getElementById('baseBilletesCierre'),
        baseMonedasCierre: document.getElementById('baseMonedasCierre'),
        baseTotalCierre: document.getElementById('baseTotalCierre'),
        efectivoEsperado: document.getElementById('efectivoEsperado')
    };
    
    if (elementos.resumenPastelesCierre) elementos.resumenPastelesCierre.textContent = `$${resumen.totalPasteles.toLocaleString()}`;
    if (elementos.resumenBebidasCierre) elementos.resumenBebidasCierre.textContent = `$${resumen.totalBebidas.toLocaleString()}`;
    if (elementos.totalEfectivoCierre) elementos.totalEfectivoCierre.textContent = `$${resumen.totalEfectivo.toLocaleString()}`;
    if (elementos.totalNequiCierre) elementos.totalNequiCierre.textContent = `$${resumen.totalNequi.toLocaleString()}`;
    if (elementos.baseBilletesCierre) elementos.baseBilletesCierre.textContent = `$${apertura.base_billetes.toLocaleString()}`;
    if (elementos.baseMonedasCierre) elementos.baseMonedasCierre.textContent = `$${apertura.base_monedas.toLocaleString()}`;
    if (elementos.baseTotalCierre) elementos.baseTotalCierre.textContent = `$${apertura.base_total.toLocaleString()}`;
    if (elementos.efectivoEsperado) elementos.efectivoEsperado.textContent = `$${efectivoEsperado.toLocaleString()}`;
}

function registrarCierre() {
    const apertura = getAperturaActual();
    if (!apertura) {
        mostrarAlertaUI('❌ No hay un turno abierto para cerrar', 'error');
        return;
    }
    
    const efectivoContadoInput = document.getElementById('efectivoContado');
    const observacionesInput = document.getElementById('observacionesCierre');
    
    const efectivoContado = efectivoContadoInput ? parseInt(efectivoContadoInput.value.replace(/[^0-9]/g, '')) || 0 : 0;
    const observaciones = observacionesInput ? observacionesInput.value : '';
    
    if (efectivoContado === 0) {
        mostrarAlertaUI('❌ Ingresa el dinero contado en caja', 'error');
        return;
    }
    
    const resumen = getResumenVentas(apertura.id);
    const efectivoEsperado = apertura.base_total + resumen.totalEfectivo;
    const diferencia = efectivoContado - efectivoEsperado;
    
    const cierre = {
        apertura_id: apertura.id,
        total_ventas_pasteles: resumen.totalPasteles,
        total_ventas_bebidas: resumen.totalBebidas,
        total_nequi: resumen.totalNequi,
        efectivo_esperado: efectivoEsperado,
        efectivo_contado: efectivoContado,
        diferencia: diferencia,
        observaciones: observaciones || 'Sin observaciones',
        fecha_cierre: new Date().toISOString()
    };
    
    DB.add('cierres_caja', cierre);
    
    // Cerrar la apertura
    DB.update('aperturas_caja', apertura.id, { estado: 'cerrada' });
    
    const mensaje = diferencia === 0 
        ? '✅ Cierre perfecto. Caja cuadrada.' 
        : diferencia > 0 
            ? `⚠️ Cierre con sobrante de $${diferencia.toLocaleString()}`
            : `⚠️ Cierre con faltante de $${Math.abs(diferencia).toLocaleString()}`;
    
    mostrarAlertaUI(mensaje, diferencia === 0 ? 'success' : 'warning');
    
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 2000);
}

// Calcular diferencia en tiempo real
function calcularDiferencia() {
    const efectivoContadoInput = document.getElementById('efectivoContado');
    const efectivoEsperadoSpan = document.getElementById('efectivoEsperado');
    const mensajeDiv = document.getElementById('mensajeDiferencia');
    
    if (!efectivoContadoInput || !efectivoEsperadoSpan || !mensajeDiv) return;
    
    const efectivoContado = parseInt(efectivoContadoInput.value.replace(/[^0-9]/g, '')) || 0;
    const efectivoEsperadoTexto = efectivoEsperadoSpan.textContent.replace(/[^0-9]/g, '');
    const efectivoEsperado = parseInt(efectivoEsperadoTexto) || 0;
    const diferencia = efectivoContado - efectivoEsperado;
    
    if (efectivoContado > 0) {
        mensajeDiv.style.display = 'block';
        if (diferencia === 0) {
            mensajeDiv.style.background = '#d4edda';
            mensajeDiv.style.color = '#155724';
            mensajeDiv.innerHTML = `<strong>✅ ¡PERFECTO!</strong> Diferencia: $0`;
        } else if (diferencia > 0) {
            mensajeDiv.style.background = '#fff3cd';
            mensajeDiv.style.color = '#856404';
            mensajeDiv.innerHTML = `<strong>⚠️ SOBRANTE:</strong> $${diferencia.toLocaleString()}`;
        } else {
            mensajeDiv.style.background = '#f8d7da';
            mensajeDiv.style.color = '#721c24';
            mensajeDiv.innerHTML = `<strong>⚠️ FALTANTE:</strong> $${Math.abs(diferencia).toLocaleString()}`;
        }
    } else {
        mensajeDiv.style.display = 'none';
    }
}

// ==================== INVENTARIO ====================
function cargarInventario() {
    const productos = DB.get('productos');
    const container = document.getElementById('tablaInventario');
    
    if (!container) return;
    
    if (productos.length === 0) {
        container.innerHTML = '<tr><td colspan="7">No hay productos registrados</td></tr>';
        return;
    }
    
    let html = '';
    productos.forEach(p => {
        const estado = p.stock_actual <= p.stock_minimo ? '⚠️ Bajo' : '✅ OK';
        const colorEstado = p.stock_actual <= p.stock_minimo ? '#f39c12' : '#27ae60';
        
        html += `
            <tr>
                <td>${p.codigo_barras}</td>
                <td>${p.nombre}</td>
                <td>$${p.precio.toLocaleString()}</td>
                <td style="background:${colorEstado}; color:white; text-align:center; font-weight:bold;">${p.stock_actual}</td>
                <td>${p.stock_minimo}</td>
                <td>${p.categoria}</td>
                <td>
                    <button onclick="editarProducto(${p.id})" class="btn-sm">✏️</button>
                    <button onclick="recibirPedido(${p.id})" class="btn-sm" style="background:#27ae60;">📦</button>
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = html;
}

function recibirPedido(productoId) {
    const producto = DB.findOne('productos', 'id', productoId);
    if (!producto) return;
    
    const cantidad = prompt(`¿Cuántas unidades de "${producto.nombre}" llegaron?`, "0");
    if (!cantidad || parseInt(cantidad) <= 0) return;
    
    const cantidadInt = parseInt(cantidad);
    
    registrarMovimientoStock(productoId, 'ENTRADA', cantidadInt, 'RECIBO_PEDIDO', 'admin');
    mostrarAlertaUI(`✅ Pedido recibido: ${cantidadInt} unidades de ${producto.nombre}. Nuevo stock: ${producto.stock_actual + cantidadInt}`, 'success');
    
    cargarInventario();
}

function editarProducto(id) {
    const producto = DB.findOne('productos', 'id', id);
    if (!producto) return;
    
    const nuevoPrecio = prompt('Nuevo precio:', producto.precio);
    if (nuevoPrecio !== null && !isNaN(parseFloat(nuevoPrecio))) {
        producto.precio = parseFloat(nuevoPrecio);
        DB.update('productos', id, { precio: producto.precio });
        mostrarAlertaUI(`✅ Precio de ${producto.nombre} actualizado a $${producto.precio.toLocaleString()}`, 'success');
    }
    
    const nuevoStock = prompt('Nuevo stock:', producto.stock_actual);
    if (nuevoStock !== null && !isNaN(parseInt(nuevoStock))) {
        const stockNuevo = parseInt(nuevoStock);
        registrarMovimientoStock(id, stockNuevo > producto.stock_actual ? 'ENTRADA' : 'SALIDA', Math.abs(stockNuevo - producto.stock_actual), 'AJUSTE_MANUAL', 'admin');
        mostrarAlertaUI(`✅ Stock de ${producto.nombre} actualizado a ${stockNuevo}`, 'success');
    }
    
    cargarInventario();
}

function abrirModalAgregarProducto(codigoPrefilled = '') {
    const nombre = prompt('Nombre del producto:');
    if (!nombre) return;
    
    const precio = parseInt(prompt('Precio del producto:', '0'));
    if (isNaN(precio) || precio <= 0) {
        mostrarAlertaUI('❌ Precio inválido', 'error');
        return;
    }
    
    const stock = parseInt(prompt('Stock inicial:', '0')) || 0;
    const minimo = parseInt(prompt('Stock mínimo para alerta:', '5')) || 5;
    const codigo = codigoPrefilled || prompt('Código de barras:', `COD${Date.now()}`);
    const categoria = prompt('Categoría (Pasteles/Bebidas/Otros):', 'Otros');
    
    try {
        agregarProducto(codigo, nombre, precio, stock, minimo, categoria);
        mostrarAlertaUI(`✅ Producto "${nombre}" agregado correctamente`, 'success');
        cargarInventario();
    } catch (error) {
        mostrarAlertaUI(error.message, 'error');
    }
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    actualizarFecha();
    actualizarEstadoTurno();
    actualizarDashboard();
    inicializarScanner();
    
    // Configurar evento para calcular diferencia en cierre
    const efectivoContado = document.getElementById('efectivoContado');
    if (efectivoContado) {
        efectivoContado.addEventListener('input', calcularDiferencia);
    }
    
    // Actualizar cada 30 segundos
    setInterval(() => {
        actualizarDashboard();
        actualizarEstadoTurno();
    }, 30000);
});

// Hacer funciones globales
window.actualizarFecha = actualizarFecha;
window.actualizarEstadoTurno = actualizarEstadoTurno;
window.actualizarDashboard = actualizarDashboard;
window.agregarPastel = agregarPastel;
window.agregarTransferenciaNequi = agregarTransferenciaNequi;
window.actualizarListaVentas = actualizarListaVentas;
window.actualizarListaBebidas = actualizarListaBebidas;
window.actualizarTotales = actualizarTotales;
window.cargarDatosCierre = cargarDatosCierre;
window.registrarCierre = registrarCierre;
window.calcularDiferencia = calcularDiferencia;
window.cargarInventario = cargarInventario;
window.recibirPedido = recibirPedido;
window.editarProducto = editarProducto;
window.abrirModalAgregarProducto = abrirModalAgregarProducto;
window.registrarApertura = registrarApertura;
window.mostrarAlertaUI = mostrarAlertaUI;
window.mostrarToast = mostrarToast;