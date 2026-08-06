# Variables de entorno

## Backend

Variables usadas por `server/`:

```env
DATABASE_URL=
JWT_SECRET=
ADMIN_USER=
ADMIN_PASSWORD=
AWS_ENDPOINT_URL=
AWS_DEFAULT_REGION=auto
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
PORT=3001
NODE_ENV=development
```

## Frontend

Variable usada por `client/`:

```env
VITE_API_URL=
```

En produccion puede quedar como `/api` si el frontend y backend se sirven desde el mismo dominio.

## Railway

Variables observadas en el servicio `sunpartners-saas`:

- `ADMIN_PASSWORD`
- `ADMIN_USER`
- `AWS_ACCESS_KEY_ID`
- `AWS_DEFAULT_REGION`
- `AWS_ENDPOINT_URL`
- `AWS_S3_BUCKET_NAME`
- `AWS_SECRET_ACCESS_KEY`
- `DATABASE_URL`
- `JWT_SECRET`
- `VITE_API_URL`

Railway tambien agrega variables internas propias.

## Secretos

Nunca commitear valores reales de:

- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_PASSWORD`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Recomendacion local

Usar `server/.env` para backend local. Mantenerlo fuera de Git.

Para usar variables Railway sin copiarlas:

```bash
railway run npm.cmd run dev --workspace=server
```

Si Railway esta enlazado a `production`, este comando conectara con recursos de produccion.
