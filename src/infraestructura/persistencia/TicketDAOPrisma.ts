import type { PrismaClient } from './generado/client'
import type { TicketModel as FilaTicket } from './generado/models'
import type {
  EstadoTicket,
  Prioridad,
  Ticket,
  TicketCambios,
  TicketNuevo,
} from '../../dominio/modelo/Ticket'
import type { FiltroTicketsDTO, TicketDAO } from '../../dominio/puertos'

const aDominio = (fila: FilaTicket): Ticket => ({
  id: fila.id,
  asunto: fila.asunto,
  descripcion: fila.descripcion,
  estado: fila.estado as EstadoTicket,
  prioridad: fila.prioridad as Prioridad,
  categoriaId: fila.categoriaId,
  solicitanteId: fila.solicitanteId,
  agenteId: fila.agenteId,
  creadoEn: fila.creadoEn,
})

export class TicketDAOPrisma implements TicketDAO {
  constructor(private readonly prisma: PrismaClient) {}

  async guardar(ticket: TicketNuevo): Promise<Ticket> {
    return aDominio(await this.prisma.ticket.create({ data: ticket }))
  }

  async buscar(filtro: FiltroTicketsDTO): Promise<Ticket[]> {
    const { texto, ...campos } = filtro
    const filas = await this.prisma.ticket.findMany({
      where: {
        // Cada campo presente restringe; los ausentes no aparecen en el `where`.
        ...campos,
        ...(texto
          ? {
              OR: [
                { asunto: { contains: texto, mode: 'insensitive' as const } },
                { descripcion: { contains: texto, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { creadoEn: 'desc' },
    })
    return filas.map(aDominio)
  }

  async porId(id: string): Promise<Ticket | null> {
    const fila = await this.prisma.ticket.findUnique({ where: { id } })
    return fila && aDominio(fila)
  }

  async actualizar(id: string, cambios: TicketCambios): Promise<Ticket | null> {
    const [fila] = await this.prisma.ticket.updateManyAndReturn({ where: { id }, data: cambios })
    return fila ? aDominio(fila) : null
  }

  async eliminar(id: string): Promise<boolean> {
    const { count } = await this.prisma.ticket.deleteMany({ where: { id } })
    return count > 0
  }

  contarPorCategoria(categoriaId: string): Promise<number> {
    return this.prisma.ticket.count({ where: { categoriaId } })
  }
}
