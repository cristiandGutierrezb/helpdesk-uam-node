import { Router } from 'express'
import { esEstadoTicket, esPrioridad } from '../../../dominio/modelo/Ticket'
import type { TicketCambios } from '../../../dominio/modelo/Ticket'
import type { CredencialDTO, FiltroTicketsDTO, ServicioTokens } from '../../../dominio/puertos'
import {
  CategoriaInvalida,
  GestionarTickets,
  TransicionInvalida,
} from '../../../aplicacion/casos-uso/GestionarTickets'
import type { TicketNuevoDTO } from '../../../aplicacion/casos-uso/GestionarTickets'
import { exigirRol, exigirSesion } from './autenticacion'

export interface DependenciasTickets {
  gestionarTickets: GestionarTickets
  tokens: ServicioTokens
}

/** Un parámetro de consulta solo cuenta si vino como texto no vacío. */
const comoTexto = (valor: unknown): string | undefined =>
  typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : undefined

function validarNuevo(cuerpo: unknown): TicketNuevoDTO | string {
  const d = (cuerpo ?? {}) as Record<string, unknown>
  if (typeof d['asunto'] !== 'string' || d['asunto'].trim().length < 5) return 'asunto requerido (mínimo 5 caracteres)'
  if (typeof d['descripcion'] !== 'string' || d['descripcion'].trim().length < 10) {
    return 'descripcion requerida (mínimo 10 caracteres)'
  }
  if (typeof d['categoriaId'] !== 'string' || !d['categoriaId']) return 'categoriaId requerido'
  // El solicitante no siempre sabe priorizar: MEDIA por defecto y el SLA decide.
  const prioridad: unknown = d['prioridad'] ?? 'MEDIA'
  if (!esPrioridad(prioridad)) return 'prioridad inválida'
  return { asunto: d['asunto'], descripcion: d['descripcion'], categoriaId: d['categoriaId'], prioridad }
}

function validarCambios(cuerpo: unknown): TicketCambios | string {
  const d = (cuerpo ?? {}) as Record<string, unknown>
  const cambios: TicketCambios = {}

  if (d['asunto'] !== undefined) {
    if (typeof d['asunto'] !== 'string' || d['asunto'].trim().length < 5) return 'asunto inválido (mínimo 5 caracteres)'
    cambios.asunto = d['asunto'].trim()
  }
  if (d['descripcion'] !== undefined) {
    if (typeof d['descripcion'] !== 'string' || d['descripcion'].trim().length < 10) {
      return 'descripcion inválida (mínimo 10 caracteres)'
    }
    cambios.descripcion = d['descripcion'].trim()
  }
  if (d['estado'] !== undefined) {
    if (!esEstadoTicket(d['estado'])) return 'estado inválido'
    cambios.estado = d['estado']
  }
  if (d['prioridad'] !== undefined) {
    if (!esPrioridad(d['prioridad'])) return 'prioridad inválida'
    cambios.prioridad = d['prioridad']
  }
  if (d['categoriaId'] !== undefined) {
    if (typeof d['categoriaId'] !== 'string' || !d['categoriaId']) return 'categoriaId inválido'
    cambios.categoriaId = d['categoriaId']
  }
  if (d['agenteId'] !== undefined) {
    // `null` es legítimo: es quitarle el responsable a un ticket.
    if (d['agenteId'] !== null && typeof d['agenteId'] !== 'string') return 'agenteId debe ser texto o null'
    cambios.agenteId = d['agenteId'] as string | null
  }
  return cambios
}

export function rutasTickets(deps: DependenciasTickets): Router {
  const rutas = Router()
  rutas.use(exigirSesion(deps.tokens))
  const credencial = (res: { locals: Record<string, unknown> }): CredencialDTO =>
    res.locals['credencial'] as CredencialDTO

  rutas.post('/', async (req, res, next) => {
    const datos = validarNuevo(req.body)
    if (typeof datos === 'string') return void res.status(400).json({ error: datos })
    try {
      // El solicitante es siempre quien tiene la sesión: no se acepta del cuerpo,
      // o cualquiera podría registrar tickets a nombre de otro.
      res.status(201).json(await deps.gestionarTickets.crear(datos, credencial(res).id))
    } catch (error) {
      if (error instanceof CategoriaInvalida) return void res.status(400).json({ error: error.message })
      next(error)
    }
  })

  rutas.get('/', async (req, res, next) => {
    const { id, rol } = credencial(res)
    const estado = comoTexto(req.query['estado'])
    const prioridad = comoTexto(req.query['prioridad'])
    if (estado !== undefined && !esEstadoTicket(estado)) return void res.status(400).json({ error: 'estado inválido' })
    if (prioridad !== undefined && !esPrioridad(prioridad)) {
      return void res.status(400).json({ error: 'prioridad inválida' })
    }

    const categoriaId = comoTexto(req.query['categoriaId'])
    const agenteId = comoTexto(req.query['agenteId'])
    const texto = comoTexto(req.query['texto'])
    const solicitanteId = comoTexto(req.query['solicitanteId'])

    const filtro: FiltroTicketsDTO = {
      ...(estado !== undefined && esEstadoTicket(estado) ? { estado } : {}),
      ...(prioridad !== undefined && esPrioridad(prioridad) ? { prioridad } : {}),
      ...(categoriaId !== undefined ? { categoriaId } : {}),
      ...(agenteId !== undefined ? { agenteId } : {}),
      ...(texto !== undefined ? { texto } : {}),
      // F10: el solicitante consulta SUS tickets. El filtro se le impone aquí,
      // así no hay forma de pedir los de otro cambiando la consulta.
      ...(rol === 'SOLICITANTE' ? { solicitanteId: id } : solicitanteId !== undefined ? { solicitanteId } : {}),
    }

    try {
      res.json(await deps.gestionarTickets.buscar(filtro))
    } catch (error) {
      next(error)
    }
  })

  rutas.get('/:id', async (req, res, next) => {
    try {
      const ticket = await deps.gestionarTickets.porId(String(req.params['id'] ?? ''))
      if (!ticket) return void res.status(404).json({ error: 'Ticket no encontrado' })
      const { id, rol } = credencial(res)
      if (rol === 'SOLICITANTE' && ticket.solicitanteId !== id) {
        return void res.status(403).json({ error: 'No autorizado para esta operación' })
      }
      res.json(ticket)
    } catch (error) {
      next(error)
    }
  })

  rutas.patch('/:id', async (req, res, next) => {
    const cambios = validarCambios(req.body)
    if (typeof cambios === 'string') return void res.status(400).json({ error: cambios })
    try {
      const ticketId = String(req.params['id'] ?? '')
      const actual = await deps.gestionarTickets.porId(ticketId)
      if (!actual) return void res.status(404).json({ error: 'Ticket no encontrado' })

      const { id, rol } = credencial(res)
      // El solicitante corrige su propio caso; asignar responsable es de soporte.
      if (rol === 'SOLICITANTE' && (actual.solicitanteId !== id || cambios.agenteId !== undefined)) {
        return void res.status(403).json({ error: 'No autorizado para esta operación' })
      }

      res.json(await deps.gestionarTickets.modificar(ticketId, cambios))
    } catch (error) {
      if (error instanceof CategoriaInvalida) return void res.status(400).json({ error: error.message })
      if (error instanceof TransicionInvalida) return void res.status(409).json({ error: error.message })
      next(error)
    }
  })

  // Borrar un ticket contradice el historial inmutable (R08): queda como acto
  // administrativo de la coordinación, no como algo que un agente hace a diario.
  rutas.delete('/:id', exigirRol('COORDINADOR', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
      const borrado = await deps.gestionarTickets.eliminar(String(req.params['id'] ?? ''))
      if (!borrado) return void res.status(404).json({ error: 'Ticket no encontrado' })
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  })

  return rutas
}
