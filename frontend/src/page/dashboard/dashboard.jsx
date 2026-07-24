import { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  SimpleGrid,
  Heading,
  Text,
  Badge,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  Wrap,
  WrapItem,
  Code,
  Spinner,
  Icon,
} from '@chakra-ui/react';
import {
  FaCar,
  FaClock,
  FaTriangleExclamation,
  FaDollarSign,
} from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import { obtenerEstadoApi } from '../../services/api-service.js';

// Datos simulados: sirven unicamente para mostrar el diseno del panel.
// Se reemplazaran por informacion real cuando existan los modulos de vehiculos
// y mantenimientos.
const indicadores = [
  { titulo: 'Total de vehiculos', valor: '3', detalle: 'Registrados en la cuenta', icono: FaCar },
  { titulo: 'Proximo mantenimiento', valor: '12 dias', detalle: 'Cambio de aceite - Aveo 2015', icono: FaClock },
  { titulo: 'Alertas activas', valor: '2', detalle: 'Matricula y revision de frenos', icono: FaTriangleExclamation },
  { titulo: 'Gastos del mes', valor: '$ 145,00', detalle: 'Suma de servicios registrados', icono: FaDollarSign },
];


const actividadReciente = [
  { fecha: '18/07', descripcion: 'Cambio de aceite y filtro', vehiculo: 'Chevrolet Aveo 2015', costo: '$ 55,00' },
  { fecha: '05/07', descripcion: 'Revision de frenos', vehiculo: 'Kia Rio 2019', costo: '$ 40,00' },
  { fecha: '28/06', descripcion: 'Cambio de llantas delanteras', vehiculo: 'Chevrolet Aveo 2015', costo: '$ 50,00' },
  { fecha: '15/06', descripcion: 'Renovacion de matricula', vehiculo: 'Kia Rio 2019', costo: '$ 90,00' },
];

// Panel principal del area privada.
function Dashboard() {
  const [estadoApi, setEstadoApi] = useState({ cargando: true, datos: null, error: '' });

  useEffect(() => {
    let activo = true;

    obtenerEstadoApi()
      .then((datos) => {
        if (activo) setEstadoApi({ cargando: false, datos, error: '' });
      })
      .catch((error) => {
        if (activo) setEstadoApi({ cargando: false, datos: null, error: error.message });
      });

    return () => {
      activo = false;
    };
  }, []);

  return (
    <Layout conSidebar>
      <Flex align="center" justify="space-between" gap={4} flexWrap="wrap" mb={3}>
        <Box>
          <Heading as="h1" size="xl">
            Dashboard
          </Heading>
          <Text fontSize="sm" color="secondary.600">
            Resumen del estado de tus vehiculos.
          </Text>
        </Box>
        <Badge colorScheme="warning" px={3} py={1} borderRadius="full" textTransform="uppercase">
          Datos temporales
        </Badge>
      </Flex>

      <Alert status="warning" borderRadius="md" mb={6} fontSize="sm">
        <AlertIcon />
        Todos los valores mostrados en esta pagina son datos simulados de la Parte 1. No provienen
        todavia de la base de datos.
      </Alert>

      {/* Indicadores */}
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={6} mb={8}>
        {indicadores.map((indicador) => (
          <Box
            key={indicador.titulo}
            p={6}
            bg="white"
            borderWidth="1px"
            borderColor="secondary.200"
            borderRadius="lg"
            boxShadow="sm"
          >
            <Flex
              align="center"
              justify="center"
              boxSize="42px"
              mb={2}
              bg="brand.50"
              borderRadius="md"
            >
              <Icon as={indicador.icono} boxSize={5} color="brand.600" />
            </Flex>
            <Stat>
              <StatLabel color="secondary.500">{indicador.titulo}</StatLabel>
              <StatNumber color="brand.800">{indicador.valor}</StatNumber>
              <StatHelpText color="secondary.500" mb={0}>
                {indicador.detalle}
              </StatHelpText>
            </Stat>
          </Box>
        ))}
      </SimpleGrid>

      {/* Actividad reciente */}
      <Box
        p={6}
        mb={8}
        bg="white"
        borderWidth="1px"
        borderColor="secondary.200"
        borderRadius="lg"
        boxShadow="sm"
      >
        <Heading as="h2" size="md" mb={4}>
          Actividad reciente
        </Heading>

        <TableContainer>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Fecha</Th>
                <Th>Mantenimiento</Th>
                <Th>Vehiculo</Th>
                <Th>Costo</Th>
              </Tr>
            </Thead>
            <Tbody>
              {actividadReciente.map((item) => (
                <Tr key={`${item.fecha}-${item.descripcion}`}>
                  <Td>{item.fecha}</Td>
                  <Td>{item.descripcion}</Td>
                  <Td>{item.vehiculo}</Td>
                  <Td>{item.costo}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      {/* Estado del sistema */}
      <Box
        p={6}
        bg="white"
        borderWidth="1px"
        borderColor="secondary.200"
        borderRadius="lg"
        boxShadow="sm"
      >
        <Heading as="h2" size="md" mb={1}>
          Estado del sistema
        </Heading>
        <Text fontSize="sm" color="secondary.600" mb={3}>
          Consulta real al endpoint <Code>/api/health</Code> del backend.
        </Text>

        {estadoApi.cargando && (
          <HStack fontSize="sm" color="secondary.600">
            <Spinner size="sm" />
            <Text>Consultando el backend...</Text>
          </HStack>
        )}

        {estadoApi.error && (
          <Alert status="error" borderRadius="md" fontSize="sm">
            <AlertIcon />
            No se pudo contactar al backend: {estadoApi.error}
          </Alert>
        )}

        {estadoApi.datos && (
          <Wrap spacing={3}>
            <WrapItem>
              <Badge colorScheme="success" px={3} py={1} borderRadius="md">
                API: {estadoApi.datos.api}
              </Badge>
            </WrapItem>
            <WrapItem>
              <Badge colorScheme="success" px={3} py={1} borderRadius="md">
                Base de datos: {estadoApi.datos.database}
              </Badge>
            </WrapItem>
            <WrapItem>
              <Badge colorScheme="success" px={3} py={1} borderRadius="md">
                Consultado: {estadoApi.datos.timestamp}
              </Badge>
            </WrapItem>
          </Wrap>
        )}
      </Box>
    </Layout>
  );
}

export default Dashboard;
