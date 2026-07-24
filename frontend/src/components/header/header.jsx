import { NavLink as RouterNavLink } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  Image,
  Text,
  Button,
  IconButton,
  Link,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';

const enlaces = [
  { ruta: '/', texto: 'Inicio' },
  { ruta: '/login', texto: 'Login' },
  { ruta: '/registro', texto: 'Registro' },
];

// Estilos del enlace activo, reutilizados en escritorio y en el menu movil.
const estiloActivo = {
  color: 'brand.600',
  bg: 'brand.50',
};

// Encabezado principal con logo, nombre y menu responsive (Drawer en movil).
function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box
      as="header"
      position="sticky"
      top="0"
      zIndex="sticky"
      bg="white"
      borderBottomWidth="1px"
      borderColor="secondary.200"
      boxShadow="sm"
    >
      <Flex
        maxW="1140px"
        mx="auto"
        minH="68px"
        px={{ base: 4, md: 6 }}
        align="center"
        justify="space-between"
        gap={4}
      >
        {/* Marca */}
        <Link
          as={RouterNavLink}
          to="/"
          onClick={onClose}
          display="flex"
          alignItems="center"
          gap={2}
          _hover={{ textDecoration: 'none' }}
        >
          <Image src="/logo-autocare.png" alt="Logo de AutoCare" boxSize="40px" borderRadius="sm" />
          <Text fontSize="xl" fontWeight="bold" color="brand.800" letterSpacing="-0.02em">
            AutoCare
          </Text>
        </Link>

        {/* Navegacion en escritorio */}
        <HStack as="nav" spacing={1} display={{ base: 'none', md: 'flex' }}>
          {enlaces.map((enlace) => (
            <Link
              key={enlace.ruta}
              as={RouterNavLink}
              to={enlace.ruta}
              end={enlace.ruta === '/'}
              px={4}
              py={2}
              borderRadius="md"
              fontWeight="medium"
              color="secondary.700"
              _hover={{ bg: 'secondary.100', textDecoration: 'none' }}
              _activeLink={estiloActivo}
            >
              {enlace.texto}
            </Link>
          ))}
          <Button as={RouterNavLink} to="/dashboard" variant="primary" ml={2}>
            Dashboard
          </Button>
        </HStack>

        {/* Boton del menu movil */}
        <IconButton
          aria-label="Abrir el menu de navegacion"
          icon={<HamburgerIcon boxSize={5} />}
          variant="outline"
          display={{ base: 'inline-flex', md: 'none' }}
          onClick={onOpen}
        />
      </Flex>

      {/* Menu movil */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader color="brand.800">AutoCare</DrawerHeader>
          <DrawerBody>
            <VStack as="nav" align="stretch" spacing={1}>
              {enlaces.map((enlace) => (
                <Link
                  key={enlace.ruta}
                  as={RouterNavLink}
                  to={enlace.ruta}
                  end={enlace.ruta === '/'}
                  onClick={onClose}
                  px={4}
                  py={2}
                  borderRadius="md"
                  fontWeight="medium"
                  color="secondary.700"
                  _hover={{ bg: 'secondary.100', textDecoration: 'none' }}
                  _activeLink={estiloActivo}
                >
                  {enlace.texto}
                </Link>
              ))}
              <Button
                as={RouterNavLink}
                to="/dashboard"
                variant="primary"
                mt={2}
                onClick={onClose}
              >
                Dashboard
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}

export default Header;
