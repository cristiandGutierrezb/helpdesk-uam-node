-- CreateEnum
CREATE TYPE "EstadoTicket" AS ENUM ('NUEVO', 'ASIGNADO', 'EN_PROCESO', 'ESPERA_INFORMACION', 'RESUELTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "horasSla" INTEGER NOT NULL DEFAULT 24,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoTicket" NOT NULL DEFAULT 'NUEVO',
    "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "categoriaId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "agenteId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

-- CreateIndex
CREATE INDEX "Ticket_estado_idx" ON "Ticket"("estado");

-- CreateIndex
CREATE INDEX "Ticket_solicitanteId_idx" ON "Ticket"("solicitanteId");

-- CreateIndex
CREATE INDEX "Ticket_agenteId_idx" ON "Ticket"("agenteId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
