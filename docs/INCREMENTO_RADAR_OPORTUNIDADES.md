# Incremento 2 — Radar de oportunidades

**Fecha:** 2026-10-08  
**Estado:** modo Demo implementado y verificado; conector oficial preparado pero no activado.  
**Proveedor previsto:** API oficial de Mercado Libre.

## Objetivo

Permitir que el agente explore publicaciones inmobiliarias por zona sin navegar repetidamente el portal, manteniendo control humano y sin convertir el radar en una herramienta de extracción de contactos.

```text
criterios del agente
  → búsqueda de metadatos autorizados
  → revisión del aviso original
  → guardado manual como oportunidad
  → próximo paso “Revisar publicación original”
```

Guardar una publicación no implica que el anunciante sea propietario, que acepte intermediación ni que exista autorización para contactarlo.

## Estado exacto

### Implementado

- sección **Radar** en la navegación;
- filtros por barrio, operación, tipo de propiedad, moneda y rango de precio;
- resultados sintéticos para los cinco barrios del piloto;
- identificación visible del modo Demo;
- metadatos mínimos: título, zona, operación, propiedad, precio, ambientes, superficie y fecha;
- enlace profundo a la publicación original cuando el conector oficial está activo; los resultados Demo no muestran enlaces porque no representan propiedades reales;
- acción humana para guardar un resultado como oportunidad;
- fuente `Mercado Libre`, enlace e identificador externo en la oportunidad;
- deduplicación por usuario, proveedor e identificador externo;
- indicador “Ya guardada” al repetir la búsqueda;
- ausencia deliberada de teléfono, email, dirección exacta y mensajes automáticos;
- adaptador de servidor para categorías dinámicas y búsqueda geográfica de la API oficial.

### No implementado o no activado

- datos reales en el radar;
- registro de una aplicación de Mercado Libre;
- pantalla OAuth, callback, refresh y revocación de tokens;
- almacenamiento cifrado de credenciales;
- ejecución periódica o alertas;
- historial de cambios de una publicación;
- descarte, archivo o preferencias persistentes del radar;
- detección confiable de “dueño directo”;
- contacto con anunciantes.

## Diseño del modo Demo

Los resultados Demo son completamente sintéticos y usan identificadores con prefijo `DEMO-`. No representan propiedades reales. Permiten validar:

- utilidad de filtros;
- cantidad de información necesaria para decidir si abrir un aviso;
- claridad del paso de publicación a oportunidad;
- comprensión de que revisar no equivale a contactar;
- necesidad de descartar, guardar o comparar resultados.

## Conector oficial preparado

El servidor solo intenta usar datos reales cuando existen simultáneamente:

```text
MERCADOLIBRE_RADAR_ENABLED=true
MERCADOLIBRE_ACCESS_TOKEN=<token oficial>
```

El token se lee exclusivamente en el servidor y nunca se devuelve a la interfaz. Esta configuración es adecuada únicamente para una prueba técnica controlada porque todavía no implementa el ciclo OAuth completo ni renovación de token.

### Flujo técnico

1. Consultar la categoría raíz de inmuebles `MLA1459`.
2. Resolver dinámicamente la categoría de propiedad y operación; los identificadores no se fijan como constantes porque pueden cambiar.
3. Consultar `sites/MLA/search` con categoría y caja geográfica del barrio.
4. Limitar la consulta a 30 resultados y aplicar timeout de 10 segundos.
5. Normalizar solo metadatos utilizados por la interfaz.
6. Aplicar moneda y rango de precio.
7. Comparar identificadores con oportunidades ya guardadas por el usuario.

Las categorías resueltas se mantienen en memoria durante 30 minutos para reducir llamadas. No existe recolección masiva ni sincronización en segundo plano.

## Coordenadas y alcance geográfico

La primera implementación utiliza cajas geográficas aproximadas para Núñez, Saavedra, Villa Urquiza, Coghlan y Belgrano. Son un mecanismo técnico inicial, no límites catastrales. Durante una prueba real se deberá medir:

- falsos positivos en barrios limítrofes;
- avisos omitidos por geolocalización imprecisa;
- necesidad de reemplazar cajas por IDs oficiales de ubicación cuando el proveedor los exponga para la búsqueda.

## Persistencia y deduplicación

Se agregaron a `opportunities`:

- `external_source`;
- `external_id`.

Existe un índice único parcial por `user_id + external_source + external_id`. El mismo aviso puede ser guardado por usuarios diferentes, pero no dos veces por la misma cuenta.

El radar no conserva un espejo del catálogo: solo se persiste un resultado cuando el agente decide convertirlo en oportunidad.

## API local

### `GET /api/radar`

Requiere sesión y acepta:

- `neighborhood`;
- `operation`;
- `propertyType`;
- `currency`;
- `minPrice` opcional;
- `maxPrice` opcional.

Devuelve `mode: demo|live`, proveedor, aviso operativo y resultados. En modo real, un error del proveedor devuelve `502` sin filtrar token ni detalles sensibles.

### `POST /api/opportunities`

Admite `externalId` al guardar desde el radar. Si la publicación ya existe para ese usuario devuelve `409`.

## Reglas legales, contractuales y de privacidad

1. Usar exclusivamente la API oficial; nunca scraping, robots o endpoints privados.
2. El acceso real requiere aplicación registrada y OAuth.
3. Client secret, access token y refresh token deben permanecer protegidos y cifrados.
4. Mostrar atribución y conservar el enlace al aviso original.
5. No replicar un catálogo completo ni usar el contenido para competir con el portal.
6. No extraer, inferir ni almacenar contacto del anunciante desde el radar.
7. No automatizar mensajes.
8. Respetar restricciones del aviso y validar la base legal antes de cualquier contacto.
9. Revisar nuevamente términos, permisos, cuotas y retención antes de activar el modo real.

Fuentes oficiales revisadas:

- [Mercado Libre — Localizar inmuebles](https://developers.mercadolibre.com.ar/es_ar/como-empezar/localizar-inmuebles).
- [Mercado Libre — Ítems y búsquedas](https://developers.mercadolibre.com.ar/es_ar/usuarios-y-aplicaciones/items-y-busquedas).
- [Mercado Libre — OAuth y tokens](https://developers.mercadolibre.com.ar/es_ar/recomendaciones-de-autorizacion-y-token).
- [Mercado Libre — Términos del Programa de Desarrolladores](https://developers.mercadolibre.com.ar/es_ar/es-ar-terminos-y-condiciones).
- [Mercado Libre — Control de acceso](https://developers.mercadolibre.com.ar/es_ar/como-empezar/control-de-acceso-y-autorizacion).

## Verificación realizada

El 2026-10-08 se verificó en una base temporal:

1. consulta Demo autenticada por barrio, operación, propiedad y moneda;
2. estructura y minimización de los resultados;
3. guardado de un resultado sintético como oportunidad (`201`);
4. persistencia del proveedor e identificador externo;
5. rechazo de un segundo guardado del mismo resultado (`409`);
6. resultado marcado como guardado en consultas posteriores;
7. migración aditiva sobre una base existente;
8. compilación, lint y sintaxis del servidor;
9. revisión visual responsive del formulario, aviso de modo y tarjeta de resultado.

No se realizó una llamada real a Mercado Libre porque todavía no se proporcionaron ni configuraron credenciales oficiales.

## Condiciones para activar datos reales

1. Registrar la aplicación con una finalidad compatible con los términos de Mercado Libre.
2. Confirmar que este caso de uso —radar privado con enlace de salida— está permitido para la aplicación.
3. Implementar OAuth completo, renovación, revocación y almacenamiento cifrado.
4. Configurar cuotas, logs sin secretos y monitoreo de errores.
5. Probar categorías, atributos y precisión geográfica con pocos resultados.
6. Aprobar privacidad, retención y eliminación.
7. Activar primero para una cuenta de prueba y revisar métricas e incidentes.

## Próxima validación de producto

Usar el modo Demo para responder:

- qué filtros faltan;
- si precio, ambientes y superficie bastan para decidir;
- si conviene guardar, descartar o posponer;
- cómo debe explicarse la diferencia entre “publicación interesante” y “oportunidad de captación legítima”;
- si el agente realmente ahorra tiempo frente a navegar el portal.
