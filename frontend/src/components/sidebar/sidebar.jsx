import { NavLink as RouterNavLink } from 'react-router-dom';
import { Box, VStack, Link, Text, HStack, Icon, Divider, Badge } from '@chakra-ui/react';
import {
  FaGaugeHigh,
  FaCar,
  FaTags,
  FaWrench,
  FaFolderOpen,
  FaUser,
  FaShieldHalved,
  FaBagShopping,
  FaTag,
  FaMapLocationDot,
  FaGear,
  FaCartShopping,
  FaReceipt,
  FaStore,
  FaBoxesStacked,
  FaClipboardList,
} from 'react-icons/fa6';
import { useAuth } from '../../context/auth-context.jsx';
import { useCarrito } from '../../context/carrito-context.jsx';

const enlacesUsuario = [
  { ruta: '/dashboard', texto: 'Dashboard', icono: FaGaugeHigh, exacto: true },
  { ruta: '/vehiculos', texto: 'Vehiculos', icono: FaCar, exacto: false },
  { ruta: '/comprar', texto: 'Comprar', icono: FaBagShopping, exacto: true },
  { ruta: '/vender', texto: 'Vender', icono: FaTag, exacto: true },
  { ruta: '/repuestos', texto: 'Repuestos', icono: FaGear, exacto: false },
  { ruta: '/carrito', texto: 'Carrito', icono: FaCartShopping, exacto: true, conContador: true },
  { ruta: '/mis-pedidos', texto: 'Mis pedidos', icono: FaReceipt, exacto: true },
  { ruta: '/talleres', texto: 'Talleres y tiendas', icono: FaMapLocationDot, exacto: true },
  { ruta: '/mantenimientos', texto: 'Mantenimientos', icono: FaWrench, exacto: true },
  { ruta: '/historial', texto: 'Historial', icono: FaFolderOpen, exacto: true },
  { ruta: '/perfil', texto: 'Perfil', icono: FaUser, exacto: true },
];

const enlacesTaller = [
  { ruta: '/taller-dashboard', texto: 'Dashboard Taller', icono: FaGaugeHigh, exacto: true },
  { ruta: '/mi-taller', texto: 'Mi Taller', icono: FaCar, exacto: true }, // Using FaCar or FaWrench
  { ruta: '/solicitudes', texto: 'Solicitudes', icono: FaFolderOpen, exacto: true },
  { ruta: '/talleres', texto: 'Directorio', icono: FaMapLocationDot, exacto: true },
  { ruta: '/perfil', texto: 'Perfil', icono: FaUser, exacto: true },
];

const enlacesVendedor = [
  { ruta: '/vendedor-dashboard', texto: 'Dashboard', icono: FaGaugeHigh, exacto: true },
  { ruta: '/mi-tienda', texto: 'Mi tienda', icono: FaStore, exacto: true },
  { ruta: '/mis-productos', texto: 'Mis productos', icono: FaBoxesStacked, exacto: false },
  { ruta: '/pedidos', texto: 'Pedidos', icono: FaClipboardList, exacto: true },
  { ruta: '/perfil', texto: 'Perfil', icono: FaUser, exacto: true },
];

const enlacesPorRol = {
  taller: enlacesTaller,
  vendedor_repuestos: enlacesVendedor,
};

// El administrador no compra: ve el catalogo pero no el carrito ni sus pedidos.
const rutasSoloCliente = ['/carrito', '/mis-pedidos'];

function Sidebar() {
  const { usuario } = useAuth();
  const { totalUnidades } = useCarrito();

  const enlacesBase = enlacesPorRol[usuario?.rol] || enlacesUsuario;
  const enlacesRender =
    usuario?.rol === 'admin'
      ? enlacesBase.filter((enlace) => !rutasSoloCliente.includes(enlace.ruta))
      : enlacesBase;

  return (
    <Box
      as="aside"
      p={6}
      bg="white"
      borderWidth="1px"
      borderColor="secondary.200"
      borderRadius="lg"
      boxShadow="sm"
      position={{ base: 'static', lg: 'sticky' }}
      top="88px"
    >
      <Text
        fontSize="xs"
        fontWeight="bold"
        letterSpacing="0.08em"
        textTransform="uppercase"
        color="secondary.400"
        mb={3}
      >
        Menu
      </Text>

      <VStack as="nav" align="stretch" spacing={1}>
        {enlacesRender.map((enlace) => (
          <Link
            key={enlace.ruta}
            as={RouterNavLink}
            to={enlace.ruta}
            end={enlace.exacto}
            px={3}
            py={2}
            borderRadius="md"
            fontWeight="medium"
            color="secondary.700"
            _hover={{ bg: 'secondary.100', textDecoration: 'none' }}
            _activeLink={{ bg: 'brand.50', color: 'brand.700', fontWeight: 'semibold' }}
          >
            <HStack spacing={3}>
              <Icon as={enlace.icono} boxSize={4} />
              <Box as="span">{enlace.texto}</Box>
              {enlace.conContador && totalUnidades > 0 && (
                <Badge colorScheme="brand" borderRadius="full" px={2} fontSize="xs">
                  {totalUnidades}
                </Badge>
              )}
            </HStack>
          </Link>
        ))}

        {usuario?.rol === 'admin' && (
          <>
            <Divider my={2} />
            <Text
              fontSize="xs"
              fontWeight="bold"
              letterSpacing="0.08em"
              textTransform="uppercase"
              color="red.400"
              mb={2}
              mt={1}
            >
              Administracion
            </Text>
            <Link
              as={RouterNavLink}
              to="/admin"
              end={false}
              px={3}
              py={2}
              borderRadius="md"
              fontWeight="bold"
              color="red.600"
              bg="red.50"
              _hover={{ bg: 'red.100', textDecoration: 'none' }}
              _activeLink={{ bg: 'red.500', color: 'white' }}
            >
              <HStack spacing={3}>
                <Icon as={FaShieldHalved} boxSize={4} />
                <Box as="span">Panel Admin</Box>
              </HStack>
            </Link>
          </>
        )}
      </VStack>

      <Text
        mt={6}
        pt={4}
        borderTopWidth="1px"
        borderColor="secondary.200"
        fontSize="xs"
        color="secondary.500"
      >
        AutoCare v1.0.0 — Modulos de Vehiculos, Mantenimientos y Repuestos activos.
      </Text>
    </Box>
  );
}

export default Sidebar;
