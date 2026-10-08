# Agente Inmobiliario

Producto privado de productividad y captación para agentes inmobiliarios independientes. El objetivo inicial es transformar señales de posibles propiedades en próximos pasos claros, registrar el resultado comercial y aprender del embudo real del agente.

## Estado

Existe un prototipo web local con:

- cuenta Demo con datos sintéticos y cuentas personales separadas;
- autenticación con email/contraseña y sesión HTTP-only;
- carga manual enriquecida de oportunidades;
- tareas y próximos pasos;
- historial explícito del embudo de captación;
- búsqueda y filtros;
- radar de oportunidades en modo Demo con guardado y deduplicación;
- restricciones de contacto visibles y aplicadas en el servidor.

La aplicación es apta para desarrollo y validación con datos ficticios. **Todavía no debe utilizarse con datos personales reales**: faltan despliegue HTTPS, almacenamiento administrado y cifrado, backups, controles operativos y revisión legal final.

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
