# Decisiones iniciales del piloto

**Fecha:** 2026-10-07  
**Estado:** decisiones confirmadas para el descubrimiento, prototipo y primera implementación privada.

## Segmento y alcance

| Decisión | Definición inicial |
|---|---|
| Operación | Venta y alquiler residencial. |
| Zona de inicio | Núñez, Saavedra, Villa Urquiza, Coghlan y Belgrano, Ciudad de Buenos Aires. |
| Cuenta inicial | Un agente individual, de uso privado. No habrá colaboración, roles de equipo ni acceso compartido en esta etapa. |
| Prueba | Un usuario real al inicio, con posibilidad de ampliar a tres usuarios piloto una vez que el flujo esté estable. |
| Usuario demo | Cuenta separada con datos ficticios y semilla reproducible; nunca debe contener datos personales ni propiedades reales. |
| Espacio personal | Base separada para la información propia del agente, con cuenta individual, sesión HTTP-only y datos asociados al usuario en la base local. Antes de datos personales reales debe desplegarse con controles de producción. |
| Canales registrados | WhatsApp, llamada, Instagram y email. En la primera versión se registran manualmente; no se envían mensajes ni se accede a cuentas externas. |
| Descubrimiento de oportunidades | Primero carga manual y captación entrante; luego un radar controlado mediante la API oficial de Mercado Libre. Sin scraping ni recolección automática de datos de contacto. |
| Portales futuros | Con evidencia de uso y tres pilotos activos, proponer a Zonaprop o Argenprop un acuerdo escrito de metadatos por 60–90 días. |

## Definiciones operativas del embudo

Las métricas se calcularán a partir de eventos explícitamente registrados. Un evento no se infiere de forma automática por el contenido de un mensaje.

| Evento | Cuándo se registra | Cuenta para |
|---|---|---|
| `opportunity_detected` | Se carga una señal de posible propietario o propiedad. | Oportunidades detectadas. |
| `contact_attempted` | El agente realiza un intento saliente individual por uno de los cuatro canales. No requiere respuesta. | Contactos. |
| `conversation_started` | Hay intercambio bilateral sustantivo sobre la posible operación: respuesta a un contacto o consulta entrante relevante. | Conversaciones. |
| `valuation_scheduled` | Propietario y agente acuerdan fecha para reunión, tasación o presentación de servicio. | Agenda y seguimiento, no ratio final. |
| `valuation_completed` | La reunión/tasación efectivamente ocurrió. | Tasaciones/reuniones del embudo. |
| `proposal_sent` | Se entrega una tasación o propuesta de servicios. | Seguimiento comercial. |
| `property_captured` | El propietario confirma que el agente puede comercializar la propiedad; se registra si existe exclusividad. | Captaciones y cumplimiento de meta. |
| `opportunity_lost` | La oportunidad se cierra sin captación, con motivo y fecha. | Pérdidas y aprendizaje. |

Por defecto, el Goal Engine utilizará los ratios `contact_attempted → conversation_started → valuation_completed → property_captured`. Las reuniones agendadas se muestran como indicador de avance, pero no sustituyen una tasación efectivamente realizada.

## Reglas de privacidad y seguridad del piloto

1. Aislamiento estricto por usuario en el servidor: ninguna consulta puede devolver datos de otra cuenta, aunque la interfaz falle.
2. Cifrado en tránsito, almacenamiento gestionado y protegido, y URLs firmadas de corta duración para fotos y documentos.
3. Dirección exacta, teléfonos, emails y documentos se muestran solo cuando son necesarios; evitar exponerlos en listados, notificaciones y registros de error.
4. Registro de auditoría de accesos y acciones sensibles, con metadatos mínimos y sin volcar contenido sensible.
5. Opciones de exportación y eliminación de datos; consentimiento y baja/opt-out visibles en cada contacto.
6. Secretos fuera del código y con rotación posible; copias de seguridad y recuperación verificables antes de uso con datos reales.
7. Sin scraping, mensajes masivos, envío automático ni publicación automática durante el piloto.
8. La cuenta demo utiliza exclusivamente datos sintéticos claramente identificados como tales.

## Implicación para la primera implementación

El primer incremento puede concentrarse en una cuenta individual, la cuenta demo, contactos, campañas, meta, oportunidades, tareas, interacciones y la vista **Hoy**. El modelo debe conservar `operation` (venta/alquiler) y los cinco barrios como datos filtrables desde el comienzo.

Demanda, propiedades, matching, contenidos, Canva e integraciones de canal quedan fuera del primer incremento funcional, aunque los modelos de datos pueden prepararse para incorporarlos sin migraciones disruptivas.

La estrategia aprobada, sus métricas de validación y las condiciones del eventual acuerdo con portales están detalladas en [`ESTRATEGIA_VALIDACION_Y_PORTALES.md`](ESTRATEGIA_VALIDACION_Y_PORTALES.md).

El primer circuito manual implementado, su modelo de eventos y los límites actuales están documentados en [`INCREMENTO_CAPTACION_MANUAL.md`](INCREMENTO_CAPTACION_MANUAL.md).
