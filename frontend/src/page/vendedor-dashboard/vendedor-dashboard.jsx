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
  Icon,
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import {
  FaBoxesStacked,
  FaTriangleExclamation,
  FaClipboardList,
  FaCircleCheck,
  FaSackDollar,
  FaPlus,
  FaStore,
} from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import { useAuth } from '../../context/auth-context.jsx';
import {
  obtenerEstadisticasVendedor,
  obtenerMisProductos,
  obtenerPedidosRecibidos,
} from '../../services/repuestos-service.js';
import { moneda, fechaCorta, COLOR_ESTADO_PEDIDO, COLOR_ESTADO_PAGO } from '../../utils/formato.js';

const TARJETAS = [
  { clave: 'totalProductos', titulo: 'Total de productos', icono: FaBoxesStacked, color: 'blue' },
  { clave: 'productosBajoStock', titulo: 'Productos con poco stock', icono: FaTriangleExclamation, color: 'orange' },
  { clave: 'pedidosPendientes', titulo: 'Pedidos pendientes', icono: FaClipboardList, color: 'yellow' },
  { clave: 'ventasRealizadas', titulo: 'Ventas realizadas', icono: FaCircleCheck, color: 'green' },
  { clave: 'ingresosTotales', titulo: 'Ingresos totales', icono: FaSackDollar, color: 'purple', esMoneda: true },
];

function VendedorDashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [estadisticas, setEstadisticas] = useState(null);
  const [tienda, setTienda] = useState(null);
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [sinTienda, setSinTienda] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      try {
        setCargando(true);
        const respuestaEstadisticas = await obtenerEstadisticasVendedor();

        if (!activo) return;
        setEstadisticas(respuestaEstadisticas.estadisticas);
        setTienda(respuestaEstadisticas.tienda);

        const [respuestaProductos, respuestaPedidos] = await Promise.all([
          obtenerMisProductos(),
          obtenerPedidosRecibidos(5),
        ]);

        if (!activo) return;
        setProductos(respuestaProductos.data || []);
        setPedidos(respuestaPedidos.data || []);
      } catch (err) {
        if (!activo) return;
        if (/tienda/i.test(err.message)) {
          setSinTienda(true);
        } else {
          setError(err.message || 'No se pudieron cargar los datos de tu tienda.');
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarDatos();
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

  if (sinTienda) {
    return (
      <Layout conSidebar>
        <Box
          bg="white"
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="lg"
          p={10}
          textAlign="center"
        >
          <Icon as={FaStore} boxSize={12} color="brand.400" mb={4} />
          <Heading as="h2" size="md" color="secondary.900" mb={2}>
            Aun no has registrado tu tienda
          </Heading>
          <Text color="secondary.600" mb={6}>
            Registra los datos y la ubicacion de tu local para empezar a publicar repuestos.
          </Text>
          <Button as={RouterLink} to="/mi-tienda" variant="primary">
            Registrar mi tienda
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout conSidebar>
      <Flex justify="space-between" align="flex-start" gap={4} flexWrap="wrap" mb={6}>
        <Box>
          <Heading as="h1" size="lg" color="secondary.900" mb={1}>
            Hola, {usuario?.nombre}
          </Heading>
          <Text color="secondary.600">
            Panel de tu tienda de repuestos{tienda?.nombre_local ? `: ${tienda.nombre_local}` : ''}.
          </Text>
        </Box>

        <Button
          as={RouterLink}
          to="/mis-productos/nuevo"
          variant="primary"
          leftIcon={<FaPlus />}
        >
          Agregar producto
        </Button>
      </Flex>

      {error && (
        <Alert status="error" borderRadius="md" mb={6} fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 5 }} spacing={4} mb={8}>
        {TARJETAS.map((tarjeta) => (
          <Card key={tarjeta.clave} bg="white" borderRadius="xl" shadow="sm">
            <CardBody p={4}>
              <Stat>
                <Flex align="center" justify="space-between" gap={2}>
                  <Box minW="0" flex="1">
                    <StatLabel 
                      fontSize="sm" 
                      color="secondary.600" 
                      fontWeight="medium" 
                      whiteSpace="normal"
                      lineHeight="shorter"
                      mb={1}
                    >
                      {tarjeta.titulo}
                    </StatLabel>
                    <StatNumber 
                      fontSize={['lg', 'xl']} 
                      color="secondary.900" 
                      fontWeight="bold" 
                      whiteSpace="nowrap"
                    >
                      {tarjeta.esMoneda
                        ? moneda(estadisticas?.[tarjeta.clave])
                        : (estadisticas?.[tarjeta.clave] ?? 0)}
                    </StatNumber>
                  </Box>
                  <Box p={2} bg={`${tarjeta.color}.50`} borderRadius="lg" flexShrink={0}>
                    <Icon as={tarjeta.icono} boxSize={5} color={`${tarjeta.color}.500`} />
                  </Box>
                </Flex>
              </Stat>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Tabla de productos */}
      <Box bg="white" borderRadius="xl" shadow="sm" overflow="hidden" mb={8}>
        <Flex
          p={5}
          borderBottomWidth="1px"
          borderColor="secondary.100"
          justify="space-between"
          align="center"
          gap={3}
          flexWrap="wrap"
        >
          <Heading as="h2" size="md" color="secondary.900">
            Mis productos
          </Heading>
          <Button as={RouterLink} to="/mis-productos" size="sm" variant="outline">
            Ver todos
          </Button>
        </Flex>

        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead bg="secondary.50">
              <Tr>
                <Th color="secondary.500">Producto</Th>
                <Th color="secondary.500">Categoria</Th>
                <Th color="secondary.500" isNumeric>Precio</Th>
                <Th color="secondary.500" isNumeric>Stock</Th>
                <Th color="secondary.500">Estado</Th>
              </Tr>
            </Thead>
            <Tbody>
              {productos.slice(0, 5).map((producto) => (
                <Tr key={producto.id}>
                  <Td fontWeight="medium" color="secondary.900">{producto.nombre}</Td>
                  <Td color="secondary.600">{producto.categoria}</Td>
                  <Td isNumeric color="secondary.900">{moneda(producto.precio)}</Td>
                  <Td isNumeric>
                    <Badge colorScheme={producto.stock <= 5 ? 'orange' : 'green'} borderRadius="md" px={2}>
                      {producto.stock}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={producto.estado === 'activo' ? 'green' : 'gray'} borderRadius="md" px={2}>
                      {producto.estado}
                    </Badge>
                  </Td>
                </Tr>
              ))}
              {productos.length === 0 && (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={8} color="secondary.500">
                    Aun no has publicado repuestos. Usa el boton "Agregar producto".
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      </Box>

      {/* Tabla de pedidos recientes */}
      <Box bg="white" borderRadius="xl" shadow="sm" overflow="hidden">
        <Flex
          p={5}
          borderBottomWidth="1px"
          borderColor="secondary.100"
          justify="space-between"
          align="center"
          gap={3}
          flexWrap="wrap"
        >
          <Heading as="h2" size="md" color="secondary.900">
            Pedidos recientes
          </Heading>
          <Button as={RouterLink} to="/pedidos" size="sm" variant="outline">
            Ver todos
          </Button>
        </Flex>

        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead bg="secondary.50">
              <Tr>
                <Th color="secondary.500">Pedido</Th>
                <Th color="secondary.500">Cliente</Th>
                <Th color="secondary.500">Fecha</Th>
                <Th color="secondary.500" isNumeric>Total</Th>
                <Th color="secondary.500">Pago</Th>
                <Th color="secondary.500">Estado</Th>
              </Tr>
            </Thead>
            <Tbody>
              {pedidos.map((pedido) => (
                <Tr
                  key={pedido.id}
                  cursor="pointer"
                  _hover={{ bg: 'secondary.50' }}
                  onClick={() => navigate(`/pedidos/${pedido.id}`)}
                >
                  <Td fontWeight="semibold" color="brand.700">#{pedido.id}</Td>
                  <Td color="secondary.900">{pedido.cliente_nombre} {pedido.cliente_apellido}</Td>
                  <Td color="secondary.600">{fechaCorta(pedido.created_at)}</Td>
                  <Td isNumeric fontWeight="semibold">{moneda(pedido.total)}</Td>
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
                </Tr>
              ))}
              {pedidos.length === 0 && (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={8} color="secondary.500">
                    Aun no has recibido pedidos.
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Layout>
  );
}

export default VendedorDashboard;
