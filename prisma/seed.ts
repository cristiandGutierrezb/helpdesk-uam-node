// Catálogo provisional de categorías y SLA, el que la coordinación acordó en la
// reunión de análisis mientras entrega el definitivo (suposición S3 del
// documento de visión).
//
// Sin esto no se puede registrar una solicitud: un ticket sin categoría no
// existe. Es idempotente: correrlo dos veces no duplica nada.
//
//     npm run db:seed

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/infraestructura/persistencia/generado/client'

const connectionString = process.env['DATABASE_URL']
if (!connectionString) throw new Error('Falta DATABASE_URL (copia .env.example a .env)')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

const CATALOGO = [
  { nombre: 'Red', descripcion: 'Conectividad cableada e inalámbrica', horasSla: 4 },
  { nombre: 'Aulas', descripcion: 'Proyección, audio y equipos de aula', horasSla: 2 },
  { nombre: 'Credenciales', descripcion: 'Acceso, contraseñas y permisos', horasSla: 8 },
  { nombre: 'Plataforma académica', descripcion: 'Notas, matrícula y aula virtual', horasSla: 12 },
  { nombre: 'Otro', descripcion: 'Lo que no encaja en las demás', horasSla: 24 },
]

async function main() {
  for (const categoria of CATALOGO) {
    await prisma.categoria.upsert({
      where: { nombre: categoria.nombre },
      update: {},
      create: categoria,
    })
  }
  console.log(`Catálogo listo: ${CATALOGO.length} categorías`)
}

main().finally(() => prisma.$disconnect())
