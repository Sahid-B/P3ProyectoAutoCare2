import { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { FaCalendarDays, FaCar, FaClock, FaEnvelope, FaUser, FaCheck, FaXmark } from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import { obtenerCitas, actualizarEstadoCita } from '../../services/citas-service';

const COLOR_ESTADO = {
  pendiente: 'yellow',
  aceptada: 'green',
  rechazada: 'red',
  completada: 'blue',
  cancelado: 'gray',
};

function SolicitudesTaller() {
  const toast = useToast();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarCitas = async () => {
    try {
      setCargando(true);
      const res = await obtenerCitas();
      setCitas(res.data || []);
    } catch (error) {
      toast({
        title: 'Error al cargar citas',
        description: error.message || 'No se pudieron recuperar las solicitudes.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCitas();
  }, []);

  const handleCambiarEstado = async (citaId, nuevoEstado) => {
    try {
      await actualizarEstadoCita(citaId, nuevoEstado);
      toast({
        title: 'Cita actualizada',
        description: `La cita ha sido marcada como ${nuevoEstado}.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      await cargarCitas();
    } catch (error) {
      toast({
        title: 'Error al actualizar',
        description: error.message || 'No se pudo cambiar el estado de la cita.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Layout conSidebar>
      <Box mb={6}>
        <Heading as="h1" size="lg" color="secondary.900" mb={1}>
          Solicitudes de Citas
        </Heading>
        <Text color="secondary.600">
          Gestiona las solicitudes de mantenimiento agendadas por tus clientes.
        </Text>
      </Box>

      {cargando ? (
        <Flex justify="center" align="center" minH="40vh">
          <Spinner size="xl" color="brand.500" thickness="4px" />
        </Flex>
      ) : citas.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          textAlign="center"
          py={16}
          bg="white"
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="lg"
          shadow="sm"
        >
          <Icon as={FaCalendarDays} boxSize={16} color="brand.300" mb={4} />
          <Heading as="h3" size="md" color="secondary.900" mb={2}>
            No tienes solicitudes de citas
          </Heading>
          <Text color="secondary.600" fontSize="sm" maxW="sm">
            Las citas que agenden tus clientes para mantenimiento en tu taller aparecerán listadas aquí.
          </Text>
        </Flex>
      ) : (
        <Stack spacing={4}>
          {citas.map((cita) => (
            <Card key={cita.id} bg="white" shadow="sm" borderRadius="lg" borderWidth="1px" borderColor="secondary.100">
              <CardBody p={5}>
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} alignItems="center">
                  {/* Info del Cliente */}
                  <Stack spacing={1}>
                    <HStack>
                      <Icon as={FaUser} color="brand.500" />
                      <Text fontWeight="bold" color="secondary.900">
                        {cita.cliente_nombre} {cita.cliente_apellido}
                      </Text>
                    </HStack>
                    <HStack fontSize="xs" color="secondary.500">
                      <Icon as={FaEnvelope} />
                      <Text noOfLines={1}>{cita.cliente_correo}</Text>
                    </HStack>
                  </Stack>

                  {/* Detalle del Servicio */}
                  <Stack spacing={1}>
                    <HStack fontSize="sm" color="secondary.700">
                      <Icon as={FaCar} color="secondary.400" />
                      <Text fontWeight="medium">
                        {cita.vehiculo_marca} {cita.vehiculo_modelo}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="secondary.500" pl={5}>
                      Placa: {cita.vehiculo_placa}
                    </Text>
                    {cita.descripcion && (
                      <Text fontSize="xs" color="secondary.600" pl={5} noOfLines={2} fontStyle="italic">
                        "{cita.descripcion}"
                      </Text>
                    )}
                  </Stack>

                  {/* Fecha y Hora */}
                  <Stack spacing={1}>
                    <HStack fontSize="sm" color="secondary.700">
                      <Icon as={FaCalendarDays} color="secondary.400" />
                      <Text>
                        {new Date(cita.fecha).toLocaleDateString('es-EC', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </HStack>
                    <HStack fontSize="sm" color="secondary.700">
                      <Icon as={FaClock} color="secondary.400" />
                      <Text>{cita.hora}</Text>
                    </HStack>
                  </Stack>

                  {/* Estado y Acciones */}
                  <Flex justify={{ base: 'flex-start', md: 'flex-end' }} align="center" gap={3}>
                    <Badge colorScheme={COLOR_ESTADO[cita.estado]} px={2} py={1} borderRadius="md" textTransform="uppercase" fontSize="xs">
                      {cita.estado}
                    </Badge>

                    {cita.estado === 'pendiente' && (
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="green"
                          leftIcon={<FaCheck />}
                          onClick={() => handleCambiarEstado(cita.id, 'aceptada')}
                        >
                          Aceptar
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          leftIcon={<FaXmark />}
                          onClick={() => handleCambiarEstado(cita.id, 'rechazada')}
                        >
                          Rechazar
                        </Button>
                      </HStack>
                    )}

                    {cita.estado === 'aceptada' && (
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          leftIcon={<FaCheck />}
                          onClick={() => handleCambiarEstado(cita.id, 'completada')}
                        >
                          Completar
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          leftIcon={<FaXmark />}
                          onClick={() => handleCambiarEstado(cita.id, 'rechazada')}
                        >
                          Rechazar
                        </Button>
                      </HStack>
                    )}
                  </Flex>
                </SimpleGrid>
              </CardBody>
            </Card>
          ))}
        </Stack>
      )}
    </Layout>
  );
}

export default SolicitudesTaller;
