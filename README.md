# 🏨 Magna Hoteles – Proyecto Fullstack

Aplicación **multi-tenant** para la gestión de menús digitales por hotel.  
Cada hotel puede administrar su propio catálogo de **categorías**, **productos**, **atributos personalizados**, **variantes** y **bandejas**, todo reutilizando una misma base backend.

Hecho con 💙 por **Elías**.

---

## ⚙️ Tecnologías principales

### Backend
- **Node.js + Express 5** (en **TypeScript**)
- **Prisma ORM** con **MySQL**
- **Zod** para validaciones
- Arquitectura modular (features en `src/modules`)

### Frontend
- **React + TypeScript + Vite**
- **TailwindCSS** para estilos
- **React Router** para navegación
- ESLint con reglas de tipado y configuración extendida

---

## 🚀 Puesta en marcha

### 🔧 Backend

```bash
cd backend
npm install
cp .env.example .env
# Ajustá DATABASE_URL, PORT y JWT_SECRET
# Si usás MySQL local:
# CREATE DATABASE IF NOT EXISTS magnahotelesQR CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Ejecutá las migraciones y generá el cliente Prisma:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Modo desarrollo:
```bash
npm run dev
```

Build y ejecución en producción:
```bash
npm run build
npm start
```

📦 **Datos de ejemplo**
```bash
npm run prisma:seed
```
Esto crea el hotel **“Magna Riviera”**, categorías **“Viandas”** y **“Pastas”**, y el producto **“Ravioles”**.

---

### 💻 Frontend

```bash
cd frontend
npm install
npm run dev
```

Abrí el navegador en [http://localhost:5173](http://localhost:5173)  
El frontend se conecta al backend configurado en las variables de entorno (`.env` o `vite.config.ts`).

---

## 🧱 Estructura del proyecto

### Backend
- `src/app.ts` → configuración base de Express y middlewares  
- `src/routes` → enrutador raíz (`/api`)  
- `src/modules/**` → cada dominio (hotels, categories, products, etc.)  
  - incluye `*.schema.ts`, `*.service.ts`, `*.controller.ts`, `*.routes.ts`
- `src/middleware` → multi-tenant (`x-hotel-id`), errores y validaciones  
- `src/lib/prisma.ts` → prisma client singleton  
- `prisma/schema.prisma` → modelado relacional  
- `docs/api.md` → documentación de endpoints  

### Frontend
- `src/components` → componentes reutilizables  
- `src/pages` → vistas principales  
- `src/routes` → configuración de rutas con React Router  
- `src/hooks` → lógica reutilizable (custom hooks)  
- `src/services` → conexión con el backend (fetch/axios)  
- `src/styles` → configuración de Tailwind y estilos globales  

---

## 🔐 Multi-tenancy y autenticación

Cada request a `/api/categories`, `/api/products`, etc., debe incluir el encabezado:

```
x-hotel-id: <id o slug del hotel>
```

o bien el query param `?hotelId=`.  
El middleware `hotelContext` se encarga de validar y propagar el identificador.

### Roles disponibles
- **ADMIN** → puede crear/modificar/eliminar hoteles y su contenido  
- **MANAGER** → puede editar el contenido del hotel asignado  
- **Público** → accede a `/api/public/**` pasando `x-hotel-id` o `hotelId`  

Autenticación mediante JWT:
```
Authorization: Bearer <token>
```

El token vincula al usuario con el hotel correspondiente.

---

## ✅ Validaciones y manejo de errores

- **Zod** se encarga de validar `params`, `query` y `body`
- Middleware centralizado `errorHandler` devuelve respuestas consistentes con códigos HTTP claros
- Respuestas limpias y mensajes descriptivos para debugging rápido

---

## 🔍 Búsquedas y filtros (API)

`GET /api/products` soporta:

- `search` → nombre, slug o descripción  
- `categoryIds` → lista CSV  
- `isActive`, `minPrice`, `maxPrice`  
- `variantOptionId`  
- `attributes` → JSON array (ej: `[{"attributeId": "...", "value": "..."}]`)  
- Flags extra: `includeCategories`, `includeVariants`, `includeAttributes`, `includeBundles`

---

## 🧪 Próximos pasos sugeridos

- Agregar política de **roles y permisos** más fina  
- Tests unitarios e integraciones automáticas  
- Agregar métricas y observabilidad (Prometheus / Grafana)  
- Panel de administración web con estadísticas y configuración por hotel  

---

## 🧠 Notas del frontend

El frontend parte de una plantilla **React + TypeScript + Vite**, con soporte para **Hot Module Reloading (HMR)** y ESLint configurado.

También podés:
- Habilitar el **React Compiler** (experimental)
- Extender ESLint para chequeos de tipo más estrictos
- Usar plugins como:
  - `eslint-plugin-react-x`
  - `eslint-plugin-react-dom`

---

## ✨ Autor

**Desarrollado por Elías**  
> “Compilo Sueños ✨ aunque a veces cuesta dormirse 😴🤣”

---

## 📜 Licencia

Este proyecto es de uso interno y educativo.  
Podés reutilizarlo citando la autoría o con fines de aprendizaje.

---
