import { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FaCalendarDays, FaWrench, FaCar, FaClock, FaLocationDot } from 'react-icons/fa6';
import { Link as RouterLink } from 'react-router-dom';
import Layout from '../../components/layout/index.jsx';
import { obtenerCitas, solicitarCita, actualizarEstadoCita } from '../../services/citas-service';
import { getVehicles } from '../../services/vehicle-service';
import { peticion } from '../../services/api-service';

const COLOR_ESTADO = {
  pendiente: 'yellow',
  aceptada: 'green',
  rechazada: 'red',
  completada: 'blue',
  cancelado: 'gray',
};

const HORAS_DISPONIBLES = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

function Citas() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Estados de datos
  const [citas, setCitas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados del formulario de nueva cita
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState('');
  const [tallerSeleccionado, setTallerSeleccionado] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cargar citas, vehículos y talleres del mapa
  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resCitas, resVehiculos, resMapa] = await Promise.all([
        obtenerCitas(),
        getVehicles(),
        peticion('/mapa/ubicaciones'),
      ]);

      setCitas(resCitas.data || []);
      setVehiculos(resVehiculos.data || []);
      setTalleres(resMapa.talleres || []);
    } catch (error) {
      toast({
        title: 'Error al cargar datos',
        description: error.message || 'No se pudieron recuperar las citas.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearCita = async (e) => {
    e.preventDefault();
    if (!vehiculoSeleccionado || !tallerSeleccionado || !fecha || !hora) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor llena todos los campos requeridos.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setGuardando(true);
      await solicitarCita({
        vehiculo_id: Number(vehiculoSeleccionado),
        taller_id: Number(tallerSeleccionado),
        fecha,
        hora,
        descripcion,
      });

      toast({
        title: 'Cita agendada',
        description: 'La cita ha sido solicitada correctamente al taller.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Limpiar formulario y cerrar
      setVehiculoSeleccionado('');
      setTallerSeleccionado('');
      setFecha('');
      setHora('');
      setDescripcion('');
      onClose();

      // Recargar datos
      await cargarDatos();
    } catch (error) {
      toast({
        title: 'Error al agendar',
        description: error.message || 'No se pudo agendar la cita.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelarCita = async (citaId) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) return;

    try {
      await actualizarEstadoCita(citaId, 'cancelado');
      toast({
        title: 'Cita cancelada',
        description: 'Tu cita ha sido cancelada con éxito.',
        status: 'info',
        duration: 4000,
        isClosable: true,
      });
      await cargarDatos();
    } catch (error) {
      toast({
        title: 'Error al cancelar',
        description: error.message || 'No se pudo cancelar la cita.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Obtener fecha mínima para el selector (hoy)
  const fechaMinima = new Date().toISOString().split('T')[0];

  return (
    <Layout conSidebar>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading as="h1" size="lg" color="secondary.900" mb={1}>
            Mis Citas de Taller
          </Heading>
          <Text color="secondary.600">
            Agenda y controla tus citas de mantenimiento preventivo y correctivo.
          </Text>
        </Box>
        <Button
          leftIcon={<FaCalendarDays />}
          variant="primary"
          onClick={onOpen}
          isDisabled={cargando}
        >
          Solicitar Cita
        </Button>
      </Flex>

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
            No tienes citas agendadas
          </Heading>
          <Text color="secondary.600" fontSize="sm" maxW="sm" mb={6}>
            Agenda una cita con cualquiera de los talleres mecánicos disponibles para tu vehículo.
          </Text>
          <Button variant="outline" colorScheme="brand" onClick={onOpen}>
            Agendar mi primera cita
          </Button>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {citas.map((cita) => (
            <Card key={cita.id} bg="white" shadow="sm" borderRadius="lg" borderWidth="1px" borderColor="secondary.100">
              <CardBody p={5}>
                <Flex justify="space-between" align="flex-start" mb={4}>
                  <Box>
                    <HStack spacing={2} mb={1}>
                      <Icon as={FaWrench} color="brand.500" />
                      <Text fontWeight="bold" color="secondary.900" fontSize="lg">
                        {cita.nombre_taller}
                      </Text>
                    </HStack>
                    <HStack spacing={1} color="secondary.500" fontSize="sm">
                      <Icon as={FaLocationDot} />
                      <Text noOfLines={1}>{cita.taller_direccion}</Text>
                    </HStack>
                  </Box>
                  <Badge colorScheme={COLOR_ESTADO[cita.estado]} px={3} py={1} borderRadius="md" textTransform="uppercase" fontSize="xs">
                    {cita.estado}
                  </Badge>
                </Flex>

                <Stack spacing={2} mb={4} fontSize="sm" color="secondary.700">
                  <HStack>
                    <Icon as={FaCar} color="secondary.400" />
                    <Text fontWeight="medium">
                      Vehículo: {cita.vehiculo_marca} {cita.vehiculo_modelo} ({cita.vehiculo_placa})
                    </Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaCalendarDays} color="secondary.400" />
                    <Text>
                      Fecha: {new Date(cita.fecha).toLocaleDateString('es-EC', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaClock} color="secondary.400" />
                    <Text>Hora: {cita.hora}</Text>
                  </HStack>
                  {cita.descripcion && (
                    <Box pt={2}>
                      <Text fontWeight="semibold" color="secondary.800" mb={1}>
                        Motivo / Descripción:
                      </Text>
                      <Text bg="secondary.50" p={3} borderRadius="md" fontStyle="italic">
                        "{cita.descripcion}"
                      </Text>
                    </Box>
                  )}
                </Stack>

                <Flex justify="flex-end" pt={2} borderTop="1px" borderColor="secondary.100">
                  {(cita.estado === 'pendiente' || cita.estado === 'aceptada') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleCancelarCita(cita.id)}
                    >
                      Cancelar Cita
                    </Button>
                  )}
                </Flex>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Modal para solicitar cita */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <form onSubmit={handleCrearCita}>
            <ModalHeader borderBottomWidth="1px">Agendar Nueva Cita</ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
              <Stack spacing={4}>
                {vehiculos.length === 0 ? (
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="semibold">No tienes vehículos registrados</Text>
                      <Text fontSize="sm">
                        Debes agregar al menos un vehículo antes de poder agendar una cita.{' '}
                        <Link as={RouterLink} to="/vehiculos/nuevo" color="brand.500" fontWeight="bold">
                          Registrar vehículo aquí
                        </Link>
                      </Text>
                    </Box>
                  </Alert>
                ) : (
                  <FormControl isRequired>
                    <FormLabel>Selecciona tu Vehículo</FormLabel>
                    <Select
                      placeholder="Elegir vehículo..."
                      value={vehiculoSeleccionado}
                      onChange={(e) => setVehiculoSeleccionado(e.target.value)}
                    >
                      {vehiculos.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.marca} {v.modelo} - Placa: {v.placa}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <FormControl isRequired>
                  <FormLabel>Selecciona el Taller</FormLabel>
                  <Select
                    placeholder="Elegir taller..."
                    value={tallerSeleccionado}
                    onChange={(e) => setTallerSeleccionado(e.target.value)}
                  >
                    {talleres.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} - {t.direccion}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <SimpleGrid columns={2} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Fecha</FormLabel>
                    <Input
                      type="date"
                      min={fechaMinima}
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Hora</FormLabel>
                    <Select
                      placeholder="Seleccionar..."
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                    >
                      {HORAS_DISPONIBLES.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Motivo / Descripción de la Cita</FormLabel>
                  <Textarea
                    placeholder="Describe brevemente el servicio o problema del auto..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={3}
                  />
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px">
              <Button variant="secondary" mr={3} onClick={onClose} isDisabled={guardando}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={guardando}
                isDisabled={vehiculos.length === 0}
              >
                Agendar Cita
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Layout>
  );
}

export default Citas;
