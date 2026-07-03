# Sistema de Planificación de Contenido — Gara Digital

## Estado: En Producción / Nube (v2.0.0)
**Última actualización:** 2026-07-03

---

## 1. Descripción General

Aplicación web / de escritorio para la planificación visual de contenido digital (videos, posts, reels), gestión de clientes/marcas y coordinación del equipo creativo. Construida con **React + TypeScript** y conectada directamente de forma serverless a **Supabase (PostgreSQL)** como backend de datos y autenticación.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + TypeScript + Vite | React 19, Vite 7 |
| Base de Datos & BaaS | Supabase (PostgreSQL) | — |
| Autenticación | Supabase Auth (JWT + RLS) | — |
| Gestión de Estados | React State & Hooks | — |
| Estilos | Vanilla CSS (Tema Cyber-Neón premium) | — |

---

## 3. Estructura del Proyecto

```
Planificador_contenido/
├── package.json              # Script unificado para controlar el frontend
├── schema_supabase_planificador.sql # Creación de tablas y triggers en Supabase
│
├── frontend/                 # Frontend activo (Vite SPA)
│   ├── .env                  # VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
│   └── src/
│       ├── main.tsx          # Punto de entrada y bootstrap
│       ├── App.tsx           # Router principal y barra lateral
│       ├── assets/
│       │   └── main.css      # Sistema de diseño con estética oscura premium
│       ├── services/
│       │   ├── api.ts        # Métodos de negocio mapeados directamente a Supabase
│       │   └── supabaseClient.ts # Inicialización del cliente `@supabase/supabase-js`
│       └── components/
│           ├── CalendarioPage.tsx  # Vista de calendario interactivo (Mes/Semana/Lista)
│           ├── KanbanPage.tsx      # Tablero Kanban con Drag & Drop por estados
│           ├── ClientesPage.tsx    # CRUD de marcas/clientes
│           ├── ReportesPage.tsx    # Generación de PDFs web mediante vista de impresión
│           ├── UsuariosPage.tsx    # Administración de accesos del equipo (Sólo ADMIN)
│           └── DetallePublicacionModal.tsx # Edición detallada de publicaciones con editor de guiones
│
└── [Legacy / Archivo]/       # Archivos de la fase anterior (MySQL local + Express REST API)
    ├── api/                  # Carpeta vacía del backend legado
    ├── pedidosdb.sql         # Base de datos MySQL heredada (.NET/C#)
    ├── migracion_supabase.sql # Migración inicial MySQL a PostgreSQL
    ├── guia_instalacion_sistema.md # Manual de VPN Tailscale y PC Master local
    └── configurar_servidor_automatico.bat # Script de automatización de servidor local
```

---

## 4. Cómo Ejecutar

### Prerrequisitos
- Node.js 20+

### Levantar en modo de desarrollo
1. Instalar dependencias del frontend:
   ```powershell
   npm run install:all
   ```
2. Ejecutar el servidor de desarrollo local de Vite:
   ```powershell
   npm run dev
   ```
   Esto levantará el servidor local en `http://localhost:5173`.

### Variables de Entorno (`frontend/.env`)
Asegúrate de configurar los valores asignados en tu panel de Supabase:
```env
VITE_SUPABASE_URL=https://<TU_PROYECTO>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<TU_LLAVE_PUBLICA_ANON>
```

---

## 5. Módulos Implementados

### ✅ Módulo de Autenticación y Usuarios
- Login seguro gestionado por Supabase Auth.
- Gestión de perfiles extendidos en la tabla `usuarios` (Roles: `ADMIN` y `USER`).
- Registro y actualización de contraseñas de miembros del equipo.

### ✅ Calendario Matriz
- Visualizaciones múltiples: Mes, Semana y Lista.
- Soporta reprogramación rápida mediante Drag & Drop nativo de fechas.
- Creación rápida de publicaciones con doble clic en cualquier celda de fecha.

### ✅ Flujo Kanban (Estados de Producción)
- Control de avance a través de columnas de estado: `POR_GRABAR` &rarr; `EDICION` &rarr; `TERMINADO` &rarr; `PUBLICADO`.
- Filtro interactivo por cliente para focalizar el análisis de campañas.

### ✅ Gestión de Clientes (Marcas)
- CRUD completo de marcas y negocios.

### ✅ Reportes e Impresión PDF
- Configuración de filtros por período y marca.
- Generación de tablas horizontales de alta legibilidad para impresión o exportación nativa a PDF (formato Landscape).

---

## 6. Reglas de Desarrollo

> **Seguridad Primero:** Toda interacción con datos sensibles o perfiles de equipo debe realizarse a través del SDK de Supabase respetando las políticas de Row Level Security (RLS) configuradas en la consola de Supabase.
>
> **Mantenimiento del Diseño:** Conservar el tema estético Cyber-Neón premium (fuente *Outfit*, esquinas redondeadas suavizadas, sombras de brillo y acentos violeta/rosa neón) para cualquier nueva vista o interacción.
