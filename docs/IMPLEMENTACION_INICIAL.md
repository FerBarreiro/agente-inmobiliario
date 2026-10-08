# Implementación inicial — 2026-10-07

> **Documento histórico.** Describe el primer hito del 2026-10-07. Para el estado vigente consultar [`ESTADO_ACTUAL_Y_HOJA_DE_RUTA.md`](ESTADO_ACTUAL_Y_HOJA_DE_RUTA.md) y [`INCREMENTO_CAPTACION_MANUAL.md`](INCREMENTO_CAPTACION_MANUAL.md).

## Entregable creado

Se inicializó la aplicación web en `web/` con **React 19, TypeScript y Vite**. Es un prototipo funcional del primer flujo de producto, no un sistema conectado a datos reales.

## Funcionalidad disponible

| Área | Implementado |
|---|---|
| Cuentas iniciales | **Demo**, con datos semilla sintéticos, y cuentas personales creadas con email y contraseña. |
| Vista “Hoy” | Meta, progreso, proyección, plan semanal y panel de acciones. |
| Campaña demo | Venta y alquiler residencial en Núñez, Saavedra, Villa Urquiza, Coghlan y Belgrano. |
| Tareas | Se muestran por prioridad y se pueden completar en la sesión actual. |
| Oportunidades | Se muestran con score explicable, estado, motivo y próximo paso. |
| Alta de oportunidad | En este hito era un formulario mínimo con nombre/referencia, barrio y operación. Fue ampliado en el incremento siguiente. |
| Datos demo | Nombres y situaciones ficticias, identificados como tales. |
| Diseño | Web responsive, apta para escritorio y móvil. |

## Límites intencionales

- Los datos se almacenan en SQLite mediante una API local y se separan por `user_id`; los de Demo se mantienen sintéticos y aislados.
- La API implementa creación de cuenta, inicio/cierre de sesión y sesión HTTP-only.
- No se hacen envíos, integraciones de mensajería, scraping ni publicación de contenido.
- La base SQLite local no reemplaza los controles de producción: debe desplegarse con HTTPS, secretos, cifrado de almacenamiento administrado, backups y monitoreo antes de contener datos personales reales.
- La señal de demanda es ilustrativa; el matching real está planificado para una fase posterior.

## Criterios aplicados

La interfaz preserva los principios del producto: priorización transparente, próximo paso visible, control humano y una experiencia centrada en la actividad diaria. Las definiciones de eventos comerciales y obligaciones de privacidad vigentes están en `DECISIONES_PILOTO.md`.

## Verificación realizada

El 2026-10-07 se verificó:

1. Compilación de producción con `npm run build`.
2. Lint con `npm run lint`.
3. Carga visual de la pantalla principal en navegador local.
4. Inicio de sesión de la cuenta Demo desde la API local.
5. Separación lógica de registros por usuario en la API y la base SQLite.
6. Alta de una oportunidad demo y creación de su acción inicial asociada.

## Siguiente paso técnico propuesto

La capa de dominio de captación manual ya incorpora fuente, permiso de contacto, próximo paso e historial de eventos. Su alcance y verificación están documentados en [`INCREMENTO_CAPTACION_MANUAL.md`](INCREMENTO_CAPTACION_MANUAL.md).

El siguiente trabajo es validar este circuito con datos ficticios, ajustar los campos y luego implementar el formulario de captación entrante. Exportación/eliminación, edición avanzada, meta configurable y controles de producción siguen pendientes.

En captación, el orden aprobado es: carga manual, captación entrante y luego una prueba limitada con la API oficial de Mercado Libre. Los acuerdos con otros portales no bloquean esta fase; se evaluarán cuando haya tres pilotos activos y evidencia de uso conforme a [`ESTRATEGIA_VALIDACION_Y_PORTALES.md`](ESTRATEGIA_VALIDACION_Y_PORTALES.md).
