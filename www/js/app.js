// ==================== APLICACIÓN PRINCIPAL ====================

// ==================== OBTENER APERTURA ACTUAL ====================
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
        console.error('Error al obtener apertura:', e);
        return null;
    }
}
window.getAperturaActual = getAperturaActual;

// ==================== BASE DE DATOS LOCAL (localStorage) ====================
const DB = {
    get: function(key) {
        try {
            const data = localStorage.getItem('pos_' + key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error en DB.get:', e);
            return [];
        }
    },
    set: function(key, data) {
        try {
            localStorage.setItem('pos_' + key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error en DB.set:', e);
            return false;
        }
    },
    add: function(key, item) {
        try {
            const items = this.get(key);
            item.id = Date.now() + Math.random() * 1000;
            items.push(item);
            this.set(key, items);
            return item;
        } catch (e) {
            console.error('Error en DB.add:', e);
            return null;
        }
    },
    find: function(key, field, value) {
        try {
            const items = this.get(key);
            return items.filter(item => item[field] == value);
        } catch (e) {
            console.error('Error en DB.find:', e);
            return [];
        }
    },
    delete: function(key, id) {
        try {
            const items = this.get(key);
            const filtered = items.filter(item => item.id != id);
            this.set(key, filtered);
            return true;
        } catch (e) {
            console.error('Error en DB.delete:', e);
            return false;
        }
    },
    findOne: function(tabla, campo, valor) {
        const items = this.get(tabla);
        return items.find(item => item[campo] == valor) || null;
    },
    update: function(tabla, id, data) {
        const items = this.get(tabla);
        const index = items.findIndex(item => item.id == id);
        if (index === -1) return false;
        Object.assign(items[index], data);
        this.set(tabla, items);
        return true;
    }
};
window.DB = DB;

// ==================== FUNCIONES DE VENTAS ====================
function venderPastel(cantidad, aperturaId) {
    try {
        const cantidadNumerica = parseInt(cantidad) || 0;
        const venta = {
            id: Date.now() + Math.random() * 1000,
            apertura_id: aperturaId,
            cantidad: cantidadNumerica,
            fecha: new Date().toISOString(),
            precio_unitario: 2000,
            subtotal: cantidadNumerica * 2000
        };
        const ventasPasteles = DB.get('ventas_pasteles');
        ventasPasteles.push(venta);
        DB.set('ventas_pasteles', ventasPasteles);
        return venta;
    } catch (e) {
        console.error('Error en venderPastel:', e);
        return null;
    }
}

function venderBebida(aperturaId, producto) {
    try {
        const venta = {
            id: Date.now() + Math.random() * 1000,
            apertura_id: aperturaId,
            producto_id: producto.id,
            cantidad: 1,
            precio: producto.precio,
            subtotal: producto.precio,
            fecha: new Date().toISOString()
        };
        const ventasBebidas = DB.get('ventas_bebidas');
        ventasBebidas.push(venta);
        DB.set('ventas_bebidas', ventasBebidas);
        return venta;
    } catch (e) {
        console.error('Error en venderBebida:', e);
        return null;
    }
}

// ==================== RESUMEN DE VENTAS ====================
// ==================== RESUMEN DE VENTAS ====================
function getResumenVentas(aperturaId) {
    const ventasPasteles = DB.get('ventas_pasteles');
    const ventasBebidas = DB.get('ventas_bebidas');
    const transferencias = DB.get('transferencias_nequi');
    const devoluciones = DB.get('devoluciones') || [];

    let totalPasteles = 0, cantidadPasteles = 0;
    ventasPasteles.filter(v => parseInt(v.apertura_id) === parseInt(aperturaId)).forEach(v => {
        const devuelto = devoluciones.filter(d => d.ventaId === v.id && !d.anulada).reduce((s, d) => s + (d.cantidad || 0), 0);
        const vendido = (v.cantidad || 0) - devuelto;
        cantidadPasteles += vendido;
        totalPasteles += vendido * (v.precio_unitario || 2000);
    });

    let totalBebidas = 0, cantidadBebidas = 0;
    ventasBebidas.filter(v => parseInt(v.apertura_id) === parseInt(aperturaId)).forEach(v => {
        const devuelto = devoluciones.filter(d => d.ventaId === v.id && !d.anulada).reduce((s, d) => s + (d.cantidad || 0), 0);
        const vendido = (v.cantidad || 1) - devuelto;
        cantidadBebidas += vendido;
        totalBebidas += vendido * (v.precio || 0);
    });

    const totalEfectivo = totalPasteles + totalBebidas;
    const totalNequi = transferencias.filter(t => parseInt(t.apertura_id) === parseInt(aperturaId)).reduce((s, t) => s + (t.monto || 0), 0);

    return { totalPasteles, totalBebidas, totalEfectivo, totalNequi, cantidadPasteles, cantidadBebidas };
}
window.getResumenVentas = getResumenVentas;


// ==================== FUNCIONES DE CIERRE ====================
function cargarDatosCierre() {
    const apertura = getAperturaActual();
    if (!apertura) {
        document.getElementById('modoInfoCierre').innerHTML = '<div style="background:#f8d7da;padding:15px;border-radius:10px;color:#721c24;">❌ No hay turno abierto.</div>';
        return;
    }
    const resumen = getResumenVentas(apertura.id);
    document.getElementById('resumenPastelesCierre').textContent = `$${resumen.totalPasteles.toLocaleString('es-CO')}`;
    document.getElementById('resumenBebidasCierre').textContent = `$${resumen.totalBebidas.toLocaleString('es-CO')}`;
    document.getElementById('totalEfectivoCierre').textContent = `$${resumen.totalEfectivo.toLocaleString('es-CO')}`;
    document.getElementById('totalNequiCierre').textContent = `$${resumen.totalNequi.toLocaleString('es-CO')}`;
    document.getElementById('baseBilletesCierre').textContent = `$${(apertura.base_billetes || 0).toLocaleString('es-CO')}`;
    document.getElementById('baseMonedasCierre').textContent = `$${(apertura.base_monedas || 0).toLocaleString('es-CO')}`;
    document.getElementById('baseTotalCierre').textContent = `$${(apertura.base_total || 0).toLocaleString('es-CO')}`;
    document.getElementById('efectivoEsperado').textContent = `$${(apertura.base_total || 0 + resumen.totalEfectivo).toLocaleString('es-CO')}`;
}
window.cargarDatosCierre = cargarDatosCierre;

// ==================== VERIFICACIÓN DE INTEGRIDAD (CORREGIDA) ====================
function verificarIntegridadDatos() {
    console.log('🔍 Verificando integridad de datos...');
    const aperturas = DB.get('aperturas_caja');
    const cierres = DB.get('cierres_caja');
    const idsAperturas = new Set(aperturas.map(a => a.id));
    const cierresSinApertura = cierres.filter(c => !idsAperturas.has(c.apertura_id));
    if (cierresSinApertura.length > 0) {
        console.warn('⚠️ Cierres sin apertura:', cierresSinApertura.length);
    }
    console.log('✅ Verificación completada');
}
window.verificarIntegridadDatos = verificarIntegridadDatos;

console.log('✅ app.js cargado correctamente');