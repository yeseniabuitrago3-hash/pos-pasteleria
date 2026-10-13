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
$aperturaId = $_GET['apertura_id'] ?? null;

try {
    switch ($metodo) {
        case 'GET':
            if ($id) {
                $resultado = supabaseRequest('GET', "cierres_caja?id=eq.$id");
            } elseif ($aperturaId) {
                $resultado = supabaseRequest('GET', "cierres_caja?apertura_id=eq.$aperturaId&order=id.desc");
            } else {
                $resultado = supabaseRequest('GET', 'cierres_caja?order=id.desc');
            }
            if ($resultado['error']) {
                responderJSON(['success' => false, 'error' => $resultado['error']], $resultado['status']);
            }
            responderJSON(['success' => true, 'data' => $resultado['data']]);
            break;
            
        case 'POST':
            $datos = obtenerBodyJSON();
            $resultado = supabaseRequest('POST', 'cierres_caja', $datos);
            if ($resultado['error']) {
                responderJSON(['success' => false, 'error' => $resultado['error']], $resultado['status']);
            }
            responderJSON(['success' => true, 'data' => $resultado['data'][0] ?? null], 201);
            break;
            
        case 'DELETE':
            if (!$id) responderJSON(['success' => false, 'error' => 'ID requerido'], 400);
            $resultado = supabaseRequest('DELETE', "cierres_caja?id=eq.$id");
            if ($resultado['error']) {
                responderJSON(['success' => false, 'error' => $resultado['error']], $resultado['status']);
            }
            responderJSON(['success' => true, 'message' => 'Cierre eliminado']);
            break;
            
        default:
            responderJSON(['success' => false, 'error' => 'Método no permitido'], 405);
    }
} catch (Exception $e) {
    responderJSON(['success' => false, 'error' => $e->getMessage()], 500);
}