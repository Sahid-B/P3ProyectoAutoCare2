import { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Flex,
  GridItem,
  Heading,
  HStack,
  Icon,
  Image,
  Progress,
  SimpleGrid,
  Skeleton,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  Button,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import {
  FaCarRear,
  FaImage,
  FaEnvelope,
  FaTrash,
  FaPenToSquare,
  FaPlus,
} from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import { useAuth } from '../../context/auth-context.jsx';
import { getAllListings, deleteListing, updateListing, createListing } from '../../services/marketplace-service.js';

const veredictos = {
  oportunidad: { label: 'Oportunidad', color: 'green' },
  precio_justo: { label: 'Precio justo', color: 'blue' },
  sobrevalorado: { label: 'Sobrevalorado', color: 'red' },
};

function moneda(valor) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(valor || 0));
}

const FORM_INICIAL = {
  marca: '',
  modelo: '',
  anio: 2020,
  kilometraje: 50000,
  ciudad: 'Santo Domingo',
  precio_vendedor: 10000,
  tipo_vehiculo: 'automovil',
  imagen_url: '',
  estado_visual: 'bueno',
  historial_mantenimiento: 'completo',
  danos_reportados: 'ninguno',
};

function Comprar() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const toast = useToast();

  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Modal para Crear/Editar (Admin)
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);

  const cargarPublicaciones = () => {
    setCargando(true);
    getAllListings()
      .then((respuesta) => {
        setPublicaciones(respuesta.data || []);
      })
      .catch((err) => {
        setError(err.message || 'No se pudieron cargar los vehiculos.');
      })
      .finally(() => {
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarPublicaciones();
  }, []);

  const abrirNuevoModal = () => {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    onOpen();
  };

  const abrirEditarModal = (item) => {
    setEditandoId(item.id);
    setForm({
      marca: item.marca || '',
      modelo: item.modelo || '',
      anio: item.anio || 2020,
      kilometraje: item.kilometraje || 0,
      ciudad: item.ciudad || '',
      precio_vendedor: item.precio_vendedor || 0,
      tipo_vehiculo: item.tipo_vehiculo || 'automovil',
      imagen_url: item.imagen_url || '',
      estado_visual: item.estado_visual || 'bueno',
      historial_mantenimiento: item.historial_mantenimiento || 'completo',
      danos_reportados: item.danos_reportados || 'ninguno',
    });
    onOpen();
  };

  const manejarGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editandoId) {
        await updateListing(editandoId, form);
        toast({ title: 'Publicación actualizada', status: 'success', duration: 3000 });
      } else {
        await createListing(form);
        toast({ title: 'Auto publicado con éxito', status: 'success', duration: 3000 });
      }
      onClose();
      cargarPublicaciones();
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminar = async (id) => {
    if (!window.confirm('¿Seguro de que deseas eliminar esta publicación?')) return;
    try {
      await deleteListing(id);
      toast({ title: 'Publicación eliminada', status: 'info', duration: 3000 });
      cargarPublicaciones();
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 4000 });
    }
  };

  return (
    <Layout conSidebar>
      <Flex align="center" justify="space-between" gap={4} flexWrap="wrap" mb={6}>
        <Box>
          <Heading as="h1" size="xl" color="brand.800">
            Comprar Vehiculos
          </Heading>
          <Text fontSize="sm" color="secondary.600">
            Explora el catalogo de vehiculos publicados por otros usuarios.
          </Text>
        </Box>

        {esAdmin && (
          <Button leftIcon={<FaPlus />} colorScheme="brand" onClick={abrirNuevoModal}>
            Publicar Auto (Admin)
          </Button>
        )}
      </Flex>

      {error && (
        <Alert status="error" borderRadius="md" mb={6} fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {cargando ? (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} height="400px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      ) : publicaciones.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          textAlign="center"
          py={14}
          bg="white"
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="lg"
        >
          <Icon as={FaImage} boxSize={10} color="brand.300" mb={3} />
          <Heading as="h3" size="sm" mb={2}>
            Aun no hay autos publicados
          </Heading>
          <Text color="secondary.600">Vuelve mas tarde para ver las ofertas.</Text>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
          {publicaciones.map((item) => {
            const veredicto = veredictos[item.veredicto] || veredictos.precio_justo;
            return (
              <Box
                key={item.id}
                bg="white"
                borderWidth="1px"
                borderColor="secondary.200"
                borderRadius="lg"
                overflow="hidden"
                boxShadow="sm"
                display="flex"
                flexDirection="column"
                position="relative"
              >
                {item.imagen_url ? (
                  <Image src={item.imagen_url} alt={`${item.marca} ${item.modelo}`} w="100%" h="210px" objectFit="cover" />
                ) : (
                  <Flex h="210px" bg="secondary.100" align="center" justify="center" color="secondary.500">
                    <Icon as={FaCarRear} boxSize={12} />
                  </Flex>
                )}

                {esAdmin && (
                  <HStack position="absolute" top={3} right={3} spacing={2} bg="rgba(255,255,255,0.9)" p={1} borderRadius="md" boxShadow="sm">
                    <IconButton
                      aria-label="Editar"
                      icon={<FaPenToSquare />}
                      size="xs"
                      colorScheme="blue"
                      onClick={() => abrirEditarModal(item)}
                    />
                    <IconButton
                      aria-label="Eliminar"
                      icon={<FaTrash />}
                      size="xs"
                      colorScheme="red"
                      onClick={() => manejarEliminar(item.id)}
                    />
                  </HStack>
                )}

                <Box p={5} display="flex" flexDirection="column" flex="1">
                  <Flex justify="space-between" gap={3} mb={3}>
                    <Box>
                      <Heading as="h3" size="md" color="brand.800">
                        {item.marca} {item.modelo}
                      </Heading>
                      <Text fontSize="sm" color="secondary.600">
                        {item.anio} - {Number(item.kilometraje).toLocaleString('es-EC')} km
                        {item.ciudad ? ` - ${item.ciudad}` : ''}
                      </Text>
                    </Box>
                    <Badge colorScheme={veredicto.color} alignSelf="flex-start" borderRadius="full" px={3}>
                      {veredicto.label}
                    </Badge>
                  </Flex>

                  <SimpleGrid columns={2} spacing={4} mb={4}>
                    <Stat>
                      <StatLabel>Precio</StatLabel>
                      <StatNumber fontSize="xl">{moneda(item.precio_vendedor)}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Sugerido</StatLabel>
                      <StatNumber fontSize="xl" color="brand.700">
                        {moneda(item.precio_sugerido)}
                      </StatNumber>
                    </Stat>
                  </SimpleGrid>

                  <Progress value={item.puntaje} colorScheme={veredicto.color} borderRadius="full" mb={3} />
                  <Text fontSize="sm" color="secondary.700" mb={4} noOfLines={3}>
                    {item.analisis}
                  </Text>

                  <Box mt="auto" pt={4} borderTopWidth="1px" borderColor="gray.100">
                    <Text fontSize="xs" color="gray.500" mb={2}>
                      Vendido por: {item.vendedor_nombre || 'Propietario'} {item.vendedor_apellido || ''}
                    </Text>
                    <Button
                      as="a"
                      href={`mailto:${item.vendedor_correo || 'soporte@autocare.com'}?subject=Me interesa tu ${item.marca} ${item.modelo}`}
                      variant="outline"
                      colorScheme="brand"
                      size="sm"
                      width="100%"
                      leftIcon={<FaEnvelope />}
                    >
                      Contactar Vendedor
                    </Button>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </SimpleGrid>
      )}

      {/* Modal Admin Crear/Editar Auto */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={manejarGuardar}>
          <ModalHeader>{editandoId ? 'Editar Auto' : 'Publicar Nuevo Auto'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <SimpleGrid columns={2} spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Marca</FormLabel>
                <Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} placeholder="Ej: Chevrolet" />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Modelo</FormLabel>
                <Input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} placeholder="Ej: Aveo" />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Año</FormLabel>
                <Input type="number" value={form.anio} onChange={(e) => setForm({ ...form, anio: e.target.value })} />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Kilometraje</FormLabel>
                <Input type="number" value={form.kilometraje} onChange={(e) => setForm({ ...form, kilometraje: e.target.value })} />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Precio Vendedor ($)</FormLabel>
                <Input type="number" value={form.precio_vendedor} onChange={(e) => setForm({ ...form, precio_vendedor: e.target.value })} />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Ciudad</FormLabel>
                <Input value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} placeholder="Ej: Quito" />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Tipo de Vehículo</FormLabel>
                <Select value={form.tipo_vehiculo} onChange={(e) => setForm({ ...form, tipo_vehiculo: e.target.value })}>
                  <option value="automovil">Automóvil</option>
                  <option value="suv">SUV</option>
                  <option value="camioneta">Camioneta</option>
                  <option value="motocicleta">Motocicleta</option>
                  <option value="camion">Camión</option>
                  <option value="otro">Otro</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Estado Visual</FormLabel>
                <Select value={form.estado_visual} onChange={(e) => setForm({ ...form, estado_visual: e.target.value })}>
                  <option value="excelente">Excelente</option>
                  <option value="bueno">Bueno</option>
                  <option value="regular">Regular</option>
                  <option value="malo">Malo</option>
                </Select>
              </FormControl>

              <GridItem colSpan={2}>
                <FormControl>
                  <FormLabel fontSize="sm">Imagen URL</FormLabel>
                  <Input value={form.imagen_url} onChange={(e) => setForm({ ...form, imagen_url: e.target.value })} placeholder="https://..." />
                </FormControl>
              </GridItem>
            </SimpleGrid>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="brand" type="submit" isLoading={guardando}>
              {editandoId ? 'Guardar Cambios' : 'Publicar Auto'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
}

export default Comprar;
