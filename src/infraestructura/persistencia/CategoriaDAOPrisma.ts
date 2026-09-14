import type { PrismaClient } from './generado/client'
import type { CategoriaModel as FilaCategoria } from './generado/models'
import type { Categoria, CategoriaCambios, CategoriaNueva } from '../../dominio/modelo/Categoria'
import type { CategoriaDAO } from '../../dominio/puertos'

const aDominio = (fila: FilaCategoria): Categoria => ({
  id: fila.id,
  nombre: fila.nombre,
  descripcion: fila.descripcion,
  horasSla: fila.horasSla,
  activa: fila.activa,
})

export class CategoriaDAOPrisma implements CategoriaDAO {
  constructor(private readonly prisma: PrismaClient) {}

  async guardar(categoria: CategoriaNueva): Promise<Categoria> {
    return aDominio(await this.prisma.categoria.create({ data: categoria }))
  }

  async listar(soloActivas: boolean): Promise<Categoria[]> {
    const filas = await this.prisma.categoria.findMany({
      where: soloActivas ? { activa: true } : {},
      orderBy: { nombre: 'asc' },
    })
    return filas.map(aDominio)
  }

  async porId(id: string): Promise<Categoria | null> {
    const fila = await this.prisma.categoria.findUnique({ where: { id } })
    return fila && aDominio(fila)
  }

  async porNombre(nombre: string): Promise<Categoria | null> {
    const fila = await this.prisma.categoria.findUnique({ where: { nombre } })
    return fila && aDominio(fila)
  }

  async actualizar(id: string, cambios: CategoriaCambios): Promise<Categoria | null> {
    // `updateManyAndReturn` en vez de `update`: si el id no existe devuelve una
    // lista vacía en lugar de lanzar, que es justo el `null` del contrato.
    const [fila] = await this.prisma.categoria.updateManyAndReturn({ where: { id }, data: cambios })
    return fila ? aDominio(fila) : null
  }

  async eliminar(id: string): Promise<boolean> {
    const { count } = await this.prisma.categoria.deleteMany({ where: { id } })
    return count > 0
  }
}
