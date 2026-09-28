import { ESTADOS, PRIORIDADES } from '../../dominio/modelo/Ticket'
import { ROLES } from '../../dominio/modelo/Usuario'

const usuario = {
  type: 'object',
  description:
    'Usuario del sistema tal como viaja por HTTP (`UsuarioDTO`): la entidad del dominio sin el hash ' +
    'de la clave, que nunca sale del servidor.',
  properties: {
    id: { type: 'string', format: 'uuid', example: 'cd9c06cf-b57f-4e22-bc47-589a074e8c2c' },
    nombre: { type: 'string', example: 'Ana Agente' },
    correo: { type: 'string', format: 'email', example: 'ana@uam.edu.co' },
    rol: { type: 'string', enum: ROLES, example: 'AGENTE' },
    activo: { type: 'boolean', example: true },
  },
  required: ['id', 'nombre', 'correo', 'rol', 'activo'],
}

const sesion = {
  type: 'object',
  description: 'Resultado de un inicio de sesión: el token y el usuario dueño de la sesión.',
  properties: {
    token: { type: 'string', description: 'JWT para el encabezado `Authorization: Bearer <token>`.' },
    usuario: { $ref: '#/components/schemas/UsuarioDTO' },
  },
  required: ['token', 'usuario'],
}

const categoria = {
  type: 'object',
  description:
    'Categoría del catálogo de servicios (F03/F04). Determina el SLA aplicable a los tickets que ' +
    'clasifica: cambiar el compromiso de atención de «Red» es modificar esta fila, no desplegar código.',
  properties: {
    id: { type: 'string', format: 'uuid' },
    nombre: { type: 'string', minLength: 3, example: 'Red' },
    descripcion: { type: 'string', example: 'Conectividad cableada e inalámbrica' },
    horasSla: { type: 'integer', minimum: 1, description: 'Horas comprometidas de solución.', example: 4 },
    activa: {
      type: 'boolean',
      description: 'Una categoría inactiva no admite tickets nuevos, pero conserva los que ya tenía.',
      example: true,
    },
  },
  required: ['id', 'nombre', 'descripcion', 'horasSla', 'activa'],
}

const ticket = {
  type: 'object',
  description: 'Solicitud de soporte: la unidad de trabajo del sistema y su única fuente de verdad.',
  properties: {
    id: { type: 'string', format: 'uuid' },
    asunto: { type: 'string', minLength: 5, example: 'No hay internet en el laboratorio 3' },
    descripcion: { type: 'string', minLength: 10, example: 'Desde las 8:00 ningún equipo del lab 3 conecta.' },
    estado: { type: 'string', enum: ESTADOS, example: 'NUEVO' },
    prioridad: { type: 'string', enum: PRIORIDADES, example: 'ALTA' },
    categoriaId: { type: 'string', format: 'uuid', description: 'Categoría del catálogo que fija el SLA.' },
    solicitanteId: { type: 'string', format: 'uuid', description: 'Quien registró el caso; lo pone la sesión.' },
    agenteId: { type: 'string', format: 'uuid', nullable: true, description: 'Responsable actual, o `null`.' },
    creadoEn: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'asunto', 'descripcion', 'estado', 'prioridad', 'categoriaId', 'solicitanteId', 'agenteId', 'creadoEn'],
}

const error = {
  type: 'object',
  properties: { error: { type: 'string', example: 'Correo o clave incorrectos' } },
  required: ['error'],
}

const respuestaError = (description: string, ejemplo: string) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorDTO' }, example: { error: ejemplo } } },
})

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'HelpDesk UAM · API',
    version: '1.0.0',
    description: [
      'API del sistema de gestión de tickets de soporte de la Universidad Autónoma de Manizales.',
      '',
      'Cubre por ahora la **autenticación y el registro de usuarios** (características F19 y F20 del',
      'documento de visión): quién entra al sistema y con qué rol. Las capacidades de tickets, SLA y',
      'escalamiento se agregarán sobre esta misma base.',
      '',
      '**Cómo probar desde aquí**: registra un usuario en `POST /api/auth/registro`, inicia sesión en',
      '`POST /api/auth/login`, copia el `token` de la respuesta y pégalo en el botón **Authorize** de',
      'arriba. A partir de ahí las rutas protegidas responden.',
      '',
      'Todas las rutas cuelgan del prefijo `/api`.',
    ].join('\n'),
    license: { name: 'MIT' },
  },
  servers: [{ url: '/api', description: 'Servidor actual' }],
  // Por defecto las rutas son públicas; solo las que declaran `security` exigen token.
  security: [],
  tags: [
    { name: 'Salud', description: 'Verificación de que el servicio responde.' },
    { name: 'Autenticación', description: 'Registro de usuarios, inicio de sesión y consulta del perfil propio.' },
    {
      name: 'Categorías',
      description:
        'Catálogo de clasificación y SLA (F03, F04). Lo consulta cualquiera con sesión; lo administra la ' +
        'coordinación.',
    },
    {
      name: 'Tickets',
      description:
        'Ciclo de vida de las solicitudes de soporte (F01, F02, F06, F10, F11): registro, búsqueda, ' +
        'modificación y eliminación.',
    },
  ],
  paths: {
    '/salud': {
      get: {
        tags: ['Salud'],
        summary: 'Verificar que el servicio está vivo',
        description:
          'Responde 200 si el proceso atiende peticiones. No consulta la base de datos: sirve para el ' +
          'monitoreo y para el healthcheck del despliegue, no para diagnosticar la persistencia.',
        responses: {
          200: {
            description: 'El servicio responde.',
            content: { 'application/json': { example: { estado: 'ok' } } },
          },
        },
      },
    },

    '/auth/registro': {
      post: {
        tags: ['Autenticación'],
        summary: 'Registrar un usuario',
        description: [
          'Crea un usuario y devuelve sus datos públicos. **No inicia sesión**: para obtener un token hay',
          'que llamar después a `/auth/login`.',
          '',
          'Reglas que aplica el caso de uso `RegistrarUsuario`:',
          '',
          '- El correo se normaliza a minúsculas y se guarda sin espacios, de modo que `ANA@uam.edu.co` y',
          '  `ana@uam.edu.co` son el mismo usuario.',
          '- El correo es único; un segundo registro con el mismo correo responde 409.',
          '- La clave nunca se almacena en claro: se cifra con bcrypt antes de llegar al repositorio.',
          '- **El rol siempre es `SOLICITANTE`.** Si se manda un `rol` en el cuerpo, se ignora: esta ruta es',
          '  pública y quien se inscribe no elige su propio mando (F20). Las cuentas de AGENTE y',
          '  COORDINADOR se crean con `npm run db:seed`.',
          '',
          '> Nota de alcance: la restricción R01 del documento de visión exige que a futuro las identidades',
          '> y **sus roles** se resuelvan contra el directorio LDAP institucional (F21). Este registro local',
          '> es la implementación vigente mientras ese adaptador no exista.',
        ].join('\n'),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string', minLength: 2, description: 'Nombre completo.', example: 'Ana Agente' },
                  correo: {
                    type: 'string',
                    format: 'email',
                    description: 'Correo institucional. Se normaliza a minúsculas.',
                    example: 'ana@uam.edu.co',
                  },
                  clave: { type: 'string', minLength: 8, format: 'password', example: 'clave-segura' },
                },
                required: ['nombre', 'correo', 'clave'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuario creado.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UsuarioDTO' } } },
          },
          400: respuestaError(
            'Datos inválidos: nombre de menos de 2 caracteres, correo mal formado o clave de menos de 8 caracteres.',
            'clave requerida (mínimo 8 caracteres)',
          ),
          409: respuestaError('Ya existe un usuario con ese correo.', 'El correo ana@uam.edu.co ya está registrado'),
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        description: [
          'Valida las credenciales y devuelve un **JWT firmado (HS256, vigencia 8 horas)** que lleva el id',
          'del usuario en `sub` y su rol en `rol`. Ese token es el que autoriza las rutas protegidas.',
          '',
          'El correo se compara en minúsculas, igual que en el registro.',
          '',
          'Los tres casos de fallo —correo inexistente, usuario inactivo y clave incorrecta— responden el',
          '**mismo 401 con el mismo mensaje**, a propósito: distinguirlos permitiría averiguar qué correos',
          'están registrados en el sistema.',
        ].join('\n'),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  correo: { type: 'string', format: 'email', example: 'ana@uam.edu.co' },
                  clave: { type: 'string', format: 'password', example: 'clave-segura' },
                },
                required: ['correo', 'clave'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Sesión iniciada.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SesionDTO' } } },
          },
          400: respuestaError('Falta `correo` o `clave` en el cuerpo.', 'correo y clave son obligatorios'),
          401: respuestaError(
            'Credenciales inválidas o usuario inactivo.',
            'Correo o clave incorrectos',
          ),
        },
      },
    },

    '/auth/perfil': {
      get: {
        tags: ['Autenticación'],
        summary: 'Consultar el usuario de la sesión actual',
        description: [
          'Devuelve el usuario dueño del token enviado. La aplicación cliente la usa al arrancar para saber',
          'quién está en sesión y **qué rol tiene**, que es lo que decide qué se le muestra (F20).',
          '',
          'Los datos se releen de la base de datos en cada llamada, no se toman del token: si a un usuario le',
          'cambian el rol o lo desactivan, esta respuesta lo refleja sin esperar a que el token expire.',
        ].join('\n'),
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Usuario en sesión.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UsuarioDTO' } } },
          },
          401: respuestaError('Token ausente, mal formado, expirado o con firma inválida.', 'Sesión requerida'),
          404: respuestaError('El token es válido pero el usuario ya no existe.', 'Usuario no encontrado'),
        },
      },
    },

    '/categorias': {
      get: {
        tags: ['Categorías'],
        summary: 'Listar el catálogo',
        description:
          'Devuelve las categorías ordenadas por nombre. Es lo que la aplicación cliente pide para armar ' +
          'el selector de categoría al registrar un caso: con `activas=true` solo llegan las que hoy ' +
          'admiten tickets nuevos.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'activas',
            in: 'query',
            schema: { type: 'string', enum: ['true', 'false'] },
            description: 'Con `true` excluye las categorías desactivadas.',
          },
        ],
        responses: {
          200: {
            description: 'Catálogo.',
            content: {
              'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Categoria' } } },
            },
          },
          401: respuestaError('Falta el token.', 'Sesión requerida'),
        },
      },
      post: {
        tags: ['Categorías'],
        summary: 'Crear una categoría',
        description:
          'Solo COORDINADOR y ADMINISTRADOR (F04: la coordinación cambia las reglas de compromiso sin ' +
          'pedir un desarrollo). El nombre es único, sin distinguir espacios al inicio o al final.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string', minLength: 3, example: 'Red' },
                  descripcion: { type: 'string', default: '', example: 'Conectividad' },
                  horasSla: { type: 'integer', minimum: 1, default: 24, example: 4 },
                  activa: { type: 'boolean', default: true },
                },
                required: ['nombre'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Categoría creada.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Categoria' } } },
          },
          400: respuestaError('Datos inválidos.', 'horasSla debe ser un entero de al menos 1'),
          401: respuestaError('Falta el token.', 'Sesión requerida'),
          403: respuestaError('El rol de la sesión no administra el catálogo.', 'No autorizado para esta operación'),
          409: respuestaError('Ya existe una categoría con ese nombre.', 'Ya existe una categoría llamada Red'),
        },
      },
    },

    '/categorias/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Categorías'],
        summary: 'Consultar una categoría',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Categoría.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Categoria' } } },
          },
          401: respuestaError('Falta el token.', 'Sesión requerida'),
          404: respuestaError('No existe.', 'Categoría no encontrada'),
        },
      },
      patch: {
        tags: ['Categorías'],
        summary: 'Modificar una categoría',
        description:
          'Modificación parcial: solo viajan los campos que se quieren cambiar. Solo COORDINADOR y ' +
          'ADMINISTRADOR.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string', minLength: 3 },
                  descripcion: { type: 'string' },
                  horasSla: { type: 'integer', minimum: 1 },
                  activa: { type: 'boolean' },
                },
              },
              example: { horasSla: 2, activa: true },
            },
          },
        },
        responses: {
          200: {
            description: 'Categoría modificada.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Categoria' } } },
          },
          400: respuestaError('Datos inválidos.', 'nombre inválido (mínimo 3 caracteres)'),
          401: respuestaError('Falta el token.', 'Sesión requerida'),
          403: respuestaError('Rol insuficiente.', 'No autorizado para esta operación'),
          404: respuestaError('No existe.', 'Categoría no encontrada'),
          409: respuestaError('Otra categoría ya usa ese nombre.', 'Ya existe una categoría llamada Red'),
        },
      },
      delete: {
        tags: ['Categorías'],
        summary: 'Eliminar una categoría',
        description:
          'Solo si **ninguna** solicitud la usa: el historial de tickets es inmutable (R08) y un ticket no ' +
          'puede quedarse sin clasificación. Una categoría en uso se **desactiva** (`activa: false`), que ' +
          'la retira de los casos nuevos sin tocar los viejos.',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Eliminada.' },
          401: respuestaError('Falta el token.', 'Sesión requerida'),
          403: respuestaError('Rol insuficiente.', 'No autorizado para esta operación'),
          404: respuestaError('No existe.', 'Categoría no encontrada'),
          409: respuestaError(
            'La categoría tiene tickets.',
            'No se puede eliminar: 12 ticket(s) usan esta categoría. Desactívala en su lugar.',
          ),
        },
      },
    },

    '/tickets': {
      get: {
        tags: ['Tickets'],
        summary: 'Buscar tickets',
        description: [
          'Búsqueda y filtrado (F11). Los parámetros se combinan: todos deben cumplirse. Sin parámetros,',
          'devuelve todo lo visible para el rol de la sesión, del más reciente al más antiguo.',
          '',
          '**El rol limita lo que se ve (F10/F20)**: a un `SOLICITANTE` se le impone el filtro de sus',
          'propios tickets, así cambie la consulta. Agentes, coordinación y administración ven todos.',
        ].join('\n'),
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'estado', in: 'query', schema: { type: 'string', enum: ESTADOS } },
          { name: 'prioridad', in: 'query', schema: { type: 'string', enum: PRIORIDADES } },
          { name: 'categoriaId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'agenteId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          {
            name: 'solicitanteId',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
            description: 'Se ignora para el rol SOLICITANTE, que siempre ve solo los suyos.',
          },
          {
            name: 'texto',
            in: 'query',
            schema: { type: 'string' },
            description: 'Busca en asunto y descripción, sin distinguir mayúsculas.',
            example: 'internet',
          },
        ],
        responses: {
          200: {
            description: 'Tickets encontrados.',
            content: {
              'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Ticket' } } },
            },
          },
          400: respuestaError('Un filtro trae un valor que no existe.', 'estado inválido'),
          401: respuestaError('Falta el token.', 'Sesión requerida'),
        },
      },
      post: {
        tags: ['Tickets'],
        summary: 'Registrar una solicitud',
        description: [
          'Registro de solicitudes (F01). El ticket nace en estado `NUEVO` y **sin agente**: asignarlo es',
          'otra decisión (F05).',
          '',
          'El solicitante es siempre el dueño de la sesión, nunca un campo del cuerpo: de lo contrario',
          'cualquiera podría registrar casos a nombre de otro.',
          '',
          'La categoría debe existir y estar activa; es la que fija el SLA del caso (F03).',
        ].join('\n'),
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  asunto: { type: 'string', minLength: 5, example: 'No hay internet en el laboratorio 3' },
                  descripcion: { type: 'string', minLength: 10, example: 'Desde las 8:00 ningún equipo conecta.' },
                  categoriaId: { type: 'string', format: 'uuid' },
                  prioridad: { type: 'string', enum: PRIORIDADES, default: 'MEDIA' },
                },
                required: ['asunto', 'descripcion', 'categoriaId'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Ticket registrado; su `id` es el acuse de recibo del solicitante (F02).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Ticket' } } },
          },
          400: respuestaError('Datos inválidos o categoría inexistente o inactiva.', 'La categoría no existe o está inactiva'),
          401: respuestaError('Falta el token.', 'Sesión requerida'),
        },
      },
    },

    '/tickets/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Tickets'],
        summary: 'Consultar un ticket',
        description: 'Un SOLICITANTE solo puede consultar los suyos (F10); el resto de roles, cualquiera.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Ticket.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Ticket' } } },
          },
          401: respuestaError('Falta el token.', 'Sesión requerida'),
          403: respuestaError('El ticket es de otro solicitante.', 'No autorizado para esta operación'),
          404: respuestaError('No existe.', 'Ticket no encontrado'),
        },
      },
      patch: {
        tags: ['Tickets'],
        summary: 'Modificar un ticket',
        description: [
          'Modificación parcial. Dos reglas del dominio se aplican aquí, no en el cliente:',
          '',
          '- **Ciclo de vida (F06)**: `estado` solo puede moverse por una transición permitida. Un ticket',
          '  `NUEVO` no salta a `RESUELTO`, y uno `CERRADO` no se reabre; el intento responde 409.',
          '- **Asignación (F05)**: poner `agenteId` en un ticket `NUEVO` lo pasa a `ASIGNADO` sin pedirlo.',
          '',
          'Un SOLICITANTE solo modifica sus propios tickets y **no** puede tocar `agenteId`: repartir el',
          'trabajo es del equipo de soporte.',
        ].join('\n'),
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  asunto: { type: 'string', minLength: 5 },
                  descripcion: { type: 'string', minLength: 10 },
                  estado: { type: 'string', enum: ESTADOS },
                  prioridad: { type: 'string', enum: PRIORIDADES },
                  categoriaId: { type: 'string', format: 'uuid' },
                  agenteId: { type: 'string', format: 'uuid', nullable: true, description: '`null` lo deja sin dueño.' },
                },
              },
              example: { estado: 'EN_PROCESO', prioridad: 'CRITICA' },
            },
          },
        },
        responses: {
          200: {
            description: 'Ticket modificado.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Ticket' } } },
          },
          400: respuestaError('Datos inválidos o categoría inutilizable.', 'estado inválido'),
          401: respuestaError('Falta el token.', 'Sesión requerida'),
          403: respuestaError('El ticket es de otro, o el rol no puede asignar.', 'No autorizado para esta operación'),
          404: respuestaError('No existe.', 'Ticket no encontrado'),
          409: respuestaError('Transición de estado no permitida.', 'Un ticket CERRADO no puede pasar a EN_PROCESO'),
        },
      },
      delete: {
        tags: ['Tickets'],
        summary: 'Eliminar un ticket',
        description:
          'Solo COORDINADOR y ADMINISTRADOR. Borrar contradice el historial inmutable (R08), así que es un ' +
          'acto administrativo excepcional —un caso registrado por error, un duplicado— y no parte de la ' +
          'operación diaria: lo normal es cerrar el ticket, no borrarlo.',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Eliminado.' },
          401: respuestaError('Falta el token.', 'Sesión requerida'),
          403: respuestaError('Rol insuficiente.', 'No autorizado para esta operación'),
          404: respuestaError('No existe.', 'Ticket no encontrado'),
        },
      },
    },
  },
  components: {
    schemas: { UsuarioDTO: usuario, SesionDTO: sesion, Categoria: categoria, Ticket: ticket, ErrorDTO: error },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token obtenido en `POST /api/auth/login`.',
      },
    },
  },
}
