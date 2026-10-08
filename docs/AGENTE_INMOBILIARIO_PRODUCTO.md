# Agente Inmobiliario — Documento de producto y base de desarrollo

**Versión:** 1.0  
**Estado:** base para validación y desarrollo de MVP  
**Mercado inicial:** agentes inmobiliarios independientes y equipos pequeños de Argentina  
**Principio rector:** la aplicación ayuda al agente a construir una cartera propia de forma sistemática.

---

## 1. Resumen ejecutivo

**Agente Inmobiliario** es un sistema personal de crecimiento para agentes inmobiliarios. No busca administrar toda una inmobiliaria: convierte el objetivo de construir cartera en un plan comercial concreto, ayuda a no perder oportunidades y transforma la información de propiedades, propietarios y compradores en acciones y contenido de marketing.

La promesa de producto es:

> **Construí tu cartera.** La app te dice qué hacer cada día para captar más propiedades, atender mejor a tus contactos y hacer crecer tu negocio inmobiliario.

El ciclo que debe unir el producto es:

```text
Objetivo → prospección → contacto → seguimiento → tasación → captación
         → comercialización → demanda → operación → referidos → aprendizaje
```

La primera versión debe resolver ese ciclo con una experiencia simple, móvil y personal. No debe intentar reemplazar desde el inicio los sistemas corporativos, portales, herramientas de tasación o suites de marketing completas.

---

## 2. Visión, usuario y problema

### Visión

Que un agente pueda construir un negocio inmobiliario propio, aunque cambie de oficina, franquicia o modalidad de trabajo. Su activo profesional permanece con él: relaciones, territorio, conocimiento del mercado, cartera, marca personal, historial y métricas comerciales.

### Usuario inicial

**Usuario principal:** agente inmobiliario independiente o agente de un equipo pequeño, que trabaja sobre una o pocas zonas y combina WhatsApp, Instagram, llamadas, planillas, notas y memoria para gestionar su actividad.

**Perfil inicial recomendable:**

- trabaja en venta y/o alquiler residencial;
- se especializa en una zona y un tipo de propiedad;
- ya tiene contactos, compradores o algunas propiedades, pero seguimiento inconsistente;
- quiere captar más propiedades, no solo gestionar las que ya tiene;
- necesita una herramienta simple que pueda usar durante el día desde el teléfono.

### Problema

La necesidad principal del agente es captar propiedades para vender o alquilar. Esa tarea suele quedar expresada de forma imprecisa: “necesito conseguir más propiedades”. Sin objetivos operativos ni seguimiento consistente, se pierden conversaciones, se enfrían propietarios y es difícil saber qué acciones generan resultados.

Los problemas que el producto debe atacar son:

1. **La captación no se traduce en un plan diario.** El agente conoce la meta, pero no sabe cuántos contactos, seguimientos o tasaciones necesita.
2. **La información está fragmentada.** WhatsApp, Instagram, notas, contactos del teléfono y planillas no producen una vista confiable de las oportunidades.
3. **El seguimiento depende de la memoria.** Personas que pidieron ser contactadas más adelante, tasaciones enviadas y conversaciones sin respuesta se pierden.
4. **La demanda no se aprovecha para captar.** Tener compradores activos buscando una tipología debería generar argumentos y prioridades de captación.
5. **El marketing requiere demasiado trabajo repetitivo.** Cargar la propiedad y luego recrear piezas para redes en Canva consume tiempo y rompe la consistencia visual.
6. **No existe aprendizaje personal claro.** El agente no sabe de qué canales provienen sus captaciones ni dónde convierte mejor.

### Trabajo que el usuario contrata

> “Ayudame a convertir mi objetivo de cartera en las conversaciones, seguimientos y contenidos que debo hacer hoy; y enseñame qué me funciona para captar más propiedades.”

---

## 3. Propuesta de valor y posicionamiento

### Posicionamiento

No es “un CRM para inmobiliarias”. Es una **plataforma personal de crecimiento para agentes inmobiliarios**.

| Enfoque tradicional | Enfoque Agente Inmobiliario |
|---|---|
| Inmobiliaria → agentes → propiedades → leads | Agente → relaciones → territorio → cartera → negocio |
| Registro y administración | Acción diaria y construcción de cartera |
| Propiedad → contenido | Objetivo/demanda → contenido que ayuda a captar |
| Panel vacío de CRM | Prioridades claras para hoy |
| Métricas genéricas | Ratios y aprendizajes del agente |

### Diferencial defendible

El diferencial no es, por sí solo, tener CRM, IA, templates de Canva o generación automática de contenido: esos componentes ya existen en el mercado. El núcleo diferencial es el **Goal Engine**, que conecta todos los componentes:

```text
Meta de cartera
       ↓
Ratios comerciales del agente
       ↓
Plan de actividad diario y semanal
       ↓
Priorización de oportunidades y seguimientos
       ↓
Uso de demanda para captar
       ↓
Contenido de marketing alineado a la necesidad de captación
       ↓
Resultados, aprendizaje y ajuste de la próxima meta
```

La pregunta que el producto debe responder todos los días es:

> **¿Qué debería hacer hoy para acercarme a mi objetivo de cartera?**

---

## 4. Nicho y contexto competitivo

### Nicho inicial

**Productividad, prospección y captación para agentes inmobiliarios independientes.**

El producto debe ser personal antes que corporativo. Puede funcionar para un agente que hoy está dentro de una inmobiliaria y mañana trabaja por su cuenta, sin que la oficina sea condición técnica para usarlo.

### Referencias competitivas a observar

| Referencia | Fortalezas conocidas | Implicación para el producto |
|---|---|---|
| Llavik (Argentina) | Radar de dueños, prospección, CRM, marketing y tasación | No competir inicialmente en scraping o provisión masiva de datos de propietarios. Observar su experiencia de captación. |
| VendéPro (Argentina) | Pipeline comercial, objetivos y métricas | El pipeline por sí solo no diferencia; la experiencia diaria debe ser más accionable y personal. |
| Valoris (Argentina) | CRM móvil, asistencia IA, marketing y organización diaria | La propuesta debe superar el “asistente/CRM” con estrategia de cartera y aprendizaje de conversiones. |
| Closer Estate LATAM | CRM y Social Maker | El diseño de contenido no es suficiente: debe estar conectado a la estrategia comercial. |
| Vulcan7 (internacional) | Prospección de listings, fuentes de oportunidades, CRM y contacto | Confirma que captación es un problema por el que se paga; su modelo depende fuertemente de datos y contexto de EE. UU. |
| Canva Real Estate, Xara, Properti | Creación y automatización de marketing inmobiliario | Canva será una capa de producción/edición, no el corazón del producto. |
| ClarityNOW y herramientas de accountability | Objetivos y actividad diaria | La oportunidad es unir accountability con contactos, demanda, contenidos y resultados reales. |

### Decisión estratégica inicial

No construir en el MVP una base propia de dueños ni automatizar scraping de portales. El agente podrá cargar oportunidades obtenidas por sus propios canales: referido, WhatsApp, Instagram, cartel, red personal, llamada, contacto directo o portales. Así se reduce complejidad técnica, dependencia de terceros y riesgo legal.

---

## 5. Pilares de producto

### 5.1 Captación

Ayudar a encontrar, priorizar, contactar y convertir propietarios en propiedades captadas.

Capacidades:

- campañas de captación por zona, tipología, operación y rango de precio;
- registro de oportunidades/propietarios y origen;
- pipeline de captación;
- prioridad de oportunidad basada inicialmente en reglas transparentes;
- mensajes sugeridos según contexto;
- recordatorios automáticos de seguimiento;
- registro del motivo de pérdida o postergación;
- análisis de origen y conversión de captaciones.

### 5.2 Gestión comercial

Evitar que se pierdan oportunidades de propietarios, compradores y operaciones.

Capacidades:

- contactos centralizados;
- tareas y próximos pasos obligatorios en oportunidades activas;
- historial cronológico de interacciones;
- pipeline claro para captación y demanda;
- alertas de contactos enfriados;
- vista “Hoy” como pantalla de trabajo principal.

### 5.3 Demanda

Convertir compradores/inquilinos activos en una ventaja de captación.

Capacidades:

- fichas de búsqueda: zona, tipo, ambientes, presupuesto, requisitos y urgencia;
- coincidencias entre demanda y propiedades u oportunidades de captación;
- mensajes y piezas de captación basados en demanda activa;
- visibilidad de segmentos con alta demanda y baja oferta.

### 5.4 Marketing automatizado

Reducir el trabajo repetitivo de transformar una propiedad o necesidad de captación en contenido consistente con la marca del agente.

Capacidades:

- perfil de marca personal: nombre, matrícula, logo, colores, tipografías, contacto y CTA;
- templates por tipo de contenido;
- generación de textos, ángulos y llamados a la acción;
- prellenado de templates de Canva con datos e imágenes;
- enlace para continuar editando en Canva;
- calendario de contenidos sugerido.

El contenido debe responder a dos objetivos distintos:

1. **Promocionar una propiedad existente**: lanzamiento, historia, carrusel, reel, recordatorio, reducción de precio, reservada o vendida.
2. **Generar captación y autoridad**: búsqueda de propietarios, compradores activos, tasación, guía de venta, información de zona y contenido de marca personal.

---

## 6. Goal Engine

### Objetivo

Transformar una meta comercial en actividad accionable, y aprender con el tiempo los ratios reales del agente.

Ejemplo de configuración:

- período: octubre;
- meta: captar 5 propiedades;
- zona: Olivos/Vicente López;
- especialización: departamentos de 2 a 4 ambientes;
- operación: venta;
- ticket: USD 100.000–250.000.

### Lógica inicial

El embudo de captación mínimo es:

```text
Oportunidades detectadas → contactos → conversaciones → reuniones/tasaciones → captaciones
```

Para una meta de `G` captaciones, el motor estima los volúmenes previos mediante ratios. En la primera etapa se usan ratios configurables por defecto; después se priorizan los observados para cada agente.

```text
tasaciones_necesarias    = G / ratio_tasacion_a_captacion
conversaciones_necesarias = tasaciones_necesarias / ratio_conversacion_a_tasacion
contactos_necesarios      = conversaciones_necesarias / ratio_contacto_a_conversacion
```

Ejemplo ilustrativo de ratios iniciales:

```text
20 contactos → 8 conversaciones → 3 tasaciones → 1 captación
```

Para captar 5 propiedades, la estimación inicial sería aproximadamente 100 contactos, 40 conversaciones y 15 tasaciones. El plan semanal y diario debe distribuir el volumen pendiente según días hábiles restantes, capacidad declarada y tareas vencidas.

### Reglas de diseño del Goal Engine

- Mostrar que las cifras son **estimaciones**, no promesas.
- Permitir modificar ratios iniciales y objetivos.
- Explicar el cálculo de forma breve y visible.
- Diferenciar métricas de resultado (captaciones) de métricas controlables (contactos, conversaciones, seguimientos, reuniones).
- Aprender solo con eventos explícitamente registrados y suficientes observaciones; evitar conclusiones fuertes con pocos datos.
- Recomendar acciones sin ocultar el criterio de prioridad.

### Resultado esperado en la pantalla de inicio

```text
Objetivo de octubre: 5 captaciones
Progreso: 2 / 5
Proyección actual: 4

Para mantener el plan esta semana:
- 10 contactos nuevos
- 3 seguimientos de propietarios
- 1 tasación/reunión

Prioridad: hay 2 propietarios compatibles con demanda activa.
```

---

## 7. Captación: flujo y priorización

### Campaña de captación

Una campaña encuadra el trabajo en un territorio concreto. Campos mínimos:

- nombre;
- zona o barrios;
- tipo de propiedad;
- operación (venta/alquiler);
- rango de precio;
- objetivo de captaciones;
- período;
- estado: activa, pausada o finalizada.

### Pipeline de captación

Estados recomendados para el MVP:

1. **Detectada** — existe una señal u oportunidad.
2. **Pendiente de contacto** — definida para acción inicial.
3. **Contactada** — se intentó establecer contacto.
4. **En conversación** — existe intercambio activo.
5. **Seguimiento** — requiere retomar en una fecha concreta.
6. **Tasación/reunión** — se acordó o realizó una instancia comercial.
7. **Propuesta enviada** — se entregó tasación o propuesta de servicio.
8. **Captada** — se convierte en propiedad de cartera.
9. **No avanza/perdida** — conservar motivo y fecha.

### Señales de oportunidad y score inicial

El score no debe simular inteligencia opaca. En el MVP puede ser una suma de reglas editables, por ejemplo:

- coincide con campaña de zona/tipología/precio;
- demanda activa compatible;
- propietario directo o referido;
- publicación antigua o reducción de precio, cuando ese dato fue cargado manualmente;
- interacción reciente;
- seguimiento vencido;
- alta intención declarada.

La ficha debe explicar por qué una oportunidad tiene prioridad: “coincide con dos compradores activos”, “referido”, “seguimiento comprometido para hoy”.

### Asistente de contacto

Ante cada oportunidad, ofrecer:

- un mensaje editable de WhatsApp o correo;
- el objetivo de ese contacto (abrir conversación, conseguir reunión, retomar propuesta);
- el contexto utilizado para redactarlo;
- acciones posteriores rápidas: no respondió, respondió, no interesado, contactar más adelante, reunión/tasación, captada.

El sistema no debe enviar mensajes sin confirmación del agente en el MVP.

---

## 8. Gestión y demanda

### Gestión: principio de “próximo paso”

Toda oportunidad activa debe tener un próximo paso y una fecha, o quedar expresamente cerrada/perdida. La interfaz debe hacer visible la excepción: “7 oportunidades sin movimiento hace más de 10 días”.

### Demanda: ficha de búsqueda

Campos mínimos:

- contacto solicitante;
- tipo de operación;
- zonas deseadas;
- tipo de propiedad, ambientes, dormitorios y superficie;
- presupuesto y moneda;
- requisitos (balcón, cochera, apto crédito, mascotas, etc.);
- urgencia;
- estado: nueva, activa, visitando, negociando, pausada, cerrada/perdida;
- origen;
- próximo paso;
- notas.

### Match demanda–oferta/captación

El MVP puede generar coincidencias por reglas de atributos. Debe mostrar:

- compradores compatibles con una propiedad captada;
- oportunidades de captación compatibles con una búsqueda activa;
- segmentos con mucha demanda y pocas propiedades activas.

Ejemplo de recomendación:

> Tenés cuatro compradores activos para 3 ambientes en Olivos entre USD 120.000 y USD 170.000. Priorizá oportunidades que coincidan con ese segmento y utilizá esa demanda como argumento de contacto.

---

## 9. Marketing y Canva

### Experiencia objetivo

El agente no debería buscar un template manualmente. Desde la propiedad o la recomendación comercial, debe poder elegir una pieza y recibir un diseño prellenado, editable en Canva.

Flujo deseado:

```text
Propiedad / necesidad comercial
  → elegir tipo de contenido
  → IA propone ángulo, títulos y copy
  → se completa un template con datos, imágenes y marca
  → agente revisa
  → abre/edita en Canva
  → marca el contenido como creado o publicado
```

### Tipos de contenido iniciales

**Para propiedades:** post de lanzamiento 1:1, story 9:16, carrusel de características, portada de reel, “bajó de precio”, “reservada” y “vendida”.

**Para captación:** “busco propiedades”, “tengo compradores activos”, invitación a tasar, guía de venta y contenido de mercado/barrio.

### Datos de template

Ejemplos de campos dinámicos:

```text
BARRIO, PRECIO, MONEDA, AMBIENTES, DORMITORIOS, M2,
CARACTERISTICA_DESTACADA, FOTO_1..N, NOMBRE_AGENTE, MATRICULA,
LOGO, TELEFONO, INSTAGRAM, CTA
```

### Alcance técnico recomendado

La integración con Canva debe validarse antes de comprometer una funcionalidad comercial: acceso a APIs, tipos de cuentas permitidos, autorización por usuario, límites, disponibilidad regional y condiciones de uso pueden cambiar. Para el MVP, es válido comenzar con:

1. templates base y exportación/manualidad controlada;
2. deep link a Canva y guía de datos a completar;
3. integración de prellenado cuando la cuenta y la API lo permitan.

No incluir programación automática de publicaciones en redes en el MVP. Mantener la publicación bajo control explícito del agente.

---

## 10. MVP: alcance, exclusiones y criterio de éxito

### Objetivo del MVP

Comprobar que un agente usa el sistema para sostener su actividad de captación, no pierde seguimientos y percibe que el plan diario le ayuda a avanzar hacia una meta real.

### Incluido

- autenticación individual;
- perfil de agente y territorio/especialidad;
- contactos;
- campañas y metas de captación;
- oportunidades y pipeline de captación;
- tareas, recordatorios y vista “Hoy”;
- demanda/búsquedas activas;
- propiedades captadas con datos, fotos y estado básico;
- recomendación básica por reglas de prioridad y match de demanda;
- Goal Engine con ratios configurables y métricas simples;
- historial de interacciones;
- generación de borradores de mensajes/copy;
- base de marca y templates/contenidos iniciales;
- panel de métricas de actividad, conversión y origen.

### Excluido de la primera versión

- scraping de portales o bases masivas de propietarios;
- envío automático/bulk de WhatsApp, email o llamadas;
- integración con MLS, portales inmobiliarios o publicación automática;
- automatización de redes sociales;
- facturación, comisiones complejas, contabilidad o administración de una inmobiliaria;
- CRM multi-oficina con roles avanzados;
- tasación automatizada como fuente de verdad;
- IA predictiva compleja o score no explicable;
- app nativa: una web responsive/PWA es suficiente inicialmente.

### Hipótesis a validar

1. El agente abre la vista “Hoy” de forma recurrente y completa acciones.
2. El Goal Engine convierte una meta difusa en acciones que el agente considera útiles.
3. El recordatorio con contexto reduce oportunidades sin seguimiento.
4. Mostrar demanda compatible mejora la calidad o prioridad de la captación.
5. Las piezas prellenadas reducen tiempo de producción de contenido sin perder control creativo.

---

## 11. Flujos UX prioritarios

### Flujo 1 — Onboarding y primera meta

1. Crear cuenta.
2. Definir perfil: nombre, datos profesionales, zonas, tipo de operación y especialidad.
3. Elegir objetivo del período: cantidad de captaciones y fechas.
4. Definir ratios iniciales o aceptar los sugeridos.
5. Crear una campaña de captación.
6. Llegar a “Hoy” con el primer conjunto de acciones sugeridas.

### Flujo 2 — Cargar oportunidad y hacer seguimiento

1. Tocar “Nueva oportunidad”.
2. Elegir o crear contacto.
3. Cargar origen, zona, tipo de propiedad, precio estimado y señal relevante.
4. Asociar a campaña.
5. Ver prioridad y coincidencias de demanda.
6. Copiar/editar un mensaje sugerido o registrar llamada/contacto.
7. Registrar resultado.
8. El sistema exige próximo paso/fecha si sigue abierta.

### Flujo 3 — Tasación a captación

1. Desde una oportunidad, registrar reunión/tasación.
2. Adjuntar o anotar propuesta enviada.
3. Agendar seguimiento.
4. Marcar “captada” al cerrar.
5. Crear una propiedad desde los datos disponibles y conservar vínculo con la oportunidad/origen.
6. Actualizar progreso del objetivo y ratios.

### Flujo 4 — Demanda como argumento de captación

1. Crear búsqueda de comprador/inquilino.
2. Activar criterios y presupuesto.
3. Ver coincidencias con propiedades y oportunidades.
4. Abrir una oportunidad compatible.
5. Generar un mensaje contextual editable: hay demanda concreta para una propiedad de esas características.

### Flujo 5 — Propiedad a contenido

1. Abrir una propiedad captada.
2. Seleccionar “Generar contenido”.
3. Elegir objetivo: promoción de propiedad, captación o autoridad.
4. Elegir formato y template.
5. Revisar los datos, fotos, propuesta de copy y CTA.
6. Crear borrador, abrirlo en Canva si la integración está disponible y marcar estado de publicación.

### Flujo 6 — Revisión diaria

La home no debe ser una grilla de módulos. Debe priorizar:

1. progreso hacia la meta;
2. acciones pendientes y vencidas;
3. oportunidades de mayor prioridad;
4. demanda o propiedades compatibles;
5. recomendación de contenido, si es relevante para la meta actual.

---

## 12. Modelo de datos inicial

### Entidades principales

| Entidad | Propósito | Campos mínimos |
|---|---|---|
| `User` | Cuenta y preferencias de acceso | id, email, nombre, zona horaria, estado |
| `AgentProfile` | Identidad y especialidad del agente | user_id, matrícula, teléfono, bio, zonas, operaciones, estilo de marca |
| `Contact` | Persona relacionada con el negocio | id, agent_id, nombre, teléfono, email, rol(es), origen, consentimiento/opt-out, notas |
| `CaptureCampaign` | Territorio y objetivo de captación | id, agent_id, nombre, zonas, tipo, operación, rango, período, meta, estado |
| `Goal` | Meta medible del período | id, agent_id, campaña_id opcional, métrica, objetivo, actual, inicio, fin, estado |
| `ConversionProfile` | Ratios por agente/campaña | id, scope, contactos_a_conversación, conversación_a_tasación, tasación_a_captación, muestras, vigencia |
| `Opportunity` | Posible captación | id, agent_id, contact_id, campaña_id, estado, score, origen, tipología, zona, precio_estimado, motivo_pérdida |
| `Property` | Propiedad de cartera | id, agent_id, opportunity_id opcional, estado, operación, dirección restringida, zona, atributos, precio, exclusividad |
| `DemandRequest` | Búsqueda de comprador/inquilino | id, agent_id, contact_id, operación, zonas, criterios, presupuesto, estado, urgencia |
| `Task` | Próxima acción o recordatorio | id, agent_id, entidad_relacionada, tipo, fecha, prioridad, estado, descripción |
| `Interaction` | Evento comercial e historial | id, agent_id, contact_id, entidad_relacionada, canal, tipo, resultado, fecha, notas |
| `Match` | Compatibilidad calculada | id, demand_request_id, target_type, target_id, score, razones, estado |
| `ContentItem` | Pieza de marketing | id, agent_id, property_id opcional, campaign_id opcional, tipo, objetivo, copy, template_ref, estado, enlace_canva |
| `BrandKit` | Variables de marca | id, agent_id, logo, colores, tipografías, CTA, datos_profesionales |
| `MediaAsset` | Fotos, videos y archivos | id, owner_type, owner_id, storage_key, tipo, orden, metadatos |
| `AuditEvent` | Trazabilidad y datos sensibles | id, agent_id, actor, acción, entidad, fecha, metadata mínima |

### Relaciones clave

```text
AgentProfile 1—N Contact
AgentProfile 1—N CaptureCampaign 1—N Opportunity
AgentProfile 1—N Goal
Contact 1—N Opportunity / DemandRequest / Interaction
Opportunity 0..1—1 Property
Property 1—N MediaAsset / ContentItem
DemandRequest N—N Property u Opportunity (mediante Match)
Cada entidad comercial 1—N Task / Interaction
```

### Estados y eventos

Guardar cambios de estado como eventos, no solo como valor actual. Es indispensable para calcular conversiones, tiempos entre etapas y oportunidades enfriadas. Ejemplos: `opportunity_contacted`, `conversation_started`, `valuation_scheduled`, `proposal_sent`, `property_captured`, `task_completed`, `content_created`.

---

## 13. Arquitectura sugerida de alto nivel

### Principios

- web responsive, rápida y utilizable desde móvil;
- monolito modular antes que microservicios;
- API y modelo de dominio claros para permitir integraciones futuras;
- datos comerciales y archivos protegidos por usuario/tenant desde el inicio;
- automatizaciones asíncronas para recordatorios, cálculos y generación de contenido;
- IA como asistencia revisable, nunca como acción autónoma de contacto.

### Componentes

```text
[Web responsive / PWA]
          |
          v
[API de aplicación + autenticación]
          |
  +-------+--------+-----------------+
  |                |                 |
  v                v                 v
[Base relacional] [Almacenamiento] [Cola/cron de trabajos]
  |                |                 |
  v                v                 v
Dominio comercial  Fotos/documentos  recordatorios, métricas,
Goal Engine                         match y generación de borradores
          |
          v
[Capa de integraciones]
Canva / mensajería autorizada / calendarios / IA / analítica
```

### Stack orientativo, no decisión cerrada

- **Frontend:** TypeScript + framework web moderno con renderizado híbrido; UI accesible y PWA.
- **Backend:** API TypeScript/Node o framework full-stack equivalente, organizada por módulos de dominio.
- **Base de datos:** PostgreSQL para relaciones, filtros y analítica de embudos.
- **Archivos:** almacenamiento de objetos compatible con URLs firmadas; no almacenar binarios en la base.
- **Jobs:** cola o scheduler para recordatorios, recálculo de prioridades, métricas y conectores.
- **Autenticación:** proveedor administrado con email/contraseña y recuperación segura; añadir OAuth solo cuando aporte valor.
- **Observabilidad:** errores, auditoría de acciones sensibles y métricas de uso desde el primer despliegue.

Para el prototipo privado, se puede elegir infraestructura de bajo costo y despliegue administrado. La elección concreta debe seguir la experiencia del equipo y el nivel de privacidad requerido, no preceder la validación del flujo.

### Módulos de aplicación

1. Identidad y perfil de agente.
2. Contactos y consentimiento.
3. Objetivos, campañas y Goal Engine.
4. Oportunidades y captación.
5. Propiedades y media.
6. Demanda y matching.
7. Tareas, agenda e interacciones.
8. Contenido y marca.
9. Reportes, métricas y auditoría.
10. Integraciones.

---

## 14. Integraciones futuras

| Integración | Valor | Prioridad | Consideración |
|---|---|---:|---|
| Canva | Prellenado/edición de piezas coherentes | Alta, posterior a core CRM | Validar acceso API, permisos y plan de cuenta. |
| WhatsApp | Iniciar conversaciones y registrar contexto | Media | No automatizar envíos masivos; requerir acción y consentimiento. |
| Calendario | Reuniones, tasaciones y recordatorios | Media | Puede empezar con enlaces o exportación de eventos. |
| Email | Seguimientos y propuestas | Media | Consentimiento, trazabilidad y entregabilidad. |
| IA generativa | Copy, resumen, sugerencia de acción y clasificación asistida | Media | Salida editable; no inventar datos de propiedades ni asesoramiento legal. |
| Portales/MLS | Importación/publicación de propiedades | Baja para MVP | Depende de acuerdos, APIs y reglas de cada plataforma. |
| Redes sociales | Publicación/medición | Baja para MVP | Requiere permisos de plataforma y revisión de políticas. |
| Telefonía | Registro de llamadas y notas | Baja | Evaluar privacidad, consentimiento y costos. |

---

## 15. Consideraciones legales, de privacidad y seguridad

Esta sección no sustituye asesoramiento legal. Antes de una salida comercial en Argentina, validar el diseño con asesoría especializada en protección de datos, comunicaciones comerciales, consumo y normativa inmobiliaria local.

### Principios obligatorios de producto

- Tratar solo los datos necesarios para prestar el servicio.
- Informar claramente qué se guarda, con qué finalidad y durante cuánto tiempo.
- Permitir al agente editar, exportar y eliminar datos bajo su control, sujeto a obligaciones legales aplicables.
- Registrar y respetar bajas/opt-out en comunicaciones promocionales.
- No diseñar el producto alrededor de scraping indiscriminado de datos personales ni contacto automatizado masivo.
- No enviar mensajes, publicar contenidos o tomar decisiones comerciales en nombre del usuario sin confirmación explícita.
- Restringir datos de una cuenta a ese agente/tenant; aplicar autorización a nivel de servidor, no solo en la interfaz.
- Cifrar comunicaciones, proteger secretos, usar URLs firmadas para archivos y mantener auditoría de accesos/acciones sensibles.
- Minimizar exposición de direcciones, teléfonos, documentos e imágenes privadas.
- Separar roles futuros de agente, asistente y administrador con permisos explícitos.

### Contexto normativo a revisar

- Ley argentina de protección de datos personales y derechos de los titulares.
- Reglas aplicables al tratamiento de información de fuentes públicas y a comunicaciones de marketing.
- Registro Nacional No Llame y normativa aplicable al contacto telefónico comercial.
- Normas provinciales/locales y de matrícula relativas a publicidad inmobiliaria, representación, precios y datos de propiedades.
- Términos de uso y políticas de APIs de Canva, WhatsApp, redes sociales y portales antes de integrar.

---

## 16. Métricas de producto y negocio

### Métricas de resultado del agente

- captaciones por período;
- cartera activa y variación neta;
- exclusivas vs. no exclusivas;
- tiempo medio de oportunidad detectada a captación;
- origen de cada captación;
- valor o volumen de cartera, si el usuario decide cargarlo.

### Métricas de actividad y conversión

- oportunidades detectadas;
- contactos realizados;
- conversaciones iniciadas;
- seguimientos realizados a tiempo;
- reuniones/tasaciones;
- propuestas enviadas;
- conversión por etapa y por origen;
- oportunidades sin próximo paso o sin actividad durante un umbral;
- cumplimiento del plan semanal.

### Métricas de demanda y contenido

- búsquedas activas;
- matches creados y trabajados;
- segmentos con demanda sin oferta;
- piezas creadas y piezas publicadas (declaradas por el usuario);
- tiempo estimado ahorrado en preparación de contenido;
- consultas atribuidas al contenido, solo cuando el agente las registre de manera explícita.

### Métricas de adopción del producto

- activación: usuario que configura una meta, crea una campaña y registra la primera oportunidad;
- recurrencia semanal: usuarios que completan tareas o registran interacciones;
- proporción de oportunidades activas con próximo paso;
- retención a 4 y 8 semanas;
- percepción cualitativa: “sé qué hacer hoy” y “no pierdo seguimientos”.

### Métrica norte inicial

**Cantidad de acciones de captación con próximo paso completadas por agente activo por semana**, acompañada por evolución de captaciones. Mide uso del hábito sin confundirla con ventas, que tienen ciclos largos y factores externos.

---

## 17. Roadmap propuesto

### Fase 0 — Descubrimiento y validación (antes de construir en serio)

- entrevistar a 8–12 agentes independientes sin presentar primero la solución;
- relevar cómo consiguen propiedades, qué seguimiento abandonan, qué usan hoy y qué no pagan/usarían;
- probar un prototipo de la vista “Hoy” y del Goal Engine;
- conseguir 3–5 usuarios piloto comprometidos a cargar actividad semanalmente;
- definir una hipótesis de segmento: zona, seniority, tipo de operación y tamaño de equipo.

### Fase 1 — Fundaciones del MVP

- autenticación y perfil;
- contactos;
- campañas/metas;
- oportunidades con pipeline;
- tareas e interacciones;
- vista “Hoy”;
- ratios configurables y progreso básico.

**Hito:** un agente puede pasar una oportunidad desde detección hasta captación sin salir del producto para recordar el siguiente paso.

### Fase 2 — Demanda, propiedades y aprendizaje básico

- búsquedas activas;
- propiedades captadas;
- matching basado en reglas;
- alertas de oportunidades enfriadas;
- embudos, origen y ratios observados;
- recomendaciones explicables de prioridad.

**Hito:** el producto puede sugerir qué oportunidad contactar por ajuste a la meta y demanda activa.

### Fase 3 — Marketing asistido

- Brand Kit;
- modelos de copy y contenido;
- templates iniciales;
- flujo de exportación/edición en Canva;
- calendario sugerido ligado a propiedades, demanda y captación.

**Hito:** una propiedad cargada puede convertirse en una pieza utilizable con mínima edición.

### Fase 4 — Integraciones y producto comercial

- integración Canva validada;
- calendarios y mensajería autorizada;
- importaciones/exportaciones;
- permisos de equipo;
- facturación, soporte, onboarding guiado y analítica de negocio;
- evaluación de integraciones con portales según acuerdos.

---

## 18. Requerimientos iniciales de desarrollo

### Funcionales — prioridad P0

- registro e inicio de sesión;
- aislamiento de datos por usuario;
- CRUD de contactos, campañas, metas, oportunidades, tareas, interacciones, demandas y propiedades;
- pipeline de oportunidades con cambios de estado auditables;
- próxima acción/fecha obligatoria en oportunidades activas;
- home “Hoy” con tareas vencidas, prioridades y avance de meta;
- cálculo de plan restante desde ratios configurables;
- filtros por campaña, zona, estado, origen y fecha;
- carga de fotos de propiedades;
- dashboard de embudo básico;
- exportación de datos esenciales en formato interoperable.

### Funcionales — prioridad P1

- scoring explicable;
- matching demanda–oportunidad/propiedad;
- borradores de mensajes y copy editables;
- Brand Kit y templates de contenido;
- recordatorios por correo/notificación;
- importación inicial de contactos desde CSV;
- reportes por origen y campaña.

### No funcionales

- experiencia utilizable en pantalla móvil pequeña;
- carga inicial de vistas principales en menos de tres segundos en red móvil razonable;
- formularios que preserven borradores ante fallas de conexión cuando sea viable;
- accesibilidad básica: contraste, foco, etiquetas y navegación por teclado;
- validación de datos y mensajes de error accionables;
- backups y estrategia de recuperación;
- registros de auditoría para acciones sensibles;
- pruebas automatizadas del Goal Engine, permisos y transiciones de estado;
- entorno separado de desarrollo, pruebas y producción;
- manejo seguro de secretos y configuraciones.

### Decisiones que deben tomarse antes de implementar

1. ¿Venta, alquiler o ambos en el piloto?
2. ¿Un único agente individual o equipo pequeño desde el comienzo?
3. ¿Cuál es la zona y tipología de los usuarios piloto?
4. ¿Qué ratios iniciales se propondrán y cómo podrá modificarlos el usuario?
5. ¿Qué eventos cuentan como “contacto”, “conversación” y “tasación” para calcular el embudo consistentemente?
6. ¿Qué canales se registran manualmente en el MVP (WhatsApp, llamada, Instagram, email)?
7. ¿Qué templates y formatos de contenido son realmente usados por los pilotos?
8. ¿Qué datos sensibles deben quedar ocultos o con acceso restringido adicional?

---

## 19. Criterios de decisión de producto

Cada función propuesta debe responder al menos una de estas preguntas:

- ¿Ayuda a captar una propiedad?
- ¿Evita perder una conversación u oportunidad real?
- ¿Convierte la meta del agente en una acción clara?
- ¿Aprovecha demanda real para mejorar la captación?
- ¿Reduce trabajo repetitivo sin quitar control al agente?
- ¿Produce aprendizaje confiable sobre qué canal o actividad funciona?

Si una función no responde a ninguna, no debe entrar al MVP.

---

## 20. Próximo paso recomendado

Antes de abrir una implementación extensa, realizar una validación rápida con agentes reales y prototipar estas tres pantallas:

1. **Hoy:** objetivo, progreso, tareas y prioridades.
2. **Oportunidad de captación:** contexto, demanda compatible, mensaje y próximo paso.
3. **Campaña/meta:** embudo, ratios y plan semanal.

Si los pilotos vuelven a esas pantallas para organizar su día y registran el resultado de sus acciones durante varias semanas, el núcleo de producto estará validándose. El desarrollo puede avanzar después por módulos, manteniendo el foco en construir cartera y no en recrear un CRM inmobiliario genérico.
