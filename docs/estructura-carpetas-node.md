# Estructura de carpetas para HelpDesk UAM · alternativas

Cuatro opciones reales, de menor a mayor ceremonia. La restricción del curso
(**R04**: el dominio no importa infraestructura) descarta la A a partir del
corte 2, pero conviene entender por qué.

Regla general antes de elegir: **la estructura es una consecuencia de las
dependencias, no una decoración**. Si al abrir `src/` no se entiende de qué
trata el sistema, la estructura está mal.

---

## A · Plana — todo en `src/`

```
src/
├── main.ts
├── tickets.ts
├── usuarios.ts
├── sla.ts
├── notificaciones.ts
└── db.ts
tests/
```

**A favor** · Cero navegación, cero decisiones. Perfecta para el prototipo de
las primeras dos semanas y para probar una idea.

**En contra** · No hay ninguna frontera: `tickets.ts` importa `db.ts` y ya
quedaste casado con el motor. No se puede probar el dominio sin base de datos.

**Cuándo** · Hasta ~15 archivos. En HelpDesk, solo durante el corte 1 mientras
se estima y se arma el backlog. Migrar después cuesta poco si el código es poco.

---

## B · Por capa técnica (MVC clásico)

```
src/
├── controllers/     TicketController.ts · UsuarioController.ts
├── services/        GestorTickets.ts · ServicioSla.ts
├── repositories/    TicketRepository.ts
├── models/          Ticket.ts · Usuario.ts
├── middlewares/
├── routes/
└── main.ts
tests/
```

**A favor** · Es lo que todo el mundo ha visto; onboarding inmediato. Los
tutoriales de Express usan esta forma.

**En contra** · Dos problemas serios. Primero, agregar *una* funcionalidad
obliga a tocar cinco carpetas. Segundo, y peor: **no impide que `models/`
importe `repositories/`**, así que la inversión de dependencias queda como
disciplina personal, no como estructura. Los `services/` terminan siendo un
saco donde cabe todo — exactamente el `GestorTickets` que la clase 15 usa como
ejemplo de qué no hacer.

**Cuándo** · CRUD sin reglas de negocio propias. HelpDesk **no** es eso: la
regla de vencimiento de SLA y la política de escalamiento son el producto.

---

## C · Hexagonal por capas

```
src/
├── dominio/
│   ├── modelo/           Ticket.ts · Usuario.ts · Prioridad.ts · EstadoTicket.ts
│   ├── servicios/        CalculoSla.ts · EscalamientoSla.ts · PoliticaAsignacion.ts
│   └── puertos/          index.ts  ← RepositorioTickets, ServicioNotificacion, Reloj, GeneradorId
│
├── aplicacion/
│   └── casos-uso/        CrearTicket.ts · AsignarTicket.ts · CerrarTicket.ts · EscalarVencidos.ts
│
├── infraestructura/
│   ├── persistencia/     RepositorioTicketsSQLite.ts
│   ├── notificaciones/   NotificadorCorreo.ts · NotificadorCompuesto.ts
│   ├── identidad/        DirectorioLdap.ts
│   ├── http/             servidor.ts · rutas/
│   ├── tiempo/           RelojSistema.ts
│   └── planificador/     TareaEscalamiento.ts
│
└── main.ts               ← raíz de composición: ÚNICO lugar con `new` de infraestructura

tests/
├── unidad/               dominio y casos de uso, sin BD ni red
├── integracion/          adaptadores reales
└── dobles/               RelojFijo.ts · RepositorioTicketsEnMemoria.ts · NotificadorEspia.ts
```

**La regla que lo sostiene** — una sola flecha, siempre hacia adentro:

```
infraestructura ──▶ aplicacion ──▶ dominio
                                    ▲
     (implementa los puertos que el dominio declara)
```

**A favor** · Es la estructura que exige la entrega del corte 2 y la que hace
posible todo lo demás del semestre: pruebas del dominio en milisegundos,
Strategy para asignación por sede, Adapter para LDAP y SMTP, refactorización
sin miedo. Cambiar SQLite por PostgreSQL o nodemailer por otro proveedor no
toca una línea de `dominio/`.

**En contra** · Más archivos y una indirección real. Con menos de ~10 casos de
uso puede sentirse desproporcionada.

**Cuándo** · Ahora. Es la opción por defecto para HelpDesk.

### Cómo hacer cumplir la regla (no confiar en la disciplina)

`eslint.config.js` — el dominio no puede importar infraestructura:

```js
{
  files: ["src/dominio/**"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        { group: ["**/infraestructura/**"], message: "El dominio no importa infraestructura." },
        { group: ["**/aplicacion/**"],      message: "El dominio no conoce los casos de uso." },
      ],
    }],
  },
}
```

Verificación de emergencia, sin configurar nada:

```bash
grep -rn "from ['\"].*infraestructura" src/dominio/ && echo "❌ DIP roto" || echo "✅ dominio limpio"
```

---

## D · Por módulo de negocio (*screaming architecture*)

```
src/
├── tickets/
│   ├── dominio/          Ticket.ts · CalculoSla.ts · puertos.ts
│   ├── aplicacion/       CrearTicket.ts · EscalarVencidos.ts
│   ├── infraestructura/  RepositorioTicketsSQLite.ts · rutas.ts
│   └── index.ts          ← API pública del módulo; nadie importa hacia adentro
├── usuarios/             misma forma
├── catalogo/             categorías y SLA
├── informes/
├── compartido/           tipos y utilidades que de verdad comparten dos módulos
└── main.ts
```

**A favor** · `src/` cuenta de qué trata el sistema. Cada módulo se toca
completo al implementar una historia. Es el paso natural si el proyecto crece a
varios equipos, y la antesala de separarlo en servicios si algún día hiciera
falta.

**En contra** · La pregunta difícil aparece pronto: ¿de quién es `Usuario`, de
`tickets/` o de `usuarios/`? Sin disciplina, `compartido/` se convierte en el
nuevo saco de todo. Y con 4 módulos hay 4 copias de la misma estructura de tres
capas.

**Cuándo** · Cuando la carpeta `aplicacion/casos-uso/` de la opción C pase de
~15 archivos, o cuando dos personas se pisen constantemente en los mismos
archivos. Hoy, no.

---

## Comparación

| | A · Plana | B · Por capa técnica | C · Hexagonal ⭐ | D · Por módulo |
|---|---|---|---|---|
| Archivos para una historia nueva | 1–2 | 5 carpetas | 3–4 dirigidas | 1 carpeta |
| ¿Protege el dominio? | No | No | **Sí, verificable** | Sí |
| Pruebas sin BD ni red | No | Difícil | **Sí** | Sí |
| Cumple R04 del curso | No | No | **Sí** | Sí |
| Costo de entrada | Nulo | Bajo | Medio | Alto |
| Se rompe cuando… | >15 archivos | hay reglas de negocio | >15 casos de uso | el equipo es uno solo |

---

## Recomendación

**Adopta C ahora.** Es la que pide la entrega del corte 2, la que hace baratas
las pruebas y la única en la que los patrones del corte 3 (Strategy, Adapter,
State, Observer) aterrizan en un lugar obvio del árbol.

Migrar de A o B a C es mecánico y se hace en una tarde:

1. Crea `dominio/ aplicacion/ infraestructura/`.
2. Mueve las entidades a `dominio/modelo/` y **borra de ellas todo import externo** (SQL, fechas del sistema, correo).
3. Por cada dependencia externa que quedó huérfana, escribe una interfaz en `dominio/puertos/` con el vocabulario del negocio: `guardar`, `vencidos`, `avisar` — nunca `ejecutarSql`.
4. Mueve las implementaciones concretas a `infraestructura/`, implementando esos puertos.
5. Junta todos los `new` de clases concretas en `main.ts`.
6. Corre el `grep` de arriba. Si sale limpio, terminaste.

Pasa a D solo cuando duela la C, no antes. Cambiar de C a D es reagrupar
carpetas: las fronteras ya están trazadas donde importan.

---

## Convenciones que valen para cualquiera de las cuatro

- **Nombres en el idioma del negocio.** `EscalarVencidos`, no `TicketProcessor`. El código del curso ya está en español; mantenlo consistente.
- **Un archivo, un concepto exportado.** `barrel files` (`index.ts` que reexporta todo) solo en `dominio/puertos/` y en las fronteras de módulo de la opción D; en el resto crean ciclos de importación.
- **`tests/` espeja `src/`.** Encontrar la prueba de un archivo no debería requerir buscar.
- **Nada de `utils/` ni `helpers/`.** Son carpetas sin criterio de pertenencia: todo cabe y nada se encuentra. Si algo no tiene dónde ir, es que le falta un nombre.
- **Alias de importación** en `tsconfig.json` (`"@dominio/*": ["src/dominio/*"]`) para evitar `../../../`. Ayuda además a que la regla de ESLint sea legible.
- **`main.ts` es el único archivo que puede importarlo todo.** Si un segundo archivo empieza a hacerlo, ahí hay un problema de diseño.
