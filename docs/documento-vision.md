# Documento de Visión · guía y plantilla

> Un documento de visión responde **por qué existe el producto y para quién**,
> antes de cualquier requisito detallado. Es el contrato de intención entre el
> negocio y el equipo de desarrollo, **no** una especificación técnica.

**Referencias**: RUP *Vision Document* · ISO/IEC/IEEE 29148 (ingeniería de
requisitos) · ISO/IEC 25010 (atributos de calidad).

---

## Secciones obligatorias

### 1. Introducción

- **Propósito** del documento y a quién va dirigido.
- **Alcance**: qué sistema cubre y qué queda *explícitamente* fuera.
- **Definiciones, acrónimos y abreviaturas**, o referencia al glosario del dominio.
- **Referencias** a otros documentos: SRS, plan de proyecto, casos de uso, actas.
- **Visión general** del documento: qué contiene cada sección.

### 2. Posicionamiento

- **Oportunidad de negocio**: por qué vale la pena invertir, y por qué ahora.
- **Definición del problema**, en tabla:

  | Campo | Contenido |
  |---|---|
  | El problema de… | *tickets que vencen sin que nadie los escale* |
  | afecta a… | *coordinadores y solicitantes de soporte* |
  | cuyo impacto es… | *30 % de incumplimiento de SLA, quejas a decanatura* |
  | una solución exitosa sería… | *escalamiento automático y visibilidad de la carga* |

- **Sentencia de posición del producto** (plantilla de Geoffrey Moore). Es la
  frase que resume todo el documento; si no se puede escribir, la visión aún no
  está clara:

  > **Para** los coordinadores de soporte de la UAM
  > **que** necesitan cumplir los SLA sin revisión manual diaria,
  > **HelpDesk UAM** es un **sistema de gestión de tickets**
  > **que** escala y asigna automáticamente según carga y prioridad.
  > **A diferencia de** la mesa de ayuda por correo,
  > **nuestro producto** hace medible y auditable cada compromiso de atención.

### 3. Interesados y usuarios

- **Resumen de *stakeholders***: quién es, qué le importa, qué decide, quién lo
  representa ante el equipo.
- **Perfiles de usuario**: rol, responsabilidades, entregables, nivel técnico.
- **Entorno del usuario**: dónde y cómo trabajan hoy, con qué herramientas, bajo
  qué restricciones. Es la sección que más errores de diseño evita.
- **Necesidades clave**, en tabla: necesidad → prioridad → solución actual →
  solución propuesta.
- **Alternativas y competencia**, incluida la alternativa «no hacer nada», que
  casi siempre es la competencia real.

### 4. Vista general del producto

- **Perspectiva**: dónde encaja en el ecosistema. Un diagrama de contexto con los
  sistemas externos vale más que tres párrafos.
- **Resumen de capacidades**: capacidad → beneficio para el usuario.
- **Suposiciones y dependencias**. Aquí es donde se cae el proyecto si están mal:
  cada suposición es un riesgo con nombre.
- **Licenciamiento, instalación y despliegue** previstos.

### 5. Características del producto

*Features* de alto nivel, **no** requisitos.

- Numeradas, de una o dos frases cada una, verificables a nivel de negocio.
- Entre **10 y 30**. Si pasan de 50, ya están escribiendo requisitos, no visión.

### 6. Restricciones

De diseño, tecnológicas, presupuestales, legales, de plazo y de integración
obligatoria. Es el único lugar del documento donde puede aparecer tecnología
concreta, y solo cuando es una imposición, no una elección.
