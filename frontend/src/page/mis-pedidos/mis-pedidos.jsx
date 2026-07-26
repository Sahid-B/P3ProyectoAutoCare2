import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { FaReceipt, FaStore, FaBoxOpen } from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import { obtenerMisCompras } from '../../services/repuestos-service.js';
import { moneda, fechaHora, COLOR_ESTADO_PEDIDO, COLOR_ESTADO_PAGO } from '../../utils/formato.js';

function MisPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const respuesta = await obtenerMisCompras();
        if (activo) setPedidos(respuesta.data || []);
      } catch (err) {
        if (activo) setError(err.message || 'No se pudieron cargar tus pedidos.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, []);

  if (cargando) {
    return (
      <Layout conSidebar>
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" color="brand.500" thickness="4px" />
        </Flex>
      </Layout>
    );
  }

  return (
    <Layout conSidebar>
      <Heading as="h1" size="lg" color="secondary.900" mb={1}>
        Mis pedidos de repuestos
      </Heading>
      <Text color="secondary.600" mb={6}>
        Consulta el estado de tus compras y el detalle de cada pedido.
      </Text>

      {error && (
        <Alert status="error" borderRadius="md" mb={5} fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {pedidos.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          textAlign="center"
          py={16}
          bg="white"
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="lg"
        >
          <Icon as={FaBoxOpen} boxSize={12} color="brand.300" mb={4} />
          <Heading as="h3" size="sm" color="secondary.900" mb={2}>
            Todavia no tienes pedidos
          </Heading>
          <Text color="secondary.600" fontSize="sm" mb={6}>
            Cuando compres repuestos apareceran aqui.
          </Text>
          <Button as={RouterLink} to="/repuestos" variant="primary">
            Ver repuestos
          </Button>
        </Flex>
      ) : (
        <Stack spacing={4}>
          {pedidos.map((pedido) => (
            <Card key={pedido.id} bg="white" borderRadius="lg" shadow="sm">
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} alignItems="center">
                  <Box>
                    <HStack spacing={2} mb={1}>
                      <Icon as={FaReceipt} color="brand.500" />
                      <Text fontWeight="bold" color="brand.700">
                        Pedido #{pedido.id}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="secondary.500">
                      {fechaHora(pedido.created_at)}
                    </Text>
                  </Box>

                  <Box>
                    <HStack spacing={2} color="secondary.700" mb={1}>
                      <Icon as={FaStore} />
                      <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                        {pedido.nombre_local}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="secondary.500">
                      {pedido.total_items} {Number(pedido.total_items) === 1 ? 'articulo' : 'articulos'}
                    </Text>
                  </Box>

                  <Box>
                    <HStack spacing={2} flexWrap="wrap">
                      <Badge colorScheme={COLOR_ESTADO_PAGO[pedido.estado_pago]} borderRadius="md" px={2}>
                        Pago: {pedido.estado_pago}
                      </Badge>
                      <Badge colorScheme={COLOR_ESTADO_PEDIDO[pedido.estado_pedido]} borderRadius="md" px={2}>
                        {pedido.estado_pedido}
                      </Badge>
                    </HStack>
                  </Box>

                  <Flex justify={{ base: 'flex-start', md: 'flex-end' }} align="center" gap={4}>
                    <Text fontWeight="bold" fontSize="lg" color="secondary.900">
                      {moneda(pedido.total)}
                    </Text>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/pedidos/${pedido.id}`)}>
                      Ver detalle
                    </Button>
                  </Flex>
                </SimpleGrid>
              </CardBody>
            </Card>
          ))}
        </Stack>
      )}
    </Layout>
  );
}

export default MisPedidos;
