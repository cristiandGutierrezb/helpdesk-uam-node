---
name: entidad-backend
description: Receta paso a paso para agregar o modificar una entidad del backend HelpDesk UAM (modelo, puerto DAO, caso de uso, DAO Prisma, rutas HTTP, OpenAPI, pruebas). Úsala cuando haya que crear una entidad nueva, agregarle un campo a una existente, o exponer un CRUD nuevo en la API.
---

# Agregar una entidad al backend de HelpDesk UAM

Diez archivos, siempre en este orden: **de adentro hacia afuera**. Escribir el
adaptador antes que el puerto es cómo se rompe la arquitectura sin notarlo.

Ejemplo vivo de referencia: `Categoria`. Cópiala, no la reinventes.

## 0. Justificar

Busca en `docs/vision-helpdesk-uam.md` qué característica (F01…F24) o
restricción (R01…R15) obliga a esta entidad. Va en un comentario del modelo. Si
no hay ninguna, la entidad probablemente no debe existir todavía.

## 1. `prisma/schema.prisma`

Modelo y enums. Español, `id String @id @default(uuid())`, `creadoEn DateTime @default(now())`.

```bash
npm run db:up && npx prisma migrate dev --name <algo_descriptivo>
```

Eso aplica la migración **y** regenera el cliente en
`src/infraestructura/persistencia/generado/`. Si el tipo `XModel` no aparece,
falta `npx prisma generate`.

## 2. `src/dominio/modelo/X.ts`

La entidad, sin nada de fuera. Además:

- `export type XNuevo = Omit<X, 'id' | 'creadoEn'>` — lo que aún no existe.
- `export type XCambios = Partial<Pick<X, ...>>` — lo que se puede modificar. Deja fuera lo que nunca cambia (el dueño, la fecha).
- Listas de valores como `const ... as const` + `type` derivado + guardia `esX()`, igual que `ROLES`/`ESTADOS`. Sirven para validar en HTTP y para el `enum` de OpenAPI sin repetirlos.
- Las reglas del negocio viven **aquí**, no en la ruta: `TRANSICIONES` y `puedeTransitar()` son el ejemplo.

## 3. `src/dominio/puertos/index.ts`

Una interfaz `XDAO` en vocabulario de negocio:

```ts
guardar(x: XNuevo): Promise<X>
buscar(filtro: FiltroXDTO): Promise<X[]>   // o listar()
porId(id: string): Promise<X | null>
actualizar(id: string, cambios: XCambios): Promise<X | null>  // null = no existe
eliminar(id: string): Promise<boolean>                        // false = no existía
```

`null`/`false` en vez de excepciones: quien llama decide si eso es un 404.

## 4. `src/aplicacion/casos-uso/GestionarXs.ts`

Una clase con crear/buscar/porId/modificar/eliminar, dependencias por
constructor (siempre los **puertos**, nunca las clases concretas). Aquí van las
reglas que necesitan mirar más de una fila: unicidad, «no se puede borrar si
está en uso», transiciones válidas. Cada regla rota lanza un `Error` propio
exportado desde el mismo archivo.

## 5. `src/infraestructura/persistencia/XDAOPrisma.ts`

`implements XDAO`. Una función `aDominio(fila)` traduce la fila de Prisma a la
entidad (y castea los enums). Dos atajos que evitan `try/catch`:

- `updateManyAndReturn({ where: { id }, data })` → `[fila]` o `[]`, sin lanzar.
- `deleteMany({ where: { id } })` → `{ count }`, sin lanzar.

## 6. `src/infraestructura/http/rutas/xs.ts`

- `rutas.use(exigirSesion(deps.tokens))` arriba; `exigirRol('COORDINADOR', 'ADMINISTRADOR')` en las que mandan.
- Dos funciones de validación: `validarNueva` (POST, exige todo) y `validarCambios` (PATCH, valida solo lo presente). Devuelven el DTO o un `string` con el mensaje de error.
- Códigos: 201 crear · 200 leer/modificar · 204 eliminar · 400 datos inválidos · 401 sin sesión · 403 rol o dueño equivocado · 404 no existe · 409 conflicto con una regla del negocio.
- `String(req.params['id'] ?? '')`: con middleware de por medio, Express tipa el parámetro como `string | string[]`.
- Lo que identifica al usuario sale de la sesión (`res.locals['credencial']`), **jamás** del cuerpo.

## 7. `src/infraestructura/http/servidor.ts` y `src/main.ts`

`Dependencias` suma el tipo nuevo; `api.use('/xs', rutasXs(deps))`; y en
`main.ts` se hace el `new` del DAO y del caso de uso. Es el único archivo donde
se juntan las dos mitades.

## 8. `src/infraestructura/http/openapi.ts`

Un esquema en `components.schemas`, un `tag`, y una entrada por ruta. Los
`enum` se importan del dominio, no se copian. La descripción explica **la
regla**, no el campo: quien lee `/api/docs` debe entender por qué un 409.

## 9. `tests/`

`tests/dobles/XDAOEnMemoria.ts` (un array y `findIndex`, nada más) y
`tests/unidad/xs.test.ts`. Prueba lo que puede romperse: unicidad,
transiciones, «no existe», el filtro de búsqueda. No pruebes que Prisma guarda.

## 10. Verificar

```bash
npm run arquitectura && npx tsc --noEmit && npm test
npm run dev   # y curl las rutas nuevas
```

## Y después: el cliente móvil

`../../moviles/from-zero-app` consume esta API y traduce el español del
servidor al inglés de la app en `src/api/`. Un campo nuevo o una ruta nueva
exige tocar allá: `src/types.ts` y el archivo de `src/api/` correspondiente.
