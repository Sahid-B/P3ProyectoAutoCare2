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
  SimpleGrid,
  Divider,
} from '@chakra-ui/react';
import {
  FaWrench,
  FaCalendarDays,
  FaGaugeHigh,
  FaDollarSign,
  FaShop,
  FaCircleInfo,
  FaPen,
  FaTrash,
  FaArrowLeft,
  FaCar,
} from 'react-icons/fa6';
import { Link as RouterLink } from 'react-router-dom';
import { calcularEstadoMantenimiento } from '../../utils/rule-engine.js';

function MaintenanceDetail({ mantenimiento, alEliminar }) {
  if (!mantenimiento) return null;

  const infoEstado = calcularEstadoMantenimiento(mantenimiento);

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
    <Box bg="white" p={6} borderRadius="lg" borderWidth="1px" borderColor="secondary.200" boxShadow="sm">
      {/* Encabezado */}
      <Flex align="flex-start" justify="space-between" mb={6} flexWrap="wrap" gap={4}>
        <HStack spacing={4}>
          <Flex align="center" justify="center" boxSize="54px" bg="brand.50" borderRadius="lg">
            <Icon as={FaWrench} boxSize={7} color="brand.600" />
          </Flex>
          <Box>
            <HStack spacing={3}>
              <Heading as="h1" size="lg" color="brand.800">
                {mantenimiento.maintenance_type}
              </Heading>
              <Badge colorScheme={badgeColorScheme} px={3} py={1} borderRadius="full">
                {infoEstado.label}
              </Badge>
            </HStack>
            <HStack spacing={2} mt={1} color="secondary.600" fontSize="sm">
              <Icon as={FaCar} boxSize={4} />
              <Text fontWeight="medium">
                {mantenimiento.vehicle_marca
                  ? `${mantenimiento.vehicle_marca} ${mantenimiento.vehicle_modelo} (${mantenimiento.vehicle_placa})`
                  : `Vehiculo #${mantenimiento.vehicle_id}`}
              </Text>
            </HStack>
          </Box>
        </HStack>

        <HStack spacing={2}>
          <Button
            as={RouterLink}
            to="/mantenimientos"
            variant="outline"
            leftIcon={<FaArrowLeft />}
            size="sm"
          >
            Volver
          </Button>
          <Button
            as={RouterLink}
            to={`/mantenimientos/${mantenimiento.id}/editar`}
            colorScheme="brand"
            leftIcon={<FaPen />}
            size="sm"
          >
            Editar
          </Button>
          {alEliminar && (
            <Button
              colorScheme="red"
              variant="ghost"
              leftIcon={<FaTrash />}
              size="sm"
              onClick={() => alEliminar(mantenimiento.id)}
            >
              Eliminar
            </Button>
          )}
        </HStack>
      </Flex>

      <Divider mb={6} />

      {/* Grid de Detalles Principal */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Box p={4} bg="secondary.50" borderRadius="md" borderWidth="1px" borderColor="secondary.200">
          <HStack spacing={3} color="brand.600" mb={1}>
            <Icon as={FaCalendarDays} boxSize={5} />
            <Text fontSize="xs" fontWeight="bold" textTransform="uppercase">
              Fecha de Realizacion
            </Text>
          </HStack>
          <Text fontSize="lg" fontWeight="semibold" color="brand.800">
            {mantenimiento.date}
          </Text>
        </Box>

        <Box p={4} bg="secondary.50" borderRadius="md" borderWidth="1px" borderColor="secondary.200">
          <HStack spacing={3} color="brand.600" mb={1}>
            <Icon as={FaGaugeHigh} boxSize={5} />
            <Text fontSize="xs" fontWeight="bold" textTransform="uppercase">
              Kilometraje del Servicio
            </Text>
          </HStack>
          <Text fontSize="lg" fontWeight="semibold" color="brand.800">
            {mantenimiento.kilometers.toLocaleString()} km
          </Text>
        </Box>

        <Box p={4} bg="secondary.50" borderRadius="md" borderWidth="1px" borderColor="secondary.200">
          <HStack spacing={3} color="brand.600" mb={1}>
            <Icon as={FaDollarSign} boxSize={5} />
            <Text fontSize="xs" fontWeight="bold" textTransform="uppercase">
              Costo Invertido
            </Text>
          </HStack>
          <Text fontSize="lg" fontWeight="semibold" color="brand.800">
            {formatCurrency(mantenimiento.cost)}
          </Text>
        </Box>
      </SimpleGrid>

      {/* Informacion Adicional y Taller */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
        <Box>
          <Heading as="h3" size="sm" mb={3} color="brand.800">
            Informacion de Taller y Observaciones
          </Heading>
          <VStack align="stretch" spacing={3} fontSize="sm">
            <Flex align="center" justify="space-between" p={3} borderBottomWidth="1px" borderColor="secondary.100">
              <HStack color="secondary.600">
                <Icon as={FaShop} boxSize={4} />
                <Text>Taller / Proveedor:</Text>
              </HStack>
              <Text fontWeight="medium">{mantenimiento.workshop || 'No especificado'}</Text>
            </Flex>

            <Box p={3} bg="white" borderWidth="1px" borderColor="secondary.200" borderRadius="md">
              <HStack color="secondary.600" mb={1}>
                <Icon as={FaCircleInfo} boxSize={4} />
                <Text fontWeight="medium">Descripcion / Notas:</Text>
              </HStack>
              <Text color="secondary.700">
                {mantenimiento.description || 'Sin observaciones registradas.'}
              </Text>
            </Box>
          </VStack>
        </Box>

        {/* Diagnostico del Motor de Reglas */}
        <Box p={5} bg="brand.50" borderRadius="lg" borderWidth="1px" borderColor="brand.200">
          <Heading as="h3" size="sm" mb={3} color="brand.800">
            Proxima Revision (Motor de Reglas)
          </Heading>
          <VStack align="stretch" spacing={3} fontSize="sm">
            <Flex align="center" justify="space-between">
              <Text color="secondary.700">Fecha Estimada:</Text>
              <Text fontWeight="bold" color="brand.800">
                {mantenimiento.next_date || 'No programada'}
              </Text>
            </Flex>

            <Flex align="center" justify="space-between">
              <Text color="secondary.700">Kilometraje Objetivo:</Text>
              <Text fontWeight="bold" color="brand.800">
                {mantenimiento.next_kilometers
                  ? `${mantenimiento.next_kilometers.toLocaleString()} km`
                  : 'No programado'}
              </Text>
            </Flex>

            <Divider borderColor="brand.200" />

            <Box pt={1}>
              <Text fontSize="xs" fontWeight="bold" color="brand.700" textTransform="uppercase" mb={1}>
                Diagnostico Actual:
              </Text>
              <Text fontSize="sm" fontWeight="medium" color="brand.900">
                {infoEstado.detalle}
              </Text>
            </Box>
          </VStack>
        </Box>
      </SimpleGrid>
    </Box>
  );
}

export default MaintenanceDetail;
