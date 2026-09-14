// Categoría del catálogo de servicios (F03/F04 del documento de visión).
//
// Es la que determina el SLA aplicable a un ticket: por eso `horasSla` vive
// aquí y no en el ticket. Cambiar el compromiso de atención de «Red» es
// cambiar una fila de este catálogo, no desplegar código.

export interface Categoria {
  id: string
  nombre: string
  descripcion: string
  /** Horas comprometidas de solución para los tickets de esta categoría. */
  horasSla: number
  /** Una categoría inactiva no admite tickets nuevos, pero conserva los viejos. */
  activa: boolean
}

/** Una categoría que todavía no existe: el DAO asigna el id al guardarla. */
export type CategoriaNueva = Omit<Categoria, 'id'>

/** Modificación parcial: solo los campos que el coordinador quiso tocar. */
export type CategoriaCambios = Partial<CategoriaNueva>
