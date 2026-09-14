// Ticket: la unidad de trabajo del producto y su única fuente de verdad
// (sección 4.1 del documento de visión).

export const ESTADOS = [
  'NUEVO',
  'ASIGNADO',
  'EN_PROCESO',
  'ESPERA_INFORMACION',
  'RESUELTO',
  'CERRADO',
] as const

export type EstadoTicket = (typeof ESTADOS)[number]

export const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] as const

export type Prioridad = (typeof PRIORIDADES)[number]

export interface Ticket {
  id: string
  asunto: string
  descripcion: string
  estado: EstadoTicket
  prioridad: Prioridad
  categoriaId: string
  solicitanteId: string
  agenteId: string | null
  creadoEn: Date
}

/** Un ticket que todavía no existe: el DAO asigna el id y la fecha al guardarlo. */
export type TicketNuevo = Omit<Ticket, 'id' | 'creadoEn'>

/** Lo que se puede modificar de un ticket. El solicitante y la fecha, nunca. */
export type TicketCambios = Partial<
  Pick<Ticket, 'asunto' | 'descripcion' | 'estado' | 'prioridad' | 'categoriaId' | 'agenteId'>
>

/**
 * Ciclo de vida (F06): a qué estados puede pasar un ticket desde cada estado.
 *
 * Es una regla de negocio, no una validación de formulario: vive en el dominio
 * para que valga igual venga el cambio de HTTP, de un lote o del planificador.
 */
export const TRANSICIONES: Record<EstadoTicket, readonly EstadoTicket[]> = {
  NUEVO: ['ASIGNADO', 'EN_PROCESO', 'CERRADO'],
  ASIGNADO: ['EN_PROCESO', 'ESPERA_INFORMACION', 'CERRADO'],
  EN_PROCESO: ['ESPERA_INFORMACION', 'RESUELTO', 'CERRADO'],
  ESPERA_INFORMACION: ['EN_PROCESO', 'CERRADO'],
  // F15: el solicitante puede reabrir un ticket resuelto dentro del plazo.
  RESUELTO: ['CERRADO', 'EN_PROCESO'],
  // Estado final: un ticket cerrado no se reabre, se registra uno nuevo.
  CERRADO: [],
}

export function esEstadoTicket(valor: unknown): valor is EstadoTicket {
  return ESTADOS.includes(valor as EstadoTicket)
}

export function esPrioridad(valor: unknown): valor is Prioridad {
  return PRIORIDADES.includes(valor as Prioridad)
}

export function puedeTransitar(desde: EstadoTicket, hasta: EstadoTicket): boolean {
  return desde === hasta || TRANSICIONES[desde].includes(hasta)
}
