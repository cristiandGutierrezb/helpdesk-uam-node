---
title: "Documento de Visión · HelpDesk UAM"
subtitle: "Sistema de gestión de tickets de soporte · Universidad Autónoma de Manizales"
author: "Ingeniería de Software II (103093) · Semestre 2026-03"
date: "Versión 1.0 · 2 de septiembre de 2026"
lang: es
---

# 1. Introducción

## 1.1 Propósito

Este documento establece **por qué existe HelpDesk UAM y para quién**, antes de
cualquier requisito detallado. Es el contrato de intención entre el área de
soporte de la Universidad y el equipo de desarrollo del curso de Ingeniería de
Software II.

Va dirigido a: la coordinación de soporte y la jefatura de tecnología como
patrocinadores; el equipo de desarrollo como ejecutor; y el docente del curso
como evaluador. **No** es una especificación técnica: no define esquemas de
base de datos, endpoints ni tecnologías, salvo donde estas sean una
restricción impuesta (sección 6).

## 1.2 Alcance

El sistema cubre el ciclo de vida completo de una solicitud de soporte
interno: registro, clasificación, asignación, seguimiento, escalamiento
automático por vencimiento de SLA, cierre y medición.

Queda **explícitamente fuera** de esta versión:

- Gestión de activos e inventario de equipos (CMDB).
- Gestión de cambios y de problemas en el sentido de ITIL; solo se gestionan incidentes y peticiones de servicio.
- Soporte a usuarios externos a la Universidad (aspirantes, proveedores, egresados).
- Facturación, contratos o costeo de la atención.
- Migración de datos históricos de la mesa de ayuda por correo.
- Aplicación móvil nativa; el acceso es web adaptable.

## 1.3 Definiciones, acrónimos y abreviaturas

| Término | Significado |
|---|---|
| **Ticket** | Unidad de trabajo que representa una solicitud de soporte, con estado, prioridad y responsable. |
| **SLA** | *Service Level Agreement*. Tiempo máximo comprometido de respuesta y de solución, según categoría y prioridad. |
| **Escalamiento** | Elevación automática de prioridad y notificación a un responsable superior cuando un ticket vence su SLA. |
| **Solicitante** | Miembro de la comunidad universitaria que reporta una necesidad de soporte. |
| **Agente** | Persona del equipo de soporte que atiende tickets. |
| **Coordinador** | Responsable de la operación de la mesa de ayuda y del cumplimiento de los SLA. |
| **Categoría** | Clasificación funcional del ticket (red, aulas, credenciales, plataforma académica…) que determina el SLA aplicable. |
| **LDAP** | Directorio institucional de identidades; fuente única de usuarios y roles. |
| **PF** | Punto de función; unidad de tamaño funcional (IFPUG / ISO 20926). |
| **UAM** | Universidad Autónoma de Manizales. |

## 1.4 Referencias

- Plantilla y guía del documento de visión del curso (`docs/documento-vision.md`).
- RUP · *Vision Document*.
- ISO/IEC/IEEE 29148:2018 — Ingeniería de requisitos.
- ISO/IEC 25010:2011 — Modelo de calidad del producto.
- Conteo de puntos de función de HelpDesk UAM: **89 PFSA** (clase 3, corte 1).
- WBS y estimación PERT del módulo de escalamiento automático (clase 2, corte 1).
- Backlog inicial y criterios de aceptación en Gherkin (clases 5–8, corte 1).

## 1.5 Visión general del documento

La sección 2 justifica la inversión y fija la sentencia de posición. La 3
describe a quién sirve el producto y en qué entorno trabaja hoy. La 4 sitúa el
sistema en su ecosistema y declara suposiciones y dependencias. La 5 enumera
las características de alto nivel. La 6 recoge las restricciones bajo las que
el equipo debe diseñar.

---

# 2. Posicionamiento

## 2.1 Oportunidad de negocio

Hoy el soporte de la Universidad se opera sobre un buzón de correo compartido
y una hoja de cálculo. Ese esquema funcionó mientras el volumen era bajo, pero
ya no permite responder tres preguntas básicas: **cuántas solicitudes hay
abiertas, quién responde por cada una y cuáles están a punto de incumplirse**.
Cada respuesta a esas preguntas cuesta hoy una revisión manual del buzón.

La oportunidad es doble. Primero, el compromiso de atención deja de ser una
promesa verbal y pasa a ser un dato medible y auditable, lo que da a la
coordinación argumentos frente a decanaturas y frente a la jefatura de
tecnología. Segundo, la carga de trabajo se hace visible: se puede repartir
por criterio y no por quien alcance a leer primero el correo.

**Por qué ahora**: el crecimiento de servicios digitales del semestre 2026-03
(aulas híbridas, nueva plataforma académica) aumentó el volumen de solicitudes
por encima de lo que el buzón compartido puede sostener, y las quejas por
solicitudes «perdidas» ya escalaron a decanatura.

## 2.2 Definición del problema

| Campo | Contenido |
|---|---|
| **El problema de…** | tickets que vencen sin que nadie los escale, y solicitudes que se pierden en un buzón compartido sin responsable asignado |
| **afecta a…** | solicitantes de la comunidad universitaria, agentes de soporte y coordinadores de la mesa de ayuda |
| **cuyo impacto es…** | ~30 % de incumplimiento de SLA, quejas formales a decanatura, reprocesos por solicitudes duplicadas y ausencia total de datos para justificar personal o presupuesto |
| **una solución exitosa sería…** | escalamiento automático de lo vencido, un responsable explícito por ticket y visibilidad en tiempo real de la carga y del cumplimiento |

## 2.3 Sentencia de posición del producto

> **Para** los coordinadores y agentes de soporte de la UAM
> **que** necesitan cumplir los SLA sin revisión manual diaria del buzón,
> **HelpDesk UAM** es un **sistema de gestión de tickets de soporte interno**
> **que** registra, asigna y escala automáticamente las solicitudes según
> carga, categoría y prioridad, y mide el cumplimiento de cada compromiso.
> **A diferencia de** la mesa de ayuda por correo y hoja de cálculo que se usa hoy,
> **nuestro producto** hace cada compromiso de atención **medible, trazable y auditable**,
> y convierte el escalamiento en una regla del sistema y no en un acto de memoria de una persona.

---

# 3. Interesados y usuarios

## 3.1 Resumen de *stakeholders*

| Interesado | Qué le importa | Qué decide | Representante ante el equipo |
|---|---|---|---|
| Jefatura de Tecnología | Costo total, integración con LDAP y con la infraestructura existente, continuidad del servicio | Aprueba presupuesto, despliegue y acceso a sistemas institucionales | Jefe de Tecnología |
| Coordinación de Soporte | Cumplimiento de SLA, reparto justo de la carga, evidencia para pedir personal | Prioridades del backlog, política de escalamiento, catálogo de categorías y SLA | Coordinador de la mesa de ayuda (*Product Owner*) |
| Agentes de soporte | Que la herramienta no les añada trabajo administrativo; claridad sobre qué atender primero | Retroalimentación sobre usabilidad y flujo de atención | Agente senior designado |
| Comunidad universitaria (solicitantes) | Saber que su solicitud fue recibida, quién la atiende y cuándo se resuelve | Aceptación del cierre del ticket | Representante estudiantil y de docentes |
| Oficina de Protección de Datos | Tratamiento de datos personales conforme a la Ley 1581 de 2012 | Autoriza qué datos se almacenan y por cuánto tiempo | Oficial de protección de datos |
| Docente del curso | Aplicación correcta de estimación, Scrum, GitFlow, SOLID, Clean Code y patrones | Evaluación de las entregas de cada corte | Docente de Ingeniería de Software II |

## 3.2 Perfiles de usuario

**Solicitante** — Estudiante, docente o administrativo. Reporta una necesidad
de soporte y hace seguimiento. Entregables: descripción del problema,
evidencias, confirmación de solución. Nivel técnico: bajo a medio; puede no
saber a qué categoría pertenece su problema, y el sistema no debe obligarlo a
saberlo.

**Agente de soporte** — Miembro del equipo técnico. Atiende los tickets
asignados, comenta, solicita información, resuelve y cierra. Entregables:
diagnóstico, solución aplicada, registro de tiempo de atención. Nivel técnico:
alto en su dominio, medio en herramientas de gestión.

**Coordinador de soporte** — Responsable de la operación. Define el catálogo de
categorías y sus SLA, ajusta la política de asignación, reasigna, vigila el
tablero de carga y responde por los indicadores. Entregables: informe mensual
de cumplimiento. Nivel técnico: medio.

**Administrador del sistema** — Configura la integración con LDAP, parámetros
de correo, roles y respaldos. Es un rol de baja frecuencia y alta criticidad.
Nivel técnico: alto.

## 3.3 Entorno del usuario

Los agentes trabajan desde la sede principal y desde sedes remotas, con
frecuencia **en movimiento**: atienden un aula y registran el ticket después,
desde un portátil o un teléfono. La conectividad no siempre es estable dentro
de los edificios de laboratorio.

Hoy la operación ocurre en tres herramientas desconectadas: un buzón de correo
compartido, una hoja de cálculo con el estado de las solicitudes «importantes»
y un grupo de mensajería donde realmente se coordina el trabajo. **La
información autorizada vive en la memoria de las personas**, no en un sistema:
cuando un agente se ausenta, sus tickets quedan sin dueño.

Restricciones del entorno que condicionan el diseño:

- Jornadas partidas y turnos; un ticket puede cambiar de responsable a mitad de atención.
- Los solicitantes escriben en lenguaje natural, sin clasificar ni priorizar.
- Los picos de demanda son estacionales y predecibles: inicio de semestre, matrículas, semanas de parciales.
- Los agentes rechazan cualquier herramienta que exija más de un minuto para registrar la atención de un caso.

## 3.4 Necesidades clave

| Necesidad | Prioridad | Solución actual | Solución propuesta |
|---|---|---|---|
| Que ninguna solicitud se pierda | Alta | Buzón compartido; se pierde lo que nadie lee | Registro obligatorio con identificador único y acuse automático |
| Saber quién responde por cada caso | Alta | Acuerdo verbal en el grupo de mensajería | Un responsable explícito por ticket, con historial de reasignaciones |
| Detectar lo que va a incumplir el SLA | Alta | Revisión manual diaria, cuando se hace | Regla de vencimiento evaluada de forma automática y periódica |
| Escalar sin depender de la memoria de alguien | Alta | Escalamiento por insistencia del solicitante | Escalamiento automático de prioridad + notificación al coordinador |
| Repartir la carga con criterio | Media | Quien lea primero el correo | Asignación automática por categoría, carga y disponibilidad |
| Ver el estado de la operación en un momento | Media | Hoja de cálculo desactualizada | Tablero de carga por agente y por estado |
| Justificar personal y presupuesto con datos | Media | No existe evidencia | Informe de cumplimiento de SLA por período y categoría |
| Que el solicitante sepa en qué va su caso | Media | Preguntar por correo o en persona | Consulta del estado y notificaciones en cada cambio |
| No duplicar la gestión de usuarios | Media | Alta manual en la hoja de cálculo | Identidades leídas del directorio institucional |
| Trazabilidad de lo que se hizo y quién lo hizo | Baja | Hilos de correo dispersos | Historial inmutable de eventos por ticket |

## 3.5 Alternativas y competencia

- **No hacer nada** (la competencia real). Costo cero de implantación y máxima resistencia cero. Se paga en incumplimiento sostenido, quejas y desgaste del equipo; y el costo crece con el volumen.
- **Suites comerciales SaaS** (Jira Service Management, Freshdesk, Zendesk). Muy superiores en funcionalidad, pero de costo por agente recurrente, con datos fuera del país y con un modelo de proceso que exigiría adaptar la operación de la UAM a la herramienta.
- **Herramientas libres autoalojadas** (osTicket, GLPI, Zammad). Sin costo de licencia, pero exigen personal dedicado a operarlas y personalizarlas; su modelo de SLA y de escalamiento no coincide con el catálogo de servicios de la Universidad.
- **Formularios + hoja de cálculo mejorada.** Barato e inmediato, pero no resuelve el problema central: sigue sin haber una regla del sistema que escale lo vencido.

**Posición del equipo**: HelpDesk UAM se justifica porque el diferenciador
buscado —escalamiento automático gobernado por el catálogo de SLA propio de la
Universidad, con identidades del directorio institucional y datos en
infraestructura propia— es exactamente lo que las alternativas resuelven mal o
cobran caro. Además, como proyecto del curso, su objetivo formativo es
construir ese diferenciador con un ciclo de realimentación corto.

---

# 4. Vista general del producto

## 4.1 Perspectiva del producto

HelpDesk UAM es un sistema **nuevo y autónomo**, no un reemplazo de un módulo
existente. Se sitúa entre la comunidad universitaria y el equipo de soporte, y
se apoya en tres sistemas externos de los que **consume** servicios sin
gobernarlos.

```
                        ┌────────────────────────────┐
   Solicitantes ───────▶│                            │
   (web adaptable)      │                            │◀─── Directorio LDAP
                        │      HelpDesk UAM          │     (identidades y roles · solo lectura)
   Agentes ────────────▶│                            │
   (web adaptable)      │  · Tickets                 │───▶ Servicio SMTP institucional
                        │  · Catálogo de SLA         │     (notificaciones y acuses)
   Coordinador ────────▶│  · Reglas de asignación    │
   (tablero e informes) │  · Escalamiento automático │◀──▶ Base de datos institucional
                        └────────────────────────────┘
                                     ▲
                                     │
                          Planificador interno
                          (evalúa vencimientos cada 15 min)
```

Frontera clara: HelpDesk UAM **no** es la fuente de verdad de las identidades
(lo es LDAP) ni el transporte de los mensajes (lo es SMTP). Es la fuente de
verdad de **los tickets, sus estados y sus compromisos de atención**.

## 4.2 Resumen de capacidades

| Capacidad | Beneficio para el usuario |
|---|---|
| Registro guiado de solicitudes | El solicitante reporta en lenguaje natural y el sistema clasifica; nadie necesita conocer el catálogo interno |
| Asignación automática por carga y categoría | El trabajo se reparte con criterio y el agente sabe qué le corresponde sin negociarlo |
| Catálogo de categorías y SLA configurable | La coordinación cambia las reglas de compromiso sin pedir un desarrollo |
| Escalamiento automático por vencimiento | Lo urgente sube de prioridad y se avisa solo; deja de depender de que alguien recuerde revisarlo |
| Notificaciones en cada cambio relevante | El solicitante deja de preguntar «¿en qué va?» y el agente deja de responderlo |
| Tablero de carga y estado en tiempo real | El coordinador ve la operación completa en una pantalla, no en una hoja desactualizada |
| Historial inmutable por ticket | Cualquiera puede reconstruir qué pasó, cuándo y por decisión de quién |
| Informes de cumplimiento de SLA | La coordinación sustenta con datos sus decisiones de personal y presupuesto |
| Búsqueda y filtrado de tickets | Encontrar casos similares ya resueltos reduce el tiempo de diagnóstico |
| Autenticación con la cuenta institucional | Nadie gestiona una contraseña más, y los roles llegan del directorio |

## 4.3 Suposiciones y dependencias

Cada suposición es un riesgo con nombre. Si una se rompe, la estimación y el
alcance se recalculan **sin culpa**.

| # | Suposición o dependencia | Impacto si falla | Mitigación |
|---|---|---|---|
| S1 | El servicio SMTP institucional está disponible desde la semana 1 | Sin notificaciones ni acuses; se cae la mitad del valor percibido | Adaptador de notificación con implementación de registro en bitácora para desarrollo |
| S2 | El directorio LDAP es accesible desde el entorno del sistema sin VPN | +1 semana de trabajo (probabilidad estimada ~40 %) | Puerto de identidades con adaptador local de respaldo |
| S3 | La coordinación entrega el catálogo de categorías y SLA antes del sprint 2 | Bloquea la regla de vencimiento, que es el núcleo del producto | Catálogo provisional acordado en la reunión de análisis |
| S4 | Los datos de identidad se leen, nunca se escriben, en LDAP | Riesgo de corromper el directorio institucional | El puerto de identidades expone solo operaciones de consulta |
| S5 | Los criterios de aceptación acordados no cambian dentro del sprint | Reproceso y desviación de la estimación | Cambios entran al backlog, no al sprint en curso |
| S6 | Dos desarrolladores al 70 % de dedicación durante el semestre | Toda la planeación de capacidad se desplaza | Velocidad medida por sprint y replanificación en cada revisión |
| S7 | El volumen se mantiene en el orden de cientos de tickets por mes | Decisiones de persistencia y consulta quedan cortas | Diseño con puerto de repositorio: cambiar el motor no toca el dominio |

## 4.4 Licenciamiento, instalación y despliegue

- **Licenciamiento**: desarrollo académico propiedad de la Universidad; código bajo licencia MIT para fines formativos, sin licencias de terceros de pago.
- **Instalación**: despliegue centralizado; el usuario final no instala nada, accede por navegador.
- **Despliegue**: entorno de preproducción para verificación y entorno de producción en infraestructura institucional. Cada entrega de corte se verifica primero en preproducción.
- **Respaldos**: responsabilidad de la infraestructura institucional; el sistema no implementa su propio esquema de respaldo.
- **Operación**: sin ventana de mantenimiento programada dentro del horario académico (7:00–21:00, lunes a sábado).

---

# 5. Características del producto

Características de alto nivel, verificables a nivel de negocio. **No** son
requisitos: cada una se desarrollará como una o varias historias de usuario con
sus criterios de aceptación.

| # | Característica | Descripción |
|---|---|---|
| **F01** | Registro de solicitudes | Cualquier miembro de la comunidad puede registrar una solicitud describiendo el problema en lenguaje natural y adjuntando evidencias. |
| **F02** | Acuse de recibo automático | Toda solicitud registrada genera un identificador único y un acuse al solicitante con el compromiso de atención aplicable. |
| **F03** | Clasificación por categoría | Cada ticket se asocia a una categoría del catálogo, que determina el SLA y el grupo de agentes competentes. |
| **F04** | Catálogo de categorías y SLA configurable | El coordinador administra categorías, prioridades y tiempos de compromiso sin intervención del equipo de desarrollo. |
| **F05** | Asignación automática de agente | El sistema propone y asigna un agente según categoría, carga actual y disponibilidad, con reasignación manual siempre posible. |
| **F06** | Ciclo de vida con transiciones válidas | Un ticket solo cambia de estado por transiciones permitidas; no es posible cerrar un ticket ya cerrado ni saltarse pasos. |
| **F07** | Comentarios y solicitud de información | Agentes y solicitantes conversan dentro del ticket; el reloj del SLA se pausa mientras se espera información del solicitante. |
| **F08** | Escalamiento automático por vencimiento | Los tickets que superan su SLA suben de prioridad automáticamente y notifican al coordinador; un ticket ya crítico no se escala dos veces. |
| **F09** | Notificaciones de cambios relevantes | Creación, asignación, escalamiento, solicitud de información y cierre generan notificación a los implicados. |
| **F10** | Consulta del estado por el solicitante | El solicitante consulta en cualquier momento el estado, el responsable y el compromiso de atención de sus tickets. |
| **F11** | Búsqueda y filtrado | Búsqueda de tickets por texto, estado, categoría, prioridad, agente y rango de fechas. |
| **F12** | Tablero de carga por agente | Vista en tiempo real de tickets abiertos por agente, por estado y por proximidad al vencimiento. |
| **F13** | Alerta de proximidad al vencimiento | Señalización visible de los tickets que están cerca de incumplir el SLA, antes de que ocurra. |
| **F14** | Reasignación con motivo registrado | El coordinador reasigna tickets dejando constancia del motivo, para no perder trazabilidad. |
| **F15** | Cierre con verificación del solicitante | El cierre requiere una solución registrada; el solicitante puede reabrir dentro de un plazo definido. |
| **F16** | Historial inmutable de eventos | Cada ticket conserva la secuencia completa de eventos, con autor y momento, sin posibilidad de edición retroactiva. |
| **F17** | Informe de cumplimiento de SLA | Informe por período, categoría y agente, con porcentaje de cumplimiento y casos incumplidos. |
| **F18** | Informe de volumen y tendencia | Solicitudes recibidas, resueltas y pendientes por período, para anticipar los picos estacionales. |
| **F19** | Autenticación con cuenta institucional | Ingreso con las credenciales de la Universidad; sin gestión de contraseñas propia. |
| **F20** | Autorización por rol | Solicitante, agente, coordinador y administrador ven y pueden hacer cosas distintas, según el rol que aporta el directorio. |
| **F21** | Sincronización de usuarios desde el directorio | Los usuarios y sus roles se leen del directorio institucional; el sistema no mantiene un padrón paralelo. |
| **F22** | Políticas de asignación intercambiables | La regla de asignación puede cambiar por sede o por período sin modificar el código existente. |
| **F23** | Registro de auditoría de configuración | Los cambios al catálogo de SLA y a las políticas quedan registrados con autor y fecha. |
| **F24** | Interfaz web adaptable | Uso desde computador y desde teléfono, para registrar la atención sin volver al escritorio. |

---

# 6. Restricciones

Única sección donde aparece tecnología concreta, y solo cuando es una
**imposición** y no una elección del equipo.

## 6.1 Tecnológicas y de integración obligatoria

| # | Restricción | Origen |
|---|---|---|
| R01 | La autenticación y los roles deben resolverse contra el **directorio LDAP institucional**, en modo solo lectura. | Jefatura de Tecnología |
| R02 | Las notificaciones deben enviarse por el **servicio SMTP institucional**; no se permiten servicios de correo de terceros. | Jefatura de Tecnología / Protección de datos |
| R03 | El sistema se implementa en **Node.js con TypeScript**, con tipado estricto. | Plan de curso (103093) |
| R04 | La arquitectura debe separar **dominio / aplicación / infraestructura**, sin que el dominio importe infraestructura ni bibliotecas externas. | Plan de curso · entrega del corte 2 |
| R05 | El acceso es por **navegador web**; no se desarrolla aplicación móvil nativa. | Alcance acordado |

## 6.2 Legales y de datos

| # | Restricción | Origen |
|---|---|---|
| R06 | El tratamiento de datos personales debe cumplir la **Ley 1581 de 2012** y la política de tratamiento de datos de la Universidad. | Oficina de Protección de Datos |
| R07 | Los datos residen en **infraestructura institucional**; no se permite almacenamiento en servicios en la nube fuera del país. | Oficina de Protección de Datos |
| R08 | El historial de tickets es **inmutable**: no se permite edición ni borrado retroactivo de eventos. | Requisito de auditoría |

## 6.3 De proceso y plazo

| # | Restricción | Origen |
|---|---|---|
| R09 | Desarrollo bajo **Scrum**, con sprints de duración fija y una entrega demostrable por corte académico. | Plan de curso |
| R10 | Control de versiones con **GitFlow** e integración continua obligatoria; ninguna entrega se acepta con la construcción en rojo. | Plan de curso · corte 2 |
| R11 | Cada entrega de corte debe comparar el **esfuerzo estimado contra el esfuerzo real medido**. | Plan de curso · corte 1 |
| R12 | Tres entregas obligatorias en el semestre 2026-03, alineadas con los cortes académicos. | Calendario académico |

## 6.4 De recursos y presupuesto

| # | Restricción | Origen |
|---|---|---|
| R13 | Equipo de **dos desarrolladores al 70 % de dedicación**; no es posible ampliarlo. | Disponibilidad del curso |
| R14 | **Sin presupuesto para licencias** de software ni servicios de pago; solo herramientas libres o ya licenciadas por la Universidad. | Jefatura de Tecnología |
| R15 | Tamaño funcional estimado del alcance completo: **89 puntos de función sin ajustar**. El alcance de cada corte debe caber en la capacidad medida del equipo. | Estimación del corte 1 |

## 6.5 Atributos de calidad exigidos (ISO/IEC 25010)

| Atributo | Compromiso |
|---|---|
| **Fiabilidad** | La evaluación de vencimientos se ejecuta periódicamente y es idempotente: una ejecución repetida no escala dos veces el mismo ticket. |
| **Eficiencia de desempeño** | Las consultas de tablero y de listado responden en menos de 2 segundos con el volumen esperado. |
| **Mantenibilidad** | El dominio se prueba sin base de datos ni red; la suite unitaria completa corre en menos de un segundo. |
| **Seguridad** | Autorización por rol en cada operación; ningún dato personal en registros de bitácora. |
| **Usabilidad** | Registrar la atención de un caso no debe tomar más de un minuto al agente. |
| **Portabilidad** | Cambiar el motor de persistencia o el proveedor de correo no debe modificar una sola línea del dominio. |

---

*Documento de visión · HelpDesk UAM · versión 1.0. Se revisa al cierre de cada
corte académico. Cualquier cambio en las suposiciones de la sección 4.3 obliga
a reevaluar el alcance de la sección 5.*
