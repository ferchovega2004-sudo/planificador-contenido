# Reporte de Aseguramiento de Calidad (QA), Pruebas y Propuesta de Mejoras UI/UX

Este reporte documenta la evaluación técnica, funcional y visual del **Planificador de Contenido - Gara Digital** tras los cambios de modernización. Se detallan los resultados de las pruebas de regresión, las validaciones de seguridad de roles y se proponen mejoras visuales y funcionales adicionales para llevar la aplicación a un nivel ultra-premium.

---

## 1. Bitácora de Pruebas de Regresión y Funcionalidad

Se realizaron pruebas exhaustivas sobre los flujos principales del sistema:

### A. Autenticación y Control de Accesos (Roles)
* **Caso de Prueba 1: Restricción del rol Acompañante**
  * *Acción:* Iniciar sesión con un usuario con rol `ACOMPAÑANTE`. Intentar reprogramar una publicación arrastrando y soltando una tarjeta en el calendario mensual.
  * *Resultado:* **APROBADO.** El componente `CalendarioPage.tsx` intercepta la acción en `handleDrop` y retorna silenciosamente. El usuario no puede modificar la fecha.
  * *Observación de Seguridad:* Las políticas de seguridad a nivel de base de datos (RLS) en Supabase respaldan esta restricción, rechazando escrituras no autorizadas.
* **Caso de Prueba 2: Visibilidad del Menú de Administración**
  * *Acción:* Iniciar sesión con roles `USER` y `EDITOR`.
  * *Resultado:* **APROBADO.** Las pestañas "Administración de Equipo" y "Papelera General" se ocultan correctamente en el menú lateral. Solo son visibles para el rol `ADMIN`.

### B. Módulo de Calendario y Tablero Kanban
* **Caso de Prueba 3: Reprogramación en Calendario**
  * *Acción:* Arrastrar publicación de una fecha a otra (ej. del 5 de Julio al 8 de Julio).
  * *Resultado:* **APROBADO.** La interfaz se actualiza de manera optimista al soltar la tarjeta y la llamada a `api.updatePublicacion` persiste la fecha en Supabase de forma asíncrona.
* **Caso de Prueba 4: Flujo de Estados Kanban**
  * *Acción:* Mover una publicación de "Por grabar" a "En proceso de edición".
  * *Resultado:* **APROBADO.** La columna de destino parpadea en color neón dinámico gracias al efecto `pulse-neon`. Al soltar, la tarjeta se posiciona en la columna correspondiente y los contadores numéricos del header se recalculan inmediatamente.

### C. Módulo de Reportes de Pantalla Dividida
* **Caso de Prueba 5: Previsualización en Tiempo Real**
  * *Acción:* Cambiar filtros de marcas y período en la sección de Reportes.
  * *Resultado:* **APROBADO.** La simulación de hoja física tamaño carta horizontal (Landscape) a la derecha renderiza la tabla de publicaciones instantáneamente, coincidiendo al 100% con la maquetación del PDF que se envía a la ventana de impresión del sistema.

---

## 2. Diagnóstico de Oportunidades: Mejoras Gráficas y de Utilidad

A partir de la inspección del código y de las pruebas dinámicas, se identifican las siguientes oportunidades de mejora para elevar la ergonomía, utilidad y el aspecto visual de la aplicación:

### 🎨 Oportunidades de Mejora Visual (UI/UX Premium)

1. **Indicador Visual del Modo Arrastre en el Calendario:**
   * *Diagnóstico:* Aunque la celda de destino cambia a color neón cuando un elemento es arrastrado sobre ella, no existe una animación de pulso como en el Kanban.
   * *Propuesta:* Aplicar un borde discontinuo que pulse de manera sutil en `.calendar-grid-day-cell.drag-over` similar al del tablero Kanban para unificar el lenguaje visual de Drag & Drop.

2. **Conmutador de Contraseña en el Login:**
   * *Diagnóstico:* La pantalla de inicio de sesión (`LoginPage.tsx`) carece de un icono de ojo para visualizar la contraseña antes de enviarla.
   * *Propuesta:* Integrar el mismo botón de visibilidad de contraseña desarrollado en `UsuariosPage.tsx` con su respectivo icono neón para evitar errores de digitación al ingresar al sistema.

3. **Mejora del Editor Enriquecido del Guion:**
   * *Diagnóstico:* El editor del guion en `DetallePublicacionModal.tsx` tiene un fondo plano oscuro y los botones de formato (Negrita, Cursiva, etc.) se ven como botones HTML por defecto de baja densidad visual.
   * *Propuesta:* Rediseñar la barra de herramientas del editor enriquecido (`.rich-editor-toolbar`) con botones de vidrio esmerilado (Glassmorphism), iconos vectoriales SVG en lugar de letras planas, y un placeholder flotante cyberpunk cuando el campo esté vacío.

---

### ⚙️ Oportunidades de Mejora de Utilidad (Features de Alta Productividad)

1. **Búsqueda Instantánea de Tarjetas en el Kanban:**
   * *Diagnóstico:* Si una marca tiene más de 20 publicaciones planificadas en el mes, el tablero Kanban se vuelve largo y difícil de navegar.
   * *Propuesta:* Agregar un campo de búsqueda de texto en la cabecera del Kanban (`KanbanPage.tsx`) que filtre las tarjetas instantáneamente por título o descripción a medida que el usuario escribe, sin recargar la página.

2. **Acceso Directo al Material en las Tarjetas (Link de Drive Clickable):**
   * *Diagnóstico:* Las tarjetas de las publicaciones muestran un icono de enlace si tienen un link de Google Drive asignado, pero este icono no es interactivo. El usuario está obligado a abrir el modal de detalles para hacer clic en el botón de Drive.
   * *Propuesta:* Hacer que el icono de enlace en la tarjeta Kanban sea un tag `<a>` real con `target="_blank"` y que detenga la propagación del clic (`e.stopPropagation()`). Esto permitirá al editor o diseñador abrir los recursos multimedia directamente con un solo clic desde el tablero.

3. **Selector de Columnas para el Reporte de Impresión:**
   * *Diagnóstico:* La tabla del reporte de impresión exporta todas las columnas por defecto (Marca, Fecha, Plataforma, Título, Estado, Responsable, Guion, Material, Notas). Algunos clientes solo quieren ver el título y la fecha, sin notas internas ni guiones.
   * *Propuesta:* Añadir un panel de checkboxs en el panel de configuración del reporte para activar/desactivar la visualización de columnas específicas (ej: ocultar "Notas de producción" o "Guiones") actualizando la vista previa y el PDF final al instante.

---

## 3. Plan de Pruebas de Calidad (Checklist de Aceptación)

| ID | Módulo | Caso de Uso | Método de Verificación |
| :--- | :--- | :--- | :--- |
| **QA-01** | Autenticación | Password Toggle | Intentar ingresar con contraseña larga y validar alternando el icono de visibilidad. |
| **QA-02** | Kanban | Búsqueda Rápida | Digitar palabras clave y verificar que las columnas oculten las tarjetas que no coincidan. |
| **QA-03** | Kanban | Enlace Directo | Hacer clic en el icono de Drive en una tarjeta y verificar que se abra la carpeta de material en una nueva pestaña del navegador sin abrir el modal. |
| **QA-04** | Reportes | Customización de Columnas | Desmarcar la columna "Notas" y verificar que desaparezca tanto de la vista previa en pantalla como del PDF impreso. |
