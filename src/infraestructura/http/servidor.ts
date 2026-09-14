import express, { Router } from 'express'
import type { ErrorRequestHandler, Express } from 'express'
import swaggerUi from 'swagger-ui-express'
import { openapi } from './openapi'
import { rutasAutenticacion } from './rutas/autenticacion'
import type { DependenciasAutenticacion } from './rutas/autenticacion'
import { rutasCategorias } from './rutas/categorias'
import type { DependenciasCategorias } from './rutas/categorias'
import { rutasTickets } from './rutas/tickets'
import type { DependenciasTickets } from './rutas/tickets'

/** Todo lo que el servidor necesita para existir; `main.ts` lo arma una sola vez. */
export type Dependencias = DependenciasAutenticacion & DependenciasCategorias & DependenciasTickets

const errores: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Error interno' })
}

export function crearServidor(deps: Dependencias): Express {
  const api = Router()
  api.get('/salud', (_req, res) => void res.json({ estado: 'ok' }))
  api.get('/openapi.json', (_req, res) => void res.json(openapi))
  api.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'HelpDesk UAM · API' }))
  api.use('/auth', rutasAutenticacion(deps))
  api.use('/categorias', rutasCategorias(deps))
  api.use('/tickets', rutasTickets(deps))

  const app = express()
  app.use(express.json())
  app.use('/api', api)
  app.use((_req, res) => void res.status(404).json({ error: 'Ruta no encontrada' }))
  app.use(errores)
  return app
}
