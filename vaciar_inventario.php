<?php
/**
 * vaciar_inventario.php
 * ------------------------------------------------------------
 * Ábrelo UNA vez en el navegador (dentro de phpdesktop) para borrar
 * los productos de ejemplo (BEB101, PAST001, AGU001) y dejar el
 * inventario en blanco, listo para cargar tus productos reales
 * escaneándolos.
 *
 * Después de usarlo, BÓRRALO o simplemente no lo vuelvas a abrir
 * (no hace daño si lo abres de nuevo, solo confirma que ya está vacío).
 * ------------------------------------------------------------
 */

require_once __DIR__ . '/conexion.php';

echo "<h1>🧹 Vaciar inventario</h1>";

try {
    $totalAntes = (int)$conn->query("SELECT COUNT(*) FROM productos")->fetchColumn();

    $conn->exec("DELETE FROM movimientos_stock");
    $conn->exec("DELETE FROM productos");
    // Reinicia el contador de IDs para que el próximo producto empiece en 1
    $conn->exec("DELETE FROM sqlite_sequence WHERE name='productos'");
    $conn->exec("DELETE FROM sqlite_sequence WHERE name='movimientos_stock'");

    echo "<p style='color:green; font-size:1.2rem;'>✅ Se eliminaron $totalAntes productos y todo su historial de movimientos.</p>";
    echo "<p>El inventario está vacío. Ya puedes ir a <strong>Inventario</strong> y agregar tus productos reales, "
       . "sea escaneándolos con el botón \"Agregar Rápido\" o con \"Nuevo Producto\".</p>";
    echo "<p><a href='index.html'>Ir al inicio</a> | <a href='pages/inventario.html'>Ir a inventario</a></p>";
} catch (PDOException $e) {
    echo "<p style='color:red;'>❌ Error: " . $e->getMessage() . "</p>";
}
