import { puedeTransitar } from '../../dominio/modelo/Ticket'
import type { Prioridad, Ticket, TicketCambios } from '../../dominio/modelo/Ticket'
import type { CategoriaDAO, FiltroTicketsDTO, TicketDAO } from '../../dominio/puertos'

export class CategoriaInvalida extends Error {
  constructor() {
    super('La categoría no existe o está inactiva')
  }
}

export class TransicionInvalida extends Error {
  constructor(desde: string, hasta: string) {
    super(`Un ticket ${desde} no puede pasar a ${hasta}`)
  }
}

/** Lo que el solicitante aporta al registrar un caso (F01); el resto lo pone el sistema. */
export interface TicketNuevoDTO {
  asunto: string
  descripcion: string
  categoriaId: string
  prioridad: Prioridad
}

export class GestionarTickets {
  constructor(
    private readonly tickets: TicketDAO,
    private readonly categorias: CategoriaDAO,
  ) {}

  async crear(datos: TicketNuevoDTO, solicitanteId: string): Promise<Ticket> {
    await this.exigirCategoriaUsable(datos.categoriaId)
    return this.tickets.guardar({
      asunto: datos.asunto.trim(),
      descripcion: datos.descripcion.trim(),
      categoriaId: datos.categoriaId,
      prioridad: datos.prioridad,
      // F01/F02: nace NUEVO y sin dueño; asignarlo es otra decisión (F05).
      estado: 'NUEVO',
      solicitanteId,
      agenteId: null,
    })
  }

  buscar(filtro: FiltroTicketsDTO): Promise<Ticket[]> {
    return this.tickets.buscar(filtro)
  }

  porId(id: string): Promise<Ticket | null> {
    return this.tickets.porId(id)
  }

  async modificar(id: string, cambios: TicketCambios): Promise<Ticket | null> {
    const actual = await this.tickets.porId(id)
    if (!actual) return null

    if (cambios.categoriaId !== undefined) await this.exigirCategoriaUsable(cambios.categoriaId)

    if (cambios.estado !== undefined && !puedeTransitar(actual.estado, cambios.estado)) {
      throw new TransicionInvalida(actual.estado, cambios.estado)
    }

    // F05: darle dueño a un ticket recién llegado lo asigna. Se hace aquí y no
    // en la frontera HTTP para que valga también si mañana lo asigna una regla
    // automática y no una persona.
    const asignacion =
      cambios.agenteId && actual.estado === 'NUEVO' && cambios.estado === undefined
        ? ({ estado: 'ASIGNADO' } as const)
        : {}

    return this.tickets.actualizar(id, { ...cambios, ...asignacion })
  }

  eliminar(id: string): Promise<boolean> {
    return this.tickets.eliminar(id)
  }

  private async exigirCategoriaUsable(categoriaId: string): Promise<void> {
    const categoria = await this.categorias.porId(categoriaId)
    if (!categoria || !categoria.activa) throw new CategoriaInvalida()
  }
}
