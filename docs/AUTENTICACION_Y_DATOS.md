# Autenticación y datos — base implementada

## Alcance actual

La aplicación ahora contiene una API local y una base SQLite en `web/data/agente.sqlite`. Ese directorio está excluido del control de versiones.

Hay dos clases de cuenta:

| Cuenta | Acceso | Datos |
|---|---|---|
| Demo | Botón “Explorar cuenta demo” | Semillas sintéticas, aisladas de las cuentas personales. |
| Personal | Registro con nombre, email y contraseña | Oportunidades y tareas vinculadas exclusivamente a su `user_id`. |

## Controles implementados

- Las contraseñas se derivan con `scrypt` y una sal aleatoria; nunca se almacenan en texto plano.
- Las sesiones usan tokens aleatorios. La base solo guarda su hash SHA-256.
- La cookie de sesión es `HttpOnly`, `SameSite=Lax` y se marca `Secure` cuando `NODE_ENV=production`.
- Todas las consultas y actualizaciones de oportunidades/tareas filtran por el usuario autenticado en la API, no en la interfaz.
- La API de desarrollo escucha únicamente en `127.0.0.1`.
- La base activa claves foráneas y está excluida de Git.
- Los cuerpos JSON tienen límite de tamaño y se validan los campos admitidos.

## Modelo inicial

```text
users 1 ── N sessions
users 1 ── N opportunities
users 1 ── N tasks
opportunities 1 ── N opportunity_events
opportunities 1 ── N tasks
```

El dominio conserva usuarios, sesiones, oportunidades, tareas y eventos comerciales. La vista **Contactos** se deriva del dato opcional guardado en la oportunidad; todavía no existe una entidad independiente. Campañas, metas configurables y auditoría de acciones sensibles siguen pendientes.

Se verificó que una cuenta no puede registrar eventos sobre oportunidades ajenas (`404`) y que una oportunidad marcada como `do_not_contact` rechaza eventos comerciales (`409`). Estas comprobaciones todavía deben convertirse en tests automatizados antes del piloto real.

## Límite de seguridad de este entorno

La base local resuelve autenticación, sesiones y aislamiento de datos para desarrollo. No debe considerarse una plataforma de producción para información personal real porque el archivo SQLite depende de la seguridad del equipo anfitrión y no ofrece por sí mismo cifrado gestionado, backups ni disponibilidad.

Antes de un piloto con datos reales se requiere:

1. HTTPS en el dominio de despliegue y configuración de cookies `Secure`.
2. Base de datos administrada con cifrado en reposo, backups probados y control de acceso restringido.
3. Secretos fuera del repositorio, rotación y observabilidad.
4. Política de retención, exportación y eliminación de datos.
5. Revisión de autorización, protección CSRF y pruebas de aislamiento entre cuentas.
6. Validación legal local de privacidad y comunicaciones comerciales.
