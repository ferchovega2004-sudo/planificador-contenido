# Sistema de Gestión de Pedidos — Feracoba

## Estado: En Desarrollo Activo (v1.0.0-beta)
**Última actualización:** 2026-05-20

---

## 1. Descripción General

Aplicación de escritorio para gestión de clientes, programación semanal de pedidos y generación masiva de guías de envío en PDF. Construida con Electron + React (frontend) conectada a una API REST (Node.js/Express) con base de datos MySQL.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend (Escritorio) | Electron + React + TypeScript | Electron 39, React 19 |
| Build Frontend | electron-vite + Vite 7 | electron-vite 5 |
| Backend (API REST) | Node.js + Express 5 + TypeScript 6 | — |
| ORM | Prisma 7 con adaptador MariaDB | @prisma/client 7.8 |
| Base de Datos | MySQL Server 8.4 | Local en puerto 3306 |
| Motor PDF | Puppeteer 25 (usa Microsoft Edge local) | — |
| Dev Runner | concurrently (monorepo script) | — |

---

## 3. Estructura del Proyecto

```
Sistema_pedidos.worktrees/
├── package.json              # Monorepo root (script unificado `npm run dev`)
├── pedidosdb.sql             # Dump original de la BD legacy (.NET/C#)
│
├── api/                      # Backend - API REST
│   ├── .env                  # DATABASE_URL, PORT
│   ├── prisma/
│   │   └── schema.prisma     # Modelos: Cliente, Pedido, ConfiguracionRemitente
│   └── src/
│       ├── db.ts             # Singleton PrismaClient con adaptador MariaDB
│       ├── index.ts          # Entrypoint Express (middlewares, rutas, /health)
│       └── routes/
│           ├── clientes.ts   # CRUD clientes (soft delete)
│           ├── pedidos.ts    # CRUD pedidos + semana + alertas + mapeo estado int↔string
│           ├── guias.ts      # POST /generar → HTML/CSS Grid → PDF (Puppeteer + Edge)
│           └── remitente.ts  # GET/PUT configuración remitente dinámico
│
└── desktop/                  # Frontend - Electron + React
    └── src/
        ├── main/index.ts     # Proceso principal Electron
        ├── preload/index.ts  # Preload script
        └── renderer/
            ├── index.html    # CSP configurado para permitir connect a localhost:3000
            └── src/
                ├── App.tsx           # Router con sidebar (kanban | clientes | guias)
                ├── main.tsx          # Punto de entrada React
                ├── services/
                │   └── api.ts        # Cliente HTTP (fetch) hacia la API REST
                └── components/
                    ├── KanbanPage.tsx    # Tablero semanal Drag&Drop
                    ├── ClientesPage.tsx  # CRUD clientes con búsqueda
                    └── GuiasPage.tsx     # Selección de pedidos + config remitente + PDF
```

---

## 4. Cómo Ejecutar

### Prerrequisitos
- Node.js 20+
- MySQL Server 8.4 (instalado en `C:\Program Files\MySQL\MySQL Server 8.4`)

### Paso 1: Levantar MySQL
```powershell
# El data directory está en: C:\Users\Feracoba\Desktop\MySQLData
powershell -Command "Start-Process -FilePath 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe' -ArgumentList '--datadir=C:\Users\Feracoba\Desktop\MySQLData', '--port=3306', '--console' -WindowStyle Hidden"
```

### Paso 2: Levantar API + Electron juntos
```powershell
npm.cmd run dev
```
Esto ejecuta `concurrently` que levanta:
- `[0]` API REST en `http://localhost:3000`
- `[1]` Electron + Vite dev server en `http://localhost:5173`

### Credenciales de Base de Datos (api/.env)
```env
PORT=3000
DATABASE_URL="mysql://root:@localhost:3306/sistemapedidosdb"
```
Usuario `root` sin contraseña (desarrollo local).

---

## 5. Módulos Implementados

### ✅ Módulo de Clientes (Completo)
- CRUD completo con soft delete (`DeletedAt`)
- Búsqueda en tiempo real por nombre/cédula
- Validación de cédula duplicada con reactivación automática
- **Ruta API:** `GET/POST /api/clientes`, `PUT/DELETE /api/clientes/:id`

### ✅ Módulo de Programación Semanal / Kanban (Completo)
- Vista semanal Lunes-Domingo con navegación (Anterior/Hoy/Siguiente/Ir a fecha)
- Drag & Drop para reprogramar pedidos entre días
- Cambio de estado desde dropdown (PENDIENTE → LISTO → ENTREGADO)
- Alertas de pedidos atrasados con reprogramación obligatoria
- Creación de pedidos con asignación de cliente y fecha
- **Ruta API:** `GET /api/pedidos/semana?fecha=YYYY-MM-DD`, `GET /api/pedidos/alertas`

### ✅ Módulo de Generación de Guías PDF (Completo)
- Selección de pedidos en estado "LISTO"
- Maquetación configurable: 4 o 6 guías por hoja tamaño carta
- Plantilla HTML/CSS Grid renderizada a PDF con Puppeteer
- Datos del remitente dinámicos desde base de datos
- Panel colapsable para editar remitente en caliente
- Opción de marcar como ENTREGADO tras imprimir
- **Ruta API:** `POST /api/guias/generar`, `GET/PUT /api/remitente`

---

## 6. Compatibilidad con Base de Datos Legacy

La BD original fue creada por una aplicación .NET/C# con Entity Framework. El esquema Prisma usa anotaciones `@map()` para mantener compatibilidad estricta:

| Código JS (camelCase) | Columna BD (PascalCase) | Notas |
|------------------------|------------------------|-------|
| `id` | `Id` | Autoincrement |
| `nombre` | `Nombre` | — |
| `fechaEntrega` | `FechaProgramada` | Nombre diferente en BD |
| `estado` | `Estado` | **Int en BD** (0=PENDIENTE, 1=LISTO, 2=ENTREGADO) |
| `createdAt` | `CreatedAt` / `FechaCreacion` | — |
| `updatedAt` | `UpdatedAt` | Nullable (columna agregada post-migración) |
| `deletedAt` | `DeletedAt` | Nullable, soft delete |

### Traducción de Estados
La API traduce automáticamente entre enteros de BD y strings del frontend:
- **Frontend → API:** Envía `"PENDIENTE"`, `"LISTO"`, `"ENTREGADO"`
- **API → BD:** Convierte a `0`, `1`, `2`
- **BD → API → Frontend:** Convierte de vuelta a strings

Esta lógica vive en `api/src/routes/pedidos.ts` en la función `mapPedidoToApi()`.

---

## 7. Bugs Conocidos y Resueltos

### 🔧 Bug Crítico: Zona Horaria UTC vs Local (RESUELTO)
**Archivo:** `api/src/routes/pedidos.ts` línea 61
**Problema:** `new Date("YYYY-MM-DD")` se parsea como medianoche UTC. En Colombia (UTC-5) esto retrocede al día anterior local, causando que `getDay()` calcule la semana equivocada.
**Solución:** Agregar `T12:00:00` al parsear: `new Date(fechaParam + 'T12:00:00')`.

### 🔧 Bug: Filtrado de pedidos en Kanban (RESUELTO)
**Archivo:** `desktop/.../KanbanPage.tsx`
**Problema:** Usaba `toISOString().split('T')[0]` para comparar fechas, que convierte a UTC y desalinea los días.
**Solución:** Formatear ambas fechas con `getFullYear()/getMonth()/getDate()` (hora local).

### 🔧 Bug: Parpadeo del tablero Kanban (RESUELTO)
**Problema:** `fetchData()` ejecutaba `setLoading(true)` en cada refetch, desmontando el tablero.
**Solución:** Solo mostrar loading en la carga inicial, refrescos silenciosos en background.

### 🔧 CSP bloqueando conexión API (RESUELTO)
**Archivo:** `desktop/src/renderer/index.html`
**Solución:** Agregar `connect-src 'self' http://127.0.0.1:3000 http://localhost:3000;`

### 🔧 Puppeteer sin Chrome (RESUELTO)
**Problema:** No se podía descargar Chromium (falta `tar.exe` en Windows).
**Solución:** Configurar `executablePath` a Microsoft Edge local en `guias.ts`.

---

## 8. Configuración Especial de Entorno

### Content Security Policy (Electron)
El archivo `desktop/src/renderer/index.html` tiene una meta tag CSP que debe incluir la dirección de la API:
```html
content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://127.0.0.1:3000 http://localhost:3000;"
```

### Puppeteer (Motor PDF)
Usa Microsoft Edge local en lugar de Chromium descargado:
```ts
// api/src/routes/guias.ts
executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
```

### Prisma con Adaptador MariaDB
La conexión a MySQL se hace vía el adaptador `@prisma/adapter-mariadb` (no el driver nativo de Prisma). Ver `api/src/db.ts`.

---

## 9. Pendientes y Mejoras Futuras

### Prioridad Alta
- [ ] **Módulo de Usuarios/Autenticación:** La tabla `usuarios` existe en la BD pero no tiene endpoints ni UI. Implementar login con JWT.
- [ ] **Historial de Pedidos:** La tabla `historialpedidos` existe en la BD. Implementar registro automático de cambios de estado.
- [ ] **Validación de formularios frontend:** Agregar validaciones más robustas en los inputs de React.

### Prioridad Media
- [ ] **Paginación en listado de clientes:** Actualmente carga todos los clientes de golpe.
- [ ] **Búsqueda de pedidos:** Agregar filtros por estado, fecha, cliente.
- [ ] **Notificaciones toast:** Reemplazar `alert()` y `confirm()` nativos por un sistema de toast/snackbar elegante.
- [ ] **Código de barras real:** El placeholder `PED-{id}` en las guías debería ser un código de barras 1D/QR real.

### Prioridad Baja
- [ ] **Tema claro/oscuro:** Actualmente solo dark mode.
- [ ] **Exportar clientes a Excel/CSV.**
- [ ] **Dashboard con métricas:** Pedidos por semana, clientes activos, guías generadas.
- [ ] **Registrar MySQL como servicio de Windows** para que inicie automáticamente.

---

## 10. Regla de Oro para el Desarrollador

> **NUNCA conectes el frontend directamente a MySQL.** Todo el flujo de datos debe pasar por la API REST. El frontend solo conoce `http://127.0.0.1:3000/api/*`.

> **Cuidado con las zonas horarias.** JavaScript parsea `"YYYY-MM-DD"` como UTC y `"YYYY-MM-DDTHH:mm:ss"` como local. En Colombia (UTC-5), esto causa desplazamiento de día. Siempre usar `T12:00:00` al parsear fechas de strings en el backend.
