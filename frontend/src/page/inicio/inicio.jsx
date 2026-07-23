import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  SimpleGrid,
  Stack,
  HStack,
  Flex,
  Image,
  Heading,
  Text,
  Icon,
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import Layout from '../../components/layout/index.jsx';
import Button from '../../components/button/index.jsx';

const beneficios = [
  {
    icono: '🔧',
    titulo: 'Control de mantenimientos',
    texto: 'Registra cada servicio realizado y manten el estado real de tu vehiculo siempre visible.',
  },
  {
    icono: '⏰',
    titulo: 'Recordatorios',
    texto: 'Recibe avisos del proximo cambio de aceite, filtros, frenos, matricula o seguro.',
  },
  {
    icono: '🗂️',
    titulo: 'Historial organizado',
    texto: 'Consulta todo lo que se le ha hecho al vehiculo, ordenado por fecha y kilometraje.',
  },
  {
    icono: '📱',
    titulo: 'Acceso desde varios dispositivos',
    texto: 'Usa AutoCare desde el celular, la tablet o la computadora con la misma cuenta.',
  },
  {
    icono: '📶',
    titulo: 'Futura operacion sin conexion',
    texto: 'La aplicacion sera instalable y podra consultarse sin Internet en las siguientes partes.',
  },
];

const funcionalidades = [
  'Registro de vehiculos con marca, modelo, anio y kilometraje.',
  'Registro de mantenimientos realizados y su costo.',
  'Calculo del proximo servicio por fecha o kilometraje.',
  'Alertas de matricula, seguro y revision tecnica.',
  'Historial completo por vehiculo.',
  'Instalacion como aplicacion (PWA) y notificaciones.',
];

const mantenimientos = [
  'Cambio de aceite',
  'Cambio de filtros',
  'Revision de frenos',
  'Cambio de llantas',
  'Revision de bateria',
  'Matricula',
  'Seguro',
  'Revision tecnica',
];

// Landing page de AutoCare.
function Inicio() {
  const navegar = useNavigate();

  return (
    <Layout>
      {/* Hero */}
      <Box bgGradient="linear(160deg, brand.50 0%, secondary.50 65%)" py={{ base: 12, md: 20 }}>
        <Container maxW="1140px">
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={12} alignItems="center">
            <Box>
              <Image
                src="/logo-autocare.png"
                alt="Logo de AutoCare"
                boxSize="96px"
                borderRadius="lg"
                boxShadow="md"
                mb={4}
              />
              <Heading as="h1" size="2xl" color="brand.800" letterSpacing="-0.03em" mb={1}>
                AutoCare
              </Heading>
              <Text fontSize="xl" fontWeight="semibold" color="brand.600" mb={6}>
                Tu vehiculo siempre al dia
              </Text>

              <Text color="secondary.600" mb={4} maxW="60ch">
                Muchas personas olvidan mantenimientos importantes de su vehiculo: el cambio de
                aceite, los filtros, la revision de frenos, el cambio de llantas, la bateria, la
                matricula, el seguro o la revision tecnica. Ese descuido genera gastos mayores,
                averias inesperadas y multas que se podian evitar.
              </Text>
              <Text color="secondary.600" mb={6} maxW="60ch">
                AutoCare centraliza esa informacion en un solo lugar, calcula cuando toca el proximo
                servicio y te avisa a tiempo.
              </Text>

              <HStack spacing={4} flexWrap="wrap">
                <Button variant="primary" onClick={() => navegar('/login')}>
                  Iniciar sesion
                </Button>
                <Button variant="outline" onClick={() => navegar('/registro')}>
                  Crear cuenta
                </Button>
              </HStack>
            </Box>

            <Box
              p={8}
              bg="white"
              borderWidth="1px"
              borderColor="secondary.200"
              borderRadius="lg"
              boxShadow="lg"
            >
              <Text fontWeight="semibold" color="secondary.900" mb={4}>
                Mantenimientos que controla AutoCare
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                {mantenimientos.map((item) => (
                  <Box
                    key={item}
                    px={4}
                    py={2}
                    bg="secondary.50"
                    borderWidth="1px"
                    borderColor="secondary.200"
                    borderRadius="md"
                    fontSize="sm"
                    color="secondary.700"
                  >
                    {item}
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Beneficios */}
      <Box py={{ base: 12, md: 16 }}>
        <Container maxW="1140px">
          <Heading as="h2" size="xl" color="secondary.900" mb={2}>
            Beneficios
          </Heading>
          <Text color="secondary.600" mb={8} maxW="65ch">
            Lo que ganas al llevar el mantenimiento de tu vehiculo con AutoCare.
          </Text>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {beneficios.map((beneficio) => (
              <Box
                key={beneficio.titulo}
                p={6}
                bg="white"
                borderWidth="1px"
                borderColor="secondary.200"
                borderRadius="lg"
                boxShadow="sm"
                transition="all 0.2s"
                _hover={{ transform: 'translateY(-3px)', boxShadow: 'md' }}
              >
                <Flex
                  align="center"
                  justify="center"
                  boxSize="48px"
                  mb={4}
                  bg="brand.50"
                  borderRadius="md"
                  fontSize="xl"
                >
                  <Box as="span" aria-hidden="true">
                    {beneficio.icono}
                  </Box>
                </Flex>
                <Heading as="h3" size="md" mb={2}>
                  {beneficio.titulo}
                </Heading>
                <Text fontSize="sm" color="secondary.600" m={0}>
                  {beneficio.texto}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Funcionalidades */}
      <Box
        py={{ base: 12, md: 16 }}
        bg="white"
        borderTopWidth="1px"
        borderBottomWidth="1px"
        borderColor="secondary.200"
      >
        <Container maxW="1140px">
          <Heading as="h2" size="xl" color="secondary.900" mb={2}>
            Funcionalidades
          </Heading>
          <Text color="secondary.600" mb={8} maxW="65ch">
            Alcance previsto del proyecto. Se construye por partes durante la asignatura.
          </Text>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {funcionalidades.map((funcionalidad) => (
              <Flex
                key={funcionalidad}
                align="flex-start"
                gap={2}
                px={4}
                py={3}
                bg="secondary.50"
                borderWidth="1px"
                borderColor="secondary.200"
                borderRadius="md"
                fontSize="sm"
                color="secondary.700"
              >
                <Icon as={CheckCircleIcon} color="brand.500" mt={1} flexShrink={0} />
                <Text m={0}>{funcionalidad}</Text>
              </Flex>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Llamado a la accion */}
      <Box py={{ base: 12, md: 16 }}>
        <Container maxW="1140px" textAlign="center">
          <Heading as="h2" size="xl" mb={2}>
            Empieza a cuidar tu vehiculo hoy
          </Heading>
          <Text color="secondary.600" mb={6} mx="auto" maxW="55ch">
            Crea tu cuenta y registra tu primer vehiculo en pocos pasos.
          </Text>
          <HStack spacing={4} justify="center" flexWrap="wrap">
            <Button variant="primary" onClick={() => navegar('/registro')}>
              Crear cuenta
            </Button>
            <Button variant="secondary" onClick={() => navegar('/dashboard')}>
              Ver dashboard de ejemplo
            </Button>
          </HStack>
        </Container>
      </Box>
    </Layout>
  );
}

export default Inicio;
