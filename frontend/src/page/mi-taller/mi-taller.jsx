import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  useToast,
  Flex
} from '@chakra-ui/react';
import Layout from '../../components/layout/index.jsx';
import Input from '../../components/input/index.jsx';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../../context/auth-context.jsx';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position === null ? null : <Marker position={position} />;
}

function MiTaller() {
  const [formulario, setFormulario] = useState({
    nombre_taller: '',
    direccion: '',
    telefono: '',
    latitud: null,
    longitud: null,
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { token } = useAuth();
  const toast = useToast();

  useEffect(() => {
    async function cargarTaller() {
      try {
        const res = await fetch('http://localhost:3000/api/talleres/mi-taller', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success && data.taller) {
          setFormulario({
            nombre_taller: data.taller.nombre_taller || '',
            direccion: data.taller.direccion || '',
            telefono: data.taller.telefono || '',
            latitud: data.taller.latitud,
            longitud: data.taller.longitud,
          });
        }
      } catch (error) {
        console.error('Error al cargar mi taller:', error);
      } finally {
        setCargando(false);
      }
    }
    cargarTaller();
  }, [token]);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formulario.nombre_taller.trim() || !formulario.direccion.trim() || formulario.latitud === null || formulario.longitud === null) {
      setErrorMsg('Nombre, dirección y ubicación en el mapa son obligatorios.');
      return;
    }

    try {
      setGuardando(true);
      const res = await fetch('http://localhost:3000/api/talleres/mi-taller', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formulario)
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Taller actualizado',
          description: 'Tus datos se guardaron correctamente.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        setErrorMsg(data.message || 'Error al actualizar taller');
      }
    } catch (err) {
      setErrorMsg('Error de red al actualizar');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <Layout conSidebar>
        <Flex justify="center" align="center" h="50vh">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      </Layout>
    );
  }

  return (
    <Layout conSidebar>
      <Box p={6} maxW="900px" mx="auto">
        <Heading mb={2} color="secondary.800">Mi Taller</Heading>
        <Text color="secondary.600" mb={6}>
          Actualiza la información y ubicación de tu taller para que los clientes te encuentren.
        </Text>

        {errorMsg && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            {errorMsg}
          </Alert>
        )}

        <Box as="form" onSubmit={manejarEnvio} bg="white" p={6} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="secondary.200">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacingX={8}>
            <Box>
              <Input
                label="Nombre del Taller"
                name="nombre_taller"
                value={formulario.nombre_taller}
                onChange={manejarCambio}
                placeholder="Ej. Mecánica López"
                required
              />
              <Input
                label="Dirección"
                name="direccion"
                value={formulario.direccion}
                onChange={manejarCambio}
                placeholder="Calle 123 y Av. Principal"
                required
              />
              <Input
                label="Teléfono"
                name="telefono"
                value={formulario.telefono}
                onChange={manejarCambio}
                placeholder="0991234567"
              />
              <Button type="submit" variant="primary" w="full" mt={6} isLoading={guardando}>
                Guardar Cambios
              </Button>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>Ubicación en el Mapa</Text>
              <Text fontSize="xs" color="gray.500" mb={2}>Haz clic en el mapa para actualizar la ubicación exacta.</Text>
              
              <Box h="300px" borderRadius="md" overflow="hidden" border="1px solid" borderColor="gray.300">
                {formulario.latitud !== null ? (
                  <MapContainer 
                    center={[formulario.latitud, formulario.longitud]} 
                    zoom={15} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationMarker 
                      position={[formulario.latitud, formulario.longitud]} 
                      setPosition={(pos) => setFormulario(prev => ({...prev, latitud: pos[0], longitud: pos[1]}))} 
                    />
                  </MapContainer>
                ) : (
                  <Flex h="100%" justify="center" align="center" bg="gray.100">
                    <Text>Cargando mapa...</Text>
                  </Flex>
                )}
              </Box>
            </Box>
          </SimpleGrid>
        </Box>
      </Box>
    </Layout>
  );
}

export default MiTaller;
