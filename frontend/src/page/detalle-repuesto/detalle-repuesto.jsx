import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  SimpleGrid,
  Spinner,
  Text,
  useToast,
} from '@chakra-ui/react';
import {
  FaArrowLeft,
  FaCartShopping,
  FaGear,
  FaStore,
  FaLocationDot,
  FaPhone,
  FaClock,
} from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import { useCarrito } from '../../context/carrito-context.jsx';
import { obtenerProducto } from '../../services/repuestos-service.js';
import { moneda } from '../../utils/formato.js';

function DetalleRepuesto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { agregarProducto } = useCarrito();

  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const respuesta = await obtenerProducto(id);
        if (activo) setProducto(respuesta.producto);
      } catch (err) {
        if (activo) setError(err.message || 'No se pudo cargar el producto.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, [id]);

  const manejarAgregar = () => {
    agregarProducto(producto, cantidad);
    toast({
      title: 'Agregado al carrito',
      description: `${cantidad} x "${producto.nombre}" en tu carrito.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  if (cargando) {
    return (
      <Layout conSidebar>
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" color="brand.500" thickness="4px" />
        </Flex>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout conSidebar>
        <Alert status="error" borderRadius="md" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
        <Button variant="secondary" leftIcon={<FaArrowLeft />} onClick={() => navigate('/repuestos')}>
          Volver al catalogo
        </Button>
      </Layout>
    );
  }

  const stock = Number(producto.stock);
  const sinStock = stock <= 0;

  return (
    <Layout conSidebar>
      <Button
        as={RouterLink}
        to="/repuestos"
        variant="secondary"
        size="sm"
        leftIcon={<FaArrowLeft />}
        mb={5}
      >
        Volver al catalogo
      </Button>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
        <Box>
          {producto.imagen_url ? (
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              w="100%"
              maxH="420px"
              objectFit="cover"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="secondary.200"
              fallback={
                <Flex h="420px" bg="secondary.100" borderRadius="lg" align="center" justify="center">
                  <Icon as={FaGear} boxSize={16} color="secondary.400" />
                </Flex>
              }
            />
          ) : (
            <Flex h="420px" bg="secondary.100" borderRadius="lg" align="center" justify="center">
              <Icon as={FaGear} boxSize={16} color="secondary.400" />
            </Flex>
          )}
        </Box>

        <Box>
          <Badge colorScheme="brand" borderRadius="full" px={3} py={1} mb={3}>
            {producto.categoria}
          </Badge>

          <Heading as="h1" size="lg" color="secondary.900" mb={2}>
            {producto.nombre}
          </Heading>

          {producto.marca && (
            <Text color="secondary.600" mb={4}>
              Marca: <strong>{producto.marca}</strong>
            </Text>
          )}

          <Flex align="center" gap={4} mb={5}>
            <Text fontSize="3xl" fontWeight="bold" color="brand.700">
              {moneda(producto.precio)}
            </Text>
            <Badge
              colorScheme={sinStock ? 'red' : stock <= 5 ? 'orange' : 'green'}
              borderRadius="md"
              px={3}
              py={1}
            >
              {sinStock ? 'Sin stock' : `${stock} disponibles`}
            </Badge>
          </Flex>

          {producto.descripcion && (
            <Box mb={5}>
              <Text fontWeight="semibold" color="secondary.800" mb={1}>
                Descripcion
              </Text>
              <Text color="secondary.600" fontSize="sm">
                {producto.descripcion}
              </Text>
            </Box>
          )}

          {producto.compatibilidad && (
            <Box mb={5}>
              <Text fontWeight="semibold" color="secondary.800" mb={1}>
                Compatibilidad
              </Text>
              <Text color="secondary.600" fontSize="sm">
                {producto.compatibilidad}
              </Text>
            </Box>
          )}

          <Divider mb={5} />

          {sinStock ? (
            <Alert status="warning" borderRadius="md" fontSize="sm" mb={5}>
              <AlertIcon />
              Este repuesto esta agotado. Vuelve a consultarlo mas tarde.
            </Alert>
          ) : (
            <Flex gap={3} align="flex-end" mb={5} flexWrap="wrap">
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="secondary.700" mb={1}>
                  Cantidad
                </Text>
                <NumberInput
                  value={cantidad}
                  min={1}
                  max={stock}
                  onChange={(_texto, valor) => setCantidad(Number.isNaN(valor) ? 1 : valor)}
                  maxW="120px"
                  bg="white"
                  focusBorderColor="brand.500"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Box>

              <Button
                variant="primary"
                leftIcon={<FaCartShopping />}
                onClick={manejarAgregar}
                flex="1"
                minW="200px"
              >
                Agregar al carrito
              </Button>
            </Flex>
          )}

          <Card bg="white" borderRadius="lg" borderWidth="1px" borderColor="secondary.200" shadow="none">
            <CardBody>
              <HStack spacing={2} mb={3} color="secondary.700">
                <Icon as={FaStore} />
                <Text fontWeight="bold">Vendido por</Text>
              </HStack>

              <Text fontWeight="semibold" color="secondary.900" mb={2}>
                {producto.nombre_local}
              </Text>

              <HStack spacing={2} color="secondary.600" fontSize="sm" mb={1}>
                <Icon as={FaLocationDot} />
                <Text>{producto.direccion}</Text>
              </HStack>

              {producto.telefono && (
                <HStack spacing={2} color="secondary.600" fontSize="sm" mb={1}>
                  <Icon as={FaPhone} />
                  <Text>{producto.telefono}</Text>
                </HStack>
              )}

              {producto.horario && (
                <HStack spacing={2} color="secondary.600" fontSize="sm">
                  <Icon as={FaClock} />
                  <Text>{producto.horario}</Text>
                </HStack>
              )}
            </CardBody>
          </Card>
        </Box>
      </SimpleGrid>
    </Layout>
  );
}

export default DetalleRepuesto;
