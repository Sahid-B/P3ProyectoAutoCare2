import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Stack,
  Button,
  Badge,
} from '@chakra-ui/react';
import { FaLocationDot, FaPhone } from 'react-icons/fa6';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Layout from '../../components/layout/index.jsx';

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function Talleres() {
  const [talleres, setTalleres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargarTalleres() {
      try {
        setCargando(true);
        const token = localStorage.getItem('autocare_token');
        const res = await fetch('http://localhost:3000/api/talleres', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (data.success) {
          setTalleres(data.data);
        } else {
          setError(data.message || 'Error al cargar talleres');
        }
      } catch (err) {
        setError('No se pudo conectar con el servidor.');
      } finally {
        setCargando(false);
      }
    }
    
    cargarTalleres();
  }, []);

  return (
    <Layout conSidebar>
      <Box p={6}>
        <Heading mb={2} color="secondary.800">
          Directorio de Talleres
        </Heading>
        <Text color="secondary.600" mb={6}>
          Encuentra los mejores talleres mecanicos cerca de ti.
        </Text>

        {error && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {cargando ? (
          <Flex justify="center" align="center" h="200px">
            <Spinner size="xl" color="brand.500" />
          </Flex>
        ) : (
          <Flex direction={{ base: 'column', lg: 'row' }} gap={6} h="calc(100vh - 200px)" minH="600px">
            {/* Lado Izquierdo: Lista de Tarjetas */}
            <Box flex="1" overflowY="auto" pr={2}>
              {talleres.length === 0 ? (
                <Text color="secondary.500">No hay talleres registrados aun.</Text>
              ) : (
                <Stack spacing={4}>
                  {talleres.map((taller) => (
                    <Card key={taller.id} variant="outline" borderColor="secondary.200" _hover={{ borderColor: 'brand.400', boxShadow: 'md' }}>
                      <CardBody>
                        <Flex justify="space-between" align="flex-start" mb={2}>
                          <Heading size="md" color="secondary.800">{taller.nombre_taller}</Heading>
                          <Badge colorScheme="green">⭐ {taller.calificacion || '5.0'}</Badge>
                        </Flex>
                        
                        <Flex align="center" color="secondary.600" mb={1} fontSize="sm">
                          <FaLocationDot style={{ marginRight: '8px' }} />
                          <Text>{taller.direccion}</Text>
                        </Flex>
                        
                        {taller.telefono && (
                          <Flex align="center" color="secondary.600" mb={4} fontSize="sm">
                            <FaPhone style={{ marginRight: '8px' }} />
                            <Text>{taller.telefono}</Text>
                          </Flex>
                        )}
                        
                        <Button 
                          as="a" 
                          href={`mailto:${taller.correo}?subject=Consulta%20desde%20AutoCare`}
                          size="sm" 
                          variant="primary" 
                          w="full"
                        >
                          Contactar Vía Correo
                        </Button>
                      </CardBody>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>

            {/* Lado Derecho: Mapa Grande */}
            <Box flex={{ base: "none", lg: "2" }} h={{ base: "400px", lg: "100%" }} borderRadius="lg" overflow="hidden" boxShadow="md" border="1px solid" borderColor="secondary.200">
              {talleres.length > 0 ? (
                <MapContainer 
                  center={[talleres[0].latitud, talleres[0].longitud]} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {talleres.map(taller => (
                    <Marker key={taller.id} position={[taller.latitud, taller.longitud]}>
                      <Popup>
                        <strong>{taller.nombre_taller}</strong><br />
                        {taller.direccion}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <Flex h="100%" bg="gray.100" justify="center" align="center">
                  <Text color="gray.500">No hay ubicaciones para mostrar.</Text>
                </Flex>
              )}
            </Box>
          </Flex>
        )}
      </Box>
    </Layout>
  );
}

export default Talleres;
