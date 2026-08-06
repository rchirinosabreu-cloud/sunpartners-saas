# Riesgos tecnicos

## Criticos

### `prisma db push --accept-data-loss` en produccion

Archivo:

```text
nixpacks.toml
```

Riesgo:

- puede alterar schema en cada arranque;
- puede aceptar perdida de datos;
- no deja el mismo control historico que migraciones versionadas.

Recomendacion:

- cambiar a `prisma migrate deploy` en FASE 5;
- hacerlo solo con backup y validacion.

### Desarrollo local contra produccion

Si Railway local se enlaza a `production`, comandos locales pueden leer y escribir datos reales.

Recomendacion:

- usar staging o PostgreSQL local para desarrollo diario;
- reservar produccion para deploy y verificaciones controladas.

## Altos

### `.env.example` incompleto o desalineado

Problemas detectados:

- `PORT=3000`, pero frontend espera backend en `3001`;
- faltan `ADMIN_USER` y `ADMIN_PASSWORD`;
- falta documentar `VITE_API_URL`.

### Build de produccion poco explicito

`nixpacks.toml` no declara claramente `npm run build`. Express espera `client/dist` en produccion.

### Bootstrap con mutaciones de datos

`server/src/bootstrap.js` ejecuta limpiezas y migraciones de datos al iniciar.

Riesgo:

- mezcla arranque con cambios de datos;
- puede ocultar problemas de migracion.

## Medios

### Auth mock en desarrollo

`client/src/context/AuthContext.jsx` crea usuario mock en modo DEV.

Riesgo:

- puede ocultar errores reales de login, cookies o permisos.

### Sin CI visible

No se encontro `.github/workflows`.

Riesgo:

- pushes o PRs pueden llegar sin tests/build automaticos.

### Dependencias locales incompletas

Durante auditoria:

- `vitest` no estaba disponible;
- `npm ls --depth=0` reportaba dependencias faltantes.

Solucion inicial:

```bash
npm install
```

## Bajos

### README previo insuficiente

El README anterior no explicaba instalacion, despliegue, variables ni arquitectura.

### Design system desalineado

`AGENTS.md` pide Plus Jakarta Sans y radio 12px. El CSS actual usa DM Sans y radio base 8px.
