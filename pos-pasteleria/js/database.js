// ==================== CONEXIÓN A MYSQL VÍA API ====================

const API_URL = 'http://localhost/pos-pasteleria/api.php';

async function callAPI(action, data = null) {
    let url = `${API_URL}?action=${action}`;
    
    const options = {
        method: data ? 'POST' : 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
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
    
    try {
        const productos = await getProductos();
        console.log(`📦 ${productos.length} productos cargados desde MySQL`);
        
        const alertas = await getAlertasStock();
        if (alertas.length > 0) {
            console.log(`⚠️ ${alertas.length} alertas de stock activas`);
        }
        
        const apertura = await getAperturaActual();
        if (apertura) {
            console.log(`✅ Caja abierta por: ${apertura.usuario}`);
        } else {
            console.log('⚠️ No hay caja abierta');
        }
        
        console.log('✅ Sistema conectado a MySQL correctamente');
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error);
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
=======
console.log('📁 database.js cargado - Modo MySQL activo');
>>>>>>> Stashed changes
