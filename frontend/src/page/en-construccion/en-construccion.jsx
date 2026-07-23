import { Link as RouterLink } from 'react-router-dom';
import { Box, Heading, Text, Badge, Alert, AlertIcon, Link } from '@chakra-ui/react';
import Layout from '../../components/layout/index.jsx';

/**
 * Pagina temporal reutilizada por los modulos que aun no se desarrollan
 * (vehiculos, mantenimientos, historial y perfil).
 */
function EnConstruccion({ titulo, descripcion, parte = 'una proxima parte' }) {
  return (
    <Layout conSidebar>
      <Box
        p={8}
        bg="white"
        borderWidth="1px"
        borderColor="secondary.200"
        borderRadius="lg"
        boxShadow="sm"
      >
        <Badge colorScheme="warning" px={3} py={1} borderRadius="full" textTransform="uppercase">
          Contenido temporal
        </Badge>

        <Heading as="h1" size="xl" mt={4} mb={2}>
          {titulo}
        </Heading>
        <Text color="secondary.600" maxW="60ch" mb={4}>
          {descripcion}
        </Text>

        <Alert status="info" borderRadius="md" mb={4} fontSize="sm">
          <AlertIcon />
          Este modulo se desarrollara en {parte}. Por ahora la ruta existe solo para validar la
          navegacion de la aplicacion.
        </Alert>

        <Link as={RouterLink} to="/dashboard" color="brand.600" fontWeight="semibold">
          Volver al dashboard
        </Link>
      </Box>
    </Layout>
  );
}

export default EnConstruccion;
