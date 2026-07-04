# Lista de Tareas - Mejoras UI/UX & Papelera de Recuperación

- `[x]` Componente 1: Calendario de Publicaciones e Interactividad
  - `[x]` Modificar `CalendarioPage.tsx` para agregar validación de rol `ACOMPAÑANTE` en `handleDrop`
  - `[x]` Modificar `main.css` para mejorar contraste de bordes de la cuadrícula de días
- `[x]` Componente 2: Tablero Kanban Premium
  - `[x]` Modificar `main.css` para el efecto drag-over neon intermitente (`@keyframes pulse-neon`)
  - `[x]` Modificar `KanbanPage.tsx` para agregar iconos SVG dinámicos a las plataformas
  - `[x]` Modificar `KanbanPage.tsx` para agregar el efecto drag-over visual
- `[x]` Componente 3: Reportes con Vista Previa en Vivo (Estilo Hoja Landscape)
  - `[x]` Modificar `ReportesPage.tsx` para rediseñar la maquetación a pantalla dividida (35% / 65%)
  - `[x]` Modificar `ReportesPage.tsx` para maquetar la simulación de hoja landscape (proporción 1.29)
  - `[x]` Modificar `ReportesPage.tsx` para aplicar clases de estilo cyberpunk a los inputs de fecha
- `[x]` Componente 4: Papelera de Recuperación Unificada (Soft-Delete)
  - `[x]` Crear `PapeleraTab.tsx` para la administración unificada de Marcas y Usuarios eliminados
  - `[x]` Modificar `App.tsx` para agregar la pestaña "Papelera" en el sidebar (solo ADMIN)
  - `[x]` Modificar `ClientesPage.tsx` para remover la papelera local y limpiar la navegación
  - `[x]` Modificar `UsuariosPage.tsx` para remover la papelera local y limpiar la navegación
