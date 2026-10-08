# Registro de decisiones

**Última actualización:** 2026-10-08  
**Uso:** resumen trazable de decisiones confirmadas. Los detalles y criterios están en los documentos enlazados desde el índice.

| ID | Fecha | Decisión | Razón e impacto | Estado |
|---|---|---|---|---|
| D-001 | 2026-10-07 | El piloto cubre venta y alquiler residencial. | Permite probar captación en ambos flujos sin abrir todavía otras categorías. | Vigente |
| D-002 | 2026-10-07 | Zonas iniciales: Núñez, Saavedra, Villa Urquiza, Coghlan y Belgrano. | Mantiene foco geográfico y filtros consistentes. | Vigente |
| D-003 | 2026-10-07 | Producto privado para un agente; luego hasta tres pilotos. | Reduce complejidad de equipos, permisos compartidos y colaboración. | Vigente |
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
| D-016 | 2026-10-08 | El radar se valida primero con datos sintéticos y activación explícita del conector oficial. | Permite probar la experiencia sin presentar datos reales como disponibles ni usar credenciales inseguras. | Implementada |
| D-017 | 2026-10-08 | Un resultado del radar solo se persiste cuando el agente lo guarda. | Evita replicar catálogos y minimiza almacenamiento. | Implementada |
| D-018 | 2026-10-08 | El identificador externo se deduplica por usuario y proveedor. | Evita seguimientos paralelos del mismo aviso sin mezclar cuentas. | Implementada |

## Cómo registrar cambios

- No se edita silenciosamente una decisión vigente: se agrega una nueva fila que la reemplaza y se identifica el ID anterior.
- Una decisión “implementada” debe tener evidencia en un documento de incremento.
- Las decisiones legales o de integración se revisan otra vez al momento de ejecución porque términos y normativa pueden cambiar.
