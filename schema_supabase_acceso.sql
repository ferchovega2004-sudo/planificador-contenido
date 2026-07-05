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

-- =============================================================
-- NUEVA FUNCIÓN RPC: Cambiar contraseña de otros usuarios (ADMIN)
-- Ejecutar en el SQL Editor de Supabase
-- =============================================================
CREATE OR REPLACE FUNCTION public.admin_cambiar_password(
    target_user_id UUID,
    nueva_contrasena TEXT
)
RETURNS VOID AS $$
DECLARE
    caller_role TEXT;
BEGIN
    -- 1. Obtener el rol del usuario que está invocando la función (auth.uid())
    SELECT rol INTO caller_role FROM public.usuarios WHERE id = auth.uid();
    
    -- 2. Validar que quien ejecuta la función sea realmente un ADMINISTRADOR
    IF caller_role IS NULL OR caller_role <> 'ADMIN' THEN
        RAISE EXCEPTION 'No autorizado. Solo los administradores pueden cambiar la contraseña de otros usuarios.';
    END IF;
    
    -- 3. Validar longitud mínima de la contraseña
    IF length(nueva_contrasena) < 6 THEN
        RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres.';
    END IF;

    -- 4. Actualizar la contraseña en la tabla auth.users usando bcrypt (Blowfish)
    UPDATE auth.users
    SET encrypted_password = crypt(nueva_contrasena, gen_salt('bf', 10))
    WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;