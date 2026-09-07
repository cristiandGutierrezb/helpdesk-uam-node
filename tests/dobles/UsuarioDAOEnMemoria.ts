import type { Usuario, UsuarioNuevo } from '../../src/dominio/modelo/Usuario'
import type { ServicioClaves, UsuarioDAO } from '../../src/dominio/puertos'

export class UsuarioDAOEnMemoria implements UsuarioDAO {
  private readonly filas: Usuario[] = []

  async guardar(usuario: UsuarioNuevo): Promise<Usuario> {
    const fila = { ...usuario, id: String(this.filas.length + 1) }
    this.filas.push(fila)
    return fila
  }

  async porCorreo(correo: string): Promise<Usuario | null> {
    return this.filas.find((u) => u.correo === correo) ?? null
  }

  async porId(id: string): Promise<Usuario | null> {
    return this.filas.find((u) => u.id === id) ?? null
  }
}

/** Hash falso: las pruebas del dominio no necesitan bcrypt ni su costo. */
export class ClavesFalsas implements ServicioClaves {
  async cifrar(clave: string): Promise<string> {
    return `hash:${clave}`
  }

  async coincide(clave: string, hash: string): Promise<boolean> {
    return hash === `hash:${clave}`
  }
}
