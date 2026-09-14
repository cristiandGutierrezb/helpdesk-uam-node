import { beforeEach, describe, expect, it } from 'vitest'
import {
  CategoriaEnUso,
  GestionarCategorias,
  NombreDeCategoriaRepetido,
} from '../../src/aplicacion/casos-uso/GestionarCategorias'
import {
  CategoriaInvalida,
  GestionarTickets,
  TransicionInvalida,
} from '../../src/aplicacion/casos-uso/GestionarTickets'
import { CategoriaDAOEnMemoria, TicketDAOEnMemoria } from '../dobles/TicketDAOEnMemoria'

const SOLICITANTE = 'usuario-1'

let categorias: GestionarCategorias
let tickets: GestionarTickets
let categoriaId: string

beforeEach(async () => {
  const catalogo = new CategoriaDAOEnMemoria()
  const casos = new TicketDAOEnMemoria()
  categorias = new GestionarCategorias(catalogo, casos)
  tickets = new GestionarTickets(casos, catalogo)
  const red = await categorias.crear({ nombre: 'Red', descripcion: 'Conectividad', horasSla: 4, activa: true })
  categoriaId = red.id
})

const nuevoTicket = () =>
  tickets.crear(
    { asunto: 'No hay internet', descripcion: 'El laboratorio 3 quedó sin red', categoriaId, prioridad: 'ALTA' },
    SOLICITANTE,
  )

describe('catálogo de categorías (F04)', () => {
  it('crea, busca por id, modifica y elimina', async () => {
    const creada = await categorias.crear({ nombre: 'Aulas', descripcion: '', horasSla: 8, activa: true })
    expect(await categorias.porId(creada.id)).toEqual(creada)

    const modificada = await categorias.modificar(creada.id, { horasSla: 2 })
    expect(modificada?.horasSla).toBe(2)

    expect(await categorias.eliminar(creada.id)).toBe(true)
    expect(await categorias.porId(creada.id)).toBeNull()
  })

  it('no admite dos categorías con el mismo nombre, ni al crear ni al renombrar', async () => {
    await expect(categorias.crear({ nombre: ' Red ', descripcion: '', horasSla: 4, activa: true })).rejects.toBeInstanceOf(
      NombreDeCategoriaRepetido,
    )
    const aulas = await categorias.crear({ nombre: 'Aulas', descripcion: '', horasSla: 8, activa: true })
    await expect(categorias.modificar(aulas.id, { nombre: 'Red' })).rejects.toBeInstanceOf(NombreDeCategoriaRepetido)
    // Renombrarla a lo que ya se llamaba no es un conflicto consigo misma.
    await expect(categorias.modificar(aulas.id, { nombre: 'Aulas' })).resolves.toMatchObject({ nombre: 'Aulas' })
  })

  it('se niega a borrar una categoría con tickets: el historial es inmutable (R08)', async () => {
    await nuevoTicket()
    await expect(categorias.eliminar(categoriaId)).rejects.toBeInstanceOf(CategoriaEnUso)
  })

  it('devuelve solo las activas cuando se le piden', async () => {
    const vieja = await categorias.crear({ nombre: 'Impresoras', descripcion: '', horasSla: 24, activa: true })
    await categorias.modificar(vieja.id, { activa: false })
    expect((await categorias.listar(true)).map((c) => c.nombre)).toEqual(['Red'])
    expect(await categorias.listar()).toHaveLength(2)
  })
})

describe('tickets (F01, F06, F11)', () => {
  it('nace NUEVO, sin agente y a nombre de quien tiene la sesión', async () => {
    const ticket = await nuevoTicket()
    expect(ticket).toMatchObject({ estado: 'NUEVO', agenteId: null, solicitanteId: SOLICITANTE })
  })

  it('rechaza un ticket de categoría inexistente o inactiva', async () => {
    const datos = { asunto: 'Sin categoría', descripcion: 'Debería fallar igual', prioridad: 'MEDIA' } as const
    await expect(tickets.crear({ ...datos, categoriaId: 'no-existe' }, SOLICITANTE)).rejects.toBeInstanceOf(
      CategoriaInvalida,
    )
    await categorias.modificar(categoriaId, { activa: false })
    await expect(tickets.crear({ ...datos, categoriaId }, SOLICITANTE)).rejects.toBeInstanceOf(CategoriaInvalida)
  })

  it('busca por estado, por categoría y por texto libre', async () => {
    await nuevoTicket()
    expect(await tickets.buscar({ estado: 'NUEVO' })).toHaveLength(1)
    expect(await tickets.buscar({ estado: 'CERRADO' })).toHaveLength(0)
    expect(await tickets.buscar({ categoriaId })).toHaveLength(1)
    expect(await tickets.buscar({ texto: 'INTERNET' })).toHaveLength(1)
    expect(await tickets.buscar({ texto: 'proyector' })).toHaveLength(0)
  })

  it('asignar un agente a un ticket nuevo lo pasa a ASIGNADO (F05)', async () => {
    const ticket = await nuevoTicket()
    expect(await tickets.modificar(ticket.id, { agenteId: 'agente-7' })).toMatchObject({
      estado: 'ASIGNADO',
      agenteId: 'agente-7',
    })
  })

  it('solo permite las transiciones válidas del ciclo de vida (F06)', async () => {
    const ticket = await nuevoTicket()
    await expect(tickets.modificar(ticket.id, { estado: 'RESUELTO' })).rejects.toBeInstanceOf(TransicionInvalida)

    await tickets.modificar(ticket.id, { estado: 'EN_PROCESO' })
    await tickets.modificar(ticket.id, { estado: 'RESUELTO' })
    await tickets.modificar(ticket.id, { estado: 'CERRADO' })
    // Un ticket cerrado es final: se registra uno nuevo, no se reabre.
    await expect(tickets.modificar(ticket.id, { estado: 'EN_PROCESO' })).rejects.toBeInstanceOf(TransicionInvalida)
  })

  it('modificar o eliminar lo que no existe se avisa, no revienta', async () => {
    expect(await tickets.modificar('fantasma', { prioridad: 'BAJA' })).toBeNull()
    expect(await tickets.eliminar('fantasma')).toBe(false)
    const ticket = await nuevoTicket()
    expect(await tickets.eliminar(ticket.id)).toBe(true)
    expect(await tickets.porId(ticket.id)).toBeNull()
  })
})
