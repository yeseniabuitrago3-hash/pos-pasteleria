<?php
// pages/api/productos.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Ruta correcta a conexion.php (sube 2 niveles)
require_once '../../conexion.php';

$action = isset($_GET['action']) ? $_GET['action'] : 'listar';

// ========== LISTAR TODOS LOS PRODUCTOS ==========
if ($action === 'listar') {
    try {
        $stmt = $conn->query("SELECT id, codigo, nombre, descripcion, precio, stock, stock_minimo, categoria, proveedor 
                              FROM productos ORDER BY categoria, nombre");
        $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'total' => count($productos),
            'productos' => $productos
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// ========== BUSCAR POR CÓDIGO ==========
if ($action === 'buscar' && isset($_GET['codigo'])) {
    $codigo = $_GET['codigo'];
    try {
        $stmt = $conn->prepare("SELECT id, codigo, nombre, descripcion, precio, stock, stock_minimo, categoria, proveedor 
                                FROM productos WHERE codigo LIKE ? OR nombre LIKE ?");
        $busqueda = "%$codigo%";
        $stmt->execute([$busqueda, $busqueda]);
        $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'total' => count($productos),
            'productos' => $productos
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// ========== OBTENER PRODUCTO POR ID ==========
if ($action === 'obtener' && isset($_GET['id'])) {
    $id = $_GET['id'];
    try {
        $stmt = $conn->prepare("SELECT id, codigo, nombre, descripcion, precio, stock, stock_minimo, categoria, proveedor 
                                FROM productos WHERE id = ?");
        $stmt->execute([$id]);
        $producto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'producto' => $producto
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// ========== GUARDAR NUEVO PRODUCTO ==========
if ($action === 'guardar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $codigo = $_POST['codigo'] ?? '';
    $nombre = $_POST['nombre'] ?? '';
    $precio = $_POST['precio'] ?? 0;
    $stock = $_POST['stock'] ?? 0;
    $stock_minimo = $_POST['stock_minimo'] ?? 5;
    $categoria = $_POST['categoria'] ?? '';
    $proveedor = $_POST['proveedor'] ?? '';
    
    if (empty($codigo) || empty($nombre) || empty($precio)) {
        echo json_encode(['success' => false, 'error' => 'Código, nombre y precio son obligatorios']);
        exit;
    }
    
    try {
        $check = $conn->prepare("SELECT id FROM productos WHERE codigo = ?");
        $check->execute([$codigo]);
        
        if ($check->fetch()) {
            echo json_encode(['success' => false, 'error' => 'El código ya existe']);
            exit;
        }
        
        $stmt = $conn->prepare("INSERT INTO productos (codigo, nombre, precio, stock, stock_minimo, categoria, proveedor) 
                                VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$codigo, $nombre, $precio, $stock, $stock_minimo, $categoria, $proveedor]);
        
        echo json_encode([
            'success' => true,
            'id' => $conn->lastInsertId(),
            'message' => 'Producto creado exitosamente'
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// ========== RECIBIR PEDIDO ==========
if ($action === 'recibir_pedido' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['id'] ?? 0;
    $cantidad = $_POST['cantidad'] ?? 0;
    $motivo = $_POST['motivo'] ?? 'Recepcion de pedido';
    
    if ($id <= 0 || $cantidad <= 0) {
        echo json_encode(['success' => false, 'error' => 'ID y cantidad son obligatorios']);
        exit;
    }
    
    try {
        $conn->beginTransaction();
        
        $stmt = $conn->prepare("SELECT stock FROM productos WHERE id = ?");
        $stmt->execute([$id]);
        $producto = $stmt->fetch(PDO::FETCH_ASSOC);
        $stockAnterior = $producto['stock'];
        $stockNuevo = $stockAnterior + $cantidad;
        
        $stmt = $conn->prepare("UPDATE productos SET stock = ? WHERE id = ?");
        $stmt->execute([$stockNuevo, $id]);
        
        $stmt = $conn->prepare("INSERT INTO movimientos_stock (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo) 
                                VALUES (?, 'entrada', ?, ?, ?, ?)");
        $stmt->execute([$id, $cantidad, $stockAnterior, $stockNuevo, $motivo]);
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Stock actualizado']);
    } catch (PDOException $e) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// ========== ELIMINAR PRODUCTO ==========
if ($action === 'eliminar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['id'] ?? 0;
    try {
        $stmt = $conn->prepare("DELETE FROM productos WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Producto eliminado']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}



// Si no se reconoce la acción
echo json_encode(['success' => false, 'error' => 'Acción no válida: ' . $action]);
?>