<?php
/**
 * conexion.php
 * ------------------------------------------------------------
 * Conexión local a SQLite. NO requiere MySQL, NO requiere XAMPP,
 * NO requiere internet. Es un solo archivo en /database.
 *
 * La primera vez que se abre el sistema, esta base de datos
 * NO EXISTE todavía -> este script la crea automáticamente,
 * junto con sus tablas (llamando a database/sqlite_init.php).
 * Las siguientes veces, simplemente se conecta al archivo ya creado.
 *
 * IMPORTANTE: define la variable $conn (PDO), que es la que usa
 * pages/api/productos.php.
 * ------------------------------------------------------------
 */

$dbDir  = __DIR__ . '/database';
$dbFile = $dbDir . '/pos_pasteleria.sqlite';

if (!is_dir($dbDir)) {
    mkdir($dbDir, 0777, true);
}

$primeraVez = !file_exists($dbFile);

try {
    $conn = new PDO('sqlite:' . $dbFile);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $conn->exec('PRAGMA foreign_keys = ON');

    if ($primeraVez) {
        require_once __DIR__ . '/database/sqlite_init.php';
        crearTablas($conn);
    }
} catch (PDOException $e) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error'   => 'No se pudo conectar a la base de datos local: ' . $e->getMessage()
    ]));
} catch (Exception $e) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error'   => 'Error al inicializar el sistema: ' . $e->getMessage()
    ]));
}
