# Despliegue del piloto: Render + Neon

**Fecha:** 2026-10-08
**Estado:** Render despliega `main` contra Neon PostgreSQL. La rama `dev` se reserva para desarrollo local. Siguen pendientes la prueba funcional con datos sintéticos y todos los controles previos a datos personales reales.

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

Se conectó el repositorio `FerBarreiro/agente-inmobiliario` al servicio existente `agente-inmobiliario-dev`, configurado para desplegar la rama `main`. El nombre y la URL contienen `-dev` por razones históricas, pero no indican la rama de despliegue: la referencia autoritativa es la configuración **Branch = `main`** en Render. El Blueprint `render.yaml` conserva la misma rama para futuras recreaciones:

| Ajuste | Valor |
|---|---|
| Directorio raíz | `web` |
| Rama de despliegue | `main` |
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
6. Promover cambios mediante un commit en `dev`, validación local y merge/push de `dev` a `main`. Render hará el deploy automático desde `main`; no se configura ningún deploy remoto desde `dev`.
7. Antes de utilizar datos personales reales: completar exportación/eliminación, auditoría de acciones sensibles, política de privacidad, retención, recuperación probada y revisión legal local. El despliegue técnico no sustituye esos controles.

## Límites del plan gratuito

Es adecuado para una prueba con pocos usuarios, no para prometer disponibilidad continua: el servicio gratuito de Render puede suspenderse por inactividad y reactivarse con latencia. El plan de Neon también tiene límites de almacenamiento/uso que deben revisarse en el panel vigente antes de cargar información de producción.

No se debe usar la URL de base de datos en el frontend, ni dar acceso de Neon a personas que no administren la infraestructura. La aplicación limita su pool a cinco conexiones (`DATABASE_POOL_MAX` puede ajustarse más adelante si la operación lo justifica).

## Verificación técnica realizada

En una instancia local aislada se verificó que el modo SQLite de desarrollo conserva el flujo de registro, carga de hallazgo de Radar, revisión y conversión a oportunidad. La sintaxis del servidor y de la capa de base compartida fue validada.

El 2026-10-08 se completó la validación externa sin cargar datos personales reales:

- Antes de la promoción, Render compiló y desplegó el commit `bd6457b` de la rama `dev` para validar la infraestructura.
- Neon PostgreSQL se conectó correctamente: el servidor inició, creó el esquema requerido y sembró sólo los ejemplos Demo.
- Render confirmó el health check configurado en `/api/health`.
- `https://agente-inmobiliario-dev.onrender.com/api/health` respondió `{"status":"ok"}`.
- La raíz pública respondió `200` por HTTPS con CSP, HSTS, bloqueo de frames, `nosniff` y política de referencia restrictiva.

La URL pública actual es <https://agente-inmobiliario-dev.onrender.com>. Aunque conserva el sufijo histórico `-dev`, Render despliega desde `main`; no se considera todavía una producción habilitada para datos reales. Un dominio propio y un eventual cambio de nombre/URL se realizarán como una migración explícita para no interrumpir accesos.

## Fuentes operativas

- [Render: Blueprint YAML Reference](https://render.com/docs/blueprint-spec)
- [Render: variables de entorno por defecto](https://render.com/docs/environment-variables)
- [Neon: ramas y cadenas de conexión](https://neon.com/docs/get-started-with-neon/workflow-primer)
- [Neon: conexión agrupada](https://neon.com/docs/manage/endpoints/)
