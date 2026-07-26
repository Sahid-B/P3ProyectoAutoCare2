import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Stack,
  Button,
  Badge,
  Checkbox,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { FaLocationDot, FaPhone, FaClock, FaWrench, FaStore } from 'react-icons/fa6';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Layout from '../../components/layout/index.jsx';
import LeyendaMapa from '../../components/leyenda-mapa/index.jsx';
import { obtenerUbicacionesMapa } from '../../services/repuestos-service.js';
import { ICONO_TALLER, ICONO_TIENDA } from '../../utils/mapa-iconos.js';

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Centro por defecto del mapa cuando todavia no hay ubicaciones (Guayaquil).
const CENTRO_POR_DEFECTO = [-2.1894, -79.8891];

function Talleres() {
  const [talleres, setTalleres] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [verTalleres, setVerTalleres] = useState(true);
  const [verTiendas, setVerTiendas] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;

    async function cargarUbicaciones() {
      try {
        setCargando(true);
        const datos = await obtenerUbicacionesMapa();

        if (!activo) return;
        setTalleres(datos.talleres || []);
        setTiendas(datos.tiendas || []);
      } catch (err) {
        if (activo) setError(err.message || 'No se pudo conectar con el servidor.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarUbicaciones();
    return () => {
      activo = false;
    };
  }, []);

  const talleresVisibles = verTalleres ? talleres : [];
  const tiendasVisibles = verTiendas ? tiendas : [];
  const hayUbicaciones = talleresVisibles.length > 0 || tiendasVisibles.length > 0;
  const centroMapa = talleresVisibles[0] || tiendasVisibles[0];

  return (
    <Layout conSidebar>
      <Box p={{ base: 0, md: 2 }}>
        <Heading mb={2} color="secondary.800">
          Talleres y tiendas de repuestos
        </Heading>
        <Text color="secondary.600" mb={6}>
          Encuentra talleres mecanicos y tiendas de repuestos cerca de ti.
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
          <>
            <HStack spacing={6} mb={5} flexWrap="wrap">
              <Checkbox
                isChecked={verTalleres}
                onChange={(evento) => setVerTalleres(evento.target.checked)}
                colorScheme="blue"
              >
                <HStack spacing={2}>
                  <Icon as={FaWrench} color="blue.600" />
                  <Text fontSize="sm" color="secondary.700">
                    Talleres ({talleres.length})
                  </Text>
                </HStack>
              </Checkbox>

              <Checkbox
                isChecked={verTiendas}
                onChange={(evento) => setVerTiendas(evento.target.checked)}
                colorScheme="red"
              >
                <HStack spacing={2}>
                  <Icon as={FaStore} color="red.600" />
                  <Text fontSize="sm" color="secondary.700">
                    Tiendas de repuestos ({tiendas.length})
                  </Text>
                </HStack>
              </Checkbox>
            </HStack>

            <Flex direction={{ base: 'column', lg: 'row' }} gap={6} h={{ lg: 'calc(100vh - 260px)' }} minH={{ lg: '600px' }}>
              {/* Lado Izquierdo: Lista de Tarjetas */}
              <Box flex="1" overflowY={{ lg: 'auto' }} pr={{ lg: 2 }}>
                {!hayUbicaciones ? (
                  <Text color="secondary.500">No hay ubicaciones registradas aun.</Text>
                ) : (
                  <Stack spacing={4}>
                    {talleresVisibles.map((taller) => (
                      <Card
                        key={`taller-${taller.id}`}
                        variant="outline"
                        borderColor="secondary.200"
                        borderLeftWidth="4px"
                        borderLeftColor="blue.500"
                        _hover={{ borderColor: 'brand.400', boxShadow: 'md' }}
                      >
                        <CardBody>
                          <Flex justify="space-between" align="flex-start" mb={2} gap={2}>
                            <Box minW="0">
                              <Badge colorScheme="blue" mb={1}>Taller mecanico</Badge>
                              <Heading size="md" color="secondary.800" noOfLines={2}>
                                {taller.nombre}
                              </Heading>
                            </Box>
                            <Badge colorScheme="green" flexShrink={0}>
                              {Number(taller.calificacion || 5).toFixed(1)}
                            </Badge>
                          </Flex>

                          <Flex align="center" color="secondary.600" mb={1} fontSize="sm">
                            <FaLocationDot style={{ marginRight: '8px', flexShrink: 0 }} />
                            <Text>{taller.direccion}</Text>
                          </Flex>

                          {taller.telefono && (
                            <Flex align="center" color="secondary.600" mb={1} fontSize="sm">
                              <FaPhone style={{ marginRight: '8px', flexShrink: 0 }} />
                              <Text>{taller.telefono}</Text>
                            </Flex>
                          )}

                          {taller.horario && (
                            <Flex align="center" color="secondary.600" mb={4} fontSize="sm">
                              <FaClock style={{ marginRight: '8px', flexShrink: 0 }} />
                              <Text>{taller.horario}</Text>
                            </Flex>
                          )}

                          <Button
                            as="a"
                            href={`mailto:${taller.correo}?subject=Consulta%20desde%20AutoCare`}
                            size="sm"
                            variant="primary"
                            w="full"
                            mt={taller.horario ? 0 : 3}
                          >
                            Contactar Vía Correo
                          </Button>
                        </CardBody>
                      </Card>
                    ))}

                    {tiendasVisibles.map((tienda) => (
                      <Card
                        key={`tienda-${tienda.id}`}
                        variant="outline"
                        borderColor="secondary.200"
                        borderLeftWidth="4px"
                        borderLeftColor="red.500"
                        _hover={{ borderColor: 'brand.400', boxShadow: 'md' }}
                      >
                        <CardBody>
                          <Flex justify="space-between" align="flex-start" mb={2} gap={2}>
                            <Box minW="0">
                              <Badge colorScheme="red" mb={1}>Tienda de repuestos</Badge>
                              <Heading size="md" color="secondary.800" noOfLines={2}>
                                {tienda.nombre}
                              </Heading>
                            </Box>
                            <Badge colorScheme="purple" flexShrink={0}>
                              {tienda.totalProductos} productos
                            </Badge>
                          </Flex>

                          <Flex align="center" color="secondary.600" mb={1} fontSize="sm">
                            <FaLocationDot style={{ marginRight: '8px', flexShrink: 0 }} />
                            <Text>{tienda.direccion}</Text>
                          </Flex>

                          {tienda.telefono && (
                            <Flex align="center" color="secondary.600" mb={1} fontSize="sm">
                              <FaPhone style={{ marginRight: '8px', flexShrink: 0 }} />
                              <Text>{tienda.telefono}</Text>
                            </Flex>
                          )}

                          {tienda.horario && (
                            <Flex align="center" color="secondary.600" mb={4} fontSize="sm">
                              <FaClock style={{ marginRight: '8px', flexShrink: 0 }} />
                              <Text>{tienda.horario}</Text>
                            </Flex>
                          )}

                          <Button
                            size="sm"
                            variant="primary"
                            w="full"
                            mt={tienda.horario ? 0 : 3}
                            onClick={() => navigate(`/repuestos?tienda=${tienda.id}`)}
                          >
                            Ver productos
                          </Button>
                        </CardBody>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>

              {/* Lado Derecho: Mapa Grande */}
              <Box
                flex={{ base: 'none', lg: '2' }}
                h={{ base: '400px', lg: '100%' }}
                borderRadius="lg"
                overflow="hidden"
                boxShadow="md"
                border="1px solid"
                borderColor="secondary.200"
                position="relative"
              >
                <MapContainer
                  center={centroMapa ? [centroMapa.latitud, centroMapa.longitud] : CENTRO_POR_DEFECTO}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />

                  {/* Marcadores azules: talleres mecanicos */}
                  {talleresVisibles.map((taller) => (
                    <Marker
                      key={`marcador-taller-${taller.id}`}
                      position={[taller.latitud, taller.longitud]}
                      icon={ICONO_TALLER}
                    >
                      <Popup>
                        <strong>{taller.nombre}</strong>
                        <br />
                        {taller.direccion}
                        {taller.telefono && (
                          <>
                            <br />
                            Tel: {taller.telefono}
                          </>
                        )}
                        {taller.horario && (
                          <>
                            <br />
                            Horario: {taller.horario}
                          </>
                        )}
                        <br />
                        <a href={`mailto:${taller.correo}?subject=Consulta%20desde%20AutoCare`}>
                          Ver detalles
                        </a>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Marcadores rojos: tiendas de repuestos */}
                  {tiendasVisibles.map((tienda) => (
                    <Marker
                      key={`marcador-tienda-${tienda.id}`}
                      position={[tienda.latitud, tienda.longitud]}
                      icon={ICONO_TIENDA}
                    >
                      <Popup>
                        <strong>{tienda.nombre}</strong>
                        <br />
                        {tienda.direccion}
                        {tienda.telefono && (
                          <>
                            <br />
                            Tel: {tienda.telefono}
                          </>
                        )}
                        {tienda.horario && (
                          <>
                            <br />
                            Horario: {tienda.horario}
                          </>
                        )}
                        <br />
                        <Button
                          size="xs"
                          variant="primary"
                          mt={2}
                          onClick={() => navigate(`/repuestos?tienda=${tienda.id}`)}
                        >
                          Ver productos
                        </Button>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>

                <LeyendaMapa />
              </Box>
            </Flex>
          </>
        )}
      </Box>
    </Layout>
  );
}

export default Talleres;
