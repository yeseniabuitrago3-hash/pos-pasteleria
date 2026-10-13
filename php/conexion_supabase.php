<?php
/**
 * conexion_supabase.php
 * ------------------------------------------------------------
 * ConexiÃ³n a Supabase usando la API REST (PostgREST).
 * ------------------------------------------------------------
 */

function cargarEnv($ruta) {
    if (!file_exists($ruta)) {
        return false;
    }
    
    // Leer el contenido completo del archivo
    $contenido = file_get_contents($ruta);
    
    // Quitar BOM UTF-8 si existe
    $contenido = preg_replace('/^\xEF\xBB\xBF/', '', $contenido);
    
    // Separar por lÃ­neas (acepta \r\n y \n)
    $lineas = preg_split('/\r\n|\r|\n/', $contenido);
    
    foreach ($lineas as $linea) {
        // Limpiar la lÃ­nea
        $linea = trim($linea);
        
        // Ignorar lÃ­neas vacÃ­as o comentarios
        if (empty($linea) || strpos($linea, '#') === 0) continue;
        
        // Separar clave=valor
        if (strpos($linea, '=') !== false) {
            list($clave, $valor) = explode('=', $linea, 2);
            
            // Limpiar clave: quitar espacios, comillas y caracteres invisibles
            $clave = trim($clave);
            $clave = preg_replace('/[^\x20-\x7E]/', '', $clave); // Solo ASCII imprimible
            
            // Limpiar valor: quitar espacios, comillas y caracteres invisibles
            $valor = trim($valor);
            $valor = trim($valor, '"\'');
            $valor = preg_replace('/[^\x20-\x7E]/', '', $valor); // Solo ASCII imprimible
            
            // Guardar en variables de entorno
            putenv("$clave=$valor");
            $_ENV[$clave] = $valor;
            $_SERVER[$clave] = $valor;
        }
    }
    return true;
}


// ============================================================
// 2. BUSCAR EL ARCHIVO .env EN MÃšLTIPLES UBICACIONES
// ============================================================
$posiblesRutas = [
    __DIR__ . '/../.env',                                    // Un nivel arriba (raÃ­z del proyecto)
    __DIR__ . '/../../.env',                                 // Dos niveles arriba
    __DIR__ . '/../../../.env',                              // Tres niveles arriba
    __DIR__ . '/.env',                                       // En la misma carpeta
    'C:/Users/disenografico/Documents/pos-pasteleria/.env',  // Ruta absoluta
];

$envPath = null;
foreach ($posiblesRutas as $ruta) {
    if (file_exists($ruta)) {
        $envPath = $ruta;
        break;
    }
}

// Si NO se encuentra el .env, mostrar error
if ($envPath === null) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error' => 'No se encontrÃ³ el archivo .env',
        'rutas_probadas' => $posiblesRutas,
        'directorio_actual' => __DIR__
    ], JSON_PRETTY_PRINT));
}

// Cargar el .env
cargarEnv($envPath);

// ============================================================
// 3. CONFIGURACIÃ“N DE SUPABASE
// ============================================================
$supabaseUrl = getenv('VITE_SUPABASE_URL');
$supabaseKey = getenv('VITE_SUPABASE_ANON_KEY');

// Limpiar espacios en blanco
$supabaseUrl = trim($supabaseUrl);
$supabaseKey = trim($supabaseKey);

// Verificar que las credenciales estÃ©n configuradas
if (empty($supabaseUrl) || empty($supabaseKey)) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error' => 'Las credenciales de Supabase no estÃ¡n configuradas. Verifica el archivo .env',
        'debug' => [
            'env_path' => $envPath,
            'url_vacia' => empty($supabaseUrl),
            'key_vacia' => empty($supabaseKey),
            'url_valor' => $supabaseUrl,
            'key_valor' => substr($supabaseKey, 0, 20) . '...'
        ]
    ], JSON_PRETTY_PRINT));
}

define('SUPABASE_URL', $supabaseUrl);
define('SUPABASE_KEY', $supabaseKey);

// ============================================================
// 4. FUNCIÃ“N PRINCIPAL: HACER PETICIONES A SUPABASE
// ============================================================
function supabaseRequest($metodo, $endpoint, $datos = null, $headersExtra = []) {
    $url = rtrim(SUPABASE_URL, '/') . '/rest/v1/' . ltrim($endpoint, '/');
    
    $headers = [
        'apikey: ' . SUPABASE_KEY,
        'Authorization: Bearer ' . SUPABASE_KEY,
        'Content-Type: application/json',
        'Prefer: return=representation',
    ];
    
    foreach ($headersExtra as $h) {
        $headers[] = $h;
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $metodo);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    if ($datos !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($datos));
    }
    
    $respuesta = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $errorCurl = curl_error($ch);
    // curl_close($ch); // Eliminado por deprecated en PHP 8.5
    
    if ($errorCurl) {
        return [
            'status' => 0,
            'data' => null,
            'error' => 'Error de conexiÃ³n: ' . $errorCurl
        ];
    }
    
    $dataDecodificada = json_decode($respuesta, true);
    
    if ($httpCode >= 400) {
        $mensajeError = 'Error HTTP ' . $httpCode;
        if (is_array($dataDecodificada)) {
            $mensajeError = $dataDecodificada['message'] 
                ?? $dataDecodificada['error'] 
                ?? $dataDecodificada['hint'] 
                ?? $mensajeError;
        }
        return [
            'status' => $httpCode,
            'data' => $dataDecodificada,
            'error' => $mensajeError
        ];
    }
    
    return [
        'status' => $httpCode,
        'data' => $dataDecodificada,
        'error' => null
    ];
}

// ============================================================
// 5. FUNCIONES AUXILIARES
// ============================================================
function responderJSON($data, $httpCode = 200) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code($httpCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function manejarOPTIONS() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        http_response_code(200);
        exit;
    }
}

function obtenerBodyJSON() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}
