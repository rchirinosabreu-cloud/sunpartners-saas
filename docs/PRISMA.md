# Prisma

## Ubicacion

Schema:

```text
server/prisma/schema.prisma
```

Migraciones:

```text
server/prisma/migrations/
```

Cliente Prisma:

```text
@prisma/client
```

## Base de datos

El datasource usa PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Scripts actuales

Desde `server/package.json`:

```bash
npm.cmd run db:migrate --workspace=server
npm.cmd run db:deploy --workspace=server
npm.cmd run db:push --workspace=server
npm.cmd run db:status --workspace=server
npm.cmd run db:resolve --workspace=server
```

## Desarrollo

Para cambios en schema durante desarrollo:

```bash
npm.cmd run db:migrate --workspace=server
```

Esto crea una migracion versionada.

## Produccion

El flujo profesional de produccion debe usar:

```bash
prisma migrate deploy
```

No se recomienda usar `db push --accept-data-loss` en produccion.

## Estado actual

El archivo `nixpacks.toml` actualmente ejecuta:

```bash
npx prisma db push --schema=server/prisma/schema.prisma --accept-data-loss
```

Esto esta marcado como riesgo tecnico pendiente para FASE 5.

## Doble inventario

El schema incluye:

- `Inventory_Bodega`
- `Inventory_Commercial`

La sincronizacion entre ambas capas no vive en la base de datos; vive en extensiones Prisma dentro de `server/src/db.js`.
