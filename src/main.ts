// Raíz de composición: el único archivo que puede importarlo todo y hacer `new`
// de implementaciones concretas.
import { RegistrarUsuario } from './aplicacion/casos-uso/RegistrarUsuario'
import { IniciarSesion } from './aplicacion/casos-uso/IniciarSesion'
import { GestionarCategorias } from './aplicacion/casos-uso/GestionarCategorias'
import { GestionarTickets } from './aplicacion/casos-uso/GestionarTickets'
import { prisma } from './infraestructura/persistencia/prisma'
import { UsuarioDAOPrisma } from './infraestructura/persistencia/UsuarioDAOPrisma'
import { CategoriaDAOPrisma } from './infraestructura/persistencia/CategoriaDAOPrisma'
import { TicketDAOPrisma } from './infraestructura/persistencia/TicketDAOPrisma'
import { ClavesBcrypt } from './infraestructura/seguridad/ClavesBcrypt'
import { TokensJwt } from './infraestructura/seguridad/TokensJwt'
import { crearServidor } from './infraestructura/http/servidor'

const secreto = process.env['JWT_SECRET']
if (!secreto) throw new Error('Falta JWT_SECRET (copia .env.example a .env)')

const usuarios = new UsuarioDAOPrisma(prisma)
const categorias = new CategoriaDAOPrisma(prisma)
const tickets = new TicketDAOPrisma(prisma)
const claves = new ClavesBcrypt()
const tokens = new TokensJwt(secreto)

const app = crearServidor({
  usuarios,
  tokens,
  registrarUsuario: new RegistrarUsuario(usuarios, claves),
  iniciarSesion: new IniciarSesion(usuarios, claves, tokens),
  gestionarCategorias: new GestionarCategorias(categorias, tickets),
  gestionarTickets: new GestionarTickets(tickets, categorias),
})

const puerto = Number(process.env['PORT'] ?? 3000)
app.listen(puerto, () => console.log(`HelpDesk UAM escuchando en http://localhost:${puerto}/api · docs en /api/docs`))
