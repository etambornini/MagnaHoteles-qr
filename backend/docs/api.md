# 🧩 API Magna Hoteles

Base por defecto:  
`http://localhost:4000/api`

API para manejar los menús, productos y categorías de distintos hoteles desde un mismo backend.  
Cada hotel tiene su propio universo de datos, pero todo corre sobre la misma base.

---

## 🔐 Autenticación de administradores

Para que los administradores o gerentes puedan manejar su contenido, primero tienen que loguearse.

### Registro

**POST** `/auth/register`
```json
{
  "email": "admin@magna.com",
  "password": "superseguro",
  "role": "ADMIN"
}
```

Campos:
- `role`: puede ser `ADMIN` o `MANAGER` (si no ponés nada, arranca como `MANAGER`).
- `hotelSlug`: obligatorio solo si el rol es `MANAGER`, para que quede atado al hotel.

Ejemplo registrando un gerente:

```json
{
  "email": "gerente@magna.com",
  "password": "superseguro",
  "role": "MANAGER",
  "hotelSlug": "magna-riviera"
}
```

### Login

**POST** `/auth/login`
```json
{
  "email": "admin@magna.com",
  "password": "superseguro"
}
```

Si todo sale bien, te devuelve un token JWT.  
Guardalo y mandalo en cada request privada con:

```
Authorization: Bearer <token>
```

---

## 🎭 Roles y middlewares

- **ADMIN** → puede crear, editar o borrar hoteles y todo su contenido.  
  Si quiere tocar categorías o productos, tiene que mandar el hotel destino con `x-hotel-id` o `?hotelId=` (id o slug).
- **MANAGER** → gestiona su propio hotel (se deduce del token, no necesita mandar encabezados extra).
- **PUBLIC** → acceso de lectura a `/public`, pasando el `x-hotel-id` o `hotelId` para indicar el hotel.

---

## 🧱 Endpoints administrativos (`/admin`)

> Requieren `Authorization: Bearer <token>`  
> Si sos `ADMIN`, no te olvides de mandar el hotel al que apuntás con `x-hotel-id` o `?hotelId=slug`.

---

### 🏨 Hoteles (`/admin/hotels`)

- **GET** `/admin/hotels` → listado con búsqueda (`search`) y paginación (`page`, `pageSize`)  
- **POST** `/admin/hotels` → crear un nuevo hotel  
- **GET** `/admin/hotels/:id` → detalle de un hotel  
- **PATCH** `/admin/hotels/:id` → actualizar datos puntuales  
- **DELETE** `/admin/hotels/:id` → eliminar hotel (chau hotel 👋)

---

### 📂 Categorías (`/admin/categories`)

> `ADMIN`: tiene que indicar el hotel (`x-hotel-id` o `hotelId`)  
> `MANAGER`: ya está vinculado, no hace falta.

- **GET** `/admin/categories` → lista paginada con filtros (`search`, `parentId`, `includeChildren`, `includeAttributes`, `page`, `pageSize`)  
- **POST** `/admin/categories`
  ```json
  {
    "name": "Viandas",
    "key": "viandas",
    "description": "Viandas listas para llevar",
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
- **PATCH** `/admin/categories/:id` → actualiza lo que necesites  
- **DELETE** `/admin/categories/:id` → borra la categoría  
- **POST** `/admin/categories/:id/attributes` → crear atributos personalizados  
- **PATCH** `/admin/categories/:id/attributes/:attributeId`
- **DELETE** `/admin/categories/:id/attributes/:attributeId`
- **POST** `/admin/categories/:id/attributes/:attributeId/options`
- **PATCH** `/admin/categories/:id/attributes/:attributeId/options/:optionId`
- **DELETE** `/admin/categories/:id/attributes/:attributeId/options/:optionId`

---

### 🍝 Productos (`/admin/products`)

> `ADMIN`: indicar hotel con `x-hotel-id` o `hotelId`.  
> `MANAGER`: ya se asocia automáticamente.

- **GET** `/admin/products` → admite filtros:  
  `search`, `categoryIds`, `isActive`, `minPrice`, `maxPrice`, `variantOptionId`, `attributes` (JSON), `page`, `pageSize`, `includeCategories`, `includeVariants`, `includeAttributes`, `includeBundles`.
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
  También se pueden incluir `variantGroups`, `attributeValues`, `customAttributes`, `bundleItems`.
- **GET** `/admin/products/:id`
- **PATCH** `/admin/products/:id` → reemplaza colecciones si se mandan (`categoryIds`, `variantGroups`, etc.)
- **DELETE** `/admin/products/:id` → elimina el producto

---

## 🌎 Endpoints públicos (`/public`)

> No requieren autenticación, pero sí indicar el hotel (`x-hotel-id` o `?hotelId=`).  
> Puede ser el ID o el slug.

### Categorías públicas (`/public/categories`)

- **GET** `/public/categories` → mismos filtros que la versión admin  
- **GET** `/public/categories/:id` → acepta `includeChildren`, `includeAttributes`

### Productos públicos (`/public/products`)

- **GET** `/public/products` → mismos filtros que `/admin/products`  
- **GET** `/public/products/:id` → flags `includeCategories`, `includeVariants`, `includeAttributes`, `includeBundles`

---

## 🚨 Formato de errores

Cuando algo falla en la validación, la API responde así:

```json
{
  "message": "Validation failed",
  "issues": [
    {
      "path": ["body", "name"],
      "message": "El nombre tiene que tener al menos 2 caracteres"
    }
  ]
}
```

Simple, claro y útil para debuggear sin volverse loco.

---

## 🧩 Modelos y base

Si querés ver cómo está armado el esquema completo, mirate el archivo:  
`prisma/schema.prisma`

Ahí vas a encontrar todos los modelos, relaciones y claves foráneas.

---

## ✨ Autor

**Hecho por Elías**  
> “Donde hay un bug, hay una historia para contar.” 🧉

---