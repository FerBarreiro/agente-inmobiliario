# Agente Inmobiliario — Web

Interfaz responsive inicial para el piloto privado del producto. Está construida con React, TypeScript y Vite.

El índice documental está en [`../docs/README.md`](../docs/README.md) y el estado canónico en [`../docs/ESTADO_ACTUAL_Y_HOJA_DE_RUTA.md`](../docs/ESTADO_ACTUAL_Y_HOJA_DE_RUTA.md).

## Ejecutar localmente

```bash
npm install
npm run dev
```

`npm run dev` inicia la interfaz en `http://127.0.0.1:5173` y la API local en `http://127.0.0.1:8787`.

Para crear una versión de producción y validar tipos:

```bash
npm run build
npm run lint
```

## Estado actual

La aplicación implementa una versión interactiva de la pantalla **Hoy** con autenticación y dos cuentas iniciales:

- **Demo:** campaña y datos semilla sintéticos, pensados para recorrer el flujo sin afectar el espacio personal;
- **Mi espacio:** cada usuario crea su cuenta con email y contraseña; sus oportunidades y tareas se guardan aisladas en la base local;
- perfil de cuenta con nombre editable, email de acceso visible, cambio de contraseña verificado y cierre de sesión disponible en escritorio y móvil;
- recuperación de contraseña con enlace temporal de un solo uso; requiere configurar el correo transaccional antes de enviar enlaces reales;
- campaña demo activa para venta y alquiler en los cinco barrios definidos;
- meta y progreso de captación;
- acciones priorizadas, que pueden marcarse como completadas;
- oportunidades explicables y sus próximos pasos;
- alta enriquecida de una oportunidad con fuente, tipo de propiedad, permiso de contacto, enlace, notas y próximo paso;
- ficha de oportunidad con historial comercial auditable;
- registro de contacto, conversación, tasación, propuesta, captación o pérdida;
- búsqueda y filtros de oportunidades, y vista de contactos con su permiso visible;
- radar manual con accesos externos, carga mínima de hallazgos, revisión, descarte y conversión a oportunidad;
- verificación persistente de contacto para oportunidades de portal, con borrador copiable y sin envío automático;
- diseño responsive para escritorio y móvil.

La API local usa SQLite y sesiones HTTP-only; si existe `DATABASE_URL`, utiliza PostgreSQL administrado. No se almacenan contraseñas en texto plano. El servidor aplica controles de producción (origen HTTPS, cabeceras y límites de intentos), pero los datos personales requieren crear y verificar la infraestructura externa antes de operar. La plantilla de configuración es [`.env.example`](.env.example) y las condiciones completas están en [`../docs/PRODUCCION_SEGURA.md`](../docs/PRODUCCION_SEGURA.md).

El flujo de recuperación y la activación de correo están en [`../docs/RECUPERACION_CONTRASENA.md`](../docs/RECUPERACION_CONTRASENA.md). No se habilita un enlace alternativo en pantalla, consola o logs.

## Documentación funcional

El alcance y las pruebas del circuito manual están en [`../docs/INCREMENTO_CAPTACION_MANUAL.md`](../docs/INCREMENTO_CAPTACION_MANUAL.md). El radar está documentado en [`../docs/INCREMENTO_RADAR_OPORTUNIDADES.md`](../docs/INCREMENTO_RADAR_OPORTUNIDADES.md). La estrategia de captación y portales está en [`../docs/ESTRATEGIA_VALIDACION_Y_PORTALES.md`](../docs/ESTRATEGIA_VALIDACION_Y_PORTALES.md).

## Próximo incremento

Validar la carga y el seguimiento con datos ficticios, ajustar el modelo y construir el formulario seguro de captación entrante. Edición avanzada, exportación/eliminación, meta configurable y controles operativos de producción continúan pendientes.
