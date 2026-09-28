// La única prueba que toca un socket. Va aparte de `tests/unidad/` a propósito:
// aquí no se verifica una regla del dominio sino la FRONTERA HTTP, que es donde
// vive la decisión de qué rol recibe quien se registra.

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import express from 'express'
import type { Server } from 'node:http'
import { RegistrarUsuario } from '../../src/aplicacion/casos-uso/RegistrarUsuario'
import { IniciarSesion } from '../../src/aplicacion/casos-uso/IniciarSesion'
import { rutasAutenticacion } from '../../src/infraestructura/http/rutas/autenticacion'
import { TokensJwt } from '../../src/infraestructura/seguridad/TokensJwt'
import { ClavesFalsas, UsuarioDAOEnMemoria } from '../dobles/UsuarioDAOEnMemoria'

let servidor: Server
let url: string

beforeAll(async () => {
  const usuarios = new UsuarioDAOEnMemoria()
  const claves = new ClavesFalsas()
  const tokens = new TokensJwt('secreto-de-prueba')
  const app = express()
  app.use(express.json())
  app.use(
    '/auth',
    rutasAutenticacion({
      usuarios,
      tokens,
      registrarUsuario: new RegistrarUsuario(usuarios, claves),
      iniciarSesion: new IniciarSesion(usuarios, claves, tokens),
    }),
  )
  // Puerto 0 = el que esté libre; así la prueba no choca con el servidor de desarrollo.
  await new Promise<void>((listo) => {
    servidor = app.listen(0, () => listo())
  })
  const direccion = servidor.address()
  url = `http://localhost:${typeof direccion === 'object' && direccion ? direccion.port : 0}/auth`
})

afterAll(() => void servidor.close())

const registrar = (cuerpo: unknown) =>
  fetch(`${url}/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })

describe('POST /auth/registro', () => {
  it('crea un SOLICITANTE', async () => {
    const respuesta = await registrar({ nombre: 'Ana Solicitante', correo: 'ana@uam.edu.co', clave: 'clave-larga' })
    expect(respuesta.status).toBe(201)
    expect(await respuesta.json()).toMatchObject({ correo: 'ana@uam.edu.co', rol: 'SOLICITANTE' })
  })

  it('IGNORA el rol que venga en el cuerpo: nadie se nombra a sí mismo administrador (F20)', async () => {
    const respuesta = await registrar({
      nombre: 'Intruso',
      correo: 'intruso@uam.edu.co',
      clave: 'clave-larga',
      rol: 'ADMINISTRADOR',
    })
    expect(respuesta.status).toBe(201)
    expect(await respuesta.json()).toMatchObject({ rol: 'SOLICITANTE' })
  })
})
