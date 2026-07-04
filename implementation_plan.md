# Plan de Implementación - Mejoras UI/UX de Utilidad & Seguridad

Este documento detalla el plan técnico para aplicar la segunda tanda de mejoras de usabilidad, seguridad y utilidad en el Planificador de Contenido.

---

## Cambios Propuestos

### Componente 1: Conmutador de Contraseña en el Login

#### [MODIFY] [LoginPage.tsx](file:///c:/Users/Feracoba/Desktop/Planificador_contenido/frontend/src/components/LoginPage.tsx)
* Integrar el estado local `showPassword` (booleano).
* Reestructurar el contenedor del input de contraseña (`type={showPassword ? "text" : "password"}`) e incorporar un botón con icono SVG/Emoji flotante a la derecha del input para conmutar la visibilidad.

---

### Componente 2: Búsqueda y Enlaces en el Tablero Kanban

#### [MODIFY] [KanbanPage.tsx](file:///c:/Users/Feracoba/Desktop/Planificador_contenido/frontend/src/components/KanbanPage.tsx)
* **Barra de Búsqueda:**
  * Crear un estado `searchTerm` (string).
  * Agregar un input de búsqueda con clase `.search-input` al lado de los filtros superiores en la cabecera.
  * Modificar la lógica de filtrado de publicaciones (`publicacionesFiltradas`) para incluir una condición donde el título o notas coincidan con el término buscado (insensible a mayúsculas/minúsculas).
* **Acceso Rápido a Drive:**
  * En la tarjeta Kanban, envolver el icono SVG de enlace en un tag `<a>` real.
  * Añadir atributo `href={pub.driveUrl}` y `target="_blank"`.
  * Incorporar un handler `onClick={(e) => e.stopPropagation()}` en el tag `<a>` para evitar que al pulsar el icono se despliegue el modal completo de la publicación.

---

### Componente 3: Selector de Columnas en Reportes

#### [MODIFY] [ReportesPage.tsx](file:///c:/Users/Feracoba/Desktop/Planificador_contenido/frontend/src/components/ReportesPage.tsx)
* **Selector de Visibilidad:**
  * Crear un estado `columnasVisibles` tipo objeto: `{ marca: true, fecha: true, plataforma: true, titulo: true, estado: true, responsable: true, guion: true, material: true, notas: true }`.
  * Renderizar una cuadrícula compacta de checkboxes de selección de columnas en el panel de configuración de la izquierda (debajo de las fechas).
* **Actualización Dinámica de Vista Previa e Impresión:**
  * Modificar la renderización de los encabezados (`<th>`) y celdas (`<td>`) en la vista previa del navegador para reflejar el estado de `columnasVisibles`.
  * Ajustar el generador de HTML de la función `handleImprimirReporte` para inyectar condicionalmente los encabezados y celdas de acuerdo a la selección, asegurando que la impresión en papel o PDF coincida exactamente con la pantalla.

---

### Componente 4: Animación Drag & Drop del Calendario

#### [MODIFY] [main.css](file:///c:/Users/Feracoba/Desktop/Planificador_contenido/frontend/src/assets/main.css)
* Modificar el estilo `.calendar-grid-day-cell.drag-over` para aplicar la misma animación `@keyframes pulse-neon` y un borde discontinuo neón. Esto homologa visualmente las zonas de soltado en todo el planificador.

---

## Plan de Verificación

### Pruebas Manuales
1. **Login**:
   * Escribir en el campo de contraseña, pulsar el icono de visibilidad y validar que cambie a texto claro.
2. **Tablero Kanban**:
   * Escribir una palabra clave en la barra de búsqueda superior y verificar que las tarjetas se filtren instantáneamente en las columnas.
   * Hacer clic directo sobre el icono de Drive en una tarjeta y corroborar que abre el enlace en una nueva pestaña del navegador sin levantar el modal.
3. **Reportes**:
   * Desmarcar las columnas "Guion" y "Notas". Validar que desaparezcan de la vista previa a la derecha.
   * Hacer clic en "Imprimir / Exportar PDF" y corroborar en el diálogo de impresión que la tabla resultante no contenga esas columnas.
4. **Calendario**:
   * Arrastrar un post en el calendario mensual y verificar que la celda destino pulse con borde neón intermitente.
