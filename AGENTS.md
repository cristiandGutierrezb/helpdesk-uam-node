# HelpDesk UAM · backend

API REST del sistema de tickets de soporte de la UAM. Node + TypeScript
estricto, Express 5, Prisma 7 sobre PostgreSQL. **Arquitectura hexagonal, y no
es decoración: es la restricción R04 de la entrega.**

El *qué* y el *por qué* del producto están en `docs/vision-helpdesk-uam.md`
(copia del documento de visión). Las características se citan por su número:
F01 = registro de solicitudes, F04 = catálogo configurable, F08 = escalamiento
automático, R08 = historial inmutable. **Al implementar algo, cita la F o la R
que lo justifica en un comentario**: es lo que separa una decisión de un
capricho.

## La regla que lo sostiene

```
infraestructura ──▶ aplicacion ──▶ dominio
```

Una sola flecha, siempre hacia adentro. `dominio/` no importa nada de fuera —ni
Express, ni Prisma, ni bcrypt—. Se verifica, no se confía:

```bash
npm run arquitectura   # falla si dominio/ o aplicacion/ importan infraestructura
```

## Dónde va cada cosa

| Si es… | Va en… |
|---|---|
| Una regla del negocio (qué estados son válidos, qué hace única a una categoría) | `src/dominio/modelo/` |
| Algo que el dominio necesita del exterior | `src/dominio/puertos/index.ts` (una interfaz) |
| Orquestación de un flujo completo | `src/aplicacion/casos-uso/` |
| SQL, HTTP, bcrypt, JWT, correo | `src/infraestructura/` |
| `new` de una clase concreta | **solo** `src/main.ts` |

## Convenciones que no se negocian

- **Español para el negocio.** `GestionarTickets`, `porCorreo`, `horasSla`. Nunca `TicketService.findAll`.
- **Sufijos con significado**: `...DAO` = acceso a datos, `...DTO` = estructura que cruza una frontera, sin sufijo = entidad del dominio o puerto de comportamiento.
- **Validación en la frontera.** Lo que entra por HTTP es `unknown` hasta que una función `validar*` lo prueba. El dominio recibe datos ya válidos.
- **Un caso de uso por entidad**, no por operación (ver README). Una operación con reglas propias sí va a su clase.
- **Nada de `utils/` ni `helpers/`.** Si algo no tiene dónde ir, es que le falta un nombre.
- **`tests/` espeja `src/`.** Las pruebas del dominio corren sin base de datos ni red, contra los dobles de `tests/dobles/`.
- TypeScript va con `strict`, `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`: los campos opcionales se arman con *spread* condicional (`...(x !== undefined ? { x } : {})`), nunca asignando `undefined`.

## Antes de dar algo por hecho

```bash
npm run arquitectura && npx tsc --noEmit && npm test
```

Y si se tocaron rutas, probarlas de verdad: `npm run db:up && npm run dev`, y
`curl` contra `http://localhost:3001/api` (hay ejemplos en el README).

## Agregar o cambiar una entidad

Hay una receta paso a paso con los diez archivos que se tocan, en orden:
**`.claude/skills/entidad-backend/SKILL.md`**. Si el cambio cruza al cliente,
el proyecto móvil está en `../../moviles/from-zero-app` y tiene la suya.
