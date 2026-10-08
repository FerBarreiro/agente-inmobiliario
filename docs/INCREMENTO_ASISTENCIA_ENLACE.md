# Incremento 5 — Asistencia local desde enlace en Radar

**Fecha:** 2026-10-08

**Estado:** implementado y verificado localmente en `dev`. No incorpora integraciones, scraping ni consultas a portales.

## Propósito

Reducir la carga repetitiva al registrar un hallazgo sin pedirle a Agente+ que abra, descargue o lea el aviso original.

```text
usuario navega el portal por su cuenta
      → pega el enlace en Radar
      → el navegador interpreta sólo el texto de esa URL
      → sugiere datos mínimos editables
      → usuario verifica y guarda el hallazgo privado
```

El aviso no es cargado automáticamente desde el portal: el usuario sigue siendo quien decide qué referencia, precio y observación propia conservar.

## Comportamiento implementado

Al pegar una URL válida en **Cargar hallazgo**, la interfaz la procesa localmente para:

- reconocer el dominio de Zonaprop, Argenprop, Mercado Libre u `Otro`;
- sugerir el portal;
- sugerir barrio, operación o tipo de propiedad sólo si el texto de la URL contiene una coincidencia clara;
- generar una referencia neutral, con un identificador sólo cuando ya forma parte de la URL;
- marcar el hallazgo como `Asistida por URL`.

Todas las sugerencias permanecen editables y la pantalla advierte que deben compararse con el aviso original antes de guardar. Si el enlace es incompleto o inválido, no se ofrecen sugerencias y no puede guardarse hasta corregirlo.

El usuario también puede elegir **Completar manualmente** después de pegar un enlace. Esa elección descarta las sugerencias aplicadas, reinicia los campos sugeridos y registra el hallazgo como `manual`.

El precio queda vacío: no se intenta inferirlo ni se toma contenido, texto, imágenes o metadatos del portal.

## Límites técnicos y de datos

El navegador no hace `fetch`, no abre una pestaña invisible y el servidor no realiza solicitudes salientes para esta función. Sólo se analiza la cadena que el usuario pegó.

En consecuencia, este incremento no:

- lee el HTML, DOM, Open Graph, imágenes ni descripción de un aviso;
- extrae teléfonos, emails, nombres, redes sociales o cualquier dato de contacto;
- navega, busca, indexa o monitorea portales;
- envía mensajes ni modifica una publicación;
- sustituye una API, feed autorizado o acuerdo de datos.

La lectura automatizada de contenido desde una URL sería una funcionalidad distinta y no forma parte de esta etapa. Para Zonaprop, sus términos prohíben utilizar máquinas, software, herramientas o agentes distintos de las herramientas provistas para navegar o buscar en el sitio, y también restringen los usos comerciales no autorizados. [Términos de Zonaprop](https://www.zonaprop.com.ar/terminos.bum).

## Trazabilidad

La tabla `radar_items` incorpora el campo `capture_method` con dos valores admitidos:

| Valor | Significado |
|---|---|
| `manual` | El usuario descartó las sugerencias y completó la ficha manualmente. |
| `url_assisted` | La interfaz interpretó únicamente la URL aportada por el usuario para proponer campos editables. |

La etiqueta se muestra en cada tarjeta de Radar y se conserva cuando el hallazgo se convierte en oportunidad mediante un evento de historial. No constituye una validación del portal, una autorización de contacto ni una garantía de exactitud de los datos.

## Protección operativa

1. El usuario sigue navegando directamente cada portal y verifica el aviso por su cuenta.
2. El enlace no habilita datos de contacto ni cambia las barreras existentes de revisión, restricciones del aviso y No Llame.
3. Las sugerencias incompletas no se completan por defecto con supuestos: los campos siguen siendo confirmables y editables.
4. Un enlace de `Otro` se clasifica como tal; no se intenta reconocer ni recuperar contenido de nuevos portales.
5. El Radar continúa guardando solamente una referencia mínima, URL, clasificación, precio opcional y notas propias.

## Verificación realizada

- compilación de producción;
- lint y sintaxis del servidor;
- creación de un hallazgo con `capture_method = url_assisted` en una base temporal;
- comprobación de ambos métodos de procedencia y de su conservación al convertir el hallazgo;
- chequeo de que el servidor no posee rutas de importación ni solicitudes HTTP salientes para Radar.

## Evolución posible

Una fuente oficial sólo podrá agregarse con su propio método de procedencia —por ejemplo, `authorized_api`— una vez confirmado el permiso, el alcance de datos y los controles de privacidad. No debe reutilizarse la etiqueta `Asistida por URL` para presentar contenido recuperado desde un portal.
