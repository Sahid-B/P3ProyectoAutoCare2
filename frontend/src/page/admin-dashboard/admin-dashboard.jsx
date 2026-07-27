import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  useToast,
  Flex,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiTruck,
  FiTool,
  FiLock,
  FiUnlock,
  FiShoppingBag,
  FiPackage,
  FiShoppingCart,
  FiUser,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
} from 'react-icons/fi';
import Layout from '../../components/layout/layout.jsx';
import { peticion } from '../../services/api-service.js';
import { moneda, fechaCorta, COLOR_ESTADO_PEDIDO, COLOR_ESTADO_PAGO } from '../../utils/formato.js';

// Etiquetas y colores de cada rol para la tabla de usuarios.
const ROLES = {
  usuario: { etiqueta: 'Cliente', color: 'blue' },
  taller: { etiqueta: 'Taller', color: 'orange' },
  vendedor_repuestos: { etiqueta: 'Vendedor de repuestos', color: 'purple' },
};

const TARJETAS = [
  { clave: 'totalUsuarios', titulo: 'Total usuarios', icono: FiUsers, color: 'blue' },
  { clave: 'totalClientes', titulo: 'Clientes', icono: FiUser, color: 'cyan' },
  { clave: 'totalTalleres', titulo: 'Talleres', icono: FiTool, color: 'orange' },
  { clave: 'totalVendedores', titulo: 'Vendedores de repuestos', icono: FiShoppingBag, color: 'purple' },
  { clave: 'totalVehiculos', titulo: 'Vehiculos', icono: FiTruck, color: 'green' },
  { clave: 'totalProductos', titulo: 'Productos', icono: FiPackage, color: 'pink' },
  { clave: 'totalMantenimientos', titulo: 'Mantenimientos', icono: FiTool, color: 'yellow' },
  { clave: 'totalCompras', titulo: 'Compras de repuestos', icono: FiShoppingCart, color: 'red' },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [compras, setCompras] = useState([]);
  const [productosPorTienda, setProductosPorTienda] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Declarada como funcion (no const) para poder invocarla desde el efecto de montaje.
  async function fetchData() {
    setLoading(true);
    try {
      const [dataStats, dataUsers, dataVendedores, dataCompras] = await Promise.all([
        peticion('/admin/stats'),
        peticion('/admin/users'),
        peticion('/admin/vendedores'),
        peticion('/admin/compras'),
      ]);

      if (dataStats.success) setStats(dataStats.stats);
      if (dataUsers.success) setUsers(dataUsers.users);
      if (dataVendedores.success) setVendedores(dataVendedores.vendedores);
      if (dataCompras.success) setCompras(dataCompras.compras);
    } catch (error) {
      toast({ title: 'Error cargando datos', description: error.message, status: 'error', isClosable: true });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Carga inicial del panel. El estado ya arranca en "loading".
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const toggleUserStatus = async (userId) => {
    setActionLoading(`user-${userId}`);
    try {
      const data = await peticion(`/admin/users/${userId}/toggle-status`, { method: 'POST' });
      if (data.success) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: data.is_active } : u)));
        toast({ title: 'Exito', description: data.message, status: 'success', isClosable: true });
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', isClosable: true });
    } finally {
      setActionLoading(null);
    }
  };

  const cambiarEstadoTienda = async (tiendaId, estadoActual) => {
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    setActionLoading(`tienda-${tiendaId}`);
    try {
      const data = await peticion(`/admin/vendedores/${tiendaId}/estado`, {
        method: 'POST',
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (data.success) {
        setVendedores(vendedores.map((v) => (v.id === tiendaId ? { ...v, estado: nuevoEstado } : v)));
        toast({ title: 'Exito', description: data.message, status: 'success', isClosable: true });
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', isClosable: true });
    } finally {
      setActionLoading(null);
    }
  };

  const verProductos = async (tiendaId) => {
    if (productosPorTienda[tiendaId]) {
      setProductosPorTienda((anteriores) => {
        const copia = { ...anteriores };
        delete copia[tiendaId];
        return copia;
      });
      return;
    }

    setActionLoading(`productos-${tiendaId}`);
    try {
      const data = await peticion(`/admin/vendedores/${tiendaId}/productos`);
      if (data.success) {
        setProductosPorTienda((anteriores) => ({ ...anteriores, [tiendaId]: data.productos }));
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error', isClosable: true });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box maxW="container.xl" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }}>
        <Button
          leftIcon={<Icon as={FiArrowLeft} />}
          variant="ghost"
          mb={4}
          color="secondary.600"
          _hover={{ bg: 'secondary.100', color: 'secondary.800' }}
          onClick={() => navigate('/perfil')}
        >
          Regresar
        </Button>
        <Heading as="h1" size="xl" color="secondary.900" mb={2}>
          Panel de Administrador
        </Heading>
        <Text color="secondary.600" mb={8}>
          Gestiona los usuarios y supervisa las estadisticas globales del sistema.
        </Text>

        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 4 }} spacing={4} mb={10}>
          {TARJETAS.map((tarjeta) => (
            <Card key={tarjeta.clave} bg="white" shadow="sm" borderRadius="xl">
              <CardBody p={4}>
                <Stat>
                  <Flex alignItems="center" justifyContent="space-between" gap={2}>
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
                        {stats[tarjeta.clave] ?? 0}
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

        <Tabs colorScheme="brand" variant="enclosed">
          <TabList>
            <Tab fontWeight="semibold">Usuarios</Tab>
            <Tab fontWeight="semibold">Vendedores de repuestos</Tab>
            <Tab fontWeight="semibold">Compras</Tab>
          </TabList>

          <TabPanels>
            {/* Usuarios */}
            <TabPanel px={0}>
              <Box bg="white" shadow="sm" borderRadius="xl" overflow="hidden">
                <Box p={6} borderBottomWidth="1px" borderColor="gray.100">
                  <Heading as="h3" size="md" color="secondary.900">
                    Usuarios registrados
                  </Heading>
                </Box>
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th color="gray.500">Nombre</Th>
                        <Th color="gray.500">Correo</Th>
                        <Th color="gray.500">Rol</Th>
                        <Th color="gray.500">Fecha registro</Th>
                        <Th color="gray.500" isNumeric>Vehiculos</Th>
                        <Th color="gray.500">Estado</Th>
                        <Th color="gray.500" textAlign="right">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {users.map((u) => {
                        const rol = ROLES[u.rol] || { etiqueta: u.rol, color: 'gray' };
                        return (
                          <Tr key={u.id}>
                            <Td fontWeight="medium" color="secondary.900">
                              {u.nombre} {u.apellido}
                            </Td>
                            <Td color="secondary.600">{u.correo}</Td>
                            <Td>
                              <Badge colorScheme={rol.color} variant="solid" px={2} py={1} borderRadius="md">
                                {rol.etiqueta}
                              </Badge>
                            </Td>
                            <Td color="secondary.600">{fechaCorta(u.created_at)}</Td>
                            <Td isNumeric fontWeight="semibold" color="secondary.900">
                              {u.vehiculos}
                            </Td>
                            <Td>
                              <Badge colorScheme={u.is_active ? 'green' : 'red'} variant="subtle" px={2} py={1} borderRadius="md">
                                {u.is_active ? 'Activo' : 'Bloqueado'}
                              </Badge>
                            </Td>
                            <Td textAlign="right">
                              <Button
                                size="sm"
                                leftIcon={u.is_active ? <FiLock /> : <FiUnlock />}
                                colorScheme={u.is_active ? 'red' : 'green'}
                                variant={u.is_active ? 'ghost' : 'solid'}
                                isLoading={actionLoading === `user-${u.id}`}
                                onClick={() => toggleUserStatus(u.id)}
                              >
                                {u.is_active ? 'Bloquear' : 'Desbloquear'}
                              </Button>
                            </Td>
                          </Tr>
                        );
                      })}
                      {users.length === 0 && (
                        <Tr>
                          <Td colSpan={7} textAlign="center" py={8} color="gray.500">
                            No hay usuarios registrados aun.
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            </TabPanel>

            {/* Vendedores de repuestos */}
            <TabPanel px={0}>
              <Box bg="white" shadow="sm" borderRadius="xl" overflow="hidden">
                <Box p={6} borderBottomWidth="1px" borderColor="gray.100">
                  <Heading as="h3" size="md" color="secondary.900">
                    Tiendas de repuestos
                  </Heading>
                  <Text fontSize="sm" color="secondary.600" mt={1}>
                    Activa o desactiva una tienda y revisa su catalogo.
                  </Text>
                </Box>
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th color="gray.500">Local</Th>
                        <Th color="gray.500">Responsable</Th>
                        <Th color="gray.500">Direccion</Th>
                        <Th color="gray.500" isNumeric>Productos</Th>
                        <Th color="gray.500" isNumeric>Compras</Th>
                        <Th color="gray.500">Estado</Th>
                        <Th color="gray.500" textAlign="right">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {vendedores.map((v) => (
                        <Fragment key={v.id}>
                          <Tr>
                            <Td fontWeight="medium" color="secondary.900">{v.nombre_local}</Td>
                            <Td color="secondary.600">
                              {v.nombre} {v.apellido}
                              <Text fontSize="xs" color="gray.500">{v.correo}</Text>
                            </Td>
                            <Td color="secondary.600" fontSize="sm">{v.direccion}</Td>
                            <Td isNumeric fontWeight="semibold">{v.total_productos}</Td>
                            <Td isNumeric fontWeight="semibold">{v.total_compras}</Td>
                            <Td>
                              <Badge colorScheme={v.estado === 'activo' ? 'green' : 'red'} variant="subtle" px={2} py={1} borderRadius="md">
                                {v.estado}
                              </Badge>
                            </Td>
                            <Td textAlign="right">
                              <Flex gap={2} justify="flex-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                  leftIcon={productosPorTienda[v.id] ? <FiEyeOff /> : <FiEye />}
                                  isLoading={actionLoading === `productos-${v.id}`}
                                  onClick={() => verProductos(v.id)}
                                >
                                  Productos
                                </Button>
                                <Button
                                  size="sm"
                                  colorScheme={v.estado === 'activo' ? 'red' : 'green'}
                                  variant={v.estado === 'activo' ? 'ghost' : 'solid'}
                                  isLoading={actionLoading === `tienda-${v.id}`}
                                  onClick={() => cambiarEstadoTienda(v.id, v.estado)}
                                >
                                  {v.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                </Button>
                              </Flex>
                            </Td>
                          </Tr>

                          {productosPorTienda[v.id] && (
                            <Tr>
                              <Td colSpan={7} bg="gray.50" px={6} py={4}>
                                <Text fontWeight="semibold" fontSize="sm" color="secondary.800" mb={3}>
                                  Productos de {v.nombre_local}
                                </Text>
                                {productosPorTienda[v.id].length === 0 ? (
                                  <Text fontSize="sm" color="gray.500">
                                    Esta tienda aun no tiene productos publicados.
                                  </Text>
                                ) : (
                                  <Table size="sm" variant="simple" bg="white" borderRadius="md">
                                    <Thead>
                                      <Tr>
                                        <Th>Producto</Th>
                                        <Th>Categoria</Th>
                                        <Th isNumeric>Precio</Th>
                                        <Th isNumeric>Stock</Th>
                                        <Th>Estado</Th>
                                      </Tr>
                                    </Thead>
                                    <Tbody>
                                      {productosPorTienda[v.id].map((p) => (
                                        <Tr key={p.id}>
                                          <Td>{p.nombre}</Td>
                                          <Td>{p.categoria}</Td>
                                          <Td isNumeric>{moneda(p.precio)}</Td>
                                          <Td isNumeric>{p.stock}</Td>
                                          <Td>
                                            <Badge colorScheme={p.estado === 'activo' ? 'green' : 'gray'} borderRadius="md" px={2}>
                                              {p.estado}
                                            </Badge>
                                          </Td>
                                        </Tr>
                                      ))}
                                    </Tbody>
                                  </Table>
                                )}
                              </Td>
                            </Tr>
                          )}
                        </Fragment>
                      ))}
                      {vendedores.length === 0 && (
                        <Tr>
                          <Td colSpan={7} textAlign="center" py={8} color="gray.500">
                            Aun no hay tiendas de repuestos registradas.
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            </TabPanel>

            {/* Compras */}
            <TabPanel px={0}>
              <Box bg="white" shadow="sm" borderRadius="xl" overflow="hidden">
                <Flex p={6} borderBottomWidth="1px" borderColor="gray.100" justify="space-between" align="center" gap={3} flexWrap="wrap">
                  <Box>
                    <Heading as="h3" size="md" color="secondary.900">
                      Compras de repuestos
                    </Heading>
                    <Text fontSize="sm" color="secondary.600" mt={1}>
                      Historial de pedidos realizados en la plataforma.
                    </Text>
                  </Box>
                  <Box textAlign="right">
                    <Text fontSize="xs" color="gray.500">Ingresos confirmados</Text>
                    <Text fontSize="xl" fontWeight="bold" color="brand.700">
                      {moneda(stats.ingresosRepuestos)}
                    </Text>
                  </Box>
                </Flex>
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th color="gray.500">Pedido</Th>
                        <Th color="gray.500">Cliente</Th>
                        <Th color="gray.500">Tienda</Th>
                        <Th color="gray.500">Fecha</Th>
                        <Th color="gray.500" isNumeric>Total</Th>
                        <Th color="gray.500">Metodo</Th>
                        <Th color="gray.500">Pago</Th>
                        <Th color="gray.500">Estado</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {compras.map((c) => (
                        <Tr key={c.id}>
                          <Td fontWeight="semibold" color="brand.700">#{c.id}</Td>
                          <Td color="secondary.900">
                            {c.cliente_nombre} {c.cliente_apellido}
                            <Text fontSize="xs" color="gray.500">{c.cliente_correo}</Text>
                          </Td>
                          <Td color="secondary.600">{c.nombre_local}</Td>
                          <Td color="secondary.600">{fechaCorta(c.created_at)}</Td>
                          <Td isNumeric fontWeight="semibold">{moneda(c.total)}</Td>
                          <Td color="secondary.600" textTransform="capitalize">{c.metodo_pago}</Td>
                          <Td>
                            <Badge colorScheme={COLOR_ESTADO_PAGO[c.estado_pago]} borderRadius="md" px={2}>
                              {c.estado_pago}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme={COLOR_ESTADO_PEDIDO[c.estado_pedido]} borderRadius="md" px={2}>
                              {c.estado_pedido}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                      {compras.length === 0 && (
                        <Tr>
                          <Td colSpan={8} textAlign="center" py={8} color="gray.500">
                            Aun no se han registrado compras de repuestos.
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Layout>
  );
}

export default AdminDashboard;
