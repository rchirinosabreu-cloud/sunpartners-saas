# Railway

## Recursos confirmados

Project:

- Name: `Sunpartners SaaS`
- Project ID: `4ab72db3-2ec9-40ce-acfc-6b1f6878ee4e`

Environment:

- Name: `production`
- Environment ID: `4ea16278-9f07-497d-9afb-dfd767972dd1`

Services:

- App: `sunpartners-saas`
  - Service ID: `6132412d-f897-4d18-becb-92e93bd15bd4`
- Database: `Postgres`
  - Service ID: `5818577e-06f2-42bb-acbd-a18a58fc43e8`

Domain:

- `https://eventsuite.sunpartners.com.co`
- Target port: `8080`

Database TCP proxy:

- `centerbeam.proxy.rlwy.net:18075`
- Internal port: `5432`

Bucket:

- `ordenes-sunp`

## Conectar local con Railway

Instalar Railway CLI:

```bash
npm install -g @railway/cli
```

Iniciar sesion:

```bash
railway login
```

Enlazar este repo:

```bash
railway link
```

Seleccionar:

- project: `Sunpartners SaaS`
- environment: `production`
- service: `sunpartners-saas`

Verificar:

```bash
railway status
```

## Ejecutar comandos con variables Railway

Backend local usando variables del ambiente enlazado:

```bash
railway run npm.cmd run dev --workspace=server
```

Ver variables por nombre desde dashboard o CLI. Evitar copiar secretos a chats o documentos.

## Despliegue automatico

Railway esta conectado a GitHub y despliega automaticamente desde `main`.

## Riesgo actual

El start command actual ejecuta:

```bash
prisma db push --accept-data-loss
```

Debe reemplazarse por `prisma migrate deploy` en una fase posterior, con backup y pruebas.
