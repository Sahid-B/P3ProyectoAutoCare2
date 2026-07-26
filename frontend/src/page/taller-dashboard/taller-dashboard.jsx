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

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <Card variant="outline" borderColor="secondary.200">
            <CardBody>
              <Stat>
                <StatLabel color="secondary.500" display="flex" alignItems="center">
                  <Icon as={FaStar} mr={2} color="yellow.400" />
                  Calificación Promedio
                </StatLabel>
                <StatNumber color="secondary.800">5.0</StatNumber>
                <StatHelpText>Basado en 0 reseñas</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card variant="outline" borderColor="secondary.200">
            <CardBody>
              <Stat>
                <StatLabel color="secondary.500" display="flex" alignItems="center">
                  <Icon as={FaEye} mr={2} color="blue.400" />
                  Vistas de Perfil
                </StatLabel>
                <StatNumber color="secondary.800">24</StatNumber>
                <StatHelpText>En los últimos 30 días</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card variant="outline" borderColor="secondary.200">
            <CardBody>
              <Stat>
                <StatLabel color="secondary.500" display="flex" alignItems="center">
                  <Icon as={FaUsers} mr={2} color="green.400" />
                  Clientes Potenciales
                </StatLabel>
                <StatNumber color="secondary.800">5</StatNumber>
                <StatHelpText>Contactos por correo</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card variant="outline" borderColor="secondary.200">
            <CardBody>
              <Stat>
                <StatLabel color="secondary.500" display="flex" alignItems="center">
                  <Icon as={FaCalendarCheck} mr={2} color="purple.400" />
                  Citas Agendadas
                </StatLabel>
                <StatNumber color="secondary.800">0</StatNumber>
                <StatHelpText>Próximamente disponible</StatHelpText>
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
