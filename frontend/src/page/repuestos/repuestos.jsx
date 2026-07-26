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
  Heading,
  Icon,
  Input as ChakraInput,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Skeleton,
  Text,
  useToast,
} from '@chakra-ui/react';
import { FaMagnifyingGlass, FaCartShopping, FaFilter, FaBoxOpen } from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import ProductoCard from '../../components/producto-card/index.jsx';
import { useCarrito } from '../../context/carrito-context.jsx';
import {
  obtenerCatalogo,
  obtenerCategorias,
  obtenerMarcas,
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

function Repuestos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [desdeCache, setDesdeCache] = useState(false);

  const { agregarProducto, totalUnidades } = useCarrito();
  const toast = useToast();

  // Al llegar desde el mapa ("Ver productos") se filtra por esa tienda.
  const [parametrosUrl, setParametrosUrl] = useSearchParams();
  const tiendaFiltrada = parametrosUrl.get('tienda');

  // Catalogos auxiliares (categorias y marcas) para los filtros.
  useEffect(() => {
    let activo = true;

    Promise.all([obtenerCategorias(), obtenerMarcas()])
      .then(([respuestaCategorias, respuestaMarcas]) => {
        if (!activo) return;
        setCategorias(respuestaCategorias.categorias || []);
        setMarcas(respuestaMarcas.marcas || []);
      })
      .catch(() => {
        // Sin conexion los filtros quedan vacios; el catalogo en cache sigue visible.
      });

    return () => {
      activo = false;
    };
  }, []);

  // conSpinner=false en la carga inicial: el estado ya arranca en "cargando",
  // asi el efecto de montaje no dispara un setState sincrono.
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

      // Solo se guarda en cache el catalogo completo (sin filtros aplicados).
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
      // Sin conexion se muestra la ultima copia guardada del catalogo.
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
    // conSpinner=false evita el setState sincrono: el estado ya arranca cargando
    // y el resto de actualizaciones ocurren despues del await de la peticion.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
              />
            ))}
          </SimpleGrid>
        </>
      )}
    </Layout>
  );
}

export default Repuestos;
