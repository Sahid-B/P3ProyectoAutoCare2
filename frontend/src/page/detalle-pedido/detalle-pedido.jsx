import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Select,
  SimpleGrid,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
import {
  FaArrowLeft,
  FaStore,
  FaUser,
  FaLocationDot,
  FaPhone,
  FaClock,
  FaReceipt,
} from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import { useAuth } from '../../context/auth-context.jsx';
import { obtenerDetallePedido, actualizarEstadoPedido } from '../../services/repuestos-service.js';
import { moneda, fechaHora, COLOR_ESTADO_PEDIDO, COLOR_ESTADO_PAGO } from '../../utils/formato.js';

const ESTADOS = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'];

// El detalle es compartido: el cliente ve su pedido y el vendedor ve el pedido
// recibido y ademas puede cambiar su estado.
function DetallePedido() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [actualizando, setActualizando] = useState(false);

  const esVendedor = usuario?.rol === 'vendedor_repuestos';

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const respuesta = await obtenerDetallePedido(id);
        if (!activo) return;
        setPedido(respuesta.compra);
        setNuevoEstado(respuesta.compra.estado_pedido);
      } catch (err) {
        if (activo) setError(err.message || 'No se pudo cargar el pedido.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, [id]);

  const manejarCambioEstado = async () => {
    if (!nuevoEstado || nuevoEstado === pedido.estado_pedido) return;

    try {
      setActualizando(true);
      const respuesta = await actualizarEstadoPedido(id, nuevoEstado);
      setPedido((anterior) => ({ ...anterior, estado_pedido: respuesta.compra.estado_pedido }));

      toast({
        title: 'Estado actualizado',
        description: `El pedido #${id} ahora esta en estado "${respuesta.compra.estado_pedido}".`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'No se pudo actualizar',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setNuevoEstado(pedido.estado_pedido);
    } finally {
      setActualizando(false);
    }
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
        <Button variant="secondary" leftIcon={<FaArrowLeft />} onClick={() => navigate(-1)}>
          Volver
        </Button>
      </Layout>
    );
  }

  return (
    <Layout conSidebar>
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<FaArrowLeft />}
        mb={5}
        onClick={() => navigate(esVendedor ? '/pedidos' : '/mis-pedidos')}
      >
        Volver a los pedidos
      </Button>

      <Flex justify="space-between" align="flex-start" gap={4} flexWrap="wrap" mb={6}>
        <Box>
          <HStack spacing={3} mb={1}>
            <Icon as={FaReceipt} color="brand.500" boxSize={5} />
            <Heading as="h1" size="lg" color="secondary.900">
              Pedido #{pedido.id}
            </Heading>
          </HStack>
          <Text color="secondary.600">Realizado el {fechaHora(pedido.created_at)}</Text>
        </Box>

        <HStack spacing={3}>
          <Badge colorScheme={COLOR_ESTADO_PAGO[pedido.estado_pago]} borderRadius="md" px={3} py={1}>
            Pago: {pedido.estado_pago}
          </Badge>
          <Badge colorScheme={COLOR_ESTADO_PEDIDO[pedido.estado_pedido]} borderRadius="md" px={3} py={1}>
            {pedido.estado_pedido}
          </Badge>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
        <Card bg="white" borderRadius="xl" shadow="sm">
          <CardBody>
            <HStack spacing={2} mb={3} color="secondary.700">
              <Icon as={FaStore} />
              <Text fontWeight="bold">Tienda</Text>
            </HStack>
            <Text fontWeight="semibold" color="secondary.900" mb={2}>
              {pedido.nombre_local}
            </Text>
            <HStack spacing={2} color="secondary.600" fontSize="sm" mb={1}>
              <Icon as={FaLocationDot} />
              <Text>{pedido.tienda_direccion}</Text>
            </HStack>
            {pedido.tienda_telefono && (
              <HStack spacing={2} color="secondary.600" fontSize="sm" mb={1}>
                <Icon as={FaPhone} />
                <Text>{pedido.tienda_telefono}</Text>
              </HStack>
            )}
            {pedido.tienda_horario && (
              <HStack spacing={2} color="secondary.600" fontSize="sm">
                <Icon as={FaClock} />
                <Text>{pedido.tienda_horario}</Text>
              </HStack>
            )}
          </CardBody>
        </Card>

        <Card bg="white" borderRadius="xl" shadow="sm">
          <CardBody>
            <HStack spacing={2} mb={3} color="secondary.700">
              <Icon as={FaUser} />
              <Text fontWeight="bold">Cliente</Text>
            </HStack>
            <Text fontWeight="semibold" color="secondary.900" mb={2}>
              {pedido.cliente_nombre} {pedido.cliente_apellido}
            </Text>
            <Text color="secondary.600" fontSize="sm" mb={3}>
              {pedido.cliente_correo}
            </Text>

            <Divider mb={3} />

            <SimpleGrid columns={2} spacing={2} fontSize="sm">
              <Text color="secondary.500">Metodo de pago</Text>
              <Text color="secondary.900" fontWeight="medium" textTransform="capitalize">
                {pedido.metodo_pago}
              </Text>

              <Text color="secondary.500">Transaccion</Text>
              <Text color="secondary.900" fontWeight="medium" wordBreak="break-all">
                {pedido.transaccion_id || '-'}
              </Text>

              <Text color="secondary.500">Fecha de pago</Text>
              <Text color="secondary.900" fontWeight="medium">
                {pedido.fecha_pago ? fechaHora(pedido.fecha_pago) : 'Sin pagar'}
              </Text>
            </SimpleGrid>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Cambio de estado: solo el vendedor duenio del pedido */}
      {esVendedor && (
        <Box bg="white" borderRadius="xl" shadow="sm" p={5} mb={6}>
          <Heading as="h2" size="sm" color="secondary.900" mb={3}>
            Cambiar estado del pedido
          </Heading>
          <Flex gap={3} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
            <Select
              maxW={{ base: '100%', sm: '260px' }}
              value={nuevoEstado}
              onChange={(evento) => setNuevoEstado(evento.target.value)}
              bg="white"
              focusBorderColor="brand.500"
              isDisabled={['cancelado', 'entregado'].includes(pedido.estado_pedido)}
            >
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {estado.charAt(0).toUpperCase() + estado.slice(1)}
                </option>
              ))}
            </Select>
            <Button
              variant="primary"
              onClick={manejarCambioEstado}
              isLoading={actualizando}
              isDisabled={
                nuevoEstado === pedido.estado_pedido ||
                ['cancelado', 'entregado'].includes(pedido.estado_pedido)
              }
            >
              Actualizar estado
            </Button>
          </Flex>
          {['cancelado', 'entregado'].includes(pedido.estado_pedido) && (
            <Text fontSize="xs" color="secondary.500" mt={3}>
              Un pedido {pedido.estado_pedido} ya no puede cambiar de estado.
            </Text>
          )}
          <Text fontSize="xs" color="secondary.500" mt={2}>
            Al cancelar un pedido, las unidades reservadas vuelven automaticamente al stock.
          </Text>
        </Box>
      )}

      {/* Detalle de articulos */}
      <Box bg="white" borderRadius="xl" shadow="sm" overflow="hidden">
        <Box p={5} borderBottomWidth="1px" borderColor="secondary.100">
          <Heading as="h2" size="md" color="secondary.900">
            Articulos del pedido
          </Heading>
        </Box>

        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead bg="secondary.50">
              <Tr>
                <Th color="secondary.500">Producto</Th>
                <Th color="secondary.500" isNumeric>Cantidad</Th>
                <Th color="secondary.500" isNumeric>Precio unitario</Th>
                <Th color="secondary.500" isNumeric>Subtotal</Th>
              </Tr>
            </Thead>
            <Tbody>
              {pedido.detalles.map((detalle) => (
                <Tr key={detalle.id}>
                  <Td fontWeight="medium" color="secondary.900">{detalle.producto_nombre}</Td>
                  <Td isNumeric color="secondary.600">{detalle.cantidad}</Td>
                  <Td isNumeric color="secondary.600">{moneda(detalle.precio_unitario)}</Td>
                  <Td isNumeric fontWeight="semibold" color="secondary.900">
                    {moneda(detalle.subtotal)}
                  </Td>
                </Tr>
              ))}
            </Tbody>
            <Tfoot>
              <Tr>
                <Th colSpan={3} textAlign="right" color="secondary.700" fontSize="sm">
                  Total
                </Th>
                <Th isNumeric color="brand.700" fontSize="md">
                  {moneda(pedido.total)}
                </Th>
              </Tr>
            </Tfoot>
          </Table>
        </Box>
      </Box>
    </Layout>
  );
}

export default DetallePedido;
