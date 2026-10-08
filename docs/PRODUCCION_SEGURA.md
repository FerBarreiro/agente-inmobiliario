# Base de producción segura

**Fecha:** 2026-10-08
**Estado:** endurecimiento de aplicación y validación externa Render + Neon implementados; faltan pruebas funcionales sintéticas y controles operativos antes de cargar datos personales reales.

## Alcance de este incremento

Se preparó Agente+ para un staging protegido y para evitar configuraciones de producción inseguras por accidente. El 2026-10-08 se creó un entorno de validación en Render conectado a Neon, sobre la rama `dev`, sin datos personales reales.

La aplicación usa SQLite en desarrollo local y PostgreSQL cuando se provee `DATABASE_URL`. La ruta acordada para el piloto es Render + Neon; su configuración está en [`DESPLIEGUE_RENDER_NEON.md`](DESPLIEGUE_RENDER_NEON.md). Un staging técnico con SQLite local sigue siendo posible con confirmación explícita, pero no está aprobado para datos personales reales.

## Controles incorporados

| Control | Aplicación |
|---|---|
| Origen autorizado | En `NODE_ENV=production`, toda escritura exige encabezado `Origin` idéntico a `APP_ORIGIN`. |
| HTTPS | El arranque en producción exige que `APP_ORIGIN` use `https://`; la cookie de sesión usa `Secure`. |
| Sesión | Cookie `HttpOnly`, `SameSite=Strict`, `Path=/`, `Priority=High`; el servidor guarda sólo el hash del token. |
| Cabeceras | CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, política de referencia y permisos restringidos. |
| Intentos de acceso | Registro e inicio de sesión: máximo 8 intentos por dirección en 15 minutos; demo: 20 en el mismo período. |
| Entrada y transporte | Cuerpos JSON limitados, contraseñas entre 12 y 256 caracteres y timeouts del servidor. |
| Base administrada | Con `DATABASE_URL`, la API usa PostgreSQL; la URL se mantiene como secreto y la conexión exige TLS fuera de localhost. |
| Datos de SQLite | Si no existe `DATABASE_URL`, en producción se exige `DATA_DIRECTORY` absoluto y confirmación explícita `ALLOW_LOCAL_SQLITE_IN_PRODUCTION=1`; sólo habilita staging técnico. |
| Estado operativo | `GET /api/health` responde sólo `{ "status": "ok" }`, sin exponer datos de usuarios. |

`TRUST_PROXY=1` sólo debe configurarse si la aplicación queda detrás de un proxy inverso administrado. En ese caso se utiliza el primer valor de `X-Forwarded-For` para los límites de intentos. No debe activarse cuando el servidor sea accesible directamente desde internet.

## Variables de entorno

El archivo [`web/.env.example`](../web/.env.example) es una plantilla sin secretos. Los valores reales deben configurarse en el panel seguro del proveedor de despliegue.

| Variable | Producción | Finalidad |
|---|---|---|
| `NODE_ENV` | `production` | Activa precondiciones y cabeceras de producción. |
| `APP_ORIGIN` | Dominio propio | Origen canónico HTTPS. En Render se usa `RENDER_EXTERNAL_URL` si se omite. |
| `DATABASE_URL` | Obligatoria para datos reales | Cadena PostgreSQL con TLS, guardada sólo como secreto del proveedor. |
| `DATA_DIRECTORY` | Sólo staging SQLite | Ruta absoluta de un volumen persistente y restringido. |
| `ALLOW_LOCAL_SQLITE_IN_PRODUCTION` | Sólo staging técnico | Reconoce explícitamente que SQLite local no habilita datos personales. |
| `HOST`, `PORT` | Según proveedor | Interfaz de escucha del servicio. |
| `TRUST_PROXY` | Sólo detrás de proxy confiable | Permite identificar el origen para rate limiting. |

Los archivos `.env` y sus variantes están excluidos de Git. Nunca se deben escribir contraseñas, tokens, claves de proveedores ni copias de base de datos en el repositorio.

## Condición para datos reales

Antes de que un usuario cargue contactos u otra información personal real, se deben completar estos puntos:

1. Crear y verificar la instancia PostgreSQL administrada, con control de acceso de mínimo privilegio y copias de seguridad/recuperación verificadas.
2. Configurar el dominio HTTPS, el proxy/hosting, secretos y alertas en el proveedor elegido.
3. Definir y probar restauración de backups, retención, exportación y eliminación de datos por cuenta.
4. Mantener auditoría de operaciones sensibles y un procedimiento de incidentes.
5. Revisar aviso de privacidad, base legal, canales de contacto y procedimiento de ejercicio de derechos con asesoramiento profesional local.
6. Ejecutar pruebas de aislamiento entre cuentas y revisión de seguridad antes de abrir el acceso al piloto.

La variable `ALLOW_LOCAL_SQLITE_IN_PRODUCTION=1` no omite ni sustituye estos requisitos: sólo evita una puesta en marcha accidental mientras se valida infraestructura sin datos personales.

## Verificación realizada

El 2026-10-08 se ejecutó una instancia temporal con configuración de producción y una base aislada. Se comprobó:

1. `GET /api/health` respondió `200`.
2. una escritura sin `Origin` fue rechazada con `403`;
3. la misma escritura con el origen HTTPS configurado fue aceptada (`201`);
4. HSTS, bloqueo de frames y política de referencia estuvieron presentes en la respuesta;
5. compilación de producción, lint y validación de sintaxis del servidor.

También se verificó el despliegue externo de validación: compilación en Render, conexión a Neon, arranque del servidor, health check `/api/health` con respuesta `200` y cabeceras HTTPS de la raíz pública. El detalle está en [`DESPLIEGUE_RENDER_NEON.md`](DESPLIEGUE_RENDER_NEON.md).

## Próxima acción necesaria

Crear Neon y Render, cargar la cadena de Neon directamente como secreto de Render y verificar el despliegue sin datos personales. Los pasos exactos, responsabilidades y límites del plan gratuito están en [`DESPLIEGUE_RENDER_NEON.md`](DESPLIEGUE_RENDER_NEON.md).
