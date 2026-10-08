# Índice de documentación

**Última revisión integral:** 2026-10-08

Este directorio separa deliberadamente la visión futura, las decisiones vigentes y la implementación comprobada. Una funcionalidad mencionada en el documento de producto no debe considerarse implementada salvo que figure como tal en el estado actual o en un incremento verificado.

## Lectura recomendada

1. [`ESTADO_ACTUAL_Y_HOJA_DE_RUTA.md`](ESTADO_ACTUAL_Y_HOJA_DE_RUTA.md) — fuente canónica para saber qué existe, qué falta y por dónde continuar.
2. [`DECISIONES_PILOTO.md`](DECISIONES_PILOTO.md) — alcance y reglas confirmadas del piloto.
3. [`INCREMENTO_CAPTACION_MANUAL.md`](INCREMENTO_CAPTACION_MANUAL.md) — comportamiento, modelo y pruebas del incremento actual.
4. [`AUTENTICACION_Y_DATOS.md`](AUTENTICACION_Y_DATOS.md) — controles implementados y condiciones pendientes antes de datos reales.
5. [`PRODUCCION_SEGURA.md`](PRODUCCION_SEGURA.md) — controles aplicados y condiciones antes de datos reales.
6. [`DESPLIEGUE_RENDER_NEON.md`](DESPLIEGUE_RENDER_NEON.md) — arquitectura, secretos y secuencia de activación de Render + Neon.
7. [`INCREMENTO_CONTACTO_CONTROLADO.md`](INCREMENTO_CONTACTO_CONTROLADO.md) — checklist, borrador manual y barreras previas al primer contacto.
8. [`ESTRATEGIA_VALIDACION_Y_PORTALES.md`](ESTRATEGIA_VALIDACION_Y_PORTALES.md) — secuencia manual → entrante → evidencia → acuerdos con portales.
9. [`INCREMENTO_RADAR_OPORTUNIDADES.md`](INCREMENTO_RADAR_OPORTUNIDADES.md) — Radar manual, reglas de contacto y crecimiento sin integraciones.

## Catálogo

| Documento | Naturaleza | Estado |
|---|---|---|
| [`AGENTE_INMOBILIARIO_PRODUCTO.md`](AGENTE_INMOBILIARIO_PRODUCTO.md) | Visión amplia, modelo conceptual y backlog de largo plazo. | Fuente original; contiene alcance aspiracional. |
| [`ANALISIS_PRODUCTO.md`](ANALISIS_PRODUCTO.md) | Síntesis y recorte recomendado del producto. | Vigente como orientación. |
| [`DECISIONES_PILOTO.md`](DECISIONES_PILOTO.md) | Decisiones confirmadas y definiciones del embudo. | Vigente. |
| [`REGISTRO_DECISIONES.md`](REGISTRO_DECISIONES.md) | Índice cronológico de decisiones y razones. | Vigente; actualizar ante cambios. |
| [`ESTADO_ACTUAL_Y_HOJA_DE_RUTA.md`](ESTADO_ACTUAL_Y_HOJA_DE_RUTA.md) | Estado canónico y orden de ejecución. | Vigente. |
| [`IMPLEMENTACION_INICIAL.md`](IMPLEMENTACION_INICIAL.md) | Registro del primer prototipo del 2026-10-07. | Histórico; no representa por sí solo el estado actual. |
| [`INCREMENTO_CAPTACION_MANUAL.md`](INCREMENTO_CAPTACION_MANUAL.md) | Especificación y evidencia del incremento del 2026-10-08. | Implementado y verificado localmente. |
| [`INCREMENTO_RADAR_OPORTUNIDADES.md`](INCREMENTO_RADAR_OPORTUNIDADES.md) | Radar manual, hallazgos privados y conversión controlada a oportunidad. | Implementado localmente; sin conexión a portales. |
| [`INCREMENTO_CONTACTO_CONTROLADO.md`](INCREMENTO_CONTACTO_CONTROLADO.md) | Checklist de contacto y borrador copiable. | Implementado localmente; sin envíos ni datos reales. |
| [`AUTENTICACION_Y_DATOS.md`](AUTENTICACION_Y_DATOS.md) | Arquitectura de cuenta, datos y seguridad. | Implementación local; activación externa pendiente. |
| [`PRODUCCION_SEGURA.md`](PRODUCCION_SEGURA.md) | Endurecimiento de producción y precondiciones de datos reales. | Implementado; requiere verificación operativa antes de activarse. |
| [`DESPLIEGUE_RENDER_NEON.md`](DESPLIEGUE_RENDER_NEON.md) | Configuración versionada y activación segura de Render + Neon. | Preparado; recursos externos aún no creados. |
| [`ESTRATEGIA_VALIDACION_Y_PORTALES.md`](ESTRATEGIA_VALIDACION_Y_PORTALES.md) | Estrategia de captación e integraciones autorizadas. | Aprobada; integraciones aún no implementadas. |

## Jerarquía ante diferencias

Cuando dos textos parezcan diferir:

1. las decisiones explícitas más recientes reemplazan supuestos anteriores;
2. `ESTADO_ACTUAL_Y_HOJA_DE_RUTA.md` determina qué está realmente implementado;
3. los documentos de incremento describen el comportamiento comprobado de esa entrega;
4. `AGENTE_INMOBILIARIO_PRODUCTO.md` conserva la visión y no constituye evidencia de implementación;
5. el código y las pruebas pueden revelar una desviación: si ocurre, debe corregirse el código o actualizarse la documentación en el mismo cambio.

## Regla de mantenimiento

Cada incremento debe actualizar, como mínimo:

- estado actual y hoja de ruta;
- registro de decisiones si cambia una regla de producto;
- documento específico del incremento con alcance y pruebas;
- seguridad/datos si cambia el modelo o la exposición de información;
- README técnico si cambian comandos, dependencias o ejecución.

Ninguna integración externa se considera aprobada solo por estar documentada como posibilidad. Requiere términos vigentes, autorización técnica/comercial cuando corresponda y una revisión de privacidad antes de activarse.
