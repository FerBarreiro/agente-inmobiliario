# Incremento 1 — Captación manual y seguimiento auditable

**Fecha:** 2026-10-08  
**Estado:** implementado y verificado localmente.  
**Propósito:** permitir que un agente cargue una oportunidad, programe el próximo paso y registre su avance comercial completo sin depender de portales ni mensajería automática.

## Hipótesis que se valida

Antes de construir captación entrante o integrar la API de Mercado Libre, el producto debe demostrar que el agente puede organizar y sostener el trabajo de captación dentro de Agente+.

El circuito validable es:

```text
Oportunidad detectada
  → próximo paso con fecha y canal
  → resultado comercial explícito
  → nuevo próximo paso o cierre
  → historial y métricas auditables
```

Completar una tarea y registrar un resultado son acciones distintas. La tarea indica que una acción fue atendida; el evento comercial indica qué ocurrió realmente y es el dato que alimentará el embudo.

## Funcionalidad implementada

### Alta enriquecida de oportunidad

La carga manual incorpora:

- nombre o referencia;
- barrio y operación;
- tipo de propiedad;
- fuente;
- enlace original opcional;
- situación de permiso de contacto;
- dato de contacto opcional;
- notas;
- próximo paso obligatorio;
- fecha y canal del próximo paso.

Los barrios habilitados siguen siendo Núñez, Saavedra, Villa Urquiza, Coghlan y Belgrano. Las operaciones son venta y alquiler.

### Fuentes iniciales

- referido;
- recorrido de zona;
- formulario entrante;
- llamada entrante;
- enlace compartido;
- Mercado Libre;
- otro.

“Mercado Libre” identifica por ahora una carga manual o enlace compartido. No implica que la API ya esté conectada.

### Permiso y restricción de contacto

Cada oportunidad conserva uno de estos estados:

| Código | Significado operativo |
|---|---|
| `unknown` | No existe todavía evidencia de permiso; requiere cautela y validación antes de contactar. |
| `inbound` | La persona inició una consulta por el canal registrado. |
| `explicit` | Existe permiso explícito para el contacto. |
| `do_not_contact` | No se debe iniciar contacto; queda visible como restricción. |

Que un dato sea público no cambia automáticamente su estado a `explicit`. La herramienta no infiere consentimiento.

Mientras una oportunidad permanezca en `do_not_contact`, el servidor rechaza nuevos eventos comerciales y solo permite cerrarla como perdida. Cambiar esta condición requerirá en un incremento posterior un flujo explícito y auditado, por ejemplo ante una consulta entrante posterior.

### Ficha e historial

La ficha individual muestra:

- situación actual y score inicial explicable;
- fuente, enlace original y fecha de detección;
- tipo de propiedad, zona y operación;
- dato y permiso de contacto;
- notas y próximo paso;
- línea de tiempo de eventos.

Desde la ficha se pueden registrar los eventos definidos para el piloto:

1. contacto intentado;
2. conversación iniciada;
3. tasación agendada;
4. tasación realizada;
5. propuesta enviada;
6. propiedad captada;
7. oportunidad perdida.

Los eventos abiertos exigen un nuevo próximo paso. “Propiedad captada” y “Oportunidad perdida” cierran la oportunidad y completan sus tareas pendientes.

### Vistas operativas

- **Hoy:** resume oportunidades, conversaciones, captaciones y tareas pendientes.
- **Oportunidades:** permite buscar y filtrar por estado y barrio.
- **Contactos:** muestra únicamente oportunidades que poseen un dato de contacto y mantiene visible su situación de permiso.
- **Campañas:** conserva un estado informativo hasta implementar captación entrante.
- **Métricas:** conserva un estado informativo; los eventos ya se registran, pero el tablero se habilitará cuando haya una muestra útil.

## Modelo de datos incorporado

La migración es aditiva y conserva la base local existente.

### Nuevos campos de oportunidad

- `property_type`
- `source`
- `source_url`
- `contact_detail`
- `contact_permission`
- `notes`
- `next_step_date`
- `updated_at`
- `closed_at`

### Cambios en tareas

- `opportunity_id`: vincula el próximo paso con su oportunidad;
- `due_at`: conserva la fecha en un formato procesable, separado del texto de presentación.

### Nueva tabla `opportunity_events`

Conserva el usuario propietario, oportunidad, tipo y etiqueta del evento, nota, canal y fecha. Las consultas y actualizaciones se filtran en el servidor por `user_id`.

Los registros anteriores que no poseían historial reciben un evento inicial de oportunidad detectada. Este backfill no inventa conversaciones, tasaciones ni captaciones.

## API local

| Método y ruta | Uso |
|---|---|
| `POST /api/opportunities` | Crea la oportunidad, su evento inicial y el primer próximo paso. |
| `POST /api/opportunities/:id/events` | Registra un resultado, actualiza el estado y reemplaza la tarea pendiente. |
| `POST /api/tasks/:id/complete` | Marca atendida una tarea sin inferir un resultado comercial. |
| `GET /api/dashboard` | Devuelve oportunidades, eventos y tareas de la cuenta autenticada. |

La API valida listas permitidas, longitudes, protocolos `http/https` en enlaces y propiedad de cada registro.

## Decisiones de privacidad y seguridad aplicadas

1. Los datos de contacto son opcionales; una oportunidad puede trabajarse solo como señal.
2. Fuente y permiso permanecen visibles para reducir contactos improcedentes.
3. El servidor no acepta actuar sobre una oportunidad perteneciente a otro usuario.
4. No se envían mensajes ni se consulta ninguna cuenta externa.
5. Los enlaces abren la fuente original; no se copia automáticamente el contenido.
6. Las notas poseen límites de longitud y los cuerpos JSON tienen un límite de tamaño.
7. La configuración sigue siendo local y no está aprobada para datos personales reales hasta completar el despliegue productivo descripto en `AUTENTICACION_Y_DATOS.md`.

## Verificación realizada

El 2026-10-08 se verificó:

1. `npm run build` sin errores.
2. `npm run lint` sin errores ni advertencias.
3. Arranque del servidor y migraciones sobre una base SQLite temporal vacía.
4. Creación de una cuenta privada temporal.
5. Alta de una oportunidad ficticia con fuente, permiso, enlace y próximo paso.
6. Registro del evento `conversation_started`.
7. Cierre automático de la tarea anterior y creación del nuevo próximo paso.
8. Persistencia de ambos eventos en la línea de tiempo.
9. Prueba negativa de aislamiento: una segunda cuenta recibió `404` al intentar registrar un evento sobre la oportunidad de la primera.
10. Prueba de restricción: una oportunidad `do_not_contact` forzó el próximo paso “Revisar sin contactar”, el canal “Sin canal” y devolvió `409` ante un intento de registrar contacto.

La prueba se ejecutó fuera de la base de desarrollo del usuario.

## Fuera de alcance de este incremento

- edición de los datos básicos de una oportunidad ya creada;
- reapertura de oportunidades cerradas;
- exportación y eliminación desde la interfaz;
- formulario público de captación entrante;
- campañas y consentimiento versionado;
- conexión con la API de Mercado Libre;
- envío o recepción automática de WhatsApp, email, Instagram o llamadas;
- tablero de ratios y meta configurable;
- despliegue productivo con HTTPS, backups y almacenamiento administrado.

## Próxima validación recomendada

Recorrer el flujo con la cuenta Demo y luego cargar únicamente datos ficticios en la cuenta personal local. Se debe observar:

- si los campos de alta son suficientes y no burocráticos;
- si “próximo paso + fecha” refleja la forma real de trabajar;
- si los siete resultados cubren los casos frecuentes;
- qué filtros hacen falta para encontrar una oportunidad;
- qué datos pueden eliminarse por no aportar valor.

Después de ajustar este circuito corresponde implementar la captación entrante mediante un formulario seguro y consentimiento registrado. La API de Mercado Libre sigue siendo la tercera etapa.
