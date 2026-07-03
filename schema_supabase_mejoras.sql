-- Script SQL de Actualización para Supabase (Planificador de Contenido)
-- Copia este código y ejecútalo en el "SQL Editor" de tu panel de Supabase.

-- 1. Modificar la restricción check de rol en public.usuarios para admitir 'EDITOR' y 'ACOMPAÑANTE'
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('ADMIN', 'USER', 'EDITOR', 'ACOMPAÑANTE'));

-- 2. Crear la tabla de asociación public.usuario_clientes
CREATE TABLE IF NOT EXISTS public.usuario_clientes (
    id SERIAL PRIMARY KEY,
    "usuarioId" UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    "clienteId" INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE("usuarioId", "clienteId")
);

-- Habilitar seguridad de fila RLS en usuario_clientes
ALTER TABLE public.usuario_clientes ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para usuario_clientes
CREATE POLICY "Permitir todo a usuarios autenticados en usuario_clientes"
    ON public.usuario_clientes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Modificar la tabla clientes para añadir el campo 'contenido'
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS contenido TEXT;
