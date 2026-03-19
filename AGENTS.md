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

## 4. Sistema de Diseño (Contraste Estructural v2.0)
- **Estética:** Estrictamente Minimalista y Profesional (inspirado en Linear/Stripe).
- **Tipografía:** **Space Grotesk** para encabezados/display y **DM Sans** para el cuerpo de texto.
- **Bordes:** Strictly **2px (rounded-sm)** para todos los componentes (botones, inputs, tarjetas). **PROHIBIDOS** los bordes redondeados estándar (md, lg, etc.).
- **Sombras:** **SIN SOMBRAS** (`shadow: none`). El diseño se basa en bordes de 1px para separación.
- **Paleta de Colores:**
    - **Base:** Blanco (`#FFFFFF`) y Fondo suave (`#FAFAFA`) para fondos claros.
    - **Fondo Oscuro:** Zinc-900 (`#18181B`) para Sidebars y Paneles de marca.
    - **Texto:** Zinc-900 para contenido y Zinc-400/500 para texto secundario.
    - **Bordes/Divisores:** Zinc-200 (`#E4E4E7`).
    - **Primario (Acciones):** Azul Sunpartners (`#12AEE2`).
    - **Alertas/Advertencias:** Amarillo Alerta (`#FBAE17`).
- **Iconografía:** Usar siempre **Google Material Symbols Outlined**.
- **Validación:** En cada ajuste de UI, se **DEBE** adjuntar una captura de pantalla para validación.

## 5. Lógica de Negocio
- **Gestión de Stock:** Sistema de reserva por fechas. La disponibilidad se calcula como: `StockDisponible(t) = StockTotal - Suma(StockReservado(t))`.
- **Estructura:** Monorepo con carpetas `client` y `server`.
- **Rutas Backend:** Para servir el SPA en Node 22+, evitar rutas con comodines en `app.get`. Usar siempre un middleware final `app.use()` para evitar errores de `path-to-regexp` v8.
