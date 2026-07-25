import {
  Box,
  Heading,
  Text,
  Badge,
  VStack,
  HStack,
  Flex,
  Icon,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FaBell, FaTriangleExclamation, FaClock, FaArrowRight } from 'react-icons/fa6';
import { Link as RouterLink } from 'react-router-dom';

function NotificationCard({ alertas = [], alPedirPermisosPush, permisoPush = 'default' }) {
  if (!alertas || alertas.length === 0) {
    return (
      <Box p={5} bg="white" borderWidth="1px" borderColor="secondary.200" borderRadius="lg" mb={6}>
        <Flex align="center" gap={3}>
          <Icon as={FaBell} boxSize={5} color="green.500" />
          <Box>
            <Text fontWeight="semibold" fontSize="sm" color="brand.800">
              ¡Todo al dia!
            </Text>
            <Text fontSize="xs" color="secondary.600">
              No tienes mantenimientos pendientes ni alertas urgentes en este momento.
            </Text>
          </Box>
        </Flex>
      </Box>
    );
  }

  return (
    <Box p={5} bg="white" borderWidth="1px" borderColor="secondary.200" borderRadius="lg" mb={6} boxShadow="sm">
      <Flex align="center" justify="space-between" mb={4} flexWrap="wrap" gap={2}>
        <HStack spacing={2}>
          <Icon as={FaTriangleExclamation} boxSize={5} color="orange.500" />
          <Heading as="h3" size="sm" color="brand.800">
            Alertas de Mantenimiento ({alertas.length})
          </Heading>
        </HStack>

        {permisoPush !== 'granted' && alPedirPermisosPush && (
          <Button
            size="xs"
            colorScheme="brand"
            variant="outline"
            leftIcon={<FaBell />}
            onClick={alPedirPermisosPush}
          >
            Activar Notificaciones Push
          </Button>
        )}
      </Flex>

      <VStack align="stretch" spacing={3}>
        {alertas.map((alerta) => (
          <Alert
            key={`${alerta.id}-${alerta.maintenance_type}`}
            status={alerta.estado === 'vencido' ? 'error' : 'warning'}
            variant="subtle"
            borderRadius="md"
            py={3}
            px={4}
          >
            <AlertIcon />
            <Box flex="1">
              <Flex align="center" justify="space-between" flexWrap="wrap">
                <AlertTitle fontSize="sm" fontWeight="bold">
                  {alerta.maintenance_type}
                </AlertTitle>
                <Badge
                  colorScheme={alerta.estado === 'vencido' ? 'red' : 'orange'}
                  fontSize="0.65rem"
                >
                  {alerta.label}
                </Badge>
              </Flex>
              <AlertDescription fontSize="xs" display="block" mt={1}>
                {alerta.vehicle_marca
                  ? `${alerta.vehicle_marca} ${alerta.vehicle_modelo} (${alerta.vehicle_placa})`
                  : `Vehiculo #${alerta.vehicle_id}`}{' '}
                — <strong>{alerta.detalle}</strong>
              </AlertDescription>
            </Box>
            <Button
              as={RouterLink}
              to={`/mantenimientos/${alerta.id}`}
              size="xs"
              colorScheme={alerta.estado === 'vencido' ? 'red' : 'orange'}
              variant="ghost"
              ml={2}
              rightIcon={<FaArrowRight />}
            >
              Ver
            </Button>
          </Alert>
        ))}
      </VStack>
    </Box>
  );
}

export default NotificationCard;
