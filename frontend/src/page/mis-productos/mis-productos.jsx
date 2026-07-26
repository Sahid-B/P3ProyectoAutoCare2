import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  IconButton,
  Image,
  Input as ChakraInput,
  InputGroup,
  InputLeftElement,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
import { FaPlus, FaPenToSquare, FaTrash, FaMagnifyingGlass, FaBoxOpen } from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import DialogoConfirmar from '../../components/dialogo-confirmar/index.jsx';
import { obtenerMisProductos, eliminarProducto } from '../../services/repuestos-service.js';
import { moneda } from '../../utils/formato.js';

function MisProductos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const respuesta = await obtenerMisProductos();
        if (activo) setProductos(respuesta.data || []);
      } catch (err) {
        if (activo) setError(err.message || 'No se pudieron cargar tus productos.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, []);

  const productosFiltrados = productos.filter((producto) => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
    const coincideEstado = !filtroEstado || producto.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  const confirmarEliminacion = async () => {
    if (!productoAEliminar) return;

    try {
      setEliminando(true);
      await eliminarProducto(productoAEliminar.id);
      setProductos((anteriores) => anteriores.filter((item) => item.id !== productoAEliminar.id));
      toast({
        title: 'Producto eliminado',
        description: `"${productoAEliminar.nombre}" ya no aparece en el catalogo.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      setProductoAEliminar(null);
    } catch (err) {
      toast({
        title: 'No se pudo eliminar',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setEliminando(false);
    }
  };

  return (
    <Layout conSidebar>
      <Flex justify="space-between" align="flex-start" gap={4} flexWrap="wrap" mb={6}>
        <Box>
          <Heading as="h1" size="lg" color="secondary.900" mb={1}>
            Mis productos
          </Heading>
          <Text color="secondary.600">
            Gestiona el catalogo, los precios y el stock de tu tienda.
          </Text>
        </Box>

        <Button as={RouterLink} to="/mis-productos/nuevo" variant="primary" leftIcon={<FaPlus />}>
          Agregar producto
        </Button>
      </Flex>

      {error && (
        <Alert status="error" borderRadius="md" mb={6} fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Flex gap={3} mb={5} direction={{ base: 'column', sm: 'row' }}>
        <InputGroup maxW={{ base: '100%', sm: '360px' }}>
          <InputLeftElement pointerEvents="none">
            <Icon as={FaMagnifyingGlass} color="secondary.400" />
          </InputLeftElement>
          <ChakraInput
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            bg="white"
            focusBorderColor="brand.500"
          />
        </InputGroup>

        <Select
          maxW={{ base: '100%', sm: '200px' }}
          value={filtroEstado}
          onChange={(evento) => setFiltroEstado(evento.target.value)}
          bg="white"
          focusBorderColor="brand.500"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </Select>
      </Flex>

      {cargando ? (
        <Flex justify="center" align="center" minH="40vh">
          <Spinner size="xl" color="brand.500" thickness="4px" />
        </Flex>
      ) : (
        <Box bg="white" borderRadius="xl" shadow="sm" overflow="hidden">
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead bg="secondary.50">
                <Tr>
                  <Th color="secondary.500">Producto</Th>
                  <Th color="secondary.500">Categoria</Th>
                  <Th color="secondary.500">Marca</Th>
                  <Th color="secondary.500" isNumeric>Precio</Th>
                  <Th color="secondary.500" isNumeric>Stock</Th>
                  <Th color="secondary.500">Estado</Th>
                  <Th color="secondary.500" textAlign="right">Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {productosFiltrados.map((producto) => (
                  <Tr key={producto.id}>
                    <Td>
                      <Flex align="center" gap={3}>
                        {producto.imagen_url ? (
                          <Image
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            boxSize="40px"
                            borderRadius="md"
                            objectFit="cover"
                            fallback={<Box boxSize="40px" bg="secondary.100" borderRadius="md" />}
                          />
                        ) : (
                          <Flex boxSize="40px" bg="secondary.100" borderRadius="md" align="center" justify="center">
                            <Icon as={FaBoxOpen} color="secondary.400" />
                          </Flex>
                        )}
                        <Text fontWeight="medium" color="secondary.900" noOfLines={1}>
                          {producto.nombre}
                        </Text>
                      </Flex>
                    </Td>
                    <Td color="secondary.600">{producto.categoria}</Td>
                    <Td color="secondary.600">{producto.marca || '-'}</Td>
                    <Td isNumeric fontWeight="semibold" color="secondary.900">
                      {moneda(producto.precio)}
                    </Td>
                    <Td isNumeric>
                      <Badge colorScheme={producto.stock === 0 ? 'red' : producto.stock <= 5 ? 'orange' : 'green'} borderRadius="md" px={2}>
                        {producto.stock}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={producto.estado === 'activo' ? 'green' : 'gray'} borderRadius="md" px={2}>
                        {producto.estado}
                      </Badge>
                    </Td>
                    <Td textAlign="right">
                      <Flex gap={2} justify="flex-end">
                        <IconButton
                          as={RouterLink}
                          to={`/mis-productos/${producto.id}/editar`}
                          aria-label={`Editar ${producto.nombre}`}
                          icon={<FaPenToSquare />}
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                        />
                        <IconButton
                          aria-label={`Eliminar ${producto.nombre}`}
                          icon={<FaTrash />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => setProductoAEliminar(producto)}
                        />
                      </Flex>
                    </Td>
                  </Tr>
                ))}
                {productosFiltrados.length === 0 && (
                  <Tr>
                    <Td colSpan={7} textAlign="center" py={10} color="secondary.500">
                      {productos.length === 0
                        ? 'Aun no has publicado repuestos. Usa el boton "Agregar producto".'
                        : 'Ningun producto coincide con los filtros aplicados.'}
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </Box>
      )}

      <DialogoConfirmar
        estaAbierto={Boolean(productoAEliminar)}
        alCerrar={() => setProductoAEliminar(null)}
        alConfirmar={confirmarEliminacion}
        titulo="Eliminar producto"
        mensaje={`Se eliminara "${productoAEliminar?.nombre}" de tu catalogo. Esta accion no se puede deshacer.`}
        textoConfirmar="Si, eliminar"
        cargando={eliminando}
      />
    </Layout>
  );
}

export default MisProductos;
