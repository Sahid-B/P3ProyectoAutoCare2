import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
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
  Badge,
  Icon,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { FaUser, FaRightFromBracket } from 'react-icons/fa6';
import { useAuth } from '../../context/auth-context.jsx';

const estiloActivo = {
  color: 'brand.600',
  bg: 'brand.50',
};

// Encabezado principal: Logo en el extremo izquierdo, navegacion + saludo + botones agrupados en el extremo derecho.
function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleCerrarSesion = async () => {
    await logout();
    onClose();
    navigate('/login');
  };

  const enlaces = [
    { ruta: '/', texto: 'Inicio' },
    ...(!usuario
      ? [
          { ruta: '/login', texto: 'Login' },
          { ruta: '/registro', texto: 'Registro' },
        ]
      : []),
  ];

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
      w="100%"
    >
      <Flex
        w="100%"
        minH="68px"
        px={{ base: 4, md: 8 }}
        align="center"
        justify="space-between"
        gap={4}
      >
        {/* Extremo Izquierdo: Logo + Nombre AutoCare */}
        <Link
          as={RouterNavLink}
          to="/"
          onClick={onClose}
          display="flex"
          alignItems="center"
          gap={2.5}
          _hover={{ textDecoration: 'none' }}
        >
          <Image src="/logo-autocare.png" alt="Logo de AutoCare" boxSize="40px" borderRadius="sm" />
          <Text fontSize="xl" fontWeight="bold" color="brand.800" letterSpacing="-0.02em">
            AutoCare
          </Text>
        </Link>

        {/* Extremo Derecho: Inicio + Saludo "Hola Xxxxxx" + Dashboard + Salir */}
        <HStack as="nav" spacing={3} display={{ base: 'none', md: 'flex' }} align="center">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.ruta}
              as={RouterNavLink}
              to={enlace.ruta}
              end={enlace.ruta === '/'}
              px={3}
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

          {usuario && (
            <Badge
              as={RouterNavLink}
              to="/perfil"
              colorScheme="brand"
              px={3}
              py={1.5}
              borderRadius="full"
              fontSize="sm"
              fontWeight="semibold"
              textTransform="none"
              display="flex"
              alignItems="center"
              gap={1.5}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ bg: 'brand.100', textDecoration: 'none', transform: 'scale(1.03)' }}
            >
              <Icon as={FaUser} boxSize={3.5} />
              Hola, {usuario.nombre}!
            </Badge>
          )}


          <Button as={RouterNavLink} to="/dashboard" variant="primary" size="sm">
            Dashboard
          </Button>

          {usuario && (
            <Button
              variant="outline"
              colorScheme="red"
              size="sm"
              leftIcon={<FaRightFromBracket />}
              onClick={handleCerrarSesion}
            >
              Salir
            </Button>
          )}
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
          <DrawerHeader color="brand.800">
            {usuario ? `Hola, ${usuario.nombre}!` : 'AutoCare'}
          </DrawerHeader>
          <DrawerBody>
            <VStack as="nav" align="stretch" spacing={2}>
              {usuario && (
                <Badge
                  colorScheme="brand"
                  p={2}
                  borderRadius="md"
                  fontSize="sm"
                  mb={2}
                  textAlign="center"
                >
                  Hola, {usuario.nombre} {usuario.apellido}!
                </Badge>
              )}

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

              {usuario && (
                <Button
                  colorScheme="red"
                  variant="outline"
                  mt={2}
                  leftIcon={<FaRightFromBracket />}
                  onClick={handleCerrarSesion}
                >
                  Cerrar sesion
                </Button>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}

export default Header;
