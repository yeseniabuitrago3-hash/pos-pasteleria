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
    
    const responsableInput = document.getElementById('nombreResponsable');
    const responsable = responsableInput ? responsableInput.value.trim() : '';
    const modo = sessionStorage.getItem('modoTurno') || 'manana';
    
    if (!responsable) {
        mostrarAlertaUI('❌ Ingresa el nombre del responsable del turno', 'error');
        return;
    }
    
    if (modo === 'tarde' && billetes === 0 && monedas === 0) {
        mostrarAlertaUI('❌ Debes ingresar la base inicial de efectivo para el turno de tarde', 'error');
        return;
    }
    
    const baseTotal = modo === 'tarde' ? billetes + monedas : 0;
    
    const apertura = {
        modo,
        responsable,
        base_billetes: modo === 'tarde' ? billetes : 0,
        base_monedas: modo === 'tarde' ? monedas : 0,
        base_total: baseTotal,
        fecha: new Date().toISOString(),
        usuario: responsable,
        estado: 'abierta'
    };
    
    const aperturaGuardada = DB.add('aperturas_caja', apertura);
    localStorage.setItem('pos_apertura_actual_id', aperturaGuardada.id);
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
                if (window.location.pathname.includes('inventario.html') && typeof buscarProductoPorCodigoInventario === 'function') {
                    buscarProductoPorCodigoInventario(codigo);
                } else {
                    procesarProductoEscaneado(codigo);
                }
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
        const estadoClase = p.stock_actual <= p.stock_minimo ? 'badge-warning' : 'badge-success';
        
        html += `
            <tr>
                <td>${p.codigo_barras}</td>
                <td>${p.nombre}</td>
                <td>$${p.precio.toLocaleString()}</td>
                <td><span class="badge ${estadoClase}">${p.stock_actual}</span></td>
                <td>${p.stock_minimo}</td>
                <td>${p.categoria}</td>
                <td class="actions-cell">
                    <button onclick="abrirModalEditarProducto(${p.id})" class="btn-sm btn-outline" title="Editar precio y stock">✏️</button>
                    <button onclick="abrirModalRecibirPedido(${p.id})" class="btn-sm btn-success" title="Registrar unidades">📦</button>
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = html;
}

function buscarProductoPorCodigoInventario(codigo = '') {
    const input = document.getElementById('scannerInput');
    const codigoBuscado = codigo || (input ? input.value.trim() : '');
    if (!codigoBuscado) {
        mostrarAlertaUI('❌ Ingresa o escanea un código para buscar', 'error');
        return;
    }

    const producto = DB.find('productos', 'codigo_barras', codigoBuscado)[0];
    if (!producto) {
        mostrarAlertaUI(`❌ Producto con código ${codigoBuscado} no encontrado`, 'error');
        if (input) input.value = '';
        return;
    }

    mostrarAlertaUI(`✅ Producto encontrado: ${producto.nombre} — Stock: ${producto.stock_actual}`, 'success');
    if (input) input.value = '';
    abrirModalEditarProducto(producto.id);
}

function abrirModalEditarProducto(productoId) {
    const producto = DB.findOne('productos', 'id', productoId);
    if (!producto) return;

    document.getElementById('editarProductoId').value = producto.id;
    document.getElementById('editarProductoNombre').textContent = producto.nombre;
    document.getElementById('editarProductoPrecio').value = producto.precio;
    document.getElementById('editarProductoStock').value = producto.stock_actual;
    document.getElementById('editarProductoMinimo').value = producto.stock_minimo;
    document.getElementById('editarProductoCategoria').value = producto.categoria || '';
    document.getElementById('editarProductoProveedor').value = producto.proveedor || '';
    document.getElementById('modalEditarProducto').style.display = 'flex';
}

function cerrarModalEditarProducto() {
    const modal = document.getElementById('modalEditarProducto');
    if (modal) modal.style.display = 'none';
}

function guardarEdicionProducto() {
    const id = parseInt(document.getElementById('editarProductoId').value, 10);
    const precio = parseFloat(document.getElementById('editarProductoPrecio').value) || 0;
    const stock = parseInt(document.getElementById('editarProductoStock').value, 10) || 0;
    const minimo = parseInt(document.getElementById('editarProductoMinimo').value, 10) || 0;
    const categoria = document.getElementById('editarProductoCategoria').value.trim();
    const proveedor = document.getElementById('editarProductoProveedor').value.trim();
    const producto = DB.findOne('productos', 'id', id);
    if (!producto) return;

    const stockCambio = stock - producto.stock_actual;
    if (stockCambio !== 0) {
        registrarMovimientoStock(id, stockCambio > 0 ? 'ENTRADA' : 'SALIDA', Math.abs(stockCambio), 'AJUSTE_MANUAL', 'admin');
    }

    DB.update('productos', id, {
        precio,
        stock_actual: stock,
        stock_minimo: minimo,
        categoria: categoria || producto.categoria,
        proveedor: proveedor || producto.proveedor
    });

    mostrarAlertaUI(`✅ ${producto.nombre} actualizado`, 'success');
    cargarInventario();
    cerrarModalEditarProducto();
}

function abrirModalRecibirPedido(productoId) {
    const producto = DB.findOne('productos', 'id', productoId);
    if (!producto) return;
    
    document.getElementById('pedidoProductoId').value = producto.id;
    document.getElementById('pedidoProductoNombre').textContent = producto.nombre;
    document.getElementById('pedidoCantidad').value = 1;
    document.getElementById('pedidoMotivo').value = '';
    document.getElementById('modalRecibirPedido').style.display = 'flex';
}

function cerrarModalRecibirPedido() {
    const modal = document.getElementById('modalRecibirPedido');
    if (modal) modal.style.display = 'none';
}

function confirmarRecepcionPedido() {
    const id = parseInt(document.getElementById('pedidoProductoId').value, 10);
    const cantidad = parseInt(document.getElementById('pedidoCantidad').value, 10) || 0;
    const motivo = document.getElementById('pedidoMotivo').value.trim() || 'Pedido recibido';
    const producto = DB.findOne('productos', 'id', id);
    if (!producto) return;

    if (cantidad <= 0) {
        mostrarAlertaUI('❌ Ingresa una cantidad válida', 'error');
        return;
    }

    registrarMovimientoStock(id, 'ENTRADA', cantidad, 'RECIBO_PEDIDO', 'admin');
    mostrarAlertaUI(`✅ ${cantidad} unidades de ${producto.nombre} agregadas al inventario`, 'success');
    cargarInventario();
    cerrarModalRecibirPedido();
}

function recibirPedido(productoId) {
    abrirModalRecibirPedido(productoId);
}

function editarProducto(id) {
    abrirModalEditarProducto(id);
}

function abrirModalAgregarProducto(codigoPrefilled = '') {
    const modal = document.getElementById('modalNuevoProducto');
    if (!modal) return;

    document.getElementById('nuevoProductoCodigo').value = codigoPrefilled || `COD${Date.now()}`;
    document.getElementById('nuevoProductoNombre').value = '';
    document.getElementById('nuevoProductoPrecio').value = '';
    document.getElementById('nuevoProductoStock').value = '';
    document.getElementById('nuevoProductoMinimo').value = 5;
    document.getElementById('nuevoProductoCategoria').value = 'Bebidas';
    document.getElementById('nuevoProductoProveedor').value = '';
    modal.style.display = 'flex';
    // Cambiar foco al campo CÓDIGO para permitir entrada de escáner
    document.getElementById('nuevoProductoCodigo').focus();
}

function cerrarModalNuevoProducto() {
    const modal = document.getElementById('modalNuevoProducto');
    if (modal) modal.style.display = 'none';
}

function guardarNuevoProductoInventario() {
    const codigo = document.getElementById('nuevoProductoCodigo').value.trim();
    const nombre = document.getElementById('nuevoProductoNombre').value.trim();
    const precio = parseFloat(document.getElementById('nuevoProductoPrecio').value) || 0;
    const stock = parseInt(document.getElementById('nuevoProductoStock').value, 10) || 0;
    const minimo = parseInt(document.getElementById('nuevoProductoMinimo').value, 10) || 5;
    const categoria = document.getElementById('nuevoProductoCategoria').value.trim() || 'Otros';
    const proveedor = document.getElementById('nuevoProductoProveedor').value.trim() || 'Proveedor';

    if (!codigo || !nombre || precio <= 0) {
        mostrarAlertaUI('❌ Completa todos los campos obligatorios', 'error');
        return;
    }

    try {
        agregarProducto(codigo, nombre, precio, stock, minimo, categoria, proveedor);
        mostrarAlertaUI(`✅ Producto ${nombre} agregado correctamente`, 'success');
        cargarInventario();
        cerrarModalNuevoProducto();
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
window.buscarProductoPorCodigoInventario = buscarProductoPorCodigoInventario;
window.abrirModalAgregarProducto = abrirModalAgregarProducto;
window.registrarApertura = registrarApertura;
window.mostrarAlertaUI = mostrarAlertaUI;
window.mostrarToast = mostrarToast;

// ==================== INICIALIZAR VERIFICACIÓN DE INTEGRIDAD ====================
setInterval(() => {
    verificarIntegridadDatos();
}, 60000); // Cada minuto

// ==================== REPORTE DIARIO AUTOMÁTICO ====================
function enviarReporteDiarioAutomatico() {
    const hoy = new Date().toISOString().split('T')[0];
    const resumen = getResumenVentasDiario(hoy);
    
    if (resumen.tarde) {
        const texto = `
📊 REPORTE DIARIO PASTELERÍA
📅 ${new Date().toLocaleDateString('es-CO')}

🌅 MAÑANA (Dueño):
- Pasteles: $${(resumen.manana?.total_ventas_pasteles || 0).toLocaleString('es-CO')}
- Bebidas: $${(resumen.manana?.total_ventas_bebidas || 0).toLocaleString('es-CO')}

🌙 TARDE (Empleada):
- Pasteles: $${(resumen.tarde?.total_ventas_pasteles || 0).toLocaleString('es-CO')}
- Bebidas: $${(resumen.tarde?.total_ventas_bebidas || 0).toLocaleString('es-CO')}
- Nequi: $${(resumen.tarde?.total_nequi || 0).toLocaleString('es-CO')}
- Diferencia: ${resumen.tarde?.diferencia >= 0 ? '+' : ''}$${Math.abs(resumen.tarde?.diferencia || 0).toLocaleString('es-CO')}

✅ Total día: $${resumen.totalVentas.toLocaleString('es-CO')}
        `;
        
        console.log('📧 [REPORTE DIARIO]', texto);
        
        // Aquí se enviaría por email o WhatsApp automáticamente
        // En producción, integrar con servicio de email/WhatsApp API
    }
}

// Ejecutar reporte automático al final del día (18:00)
function programarReporteDiario() {
    const ahora = new Date();
    const horaCierre = new Date();
    horaCierre.setHours(18, 0, 0, 0);
    
    if (ahora >= horaCierre) {
        enviarReporteDiarioAutomatico();
    }
}

setInterval(programarReporteDiario, 3600000); // Verificar cada hora 