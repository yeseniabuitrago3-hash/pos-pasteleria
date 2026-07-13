<?php
/**
 * database/sqlite_init.php
 * ------------------------------------------------------------
 * Crea las tablas la PRIMERA vez que arranca el sistema.
 * Se llama automáticamente desde conexion.php - no lo ejecutes
 * a mano salvo que quieras revisar el SQL.
 * ------------------------------------------------------------
 */

function crearTablas(PDO $conn) {

    $conn->exec("
        CREATE TABLE IF NOT EXISTS productos (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo              TEXT UNIQUE NOT NULL,
            nombre              TEXT NOT NULL,
            descripcion         TEXT,
            precio              REAL NOT NULL DEFAULT 0,
            stock               INTEGER NOT NULL DEFAULT 0,
            stock_minimo        INTEGER NOT NULL DEFAULT 5,
            categoria           TEXT,
            proveedor           TEXT,
            fecha_creacion      TEXT DEFAULT (datetime('now','localtime')),
            fecha_actualizacion TEXT DEFAULT (datetime('now','localtime'))
        )
    ");

    $conn->exec("
        CREATE TABLE IF NOT EXISTS movimientos_stock (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            producto_id     INTEGER NOT NULL,
            tipo            TEXT NOT NULL,
            cantidad        INTEGER NOT NULL,
            stock_anterior  INTEGER,
            stock_nuevo     INTEGER,
            motivo          TEXT,
            fecha           TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
        )
    ");

    $conn->exec("CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo)");
    $conn->exec("CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_stock(producto_id)");

    // Productos de ejemplo, solo si la tabla recién se creó vacía.
    // Así el cliente ve el sistema funcionando desde el primer arranque.
    $totalStmt = $conn->query("SELECT COUNT(*) FROM productos");
    $total = (int)$totalStmt->fetchColumn();

    if ($total === 0) {
        $conn->exec("
            INSERT INTO productos (codigo, nombre, descripcion, precio, stock, stock_minimo, categoria, proveedor) VALUES
            ('BEB101',  'Gaseosa Coca-Cola 400ml', 'Botella 400ml - Tanque frío', 4000, 80, 15, 'Bebidas Frías', 'Coca-Cola'),
            ('PAST001', 'Pastel individual',       'Venta al público',            2000, 30, 10, 'Pasteles',      'Producción propia'),
            ('AGU001',  'Agua Cristal 600ml',      'Agua embotellada',            2500,  3,  8, 'Bebidas Frías', 'Cristal')
        ");
    }
}
