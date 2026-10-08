# Agente Inmobiliario

Producto privado de productividad y captación para usuarios inmobiliarios independientes. El objetivo inicial es transformar señales de posibles propiedades en próximos pasos claros, registrar el resultado comercial y aprender del embudo real del usuario.

## Estado

Existe un prototipo web local con:

- cuenta Demo con datos sintéticos y cuentas personales separadas;
- autenticación con email/contraseña y sesión HTTP-only;
- carga manual enriquecida de oportunidades;
- tareas y próximos pasos;
- historial explícito del embudo de captación;
- búsqueda y filtros;
- radar manual privado: hallazgos, enlace al aviso original, revisión, descarte y conversión deliberada a oportunidad;
- checklist de contacto para oportunidades de portal y borrador editable que sólo se copia manualmente;
- restricciones de contacto visibles y aplicadas en el servidor.
- controles de staging: origen HTTPS autorizado, cabeceras de seguridad, límites de intentos y health check.

La aplicación es apta para desarrollo y validación con datos ficticios. **Todavía no debe utilizarse con datos personales reales**: el código ya endurece un staging con HTTPS, pero faltan base administrada, cifrado en reposo, backups, controles operativos y revisión legal final. Ver [Base de producción segura](docs/PRODUCCION_SEGURA.md).

El estado canónico, la hoja de ruta y los límites están en [Estado actual y hoja de ruta](docs/ESTADO_ACTUAL_Y_HOJA_DE_RUTA.md). El índice completo está en [Documentación](docs/README.md).

## Ejecutar localmente

```bash
cd web
npm install
npm run dev
```

- Interfaz: `http://127.0.0.1:5173/`
- API: `http://127.0.0.1:8787/`
- Base local: `web/data/agente.sqlite` — excluida del repositorio.

Validación técnica:

```bash
npm run build
npm run lint
```

## Estructura

```text
docs/  visión, decisiones, seguridad, incrementos y hoja de ruta
web/   aplicación React, API Node y base SQLite local
```
