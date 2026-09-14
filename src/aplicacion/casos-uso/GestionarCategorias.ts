import type { Categoria, CategoriaCambios, CategoriaNueva } from '../../dominio/modelo/Categoria'
import type { CategoriaDAO, TicketDAO } from '../../dominio/puertos'

// ponytail: un caso de uso por ENTIDAD y no por operación. Crear, buscar,
// modificar y eliminar una categoría comparten las mismas dos dependencias y
// la misma regla de unicidad; separarlos en cuatro clases sería cuatro copias
// del mismo constructor. Cuando una operación gane reglas propias (auditoría
// de F23, por ejemplo), esa sí se saca a su propia clase.

export class NombreDeCategoriaRepetido extends Error {
  constructor(nombre: string) {
    super(`Ya existe una categoría llamada ${nombre}`)
  }
}

export class CategoriaEnUso extends Error {
  constructor(tickets: number) {
    super(`No se puede eliminar: ${tickets} ticket(s) usan esta categoría. Desactívala en su lugar.`)
  }
}

export class GestionarCategorias {
  constructor(
    private readonly categorias: CategoriaDAO,
    private readonly tickets: TicketDAO,
  ) {}

  async crear(datos: CategoriaNueva): Promise<Categoria> {
    const nombre = datos.nombre.trim()
    if (await this.categorias.porNombre(nombre)) throw new NombreDeCategoriaRepetido(nombre)
    return this.categorias.guardar({ ...datos, nombre })
  }

  listar(soloActivas = false): Promise<Categoria[]> {
    return this.categorias.listar(soloActivas)
  }

  porId(id: string): Promise<Categoria | null> {
    return this.categorias.porId(id)
  }

  async modificar(id: string, cambios: CategoriaCambios): Promise<Categoria | null> {
    if (cambios.nombre !== undefined) {
      const nombre = cambios.nombre.trim()
      const otra = await this.categorias.porNombre(nombre)
      // Renombrarla a lo que ya se llamaba no es un conflicto consigo misma.
      if (otra && otra.id !== id) throw new NombreDeCategoriaRepetido(nombre)
      return this.categorias.actualizar(id, { ...cambios, nombre })
    }
    return this.categorias.actualizar(id, cambios)
  }

  async eliminar(id: string): Promise<boolean> {
    // El historial de tickets es inmutable (R08): una categoría con tickets se
    // desactiva, no se borra, o el ticket quedaría sin clasificación.
    const enUso = await this.tickets.contarPorCategoria(id)
    if (enUso > 0) throw new CategoriaEnUso(enUso)
    return this.categorias.eliminar(id)
  }
}
