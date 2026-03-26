# Sunpartners SaaS - Reglas del Agente

Este archivo dicta las normas y convenciones para el desarrollo de la plataforma Sunpartners SaaS.

## 1. Infraestructura y Base de Datos
Base de Datos: Usar siempre PostgreSQL en producción (Railway). NUNCA cambiar a SQLite.

Fechas: Todas las fechas deben sincronizarse en UTC-5 (Bogotá/Colombia).

Arquitectura de Inventario: Implementar el sistema de Doble Inventario:

Inventory_Bodega: Fuente de verdad para stock físico y costos internos.

Inventory_Commercial: Catálogo con nombres editables y precios de alquiler sugeridos.

Sincronización: Cualquier cambio en existencia_total o estado en Bodega debe impactar automáticamente a la tabla Comercial.

## 2. Desarrollo y Calidad (Regla de Oro)
Validación Obligatoria: PROHIBIDO realizar un Pull Request (PR) o dar por terminada una tarea sin adjuntar video o captura de pantalla del funcionamiento real.

Pruebas de Independencia: Para campos de fecha, se debe demostrar en video que el cambio en un input no afecta a los otros 5.

Testing: Usar Vitest y Playwright para verificar la lógica de cálculo y la independencia de estados.

## 3. Seguridad
Autenticación: JWT manejado exclusivamente a través de HttpOnly Cookies para evitar vulnerabilidades XSS.

Hashing: Las contraseñas de usuario deben hasearse siempre con Bcrypt antes de guardarse en la base de datos.

## 4. Sistema de Diseño (Luxury BTL / Finora Style)
Estética: Estrictamente Clean & Premium (Inspirado en Finora). Priorizar el espacio en blanco y sombras sutiles.

Tipografía: Plus Jakarta Sans para toda la interfaz (Cuerpo y Encabezados).

Paleta de Colores (Inamovible):

Primario (Azul SP): #5486A1 para encabezados de tabla, botones principales y acentos de marca.

Acento (Amarillo SP): #FBAE17 para alertas, iconos de estado y botones secundarios.

Fondo: Blanco puro (#FFFFFF) con secciones en gris tenue (#F5F6FA).

Prohibición Visual: Queda terminantemente PROHIBIDO el uso de bloques o franjas negras sólidas para encabezados o fondos.

Componentes: Bordes redondeados de 12px y sombras suaves (soft shadows) para contenedores y tarjetas.

## 5. Lógica de Negocio y Cálculo
Motor de Cálculo Unificado: Aplicar la fórmula obligatoria para Inventario, Personal y Transporte:
Total = (Cant * Vr.1erDía) + (Cant * (Días - 1) * Vr.DíaAdic)

Independencia de Fechas: Mantener 6 variables de estado únicas para la logística (montaje_inicio/fin, evento_inicio/fin, desmontaje_inicio/fin).

Cero Hardcoding: Todos los valores de la calculadora (Días, Cantidad, Precios) deben ser editables por el usuario en tiempo real.
