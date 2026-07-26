import { Box, Heading, Text, Flex, Icon, Button } from '@chakra-ui/react';
import { FaWrench } from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import { useNavigate } from 'react-router-dom';

function SolicitudesTaller() {
  const navigate = useNavigate();

  return (
    <Layout conSidebar>
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        h="calc(100vh - 120px)" 
        p={6}
        textAlign="center"
      >
        <Icon as={FaWrench} boxSize={24} color="brand.500" mb={6} opacity={0.8} />
        
        <Heading size="xl" color="secondary.800" mb={4}>
          Gestión de Citas
        </Heading>
        
        <Heading size="md" color="secondary.500" mb={6}>
          ¡Próximamente!
        </Heading>
        
        <Text color="secondary.600" maxW="md" mb={8} fontSize="lg">
          Estamos construyendo un sistema completo para que los clientes puedan agendar citas de mantenimiento directamente en tu taller. Pronto podrás gestionar todas tus solicitudes desde aquí.
        </Text>
        
        <Button 
          variant="primary" 
          size="lg"
          onClick={() => navigate('/taller-dashboard')}
        >
          Volver al Dashboard
        </Button>
      </Flex>
    </Layout>
  );
}

export default SolicitudesTaller;
