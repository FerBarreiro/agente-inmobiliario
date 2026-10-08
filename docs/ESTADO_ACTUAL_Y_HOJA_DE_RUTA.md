# Estado actual y hoja de ruta

**Fecha de corte:** 2026-10-08  
**Estado del producto:** prototipo funcional desplegado desde `main` en Render + Neon; prueba funcional sintética pendiente.
**Fuente canónica:** este documento determina qué está operativo y qué sigue siendo diseño.

## Objetivo vigente

Validar que un usuario inmobiliario independiente puede usar Agente+ para crear y hacer crecer su cartera mediante una rutina simple:

```text
detectar oportunidad → decidir próximo paso → ejecutar → registrar resultado → continuar o cerrar
```

El piloto se limita a venta y alquiler residencial en Núñez, Saavedra, Villa Urquiza, Coghlan y Belgrano. Comienza con una cuenta personal y una Demo; podrá ampliarse hasta tres pilotos cuando el flujo sea estable.

## Estado funcional

| Área | Estado | Observación |
|---|---|---|
| Cuenta Demo | Implementada | Datos sintéticos aislados. |
| Cuenta personal | Implementada localmente | Registro con email y contraseña; no aprobada aún para datos reales. |
| Sesiones | Implementadas | Token aleatorio hashado; cookie HTTP-only, `SameSite=Strict` y `Secure` en producción. |
| Perfil y cierre de sesión | Implementados | Nombre visible editable, email de acceso de solo lectura, cambio de contraseña con invalidación de otras sesiones y Demo inmutable. |
| Recuperación de contraseña | Implementada; entrega pendiente | Solicitud genérica, token hashado de un uso y revocación de sesiones. Falta configurar correo transaccional y probar la entrega real. |
| Vista Hoy | Implementada | Oportunidades, conversaciones, captaciones y próximos pasos. |
| Alta manual | Implementada | Fuente, enlace, propiedad, permiso, notas, canal, acción y fecha. |
| Cartera | Implementada | Búsqueda, filtros por estado/barrio y ficha individual. |
| Historial comercial | Implementado | Eventos explícitos; no se infieren resultados desde tareas. |
| Contactos | Vista derivada implementada | El dato se carga manualmente en la oportunidad con origen y preferencia; todavía no existe entidad independiente. |
| Restricción “No contactar” | Implementada | Fuerza revisión interna y bloquea eventos comerciales en la API. |
| Verificación de contacto en portales | Implementada localmente | Checklist, bloqueo, borrador copiable y control de servidor; sin envíos ni consulta automática de No Llame. |
| Seguimiento y precio manual | Implementado localmente | Preferencias “seguimiento acordado”, “latente”, “no continuar” y “no contactar”; tareas de revisión y observaciones de precio sin monitoreo externo. |
| Campañas | No implementadas | Solo existe una presentación demo y una vista informativa. |
| Captación entrante | No implementada | Requiere formulario público, consentimiento y protección antiabuso. |
| Goal Engine | No implementado | La meta demo es ilustrativa; no hay cálculo configurable. |
| Métricas | Datos preparados | Se registran eventos; todavía no existe tablero ni ratios confiables. |
| Radar de oportunidades | Implementado manualmente | Hallazgos privados, enlace original, asistencia local para clasificar una URL, revisión, descarte y conversión directa a oportunidad sin datos de contacto. Sin conexión ni lectura de portales. |
| API de Mercado Libre | Diferida | El Radar manual sigue activo; requiere consulta escrita que confirme el uso de captación, además de OAuth, seguridad y evidencia de pilotos. |
| Zonaprop/Argenprop | Sin integración | Accesos manuales desde Radar; acuerdo de metadatos sólo como etapa futura. |
| Mensajería/redes | Sin integración | Registro manual; ningún envío o lectura automática. |
| Exportación/eliminación | No implementada | Requisito previo al piloto con datos reales. |
| Producción segura | Infraestructura activa | Render despliega `main` contra Neon con PostgreSQL, HTTPS, health check, cabeceras y límites de intentos verificados. `dev` se usa localmente. Faltan pruebas funcionales sintéticas, backups/recuperación, operación y controles previos a datos reales. |

## Arquitectura actual

```text
React + TypeScript + Vite
          │
          │ /api, misma aplicación
          ▼
Node.js HTTP server
          │
          ├── SQLite local (desarrollo)
          └── PostgreSQL administrado (producción, mediante `DATABASE_URL`)
```

- Código de interfaz: `web/src/`.
- API y migraciones: `web/server/index.mjs`.
- Base de desarrollo: `web/data/agente.sqlite`; producción prevista: Neon PostgreSQL.
- El directorio de datos está excluido de Git.
- En desarrollo la API escucha en `127.0.0.1`; en producción requiere origen HTTPS y configuración explícita. Ver [`PRODUCCION_SEGURA.md`](PRODUCCION_SEGURA.md) y [`DESPLIEGUE_RENDER_NEON.md`](DESPLIEGUE_RENDER_NEON.md).

## Modelo de dominio operativo

```text
user
 ├── sessions
 ├── password_reset_tokens
 ├── radar_items
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
8. Para oportunidades de portal, un contacto saliente exige checklist `ready`; WhatsApp y llamada requieren constancia manual de verificación No Llame.
9. El Radar manual conserva sólo referencias cargadas por el usuario; una integración externa futura requerirá API oficial, feed o acuerdo autorizado.
10. Se minimizan datos personales; contacto, enlace y notas son opcionales cuando no resultan necesarios.
11. No se cargan datos reales antes de completar los controles de producción.

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
- flujo manual de Radar: carga de hallazgo, revisión, descarte y conversión a oportunidad.
- controles de staging: health check, rechazo de escrituras sin origen autorizado y cabeceras de seguridad de producción.

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

### Etapa D — Validar Radar manual

**Estado:** implementado localmente.

El usuario navega manualmente los portales, carga una referencia mínima y conserva un enlace al aviso original. Un hallazgo en revisión puede convertirse directamente en oportunidad, con verificación de contacto pendiente. No hay consultas de servidor a terceros, datos de contacto en Radar ni mensajes automáticos. El detalle operativo y legal está en [`INCREMENTO_RADAR_OPORTUNIDADES.md`](INCREMENTO_RADAR_OPORTUNIDADES.md).

**Criterio de salida:** se puede medir cuántos hallazgos se revisan, descartan o convierten y si se ahorra trabajo sin replicar catálogos.

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

1. Recorrer el flujo público completo con cuentas y datos sintéticos, incluida la separación Demo/personal.
2. Aviso de privacidad y consentimiento versionado.
3. Retención, baja, exportación y supresión.
4. Auditoría de acciones sensibles.

### P1 — Después de validar manual

1. Captación entrante.
2. Campañas y metas configurables.
3. Tablero de ratios cuando exista una muestra suficiente.
4. Importación CSV controlada, si los pilotos la necesitan.
5. Con tres pilotos y autorización escrita, evaluar una integración oficial de metadatos con un portal.

## Preguntas abiertas, no bloqueantes

- Qué tipos residenciales usan más los pilotos y qué atributos faltan.
- Qué campos actuales se perciben como burocráticos.
- Cuándo una misma persona necesita múltiples oportunidades o propiedades.
- Qué proveedor de hosting, identidad y base administrada conviene según presupuesto.
- Qué umbral mínimo de eventos permite mostrar ratios sin inducir conclusiones débiles.

## Próxima acción concreta

Recorrer el flujo completo de Radar manual con enlaces de prueba: cargar un hallazgo, revisarlo, descartarlo y convertirlo en oportunidad sin incorporar datos de contacto. Las observaciones deben convertirse en ajustes del circuito manual antes de evaluar integraciones externas.
