# AutoCare — Frontend

Aplicacion React construida con Vite. Forma parte del proyecto AutoCare (Grupo 5).

## Scripts

| Comando | Descripcion |
| ------- | ----------- |
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run build` | Compilacion de produccion en `dist/` (genera el Service Worker) |
| `npm run preview` | Sirve la compilacion de produccion |
| `npm run lint` | Revision del codigo con ESLint |

## Variables de entorno

Copiar `.env.example` como `.env`:

```
VITE_API_URL=http://localhost:3000/api
```

## Organizacion del codigo

- `src/components/` — componentes reutilizables. Cada uno en su carpeta con
  `nombre.jsx`, `nombre.module.css` e `index.jsx`. Se exportan todos desde `src/components/index.jsx`.
- `src/page/` — paginas de la aplicacion, con la misma estructura de carpetas.
- `src/router/app-router.jsx` — definicion de las rutas con React Router.
- `src/services/api-service.js` — acceso al backend.
- `src/theme/theme.js` — tema de Chakra UI con la identidad visual de AutoCare
  (paleta, tipografia, bordes, sombras, espaciados y variantes del boton).
- `src/index.css` — estilos globales minimos (el reset lo aporta Chakra UI).

La interfaz se construye con Chakra UI. Los archivos `.module.css` de cada componente se
conservan para no alterar la estructura del proyecto, pero ya no contienen estilos activos:
el diseno vive en el tema y en las props de Chakra.

## Configuracion de Chakra UI

- `src/main.jsx` envuelve la aplicacion con `ChakraProvider` y el tema, e incluye
  `ColorModeScript`.
- `src/theme/theme.js` define la identidad visual con `extendTheme`.

## Componentes disponibles

| Componente | Props |
| ---------- | ----- |
| `Button` | `children`, `type`, `variant` (`primary` \| `secondary` \| `outline`), `onClick`, `disabled`, `className` |
| `Input` | `label`, `type`, `name`, `value`, `onChange`, `placeholder`, `error`, `required`, `disabled` |
| `Header` | Logo, nombre, enlaces a Inicio/Login/Registro y menu responsive |
| `Footer` | Nombre del proyecto, grupo, asignatura y anio actual |
| `Sidebar` | Enlaces del area privada (Dashboard, Vehiculos, Mantenimientos, Historial, Perfil) |
| `Layout` | `children` y `conSidebar` para la variante del dashboard |

## PWA

Configuracion base:

- `public/manifest.webmanifest` enlazado desde `index.html`.
- Iconos en `public/icons/` (192, 512 y maskable 512).
- Service Worker generado por `vite-plugin-pwa` al ejecutar `npm run build`.

En modo desarrollo el Service Worker no se registra. Para probar la instalacion:

```bash
npm run build
npm run preview
```

Todavia no se implementan IndexedDB, sincronizacion, cache avanzada ni notificaciones push.
