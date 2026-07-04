# Plan de Implementación - Mejoras UI/UX & Papelera de Recuperación

Este documento detalla el plan técnico para aplicar las mejoras visuales y funcionales en el Planificador de Contenido, basándose en la propuesta previa de optimización UI/UX inspirada en herramientas premium como Monday.com, Trello y CoSchedule.

---

## Cambios Propuestos

### Componente 1: Calendario de Publicaciones e Interactividad

#### [MODIFY] [CalendarioPage.tsx](file:///c:/Users/Feracoba/Desktop/Planificador_contenido/frontend/src/components/CalendarioPage.tsx)
* **Seguridad de Roles**: Agregar validación en `handleDrop` para evitar que usuarios con rol `ACOMPAÑANTE` puedan modificar o reprogramar publicaciones.
* **Interactividad Visual**: Mejorar el feedback al arrastrar elementos sobre las celdas, actualizando la clase CSS correspondiente.

#### [MODIFY] [main.css](file:///c:/Users/Feracoba/Desktop/Planificador_contenido/frontend/src/assets/main.css)
* Incrementar el contraste de la cuadrícula de días del calendario reemplazando la opacidad y color de los bordes de `.calendar-grid-day-cell` por un tono más visible (`rgba(255, 255, 255, 0.15)` o `rgba(192, 132, 252, 0.2)`).

---

### Componente 2: Tablero Kanban Premium

#### [MODIFY] [KanbanPage.tsx](file:///c:/Users/Feracoba/Desktop/Planificador_contenido/frontend/src/components/KanbanPage.tsx)
* **Iconos de Plataforma**: Implementar logotipos SVG dinámicos y estilizados para cada red social (Instagram, TikTok, YouTube Shorts, Facebook, Otros) dentro de las tarjetas del Kanban.
* **Efecto de Destino Drag-over**: Mejorar el área de soltado con una línea discontinua neon que pulse e ilumine el contenedor cuando una tarjeta esté sobre él.

#### [MODIFY] [main.css](file:///c:/Users/Feracoba/Desktop/Planificador_contenido/frontend/src/assets/main.css)
* Definir keyframes `@keyframes pulse-neon` y aplicar estilos de animación a `.kanban-column.drag-over` para simular un borde discontinuo neón parpadeante.

---

### Componente 3: Reportes con Vista Previa en Vivo (Estilo Hoja Landscape)

#### [MODIFY] [ReportesPage.tsx](file:///c:/Users/Feracoba/Desktop/Planificador_contenido/frontend/src/components/ReportesPage.tsx)
* **Rediseño de Pantalla Dividida**: Configurar el contenedor principal con Flexbox/Grid: panel de configuración a la izquierda (35%) y vista previa a la derecha (65%).
* **Simulación de Hoja Física**: Crear una maqueta visual para la vista previa que simule una hoja tamaño carta en orientación horizontal (proporción 1.29) con fondo blanco, sombra premium y tipografía idéntica a la impresión.
* **Campos Cyberpunk**: Aplicar la clase `.form-input` y estilos de bordes neón a los campos de fecha de inicio y fin para mantener la coherencia del diseño general.

---

### Componente 4: Papelera de Recuperación Unificada (Soft-Delete)

#### [NEW] [PapeleraTab.tsx](file:///c:/Users/Feracoba/Desktop/Planificador_contenido/frontend/src/components/PapeleraTab.tsx)
* Crear una pestaña de administración unificada que permita ver los elementos eliminados de ambas categorías (Marcas y Usuarios/Integrantes) en pestañas internas.
* Implementar los botones de "Restaurar" que llamen a `api.restaurarCliente` y `api.restaurarUsuario` correspondientemente.

#### [MODIFY] [App.tsx](file:///c:/Users/Feracoba/Desktop/Planificador_contenido/frontend/src/App.tsx)
* Registrar el nuevo tab `papelera` en el estado `activeTab` y sidebar.
* Mostrar la opción "Papelera General" únicamente para usuarios con rol `ADMIN` en la parte inferior del menú de navegación.

#### [MODIFY] [ClientesPage.tsx](file:///c:/Users/Feracoba/Desktop/Planificador_contenido/frontend/src/components/ClientesPage.tsx) y [UsuariosPage.tsx](file:///c:/Users/Feracoba/Desktop/Planificador_contenido/frontend/src/components/UsuariosPage.tsx)
* Mantener la visualización simple de marcas y usuarios activos, y remover el botón redundante de papelera local para los administradores, centralizando su gestión en la Papelera General.

---

## Plan de Verificación

### Pruebas Manuales
1. **Calendario y Kanban**:
   * Intentar reprogramar un post con rol `ACOMPAÑANTE` y comprobar que la interfaz y API impidan la acción.
   * Arrastrar una publicación entre columnas del Kanban y observar el efecto de borde neón parpadeante.
2. **Vista Previa de Reportes**:
   * Cambiar filtros de fecha y marcas, verificando que la vista previa a la derecha cambie dinámicamente simulando una hoja horizontal.
3. **Papelera General**:
   * Eliminar un cliente/marca de la lista activa, ir a la "Papelera General" y verificar que aparezca allí.
   * Hacer clic en "Restaurar" y comprobar que vuelva de inmediato a la lista activa.
