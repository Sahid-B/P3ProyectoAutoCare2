import { NavLink as RouterNavLink } from 'react-router-dom';
import {
  Box,
  Container,
  SimpleGrid,
  Stack,
  HStack,
  VStack,
  Text,
  Image,
  Link,
  Badge,
  Divider,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { FaCar, FaWrench, FaClockRotateLeft, FaShieldHalved, FaWifi } from 'react-icons/fa6';

// Pie de pagina premium para AutoCare.
function Footer() {
  const anioActual = new Date().getFullYear();

  return (
    <Box
      as="footer"
      mt="auto"
      bgGradient="linear(to-b, secondary.900 0%, #0a0e1a 100%)"
      color="secondary.200"
      borderTop="1px solid"
      borderColor="secondary.800"
    >
      <Container maxW="100%" py={{ base: 10, md: 14 }} px={{ base: 6, md: 8 }}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={8} mb={10}>
          {/* Columna 1: Marca e Identidad */}
          <Stack spacing={4}>
            <HStack spacing={3} align="center">
              <Image src="/logo-autocare.png" alt="Logo AutoCare" boxSize="36px" borderRadius="md" />
              <Text fontSize="xl" fontWeight="bold" color="white" letterSpacing="-0.02em">
                AutoCare
              </Text>
            </HStack>
            <Text fontSize="sm" color="secondary.400" lineHeight="short">
              La plataforma integral para gestionar mantenimientos, alertas y el historial completo de tus vehículos en vivo y offline.
            </Text>
            <HStack spacing={2} pt={1}>
              <Badge colorScheme="brand" variant="solid" borderRadius="full" px={2.5} py={0.5} fontSize="xs">
                PWA Active
              </Badge>
              <Badge colorScheme="green" variant="subtle" borderRadius="full" px={2.5} py={0.5} fontSize="xs">
                v1.3.0
              </Badge>
            </HStack>
          </Stack>

          {/* Columna 2: Navegación Rápida */}
          <Stack spacing={3}>
            <Text fontSize="sm" fontWeight="bold" color="white" textTransform="uppercase" letterSpacing="0.05em">
              Navegación
            </Text>
            <VStack align="flex-start" spacing={2} fontSize="sm">
              <Link as={RouterNavLink} to="/" color="secondary.300" _hover={{ color: 'brand.400', textDecoration: 'none' }}>
                Inicio
              </Link>
              <Link as={RouterNavLink} to="/dashboard" color="secondary.300" _hover={{ color: 'brand.400', textDecoration: 'none' }}>
                Dashboard
              </Link>
              <Link as={RouterNavLink} to="/vehiculos" color="secondary.300" _hover={{ color: 'brand.400', textDecoration: 'none' }}>
                Mis Vehículos
              </Link>
              <Link as={RouterNavLink} to="/mantenimientos" color="secondary.300" _hover={{ color: 'brand.400', textDecoration: 'none' }}>
                Mantenimientos
              </Link>
              <Link as={RouterNavLink} to="/historial" color="secondary.300" _hover={{ color: 'brand.400', textDecoration: 'none' }}>
                Historial
              </Link>
            </VStack>
          </Stack>

          {/* Columna 3: Modulos y Funciones */}
          <Stack spacing={3}>
            <Text fontSize="sm" fontWeight="bold" color="white" textTransform="uppercase" letterSpacing="0.05em">
              Características
            </Text>
            <VStack align="flex-start" spacing={2.5} fontSize="sm" color="secondary.400">
              <HStack spacing={2}>
                <Icon as={FaCar} color="brand.400" />
                <Text>Gestión de Flotas</Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FaWrench} color="brand.400" />
                <Text>Reglas de Mantenimiento</Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FaClockRotateLeft} color="brand.400" />
                <Text>Historial Reciente</Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FaWifi} color="brand.400" />
                <Text>Sincronización Offline</Text>
              </HStack>
            </VStack>
          </Stack>
        </SimpleGrid>

        <Divider borderColor="secondary.800" mb={6} />

        <Flex
          direction={{ base: 'column', sm: 'row' }}
          align="center"
          justify="space-between"
          gap={4}
          fontSize="xs"
          color="secondary.500"
        >
          <Text>&copy; {anioActual} AutoCare. Todos los derechos reservados.</Text>
          <HStack spacing={4}>
            <Text>Términos de servicio</Text>
            <Text>&bull;</Text>
            <Text>Privacidad</Text>
            <Text>&bull;</Text>
            <Text>Soporte</Text>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}

export default Footer;
