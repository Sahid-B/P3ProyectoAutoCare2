import {
  Box,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Flex,
  Button,
  Icon,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import {
  FaWrench,
  FaCalendarDays,
  FaGaugeHigh,
  FaDollarSign,
  FaEllipsisVertical,
  FaPen,
  FaTrash,
  FaShop,
} from 'react-icons/fa6';
import { Link as RouterLink } from 'react-router-dom';
import { calcularEstadoMantenimiento } from '../../utils/rule-engine.js';

function MaintenanceCard({ mantenimiento, alEliminar, vehiculoKilometraje }) {
  const infoEstado = calcularEstadoMantenimiento(mantenimiento, vehiculoKilometraje);

  const badgeColorScheme = {
    al_dia: 'green',
    proximo: 'blue',
    urgente: 'orange',
    vencido: 'red',
  }[infoEstado.estado] || 'gray';

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(val || 0);
  };

  return (
    <Box
      p={5}
      bg="white"
      borderWidth="1px"
      borderColor="secondary.200"
      borderRadius="lg"
      boxShadow="sm"
      _hover={{ boxShadow: 'md', borderColor: 'brand.300' }}
      transition="all 0.2s"
    >
      <Flex align="flex-start" justify="space-between" mb={3}>
        <HStack spacing={3}>
          <Flex align="center" justify="center" boxSize="40px" bg="brand.50" borderRadius="md">
            <Icon as={FaWrench} boxSize={5} color="brand.600" />
          </Flex>
          <Box>
            <Heading as="h3" size="sm" color="brand.800">
              {mantenimiento.maintenance_type}
            </Heading>
            <Text fontSize="xs" color="secondary.600">
              {mantenimiento.vehicle_marca
                ? `${mantenimiento.vehicle_marca} ${mantenimiento.vehicle_modelo} (${mantenimiento.vehicle_placa})`
                : `Vehiculo #${mantenimiento.vehicle_id}`}
            </Text>
          </Box>
        </HStack>

        <HStack spacing={1}>
          <Badge colorScheme={badgeColorScheme} px={2.5} py={0.5} borderRadius="full" fontSize="xs">
            {infoEstado.label}
          </Badge>

          <Menu placement="bottom-end">
            <MenuButton
              as={IconButton}
              icon={<FaEllipsisVertical />}
              variant="ghost"
              size="sm"
              aria-label="Opciones"
            />
            <MenuList fontSize="sm">
              <MenuItem
                as={RouterLink}
                to={`/mantenimientos/${mantenimiento.id}/editar`}
                icon={<FaPen />}
              >
                Editar
              </MenuItem>
              {alEliminar && (
                <MenuItem
                  icon={<FaTrash />}
                  color="red.500"
                  onClick={() => alEliminar(mantenimiento.id)}
                >
                  Eliminar
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      <VStack align="stretch" spacing={2} my={3} fontSize="sm" color="secondary.700">
        <Flex align="center" justify="space-between">
          <HStack spacing={2} color="secondary.600">
            <Icon as={FaCalendarDays} boxSize={4} />
            <Text fontSize="xs">Fecha:</Text>
          </HStack>
          <Text fontWeight="medium">{mantenimiento.date}</Text>
        </Flex>

        <Flex align="center" justify="space-between">
          <HStack spacing={2} color="secondary.600">
            <Icon as={FaGaugeHigh} boxSize={4} />
            <Text fontSize="xs">Kilometraje:</Text>
          </HStack>
          <Text fontWeight="medium">{mantenimiento.kilometers.toLocaleString()} km</Text>
        </Flex>

        <Flex align="center" justify="space-between">
          <HStack spacing={2} color="secondary.600">
            <Icon as={FaDollarSign} boxSize={4} />
            <Text fontSize="xs">Costo:</Text>
          </HStack>
          <Text fontWeight="bold" color="brand.700">
            {formatCurrency(mantenimiento.cost)}
          </Text>
        </Flex>

        {mantenimiento.workshop && (
          <Flex align="center" justify="space-between">
            <HStack spacing={2} color="secondary.600">
              <Icon as={FaShop} boxSize={4} />
              <Text fontSize="xs">Taller:</Text>
            </HStack>
            <Text fontSize="xs" noOfLines={1}>
              {mantenimiento.workshop}
            </Text>
          </Flex>
        )}
      </VStack>

      <Box pt={3} borderTopWidth="1px" borderColor="secondary.100">
        <Text fontSize="xs" color="secondary.500" fontWeight="medium">
          {infoEstado.detalle}
        </Text>

        <Button
          as={RouterLink}
          to={`/mantenimientos/${mantenimiento.id}`}
          size="xs"
          variant="outline"
          colorScheme="brand"
          w="full"
          mt={2}
        >
          Ver Detalle
        </Button>
      </Box>
    </Box>
  );
}

export default MaintenanceCard;
