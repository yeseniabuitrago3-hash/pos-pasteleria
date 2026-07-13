// ==================== DATOS DE EJEMPLO PARA DEMOSTRACIÓN ====================

function cargarDatosEjemplo() {
    console.log('📦 Cargando datos de ejemplo para demostración...');
    
    // 1. Limpiar datos existentes (opcional, comentado para no borrar datos reales)
    // localStorage.clear();
    
    // 2. Verificar si ya hay datos
    const aperturasExistentes = DB.get('aperturas_caja');
    if (aperturasExistentes.length > 0) {
        console.log('⚠️ Ya existen datos en el sistema. No se cargarán los ejemplos.');
        return false;
    }
    
    // 3. DATOS DE APERTURA
    const apertura = {
        id: 1,
        fecha: "2026-05-13T08:00:00",
        base_billetes: 150000,
        base_monedas: 15000,
        base_total: 165000,
        estado: "cerrada",
        usuario: "cajero_demo"
    };
    DB.add('aperturas_caja', apertura);
    
    // 4. DATOS DE VENTAS - PASTELES
    const ventasPasteles = [
        { apertura_id: 1, cantidad: 3, total: 6000, fecha: "2026-05-13T10:30:00" },
        { apertura_id: 1, cantidad: 2, total: 4000, fecha: "2026-05-13T12:15:00" },
        { apertura_id: 1, cantidad: 5, total: 10000, fecha: "2026-05-13T15:45:00" }
    ];
    ventasPasteles.forEach(v => DB.add('ventas_pasteles', v));
    
    // 5. DATOS DE VENTAS - BEBIDAS (escaneadas)
    const ventasBebidas = [
        { apertura_id: 1, producto_id: 1, cantidad: 1, subtotal: 2500, fecha: "2026-05-13T11:00:00" },
        { apertura_id: 1, producto_id: 2, cantidad: 2, subtotal: 4800, fecha: "2026-05-13T13:30:00" },
        { apertura_id: 1, producto_id: 4, cantidad: 1, subtotal: 2200, fecha: "2026-05-13T16:20:00" }
    ];
    ventasBebidas.forEach(v => DB.add('ventas_bebidas', v));
    
    // 6. DATOS DE TRANSFERENCIAS NEQUI
    const nequi = [
        { apertura_id: 1, monto: 10000, referencia: "Pago Juan", fecha: "2026-05-13T14:00:00" }
    ];
    nequi.forEach(n => DB.add('transferencias_nequi', n));
    
    // 7. DATOS DE CIERRE
    const cierre = {
        apertura_id: 1,
        total_ventas_pasteles: 20000,
        total_ventas_bebidas: 9500,
        total_nequi: 10000,
        efectivo_esperado: 194500,
        efectivo_contado: 194500,
        diferencia: 0,
        observaciones: "Todo en orden",
        fecha_cierre: "2026-05-13T18:00:00"
    };
    DB.add('cierres_caja', cierre);
    
    // 8. Actualizar estado de apertura a cerrada
    DB.update('aperturas_caja', 1, { estado: 'cerrada' });
    
    // 9. Actualizar stocks de productos según ventas
    const productos = DB.get('productos');
    
    // Coca-Cola (producto_id:1) - 1 vendida
    const cocaCola = productos.find(p => p.id === 1);
    if (cocaCola) {
        const nuevasVentas = ventasBebidas.filter(v => v.producto_id === 1).length;
        DB.update('productos', 1, { stock_actual: cocaCola.stock_actual - nuevasVentas });
    }
    
    // Pepsi (producto_id:2) - 2 vendidas
    const pepsi = productos.find(p => p.id === 2);
    if (pepsi) {
        const ventasPepsi = ventasBebidas.filter(v => v.producto_id === 2).reduce((sum, v) => sum + v.cantidad, 0);
        DB.update('productos', 2, { stock_actual: pepsi.stock_actual - ventasPepsi });
    }
    
    // Jugo Hit (producto_id:4) - 1 vendida
    const jugo = productos.find(p => p.id === 4);
    if (jugo) {
        DB.update('productos', 4, { stock_actual: jugo.stock_actual - 1 });
    }
    
    console.log('✅ Datos de ejemplo cargados exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - Apertura: $${apertura.base_total.toLocaleString()}`);
    console.log(`   - Pasteles vendidos: 10 unidades = $20,000`);
    console.log(`   - Bebidas vendidas: 4 unidades = $9,500`);
    console.log(`   - Nequi: $10,000`);
    console.log(`   - Total cierre: $194,500`);
    
    return true;
}

// Función para verificar si hay datos y ofrecer cargar ejemplos
function verificarYDatosEjemplo() {
    const aperturas = DB.get('aperturas_caja');
    if (aperturas.length === 0) {
        console.log('📦 No hay datos en el sistema. ¿Desea cargar datos de ejemplo?');
        if (confirm('No hay datos registrados. ¿Desea cargar datos de ejemplo para ver cómo funciona el sistema?')) {
            cargarDatosEjemplo();
            location.reload(); // Recargar para ver los datos
        }
    }
}

// Exportar funciones
window.cargarDatosEjemplo = cargarDatosEjemplo;
window.verificarYDatosEjemplo = verificarYDatosEjemplo;

// Auto-verificar al cargar (comentado para no molestar)
// setTimeout(verificarYDatosEjemplo, 500);