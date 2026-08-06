# Sunpartners SaaS

Plataforma SaaS para centralizar la operacion comercial, logistica y administrativa de Sunpartners.

## Resumen

Este proyecto es un monorepo Node.js con:

- `client`: frontend React + Vite.
- `server`: backend Express + Prisma.
- PostgreSQL como base de datos.
- Railway como plataforma de produccion.
- GitHub como repositorio fuente.
- Bucket S3-compatible en Railway para archivos privados.

## Flujo de produccion

El flujo actual de trabajo es:

```text
Cambios locales
-> git commit
-> git push origin main
-> Railway detecta el push
-> Railway construye y despliega
-> produccion queda actualizada
```

La rama `main` es produccion. Railway despliega automaticamente desde GitHub.

Produccion actual:

- Railway project: `Sunpartners SaaS`
- Railway environment: `production`
- App service: `sunpartners-saas`
- Database service: `Postgres`
- Bucket: `ordenes-sunp`
- Dominio: `https://eventsuite.sunpartners.com.co`

## Inicio rapido local

Requisitos:

- Node.js
- npm
- PostgreSQL local o acceso a Railway
- Railway CLI si se va a ejecutar con variables de Railway

Instalar dependencias:

```bash
npm install
```

Backend:

```bash
npm.cmd run dev --workspace=server
```

Frontend:

```bash
npm.cmd run dev --workspace=client
```

El frontend usa Vite y proxy `/api` hacia `http://localhost:3001`.

## Documentacion

- [Arquitectura](docs/ARCHITECTURE.md)
- [Desarrollo local](docs/DEVELOPMENT.md)
- [Despliegue](docs/DEPLOYMENT.md)
- [Variables de entorno](docs/ENVIRONMENT.md)
- [Railway](docs/RAILWAY.md)
- [GitHub](docs/GITHUB.md)
- [Prisma](docs/PRISMA.md)
- [Storage](docs/STORAGE.md)
- [Riesgos tecnicos](docs/RISKS.md)

## Regla practica

Si cambias solo frontend o backend normal:

```text
commit + push a main
```

Si cambias `server/prisma/schema.prisma`:

```text
crear migracion -> probar -> commit -> push -> Railway aplica migraciones
```

Nota: el despliegue actual todavia usa `prisma db push --accept-data-loss` en `nixpacks.toml`. Eso esta documentado como riesgo tecnico y debe corregirse en una fase posterior con backup y validacion.
