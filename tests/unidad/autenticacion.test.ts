import { describe, expect, it } from 'vitest'
import { CorreoYaRegistrado, RegistrarUsuario } from '../../src/aplicacion/casos-uso/RegistrarUsuario'
import { CredencialesInvalidas, IniciarSesion } from '../../src/aplicacion/casos-uso/IniciarSesion'
import { TokensJwt } from '../../src/infraestructura/seguridad/TokensJwt'
import { ClavesFalsas, UsuarioDAOEnMemoria } from '../dobles/UsuarioDAOEnMemoria'

function armar() {
  const usuarios = new UsuarioDAOEnMemoria()
  const claves = new ClavesFalsas()
  const tokens = new TokensJwt('secreto-de-prueba')
  return {
    tokens,
    registrar: new RegistrarUsuario(usuarios, claves),
    iniciar: new IniciarSesion(usuarios, claves, tokens),
  }
}

const AGENTE = { nombre: 'Ana Agente', correo: 'Ana@uam.edu.co', clave: 'clave-larga', rol: 'AGENTE' } as const

describe('registro e inicio de sesión', () => {
  it('registra normalizando el correo y guardando la clave cifrada por el puerto', async () => {
    const { registrar } = armar()
    const usuario = await registrar.ejecutar({ ...AGENTE })
    expect(usuario.correo).toBe('ana@uam.edu.co')
    expect(usuario.claveHash).toBe(`hash:${AGENTE.clave}`)
  })

  it('rechaza un correo ya registrado, sin importar mayúsculas', async () => {
    const { registrar } = armar()
    await registrar.ejecutar({ ...AGENTE })
    await expect(registrar.ejecutar({ ...AGENTE, correo: 'ANA@uam.edu.co' })).rejects.toBeInstanceOf(CorreoYaRegistrado)
  })

  it('inicia sesión y emite un token que conserva id y rol', async () => {
    const { registrar, iniciar, tokens } = armar()
    const creado = await registrar.ejecutar({ ...AGENTE })
    const { token } = await iniciar.ejecutar('ana@uam.edu.co', AGENTE.clave)
    expect(tokens.verificar(token)).toEqual({ id: creado.id, rol: 'AGENTE' })
  })

  it('rechaza clave incorrecta y usuario inexistente con el mismo error', async () => {
    const { registrar, iniciar } = armar()
    await registrar.ejecutar({ ...AGENTE })
    await expect(iniciar.ejecutar('ana@uam.edu.co', 'otra-clave')).rejects.toBeInstanceOf(CredencialesInvalidas)
    await expect(iniciar.ejecutar('nadie@uam.edu.co', AGENTE.clave)).rejects.toBeInstanceOf(CredencialesInvalidas)
  })

  it('no acepta un token con firma ajena', () => {
    expect(new TokensJwt('otro-secreto').verificar(armar().tokens.emitir({ id: '1', rol: 'AGENTE' }))).toBeNull()
  })
})
