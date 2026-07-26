import { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { FiUsers, FiTruck, FiTool, FiLock, FiUnlock } from 'react-icons/fi';
import Layout from '../../components/layout/layout.jsx';
import { useAuth } from '../../context/auth-context.jsx';

function AdminDashboard() {
  const { token } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState({ totalUsuarios: 0, totalVehiculos: 0, totalMantenimientos: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resStats, resUsers] = await Promise.all([
        fetch('http://localhost:3000/api/admin/stats', { headers }),
        fetch('http://localhost:3000/api/admin/users', { headers })
      ]);

      const dataStats = await resStats.json();
      const dataUsers = await resUsers.json();

      if (dataStats.success) setStats(dataStats.stats);
      if (dataUsers.success) setUsers(dataUsers.users);
    } catch (error) {
      toast({ title: 'Error cargando datos', description: error.message, status: 'error', isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`http://localhost:3000/api/admin/users/${userId}/toggle-status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_active: data.is_active } : u));
        toast({ title: 'Exito', description: data.message, status: 'success', isClosable: true });
      } else {
        toast({ title: 'Error', description: data.message, status: 'error', isClosable: true });
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
      <Box maxW="container.xl" mx="auto">
        <Heading as="h1" size="xl" color="secondary.900" mb={2}>
          Panel de Administrador
        </Heading>
        <Text color="secondary.600" mb={8}>
          Gestiona los usuarios y supervisa las estadisticas globales del sistema.
        </Text>

        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={10}>
          <Card bg="white" shadow="sm" borderRadius="xl">
            <CardBody>
              <Stat>
                <Flex alignItems="center" justifyContent="space-between">
                  <Box>
                    <StatLabel fontSize="md" color="secondary.600" fontWeight="medium">
                      Total Usuarios
                    </StatLabel>
                    <StatNumber fontSize="3xl" color="secondary.900" fontWeight="bold">
                      {stats.totalUsuarios}
                    </StatNumber>
                  </Box>
                  <Box p={3} bg="blue.50" borderRadius="lg">
                    <Icon as={FiUsers} boxSize={6} color="blue.500" />
                  </Box>
                </Flex>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg="white" shadow="sm" borderRadius="xl">
            <CardBody>
              <Stat>
                <Flex alignItems="center" justifyContent="space-between">
                  <Box>
                    <StatLabel fontSize="md" color="secondary.600" fontWeight="medium">
                      Total Talleres
                    </StatLabel>
                    <StatNumber fontSize="3xl" color="secondary.900" fontWeight="bold">
                      {stats.totalTalleres || 0}
                    </StatNumber>
                  </Box>
                  <Box p={3} bg="orange.50" borderRadius="lg">
                    <Icon as={FiTool} boxSize={6} color="orange.500" />
                  </Box>
                </Flex>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="white" shadow="sm" borderRadius="xl">
            <CardBody>
              <Stat>
                <Flex alignItems="center" justifyContent="space-between">
                  <Box>
                    <StatLabel fontSize="md" color="secondary.600" fontWeight="medium">
                      Total Vehiculos
                    </StatLabel>
                    <StatNumber fontSize="3xl" color="secondary.900" fontWeight="bold">
                      {stats.totalVehiculos}
                    </StatNumber>
                  </Box>
                  <Box p={3} bg="green.50" borderRadius="lg">
                    <Icon as={FiTruck} boxSize={6} color="green.500" />
                  </Box>
                </Flex>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="white" shadow="sm" borderRadius="xl">
            <CardBody>
              <Stat>
                <Flex alignItems="center" justifyContent="space-between">
                  <Box>
                    <StatLabel fontSize="md" color="secondary.600" fontWeight="medium">
                      Mantenimientos
                    </StatLabel>
                    <StatNumber fontSize="3xl" color="secondary.900" fontWeight="bold">
                      {stats.totalMantenimientos}
                    </StatNumber>
                  </Box>
                  <Box p={3} bg="purple.50" borderRadius="lg">
                    <Icon as={FiTool} boxSize={6} color="purple.500" />
                  </Box>
                </Flex>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Box bg="white" shadow="sm" borderRadius="xl" overflow="hidden">
          <Box p={6} borderBottomWidth="1px" borderColor="gray.100">
            <Heading as="h3" size="md" color="secondary.900">
              Usuarios y Talleres Registrados
            </Heading>
          </Box>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th color="gray.500">Nombre</Th>
                  <Th color="gray.500">Correo</Th>
                  <Th color="gray.500">Rol</Th>
                  <Th color="gray.500">Fecha Registro</Th>
                  <Th color="gray.500" isNumeric>Vehiculos</Th>
                  <Th color="gray.500">Estado</Th>
                  <Th color="gray.500" textAlign="right">Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((u) => (
                  <Tr key={u.id}>
                    <Td fontWeight="medium" color="secondary.900">
                      {u.nombre} {u.apellido}
                    </Td>
                    <Td color="secondary.600">{u.correo}</Td>
                    <Td>
                      <Badge colorScheme={u.rol === 'taller' ? 'orange' : 'blue'} variant="solid" px={2} py={1} borderRadius="md" textTransform="capitalize">
                        {u.rol}
                      </Badge>
                    </Td>
                    <Td color="secondary.600">
                      {new Date(u.created_at).toLocaleDateString('es-ES')}
                    </Td>
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
                        isLoading={actionLoading === u.id}
                        onClick={() => toggleUserStatus(u.id, u.is_active)}
                      >
                        {u.is_active ? 'Bloquear' : 'Desbloquear'}
                      </Button>
                    </Td>
                  </Tr>
                ))}
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
      </Box>
    </Layout>
  );
}

export default AdminDashboard;
