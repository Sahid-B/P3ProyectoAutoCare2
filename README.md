# AutoCare

Progressive Web App para controlar y dar seguimiento al mantenimiento de vehiculos.

Proyecto de la asignatura **Programacion Integrativa de Componentes Web** — **Grupo 5**.

---

## Descripcion

AutoCare permite registrar vehiculos, guardar los mantenimientos realizados, calcular cuando toca
el proximo servicio y avisar al usuario antes de que se le pase la fecha.

## Problema que resuelve

Muchas personas olvidan mantenimientos importantes de su vehiculo:

- cambio de aceite
- cambio de filtros
- revision de frenos
- cambio de llantas
- revision de bateria
- matricula
- seguro
- revision tecnica

Ese descuido produce averias evitables, gastos mayores y multas. AutoCare centraliza esa
informacion y avisa a tiempo.

## Integrantes

| Integrante | Partes a cargo |
| ---------- | -------------- |
| Jhonny Romero | Parte 1 y Parte 3 |
| Sahid | Parte 2 y Parte 4 |

## Tecnologias

**Frontend**

- React
- Vite
- React Router
- Chakra UI (libreria de interfaz) + Emotion + Framer Motion
- vite-plugin-pwa (configuracion base de PWA)

**Backend**

- Node.js
- Express
- pg (cliente de PostgreSQL)
- cors, dotenv

**Infraestructura**

- PostgreSQL 16
- Docker y Docker Compose

## Estructura del proyecto

```
Proyecto/                     <- raiz del repositorio (autocare)
├── frontend/                 <- aplicacion React + Vite
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── logo-autocare.png
│   │   ├── logo-autocare.svg
│   │   ├── icons/
│   │   └── manifest.webmanifest
│   ├── src/
│   │   ├── assets/images/
│   │   ├── components/       <- button, input, header, footer, sidebar, layout
│   │   ├── page/             <- inicio, login, registro, dashboard, no-encontrado, en-construccion
│   │   ├── router/app-router.jsx
│   │   ├── services/api-service.js
│   │   ├── theme/theme.js    <- identidad visual (tema de Chakra UI)
│   │   ├── App.jsx / App.css
│   │   ├── main.jsx
│   │   └── index.css         <- estilos globales minimos
│   ├── .env.example
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── README.md
├── backend/                  <- API Express
│   ├── src/
│   │   ├── config/database.js
│   │   ├── routes/health-routes.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
├── database/
│   └── init.sql
├── docs/
│   └── parte-1.md
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

Cada componente y cada pagina viven en su propia carpeta con tres archivos:
`nombre.jsx`, `nombre.module.css` e `index.jsx`. La capa visual usa Chakra UI; los
archivos `.module.css` se conservan para mantener la estructura, pero el diseno se define
en el tema (`src/theme/theme.js`) y con las props de Chakra.

## Requisitos

- Node.js 20 o superior (se probo con Node 22)
- npm 10 o superior
- Docker Desktop (para la ejecucion con contenedores)
- PostgreSQL 16 (solo si se ejecuta sin Docker)

## Variables de entorno

No se suben archivos `.env` reales al repositorio; estan incluidos en `.gitignore`.
Cada carpeta trae su archivo de ejemplo.

**`frontend/.env.example`**

```
VITE_API_URL=http://localhost:3000/api
```

**`backend/.env.example`**

```
PORT=3000
DB_HOST=database        # usar localhost si se ejecuta sin Docker
DB_PORT=5432
DB_NAME=autocare
DB_USER=autocare_user
DB_PASSWORD=change_this_password
FRONTEND_URL=http://localhost:5173
```

**`.env.example` (raiz, usado por docker-compose)**

```
DB_NAME=autocare
DB_USER=autocare_user
DB_PASSWORD=change_this_password
NPM_STRICT_SSL=true
```

## Ejecucion con Docker (recomendada)

```bash
cp .env.example .env          # en Windows: copy .env.example .env
docker compose up --build
```

Levanta los tres servicios:

| Servicio | Contenedor | Puerto |
| -------- | ---------- | ------ |
| frontend | autocare-frontend | 5173 |
| backend | autocare-backend | 3000 |
| database (PostgreSQL) | autocare-database | 5432 |

La base de datos tiene `healthcheck` con `pg_isready` y el backend solo arranca cuando esta
saludable. Ademas el backend reintenta la conexion por si la base tarda en responder.

Para detener los servicios:

```bash
docker compose down           # agregar -v para borrar tambien el volumen de datos
```

## Ejecucion local (sin Docker)

Requiere PostgreSQL instalado y la base `autocare` creada con el script `database/init.sql`.

**Backend**

```bash
cd backend
npm install
copy .env.example .env        # y cambiar DB_HOST=localhost
npm run dev
```

**Frontend**

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## URLs

| Recurso | URL |
| ------- | --- |
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| Estado del servicio | http://localhost:3000/api/health |

## Endpoint `/api/health`

`GET http://localhost:3000/api/health` comprueba realmente la conexion con PostgreSQL
(ejecuta una consulta contra la base) y responde:

```json
{
  "success": true,
  "project": "AutoCare",
  "api": "online",
  "database": "connected",
  "timestamp": "2026-07-23T17:19:00.811Z"
}
```

Si PostgreSQL no responde, devuelve el mismo cuerpo con `"success": false`,
`"database": "disconnected"` y codigo HTTP 503.

## Rutas del frontend

| Ruta | Contenido |
| ---- | --------- |
| `/` | Landing page de AutoCare |
| `/login` | Formulario de inicio de sesion (solo interfaz) |
| `/registro` | Formulario de registro (solo interfaz) |
| `/dashboard` | Panel con datos simulados y estado real del backend |
| `/vehiculos` | Pagina temporal |
| `/mantenimientos` | Pagina temporal |
| `/historial` | Pagina temporal |
| `/perfil` | Pagina temporal |
| `*` | Pagina 404 |

## Division del proyecto

| Parte | Responsable | Contenido |
| ----- | ----------- | --------- |
| Parte 1 | Jhonny | Base del proyecto: estructura, frontend, backend, PostgreSQL, Docker, PWA inicial |
| Parte 2 | Sahid | Autenticacion real (registro, login, JWT, hash de contrasenas) y tablas de usuarios |
| Parte 3 | Jhonny | Modulos de vehiculos y mantenimientos, calculo de proximos servicios, historial |
| Parte 4 | Sahid | Funcionamiento offline, sincronizacion, notificaciones push, testing y despliegue |

## Estado actual (Parte 1 terminada)

Implementado y verificado:

- Estructura completa del proyecto (frontend, backend, database, docs).
- Frontend React + Vite con React Router.
- Interfaz construida con Chakra UI y un tema propio (`src/theme/theme.js`) con la
  identidad visual de AutoCare: paleta (primary, secondary, success, warning, error),
  tipografia, bordes, sombras y espaciados.
- Componentes reutilizables: Button, Input, Header, Footer, Sidebar y Layout.
- Paginas: Inicio, Login, Registro, Dashboard, pagina temporal y 404.
- Diseno responsive con menu movil (Drawer) en el Header.
- Configuracion base de PWA: `manifest.webmanifest`, iconos y Service Worker generado por
  vite-plugin-pwa.
- Backend Express con CORS, dotenv y pool de PostgreSQL.
- Endpoint `GET /api/health` que comprueba realmente la base de datos.
- `database/init.sql` con la tabla de control `app_status`.
- Dockerfiles y `docker-compose.yml` con healthcheck de PostgreSQL.

Todavia **no** implementado (corresponde a las siguientes partes):

- Autenticacion real, JWT, hash de contrasenas y rutas protegidas.
- CRUD de vehiculos y mantenimientos; los datos del dashboard son simulados.
- Tablas de usuarios, vehiculos y mantenimientos.
- IndexedDB, funcionamiento offline completo, sincronizacion y notificaciones push.
- Testing automatizado y despliegue.

## Lo que desarrollara Sahid en la Parte 2

1. Tablas `users` (y las que necesite) en `database/init.sql`.
2. Backend: `auth-controller`, `auth-routes`, modelo de usuario, `bcrypt` para el hash de
   contrasenas y `jsonwebtoken` para los tokens.
3. Middleware de autenticacion para proteger rutas de la API.
4. Frontend: conectar los formularios de `/login` y `/registro` con el backend usando
   `src/services/api-service.js`, guardar la sesion y crear el componente `ProtectedRoute`
   para `/dashboard` y las rutas privadas.
5. Pagina de perfil con los datos reales del usuario autenticado.

## Nota sobre el logo

El logo actual (`frontend/public/logo-autocare.png` y su version `.svg`) fue creado para el
proyecto porque no existia un archivo previo. Si el grupo define un logo oficial, basta con
reemplazar `frontend/public/logo-autocare.png` conservando el mismo nombre; los iconos de la PWA
estan en `frontend/public/icons/`.

## Problema conocido al construir con Docker

Si un antivirus o proxy corporativo intercepta las conexiones HTTPS, `npm` falla dentro del
contenedor con `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. En ese caso, poner `NPM_STRICT_SSL=false` en el
archivo `.env` de la raiz antes de `docker compose up --build`. El valor por defecto es `true`.
