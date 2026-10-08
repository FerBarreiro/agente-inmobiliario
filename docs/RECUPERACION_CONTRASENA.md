# Recuperación de contraseña

**Estado:** flujo implementado y probado localmente; el envío de correo queda desactivado hasta configurar un proveedor transaccional en Render.

## Propósito y recorrido

Desde la pantalla de acceso, una persona usuaria selecciona **“Olvidé mi contraseña”**, ingresa su email y recibe, si corresponde, un enlace para elegir una contraseña nueva. El enlace vuelve a la aplicación con un parámetro temporal `reset` y no expone datos de cartera, contactos ni sesiones.

```text
email → solicitud genérica → correo con enlace temporal
      → contraseña nueva → revocación de sesiones → nueva sesión
```

La respuesta de la solicitud es igual para un email existente, inexistente, de Demo o con formato inválido. Esto evita confirmar qué direcciones tienen una cuenta.

## Controles implementados

- Token aleatorio de 32 bytes, generado en el servidor y enviado solamente dentro del enlace por correo.
- En la base se almacena únicamente el hash SHA-256 del token, nunca su valor recuperable.
- Vigencia de 30 minutos y un único uso. Pedir un nuevo enlace revoca los anteriores de la misma cuenta.
- Límite de cinco solicitudes por origen cada 15 minutos y tres por dirección hashada cada hora. La confirmación también tiene límite de intentos.
- La nueva contraseña debe tener entre 12 y 256 caracteres.
- Al completarse, se revocan todas las sesiones de la cuenta, se invalidan los tokens pendientes y se crea una sesión nueva para el navegador que usó el enlace.
- El enlace, el token, la contraseña y la dirección destinataria no se escriben en logs de aplicación.
- La cuenta Demo no admite recuperación ni cambios de credenciales.

## Rutas

| Ruta | Respuesta y regla |
|---|---|
| `POST /api/auth/password-reset/request` | Siempre responde `202` con texto genérico si no hay límite de intentos. Sólo genera un token si existe una cuenta personal y el envío está configurado. |
| `POST /api/auth/password-reset/confirm` | Valida token vigente/de un solo uso y contraseña nueva. Responde con una sesión segura nueva. |

Las dos rutas respetan las protecciones de origen de producción. La interfaz utiliza el mismo origen HTTPS de la aplicación.

## Activación de correo en Render

El servidor usa la API HTTP de [Resend](https://resend.com/docs) directamente, por lo que no incorpora una credencial en el navegador ni una dependencia adicional. La API de envío usa `POST https://api.resend.com/emails` con credencial Bearer; el proveedor exige una clave y un remitente/dominio válido. Las credenciales de envío con alcance limitado reducen el impacto de una filtración. [Documentación de envío](https://resend.com/docs/send-with-express) y [permisos de claves](https://resend.com/changelog/new-api-key-permissions).

Para activarlo:

1. Crear una cuenta de Resend y verificar un dominio remitente que controle la persona administradora.
2. Crear una clave con permiso exclusivo de **envío**, restringida a ese dominio cuando el panel lo permita.
3. En **Render → agente-inmobiliario-dev → Environment**, crear los secretos. Ese servicio despliega desde `main` aunque conserva su nombre histórico:
   - `RESEND_API_KEY`: la clave de envío de Resend;
   - `EMAIL_FROM`: por ejemplo, `Agente+ <acceso@tu-dominio-verificado.com>`.
4. Guardar y desplegar. No pegar esas variables en Git, archivos `.env` versionados, capturas ni chats.
5. Crear una cuenta de prueba propia y solicitar la recuperación. Confirmar que el enlace llega, vence luego de 30 minutos y no puede reutilizarse.

Si faltan esas variables o el proveedor no entrega el mensaje, la aplicación responde el mismo texto genérico y elimina el token recién emitido. No se debe habilitar una alternativa que muestre el enlace en pantalla, por consola o en logs.

## Verificación realizada

En una base SQLite temporal se comprobó:

1. con el correo desactivado, la solicitud devuelve la respuesta genérica y no persiste ningún token;
2. un token temporal válido permite fijar una contraseña nueva;
3. el mismo token falla en su segundo uso (`400`);
4. la contraseña anterior falla (`401`) y la nueva permite ingresar (`200`);
5. una sesión existente antes del restablecimiento queda invalidada (`401`).

La entrega real del correo no se probó aún porque requiere que la persona administradora configure el proveedor y el remitente. Hasta entonces, este entorno sigue siendo sólo de validación con datos sintéticos.
