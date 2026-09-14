// Dobles de los dos DAO que los casos de uso de tickets necesitan. Van juntos
// porque nunca se usa uno sin el otro: un ticket sin catálogo no existe.

import type { Categoria, CategoriaCambios, CategoriaNueva } from '../../src/dominio/modelo/Categoria'
import type { Ticket, TicketCambios, TicketNuevo } from '../../src/dominio/modelo/Ticket'
import type { CategoriaDAO, FiltroTicketsDTO, TicketDAO } from '../../src/dominio/puertos'

export class CategoriaDAOEnMemoria implements CategoriaDAO {
  private readonly filas: Categoria[] = []

  async guardar(categoria: CategoriaNueva): Promise<Categoria> {
    const fila = { ...categoria, id: String(this.filas.length + 1) }
    this.filas.push(fila)
    return fila
  }

  async listar(soloActivas: boolean): Promise<Categoria[]> {
    return this.filas.filter((c) => !soloActivas || c.activa)
  }

  async porId(id: string): Promise<Categoria | null> {
    return this.filas.find((c) => c.id === id) ?? null
  }

  async porNombre(nombre: string): Promise<Categoria | null> {
    return this.filas.find((c) => c.nombre === nombre) ?? null
  }

  async actualizar(id: string, cambios: CategoriaCambios): Promise<Categoria | null> {
    const fila = await this.porId(id)
    if (!fila) return null
    Object.assign(fila, cambios)
    return fila
  }

  async eliminar(id: string): Promise<boolean> {
    const indice = this.filas.findIndex((c) => c.id === id)
    if (indice < 0) return false
    this.filas.splice(indice, 1)
    return true
  }
}

export class TicketDAOEnMemoria implements TicketDAO {
  private readonly filas: Ticket[] = []

  async guardar(ticket: TicketNuevo): Promise<Ticket> {
    const fila = { ...ticket, id: String(this.filas.length + 1), creadoEn: new Date() }
    this.filas.push(fila)
    return fila
  }

  async buscar(filtro: FiltroTicketsDTO): Promise<Ticket[]> {
    const texto = filtro.texto?.toLowerCase()
    return this.filas.filter(
      (t) =>
        (filtro.estado === undefined || t.estado === filtro.estado) &&
        (filtro.prioridad === undefined || t.prioridad === filtro.prioridad) &&
        (filtro.categoriaId === undefined || t.categoriaId === filtro.categoriaId) &&
        (filtro.solicitanteId === undefined || t.solicitanteId === filtro.solicitanteId) &&
        (filtro.agenteId === undefined || t.agenteId === filtro.agenteId) &&
        (texto === undefined ||
          t.asunto.toLowerCase().includes(texto) ||
          t.descripcion.toLowerCase().includes(texto)),
    )
  }

  async porId(id: string): Promise<Ticket | null> {
    return this.filas.find((t) => t.id === id) ?? null
  }

  async actualizar(id: string, cambios: TicketCambios): Promise<Ticket | null> {
    const fila = await this.porId(id)
    if (!fila) return null
    Object.assign(fila, cambios)
    return fila
  }

  async eliminar(id: string): Promise<boolean> {
    const indice = this.filas.findIndex((t) => t.id === id)
    if (indice < 0) return false
    this.filas.splice(indice, 1)
    return true
  }

  async contarPorCategoria(categoriaId: string): Promise<number> {
    return this.filas.filter((t) => t.categoriaId === categoriaId).length
  }
}
