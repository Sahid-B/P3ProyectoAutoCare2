import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import Layout from '../../components/layout/index.jsx';
import { obtenerPedidosRecibidos } from '../../services/repuestos-service.js';
import { moneda, fechaHora, COLOR_ESTADO_PEDIDO, COLOR_ESTADO_PAGO } from '../../utils/formato.js';

const ESTADOS = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'];

function PedidosVendedor() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const respuesta = await obtenerPedidosRecibidos();
        if (activo) setPedidos(respuesta.data || []);
      } catch (err) {
        if (activo) setError(err.message || 'No se pudieron cargar los pedidos.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, []);

  const pedidosFiltrados = filtroEstado
    ? pedidos.filter((pedido) => pedido.estado_pedido === filtroEstado)
    : pedidos;

  return (
    <Layout conSidebar>
      <Flex justify="space-between" align="flex-start" gap={4} flexWrap="wrap" mb={6}>
        <Box>
          <Heading as="h1" size="lg" color="secondary.900" mb={1}>
            Pedidos recibidos
          </Heading>
          <Text color="secondary.600">
            Revisa los pedidos de tus clientes y actualiza su estado.
          </Text>
        </Box>

        <Select
          maxW="220px"
          value={filtroEstado}
          onChange={(evento) => setFiltroEstado(evento.target.value)}
          bg="white"
          focusBorderColor="brand.500"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </option>
          ))}
        </Select>
      </Flex>

      {error && (
        <Alert status="error" borderRadius="md" mb={6} fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {cargando ? (
        <Flex justify="center" align="center" minH="40vh">
          <Spinner size="xl" color="brand.500" thickness="4px" />
        </Flex>
      ) : (
        <Box bg="white" borderRadius="xl" shadow="sm" overflow="hidden">
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead bg="secondary.50">
                <Tr>
                  <Th color="secondary.500">Pedido</Th>
                  <Th color="secondary.500">Cliente</Th>
                  <Th color="secondary.500">Fecha</Th>
                  <Th color="secondary.500" isNumeric>Articulos</Th>
                  <Th color="secondary.500" isNumeric>Total</Th>
                  <Th color="secondary.500">Pago</Th>
                  <Th color="secondary.500">Estado</Th>
                  <Th color="secondary.500" textAlign="right">Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {pedidosFiltrados.map((pedido) => (
                  <Tr key={pedido.id}>
                    <Td fontWeight="semibold" color="brand.700">#{pedido.id}</Td>
                    <Td>
                      <Text color="secondary.900" fontWeight="medium">
                        {pedido.cliente_nombre} {pedido.cliente_apellido}
                      </Text>
                      <Text fontSize="xs" color="secondary.500">
                        {pedido.cliente_correo}
                      </Text>
                    </Td>
                    <Td color="secondary.600" fontSize="xs">{fechaHora(pedido.created_at)}</Td>
                    <Td isNumeric color="secondary.600">{pedido.total_items}</Td>
                    <Td isNumeric fontWeight="semibold" color="secondary.900">
                      {moneda(pedido.total)}
                    </Td>
                    <Td>
                      <Badge colorScheme={COLOR_ESTADO_PAGO[pedido.estado_pago]} borderRadius="md" px={2}>
                        {pedido.estado_pago}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={COLOR_ESTADO_PEDIDO[pedido.estado_pedido]} borderRadius="md" px={2}>
                        {pedido.estado_pedido}
                      </Badge>
                    </Td>
                    <Td textAlign="right">
                      <Button size="xs" variant="outline" onClick={() => navigate(`/pedidos/${pedido.id}`)}>
                        Ver detalle
                      </Button>
                    </Td>
                  </Tr>
                ))}
                {pedidosFiltrados.length === 0 && (
                  <Tr>
                    <Td colSpan={8} textAlign="center" py={10} color="secondary.500">
                      {pedidos.length === 0
                        ? 'Aun no has recibido pedidos.'
                        : 'Ningun pedido coincide con el filtro aplicado.'}
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </Box>
      )}
    </Layout>
  );
}

export default PedidosVendedor;
