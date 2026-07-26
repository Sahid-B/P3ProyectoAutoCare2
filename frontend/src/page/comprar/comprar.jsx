import { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  Progress,
  SimpleGrid,
  Skeleton,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  Button,
} from '@chakra-ui/react';
import {
  FaCarRear,
  FaImage,
  FaEnvelope,
} from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import { getAllListings } from '../../services/marketplace-service.js';

const veredictos = {
  oportunidad: { label: 'Oportunidad', color: 'green' },
  precio_justo: { label: 'Precio justo', color: 'blue' },
  sobrevalorado: { label: 'Sobrevalorado', color: 'red' },
};

function moneda(valor) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(valor || 0));
}

function Comprar() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    getAllListings()
      .then((respuesta) => {
        if (activo) setPublicaciones(respuesta.data || []);
      })
      .catch((err) => {
        if (activo) setError(err.message || 'No se pudieron cargar los vehiculos.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  return (
    <Layout conSidebar>
      <Flex align="center" justify="space-between" gap={4} flexWrap="wrap" mb={6}>
        <Box>
          <Heading as="h1" size="xl" color="brand.800">
            Comprar Vehiculos
          </Heading>
          <Text fontSize="sm" color="secondary.600">
            Explora el catalogo de vehiculos publicados por otros usuarios.
          </Text>
        </Box>
      </Flex>

      {error && (
        <Alert status="error" borderRadius="md" mb={6} fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {cargando ? (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} height="400px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      ) : publicaciones.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          textAlign="center"
          py={14}
          bg="white"
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="lg"
        >
          <Icon as={FaImage} boxSize={10} color="brand.300" mb={3} />
          <Heading as="h3" size="sm" mb={2}>
            Aun no hay autos publicados
          </Heading>
          <Text color="secondary.600">Vuelve mas tarde para ver las ofertas.</Text>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
          {publicaciones.map((item) => {
            const veredicto = veredictos[item.veredicto] || veredictos.precio_justo;
            return (
              <Box
                key={item.id}
                bg="white"
                borderWidth="1px"
                borderColor="secondary.200"
                borderRadius="lg"
                overflow="hidden"
                boxShadow="sm"
                display="flex"
                flexDirection="column"
              >
                {item.imagen_url ? (
                  <Image src={item.imagen_url} alt={`${item.marca} ${item.modelo}`} w="100%" h="210px" objectFit="cover" />
                ) : (
                  <Flex h="210px" bg="secondary.100" align="center" justify="center" color="secondary.500">
                    <Icon as={FaCarRear} boxSize={12} />
                  </Flex>
                )}
                <Box p={5} display="flex" flexDirection="column" flex="1">
                  <Flex justify="space-between" gap={3} mb={3}>
                    <Box>
                      <Heading as="h3" size="md" color="brand.800">
                        {item.marca} {item.modelo}
                      </Heading>
                      <Text fontSize="sm" color="secondary.600">
                        {item.anio} - {Number(item.kilometraje).toLocaleString('es-EC')} km
                        {item.ciudad ? ` - ${item.ciudad}` : ''}
                      </Text>
                    </Box>
                    <Badge colorScheme={veredicto.color} alignSelf="flex-start" borderRadius="full" px={3}>
                      {veredicto.label}
                    </Badge>
                  </Flex>

                  <SimpleGrid columns={2} spacing={4} mb={4}>
                    <Stat>
                      <StatLabel>Precio</StatLabel>
                      <StatNumber fontSize="xl">{moneda(item.precio_vendedor)}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Sugerido</StatLabel>
                      <StatNumber fontSize="xl" color="brand.700">
                        {moneda(item.precio_sugerido)}
                      </StatNumber>
                    </Stat>
                  </SimpleGrid>

                  <Progress value={item.puntaje} colorScheme={veredicto.color} borderRadius="full" mb={3} />
                  <Text fontSize="sm" color="secondary.700" mb={4} noOfLines={3}>
                    {item.analisis}
                  </Text>

                  <Box mt="auto" pt={4} borderTopWidth="1px" borderColor="gray.100">
                    <Text fontSize="xs" color="gray.500" mb={2}>
                      Vendido por: {item.vendedor_nombre} {item.vendedor_apellido}
                    </Text>
                    <Button
                      as="a"
                      href={`mailto:${item.vendedor_correo}?subject=Me interesa tu ${item.marca} ${item.modelo}`}
                      variant="outline"
                      colorScheme="brand"
                      size="sm"
                      width="100%"
                      leftIcon={<FaEnvelope />}
                    >
                      Contactar Vendedor
                    </Button>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </SimpleGrid>
      )}
    </Layout>
  );
}

export default Comprar;
