-- =============================================================
-- MIGRACIÓN: AGREGAR FECHA DE ENTREGA Y FECHA DE PUBLICACIÓN
-- Ejecutar en el SQL Editor de tu panel de Supabase
-- =============================================================

-- 1. Agregar campos de fecha de entrega y fecha de publicación en camelCase con comillas dobles
ALTER TABLE public.publicaciones ADD COLUMN IF NOT EXISTS "fechaEntrega" TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.publicaciones ADD COLUMN IF NOT EXISTS "fechaPublicacion" TIMESTAMP WITH TIME ZONE;

-- 2. Migración inicial para rellenar registros históricos existentes con sus fechas programadas
UPDATE public.publicaciones SET "fechaPublicacion" = "fechaProgramada" WHERE "fechaPublicacion" IS NULL;
UPDATE public.publicaciones SET "fechaEntrega" = "fechaProgramada" WHERE "fechaEntrega" IS NULL;
