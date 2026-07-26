import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Image,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import {
  FaCarRear,
  FaChartLine,
  FaDollarSign,
  FaImage,
  FaTrash,
} from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import Input from '../../components/input/index.jsx';
import Button from '../../components/button/index.jsx';
import {
  createListing,
  deleteListing,
  estimateListing,
  getListings,
} from '../../services/marketplace-service.js';

const formularioInicial = {
  marca: '',
  modelo: '',
  anio: new Date().getFullYear(),
  kilometraje: '',
  ciudad: '',
  tipo_vehiculo: 'automovil',
  precio_vendedor: '',
  imagen_url: '',
  estado_visual: 'bueno',
  historial_mantenimiento: 'parcial',
  danos_reportados: 'ninguno',
};

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

function Vender() {
  const toast = useToast();
  const [formulario, setFormulario] = useState(formularioInicial);
  const [publicaciones, setPublicaciones] = useState([]);
  const [estimacion, setEstimacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const puedeEstimar = useMemo(
    () =>
      formulario.marca.trim() &&
      formulario.modelo.trim() &&
      formulario.anio &&
      formulario.kilometraje !== '' &&
      formulario.precio_vendedor !== '',
    [formulario],
  );

  useEffect(() => {
    let activo = true;
    getListings()
      .then((respuesta) => {
        if (activo) setPublicaciones(respuesta.data || []);
      })
      .catch((err) => {
        if (activo) setError(err.message || 'No se pudieron cargar tus publicaciones.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!puedeEstimar) return;

    const timer = window.setTimeout(() => {
      estimateListing(formulario)
        .then((respuesta) => setEstimacion(respuesta.data))
        .catch(() => setEstimacion(null));
    }, 450);

    return () => window.clearTimeout(timer);
  }, [formulario, puedeEstimar]);

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const crearPublicacion = async (evento) => {
    evento.preventDefault();
    setError('');

    try {
      setGuardando(true);
      const respuesta = await createListing(formulario);
      setPublicaciones((actuales) => [respuesta.data, ...actuales]);
      setEstimacion(respuesta.data);
      setFormulario(formularioInicial);
      toast({
        title: 'Auto publicado',
        description: 'AutoCare calculo el precio sugerido.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      setError(err.message || 'No se pudo publicar el auto.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarPublicacion = async (id) => {
    try {
      await deleteListing(id);
      setPublicaciones((actuales) => actuales.filter((item) => item.id !== id));
      toast({ title: 'Publicacion eliminada', status: 'success', duration: 2500, isClosable: true });
    } catch (err) {
      toast({
        title: 'No se pudo eliminar',
        description: err.message,
        status: 'error',
        duration: 3500,
        isClosable: true,
      });
    }
  };

  const renderEstimacion = (datos) => {
    if (!datos) {
      return (
        <Flex
          direction="column"
          align="center"
          justify="center"
          minH="320px"
          textAlign="center"
          color="secondary.500"
        >
          <Icon as={FaChartLine} boxSize={10} mb={3} color="brand.300" />
          <Text fontWeight="semibold">Completa los datos para calcular el precio sugerido.</Text>
          <Text fontSize="sm">La estimacion se actualiza mientras llenas el formulario.</Text>
        </Flex>
      );
    }

    const veredicto = veredictos[datos.veredicto] || veredictos.precio_justo;
    return (
      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading as="h2" size="md" color="brand.800">
            Tasacion AutoCare
          </Heading>
          <Badge colorScheme={veredicto.color} px={3} py={1} borderRadius="full">
            {veredicto.label}
          </Badge>
        </HStack>

        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={5}>
          <Stat>
            <StatLabel>Precio vendedor</StatLabel>
            <StatNumber color="secondary.800">{moneda(formulario.precio_vendedor || datos.precio_vendedor)}</StatNumber>
            <StatHelpText>Valor publicado</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Precio sugerido</StatLabel>
            <StatNumber color="brand.700">{moneda(datos.precio_sugerido)}</StatNumber>
            <StatHelpText>
              Rango {moneda(datos.precio_sugerido_min)} - {moneda(datos.precio_sugerido_max)}
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        <Box mb={5}>
          <Flex justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="semibold">
              Puntaje visual y comercial
            </Text>
            <Text fontSize="sm" fontWeight="bold" color="brand.700">
              {datos.puntaje}/100
            </Text>
          </Flex>
          <Progress value={datos.puntaje} colorScheme={veredicto.color} borderRadius="full" />
        </Box>

        <Text fontSize="sm" color="secondary.700">
          {datos.analisis}
        </Text>
      </Box>
    );
  };

  return (
    <Layout conSidebar>
      <Flex align="center" justify="space-between" gap={4} flexWrap="wrap" mb={6}>
        <Box>
          <Heading as="h1" size="xl" color="brand.800">
            Vender mi Auto
          </Heading>
          <Text fontSize="sm" color="secondary.600">
            Publica tus autos a la venta, obten tasacion inteligente y gestiona tus listados.
          </Text>
        </Box>
        <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
          Tasacion inteligente
        </Badge>
      </Flex>

      {error && (
        <Alert status="error" borderRadius="md" mb={6} fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6} alignItems="start" mb={8}>
        <Box
          as="form"
          onSubmit={crearPublicacion}
          p={6}
          bg="white"
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="lg"
          boxShadow="sm"
        >
          <HStack mb={4}>
            <Icon as={FaCarRear} color="brand.600" />
            <Heading as="h2" size="md" color="brand.800">
              Publicar auto
            </Heading>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacingX={4}>
            <Input label="Marca" name="marca" value={formulario.marca} onChange={manejarCambio} placeholder="Toyota" required />
            <Input label="Modelo" name="modelo" value={formulario.modelo} onChange={manejarCambio} placeholder="Corolla" required />
            <Input label="Anio" type="number" name="anio" value={formulario.anio} onChange={manejarCambio} required />
            <Input label="Kilometraje" type="number" name="kilometraje" value={formulario.kilometraje} onChange={manejarCambio} placeholder="85000" required />
            <Input label="Ciudad" name="ciudad" value={formulario.ciudad} onChange={manejarCambio} placeholder="Guayaquil" />
            <Input label="Precio sugerido" type="number" name="precio_vendedor" value={formulario.precio_vendedor} onChange={manejarCambio} placeholder="12500" required />
          </SimpleGrid>

          <Input
            label="Imagen del auto"
            name="imagen_url"
            value={formulario.imagen_url}
            onChange={manejarCambio}
            placeholder="https://..."
          />

          <SimpleGrid columns={{ base: 1, md: 2 }} spacingX={4}>
            <FormControl mb={4}>
              <FormLabel>Tipo de vehiculo</FormLabel>
              <Select name="tipo_vehiculo" value={formulario.tipo_vehiculo} onChange={manejarCambio} bg="white">
                <option value="automovil">Automovil</option>
                <option value="suv">SUV</option>
                <option value="camioneta">Camioneta</option>
                <option value="motocicleta">Motocicleta</option>
                <option value="camion">Camion</option>
                <option value="otro">Otro</option>
              </Select>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Estado visual</FormLabel>
              <Select name="estado_visual" value={formulario.estado_visual} onChange={manejarCambio} bg="white">
                <option value="excelente">Excelente</option>
                <option value="bueno">Bueno</option>
                <option value="regular">Regular</option>
                <option value="malo">Malo</option>
              </Select>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Historial de mantenimiento</FormLabel>
              <Select name="historial_mantenimiento" value={formulario.historial_mantenimiento} onChange={manejarCambio} bg="white">
                <option value="completo">Completo</option>
                <option value="parcial">Parcial</option>
                <option value="desconocido">Desconocido</option>
              </Select>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Danos visibles</FormLabel>
              <Select name="danos_reportados" value={formulario.danos_reportados} onChange={manejarCambio} bg="white">
                <option value="ninguno">Ninguno</option>
                <option value="leves">Leves</option>
                <option value="moderados">Moderados</option>
                <option value="fuertes">Fuertes</option>
              </Select>
            </FormControl>
          </SimpleGrid>

          <FormControl mb={4}>
            <FormLabel>Observacion visual</FormLabel>
            <Textarea
              value={`La tasacion usa estado visual, kilometraje, anio, danos e historial. Para IA visual real se puede conectar despues un servicio de analisis de imagen.`}
              isReadOnly
              bg="secondary.50"
              color="secondary.600"
              resize="none"
            />
          </FormControl>

          <Button type="submit" variant="primary" width="100%" leftIcon={<FaDollarSign />} isLoading={guardando}>
            Publicar y tasar
          </Button>
        </Box>

        <Box
          p={6}
          bg="white"
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="lg"
          boxShadow="sm"
        >
          {renderEstimacion(puedeEstimar ? estimacion : null)}
        </Box>
      </SimpleGrid>

      <Heading as="h2" size="md" color="brand.800" mb={4}>
        Mis autos en venta
      </Heading>

      {cargando ? (
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {[1, 2].map((item) => (
            <Skeleton key={item} height="260px" borderRadius="lg" />
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
            Aun no tienes autos a la venta
          </Heading>
          <Text color="secondary.600">Llena el formulario para publicar tu primer vehiculo.</Text>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
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
              >
                {item.imagen_url ? (
                  <Image src={item.imagen_url} alt={`${item.marca} ${item.modelo}`} w="100%" h="210px" objectFit="cover" />
                ) : (
                  <Flex h="210px" bg="secondary.100" align="center" justify="center" color="secondary.500">
                    <Icon as={FaCarRear} boxSize={12} />
                  </Flex>
                )}
                <Box p={5}>
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
                      <StatLabel>Vendedor</StatLabel>
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
                  <Text fontSize="sm" color="secondary.700" mb={4}>
                    {item.analisis}
                  </Text>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<FaTrash />}
                    onClick={() => eliminarPublicacion(item.id)}
                  >
                    Eliminar Publicacion
                  </Button>
                </Box>
              </Box>
            );
          })}
        </SimpleGrid>
      )}
    </Layout>
  );
}

export default Vender;
