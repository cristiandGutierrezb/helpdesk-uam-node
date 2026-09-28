// Datos de arranque. Dos cosas que el sistema no puede crearse a sí mismo:
//
//  1. El catálogo provisional de categorías y SLA que la coordinación acordó en
//     la reunión de análisis mientras entrega el definitivo (suposición S3).
//     Sin él no se puede registrar una solicitud: un ticket sin categoría no existe.
//  2. Las cuentas de agente y coordinación. El registro público solo crea
//     SOLICITANTEs, así que sin esto nadie podría administrar el catálogo (F04)
//     ni atender un caso. El rol es un acto administrativo, no un campo de un
//     formulario; el día que exista el adaptador de LDAP (R01/F21) los roles
//     llegan de allá y estas filas sobran.
//
// Es idempotente: correrlo dos veces no duplica nada ni pisa las claves que ya
// se hayan cambiado.
//
//     npm run db:seed

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/infraestructura/persistencia/generado/client'
import { ClavesBcrypt } from '../src/infraestructura/seguridad/ClavesBcrypt'

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

// Una sola clave para todas las cuentas de arranque, tomada del entorno.
// ponytail: es un dato de desarrollo, no un esquema de credenciales. Para
// producción, crear las cuentas por el directorio institucional y no por aquí.
const CLAVE = process.env['SEED_CLAVE'] ?? 'helpdesk-2026'

const EQUIPO = [
  { nombre: 'Coordinación de Soporte', correo: 'coordinacion@autonoma.edu.co', rol: 'COORDINADOR' },
  { nombre: 'Ana Agente', correo: 'agente@autonoma.edu.co', rol: 'AGENTE' },
] as const

async function main() {
  for (const categoria of CATALOGO) {
    await prisma.categoria.upsert({
      where: { nombre: categoria.nombre },
      update: {},
      create: categoria,
    })
  }
  console.log(`Catálogo listo: ${CATALOGO.length} categorías`)

  const claveHash = await new ClavesBcrypt().cifrar(CLAVE)
  for (const persona of EQUIPO) {
    // `update: {}` deja intacta la cuenta que ya existía: si alguien cambió la
    // clave, correr el seed otra vez no se la devuelve al valor de fábrica.
    await prisma.usuario.upsert({
      where: { correo: persona.correo },
      update: {},
      create: { ...persona, claveHash },
    })
  }
  // La clave no se imprime (queda en la bitácora); está en `.env.example`.
  console.log(`Equipo listo: ${EQUIPO.map((p) => `${p.correo} (${p.rol})`).join(', ')}`)
}

main().finally(() => prisma.$disconnect())
