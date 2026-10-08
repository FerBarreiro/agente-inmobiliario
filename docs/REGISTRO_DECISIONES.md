# Registro de decisiones

**Última actualización:** 2026-10-08  
**Uso:** resumen trazable de decisiones confirmadas. Los detalles y criterios están en los documentos enlazados desde el índice.

| ID | Fecha | Decisión | Razón e impacto | Estado |
|---|---|---|---|---|
| D-001 | 2026-10-07 | El piloto cubre venta y alquiler residencial. | Permite probar captación en ambos flujos sin abrir todavía otras categorías. | Vigente |
| D-002 | 2026-10-07 | Zonas iniciales: Núñez, Saavedra, Villa Urquiza, Coghlan y Belgrano. | Mantiene foco geográfico y filtros consistentes. | Vigente |
| D-003 | 2026-10-07 | Producto privado para un usuario; luego hasta tres pilotos. | Reduce complejidad de equipos, permisos compartidos y colaboración. | Vigente |
| D-004 | 2026-10-07 | Dos clases de cuenta: Demo sintética y personal aislada. | Permite recorrer el producto sin mezclar ejemplos con la base de trabajo. | Vigente |
| D-005 | 2026-10-07 | Autenticación y separación de datos desde el inicio. | Evita una migración insegura cuando se incorporen pilotos. | Implementada localmente |
| D-006 | 2026-10-07 | WhatsApp, llamadas, Instagram y email se registran manualmente. | Mantiene control humano; no autoriza acceso ni envío automático. | Vigente |
| D-007 | 2026-10-07 | El embudo se calcula con eventos explícitos. | Una tarea completada no demuestra que hubo conversación, tasación o captación. | Implementada |
| D-008 | 2026-10-07 | No usar datos personales reales en la base local de desarrollo. | Faltan HTTPS, almacenamiento administrado, backups y controles operativos. | Vigente |
| D-009 | 2026-10-07 | Descubrimiento en orden: manual → entrante → API oficial de Mercado Libre. | Valida utilidad antes de depender de integraciones. | Vigente |
| D-010 | 2026-10-07 | Prohibir scraping, extracción de contactos y mensajes automáticos. | Reduce riesgos contractuales, legales, de privacidad y reputación. | Vigente |
| D-011 | 2026-10-07 | Con tres pilotos activos y evidencia, proponer a Zonaprop o Argenprop un acuerdo de metadatos de 60–90 días. | La negociación debe apoyarse en uso comprobado y una propuesta limitada. | Futuro condicionado |
| D-012 | 2026-10-08 | Fuente, permiso y enlace se guardan en la oportunidad; el dato de contacto es opcional. | Aplica minimización y conserva trazabilidad del origen. | Implementada |
| D-013 | 2026-10-08 | `do_not_contact` bloquea eventos comerciales y fuerza revisión interna. | La disponibilidad pública de un dato no autoriza el contacto. | Implementada |
| D-014 | 2026-10-08 | Contactos es inicialmente una vista derivada, no una entidad separada. | Aún no hay evidencia de relaciones persona–oportunidad que justifiquen más complejidad. | Vigente |
| D-015 | 2026-10-08 | Métricas y ratios se muestran después de reunir una muestra útil. | Evita presentar porcentajes engañosos con pocos eventos. | Vigente |
| D-016 | 2026-10-08 | El radar se validaba con datos sintéticos y posible conector oficial. | Reemplazada por D-019 tras priorizar el modo manual sin integraciones. | Reemplazada |
| D-017 | 2026-10-08 | Un resultado del radar se persistía al guardarse desde datos sintéticos/API. | Reemplazada por D-019: ahora se persisten únicamente hallazgos cargados manualmente. | Reemplazada |
| D-018 | 2026-10-08 | Se deduplicaba el identificador externo por proveedor. | Reemplazada por D-019: no se reciben identificadores de proveedores. | Reemplazada |
| D-019 | 2026-10-08 | El Radar pasa a ser una bandeja manual de enlaces y hallazgos privados. | El usuario navega portales por su cuenta; no hay APIs, scraping ni agregación de resultados. | Implementada localmente |
| D-020 | 2026-10-08 | Las fuentes iniciales del Radar son Mercado Libre, Zonaprop, Argenprop y “Otro”; redes sociales quedan fuera de los accesos iniciales. | Prioriza fuentes de avisos inmobiliarios y reduce el tratamiento temprano de perfiles personales. | Implementada localmente |
| D-021 | 2026-10-08 | El Radar manual permanece como única modalidad activa. Una integración oficial con Mercado Libre queda diferida hasta obtener confirmación escrita para el caso de uso de captación. | La aceptación técnica de una API no confirma por sí sola que sea válido usar avisos para identificar posibles propietarios a quienes ofrecer servicios. | Vigente |
| D-022 | 2026-10-08 | El primer contacto desde una oportunidad de portal requiere checklist persistente y sólo habilita un borrador copiable. | Obliga a revisar restricciones y evita que el producto se convierta en un canal de envío o contacto automático. | Implementada localmente |
| D-023 | 2026-10-08 | Un hallazgo en revisión se convierte directamente en oportunidad mediante un único botón. | Reduce fricción sin incorporar contactos: crea el próximo paso de verificación, lo elimina de la bandeja activa del Radar y conserva la barrera previa a cualquier contacto. | Implementada localmente |
| D-024 | 2026-10-08 | La aplicación exige una configuración explícita y controles de origen para iniciar en producción; SQLite local sólo puede usarse como staging técnico sin datos personales. | Evita despliegues accidentales y prepara HTTPS, cabeceras, rate limiting y health checks mientras se define la migración a una base administrada. | Implementada parcialmente |
| D-025 | 2026-10-08 | El primer despliegue se realizará con Render como servicio web y Neon PostgreSQL como base administrada. | Mantiene la aplicación Node actual, separa la persistencia del disco efímero y permite guardar la conexión como secreto. SQLite queda limitado a desarrollo o staging técnico. | Preparada; activación pendiente |
| D-026 | 2026-10-08 | Se activa `agente-inmobiliario-dev` en Render conectado a Neon, sólo para validación con datos sintéticos. | Permite comprobar compilación, conexión, HTTPS y health check sin mezclar el incremento con `main` ni habilitar todavía datos personales reales. | Implementada y verificada |
| D-027 | 2026-10-08 | El perfil inicial permite actualizar sólo el nombre visible y cambiar la contraseña con verificación de la actual; el email queda inmutable hasta incorporar verificación de propiedad. | Evita reasignar silenciosamente una cuenta desde una sesión comprometida; el cambio de contraseña revoca las demás sesiones. | Implementada y verificada localmente |
| D-028 | 2026-10-08 | La recuperación de contraseña usa enlace temporal hashado, de un solo uso y entregado sólo por correo transaccional. | Evita mostrar secretos en la interfaz o logs; la entrega real queda bloqueada hasta configurar un remitente verificado y una clave de envío restringida. | Implementada; activación externa pendiente |
| D-029 | 2026-10-08 | Render despliega exclusivamente la rama `main`; `dev` se reserva para desarrollo y validación local. | Cada promoción remota queda ligada a un merge revisable hacia `main`, sin que cambios de trabajo en curso alcancen el servicio público. Reemplaza el uso temporal de `dev` en D-026. | Implementada |

## Cómo registrar cambios

- No se edita silenciosamente una decisión vigente: se agrega una nueva fila que la reemplaza y se identifica el ID anterior.
- Una decisión “implementada” debe tener evidencia en un documento de incremento.
- Las decisiones legales o de integración se revisan otra vez al momento de ejecución porque términos y normativa pueden cambiar.
