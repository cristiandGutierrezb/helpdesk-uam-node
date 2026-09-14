// Puertos: lo que el dominio necesita del exterior, en su propio vocabulario.
//
// - `...DAO`  → acceso a datos: quien sepa guardar y recuperar entidades.
// - `...DTO`  → estructura de datos que cruza una frontera.
// - Sin sufijo → contratos de comportamiento, que no son ni datos ni persistencia.

import type { Categoria, CategoriaCambios, CategoriaNueva } from '../modelo/Categoria'
import type { EstadoTicket, Prioridad, Ticket, TicketCambios, TicketNuevo } from '../modelo/Ticket'
import type { Rol, Usuario, UsuarioNuevo } from '../modelo/Usuario'

export interface UsuarioDAO {
  guardar(usuario: UsuarioNuevo): Promise<Usuario>
  porCorreo(correo: string): Promise<Usuario | null>
  porId(id: string): Promise<Usuario | null>
}

export interface ServicioClaves {
  cifrar(clave: string): Promise<string>
  coincide(clave: string, hash: string): Promise<boolean>
}

/** Contenido útil del token: viaja entre el cliente y el servidor en cada petición. */
export interface CredencialDTO {
  id: string
  rol: Rol
}

export interface ServicioTokens {
  emitir(credencial: CredencialDTO): string
  verificar(token: string): CredencialDTO | null
}

export interface CategoriaDAO {
  guardar(categoria: CategoriaNueva): Promise<Categoria>
  /** Catálogo completo, o solo lo que se puede usar hoy si `soloActivas`. */
  listar(soloActivas: boolean): Promise<Categoria[]>
  porId(id: string): Promise<Categoria | null>
  porNombre(nombre: string): Promise<Categoria | null>
  /** `null` si no existe: quien llama decide si eso es un 404. */
  actualizar(id: string, cambios: CategoriaCambios): Promise<Categoria | null>
  /** `false` si no existe. */
  eliminar(id: string): Promise<boolean>
}

/** Criterios de búsqueda de tickets (F11). Todo ausente = todos los tickets. */
export interface FiltroTicketsDTO {
  estado?: EstadoTicket
  prioridad?: Prioridad
  categoriaId?: string
  solicitanteId?: string
  agenteId?: string
  /** Texto libre contra el asunto y la descripción, sin distinguir mayúsculas. */
  texto?: string
}

export interface TicketDAO {
  guardar(ticket: TicketNuevo): Promise<Ticket>
  buscar(filtro: FiltroTicketsDTO): Promise<Ticket[]>
  porId(id: string): Promise<Ticket | null>
  actualizar(id: string, cambios: TicketCambios): Promise<Ticket | null>
  eliminar(id: string): Promise<boolean>
  /** Cuántos tickets dependen de una categoría; evita borrar el catálogo bajo sus pies. */
  contarPorCategoria(categoriaId: string): Promise<number>
}
