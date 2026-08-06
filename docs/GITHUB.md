# GitHub

## Repositorio

Remote actual:

```text
origin https://github.com/rchirinosabreu-cloud/sunpartners-saas.git
```

Rama principal:

```text
main
```

`main` es produccion porque Railway despliega automaticamente desde esa rama.

## Flujo recomendado

Para cambios pequenos:

```bash
git checkout main
git pull origin main
git status
# editar y probar
git add .
git commit -m "descripcion clara"
git push origin main
```

Para cambios medianos o riesgosos:

```bash
git checkout main
git pull origin main
git checkout -b feature/nombre-del-cambio
# editar y probar
git add .
git commit -m "descripcion clara"
git push origin feature/nombre-del-cambio
```

Luego abrir Pull Request hacia `main`.

## Regla de produccion

Todo push a `main` puede desplegar produccion.

Antes de hacer push a `main`:

- revisar `git diff`;
- correr tests;
- verificar UI si aplica;
- confirmar si hubo cambios en Prisma;
- confirmar si Railway debe desplegar.

## CI

No se encontro `.github/workflows` en el repo. Por ahora no hay CI visible que bloquee PRs o pushes con tests/build automaticos.
