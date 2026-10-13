<?php
// ============================================================
// HEADERS (DEBEN IR PRIMERO)
// ============================================================
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// ============================================================
// CONEXIÓN
// ============================================================
require_once __DIR__ . '/../conexion_supabase.php';

manejarOPTIONS();

$metodo = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

try {
    switch ($metodo) {
        case 'GET':
            if (isset($_GET['estado'])) {
                $estado = urlencode($_GET['estado']);
                $resultado = supabaseRequest('GET', "aperturas_caja?estado=eq.$estado&order=id.desc&limit=1");
            } elseif ($id) {
                $resultado = supabaseRequest('GET', "aperturas_caja?id=eq.$id");
            } else {
                $resultado = supabaseRequest('GET', 'aperturas_caja?order=id.desc');
            }
            
            if ($resultado['error']) {
                responderJSON(['success' => false, 'error' => $resultado['error']], $resultado['status']);
            }
            responderJSON(['success' => true, 'data' => $resultado['data']]);
            break;
            
        case 'POST':
            $datos = obtenerBodyJSON();
            $resultado = supabaseRequest('POST', 'aperturas_caja', $datos);
            if ($resultado['error']) {
                responderJSON(['success' => false, 'error' => $resultado['error']], $resultado['status']);
            }
            responderJSON(['success' => true, 'data' => $resultado['data'][0] ?? null], 201);
            break;
            
        case 'PUT':
            if (!$id) responderJSON(['success' => false, 'error' => 'ID requerido'], 400);
            $datos = obtenerBodyJSON();
            $resultado = supabaseRequest('PATCH', "aperturas_caja?id=eq.$id", $datos);
            if ($resultado['error']) {
                responderJSON(['success' => false, 'error' => $resultado['error']], $resultado['status']);
            }
            responderJSON(['success' => true, 'data' => $resultado['data'][0] ?? null]);
            break;
            
        default:
            responderJSON(['success' => false, 'error' => 'Método no permitido'], 405);
    }
} catch (Exception $e) {
    responderJSON(['success' => false, 'error' => $e->getMessage()], 500);
}