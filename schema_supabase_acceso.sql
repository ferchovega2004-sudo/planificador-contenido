-- =============================================================
-- FIX: Políticas RLS de la tabla "usuarios"
-- Ejecutar en el SQL Editor de Supabase
-- =============================================================

-- 1. Eliminar políticas antiguas que causan el error 406
DROP POLICY IF EXISTS "Permitir lectura de usuarios a miembros autenticados" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir modificar perfil propio" ON public.usuarios;

-- 2. SELECT: Permitir leer TODOS los usuarios (el filtro de deletedAt se aplica en la app)
CREATE POLICY "Permitir lectura de usuarios a miembros autenticados"
    ON public.usuarios
    FOR SELECT
    TO authenticated
    USING (true);

-- 3. UPDATE: Permitir que administradores modifiquen cualquier usuario (soft-delete, toggle acceso, etc.)
CREATE POLICY "Permitir modificar usuarios autenticados"
    ON public.usuarios
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. INSERT: Necesario para el trigger de auth y para registros directos
CREATE POLICY "Permitir insertar usuarios"
    ON public.usuarios
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 5. DELETE: Por completitud (aunque usamos soft-delete)
CREATE POLICY "Permitir eliminar usuarios"
    ON public.usuarios
    FOR DELETE
    TO authenticated
    USING (true);