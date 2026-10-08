# Incremento 4 — Contacto manual, seguimiento y precios observados

**Fecha:** 2026-10-08

**Estado:** implementado y verificado localmente en `dev`. No habilita consultas automáticas a portales ni el uso de datos personales reales sin completar los controles operativos pendientes.

## Propósito

Convertir una oportunidad revisada en una rutina comercial ordenada sin transformar el Radar en una base de contactos extraídos de portales.

```text
hallazgo manual → oportunidad sin contacto
                 → carga manual de dato y origen, si corresponde
                 → primer contacto manual con borrador copiable
                 → preferencia: seguimiento / latente / no continuar / no contactar
                 → revisión humana o cierre
```

El producto no interpreta que una baja de precio pruebe que una persona no pudo vender. Es sólo una señal que el usuario puede registrar y volver a revisar manualmente.

## Alcance implementado

### Contacto después de Radar

Una oportunidad creada desde Radar continúa naciendo sin datos personales. En su ficha aparece **Contacto y preferencia**, donde el usuario puede cargar manualmente:

- dato de contacto mínimo: teléfono, email o usuario, si resulta necesario;
- origen: aportado directamente, consulta entrante, relación previa, aviso a verificar, otro o no cargado;
- preferencia de seguimiento y nota breve;
- fecha de revisión sólo cuando corresponde.

El origen `Aviso a verificar` no convierte un dato publicado en autorización para contactar. Para fuentes de portal se mantiene el checklist existente de revisión del aviso, canal y No Llame antes de habilitar un borrador o registrar un intento de contacto.

### Preferencias operativas

| Preferencia | Comportamiento de Agente+ |
|---|---|
| Sin contacto aún | Conserva la oportunidad para revisión; no supone permiso para insistir. Si reemplaza un seguimiento o estado latente, cancela su tarea programada y vuelve a pedir verificación. |
| Seguimiento acordado | Exige dato de contacto y fecha; crea una tarea para retomar la conversación en esa fecha. |
| Latente | Exige dato y fecha; crea una tarea de **revisión**, no un contacto programado. Antes de escribir de nuevo se deben verificar aviso, canal y preferencia. |
| No continuar | Cierra el seguimiento y sus tareas pendientes, conservando la trazabilidad. |
| No contactar | Bloquea tareas pendientes y acciones comerciales. No puede revertirse desde esta pantalla. |

La falta de respuesta nunca se traduce en permiso para volver a contactar. Sólo la preferencia registrada por el usuario permite crear una tarea de seguimiento o revisión.

### Precio observado

La ficha permite registrar precio, moneda y fecha observada de forma manual. Al convertir un hallazgo que ya tenía precio orientativo, se crea la primera observación. La interfaz muestra hasta tres observaciones recientes y una variación simple cuando son de la misma moneda.

No hay monitoreo de portales, alertas automáticas, deducciones sobre el motivo de una variación ni mensajes disparados por cambios de precio. La señal obliga a abrir la fuente original y decidir manualmente el siguiente paso.

### Primer contacto

El borrador editable y copiable existente se conserva. No se envían WhatsApps, emails, formularios del portal ni mensajes de redes desde Agente+. La persona usuaria revisa, adapta y decide cualquier envío fuera de la aplicación.

## Reglas de protección

1. El Radar no guarda contactos, fotografías ni textos completos de avisos.
2. Los datos de contacto se cargan únicamente en la oportunidad, aislados por `user_id`.
3. Las fuentes de portal requieren el checklist persistente antes de registrar `Contacto intentado`.
4. Un aviso que indique “inmobiliarias abstenerse” y una preferencia `No contactar` bloquean los contactos comerciales.
5. Llamada y WhatsApp requieren que el usuario deje constancia de haber verificado No Llame; Agente+ no consulta ni certifica ese registro.
6. Un precio observado es contexto comercial, no un perfil automático ni justificación para insistir.

Los números de teléfono son datos personales y la oferta de servicios por telefonía está sujeta al marco de protección de datos y No Llame. Este documento describe controles de producto, no sustituye asesoramiento jurídico ni una revisión de los términos vigentes de cada portal. Ver [Ley 25.326](https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790/texto) y [Ley 26.951](https://www.argentina.gob.ar/normativa/nacional/norma-233066/texto).

## Modelo y API

Se agregan campos aditivos a `opportunities`:

- `contact_origin`;
- `contact_preference`;
- `contact_follow_up_at`;
- `contact_preference_note`.

La nueva tabla `opportunity_price_observations` conserva observaciones manuales de precio por oportunidad y por cuenta. No contiene ni permite consultar datos de terceros.

| Endpoint | Uso |
|---|---|
| `PUT /api/opportunities/:id/contact-record` | Actualiza dato de contacto, origen y preferencia; crea la tarea de seguimiento/revisión cuando corresponde. |
| `POST /api/opportunities/:id/price-observations` | Registra un precio manual, moneda y fecha de observación. |

Ambos endpoints requieren sesión y filtran la oportunidad por la cuenta autenticada. El servidor, no la interfaz, aplica el bloqueo para `No contactar`.

## Verificación realizada

En una base SQLite temporal y aislada se comprobó:

1. alta de una oportunidad de portal sin contacto;
2. carga de un contacto manual y preferencia `Latente`, con fecha de revisión;
3. creación de una observación de precio en USD;
4. cambio a `No contactar`;
5. rechazo `409` de un intento posterior de registrar `Contacto intentado`;
6. compilación de producción, lint, sintaxis del servidor y chequeo de diff.

La base temporal, las credenciales de prueba y el servidor local se eliminaron al finalizar la verificación.

## Fuera de alcance

- scraping, extensiones de captura, agentes que naveguen portales o importación automática de contactos;
- envío, programación o lectura de mensajes;
- inferir interés o incapacidad de venta a partir de antigüedad o precio;
- recontactar por falta de respuesta;
- consulta automática de No Llame;
- seguimiento automático de precios desde portales.

Un feed autorizado, API oficial o acuerdo escrito podría evaluarse más adelante como fuente de metadatos mínimos. No cambia las reglas de contacto, privacidad ni control humano de esta etapa.
