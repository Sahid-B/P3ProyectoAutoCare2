import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Flex,
  Select,
  Input,
  HStack,
  InputGroup,
  InputLeftElement,
  Icon,
  Spinner,
  Button,
} from '@chakra-ui/react';
import { FaMagnifyingGlass, FaFolderOpen, FaArrowRight, FaWrench } from 'react-icons/fa6';

import { Link as RouterLink } from 'react-router-dom';
import Layout from '../../components/layout/index.jsx';
import { getMaintenances } from '../../services/maintenance-service.js';
import { getVehicles } from '../../services/vehicle-service.js';
import {
  getMaintenances as getLocalMaintenances,
  getVehicles as getLocalVehicles,
} from '../../services/indexeddb-service.js';
import { calcularEstadoMantenimiento } from '../../utils/rule-engine.js';

function Historial() {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [filtroVehiculo, setFiltroVehiculo] = useState('');

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        const [resM, resV] = await Promise.all([
          getMaintenances(),
          getVehicles(),
        ]);
        setMantenimientos(resM.data || []);
        setVehiculos(resV.data || []);
      } catch (err) {
        console.warn('[historial] Error cargando API, usando local:', err.message);
        const [localM, localV] = await Promise.all([
          getLocalMaintenances(),
          getLocalVehicles(),
        ]);
        setMantenimientos(localM || []);
        setVehiculos(localV || []);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const mantenimientosFiltrados = mantenimientos.filter((m) => {
    const coincideBusqueda =
      m.maintenance_type.toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.workshop && m.workshop.toLowerCase().includes(busqueda.toLowerCase())) ||
      (m.description && m.description.toLowerCase().includes(busqueda.toLowerCase()));

    const coincideVehiculo = !filtroVehiculo || String(m.vehicle_id) === String(filtroVehiculo);

    return coincideBusqueda && coincideVehiculo;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(val || 0);
  };

  return (
    <Layout conSidebar>
      <Box mb={6}>
        <HStack spacing={3} mb={1}>
          <Icon as={FaFolderOpen} boxSize={6} color="brand.600" />
          <Heading as="h1" size="xl" color="brand.800">
            Historial de Mantenimientos
          </Heading>
        </HStack>
        <Text fontSize="sm" color="secondary.600">
          Registro auditor y cronologico completo de todos los servicios realizados.
        </Text>
      </Box>

      {/* Filtros */}
      <Flex direction={{ base: 'column', md: 'row' }} gap={4} mb={6}>
        <InputGroup maxW={{ base: '100%', md: '360px' }}>
          <InputLeftElement pointerEvents="none">
            <Icon as={FaMagnifyingGlass} color="secondary.400" />
          </InputLeftElement>

          <Input
            placeholder="Buscar en el historial por taller, notas o servicio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            bg="white"
          />
        </InputGroup>

        <Select
          maxW={{ base: '100%', md: '280px' }}
          placeholder="Todos los vehiculos"
          value={filtroVehiculo}
          onChange={(e) => setFiltroVehiculo(e.target.value)}
          bg="white"
        >
          {vehiculos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.marca} {v.modelo} ({v.placa})
            </option>
          ))}
        </Select>
      </Flex>

      {cargando ? (
        <Flex align="center" justify="center" py={12}>
          <HStack spacing={3} color="secondary.600">
            <Spinner size="md" color="brand.500" />
            <Text>Cargando historial...</Text>
          </HStack>
        </Flex>
      ) : mantenimientosFiltrados.length === 0 ? (
        <Box p={8} bg="white" borderWidth="1px" borderColor="secondary.200" borderRadius="lg" textAlign="center">
          <Text color="secondary.600" fontSize="sm">
            No hay registros de mantenimientos en el historial.
          </Text>
        </Box>
      ) : (
        <Box bg="white" borderRadius="lg" borderWidth="1px" borderColor="secondary.200" boxShadow="sm" overflow="hidden">
          <TableContainer>
            <Table variant="simple" size="md">
              <Thead bg="secondary.50">
                <Tr>
                  <Th>Fecha</Th>
                  <Th>Vehiculo</Th>
                  <Th>Servicio</Th>
                  <Th>Kilometraje</Th>
                  <Th>Costo</Th>
                  <Th>Taller</Th>
                  <Th>Estado Motor Reglas</Th>
                  <Th textAlign="right">Accion</Th>
                </Tr>
              </Thead>
              <Tbody>
                {mantenimientosFiltrados.map((m) => {
                  const v = vehiculos.find((veh) => String(veh.id) === String(m.vehicle_id));
                  const infoEst = calcularEstadoMantenimiento(m, v?.kilometraje_actual);

                  const badgeColorScheme = {
                    al_dia: 'green',
                    proximo: 'blue',
                    urgente: 'orange',
                    vencido: 'red',
                  }[infoEst.estado] || 'gray';

                  return (
                    <Tr key={m.id} _hover={{ bg: 'secondary.50' }}>
                      <Td fontWeight="medium">{m.date}</Td>
                      <Td>
                        {m.vehicle_marca
                          ? `${m.vehicle_marca} ${m.vehicle_modelo}`
                          : `Vehiculo #${m.vehicle_id}`}
                        <Text fontSize="xs" color="secondary.500">
                          {m.vehicle_placa || ''}
                        </Text>
                      </Td>
                      <Td fontWeight="semibold" color="brand.800">
                        {m.maintenance_type}
                      </Td>
                      <Td>{m.kilometers.toLocaleString()} km</Td>
                      <Td fontWeight="bold" color="brand.700">
                        {formatCurrency(m.cost)}
                      </Td>
                      <Td fontSize="sm">{m.workshop || '-'}</Td>
                      <Td>
                        <Badge colorScheme={badgeColorScheme} px={2} py={0.5} borderRadius="full" fontSize="0.7rem">
                          {infoEst.label}
                        </Badge>
                      </Td>
                      <Td textAlign="right">
                        <Button
                          as={RouterLink}
                          to={`/mantenimientos/${m.id}`}
                          size="xs"
                          colorScheme="brand"
                          variant="ghost"
                          rightIcon={<FaArrowRight />}
                        >
                          Ver
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Layout>
  );
}

export default Historial;
