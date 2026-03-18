# Sunpartners SaaS - Reglas del Agente

Este archivo dicta las normas y convenciones para el desarrollo de la plataforma Sunpartners SaaS.

## 1. Infraestructura y Base de Datos
- **Base de Datos:** Usar siempre **PostgreSQL** en producción (Railway). **NUNCA** cambiar a SQLite.
- **Fechas:** Todas las fechas deben sincronizarse en **UTC-5 (Bogotá/Colombia)**.
- **ORM:** Prisma.
- **Despliegue:** Configurar `package.json` con `"postinstall": "prisma generate"`.

## 2. Desarrollo y Calidad
- **Metodología:** Implementar **TDD (Test Driven Development)** para la lógica de inventario y el frontend.
- **Testing:** Usar **Vitest** tanto para el frontend como para el backend.
- **Soft Delete:** Implementar una extensión de Prisma para el filtrado automático de registros donde `deletedAt != null`.

## 3. Seguridad
- **Autenticación:** JWT manejado exclusivamente a través de **HttpOnly Cookies** para evitar vulnerabilidades XSS.

## 4. Sistema de Diseño (Zinc/Minimalista)
- **Estética:** Estrictamente Minimalista. Prohibidos los degradados, sombras pesadas y colores saturados.
- **Tipografía:** **Geist (Sans y Mono)**.
- **Paleta de Colores:**
    - **Base:** Blanco Inmaculado (`#FFFFFF`) y Zinc suave (`#F4F4F5`) para fondos.
    - **Texto:** Zinc-900 (`#09090B`).
    - **Bordes/Divisores:** Zinc-200 o Gris Zinc (`#E4E4E7`).
    - **Acento (Acciones Importantes):** Teal de la marca (`#548CA1`).
    - **Alertas (Stock Bajo/Conflictos):** Amarillo de la marca (`#F9B233`).
- **Validación:** En cada ajuste de UI, se **DEBE** adjuntar una captura de pantalla para validación.

## 5. Lógica de Negocio
- **Gestión de Stock:** Sistema de reserva por fechas. La disponibilidad se calcula como: `StockDisponible(t) = StockTotal - Suma(StockReservado(t))`.
- **Estructura:** Monorepo con carpetas `client` y `server`.
- **Rutas Backend:** Para servir el SPA en Node 22+, evitar rutas con comodines en `app.get`. Usar siempre un middleware final `app.use()` para evitar errores de `path-to-regexp` v8.
