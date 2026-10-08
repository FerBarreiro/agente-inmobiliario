# Incremento 3 — Verificación y borrador de contacto

**Fecha:** 2026-10-08

**Estado:** implementado localmente para oportunidades originadas en Mercado Libre, Zonaprop, Argenprop o un enlace manual de otro origen.

## Propósito

Completar el paso entre “oportunidad revisada” y “primer contacto” sin que Agente+ envíe mensajes ni consulte servicios externos en nombre del usuario.

```text
oportunidad de portal
  → revisar aviso y restricciones
  → registrar verificación manual
  → generar borrador editable
  → copiar y enviar manualmente, si corresponde
  → registrar resultado comercial
```

El sistema no decide que un contacto sea lícito ni que una persona quiera recibirlo. Ayuda a no omitir controles antes de que el usuario actúe.

## Alcance implementado

En la ficha de una oportunidad cuya fuente sea Mercado Libre, Zonaprop, Argenprop u **Otro** aparece la sección **Verificación antes de contactar**. La fuente **Otro** se trata deliberadamente como origen de riesgo: un enlace revisado manualmente pero no clasificado recibe los mismos controles. La sección guarda, aislada por cuenta:

- confirmación de que el usuario revisó el aviso original;
- estado declarado del aviso: no confirmado, admite contacto de inmobiliarias o “inmobiliarias abstenerse/no contactar”;
- canal previsto;
- fecha en que el usuario afirma haber verificado el Registro Nacional No Llame para llamada o WhatsApp;
- nota breve de verificación;
- borrador editable de primer mensaje.

No se guardan fotos ni textos completos del portal mediante este flujo. Los datos de contacto, si resultan legítimos y necesarios, se cargan manualmente más tarde en la oportunidad junto con su origen y preferencia de seguimiento; nunca se extraen del portal. Ver [`INCREMENTO_SEGUIMIENTO_Y_PRECIOS.md`](INCREMENTO_SEGUIMIENTO_Y_PRECIOS.md).

## Reglas de bloqueo

1. Una oportunidad marcada `No contactar` no puede usar el checklist ni registrar eventos comerciales.
2. Si el aviso indica que no admite contacto de inmobiliarias, el sistema bloquea guardar un borrador.
3. Para llamada o WhatsApp, se exige registrar una fecha de verificación No Llame antes de habilitar el borrador.
4. Para fuentes de portal, el evento `contact_attempted` es rechazado hasta que el checklist alcance estado `ready`.
5. El estado `ready` habilita **copiar** texto; nunca envía un WhatsApp, email, mensaje de portal ni llamada.

La fecha No Llame es una constancia ingresada por el usuario: Agente+ no consulta el registro, no certifica el resultado y no sustituye una revisión legal o contractual.

## Borrador de mensaje

El producto genera sólo una plantilla editable, con contexto mínimo de tipo de propiedad, barrio y nombre del usuario. Incluye una frase para que el destinatario pueda pedir no recibir más mensajes.

Antes de copiarlo, el usuario debe revisarlo y adaptarlo. No hay enlaces de envío, automatización de campañas, envío programado, acceso a WhatsApp, lectura de mensajes ni registro de credenciales externas.

## Implementación técnica

Se añadieron a `opportunities` campos aditivos de preparación de contacto y el endpoint autenticado:

| Endpoint | Uso |
|---|---|
| `PUT /api/opportunities/:id/contact-preparation` | Guarda checklist, estado y borrador de una oportunidad de la cuenta autenticada. |

El servidor calcula el estado `pending`, `ready` o `blocked`; la interfaz no puede declarar por sí sola que el contacto está listo. El evento de contacto saliente se vuelve a validar del lado del servidor.

## Verificación realizada

El 2026-10-08 se comprobó con base y API temporales aisladas:

1. una oportunidad de portal no pudo registrar `contact_attempted` sin checklist (`409`);
2. el checklist completo con canal WhatsApp y fecha No Llame pasó a estado `ready`;
3. tras esa preparación, el registro manual de contacto fue aceptado (`201`);
4. un aviso marcado “no contactar inmobiliarias” rechazó el guardado de un borrador (`400`);
5. compilación de producción, lint y sintaxis del servidor.

## Límites antes de datos reales

Este incremento no habilita el uso de datos personales reales en la base local. Antes de operar con ellos siguen pendientes HTTPS, almacenamiento administrado, backups, controles de retención/eliminación, auditoría, aviso de privacidad y revisión legal del procedimiento de contacto.
