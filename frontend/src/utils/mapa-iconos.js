import L from 'leaflet';

// Marcadores de color para el mapa del cliente.
// Se generan con divIcon y un SVG en linea para no depender de imagenes externas
// (asi funcionan igual sin conexion, con el Service Worker activo).

function crearIconoPin(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="38" viewBox="0 0 26 38">
      <path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 25 13 25s13-15.25 13-25C26 5.82 20.18 0 13 0z"
            fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="13" cy="13" r="5" fill="#ffffff"/>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: 'autocare-marcador',
    iconSize: [26, 38],
    iconAnchor: [13, 38],
    popupAnchor: [0, -34],
  });
}

// Azul: talleres mecanicos. Rojo: tiendas de repuestos.
export const ICONO_TALLER = crearIconoPin('#1d4ed8');
export const ICONO_TIENDA = crearIconoPin('#dc2626');

export const COLOR_TALLER = '#1d4ed8';
export const COLOR_TIENDA = '#dc2626';

export default { ICONO_TALLER, ICONO_TIENDA, COLOR_TALLER, COLOR_TIENDA };
