import { useEffect, useState, useCallback } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  GridItem,
  Heading,
  HStack,
  Icon,
  Input as ChakraInput,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Select,
  SimpleGrid,
  Skeleton,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FaMagnifyingGlass, FaCartShopping, FaFilter, FaBoxOpen, FaPlus } from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import ProductoCard from '../../components/producto-card/index.jsx';
import { useAuth } from '../../context/auth-context.jsx';
import { useCarrito } from '../../context/carrito-context.jsx';
import {
  obtenerCatalogo,
  obtenerCategorias,
  obtenerMarcas,
  obtenerTiendasPublicas,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from '../../services/repuestos-service.js';
import { saveProducts, getProducts } from '../../services/indexeddb-service.js';

const FILTROS_INICIALES = {
  busqueda: '',
  categoria: '',
  marca: '',
  precioMin: '',
  precioMax: '',
  soloDisponibles: false,
};

const PRODUCTO_FORM_INICIAL = {
  vendedor_id: '',
  nombre: '',
  descripcion: '',
  categoria: 'motor',
  marca: '',
  compatibilidad: '',
  precio: '',
  stock: '',
  imagen_url: '',
  estado: 'activo',
};

function Repuestos() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [desdeCache, setDesdeCache] = useState(false);

  // Modal Admin Crear/Editar Repuesto
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editandoId, setEditandoId] = useState(null);
  const [prodForm, setProdForm] = useState(PRODUCTO_FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);

  const { agregarProducto, totalUnidades } = useCarrito();
  const toast = useToast();

  const [parametrosUrl, setParametrosUrl] = useSearchParams();
  const tiendaFiltrada = parametrosUrl.get('tienda');

  useEffect(() => {
    let activo = true;

    Promise.all([obtenerCategorias(), obtenerMarcas(), obtenerTiendasPublicas().catch(() => ({ data: [] }))])
      .then(([respuestaCategorias, respuestaMarcas, respuestaTiendas]) => {
        if (!activo) return;
        setCategorias(respuestaCategorias.categorias || []);
        setMarcas(respuestaMarcas.marcas || []);
        setTiendas(respuestaTiendas.data || []);
      })
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, []);

  const cargarCatalogo = useCallback(async (filtrosActuales, vendedorId = null, conSpinner = true) => {
    if (conSpinner) {
      setCargando(true);
      setError('');
    }

    try {
      const respuesta = await obtenerCatalogo({
        busqueda: filtrosActuales.busqueda,
        categoria: filtrosActuales.categoria,
        marca: filtrosActuales.marca,
        precioMin: filtrosActuales.precioMin,
        precioMax: filtrosActuales.precioMax,
        soloDisponibles: filtrosActuales.soloDisponibles ? 'true' : '',
        vendedorId: vendedorId || '',
      });

      const datos = respuesta.data || [];
      setProductos(datos);
      setDesdeCache(false);

      const sinFiltros =
        !vendedorId &&
        !filtrosActuales.busqueda &&
        !filtrosActuales.categoria &&
        !filtrosActuales.marca &&
        !filtrosActuales.precioMin &&
        !filtrosActuales.precioMax &&
        !filtrosActuales.soloDisponibles;

      if (sinFiltros) {
        saveProducts(datos).catch(() => {});
      }
    } catch (err) {
      const guardados = await getProducts().catch(() => []);
      if (guardados.length > 0) {
        setProductos(guardados);
        setDesdeCache(true);
      } else {
        setProductos([]);
        setError(err.message || 'No se pudo cargar el catalogo de repuestos.');
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogo(FILTROS_INICIALES, tiendaFiltrada, false);
  }, [cargarCatalogo, tiendaFiltrada]);

  const manejarCambioFiltro = (evento) => {
    const { name, value, type, checked } = evento.target;
    setFiltros((anteriores) => ({
      ...anteriores,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const aplicarFiltros = (evento) => {
    evento.preventDefault();
    cargarCatalogo(filtros, tiendaFiltrada);
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    setParametrosUrl({});
    cargarCatalogo(FILTROS_INICIALES, null);
  };

  const manejarAgregar = (producto) => {
    agregarProducto(producto, 1);
    toast({
      title: 'Agregado al carrito',
      description: `"${producto.nombre}" se agrego a tu carrito.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // --- Funciones Admin ---
  const abrirNuevoModal = () => {
    setEditandoId(null);
    setProdForm({
      ...PRODUCTO_FORM_INICIAL,
      vendedor_id: tiendas[0]?.id || '',
    });
    onOpen();
  };

  const abrirEditarModal = (prod) => {
    setEditandoId(prod.id);
    setProdForm({
      vendedor_id: prod.vendedor_id || '',
      nombre: prod.nombre || '',
      descripcion: prod.descripcion || '',
      categoria: prod.categoria || 'motor',
      marca: prod.marca || '',
      compatibilidad: prod.compatibilidad || '',
      precio: prod.precio || '',
      stock: prod.stock || '',
      imagen_url: prod.imagen_url || '',
      estado: prod.estado || 'activo',
    });
    onOpen();
  };

  const manejarGuardarRepuesto = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarProducto(editandoId, prodForm);
        toast({ title: 'Repuesto actualizado', status: 'success', duration: 3000 });
      } else {
        await crearProducto(prodForm);
        toast({ title: 'Repuesto creado con éxito', status: 'success', duration: 3000 });
      }
      onClose();
      cargarCatalogo(filtros, tiendaFiltrada);
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminarRepuesto = async (id) => {
    if (!window.confirm('¿Seguro de que deseas eliminar este repuesto?')) return;
    try {
      await eliminarProducto(id);
      toast({ title: 'Repuesto eliminado', status: 'info', duration: 3000 });
      cargarCatalogo(filtros, tiendaFiltrada);
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 4000 });
    }
  };

  return (
    <Layout conSidebar>
      <Flex justify="space-between" align="flex-start" gap={4} flexWrap="wrap" mb={6}>
        <Box>
          <Heading as="h1" size="lg" color="secondary.900" mb={1}>
            Repuestos y accesorios
          </Heading>
          <Text color="secondary.600">
            Encuentra repuestos publicados por las tiendas registradas en AutoCare.
          </Text>
        </Box>

        <HStack spacing={3}>
          {esAdmin && (
            <Button leftIcon={<FaPlus />} colorScheme="brand" onClick={abrirNuevoModal}>
              Agregar Repuesto (Admin)
            </Button>
          )}

          <Button
            as={RouterLink}
            to="/carrito"
            variant="primary"
            leftIcon={<FaCartShopping />}
          >
            Carrito
            {totalUnidades > 0 && (
              <Badge ml={2} bg="white" color="brand.700" borderRadius="full" px={2}>
                {totalUnidades}
              </Badge>
            )}
          </Button>
        </HStack>
      </Flex>

      {tiendaFiltrada && (
        <Alert status="info" borderRadius="md" mb={5} fontSize="sm">
          <AlertIcon />
          <Flex justify="space-between" align="center" gap={3} w="100%" flexWrap="wrap">
            <Text>Mostrando unicamente los productos de la tienda seleccionada en el mapa.</Text>
            <Button size="xs" variant="secondary" onClick={limpiarFiltros}>
              Ver todo el catalogo
            </Button>
          </Flex>
        </Alert>
      )}

      {desdeCache && (
        <Alert status="info" borderRadius="md" mb={5} fontSize="sm">
          <AlertIcon />
          Estas viendo el catalogo guardado en este dispositivo. Conectate a Internet para ver
          precios y stock actualizados y poder comprar.
        </Alert>
      )}

      {error && (
        <Alert status="error" borderRadius="md" mb={5} fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Box
        as="form"
        onSubmit={aplicarFiltros}
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="secondary.200"
        boxShadow="sm"
        p={5}
        mb={6}
      >
        <Flex align="center" gap={2} mb={4} color="secondary.700">
          <Icon as={FaFilter} />
          <Text fontWeight="bold" fontSize="sm">Filtros de busqueda</Text>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mb={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaMagnifyingGlass} color="secondary.400" />
            </InputLeftElement>
            <ChakraInput
              name="busqueda"
              placeholder="Buscar por nombre..."
              value={filtros.busqueda}
              onChange={manejarCambioFiltro}
              bg="white"
              focusBorderColor="brand.500"
            />
          </InputGroup>

          <Select
            name="categoria"
            value={filtros.categoria}
            onChange={manejarCambioFiltro}
            bg="white"
            focusBorderColor="brand.500"
          >
            <option value="">Todas las categorias</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </Select>

          <Select
            name="marca"
            value={filtros.marca}
            onChange={manejarCambioFiltro}
            bg="white"
            focusBorderColor="brand.500"
          >
            <option value="">Todas las marcas</option>
            {marcas.map((marca) => (
              <option key={marca} value={marca}>
                {marca}
              </option>
            ))}
          </Select>

          <ChakraInput
            name="precioMin"
            type="number"
            placeholder="Precio minimo"
            value={filtros.precioMin}
            onChange={manejarCambioFiltro}
            bg="white"
            focusBorderColor="brand.500"
          />

          <ChakraInput
            name="precioMax"
            type="number"
            placeholder="Precio maximo"
            value={filtros.precioMax}
            onChange={manejarCambioFiltro}
            bg="white"
            focusBorderColor="brand.500"
          />

          <Flex align="center">
            <Checkbox
              name="soloDisponibles"
              isChecked={filtros.soloDisponibles}
              onChange={manejarCambioFiltro}
              colorScheme="brand"
            >
              <Text fontSize="sm" color="secondary.700">Solo productos con stock</Text>
            </Checkbox>
          </Flex>
        </SimpleGrid>

        <Flex gap={3} direction={{ base: 'column', sm: 'row' }}>
          <Button type="submit" variant="primary" size="sm">
            Aplicar filtros
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={limpiarFiltros}>
            Limpiar
          </Button>
        </Flex>
      </Box>

      {/* Resultados */}
      {cargando ? (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Skeleton key={item} height="420px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      ) : productos.length === 0 ? (
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
        >
          <Icon as={FaBoxOpen} boxSize={12} color="brand.300" mb={4} />
          <Heading as="h3" size="sm" color="secondary.900" mb={2}>
            No se encontraron repuestos
          </Heading>
          <Text color="secondary.600" fontSize="sm">
            Prueba con otros filtros o vuelve mas tarde.
          </Text>
        </Flex>
      ) : (
        <>
          <Text fontSize="sm" color="secondary.500" mb={4}>
            {productos.length} {productos.length === 1 ? 'producto encontrado' : 'productos encontrados'}
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
            {productos.map((producto) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                alAgregar={desdeCache ? undefined : manejarAgregar}
                alEditar={esAdmin ? abrirEditarModal : undefined}
                alEliminar={esAdmin ? manejarEliminarRepuesto : undefined}
              />
            ))}
          </SimpleGrid>
        </>
      )}

      {/* Modal Admin Crear/Editar Repuesto */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={manejarGuardarRepuesto}>
          <ModalHeader>{editandoId ? 'Editar Repuesto' : 'Agregar Nuevo Repuesto'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <SimpleGrid columns={2} spacing={4}>
              <GridItem colSpan={2}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Tienda / Vendedor</FormLabel>
                  <Select
                    value={prodForm.vendedor_id}
                    onChange={(e) => setProdForm({ ...prodForm, vendedor_id: e.target.value })}
                  >
                    {tiendas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre_local} ({t.direccion})
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem colSpan={2}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Nombre del Producto</FormLabel>
                  <ChakraInput
                    value={prodForm.nombre}
                    onChange={(e) => setProdForm({ ...prodForm, nombre: e.target.value })}
                    placeholder="Ej: Llanta Rin 15 Goodyear"
                  />
                </FormControl>
              </GridItem>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Categoría</FormLabel>
                <Select
                  value={prodForm.categoria}
                  onChange={(e) => setProdForm({ ...prodForm, categoria: e.target.value })}
                >
                  {categorias.length > 0 ? (
                    categorias.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))
                  ) : (
                    <>
                      <option value="motor">motor</option>
                      <option value="frenos">frenos</option>
                      <option value="suspension">suspension</option>
                      <option value="electricidad">electricidad</option>
                      <option value="carroceria">carroceria</option>
                      <option value="llantas">llantas</option>
                      <option value="aceites_fluidos">aceites_fluidos</option>
                      <option value="accesorios">accesorios</option>
                      <option value="otros">otros</option>
                    </>
                  )}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Marca</FormLabel>
                <ChakraInput
                  value={prodForm.marca}
                  onChange={(e) => setProdForm({ ...prodForm, marca: e.target.value })}
                  placeholder="Ej: Goodyear"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Precio ($)</FormLabel>
                <ChakraInput
                  type="number"
                  step="0.01"
                  value={prodForm.precio}
                  onChange={(e) => setProdForm({ ...prodForm, precio: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Stock</FormLabel>
                <ChakraInput
                  type="number"
                  value={prodForm.stock}
                  onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                />
              </FormControl>

              <GridItem colSpan={2}>
                <FormControl>
                  <FormLabel fontSize="sm">Compatibilidad</FormLabel>
                  <ChakraInput
                    value={prodForm.compatibilidad}
                    onChange={(e) => setProdForm({ ...prodForm, compatibilidad: e.target.value })}
                    placeholder="Ej: Universal / Chevrolet Aveo"
                  />
                </FormControl>
              </GridItem>

              <GridItem colSpan={2}>
                <FormControl>
                  <FormLabel fontSize="sm">Descripción</FormLabel>
                  <ChakraInput
                    value={prodForm.descripcion}
                    onChange={(e) => setProdForm({ ...prodForm, descripcion: e.target.value })}
                  />
                </FormControl>
              </GridItem>

              <GridItem colSpan={2}>
                <FormControl>
                  <FormLabel fontSize="sm">Imagen URL</FormLabel>
                  <ChakraInput
                    value={prodForm.imagen_url}
                    onChange={(e) => setProdForm({ ...prodForm, imagen_url: e.target.value })}
                    placeholder="https://..."
                  />
                </FormControl>
              </GridItem>
            </SimpleGrid>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="brand" type="submit" isLoading={guardando}>
              {editandoId ? 'Guardar Cambios' : 'Agregar Repuesto'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
}

export default Repuestos;
