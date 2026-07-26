import { useEffect } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Icono por defecto de Leaflet (en un bundle de Vite hay que declararlo a mano).
const IconoPorDefecto = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});

// Ubicacion inicial si el navegador no entrega la geolocalizacion (Guayaquil).
const UBICACION_POR_DEFECTO = { latitud: -2.1894, longitud: -79.8891 };

function MarcadorSeleccionable({ posicion, alSeleccionar }) {
  useMapEvents({
    click(evento) {
      alSeleccionar(evento.latlng.lat, evento.latlng.lng);
    },
  });

  if (!posicion) return null;
  return <Marker position={posicion} icon={IconoPorDefecto} />;
}

/**
 * Mapa reutilizable para elegir la ubicacion de un local.
 * Pide la geolocalizacion del navegador la primera vez y, si no esta
 * disponible, cae en una ubicacion por defecto.
 */
function MapaSelector({
  latitud,
  longitud,
  alCambiar,
  altura = '280px',
  zoom = 14,
  ayuda = 'Haz clic en el mapa para marcar la ubicacion exacta de tu local.',
}) {
  const sinUbicacion = latitud === null || latitud === undefined || longitud === null || longitud === undefined;

  useEffect(() => {
    if (!sinUbicacion) return;

    if (!navigator.geolocation) {
      alCambiar(UBICACION_POR_DEFECTO.latitud, UBICACION_POR_DEFECTO.longitud);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) => alCambiar(posicion.coords.latitude, posicion.coords.longitude),
      () => alCambiar(UBICACION_POR_DEFECTO.latitud, UBICACION_POR_DEFECTO.longitud),
    );
  }, [sinUbicacion, alCambiar]);

  return (
    <Box>
      {ayuda && (
        <Text fontSize="xs" color="secondary.500" mb={2}>
          {ayuda}
        </Text>
      )}

      <Box
        h={altura}
        borderRadius="md"
        overflow="hidden"
        borderWidth="1px"
        borderColor="secondary.300"
      >
        {sinUbicacion ? (
          <Flex h="100%" bg="secondary.100" align="center" justify="center">
            <Text fontSize="sm" color="secondary.500">
              Cargando mapa...
            </Text>
          </Flex>
        ) : (
          <MapContainer
            center={[latitud, longitud]}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MarcadorSeleccionable posicion={[latitud, longitud]} alSeleccionar={alCambiar} />
          </MapContainer>
        )}
      </Box>

      {!sinUbicacion && (
        <Text fontSize="xs" color="secondary.500" mt={2}>
          Coordenadas seleccionadas: {Number(latitud).toFixed(5)}, {Number(longitud).toFixed(5)}
        </Text>
      )}
    </Box>
  );
}

export default MapaSelector;
