import { Navigate } from 'react-router-dom';
import { Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import { useAuth } from '../../context/auth-context.jsx';

/**
 * Componente para proteger rutas privadas.
 * Si la sesion esta cargando, muestra un indicador.
 * Si el usuario no esta autenticado, redirige a /login.
 */
function ProtectedRoute({ children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg="secondary.50">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text fontSize="md" color="secondary.600">
            Verificando sesion...
          </Text>
        </VStack>
      </Flex>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
