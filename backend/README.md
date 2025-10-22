# Magna Hoteles – Backend 🧱

API multi-tenant para gestión de menús por hotel. Cada hotel puede administrar su catálogo de categorías, productos, atributos personalizados, variantes y bandejas reutilizando un mismo backend.

## 🚀 Puesta en marcha

```bash
cd backend
npm install
cp .env.example .env         # Ajusta DATABASE_URL, PORT y JWT_SECRET
# Crea la base de datos MySQL indicada en DATABASE_URL (por defecto `magnahotelesQR`)
# CREATE DATABASE IF NOT EXISTS magnahotelesQR CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Ejecuta las migraciones / genera el cliente:

```bash
npm run prisma:generate
npm run prisma:migrate       # requerirá una base de datos accesible
```

Modo desarrollo:

```bash
npm run dev
```

Build de producción:

```bash
npm run build
npm start
```


# Consulta `docs/api.md` para ejemplos detallados de uso.

## 📂 Estructura relevante

- `src/app.ts` – configuración de Express y middlewares.
- `src/routes` – enrutador raíz (`/api`).
- `src/modules/**` – cada dominio (hotels, categories, products) con `*.schema`, `*.service`, `*.controller`, `*.routes`.
- `src/middleware` – contexto multi-tenant (`x-hotel-id`) y manejadores de errores/validaciones.
- `src/lib/prisma.ts` – prisma client singleton.
- `prisma/schema.prisma` – modelado relacional.
- `docs/api.md` – documentación de endpoints.

## 🔐 Multi-tenancy

Cada request a `/api/categories` y `/api/products` debe incluir el encabezado `x-hotel-id` (o `?hotelId=`) para aislar datos por hotel. El middleware `hotelContext` valida y propaga el identificador (acepta `id` o `slug`).

Los administradores gestionan su menú mediante `/api/admin/**` usando `Authorization: Bearer <token>` emitido por `/api/auth/login`. El token vincula al usuario con el hotel que puede administrar.

### Roles soportados

- `ADMIN`: puede crear/modificar/eliminar hoteles y contenido. Para trabajar con categorías/productos debe indicar el hotel objetivo con `x-hotel-id` (o `hotelId` en query) aceptando `id` o `slug`.
- `MANAGER`: edita el contenido de su hotel asignado (determinado en el token, no necesita encabezado extra).
- Público: consume `/api/public/**` aportando `x-hotel-id` o `hotelId` para identificar el hotel.

## ✅ Validaciones y errores

- Zod asegura shape de `params`, `query` y `body`.
- Manejo centralizado de errores (`errorHandler`) devuelve mensajes consistentes y códigos HTTP apropiados.

## 🔍 Búsqueda y filtros

`GET /api/products` soporta:

- `search` (nombre/slug/descripción)
- `categoryIds` (CSV)
- `isActive`, `minPrice`, `maxPrice`
- `variantOptionId`
- `attributes` (JSON array: `[{ "attributeId": "...", "value": ... }]`)
- Flags `includeCategories`, `includeVariants`, `includeAttributes`, `includeBundles`



