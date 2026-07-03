-- Script de Migración de Tablas para Supabase (PostgreSQL)
-- Copia todo este código y pégalo en el "SQL Editor" de tu panel de Supabase, luego haz clic en "Run".

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "clientes" (
    "Id" SERIAL NOT NULL,
    "Nombre" TEXT NOT NULL,
    "Apellido" TEXT NOT NULL,
    "Cedula" TEXT NOT NULL,
    "Telefono" TEXT NOT NULL,
    "Direccion" TEXT NOT NULL,
    "Barrio" TEXT NOT NULL,
    "Correo" TEXT NOT NULL,
    "Ciudad" TEXT NOT NULL,
    "Departamento" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3),
    "DeletedAt" TIMESTAMP(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "Id" SERIAL NOT NULL,
    "ClienteId" INTEGER NOT NULL,
    "Descripcion" VARCHAR(500) NOT NULL,
    "FechaProgramada" TIMESTAMP(3) NOT NULL,
    "TipoProgramacion" INTEGER NOT NULL DEFAULT 0,
    "Estado" INTEGER NOT NULL DEFAULT 0,
    "GeneradoEnPdf" BOOLEAN NOT NULL DEFAULT false,
    "FechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3),
    "DeletedAt" TIMESTAMP(3),

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "configuracionesremitente" (
    "Id" SERIAL NOT NULL,
    "Nombre" TEXT NOT NULL,
    "Cedula" TEXT NOT NULL,
    "Telefono" TEXT NOT NULL,
    "Direccion" TEXT NOT NULL,
    "CiudadOrigen" TEXT NOT NULL,

    CONSTRAINT "configuracionesremitente_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_Cedula_key" ON "clientes"("Cedula");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_ClienteId_fkey" FOREIGN KEY ("ClienteId") REFERENCES "clientes"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
