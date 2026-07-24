# Parte 1 — Base del proyecto AutoCare

Responsable: Jhonny Romero.

## Objetivo

Dejar funcionando la base completa y organizada del proyecto, sin logica de negocio.

## Alcance entregado

### Frontend (React + Vite)

- Proyecto Vite con React y React Router.
- Componentes reutilizables en `src/components/`: Button, Input, Header, Footer, Sidebar y Layout.
- Paginas en `src/page/`: Inicio, Login, Registro, Dashboard, En construccion y No encontrado.
- Variables CSS globales en `src/index.css` y estilos por componente con CSS Modules.
- Diseno responsive: menu movil en el Header, rejillas fluidas y sidebar adaptable.
- Servicio `src/services/api-service.js` para consultar el backend.

### Backend (Node.js + Express)

- Aplicacion Express separada en `app.js` (configuracion) y `server.js` (arranque).
- Pool de PostgreSQL en `src/config/database.js` con reintentos de conexion.
- Endpoint `GET /api/health` que consulta realmente la base de datos.
- CORS restringido al origen del frontend mediante `FRONTEND_URL`.

### Base de datos

- `database/init.sql` con la tabla de control `app_status` y un registro inicial de AutoCare.
- El script se ejecuta automaticamente al crear el contenedor de PostgreSQL.

### Infraestructura

- `frontend/Dockerfile`, `backend/Dockerfile` y `docker-compose.yml`.
- Healthcheck de PostgreSQL con `pg_isready`; el backend depende del estado saludable.
- Volumen `autocare-datos` para conservar la informacion de la base.

### PWA

- `manifest.webmanifest` con nombre, colores, `display: standalone` e iconos.
- Iconos 192, 512 y maskable generados a partir del logo.
- Service Worker base generado por `vite-plugin-pwa` durante el build.

## Decisiones tomadas

1. **Pagina `en-construccion` reutilizable.** Las rutas `/vehiculos`, `/mantenimientos`,
   `/historial` y `/perfil` deben existir, pero su contenido llega en partes posteriores.
   En lugar de crear cuatro paginas casi identicas se creo un unico componente que recibe
   el titulo y la descripcion como props.
2. **Sin `ProtectedRoute`.** Todavia no existe autenticacion, por lo que proteger rutas no
   tendria efecto real. Se agregara en la Parte 2.
3. **Frontend en modo desarrollo dentro de Docker.** En esta fase interesa poder trabajar y ver
   los cambios; la imagen de produccion con Nginx se preparara en la parte de despliegue.
4. **Datos simulados marcados.** El dashboard muestra un aviso y una etiqueta "Datos temporales"
   para dejar claro en la defensa que la informacion no proviene de la base de datos.
5. **`NPM_STRICT_SSL` como build arg.** El equipo de desarrollo tiene un antivirus que intercepta
   HTTPS y rompe `npm` dentro de los contenedores. El valor por defecto es `true`, de modo que en
   equipos normales no cambia nada.

## Verificacion realizada

| Comprobacion | Resultado |
| ------------ | --------- |
| `npm run lint` (frontend) | Sin errores ni advertencias |
| `npm run build` (frontend) | Compila; genera `dist/sw.js` con 12 archivos precargados |
| `docker compose up --build` | Los tres contenedores levantan correctamente |
| Healthcheck de PostgreSQL | `healthy` |
| `GET /api/health` | `success: true`, `database: connected` |
| Tabla `app_status` | Creada con el registro AutoCare 0.1.0 |
| Rutas del frontend | Las 9 rutas responden y renderizan su pagina |
| Consola del navegador | Sin errores en ninguna pagina |

## Pendiente para las siguientes partes

- Parte 2 (Sahid): autenticacion real, tablas de usuarios, JWT, bcrypt y rutas protegidas.
- Parte 3 (Jhonny): vehiculos, mantenimientos, calculo de proximos servicios e historial.
- Parte 4 (Sahid): offline con IndexedDB, sincronizacion, notificaciones push, testing y despliegue.
