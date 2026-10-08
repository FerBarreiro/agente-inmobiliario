# Análisis de producto — Agente Inmobiliario

**Fecha de incorporación:** 2026-10-07  
**Documento fuente:** `AGENTE_INMOBILIARIO_PRODUCTO.md` (versión 1.0)  
**Estado:** análisis inicial conservado como fundamento del recorte de producto. El primer incremento ya fue implementado; el estado vigente está en [`ESTADO_ACTUAL_Y_HOJA_DE_RUTA.md`](ESTADO_ACTUAL_Y_HOJA_DE_RUTA.md) y las decisiones del piloto en [`DECISIONES_PILOTO.md`](DECISIONES_PILOTO.md).

## Síntesis ejecutiva

El producto es una plataforma personal de crecimiento para agentes inmobiliarios independientes. Su núcleo no es un CRM genérico, sino ayudar a transformar una meta de captación en una lista diaria, explicable y priorizada de acciones comerciales.

La propuesta tiene un foco sólido y consistente:

```text
Meta de cartera → actividad diaria → seguimiento → captación
                → aprendizaje de ratios → próxima meta
```

La pantalla de trabajo principal es **Hoy**. El elemento diferenciador es el **Goal Engine**, que calcula el trabajo restante a partir de una meta y ratios configurables, y lo conecta con oportunidades, tareas vencidas y demanda activa.

## Alcance recomendado para el primer incremento

Para comprobar la hipótesis central sin construir todavía un CRM amplio, el primer incremento debería contener:

1. Cuenta y perfil individual del agente.
2. Una campaña/meta de captación activa.
3. Contactos y oportunidades de captación con el pipeline definido.
4. Interacciones, próximo paso y fecha obligatorios para oportunidades abiertas.
5. Pantalla **Hoy**: progreso de meta, tareas vencidas/próximas y oportunidades priorizadas por reglas visibles.
6. Goal Engine basado en ratios iniciales editables.
7. Historial de eventos suficiente para calcular actividad y conversión más adelante.

La demanda, propiedades, matching, contenido y Canva siguen siendo partes valiosas del producto, pero deben entrar después de comprobar que el agente vuelve a usar la vista **Hoy** y registra la actividad de captación de manera sostenida.

## Reglas de producto que deben preservarse

- Priorizar la cartera propia y el trabajo diario del agente, no la administración corporativa de una inmobiliaria.
- Explicar todas las prioridades, scores y cálculos: no usar IA ni automatizaciones opacas.
- Conservar el control humano: los mensajes, publicaciones y acciones comerciales requieren confirmación del agente.
- No introducir scraping de propietarios, envíos masivos, publicaciones automáticas ni una app nativa en el MVP.
- Crear eventos de cambio de estado, no solo guardar el estado actual; esto permite métricas, ratios y auditoría confiables.
- Aplicar aislamiento estricto de datos por agente desde el inicio.
- Validar el descubrimiento de oportunidades mediante carga manual y captación entrante antes de agregar fuentes externas; usar solo APIs o acuerdos expresamente autorizados.

## Riesgos y validaciones tempranas

| Riesgo | Validación propuesta |
|---|---|
| El agente no incorpora otra herramienta a su rutina | Prueba de la vista **Hoy** con 3–5 pilotos durante varias semanas. |
| Los ratios iniciales dan recomendaciones irreales | Mostrar estimaciones, permitir editarlas y compararlas con eventos observados tras una muestra suficiente. |
| La carga manual se percibe como burocracia | Reducir cada interacción a pocos campos y exigir solo próximo paso/fecha para oportunidades activas. |
| Demanda y contenido distraen del núcleo de captación | Postergar esas áreas hasta comprobar uso recurrente de metas, tareas y seguimiento. |
| Integraciones condicionan el diseño | Tratar Canva, WhatsApp, calendario y portales como integraciones futuras y validar sus condiciones antes de prometerlas. |
| Datos personales y comerciales quedan expuestos | Diseñar autorización por tenant en servidor, consentimiento/opt-out, auditoría y minimización de datos. |

## Decisiones del piloto ya resueltas

El piloto contempla venta y alquiler residencial en Núñez, Saavedra, Villa Urquiza, Coghlan y Belgrano. Será para un agente individual privado, con una cuenta demo de datos sintéticos y un usuario real inicial; podrá ampliarse a tres pilotos cuando el flujo se estabilice.

Se registrarán manualmente WhatsApp, llamada, Instagram y email. También se acordó una definición auditable del embudo y un conjunto de garantías de privacidad. Ver [`DECISIONES_PILOTO.md`](DECISIONES_PILOTO.md) para el detalle operativo y técnico.

## Decisiones a confirmar durante el descubrimiento

1. Qué ratios iniciales proponer y cuánto podrá editarlos el agente.
2. El tipo de propiedad residencial más frecuente entre los pilotos y los filtros imprescindibles de la ficha.
3. Qué datos sensibles requieren restricciones adicionales además de las definidas para dirección, contacto y documentación.

## Preguntas no bloqueantes para fases posteriores

- Qué plantillas y formatos de contenido realmente usan los pilotos.
- Cuándo importar contactos mediante CSV y qué campos admitir.
- Qué infraestructura y proveedor de autenticación elegir según experiencia del equipo, presupuesto y exigencias de privacidad.
- Qué condiciones comerciales, de permisos y de API aplican a la eventual integración con Canva.

## Criterio para avanzar de fase

El núcleo estará validado cuando los pilotos configuren una meta, vuelvan a la vista **Hoy** para organizarse, registren resultados de acciones y mantengan oportunidades activas con próximo paso durante varias semanas. Solo entonces conviene ampliar el producto con demanda, propiedades, matching y marketing asistido.

Para el descubrimiento de propiedades, la ampliación será progresiva: carga manual, captación entrante y prueba con la API oficial de Mercado Libre. Con tres pilotos activos y evidencia agregada de uso, se preparará una propuesta de integración de metadatos de 60–90 días para Zonaprop o Argenprop. Ver [`ESTRATEGIA_VALIDACION_Y_PORTALES.md`](ESTRATEGIA_VALIDACION_Y_PORTALES.md).
