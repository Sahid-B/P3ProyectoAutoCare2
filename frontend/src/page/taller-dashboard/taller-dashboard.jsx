import { Box, Heading, Text, SimpleGrid, Card, CardBody, Stat, StatLabel, StatNumber, StatHelpText, Icon } from '@chakra-ui/react';
import { FaUsers, FaStar, FaEye, FaCalendarCheck } from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import { useAuth } from '../../context/auth-context.jsx';

function TallerDashboard() {
  const { usuario } = useAuth();

  return (
    <Layout conSidebar>
      <Box p={6}>
        <Heading mb={2} color="secondary.800">
          Bienvenido, {usuario?.nombre}
        </Heading>
        <Text color="secondary.600" mb={8}>
          Este es el panel de control para tu taller mecánico.
        </Text>

        <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4} mb={8}>
          <Card variant="outline" borderColor="secondary.200">
            <CardBody p={4}>
              <Stat>
                <StatLabel 
                  color="secondary.500" 
                  display="flex" 
                  alignItems="center"
                  whiteSpace="normal"
                  lineHeight="shorter"
                  mb={1}
                >
                  <Icon as={FaStar} mr={2} color="yellow.400" flexShrink={0} />
                  Calificación Promedio
                </StatLabel>
                <StatNumber color="secondary.800" fontSize={['xl', '2xl']} whiteSpace="nowrap">
                  5.0
                </StatNumber>
                <StatHelpText fontSize="xs" mb={0}>Basado en 0 reseñas</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card variant="outline" borderColor="secondary.200">
            <CardBody p={4}>
              <Stat>
                <StatLabel 
                  color="secondary.500" 
                  display="flex" 
                  alignItems="center"
                  whiteSpace="normal"
                  lineHeight="shorter"
                  mb={1}
                >
                  <Icon as={FaEye} mr={2} color="blue.400" flexShrink={0} />
                  Vistas de Perfil
                </StatLabel>
                <StatNumber color="secondary.800" fontSize={['xl', '2xl']} whiteSpace="nowrap">
                  24
                </StatNumber>
                <StatHelpText fontSize="xs" mb={0}>En los últimos 30 días</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card variant="outline" borderColor="secondary.200">
            <CardBody p={4}>
              <Stat>
                <StatLabel 
                  color="secondary.500" 
                  display="flex" 
                  alignItems="center"
                  whiteSpace="normal"
                  lineHeight="shorter"
                  mb={1}
                >
                  <Icon as={FaUsers} mr={2} color="green.400" flexShrink={0} />
                  Clientes Potenciales
                </StatLabel>
                <StatNumber color="secondary.800" fontSize={['xl', '2xl']} whiteSpace="nowrap">
                  5
                </StatNumber>
                <StatHelpText fontSize="xs" mb={0}>Contactos por correo</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card variant="outline" borderColor="secondary.200">
            <CardBody p={4}>
              <Stat>
                <StatLabel 
                  color="secondary.500" 
                  display="flex" 
                  alignItems="center"
                  whiteSpace="normal"
                  lineHeight="shorter"
                  mb={1}
                >
                  <Icon as={FaCalendarCheck} mr={2} color="purple.400" flexShrink={0} />
                  Citas Agendadas
                </StatLabel>
                <StatNumber color="secondary.800" fontSize={['xl', '2xl']} whiteSpace="nowrap">
                  0
                </StatNumber>
                <StatHelpText fontSize="xs" mb={0}>Próximamente disponible</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Box bg="white" p={6} borderRadius="lg" borderWidth="1px" borderColor="secondary.200" boxShadow="sm">
          <Heading size="md" mb={4} color="secondary.800">Novedades AutoCare para Talleres</Heading>
          <Text color="secondary.600" mb={4}>
            Estamos trabajando en nuevas funciones para que puedas gestionar tus citas y recibir reseñas directamente desde nuestra plataforma. ¡Mantente atento a las próximas actualizaciones!
          </Text>
        </Box>
      </Box>
    </Layout>
  );
}

export default TallerDashboard;
