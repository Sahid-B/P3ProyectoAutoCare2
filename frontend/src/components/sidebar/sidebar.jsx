import { NavLink as RouterNavLink } from 'react-router-dom';
import { Box, VStack, Link, Text, HStack } from '@chakra-ui/react';

const enlaces = [
  { ruta: '/dashboard', texto: 'Dashboard', icono: '📊' },
  { ruta: '/vehiculos', texto: 'Vehiculos', icono: '🚗' },
  { ruta: '/mantenimientos', texto: 'Mantenimientos', icono: '🔧' },
  { ruta: '/historial', texto: 'Historial', icono: '🗂️' },
  { ruta: '/perfil', texto: 'Perfil', icono: '👤' },
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
            end
            px={3}
            py={2}
            borderRadius="md"
            fontWeight="medium"
            color="secondary.700"
            _hover={{ bg: 'secondary.100', textDecoration: 'none' }}
            _activeLink={{ bg: 'brand.50', color: 'brand.700', fontWeight: 'semibold' }}
          >
            <HStack spacing={2}>
              <Box as="span" aria-hidden="true" fontSize="lg">
                {enlace.icono}
              </Box>
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
