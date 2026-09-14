import { Router } from 'express'
import type { CategoriaCambios, CategoriaNueva } from '../../../dominio/modelo/Categoria'
import type { ServicioTokens } from '../../../dominio/puertos'
import {
  CategoriaEnUso,
  GestionarCategorias,
  NombreDeCategoriaRepetido,
} from '../../../aplicacion/casos-uso/GestionarCategorias'
import { exigirRol, exigirSesion } from './autenticacion'

export interface DependenciasCategorias {
  gestionarCategorias: GestionarCategorias
  tokens: ServicioTokens
}

/** Validación de frontera: lo que entra por HTTP es `unknown` hasta probar lo contrario. */
function validarNueva(cuerpo: unknown): CategoriaNueva | string {
  const d = (cuerpo ?? {}) as Record<string, unknown>
  if (typeof d['nombre'] !== 'string' || d['nombre'].trim().length < 3) return 'nombre requerido (mínimo 3 caracteres)'
  const parciales = validarCambios({ ...d, nombre: undefined })
  if (typeof parciales === 'string') return parciales
  return {
    nombre: d['nombre'],
    descripcion: parciales.descripcion ?? '',
    horasSla: parciales.horasSla ?? 24,
    activa: parciales.activa ?? true,
  }
}

function validarCambios(cuerpo: unknown): CategoriaCambios | string {
  const d = (cuerpo ?? {}) as Record<string, unknown>
  const cambios: CategoriaCambios = {}

  if (d['nombre'] !== undefined) {
    if (typeof d['nombre'] !== 'string' || d['nombre'].trim().length < 3) return 'nombre inválido (mínimo 3 caracteres)'
    cambios.nombre = d['nombre']
  }
  if (d['descripcion'] !== undefined) {
    if (typeof d['descripcion'] !== 'string') return 'descripcion debe ser texto'
    cambios.descripcion = d['descripcion'].trim()
  }
  if (d['horasSla'] !== undefined) {
    // El SLA es el corazón del producto: un compromiso de 0 horas o fraccionario
    // haría que el escalamiento (F08) dispare siempre o nunca.
    if (!Number.isInteger(d['horasSla']) || (d['horasSla'] as number) < 1) return 'horasSla debe ser un entero de al menos 1'
    cambios.horasSla = d['horasSla'] as number
  }
  if (d['activa'] !== undefined) {
    if (typeof d['activa'] !== 'boolean') return 'activa debe ser true o false'
    cambios.activa = d['activa']
  }
  return cambios
}

export function rutasCategorias(deps: DependenciasCategorias): Router {
  const rutas = Router()
  // Todo el catálogo exige sesión; escribirlo, además, exige mando (F04).
  rutas.use(exigirSesion(deps.tokens))
  const coordinacion = exigirRol('COORDINADOR', 'ADMINISTRADOR')

  rutas.get('/', async (req, res, next) => {
    try {
      res.json(await deps.gestionarCategorias.listar(req.query['activas'] === 'true'))
    } catch (error) {
      next(error)
    }
  })

  rutas.get('/:id', async (req, res, next) => {
    try {
      const categoria = await deps.gestionarCategorias.porId(String(req.params['id'] ?? ''))
      if (!categoria) return void res.status(404).json({ error: 'Categoría no encontrada' })
      res.json(categoria)
    } catch (error) {
      next(error)
    }
  })

  rutas.post('/', coordinacion, async (req, res, next) => {
    const datos = validarNueva(req.body)
    if (typeof datos === 'string') return void res.status(400).json({ error: datos })
    try {
      res.status(201).json(await deps.gestionarCategorias.crear(datos))
    } catch (error) {
      if (error instanceof NombreDeCategoriaRepetido) return void res.status(409).json({ error: error.message })
      next(error)
    }
  })

  rutas.patch('/:id', coordinacion, async (req, res, next) => {
    const cambios = validarCambios(req.body)
    if (typeof cambios === 'string') return void res.status(400).json({ error: cambios })
    try {
      const categoria = await deps.gestionarCategorias.modificar(String(req.params['id'] ?? ''), cambios)
      if (!categoria) return void res.status(404).json({ error: 'Categoría no encontrada' })
      res.json(categoria)
    } catch (error) {
      if (error instanceof NombreDeCategoriaRepetido) return void res.status(409).json({ error: error.message })
      next(error)
    }
  })

  rutas.delete('/:id', coordinacion, async (req, res, next) => {
    try {
      const borrada = await deps.gestionarCategorias.eliminar(String(req.params['id'] ?? ''))
      if (!borrada) return void res.status(404).json({ error: 'Categoría no encontrada' })
      res.status(204).end()
    } catch (error) {
      if (error instanceof CategoriaEnUso) return void res.status(409).json({ error: error.message })
      next(error)
    }
  })

  return rutas
}
