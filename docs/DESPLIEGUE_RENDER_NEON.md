# Despliegue del piloto: Render + Neon

**Fecha:** 2026-10-08
**Estado:** despliegue de validación activo en Render sobre `dev`; Neon PostgreSQL conectado. Siguen pendientes la prueba funcional con datos sintéticos, revisión antes de integrar `main` y todos los controles previos a datos personales reales.

## Decisión

El piloto se desplegará como una única aplicación Node.js en **Render** y usará **Neon PostgreSQL** como base administrada. Es el camino más directo para esta arquitectura: la interfaz React compilada y la API comparten el mismo servicio, mientras la base no depende del disco efímero del hosting.

Se mantiene SQLite únicamente para desarrollo local y staging técnico sin datos personales. Cuando existe `DATABASE_URL`, la aplicación utiliza PostgreSQL y crea/actualiza su esquema al iniciar.

```text
Navegador del usuario
        │ HTTPS
        ▼
Render · servicio web Node.js
        │ TLS + DATABASE_URL (secreto)
        ▼
Neon · PostgreSQL administrado
```

## Qué queda versionado

- [`../render.yaml`](../render.yaml) describe el servicio de Render: directorio `web`, compilación, inicio y health check.
- [`../web/server/database.mjs`](../web/server/database.mjs) selecciona SQLite local o PostgreSQL según exista `DATABASE_URL`.
- [`../web/.env.example`](../web/.env.example) enumera variables sin incluir valores sensibles.

`render.yaml` nunca contiene la cadena de Neon. La entrada `DATABASE_URL` usa `sync: false`: Render solicita/configura el secreto en su panel, no en Git.

## Recursos a crear

### 1. Neon

Crear un proyecto PostgreSQL para el piloto y conservar la rama inicial como `main`. En **Connection details**, copiar la **pooled connection string** con TLS (`sslmode=require`). No pegarla en el repositorio, documentación, tickets ni chat; se cargará directamente como secreto de Render.

Para futuras pruebas de esquema se debe crear una rama Neon separada; nunca probar cambios contra la rama que contiene datos del piloto.

### 2. Render

Se conectó el repositorio `FerBarreiro/agente-inmobiliario` y se creó el servicio de validación `agente-inmobiliario-dev` desde la rama `dev`. El Blueprint `render.yaml` conserva esta configuración para reproducirla:

| Ajuste | Valor |
|---|---|
| Directorio raíz | `web` |
| Build | `npm ci --include=dev && npm run build` |
| Inicio | `npm start` |
| Health check | `/api/health` |
| Plan inicial | Free |
| Secret obligatorio | `DATABASE_URL` de Neon |

Render provee `PORT` y, en producción, `RENDER_EXTERNAL_URL`. La aplicación utiliza esa URL HTTPS como origen permitido de forma automática. Si luego se conecta un dominio propio, se debe agregar `APP_ORIGIN=https://dominio-propio` y desplegar nuevamente.

## Secuencia de activación

1. Crear los dos recursos, sin cargar datos reales todavía. **Completado el 2026-10-08.**
2. Pegar la pooled connection string de Neon en `DATABASE_URL` dentro de **Render → Environment** y elegir guardar y desplegar. La contraseña queda sólo en el gestor de secretos de Render. **Completado.**
3. Esperar un deploy exitoso y comprobar `https://<servicio>.onrender.com/api/health`. **Completado:** el servicio respondió `{"status":"ok"}`.
4. Ingresar a la aplicación, crear una cuenta de prueba y recorrer: hallazgo manual → revisión → oportunidad → checklist de contacto. Confirmar también que Demo y la cuenta personal no ven datos entre sí. **Siguiente paso.**
5. Configurar en Neon una revisión periódica del uso y de las copias/recuperación disponibles en el plan elegido. Documentar quién conserva acceso a Neon y Render.
6. Tras la validación con datos sintéticos, revisar el cambio, integrar `dev` en `main` y recién entonces cambiar la rama del servicio a `main`.
7. Antes de utilizar datos personales reales: completar exportación/eliminación, auditoría de acciones sensibles, política de privacidad, retención, recuperación probada y revisión legal local. El despliegue técnico no sustituye esos controles.

## Límites del plan gratuito

Es adecuado para una prueba con pocos usuarios, no para prometer disponibilidad continua: el servicio gratuito de Render puede suspenderse por inactividad y reactivarse con latencia. El plan de Neon también tiene límites de almacenamiento/uso que deben revisarse en el panel vigente antes de cargar información de producción.

No se debe usar la URL de base de datos en el frontend, ni dar acceso de Neon a personas que no administren la infraestructura. La aplicación limita su pool a cinco conexiones (`DATABASE_POOL_MAX` puede ajustarse más adelante si la operación lo justifica).

## Verificación técnica realizada

En una instancia local aislada se verificó que el modo SQLite de desarrollo conserva el flujo de registro, carga de hallazgo de Radar, revisión y conversión a oportunidad. La sintaxis del servidor y de la capa de base compartida fue validada.

El 2026-10-08 se completó la validación externa sin cargar datos personales reales:

- Render compiló y desplegó el commit `bd6457b` de la rama `dev`.
- Neon PostgreSQL se conectó correctamente: el servidor inició, creó el esquema requerido y sembró sólo los ejemplos Demo.
- Render confirmó el health check configurado en `/api/health`.
- `https://agente-inmobiliario-dev.onrender.com/api/health` respondió `{"status":"ok"}`.
- La raíz pública respondió `200` por HTTPS con CSP, HSTS, bloqueo de frames, `nosniff` y política de referencia restrictiva.

La URL del entorno de validación es <https://agente-inmobiliario-dev.onrender.com>. No se considera producción funcional con datos reales: sigue dedicada a pruebas sintéticas de la rama `dev`.

## Fuentes operativas

- [Render: Blueprint YAML Reference](https://render.com/docs/blueprint-spec)
- [Render: variables de entorno por defecto](https://render.com/docs/environment-variables)
- [Neon: ramas y cadenas de conexión](https://neon.com/docs/get-started-with-neon/workflow-primer)
- [Neon: conexión agrupada](https://neon.com/docs/manage/endpoints/)
