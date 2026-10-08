# Incremento 2 — Radar manual de oportunidades

**Fecha:** 2026-10-08

**Estado:** implementado localmente para validación manual.

**Decisión:** no hay integraciones, APIs, scraping ni consultas automáticas a portales.

## Propósito

El Radar es una bandeja privada para que el usuario vuelva a encontrar y evalúe avisos que localizó navegando normalmente en un portal.

```text
portal abierto por el usuario
  → carga mínima de un hallazgo y su enlace
  → revisión manual del aviso original
  → oportunidad o descarte
  → contacto manual sólo si corresponde
```

No es un buscador inmobiliario ni una copia de catálogos ajenos. Agente+ no consulta portales, no recibe resultados desde ellos y no extrae contenido, fotografías, direcciones precisas, teléfonos, emails ni perfiles.

## Portales iniciales

La primera rutina sugerida para los barrios del piloto es:

1. **Mercado Libre Inmuebles**, con exploración manual de su área de [dueño directo](https://inmuebles.mercadolibre.com.ar/dueno-directo/), venta/alquiler y filtros disponibles en el sitio.
2. **Zonaprop**, usando su búsqueda normal por CABA, barrio, operación y características. [Sitio oficial](https://www.zonaprop.com.ar/).
3. **Argenprop**, usando su búsqueda normal por zona y operación. [Sitio oficial](https://www.argenprop.com/).
4. **Otro**, sólo para un enlace que el usuario haya encontrado y revisado personalmente.

Mercado Libre, Zonaprop y Argenprop son fuentes iniciales por su presencia explícita de oferta de venta y alquiler en CABA; no constituyen una lista exhaustiva ni una recomendación de contactar a los anunciantes.

Por ahora no se agregan botones de Facebook, Instagram, Marketplace ni grupos. Esos espacios elevan el riesgo de tratar datos de perfiles personales y de confundir una publicación social con autorización para una propuesta comercial. Si más adelante un usuario registra un enlace hallado allí, se tratará como `Otro` y se deberá comprobar manualmente el contexto y las restricciones de contacto.

## Flujo implementado

### 1. Navegar fuera de Agente+

La vista Radar muestra enlaces externos a los tres portales iniciales. Al hacer clic, el usuario navega por su cuenta en una pestaña nueva y usa los filtros de ese portal. El producto no envía criterios de búsqueda, no lee la página resultante ni conserva el historial de navegación.

### 2. Cargar un hallazgo

El botón **Cargar hallazgo** crea una tarjeta privada con:

- referencia breve escrita por el usuario;
- portal de origen;
- URL del aviso original;
- barrio, operación y tipo de propiedad;
- precio orientativo y moneda, si resultan útiles;
- observaciones propias y mínimas.

No admite datos de contacto. Tampoco se deben pegar descripciones completas, fotografías, recorridos virtuales ni otros elementos del aviso que no hagan falta para decidir una revisión.

### Asistencia desde enlace

El usuario puede pegar primero la URL del aviso. La interfaz interpreta sólo ese texto de forma local para sugerir portal y, cuando aparezcan inequívocamente en la propia URL, barrio, operación o tipo de propiedad. No abre la página, no descarga HTML ni copia contenido del portal. La tarjeta queda identificada como **Asistida por URL** y las sugerencias deben revisarse antes de guardar. El diseño y los límites completos están en [`INCREMENTO_ASISTENCIA_ENLACE.md`](INCREMENTO_ASISTENCIA_ENLACE.md).

### 3. Editar, revisar, descartar o convertir

Cada tarjeta que todavía no fue convertida ofrece **Editar hallazgo** además de **Ver oportunidad**, que abre la URL original. Editar abre el mismo formulario precargado y permite corregir referencia, enlace, clasificación, precio y notas. La operación se limita a la cuenta dueña del hallazgo y conserva su estado actual. Un hallazgo convertido se edita desde la oportunidad resultante, para no alterar retrospectivamente el registro de Radar.

La actualización usa `PUT /api/radar-items/:id`. El servidor vuelve a validar todos los campos, filtra el registro por la cuenta autenticada y rechaza con `409` la edición de un hallazgo ya convertido.

Los estados son:

| Estado | Significado | Datos personales |
|---|---|---|
| Hallazgo | Enlace guardado para no perderlo. | No se guardan. |
| En revisión | El usuario considera revisarlo en la fuente original. | No se guardan. |
| Oportunidad creada | Se convirtió desde el Radar y se registró el paso de verificación de contacto. | No se trasladan datos de contacto. |
| Descartada | No continuará en el flujo. Puede reactivarse. | No se guardan. |

Al elegir **Convertir en oportunidad**, el sistema crea de inmediato una oportunidad con los datos mínimos ya cargados y el próximo paso **Completar verificación de contacto**. No copia datos personales, no envía mensajes ni da por autorizado un contacto. Si el hallazgo tenía precio orientativo, éste se conserva como la primera **observación manual de precio**, no como un monitoreo del portal. El hallazgo sale de la bandeja activa del Radar y aparece en **Oportunidades**; queda marcado como convertido para evitar duplicados.

## Contacto: barrera obligatoria

Guardar o revisar un aviso **no autoriza** contactar al anunciante. Antes de crear una tarea comercial el usuario debe:

1. volver a abrir el aviso original;
2. comprobar que no diga “inmobiliarias abstenerse” ni imponga otra restricción;
3. identificar si el canal es legítimo para la propuesta que pretende hacer;
4. para telefonía, verificar el Registro Nacional No Llame y dejar constancia de la comprobación;
5. registrar sólo el dato de contacto necesario y permitir la marca inmediata **No contactar**;
6. redactar y revisar manualmente el primer mensaje antes de enviarlo por fuera de Agente+.

La Ley 26.951 exige a quienes ofrecen servicios por telefonía consultar el Registro Nacional No Llame; la excepción relevante exige autorización expresa de la persona. [Texto de la ley](https://www.argentina.gob.ar/normativa/nacional/ley-26951-233066/texto). Como política conservadora del producto, WhatsApp se tratará con la misma cautela operativa hasta contar con revisión legal específica.

No se implementan mensajes automáticos, campañas, botones de envío, lectura de WhatsApp ni captura de contactos. El borrador de primer mensaje es texto editable para copiar y sólo se habilita después del checklist persistente de contacto; nunca aparece directamente desde una tarjeta de Radar. El alcance completo está en [`INCREMENTO_CONTACTO_CONTROLADO.md`](INCREMENTO_CONTACTO_CONTROLADO.md).

Después de la conversión, el usuario puede cargar manualmente un dato de contacto y la preferencia de seguimiento en la ficha de la oportunidad. “Latente” crea una revisión humana, no una autorización de contacto ni un reintento automático; “No contactar” bloquea el flujo comercial. El detalle está en [`INCREMENTO_SEGUIMIENTO_Y_PRECIOS.md`](INCREMENTO_SEGUIMIENTO_Y_PRECIOS.md).

## Protección de datos y reglas de uso

Que un aviso sea visible públicamente no elimina los límites contractuales del portal ni las obligaciones de datos personales. La Ley 25.326 contempla tratamientos publicitarios en supuestos acotados de fuentes públicas o datos facilitados/consentidos, y reconoce derechos de acceso y exclusión. [Texto de la Ley 25.326](https://www.argentina.gob.ar/normativa/nacional/64790/texto).

Por ello, el diseño actual aplica estas reglas:

1. navegación humana; nunca robots, scraping, extensiones de captura ni IA que recolecte resultados;
2. enlace de salida al aviso original, sin espejo del catálogo;
3. minimización de datos y aislamiento estricto por cuenta;
4. marca `No contactar` que bloquea acciones comerciales;
5. ningún contacto se infiere por estar publicado;
6. cumplimiento de los términos vigentes de cada portal por parte del usuario.

Zonaprop restringe mecanismos automáticos de navegación/búsqueda distintos de sus herramientas, por lo que el modo manual evita construir un sustituto de su buscador. [Términos de Zonaprop](https://www.zonaprop.com.ar/terminos.bum). Este documento es una guía de producto, no un dictamen legal; antes de operar con datos reales se requiere revisión profesional y controles de producción.

## Implementación técnica

La API local creó la tabla `radar_items`, aislada por `user_id`. Sus endpoints requieren sesión:

| Endpoint | Uso |
|---|---|
| `GET /api/radar-items` | Devuelve sólo los hallazgos de la cuenta autenticada. |
| `POST /api/radar-items` | Crea un hallazgo manual con URL válida y metadatos mínimos. |
| `POST /api/radar-items/:id/state` | Marca revisión, descarte o reactivación. |
| `POST /api/radar-items/:id/convert` | Convierte un hallazgo en revisión en oportunidad, crea el próximo paso de verificación y actualiza su estado en una misma transacción. |

No existen credenciales externas, variables de entorno de proveedores ni llamadas de servidor a Mercado Libre, Zonaprop, Argenprop o redes sociales en este flujo.

## Verificación realizada

El 2026-10-08 se comprobó con una base temporal aislada:

1. creación autenticada de un hallazgo manual;
2. cambio de `Hallazgo` a `En revisión`;
3. conversión a oportunidad con próximo paso y cambio transaccional a `Oportunidad creada`;
4. rechazo `409` al intentar convertir un hallazgo sin pasar por revisión o por segunda vez;
5. aislamiento: una segunda cuenta no pudo ver los hallazgos de la primera;
6. compilación de producción, lint y sintaxis del servidor;
7. revisión visual de la vista Radar con enlaces externos, aviso de límites y bandeja vacía.

## Camino de crecimiento

### Ahora: validación manual

Medir por cada usuario: hallazgos cargados, porcentaje revisado, oportunidades creadas, motivos de descarte, contactos permitidos, conversaciones, tasaciones y captaciones. La señal principal es si el Radar reduce el uso de planillas o pestañas olvidadas sin promover contactos indebidos.

### Después: endurecimiento para datos reales

Antes de permitir contactos reales: HTTPS, base administrada, cifrado, backups, retención/borrado, exportación, auditoría de acciones sensibles, procedimiento de incidentes y checklist verificable de contacto.

### Sólo con evidencia: acuerdos de metadatos

Después de tres pilotos activos y evidencia de uso, proponer a Zonaprop o Argenprop un acuerdo limitado de metadatos por 60–90 días: atribución, enlace al portal, retención mínima, métricas agregadas y prohibición expresa de extracción de contactos o republicación. Cualquier API oficial deberá activarse únicamente tras autorización escrita y revisión contractual/técnica.

### Condición específica para una futura integración con Mercado Libre

Antes de reabrir el desarrollo del conector, se deberá crear una consulta formal por el canal de soporte para integradores de Mercado Libre. La consulta debe describir sin ambigüedad:

- producto privado para uno a tres usuarios inmobiliarios;
- búsqueda a través de la API oficial y presentación de título mínimo, portal, zona aproximada, precio, tipo y enlace original;
- ausencia de fotografías, descripción completa, teléfonos, emails, perfiles, mensajes automáticos y republicación;
- retención mínima, eliminación de avisos retirados y acceso aislado por cuenta;
- finalidad exacta: identificar avisos que el usuario podría revisar para ofrecer servicios inmobiliarios.

No bastan la creación de una aplicación, la aceptación genérica de términos ni una respuesta técnica sobre OAuth. Debe existir confirmación escrita de compatibilidad para esta finalidad concreta. Mientras no exista, se mantiene el Radar manual y no se almacenan credenciales externas.
