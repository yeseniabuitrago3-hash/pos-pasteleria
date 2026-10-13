<?php
/**
 * test_conexion.php
 * Verifica la conexión a Supabase
 */

require_once __DIR__ . '/conexion_supabase.php';

echo "<h1>🔍 Test de Conexión a Supabase</h1>";
echo "<pre>";

// 1. Verificar si el .env existe
$rutasEnv = [
    __DIR__ . '/../.env',
    __DIR__ . '/../../.env',
    'C:/Users/disenografico/Documents/pos-pasteleria/.env',
];

echo "📂 Buscando archivo .env...\n";
foreach ($rutasEnv as $ruta) {
    echo "   - " . $ruta . " → " . (file_exists($ruta) ? "✅ EXISTE" : "❌ NO EXISTE") . "\n";
}
echo "\n";

// 2. Verificar credenciales
echo "🔑 SUPABASE_URL: " . (empty(SUPABASE_URL) ? "❌ VACÍA" : SUPABASE_URL) . "\n";
echo "🔑 SUPABASE_KEY: " . (empty(SUPABASE_KEY) ? "❌ VACÍA" : substr(SUPABASE_KEY, 0, 30) . "...") . "\n\n";

// 3. Probar conexión
$resultado = supabaseRequest('GET', 'productos?limit=5');

echo "📊 Status HTTP: " . $resultado['status'] . "\n";
echo "❌ Error: " . ($resultado['error'] ?? 'Ninguno') . "\n";
echo "📦 Datos recibidos: " . count($resultado['data'] ?? []) . " productos\n\n";

if (!empty($resultado['data'])) {
    echo "✅ ¡Conexión exitosa! Productos encontrados:\n";
    foreach ($resultado['data'] as $p) {
        echo "  - [{$p['codigo']}] {$p['nombre']} - \${$p['precio']} (Stock: {$p['stock']})\n";
    }
} else {
    echo "⚠️ No hay productos. Ejecuta el INSERT del SQL.\n";
}

echo "</pre>";