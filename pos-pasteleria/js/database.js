// ==================== BASE DE DATOS CON LOCALSTORAGE ====================

// Inicializar base de datos
const DB = {
    // Obtener todos los datos de una tabla
    get: (tabla) => {
        const data = localStorage.getItem(`pos_${tabla}`);
        return data ? JSON.parse(data) : [];
    },
    
    // Guardar datos en una tabla
    set: (tabla, datos) => {
        localStorage.setItem(`pos_${tabla}`, JSON.stringify(datos));
    },
    
    // Agregar un registro
    add: (tabla, registro) => {
        const datos = DB.get(tabla);
        registro.id = Date.now();
        registro.fecha_creacion = new Date().toISOString();
        datos.push(registro);
        DB.set(tabla, datos);
        return registro;
    },
    
    // Actualizar un registro
    update: (tabla, id, nuevosDatos) => {
        const datos = DB.get(tabla);
        const index = datos.findIndex(d => d.id === id);
        if (index !== -1) {
            datos[index] = { ...datos[index], ...nuevosDatos };
            DB.set(tabla, datos);
            return datos[index];
        }
        return null;
    },
    
    // Eliminar un registro
    delete: (tabla, id) => {
        let datos = DB.get(tabla);
        datos = datos.filter(d => d.id !== id);
        DB.set(tabla, datos);
    },
    
    // Buscar por campo (retorna ARRAY)
    find: (tabla, campo, valor) => {
        const datos = DB.get(tabla);
        return datos.filter(d => d[campo] === valor);
    },
    
    // Buscar UNO por campo (retorna el primer elemento o null)
    findOne: (tabla, campo, valor) => {
        const datos = DB.get(tabla);
        return datos.find(d => d[campo] === valor) || null;
    },
    
    // Obtener el último registro
    last: (tabla) => {
        const datos = DB.get(tabla);
        return datos.length > 0 ? datos[datos.length - 1] : null;
    }
};

// Productos de ejemplo
const productosPorDefecto = [
    { id: 1, codigo_barras: "7702123456789", nombre: "Coca-Cola 400ml", precio: 2500, stock_actual: 10, stock_minimo: 5, categoria: "Bebidas", proveedor: "Coca-Cola", costo_compra: 1800 },
    { id: 2, codigo_barras: "7702987654321", nombre: "Pepsi 400ml", precio: 2400, stock_actual: 8, stock_minimo: 5, categoria: "Bebidas", proveedor: "Pepsi", costo_compra: 1700 },
    { id: 3, codigo_barras: "7702111122223", nombre: "Agua Cristal 600ml", precio: 2000, stock_actual: 3, stock_minimo: 8, categoria: "Bebidas", proveedor: "Cristal", costo_compra: 1400 },
    { id: 4, codigo_barras: "7702333344445", nombre: "Jugo Hit Manzana", precio: 2200, stock_actual: 5, stock_minimo: 5, categoria: "Bebidas", proveedor: "Postobón", costo_compra: 1600 }
];

// Inicializar TODAS las tablas
function inicializarBaseDatos() {
    // Tabla de productos
    if (DB.get('productos').length === 0) {
        DB.set('productos', productosPorDefecto);
        console.log('✅ Productos inicializados');
    }
    
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
        'alertas_vencidos'
    ];
    
    tablasRequeridas.forEach(tabla => {
        if (DB.get(tabla).length === 0) {
            DB.set(tabla, []);
            console.log(`✅ Tabla ${tabla} inicializada`);
        }
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
    const aperturas = DB.get('aperturas_caja');
    return aperturas.find(a => a.estado === 'abierta');
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
    }
    
    const nuevoProducto = {
        id: Date.now(),
        codigo_barras: codigo,
        nombre: nombre,
        precio: parseFloat(precio),
        stock_actual: parseInt(stockInicial) || 0,
        stock_minimo: parseInt(stockMinimo) || 3,
        categoria: categoria || 'Bebidas',
        proveedor: proveedor || 'No especificado',
        costo_compra: costo ? parseFloat(costo) : null,
        fecha_registro: new Date().toISOString(),
        activo: true
    };
    
    DB.add('productos', nuevoProducto);
    
    if (stockInicial > 0) {
        registrarMovimientoStock(nuevoProducto.id, 'ENTRADA', stockInicial, 'PRODUCTO_NUEVO', 'sistema');
    }
    
    return nuevoProducto;
}

// Inicializar base de datos al cargar
inicializarBaseDatos();

// Hacer funciones globales
window.DB = DB;
window.getAperturaActual = getAperturaActual;
window.venderPastel = venderPastel;
window.venderBebida = venderBebida;
window.getResumenVentas = getResumenVentas;
window.agregarProducto = agregarProducto;
window.registrarMovimientoStock = registrarMovimientoStock;




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