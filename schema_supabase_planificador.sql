-- Script de Creación de Tablas para Supabase (Planificador de Contenido)
-- Copia este código y ejecútalo en el "SQL Editor" de tu panel de Supabase.

-- 1. Crear Tabla de Clientes (Marcas)
CREATE TABLE public.clientes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE,
    "deletedAt" TIMESTAMP WITH TIME ZONE
);

-- 2. Crear Tabla de Publicaciones
CREATE TABLE public.publicaciones (
    id SERIAL PRIMARY KEY,
    "clienteId" INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    titulo TEXT NOT NULL,
    "fechaProgramada" TIMESTAMP WITH TIME ZONE NOT NULL,
    estado TEXT NOT NULL DEFAULT 'POR_GRABAR' CHECK (estado IN ('POR_GRABAR', 'EDICION', 'TERMINADO', 'PUBLICADO')),
    guion TEXT,
    "driveUrl" VARCHAR(500),
    notas TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE,
    "deletedAt" TIMESTAMP WITH TIME ZONE
);

-- 3. Crear Tabla de Usuarios (Mapeo de Perfiles desde Supabase Auth)
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'USER' CHECK (rol IN ('ADMIN', 'USER')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE,
    "deletedAt" TIMESTAMP WITH TIME ZONE
);

-- 4. Activar Seguridad de Fila (RLS - Row Level Security)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 5. Crear Políticas de Acceso (Lectura/Escritura para usuarios autenticados)
CREATE POLICY "Permitir todo a usuarios autenticados en clientes"
    ON public.clientes
    FOR ALL
    TO authenticated
    USING ("deletedAt" IS NULL)
    WITH CHECK (true);

CREATE POLICY "Permitir todo a usuarios autenticados en publicaciones"
    ON public.publicaciones
    FOR ALL
    TO authenticated
    USING ("deletedAt" IS NULL)
    WITH CHECK (true);

CREATE POLICY "Permitir lectura de usuarios a miembros autenticados"
    ON public.usuarios
    FOR SELECT
    TO authenticated
    USING ("deletedAt" IS NULL);

CREATE POLICY "Permitir modificar perfil propio"
    ON public.usuarios
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 6. Trigger para crear automáticamente el perfil en public.usuarios al registrarse en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id, username, nombre, rol)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nombre', 'Miembro del Equipo'),
    COALESCE(new.raw_user_meta_data->>'rol', 'USER')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
