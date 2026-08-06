# Despliegue

## Flujo actual

El proyecto despliega a Railway desde GitHub.

```text
Cambios locales
-> git commit
-> git push origin main
-> Railway detecta push
-> Railway build/deploy
-> produccion actualizada
```

La rama `main` es produccion.

## Produccion Railway

- Project: `Sunpartners SaaS`
- Environment: `production`
- App service: `sunpartners-saas`
- Database service: `Postgres`
- Bucket: `ordenes-sunp`
- Dominio: `https://eventsuite.sunpartners.com.co`

Ultimo deployment observado:

- Status: `SUCCESS`
- Commit: `810bf0544f88ddd6e1d8dcb5c81a33a5b308fa44`

## Build y start actuales

Archivo: `nixpacks.toml`

Build/install:

```bash
npm install && npx prisma generate --schema=server/prisma/schema.prisma
```

Start:

```bash
npx prisma db push --schema=server/prisma/schema.prisma --accept-data-loss && node server/src/app.js
```

## Advertencia Prisma

El comando actual de start usa `db push --accept-data-loss`. Eso puede ser riesgoso en produccion porque permite cambios destructivos en la base de datos.

Flujo recomendado para una fase posterior:

```bash
npx prisma migrate deploy --schema=server/prisma/schema.prisma && node server/src/app.js
```

Ese cambio debe hacerse solo despues de:

- revisar migraciones existentes;
- confirmar backup;
- probar deploy;
- definir rollback.

## Publicar cambios

Para cambios normales de frontend/backend:

```bash
git status
git add .
git commit -m "descripcion del cambio"
git push origin main
```

Railway despliega automaticamente.

Para cambios en `server/prisma/schema.prisma`:

```bash
npm.cmd run db:migrate --workspace=server
npm.cmd test
git add server/prisma/schema.prisma server/prisma/migrations
git commit -m "descripcion de migracion"
git push origin main
```

En produccion, el objetivo profesional es que Railway ejecute `prisma migrate deploy`.
