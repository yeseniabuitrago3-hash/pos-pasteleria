# 🔍 GUÍA RÁPIDA DE CÓDIGO

## 1️⃣ Sistema de Usuarios/Roles (database.js)

```javascript
// OBTENER USUARIO ACTUAL
const usuario = USUARIOS.getActual();
console.log(usuario); // { nombre: 'Admin', rol: 'Admin', id: 1234567890 }

// CAMBIAR USUARIO (para pruebas)
USUARIOS.setActual('Juan', 'Cajero');
USUARIOS.setActual('Maria', 'Admin');

// VERIFICAR SI TIENE PERMISO
if (USUARIOS.tieneRol('Admin')) {
    console.log('Este usuario puede eliminar');
}
```

---

## 2️⃣ Botón "Limpiar Filtros"

### HTML (historial.html)
```html
<button onclick="limpiarFiltros()" class="btn btn-limpiar-filtros">
    🧹 Limpiar Filtros
</button>
```

### CSS (styles.css)
```css
.btn-limpiar-filtros {
    background: rgba(44, 62, 80, 0.1);
    color: var(--dark);
    border: 1.5px solid rgba(44, 62, 80, 0.3);
}

.btn-limpiar-filtros:hover {
    background: rgba(44, 62, 80, 0.2);
    border-color: var(--dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

### JavaScript (historial.html)
```javascript
// Función existente - solo se mejoró el botón
function limpiarFiltros() {
    document.getElementById('fechaDesde').value = '';
    document.getElementById('fechaHasta').value = '';
    cierresFiltrados = [...cierresTotales];
    reiniciarPaginacion();
    actualizarResumenTotales();
}
```

---

## 3️⃣ Eliminar Registros

### HTML - Botón en Tabla (historial.html)
```html
<td>
    <button class="btn-sm btn-ver" onclick="verDetalle(${cierre.id})">
        👁️ Ver
    </button>
    ${puedeEliminar ? `
        <button class="btn-sm btn-eliminar" 
                onclick="confirmarEliminar(${cierre.id}, '${fecha.toLocaleDateString('es-ES')}')">
            🗑️ Eliminar
        </button>
    ` : ''}
</td>
```

### Modal de Confirmación (historial.html)
```html
<div id="modalEliminar" class="modal" style="display:none;">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <h2>⚠️ Confirmar eliminación</h2>
            <span class="close-modal" onclick="cerrarModalEliminar()">&times;</span>
        </div>
        <div class="modal-body">
            <p>¿Estás seguro de que deseas eliminar este reporte de caja del 
               <strong id="fechaEliminar"></strong>?</p>
            <p><strong>⚠️ Advertencia:</strong> Esta acción es irreversible.</p>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-outline" onclick="cerrarModalEliminar()">
                    Cancelar
                </button>
                <button class="btn btn-danger" onclick="eliminarCierre()">
                    Sí, eliminar
                </button>
            </div>
        </div>
    </div>
</div>
```

### JavaScript - Funciones de Eliminación
```javascript
// Variable global
let cierreAEliminar = null;

// Abrir modal de confirmación
function confirmarEliminar(cierreId, fechaFormato) {
    cierreAEliminar = cierresFiltrados.find(c => c.id === cierreId);
    if (!cierreAEliminar) return;
    
    document.getElementById('fechaEliminar').textContent = fechaFormato;
    document.getElementById('modalEliminar').style.display = 'flex';
    document.querySelector('.btn-outline').focus(); // Focus en Cancelar
}

// Cerrar modal
function cerrarModalEliminar() {
    document.getElementById('modalEliminar').style.display = 'none';
    cierreAEliminar = null;
}

// Ejecutar eliminación
function eliminarCierre() {
    if (!cierreAEliminar) return;
    
    try {
        const cierreId = cierreAEliminar.id;
        
        // Eliminar de base de datos
        DB.delete('cierres_caja', cierreId);
        
        // Actualizar arrays
        cierresFiltrados = cierresFiltrados.filter(c => c.id !== cierreId);
        cierresTotales = cierresTotales.filter(c => c.id !== cierreId);
        
        // Cerrar modal y recargar tabla
        cerrarModalEliminar();
        if (cierresFiltrados.length === 0) {
            limpiarTabla();
            document.getElementById('cuerpoHistorial').innerHTML = 
                '<tr><td colspan="8">No hay registros</td></tr>';
        } else {
            reiniciarPaginacion();
        }
        
        // Notificación
        mostrarToast('✅ Reporte eliminado correctamente', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('❌ Error al eliminar', 'error');
    }
}
```

### CSS - Botón Eliminar
```css
.btn-eliminar {
    background: #e74c3c;
    color: white;
    border: none;
    margin-left: 5px;
}

.btn-eliminar:hover {
    background: #c0392b;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}
```

---

## 4️⃣ Navbar Mejorado

### HTML (navbar.js)
```html
<a href="..." class="nav-link ${currentPage === 'page.html' ? 'active' : ''}">
    🏠 Inicio
</a>
```

### CSS - Estados Navbar (styles.css)
```css
/* Estado Normal */
.navbar-menu .nav-link {
    background: rgba(255, 255, 255, 0.15);
    color: white;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Estado Hover */
.navbar-menu .nav-link:hover {
    background: rgba(255, 255, 255, 0.3);
    color: #ffffff;
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Estado Active (página actual) */
.navbar-menu .nav-link.active {
    background: #e0f2fe;
    color: var(--primary);
    box-shadow: 0 4px 12px rgba(62, 135, 231, 0.3);
    font-weight: 700;
    border-bottom: 3px solid var(--primary);
}

.navbar-menu .nav-link.active:hover {
    background: #cce5f5;
    transform: translateY(-2px);
}

/* Ícono en hover */
.navbar-menu .nav-link:hover span {
    transform: scale(1.15) rotate(5deg);
}

/* Ícono en active */
.navbar-menu .nav-link.active span {
    transform: scale(1.2);
}
```

---

## 📋 Flujo Completo: Eliminar un Registro

```
1. Usuario (Admin) ve la tabla
   ↓
2. Hace clic en botón 🗑️ Eliminar
   ↓
3. Se abre modal de confirmación
   ↓
4. Lee la advertencia con fecha
   ↓
5. Opciones:
   - Cancelar → Modal cierra, nada pasa
   - Sí, eliminar → Ejecuta eliminarCierre()
   ↓
6. Se elimina de DB y se actualiza tabla
   ↓
7. Toast muestra feedback: "✅ Reporte eliminado"
```

---

## 🎨 Colores y Variables

```css
/* En :root de styles.css */
--primary: #3e87e7;           /* Azul corporativo */
--danger: #e74c3c;             /* Rojo para eliminar */
--success: #16773f;            /* Verde para éxito */
--dark: #2c3e50;               /* Gris oscuro */

/* Para el botón Limpiar */
rgba(44, 62, 80, 0.1) /* Muy transparente */
rgba(44, 62, 80, 0.2) /* En hover */
```

---

## ✅ Checklist de Prueba

- [ ] Botón "Limpiar Filtros" limpia inputs y recarga tabla
- [ ] Botón "Eliminar" solo aparece si usuario es Admin
- [ ] Modal de confirmación se abre al hacer clic eliminar
- [ ] Botón "Cancelar" cierra modal sin hacer nada
- [ ] Botón "Sí, eliminar" elimina y actualiza tabla
- [ ] Toast muestra éxito al eliminar
- [ ] Navbar tiene hover suave con ícono rotando
- [ ] Navbar página actual tiene fondo azul y borde
- [ ] Sin errores en consola

---

**Referencia rápida creada**: May 26, 2026  
**Versión**: 1.0
