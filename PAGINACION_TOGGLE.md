# 🔄 Sistema de Paginación con Toggle Expandir/Contraer

## Overview
Se implementó un sistema de paginación mejorado para las listas de productos vendidos en `pages/ventas.html`. Las listas ahora muestran 8 registros inicialmente y permiten al usuario expandir o contraer la lista completa con un botón toggle.

---

## 📊 Comportamiento Visual

### Estado 1: Lista Colapsada (Inicial)
```
✅ 2:16:02 p.m. - Pepsi 400ml - $0 [⚡ Rápido] [↺ Devolver]
✅ 2:16:04 p.m. - Pepsi 400ml - $0 [⚡ Rápido] [↺ Devolver]
...
✅ 2:16:12 p.m. - Pepsi 400ml - $0 [⚡ Rápido] [↺ Devolver]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[📋 Cargar más (16 restantes)]
```

### Estado 2: Lista Expandida (Tras hacer clic)
```
✅ 2:16:02 p.m. - Pepsi 400ml - $0 [⚡ Rápido] [↺ Devolver]
✅ 2:16:04 p.m. - Pepsi 400ml - $0 [⚡ Rápido] [↺ Devolver]
...
✅ 2:16:34 p.m. - Pepsi 400ml - $0 [⚡ Rápido] [↺ Devolver]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[▲ Mostrar menos]
```

### Estado 3: De vuelta a Colapsada (Al hacer clic nuevamente)
Vuelve al Estado 1 mostrando solo 8 registros.

---

## 🔧 Variables de Estado

Ubicadas al inicio de `actualizarFecha()`:

```javascript
let listaPastelesExpandida = false;    // Estado para lista de pasteles
let listaBebidasExpandida = false;     // Estado para lista de bebidas
const REGISTROS_POR_PAGINA = 8;        // Constante de límite visual
```

**Nota:** Se usan variables `let` en lugar de `const` porque su estado puede cambiar.

---

## 📝 Funciones Principales

### 1. `renderizarPasteles(ventasCompletas, expandido)`
**Propósito:** Renderizar la lista de pasteles vendidos.

**Parámetros:**
- `ventasCompletas` (Array): Array completo de pasteles vendidos en la apertura actual
- `expandido` (Boolean): `true` para mostrar todos, `false` para mostrar solo 8

**Lógica:**
```javascript
const limite = expandido ? ventasCompletas.length : REGISTROS_POR_PAGINA;
const registrosAMostrar = ventasCompletas.slice(0, limite);
```

**Botón dinámico:**
```javascript
const textoBoton = expandido 
    ? '▲ Mostrar menos' 
    : `📋 Cargar más (${ventasCompletas.length - REGISTROS_POR_PAGINA} restantes)`;
```

---

### 2. `togglePasteles()`
**Propósito:** Cambiar estado de expansión para pasteles.

**Flujo:**
1. Toggle el estado: `listaPastelesExpandida = !listaPastelesExpandida`
2. Obtiene la lista actual de pasteles
3. Llama a `renderizarPasteles()` con el nuevo estado

```javascript
function togglePasteles() {
    const apertura = getAperturaActual();
    if (!apertura) return;
    
    listaPastelesExpandida = !listaPastelesExpandida;
    const ventas = DB.find('ventas_pasteles', 'apertura_id', apertura.id);
    renderizarPasteles(ventas, listaPastelesExpandida);
}
```

---

### 3. `renderizarBebidas(ventasCompletas, expandido)`
**Propósito:** Renderizar la lista de bebidas/gaseosas vendidas.

**Comportamiento:** Idéntico a `renderizarPasteles()` pero para bebidas.

**Diferencias visuales:**
- Incluye botones ⚡ Rápido y ↺ Devolver en cada línea
- Obtiene nombre del producto desde tabla de productos

---

### 4. `toggleBebidas()`
**Propósito:** Cambiar estado de expansión para bebidas.

**Flujo:** Idéntico a `togglePasteles()` pero maneja `listaBebidasExpandida`

```javascript
function toggleBebidas() {
    const apertura = getAperturaActual();
    if (!apertura) return;
    
    listaBebidasExpandida = !listaBebidasExpandida;
    const ventas = DB.find('ventas_bebidas', 'apertura_id', apertura.id);
    renderizarBebidas(ventas, listaBebidasExpandida);
}
```

---

## 🔗 Integración en Ciclo de Vida

### En `actualizarListaVentas()`
```javascript
// Al cargar o actualizar lista, reiniciar estado colapsado
indicePastelesActual = 0;
listaPastelesExpandida = false;  // ← Reset a estado inicial
renderizarPasteles(ventas, false);
```

### En `actualizarListaBebidas()`
```javascript
// Al cargar o actualizar lista, reiniciar estado colapsado
indiceBebidasActual = 0;
listaBebidasExpandida = false;   // ← Reset a estado inicial
renderizarBebidas(ventas, false);
```

**Ventaja:** Cuando se agrega un nuevo producto, las listas vuelven al estado inicial evitando UX confusa.

---

## 🌐 Exposición Global

Las funciones se exponen a `window` para ser accesibles desde HTML:

```javascript
window.toggleBebidas = toggleBebidas;
window.togglePasteles = togglePasteles;
window.renderizarBebidas = renderizarBebidas;
window.renderizarPasteles = renderizarPasteles;
```

Permitiendo onclick directo en los botones:
```html
<button onclick="togglePasteles()">▲ Mostrar menos</button>
<button onclick="toggleBebidas()">▲ Mostrar menos</button>
```

---

## 🎨 Estilos CSS (Ya Aplicados)

- Botón: `.btn.btn-primary` (fondo azul, bordes redondeados)
- Lista: `<ul style="list-style:none; padding-left:0;">`
- Línea separadora: `border-top:2px solid #ddd;`
- Centrado botón: `text-align:center;`

---

## ✅ Pruebas Recomendadas

1. **Agregar 15+ pasteles:** Verificar que solo 8 aparezcan inicialmente
2. **Hacer clic en "📋 Cargar más":** Todos deben expandirse instantáneamente
3. **Hacer clic en "▲ Mostrar menos":** Volver a 8 registros
4. **Probar botones ⚡ y ↺:** Deben funcionar en ambos estados
5. **Agregar nuevo producto:** Listas deben resetear a estado colapsado
6. **Modo mañana/tarde:** Toggle debe funcionar en ambos modos

---

## 🚀 Características Implementadas

✅ Toggle funcional con dos estados  
✅ Botón dinámico (texto cambia según estado)  
✅ Reset automático al agregar productos  
✅ Funciona independientemente para pasteles y bebidas  
✅ Mantiene estilos CSS existentes  
✅ Compatible con modales de devolución  
✅ Compatible con botones rápidos  
✅ Sin dependencias externas (vanilla JS)

---

## 📌 Notas Técnicas

- **Inicialización:** Variables declaradas en `actualizarFecha()` (scope global para el script)
- **Índices heredados:** `indiceBebidasActual` e `indicePastelesActual` se mantienen pero no se usan en el nuevo sistema
- **Renderizado:** Completo cada vez (no append incremental como antes)
- **Performance:** Con 100 items y 8 por página, el renderizado es instant
- **Compatibilidad:** Probado en vanilla JS, no requiere cambios en app.js ni database.js

---

## 📂 Archivos Modificados

- `pages/ventas.html` → Funciones de renderizado y toggle

## 📂 Archivos Sin Cambios (Compatibles)

- `js/database.js` → Sin cambios
- `js/app.js` → Sin cambios
- `pages/cierre.html` → Sin cambios
- `pages/historial.html` → Sin cambios
