# Estado actual y hoja de ruta

**Fecha de corte:** 2026-10-08  
**Estado del producto:** prototipo local funcional; validación manual pendiente.  
**Fuente canónica:** este documento determina qué está operativo y qué sigue siendo diseño.

## Objetivo vigente

Validar que un agente inmobiliario independiente puede usar Agente+ para crear y hacer crecer su cartera mediante una rutina simple:

```text
detectar oportunidad → decidir próximo paso → ejecutar → registrar resultado → continuar o cerrar
```

El piloto se limita a venta y alquiler residencial en Núñez, Saavedra, Villa Urquiza, Coghlan y Belgrano. Comienza con una cuenta personal y una Demo; podrá ampliarse hasta tres pilotos cuando el flujo sea estable.

## Estado funcional

| Área | Estado | Observación |
|---|---|---|
| Cuenta Demo | Implementada | Datos sintéticos aislados. |
| Cuenta personal | Implementada localmente | Registro con email y contraseña; no aprobada aún para datos reales. |
| Sesiones | Implementadas | Cookie HTTP-only, `SameSite=Lax`; `Secure` solo en producción. |
| Vista Hoy | Implementada | Oportunidades, conversaciones, captaciones y próximos pasos. |
| Alta manual | Implementada | Fuente, enlace, propiedad, permiso, notas, canal, acción y fecha. |
| Cartera | Implementada | Búsqueda, filtros por estado/barrio y ficha individual. |
| Historial comercial | Implementado | Eventos explícitos; no se infieren resultados desde tareas. |
| Contactos | Vista derivada implementada | El dato se guarda en la oportunidad; todavía no existe entidad independiente. |
| Restricción “No contactar” | Implementada | Fuerza revisión interna y bloquea eventos comerciales en la API. |
| Campañas | No implementadas | Solo existe una presentación demo y una vista informativa. |
| Captación entrante | No implementada | Requiere formulario público, consentimiento y protección antiabuso. |
| Goal Engine | No implementado | La meta demo es ilustrativa; no hay cálculo configurable. |
| Métricas | Datos preparados | Se registran eventos; todavía no existe tablero ni ratios confiables. |
| Radar de oportunidades | Implementado en Demo | Filtros, resultados sintéticos, guardado manual y deduplicación. |
| API de Mercado Libre | Adaptador preparado, no activo | Requiere aplicación registrada, OAuth completo y validación del uso. |
| Zonaprop/Argenprop | Sin integración | Solo existe una estrategia futura de acuerdo de metadatos. |
| Mensajería/redes | Sin integración | Registro manual; ningún envío o lectura automática. |
| Exportación/eliminación | No implementada | Requisito previo al piloto con datos reales. |
| Producción segura | No implementada | Faltan hosting, HTTPS, base administrada, backups y operación. |

## Arquitectura actual

```text
React + TypeScript + Vite
          │
          │ /api, misma aplicación
          ▼
Node.js HTTP server
          │
          ▼
SQLite local: usuarios, sesiones, oportunidades, tareas y eventos
```

- Código de interfaz: `web/src/`.
- API y migraciones: `web/server/index.mjs`.
- Base de desarrollo: `web/data/agente.sqlite`.
- El directorio de datos está excluido de Git.
- La API escucha en `127.0.0.1`; el puerto puede definirse con `PORT`.

## Modelo de dominio operativo

```text
user
 ├── sessions
 ├── opportunities
 │    └── opportunity_events
 └── tasks ──► opportunity
```

La oportunidad contiene por ahora el dato de contacto. Separar una entidad `contacts` solo será conveniente cuando aparezcan relaciones reales de una persona con varias oportunidades, propiedades o campañas; hacerlo antes agregaría complejidad sin evidencia.

## Reglas invariantes

1. Toda consulta o mutación privada se filtra por el usuario autenticado en el servidor.
2. Demo nunca recibe datos personales reales.
3. Una oportunidad abierta conserva un próximo paso explícito.
4. Completar una tarea no crea por sí solo un evento del embudo.
5. Los eventos comerciales se registran de forma deliberada y auditable.
6. “No contactar” se respeta aunque la fuente o el dato sean públicos.
7. No se implementan scraping, extracción de contactos, mensajes masivos ni publicaciones automáticas.
8. Las fuentes externas se incorporan únicamente mediante API oficial, feed o acuerdo autorizado.
9. Se minimizan datos personales; contacto, enlace y notas son opcionales cuando no resultan necesarios.
10. No se cargan datos reales antes de completar los controles de producción.

## Evidencia técnica acumulada

Se verificaron:

- compilación de producción y lint;
- registro, inicio y cierre de sesión;
- aislamiento de datos por `user_id`;
- migración aditiva de la base existente;
- creación de oportunidad, evento inicial y tarea;
- avance de oportunidad y reemplazo del próximo paso;
- cierre de oportunidad;
- rechazo `404` ante acceso cruzado entre cuentas;
- rechazo `409` ante intento comercial sobre `do_not_contact`;
- visualización responsive de Hoy, cartera, alta y ficha.
- consulta del radar Demo, guardado manual y deduplicación `409`.

El detalle reproducible está en [`INCREMENTO_CAPTACION_MANUAL.md`](INCREMENTO_CAPTACION_MANUAL.md).

## Hoja de ruta aprobada

### Etapa A — Validar el circuito manual

**Estado:** actual.

Usar Demo y datos ficticios para revisar si la carga es rápida, si los estados representan el trabajo y si “próximo paso + fecha” es suficiente.

**Criterio de salida:** el flujo puede recorrerse de oportunidad detectada a captada/perdida sin planillas paralelas y sin campos claramente innecesarios.

### Etapa B — Preparar el piloto real

Antes de almacenar datos personales:

- hosting con HTTPS;
- base administrada y cifrada;
- backups y recuperación probados;
- gestión de secretos y monitoreo;
- protección CSRF, rate limiting y endurecimiento de sesión;
- exportación, corrección y eliminación;
- política de privacidad, retención y procedimiento de incidentes;
- revisión legal de consentimiento y comunicaciones.

**Criterio de salida:** checklist de seguridad y privacidad aprobado y prueba de aislamiento automatizada.

### Etapa C — Captación entrante

Construir formulario público controlado por campaña y barrio, texto de consentimiento versionado, confirmación, protección antiabuso y creación automática de oportunidad con fuente `Formulario entrante`.

**Criterio de salida:** una persona puede iniciar voluntariamente una consulta; el agente recibe una oportunidad trazable sin copiar datos desde terceros.

### Etapa D — API oficial de Mercado Libre

**Estado:** modo Demo y adaptador implementados; conexión real pendiente.

El radar está limitado a campos y usos autorizados: filtros de inmuebles, metadatos mínimos, atribución y enlace profundo. No extrae contactos ni envía mensajes. Antes de activarlo faltan registro de aplicación, OAuth completo, credenciales protegidas y confirmación de compatibilidad del uso.

**Criterio de salida:** se puede medir relevancia, publicaciones abiertas, oportunidades guardadas, duplicados y tiempo ahorrado.

### Etapa E — Tres pilotos y evidencia

Incorporar hasta tres agentes con cuentas aisladas. Un piloto se considera activo según los criterios de [`ESTRATEGIA_VALIDACION_Y_PORTALES.md`](ESTRATEGIA_VALIDACION_Y_PORTALES.md).

**Criterio de salida:** uso sostenido, embudo agregado sin datos personales, ausencia de incidentes y evidencia de utilidad.

### Etapa F — Propuesta a Zonaprop o Argenprop

Presentar un piloto de metadatos de 60–90 días, con alcance limitado, atribución, tráfico al portal, métricas agregadas, borrado al finalizar y autorización escrita.

## Pendientes priorizados

### P0 — Antes de validación real

1. Probar el circuito con datos ficticios y registrar observaciones.
2. Permitir editar datos básicos con historial del cambio.
3. Definir reapertura o corrección controlada de cierres.
4. Diseñar exportación y eliminación.
5. Convertir las verificaciones críticas de API en tests automatizados.

### P0 — Antes de datos personales

1. Infraestructura y seguridad de la Etapa B.
2. Aviso de privacidad y consentimiento versionado.
3. Retención, baja, exportación y supresión.
4. Auditoría de acciones sensibles.

### P1 — Después de validar manual

1. Captación entrante.
2. Campañas y metas configurables.
3. Tablero de ratios cuando exista una muestra suficiente.
4. Importación CSV controlada, si los pilotos la necesitan.
5. Activación controlada del radar con la API oficial de Mercado Libre.

## Preguntas abiertas, no bloqueantes

- Qué tipos residenciales usan más los pilotos y qué atributos faltan.
- Qué campos actuales se perciben como burocráticos.
- Cuándo una misma persona necesita múltiples oportunidades o propiedades.
- Qué proveedor de hosting, identidad y base administrada conviene según presupuesto.
- Qué umbral mínimo de eventos permite mostrar ratios sin inducir conclusiones débiles.

## Próxima acción concreta

Recorrer el flujo completo y el radar en Demo, usando oportunidades totalmente ficticias. Las observaciones deben convertirse en ajustes del circuito manual y de los filtros. En paralelo se puede iniciar el registro de la aplicación de Mercado Libre, sin activar datos reales hasta completar OAuth, seguridad y validación contractual.
