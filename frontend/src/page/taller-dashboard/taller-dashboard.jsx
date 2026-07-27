import { useEffect, useState } from 'react';
import { Box, Heading, Text, SimpleGrid, Card, CardBody, Stat, StatLabel, StatNumber, StatHelpText, Icon, Spinner } from '@chakra-ui/react';
import { FaUsers, FaEye, FaCalendarCheck } from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import { useAuth } from '../../context/auth-context.jsx';
import { obtenerCitas } from '../../services/citas-service';

function TallerDashboard() {
  const { usuario } = useAuth();
  const [citasActivas, setCitasActivas] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarCitas() {
      try {
        const res = await obtenerCitas();
        const activas = (res.data || []).filter(
          (c) => c.estado === 'pendiente' || c.estado === 'aceptada'
        );
        setCitasActivas(activas.length);
      } catch (error) {
        console.error('Error al obtener citas en taller dashboard:', error);
      } finally {
        setCargando(false);
      }
    }

    cargarCitas();
  }, []);

  return (
    <Layout conSidebar>
      <Box p={6}>
        <Heading mb={2} color="secondary.800">
          Bienvenido, {usuario?.nombre}
        </Heading>
        <Text color="secondary.600" mb={8}>
          Este es el panel de control para tu taller mecánico.
        </Text>

        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={8}>
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
                  {cargando ? <Spinner size="sm" color="brand.500" /> : citasActivas}
                </StatNumber>
                <StatHelpText fontSize="xs" mb={0}>Citas activas registradas</StatHelpText>
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
