<?php
/**
 * api/facturas.php
 * API REST para gestionar facturas de compra
 */

require_once __DIR__ . '/../conexion_supabase.php';

manejarOPTIONS();

$metodo = $_SERVER['REQUEST_METHOD'];

try {
    switch ($metodo) {
        case 'GET':
            $resultado = supabaseRequest('GET', 'facturas_compra?order=id.desc');
            if ($resultado['error']) {
                responderJSON(['success' => false, 'error' => $resultado['error']], $resultado['status']);
            }
            responderJSON(['success' => true, 'data' => $resultado['data']]);
            break;
            
        case 'POST':
            $datos = obtenerBodyJSON();
            $resultado = supabaseRequest('POST', 'facturas_compra', $datos);
            if ($resultado['error']) {
                responderJSON(['success' => false, 'error' => $resultado['error']], $resultado['status']);
            }
            responderJSON(['success' => true, 'data' => $resultado['data'][0] ?? null], 201);
            break;
            
        default:
            responderJSON(['success' => false, 'error' => 'Método no permitido'], 405);
    }
} catch (Exception $e) {
    responderJSON(['success' => false, 'error' => $e->getMessage()], 500);
}