# Desarrollo local

## Requisitos

- Node.js.
- npm.
- PostgreSQL local o acceso a Railway.
- Railway CLI si se usaran variables remotas.

## Instalacion

Desde la raiz del proyecto:

```bash
npm install
```

En Windows PowerShell puede fallar `npm` por ExecutionPolicy. Si ocurre, usar `npm.cmd`.

## Variables locales

Crear `server/.env` a partir de `server/.env.example`.

El backend local debe usar:

```env
PORT=3001
NODE_ENV=development
```

El frontend espera la API en:

```text
http://localhost:3001/api
```

## Ejecutar backend

```bash
npm.cmd run dev --workspace=server
```

Backend esperado:

```text
http://localhost:3001
```

Healthcheck:

```bash
Invoke-WebRequest -UseBasicParsing http://localhost:3001/health
```

## Ejecutar frontend

```bash
npm.cmd run dev --workspace=client
```

Vite levantara el frontend y enviara `/api` al backend.

## Ejecutar tests

Todos los tests:

```bash
npm.cmd test
```

Solo backend:

```bash
npm.cmd test --workspace=server
```

Solo frontend:

```bash
npm.cmd test --workspace=client
```

## Estado actual detectado

La instalacion local revisada estaba incompleta:

- `vitest` no estaba disponible.
- `npm ls --depth=0` reportaba dependencias faltantes.
- `localhost:3001/health` no respondia.

Primer paso recomendado ante ese estado:

```bash
npm install
```

## Desarrollo contra Railway

Se puede ejecutar el backend con variables Railway:

```bash
railway run npm.cmd run dev --workspace=server
```

Advertencia: si el ambiente enlazado es `production`, cualquier escritura local puede tocar datos reales.

Recomendacion profesional: usar PostgreSQL local o un ambiente `staging` para desarrollo diario.
