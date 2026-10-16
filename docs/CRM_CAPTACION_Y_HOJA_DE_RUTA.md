# CRM de captación — definición y hoja de ruta

**Fecha:** 2026-10-08  
**Estado:** CRM-1 a CRM-4 implementados y verificados localmente.

## Propósito

La vista **Oportunidades** evoluciona de una lista básica a la bandeja de trabajo diaria del usuario. No se crea un CRM paralelo: se amplía el flujo ya existente de captación, conservando una oportunidad, su historial y su próximo paso como fuente de verdad.

```text
hallazgo → oportunidad → verificación → contacto manual → respuesta
         → seguimiento / tasación / propuesta → cliente → propiedad captada
```

El objetivo es que el usuario pueda decidir qué hacer hoy sin abrir cada ficha ni usar una planilla paralela.

## Principios de diseño

1. **Una oportunidad es una posible captación**, no un cliente confirmado.
2. **El historial es la evidencia.** Fecha de contacto, canal y respuesta provienen de eventos; no se marcan de forma ambigua en la grilla.
3. **Una acción principal por oportunidad.** La interfaz sugiere el paso más útil según el estado, pero no ejecuta envíos ni contactos.
4. **No inferir “dueño directo”.** Sólo se filtra por una señal cargada o verificada manualmente; nunca por el título, URL, precio o portal.
5. **Mínimos datos personales.** La lista no muestra teléfonos, emails ni notas privadas. Esos datos permanecen dentro de la ficha y bajo controles de contacto.
6. **No contactar prevalece.** Bloquea preparaciones, registros de contacto y acciones comerciales posteriores.
7. **Un cliente nace de una relación comercial real.** No basta que una persona responda; debe existir una aceptación, tasación formal solicitada, autorización o acuerdo equivalente que el usuario registre.

## Vista CRM de Oportunidades

La vista de escritorio se organizará como tabla o lista densa; en móvil, como tarjetas resumidas. Cada fila debe permitir escanear y actuar sin exponer datos innecesarios.

| Columna | Fuente | Finalidad |
|---|---|---|
| Oportunidad | referencia del inmueble | Identificación inmediata. |
| Zona, operación y tipo | oportunidad | Segmentación comercial. |
| Origen | fuente y enlace | Trazabilidad. |
| Dueño directo | señal manual estructurada | Distingue declarado, a verificar o no aplicable. |
| Estado comercial | resumen de oportunidad | Sitúa el caso en el embudo. |
| Último contacto | último evento comercial | Muestra canal y fecha, si existe. |
| Respuesta | último resultado estructurado | Indica sin respuesta, interés, seguimiento, no continuar o no contactar. |
| Próxima acción | tarea/opportunity | Define qué hacer y cuándo. |
| Prioridad | tarea vigente | Ayuda a ordenar la jornada. |
| Acción principal | reglas de estado | Reduce decisiones y clics innecesarios. |

No se muestran teléfono, email, texto de mensajes ni observaciones privadas en la grilla.

## Filtros iniciales

- barrio;
- venta o alquiler;
- tipo de propiedad;
- fuente/portal;
- señal de dueño directo: `declarado`, `a verificar`, `no aplica`;
- estado comercial;
- contacto: pendiente, preparado, intentado, con respuesta;
- resultado: interesado, sin respuesta, seguimiento acordado, latente, no continuar, no contactar;
- fecha de hallazgo;
- próxima acción: vencida, hoy, esta semana, futura o sin fecha.

Las combinaciones deben permanecer en la URL o estado de la vista para no perder el contexto de trabajo al abrir y cerrar una ficha.

## Acciones principales por estado

| Situación | Acción principal | Resultado esperado |
|---|---|---|
| Hallazgo convertido sin datos/verificación | Preparar primer contacto | Abre la ficha enfocada en verificación y canal. |
| Contacto con controles pendientes | Completar verificación | Revisa aviso, restricción y, si aplica, No Llame. |
| Borrador listo | Copiar borrador | Sólo copia texto; no envía ni abre canales externos. |
| Contacto enviado manualmente | Registrar resultado | Añade evento, respuesta y próximo paso. |
| Interés o conversación | Agendar tasación / seguimiento | Crea tarea concreta con fecha. |
| Pidió no continuar | Marcar No contactar o No continuar | Bloquea o cierra según la preferencia registrada. |
| Relación comercial confirmada | Convertir en cliente | Crea vínculo explícito y conserva la trazabilidad. |

El botón **Convertir en cliente** no estará disponible por una mera respuesta. Requerirá seleccionar un motivo de conversión y confirmar la fecha de la relación comercial.

## Modelo de datos previsto

### Reutilizar antes de crear columnas

Ya existen: fuente, zona, operación, tipo, fecha de creación, tareas, próximo paso, estado, contacto manual, preferencia, eventos y observaciones de precio. La primera versión del CRM debe reutilizarlos.

La fecha del último contacto y su canal se derivarán del último evento comercial. No se duplicarán como campos editables de la oportunidad.

### Nuevos datos estructurados, cuando se implemente cada caso

| Dato | Valores iniciales | Motivo |
|---|---|---|
| Señal de dueño directo | `a_verificar`, `declarado_en_aviso`, `no_aplica` | Permite filtrar sin inferencias. |
| Resultado de contacto | `sin_respuesta`, `interesado`, `seguimiento_acordado`, `latente`, `no_continuar`, `no_contactar` | Hace comparable el historial sin depender de texto libre. |
| Cliente | entidad separada vinculada a oportunidad | Sólo después de confirmar una relación comercial y cuando haya evidencia de que una persona puede relacionarse con varias oportunidades. |

La entidad Cliente no se introduce en el primer incremento de CRM. Primero se validará la grilla y el registro estructurado de resultados.

## Secuencia de implementación

### Incremento CRM-1 — Bandeja operativa

**Alcance:** mejorar Oportunidades con columnas/lista, búsqueda, filtros por zona, operación, fuente, estado, fecha y próxima acción; ordenar por prioridad y vencimiento; acción principal contextual.

**Estado:** implementado localmente.

**No incluye:** clientes, campañas, mensajes, automatización ni cambios de contacto.

**Criterio de aceptación:** el usuario puede localizar oportunidades vencidas, de un barrio o fuente determinada y abrir la ficha correcta en menos de tres interacciones.

### Incremento CRM-2 — Resultados de contacto y dueño directo

**Alcance:** registrar señal manual de dueño directo y resultado estructurado de cada contacto; mostrar último contacto y respuesta en la bandeja.

**Regla:** “declarado en aviso” no equivale a autorización de contacto, ni “sin respuesta” a permiso para insistir.

**Criterio de aceptación:** el usuario puede filtrar “dueño directo declarado + sin respuesta + próxima acción vencida” sin que se exponga un dato de contacto en la lista.

**Estado:** implementado localmente.

La clasificación de dueño directo se guarda de forma manual y auditable; cada cambio deja un evento interno. El registro de un evento comercial permite seleccionar un resultado estructurado. Los resultados con efecto operativo se aplican de manera conservadora:

- `seguimiento_acordado` y `latente` exigen fecha y generan una revisión manual, sin mensajes ni contactos automáticos;
- `no_continuar` cierra la oportunidad y completa sus tareas pendientes;
- `no_contactar` bloquea nuevas acciones comerciales y conserva la restricción.

La bandeja incorpora filtros por señal de dueño directo y resultado, sin mostrar teléfono, email ni observaciones privadas.

### Incremento CRM-3 — Conversión a cliente

**Alcance:** diseñar entidad Cliente, motivo y fecha de conversión, relación con oportunidades y navegación desde la ficha.

**Precondición:** evidencia de uso que demuestre que una persona participa en más de una oportunidad o propiedad.

**Criterio de aceptación:** convertir en cliente conserva todos los eventos de la oportunidad y no duplica datos personales sin necesidad.

**Estado:** implementado localmente por decisión de producto del 2026-10-08.

La entidad Cliente no almacena teléfono, email, notas ni una copia del nombre. Referencia la oportunidad de origen, que conserva los datos y el historial bajo los controles existentes. La conversión exige:

1. una confirmación expresa del usuario de que existe una relación comercial real;
2. un motivo estructurado: captación confirmada, tasación solicitada formalmente, acuerdo comercial confirmado u otro vínculo confirmado;
3. fecha de confirmación.

No se permite convertir una oportunidad perdida, sin seguimiento o marcada como `No contactar`. La conversión deja un evento, actualiza el estado comercial y crea el próximo paso **Definir plan de captación**. La vista Clientes permite volver a la ficha de origen.

### Incremento CRM-4 — Métricas y prioridades

**Alcance:** métricas derivadas de eventos reales, tiempo entre etapas, oportunidades vencidas y prioridades sugeridas explicables.

**Precondición:** muestra suficiente de datos sintéticos o autorizados; no mostrar ratios engañosos con pocos casos.

**Estado:** implementado localmente.

La vista Métricas ofrece dos niveles claramente separados:

1. **Conteos operativos** siempre visibles: oportunidades registradas, eventos de contacto, resultados estructurados, clientes confirmados, tareas pendientes, vencidas y oportunidades bloqueadas por `No contactar`.
2. **Indicadores comparables** sólo visibles con una muestra mínima de 10 oportunidades y 3 eventos de contacto: tasa de resultado registrado, conversión a Cliente y mediana hasta el primer contacto. Antes de ese umbral la interfaz muestra `—` y explica por qué no corresponde una lectura porcentual.

Las prioridades se derivan de tareas pendientes que no estén bloqueadas por `No contactar`, ordenadas por vencimiento, prioridad y fecha. Cada fila explica la razón de aparecer —por ejemplo, vencida o prioridad alta— y abre la ficha; no envía recordatorios ni propone contactar a una persona.

## Orden recomendado ahora

1. Usar CRM-1 a CRM-4 con datos sintéticos o autorizados para validar filtros, estados, próximo paso y lectura operativa.
2. Cuando se alcance una muestra suficiente, contrastar las métricas contra el historial y ajustar sólo definiciones que resulten ambiguas.

No se deben presentar métricas como conclusiones de negocio hasta que exista una muestra suficiente de uso.

## Validación del flujo base — Punto 1 completado

El 2026-10-08 se recorrió en una base temporal aislada:

1. carga de un hallazgo con teléfono y email ingresados manualmente;
2. revisión y conversión a oportunidad con transferencia separada de ambos datos y origen `Aviso a verificar`;
3. rechazo del intento de contacto antes de completar la verificación (`409`);
4. habilitación del contacto después de revisar la fuente, declarar que admite inmobiliarias y registrar la fecha No Llame para WhatsApp;
5. aceptación del evento manual de contacto tras esa verificación;
6. bloqueo de un nuevo intento al marcar `No contactar` (`409`).

La base temporal y los datos sintéticos usados para la prueba se eliminaron al finalizar. Esta validación no autoriza contacto real ni modifica las condiciones de producción.

## Verificación de CRM-1

Se comprobó localmente que la bandeja:

1. permite buscar y filtrar por estado, barrio, fuente, situación de contacto y fecha de próxima acción;
2. ordena por prioridad/fecha, más recientes o más antiguas;
3. expone el último contacto, la respuesta registrada y la próxima acción sin mostrar teléfono, email ni notas privadas;
4. propone una acción contextual, como **Preparar contacto** o **Registrar resultado**;
5. mantiene la ficha como único lugar para consultar y editar información sensible.

## Verificación de CRM-2

En una base temporal aislada se comprobó que:

1. la señal manual `Declarado en aviso` se guarda y queda visible para filtrar;
2. el resultado `Latente` conserva un evento estructurado y crea una revisión manual fechada;
3. el resultado `No contactar` cambia el estado operativo a bloqueado;
4. un intento comercial posterior a `No contactar` se rechaza (`409`).

La prueba utilizó datos sintéticos y su base temporal fue descartada. No se envió ningún mensaje ni se consultó un portal.

## Verificación de CRM-3

En una segunda base temporal aislada se comprobó que:

1. una oportunidad sintética se convierte en Cliente sólo con confirmación, motivo y fecha;
2. se crea un único cliente que referencia la oportunidad, sin copiar datos de contacto;
3. la oportunidad pasa a `Cliente confirmado` y registra el evento correspondiente;
4. una segunda conversión de la misma oportunidad se rechaza (`409`).

El servidor temporal se detuvo y sus datos sintéticos fueron eliminados al terminar la prueba.

## Verificación de CRM-4

Se verificó visualmente con la cuenta Demo que:

1. la vista Métricas expone sólo datos derivados de la base local;
2. una muestra inferior al umbral muestra conteos y advierte que no hay tasas ni tiempos comparables;
3. las tareas vencidas aparecen como prioridades explicables;
4. la lista excluye oportunidades marcadas `No contactar` y abre la ficha, sin ejecutar ninguna acción externa.

## Fuera de alcance

- scraping o lectura de portales;
- extracción o inferencia automática de contactos;
- envío, programación o lectura de WhatsApp, email, redes o llamadas;
- campañas automáticas;
- asignación de oportunidades a equipos, hasta que se active el piloto multiusuario;
- convertir un aviso, un contacto o una respuesta aislada en cliente de manera automática.
