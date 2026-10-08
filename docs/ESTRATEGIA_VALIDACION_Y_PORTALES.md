# Estrategia de validación, captación y acuerdos con portales

**Fecha de decisión:** 2026-10-07  
**Estado:** estrategia aprobada para el piloto.  
**Objetivo:** validar que Agente+ ayuda a crear cartera antes de depender de acuerdos comerciales o integraciones complejas.

## Decisión de producto

El desarrollo avanzará en este orden:

1. **Carga manual:** el agente incorpora oportunidades, enlaces y resultados de contacto bajo su control.
2. **Captación entrante:** campañas, formularios y consultas voluntarias generan oportunidades con fuente, fecha y constancia de consentimiento.
3. **API oficial de Mercado Libre:** prueba técnica limitada a los recursos y usos autorizados por su documentación y términos vigentes.
4. **Acuerdo con otro portal:** solo después de demostrar uso real con tres pilotos activos.

No se implementarán scrapers, extracción de teléfonos o emails, perfiles paralelos de propietarios, mensajes automáticos ni reutilización comercial de contenido sin permiso escrito.

## Etapa 1 — Carga manual

El producto debe permitir que el agente:

- cargue una oportunidad creada por recomendación, recorrido de zona, formulario, llamada o enlace compartido;
- guarde únicamente los datos necesarios para evaluar y seguir la oportunidad;
- registre fuente, fecha de detección, motivo, próximo paso y fecha;
- adjunte o pegue el enlace original sin copiar masivamente el contenido del portal;
- marque restricciones visibles, por ejemplo “inmobiliarias abstenerse” o “no contactar”;
- registre consentimiento, oposición y baja cuando exista contacto con una persona.

La carga manual es parte de la validación y no un defecto temporal: permite comprobar qué información es realmente útil antes de diseñar una integración.

## Etapa 2 — Captación entrante

La vía prioritaria para aumentar cartera será generar interés del propietario y recibir su consulta, en lugar de localizar datos de contacto para abordarlo sin contexto.

Flujo esperado:

```text
Campaña por barrio o necesidad
  → formulario, mensaje o llamada iniciada por el interesado
  → registro de fuente y consentimiento
  → oportunidad en Agente+
  → seguimiento humano
  → tasación, propuesta y eventual captación
```

Las campañas iniciales se concentrarán en Núñez, Saavedra, Villa Urquiza, Coghlan y Belgrano. Todo contacto comercial será revisado y ejecutado por el agente; el sistema no enviará mensajes por sí solo durante el piloto.

## Etapa 3 — API oficial de Mercado Libre

La integración comenzará como un experimento controlado de **radar de mercado**, no como una base de contactos.

**Avance al 2026-10-08:** el modo Demo, los filtros, el guardado manual, la deduplicación y el adaptador de servidor están implementados. Los datos reales continúan desactivados hasta completar aplicación registrada, OAuth y validación del uso. Ver [`INCREMENTO_RADAR_OPORTUNIDADES.md`](INCREMENTO_RADAR_OPORTUNIDADES.md).

### Alcance inicial

- usar una aplicación registrada y autenticación oficial;
- consultar únicamente endpoints y campos habilitados para la aplicación;
- filtrar inmuebles por zona, tipo de operación y atributos permitidos;
- mostrar metadatos mínimos y un enlace profundo a la publicación original;
- identificar la fuente y la fecha de consulta;
- aplicar límites de frecuencia, caché y retención según las reglas vigentes;
- requerir acción humana para guardar una publicación como oportunidad;
- no revelar ni inferir teléfonos, emails, dirección exacta u otros datos personales no entregados expresamente para ese uso;
- no automatizar mensajes al anunciante.

La documentación oficial de Mercado Libre describe búsquedas de ítems activos, selección de campos y localización de inmuebles por ubicación. Antes de construir el conector se deberán revisar nuevamente sus términos, autorización, cuotas, políticas de almacenamiento y uso comercial, porque pueden cambiar.

### Qué se medirá

- búsquedas realizadas y resultados relevantes;
- publicaciones abiertas en el portal desde Agente+;
- resultados guardados por el agente;
- duplicados y falsos positivos;
- oportunidades que reciben un próximo paso legítimo;
- tiempo ahorrado respecto de la navegación manual;
- incidentes, reclamos, bajas o restricciones detectadas.

## Evidencia necesaria antes de negociar con Zonaprop o Argenprop

Se considerará que existe evidencia suficiente cuando se cumplan conjuntamente estas condiciones:

1. **Tres pilotos activos** con cuentas y datos aislados.
2. Cada piloto utilizó el producto durante al menos cuatro semanas y volvió a la vista **Hoy** en tres de las últimas cuatro semanas.
3. Existe actividad real y auditable de carga, priorización y seguimiento, no solo cuentas creadas.
4. Se puede mostrar el embudo agregado desde oportunidad detectada hasta conversación, tasación y captación, sin exponer datos personales.
5. La prueba con Mercado Libre permite informar búsquedas, relevancia, clics de salida, oportunidades guardadas y tiempo ahorrado.
6. No existen incidentes de seguridad, automatización no autorizada ni reclamos de contacto pendientes.
7. Hay un resumen de aprendizajes y una definición comprobada de los metadatos mínimos que los agentes necesitan.

Los umbrales comerciales de conversión se fijarán después de observar el primer mes; no se inventará un porcentaje de éxito antes de contar con una muestra real.

## Propuesta futura: piloto de metadatos de 60–90 días

Con la evidencia anterior, se podrá presentar a **Zonaprop o Argenprop** una propuesta acotada y reversible.

### Posicionamiento

Agente+ se presentará como una herramienta privada de productividad para agentes, no como un portal competidor. La integración debe conservar al portal como origen de la publicación, mostrar atribución clara y dirigir tráfico a la URL original.

### Datos a solicitar

Solo los metadatos necesarios para detectar y ordenar oportunidades:

- identificador de publicación;
- URL original;
- estado activo/inactivo y fechas relevantes;
- tipo de propiedad y operación;
- barrio o ubicación aproximada;
- precio y moneda;
- superficie, ambientes y atributos básicos;
- tipo de anunciante únicamente si el portal autoriza expresamente ese campo.

Quedan fuera del pedido inicial las fotos, el texto completo, teléfonos, emails, dirección exacta y documentos. Cualquier ampliación deberá tener finalidad, autorización y retención específicas.

### Contenido mínimo del acuerdo

El acuerdo escrito deberá definir:

- finalidad y usuarios habilitados;
- campos disponibles y usos permitidos/prohibidos;
- API, feed o mecanismo de entrega autorizado;
- frecuencia, cuotas, caché, retención, actualización y borrado;
- atribución, enlace al portal y reglas sobre marca/contenido;
- posibilidad o prohibición de contactar anunciantes y por qué canal;
- responsabilidades sobre datos personales, consentimiento y ejercicio de derechos;
- seguridad, accesos, auditoría, incidentes y subencargados;
- métricas compartidas, confidencialidad y uso de resultados agregados;
- territorio, precio, soporte, duración, terminación y eliminación posterior.

### Diseño del piloto

- duración: **60 a 90 días**;
- alcance: los tres pilotos activos y los cinco barrios iniciales;
- acceso: cuentas nominadas, sin redistribución ni sublicencia;
- experiencia: ficha resumida y enlace al portal, sin replicar su catálogo completo;
- revisión: control humano antes de convertir un resultado en oportunidad;
- reporte: métricas agregadas de uso, clics de salida, relevancia, oportunidades creadas y tiempo ahorrado;
- salida: desconexión y eliminación de la caché acordada al finalizar o ante incumplimiento.

### Criterio de éxito del acuerdo

El piloto será exitoso si aporta señales relevantes y ahorro de tiempo a los agentes, genera tráfico trazable al portal y funciona sin usos no autorizados, reclamos pendientes ni incidentes de datos. La cantidad de teléfonos obtenidos o mensajes enviados no será una métrica de éxito.

## Evidencia jurídica y técnica revisada

- [Mercado Libre — Ítems y búsquedas](https://developers.mercadolibre.com.ar/es_ar/usuarios-y-aplicaciones/items-y-busquedas): documenta consulta de ítems activos, filtros y selección de campos.
- [Mercado Libre — Localizar inmuebles](https://developers.mercadolibre.com.ar/es_ar/como-empezar/localizar-inmuebles): documenta filtros de ubicación y categoría para inmuebles.
- [Zonaprop — Términos y condiciones](https://www.zonaprop.com.ar/terminos.bum): protege contenido y bases de datos, prohíbe mecanismos de búsqueda ajenos a los provistos por el portal y el uso comercial no autorizado. Esto justifica exigir autorización escrita antes de integrar sus datos.
- [Argenprop — Términos y condiciones](https://www.argenprop.com/terminoscondiciones): debe revisarse nuevamente al preparar una propuesta, junto con sus canales comerciales oficiales.
- [Ley 25.326 de Protección de Datos Personales](https://www.argentina.gob.ar/normativa/nacional/64790/actualizacion): marco argentino aplicable a la obtención, finalidad, seguridad y derechos sobre datos personales.

Esta estrategia reduce riesgos, pero no reemplaza una revisión legal del contrato y de los flujos reales antes de lanzar integraciones o campañas con datos personales.
