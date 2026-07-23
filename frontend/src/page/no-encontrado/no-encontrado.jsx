import { useNavigate } from 'react-router-dom';
import { Box, Heading, Text } from '@chakra-ui/react';
import Layout from '../../components/layout/index.jsx';
import Button from '../../components/button/index.jsx';

// Pagina mostrada cuando la ruta no existe.
function NoEncontrado() {
  const navegar = useNavigate();

  return (
    <Layout>
      <Box maxW="560px" mx="auto" px={6} py={{ base: 16, md: 24 }} textAlign="center">
        <Text fontSize="6xl" fontWeight="bold" lineHeight="1" color="brand.600">
          404
        </Text>
        <Heading as="h1" size="lg" color="secondary.900" mb={2}>
          Pagina no encontrada
        </Heading>
        <Text color="secondary.600" mb={8}>
          La pagina que buscas no existe o fue movida. Revisa la direccion o vuelve al inicio de
          AutoCare.
        </Text>

        <Button variant="primary" onClick={() => navegar('/')}>
          Regresar al inicio
        </Button>
      </Box>
    </Layout>
  );
}

export default NoEncontrado;
