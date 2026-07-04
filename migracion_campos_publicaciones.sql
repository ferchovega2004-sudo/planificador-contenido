-- Script de Migración SQL para Supabase (Campos Adicionales de Publicación)
-- Copia este código y ejecútalo en el "SQL Editor" de tu panel de Supabase.

ALTER TABLE public.publicaciones ADD COLUMN IF NOT EXISTS plataforma TEXT;
ALTER TABLE public.publicaciones ADD COLUMN IF NOT EXISTS "responsableId" UUID REFERENCES public.usuarios(id) ON DELETE SET NULL;
ALTER TABLE public.publicaciones ADD COLUMN IF NOT EXISTS "horaPublicacion" TEXT;
ALTER TABLE public.publicaciones ADD COLUMN IF NOT EXISTS "miniaturaUrl" TEXT;
