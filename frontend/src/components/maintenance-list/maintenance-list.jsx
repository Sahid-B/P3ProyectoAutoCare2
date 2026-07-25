import { useState } from 'react';
import {
  SimpleGrid,
  Box,
  Text,
  Select,
  Input,
  HStack,
  Flex,
  InputGroup,
  InputLeftElement,
  Icon,
} from '@chakra-ui/react';
import { FaMagnifyingGlass, FaFilter } from 'react-icons/fa6';

import MaintenanceCard from '../maintenance-card/index.jsx';

function MaintenanceList({ mantenimientos = [], vehiculos = [], alEliminar }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroVehiculo, setFiltroVehiculo] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const mantenimientosFiltrados = mantenimientos.filter((m) => {
    const coincideBusqueda =
      m.maintenance_type.toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.workshop && m.workshop.toLowerCase().includes(busqueda.toLowerCase())) ||
      (m.description && m.description.toLowerCase().includes(busqueda.toLowerCase()));

    const coincideVehiculo = !filtroVehiculo || String(m.vehicle_id) === String(filtroVehiculo);
    const coincideTipo = !filtroTipo || m.maintenance_type === filtroTipo;

    return coincideBusqueda && coincideVehiculo && coincideTipo;
  });

  const tiposUnicos = Array.from(new Set(mantenimientos.map((m) => m.maintenance_type)));

  return (
    <Box>
      <Flex direction={{ base: 'column', md: 'row' }} gap={4} mb={6}>
        <InputGroup maxW={{ base: '100%', md: '320px' }}>
          <InputLeftElement pointerEvents="none">
            <Icon as={FaMagnifyingGlass} color="secondary.400" />
          </InputLeftElement>

          <Input
            placeholder="Buscar por servicio, taller o descripcion..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            bg="white"
          />
        </InputGroup>

        <HStack spacing={3} flex={1}>
          <Select
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

          <Select
            placeholder="Todos los servicios"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            bg="white"
          >
            {tiposUnicos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </Select>
        </HStack>
      </Flex>

      {mantenimientosFiltrados.length === 0 ? (
        <Box p={8} bg="white" borderWidth="1px" borderColor="secondary.200" borderRadius="lg" textAlign="center">
          <Text color="secondary.600" fontSize="sm">
            No se encontraron registros de mantenimiento con los filtros seleccionados.
          </Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
          {mantenimientosFiltrados.map((mantenimiento) => {
            const vehiculo = vehiculos.find((v) => String(v.id) === String(mantenimiento.vehicle_id));
            return (
              <MaintenanceCard
                key={mantenimiento.id}
                mantenimiento={mantenimiento}
                vehiculoKilometraje={vehiculo?.kilometraje_actual}
                alEliminar={alEliminar}
              />
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
}

export default MaintenanceList;
