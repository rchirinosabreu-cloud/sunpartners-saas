# Storage

## Tipo de storage

El proyecto usa storage S3-compatible mediante AWS SDK.

No se encontro uso directo de Google Cloud Storage en el codigo.

En Railway, el bucket visible es:

```text
ordenes-sunp
```

## Variables

```env
AWS_ENDPOINT_URL=
AWS_DEFAULT_REGION=auto
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
```

## Usos actuales

El storage se usa para:

- fotos de perfil de usuarios;
- ordenes de compra asociadas a cotizaciones;
- signed URLs temporales para leer archivos privados.

## Implementacion

Archivo principal:

```text
server/src/utils/s3Client.js
```

El cliente usa:

- `S3Client`
- `GetObjectCommand`
- `DeleteObjectCommand`
- `getSignedUrl`
- `forcePathStyle: true`

## Seguridad

Los archivos no se exponen directamente como publicos desde Express. El backend genera signed URLs temporales.

No commitear credenciales del bucket.

## Desarrollo local

Si local apunta al mismo bucket de produccion, uploads de prueba pueden crear o borrar archivos reales.

Recomendacion profesional:

- bucket separado para staging/desarrollo;
- o usar produccion solo para pruebas controladas.
