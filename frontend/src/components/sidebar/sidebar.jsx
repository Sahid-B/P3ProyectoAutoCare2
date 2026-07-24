import { NavLink as RouterNavLink } from 'react-router-dom';
import { Box, VStack, Link, Text, HStack, Icon } from '@chakra-ui/react';
import {
  FaGaugeHigh,
  FaCar,
  FaWrench,
  FaFolderOpen,
  FaUser,
} from 'react-icons/fa6';

const enlaces = [
  { ruta: '/dashboard', texto: 'Dashboard', icono: FaGaugeHigh, exacto: true },
  // Vehiculos se marca activo tambien en sus sub-rutas (nuevo, detalle, editar).
  { ruta: '/vehiculos', texto: 'Vehiculos', icono: FaCar, exacto: false },
  { ruta: '/mantenimientos', texto: 'Mantenimientos', icono: FaWrench, exacto: true },
  { ruta: '/historial', texto: 'Historial', icono: FaFolderOpen, exacto: true },
  { ruta: '/perfil', texto: 'Perfil', icono: FaUser, exacto: true },
];


// Menu lateral del area privada. En esta parte solo tiene funcion de navegacion visual.
function Sidebar() {
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
        {enlaces.map((enlace) => (
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
            </HStack>
          </Link>
        ))}
      </VStack>

      <Text
        mt={4}
        pt={4}
        borderTopWidth="1px"
        borderColor="secondary.200"
        fontSize="xs"
        color="secondary.500"
      >
        Modulos en construccion. Se completaran en las siguientes partes.
      </Text>
    </Box>
  );
}

export default Sidebar;
