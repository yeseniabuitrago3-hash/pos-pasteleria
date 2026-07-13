<?php
/**
 * test.php
 * Ábrelo en el navegador (dentro de phpdesktop) para diagnosticar
 * el sistema paso a paso. Bórralo cuando todo funcione si quieres,
 * pero no estorba si lo dejas.
 */
echo "<h1>🔧 Diagnóstico POS Pastelería</h1>";
echo "<p><strong>Versión de PHP:</strong> " . phpversion() . "</p>";

// 1. Verificar extensión pdo_sqlite
if (extension_loaded('pdo_sqlite')) {
    echo "<p style='color:green;'>✅ Extensión pdo_sqlite está activa</p>";
} else {
    echo "<p style='color:red; font-weight:bold;'>❌ La extensión pdo_sqlite NO está activa.</p>";
    echo "<p>Solución: abre el archivo <code>php\\php.ini</code> dentro de la carpeta del proyecto, "
       . "busca la línea <code>;extension=pdo_sqlite</code> (o <code>;extension=php_pdo_sqlite.dll</code>) "
       . "y quítale el punto y coma <code>;</code> del inicio. Guarda, cierra phpdesktop-chrome.exe "
       . "completamente desde el Administrador de tareas, y vuelve a abrirlo.</p>";
    exit;
}

// 2. Verificar conexión
echo "<hr><h2>Conexión a la base de datos</h2>";
try {
    require_once __DIR__ . '/conexion.php';
    if (isset($conn)) {
        echo "<p style='color:green;'>✅ Variable \$conn creada correctamente (PDO conectado)</p>";
    } else {
        echo "<p style='color:red;'>❌ \$conn no se definió</p>";
        exit;
    }
} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Error al conectar: " . $e->getMessage() . "</p>";
    exit;
}

// 3. Verificar tablas y datos
echo "<hr><h2>Datos en la base</h2>";
try {
    $stmt = $conn->query("SELECT COUNT(*) as total FROM productos");
    $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>📊 Total de productos: <strong>" . $resultado['total'] . "</strong></p>";

    $stmt = $conn->query("SELECT codigo, nombre, stock, stock_minimo FROM productos ORDER BY nombre LIMIT 10");
    $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "<table border='1' cellpadding='6' style='border-collapse:collapse;'>";
    echo "<tr><th>Código</th><th>Nombre</th><th>Stock</th><th>Mínimo</th></tr>";
    foreach ($productos as $p) {
        echo "<tr><td>{$p['codigo']}</td><td>{$p['nombre']}</td><td>{$p['stock']}</td><td>{$p['stock_minimo']}</td></tr>";
    }
    echo "</table>";

    echo "<p style='color:green; font-size:1.2rem; margin-top:20px;'>✅ Todo funciona. La base de datos está en: "
       . __DIR__ . "/database/pos_pasteleria.sqlite</p>";
    echo "<p><a href='index.html'>Ir al inicio</a> | <a href='pages/inventario.html'>Ir a inventario</a></p>";

} catch (PDOException $e) {
    echo "<p style='color:red;'>❌ Error al leer productos: " . $e->getMessage() . "</p>";
}
