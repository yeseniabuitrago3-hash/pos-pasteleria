<?php
/**
 * api/productos.php
 * API REST para gestionar productos en Supabase
 * 
 * Endpoints:
 *   GET    /api/productos.php           → Listar todos los productos
 *   GET    /api/productos.php?id=X      → Obtener un producto
 *   GET    /api/productos.php?codigo=X  → Buscar por código
 *   POST   /api/productos.php           → Crear producto
 *   PUT    /api/productos.php?id=X      → Actualizar producto
 *   DELETE /api/productos.php?id=X      → Eliminar producto
 */

require_once __DIR__ . '/../conexion_supabase.php';

manejarOPTIONS();

$metodo = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$codigo = $_GET['codigo'] ?? null;

try {
    switch ($metodo) {
        
        // ========================================================
        // GET: Listar u obtener productos
        // ========================================================
        case 'GET':
            if ($id) {
                // Obtener un producto específico por ID
                $resultado = supabaseRequest('GET', "productos?id=eq.$id");
            } elseif ($codigo) {
                // Buscar por código
                $codigoLimpio = urlencode(strtoupper(trim($codigo)));
                $resultado = supabaseRequest('GET', "productos?codigo=eq.$codigoLimpio");
            } else {
                // Listar todos los productos
                $resultado = supabaseRequest('GET', 'productos?order=id.asc');
            }
            
            if ($resultado['error']) {
                responderJSON([
                    'success' => false,
                    'error' => $resultado['error']
                ], $resultado['status']);
            }
            
            responderJSON([
                'success' => true,
                'data' => $resultado['data']
            ]);
            break;
        
        // ========================================================
        // POST: Crear producto
        // ========================================================
        case 'POST':
            $datos = obtenerBodyJSON();
            
            // Validar campos obligatorios
            if (empty($datos['codigo']) || empty($datos['nombre'])) {
                responderJSON([
                    'success' => false,
                    'error' => 'Los campos "codigo" y "nombre" son obligatorios'
                ], 400);
            }
            
            // Verificar que el código no exista
            $codigoLimpio = urlencode(strtoupper(trim($datos['codigo'])));
            $existente = supabaseRequest('GET', "productos?codigo=eq.$codigoLimpio");
            
            if (!empty($existente['data'])) {
                responderJSON([
                    'success' => false,
                    'error' => 'Ya existe un producto con ese código'
                ], 409);
            }
            
            // Crear el producto
            $nuevoProducto = [
                'codigo' => strtoupper(trim($datos['codigo'])),
                'nombre' => trim($datos['nombre']),
                'descripcion' => $datos['descripcion'] ?? null,
                'precio' => floatval($datos['precio'] ?? 0),
                'stock' => intval($datos['stock'] ?? 0),
                'stock_minimo' => intval($datos['stock_minimo'] ?? 5),
                'categoria' => $datos['categoria'] ?? 'Sin categoría',
                'proveedor' => $datos['proveedor'] ?? 'Sin proveedor'
            ];
            
            $resultado = supabaseRequest('POST', 'productos', $nuevoProducto);
            
            if ($resultado['error']) {
                responderJSON([
                    'success' => false,
                    'error' => $resultado['error']
                ], $resultado['status']);
            }
            
            responderJSON([
                'success' => true,
                'data' => $resultado['data'][0] ?? null,
                'message' => 'Producto creado exitosamente'
            ], 201);
            break;
        
        // ========================================================
        // PUT: Actualizar producto
        // ========================================================
        case 'PUT':
            if (!$id) {
                responderJSON([
                    'success' => false,
                    'error' => 'ID requerido para actualizar'
                ], 400);
            }
            
            $datos = obtenerBodyJSON();
            $datos['fecha_actualizacion'] = date('c');
            
            // Limpiar datos permitidos
            $datosPermitidos = ['nombre', 'descripcion', 'precio', 'stock', 'stock_minimo', 'categoria', 'proveedor'];
            $datosLimpios = [];
            foreach ($datosPermitidos as $campo) {
                if (isset($datos[$campo])) {
                    $datosLimpios[$campo] = $datos[$campo];
                }
            }
            $datosLimpios['fecha_actualizacion'] = date('c');
            
            $resultado = supabaseRequest('PATCH', "productos?id=eq.$id", $datosLimpios);
            
            if ($resultado['error']) {
                responderJSON([
                    'success' => false,
                    'error' => $resultado['error']
                ], $resultado['status']);
            }
            
            responderJSON([
                'success' => true,
                'data' => $resultado['data'][0] ?? null,
                'message' => 'Producto actualizado'
            ]);
            break;
        
        // ========================================================
        // DELETE: Eliminar producto
        // ========================================================
        case 'DELETE':
            if (!$id) {
                responderJSON([
                    'success' => false,
                    'error' => 'ID requerido para eliminar'
                ], 400);
            }
            
            $resultado = supabaseRequest('DELETE', "productos?id=eq.$id");
            
            if ($resultado['error']) {
                responderJSON([
                    'success' => false,
                    'error' => $resultado['error']
                ], $resultado['status']);
            }
            
            responderJSON([
                'success' => true,
                'message' => 'Producto eliminado'
            ]);
            break;
        
        default:
            responderJSON([
                'success' => false,
                'error' => 'Método no permitido'
            ], 405);
    }
    
} catch (Exception $e) {
    responderJSON([
        'success' => false,
        'error' => 'Error del servidor: ' . $e->getMessage()
    ], 500);
}