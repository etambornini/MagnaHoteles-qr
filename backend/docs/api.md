# API Magna Hoteles

Base URL por defecto: `http://localhost:4000/api`

## Autenticación de administradores

Los administradores de hotel deben autenticarse para gestionar su menú.

- **POST** `/auth/register`
  ```json
  {
    "email": "admin@magna.com",
    "password": "superseguro",
    "role": "ADMIN"
  }
  ```
  Campos:
  - `role`: `ADMIN` o `MANAGER` (por defecto es `MANAGER`).
  - `hotelSlug`: obligatorio si el rol es `MANAGER` para asociar el usuario al hotel.

  Ejemplo para registrar a un gerente:
  ```json
  {
    "email": "gerente@magna.com",
    "password": "superseguro",
    "role": "MANAGER",
    "hotelSlug": "magna-riviera"
  }
  ```

- **POST** `/auth/login`
  ```json
  {
    "email": "admin@magna.com",
    "password": "superseguro"
  }
  ```
  Devuelve un `token` JWT. Inclúyelo en las peticiones privadas usando el encabezado `Authorization: Bearer <token>`.

## Roles y middlewares

- **ADMIN**: Puede crear, modificar y eliminar hoteles y contenido. Para operar sobre categorías/productos debe indicar el hotel objetivo mediante `x-hotel-id` (o `hotelId` en query) con el `id` o `slug` del hotel.
- **MANAGER**: Gestiona todo el contenido de su hotel asignado (se deriva del token, no se necesita encabezado extra).
- **PUBLIC**: Accede en modo lectura vía `/public`, indicando el hotel con `x-hotel-id` o `hotelId` (acepta `id` o `slug`).

---

## Endpoints administradores (`/admin`)

> Requiere `Authorization: Bearer <token>`.
> Si el usuario tiene rol `ADMIN`, debe indicar el hotel objetivo con `x-hotel-id` (o query `hotelId`) utilizando el `id` o `slug` del hotel cuando opere sobre categorías o productos.

### Hoteles (`/admin/hotels`)

- **GET** `/admin/hotels` — listado con soporte de búsqueda `search`, paginación `page`, `pageSize`.
- **POST** `/admin/hotels` — crear hotel.
- **GET** `/admin/hotels/:id` — obtener detalle.
- **PATCH** `/admin/hotels/:id` — actualizar campos parciales.
- **DELETE** `/admin/hotels/:id` — eliminar hotel.

### Categorías (`/admin/categories`)

> `ADMIN`: requiere `x-hotel-id` (o `hotelId`) con el `id`/`slug` del hotel. `MANAGER`: opera sobre su hotel asignado sin encabezado adicional.

- **GET** `/admin/categories` — lista paginada. Query soportada: `search`, `parentId`, `includeChildren`, `includeAttributes`, `page`, `pageSize`.
- **POST** `/admin/categories`
  ```json
  {
    "name": "Viandas",
    "key": "viandas",
    "description": "Viandas listas",
    "attributes": [
      {
        "name": "Incluye queso",
        "key": "incluyeQueso",
        "type": "BOOLEAN"
      }
    ]
  }
  ```
- **GET** `/admin/categories/:id?includeChildren=true&includeAttributes=true`
- **PATCH** `/admin/categories/:id` — actualiza cualquier campo.
- **DELETE** `/admin/categories/:id`
- **POST** `/admin/categories/:id/attributes` — crear definiciones de atributos.
- **PATCH** `/admin/categories/:id/attributes/:attributeId`
- **DELETE** `/admin/categories/:id/attributes/:attributeId`
- **POST** `/admin/categories/:id/attributes/:attributeId/options`
- **PATCH** `/admin/categories/:id/attributes/:attributeId/options/:optionId`
- **DELETE** `/admin/categories/:id/attributes/:attributeId/options/:optionId`

### Productos (`/admin/products`)

> `ADMIN`: indicar hotel con `x-hotel-id`/`hotelId`. `MANAGER`: usa su hotel asignado automáticamente.

- **GET** `/admin/products` — filtros disponibles: `search`, `categoryIds` (CSV), `isActive`, `minPrice`, `maxPrice`, `variantOptionId`, `attributes` (JSON array), `page`, `pageSize`, `includeCategories`, `includeVariants`, `includeAttributes`, `includeBundles`.
- **POST** `/admin/products`
  ```json
  {
    "name": "Ravioles caseros",
    "slug": "ravioles-caseros",
    "description": "Ravioles de ricota y espinaca",
    "stock": 35,
    "price": 4500,
    "images": ["https://.../ravioles.jpg"],
    "categoryIds": ["<category-id>"]
  }
  ```
  Es posible incluir `variantGroups`, `attributeValues`, `customAttributes`, `bundleItems`.
- **GET** `/admin/products/:id`
- **PATCH** `/admin/products/:id` — reemplaza colecciones si se envían (`categoryIds`, `variantGroups`, etc.).
- **DELETE** `/admin/products/:id`

---

## Endpoints públicos (`/public`)

> Requiere encabezado `x-hotel-id` (o query `hotelId`). No precisan autenticación.
> El valor puede ser el `id` o el `slug` del hotel.

### Categorías públicas (`/public/categories`)

- **GET** `/public/categories` — acepta las mismas querys de listado que la versión administrativa.
- **GET** `/public/categories/:id` — parámetros opcionales `includeChildren`, `includeAttributes`.

### Productos públicos (`/public/products`)

- **GET** `/public/products` — mismos filtros soportados que en `/admin/products`.
- **GET** `/public/products/:id` — flags `includeCategories`, `includeVariants`, `includeAttributes`, `includeBundles`.

---

## Formato de errores

Las respuestas de validación usan:
```json
{
  "message": "Validation failed",
  "issues": [
    {
      "path": ["body", "name"],
      "message": "String must contain at least 2 character(s)"
    }
  ]
}
```

Consulta `prisma/schema.prisma` para conocer todos los modelos y relaciones persistentes.
