// ==================== CONEXIÓN A MYSQL VÍA API ====================

<<<<<<< HEAD
// ==================== SISTEMA DE USUARIO Y PERMISOS ====================
const USUARIOS = {
    // Obtener usuario actual (simulado)
    getActual: () => {
        let usuario = localStorage.getItem('usuario_actual');
        if (!usuario) {
            // Valor por defecto: Admin
            usuario = { nombre: 'Admin', rol: 'Admin', id: 1 };
            localStorage.setItem('usuario_actual', JSON.stringify(usuario));
        } else {
            usuario = JSON.parse(usuario);
        }
        return usuario;
    },
    
    // Cambiar usuario actual (para pruebas)
    setActual: (nombre, rol = 'Admin') => {
        const usuario = { nombre, rol, id: Date.now() };
        localStorage.setItem('usuario_actual', JSON.stringify(usuario));
        return usuario;
    },
    
    // Verificar si el usuario tiene un rol específico
    tieneRol: (rolRequerido) => {
        const usuario = USUARIOS.getActual();
        return usuario && usuario.rol === rolRequerido;
    }
};

// Inicializar usuario por defecto
USUARIOS.getActual();

// Inicializar base de datos
const DB = {
    // Obtener todos los datos de una tabla
    get: (tabla) => {
        const data = localStorage.getItem(`pos_${tabla}`);
        return data ? JSON.parse(data) : [];
    },
=======
const API_URL = 'http://localhost/pos-pasteleria/api.php';

async function callAPI(action, data = null) {
    let url = `${API_URL}?action=${action}`;
>>>>>>> 5e22d69c946347c79fa5ce3e53dbab5a30c9f478
    
    const options = {
        method: data ? 'POST' : 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
<<<<<<< HEAD
    // Tablas que deben existir siempre
    const tablasRequeridas = [
        'aperturas_caja', 
        'ventas_pasteles', 
        'ventas_bebidas', 
        'transferencias_nequi', 
        'cierres_caja', 
        'movimientos_stock',
        'ventas_detalle',      // ← Tabla unificada para análisis
        'alertas_stock', 
        'alertas_vencidos',
        'devoluciones'
    ];
=======
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        console.log(`✅ API ${action}:`, result);
        return result;
    } catch (error) {
        console.error(`❌ Error en API (${action}):`, error);
        return { error: error.message };
    }
}

// ==================== PRODUCTOS ====================

async function getProductos() {
    const productos = await callAPI('get_productos');
    return Array.isArray(productos) ? productos : [];
}

async function getProductoByCodigo(codigo) {
    return await callAPI(`get_producto_by_codigo&codigo=${codigo}`);
}

// ==================== APERTURA Y CIERRE DE CAJA ====================

async function getAperturaActual() {
    const result = await callAPI('get_apertura_actual');
    return result && !result.error ? result : null;
}

async function abrirCaja(usuario, montoInicial) {
    return await callAPI('abrir_caja', {
        usuario: usuario,
        monto_inicial: montoInicial
    });
}

async function cerrarCaja(aperturaId, totalPasteles, totalBebidas, totalNequi) {
    return await callAPI('cerrar_caja', {
        apertura_id: aperturaId,
        total_pasteles: totalPasteles,
        total_bebidas: totalBebidas,
        total_nequi: totalNequi
    });
}

// ==================== VENTAS ====================

async function registrarVenta(venta) {
    return await callAPI('registrar_venta', venta);
}

async function venderPastel(aperturaId, cantidad, usuario = 'cajero') {
    return await callAPI('vender_pastel', {
        apertura_id: aperturaId,
        cantidad: cantidad,
        usuario: usuario
    });
}

async function getResumenVentas(aperturaId) {
    const result = await callAPI(`get_resumen_ventas&apertura_id=${aperturaId}`);
    return result || { totalPasteles: 0, totalBebidas: 0, totalEfectivo: 0, totalNequi: 0 };
}

// ==================== MOVIMIENTOS ====================

async function getMovimientosStock() {
    const movimientos = await callAPI('get_movimientos_stock');
    return Array.isArray(movimientos) ? movimientos : [];
}

// ==================== ALERTAS ====================

async function getAlertasStock() {
    const alertas = await callAPI('get_alertas_stock');
    return Array.isArray(alertas) ? alertas : [];
}

// ==================== INICIALIZACIÓN ====================

async function inicializarSistema() {
    console.log('🔄 Conectando a MySQL...');
>>>>>>> 5e22d69c946347c79fa5ce3e53dbab5a30c9f478
    
    try {
        const productos = await getProductos();
        console.log(`📦 ${productos.length} productos cargados desde MySQL`);
        
        const alertas = await getAlertasStock();
        if (alertas.length > 0) {
            console.log(`⚠️ ${alertas.length} alertas de stock activas`);
        }
<<<<<<< HEAD
    });
    
    // Migrar datos antiguos si es necesario
    migrarDatosAntiguos();
    
    console.log('🗄️ Base de datos inicializada correctamente');
}

// Migrar datos antiguos a ventas_detalle
function migrarDatosAntiguos() {
    const ventasDetalle = DB.get('ventas_detalle');
    if (ventasDetalle.length > 0) return;
    
    console.log('🔄 Migrando datos antiguos a ventas_detalle...');
    
    // Migrar pasteles
    const ventasPasteles = DB.get('ventas_pasteles') || [];
    ventasPasteles.forEach(v => {
        DB.add('ventas_detalle', {
            ventaId: v.id,
            apertura_id: v.apertura_id,
            producto_id: 0,
            nombre: 'Pastel Tradicional',
            cantidad: v.cantidad,
            precio_unitario: 2000,
            total: v.total,
            categoria: 'Pasteles',
            fecha: v.fecha
        });
    });
    
    // Migrar bebidas
    const ventasBebidas = DB.get('ventas_bebidas') || [];
    const productos = DB.get('productos') || [];
    ventasBebidas.forEach(v => {
        const prod = productos.find(p => p.id === v.producto_id);
        DB.add('ventas_detalle', {
            ventaId: v.id,
            apertura_id: v.apertura_id,
            producto_id: v.producto_id,
            nombre: prod ? prod.nombre : 'Producto',
            cantidad: v.cantidad || 1,
            precio_unitario: prod ? prod.precio : 0,
            total: v.subtotal || 0,
            categoria: prod ? prod.categoria : 'Bebidas',
            fecha: v.fecha
        });
    });
    
    console.log('✅ Migración completada');
}

// ==================== FUNCIONES DE NEGOCIO ====================

// Obtener apertura actual (turno abierto)
function getAperturaActual() {
    const aperturas = DB.get('aperturas_caja').filter(a => a.estado === 'abierta');
    if (aperturas.length === 0) return null;

    const aperturaActualId = localStorage.getItem('pos_apertura_actual_id');
    if (aperturaActualId) {
        const aperturaPorId = aperturas.find(a => String(a.id) === aperturaActualId);
        if (aperturaPorId) return aperturaPorId;
    }

    // Si no hay ID específico, tomar la apertura abierta más reciente
    return aperturas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0] || null;
}

// Registrar movimiento de stock
function registrarMovimientoStock(productoId, tipo, cantidad, motivo, usuario) {
    const producto = DB.findOne('productos', 'id', productoId);
    if (!producto) return null;
    
    const stockAnterior = producto.stock_actual;
    const stockNuevo = tipo === 'ENTRADA' ? stockAnterior + cantidad : stockAnterior - cantidad;
    
    const movimiento = {
        producto_id: productoId,
        tipo: tipo,
        cantidad: cantidad,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        motivo: motivo,
        usuario: usuario || 'sistema',
        fecha: new Date().toISOString()
    };
    
    DB.add('movimientos_stock', movimiento);
    
    // Actualizar stock del producto
    producto.stock_actual = stockNuevo;
    DB.update('productos', productoId, { stock_actual: stockNuevo });
    
    return movimiento;
}

// Vender pastel (precio fijo $2000)
function venderPastel(cantidad, aperturaId) {
    const precioUnitario = 2000;
    const total = cantidad * precioUnitario;
    
    const venta = {
        apertura_id: aperturaId,
        cantidad: cantidad,
        total: total,
        fecha: new Date().toISOString()
    };
    
    DB.add('ventas_pasteles', venta);
    
    // Registrar en ventas_detalle para análisis
    DB.add('ventas_detalle', {
        ventaId: venta.id,
        apertura_id: aperturaId,
        producto_id: 0,
        nombre: 'Pastel Tradicional',
        cantidad: cantidad,
        precio_unitario: precioUnitario,
        total: total,
        categoria: 'Pasteles',
        fecha: new Date().toISOString()
    });
    
    return venta;
}

// Vender bebida (producto escaneado)
function venderBebida(aperturaId, producto) {
    const venta = {
        apertura_id: aperturaId,
        producto_id: producto.id,
        cantidad: 1,
        precio_unitario: producto.precio,
        subtotal: producto.precio,
        fecha: new Date().toISOString()
    };
    
    DB.add('ventas_bebidas', venta);
    
    // Registrar en ventas_detalle para análisis
    DB.add('ventas_detalle', {
        ventaId: venta.id,
        apertura_id: aperturaId,
        producto_id: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        precio_unitario: producto.precio,
        total: producto.precio,
        categoria: producto.categoria || 'Bebidas',
        fecha: new Date().toISOString()
    });
    
    // Reducir stock
    registrarMovimientoStock(producto.id, 'SALIDA', 1, 'VENTA', 'cajero');
    
    return venta;
}

// Obtener resumen de ventas (CORREGIDO)
function getResumenVentas(aperturaId) {
    const ventasPasteles = DB.find('ventas_pasteles', 'apertura_id', aperturaId);
    const ventasBebidas = DB.find('ventas_bebidas', 'apertura_id', aperturaId);
    const transferencias = DB.find('transferencias_nequi', 'apertura_id', aperturaId);
    
    const totalPasteles = ventasPasteles.reduce((sum, v) => sum + (v.total || 0), 0);
    const totalBebidas = ventasBebidas.reduce((sum, v) => sum + (v.subtotal || 0), 0);
    const totalNequi = transferencias.reduce((sum, t) => sum + (t.monto || 0), 0);
    
    return {
        totalPasteles: totalPasteles,
        totalBebidas: totalBebidas,
        totalEfectivo: totalPasteles + totalBebidas,  // ← Propiedad IMPORTANTE
        totalNequi: totalNequi,
        cantidadPasteles: ventasPasteles.reduce((sum, v) => sum + (v.cantidad || 0), 0),
        cantidadBebidas: ventasBebidas.length
    };
}

// Agregar producto nuevo
function agregarProducto(codigo, nombre, precio, stockInicial, stockMinimo, categoria, proveedor, costo) {
    const existente = DB.findOne('productos', 'codigo_barras', codigo);
    if (existente) {
        throw new Error(`El producto con código ${codigo} ya existe: ${existente.nombre}`);
=======
        
        const apertura = await getAperturaActual();
        if (apertura) {
            console.log(`✅ Caja abierta por: ${apertura.usuario}`);
        } else {
            console.log('⚠️ No hay caja abierta');
        }
        
        console.log('✅ Sistema conectado a MySQL correctamente');
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error);
>>>>>>> 5e22d69c946347c79fa5ce3e53dbab5a30c9f478
    }
}

// Hacer funciones globales
window.getProductos = getProductos;
window.getProductoByCodigo = getProductoByCodigo;
window.getAperturaActual = getAperturaActual;
window.abrirCaja = abrirCaja;
window.cerrarCaja = cerrarCaja;
window.registrarVenta = registrarVenta;
window.venderPastel = venderPastel;
window.getResumenVentas = getResumenVentas;
window.getMovimientosStock = getMovimientosStock;
window.getAlertasStock = getAlertasStock;
window.inicializarSistema = inicializarSistema;

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', inicializarSistema);

<<<<<<< Updated upstream


// ==================== FUNCIONES PARA ANÁLISIS Y REPORTES ====================

/**
 * Obtiene todas las ventas (pasteles + bebidas) en un rango de fechas.
 * @param {Date} fechaInicio 
 * @param {Date} fechaFin 
 * @returns {Array} Lista de ventas con campos: fecha, total, tipo, producto_id, nombre, categoria, cantidad
 */
function getVentasPorRango(fechaInicio, fechaFin) {
    const ventasPasteles = DB.get('ventas_pasteles') || [];
    const ventasBebidas = DB.get('ventas_bebidas') || [];
    const productos = DB.get('productos') || [];

    const resultado = [];

    // Procesar pasteles
    ventasPasteles.forEach(v => {
        const fechaVenta = new Date(v.fecha);
        if (fechaVenta >= fechaInicio && fechaVenta <= fechaFin) {
            resultado.push({
                fecha: v.fecha,
                total: v.total,
                tipo: 'pastel',
                producto_id: null,
                nombre: 'Pastel',
                categoria: 'Pasteles',
                cantidad: v.cantidad || 1,
                apertura_id: v.apertura_id
            });
        }
    });

    // Procesar bebidas (unir con productos para obtener nombre y categoría)
    ventasBebidas.forEach(v => {
        const fechaVenta = new Date(v.fecha);
        if (fechaVenta >= fechaInicio && fechaVenta <= fechaFin) {
            const prod = productos.find(p => p.id === v.producto_id);
            resultado.push({
                fecha: v.fecha,
                total: v.subtotal,
                tipo: 'bebida',
                producto_id: v.producto_id,
                nombre: prod ? prod.nombre : 'Producto desconocido',
                categoria: prod ? prod.categoria : 'Otros',
                cantidad: 1, // cada registro de venta_bebidas es 1 unidad (no almacena cantidad múltiple)
                apertura_id: v.apertura_id
            });
        }
    });

    // Ordenar por fecha descendente (más reciente primero)
    resultado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return resultado;
}

/**
 * Obtiene el top de productos más vendidos (por cantidad) en un período.
 * @param {Date} fechaInicio 
 * @param {Date} fechaFin 
 * @returns {Array} Productos con nombre, categoria, cantidad, total
 */
function getTopProductos(fechaInicio, fechaFin) {
    const ventas = getVentasPorRango(fechaInicio, fechaFin);
    const mapa = new Map();

    ventas.forEach(venta => {
        const clave = venta.producto_id ? venta.producto_id : 'pastel';
        const nombre = venta.nombre;
        if (!mapa.has(clave)) {
            mapa.set(clave, {
                nombre: nombre,
                categoria: venta.categoria,
                cantidad: 0,
                total: 0
            });
        }
        const prod = mapa.get(clave);
        prod.cantidad += venta.cantidad;
        prod.total += venta.total;
    });

    // Convertir a array y ordenar por cantidad descendente
    return Array.from(mapa.values()).sort((a, b) => b.cantidad - a.cantidad);
}

// ==================== GESTIÓN DE DEVOLUCIONES ====================

/**
 * Registrar una devolución.
 * devolucion: { ventaId, aperturaId, productoId, cantidad, restock, motivo, usuario }
 */
function registrarDevolucion(devolucion) {
    // ✅ CORREGIDO: Aceptar productoId 0 (pasteles) - no usar !devolucion.productoId
    if (!devolucion || devolucion.productoId === undefined || devolucion.productoId === null || !devolucion.cantidad) {
        throw new Error('Datos incompletos para registrar devolución');
    }

    const aperturaActual = getAperturaActual();
    const aperturaId = devolucion.aperturaId || (aperturaActual ? aperturaActual.id : null);
    if (!aperturaId) throw new Error('No hay apertura asociada a la devolución');

    const producto = DB.findOne('productos', 'id', devolucion.productoId);
    const cantidad = parseInt(devolucion.cantidad, 10);
    if (isNaN(cantidad) || cantidad <= 0) throw new Error('Cantidad de devolución inválida');

    const usuario = devolucion.usuario || (aperturaActual ? aperturaActual.responsable : 'sistema');

    // Crear registro de devolución
    const nuevo = {
        ventaId: devolucion.ventaId || null,
        aperturaId: aperturaId,
        productoId: devolucion.productoId,
        cantidad: cantidad,
        restock: !!devolucion.restock,
        motivo: devolucion.motivo || 'No especificado',
        usuario: usuario,
        fecha: new Date().toISOString()
    };

    // Calcular valor de devolución según precio del producto
    let precioUnitario = 0;
    if (producto) precioUnitario = producto.precio || 0;
    else if (nuevo.productoId === 0) precioUnitario = 2000; // Pastel tradicional por defecto
    nuevo.valor = precioUnitario * cantidad;

    const creado = DB.add('devoluciones', nuevo);

    // Si se reingresa al stock, registrar movimiento de ENTRADA
    if (creado.restock) {
        registrarMovimientoStock(creado.productoId, 'ENTRADA', creado.cantidad, 'DEVOLUCION', creado.usuario);
    }

    // Actualizar registros de ventas para reflejar cantidad devuelta
    // Bebidas (ventas_bebidas) - cada registro es 1 unidad
    let restante = creado.cantidad;
    const ventasBebidas = DB.get('ventas_bebidas') || [];
    for (let i = 0; i < ventasBebidas.length && restante > 0; i++) {
        const v = ventasBebidas[i];
        if (String(v.apertura_id) !== String(creado.aperturaId)) continue;
        if (String(v.producto_id) !== String(creado.productoId)) continue;
        const devuelto = v.cantidadDevuelta || 0;
        const disponible = (v.cantidad || 1) - devuelto;
        if (disponible <= 0) continue;
        const aDevolver = Math.min(disponible, restante);
        // Marcar en la venta
        v.cantidadDevuelta = (v.cantidadDevuelta || 0) + aDevolver;
        v.estadoDevolucion = (v.cantidadDevuelta >= (v.cantidad || 1)) ? 'total' : 'parcial';
        DB.update('ventas_bebidas', v.id, { cantidadDevuelta: v.cantidadDevuelta, estadoDevolucion: v.estadoDevolucion, subtotal: (v.subtotal || 0) - (precioUnitario * aDevolver) });
        restante -= aDevolver;
    }

    // Pasteles (ventas_pasteles)
    if (restante > 0) {
        const ventasPasteles = DB.get('ventas_pasteles') || [];
        for (let i = 0; i < ventasPasteles.length && restante > 0; i++) {
            const v = ventasPasteles[i];
            if (String(v.apertura_id) !== String(creado.aperturaId)) continue;
            const devuelto = v.cantidadDevuelta || 0;
            const disponible = (v.cantidad || 0) - devuelto;
            if (disponible <= 0) continue;
            const aDevolver = Math.min(disponible, restante);
            v.cantidadDevuelta = (v.cantidadDevuelta || 0) + aDevolver;
            v.estadoDevolucion = (v.cantidadDevuelta >= (v.cantidad || 0)) ? 'total' : 'parcial';
            DB.update('ventas_pasteles', v.id, { cantidadDevuelta: v.cantidadDevuelta, estadoDevolucion: v.estadoDevolucion, total: (v.total || 0) - (precioUnitario * aDevolver) });
            restante -= aDevolver;
        }
    }

    // Actualizar ventas_detalle igualmente
    if (creado) {
        let rem = creado.cantidad;
        const detalle = DB.get('ventas_detalle') || [];
        for (let i = 0; i < detalle.length && rem > 0; i++) {
            const d = detalle[i];
            if (String(d.apertura_id) !== String(creado.aperturaId)) continue;
            if (String(d.producto_id) !== String(creado.productoId) && !(String(creado.productoId) === '0' && d.categoria === 'Pasteles')) continue;
            const dev = d.cantidadDevuelta || 0;
            const disponible = (d.cantidad || 0) - dev;
            if (disponible <= 0) continue;
            const aDev = Math.min(disponible, rem);
            d.cantidadDevuelta = (d.cantidadDevuelta || 0) + aDev;
            d.estadoDevolucion = (d.cantidadDevuelta >= (d.cantidad || 0)) ? 'total' : 'parcial';
            DB.update('ventas_detalle', d.id, { cantidadDevuelta: d.cantidadDevuelta, estadoDevolucion: d.estadoDevolucion, total: (d.total || 0) - (precioUnitario * aDev) });
            rem -= aDev;
        }
    }

    return creado;
}

function getDevolucionesPorApertura(aperturaId) {
    return DB.get('devoluciones').filter(d => String(d.aperturaId) === String(aperturaId));
}

function revertirDevolucion(devolucionId, usuario) {
    const devoluciones = DB.get('devoluciones') || [];
    const idx = devoluciones.findIndex(d => String(d.id) === String(devolucionId));
    if (idx === -1) return null;
    const dev = devoluciones[idx];
    if (dev.anulada) return dev; // ya anulada

    // Si la devolución reingresó stock, ahora debemos sacar esa cantidad
    if (dev.restock) {
        registrarMovimientoStock(dev.productoId, 'SALIDA', dev.cantidad, 'REVERTIR_DEVOLUCION', usuario || 'sistema');
    }

    // Restaurar campos en ventas: quitar cantidadDevuelta
    let restante = dev.cantidad;
    const ventasBebidas = DB.get('ventas_bebidas') || [];
    for (let i = ventasBebidas.length - 1; i >= 0 && restante > 0; i--) {
        const v = ventasBebidas[i];
        if (String(v.apertura_id) !== String(dev.aperturaId)) continue;
        if (String(v.producto_id) !== String(dev.productoId)) continue;
        const devuelto = v.cantidadDevuelta || 0;
        if (devuelto <= 0) continue;
        const a = Math.min(devuelto, restante);
        v.cantidadDevuelta = devuelto - a;
        v.estadoDevolucion = v.cantidadDevuelta > 0 ? 'parcial' : 'ninguna';
        DB.update('ventas_bebidas', v.id, { cantidadDevuelta: v.cantidadDevuelta, estadoDevolucion: v.estadoDevolucion, subtotal: (v.subtotal || 0) + ((DB.findOne('productos','id',v.producto_id)||{precio:0}).precio * a) });
        restante -= a;
    }

    if (restante > 0) {
        const ventasPasteles = DB.get('ventas_pasteles') || [];
        for (let i = ventasPasteles.length - 1; i >= 0 && restante > 0; i--) {
            const v = ventasPasteles[i];
            if (String(v.apertura_id) !== String(dev.aperturaId)) continue;
            const devuelto = v.cantidadDevuelta || 0;
            if (devuelto <= 0) continue;
            const a = Math.min(devuelto, restante);
            v.cantidadDevuelta = devuelto - a;
            v.estadoDevolucion = v.cantidadDevuelta > 0 ? 'parcial' : 'ninguna';
            DB.update('ventas_pasteles', v.id, { cantidadDevuelta: v.cantidadDevuelta, estadoDevolucion: v.estadoDevolucion, total: (v.total || 0) + (2000 * a) });
            restante -= a;
        }
    }

    // Marcar devolución como anulada y añadir auditoría
    dev.anulada = true;
    dev.anulada_por = usuario || 'sistema';
    dev.anulada_fecha = new Date().toISOString();
    DB.update('devoluciones', dev.id, { anulada: true, anulada_por: dev.anulada_por, anulada_fecha: dev.anulada_fecha });

    return dev;
}

// Exponer funciones
window.registrarDevolucion = registrarDevolucion;
window.getDevolucionesPorApertura = getDevolucionesPorApertura;
window.revertirDevolucion = revertirDevolucion;

/**
 * Calcula estadísticas resumidas para un período.
 * @param {Date} fechaInicio 
 * @param {Date} fechaFin 
 * @returns {Object} { totalVentas, totalNequi, totalPasteles, totalCierres, promedioDiario, mejorDia }
 */
function getEstadisticasPeriodo(fechaInicio, fechaFin) {
    // Obtener cierres en el rango
    const cierres = DB.get('cierres_caja') || [];
    const cierresFiltrados = cierres.filter(c => {
        const fc = new Date(c.fecha_cierre);
        return fc >= fechaInicio && fc <= fechaFin;
    });

    // Total de ventas en efectivo = suma de pasteles + bebidas de cada cierre
    const totalVentas = cierresFiltrados.reduce((sum, c) => sum + (c.total_ventas_pasteles || 0) + (c.total_ventas_bebidas || 0), 0);
    
    // Total Nequi = suma de total_nequi de cada cierre
    const totalNequi = cierresFiltrados.reduce((sum, c) => sum + (c.total_nequi || 0), 0);
    
    // Total de cierres
    const totalCierres = cierresFiltrados.length;

    // Total de pasteles vendidos (unidades) -> sumar cantidades de ventas_pasteles en el rango
    const ventasPasteles = DB.get('ventas_pasteles') || [];
    let totalPasteles = 0;
    ventasPasteles.forEach(v => {
        const fechaVenta = new Date(v.fecha);
        if (fechaVenta >= fechaInicio && fechaVenta <= fechaFin) {
            totalPasteles += (v.cantidad || 0);
        }
    });

    // Agrupar ventas por día para calcular promedio y mejor día
    const ventasPorDia = new Map();
    cierresFiltrados.forEach(c => {
        const fechaKey = new Date(c.fecha_cierre).toDateString();
        const totalDia = (c.total_ventas_pasteles || 0) + (c.total_ventas_bebidas || 0);
        ventasPorDia.set(fechaKey, (ventasPorDia.get(fechaKey) || 0) + totalDia);
    });

    let mejorDia = { fecha: '', total: 0 };
    let sumaVentasDiarias = 0;
    for (let [fecha, total] of ventasPorDia.entries()) {
        sumaVentasDiarias += total;
        if (total > mejorDia.total) {
            mejorDia = { fecha, total };
        }
    }
    const promedioDiario = ventasPorDia.size > 0 ? sumaVentasDiarias / ventasPorDia.size : 0;

    return {
        totalVentas,
        totalNequi,
        totalPasteles,
        totalCierres,
        promedioDiario,
        mejorDia
    };
}

/**
 * Obtiene ventas agrupadas por día (para el gráfico de evolución).
 * @param {Date} fechaInicio 
 * @param {Date} fechaFin 
 * @returns {Map} Mapa con clave fecha (string) y valor total de ventas (efectivo) ese día.
 */
function getVentasAgrupadasPorDia(fechaInicio, fechaFin) {
    const cierres = DB.get('cierres_caja') || [];
    const mapa = new Map();

    cierres.forEach(c => {
        const fechaCierre = new Date(c.fecha_cierre);
        if (fechaCierre >= fechaInicio && fechaCierre <= fechaFin) {
            const fechaKey = fechaCierre.toLocaleDateString('es-ES');
            const totalDia = (c.total_ventas_pasteles || 0) + (c.total_ventas_bebidas || 0);
            mapa.set(fechaKey, (mapa.get(fechaKey) || 0) + totalDia);
        }
    });

    return mapa;
}

/**
 * Obtiene tendencia mensual de ventas (para el gráfico de línea).
 * @returns {Object} { labels, data } donde labels son strings "YYYY-M" y data son totales.
 */
function getTendenciaMensual() {
    const cierres = DB.get('cierres_caja') || [];
    const porMes = new Map();

    cierres.forEach(c => {
        const fecha = new Date(c.fecha_cierre);
        const mesKey = `${fecha.getFullYear()}-${fecha.getMonth()+1}`;
        const totalVenta = (c.total_ventas_pasteles || 0) + (c.total_ventas_bebidas || 0);
        porMes.set(mesKey, (porMes.get(mesKey) || 0) + totalVenta);
    });

    const labels = Array.from(porMes.keys()).sort();
    const data = labels.map(l => porMes.get(l));
    return { labels, data };
}

/**
 * Obtiene comparativa mensual del año actual (barras).
 * @returns {Array} Array de 12 meses con total de ventas.
 */
function getComparativaMensualAnioActual() {
    const cierres = DB.get('cierres_caja') || [];
    const ventasPorMes = new Array(12).fill(0);
    const anioActual = new Date().getFullYear();

    cierres.forEach(c => {
        const fecha = new Date(c.fecha_cierre);
        if (fecha.getFullYear() === anioActual) {
            const mes = fecha.getMonth();
            ventasPorMes[mes] += (c.total_ventas_pasteles || 0) + (c.total_ventas_bebidas || 0);
        }
    });
    return ventasPorMes;
}

// Exportar funciones si se usa módulos, pero como es global, ya están disponibles

// ==================== FUNCIONES ANTIFRAUDE Y SEGURIDAD ====================

// Registrar actividad en el log
function registrarActividad(tipo, descripcion, aperturaId = null) {
    const log = {
        id: Date.now(),
        tipo: tipo, // APERTURA, VENTA, CIERRE_MANANA, CIERRE_TARDE, ALERTA
        descripcion: descripcion,
        apertura_id: aperturaId,
        usuario: getUsuarioActual(),
        fecha: new Date().toISOString(),
        ip: obtenerIPLocal()
    };
    
    const logs = DB.get('logs_actividad') || [];
    logs.push(log);
    DB.set('logs_actividad', logs);
    
    console.log(`📝 [LOG] ${tipo}: ${descripcion}`);
}

// Obtener usuario actual
function getUsuarioActual() {
    const apertura = getAperturaActual();
    if (apertura && apertura.responsable) {
        return apertura.responsable;
    }
    return 'sistema';
}

// Obtener IP local (simulada)
function obtenerIPLocal() {
    // En un entorno real, se obtendría del servidor
    return '127.0.0.1';
}

// Enviar alerta por WhatsApp (simulado - en producción se integraría con API)
function enviarAlertaWhatsApp(empleada, diferencia) {
    const mensaje = `⚠️ ALERTA POS PASTELERÍA ⚠️

Empleada: ${empleada}
Diferencia detectada: ${diferencia > 0 ? 'SOBRANTE' : 'FALTANTE'} de $${Math.abs(diferencia).toLocaleString('es-CO')}
Fecha: ${new Date().toLocaleString('es-CO')}

Por favor revisar el reporte detallado.`;

    console.log('📱 [ALERTA WHATSAPP]', mensaje);
    
    // Guardar alerta en base de datos
    const alertas = DB.get('alertas_seguridad') || [];
    alertas.push({
        id: Date.now(),
        tipo: 'DIFERENCIA_CAJA',
        empleada: empleada,
        diferencia: diferencia,
        mensaje: mensaje,
        fecha: new Date().toISOString(),
        leida: false
    });
    DB.set('alertas_seguridad', alertas);
    
    // Aquí se integraría con API real de WhatsApp
    // Ejemplo: fetch('https://api.whatsapp.com/send?phone=...')
}

// Obtener resumen de ventas del día (separado por turnos)
function getResumenVentasDiario(fecha) {
    const cierres = DB.get('cierres_caja') || [];
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);
    
    const cierresDia = cierres.filter(c => {
        const fechaCierre = new Date(c.fecha_cierre);
        return fechaCierre >= fechaInicio && fechaCierre <= fechaFin;
    });
    
    const turnoManana = cierresDia.find(c => c.modo === 'manana');
    const turnoTarde = cierresDia.find(c => c.modo === 'tarde');
    
    return {
        manana: turnoManana || null,
        tarde: turnoTarde || null,
        totalVentas: (turnoManana ? (turnoManana.total_ventas_pasteles + turnoManana.total_ventas_bebidas) : 0) +
                     (turnoTarde ? (turnoTarde.total_ventas_pasteles + turnoTarde.total_ventas_bebidas) : 0),
        totalNequi: (turnoTarde ? turnoTarde.total_nequi : 0)
    };
}

// Verificar integridad de datos (detectar posibles manipulaciones)
function verificarIntegridadDatos() {
    const alertas = [];
    const logs = DB.get('logs_actividad') || [];
    
    // Verificar si hay cierres sin apertura correspondiente
    const cierres = DB.get('cierres_caja') || [];
    const aperturas = DB.get('aperturas_caja') || [];
    
    cierres.forEach(cierre => {
        const apertura = aperturas.find(a => a.id === cierre.apertura_id);
        if (!apertura) {
            alertas.push({
                tipo: 'CIERRE_SIN_APERTURA',
                descripcion: `Cierre ID ${cierre.id} no tiene apertura asociada`,
                fecha: new Date().toISOString()
            });
        }
    });
    
    if (alertas.length > 0) {
        console.warn('⚠️ Alertas de integridad detectadas:', alertas);
        DB.set('alertas_integridad', alertas);
    }
    
    return alertas;
}

// Exportar funciones
window.registrarActividad = registrarActividad;
window.getUsuarioActual = getUsuarioActual;
window.enviarAlertaWhatsApp = enviarAlertaWhatsApp;
window.getResumenVentasDiario = getResumenVentasDiario;
window.verificarIntegridadDatos = verificarIntegridadDatos;


// ==================== FUNCIÓN PARA HISTORIAL ====================

/**
 * Obtiene todas las transferencias Nequi de un período
 * @param {Date} fechaInicio 
 * @param {Date} fechaFin 
 * @returns {Array} Transferencias Nequi en el período
 */
function getTransferenciasNequiPorRango(fechaInicio, fechaFin) {
    const transferencias = DB.get('transferencias_nequi') || [];
    return transferencias.filter(t => {
        const fecha = new Date(t.fecha);
        return fecha >= fechaInicio && fecha <= fechaFin;
    });
}

/**
 * Obtiene todas las ventas (pasteles + bebidas) de un período
 * @param {Date} fechaInicio 
 * @param {Date} fechaFin 
 * @returns {Array} Ventas en el período
 */
function getVentasPorRango(fechaInicio, fechaFin) {
    const ventasPasteles = DB.get('ventas_pasteles') || [];
    const ventasBebidas = DB.get('ventas_bebidas') || [];
    const productos = DB.get('productos') || [];
    const devoluciones = DB.get('devoluciones') || [];
    
    const resultado = [];

    // Procesar pasteles
    ventasPasteles.forEach(v => {
        const fechaVenta = new Date(v.fecha);
        if (fechaVenta >= fechaInicio && fechaVenta <= fechaFin) {
            const devuelto = devoluciones
                .filter(d => d.ventaId === v.id && !d.anulada)
                .reduce((sum, d) => sum + (d.cantidad || 0), 0);
            const disponible = (v.cantidad || 0) - devuelto;
            
            resultado.push({
                id: v.id,
                fecha: v.fecha,
                total: disponible * 2000,
                tipo: 'pastel',
                producto_id: 0,
                nombre: 'Pastel Tradicional',
                categoria: 'Pasteles',
                cantidad: disponible,
                cantidad_original: v.cantidad || 0,
                devuelto: devuelto,
                apertura_id: v.apertura_id
            });
        }
    });

    // Procesar bebidas
    ventasBebidas.forEach(v => {
        const fechaVenta = new Date(v.fecha);
        if (fechaVenta >= fechaInicio && fechaVenta <= fechaFin) {
            const prod = productos.find(p => p.id === v.producto_id);
            const devuelto = devoluciones
                .filter(d => d.ventaId === v.id && !d.anulada)
                .reduce((sum, d) => sum + (d.cantidad || 0), 0);
            const disponible = (v.cantidad || 1) - devuelto;
            
            if (disponible > 0) {
                resultado.push({
                    id: v.id,
                    fecha: v.fecha,
                    total: v.subtotal || 0,
                    tipo: 'bebida',
                    producto_id: v.producto_id,
                    nombre: prod ? prod.nombre : 'Producto desconocido',
                    categoria: prod ? prod.categoria : 'Otros',
                    cantidad: disponible,
                    cantidad_original: v.cantidad || 1,
                    devuelto: devuelto,
                    apertura_id: v.apertura_id
                });
            }
        }
    });

    // Ordenar por fecha descendente
    resultado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return resultado;
}

// Exportar funciones
window.getTransferenciasNequiPorRango = getTransferenciasNequiPorRango;
window.getVentasPorRango = getVentasPorRango;
