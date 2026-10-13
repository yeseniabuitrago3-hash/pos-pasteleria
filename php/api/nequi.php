<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../conexion_supabase.php';
manejarOPTIONS();

$metodo = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$aperturaId = $_GET['apertura_id'] ?? null;

try {
    switch ($metodo) {
        case 'GET':
            if ($aperturaId) {
                $resultado = supabaseRequest('GET', "transferencias_nequi?apertura_id=eq.$aperturaId&order=id.desc");
            } else {
                $resultado = supabaseRequest('GET', 'transferencias_nequi?order=id.desc');
            }
            if ($resultado['error']) {
                responderJSON(['success' => false, 'error' => $resultado['error']], $resultado['status']);
            }
            responderJSON(['success' => true, 'data' => $resultado['data']]);
            break;
            
        case 'POST':
            $datos = obtenerBodyJSON();
            $resultado = supabaseRequest('POST', 'transferencias_nequi', $datos);
            if ($resultado['error']) {
                responderJSON(['success' => false, 'error' => $resultado['error']], $resultado['status']);
            }
            responderJSON(['success' => true, 'data' => $resultado['data'][0] ?? null], 201);
            break;
            
        case 'DELETE':
            if (!$id) responderJSON(['success' => false, 'error' => 'ID requerido'], 400);
            $resultado = supabaseRequest('DELETE', "transferencias_nequi?id=eq.$id");
            if ($resultado['error']) {
                responderJSON(['success' => false, 'error' => $resultado['error']], $resultado['status']);
            }
            responderJSON(['success' => true, 'message' => 'Transferencia eliminada']);
            break;
            
        default:
            responderJSON(['success' => false, 'error' => 'Método no permitido'], 405);
    }
} catch (Exception $e) {
    responderJSON(['success' => false, 'error' => $e->getMessage()], 500);
}