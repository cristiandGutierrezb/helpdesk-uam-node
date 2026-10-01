# Backlog HelpDesk UAM · brecha contra el documento de visión

<!-- Estado verificado: `npm run arquitectura` ✅ · `npx tsc --noEmit` ✅ · 17 pruebas en 681 ms ✅
Implementado: 6 de 24 características (F04, F06, F10, F11 parcial, F20 parcial, R03, R04).
Faltante: el diferenciador. No hay `venceEn`, ni planificador, ni notificador, ni historial de eventos. `Categoria.horasSla` se guarda y nadie la lee. -->

## E1 · Escalamiento automático y SLA

- [ ] **E1-1** Añadir `venceEn` al Ticket y calcularlo desde `categoria.horasSla` — *3 pts* — F02/F08 — Un ticket de «Aulas» (2h) nace con `venceEn = creadoEn + 2h`. Migración Prisma + índice.
- [ ] **E1-2** Congelar `horasSla` en el ticket al crearlo (snapshot) — *2 pts* — F08/R08 — Cambiar el catálogo no altera tickets ya abiertos. Dep: E1-1.
- [ ] **E1-3** Puerto `Reloj` en dominio + adaptador real — *1 pt* — Mantenibilidad — El dominio no llama `new Date()`; las pruebas no esperan tiempo real.
- [ ] **E1-4** Caso de uso `EscalarTicketsVencidos` — *5 pts* — F08 — BAJA→MEDIA→ALTA→CRITICA. Un CRITICA no se escala dos veces. Segunda corrida no cambia nada. Dep: E1-1, E1-3.
- [ ] **E1-5** `TicketDAO.vencidosSinEscalar` + Prisma y doble en memoria — *2 pts* — F08 — Solo estados abiertos; no trae CERRADO ni RESUELTO. Dep: E1-4.
- [ ] **E1-6** Planificador cada 15 min en `main.ts` — *2 pts* — F08/Fiabilidad — Arranca con el servidor, registra cuántos escaló, no tumba el proceso si falla. Dep: E1-4.
- [ ] **E1-7** `POST /api/escalamientos/ejecutar` (COORDINADOR) — *1 pt* — F08 — Demostrar el escalamiento en la entrega sin esperar 15 min. Dep: E1-4.
- [ ] **E1-8** Exponer proximidad al vencimiento en las respuestas — *2 pts* — F13 — `minutosParaVencer`; negativo = ya incumplido. Dep: E1-1.
- [ ] **E1-9** Pausar el reloj del SLA en `ESPERA_INFORMACION` — *5 pts* — F07 — El tiempo en espera no cuenta; `venceEn` se corre al volver a EN_PROCESO. Dep: E1-1, E2-4.

## E2 · Historial inmutable y trazabilidad (R08 · hoy se incumple)

- [ ] **E2-1** Entidad `EventoTicket` de solo inserción — *3 pts* — F16/R08 — `EventoTicketDAO` sin `actualizar` ni `eliminar`: editar el historial es imposible por diseño.
- [ ] **E2-2** Registrar evento en creación, asignación, cambio de estado, escalamiento y cierre — *5 pts* — F16 — Prueba que verifica la secuencia completa. Dep: E2-1.
- [ ] **E2-3** `GET /api/tickets/:id/historial` — *2 pts* — F16 — Orden cronológico con autor; el solicitante ve solo sus tickets. Dep: E2-2.
- [ ] **E2-4** Entidad `Comentario` + `POST`/`GET /api/tickets/:id/comentarios` — *5 pts* — F07 — No se edita ni se borra. Dep: E2-1.
- [ ] **E2-5** Quitar `DELETE /api/tickets/:id`, reemplazar por anulación con motivo — *2 pts* — R08 — La ruta existe hoy y contradice la auditoría. Dep: E2-2.
- [ ] **E2-6** Exigir motivo en la reasignación — *3 pts* — F14 — `PATCH` con `agenteId` sin motivo → 400; el motivo queda en el historial. Dep: E2-2.
- [ ] **E2-7** Exigir `solucion` registrada para RESUELTO/CERRADO — *3 pts* — F15 — Cerrar sin solución → 409. Dep: E2-2.
- [ ] **E2-8** Plazo de reapertura configurable — *3 pts* — F15 — Pasado el plazo, RESUELTO→EN_PROCESO responde 409. Dep: E2-7, E1-3.
- [ ] **E2-9** FK reales de `solicitanteId` y `agenteId` a `Usuario` — *3 pts* — Integridad — Hoy son `String` suelto: se puede asignar un agente inexistente.

## E3 · Notificaciones (F09 · R02 · S1)

- [ ] **E3-1** Puerto `Notificador` en dominio — *1 pt* — F09/R02 — `enviar(destino, asunto, cuerpo)`. El dominio no conoce SMTP.
- [ ] **E3-2** Adaptador `NotificadorBitacora` para desarrollo — *1 pt* — F09/S1 — Sin datos personales en la bitácora. Dep: E3-1.
- [ ] **E3-3** Adaptador `NotificadorSmtp` institucional — *3 pts* — R02 — Config por entorno; si falla no tumba el flujo del ticket. Dep: E3-1.
- [ ] **E3-4** Acuse de recibo con identificador y compromiso de atención — *2 pts* — F02 — El solicitante recibe el id y la hora comprometida. Dep: E3-1, E1-1.
- [ ] **E3-5** Notificar asignación, escalamiento, solicitud de info y cierre — *3 pts* — F09 — Cuatro disparadores probados con doble. Dep: E3-1, E1-4.

## E4 · Asignación automática (F05 · F22)

- [ ] **E4-1** Puerto `PoliticaAsignacion` — *2 pts* — F22 — `elegirAgente(ticket, candidatos)`. Cambiarla no toca `GestionarTickets`.
- [ ] **E4-2** Política «menor carga» — *3 pts* — F05 — Elige el agente con menos tickets abiertos; empate estable. Dep: E4-1.
- [ ] **E4-3** Asignar automáticamente al crear el ticket — *3 pts* — F05 — Nace ASIGNADO si hay agente competente, NUEVO si no. Reasignación manual sigue posible. Dep: E4-2.
- [ ] **E4-4** Relación categoría ↔ agentes competentes — *5 pts* — F03/F05 — Solo esos agentes son candidatos. Dep: E4-2.
- [ ] **E4-5** `TicketDAO.contarAbiertosPorAgente` — *2 pts* — F05/F12 — Una consulta, no N.

## E5 · Identidad institucional (R01 · S2 · S4)

- [ ] **E5-1** Puerto `DirectorioIdentidades` de solo consulta — *2 pts* — R01/F21/S4 — Ninguna operación de escritura: el directorio no se puede corromper.
- [ ] **E5-2** Adaptador LDAP de solo lectura — *8 pts* — R01 — Autentica y lee el rol; configurable por entorno. Dep: E5-1.
- [ ] **E5-3** `IniciarSesion` con directorio y respaldo local — *3 pts* — F19/S2 — Si el directorio no responde, cae al usuario local y lo registra. Dep: E5-2.
- [ ] **E5-4** Sincronización de usuarios y roles desde el directorio — *5 pts* — F21 — Sin padrón paralelo editable. Dep: E5-2.
- [ ] **E5-5** Cerrar el hueco de autorización en `PATCH /api/tickets/:id` — *2 pts* — F20 — Hoy un SOLICITANTE pone su propio ticket en RESUELTO. Solo debe editar asunto, descripción y categoría.
- [ ] **E5-6** Auditoría de cambios al catálogo y a las políticas — *3 pts* — F23 — Autor y fecha en cada escritura de categoría. Dep: E2-1.

## E6 · Visibilidad: tablero e informes

- [ ] **E6-1** `GET /api/tablero` por agente, estado y proximidad al vencimiento — *5 pts* — F12 — < 2 s con el volumen esperado, consulta agregada. Dep: E4-5, E1-8.
- [ ] **E6-2** Filtro por rango de fechas en la búsqueda — *2 pts* — F11 — `?desde=&hasta=` sobre `creadoEn`; inválidas → 400.
- [ ] **E6-3** `GET /api/informes/sla` por período, categoría y agente — *5 pts* — F17 — Porcentaje de cumplimiento + incumplidos, exportable. Dep: E1-1.
- [ ] **E6-4** `GET /api/informes/volumen` — *3 pts* — F18 — Recibidos, resueltos y pendientes por período, para los picos estacionales.
- [ ] **E6-5** Índices para tablero e informes — *2 pts* — Eficiencia — `(estado, venceEn)` y `(agenteId, estado)`, medido con `EXPLAIN`. Dep: E6-1.

## E7 · Cliente

- [ ] **E7-1** DECISIÓN de alcance: app móvil frente a R05 — *1 pt* — R05/F24 — R05 prohíbe app móvil nativa, pero ya hay una app Expo en `../../moviles/from-zero-app` con login, tickets y catálogo. O se actualiza la visión, o la app se declara prototipo y F24 se cubre con cliente web. **Sin esto, la entrega contradice su propio documento.**
- [ ] **E7-2** Pantalla de historial y comentarios — *3 pts* — F07/F16 — Consume `/historial` y `/comentarios`. Dep: E2-3, E2-4.
- [ ] **E7-3** Señalización visual de proximidad al vencimiento — *2 pts* — F13 — Insignia de color por cercanía. Dep: E1-8.
- [ ] **E7-4** Tablero del coordinador en el cliente — *5 pts* — F12 — Consume `/api/tablero`. Dep: E6-1.
- [ ] **E7-5** Medir el registro de atención de un caso — *2 pts* — Usabilidad — Cronometrado: < 1 min, o se rediseña el formulario.

## E8 · Proceso y calidad (restricciones de entrega)

- [ ] **E8-1** Integración continua en `.github/workflows` — *2 pts* — R10 — No existe hoy. Corre `arquitectura`, `tsc --noEmit` y `test` en cada push y PR.
- [ ] **E8-2** Incluir `prisma/` en el tsconfig que verifica CI — *1 pt* — R10 — `seed.ts` y `prisma.config.ts` no se typechequean: `include` solo trae `src` y `tests`. Dep: E8-1.
- [ ] **E8-3** Proteger `main` y `develop` con CI obligatoria — *1 pt* — R10 — No se mezcla con la construcción en rojo. Dep: E8-1.
- [ ] **E8-4** Quitar los datos personales del manejador de errores — *2 pts* — Seguridad — `servidor.ts:17` hace `console.error(error)` y puede volcar el cuerpo de la petición. Registrar tipo, ruta e identificador de correlación.
- [ ] **E8-5** Política de retención y aviso de tratamiento de datos — *3 pts* — R06 — Qué se guarda y por cuánto, aprobado por Protección de Datos.
- [ ] **E8-6** Comparación de esfuerzo estimado contra real del corte — *2 pts* — R11 — Tabla por tarea con estimado PERT y horas reales. Obligatoria en la entrega.
- [ ] **E8-7** Reorganizar `tests/` para que espeje `src/` — *1 pt* — Convención de AGENTS.md — Hoy es `tests/unidad` y `tests/http`.

---

<!-- ## Cómo priorizarlo

**Ruta crítica (24 pts)** — entrega el escalamiento automático demostrable, el único punto donde ninguna alternativa del mercado compite (sección 2.3):
`E1-1 → E1-3 → E1-4 → E1-5 → E1-6`, con `E3-1`/`E3-2` y `E2-1`/`E2-2` en paralelo.

**Arreglos de una sesión que ya rompen el documento:** E8-1 (CI, R10) · E2-5 (`DELETE` de tickets, R08) · E5-5 (solicitante cerrando su ticket, F20) · E8-4 (datos personales en bitácora) · E7-1 (decisión R05).

**Total: 148 pts en 8 épicas**, contra 89 PFSA de alcance completo y dos desarrolladores al 70 % (R13). No cabe todo en un corte: el recorte es la ruta crítica más los arreglos rápidos. -->
